#!/usr/bin/env python3
"""KAMIS(농산물유통정보) Open API에서 품목별 최근 시세를 내려받아
price-tracker.html의 "가져오기" 기능에서 바로 쓸 수 있는 JSON으로 변환하는 스크립트.

사용 전 준비물
---------------
1. https://www.kamis.or.kr 에서 회원가입 후 "고객센터 > Open-API > Open-API 이용신청"에서
   신청서를 제출하면 심사 후 인증키(KAMIS_CERT_KEY)와 아이디(KAMIS_CERT_ID)가 발급됨.
2. 같은 메뉴의 "농축수산물 품목 및 등급 코드표" 파일을 내려받아, 추적하려는 품목의
   품목코드(itemcode)/부류코드(itemcategorycode)/품종코드(kindcode)를 확인해서
   아래 ITEMS 목록을 채워 넣어야 함. (코드값은 문서마다 갱신될 수 있어 이 스크립트에는
   임의로 채워 넣지 않았으니 반드시 공식 코드표로 확인할 것.)

사용 예시
---------
    export KAMIS_CERT_KEY="발급받은키"
    export KAMIS_CERT_ID="발급받은아이디"
    python3 scripts/fetch_kamis_prices.py --days 30 --out data/kamis_latest.json

출력된 JSON 파일은 price-tracker.html의 "시세 입력 > 가져오기/내보내기" 카드에서
파일 선택으로 바로 불러올 수 있음.
"""

import argparse
import datetime
import json
import os
import sys
import urllib.parse
import urllib.request

KAMIS_BASE_URL = "https://www.kamis.or.kr/service/price/xml.do"

# 추적할 품목 목록. 카테고리/코드는 KAMIS 공식 코드표를 참고해서 직접 채워 넣을 것.
# itemcategorycode: 부류코드, itemcode: 품목코드, kindcode: 품종코드, productrankcode: 등급코드
# unit: 이 도구(price-tracker.html)에 기록할 때 표시할 단위 라벨(참고용, API 응답 단위와 다를 수 있음)
ITEMS = [
    # 예시 형태 (실제 코드값은 반드시 공식 코드표에서 확인 후 채워 넣기)
    # {
    #     "label": "양파",
    #     "category": "채소",
    #     "unit": "kg",
    #     "itemcategorycode": "200",
    #     "itemcode": "245",
    #     "kindcode": "00",
    #     "productrankcode": "04",
    # },
]


def fetch_period_prices(cert_key, cert_id, start_day, end_day, product_cls_code="01"):
    """periodProductList API로 기간별 도/소매가격 원자료를 조회.

    product_cls_code: '01'=소매, '02'=도매
    """
    params = {
        "action": "periodProductList",
        "p_cert_key": cert_key,
        "p_cert_id": cert_id,
        "p_returntype": "json",
        "p_startday": start_day,
        "p_endday": end_day,
        "p_productclscode": product_cls_code,
        "p_convert_kg_yn": "N",
    }
    url = KAMIS_BASE_URL + "?" + urllib.parse.urlencode(params)
    with urllib.request.urlopen(url, timeout=20) as resp:
        raw = resp.read().decode("utf-8", errors="replace")
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        print("경고: JSON 파싱 실패, 응답 원문 일부:", raw[:300], file=sys.stderr)
        return None


def to_tracker_records(kamis_rows, category_hint=None, unit_hint=None):
    """KAMIS periodProductList 응답 행을 price-tracker.html 가져오기 형식으로 변환."""
    records = []
    for row in kamis_rows or []:
        try:
            price = row.get("price")
            if not price or price in ("-", "0"):
                continue
            price_val = float(str(price).replace(",", ""))
        except (TypeError, ValueError):
            continue
        yyyy = row.get("yyyy", "")
        regday = row.get("regday", "")  # 보통 'MM/DD' 형식으로 내려옴
        date_str = None
        if yyyy and regday and "/" in regday:
            mm, dd = regday.split("/")
            date_str = "{}-{:0>2}-{:0>2}".format(yyyy, mm, dd)
        records.append({
            "name": row.get("itemname", "").strip() or row.get("kindname", "").strip(),
            "category": category_hint or "채소",
            "price": price_val,
            "unit": unit_hint or row.get("unit", "kg"),
            "date": date_str or datetime.date.today().isoformat(),
            "source": "KAMIS",
            "memo": "{} / {}".format(row.get("kindname", ""), row.get("countyname", "")).strip(" /"),
        })
    return records


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--days", type=int, default=30, help="오늘 기준 며칠 전부터 조회할지 (기본 30일)")
    parser.add_argument("--out", default="data/kamis_latest.json", help="출력 JSON 파일 경로")
    parser.add_argument("--product-cls", choices=["01", "02"], default="01", help="01=소매, 02=도매 (기본 소매)")
    args = parser.parse_args()

    cert_key = os.environ.get("KAMIS_CERT_KEY")
    cert_id = os.environ.get("KAMIS_CERT_ID")
    if not cert_key or not cert_id:
        print("오류: 환경변수 KAMIS_CERT_KEY, KAMIS_CERT_ID를 설정해야 함.", file=sys.stderr)
        print("발급 방법은 이 스크립트 상단 docstring 또는 data/sources.json 참고.", file=sys.stderr)
        sys.exit(1)

    if not ITEMS:
        print(
            "안내: ITEMS 목록이 비어 있어 개별 품목 코드 기반 조회를 건너뜀.\n"
            "대신 periodProductList API로 최근 {}일간 전체 품목 원자료를 조회함.\n"
            "특정 품목만 추적하려면 스크립트 상단 ITEMS 목록에 품목코드를 채워 넣고,\n"
            "fetch_period_prices 호출 시 p_itemcategorycode/p_itemcode 파라미터를 추가하는 방식으로 확장할 것.".format(args.days)
        )

    end_day = datetime.date.today()
    start_day = end_day - datetime.timedelta(days=args.days)

    result = fetch_period_prices(
        cert_key, cert_id,
        start_day.isoformat(), end_day.isoformat(),
        product_cls_code=args.product_cls,
    )

    if not result:
        print("오류: KAMIS 응답을 받지 못함", file=sys.stderr)
        sys.exit(2)

    condition = result.get("condition")
    if isinstance(condition, list) and condition and condition[0].get("code") not in (None, "000"):
        print("KAMIS 응답 코드:", condition[0], file=sys.stderr)

    rows = result.get("price") or []
    records = to_tracker_records(rows)

    os.makedirs(os.path.dirname(args.out) or ".", exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)

    print("{}건 저장됨 -> {}".format(len(records), args.out))


if __name__ == "__main__":
    main()
