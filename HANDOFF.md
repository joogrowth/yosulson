# 요술손 시세 트래커 — 인수 프롬프트 (새 창 복붙용)

> 이 파일은 대화가 끊기거나 Cursor 할당량이 넘어 새 창에서 이어갈 때 쓰는 **최신 인수인계 문서**다.  
> 사용자가 “인수 프롬프트 보여줘”라고 하면, 아래 **「복붙용 프롬프트」** 블록을 그대로 주면 된다.  
> 구현/수정은 **사용자가 명시적으로 허락한 뒤에만** 진행한다.

최종 갱신: 2026-09-14 (로컬 폴더: ~/yosulson — 홈이 david)

---

## 복붙용 프롬프트

```text
너는 요술손케이터링(yosulson) **식재료 시세 분석**과 구글시트 견적·작업지시 연동을 이어받는다.
대화만 요청하면 구현하지 말고, 사용자가 허락한 뒤에만 코드/PR을 건드린다.

## 저장소 / 브랜치 / PR
- GitHub: https://github.com/joogrowth/yosulson
- 작업 브랜치: cursor/ingredient-price-tracker-c422 (base: main)
- Draft PR: https://github.com/joogrowth/yosulson/pull/2
- 아직 main 미머지
- 브랜치 명명 규칙: cursor/<descriptive-name>-c422

## 사용자 작업 환경 (매우 중요)
- 실제 수집·실행은 **사용자 Mac(국내 IP)** 에서 한다.
- Cloud Agent(미국 AWS IP)는 KAMIS/ekape WAF에 막히므로 API 실호출 테스트 불가.
- Mac 홈 폴더 이름이 `david` 이다. Finder에서 moonbalae / factory / wellness 옆에 yosulson이 보이면 됨.
- 로컬 폴더 구조:
  ~/                      (= /Users/david, Finder에 david로 보임)
    moonbalae/
    yosulson/             ← git 루트
      식재료시세분석/     ← 식재료 시세 분석 대시보드
      시세/               ← 시세 조회·JSON·수집 스크립트 (월간보고 주소는 식재료시세분석으로 이동)
      배송견적/           ← 배송 견적
- 시세 수집 실행은 `~/yosulson/시세` 에서. (스크립트 기본 출력 경로는 이 폴더 기준)
- 홈에 혼자 있는 fetch_kamis_prices.py 는 예전 잔여 파일 — 쓰지 않음
- Desktop/시세수집, ~/yousulson 은 이전 경로 — 쓰지 않음
- 할당량 초과 시 새 창에서 이어가므로, 중요 결정/상태는 이 HANDOFF.md를 계속 갱신한다.
- 사용자가 “인수 프롬프트 보여줘”라고 하면 HANDOFF.md의 복붙용 블록을 보여준다.

## 제품 목적 (북극성 — 2026-09-14)
- 진입 화면은 **식재료 시세 분석** (`식재료시세분석/index.html`).
- 시세: 한 달 앞 제철, 매달 통계 → PDF. 당월 실거래만.
- **배송 견적** = 차량·인건비. **고객 견적서·작업지시서** = 구글시트. 둘이 다름.
- 견적서(대표·나만, 금액 있음)를 쓰면 작업지시서에 메뉴·재료(메뉴도감)·특이사항이 자동 기입. 직원 지시서에는 단가·세액·최종금액 없음. 상단 인원배정은 대표·담당 기입.
- 브라우저에 적는 메모로 작업지시서를 대체하지 않음. 대표 계정 시트 + 앱스 스크립트.
- 메뉴도감 시트: https://docs.google.com/spreadsheets/d/1Ttv3dcO4qNnFIQ952MTY4aYlL0PoydX8B43eMBkiMyM/edit?gid=1692000343

## 현재 만들어진 것
- 식재료시세분석/index.html: **식재료 시세 분석** = 월간 보고(8월 폼, 9월 숫자, PDF). 별도 월간보고 화면 없음.
- 시세/월간보고/index.html: 식재료시세분석으로 이동.
- 견적작업/index.html: 구글시트 견적서→작업지시서 연동 설명. localStorage 메모 아님.
- 배송견적/index.html: 배송 견적
- 시세/index.html: 기본 탭 = 시세 조회(검색→현재가/변동배지/조언/차트). 수기입력·가져오기/내보내기·임계값은 데이터 관리 탭. 헤더에 월간 보고 링크.
- 시세/scripts/common.py: 공통 normalize/save
- 시세/scripts/fetch_kamis_prices.py: KAMIS 수집(~88품목, 기본 지역 고양/일산 3138)
- 시세/scripts/fetch_price_go_kr.py: 참가격 수집(연결은 됨, 인증키 동기화 이슈 가능)
- 시세/data/sources.json, 시세/data/reference/kamis_품목_등급_코드표.xlsx
- 시세/data/kamis_latest.json: 로컬 수집본(gitignore). 화면에는 가져오기로 넣어야 보임
- 시세/reports/: 저장한 월간보고 PDF
- README.md 업데이트됨
- --debug 옵션: 실패 응답 전체를 debug.log에 기록

## 인증키 (사용자 Mac 환경변수)
- KAMIS_CERT_ID=9248
- KAMIS_CERT_KEY=c9f07d13-2c3f-41cb-86d8-9acf154ee151
- data.go.kr 서비스키도 보유(가금/참가격 등 공용). 필요 시 사용자에게 확인.

## 로컬 실행 예시
cd ~/yosulson/시세
export KAMIS_CERT_ID="9248"
export KAMIS_CERT_KEY="c9f07d13-2c3f-41cb-86d8-9acf154ee151"
python3 scripts/fetch_kamis_prices.py --days 30 --out data/kamis_latest.json --debug

- debug.log는 시세 폴더에 생성됨 (기본: ~/yosulson/시세/debug.log)
- 결과 JSON을 시세 → 데이터 관리 → 가져오기로 로드

## 알려진 이슈
1) 일부 품목이 주기적으로 `오류: ○○ 조회 실패 - 응답 구조 이상` (예: 메밀, 감자, 딸기, 당근, 피마늘, 사과, 일부 수산). 나머지는 정상(종종 19건). 스크립트는 계속 진행됨.
2) 이미 재시도/지수백오프/2차 라운드/요청간격/등급코드 제거/지역→전국 fallback(수산) 등을 넣었는데도 간헐 실패 잔존.
3) 원인 확정을 위해 --debug로 raw 응답을 보기로 함. 사용자 Mac의 debug.log 확인이 다음 진단 키.
4) 클라우드에서는 KAMIS 실호출 불가 → 보완 코드는 작성 가능하나 검증은 사용자 Mac에서.

## 직전 대화에서 합의/대기 중
- 사용자는 구현 전 컨펌을 원함. “지금은 아니야; 대화만” 상태였음.
- 조회실패 보완 옵션을 제안함. 추천은:
  A) 당장 성공분으로 UI 사용
  B) 실패 품목 재시도/부분 재수집 강화 (추천)
  C) 대체 소스(참가격/축산 API)로 공백 보완
  D) 만성 실패 품목 일시 제외
- 사용자가 추가로 요청:
  1) `~/yosulson` 폴더를 3개로 정리 (지금이창 / 시세 / 배송견적)
  2) 할당량 초과 대비 인수프롬프트를 계속 정리·기록하고, 요청 시 새 창 복붙용으로 보여주기

## 다음에 할 일 (허락 후)
- [ ] 월간보고를 「이번 달 제철 / 주의·대체 / 다음 달 전망」+ PDF가 매달 나오는 모듈로 키우기
- [ ] 견적서→작업지시서 구글시트 앱스 스크립트 (대표 계정, 메뉴도감, 금액은 직원 파일에 없음)
- [x] 지금이창 제목을 식재료 시세 분석으로. 가짜 localStorage 작업지시 제거.
- [ ] PR #2 필요 시 업데이트; 머지는 사용자 요청 시에만
- [ ] HANDOFF.md를 매 중요 결정마다 갱신

## 작업 규칙
- 프론트는 기존 price-insight / index 디자인 언어 유지.
- 불필요한 리팩터·범위 확대 금지.
- 사용자 허락 없이 대규모 구현/머지/새 브랜치 남발 금지.
- 비밀키를 새 공개 문서에 추가로 퍼뜨리지 말 것(이 HANDOFF는 작업 연속성용; 외부 공유 금지).
```

---

## 로컬 Mac 저장소 세팅 (안내만 — 실행은 사용자/허락 후)

```bash
cd ~/yosulson
git checkout cursor/ingredient-price-tracker-c422
open ~/yosulson
```

시세 수집 결과는 `~/yosulson/시세/data/kamis_latest.json` 에 둔다.
바탕화면 `시세수집` 폴더는 예전 사본이므로 새 작업은 `~/yosulson` 만 쓴다.

앞으로 요술손 다른 프로그램은 `~/yosulson/<새폴더>` 로 옆에 추가.

수집 데이터와 `debug.log`는 로컬 산출물 → git 커밋하지 않음(`.gitignore`에 반영됨).

---

## 변경 이력 (인수 문서)

- 2026-09-14: 북극성 = 한 창 허브(태블릿/폰). 월간 분석·PDF가 첫 모듈. 다음 달 제철 전망·작업지시·자료는 같은 창에 붙임.
- 2026-09-14: 폴더를 지금이창 / 시세 / 배송견적 3개로 정리. 이 창 이름도 「지금 이창」.
- 2026-09-14: `~/yosulson` 안에서 도구별 폴더 분리 (배송비계산기 / 시세수집). 수집 JSON·8월 PDF를 시세수집으로 모음.
- 2026-08-09: 경로 정정 — 홈이 `david`이므로 `~/yousulson/시세수집` (moonbalae 옆). (이후 실제 경로는 ~/yosulson 으로 확정)
- 2026-08-09: 최초 작성. 간헐 조회실패 논의(구현 대기). 로컬 Mac 저장소 선호 + 새 창 인수프롬프트 유지 요청 반영.
