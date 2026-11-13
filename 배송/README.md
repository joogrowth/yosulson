# 배송

배송·배송세팅·출장 견적을 화면에서 만들고, 구글시트 **배송견적**에 저장한다.

## 구조

- 화면: `index.html` (GitHub Pages)
- 구글 연결 다리: `apps-script/` (Apps Script 웹앱)
- 데이터: 구글시트 **배송견적**

관리자 아이디는 `admin` 고정이다. 비밀번호는 화면에서 등록한다. 대표님은 「새 계정 만들기」로 등록한다. 비밀번호는 GitHub에 넣지 않는다.

## 먼저 읽을 파일

- 운영 기억: `기억.md`
- 다른 AI용 작업 지침: `지침.md`
- 화면: `index.html`
- 웹앱 코드: `apps-script/`

## 주소

- 화면: https://joogrowth.github.io/yosulson/배송/
- 웹앱(`/exec`): https://script.google.com/macros/s/AKfycbwK1uXP1m0CYyb9cxTiRcDIIQVh3LJcPkWvg45gUn-GBkf7u6j_GGp7lxbGmFRy7goguw/exec
- 배송견적 시트: https://docs.google.com/spreadsheets/d/1gx7HTjwyCrIduf21Pj85z06210KlSxodWwnKr-SF2mg/edit
- 드라이브 배송 폴더: https://drive.google.com/drive/folders/1dp5kli6RcOj-37_-z6Q-nFAPuBXRndfb
- 드라이브 지침: https://drive.google.com/file/d/19kYU-NWBMxj7W3R0BXatXo7deRllWP35/view

웹앱 코드를 고친 뒤에는 `clasp push` 하고, **기존 배포를 새 버전으로 업데이트**한다. `/exec` 주소가 바뀌지 않게 한다.
