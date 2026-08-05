#!/usr/bin/env python3
"""KAMIS(농산물유통정보) Open API에서 카테고리(부류) 단위로 전체 품목 시세를
내려받아 price-insight.html이 가져올 수 있는 JSON으로 변환하는 스크립트.

사용 전 준비물
---------------
1. https://www.kamis.or.kr 에서 회원가입 후 "고객센터 > Open-API > Open-API 이용신청"에서
   신청서를 제출하면 심사 후 인증키(KAMIS_CERT_KEY)와 아이디(KAMIS_CERT_ID)가 발급됨.

두 가지 조회 방식을 함께 사용함
-------------------------------
1. 채소/과일/수산물(부류코드 200/400/600): "일별 부류별 도소매가격정보"
   (dailyPriceByCategoryList) API로 부류코드 하나만 지정하면 그 부류 전체 품목
   (약 180개)의 가격을 한 번에 받아옴. 오늘/1일전/1주일전/2주일전/1개월전/1년전/
   평년, 7개 시점 가격이 같이 오기 때문에 품목코드를 몰라도 바로 트렌드가 채워짐.
2. 축산물(소/돼지/닭/계란/우유): KAMIS 공식 코드표(첨부 "축산물 코드" 시트)에
   축산물은 부류코드 없이 품목코드(itemcode)+품종코드(kindcode)로 직접 조회해야
   한다고 명시되어 있어, periodProductList API로 LIVESTOCK_ITEMS 목록의 품목을
   하나씩 조회함 (아래 목록은 공식 코드표 기준으로 미리 채워둠).

사용 예시
---------
    export KAMIS_CERT_KEY="발급받은키"
    export KAMIS_CERT_ID="발급받은아이디"
    python3 scripts/fetch_kamis_prices.py --out data/kamis_latest.json
    # 채소/과일/수산물만: --categories 200,400,600 --skip-livestock
    # 축산물만: --categories "" 

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

CATEGORY_LABELS = {
    "100": "곡물",
    "200": "채소",
    "300": "채소",       # 특용작물(참깨/들깨 등)도 트래커 카테고리상 채소로 분류
    "400": "과일",
    "500": "축산물",
    "600": "수산물",
}

DEFAULT_CATEGORIES = ["200", "400", "600"]  # 채소류, 과일류, 수산물 (축산물은 별도 방식, 아래 참고)

# day1~day7 / dpr1~dpr7 이 각각 어떤 시점인지 (KAMIS 응답 순서 기준)
DAY_POINT_LABELS = ["당일", "1일전", "1주일전", "2주일전", "1개월전", "1년전", "평년"]

# 축산물은 부류코드가 아니라 품목코드+품종코드로 직접 조회해야 함(공식 코드표 "축산물 코드" 시트 기준).
# 필요 없는 품목은 지워도 되고, 코드표를 보고 자유롭게 추가해도 됨.
LIVESTOCK_ITEMS = [
    {"label": "돼지고기(삼겹살)", "unit": "kg", "itemcode": "4304", "kindcode": "27"},
    {"label": "돼지고기(목심)", "unit": "kg", "itemcode": "4304", "kindcode": "68"},
    {"label": "돼지고기(앞다리)", "unit": "kg", "itemcode": "4304", "kindcode": "25"},
    {"label": "돼지고기(갈비)", "unit": "kg", "itemcode": "4304", "kindcode": "28"},
    {"label": "소고기(안심)", "unit": "kg", "itemcode": "4301", "kindcode": "21"},
    {"label": "소고기(등심)", "unit": "kg", "itemcode": "4301", "kindcode": "22"},
    {"label": "소고기(갈비)", "unit": "kg", "itemcode": "4301", "kindcode": "50"},
    {"label": "닭고기(육계)", "unit": "kg", "itemcode": "9901", "kindcode": "99"},
    {"label": "계란(특란30구/일반란)", "unit": "30구", "itemcode": "9903", "kindcode": "23", "productrankcode": "71"},
    {"label": "우유(흰우유)", "unit": "L", "itemcode": "9908", "kindcode": "01"},
]


def _get(row, *keys):
    """KAMIS 응답의 키 표기(밑줄 유무 등)가 API마다 달라 여러 후보를 순서대로 시도."""
    for k in keys:
        if k in row and row[k] not in (None, "", []):
            v = row[k]
            return v.strip() if isinstance(v, str) else v
    return None


def fetch_daily_by_category(cert_key, cert_id, item_category_code, product_cls_code="01", regday=None):
    """dailyPriceByCategoryList API로 부류 전체 품목의 최근 시세(7개 비교시점 포함)를 조회."""
    params = {
        "action": "dailyPriceByCategoryList",
        "p_cert_key": cert_key,
        "p_cert_id": cert_id,
        "p_returntype": "json",
        "p_product_cls_code": product_cls_code,
        "p_item_category_code": item_category_code,
        "p_convert_kg_yn": "N",
    }
    if regday:
        params["p_regday"] = regday
    url = KAMIS_BASE_URL + "?" + urllib.parse.urlencode(params)
    with urllib.request.urlopen(url, timeout=20) as resp:
        raw = resp.read().decode("utf-8", errors="replace")
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        print("경고: JSON 파싱 실패, 응답 원문 일부:", raw[:300], file=sys.stderr)
        return None


def fetch_period_prices(cert_key, cert_id, start_day, end_day, item, product_cls_code="01"):
    """periodProductList API로 특정 품목(itemcode+kindcode)의 기간별 시세를 조회.
    축산물처럼 부류코드 없이 품목코드만으로 조회해야 하는 경우에 사용."""
    params = {
        "action": "periodProductList",
        "p_cert_key": cert_key,
        "p_cert_id": cert_id,
        "p_returntype": "json",
        "p_startday": start_day,
        "p_endday": end_day,
        "p_productclscode": product_cls_code,
        "p_convert_kg_yn": "N",
        "p_itemcode": item["itemcode"],
        "p_kindcode": item["kindcode"],
    }
    if item.get("productrankcode"):
        params["p_productrankcode"] = item["productrankcode"]
    url = KAMIS_BASE_URL + "?" + urllib.parse.urlencode(params)
    with urllib.request.urlopen(url, timeout=20) as resp:
        raw = resp.read().decode("utf-8", errors="replace")
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        print("경고: JSON 파싱 실패, 응답 원문 일부:", raw[:300], file=sys.stderr)
        return None


def to_tracker_records_from_item(rows, label, unit, category="축산물"):
    """periodProductList 응답 행을 price-insight.html 가져오기 형식으로 변환.
    (필드가 값이 없을 때 ""가 아니라 []로 오는 경우가 있어 방어적으로 처리)"""
    records = []
    for row in rows or []:
        price = _get(row, "price")
        if price in (None, "-", "0", 0):
            continue
        try:
            price_val = float(str(price).replace(",", ""))
        except ValueError:
            continue
        yyyy = _get(row, "yyyy")
        regday = _get(row, "regday")
        date_str = None
        if yyyy and regday and isinstance(regday, str) and "/" in regday:
            mm, dd = regday.split("/")
            date_str = "{}-{:0>2}-{:0>2}".format(yyyy, mm, dd)
        if not date_str:
            continue
        county = _get(row, "countyname") or ""
        records.append(common.normalize_record(
            name=label,
            category=category,
            price=price_val,
            unit=unit,
            date=date_str,
            source="KAMIS",
            memo=county,
        ))
    return records


def fetch_livestock_records(cert_key, cert_id, start_day, end_day, product_cls_code="01"):
    all_records = []
    for item in LIVESTOCK_ITEMS:
        result = fetch_period_prices(cert_key, cert_id, start_day, end_day, item, product_cls_code=product_cls_code)
        if not result:
            print("오류: KAMIS 응답을 받지 못함 (축산물={})".format(item["label"]), file=sys.stderr)
            continue
        data = result.get("data") or {}
        error_code = data.get("error_code")
        if error_code and error_code != "000":
            print("KAMIS 응답 오류코드: {} (축산물={})".format(error_code, item["label"]), file=sys.stderr)
            continue
        rows = data.get("item") or []
        records = to_tracker_records_from_item(rows, item["label"], item["unit"])
        print("  축산물 {} -> {}건".format(item["label"], len(records)))
        all_records.extend(records)
    return all_records


def parse_kamis_date(day_str):
    """KAMIS 날짜 표기(예: '08/04', '2026-08-04', '20260804')를 ISO(YYYY-MM-DD)로 변환.
    연도가 없는 MM/DD 형식은 오늘 기준으로 가장 가까운 과거 연도를 추정."""
    if not isinstance(day_str, str) or not day_str.strip():
        return None
    s = day_str.strip()
    today = datetime.date.today()
    try:
        if "-" in s and len(s) >= 8:
            return datetime.date.fromisoformat(s[:10]).isoformat()
        if len(s) == 8 and s.isdigit():
            return "{}-{}-{}".format(s[0:4], s[4:6], s[6:8])
        if "/" in s:
            mm, dd = s.split("/")
            year = today.year
            candidate = datetime.date(year, int(mm), int(dd))
            if candidate > today:
                candidate = datetime.date(year - 1, int(mm), int(dd))
            return candidate.isoformat()
    except (ValueError, IndexError):
        return None
    return None


def to_tracker_records_from_category(rows, category_label):
    """dailyPriceByCategoryList 응답 행(품목당 최대 7개 시점 가격 포함)을
    price-insight.html 가져오기 형식의 여러 레코드로 펼침."""
    records = []
    for row in rows or []:
        name = _get(row, "item_name", "itemname", "itemName")
        kind = _get(row, "kind_name", "kindname", "kindName") or ""
        unit = _get(row, "unit") or "kg"
        if not name:
            continue
        full_name = "{}({})".format(name, kind) if kind and kind != name else name
        for i in range(1, 8):
            day_val = _get(row, "day{}".format(i))
            price_val = _get(row, "dpr{}".format(i))
            if day_val is None or price_val in (None, "-", "0", 0):
                continue
            try:
                price_num = float(str(price_val).replace(",", ""))
            except ValueError:
                continue
            date_str = parse_kamis_date(str(day_val))
            if not date_str:
                continue
            records.append(common.normalize_record(
                name=full_name,
                category=category_label,
                price=price_num,
                unit=unit,
                date=date_str,
                source="KAMIS",
                memo=DAY_POINT_LABELS[i - 1] if i - 1 < len(DAY_POINT_LABELS) else "",
            ))
    return records


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument(
        "--categories", default=",".join(DEFAULT_CATEGORIES),
        help="콤마로 구분한 부류코드 (100=곡물,200=채소,300=특용작물,400=과일,500=축산물,600=수산물). "
             "기본값: {}".format(",".join(DEFAULT_CATEGORIES)),
    )
    parser.add_argument("--product-cls", choices=["01", "02"], default="01", help="01=소매, 02=도매 (기본 소매)")
    parser.add_argument("--skip-livestock", action="store_true", help="축산물(소/돼지/닭/계란/우유) 조회를 건너뜀")
    parser.add_argument("--livestock-days", type=int, default=30, help="축산물 조회 기간(일). 기본 30일")
    parser.add_argument("--out", default="data/kamis_latest.json", help="출력 JSON 파일 경로")
    args = parser.parse_args()

    cert_key = os.environ.get("KAMIS_CERT_KEY")
    cert_id = os.environ.get("KAMIS_CERT_ID")
    if not cert_key or not cert_id:
        print("오류: 환경변수 KAMIS_CERT_KEY, KAMIS_CERT_ID를 설정해야 함.", file=sys.stderr)
        sys.exit(1)

    categories = [c.strip() for c in args.categories.split(",") if c.strip()]
    all_records = []
    for cat_code in categories:
        label = CATEGORY_LABELS.get(cat_code, "기타")
        result = fetch_daily_by_category(cert_key, cert_id, cat_code, product_cls_code=args.product_cls)
        if not result:
            print("오류: KAMIS 응답을 받지 못함 (부류코드={})".format(cat_code), file=sys.stderr)
            continue

        data = result.get("data")
        if isinstance(data, dict):
            error_code = data.get("error_code")
            rows = data.get("item") or []
        else:
            # 일부 액션은 data가 아니라 최상위에 바로 item 배열을 줄 수 있어 방어적으로 처리
            error_code = None
            rows = result.get("item") or (data if isinstance(data, list) else [])

        if error_code and error_code != "000":
            print("KAMIS 응답 오류코드: {} (부류코드={})".format(error_code, cat_code), file=sys.stderr)
            continue

        records = to_tracker_records_from_category(rows, label)
        print("  부류 {}({}) -> 품목 {}개, 레코드 {}건".format(cat_code, label, len(rows), len(records)))
        all_records.extend(records)

    if not args.skip_livestock:
        end_day = datetime.date.today()
        start_day = end_day - datetime.timedelta(days=args.livestock_days)
        print("축산물(소/돼지/닭/계란/우유) 조회 중...")
        all_records.extend(fetch_livestock_records(
            cert_key, cert_id, start_day.isoformat(), end_day.isoformat(),
            product_cls_code=args.product_cls,
        ))

    count = common.save_records(all_records, args.out)
    print("{}건 저장됨 -> {}".format(count, args.out))


if __name__ == "__main__":
    main()
