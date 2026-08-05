#!/usr/bin/env python3
"""KAMIS(농산물유통정보) Open API에서 품목별 최근 시세를 내려받아
price-insight.html의 "가져오기" 기능에서 바로 쓸 수 있는 JSON으로 변환하는 스크립트.

사용 전 준비물
---------------
1. https://www.kamis.or.kr 에서 회원가입 후 "고객센터 > Open-API > Open-API 이용신청"에서
   신청서를 제출하면 심사 후 인증키(KAMIS_CERT_KEY)와 아이디(KAMIS_CERT_ID)가 발급됨.
2. 같은 메뉴의 "농축수산물 품목 및 등급 코드표" 파일을 내려받아, 추적하려는 품목의
   품목코드(itemcode)/부류코드(itemcategorycode)/품종코드(kindcode)를 확인해서
   아래 ITEMS 목록을 채워 넣어야 함. (코드값은 문서마다 갱신될 수 있어 이 스크립트에는
   임의로 채워 넣지 않았으니 반드시 공식 코드표로 확인할 것.)

   중요(실측 확인): 품목코드를 하나도 안 넣으면 "전체 품목"이 오는 게 아니라 KAMIS가
   정한 기본 품목(예: 쌀) 1건만 내려옴. 여러 품목(양파, 대파 등)을 각각 받고 싶으면
   ITEMS 목록에 품목마다 코드를 채워 넣어야 함 — 그러면 품목 개수만큼 API를 반복 호출함.

사용 예시
---------
    export KAMIS_CERT_KEY="발급받은키"
    export KAMIS_CERT_ID="발급받은아이디"
    python3 scripts/fetch_kamis_prices.py --days 30 --out data/kamis_latest.json

출력된 JSON 파일은 price-insight.html의 "시세 입력 > 가져오기/내보내기" 카드에서
파일 선택으로 바로 불러올 수 있음.

중요: 실행 위치에 대한 안내
---------------------------
KAMIS는 해외/클라우드 IP를 웹방화벽(WAF)에서 차단하는 것으로 확인됨. 클라우드
서버(예: AWS 등 해외 리전)에서 실행하면 "Web firewall security policies" 에러로
막힐 수 있으니, 국내 IP 환경(본인 컴퓨터, 국내 호스팅 서버 등)에서 실행할 것.
"""

import argparse
import datetime
import json
import os
import sys
import urllib.parse
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common  # noqa: E402

KAMIS_BASE_URL = "https://www.kamis.or.kr/service/price/xml.do"

# 추적할 품목 목록. 카테고리/코드는 KAMIS 공식 코드표를 참고해서 직접 채워 넣을 것.
# itemcategorycode: 부류코드, itemcode: 품목코드, kindcode: 품종코드, productrankcode: 등급코드
# unit: 이 도구(price-insight.html)에 기록할 때 표시할 단위 라벨(참고용, API 응답 단위와 다를 수 있음)
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


def fetch_period_prices(cert_key, cert_id, start_day, end_day, product_cls_code="01", item=None):
    """periodProductList API로 기간별 도/소매가격 원자료를 조회.

    product_cls_code: '01'=소매, '02'=도매
    item: ITEMS 항목(dict) 하나. None이면 품목코드를 지정하지 않고 호출함.
          (실측 결과: 품목코드를 안 주면 "전체 품목"이 아니라 KAMIS 서버가 정한
          기본 품목 1개만 내려옴 — 예: 쌀. 여러 품목을 받으려면 반드시 item마다
          한 번씩 호출해야 함.)
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
    if item:
        for key in ("itemcategorycode", "itemcode", "kindcode", "productrankcode", "countrycode"):
            if item.get(key):
                params["p_" + key] = item[key]
    url = KAMIS_BASE_URL + "?" + urllib.parse.urlencode(params)
    with urllib.request.urlopen(url, timeout=20) as resp:
        raw = resp.read().decode("utf-8", errors="replace")
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        print("경고: JSON 파싱 실패, 응답 원문 일부:", raw[:300], file=sys.stderr)
        return None


def _s(value):
    """KAMIS는 값이 없는 필드를 ""가 아니라 빈 리스트([])로 내려주는 경우가 있어,
    문자열이 아닌 값은 빈 문자열로 취급하도록 방어적으로 변환."""
    return value.strip() if isinstance(value, str) else ""


def to_tracker_records(kamis_rows, category_hint=None, unit_hint=None, name_fallback=None):
    """KAMIS periodProductList 응답 행을 price-insight.html 가져오기 형식으로 변환."""
    records = []
    for row in kamis_rows or []:
        try:
            price = row.get("price")
            if not price or price in ("-", "0"):
                continue
            price_val = float(str(price).replace(",", ""))
        except (TypeError, ValueError):
            continue
        yyyy = _s(row.get("yyyy")) or str(row.get("yyyy") or "")
        regday = row.get("regday", "")  # 보통 'MM/DD' 형식으로 내려옴
        date_str = None
        if yyyy and regday and isinstance(regday, str) and "/" in regday:
            mm, dd = regday.split("/")
            date_str = "{}-{:0>2}-{:0>2}".format(yyyy, mm, dd)
        name = _s(row.get("itemname")) or _s(row.get("kindname")) or (name_fallback or "")
        if not name:
            # 이름을 전혀 알 수 없는 행(전국 평균/평년 등 집계행)은 트래커에 의미가 없어 건너뜀
            continue
        records.append(common.normalize_record(
            name=name,
            category=category_hint or "채소",
            price=price_val,
            unit=unit_hint or _s(row.get("unit")) or "kg",
            date=date_str,
            source="KAMIS",
            memo="{} / {}".format(_s(row.get("kindname")), _s(row.get("countyname"))).strip(" /"),
        ))
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

    end_day = datetime.date.today()
    start_day = end_day - datetime.timedelta(days=args.days)

    queries = ITEMS if ITEMS else [None]
    if not ITEMS:
        print(
            "안내: ITEMS 목록이 비어 있어 품목코드 없이 1회 호출함.\n"
            "(실측 결과: 품목코드를 지정하지 않으면 KAMIS가 기본값으로 특정 품목 1개만 돌려줌 —\n"
            "'전체 품목'이 오는 게 아님.) 여러 품목을 받으려면 스크립트 상단 ITEMS 목록에\n"
            "품목코드를 채워 넣을 것 (KAMIS 고객센터 > Open-API 이용안내의 코드표 참고)."
        )

    all_records = []
    for item in queries:
        result = fetch_period_prices(
            cert_key, cert_id,
            start_day.isoformat(), end_day.isoformat(),
            product_cls_code=args.product_cls,
            item=item,
        )
        if not result:
            print("오류: KAMIS 응답을 받지 못함 (item={})".format(item and item.get("label")), file=sys.stderr)
            continue

        # 실제 응답 구조: {"condition": [...요청 파라미터 그대로...], "data": {"error_code": "000", "item": [...]}}
        data = result.get("data") or {}
        error_code = data.get("error_code")
        if error_code and error_code != "000":
            print("KAMIS 응답 오류코드: {} (item={})".format(error_code, item and item.get("label")), file=sys.stderr)
            continue

        rows = data.get("item") or []
        records = to_tracker_records(
            rows,
            category_hint=item and item.get("category"),
            unit_hint=item and item.get("unit"),
            name_fallback=item and item.get("label"),
        )
        print("  {} -> {}건".format((item and item.get("label")) or "(품목코드 미지정)", len(records)))
        all_records.extend(records)

    count = common.save_records(all_records, args.out)
    print("{}건 저장됨 -> {}".format(count, args.out))


if __name__ == "__main__":
    main()
