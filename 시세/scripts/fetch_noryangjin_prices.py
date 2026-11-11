#!/usr/bin/env python3
"""노량진수산시장 일별 경락시세를 내려받아 시세 JSON으로 변환.

노량진 홈페이지(오늘의 경락 / 어종별 경락)는 Open API가 없어서
공개 조회 화면을 날짜·어종별로 요청한 뒤 표를 읽는다. 당일 실제 낙찰
평균가를 쓰며, 출하기를 이월하지 않는다.

    cd ~/yosulson/시세
    python3 scripts/fetch_noryangjin_prices.py --days 45 --out data/noryangjin_latest.json
"""

import argparse
import datetime
import html as htmlmod
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIST_URL = "https://www.susansijang.co.kr/nsis/miw/ko/info/miw3130"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) YosulsonPriceTracker/1.0"

# 월간 보고 품목명으로 맞출 어종. 노량진 선택 목록의 value와 같음.
SPECIES = [
    {"query": "굴", "label": "굴", "category": "수산물"},
    {"query": "조기", "label": "조기", "category": "수산물"},
    {"query": "가리비", "label": "가리비", "category": "수산물"},
    {"query": "오징어", "label": "물오징어", "category": "수산물"},
    {"query": "전복", "label": "전복", "category": "수산물"},
    {"query": "홍합", "label": "홍합", "category": "수산물"},
    {"query": "새우", "label": "새우", "category": "수산물"},
    {"query": "갈치", "label": "갈치", "category": "수산물"},
    {"query": "고등어", "label": "고등어", "category": "수산물"},
]


def classify_item(item, default_label):
    """대하 경락은 쿠팡·네이버 냉동 구매와 달라 새우 평균에도, 대하 보고에도 넣지 않음."""
    name = str(item or "")
    if "대하" in name:
        return None
    return default_label


def _parse_number(text):
    if not text:
        return None
    cleaned = str(text).replace(",", "").replace(" ", "")
    try:
        return float(cleaned)
    except ValueError:
        return None


def _parse_rows(page_html):
    rows = []
    for tr in re.findall(r"<tr[^>]*>.*?</tr>", page_html, re.S | re.I):
        tds = [
            htmlmod.unescape(re.sub(r"<[^>]+>", "", cell)).strip()
            for cell in re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", tr, re.S | re.I)
        ]
        tds = [t for t in tds if t]
        if not tds or tds[0] in ("어종",) or "없습니다" in tds[0]:
            continue
        # 어종, 산지, 규격, 포장, 수량, 중량, 낙찰고가, 낙찰저가, 평균가
        if len(tds) < 9:
            continue
        rows.append({
            "item": tds[0],
            "origin": tds[1],
            "spec": tds[2],
            "pack": tds[3],
            "qty": _parse_number(tds[4]),
            "weight": _parse_number(tds[5]),
            "avg": _parse_number(tds[8]),
        })
    return rows


def _to_kg_price(row):
    """가능하면 kg당 원으로 환산. 포장이 kg이면 평균가 그대로, 아니면 상자 중량으로 나눔."""
    avg = row.get("avg")
    if not avg or avg <= 0:
        return None, None
    pack = (row.get("pack") or "").lower()
    weight = row.get("weight")
    if pack in ("kg", "킬로", "킬로그램"):
        return avg, "kg"
    if weight and 0.3 <= weight <= 40:
        return round(avg / weight, 1), "kg"
    return None, None


def fetch_day(opener, species, day):
    payload = urllib.parse.urlencode({
        "pageIndex": "1",
        "pageUnit": "100",
        "pageSize": "100",
        "kdfshNm": species["query"],
        "kdfshCode": species["query"],
        "searchStartDe": day.strftime("%Y%m%d"),
        "searchEndDe": day.strftime("%Y%m%d"),
    }).encode()
    req = urllib.request.Request(
        LIST_URL,
        data=payload,
        headers={"User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded"},
    )
    with opener.open(req, timeout=25) as resp:
        return _parse_rows(resp.read().decode("utf-8", "replace"))


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--days", type=int, default=45, help="오늘 기준 며칠 전부터 조회할지")
    parser.add_argument("--delay", type=float, default=0.35, help="요청 사이 대기(초)")
    parser.add_argument("--only", default="", help="쉼표로 조회어만 (예: 새우,바다가재)")
    parser.add_argument("--out", default=os.path.join(ROOT, "data", "noryangjin_latest.json"))
    args = parser.parse_args()

    species_list = SPECIES
    if args.only.strip():
        want = {s.strip() for s in args.only.split(",") if s.strip()}
        species_list = [s for s in SPECIES if s["query"] in want or s["label"] in want]
        if not species_list:
            print("경고: --only 에 맞는 어종 없음", file=sys.stderr)
            return 1

    end_day = datetime.date.today()
    start_day = end_day - datetime.timedelta(days=args.days)

    opener = urllib.request.build_opener()
    # 세션 쿠키
    opener.open(urllib.request.Request(LIST_URL, headers={"User-Agent": UA}), timeout=25)

    records = []
    day = start_day
    while day <= end_day:
        for species in species_list:
            try:
                rows = fetch_day(opener, species, day)
            except Exception as exc:
                print("경고: {} {} 조회 실패 - {}".format(day.isoformat(), species["label"], exc), file=sys.stderr)
                time.sleep(args.delay)
                continue
            grouped = defaultdict(lambda: {"prices": [], "memos": []})
            for row in rows:
                label = classify_item(row["item"], species["label"])
                if not label:
                    continue
                price, unit = _to_kg_price(row)
                if price is None:
                    continue
                grouped[label]["prices"].append(price)
                grouped[label]["memos"].append("{} {} {}".format(row["item"], row["origin"], row["spec"]))
            for label, bucket in grouped.items():
                records.append(common.normalize_record(
                    name=label,
                    category=species["category"],
                    price=round(sum(bucket["prices"]) / len(bucket["prices"]), 1),
                    unit="kg",
                    date=day.isoformat(),
                    source="노량진경락",
                    memo="평균 {}건: {}".format(len(bucket["prices"]), ", ".join(bucket["memos"][:3])),
                ))
            time.sleep(args.delay)
        day += datetime.timedelta(days=1)

    count = common.save_records(records, args.out)
    names = sorted({r["name"] for r in records})
    print("노량진 {}건 / 품목 {}개 저장됨 -> {}".format(count, len(names), args.out))
    if names:
        print("  " + ", ".join(names))


if __name__ == "__main__":
    main()
