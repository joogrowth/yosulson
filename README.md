# 요술손

공개 저장소: https://github.com/joogrowth/yosulson

요술손은 **GitHub를 공통으로 공유**한다.
Cursor, 클로드, 챗지피티, 제미나이 등 **어떤 AI를 써도** 이 저장소를 보고 같이 이어간다.

배송, 급여, 근퇴, 식자재는 저장소 안에서 주소가 나뉘어 있다.

- 배송: https://github.com/joogrowth/yosulson/tree/main/배송
- 급여: https://github.com/joogrowth/yosulson/tree/main/급여
- 근퇴: https://github.com/joogrowth/yosulson/tree/main/근퇴
- 식자재: https://github.com/joogrowth/yosulson/tree/main/식자재

챗지피티, 클로드, 제미나이, 커서는 고칠 영역의 주소를 열고, 그 안 `기억.md`를 먼저 읽은 뒤 코드를 이어서 수정하고, 결과를 다시 이 저장소에 올린다.
커서는 루트 `AGENTS.md`와 `.cursor/rules/`로 영역 역할을 공통으로 잡는다.
실무 파일(견적 기록, 명세서, PDF)은 드라이브 `요술손/`에 두고, 규칙·코드·기억은 GitHub가 우선이다.

드라이브에 있는 예전 지침의 숫자는 현재 규칙으로 쓰지 않는다.

## 배송

계산기 화면은 `배송/index.html` 이다. 종류는 배송, 배송세팅, 출장이다. 화면은 결과 텍스트를 복사하고, 드라이브로 견적 줄을 자동 저장하지는 않는다.

## 식자재

월간 보고 화면은 `식자재/식재료시세분석/index.html` 이다. 시세 조회는 `식자재/시세/index.html`, 수집 스크립트는 `식자재/시세/scripts/` 다.
작업 순서는 `식자재/지침.md`를 본다. 완성 PDF는 드라이브 `요술손/식자재`에 둔다.

```
cd 식자재/시세
python3 scripts/fetch_month.py --days 45 --out data/latest.json
python3 scripts/build_dashboard.py --month YYYY-MM --as-of YYYY-MM-DD
```

`식자재/시세/data/latest.json` 은 저장소에 올리지 않는다.

## 근퇴

직원 로그인 주소는 단톡방에 올린 주소와 같다.

https://script.google.com/macros/s/AKfycbzEEnzF019IyqOCB6RF-gcJXMPuEmcHnXpcKERaTyJx7H0pTFZxXwg8u8Rbyo53ekku/exec

`근퇴/index.html` 을 열면 위 로그인 화면으로 이동한다. 프로그램 코드는 `근퇴/apps-script/` 에 있다. 기록이 쌓이는 시트 주소는 바꾸지 않았다.

https://docs.google.com/spreadsheets/d/1WO7kMn7Hm5CACOj0WthlIpDA2KB-wHZ5bWwiJmPs7qk/edit

## 급여

급여 계산 코드는 이 저장소에 없다. 명세서 파일은 드라이브 요술손/급여에 둔다.

https://drive.google.com/drive/folders/1WIGEvzWsNlLR2JalU1CRMy-5Ebs0WBw5

## 드라이브 폴더

- 요술손: https://drive.google.com/drive/folders/1Mhyv9rxztVuOJu269KOhx8U9bn2cvBKr
- 배송: https://drive.google.com/drive/folders/1dp5kli6RcOj-37_-z6Q-nFAPuBXRndfb
- 식자재: https://drive.google.com/drive/folders/1NzS7cW80M5_j403etnZB9cg6rvyrepF9
- 근퇴: https://drive.google.com/drive/folders/1qX132AZcDi09ymhKeSzGE4yyh38NgbRe
- 급여: https://drive.google.com/drive/folders/1WIGEvzWsNlLR2JalU1CRMy-5Ebs0WBw5
