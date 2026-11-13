# 식자재 시세 API (다른 AI 공통)

Cursor·클로드·챗지피티·제미나이 모두 이 문서를 보고 같은 방식으로 시세를 모은다.

코드 정본: https://github.com/joogrowth/yosulson/tree/main/식자재  
메인(웹): https://joogrowth.github.io/yosulson/

---

## 쓰는 API

| 출처 | 역할 | 인증 |
|------|------|------|
| **KAMIS** 소매 | 기본 시세 | `KAMIS_CERT_KEY`, `KAMIS_CERT_ID` |
| **KAMIS** 가락 도매 | 소매 없는 품목만 보완 | 위와 같은 키 |
| **노량진** 경락 | 수산물 보완 | 키 없음 (홈페이지 수집) |
| 참가격(선택) | 가공식품 등 | `PRICEGOKR_SERVICE_KEY` (월간보고 기본 흐름에는 안 씀) |

KAMIS 신청: https://www.kamis.or.kr → 고객센터 → Open-API → 이용신청

---

## 키 값 — 어디에 두나

- **키 값은 GitHub·기억·지침·이 파일·공개 채팅에 쓰지 않는다.**
- 이름만 공개한다: `KAMIS_CERT_KEY`, `KAMIS_CERT_ID`
- 각 AI·로컬(맥)의 **비공개 환경변수/시크릿**에만 값을 넣는다.

### 클로드

1. 이 저장소 `식자재/` 를 연다.
2. 클로드 쪽 비공개 설정(프로젝트 환경변수·시크릿 등)에  
   `KAMIS_CERT_KEY`, `KAMIS_CERT_ID` 값을 넣는다.  
   (값은 사용자가 맥에 있는 것을 넣는다. AI가 채팅에 키를 물어보게 하지 않는다.)
3. 수집은 **국내 IP(맥)** 에서 돌린다. KAMIS는 해외/클라우드 IP를 막는 경우가 있다.

### 챗지피티 · 제미나이

같은 저장소를 보고, 각자 비공개 시크릿/환경변수에 위 이름 두 개를 넣는다.  
키 값은 채팅·GitHub에 붙이지 않는다.

### 맥(로컬) 예시

```bash
export KAMIS_CERT_KEY="(비공개 값)"
export KAMIS_CERT_ID="(비공개 값)"
```

---

## 한 달 시세 모으기 (명령)

```bash
cd 식자재/시세
python3 scripts/fetch_month.py --days 45 --out data/latest.json
python3 scripts/build_dashboard.py --month YYYY-MM --as-of YYYY-MM-DD
```

결과:
- 데이터: `식자재/시세/data/latest.json` (저장소에 올리지 않음)
- 대시보드: `식자재/식재료시세분석/YYYY-MM/index.html`
- 월 목록: `식자재/식재료시세분석/index.html`

관련 스크립트:
- `식자재/시세/scripts/fetch_month.py` — 소매+가락+노량진 합치기
- `식자재/시세/scripts/fetch_kamis_prices.py` — KAMIS
- `식자재/시세/scripts/fetch_noryangjin_prices.py` — 노량진
- `식자재/시세/scripts/build_dashboard.py` — 달별 HTML

KAMIS 엔드포인트(참고): `https://www.kamis.or.kr/service/price/xml.do`  
상세 파라미터·품목 코드는 `fetch_kamis_prices.py` 와 `식자재/시세/data/reference/` 를 본다.

---

## 숫자·운영 규칙 (요약)

- KAMIS 소매가 기본. 소매 없는 품목만 가락 도매 보완.
- 생선 등은 노량진 경락.
- 직전 출하기 가격을 당월로 복사하지 않음.
- 드라이브에 월간 PDF·HTML을 올리지 않음. 웹 대시보드로 보고 PDF는 사용자가 저장.
- 「저장해줘」면 GitHub에 올리고 합치기까지.
- 링크를 줄 때 메인 https://joogrowth.github.io/yosulson/ 도 같이.

자세한 운영은 `식자재/기억.md`, `식자재/지침.md` 를 따른다.
