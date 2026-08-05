#!/usr/bin/env python3
"""KAMIS(농산물유통정보) Open API에서 카테고리(부류) 단위로 전체 품목 시세를
내려받아 price-insight.html이 가져올 수 있는 JSON으로 변환하는 스크립트.

사용 전 준비물
---------------
1. https://www.kamis.or.kr 에서 회원가입 후 "고객센터 > Open-API > Open-API 이용신청"에서
   신청서를 제출하면 심사 후 인증키(KAMIS_CERT_KEY)와 아이디(KAMIS_CERT_ID)가 발급됨.

품목코드표 없이도 되는 이유
---------------------------
KAMIS의 "일별 부류별 도소매가격정보"(dailyPriceByCategoryList) API는 부류코드
(100=식량작물, 200=채소류, 300=특용작물, 400=과일류, 500=축산물, 600=수산물)
하나만 지정하면 그 부류에 속한 전체 품목(약 180개)의 가격을 한 번에 돌려줌.
게다가 오늘/1일전/1주일전/2주일전/1개월전/1년전/평년, 이렇게 7개 시점 가격을
같이 주기 때문에 품목별 코드를 몰라도 바로 트렌드 데이터를 채울 수 있음.

사용 예시
---------
    export KAMIS_CERT_KEY="발급받은키"
    export KAMIS_CERT_ID="발급받은아이디"
    python3 scripts/fetch_kamis_prices.py --out data/kamis_latest.json
    # 특정 부류만: --categories 200,400  (채소류, 과일류만)

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

DEFAULT_CATEGORIES = ["200", "400", "500", "600"]  # 채소류, 과일류, 축산물, 수산물

# day1~day7 / dpr1~dpr7 이 각각 어떤 시점인지 (KAMIS 응답 순서 기준)
DAY_POINT_LABELS = ["당일", "1일전", "1주일전", "2주일전", "1개월전", "1년전", "평년"]


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

    count = common.save_records(all_records, args.out)
    print("{}건 저장됨 -> {}".format(count, args.out))


if __name__ == "__main__":
    main()
