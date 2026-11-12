# 요술손

공개 저장소: https://github.com/joogrowth/yosulson

배송, 급여, 근퇴, 식자재는 저장소 안에서 주소가 나뉘어 있다.

- 배송: https://github.com/joogrowth/yosulson/tree/main/배송
- 급여: https://github.com/joogrowth/yosulson/tree/main/급여
- 근퇴: https://github.com/joogrowth/yosulson/tree/main/근퇴
- 식자재: https://github.com/joogrowth/yosulson/tree/main/식자재

챗지피티, 클로드, 제미나이, 커서는 고칠 영역의 주소를 열고 그 코드를 이어서 수정한 뒤, 결과를 다시 이 저장소에 올린다.

드라이브에 있는 예전 지침의 숫자는 현재 규칙으로 쓰지 않는다.

## 배송

계산기 화면은 `배송/index.html` 이다. 종류는 배송, 배송세팅, 출장이다. 화면은 결과 텍스트를 복사하고, 드라이브로 견적 줄을 자동 저장하지는 않는다.

## 식자재

월간 보고 화면은 `식자재/식재료시세분석/index.html` 이다. 시세 조회는 `식자재/시세/index.html`, 수집 스크립트는 `식자재/시세/scripts/` 다.

```
cd 식자재/시세
python3 scripts/fetch_month.py --days 45 --out data/latest.json
python3 scripts/build_dashboard.py --month YYYY-MM --as-of YYYY-MM-DD
```

`식자재/시세/data/latest.json` 은 저장소에 올리지 않는다.

## 근퇴

`근퇴/index.html` 을 열면 지금 쓰는 근무기록 시트로 이동한다. 시트 주소는 바꾸지 않았다. 출퇴근은 이 시트로 계속 기록된다.

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
