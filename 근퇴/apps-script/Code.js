var SPREADSHEET_ID = "1WO7kMn7Hm5CACOj0WthlIpDA2KB-wHZ5bWwiJmPs7qk";
var WORK_SHEET = "근무기록(11월)";
var WORK_TITLE = "11월 근무기록";
var PLACES = ["코스트코", "원당시장", "팜스마트", "쁘렝땅", "원당화원", "이케아", "기타"];
var WORK_WIDTH = 13;
var SHARED_BOOK = null;

function sheetBook() {
  if (!SHARED_BOOK) {
    SHARED_BOOK = SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  return SHARED_BOOK;
}

function doGet() {
  return HtmlService.createHtmlOutputFromFile("Index")
    .setTitle("요술손 근무기록")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

function withSheetLock(work) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    return work();
  } finally {
    lock.releaseLock();
  }
}

function checkName(name) {
  return withSheetLock(function () {
    return checkNameUnlocked(name);
  });
}

function checkNameUnlocked(name) {
  prepareBase();
  var cleaned = cleanLabel(name);
  if (!cleaned) {
    return { ok: false, message: "이름을 입력해 주세요." };
  }
  var person = findPerson(cleaned);
  if (!person) {
    return { ok: true, needsRegister: true };
  }
  return { ok: true, needsSetup: !savedPassword(person.name) };
}

function registerStaff(name, password, confirm, dateText) {
  return withSheetLock(function () {
    return registerStaffUnlocked(name, password, confirm, dateText);
  });
}

function registerStaffUnlocked(name, password, confirm, dateText) {
  prepareBase();
  var cleaned = cleanLabel(name);
  if (!cleaned) {
    return { ok: false, message: "이름을 입력해 주세요." };
  }
  var pair = passwordPair(password, confirm);
  if (!pair.ok) {
    return pair;
  }
  var person = findPerson(cleaned);
  if (person && savedPassword(person.name)) {
    return { ok: false, message: "이미 등록된 이름입니다. 비밀번호로 들어가 주세요." };
  }
  if (!person) {
    sheetBook().getSheetByName("명단").appendRow([cleaned, "직원"]);
    person = { name: cleaned, role: "직원" };
  }
  var found = findLoginRow(person.name);
  writePassword(found.sheet, found.row, person.name, pair.code);
  clearCatalogCache();
  return dayPayload({ name: person.name, role: person.role || "직원" }, dateText);
}

function changePassword(name, currentPassword, nextPassword, confirm) {
  return withSheetLock(function () {
    return changePasswordUnlocked(name, currentPassword, nextPassword, confirm);
  });
}

function changePasswordUnlocked(name, currentPassword, nextPassword, confirm) {
  prepareBase();
  var person = findPerson(cleanLabel(name));
  if (!person) {
    return { ok: false, message: "명단에 없는 이름입니다." };
  }
  var saved = savedPassword(person.name);
  if (!saved || passwordText(currentPassword) !== saved) {
    return { ok: false, message: "지금 비밀번호가 다릅니다." };
  }
  var pair = passwordPair(nextPassword, confirm);
  if (!pair.ok) {
    return pair;
  }
  if (pair.code === saved) {
    return { ok: false, message: "새 비밀번호가 지금 비밀번호와 같습니다." };
  }
  var found = findLoginRow(person.name);
  writePassword(found.sheet, found.row, person.name, pair.code);
  return { ok: true, name: person.name, message: "비밀번호를 바꿨습니다." };
}

function passwordPair(password, confirm) {
  var code = passwordText(password);
  var again = passwordText(confirm);
  if (!isFourDigits(code) || !isFourDigits(again)) {
    return { ok: false, message: "숫자 4자리로 입력해 주세요. 0123처럼 0으로 시작해도 됩니다." };
  }
  if (code !== again) {
    return { ok: false, message: "비밀번호 확인이 새 비밀번호와 다릅니다." };
  }
  return { ok: true, code: code };
}

function createPassword(name, password, confirm) {
  return withSheetLock(function () {
    return createPasswordUnlocked(name, password, confirm);
  });
}

function createPasswordUnlocked(name, password, confirm) {
  prepareBase();
  var person = findPerson(name);
  if (!person) {
    return { ok: false, message: "명단에 없는 이름입니다." };
  }
  var found = findLoginRow(person.name);
  if (isFourDigits(found.password)) {
    return { ok: false, message: "이미 비밀번호가 있습니다. 비밀번호로 들어가 주세요." };
  }
  var pair = passwordPair(password, confirm);
  if (!pair.ok) {
    return pair;
  }
  writePassword(found.sheet, found.row, person.name, pair.code);
  return { ok: true, name: person.name, role: person.role };
}

function signIn(name, password) {
  return withSheetLock(function () {
    return signInUnlocked(name, password);
  });
}

function signInUnlocked(name, password) {
  prepareBase();
  var person = findPerson(name);
  if (!person) {
    return { ok: false, message: "등록된 이름이 아닙니다. 직원등록을 눌러 등록해 주세요." };
  }
  var saved = savedPassword(person.name);
  if (!saved) {
    return { ok: false, needsSetup: true, message: "먼저 비밀번호를 만들어 주세요." };
  }
  if (!isFourDigits(passwordText(password)) || passwordText(password) !== saved) {
    return { ok: false, message: "비밀번호가 다릅니다." };
  }
  return { ok: true, name: person.name, role: person.role };
}

function seoulToday() {
  return Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd");
}

function workNames(dateText) {
  return workNamesForDate(dateText, seoulToday());
}

function cacheGet(key) {
  try {
    return CacheService.getScriptCache().get(key);
  } catch (error) {
    return null;
  }
}

function cachePut(key, value, seconds) {
  try {
    CacheService.getScriptCache().put(key, value, seconds);
  } catch (error) {
  }
}

function prepareBase() {
  if (cacheGet("baseReady") === "1") {
    return;
  }
  normalizeLogin();
  ensurePlaces();
  cachePut("baseReady", "1", 300);
}

function loginWarm(dateText) {
  var names = workNames(dateText);
  return cacheGet("baseReady") === "1" &&
    cacheGet("tidy:" + names.sheet) === "1" &&
    cacheGet("sheetReady:" + names.sheet) === "1" &&
    cacheGet("catalogLists") &&
    cacheGet("peopleAuth");
}

function enterDay(name, password, dateText) {
  if (loginWarm(dateText)) {
    return enterDayUnlocked(name, password, dateText);
  }
  return withSheetLock(function () {
    return enterDayUnlocked(name, password, dateText);
  });
}

function clearPeopleCache() {
  try {
    CacheService.getScriptCache().remove("peopleAuth");
  } catch (error) {
  }
}

function peopleAuthMap() {
  var raw = cacheGet("peopleAuth");
  if (raw) {
    try {
      var parsed = JSON.parse(raw);
      if (parsed) {
        return parsed;
      }
    } catch (error) {
    }
  }
  var map = {};
  var rosterSheet = sheetBook().getSheetByName("명단");
  if (rosterSheet) {
    var roster = rosterSheet.getDataRange().getValues();
    for (var i = 1; i < roster.length; i++) {
      var rosterName = String(roster[i][0] || "").trim();
      if (!rosterName) {
        continue;
      }
      map[cleanLabel(rosterName)] = {
        name: rosterName,
        role: String(roster[i][1] || "").trim() || "직원",
        password: ""
      };
    }
  }
  var login = loginSheet().getDataRange().getValues();
  for (var row = 1; row < login.length; row++) {
    var key = cleanLabel(login[row][0]);
    if (!map[key]) {
      continue;
    }
    var code = passwordText(login[row][1]);
    map[key].password = isFourDigits(code) ? code : "";
  }
  cachePut("peopleAuth", JSON.stringify(map), 300);
  return map;
}

function enterDayUnlocked(name, password, dateText) {
  if (cacheGet("baseReady") !== "1") {
    prepareBase();
  }
  var person = peopleAuthMap()[cleanLabel(name)];
  if (!person) {
    return { ok: false, message: "등록된 이름이 아닙니다. 직원등록을 눌러 등록해 주세요." };
  }
  if (!person.password) {
    return { ok: false, needsSetup: true, message: "먼저 비밀번호를 만들어 주세요." };
  }
  if (!isFourDigits(passwordText(password)) || passwordText(password) !== person.password) {
    return { ok: false, message: "비밀번호가 다릅니다." };
  }
  return dayPayload(person, dateText);
}

function dayPayload(person, dateText) {
  var date = validDate(dateText) || seoulToday();
  var values = readReadyValues(date);
  var day = sortDay(dayFromRows(filterDayRows(values, person.name, date)));
  var role = person.role || "직원";
  var lists = loadCatalog();
  return {
    ok: true,
    name: person.name,
    role: role,
    people: role === "관리자" ? lists.people : [person.name],
    works: lists.works,
    vehicles: lists.vehicles,
    places: lists.places,
    date: date,
    day: day,
    copyText: renderDay(day, person.name, date)
  };
}

function clearCatalogCache() {
  try {
    CacheService.getScriptCache().remove("catalogLists");
  } catch (error) {
  }
}

function rememberCatalog(lists) {
  cachePut("catalogLists", JSON.stringify(lists), 300);
}

function loadCatalog() {
  var raw = cacheGet("catalogLists");
  if (raw) {
    try {
      var cached = JSON.parse(raw);
      if (cached && cached.people && cached.works && cached.vehicles && cached.places) {
        return cached;
      }
    } catch (error) {
    }
  }
  var lists = {
    people: listPeople(),
    works: columnList("업무"),
    vehicles: columnList("차량"),
    places: columnList("장보기장소")
  };
  rememberCatalog(lists);
  return lists;
}

function findPerson(name) {
  var cleaned = cleanLabel(name);
  if (!cleaned) {
    return null;
  }
  var values = sheetBook()
    .getSheetByName("명단")
    .getDataRange()
    .getValues();
  for (var i = 1; i < values.length; i++) {
    if (cleanLabel(values[i][0]) === cleaned) {
      return { name: String(values[i][0] || "").trim(), role: String(values[i][1] || "").trim() };
    }
  }
  return null;
}

function loginSheet() {
  var book = sheetBook();
  var sheet = book.getSheetByName("로그인");
  if (!sheet) {
    sheet = book.insertSheet("로그인");
    sheet.getRange(1, 1, 1, 2).setNumberFormat("@");
    sheet.getRange(1, 1, 1, 2).setValues([["이름", "비밀번호"]]);
  }
  return sheet;
}

function normalizeLogin() {
  var sheet = loginSheet();
  var values = sheet.getDataRange().getValues();
  if (!values.length) {
    sheet.getRange(1, 1, 1, 2).setValues([["이름", "비밀번호"]]);
    return;
  }
  if (String(values[0][1] || "").trim() !== "비밀번호") {
    sheet.getRange(1, 2).setValue("비밀번호");
  }
  var lastRow = Math.max(sheet.getLastRow(), 1);
  sheet.getRange(1, 2, lastRow, 1).setNumberFormat("@");
  for (var i = 1; i < values.length; i++) {
    var raw = values[i][1];
    var stored = passwordText(raw);
    var cell = sheet.getRange(i + 1, 2);
    if (stored) {
      if (typeof raw === "number" || String(raw) !== stored) {
        cell.setNumberFormat("@");
        cell.setValue(stored);
      }
    } else if (String(raw == null ? "" : raw).trim()) {
      cell.setValue("");
    }
  }
}

function findLoginRow(name) {
  var sheet = loginSheet();
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim() === name) {
      return {
        sheet: sheet,
        row: i + 1,
        password: passwordText(values[i][1])
      };
    }
  }
  return { sheet: sheet, row: 0, password: "" };
}

function savedPassword(name) {
  var found = findLoginRow(name);
  return isFourDigits(found.password) ? found.password : "";
}

function writePassword(sheet, row, name, password) {
  clearPeopleCache();
  var target = row > 0 ? row : sheet.getLastRow() + 1;
  var code = passwordText(password);
  sheet.getRange(target, 1).setNumberFormat("@").setValue(name);
  sheet.getRange(target, 2).setNumberFormat("@").setValue(code);
}

function noteLastMove(name) {
  try {
    var cleaned = String(name || "").trim();
    if (!cleaned) {
      return;
    }
    var sheet = loginSheet();
    var values = sheet.getDataRange().getValues();
    var row = 0;
    for (var i = 1; i < values.length; i++) {
      if (String(values[i][0] || "").trim() === cleaned) {
        row = i + 1;
        break;
      }
    }
    if (!row) {
      return;
    }
    if (String(values[0][2] || "").trim() !== "마지막 움직임") {
      sheet.getRange(1, 3).setNumberFormat("@").setValue("마지막 움직임");
    }
    var stamp = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm");
    sheet.getRange(row, 3).setNumberFormat("@").setValue(stamp);
  } catch (error) {
  }
}

function attendanceNames(dateText) {
  return attendanceNamesForDate(dateText, seoulToday());
}

function attendanceBuiltKey(sheetName) {
  return "attendanceBuilt:" + sheetName;
}

function syncAttendance(dateText) {
  try {
    ensureLiveAttendance(dateText);
  } catch (error) {
  }
}

function buildThisMonthAttendance() {
  return withSheetLock(function () {
    var date = seoulToday();
    ensureLiveAttendance(date);
    SpreadsheetApp.flush();
    var sheet = sheetBook().getSheetByName(attendanceNames(date).sheet);
    var grid = sheet.getRange(3, 1, 40, 6).getDisplayValues();
    var days = 0;
    var summaries = 0;
    var problem = "";
    for (var i = 0; i < grid.length; i++) {
      var name = String(grid[i][0] || "");
      var label = String(grid[i][1] || "");
      if (!problem && name.indexOf("#") === 0) {
        problem = name;
      }
      if (!problem && label.indexOf("#") === 0) {
        problem = label;
      }
      if (!name) {
        continue;
      }
      if (label === "합계") {
        summaries++;
      } else {
        days++;
      }
    }
    return "days " + days + " summaries " + summaries + " problem " + problem;
  });
}

function attendanceSheet(dateText) {
  var names = attendanceNames(dateText);
  var book = sheetBook();
  var sheet = book.getSheetByName(names.sheet);
  if (!sheet) {
    sheet = book.insertSheet(names.sheet);
    applyAttendanceChrome(sheet, names.title);
    placeAttendanceSheet(sheet, dateText);
  }
  return sheet;
}

function placeAttendanceSheet(sheet, dateText) {
  var work = sheetBook().getSheetByName(workNames(dateText).sheet);
  if (!work) {
    return;
  }
  var wanted = work.getIndex() + 1;
  if (sheet.getIndex() === wanted) {
    return;
  }
  sheet.activate();
  sheetBook().moveActiveSheet(wanted);
}

function ensureLiveAttendance(dateText) {
  var names = attendanceNames(dateText);
  var sheet = attendanceSheet(dateText);
  if (String(sheet.getRange(1, 1).getValue() || "").trim() !== names.title || String(sheet.getRange(2, 1).getValue() || "").trim() !== "이름") {
    applyAttendanceChrome(sheet, names.title);
  }
  var formula = attendanceLiveFormula(workNames(dateText).sheet);
  if (String(sheet.getRange(3, 1).getFormula() || "") === formula) {
    applyAttendanceSummaryFormat(sheet);
    return;
  }
  var lastRow = Math.max(sheet.getLastRow(), 3);
  var lastCol = Math.max(sheet.getLastColumn(), 8);
  sheet.getRange(3, 1, Math.max(lastRow - 2, 1), lastCol).clearContent();
  sheet.getRange(3, 1).setFormula(formula);
  applyAttendanceSummaryFormat(sheet);
}

function applyAttendanceSummaryFormat(sheet) {
  var rule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$B3="합계"')
    .setBackground("#f4efe4")
    .setFontColor("#1d1c19")
    .setBold(true)
    .setRanges([sheet.getRange("A3:F1000")])
    .build();
  sheet.setConditionalFormatRules([rule]);
}

function applyAttendanceChrome(sheet, titleText) {
  var book = sheet.getParent();
  try {
    if (book.getSpreadsheetTimeZone() !== "Asia/Seoul") {
      book.setSpreadsheetTimeZone("Asia/Seoul");
    }
  } catch (error) {
  }
  if (sheet.getMaxColumns() < 8) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), 8 - sheet.getMaxColumns());
  }
  var title = sheet.getRange(1, 1, 1, 6);
  if (title.isPartOfMerge()) {
    title.breakApart();
  }
  title.merge();
  title.setNumberFormat("@");
  title.setValue(titleText);
  title.setFontSize(30);
  title.setFontWeight("bold");
  title.setFontColor("#1d1c19");
  title.setHorizontalAlignment("center");
  title.setVerticalAlignment("middle");
  title.setBackground("#f4efe4");
  sheet.setRowHeight(1, 54);
  sheet.getRange(2, 1, 1, 8).setNumberFormat("@");
  sheet.getRange(2, 1, 1, 8).setValues([["이름", "날짜", "출근", "퇴근", "총근무시간", "상태", "분", "상태값"]]);
  var shown = sheet.getRange(2, 1, 1, 6);
  shown.setFontWeight("bold");
  shown.setFontSize(13);
  shown.setFontColor("#1a241c");
  shown.setBackground("#d7c39a");
  shown.setHorizontalAlignment("center");
  shown.setVerticalAlignment("middle");
  shown.setBorder(false, false, true, false, false, false, "#1d1c19", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  sheet.setRowHeight(2, 36);
  sheet.setColumnWidth(1, 120);
  sheet.setColumnWidth(2, 120);
  sheet.setColumnWidth(3, 110);
  sheet.setColumnWidth(4, 110);
  sheet.setColumnWidth(5, 150);
  sheet.setColumnWidth(6, 250);
  sheet.hideColumns(7, 2);
  sheet.setFrozenRows(2);
}

function writeAttendanceBook(sheet, title, blocks) {
  if (String(sheet.getRange(1, 1).getValue() || "").trim() !== title || String(sheet.getRange(2, 1).getValue() || "").trim() !== "이름") {
    applyAttendanceChrome(sheet, title);
  }
  var table = attendanceTable(blocks);
  var oldLast = sheet.getLastRow();
  if (!table.length) {
    if (oldLast > 2) {
      sheet.getRange(3, 1, oldLast - 2, 8).clearContent();
    }
    return;
  }
  var values = table.map(function (row) {
    if (row.kind === "summary") {
      return [row.name, "합계", "", "", "", "", ""];
    }
    return [row.name, row.date, row.clockIn, row.clockOut, row.total, "", row.minutes];
  });
  var statusFormulas = table.map(function (row, index) {
    var sheetRow = 3 + index;
    if (row.kind === "summary") {
      return [attendanceSummaryStatusFormula(sheetRow)];
    }
    return [attendanceStatusFormula(sheetRow)];
  });
  sheet.getRange(3, 1, values.length, 6).setNumberFormat("@");
  sheet.getRange(3, 7, values.length, 1).setNumberFormat("0");
  sheet.getRange(3, 1, values.length, 7).setValues(values);
  sheet.getRange(3, 6, statusFormulas.length, 1).setFormulas(statusFormulas);
  var countFormulas = table.map(function (row, index) {
    return [attendanceStatusFormula(3 + index)];
  });
  sheet.getRange(3, 8, countFormulas.length, 1).setFormulas(countFormulas);
  var body = sheet.getRange(3, 1, values.length, 6);
  body.setBackground("#ffffff");
  body.setFontColor("#1d1c19");
  body.setFontSize(11);
  body.setFontWeight("normal");
  body.setVerticalAlignment("middle");
  for (var i = 0; i < table.length; i++) {
    if (table[i].kind !== "summary") {
      continue;
    }
    var summaryRow = 3 + i;
    sheet.getRange(summaryRow, 5).setFormula(attendanceSummaryHoursFormula(summaryRow));
    sheet.getRange(summaryRow, 7).clearContent();
    sheet.getRange(summaryRow, 8).clearContent();
    styleAttendanceSummary(sheet, summaryRow);
  }
  var endRow = 2 + values.length;
  if (oldLast > endRow) {
    var extra = sheet.getRange(endRow + 1, 1, oldLast - endRow, 8);
    extra.clearContent();
    extra.setBackground("#ffffff");
    extra.setFontWeight("normal");
    extra.setBorder(false, false, false, false, false, false);
  }
}

function styleAttendanceSummary(sheet, row) {
  var range = sheet.getRange(row, 1, 1, 6);
  range.setBackground("#f4efe4");
  range.setFontWeight("bold");
  range.setFontColor("#1d1c19");
  range.setFontSize(11);
  range.setBorder(false, false, true, false, false, false, "#1d1c19", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
}

function styleAttendanceDay(sheet, row) {
  var range = sheet.getRange(row, 1, 1, 6);
  range.setBackground("#ffffff");
  range.setFontWeight("normal");
  range.setFontColor("#1d1c19");
  range.setFontSize(11);
  range.setBorder(false, false, false, false, false, false);
}

function writeAttendanceDay(sheet, row, fields) {
  sheet.getRange(row, 1, 1, 5).setNumberFormat("@");
  sheet.getRange(row, 1, 1, 5).setValues([[fields.name, fields.date, fields.clockIn, fields.clockOut, fields.total]]);
  sheet.getRange(row, 7).setNumberFormat("0").setValue(fields.minutes);
  sheet.getRange(row, 6).setFormula(attendanceStatusFormula(row));
  sheet.getRange(row, 8).setFormula(attendanceStatusFormula(row));
  styleAttendanceDay(sheet, row);
}

function writeAttendanceSummary(sheet, row, personName) {
  sheet.getRange(row, 1, 1, 4).setNumberFormat("@");
  sheet.getRange(row, 1, 1, 4).setValues([[personName, "합계", "", ""]]);
  sheet.getRange(row, 5).setFormula(attendanceSummaryHoursFormula(row));
  sheet.getRange(row, 6).setFormula(attendanceSummaryStatusFormula(row));
  sheet.getRange(row, 7).clearContent();
  sheet.getRange(row, 8).clearContent();
  styleAttendanceSummary(sheet, row);
}

function upsertAttendanceDay(sheet, personName, dateText, block) {
  var last = Math.max(sheet.getLastRow(), 2);
  var grid = sheet.getRange(1, 1, last, 2).getValues();
  var summaryRow = 0;
  var dayRow = 0;
  var dayRows = [];
  for (var i = 2; i < grid.length; i++) {
    if (String(grid[i][0] || "").trim() !== personName) {
      continue;
    }
    var label = dateCellToText(grid[i][1]);
    if (label === "합계") {
      summaryRow = i + 1;
    } else if (label === dateText) {
      dayRow = i + 1;
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(label)) {
      dayRows.push({ row: i + 1, date: label });
    }
  }
  if (!block) {
    removeAttendanceDay(sheet, dayRow, summaryRow, dayRows.length);
    return;
  }
  var fields = attendanceDay(block);
  if (!summaryRow) {
    var at = sheet.getLastRow() + 1;
    writeAttendanceDay(sheet, at, fields);
    writeAttendanceSummary(sheet, at + 1, personName);
    return;
  }
  if (dayRow) {
    writeAttendanceDay(sheet, dayRow, fields);
    return;
  }
  var insertAt = summaryRow;
  for (var d = 0; d < dayRows.length; d++) {
    if (dayRows[d].date > dateText) {
      insertAt = dayRows[d].row;
      break;
    }
  }
  sheet.insertRowBefore(insertAt);
  writeAttendanceDay(sheet, insertAt, fields);
  styleAttendanceSummary(sheet, summaryRow + 1);
}

function removeAttendanceDay(sheet, dayRow, summaryRow, dayCount) {
  if (!dayRow) {
    return;
  }
  sheet.deleteRow(dayRow);
  var summary = summaryRow;
  if (summary && dayRow < summary) {
    summary -= 1;
  }
  if (summary && dayCount < 1) {
    sheet.deleteRow(summary);
    return;
  }
  if (summary) {
    styleAttendanceSummary(sheet, summary);
  }
}

function ensurePlaces() {
  var book = sheetBook();
  var sheet = book.getSheetByName("장보기장소");
  if (!sheet) {
    sheet = book.insertSheet("장보기장소");
  }
  var values = sheet.getDataRange().getValues();
  var have = [];
  for (var i = 1; i < values.length; i++) {
    var name = String(values[i][0] || "").trim();
    if (name && have.indexOf(name) < 0) {
      have.push(name);
    }
  }
  var ordered = [];
  PLACES.forEach(function (place) {
    if (ordered.indexOf(place) < 0) {
      ordered.push(place);
    }
  });
  have.forEach(function (place) {
    if (ordered.indexOf(place) >= 0) {
      return;
    }
    var otherAt = ordered.indexOf("기타");
    if (otherAt >= 0) {
      ordered.splice(otherAt, 0, place);
    } else {
      ordered.push(place);
    }
  });
  var current = [];
  for (var j = 1; j < values.length; j++) {
    current.push(String(values[j][0] || "").trim());
  }
  if (current.join("\n") === ordered.join("\n")) {
    return;
  }
  var rows = ordered.map(function (place) {
    return [place];
  });
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).clearContent();
  }
  if (rows.length) {
    sheet.getRange(2, 1, rows.length, 1).setValues(rows);
  }
  clearCatalogCache();
}

function isFourDigits(value) {
  return /^\d{4}$/.test(String(value || ""));
}

function listCatalog(name, password) {
  return withSheetLock(function () {
    return listCatalogUnlocked(name, password);
  });
}

function listCatalogUnlocked(name, password) {
  var actor = requireActor(name, password);
  if (!actor) {
    return { ok: false, message: "다시 로그인해 주세요." };
  }
  var lists = loadCatalog();
  return {
    ok: true,
    role: actor.role,
    people: actor.role === "관리자" ? lists.people : [actor.name],
    works: lists.works,
    vehicles: lists.vehicles,
    places: lists.places
  };
}

function loadDay(name, password, subjectName, dateText) {
  return withSheetLock(function () {
    return loadDayUnlocked(name, password, subjectName, dateText);
  });
}

function loadDayUnlocked(name, password, subjectName, dateText) {
  try {
    var actor = requireActor(name, password);
    if (!actor) {
      return { ok: false, message: "다시 로그인해 주세요." };
    }
    var subject = resolveSubject(actor, subjectName);
    if (!subject) {
      return { ok: false, message: "이 기록은 볼 수 없습니다." };
    }
    var date = validDate(dateText);
    if (!date) {
      return { ok: false, message: "날짜를 확인해 주세요." };
    }
    var values = readReadyValues(date);
    var day = sortDay(dayFromRows(filterDayRows(values, subject.name, date)));
    return {
      ok: true,
      name: subject.name,
      date: date,
      day: day,
      copyText: renderDay(day, subject.name, date)
    };
  } catch (error) {
    return { ok: false, message: "기록을 불러오지 못했습니다. 다시 시도해 주세요." };
  }
}

function saveDay(name, password, subjectName, dateText, day) {
  return withSheetLock(function () {
    return saveDayUnlocked(name, password, subjectName, dateText, day);
  });
}

function saveDayUnlocked(name, password, subjectName, dateText, day) {
  try {
    var actor = requireActor(name, password);
    if (!actor) {
      return { ok: false, message: "다시 로그인해 주세요." };
    }
    var subject = resolveSubject(actor, subjectName);
    if (!subject) {
      return { ok: false, message: "이 기록은 저장할 수 없습니다." };
    }
    var date = validDate(dateText);
    if (!date) {
      return { ok: false, message: "날짜를 확인해 주세요." };
    }
    var clean = sortDay(day);
    var values = readReadyValues(date);
    var next = mergeDayRows(values, subject.name, date, rowsFromDay(subject.name, date, clean));
    writeWorkValues(next, date);
    cachePut("tidy:" + workNames(date).sheet, "1", 300);
    noteLastMove(actor.name);
    syncAttendance(date, subject.name, next);
    return {
      ok: true,
      name: subject.name,
      date: date,
      day: clean,
      copyText: renderDay(clean, subject.name, date)
    };
  } catch (error) {
    return { ok: false, message: "저장되지 않았습니다. 다시 시도해 주세요." };
  }
}

function requireActor(name, password) {
  prepareBase();
  var person = findPerson(name);
  if (!person) {
    return null;
  }
  var saved = savedPassword(person.name);
  if (!saved || saved !== passwordText(password)) {
    return null;
  }
  return person;
}

function resolveSubject(actor, subjectName) {
  var wanted = String(subjectName || "").trim() || actor.name;
  if (wanted === actor.name) {
    return actor;
  }
  if (actor.role !== "관리자") {
    return null;
  }
  return findPerson(wanted);
}

function addPlace(name, password, place) {
  return withSheetLock(function () {
    return addPlaceUnlocked(name, password, place);
  });
}

function addVehicle(name, password, vehicle) {
  return withSheetLock(function () {
    return addVehicleUnlocked(name, password, vehicle);
  });
}

function addStaff(name, password, staffName) {
  return withSheetLock(function () {
    return addStaffUnlocked(name, password, staffName);
  });
}

function setStaffPassword(name, password, staffName, nextPassword, confirm) {
  return withSheetLock(function () {
    return setStaffPasswordUnlocked(name, password, staffName, nextPassword, confirm);
  });
}

function addPlaceUnlocked(name, password, place) {
  var admin = requireAdmin(name, password);
  if (!admin.ok) {
    return admin;
  }
  var cleaned = cleanLabel(place);
  if (!cleaned) {
    return { ok: false, message: "장보기 장소 이름을 입력해 주세요." };
  }
  if (columnList("장보기장소").indexOf(cleaned) >= 0) {
    return { ok: false, message: "이미 있는 장보기 장소입니다." };
  }
  listSheet("장보기장소").appendRow([cleaned]);
  ensurePlaces();
  return catalogBody("장보기 장소에 넣었습니다. " + cleaned);
}

function addVehicleUnlocked(name, password, vehicle) {
  var admin = requireAdmin(name, password);
  if (!admin.ok) {
    return admin;
  }
  var cleaned = cleanLabel(vehicle);
  if (!cleaned) {
    return { ok: false, message: "차량 이름을 입력해 주세요." };
  }
  if (columnList("차량").indexOf(cleaned) >= 0) {
    return { ok: false, message: "이미 있는 차량입니다." };
  }
  listSheet("차량").appendRow([cleaned]);
  return catalogBody("차량에 넣었습니다. " + cleaned);
}

function addStaffUnlocked(name, password, staffName) {
  var admin = requireAdmin(name, password);
  if (!admin.ok) {
    return admin;
  }
  var cleaned = cleanLabel(staffName);
  if (!cleaned) {
    return { ok: false, message: "직원 이름을 입력해 주세요." };
  }
  if (findPerson(cleaned)) {
    return { ok: false, message: "이미 명단에 있는 이름입니다." };
  }
  var sheet = sheetBook().getSheetByName("명단");
  sheet.appendRow([cleaned, "직원"]);
  clearPeopleCache();
  var body = catalogBody("명단에 넣었습니다. " + cleaned);
  body.added = cleaned;
  return body;
}

function setStaffPasswordUnlocked(name, password, staffName, nextPassword, confirm) {
  var admin = requireAdmin(name, password);
  if (!admin.ok) {
    return admin;
  }
  var person = findPerson(cleanLabel(staffName));
  if (!person) {
    return { ok: false, message: "명단에 없는 이름입니다. 먼저 직원 이름을 넣어 주세요." };
  }
  var pair = passwordPair(nextPassword, confirm);
  if (!pair.ok) {
    return pair;
  }
  var found = findLoginRow(person.name);
  writePassword(found.sheet, found.row, person.name, pair.code);
  var body = catalogBody(withNim(person.name) + " 비밀번호를 저장했습니다.");
  body.passwordFor = person.name;
  return body;
}

function requireAdmin(name, password) {
  var actor = requireActor(name, password);
  if (!actor) {
    return { ok: false, message: "다시 로그인해 주세요." };
  }
  if (actor.role !== "관리자") {
    return { ok: false, message: "이 화면은 팀장님만 쓸 수 있습니다." };
  }
  return { ok: true, actor: actor };
}

function catalogBody(message) {
  clearCatalogCache();
  var lists = loadCatalog();
  return {
    ok: true,
    message: message,
    people: lists.people,
    places: lists.places,
    vehicles: lists.vehicles
  };
}

function cleanLabel(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function listSheet(sheetName) {
  var book = sheetBook();
  var sheet = book.getSheetByName(sheetName);
  if (!sheet) {
    sheet = book.insertSheet(sheetName);
    sheet.getRange(1, 1).setValue(sheetName);
  }
  return sheet;
}

function listPeople() {
  var values = sheetBook()
    .getSheetByName("명단")
    .getDataRange()
    .getValues();
  var names = [];
  for (var i = 1; i < values.length; i++) {
    var name = String(values[i][0] || "").trim();
    if (name) {
      names.push(name);
    }
  }
  return names;
}

function columnList(sheetName) {
  var sheet = sheetBook().getSheetByName(sheetName);
  if (!sheet) {
    return [];
  }
  var values = sheet.getDataRange().getValues();
  var items = [];
  for (var i = 1; i < values.length; i++) {
    var item = String(values[i][0] || "").trim();
    if (item) {
      items.push(item);
    }
  }
  return items;
}

function workSheet(dateText) {
  var names = workNames(dateText);
  var book = sheetBook();
  var sheet = book.getSheetByName(names.sheet);
  var created = false;
  if (!sheet) {
    if (names.sheet === "근무기록(11월)") {
      var oldSheet = book.getSheetByName("근무기록");
      if (oldSheet) {
        oldSheet.setName(names.sheet);
        sheet = oldSheet;
      }
    }
    if (!sheet) {
      sheet = book.insertSheet(names.sheet);
      sheet.getRange(1, 1, 1, WORK_WIDTH).setNumberFormat("@");
      sheet.getRange(1, 1, 1, WORK_WIDTH).setValues([WORK_HEADER.slice()]);
      created = true;
    }
  }
  var columnsChanged = ensureWorkColumns(sheet, names.title);
  var titleChanged = ensureTitleRow(sheet, names.title);
  var styleKey = "workStyle:" + names.sheet;
  var props = PropertiesService.getScriptProperties();
  var styled = props.getProperty(styleKey) === "lines-v1";
  if (created || columnsChanged || titleChanged || !styled) {
    applyWorkStyle(sheet, names.title);
    props.setProperty(styleKey, "lines-v1");
  }
  cachePut("sheetReady:" + names.sheet, "1", 300);
  return sheet;
}

function headerRowIndex(sheet, title) {
  var first = String(sheet.getRange(1, 1).getValue() || "").trim();
  return first === title ? 2 : 1;
}

function ensureWorkColumns(sheet, title) {
  var row = headerRowIndex(sheet, title);
  var lastColumn = Math.max(sheet.getLastColumn(), 1);
  var header = sheet.getRange(row, 1, 1, lastColumn).getValues()[0];
  var labels = header.map(function (cell) {
    return String(cell || "").trim();
  });
  if (labels.indexOf("총근무시간") >= 0) {
    return false;
  }
  var clockOutAt = labels.indexOf("퇴근");
  var insertAfter = clockOutAt >= 0 ? clockOutAt + 1 : 4;
  sheet.insertColumnAfter(insertAfter);
  var headerCell = sheet.getRange(row, insertAfter + 1);
  sheet.getRange(row, insertAfter).copyTo(headerCell, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
  headerCell.setValue("총근무시간");
  sheet.getRange(row, insertAfter + 1, Math.max(sheet.getLastRow(), 1), 1).setNumberFormat("@");
  return true;
}

function ensureTitleRow(sheet, title) {
  var first = String(sheet.getRange(1, 1).getValue() || "").trim();
  if (first === title) {
    return false;
  }
  sheet.insertRowBefore(1);
  sheet.getRange(1, 1).setValue(title);
  return true;
}

function applyWorkStyle(sheet, titleText) {
  var titleSize = 30;
  var title = sheet.getRange(1, 1, 1, WORK_WIDTH);
  if (title.isPartOfMerge()) {
    title.breakApart();
  }
  title.merge();
  title.setNumberFormat("@");
  title.setValue(titleText);
  title.setFontSize(titleSize);
  title.setFontWeight("bold");
  title.setFontColor("#1d1c19");
  title.setHorizontalAlignment("center");
  title.setVerticalAlignment("middle");
  title.setBackground("#f4efe4");
  sheet.setRowHeight(1, Math.max(48, Math.round(titleSize * 1.8)));
  var header = sheet.getRange(2, 1, 1, WORK_WIDTH);
  header.setFontWeight("bold");
  header.setFontSize(13);
  header.setFontColor("#1a241c");
  header.setBackground("#d7c39a");
  header.setHorizontalAlignment("center");
  header.setVerticalAlignment("middle");
  header.setBorder(false, false, true, false, false, false, "#1d1c19", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  sheet.setRowHeight(2, 36);
  paintExistingRows(sheet);
}

function valuesFromData(sheet, title) {
  var all = sheet.getDataRange().getValues();
  var start = 0;
  if (all.length && String(all[0][0] || "").trim() === title) {
    start = 1;
  }
  var rows = [];
  for (var i = start; i < all.length; i++) {
    var source = all[i] || [];
    var row = [];
    for (var column = 0; column < WORK_WIDTH; column++) {
      row.push(column < source.length && source[column] != null ? source[column] : "");
    }
    rows.push(row);
  }
  if (!rows.length) {
    rows.push(WORK_HEADER.slice());
  }
  return rows;
}

function readWorkValues(dateText) {
  var names = workNames(dateText);
  if (cacheGet("sheetReady:" + names.sheet) === "1" && cacheGet("tidy:" + names.sheet) === "1") {
    var readySheet = sheetBook().getSheetByName(names.sheet);
    if (readySheet) {
      return valuesFromData(readySheet, names.title);
    }
  }
  var sheet = workSheet(dateText);
  var lastRow = Math.max(sheet.getLastRow(), 2);
  return sheet.getRange(2, 1, lastRow - 1, WORK_WIDTH).getValues();
}

function readReadyValues(dateText) {
  var names = workNames(dateText);
  var key = "tidy:" + names.sheet;
  var values = readWorkValues(dateText);
  if (cacheGet(key) === "1") {
    return values;
  }
  var next = valuesFromBlocks(values[0], blocksFromValues(values));
  if (!sameSheet(values, next)) {
    writeWorkValues(next, dateText);
    values = next;
  }
  cachePut(key, "1", 300);
  return values;
}

function sameSheet(left, right) {
  if (!left || !right || left.length !== right.length) {
    return false;
  }
  for (var i = 0; i < left.length; i++) {
    var a = left[i] || [];
    var b = right[i] || [];
    var width = Math.max(a.length, b.length);
    for (var column = 0; column < width; column++) {
      if (String(a[column] == null ? "" : a[column]) !== String(b[column] == null ? "" : b[column])) {
        return false;
      }
    }
  }
  return true;
}

function paintWorkRows(sheet, values) {
  if (!values || values.length < 2) {
    return;
  }
  var count = values.length - 1;
  var body = sheet.getRange(3, 1, count, WORK_WIDTH);
  body.setBackground("#ffffff");
  body.setFontColor("#1d1c19");
  body.setFontSize(11);
  body.setFontWeight("normal");
  body.setBorder(false, false, false, false, false, false);
  var ends = [];
  var open = false;
  for (var i = 1; i < values.length; i++) {
    var name = String(values[i][0] || "").trim();
    if (name && open) {
      ends.push(i + 1);
    }
    if (name) {
      open = true;
    }
  }
  if (open) {
    ends.push(values.length + 1);
  }
  paintBlockLines(sheet, ends);
}

function paintBlockLines(sheet, sheetRows) {
  if (!sheetRows.length) {
    return;
  }
  var start = sheetRows[0];
  var previous = sheetRows[0];
  for (var i = 1; i <= sheetRows.length; i++) {
    var row = i < sheetRows.length ? sheetRows[i] : 0;
    if (row !== previous + 1) {
      var height = previous - start + 1;
      sheet.getRange(start, 1, height, WORK_WIDTH).setBorder(
        false,
        false,
        true,
        false,
        false,
        height > 1,
        "#1d1c19",
        SpreadsheetApp.BorderStyle.SOLID_MEDIUM
      );
      start = row;
    }
    previous = row;
  }
}

function paintExistingRows(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 3) {
    return;
  }
  var values = sheet.getRange(2, 1, lastRow - 1, WORK_WIDTH).getValues();
  paintWorkRows(sheet, values);
}

function writeWorkValues(values, dateText) {
  var sheet = workSheet(dateText);
  var width = WORK_WIDTH;
  var headerRow = 2;
  sheet.getRange(headerRow, 1, 1, width).setValues([WORK_HEADER.slice()]);
  sheet.getRange(headerRow, 1, 1, width).setNumberFormat("@");
  if (values.length > 1) {
    var body = values.slice(1);
    var range = sheet.getRange(headerRow + 1, 1, body.length, width);
    range.setNumberFormat("@");
    SpreadsheetApp.flush();
    range.setValues(body);
    paintWorkRows(sheet, values);
  }
  var oldLast = sheet.getLastRow();
  var endRow = headerRow + values.length - 1;
  if (oldLast > endRow) {
    var extra = sheet.getRange(endRow + 1, 1, oldLast - endRow, width);
    extra.clearContent();
    extra.setBackground("#ffffff");
    extra.setBorder(false, false, false, false, false, false);
  }
}
