# 식자재 시세 API (다른 AI 공통)

Cursor·클로드·챗지피티·제미나이 모두 이 문서를 보고 같은 방식으로 시세를 모은다.
**모바일에서도** 보고·요청·확인이 가능해야 한다. 맥 전용이 아니다.

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

## 어디서 쓰나 (모바일 포함)

- **보기·확인**: 휴대폰 브라우저로 메인·월 목록·그달 대시보드를 연다. 이게 기본이다.
- **AI에게 요청**: 모바일 클로드·챗지피티·제미나이에서도 같은 절차로 요청한다. “맥에서만 된다”고 거절하지 않는다.
- **시세 수집 실행**: 국내 IP가 되는 환경에서 아래 명령을 돌린다 (맥·국내 휴대폰 네트워크에 붙은 실행기 등).  
  해외 클라우드 IP만 KAMIS가 막을 수 있다. 막히면 국내 IP 쪽으로 같은 명령을 다시 돌린다.
- 키는 쓰는 기기/AI의 **비공개 시크릿·환경변수**에 둔다. 채팅·GitHub에 키 값을 쓰지 않는다.

---

## 키 값 — 어디에 두나

- **키 값은 GitHub·기억·지침·이 파일·공개 채팅에 쓰지 않는다.**
- 이름만 공개한다: `KAMIS_CERT_KEY`, `KAMIS_CERT_ID`
- 각 AI·실행 환경의 **비공개 환경변수/시크릿**에만 값을 넣는다.

### 클로드 (모바일·데스크톱 공통)

1. 이 저장소 `식자재/` 를 연다.
2. 비공개 시크릿에 `KAMIS_CERT_KEY`, `KAMIS_CERT_ID` 를 넣는다. (값은 사용자가 넣는다. AI가 채팅에 키를 묻지 않는다.)
3. 사용자가 시세 수집을 요청하면 명령을 실행한다. 해외 클라우드에서 KAMIS가 막히면 그 사실만 짧게 알리고, 국내 IP 환경에서 같은 명령을 이어 간다. 모바일 사용을 이유로 거절하지 않는다.

### 챗지피티 · 제미나이

같은 저장소를 보고, 비공개 시크릿에 위 이름 두 개를 넣는다.  
모바일에서도 동일. 키 값은 채팅·GitHub에 붙이지 않는다.

### 환경변수 예시

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
- 확인 링크는 휴대폰에서 바로 열리게 전체 주소로 준다.

자세한 운영은 `식자재/기억.md`, `식자재/지침.md` 를 따른다.
