#!/usr/bin/env python3
"""한국소비자원 "참가격" 생필품 가격정보 Open API에서 시세를 내려받아
price-insight.html이 가져올 수 있는 JSON으로 변환하는 스크립트.

공식 활용가이드(OpenAPI활용가이드_한국소비자원_생필품가격정보_v1.8) 기준으로 작성함.

준비물
------
1. https://www.data.go.kr 에서 "한국소비자원_생필품 가격 정보"(서비스ID: SC-OA-09-01)
   데이터셋 페이지에서 활용신청 → 서비스키(인증키) 발급.
   (주의) 계정에 여러 API가 승인되어 있으면 화면에 같은 "일반 인증키"가 보일 수 있는데,
   이 API 자체에 대해 활용신청을 완료하지 않으면 "Invalid Authentication key"
   (resultCode 90) 오류가 남. 신청 직후에는 승인 동기화에 다소 시간이 걸릴 수 있음.
2. 이 API는 XML만 지원함(JSON 미지원).

주의(중요)
----------
이 API는 라면·두부·만두·계란 과자류 등 "포장 가공식품/생활용품" 위주의 데이터임.
양파·대파 같은 신선 채소는 다루지 않음 (그건 KAMIS 쪽으로).

사용 예시
---------
    export PRICEGOKR_SERVICE_KEY="발급받은키(디코딩 안 된 원본 그대로)"
    python3 scripts/fetch_price_go_kr.py --keyword 두부 --keyword 만두 --out data/pricegokr_latest.json
"""

import argparse
import datetime
import os
import sys
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common  # noqa: E402

BASE_URL = "http://openapi.price.go.kr/openApiImpl/ProductPriceInfoService"


def call_api(operation, service_key, **params):
    query = {"ServiceKey": service_key}
    query.update({k: v for k, v in params.items() if v is not None})
    url = BASE_URL + "/" + operation + ".do?" + urllib.parse.urlencode(query)
    with urllib.request.urlopen(url, timeout=20) as resp:
        raw = resp.read().decode("utf-8", errors="replace")
    root = ET.fromstring(raw)
    result_code = (root.findtext("resultCode") or "").strip()
    result_msg = (root.findtext("resultMsg") or "").strip()
    if result_code not in ("00", ""):
        print("경고: {} 응답 코드 {} - {}".format(operation, result_code, result_msg), file=sys.stderr)
        return None, result_code
    return root, result_code


def get_all_products(service_key):
    root, code = call_api("getProductInfoSvc", service_key)
    if root is None:
        return []
    return [
        {
            "goodId": item.findtext("goodid") or item.findtext("goodId"),
            "goodName": item.findtext("goodname") or item.findtext("goodName"),
        }
        for item in root.iter("item")
    ]


def last_friday(today=None):
    """생필품 가격 조사는 격주 금요일(백화점/편의점) 또는 목요일(대형마트/슈퍼) 기준.
    보수적으로 가장 최근 금요일을 기본값으로 사용."""
    today = today or datetime.date.today()
    offset = (today.weekday() - 4) % 7  # 4 = Friday
    return today - datetime.timedelta(days=offset)


def get_prices_for_good(service_key, good_id, inspect_day):
    root, code = call_api(
        "getProductPriceInfoSvc", service_key,
        goodInspectDay=inspect_day.strftime("%Y%m%d"),
        goodId=good_id,
    )
    if root is None:
        return []
    return [
        {
            "goodId": item.findtext("goodid") or item.findtext("goodId"),
            "entpId": item.findtext("entpid") or item.findtext("entpId"),
            "goodPrice": item.findtext("goodprice") or item.findtext("goodPrice"),
            "goodInspectDay": item.findtext("goodinspectday") or item.findtext("goodInspectDay"),
        }
        for item in root.iter("item")
    ]


def get_store_name(service_key, entp_id, cache):
    if entp_id in cache:
        return cache[entp_id]
    root, code = call_api("getStoreInfoSvc", service_key, entpId=entp_id)
    name = entp_id
    if root is not None:
        for item in root.iter():
            tag = item.tag.lower()
            if tag.endswith("entpname"):
                name = item.text or entp_id
                break
    cache[entp_id] = name
    return name


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--keyword", action="append", default=[],
                         help="상품명에 포함될 키워드 (여러 번 지정 가능, 예: --keyword 두부 --keyword 만두)")
    parser.add_argument("--category", default="가공식품", help="price-insight.html에 기록할 카테고리 (기본: 가공식품)")
    parser.add_argument("--max-items", type=int, default=15, help="키워드당 최대 상품 수 (API 호출량 제한용)")
    parser.add_argument("--out", default="data/pricegokr_latest.json", help="출력 JSON 파일 경로")
    args = parser.parse_args()

    service_key = os.environ.get("PRICEGOKR_SERVICE_KEY")
    if not service_key:
        print("오류: 환경변수 PRICEGOKR_SERVICE_KEY를 설정해야 함.", file=sys.stderr)
        sys.exit(1)

    if not args.keyword:
        print("안내: --keyword를 지정하지 않아 전체 상품 목록만 조회함 (가격 조회는 생략).")

    products = get_all_products(service_key)
    print("전체 상품 {}건 확인".format(len(products)))

    matched = []
    for kw in args.keyword:
        hits = [p for p in products if p["goodName"] and kw in p["goodName"]][: args.max_items]
        print("  키워드 '{}' -> {}건 매칭".format(kw, len(hits)))
        matched.extend(hits)

    inspect_day = last_friday()
    store_cache = {}
    records = []
    for p in matched:
        rows = get_prices_for_good(service_key, p["goodId"], inspect_day)
        for row in rows:
            try:
                price_val = float(str(row["goodPrice"]).replace(",", ""))
            except (TypeError, ValueError):
                continue
            store_name = get_store_name(service_key, row["entpId"], store_cache)
            date_raw = row.get("goodInspectDay") or inspect_day.strftime("%Y%m%d")
            date_str = "{}-{}-{}".format(date_raw[0:4], date_raw[4:6], date_raw[6:8])
            records.append(common.normalize_record(
                name=p["goodName"],
                category=args.category,
                price=price_val,
                unit="개",
                date=date_str,
                source="참가격({})".format(store_name),
                memo="goodId={}".format(p["goodId"]),
            ))

    count = common.save_records(records, args.out)
    print("{}건 저장됨 -> {}".format(count, args.out))


if __name__ == "__main__":
    main()
