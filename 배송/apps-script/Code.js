/**
 * 배송견적 툴 — 구글 연결 다리 (Apps Script 웹앱)
 *
 * 화면(배송/index.html, GitHub Pages)이 이 웹앱에 요청을 보내면
 * 비밀번호를 확인하고 구글시트를 읽고 쓴다.
 *
 * 비밀번호는 코드에 적지 않는다. 스크립트 속성(프로젝트 설정 > 스크립트 속성)에만 둔다.
 *   PW_OWNER  대표님 비밀번호
 *   PW_ADMIN  팀장님(관리자) 비밀번호  (대표님 것과 달라야 한다)
 *   SHEET_ID  (시트에 묶이지 않은 스크립트일 때만) 데이터 구글시트의 ID
 *   TOKEN_SECRET 는 처음 로그인할 때 자동으로 만들어진다.
 *
 * 시트 구조
 *   연도 탭 '2026', '2027' …  한 탭에 그 해에 받은 주문 전부 (1행 묶음 이름, 2행 칸 이름, 3행부터 데이터)
 *   '고객리스트' 탭            이름 · 소속 · 연락처 · 메모
 *   '복기' 칸은 시트에서만 고른다(확정 / 보류 / 취소). 이 코드는 값을 지우지 않는다.
 *
 * 권한
 *   owner(대표님): 가안 저장, 견적대기 건의 가안 수정, 목록·최종 견적 글 보기
 *   admin(팀장님): 전부 + 제원 입력, 최종저장
 */

var TZ = 'Asia/Seoul';
var TOKEN_HOURS = 24;          // 마지막으로 쓴 때부터 24시간
var DATA_START = 3;            // 3행부터 데이터
var TYPES = ['배송', '배송세팅', '출장', '반출장', '픽업'];
var STATUS_WAIT = '견적대기';
var STATUS_DONE = '견적완료';
var CUSTOMER_SHEET = '고객리스트';
var CUSTOMER_HEADERS = ['이름', '소속', '연락처', '메모'];

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
  { key: 'upkeep',      head: '차량유지비',           group: '금액', num: true },
  { key: 'total11',     head: '합계11000',           group: '금액', num: true },
  { key: 'total12',     head: '합계12000',           group: '금액', num: true },
  { key: 'total13',     head: '합계13000',           group: '금액', num: true },
  { key: 'text',        head: '최종견적글',           group: '글', text: true }
];
var GROUP_COLORS = { '관리': '#e3e6ea', '가안': '#d6e4f7', '제원': '#d8f0dc', '금액': '#fbeccb', '글': '#ead9f2' };

var DRAFT_KEYS = ['sang', 'type', 'name', 'org', 'date', 'arrive', 'eventTime', 'place', 'contactName', 'phone', 'notes'];
var SPEC_KEYS = ['depart', 'km', 'fuel', 'toll', 'park', 'goMin', 'backMin'];
var CALC_KEYS = ['labor11', 'labor12', 'labor13', 'vehicle', 'fuelCost', 'tollTotal', 'upkeep', 'total11', 'total12', 'total13'];

// ───────────────────────── 요청 입구 ─────────────────────────

function doGet() {
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

function fail_(code, message) {
  var err = new Error(message);
  err.code = code;
  throw err;
}

function handle_(req) {
  var action = String(req.action || '');
  if (action === 'login') return login_(req);

  var role = verifyToken_(req.token);
  if (!role) fail_('auth', '로그인이 필요합니다.');

  var out;
  if (action === 'list') out = list_(role);
  else if (action === 'saveDraft') out = saveDraft_(role, req);
  else if (action === 'finalize') {
    if (role !== 'admin') fail_('forbidden', '제원은 팀장님만 입력할 수 있습니다.');
    out = finalize_(req);
  } else fail_('bad', '알 수 없는 요청입니다.');

  out.ok = true;
  out.role = role;
  out.token = issueToken_(role); // 쓸 때마다 24시간 연장
  return out;
}

// ───────────────────────── 로그인 · 토큰 ─────────────────────────

function login_(req) {
  var props = PropertiesService.getScriptProperties();
  var pwOwner = props.getProperty('PW_OWNER');
  var pwAdmin = props.getProperty('PW_ADMIN');
  if (!pwOwner || !pwAdmin) fail_('config', '비밀번호가 아직 설정되지 않았습니다.');
  if (pwOwner === pwAdmin) fail_('config', '대표님 비밀번호와 팀장님 비밀번호는 달라야 합니다.');

  var cache = CacheService.getScriptCache();
  var fails = Number(cache.get('login_fails') || 0);
  if (fails >= 10) fail_('locked', '로그인 시도가 너무 많습니다. 10분 뒤에 다시 해 주세요.');

  var pw = String(req.password || '');
  var role = null;
  if (safeEq_(pw, pwAdmin)) role = 'admin';
  else if (safeEq_(pw, pwOwner)) role = 'owner';

  if (!role) {
    cache.put('login_fails', String(fails + 1), 600);
    Utilities.sleep(800);
    fail_('password', '비밀번호가 맞지 않습니다.');
  }
  cache.remove('login_fails');
  return { ok: true, role: role, token: issueToken_(role) };
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

function issueToken_(role) {
  var exp = Date.now() + TOKEN_HOURS * 3600 * 1000;
  var body = role + '.' + exp;
  return body + '.' + sign_(body);
}

function verifyToken_(token) {
  if (!token) return null;
  var parts = String(token).split('.');
  if (parts.length !== 3) return null;
  var role = parts[0];
  if (role !== 'owner' && role !== 'admin') return null;
  var exp = Number(parts[1]);
  if (!exp || exp < Date.now()) return null;
  if (!safeEq_(parts[2], sign_(role + '.' + exp))) return null;
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
  if (sh) return sh;
  sh = ss.insertSheet(CUSTOMER_SHEET);
  ensureCols_(sh, CUSTOMER_HEADERS.length);
  sh.getRange(1, 1, 1, CUSTOMER_HEADERS.length).setValues([CUSTOMER_HEADERS]);
  try {
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, CUSTOMER_HEADERS.length).setFontWeight('bold').setBackground('#e3e6ea');
    sh.getRange(2, 1, Math.max(sh.getMaxRows() - 1, 1), CUSTOMER_HEADERS.length).setNumberFormat('@');
  } catch (err) { /* 건너뜀 */ }
  return sh;
}

// 처음 한 번, 편집기에서 직접 실행하는 준비 함수
function setup() {
  ensureYearSheet_(currentYear_());
  ensureCustomerSheet_();
  var props = PropertiesService.getScriptProperties();
  return {
    PW_OWNER: !!props.getProperty('PW_OWNER'),
    PW_ADMIN: !!props.getProperty('PW_ADMIN'),
    sheets: ss_().getSheets().map(function (s) { return s.getName(); })
  };
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
    else o[c.key] = toStr_(v);
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

function ownerView_(r) {
  var o = { id: r.id, status: r.status };
  DRAFT_KEYS.forEach(function (k) { o[k] = r[k]; });
  if (r.status === STATUS_DONE) o.text = r.text;
  return o;
}

function adminView_(r) {
  var o = {};
  COLUMNS.forEach(function (c) { o[c.key] = r[c.key]; });
  return o;
}

function list_(role) {
  var rows = [];
  yearSheets_().forEach(function (sh) { rows = rows.concat(readRows_(sh)); });
  var counts = { wait: 0, done: 0 };
  var out = rows.map(function (r) {
    if (r.status === STATUS_DONE) counts.done++;
    else counts.wait++;
    return role === 'admin' ? adminView_(r) : ownerView_(r);
  });
  return { rows: out, counts: counts };
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

function cleanDraft_(d) {
  var o = {};
  o.sang = d.sang === '예' ? '예' : '아니오';
  o.type = line_(d.type, 20);
  if (TYPES.indexOf(o.type) < 0) fail_('bad', '종류를 목록에서 골라 주세요.');
  o.name = line_(d.name, 100);
  if (!o.name) fail_('bad', '이름을 적어 주세요.');
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

function saveDraft_(role, req) {
  var d = cleanDraft_(req.draft || {});
  var id = req.id ? String(req.id) : '';
  return withLock_(function () {
    var sh, row, obj;
    if (id) {
      var loc = findRow_(id);
      if (!loc) fail_('notfound', '해당 건을 찾을 수 없습니다.');
      if (role === 'owner' && loc.obj.status !== STATUS_WAIT) {
        fail_('forbidden', '이미 견적이 완료된 건은 수정할 수 없습니다.');
      }
      sh = loc.sheet;
      row = loc.row;
      obj = loc.obj;
    } else {
      sh = ensureYearSheet_(currentYear_());
      row = Math.max(sh.getLastRow() + 1, DATA_START);
      obj = {};
      obj.id = nextId_(sh, currentYear_());
      obj.status = STATUS_WAIT;
    }
    DRAFT_KEYS.forEach(function (k) { obj[k] = d[k]; });
    writeRow_(sh, row, obj);
    upsertCustomer_(d);
    return { row: role === 'admin' ? adminView_(obj) : ownerView_(obj) };
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

// 고객리스트: 이름 + 소속이 같으면 같은 고객. 연락처가 있으면 최신 값으로 고친다. 메모는 건드리지 않는다.
function upsertCustomer_(d) {
  var sh = ensureCustomerSheet_();
  var last = sh.getLastRow();
  var rows = last >= 2 ? sh.getRange(2, 1, last - 1, CUSTOMER_HEADERS.length).getValues() : [];
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][0]) === d.name && String(rows[i][1]) === d.org) {
      if (d.phone && String(rows[i][2]) !== d.phone) {
        sh.getRange(i + 2, 3, 1, 1).setValues([[d.phone.charAt(0) === '=' ? "'" + d.phone : d.phone]]);
      }
      return;
    }
  }
  ensureRows_(sh, last + 1);
  var safe = function (s) { return s.charAt(0) === '=' ? "'" + s : s; };
  sh.getRange(last + 1, 1, 1, CUSTOMER_HEADERS.length).setValues([[safe(d.name), safe(d.org), safe(d.phone), '']]);
}
