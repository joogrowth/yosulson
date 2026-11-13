# 요술손 작업을 잇는 AI

요술손은 **GitHub + 구글 드라이브**를 공통으로 쓴다.
Cursor, 클로드, 챗지피티, 제미나이 등 **누가 하든** 같다.
채팅창끼리 기억이 이어지지 않는다. **최종 저장 후엔, 다음 시작 전에 반드시 최신 기록(기억·지침·드라이브 실무 파일)을 읽고 시작한다.**

배송·급여·식자재·근퇴에서 수정·개발 후 「저장해줘」면 **GitHub + 그 영역 구글 드라이브 폴더** 둘 다 최종 반영한다.

공개 저장소: https://github.com/joogrowth/yosulson  
한번에 다 보는 메인(웹): https://joogrowth.github.io/yosulson/

영역마다 주소가 다르다.  
링크를 줄 때는 위 메인 주소도 항상 함께 준다.

- 배송: https://github.com/joogrowth/yosulson/tree/main/배송
- 급여: https://github.com/joogrowth/yosulson/tree/main/급여
- 근퇴: https://github.com/joogrowth/yosulson/tree/main/근퇴
  - 링크는 사용자가 요청할 때만 준다. 요청하면 아래 셋을 함께 준다.
  - 로그인창: https://script.google.com/macros/s/AKfycbzEEnzF019IyqOCB6RF-gcJXMPuEmcHnXpcKERaTyJx7H0pTFZxXwg8u8Rbyo53ekku/exec
  - 근무기록 구글시트: https://docs.google.com/spreadsheets/d/1WO7kMn7Hm5CACOj0WthlIpDA2KB-wHZ5bWwiJmPs7qk/edit
  - 구글드라이브 근퇴 폴더: https://drive.google.com/drive/folders/1qX132AZcDi09ymhKeSzGE4yyh38NgbRe
- 식자재: https://github.com/joogrowth/yosulson/tree/main/식자재

Cursor는 루트 `AGENTS.md`, `.cursor/rules/`, 각 영역 `AGENTS.md`·`기억.md`를 보고 역할을 잡는다.
어느 채팅·어느 AI에서 시작해도 같은 규칙을 따른다.

## 영역 기억 (필수)

채팅창끼리 대화는 자동으로 이어지지 않는다.
대신 각 영역의 `기억.md` 가 그 영역에서 나눈 결정·운영 방식의 정본이다.

사용자가 주제를 말하면 영역을 정한 뒤 **반드시 그 영역의 `기억.md`를 먼저 읽는다.**
배송은 `배송/지침.md`도 함께 읽는다.

| 영역 | 먼저 읽을 파일 | Cursor 규칙 |
|------|----------------|-------------|
| 배송 | `배송/기억.md`, `배송/지침.md` | `.cursor/rules/baesong.mdc` |
| 근퇴 | `근퇴/기억.md`, `근퇴/README.md` | `.cursor/rules/geuntoe.mdc` |
| 식자재 | `식자재/기억.md`, `식자재/지침.md` | `.cursor/rules/sikjjae.mdc` |
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
