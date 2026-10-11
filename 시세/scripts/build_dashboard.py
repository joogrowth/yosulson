#!/usr/bin/env python3
"""latest.json으로 식재료시세분석(월간 보고) 화면을 만든다.
월간보고 폴더는 이 화면으로 보낸다. 폼을 따로 두지 않는다.

    cd ~/yosulson/시세
    python3 scripts/build_dashboard.py
"""

import html
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = os.path.dirname(ROOT)
OUT = os.path.join(REPO, "식재료시세분석", "index.html")
DATA = os.path.join(ROOT, "data", "latest.json")
SHOPPING = os.path.join(ROOT, "data", "shopping_buy.json")

AUG = ("2026-08-01", "2026-08-31")
SEP = ("2026-09-01", "2026-09-14")
ALERT = 15
CAT_ORDER = ["채소", "과일", "곡물", "축산물", "수산물"]
CAT_CLASS = {"채소": "veg", "과일": "fruit", "곡물": "grain", "수산물": "fish", "축산물": "meat"}
# 월간보고 CATALOG와 동일. 별칭으로 묶어 8월 폼의 품목명을 유지한다.
CATALOG = [
    {"cat": "채소", "name": "마늘", "aliases": ["마늘", "피마늘", "깐마늘", "깐마늘(국산)"]},
    {"cat": "채소", "name": "깐마늘(수입)", "aliases": ["깐마늘(수입)"]},
    {"cat": "채소", "name": "배추", "aliases": ["배추"]},
    {"cat": "채소", "name": "얼갈이배추", "aliases": ["얼갈이배추"]},
    {"cat": "채소", "name": "알배기배추", "aliases": ["알배기배추"]},
    {"cat": "채소", "name": "고구마", "aliases": ["고구마"]},
    {"cat": "채소", "name": "생강", "aliases": ["생강"]},
    {"cat": "채소", "name": "열무", "aliases": ["열무"]},
    {"cat": "채소", "name": "건고추", "aliases": ["건고추"]},
    {"cat": "채소", "name": "풋고추", "aliases": ["풋고추"]},
    {"cat": "채소", "name": "피망", "aliases": ["피망"]},
    {"cat": "채소", "name": "참깨", "aliases": ["참깨"]},
    {"cat": "채소", "name": "들깨", "aliases": ["들깨"]},
    {"cat": "채소", "name": "땅콩", "aliases": ["땅콩"]},
    {"cat": "채소", "name": "양파", "aliases": ["양파", "적양파"]},
    {"cat": "채소", "name": "대파/쪽파", "aliases": ["파", "대파", "쪽파"]},
    {"cat": "채소", "name": "당근", "aliases": ["당근"]},
    {"cat": "채소", "name": "감자", "aliases": ["감자"]},
    {"cat": "채소", "name": "무", "aliases": ["무"]},
    {"cat": "채소", "name": "호박류", "aliases": ["호박", "애호박", "단호박", "쥬키니", "미니단호박"]},
    {"cat": "채소", "name": "양배추", "aliases": ["양배추", "적양배추"]},
    {"cat": "채소", "name": "시금치", "aliases": ["시금치"]},
    {"cat": "채소", "name": "깻잎", "aliases": ["깻잎"]},
    {"cat": "채소", "name": "부추", "aliases": ["부추"]},
    {"cat": "채소", "name": "미나리", "aliases": ["미나리"]},
    {"cat": "채소", "name": "브로콜리", "aliases": ["브로콜리"]},
    {"cat": "채소", "name": "토마토", "aliases": ["토마토"]},
    {"cat": "채소", "name": "파프리카", "aliases": ["파프리카"]},
    {"cat": "채소", "name": "가지", "aliases": ["가지"]},
    {"cat": "채소", "name": "오이", "aliases": ["오이"]},
    {"cat": "채소", "name": "상추", "aliases": ["상추", "양상추"]},
    {"cat": "채소", "name": "홍고추", "aliases": ["홍고추", "풋고추", "붉은고추"]},
    {"cat": "채소", "name": "느타리버섯", "aliases": ["느타리버섯"]},
    {"cat": "채소", "name": "새송이버섯", "aliases": ["새송이버섯", "세송이버섯"]},
    {"cat": "채소", "name": "팽이버섯", "aliases": ["팽이버섯"]},
    {"cat": "과일", "name": "사과", "aliases": ["사과"]},
    {"cat": "과일", "name": "배", "aliases": ["배"]},
    {"cat": "과일", "name": "복숭아", "aliases": ["복숭아"]},
    {"cat": "과일", "name": "포도", "aliases": ["포도"]},
    {"cat": "과일", "name": "감귤", "aliases": ["감귤"]},
    {"cat": "과일", "name": "단감", "aliases": ["단감"]},
    {"cat": "과일", "name": "바나나", "aliases": ["바나나"]},
    {"cat": "과일", "name": "참다래(키위)", "aliases": ["참다래", "키위"]},
    {"cat": "과일", "name": "파인애플", "aliases": ["파인애플"]},
    {"cat": "과일", "name": "오렌지", "aliases": ["오렌지"]},
    {"cat": "과일", "name": "레몬", "aliases": ["레몬"]},
    {"cat": "과일", "name": "체리", "aliases": ["체리"]},
    {"cat": "과일", "name": "망고", "aliases": ["망고"]},
    {"cat": "과일", "name": "딸기", "aliases": ["딸기"]},
    {"cat": "과일", "name": "수박", "aliases": ["수박"]},
    {"cat": "과일", "name": "참외", "aliases": ["참외"]},
    {"cat": "과일", "name": "멜론", "aliases": ["멜론"]},
    {"cat": "과일", "name": "방울토마토", "aliases": ["방울토마토"]},
    {"cat": "곡물", "name": "쌀", "aliases": ["쌀"]},
    {"cat": "곡물", "name": "찹쌀", "aliases": ["찹쌀"]},
    {"cat": "곡물", "name": "콩", "aliases": ["콩"]},
    {"cat": "곡물", "name": "팥", "aliases": ["팥"]},
    {"cat": "곡물", "name": "녹두", "aliases": ["녹두"]},
    {"cat": "곡물", "name": "메밀", "aliases": ["메밀"]},
    {"cat": "축산물", "name": "계란", "aliases": ["계란", "계란(특란30구/일반란)"]},
    {"cat": "축산물", "name": "우유", "aliases": ["우유", "우유(흰우유)"]},
    {"cat": "축산물", "name": "소고기(안심)", "aliases": ["소고기(안심)"]},
    {"cat": "축산물", "name": "소고기(등심)", "aliases": ["소고기(등심)"]},
    {"cat": "축산물", "name": "소고기(설도)", "aliases": ["소고기(설도)"]},
    {"cat": "축산물", "name": "소고기(양지)", "aliases": ["소고기(양지)"]},
    {"cat": "축산물", "name": "소고기(갈비)", "aliases": ["소고기(갈비)"]},
    {"cat": "축산물", "name": "돼지고기(삼겹살)", "aliases": ["돼지고기(삼겹살)"]},
    {"cat": "축산물", "name": "돼지고기(목심)", "aliases": ["돼지고기(목심)"]},
    {"cat": "축산물", "name": "돼지고기(앞다리)", "aliases": ["돼지고기(앞다리)"]},
    {"cat": "축산물", "name": "돼지고기(갈비)", "aliases": ["돼지고기(갈비)"]},
    {"cat": "축산물", "name": "닭고기", "aliases": ["닭고기(육계)", "닭고기"]},
    {"cat": "축산물", "name": "닭가슴살", "aliases": ["닭고기(가슴살)", "닭가슴살"]},
    {"cat": "축산물", "name": "닭북채", "aliases": ["닭고기(북채)", "닭북채"]},
    {"cat": "수산물", "name": "고등어", "aliases": ["고등어"]},
    {"cat": "수산물", "name": "갈치", "aliases": ["갈치"]},
    {"cat": "수산물", "name": "조기", "aliases": ["조기"]},
    {"cat": "수산물", "name": "명태", "aliases": ["명태"]},
    {"cat": "수산물", "name": "삼치", "aliases": ["삼치"]},
    {"cat": "수산물", "name": "오징어", "aliases": ["오징어", "물오징어"]},
    {"cat": "수산물", "name": "건오징어", "aliases": ["건오징어"]},
    {"cat": "수산물", "name": "건멸치", "aliases": ["건멸치"]},
    {"cat": "수산물", "name": "북어", "aliases": ["북어"]},
    {"cat": "수산물", "name": "새우", "aliases": ["새우"]},
    {"cat": "수산물", "name": "냉동대하", "aliases": ["냉동대하", "대하"]},
    {"cat": "수산물", "name": "냉동랍스테일", "aliases": ["냉동랍스테일", "랍스테일"]},
    {"cat": "수산물", "name": "굴", "aliases": ["굴"]},
    {"cat": "수산물", "name": "가리비", "aliases": ["가리비"]},
    {"cat": "수산물", "name": "전복", "aliases": ["전복"]},
    {"cat": "수산물", "name": "홍합", "aliases": ["홍합", "그린홍합"]},
    {"cat": "수산물", "name": "김", "aliases": ["김"]},
    {"cat": "수산물", "name": "미역", "aliases": ["미역", "건미역"]},
    {"cat": "수산물", "name": "다시마", "aliases": ["건다시마", "다시마"]},
    {"cat": "수산물", "name": "수입조기", "aliases": ["수입조기"]},
]


def match_item(entry_name, item):
    en = str(entry_name or "").strip()
    if not en:
        return False
    aliases = item["aliases"]
    if en in aliases:
        return True
    for a in aliases:
        if "(" in a:
            continue
        if a == "파":
            if en in ("파", "대파", "쪽파"):
                return True
            continue
        if a == "마늘":
            if en == "마늘":
                return True
            continue
        if a in ("무", "배", "김", "쌀", "오징어"):
            if en == a:
                return True
            continue
        if a in en:
            return True
    return False


def is_live(src):
    s = str(src or "")
    return "가락" in s or "노량진" in s


def avg(rows, start, end):
    inr = [r for r in rows if start <= r.get("date", "") <= end and r.get("price")]
    if not inr:
        return None
    retail = [r for r in inr if not is_live(r.get("source"))]
    live = [r for r in inr if is_live(r.get("source"))]
    use = retail or live
    units = {}
    for r in use:
        u = r.get("unit") or ""
        units[u] = units.get(u, 0) + 1
    best = max(units, key=units.get)
    use = [r for r in use if (r.get("unit") or "") == best]
    p = sum(r["price"] for r in use) / len(use)
    return {
        "price": round(p),
        "unit": best,
        "n": len(use),
        "source": use[0].get("source") or "",
        "last": max(r["date"] for r in use),
    }


def classify(change):
    if change is None:
        return "na", "—"
    if change >= ALERT:
        return "surge", "급등"
    if change >= 5:
        return "up", "상승"
    if change <= -ALERT:
        return "plunge", "급락"
    if change <= -5:
        return "down", "하락"
    return "flat", "보합"


def comma(n):
    return "{:,}".format(int(round(n)))


def spark_pts(series, end):
    use = [r for r in series if r.get("price") and r.get("date", "") <= end]
    use = sorted(use, key=lambda r: r["date"])[-12:]
    return [{"d": r["date"], "p": round(r["price"])} for r in use]


def series_for(recs, item):
    rows = [r for r in recs if match_item(r.get("name"), item) and r.get("price") and r.get("date")]
    rows.sort(key=lambda r: r.get("date") or "")
    return rows


def main():
    with open(DATA, encoding="utf-8") as f:
        recs = json.load(f)
    if os.path.exists(SHOPPING):
        with open(SHOPPING, encoding="utf-8") as f:
            shop = json.load(f)
        if isinstance(shop, list):
            recs = recs + [r for r in shop if isinstance(r, dict) and r.get("price")]

    rows = []
    for item in CATALOG:
        series = series_for(recs, item)
        cur = avg(series, *SEP)
        prev = avg(series, *AUG)
        change = None
        cls, label = "na", "—"
        note = ""
        if cur and prev and cur["unit"] == prev["unit"] and prev["price"] > 0:
            lo = min(cur["price"], prev["price"])
            hi = max(cur["price"], prev["price"])
            if lo > 0 and hi / lo >= 2.5:
                cls, label, note = "na", "제외", "출처/단위 혼선 가능"
            else:
                change = (cur["price"] - prev["price"]) / prev["price"] * 100
                cls, label = classify(change)
                if cur["n"] <= 2:
                    note = "9월 일수 적음"
        elif cur:
            note = "전월 데이터 없음"
        elif item["name"] in ("냉동대하", "냉동랍스테일"):
            note = "쿠팡·네이버 냉동 구매"
        rows.append({
            "cat": item["cat"], "name": item["name"], "cls": cls, "label": label, "note": note,
            "change": None if change is None else round(change, 1),
            "sep": cur, "aug": prev, "spark": spark_pts(series, SEP[1]),
        })

    visible = [r for r in rows if r["sep"] or r["name"] in ("냉동대하", "냉동랍스테일")]
    with_change = [r for r in visible if r["change"] is not None]
    up = [r for r in with_change if r["change"] > 5]
    down = [r for r in with_change if r["change"] < -5]
    flat = [r for r in with_change if abs(r["change"]) <= 5]
    top_up = sorted(with_change, key=lambda r: -(r["change"] or 0))[:5]
    top_down = [r for r in sorted(with_change, key=lambda r: (r["change"] or 0))[:5] if (r["change"] or 0) < 0]
    alerts = sorted(
        [r for r in with_change if ALERT <= r["change"] < 150],
        key=lambda r: -(r["change"] or 0),
    )
    kamis_n = sum(1 for r in recs if r.get("price") and "가락" not in str(r.get("source") or "") and "노량진" not in str(r.get("source") or ""))
    live_n = sum(1 for r in recs if r.get("price") and is_live(r.get("source")))

    def mover(r):
        sign = "+" if r["change"] > 0 else ""
        return (
            '<div class="mover"><div><div class="mover-name">{}</div>'
            '<div class="mover-meta">{}원/{} · 월평균</div></div>'
            '<div class="badge {}">{}{:.1f}%</div></div>'
        ).format(
            html.escape(r["name"]), comma(r["sep"]["price"]), html.escape(r["sep"]["unit"]),
            html.escape(r["cls"]), sign, r["change"],
        )

    shop_meta = {
        "냉동대하": (
            "DIAMOND 홍다리 얼룩새우 20미/500g · 로켓프레시",
            "이 상품(2379381695) 8월 쿠팡 이력은 없음. 같은 규격 식자재 10팩은 팩당 약 10,200원, 소비자가대 약 12,800원이라 지금 12,500원은 보합으로 봄. 서해 자연산 대하가 아님.",
        ),
        "냉동랍스테일": (
            "냉동 꼬리 4oz(약 110g) · 4.54kg 약 40미",
            "꼬리 1개 약 110g(4oz). 4.54kg 박스에 37~42미(보통 약 40미). 통마리 랍스터 제외. 전월 이 규격 이력 없음.",
        ),
    }

    def shop_card():
        shops = [r for r in visible if r["name"] in shop_meta and r.get("sep")]
        if not shops:
            return ""
        bits = []
        for r in shops:
            title, note = shop_meta[r["name"]]
            bits.append(
                '<div class="mover"><div><div class="mover-name">{}</div>'
                '<div class="mover-meta">{}<br>당월 <strong>{}원/{}</strong>. {}</div></div>'
                '<span class="badge flat">보합 참고</span></div>'.format(
                    html.escape(r["name"]), html.escape(title),
                    comma(r["sep"]["price"]), html.escape(r["sep"]["unit"]),
                    html.escape(note),
                )
            )
        return (
            '<div class="card keep">'
            '<div class="card-title">구매 시세 — 쿠팡·식자재 냉동</div>'
            '<div class="card-desc">KAMIS에 없는 실제 구매 규격입니다. 전월 이 상품 이력이 없어 변동 %는 비우고, 주변 시세로만 참고합니다.</div>'
            + "".join(bits) + "</div>"
        )

    def alert_rows():
        if not alerts:
            return '<div class="empty">이번 달 급등 기준(15%)을 넘긴 신뢰 가능 품목 없음</div>'
        body = []
        for r in alerts:
            body.append(
                '<tr><td><strong>{}</strong></td><td><span class="chip {}">{}</span></td>'
                '<td class="num">{}원</td><td class="num">{}원</td>'
                '<td class="num"><span class="badge {}">+{:.1f}%</span></td>'
                '<td class="mover-meta">선구매·대체 검토</td></tr>'.format(
                    html.escape(r["name"]), CAT_CLASS.get(r["cat"], ""), html.escape(r["cat"]),
                    comma(r["sep"]["price"]), comma(r["aug"]["price"]),
                    html.escape(r["cls"]), r["change"],
                )
            )
        return (
            '<div class="card-desc">당월·전월 모두 <strong>월평균가</strong>로 비교합니다.</div>'
            + chunk_tables(
                body,
                '<thead><tr><th>품목</th><th>범주</th><th class="num">당월 평균</th>'
                '<th class="num">전월 평균</th><th class="num">변동</th><th>판단</th></tr></thead>',
            )
        )

    CAT_THEAD = (
        '<thead><tr><th>품목</th><th class="num">당월 평균</th><th class="num">전월 평균</th>'
        '<th class="num">변동</th><th>추이</th></tr></thead>'
    )
    ROW_CHUNK = 10

    def chunk_tables(trs, thead, n=ROW_CHUNK):
        if not trs:
            return ""
        bits = []
        for i in range(0, len(trs), n):
            bits.append(
                '<div class="cat-chunk"><div class="tbl-wrap"><table>{}<tbody>{}</tbody></table></div></div>'.format(
                    thead, "".join(trs[i:i + n])
                )
            )
        return "".join(bits)

    cat_html = []
    spark_payload = []
    idx = 0
    for cat in CAT_ORDER:
        cat_rows = [r for r in visible if r["cat"] == cat]
        cat_all = [r for r in rows if r["cat"] == cat]
        cat_caption = (
            '<span class="chip {}">{}</span> {} 시세 '
            '<span style="font-size:13px;color:#7a7974;font-weight:600">({}/{})</span>'.format(
                CAT_CLASS.get(cat, ""), html.escape(cat), html.escape(cat), len(cat_rows), len(cat_all)
            )
        )
        if not cat_rows:
            cat_html.append(
                '<div class="card cat-chunk"><div class="cat-h">{}</div>'
                '<div class="cat-empty">이 범주 시세 없음</div></div>'.format(cat_caption)
            )
            continue
        trs = []
        for r in cat_rows:
            sign = "" if r["change"] is None else ("+" if r["change"] > 0 else "")
            if r["change"] is None:
                if r["name"] in shop_meta:
                    change_cell = '<span class="badge flat" title="{}">보합 참고</span>'.format(
                        html.escape(shop_meta[r["name"]][1])
                    )
                else:
                    if r["note"] == "전월 데이터 없음":
                        badge = "—"
                    elif r["note"] == "쿠팡·네이버 냉동 구매":
                        badge = r["note"]
                    else:
                        badge = "제외" if r["note"] else "—"
                    change_cell = '<span class="badge na" title="{}">{}</span>'.format(
                        html.escape(r["note"]), html.escape(badge)
                    )
            else:
                change_cell = '<span class="badge {}">{}{:.1f}%</span>'.format(
                    html.escape(r["cls"]), sign, r["change"]
                )
            if r["sep"]:
                if r["name"] in shop_meta:
                    extra = '<div class="mover-meta">{}</div>'.format(html.escape(shop_meta[r["name"]][0]))
                else:
                    extra = '<div class="mover-meta">{}일 평균{}</div>'.format(
                        r["sep"]["n"],
                        (" · " + html.escape(r["sep"]["source"])) if r["sep"].get("source") else "",
                    )
                cur_cell = "{}원/{}".format(comma(r["sep"]["price"]), html.escape(r["sep"]["unit"]))
            else:
                extra = '<div class="mover-meta">쿠팡·네이버 냉동 · 결제 단가 없음</div>'
                cur_cell = '<span style="color:#a9a7a1">없음</span>'
            sid = "sp{}".format(idx)
            idx += 1
            spark_payload.append({"id": sid, "pts": r["spark"]})
            trs.append(
                "<tr><td><strong>{}</strong>{}</td>"
                '<td class="num">{}</td>'
                '<td class="num">{}</td>'
                '<td class="num">{}</td>'
                '<td><canvas class="spark" id="{}"></canvas></td></tr>'.format(
                    html.escape(r["name"]), extra,
                    cur_cell,
                    (comma(r["aug"]["price"]) + "원") if r.get("aug") else "—",
                    change_cell, sid,
                )
            )
        pieces = []
        i = 0
        first = True
        while i < len(trs):
            n = 8 if first else ROW_CHUNK
            cap = '<caption class="cat-h">{}</caption>'.format(cat_caption) if first else ""
            pieces.append(
                '<div class="card cat-chunk"><div class="tbl-wrap"><table>{}{}<tbody>{}</tbody>'
                "</table></div></div>".format(cap, CAT_THEAD, "".join(trs[i:i + n]))
            )
            i += n
            first = False
        cat_html.append("".join(pieces))

    page = """<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="apple-mobile-web-app-title" content="식재료 시세 분석">
<title>요술손_시세월간보고_2026-09</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Apple SD Gothic Neo','Noto Sans KR',sans-serif;background:#f7f6f2;color:#28251d;font-size:16px;line-height:1.6}
header{background:#fff;border-bottom:1px solid #e0ddd8;padding:14px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
.logo{display:flex;align-items:center;gap:10px;font-weight:700;font-size:14px;color:#01696f;text-decoration:none}
.logo-icon{width:32px;height:32px;background:#01696f;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.hdr-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.hdr-link{font-size:12px;color:#01696f;text-decoration:none;border-bottom:1px solid #01696f;font-weight:600}
main{max-width:860px;margin:0 auto;padding:28px 16px 80px}
h1{font-size:26px;font-weight:700;margin-bottom:6px}
.subtitle{font-size:14px;color:#7a7974;margin-bottom:20px}
.btn{background:#01696f;color:#fff;border:none;border-radius:10px;padding:12px 16px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit}
.card{background:#fff;border:1px solid #e0ddd8;border-radius:16px;padding:20px;margin-bottom:14px}
.card-title{font-size:11px;font-weight:700;color:#7a7974;text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px}
.card-desc{font-size:13px;color:#7a7974;margin-bottom:14px;line-height:1.6}
.report-head{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:flex-end;margin-bottom:8px}
.report-meta{font-size:13px;color:#7a7974}
.stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
@media(max-width:640px){.stat-grid{grid-template-columns:1fr 1fr}}
.stat{border:1px solid #e0ddd8;border-radius:12px;padding:14px;text-align:center}
.stat-n{font-size:22px;font-weight:700}
.stat-l{font-size:12px;color:#7a7974;margin-top:2px}
.stat.up .stat-n{color:#c0392b}
.stat.down .stat-n{color:#1c5f8c}
.stat.flat .stat-n{color:#1e7a3d}
.stat.miss .stat-n{color:#7a7974}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:640px){.two-col{grid-template-columns:1fr}}
.mover{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #e8e6e1}
.mover:last-child{border-bottom:none}
.mover-name{font-size:14px;font-weight:700}
.mover-meta{font-size:12px;color:#7a7974}
.badge{display:inline-block;font-size:12px;font-weight:700;padding:3px 10px;border-radius:99px;white-space:nowrap}
.badge.surge{background:#fbe4e4;color:#c0392b}
.badge.up{background:#fdeee0;color:#c0631a}
.badge.flat{background:#e3f2e6;color:#1e7a3d}
.badge.down{background:#e1eef7;color:#1c5f8c}
.badge.plunge{background:#eee7f7;color:#6c4ab0}
.badge.na{background:#eeece7;color:#7a7974}
.chip{display:inline-block;font-size:11px;font-weight:700;padding:3px 9px;border-radius:99px;margin-right:6px}
.chip.veg{background:#e3f2e6;color:#1e7a3d}
.chip.fruit{background:#fdeee0;color:#c0631a}
.chip.grain{background:#f1ead9;color:#8a6d1f}
.chip.fish{background:#e1eef7;color:#1c5f8c}
.chip.meat{background:#fbe4e4;color:#b23b3b}
table{width:100%;border-collapse:collapse;font-size:13px}
th,td{text-align:left;padding:9px 6px;border-bottom:1px solid #e8e6e1;vertical-align:middle}
th{color:#7a7974;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.05em}
td.num{text-align:right;font-variant-numeric:tabular-nums}
.spark{width:88px;height:28px;display:block}
.empty{font-size:13px;color:#a9a7a1;text-align:center;padding:20px 0}
.cat-h{font-size:18px;font-weight:700;margin:22px 0 10px;display:flex;align-items:center;gap:8px}
caption.cat-h{display:table-caption;caption-side:top;text-align:left;margin:0 0 12px}
.cat-chunk .cat-h{margin:0 0 12px}
.cat-empty{font-size:13px;color:#7a7974;padding:8px 0 4px}
.footer-note{font-size:12px;color:#7a7974;margin-top:24px;line-height:1.6}
.pdf-tip{font-size:12px;color:#7a7974;margin-top:6px}
.print-banner{display:none}
.tbl-wrap{overflow-x:auto}
.cat-chunk + .cat-chunk thead{display:none}
@media print{
  @page{size:A4;margin:18mm 14mm 22mm 14mm}
  html,body{height:auto}
  body{background:#fff;color:#000;font-size:11pt;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  header,.no-print,.pdf-tip{display:none!important}
  .print-banner{display:block;margin-bottom:12px;padding-bottom:10px;border-bottom:2px solid #01696f;break-after:avoid;page-break-after:avoid}
  .print-banner .brand{font-size:13pt;font-weight:700;color:#01696f}
  .print-banner .ptitle{font-size:16pt;font-weight:700;margin-top:4px}
  .print-banner .pmeta{font-size:9pt;color:#555;margin-top:4px}
  main{max-width:100%;padding:0}
  h1,.subtitle{display:none}
  .card{border:1px solid #bbb;border-radius:8px;padding:12px;margin:0 0 12px;break-inside:auto;page-break-inside:auto}
  .card.keep,.mover,.footer-note{break-inside:avoid;page-break-inside:avoid}
  .tbl-wrap{overflow:visible!important}
  .cat-chunk{break-inside:auto;page-break-inside:auto}
  .cat-chunk table{break-inside:avoid;page-break-inside:avoid}
  caption.cat-h,.cat-h{break-after:avoid;page-break-after:avoid;margin:0 0 10px;font-size:13pt}
  .stat-grid{gap:6px}
  .stat{padding:8px;border-radius:8px;break-inside:avoid}
  .stat-n{font-size:16pt}
  table{font-size:9.5pt;border-collapse:separate;border-spacing:0;page-break-inside:auto}
  thead{display:table-header-group}
  .cat-chunk + .cat-chunk thead{display:table-header-group}
  tr,th,td{break-inside:avoid;page-break-inside:avoid}
  th,td{padding:6px 4px}
  .spark{width:70px;height:22px}
  .footer-note{font-size:8.5pt;margin-top:12px}
}
</style>
</head>
<body>
<header>
  <a class="logo" href="./index.html">
    <div class="logo-icon">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 12l3-8 3 8" stroke="white" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M10 12l3-8 3 8" stroke="white" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".8"/>
        <rect x="3.5" y="13" width="13" height="1.6" rx=".8" fill="white" opacity=".7"/>
      </svg>
    </div>
    요술손케이터링
  </a>
  <div class="hdr-actions no-print">
    <a class="hdr-link" href="../시세/index.html">시세 조회</a>
    <a class="hdr-link" href="../시세/전망/index.html">다음 달 제철</a>
    <button class="btn" type="button" id="btn-print">PDF로 저장</button>
  </div>
</header>
<main>
  <div class="print-banner">
    <div class="brand">요술손케이터링</div>
    <div class="ptitle">2026년 9월 식재료 시세 동향</div>
    <div class="pmeta">요술손케이터링 · KAMIS·가락도매·노량진경락(월평균) · 비교 2026년 8월 → 2026년 9월 · 시세 품목 """ + str(len(visible)) + """개</div>
  </div>
  <h1>식재료 시세 월간 보고</h1>
  <p class="subtitle">구매 대비·대체 판단을 위한 시장 시세 동향 보고서 (원가 장부가 아님)</p>
  <p class="pdf-tip no-print">PDF: 오른쪽 위 <strong>PDF로 저장</strong> → 인쇄 창에서 <strong>머리글 및 바닥글</strong>을 끄고, 왼쪽 아래 <strong>PDF → PDF로 저장</strong></p>

  <div class="card keep">
    <div class="report-head">
      <div>
        <div class="card-title">보고서</div>
        <div style="font-size:20px;font-weight:700">2026년 9월 식재료 시세 동향</div>
      </div>
      <div class="report-meta">비교 기준: 2026년 8월 → 2026년 9월 (각 월 <strong>평균가</strong>)<br>
      시세 있는 품목 """ + str(len(visible)) + """ / 전체 """ + str(len(rows)) + """개 · 기록 """ + str(kamis_n) + """건""" + (" · 가락/노량진 {}건".format(live_n) if live_n else "") + """</div>
    </div>
    <div class="stat-grid">
      <div class="stat up"><div class="stat-n">""" + str(len(up)) + """</div><div class="stat-l">상승</div></div>
      <div class="stat down"><div class="stat-n">""" + str(len(down)) + """</div><div class="stat-l">하락</div></div>
      <div class="stat flat"><div class="stat-n">""" + str(len(flat)) + """</div><div class="stat-l">보합</div></div>
      <div class="stat miss"><div class="stat-n">""" + str(len(visible)) + """</div><div class="stat-l">시세 표시 중</div></div>
    </div>
  </div>

  <div class="card keep">
    <div class="card-title">한눈에 — 전월 대비 변동 Top</div>
    <div class="two-col">
      <div>
        <div class="card-desc" style="margin-bottom:4px">오른 품목</div>
        """ + ("".join(mover(r) for r in top_up) or '<div class="empty">비교 가능한 상승 품목 없음</div>') + """
      </div>
      <div>
        <div class="card-desc" style="margin-bottom:4px">내린 품목</div>
        """ + ("".join(mover(r) for r in top_down) or '<div class="empty">하락 품목 없음</div>') + """
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-title">주의 품목 — 미리 구매·대체 검토</div>
    <div class="card-desc">전월 대비 급등 기준을 넘긴 품목입니다. 메뉴 대체·선구매 검토용.</div>
    """ + alert_rows() + """
  </div>

  """ + shop_card() + """

  """ + "".join(cat_html) + """

  <p class="footer-note">
    출처: KAMIS 소매. 소매 조사가 있으면 소매를 쓰고, 없는 품목만 가락·노량진으로 보완합니다. 실제 구매처 단가와 다를 수 있습니다.
    보고 범위: 채소·과일·곡물·축산물·수산물. 버터·치즈·소스 등 가공품은 제외.
    냉동대하: 쿠팡 DIAMOND 홍다리 얼룩새우 20미/500g(2026-09-14 로켓프레시 12,500원). 냉동랍스테일: 꼬리 4oz(약 110g)×약 40미/4.54kg 박스. 통마리 랍스터·활대하·노량진은 쓰지 않음.
    9월 조사 없음(비움): 딸기, 단감, 참다래, 무, 깐마늘(수입), 닭가슴살, 닭북채, 삼치. 지난 출하기 가격을 당월에 넣지 않습니다.
  </p>
</main>
<script>
(function(){
  document.getElementById('btn-print').onclick = function(){ setTimeout(function(){ window.print(); }, 50); };
  var sparks = """ + json.dumps(spark_payload, ensure_ascii=False) + """;
  sparks.forEach(function(s){
    var canvas = document.getElementById(s.id);
    if(!canvas) return;
    var ctx = canvas.getContext('2d');
    var W = 88, H = 28;
    var dpr = window.devicePixelRatio || 1;
    canvas.width = W*dpr; canvas.height = H*dpr;
    canvas.style.width = W+'px'; canvas.style.height = H+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    var pts = s.pts || [];
    if(pts.length < 2){
      ctx.strokeStyle = '#d4d1ca';
      ctx.beginPath(); ctx.moveTo(4,H/2); ctx.lineTo(W-4,H/2); ctx.stroke();
      return;
    }
    var prices = pts.map(function(p){ return p.p; });
    var min = Math.min.apply(null, prices), max = Math.max.apply(null, prices);
    if(min === max){ min -= 1; max += 1; }
    ctx.strokeStyle = '#01696f';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    pts.forEach(function(p, i){
      var x = 4 + (W-8) * (i/(pts.length-1));
      var y = H-4 - (H-8) * ((p.p-min)/(max-min));
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    });
    ctx.stroke();
  });
})();
</script>
</body>
</html>
"""
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(page)
    print("시세 {}개 표시 → {}".format(len(visible), OUT))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
