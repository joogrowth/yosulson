#!/usr/bin/env python3
"""KAMIS(농산물유통정보) Open API에서 품목별 최근 시세를 내려받아
price-insight.html이 가져올 수 있는 JSON으로 변환하는 스크립트.

방식
----
공식 코드표(첨부 xlsx, "코드통합"/"축산물 코드" 시트) 기준으로 미리 채워둔
ITEMS 목록의 품목마다 periodProductList API를 한 번씩 호출함.

(참고: "부류코드 하나로 전체 품목을 한 번에 받는" dailyPriceByCategoryList API도
시도해봤으나 실제 호출 시 품목코드를 지정 안 하면 특정 기본 품목 1개만 돌아오는
것으로 확인되어, 신뢰도 높은 품목별 명시 조회 방식으로 되돌림.)

사용 전 준비물
---------------
https://www.kamis.or.kr 에서 회원가입 후 "고객센터 > Open-API > Open-API 이용신청"에서
신청서를 제출하면 심사 후 인증키(KAMIS_CERT_KEY)와 아이디(KAMIS_CERT_ID)가 발급됨.

품목을 추가/변경하고 싶으면
---------------------------
아래 ITEMS 목록에 항목을 추가하면 됨. 정확한 코드는 KAMIS 고객센터 > Open-API >
Open-API 이용안내 하단 첨부파일 "농축수산물 품목 및 등급 코드표"(같은 파일이
data/reference/kamis_품목_등급_코드표.xlsx 에도 저장되어 있음)에서 확인.
- 채소/과일/곡물: itemcategorycode + itemcode + kindcode 모두 필요
- 축산물(소/돼지/닭/계란/우유): itemcode + kindcode만 필요 (itemcategorycode 없음,
  코드표에 "축산물데이터는 축평원 데이터 사용, 부류코드 없이 조회"라고 명시됨)

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

# 소매가격 기준 지역코드(p_countrycode). 기본값은 고양(일산 포함 수도권 서북부).
# 다른 지역 기준으로 바꾸고 싶으면 --country-code 옵션으로 바꿀 수 있음.
# 주요 코드: 1101=서울, 3138=고양, 3112=성남, 3111=수원, 3145=용인, 2300=인천, 3113=의정부
DEFAULT_COUNTRY_CODE = "3138"  # 고양(일산)

# 공식 코드표("산물코드" 시트, 소매 기준) 전체에서 자동 추출한 곡물/채소/과일/수산물 86개 품목.
# 품목당 여러 품종이 있을 경우 가장 일반적인(수입/냉동/친환경이 아닌) 품종 1개를 대표로 선택함.
# 필요 없는 품목은 지워도 되고, data/reference/kamis_품목_등급_코드표.xlsx의 "산물코드" 시트를
# 보고 다른 품종/등급으로 바꿔도 됨.
PRODUCE_ITEMS = [
    {"label": "쌀", "category": "곡물", "unit": "20kg", "itemcategorycode": "100", "itemcode": "111", "kindcode": "01", "productrankcode": "04"},
    {"label": "찹쌀", "category": "곡물", "unit": "1kg", "itemcategorycode": "100", "itemcode": "112", "kindcode": "01", "productrankcode": "04"},
    {"label": "콩", "category": "곡물", "unit": "500g", "itemcategorycode": "100", "itemcode": "141", "kindcode": "01", "productrankcode": "04"},
    {"label": "팥", "category": "곡물", "unit": "500g", "itemcategorycode": "100", "itemcode": "142", "kindcode": "00", "productrankcode": "04"},
    {"label": "녹두", "category": "곡물", "unit": "500g", "itemcategorycode": "100", "itemcode": "143", "kindcode": "00", "productrankcode": "04"},
    {"label": "고구마", "category": "채소", "unit": "1kg", "itemcategorycode": "100", "itemcode": "151", "kindcode": "00", "productrankcode": "04"},
    {"label": "감자", "category": "채소", "unit": "1kg", "itemcategorycode": "100", "itemcode": "152", "kindcode": "00", "productrankcode": "04"},
    {"label": "배추", "category": "채소", "unit": "1포기", "itemcategorycode": "200", "itemcode": "211", "kindcode": "01", "productrankcode": "04"},
    {"label": "양배추", "category": "채소", "unit": "1포기", "itemcategorycode": "200", "itemcode": "212", "kindcode": "00", "productrankcode": "04"},
    {"label": "시금치", "category": "채소", "unit": "100g", "itemcategorycode": "200", "itemcode": "213", "kindcode": "00", "productrankcode": "04"},
    {"label": "상추", "category": "채소", "unit": "100g", "itemcategorycode": "200", "itemcode": "214", "kindcode": "01", "productrankcode": "04"},
    {"label": "얼갈이배추", "category": "채소", "unit": "1kg", "itemcategorycode": "200", "itemcode": "215", "kindcode": "00", "productrankcode": "04"},
    {"label": "갓", "category": "채소", "unit": "1kg", "itemcategorycode": "200", "itemcode": "216", "kindcode": "00", "productrankcode": "04"},
    {"label": "수박", "category": "채소", "unit": "1개", "itemcategorycode": "200", "itemcode": "221", "kindcode": "00", "productrankcode": "04"},
    {"label": "참외", "category": "채소", "unit": "10개", "itemcategorycode": "200", "itemcode": "222", "kindcode": "00", "productrankcode": "04"},
    {"label": "오이", "category": "채소", "unit": "10개", "itemcategorycode": "200", "itemcode": "223", "kindcode": "01", "productrankcode": "04"},
    {"label": "호박", "category": "채소", "unit": "1개", "itemcategorycode": "200", "itemcode": "224", "kindcode": "01", "productrankcode": "04"},
    {"label": "토마토", "category": "채소", "unit": "1kg", "itemcategorycode": "200", "itemcode": "225", "kindcode": "00", "productrankcode": "04"},
    {"label": "딸기", "category": "채소", "unit": "100g", "itemcategorycode": "200", "itemcode": "226", "kindcode": "00", "productrankcode": "04"},
    {"label": "무", "category": "채소", "unit": "1개", "itemcategorycode": "200", "itemcode": "231", "kindcode": "01", "productrankcode": "04"},
    {"label": "당근", "category": "채소", "unit": "1kg", "itemcategorycode": "200", "itemcode": "232", "kindcode": "00", "productrankcode": "04"},
    {"label": "열무", "category": "채소", "unit": "1kg", "itemcategorycode": "200", "itemcode": "233", "kindcode": "00", "productrankcode": "04"},
    {"label": "건고추", "category": "채소", "unit": "600g", "itemcategorycode": "200", "itemcode": "241", "kindcode": "00", "productrankcode": "04"},
    {"label": "풋고추", "category": "채소", "unit": "100g", "itemcategorycode": "200", "itemcode": "242", "kindcode": "00", "productrankcode": "04"},
    {"label": "붉은고추", "category": "채소", "unit": "100g", "itemcategorycode": "200", "itemcode": "243", "kindcode": "00", "productrankcode": "04"},
    {"label": "피마늘", "category": "채소", "unit": "1kg", "itemcategorycode": "200", "itemcode": "244", "kindcode": "08", "productrankcode": "04"},
    {"label": "양파", "category": "채소", "unit": "1kg", "itemcategorycode": "200", "itemcode": "245", "kindcode": "00", "productrankcode": "04"},
    {"label": "파", "category": "채소", "unit": "1kg", "itemcategorycode": "200", "itemcode": "246", "kindcode": "00", "productrankcode": "04"},
    {"label": "생강", "category": "채소", "unit": "1kg", "itemcategorycode": "200", "itemcode": "247", "kindcode": "00", "productrankcode": "04"},
    {"label": "고춧가루", "category": "채소", "unit": "1kg", "itemcategorycode": "200", "itemcode": "248", "kindcode": "00", "productrankcode": "04"},
    {"label": "가지", "category": "채소", "unit": "10개", "itemcategorycode": "200", "itemcode": "251", "kindcode": "00", "productrankcode": "04"},
    {"label": "미나리", "category": "채소", "unit": "100g", "itemcategorycode": "200", "itemcode": "252", "kindcode": "00", "productrankcode": "04"},
    {"label": "깻잎", "category": "채소", "unit": "100g", "itemcategorycode": "200", "itemcode": "253", "kindcode": "00", "productrankcode": "04"},
    {"label": "부추", "category": "채소", "unit": "1kg", "itemcategorycode": "200", "itemcode": "254", "kindcode": "00", "productrankcode": "04"},
    {"label": "피망", "category": "채소", "unit": "100g", "itemcategorycode": "200", "itemcode": "255", "kindcode": "00", "productrankcode": "04"},
    {"label": "파프리카", "category": "채소", "unit": "200g", "itemcategorycode": "200", "itemcode": "256", "kindcode": "00", "productrankcode": "04"},
    {"label": "멜론", "category": "채소", "unit": "1개", "itemcategorycode": "200", "itemcode": "257", "kindcode": "00", "productrankcode": "04"},
    {"label": "깐마늘(국산)", "category": "채소", "unit": "1kg", "itemcategorycode": "200", "itemcode": "258", "kindcode": "01", "productrankcode": "04"},
    {"label": "절임배추", "category": "채소", "unit": "20kg", "itemcategorycode": "200", "itemcode": "266", "kindcode": "01", "productrankcode": "04"},
    {"label": "알배기배추", "category": "채소", "unit": "1포기", "itemcategorycode": "200", "itemcode": "279", "kindcode": "00", "productrankcode": "04"},
    {"label": "브로콜리", "category": "채소", "unit": "1개", "itemcategorycode": "200", "itemcode": "280", "kindcode": "00", "productrankcode": "04"},
    {"label": "참깨", "category": "채소", "unit": "500g", "itemcategorycode": "300", "itemcode": "312", "kindcode": "01", "productrankcode": "04"},
    {"label": "땅콩", "category": "채소", "unit": "100g", "itemcategorycode": "300", "itemcode": "314", "kindcode": "01", "productrankcode": "04"},
    {"label": "느타리버섯", "category": "채소", "unit": "100g", "itemcategorycode": "300", "itemcode": "315", "kindcode": "00", "productrankcode": "04"},
    {"label": "팽이버섯", "category": "채소", "unit": "150g", "itemcategorycode": "300", "itemcode": "316", "kindcode": "00", "productrankcode": "04"},
    {"label": "새송이버섯", "category": "채소", "unit": "100g", "itemcategorycode": "300", "itemcode": "317", "kindcode": "00", "productrankcode": "04"},
    {"label": "호두", "category": "채소", "unit": "100g", "itemcategorycode": "300", "itemcode": "318", "kindcode": "00", "productrankcode": "05"},
    {"label": "아몬드", "category": "채소", "unit": "100g", "itemcategorycode": "300", "itemcode": "319", "kindcode": "00", "productrankcode": "05"},
    {"label": "방울토마토", "category": "채소", "unit": "1kg", "itemcategorycode": "200", "itemcode": "422", "kindcode": "01", "productrankcode": "04"},
    {"label": "사과", "category": "과일", "unit": "10개", "itemcategorycode": "400", "itemcode": "411", "kindcode": "01", "productrankcode": "04"},
    {"label": "배", "category": "과일", "unit": "10개", "itemcategorycode": "400", "itemcode": "412", "kindcode": "01", "productrankcode": "04"},
    {"label": "복숭아", "category": "과일", "unit": "10개", "itemcategorycode": "400", "itemcode": "413", "kindcode": "01", "productrankcode": "04"},
    {"label": "포도", "category": "과일", "unit": "1kg", "itemcategorycode": "400", "itemcode": "414", "kindcode": "01", "productrankcode": "24"},
    {"label": "감귤", "category": "과일", "unit": "10개", "itemcategorycode": "400", "itemcode": "415", "kindcode": "00", "productrankcode": "04"},
    {"label": "단감", "category": "과일", "unit": "10개", "itemcategorycode": "400", "itemcode": "416", "kindcode": "00", "productrankcode": "04"},
    {"label": "바나나", "category": "과일", "unit": "100g", "itemcategorycode": "400", "itemcode": "418", "kindcode": "02", "productrankcode": "04"},
    {"label": "참다래", "category": "과일", "unit": "10개", "itemcategorycode": "400", "itemcode": "419", "kindcode": "01", "productrankcode": "04"},
    {"label": "파인애플", "category": "과일", "unit": "1개", "itemcategorycode": "400", "itemcode": "420", "kindcode": "02", "productrankcode": "04"},
    {"label": "오렌지", "category": "과일", "unit": "10개", "itemcategorycode": "400", "itemcode": "421", "kindcode": "03", "productrankcode": "04"},
    {"label": "자몽", "category": "과일", "unit": "10개", "itemcategorycode": "400", "itemcode": "423", "kindcode": "00", "productrankcode": "04"},
    {"label": "레몬", "category": "과일", "unit": "10개", "itemcategorycode": "400", "itemcode": "424", "kindcode": "00", "productrankcode": "04"},
    {"label": "체리", "category": "과일", "unit": "100g", "itemcategorycode": "400", "itemcode": "425", "kindcode": "00", "productrankcode": "04"},
    {"label": "건포도", "category": "과일", "unit": "100g", "itemcategorycode": "400", "itemcode": "426", "kindcode": "00", "productrankcode": "05"},
    {"label": "건블루베리", "category": "과일", "unit": "100g", "itemcategorycode": "400", "itemcode": "427", "kindcode": "00", "productrankcode": "05"},
    {"label": "망고", "category": "과일", "unit": "1개", "itemcategorycode": "400", "itemcode": "428", "kindcode": "00", "productrankcode": "04"},
    {"label": "아보카도", "category": "과일", "unit": "1개", "itemcategorycode": "400", "itemcode": "430", "kindcode": "00", "productrankcode": "04"},
    {"label": "고등어", "category": "수산물", "unit": "1마리", "itemcategorycode": "600", "itemcode": "611", "kindcode": "01", "productrankcode": "05"},
    {"label": "꽁치", "category": "수산물", "unit": "5마리", "itemcategorycode": "600", "itemcode": "612", "kindcode": "01", "productrankcode": "05"},
    {"label": "갈치", "category": "수산물", "unit": "1마리", "itemcategorycode": "600", "itemcode": "613", "kindcode": "01", "productrankcode": "05"},
    {"label": "조기", "category": "수산물", "unit": "1마리", "itemcategorycode": "600", "itemcode": "614", "kindcode": "01", "productrankcode": "05"},
    {"label": "명태", "category": "수산물", "unit": "1마리", "itemcategorycode": "600", "itemcode": "615", "kindcode": "01", "productrankcode": "05"},
    {"label": "삼치", "category": "수산물", "unit": "1마리", "itemcategorycode": "600", "itemcode": "616", "kindcode": "02", "productrankcode": "21"},
    {"label": "물오징어", "category": "수산물", "unit": "1마리", "itemcategorycode": "600", "itemcode": "619", "kindcode": "01", "productrankcode": "05"},
    {"label": "마른멸치", "category": "수산물", "unit": "100g", "itemcategorycode": "600", "itemcode": "638", "kindcode": "00", "productrankcode": "27"},
    {"label": "김", "category": "수산물", "unit": "10장", "itemcategorycode": "600", "itemcode": "641", "kindcode": "00", "productrankcode": "05"},
    {"label": "마른미역", "category": "수산물", "unit": "100g", "itemcategorycode": "600", "itemcode": "642", "kindcode": "00", "productrankcode": "04"},
    {"label": "굴", "category": "수산물", "unit": "1kg", "itemcategorycode": "600", "itemcode": "644", "kindcode": "00", "productrankcode": "04"},
    {"label": "수입조기", "category": "수산물", "unit": "1마리", "itemcategorycode": "600", "itemcode": "649", "kindcode": "01", "productrankcode": "05"},
    {"label": "새우젓", "category": "수산물", "unit": "1kg", "itemcategorycode": "600", "itemcode": "650", "kindcode": "00", "productrankcode": "04"},
    {"label": "멸치액젓", "category": "수산물", "unit": "1kg", "itemcategorycode": "600", "itemcode": "651", "kindcode": "00", "productrankcode": "04"},
    {"label": "천일염", "category": "수산물", "unit": "5kg", "itemcategorycode": "600", "itemcode": "652", "kindcode": "00", "productrankcode": "04"},
    {"label": "전복", "category": "수산물", "unit": "5마리", "itemcategorycode": "600", "itemcode": "653", "kindcode": "00", "productrankcode": "05"},
    {"label": "새우", "category": "수산물", "unit": "10마리", "itemcategorycode": "600", "itemcode": "654", "kindcode": "01", "productrankcode": "05"},
    {"label": "홍합", "category": "수산물", "unit": "100g", "itemcategorycode": "600", "itemcode": "658", "kindcode": "01", "productrankcode": "04"},
    {"label": "가리비", "category": "수산물", "unit": "1kg", "itemcategorycode": "600", "itemcode": "659", "kindcode": "01", "productrankcode": "04"},
    {"label": "건다시마", "category": "수산물", "unit": "100g", "itemcategorycode": "600", "itemcode": "660", "kindcode": "01", "productrankcode": "04"},
]

# 축산물은 부류코드가 아니라 품목코드+품종코드로 직접 조회해야 함(공식 코드표 "축산물 코드" 시트 기준).
LIVESTOCK_ITEMS = [
    {"label": "돼지고기(삼겹살)", "category": "축산물", "unit": "kg", "itemcode": "4304", "kindcode": "27"},
    {"label": "돼지고기(목심)", "category": "축산물", "unit": "kg", "itemcode": "4304", "kindcode": "68"},
    {"label": "돼지고기(앞다리)", "category": "축산물", "unit": "kg", "itemcode": "4304", "kindcode": "25"},
    {"label": "돼지고기(갈비)", "category": "축산물", "unit": "kg", "itemcode": "4304", "kindcode": "28"},
    {"label": "소고기(안심)", "category": "축산물", "unit": "kg", "itemcode": "4301", "kindcode": "21"},
    {"label": "소고기(등심)", "category": "축산물", "unit": "kg", "itemcode": "4301", "kindcode": "22"},
    {"label": "소고기(갈비)", "category": "축산물", "unit": "kg", "itemcode": "4301", "kindcode": "50"},
    {"label": "닭고기(육계)", "category": "축산물", "unit": "kg", "itemcode": "9901", "kindcode": "99"},
    {"label": "계란(특란30구/일반란)", "category": "축산물", "unit": "30구", "itemcode": "9903", "kindcode": "23", "productrankcode": "71"},
    {"label": "우유(흰우유)", "category": "축산물", "unit": "L", "itemcode": "9908", "kindcode": "01"},
]

ITEMS = PRODUCE_ITEMS + LIVESTOCK_ITEMS


def _get(row, *keys):
    """KAMIS 응답의 키 표기(밑줄 유무 등)가 API마다 달라 여러 후보를 순서대로 시도.
    값이 없을 때 ""가 아니라 []로 오는 경우가 있어 방어적으로 처리."""
    for k in keys:
        if k in row and row[k] not in (None, "", []):
            v = row[k]
            return v.strip() if isinstance(v, str) else v
    return None


def fetch_period_prices(cert_key, cert_id, start_day, end_day, item, product_cls_code="01", country_code=None):
    """periodProductList API로 특정 품목(itemcode+kindcode)의 기간별 시세를 조회.

    country_code를 지정하면(예: 3138=고양) 그 지역 소매가격만 조회함. None이면
    지역 제한 없이 전국 데이터가 오는데, 이 경우 같은 날짜에도 지역별로 값이
    여러 개 내려와 to_tracker_records()가 평균을 내서 하루 1개로 정리함.
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
        "p_itemcode": item["itemcode"],
        "p_kindcode": item["kindcode"],
    }
    if item.get("itemcategorycode"):
        params["p_itemcategorycode"] = item["itemcategorycode"]
    if item.get("productrankcode"):
        params["p_productrankcode"] = item["productrankcode"]
    if country_code:
        params["p_countrycode"] = country_code
    url = KAMIS_BASE_URL + "?" + urllib.parse.urlencode(params)
    with urllib.request.urlopen(url, timeout=20) as resp:
        raw = resp.read().decode("utf-8", errors="replace")
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        print("경고: JSON 파싱 실패, 응답 원문 일부:", raw[:300], file=sys.stderr)
        return None


def to_tracker_records(rows, item):
    """periodProductList 응답 행을 price-insight.html 가져오기 형식으로 변환.

    KAMIS는 같은 날짜에도 지역(서울/부산/대구...)별로 가격을 따로 내려주기 때문에,
    그대로 저장하면 트렌드 차트가 지역별 가격이 뒤섞여 톱니 모양으로 보임.
    이를 막기 위해 날짜별로 지역 가격을 평균 내어 "하루에 한 개" 레코드만 만듦.
    """
    by_date = {}
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
        by_date.setdefault(date_str, []).append((price_val, county))

    records = []
    for date_str in sorted(by_date.keys()):
        entries = by_date[date_str]
        prices = [p for p, _ in entries]
        avg_price = sum(prices) / len(prices)
        counties = sorted({c for _, c in entries if c})
        if len(entries) == 1:
            memo = counties[0] if counties else ""
        else:
            memo = "평균({}건: {})".format(len(entries), ", ".join(counties)) if counties else "평균({}건)".format(len(entries))
        records.append(common.normalize_record(
            name=item["label"],
            category=item.get("category", "기타"),
            price=round(avg_price, 1),
            unit=item.get("unit", "kg"),
            date=date_str,
            source="KAMIS",
            memo=memo,
        ))
    return records


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--days", type=int, default=30, help="오늘 기준 며칠 전부터 조회할지 (기본 30일)")
    parser.add_argument("--product-cls", choices=["01", "02"], default="01", help="01=소매, 02=도매 (기본 소매)")
    parser.add_argument("--country-code", default=DEFAULT_COUNTRY_CODE,
                         help="지역코드 (기본: {} = 고양/일산). 빈 문자열('')이면 지역 제한 없이 전국 평균".format(DEFAULT_COUNTRY_CODE))
    parser.add_argument("--out", default="data/kamis_latest.json", help="출력 JSON 파일 경로")
    args = parser.parse_args()

    cert_key = os.environ.get("KAMIS_CERT_KEY")
    cert_id = os.environ.get("KAMIS_CERT_ID")
    if not cert_key or not cert_id:
        print("오류: 환경변수 KAMIS_CERT_KEY, KAMIS_CERT_ID를 설정해야 함.", file=sys.stderr)
        sys.exit(1)

    end_day = datetime.date.today()
    start_day = end_day - datetime.timedelta(days=args.days)

    all_records = []
    for item in ITEMS:
        result = fetch_period_prices(
            cert_key, cert_id,
            start_day.isoformat(), end_day.isoformat(),
            item, product_cls_code=args.product_cls,
            country_code=args.country_code or None,
        )
        if not result:
            print("오류: KAMIS 응답을 받지 못함 (품목={})".format(item["label"]), file=sys.stderr)
            continue

        # 실제 응답 구조: {"condition": [...요청 파라미터 그대로...], "data": {"error_code": "000", "item": [...]}}
        data = result.get("data")
        if not isinstance(data, dict):
            print("경고: 예상과 다른 응답 구조 (품목={}): {}".format(item["label"], str(result)[:200]), file=sys.stderr)
            continue
        error_code = data.get("error_code")
        if error_code and error_code != "000":
            print("KAMIS 응답 오류코드: {} (품목={})".format(error_code, item["label"]), file=sys.stderr)
            continue

        rows = data.get("item") or []
        records = to_tracker_records(rows, item)
        print("  {} -> {}건".format(item["label"], len(records)))
        all_records.extend(records)

    count = common.save_records(all_records, args.out)
    print("{}건 저장됨 -> {}".format(count, args.out))


if __name__ == "__main__":
    main()
