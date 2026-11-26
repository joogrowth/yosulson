/**
 * 배송견적 툴 — 구글 연결 다리 (Apps Script 웹앱)
 *
 * 화면(배송/index.html, GitHub Pages)이 이 웹앱에 요청을 보내면
 * 비밀번호를 확인하고 구글시트를 읽고 쓴다.
 *
 * 계정 (모두 스크립트 속성에 저장. 코드와 GitHub에는 없다)
 *   관리자(팀장님): 아이디는 admin 고정. 로그인 화면에서 처음 한 번 비밀번호와 비밀번호 확인으로 등록한다.
 *                   저장은 암호처럼 바꾼 값(ADMIN_HASH)만 한다. 아무도 원래 비밀번호를 볼 수 없다.
 *   대표님:         로그인 화면의 '새 계정 만들기'로 원하는 아이디와 비밀번호를 직접 등록한다.
 *                   관리자가 볼 수 있어야 하므로 읽을 수 있는 글자로 저장한다(OWNER_ID, OWNER_PW).
 *                   관리자는 대표님 계정을 보고, 수정하고, 삭제할 수 있다. 삭제하면 등록이 다시 열린다.
 *   SHEET_ID       (시트에 묶이지 않은 스크립트일 때만) 데이터 구글시트의 ID
 *   TOKEN_SECRET 은 처음 로그인할 때 자동으로 만들어진다.
 *   네이버 동의: NAVER_CLIENT_ID, NAVER_CLIENT_SECRET 은 스크립트 속성에만 둔다.
 *   동의가 끝나면 NAVER_ACCESS_TOKEN, NAVER_REFRESH_TOKEN, NAVER_EXPIRES_AT 가 같은 곳에 저장된다.
 *   견적의뢰·견적완료의 네이버 버튼은 대표님·팀장님 모두 누른다. 대표님은 네이버에 로그인하지 않는다.
 *   일정은 요술손일정(26년)에만 넣는다. 캘린더 번호는 스크립트 속성 NAVER_CALENDAR_ID. 없거나 내 캘린더 값이면 넣지 않는다.
 *   관리자 비밀번호를 잊었을 때: 프로젝트 설정 > 스크립트 속성에서 ADMIN_HASH, ADMIN_SALT 를 지우면 등록 화면이 다시 나온다.
 *
 * 시트 구조
 *   연도 탭 '2026', '2027' …  한 탭에 그 해에 받은 주문 전부 (1행 묶음 이름, 2행 칸 이름, 3행부터 데이터)
 *   '고객리스트' 탭            이름 · 소속 · 연락처 · 주소 · 메모
 *   '복기' 칸은 시트에서만 고른다(확정 / 보류 / 취소). 이 코드는 값을 지우지 않는다.
 *
 * 권한
 *   owner(대표님)·admin(팀장님): 견적문의·제원·최종저장·상태 변경·삭제 (견적 기능 동일)
 *   admin(팀장님)만: 대표님 계정 보기·수정·삭제, 시트 `복기` 드롭다운은 시트에서만
 */

var TZ = 'Asia/Seoul';
var TOKEN_HOURS = 24;          // 마지막으로 쓴 때부터 24시간
var PW_MIN = 4;                // 비밀번호 최소 글자 수
var DATA_START = 3;            // 3행부터 데이터
var TYPES = ['배송', '배송세팅', '출장', '반출장', '픽업'];
var STATUS_WRITING = '견적문의';
var STATUS_WRITING_OLD = '견적작성중';
var STATUS_WAIT = '견적의뢰';
var STATUS_WAIT_OLD = '견적대기';
var STATUS_DONE = '견적완료';
var STATUSES = [STATUS_WRITING, STATUS_WAIT, STATUS_DONE];
var CUSTOMER_SHEET = '고객리스트';
var CUSTOMER_HEADERS = ['이름', '소속', '연락처', '주소', '메모'];

// 칸 정의 (시트의 왼쪽부터 순서대로)
var COLUMNS = [
  { key: 'id',          head: '번호',               group: '관리', text: true },
  { key: 'status',      head: '견적상태',            group: '관리', text: true },
  { key: 'review',      head: '복기',               group: '관리', text: true },
  { key: 'sang',        head: '상담',               group: '가안', text: true },
  { key: 'type',        head: '종류',               group: '가안', text: true },
  { key: 'name',        head: '이름',               group: '가안', text: true },
  { key: 'org',         head: '소속',               group: '가안', text: true },
  { key: 'date',        head: '행사일',              group: '가안', text: true },
  { key: 'arrive',      head: '도착',               group: '가안', text: true },
  { key: 'eventTime',   head: '행사시간',            group: '가안', text: true },
  { key: 'place',       head: '장소',               group: '가안', text: true },
  { key: 'contactName', head: '담당자',              group: '가안', text: true },
  { key: 'phone',       head: '연락처',              group: '가안', text: true },
  { key: 'notes',       head: '품목·특이사항',        group: '가안', text: true },
  { key: 'depart',      head: '출발',               group: '제원', text: true },
  { key: 'km',          head: '편도거리(km)',         group: '제원', num: true },
  { key: 'fuel',        head: '편도연료비',           group: '제원', num: true },
  { key: 'toll',        head: '편도통행료',           group: '제원', num: true },
  { key: 'park',        head: '주차비',              group: '제원', num: true },
  { key: 'goMin',       head: '도착소요시간(분)',      group: '제원', num: true },
  { key: 'backMin',     head: '복귀소요시간(분)',      group: '제원', num: true },
  { key: 'labor11',     head: '인건비11000',         group: '금액', num: true },
  { key: 'labor12',     head: '인건비12000',         group: '금액', num: true },
  { key: 'labor13',     head: '인건비13000',         group: '금액', num: true },
  { key: 'vehicle',     head: '차량운영비',           group: '금액', num: true },
  { key: 'fuelCost',    head: '유류비',              group: '금액', num: true },
  { key: 'tollTotal',   head: '통행료왕복',           group: '금액', num: true },
  { key: 'upkeep',      head: '차량유지비(인건비 제외)', group: '금액', num: true },
  { key: 'total11',     head: '합계11000',           group: '금액', num: true },
  { key: 'total12',     head: '합계12000',           group: '금액', num: true },
  { key: 'total13',     head: '합계13000',           group: '금액', num: true },
  { key: 'text',        head: '최종견적글',           group: '글', text: true }
];
var ROW_HEIGHT = 21;                // 데이터 줄은 한 줄 높이로 고정한다(긴 글은 잘라서 보이고, 칸을 누르면 전체가 보인다)
var UPKEEP_HEAD_COLOR = '#f2b36f'; // 차량유지비(인건비 제외) 칸을 다른 금액 칸과 구분하는 색
var UPKEEP_CELL_COLOR = '#fdebd5';
var GROUP_COLORS = { '관리': '#e3e6ea', '가안': '#d6e4f7', '제원': '#d8f0dc', '금액': '#fbeccb', '글': '#ead9f2' };

var DRAFT_KEYS = ['sang', 'type', 'name', 'org', 'date', 'arrive', 'eventTime', 'place', 'contactName', 'phone', 'notes'];
var SPEC_KEYS = ['depart', 'km', 'fuel', 'toll', 'park', 'goMin', 'backMin'];
var CALC_KEYS = ['labor11', 'labor12', 'labor13', 'vehicle', 'fuelCost', 'tollTotal', 'upkeep', 'total11', 'total12', 'total13'];

// ───────────────────────── 요청 입구 ─────────────────────────

var NAVER_EXEC = 'https://script.google.com/macros/s/AKfycbwK1uXP1m0CYyb9cxTiRcDIIQVh3LJcPkWvg45gUn-GBkf7u6j_GGp7lxbGmFRy7goguw/exec';

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.naver === 'prep') return naverConsentPrep_(p);
  if (p.naver === 'start' || p.code || p.error) return naverConsentPage_(p);
  return json_({ ok: true, service: 'baesong-estimate' });
}

function doPost(e) {
  var res;
  try {
    var req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    res = handle_(req);
  } catch (err) {
    res = { ok: false, error: err.code || 'error', message: err.message || String(err) };
  }
  return json_(res);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// 내 캘린더 시험 1건. 화면 버튼은 이 함수를 쓰지 않는다.
function naverTestMine() {
  var props = props_();
  var access = naverAccess_(props);
  var ical = ''
    + 'BEGIN:VCALENDAR\n'
    + 'VERSION:2.0\n'
    + 'PRODID:Naver Calendar\n'
    + 'CALSCALE:GREGORIAN\n'
    + 'BEGIN:VTIMEZONE\n'
    + 'TZID:Asia/Seoul\n'
    + 'BEGIN:STANDARD\n'
    + 'DTSTART:19700101T000000\n'
    + 'TZNAME:GMT+09:00\n'
    + 'TZOFFSETFROM:+0900\n'
    + 'TZOFFSETTO:+0900\n'
    + 'END:STANDARD\n'
    + 'END:VTIMEZONE\n'
    + 'BEGIN:VEVENT\n'
    + 'SEQUENCE:0\n'
    + 'CLASS:PUBLIC\n'
    + 'TRANSP:OPAQUE\n'
    + 'UID:yosulson-test-20261121-1000\n'
    + 'DTSTART;TZID=Asia/Seoul:20261121T100000\n'
    + 'DTEND;TZID=Asia/Seoul:20261121T103000\n'
    + 'SUMMARY:[시험] 배송견적\n'
    + 'DESCRIPTION:내 캘린더 시험 1건\n'
    + 'LOCATION:시험\n'
    + 'END:VEVENT\n'
    + 'END:VCALENDAR';
  var res = UrlFetchApp.fetch('https://openapi.naver.com/calendar/createSchedule.json', {
    method: 'post',
    headers: { Authorization: 'Bearer ' + access },
    payload: { calendarId: 'defaultCalendarId', scheduleIcalString: ical },
    muteHttpExceptions: true
  });
  var text = res.getContentText();
  Logger.log(text);
  return text;
}

// 요술손 일정(26년) 시험 1건. 내 캘린더에는 넣지 않는다.
function naverTestShare() {
  var props = props_();
  var cal = String(props.getProperty('NAVER_CALENDAR_ID') || '');
  if (!cal || cal === 'defaultCalendarId') throw new Error('요술손일정 캘린더 번호가 없습니다.');
  var access = naverAccess_(props);
  var ical = ''
    + 'BEGIN:VCALENDAR\n'
    + 'VERSION:2.0\n'
    + 'PRODID:Naver Calendar\n'
    + 'CALSCALE:GREGORIAN\n'
    + 'BEGIN:VTIMEZONE\n'
    + 'TZID:Asia/Seoul\n'
    + 'BEGIN:STANDARD\n'
    + 'DTSTART:19700101T000000\n'
    + 'TZNAME:GMT+09:00\n'
    + 'TZOFFSETFROM:+0900\n'
    + 'TZOFFSETTO:+0900\n'
    + 'END:STANDARD\n'
    + 'END:VTIMEZONE\n'
    + 'BEGIN:VEVENT\n'
    + 'SEQUENCE:0\n'
    + 'CLASS:PUBLIC\n'
    + 'TRANSP:OPAQUE\n'
    + 'UID:yosulson-test-share-20261121-2310\n'
    + 'DTSTART;TZID=Asia/Seoul:20261121T231000\n'
    + 'DTEND;TZID=Asia/Seoul:20261121T232000\n'
    + 'SUMMARY:[시험] 요술손일정\n'
    + 'DESCRIPTION:요술손 일정 시험 1건\n'
    + 'LOCATION:시험\n'
    + 'END:VEVENT\n'
    + 'END:VCALENDAR';
  var res = UrlFetchApp.fetch('https://openapi.naver.com/calendar/createSchedule.json', {
    method: 'post',
    headers: { Authorization: 'Bearer ' + access },
    payload: { calendarId: cal, scheduleIcalString: ical },
    muteHttpExceptions: true
  });
  var text = res.getContentText();
  Logger.log(text);
  return text;
}

function naverAccess_(props) {
  var exp = Number(props.getProperty('NAVER_EXPIRES_AT') || 0);
  var access = props.getProperty('NAVER_ACCESS_TOKEN') || '';
  if (access && exp > Date.now() + 60000) return access;
  var id = props.getProperty('NAVER_CLIENT_ID') || '';
  var secret = props.getProperty('NAVER_CLIENT_SECRET') || '';
  var refresh = props.getProperty('NAVER_REFRESH_TOKEN') || '';
  if (!id || !secret || !refresh) throw new Error('토큰이 없습니다.');
  var res = UrlFetchApp.fetch('https://nid.naver.com/oauth2.0/token', {
    method: 'post',
    payload: {
      grant_type: 'refresh_token',
      client_id: id,
      client_secret: secret,
      refresh_token: refresh
    },
    muteHttpExceptions: true
  });
  var body = JSON.parse(res.getContentText() || '{}');
  if (!body.access_token) throw new Error('토큰 갱신 실패');
  props.setProperty('NAVER_ACCESS_TOKEN', String(body.access_token));
  if (body.refresh_token) props.setProperty('NAVER_REFRESH_TOKEN', String(body.refresh_token));
  var sec = Number(body.expires_in || 3600);
  props.setProperty('NAVER_EXPIRES_AT', String(Date.now() + sec * 1000));
  return String(body.access_token);
}

// 견적의뢰·견적완료 건을 네이버 캘린더에 넣는다.
// 한 번 올라간 건은 다시 올리지 못한다. 고치려면 캘린더에서 지우고 다시 누른다.
function naverCalendar_(req) {
  var id = String(req.id || '');
  if (!id) fail_('bad', '건을 지정해 주세요.');
  var loc = findRow_(id);
  if (!loc) fail_('notfound', '해당 건을 찾을 수 없습니다.');
  var row = loc.obj;
  var st = canonStatus_(row.status);
  if (st !== STATUS_WAIT && st !== STATUS_DONE) fail_('bad', '견적의뢰 또는 견적완료에서만 넣을 수 있습니다.');
  if (!row.date || !/^\d{4}-\d{2}-\d{2}$/.test(String(row.date))) fail_('bad', '날짜를 먼저 적어 주세요.');
  var props = props_();
  var cal = String(props.getProperty('NAVER_CALENDAR_ID') || '');
  if (!cal || cal === 'defaultCalendarId') fail_('naver', '요술손일정 캘린더 번호가 없습니다.');
  var access;
  try { access = naverAccess_(props); }
  catch (e) { fail_('naver', '네이버 연결이 끊겼습니다. 팀장님이 네이버 동의를 다시 해 주세요.'); }
  var res = UrlFetchApp.fetch('https://openapi.naver.com/calendar/createSchedule.json', {
    method: 'post',
    headers: { Authorization: 'Bearer ' + access },
    payload: { calendarId: cal, scheduleIcalString: naverIcal_(row) },
    muteHttpExceptions: true
  });
  var body = {};
  try { body = JSON.parse(res.getContentText() || '{}'); } catch (e) { body = {}; }
  if (!body || body.result !== 'success') fail_('naver', naverFailText_(res.getResponseCode(), body));
  return { id: id };
}

// 화면에는 고정 문구만 보여 준다. 네이버가 돌려준 글·번호·토큰은 넣지 않는다.
function naverFailText_(httpCode, body) {
  var kind = naverFailKind_(httpCode, body);
  if (kind === 'auth') return '네이버 연결이 끊겼습니다. 팀장님이 네이버 동의를 다시 해 주세요.';
  if (kind === 'permission') return '요술손 일정에 넣을 권한이 없습니다.';
  if (kind === 'missing') return '요술손 일정을 찾지 못했습니다.';
  if (kind === 'again') return '이미 올라간 건입니다. 캘린더에서 지우고 다시 눌러 주세요.';
  if (kind === 'later') return '네이버 일정 등록에 실패했습니다. 잠시 뒤에 다시 눌러 주세요.';
  return '네이버 일정 등록에 실패했습니다. 이미 올라간 건입니다. 캘린더에서 지우고 다시 눌러 주세요.';
}

// 공개 오류표는 1403 권한, 1404 없는 캘린더, 1500 서버 오류뿐이다.
// 같은 건을 다시 넣었을 때의 코드는 그 표에 없다. 글에 중복이 보이면 다시 누르기, 아니면 실패 문구에 같이 붙인다.
function naverFailKind_(httpCode, body) {
  var code = '';
  var msg = '';
  if (body && typeof body === 'object') {
    code = String(body.errorCode || body.error_code || body.code || '');
    msg = String(body.message || body.errorMessage || body.error_description || '');
    if (body.returnValue && typeof body.returnValue === 'string') msg += ' ' + body.returnValue;
  }
  code = code.replace(/[^0-9A-Za-z]/g, '').slice(0, 8);
  msg = msg.replace(/Bearer\s+\S+/gi, ' ').replace(/[A-Za-z0-9_-]{20,}/g, ' ').toLowerCase();
  var http = Number(httpCode) || 0;
  if (code === '024' || code === '028' || code === '003' || http === 401 ||
      msg.indexOf('authentication') >= 0 || msg.indexOf('invalid_token') >= 0 ||
      msg.indexOf('access token') >= 0 || msg.indexOf('expired') >= 0 ||
      msg.indexOf('인증') >= 0) return 'auth';
  if (code === '1403') return 'permission';
  if (code === '1404' || http === 404) return 'missing';
  if (code === '1500' || http >= 500) return 'later';
  if (msg.indexOf('중복') >= 0 || msg.indexOf('duplicate') >= 0 || msg.indexOf('already') >= 0 ||
      msg.indexOf('동일한') >= 0 || msg.indexOf('이미 존재') >= 0 || msg.indexOf('이미 등록') >= 0 ||
      msg.indexOf('이미 있') >= 0) return 'again';
  return 'unknown';
}

function naverIcal_(row) {
  var uid = 'yosulson-' + String(row.id).replace(/[^A-Za-z0-9-]/g, '');
  var ymd = String(row.date).replace(/-/g, '');
  // 제목란에만 글을 넣는다. 시간·장소·메모 칸은 쓰지 않는다. 날짜만 잡아 일정이 그날에 있게 한다.
  return ''
    + 'BEGIN:VCALENDAR\n'
    + 'VERSION:2.0\n'
    + 'PRODID:Naver Calendar\n'
    + 'CALSCALE:GREGORIAN\n'
    + 'BEGIN:VTIMEZONE\n'
    + 'TZID:Asia/Seoul\n'
    + 'BEGIN:STANDARD\n'
    + 'DTSTART:19700101T000000\n'
    + 'TZNAME:GMT+09:00\n'
    + 'TZOFFSETFROM:+0900\n'
    + 'TZOFFSETTO:+0900\n'
    + 'END:STANDARD\n'
    + 'END:VTIMEZONE\n'
    + 'BEGIN:VEVENT\n'
    + 'SEQUENCE:0\n'
    + 'CLASS:PUBLIC\n'
    + 'TRANSP:OPAQUE\n'
    + 'UID:' + uid + '\n'
    + 'DTSTART;VALUE=DATE:' + ymd + '\n'
    + 'DTEND;VALUE=DATE:' + naverNextDay_(ymd) + '\n'
    + 'SUMMARY:' + naverEscIcal_(naverTitleText_(row)) + '\n'
    + 'END:VEVENT\n'
    + 'END:VCALENDAR';
}

function naverTitle_(row) {
  var typePart = row.type ? '[' + (row.sang === '예' ? '상담' : '') + row.type + '] ' : '';
  return typePart + (row.name || '(이름 없음)') + (row.org ? ' / ' + row.org : '');
}

function naverDateLabel_(iso) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  if (!m) return '미정';
  var dt = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  var wd = ['일', '월', '화', '수', '목', '금', '토'][dt.getUTCDay()];
  return m[1].slice(2) + '.' + m[2] + '.' + m[3] + '(' + wd + ')';
}

function naverWho_(row) {
  if (row.contactName) return row.contactName + ' (' + (row.phone || '연락처 확인중') + ')';
  return row.phone || '';
}

// 제목란에 붙이는 글. 금액은 넣지 않는다.
function naverTitleText_(row) {
  var L = [];
  L.push(naverTitle_(row));
  L.push('일자: ' + naverDateLabel_(row.date));
  L.push('');
  L.push('출발: ' + (row.depart || ''));
  if (row.arrive) L.push('도착: ' + row.arrive);
  if (row.eventTime) L.push('행사시간: ' + row.eventTime);
  L.push('');
  if (row.place) {
    L.push('장소: ' + String(row.place).replace(/^\s+/, ''));
    L.push('');
  }
  var who = naverWho_(row);
  if (who) L.push('담당자: ' + who);
  if (row.notes) L.push('', String(row.notes));
  return L.join('\n').replace(/\n+$/, '');
}

function naverPlace_(row) {
  return String(row.place || '').split('\n')[0].trim();
}

function naverDesc_(row) {
  // 캘린더에는 견적문의 내용만 넣는다. 견적완료여도 출발 시각만 더한다.
  // 최종 견적 글과 금액은 넣지 않는다. 그 글은 화면의 복사·카톡에만 있다.
  var L = [String(row.status || '') + ' ' + String(row.id || '')];
  if (row.depart) L.push('출발 ' + row.depart);
  if (row.arrive) L.push('도착 ' + row.arrive);
  if (row.eventTime) L.push('행사시간 ' + row.eventTime);
  var who = [row.contactName, row.phone].filter(Boolean).join(' ');
  if (who) L.push('담당자 ' + who);
  if (row.notes) L.push(String(row.notes).slice(0, 500));
  return L.join('\n');
}

function naverSpan_(row) {
  var points = [];
  [row.depart, row.arrive, row.eventTime].forEach(function (s) {
    String(s || '').split(' ~ ').forEach(function (part) {
      var m = /^(\d{1,2}):(\d{2})$/.exec(String(part || '').trim());
      if (!m) return;
      var min = Number(m[1]) * 60 + Number(m[2]);
      if (min >= 0 && min < 24 * 60) points.push(min);
    });
  });
  if (!points.length) return null;
  var start = Math.min.apply(null, points);
  var end = Math.max.apply(null, points);
  if (end <= start) end = start + 30;
  if (end >= 24 * 60) end = 24 * 60 - 1;
  if (end <= start) return null;
  return { start: start, end: end };
}

function naverStamp_(ymd, min) {
  var h = Math.floor(min / 60);
  var m = min % 60;
  if (h >= 24) { h = 23; m = 59; }
  function p(n) { return (n < 10 ? '0' : '') + n; }
  return ymd + 'T' + p(h) + p(m) + '00';
}

function naverNextDay_(ymd) {
  var y = Number(ymd.slice(0, 4));
  var mo = Number(ymd.slice(4, 6));
  var d = Number(ymd.slice(6, 8));
  var dt = new Date(Date.UTC(y, mo - 1, d + 1));
  function p(n) { return (n < 10 ? '0' : '') + n; }
  return dt.getUTCFullYear() + p(dt.getUTCMonth() + 1) + p(dt.getUTCDate());
}

function naverEscIcal_(s) {
  return String(s || '')
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\n|\r/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

// 네이버 동의 한 번. 견적 저장 요청은 이 함수를 타지 않는다.
function naverConsentPage_(p) {
  try {
    if (p.naver === 'start' && !p.code) return naverConsentStart_();
    return naverConsentFinish_(p);
  } catch (err) {
    return naverHtml_('동의 저장에 실패했습니다. 링크를 다시 열어 주세요.');
  }
}

function naverConsentPrep_(p) {
  var state = String(p.state || '');
  if (!/^[A-Za-z0-9]+$/.test(state) || state.length < 8 || state.length > 80) {
    return naverHtml_('동의 준비가 되지 않았습니다.');
  }
  props_().setProperty('NAVER_STATE', state);
  return ContentService.createTextOutput('ok');
}

function naverConsentStart_() {
  return naverHtml_('이 주소에서는 동의할 수 없습니다. 배송 화면의 네이버 동의 페이지를 여세요.');
}

function naverConsentFinish_(p) {
  var props = props_();
  var expected = props.getProperty('NAVER_STATE') || '';
  props.deleteProperty('NAVER_STATE');
  if (p.error) return naverHtml_('동의가 취소되었습니다.');
  if (!p.code || !p.state || !expected || p.state !== expected) return naverHtml_('동의 확인에 실패했습니다. 링크를 다시 열어 주세요.');
  var id = props.getProperty('NAVER_CLIENT_ID') || '';
  var secret = props.getProperty('NAVER_CLIENT_SECRET') || '';
  if (!id || !secret) return naverHtml_('Client ID가 스크립트 속성에 없습니다.');
  var res = UrlFetchApp.fetch('https://nid.naver.com/oauth2.0/token', {
    method: 'post',
    payload: {
      grant_type: 'authorization_code',
      client_id: id,
      client_secret: secret,
      code: String(p.code),
      state: String(p.state)
    },
    muteHttpExceptions: true
  });
  var body = {};
  try { body = JSON.parse(res.getContentText() || '{}'); } catch (e) { body = {}; }
  if (!body.access_token || !body.refresh_token) return naverHtml_('동의 저장에 실패했습니다. 링크를 다시 열어 주세요.');
  props.setProperty('NAVER_ACCESS_TOKEN', String(body.access_token));
  props.setProperty('NAVER_REFRESH_TOKEN', String(body.refresh_token));
  var sec = Number(body.expires_in || 3600);
  if (!sec || sec < 0) sec = 3600;
  props.setProperty('NAVER_EXPIRES_AT', String(Date.now() + sec * 1000));
  return naverHtml_('동의되었습니다.');
}

function naverHtml_(message) {
  return HtmlService.createHtmlOutput(
    '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>배송견적</title></head>'
    + '<body style="font:16px sans-serif;padding:24px"><p>' + naverEsc_(message) + '</p></body></html>'
  );
}

function naverEsc_(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function fail_(code, message) {
  var err = new Error(message);
  err.code = code;
  throw err;
}

function handle_(req) {
  var action = String(req.action || '');

  // 로그인 전에도 쓰는 요청
  if (action === 'status') return { ok: true, adminRegistered: adminRegistered_(), ownerRegistered: ownerRegistered_() };
  if (action === 'registerAdmin') return registerAdmin_(req);
  if (action === 'registerOwner') return registerOwner_(req);
  if (action === 'login') return login_(req);

  var role = verifyToken_(req.token);
  if (!role) fail_('auth', '로그인이 필요합니다.');

  var out;
  if (action === 'list') out = list_(role);
  else if (action === 'saveDraft') out = saveDraft_(role, req);
  else if (action === 'deleteDraft') out = deleteDraft_(role, req);
  else if (action === 'finalize') out = finalize_(req);
  else if (action === 'setStatus') out = setStatus_(req);
  else if (action === 'naverCalendar') out = naverCalendar_(req);
  else if (action === 'ownerAccount') {
    requireAdmin_(role);
    out = { account: ownerAccount_() };
  } else if (action === 'updateOwner') {
    requireAdmin_(role);
    out = updateOwner_(req);
  } else if (action === 'deleteOwner') {
    requireAdmin_(role);
    out = deleteOwner_();
  } else fail_('bad', '알 수 없는 요청입니다.');

  out.ok = true;
  out.role = role;
  out.token = issueToken_(role); // 쓸 때마다 24시간 연장
  return out;
}

function requireAdmin_(role, message) {
  if (role !== 'admin') fail_('forbidden', message || '팀장님만 할 수 있습니다.');
}

// ───────────────────────── 로그인 · 토큰 ─────────────────────────

function props_() {
  return PropertiesService.getScriptProperties();
}

function hashPw_(pw, salt) {
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(String(pw), String(salt)));
}

function adminRegistered_() {
  return !!props_().getProperty('ADMIN_HASH');
}

function ownerRegistered_() {
  var p = props_();
  return !!(p.getProperty('OWNER_ID') && p.getProperty('OWNER_PW'));
}

function checkPw_(pw, confirm) {
  pw = String(pw === null || pw === undefined ? '' : pw);
  if (pw.length < PW_MIN) fail_('bad', '비밀번호는 ' + PW_MIN + '글자 이상으로 해 주세요.');
  if (pw.length > 100) fail_('bad', '비밀번호가 너무 깁니다.');
  if (pw !== String(confirm === null || confirm === undefined ? '' : confirm)) fail_('bad', '비밀번호와 비밀번호 확인이 같지 않습니다.');
  return pw;
}

function checkOwnerId_(id) {
  id = String(id === null || id === undefined ? '' : id).trim();
  if (!id) fail_('bad', '아이디를 적어 주세요.');
  if (id.length > 30) fail_('bad', '아이디는 30글자 이하로 해 주세요.');
  if (/\s/.test(id)) fail_('bad', '아이디에는 띄어쓰기를 쓸 수 없습니다.');
  if (id.toLowerCase() === 'admin') fail_('bad', '이 아이디는 쓸 수 없습니다.');
  return id;
}

function bumpOwnerEpoch_() {
  var p = props_();
  p.setProperty('OWNER_EPOCH', String(Number(p.getProperty('OWNER_EPOCH') || 0) + 1));
}

// 관리자 등록: 관리자가 아직 없을 때만 된다. 아이디는 admin 으로 정해져 있다.
function registerAdmin_(req) {
  return withLock_(function () {
    if (adminRegistered_()) fail_('exists', '관리자가 이미 등록되어 있습니다.');
    var pw = checkPw_(req.password, req.confirm);
    var salt = Utilities.getUuid();
    var p = props_();
    p.setProperty('ADMIN_SALT', salt);
    p.setProperty('ADMIN_HASH', hashPw_(pw, salt));
    return { ok: true, role: 'admin', token: issueToken_('admin') };
  });
}

// 대표님 등록: 관리자가 등록된 뒤, 대표님 계정이 아직 없을 때만 된다.
function registerOwner_(req) {
  return withLock_(function () {
    if (!adminRegistered_()) fail_('setup', '먼저 관리자를 등록해 주세요.');
    if (ownerRegistered_()) fail_('exists', '대표님 계정이 이미 등록되어 있습니다.');
    var id = checkOwnerId_(req.id);
    var pw = checkPw_(req.password, req.confirm);
    var p = props_();
    p.setProperty('OWNER_ID', id);
    p.setProperty('OWNER_PW', pw);
    bumpOwnerEpoch_();
    return { ok: true, role: 'owner', token: issueToken_('owner') };
  });
}

function login_(req) {
  if (!adminRegistered_()) fail_('setup', '먼저 관리자를 등록해 주세요.');
  var cache = CacheService.getScriptCache();
  var fails = Number(cache.get('login_fails') || 0);
  if (fails >= 10) fail_('locked', '로그인 시도가 너무 많습니다. 10분 뒤에 다시 해 주세요.');

  var id = String(req.id || '').trim().toLowerCase();
  var pw = String(req.password || '');
  var p = props_();
  var role = null;
  if (id === 'admin') {
    if (safeEq_(hashPw_(pw, p.getProperty('ADMIN_SALT') || ''), p.getProperty('ADMIN_HASH') || '')) role = 'admin';
  } else if (ownerRegistered_() && safeEq_(id, String(p.getProperty('OWNER_ID')).toLowerCase())) {
    if (safeEq_(pw, p.getProperty('OWNER_PW'))) role = 'owner';
  }

  if (!role) {
    cache.put('login_fails', String(fails + 1), 600);
    Utilities.sleep(800);
    fail_('password', '아이디 또는 비밀번호가 맞지 않습니다.');
  }
  cache.remove('login_fails');
  return { ok: true, role: role, token: issueToken_(role) };
}

// 관리자 전용: 대표님 계정 보기·수정·삭제
function ownerAccount_() {
  var p = props_();
  if (!ownerRegistered_()) return { registered: false };
  return { registered: true, id: p.getProperty('OWNER_ID'), password: p.getProperty('OWNER_PW') };
}

function updateOwner_(req) {
  return withLock_(function () {
    var id = checkOwnerId_(req.id);
    var pw = checkPw_(req.password, req.confirm);
    var p = props_();
    p.setProperty('OWNER_ID', id);
    p.setProperty('OWNER_PW', pw);
    bumpOwnerEpoch_(); // 이미 로그인해 있던 대표님은 다시 로그인해야 한다.
    return { account: ownerAccount_() };
  });
}

function deleteOwner_() {
  return withLock_(function () {
    var p = props_();
    p.deleteProperty('OWNER_ID');
    p.deleteProperty('OWNER_PW');
    bumpOwnerEpoch_();
    return { account: ownerAccount_() };
  });
}

function safeEq_(a, b) {
  a = String(a);
  b = String(b);
  var diff = a.length ^ b.length;
  var n = Math.max(a.length, b.length);
  for (var i = 0; i < n; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

function tokenSecret_() {
  var props = PropertiesService.getScriptProperties();
  var s = props.getProperty('TOKEN_SECRET');
  if (!s) {
    s = Utilities.getUuid() + Utilities.getUuid();
    props.setProperty('TOKEN_SECRET', s);
  }
  return s;
}

function sign_(body) {
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(body, tokenSecret_()));
}

function epoch_(role) {
  return role === 'owner' ? String(props_().getProperty('OWNER_EPOCH') || '0') : 'a';
}

function issueToken_(role) {
  var exp = Date.now() + TOKEN_HOURS * 3600 * 1000;
  var body = role + '.' + epoch_(role) + '.' + exp;
  return body + '.' + sign_(body);
}

function verifyToken_(token) {
  if (!token) return null;
  var parts = String(token).split('.');
  if (parts.length !== 4) return null;
  var role = parts[0];
  if (role !== 'owner' && role !== 'admin') return null;
  var exp = Number(parts[2]);
  if (!exp || exp < Date.now()) return null;
  if (!safeEq_(parts[1], epoch_(role))) return null;
  if (!safeEq_(parts[3], sign_(role + '.' + parts[1] + '.' + exp))) return null;
  if (role === 'owner' && !ownerRegistered_()) return null;
  if (role === 'admin' && !adminRegistered_()) return null;
  return role;
}

// ───────────────────────── 시트 ─────────────────────────

function ss_() {
  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  var id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!id) fail_('config', '데이터 시트가 연결되지 않았습니다.');
  return SpreadsheetApp.openById(id);
}

function currentYear_() {
  return Number(Utilities.formatDate(new Date(), TZ, 'yyyy'));
}

function yearSheets_() {
  return ss_().getSheets().filter(function (sh) {
    return /^\d{4}$/.test(sh.getName());
  }).sort(function (a, b) {
    return Number(a.getName()) - Number(b.getName());
  });
}

function ensureYearSheet_(year) {
  var ss = ss_();
  var name = String(year);
  var sh = ss.getSheetByName(name);
  if (sh) return sh;
  sh = ss.insertSheet(name);
  setupYearSheet_(sh);
  return sh;
}

function setupYearSheet_(sh) {
  var n = COLUMNS.length;
  var groupRow = [];
  var headRow = [];
  var lastGroup = '';
  for (var i = 0; i < n; i++) {
    headRow.push(COLUMNS[i].head);
    groupRow.push(COLUMNS[i].group !== lastGroup ? COLUMNS[i].group : '');
    lastGroup = COLUMNS[i].group;
  }
  ensureCols_(sh, n);
  sh.getRange(1, 1, 1, n).setValues([groupRow]);
  sh.getRange(2, 1, 1, n).setValues([headRow]);
  formatYearSheet_(sh);
  lookSheet_(sh);
}

function writeHeaders_(sh) {
  var n = COLUMNS.length;
  var groupRow = [];
  var headRow = [];
  var lastGroup = '';
  for (var i = 0; i < n; i++) {
    headRow.push(COLUMNS[i].head);
    groupRow.push(COLUMNS[i].group !== lastGroup ? COLUMNS[i].group : '');
    lastGroup = COLUMNS[i].group;
  }
  ensureCols_(sh, n);
  sh.getRange(1, 1, 1, n).setValues([groupRow]);
  sh.getRange(2, 1, 1, n).setValues([headRow]);
}

// 색, 한 줄 높이, 차량유지비 칸 강조. 여러 번 실행해도 같은 결과가 된다.
function lookSheet_(sh) {
  try {
    var n = COLUMNS.length;
    var rows = Math.max(sh.getMaxRows(), 1000);
    if (sh.getMaxRows() < rows) sh.insertRowsAfter(sh.getMaxRows(), rows - sh.getMaxRows());
    for (var i = 0; i < n; i++) {
      sh.getRange(1, i + 1, 2, 1).setBackground(GROUP_COLORS[COLUMNS[i].group]).setFontWeight('bold');
    }
    var body = rows - DATA_START + 1;
    sh.getRange(DATA_START, 1, body, n).setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP).setVerticalAlignment('middle');
    sh.setRowHeightsForced(DATA_START, body, ROW_HEIGHT);
    var up = colIndex_('upkeep') + 1;
    sh.getRange(1, up, 2, 1).setBackground(UPKEEP_HEAD_COLOR);
    sh.getRange(DATA_START, up, body, 1).setBackground(UPKEEP_CELL_COLOR);
    sh.setColumnWidth(up, 170);
  } catch (err) {
    // 모양은 건너뛴다.
  }
}

// 모양 다듬기. 실패해도 저장에는 영향이 없도록 따로 감싼다.
function formatYearSheet_(sh) {
  try {
    var n = COLUMNS.length;
    var rows = Math.max(sh.getMaxRows(), 1000);
    if (sh.getMaxRows() < rows) sh.insertRowsAfter(sh.getMaxRows(), rows - sh.getMaxRows());
    sh.setFrozenRows(2);
    sh.setFrozenColumns(3);
    for (var i = 0; i < n; i++) {
      var col = COLUMNS[i];
      var color = GROUP_COLORS[col.group];
      sh.getRange(1, i + 1, 2, 1).setBackground(color).setFontWeight('bold');
      if (col.text) sh.getRange(DATA_START, i + 1, rows - DATA_START + 1, 1).setNumberFormat('@');
    }
    // 복기 칸 드롭다운 (확정 / 보류 / 취소)
    var reviewCol = colIndex_('review') + 1;
    var rule = SpreadsheetApp.newDataValidation().requireValueInList(['확정', '보류', '취소'], true).setAllowInvalid(false).build();
    sh.getRange(DATA_START, reviewCol, rows - DATA_START + 1, 1).setDataValidation(rule);
    // 금액 칸 묶기(접어 두기)
    var moneyFirst = colIndex_('labor11') + 1;
    var moneyLast = colIndex_('total13') + 1;
    sh.getRange(1, moneyFirst, 1, moneyLast - moneyFirst + 1).shiftColumnGroupDepth(1);
    sh.collapseAllColumnGroups();
  } catch (err) {
    // 모양 다듬기는 건너뛴다.
  }
}

function ensureCols_(sh, n) {
  if (sh.getMaxColumns() < n) sh.insertColumnsAfter(sh.getMaxColumns(), n - sh.getMaxColumns());
}

function ensureRows_(sh, row) {
  if (row > sh.getMaxRows()) sh.insertRowsAfter(sh.getMaxRows(), Math.max(200, row - sh.getMaxRows()));
}

function colIndex_(key) {
  for (var i = 0; i < COLUMNS.length; i++) if (COLUMNS[i].key === key) return i;
  return -1;
}

function ensureCustomerSheet_() {
  var ss = ss_();
  var sh = ss.getSheetByName(CUSTOMER_SHEET);
  if (!sh) {
    sh = ss.insertSheet(CUSTOMER_SHEET);
  }
  ensureCustomerHeaders_(sh);
  return sh;
}

// 헤더를 이름·소속·연락처·주소·메모로 맞춘다. 예전(주소 없음) 시트면 연락처 다음에 주소 칸을 끼운다.
function ensureCustomerHeaders_(sh) {
  ensureCols_(sh, CUSTOMER_HEADERS.length);
  var width = Math.max(sh.getLastColumn(), 1);
  var headers = sh.getRange(1, 1, 1, width).getValues()[0].map(function (v) { return String(v || ''); });
  var hasAddr = false;
  for (var i = 0; i < headers.length; i++) if (headers[i] === '주소') hasAddr = true;
  if (!hasAddr && headers[0] === '이름' && headers[3] === '메모') {
    try { sh.insertColumnAfter(3); } catch (err) { /* 건너뜀 */ }
  }
  ensureCols_(sh, CUSTOMER_HEADERS.length);
  sh.getRange(1, 1, 1, CUSTOMER_HEADERS.length).setValues([CUSTOMER_HEADERS]);
  try {
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, CUSTOMER_HEADERS.length).setFontWeight('bold').setBackground('#e3e6ea');
    sh.getRange(2, 1, Math.max(sh.getMaxRows() - 1, 1), CUSTOMER_HEADERS.length).setNumberFormat('@');
  } catch (err2) { /* 건너뜀 */ }
}

// 처음 한 번, 편집기에서 직접 실행하는 준비 함수
function setup() {
  ensureYearSheet_(currentYear_());
  ensureCustomerSheet_();
  yearSheets_().forEach(function (sh) { writeHeaders_(sh); lookSheet_(sh); }); // 여러 번 실행해도 안전하다.
  var filled = fillCustomerAddresses_();
  var renamed = renameWaitStatus_();
  var writingRenamed = renameWritingStatus();
  return {
    adminRegistered: adminRegistered_(),
    ownerRegistered: ownerRegistered_(),
    sheets: ss_().getSheets().map(function (s) { return s.getName(); }),
    customerAddressesUpdated: filled.updated,
    waitRenamed: renamed.renamed,
    writingRenamed: writingRenamed.renamed
  };
}

// 편집기에서 직접 실행: 시트에 남은 '견적대기'를 '견적의뢰'로 고친다.
function renameWaitStatus() {
  return renameWaitStatus_();
}

function renameWaitStatus_() {
  var col = colIndex_('status') + 1;
  var renamed = 0;
  yearSheets_().forEach(function (sh) {
    var last = sh.getLastRow();
    if (last < DATA_START) return;
    var vals = sh.getRange(DATA_START, col, last - DATA_START + 1, 1).getValues();
    for (var i = 0; i < vals.length; i++) {
      if (String(vals[i][0]) !== STATUS_WAIT_OLD) continue;
      sh.getRange(DATA_START + i, col).setValue(STATUS_WAIT);
      renamed++;
    }
  });
  return { renamed: renamed };
}

// 편집기에서 직접 실행: 상태 칸의 옛 이름과 기존 드롭다운만 바꾼다. 반복 실행해도 된다.
function renameWritingStatus() {
  return withLock_(function () {
    var col = colIndex_('status') + 1;
    var renamed = 0;
    var dropdownsUpdated = 0;
    yearSheets_().forEach(function (sh) {
      var height = sh.getMaxRows() - DATA_START + 1;
      if (height < 1) return;
      var statusRange = sh.getRange(DATA_START, col, height, 1);
      var rules = statusRange.getDataValidations();
      var changedRules = false;
      rules.forEach(function (rowRules) {
        var rule = rowRules[0];
        if (!rule) return;
        var criteria = rule.getCriteriaType();
        var args = rule.getCriteriaValues();
        var values;
        if (criteria === SpreadsheetApp.DataValidationCriteria.VALUE_IN_LIST) {
          values = args[0];
        } else if (criteria === SpreadsheetApp.DataValidationCriteria.VALUE_IN_RANGE) {
          values = [].concat.apply([], args[0].getValues());
        } else return;
        if (values.indexOf(STATUS_WRITING_OLD) < 0) return;
        // 범위형 드롭다운도 이 상태 칸의 목록만 바꾼다. 원본 범위는 고치지 않는다.
        var updated = values.map(canonStatus_).filter(function (v, index, all) {
          return v !== '' && all.indexOf(v) === index;
        });
        var next = rule.copy().requireValueInList(updated, args[1]).build();
        rowRules[0] = next;
        changedRules = true;
        dropdownsUpdated++;
      });
      if (changedRules) statusRange.setDataValidations(rules);
      var last = sh.getLastRow();
      if (last < DATA_START) return;
      var vals = sh.getRange(DATA_START, col, last - DATA_START + 1, 1).getValues();
      vals.forEach(function (row, i) {
        if (String(row[0]) !== STATUS_WRITING_OLD) return;
        sh.getRange(DATA_START + i, col).setValue(STATUS_WRITING);
        renamed++;
      });
    });
    return { renamed: renamed, dropdownsUpdated: dropdownsUpdated };
  });
}

function canonStatus_(st) {
  if (st === STATUS_WRITING_OLD || st === STATUS_WRITING) return STATUS_WRITING;
  if (st === STATUS_WAIT_OLD || st === STATUS_WAIT) return STATUS_WAIT;
  return st;
}

// 편집기에서 직접 실행: 연도 탭의 장소로 고객리스트 주소를 채운다.
function fillCustomerAddresses() {
  return fillCustomerAddresses_();
}

function fillCustomerAddresses_() {
  var sh = ensureCustomerSheet_();
  var byKey = {};
  yearSheets_().forEach(function (ys) {
    readRows_(ys).forEach(function (r) {
      if (!r.name || !r.place) return;
      byKey[String(r.name) + '\t' + String(r.org || '')] = String(r.place);
    });
  });
  var last = sh.getLastRow();
  var updated = 0;
  if (last < 2) return { updated: 0, known: Object.keys(byKey).length };
  var rows = sh.getRange(2, 1, last - 1, CUSTOMER_HEADERS.length).getValues();
  for (var i = 0; i < rows.length; i++) {
    var key = String(rows[i][0] || '') + '\t' + String(rows[i][1] || '');
    var place = byKey[key];
    if (!place) continue;
    if (String(rows[i][3] || '') === place) continue;
    var safe = place.charAt(0) === '=' ? "'" + place : place;
    sh.getRange(i + 2, 4, 1, 1).setValues([[safe]]);
    updated++;
  }
  return { updated: updated, known: Object.keys(byKey).length };
}

// ───────────────────────── 읽기 · 쓰기 ─────────────────────────

function toStr_(v) {
  if (v === null || v === undefined) return '';
  if (Object.prototype.toString.call(v) === '[object Date]') return Utilities.formatDate(v, TZ, 'yyyy-MM-dd');
  return String(v);
}

function rowToObj_(vals) {
  var o = {};
  for (var i = 0; i < COLUMNS.length; i++) {
    var c = COLUMNS[i];
    var v = vals[i];
    if (c.num) o[c.key] = (v === '' || v === null || v === undefined) ? '' : Number(v);
    else o[c.key] = c.key === 'status' ? canonStatus_(toStr_(v)) : toStr_(v);
  }
  return o;
}

function objToRow_(o) {
  return COLUMNS.map(function (c) {
    var v = o[c.key];
    if (v === undefined || v === null) return '';
    if (c.text && typeof v === 'string' && v.charAt(0) === '=') return "'" + v; // 수식으로 읽히지 않게
    return v;
  });
}

function readRows_(sh) {
  var last = sh.getLastRow();
  if (last < DATA_START) return [];
  var vals = sh.getRange(DATA_START, 1, last - DATA_START + 1, COLUMNS.length).getValues();
  var out = [];
  for (var i = 0; i < vals.length; i++) {
    if (!vals[i][0]) continue;
    out.push(rowToObj_(vals[i]));
  }
  return out;
}

function writeRow_(sh, row, obj) {
  ensureRows_(sh, row);
  sh.getRange(row, 1, 1, COLUMNS.length).setValues([objToRow_(obj)]);
  try {
    sh.getRange(row, 1, 1, COLUMNS.length).setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
    sh.setRowHeightsForced(row, 1, ROW_HEIGHT);
  } catch (err) { /* 높이 고정은 건너뛴다 */ }
}

function nextId_(sh, year) {
  var yy = String(year).slice(2);
  var last = sh.getLastRow();
  var max = 0;
  if (last >= DATA_START) {
    var ids = sh.getRange(DATA_START, 1, last - DATA_START + 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      var m = /^(\d{2})-(\d+)$/.exec(String(ids[i][0] || ''));
      if (m && m[1] === yy) max = Math.max(max, Number(m[2]));
    }
  }
  return yy + '-' + ('000' + (max + 1)).slice(-3);
}

function findRow_(id) {
  var m = /^(\d{2})-\d+$/.exec(String(id || ''));
  if (!m) return null;
  var sheets = [];
  var preferred = ss_().getSheetByName(String(2000 + Number(m[1])));
  if (preferred) sheets.push(preferred);
  yearSheets_().forEach(function (s) { if (s !== preferred) sheets.push(s); });
  for (var s = 0; s < sheets.length; s++) {
    var sh = sheets[s];
    var last = sh.getLastRow();
    if (last < DATA_START) continue;
    var ids = sh.getRange(DATA_START, 1, last - DATA_START + 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(id)) {
        var row = DATA_START + i;
        var vals = sh.getRange(row, 1, 1, COLUMNS.length).getValues()[0];
        return { sheet: sh, row: row, obj: rowToObj_(vals) };
      }
    }
  }
  return null;
}

function withLock_(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

// ───────────────────────── 동작 ─────────────────────────

function adminView_(r) {
  var o = {};
  COLUMNS.forEach(function (c) { o[c.key] = r[c.key]; });
  return o;
}

function countStatus_(rows) {
  var counts = { writing: 0, wait: 0, done: 0 };
  rows.forEach(function (r) {
    if (r.status === STATUS_DONE) counts.done++;
    else if (r.status === STATUS_WAIT) counts.wait++;
    else if (r.status === STATUS_WRITING) counts.writing++;
  });
  return counts;
}

function list_(role) {
  var rows = [];
  yearSheets_().forEach(function (sh) { rows = rows.concat(readRows_(sh)); });
  var out = rows.map(function (r) { return adminView_(r); });
  return { rows: out, counts: countStatus_(rows) };
}

function str_(v, max) {
  var s = String(v === null || v === undefined ? '' : v).replace(/\r\n?/g, '\n');
  return s.slice(0, max);
}

function line_(v, max) {
  return str_(v, max).replace(/\s+/g, ' ').trim();
}

function block_(v, max) {
  return str_(v, max).replace(/^\s*\n+/, '').replace(/\s+$/, '');
}

function timeText_(v, label) {
  var s = line_(v, 40);
  if (s && !/^\d{1,2}:\d{2}( ~ \d{1,2}:\d{2})?$/.test(s)) fail_('bad', label + ' 시간 형식이 맞지 않습니다.');
  return s;
}

function cleanDraft_(d, opts) {
  opts = opts || {};
  var loose = !!opts.loose; // 견적문의: 빈칸 허용
  var o = {};
  o.sang = d.sang === '예' ? '예' : '아니오';
  o.type = line_(d.type, 20);
  if (o.type) {
    if (TYPES.indexOf(o.type) < 0) fail_('bad', '종류를 목록에서 골라 주세요.');
  } else if (!loose) {
    fail_('bad', '종류를 목록에서 골라 주세요.');
  }
  o.name = line_(d.name, 100);
  if (!o.name && !loose) fail_('bad', '이름을 적어 주세요.');
  o.org = line_(d.org, 100);
  o.date = line_(d.date, 10);
  if (o.date && !/^\d{4}-\d{2}-\d{2}$/.test(o.date)) fail_('bad', '날짜 형식이 맞지 않습니다.');
  o.arrive = timeText_(d.arrive, '도착');
  o.eventTime = timeText_(d.eventTime, '행사');
  o.place = block_(d.place, 500);
  o.contactName = line_(d.contactName, 100);
  o.phone = line_(d.phone, 100);
  o.notes = block_(d.notes, 3000);
  return o;
}

function num_(v, label, required, allowZero) {
  if (v === '' || v === null || v === undefined) {
    if (required) fail_('bad', label + '을(를) 입력해 주세요.');
    return '';
  }
  var n = Number(v);
  if (!isFinite(n) || n < 0) fail_('bad', label + ' 값이 맞지 않습니다.');
  if (allowZero === false && n === 0) fail_('bad', label + '을(를) 입력해 주세요.');
  return n;
}

function cleanSpecs_(s) {
  var o = {};
  o.depart = timeText_(s.depart, '출발');
  o.km = num_(s.km, '편도거리', true);
  o.fuel = num_(s.fuel, '편도 연료비', true);
  var toll = num_(s.toll, '편도 통행료', false);
  o.toll = toll === '' ? 0 : toll;
  o.park = num_(s.park, '주차비', false);
  o.goMin = Math.round(num_(s.goMin, '도착소요시간', true, false));
  o.backMin = Math.round(num_(s.backMin, '복귀소요시간', true, false));
  return o;
}

function cleanCalc_(c) {
  var o = {};
  CALC_KEYS.forEach(function (k) {
    o[k] = Math.round(num_(c[k], '계산 금액', true));
  });
  return o;
}

function parseSaveStatus_(v) {
  var s = canonStatus_(String(v || ''));
  if (s === STATUS_WRITING || s === STATUS_WAIT) return s;
  fail_('bad', '저장 상태가 맞지 않습니다.');
}

function saveDraft_(role, req) {
  var status = parseSaveStatus_(req.status || STATUS_WAIT);
  var d = cleanDraft_(req.draft || {}, { loose: status === STATUS_WRITING });
  var id = req.id ? String(req.id) : '';
  return withLock_(function () {
    var sh, row, obj;
    if (id) {
      var loc = findRow_(id);
      if (!loc) fail_('notfound', '해당 건을 찾을 수 없습니다.');
      sh = loc.sheet;
      row = loc.row;
      obj = loc.obj;
    } else {
      sh = ensureYearSheet_(currentYear_());
      row = Math.max(sh.getLastRow() + 1, DATA_START);
      obj = {};
      obj.id = nextId_(sh, currentYear_());
    }
    DRAFT_KEYS.forEach(function (k) { obj[k] = d[k]; });
    obj.status = status;
    writeRow_(sh, row, obj);
    upsertCustomer_(d);
    return { row: adminView_(obj) };
  });
}

function deleteDraft_(role, req) {
  var id = String(req.id || '');
  if (!id) fail_('bad', '삭제할 건을 지정해 주세요.');
  return withLock_(function () {
    var loc = findRow_(id);
    if (!loc) fail_('notfound', '해당 건을 찾을 수 없습니다.');
    loc.sheet.deleteRow(loc.row);
    return { deletedId: id };
  });
}

function finalize_(req) {
  var id = String(req.id || '');
  var d = cleanDraft_(req.draft || {});
  var sp = cleanSpecs_(req.specs || {});
  var c = cleanCalc_(req.calc || {});
  var text = str_(req.text, 10000).replace(/\s+$/, '');
  if (!text) fail_('bad', '견적 글이 비어 있습니다.');
  return withLock_(function () {
    var loc = findRow_(id);
    if (!loc) fail_('notfound', '해당 건을 찾을 수 없습니다.');
    var obj = loc.obj; // 복기 등 시트에서만 고르는 값은 그대로 남는다.
    DRAFT_KEYS.forEach(function (k) { obj[k] = d[k]; });
    SPEC_KEYS.forEach(function (k) { obj[k] = sp[k]; });
    CALC_KEYS.forEach(function (k) { obj[k] = c[k]; });
    obj.text = text;
    obj.status = STATUS_DONE;
    writeRow_(loc.sheet, loc.row, obj);
    upsertCustomer_(d);
    return { row: adminView_(obj) };
  });
}

// 상태만 바꾼다. 제원·견적글·복기는 그대로 둔다. (완료↔의뢰/문의 되돌리기)
function setStatus_(req) {
  var id = String(req.id || '');
  var status = String(req.status || '');
  if (!id) fail_('bad', '건을 지정해 주세요.');
  status = canonStatus_(status);
  if (status !== STATUS_WRITING && status !== STATUS_WAIT && status !== STATUS_DONE) fail_('bad', '상태가 맞지 않습니다.');
  return withLock_(function () {
    var loc = findRow_(id);
    if (!loc) fail_('notfound', '해당 건을 찾을 수 없습니다.');
    loc.obj.status = status;
    writeRow_(loc.sheet, loc.row, loc.obj);
    return { row: adminView_(loc.obj) };
  });
}

// 고객리스트: 이름 + 소속이 같으면 같은 고객. 연락처·주소가 있으면 최신 값으로 고친다. 메모는 건드리지 않는다.
// 주소는 견적문의의 장소(place)를 그대로 넣는다.
function upsertCustomer_(d) {
  if (!d || !d.name) return; // 견적문의의 빈 이름은 고객목록에 넣지 않는다
  var sh = ensureCustomerSheet_();
  var last = sh.getLastRow();
  var rows = last >= 2 ? sh.getRange(2, 1, last - 1, CUSTOMER_HEADERS.length).getValues() : [];
  var safe = function (s) {
    s = String(s == null ? '' : s);
    return s.charAt(0) === '=' ? "'" + s : s;
  };
  var addr = String(d.place || '');
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][0]) === d.name && String(rows[i][1]) === d.org) {
      if (d.phone && String(rows[i][2]) !== d.phone) {
        sh.getRange(i + 2, 3, 1, 1).setValues([[safe(d.phone)]]);
      }
      if (addr && String(rows[i][3]) !== addr) {
        sh.getRange(i + 2, 4, 1, 1).setValues([[safe(addr)]]);
      }
      return;
    }
  }
  ensureRows_(sh, last + 1);
  sh.getRange(last + 1, 1, 1, CUSTOMER_HEADERS.length).setValues([[
    safe(d.name), safe(d.org || ''), safe(d.phone || ''), safe(addr), ''
  ]]);
}
