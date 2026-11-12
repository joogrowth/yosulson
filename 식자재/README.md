# 식자재

먼저 `기억.md`를 읽는다.

주소: https://github.com/joogrowth/yosulson/tree/main/식자재

- 월간 보고 화면: `식재료시세분석/index.html`
- 시세 조회: `시세/index.html`
- 다음 달 제철: `시세/전망/index.html`
- 수집: `시세/scripts/`

월간 보고를 다시 만들 때:

```
cd 식자재/시세
python3 scripts/fetch_month.py --days 45 --out data/latest.json
python3 scripts/build_dashboard.py --month YYYY-MM --as-of YYYY-MM-DD
```

드라이브의 예전 식자재 지침 숫자는 현재 규칙으로 쓰지 않는다.
