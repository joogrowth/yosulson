# 식자재

먼저 `기억.md`와 `지침.md`를 읽는다.

주소: https://github.com/joogrowth/yosulson/tree/main/식자재

- 운영 기억: `기억.md`
- 작업 지침: `지침.md`
- 월 목록: `식재료시세분석/index.html`
- 달별 보고: `식재료시세분석/YYYY-MM/index.html`
- 시세 조회: `시세/index.html`
- 다음 달 제철: `시세/전망/index.html`
- 수집: `시세/scripts/`

웹:
- 목록 https://joogrowth.github.io/yosulson/식자재/식재료시세분석/
- 2026-11 https://joogrowth.github.io/yosulson/식자재/식재료시세분석/2026-11/

월간 보고를 다시 만들 때:

```
cd 식자재/시세
python3 scripts/fetch_month.py --days 45 --out data/latest.json
python3 scripts/build_dashboard.py --month YYYY-MM --as-of YYYY-MM-DD
```

PDF는 드라이브에 올리지 않는다. 필요하면 대시보드에서 저장한다.
