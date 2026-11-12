# 요술손 작업을 잇는 AI

저장소는 공개되어 있고, 영역마다 주소가 다르다.

- 배송: https://github.com/joogrowth/yosulson/tree/main/배송
- 급여: https://github.com/joogrowth/yosulson/tree/main/급여
- 근퇴: https://github.com/joogrowth/yosulson/tree/main/근퇴
- 식자재: https://github.com/joogrowth/yosulson/tree/main/식자재

Cursor는 루트 `AGENTS.md`, `.cursor/rules/`, 각 영역 `AGENTS.md`·`기억.md`를 보고 역할을 잡는다.
어느 채팅에서 시작해도 같은 규칙을 따른다.

## 영역 기억 (필수)

채팅창끼리 대화는 자동으로 이어지지 않는다.
대신 각 영역의 `기억.md` 가 그 영역에서 나눈 결정·운영 방식의 정본이다.

사용자가 주제를 말하면 영역을 정한 뒤 **반드시 그 영역의 `기억.md`를 먼저 읽는다.**
배송은 `배송/지침.md`도 함께 읽는다.

| 영역 | 먼저 읽을 파일 | Cursor 규칙 |
|------|----------------|-------------|
| 배송 | `배송/기억.md`, `배송/지침.md` | `.cursor/rules/baesong.mdc` |
| 근퇴 | `근퇴/기억.md`, `근퇴/README.md` | `.cursor/rules/geuntoe.mdc` |
| 식자재 | `식자재/기억.md` | `.cursor/rules/sikjjae.mdc` |
| 급여 | `급여/기억.md` | `.cursor/rules/geubyeo.mdc` |

공통 규칙: `.cursor/rules/always.mdc`

중요한 결정을 새로 정하면, 같은 작업 안에서 그 영역 `기억.md`의 **최근 결정**에 날짜와 한 줄을 추가한다.
비밀번호·PIN·개인 급여 상세는 `기억.md`에 넣지 않는다.

드라이브에도 같은 내용의 `기억.md`를 둔다. GitHub와 내용이 다르면 GitHub를 우선하고 드라이브를 맞춘다.
GitHub 링크는 `#숫자`가 아니라 `https://github.com/...` 전체 주소를 쓴다.

## 영역별 코드

배송 계산은 `배송/index.html` 을 읽고 고친다. 식자재 월간 보고는 `식자재/식재료시세분석/index.html` 과 `식자재/시세/scripts/` 를 읽고 고친다.

근퇴 로그인 주소는 `근퇴/README.md`·`근퇴/기억.md` 에 있고, `근퇴/index.html` 이 그 화면을 연다. 코드는 `근퇴/apps-script/` 에서 고친다. 근무기록 시트는 복사하거나 이름을 바꾸지 않는다. 로그인 비밀번호는 GitHub에 넣지 않는다. 급여는 `급여/index.html` 이 드라이브 명세서 폴더를 연다. 급여 계산 코드는 이 저장소에 없다.

드라이브의 예전 지침 숫자는 현재 규칙으로 적용하지 않는다. 코드와 작업 결과는 이 저장소로 다시 올린다.
네 영역을 하나로 묶는 원스톱 자동 연계는 만들지 않는다.
