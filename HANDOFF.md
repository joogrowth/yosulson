# 요술손 시세 트래커 — 인수 프롬프트 (새 창 복붙용)

> 이 파일은 대화가 끊기거나 Cursor 할당량이 넘어 새 창에서 이어갈 때 쓰는 **최신 인수인계 문서**다.  
> 사용자가 “인수 프롬프트 보여줘”라고 하면, 아래 **「복붙용 프롬프트」** 블록을 그대로 주면 된다.  
> 구현/수정은 **사용자가 명시적으로 허락한 뒤에만** 진행한다.

최종 갱신: 2026-08-09 (로컬 폴더: ~/yousulson/시세수집 — 홈이 david)

---

## 복붙용 프롬프트

```text
너는 요술손케이터링(yosulson) 식재료 시세 분석 도구 작업을 이어받는다.
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
- Mac 홈 폴더 이름이 `david` 이다. Finder에서 moonbalae / factory / wellness 옆에 yousulson이 보이면 됨.
- 로컬 폴더 구조:
  ~/                      (= /Users/david, Finder에 david로 보임)
    moonbalae/
    yousulson/            ← 요술손 관련 프로그램 개발 루트
      시세수집/           ← 이번 식재료 시세 트래커 (git/운용 여기)
- 실행은 반드시 `~/yousulson/시세수집` 에서. 홈(~) 루트에서 돌리면 ModuleNotFoundError: common
- 홈에 혼자 있는 fetch_kamis_prices.py 는 나중에 시세수집으로 옮기는 게 좋음
- Desktop/시세수집, ~/david/yousulson 은 잘못된/이전 경로 — 쓰지 않음
- 할당량 초과 시 새 창에서 이어가므로, 중요 결정/상태는 이 HANDOFF.md를 계속 갱신한다.
- 사용자가 “인수 프롬프트 보여줘”라고 하면 HANDOFF.md의 복붙용 블록을 보여준다.

## 제품 목적
- 요술손케이터링이 코스트코/팜스/동네마트 등 일반 시장 구매를 할 때, 공식 시세를 참고해 급등락을 빨리 감지하고 나중에 메뉴 원가/마진 판단까지 연결하려는 도구.
- 특정 매장 전용 스크래핑이 아니라 공식 시장 데이터 기준.

## 현재 만들어진 것
- price-insight.html: 기본 탭 = 시세 조회(검색→현재가/변동배지/조언/차트). 수기입력·가져오기/내보내기·임계값은 데이터 관리 탭.
- scripts/common.py: 공통 normalize/save
- scripts/fetch_kamis_prices.py: KAMIS 수집(~88품목, 기본 지역 고양/일산 3138)
- scripts/fetch_price_go_kr.py: 참가격 수집(연결은 됨, 인증키 동기화 이슈 가능)
- data/sources.json, data/reference/kamis_품목_등급_코드표.xlsx
- README.md 업데이트됨
- --debug 옵션: 실패 응답 전체를 debug.log에 기록

## 인증키 (사용자 Mac 환경변수)
- KAMIS_CERT_ID=9248
- KAMIS_CERT_KEY=c9f07d13-2c3f-41cb-86d8-9acf154ee151
- data.go.kr 서비스키도 보유(가금/참가격 등 공용). 필요 시 사용자에게 확인.

## 로컬 실행 예시
cd ~/yousulson/시세수집
export KAMIS_CERT_ID="9248"
export KAMIS_CERT_KEY="c9f07d13-2c3f-41cb-86d8-9acf154ee151"
python3 scripts/fetch_kamis_prices.py --days 30 --out data/kamis_latest.json --debug

- debug.log는 실행 cwd에 생성됨 (보통 ~/yousulson/시세수집/debug.log)
- 결과 JSON을 price-insight.html 데이터 관리 → 가져오기로 로드

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
  1) Mac 홈(david) 안에 moonbalae처럼 `yousulson` 폴더를 두고, 이번 작업은 `시세수집`에서 운용
  2) 할당량 초과 대비 인수프롬프트를 계속 정리·기록하고, 요청 시 새 창 복붙용으로 보여주기

## 다음에 할 일 (허락 후)
- [ ] 사용자가 보완 방향(번호) 선택하면 그에 맞게 스크립트/UI 수정
- [ ] Mac에 ~/yousulson/시세수집 세팅(clone 또는 기존 파일 이동) 확인
- [ ] debug.log 내용을 보면 실패 유형(빈응답/미제공/일시오류) 분류 후 재시도 전략 조정
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
mkdir -p ~/yousulson
cd ~/yousulson
git clone https://github.com/joogrowth/yosulson.git 시세수집
cd 시세수집
git checkout cursor/ingredient-price-tracker-c422
open ~/yousulson
```

이미 Desktop/시세수집 또는 홈에 있는 수집 결과가 있다면:
- `data/kamis_latest.json`, `debug.log` 등을 `~/yousulson/시세수집/` 으로 옮기면 됨.
- 홈에 있는 `fetch_kamis_prices.py` 단독 파일도 시세수집 쪽으로 정리 권장.

앞으로 요술손 다른 프로그램은 `~/yousulson/<새폴더>` 로 옆에 추가.

수집 데이터와 `debug.log`는 로컬 산출물 → git 커밋하지 않음(`.gitignore`에 반영됨).

---

## 변경 이력 (인수 문서)

- 2026-08-09: 경로 정정 — 홈이 `david`이므로 `~/yousulson/시세수집` (moonbalae 옆).
- 2026-08-09: 최초 작성. 간헐 조회실패 논의(구현 대기). 로컬 Mac 저장소 선호 + 새 창 인수프롬프트 유지 요청 반영.
