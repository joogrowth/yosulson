"""식재료 시세 수집 스크립트들이 공통으로 사용하는 유틸리티.

새로운 데이터 소스를 추가할 때는 이 모듈의 normalize_record()/save_records()를
그대로 재사용하면, price-insight.html이 기대하는 형식(JSON 배열)을 항상 동일하게
맞출 수 있음. 소스별 스크립트(fetch_*.py)는 서로 독립적이므로 하나를 빼거나
새로 추가해도 나머지에는 영향이 없음.
"""

import datetime
import json
import os


def normalize_record(name, category, price, unit, date=None, source="", memo=""):
    """price-insight.html의 가져오기 형식에 맞는 단일 시세 기록을 만듦."""
    return {
        "name": (name or "").strip(),
        "category": category or "기타",
        "price": float(price),
        "unit": unit or "kg",
        "date": date or datetime.date.today().isoformat(),
        "source": source or "",
        "memo": memo or "",
    }


def save_records(records, out_path):
    """정규화된 기록 리스트를 JSON 파일로 저장하고 저장 건수를 반환."""
    os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)
    return len(records)


def merge_json_files(paths, out_path):
    """여러 fetch_*.py가 각각 만든 JSON 파일을 하나로 합쳐서 저장.

    price-insight.html에 한 번에 가져오기 하고 싶을 때 사용.
    """
    merged = []
    for p in paths:
        if not os.path.exists(p):
            continue
        with open(p, encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                merged.extend(data)
    return save_records(merged, out_path)
