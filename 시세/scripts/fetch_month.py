#!/usr/bin/env python3
"""한 달치 시세를 KAMIS 소매 + 가락 도매 + 노량진 경락에서 모아 하나의 JSON으로 합친다.

매달 월간 보고 전에 이 스크립트를 돌리면, 소매 조사가 비는 품목도
가락·노량진 실거래가 있는 날은 그 값이 들어간다. 직전 출하기 가격을
당월로 복사하지 않는다.

    cd ~/yosulson/시세
    python3 scripts/fetch_month.py --days 45 --out data/latest.json
"""

import argparse
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPTS = os.path.dirname(os.path.abspath(__file__))


def run(script, extra):
    cmd = [sys.executable, os.path.join(SCRIPTS, script)] + extra
    print("\n>>>", " ".join(cmd))
    result = subprocess.run(cmd)
    if result.returncode != 0:
        print("경고: {} 종료코드 {}".format(script, result.returncode), file=sys.stderr)
    return result.returncode == 0


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--days", type=int, default=45, help="오늘 기준 며칠 전부터 (전월 비교용으로 45일 권장)")
    parser.add_argument("--delay", type=float, default=0.8, help="KAMIS 요청 간격")
    parser.add_argument("--out", default=os.path.join(ROOT, "data", "latest.json"))
    args = parser.parse_args()

    kamis_path = os.path.join(ROOT, "data", "kamis_latest.json")
    garak_path = os.path.join(ROOT, "data", "garak_latest.json")
    noryang_path = os.path.join(ROOT, "data", "noryangjin_latest.json")

    run("fetch_kamis_prices.py", [
        "--days", str(args.days),
        "--delay", str(args.delay),
        "--country-code", "",
        "--out", kamis_path,
    ])
    # 가락 도매는 소매 조사가 비는 품목만. 소매·도매는 출하 단위가 달라서
    # 둘 다 넣으면 월간 평균이 상자 도매가로 덮인다.
    missing = []
    if os.path.exists(kamis_path):
        with open(kamis_path, encoding="utf-8") as f:
            kamis_rows = json.load(f)
        have = {r.get("name") for r in kamis_rows if isinstance(r, dict)}
        from fetch_kamis_prices import ITEMS
        missing = [it["label"] for it in ITEMS if it["label"] not in have]
    if missing:
        print("소매 없음 → 가락 도매 보완:", ", ".join(missing))
        run("fetch_kamis_prices.py", [
            "--days", str(args.days),
            "--delay", str(args.delay),
            "--product-cls", "02",
            "--country-code", "1101",
            "--source", "가락도매",
            "--only", ",".join(missing),
            "--out", garak_path,
        ])
    else:
        print("소매가 있는 품목만 있어 가락 도매 보완은 건너뜀")
        common.save_records([], garak_path)
    run("fetch_noryangjin_prices.py", [
        "--days", str(args.days),
        "--out", noryang_path,
    ])

    count = common.merge_json_files([kamis_path, garak_path, noryang_path], args.out)
    print("\n합친 시세 {}건 -> {}".format(count, args.out))
    print("시세 조회 → 데이터 관리에서 이 파일을 가져오면 월간 보고에 반영됨.")


if __name__ == "__main__":
    main()
