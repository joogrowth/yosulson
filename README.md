# 요술손

공개 저장소: https://github.com/joogrowth/yosulson

챗지피티, 클로드, 제미나이, 커서는 이 저장소를 받아서 코드를 이어서 고치고, 작업 결과도 다시 이 저장소에 올린다. 저장소는 이미 공개되어 있다.

드라이브에 있는 배송견적 지침, 식자재 시세 월간보고 지침, 급여명세서 지침과 그 이전의 규정 문서는 예전 자료다. 지금은 그렇게 쓰지 않는 계산이 많다. 그 파일의 숫자를 현재 규칙으로 적용하지 않는다. 현재 프로그램은 이 저장소의 코드를 본다.

## 배송견적

- 화면: 저장소 맨 위의 `index.html`
- 제목: 요술손 배송비 계산기
- 종류: 배송, 배송세팅, 출장
- 계산을 고칠 때는 이 파일의 스크립트를 읽고 고친다. 예전 지침 문서의 구간표나 추가 수고비를 다시 넣지 않는다.
- 화면은 결과 텍스트를 복사한다. 구글 드라이브로 견적 줄을 자동 저장하지는 않는다.

사람이 보는 견적 기록 시트는 드라이브 요술손/배송의 배송견적 기록이다.

https://docs.google.com/spreadsheets/d/1iYmGXZYHcivv37fS7GxLs1zg4Jj2o60iQcwoLBivu6U/edit

## 식자재 시세

- 이번 월간 보고 화면: `식재료시세분석/index.html`
- `시세/월간보고/index.html` 은 위 화면으로 보낸다.
- 시세 조회: `시세/index.html`
- 다음 달 제철: `시세/전망/index.html`
- 수집과 화면 생성: `시세/scripts/`
- 2026년 8월에 인쇄해 둔 PDF: `시세/reports/요술손_시세월간보고_2026-08.pdf`

월간 보고를 다시 만들 때 저장소에서 이렇게 실행한다. 달과 마지막 날은 그 보고에 맞게 바꾼다.

```
cd 시세
python3 scripts/fetch_month.py --days 45 --out data/latest.json
python3 scripts/build_dashboard.py --month YYYY-MM --as-of YYYY-MM-DD
```

`시세/data/latest.json` 과 수집 중간 파일은 저장소에 올리지 않는다. `.gitignore` 에 들어 있다.

KAMIS 소매를 먼저 모으고, 소매가 없는 품목만 가락 도매로 보완하고, 노량진 경락을 함께 본다. 직전 출하기 가격을 당월 가격으로 복사하지 않는다. 이 순서는 `시세/scripts/fetch_month.py` 에 있다.

완성 PDF는 드라이브 요술손/식자재 폴더에 둔다.

## 근퇴

근퇴 프로그램 코드는 이 저장소에 없다. 출퇴근은 구글 시트 근무기록이 맡고 있다.

https://docs.google.com/spreadsheets/d/1WO7kMn7Hm5CACOj0WthlIpDA2KB-wHZ5bWwiJmPs7qk/edit

이 시트는 복사하거나 이름을 바꾸거나 다른 파일로 다시 만들지 않는다. 출퇴근 주소가 이 파일에 묶여 있다. 폴더 위치는 드라이브 요술손/근퇴다.

## 급여

급여 계산 코드는 이 저장소에 없다. 명세서 파일은 드라이브 요술손/급여 안에 둔다. 2026년 10월 파일은 요술손/급여/급여/26년10월/10월급여명세서.xlsx 다.

예전 지침에 적어 둔 시급, 야간, 주휴, 공제 계산은 현재 규칙으로 쓰지 않는다. 명세서를 이어서 만들 때는 그 달 파일과 근무기록을 보고, 사용자에게 지금 쓰는 계산을 확인한다.

## 드라이브 폴더

- 요술손: https://drive.google.com/drive/folders/1Mhyv9rxztVuOJu269KOhx8U9bn2cvBKr
- 배송: https://drive.google.com/drive/folders/1dp5kli6RcOj-37_-z6Q-nFAPuBXRndfb
- 식자재: https://drive.google.com/drive/folders/1NzS7cW80M5_j403etnZB9cg6rvyrepF9
- 근퇴: https://drive.google.com/drive/folders/1qX132AZcDi09ymhKeSzGE4yyh38NgbRe
- 급여: https://drive.google.com/drive/folders/1WIGEvzWsNlLR2JalU1CRMy-5Ebs0WBw5

이미지, 영상, PDF, 사람이 보는 문서는 드라이브에 둔다. 프로그램 코드와 이어서 고친 결과는 이 저장소에 둔다.

## 다른 AI가 이어서 할 때

1. 이 저장소를 받는다.
2. 고칠 프로그램의 파일을 직접 읽고 수정한다.
3. 작업을 마치면 이 저장소에 다시 올린다.
4. 사람이 보관하는 견적, 월간보고 PDF, 급여 파일은 위 드라이브 폴더에 둔다.
5. 근무기록 시트는 그대로 둔다.
6. 드라이브의 예전 지침 숫자로 견적, 시세 판단, 급여를 계산하지 않는다.
