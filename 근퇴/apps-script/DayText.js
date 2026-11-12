function pad2(value) {
  var number = Number(value);
  return (number < 10 ? "0" : "") + number;
}

function withNim(name) {
  var text = String(name || "").trim();
  if (!text) {
    return "";
  }
  return text.slice(-1) === "님" ? text : text + "님";
}

function passwordText(value) {
  if (typeof value === "number" && isFinite(value)) {
    var whole = Math.round(value);
    if (whole >= 0 && whole <= 9999 && Math.abs(value - whole) < 1e-9) {
      return ("0000" + String(whole)).slice(-4);
    }
    return "";
  }
  var text = String(value == null ? "" : value).trim();
  if (/^\d{4}$/.test(text)) {
    return text;
  }
  return "";
}

function isDateValue(value) {
  return Object.prototype.toString.call(value) === "[object Date]" && !isNaN(value.getTime());
}

function dateCellToText(value) {
  if (isDateValue(value) && typeof Utilities !== "undefined") {
    return Utilities.formatDate(value, "Asia/Seoul", "yyyy-MM-dd");
  }
  var text = String(value == null ? "" : value).trim();
  var match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!match) {
    return text;
  }
  return match[1] + "-" + pad2(match[2]) + "-" + pad2(match[3]);
}

function timeCellToText(value) {
  if (isDateValue(value) && typeof Utilities !== "undefined") {
    return Utilities.formatDate(value, "Asia/Seoul", "HH:mm");
  }
  return String(value == null ? "" : value).trim();
}

function parseTimeCell(value) {
  var text = timeCellToText(value);
  var match = text.match(/^(\d{1,2}):(\d{2})(?:\s*예정)?$/);
  if (!match) {
    return null;
  }
  var hour = Number(match[1]);
  var minute = Number(match[2]);
  if (hour > 23 || minute > 59) {
    return null;
  }
  return { h: hour, m: minute, planned: text.indexOf("예정") >= 0 };
}

function sanitizeTime(value) {
  if (!value) {
    return null;
  }
  if (typeof value === "string") {
    return parseTimeCell(value);
  }
  var hour = Number(value.h);
  var minute = Number(value.m);
  if (!isFinite(hour) || !isFinite(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }
  return { h: hour, m: minute, planned: !!value.planned };
}

function timeCell(time) {
  var clean = sanitizeTime(time);
  if (!clean) {
    return "";
  }
  return pad2(clean.h) + ":" + pad2(clean.m) + (clean.planned ? " 예정" : "");
}

function formatStamp(time) {
  return timeCell(time);
}

function sanitizeTrip(trip) {
  if (!trip) {
    return null;
  }
  var clean = {
    type: String(trip.type || "").trim(),
    name: String(trip.name || "").trim(),
    vehicle: String(trip.vehicle || "").trim(),
    depart: sanitizeTime(trip.depart),
    arrive: sanitizeTime(trip.arrive),
    returnDepart: sanitizeTime(trip.returnDepart),
    returnArrive: sanitizeTime(trip.returnArrive)
  };
  if (!clean.type && !clean.name && !clean.vehicle && !clean.depart && !clean.arrive && !clean.returnDepart && !clean.returnArrive) {
    return null;
  }
  return clean;
}

function sanitizeDay(day) {
  var source = day || {};
  var trips = [];
  var incoming = Array.isArray(source.trips) ? source.trips : [];
  for (var i = 0; i < incoming.length; i++) {
    var trip = sanitizeTrip(incoming[i]);
    if (trip) {
      trips.push(trip);
    }
  }
  return {
    clockIn: sanitizeTime(source.clockIn),
    clockOut: sanitizeTime(source.clockOut),
    memo: String(source.memo || "").replace(/^\s+|\s+$/g, ""),
    trips: trips
  };
}

function tripSortKey(trip) {
  var time = trip.depart || trip.arrive || trip.returnDepart || trip.returnArrive;
  if (!time) {
    return 24 * 60 + 1;
  }
  return time.h * 60 + time.m;
}

function chainList(trips) {
  var chains = [];
  (trips || []).forEach(function (trip) {
    if (trip.type === "경유" && chains.length) {
      chains[chains.length - 1].push(trip);
      return;
    }
    if (trip.type === "경유") {
      trip.type = "장보기";
    }
    chains.push([trip]);
  });
  return chains;
}

function sortDay(day) {
  var clean = sanitizeDay(day);
  var chains = chainList(clean.trips).map(function (trips, index) {
    return { trips: trips, index: index, key: tripSortKey(trips[0]) };
  });
  chains.sort(function (a, b) {
    if (a.key !== b.key) {
      return a.key - b.key;
    }
    return a.index - b.index;
  });
  var ordered = [];
  chains.forEach(function (chain) {
    chain.trips.forEach(function (trip) {
      ordered.push(trip);
    });
  });
  clean.trips = ordered;
  return clean;
}

function tripTitle(trip) {
  var title = "";
  if (trip.type) {
    title = "[" + trip.type + "]";
  }
  if (trip.name) {
    title += (title ? " " : "") + trip.name;
  }
  if (trip.vehicle) {
    title += (title ? " " : "") + "(" + trip.vehicle + ")";
  }
  return title;
}

var WORK_HEADER = ["이름", "날짜", "출근", "퇴근", "총근무시간", "업무", "대상", "차량", "현장 출발", "현장 도착", "복귀 출발", "복귀 도착", "기타"];

function formatDuration(clockIn, clockOut) {
  var start = sanitizeTime(clockIn);
  var end = sanitizeTime(clockOut);
  if (!start || !end) {
    return "";
  }
  var minutes = end.h * 60 + end.m - (start.h * 60 + start.m);
  if (minutes < 0) {
    minutes += 24 * 60;
  }
  var hours = Math.floor(minutes / 60);
  var rest = minutes % 60;
  var text = "";
  if (hours) {
    text += hours + "시간";
  }
  if (rest) {
    text += (text ? " " : "") + rest + "분";
  }
  if (!text) {
    text = "0분";
  }
  if (start.planned || end.planned) {
    text += " 예정";
  }
  return text;
}

function fieldLine(kind, start, end) {
  var parts = [];
  if (start) {
    parts.push(kind + " 출발 " + formatStamp(start));
  }
  if (end) {
    parts.push("도착 " + formatStamp(end));
  }
  return parts.join(", ");
}

function tripLines(trip) {
  var lines = [];
  var title = tripTitle(trip);
  if (title) {
    lines.push(title);
  }
  var going = fieldLine("현장", trip.depart, trip.arrive);
  if (going) {
    lines.push(going);
  }
  var returning = fieldLine("복귀", trip.returnDepart, trip.returnArrive);
  if (returning) {
    lines.push(returning);
  }
  return lines;
}

function routeLines(chain) {
  var lines = [];
  var first = chain[0];
  var names = [];
  chain.forEach(function (stop) {
    if (stop.name) {
      names.push(stop.name);
    }
  });
  var title = "[장보기]";
  if (names.length) {
    title += " " + names.join(", ");
  }
  if (first.vehicle) {
    title += " (" + first.vehicle + ")";
  }
  lines.push(title);
  if (first.depart) {
    lines.push("현장 출발 " + formatStamp(first.depart));
  }
  var last = chain[chain.length - 1];
  if (last.returnArrive) {
    lines.push("사무실 복귀 " + formatStamp(last.returnArrive));
  }
  return lines;
}

function deliveryRouteLines(chain) {
  var lines = [];
  var first = chain[0];
  var title = "[배송]";
  if (first.name) {
    title += " " + first.name;
  }
  if (first.vehicle) {
    title += " (" + first.vehicle + ")";
  }
  lines.push(title);
  var firstLeg = [];
  if (first.depart) {
    firstLeg.push("첫번째 출발 " + formatStamp(first.depart));
  }
  if (first.arrive) {
    firstLeg.push("도착 " + formatStamp(first.arrive));
  }
  if (firstLeg.length) {
    lines.push(firstLeg.join(", "));
  }
  for (var i = 1; i < chain.length; i++) {
    var stop = chain[i];
    var via = "[경유]";
    if (stop.name) {
      via += " " + stop.name;
    }
    lines.push(via);
    var hop = [];
    if (stop.depart) {
      hop.push("경유지 출발 " + formatStamp(stop.depart));
    }
    if (stop.arrive) {
      hop.push("도착 " + formatStamp(stop.arrive));
    }
    if (hop.length) {
      lines.push(hop.join(", "));
    }
  }
  var last = chain[chain.length - 1];
  var returning = fieldLine("복귀", last.returnDepart, last.returnArrive);
  if (returning) {
    lines.push(returning);
  }
  return lines;
}

var SHIFT_RULE = "-------------------------";

function renderDay(day, name, date) {
  var clean = sortDay(day);
  void date;
  var lines = [];
  if (name) {
    lines.push("[근무] " + String(name));
  }
  var clockParts = [];
  if (clean.clockIn) {
    clockParts.push("출근 " + formatStamp(clean.clockIn));
  }
  if (clean.clockOut) {
    clockParts.push("퇴근 " + formatStamp(clean.clockOut));
  }
  if (clockParts.length) {
    lines.push(clockParts.join(", ") + ", ");
  }
  var total = formatDuration(clean.clockIn, clean.clockOut);
  if (total) {
    lines.push("총근무시간 " + total + ".");
  }
  var tripBlocks = [];
  chainList(clean.trips).forEach(function (chain) {
    var block = chain.length < 2 ? tripLines(chain[0]) : chain[0].type === "배송" ? deliveryRouteLines(chain) : routeLines(chain);
    if (block.length) {
      tripBlocks.push(block);
    }
  });
  if (lines.length && tripBlocks.length) {
    lines.push(SHIFT_RULE);
  }
  tripBlocks.forEach(function (block, index) {
    if (index > 0) {
      lines.push("");
    }
    block.forEach(function (line) {
      lines.push(line);
    });
  });
  if (clean.memo) {
    if (lines.length) {
      lines.push("");
    }
    lines.push(clean.memo);
  }
  return lines.join("\n");
}

function rowsFromDay(name, date, day) {
  var clean = sortDay(day);
  var total = formatDuration(clean.clockIn, clean.clockOut);
  if (!clean.trips.length) {
    if (!clean.clockIn && !clean.clockOut && !clean.memo) {
      return [];
    }
    return [[
      name,
      date,
      timeCell(clean.clockIn),
      timeCell(clean.clockOut),
      total,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      clean.memo
    ]];
  }
  return clean.trips.map(function (trip, index) {
    var first = index === 0;
    return [
      first ? name : "",
      first ? date : "",
      first ? timeCell(clean.clockIn) : "",
      first ? timeCell(clean.clockOut) : "",
      first ? total : "",
      trip.type,
      trip.name,
      trip.vehicle,
      timeCell(trip.depart),
      timeCell(trip.arrive),
      timeCell(trip.returnDepart),
      timeCell(trip.returnArrive),
      first ? clean.memo : ""
    ];
  });
}

function dayFromRows(rows) {
  var day = { clockIn: null, clockOut: null, memo: "", trips: [] };
  rows.forEach(function (row) {
    if (!day.clockIn) {
      day.clockIn = parseTimeCell(row[2]);
    }
    if (!day.clockOut) {
      day.clockOut = parseTimeCell(row[3]);
    }
    if (!day.memo && String(row[12] == null ? "" : row[12]).trim()) {
      day.memo = String(row[12]).replace(/^\s+|\s+$/g, "");
    }
    var trip = sanitizeTrip({
      type: row[5],
      name: row[6],
      vehicle: row[7],
      depart: parseTimeCell(row[8]),
      arrive: parseTimeCell(row[9]),
      returnDepart: parseTimeCell(row[10]),
      returnArrive: parseTimeCell(row[11])
    });
    if (trip) {
      day.trips.push(trip);
    }
  });
  return day;
}

function fieldMap(header) {
  var labels = (header || []).map(function (cell) {
    return String(cell == null ? "" : cell).trim();
  });
  var map = {};
  var found = false;
  WORK_HEADER.forEach(function (field) {
    map[field] = labels.indexOf(field);
    if (map[field] >= 0) {
      found = true;
    }
  });
  if (!found) {
    WORK_HEADER.forEach(function (field, index) {
      map[field] = index;
    });
  }
  return map;
}

function canonRow(row, map) {
  var source = row || [];
  return WORK_HEADER.map(function (field) {
    var at = map[field];
    var value = at == null || at < 0 || at >= source.length ? "" : source[at];
    if (field === "날짜") {
      return dateCellToText(value);
    }
    if (field === "출근" || field === "퇴근" || field === "현장 출발" || field === "현장 도착" || field === "복귀 출발" || field === "복귀 도착") {
      return timeCellToText(value);
    }
    return value == null ? "" : String(value);
  });
}

function applyTotal(row) {
  var copy = normalizeRow(row);
  if (String(copy[0] || "").trim()) {
    copy[4] = formatDuration(parseTimeCell(copy[2]), parseTimeCell(copy[3]));
  } else {
    copy[4] = "";
  }
  return copy;
}

function normalizeRow(row) {
  var source = row || [];
  var out = [];
  for (var column = 0; column < WORK_HEADER.length; column++) {
    if (column === 1) {
      out.push(dateCellToText(source[column]));
    } else if (column === 2 || column === 3 || column === 8 || column === 9 || column === 10 || column === 11) {
      out.push(timeCellToText(source[column]));
    } else {
      out.push(source[column] == null ? "" : String(source[column]));
    }
  }
  return out;
}

function isDayHeader(row, name, date) {
  return String(row[0] || "").trim() === name && dateCellToText(row[1]) === date;
}

function mergeDayRows(values, name, date, bodyRows) {
  var header = values && values.length ? values[0] : WORK_HEADER;
  var map = fieldMap(header);
  var kept = [];
  var insertAt = -1;
  var inside = false;
  var source = values || [];
  for (var i = 1; i < source.length; i++) {
    var row = applyTotal(canonRow(source[i], map));
    var rowName = String(row[0] || "").trim();
    if (rowName) {
      inside = isDayHeader(row, name, date);
      if (inside) {
        if (insertAt < 0) {
          insertAt = kept.length;
        }
      } else {
        kept.push(row);
      }
    } else if (inside) {
      if (insertAt < 0) {
        insertAt = kept.length;
      }
    } else if (String(row[5] || "").trim() || String(row[6] || "").trim()) {
      kept.push(row);
    }
  }
  if (insertAt < 0) {
    insertAt = kept.length;
  }
  var out = [WORK_HEADER.slice()];
  for (var before = 0; before < insertAt; before++) {
    out.push(kept[before]);
  }
  for (var body = 0; body < bodyRows.length; body++) {
    out.push(applyTotal(bodyRows[body]));
  }
  for (var after = insertAt; after < kept.length; after++) {
    out.push(kept[after]);
  }
  return out;
}

function validDate(value) {
  var text = dateCellToText(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return "";
  }
  return text;
}

function filterDayRows(values, name, date) {
  var map = fieldMap(values && values.length ? values[0] : WORK_HEADER);
  var rows = [];
  var inside = false;
  var source = values || [];
  for (var i = 1; i < source.length; i++) {
    var row = applyTotal(canonRow(source[i], map));
    var rowName = String(row[0] || "").trim();
    if (rowName) {
      inside = isDayHeader(row, name, date);
      if (inside) {
        rows.push(row);
      }
    } else if (inside) {
      rows.push(row);
    }
  }
  return rows;
}

function blocksFromValues(values) {
  var map = fieldMap(values && values.length ? values[0] : WORK_HEADER);
  var blocks = [];
  var current = null;
  var source = values || [];
  for (var i = 1; i < source.length; i++) {
    var row = canonRow(source[i], map);
    var rowName = String(row[0] || "").trim();
    if (rowName) {
      current = {
        name: rowName,
        date: dateCellToText(row[1]),
        clockIn: parseTimeCell(row[2]),
        clockOut: parseTimeCell(row[3]),
        memo: String(row[12] || "").trim(),
        trips: []
      };
      blocks.push(current);
    } else if (!current) {
      continue;
    }
    if (!current.clockIn) {
      current.clockIn = parseTimeCell(row[2]);
    }
    if (!current.clockOut) {
      current.clockOut = parseTimeCell(row[3]);
    }
    if (!current.memo && String(row[12] || "").trim()) {
      current.memo = String(row[12]).trim();
    }
    var trip = sanitizeTrip({
      type: row[5],
      name: row[6],
      vehicle: row[7],
      depart: parseTimeCell(row[8]),
      arrive: parseTimeCell(row[9]),
      returnDepart: parseTimeCell(row[10]),
      returnArrive: parseTimeCell(row[11])
    });
    if (trip) {
      current.trips.push(trip);
    }
  }
  var merged = [];
  var index = {};
  blocks.forEach(function (block) {
    var key = block.name + "|" + block.date;
    if (index[key] == null) {
      index[key] = merged.length;
      merged.push(block);
    } else {
      var target = merged[index[key]];
      if (!target.clockIn) {
        target.clockIn = block.clockIn;
      }
      if (!target.clockOut) {
        target.clockOut = block.clockOut;
      }
      if (!target.memo) {
        target.memo = block.memo;
      }
      block.trips.forEach(function (trip) {
        target.trips.push(trip);
      });
    }
  });
  return merged;
}

function workNamesForDate(dateText, todayText) {
  var text = validDate(dateText) || validDate(todayText) || "";
  if (!text || text < "2026-12-01") {
    return { sheet: "근무기록(11월)", title: "11월 근무기록" };
  }
  var month = Number(text.slice(5, 7));
  return { sheet: "근무기록(" + month + "월)", title: month + "월 근무기록" };
}

function attendanceNamesForDate(dateText, todayText) {
  var month = workNamesForDate(dateText, todayText).title.replace("월 근무기록", "");
  return { sheet: "근태(" + month + "월)", title: month + "월 근태" };
}

function attendanceLiveFormula(workSheetName) {
  var quoted = "'" + String(workSheetName || "").replace(/'/g, "''") + "'";
  var source = quoted + "!A3:E1000";
  return [
    '=IFERROR(LET(',
    'raw,IFERROR(QUERY(' + source + ',"select A,B,C,D,E where A is not null and A <> \'\' order by A, B",0),{"","","","",""}),',
    'names,FILTER(UNIQUE(INDEX(raw,,1)),UNIQUE(INDEX(raw,,1))<>""),',
    'stacked,REDUCE({"","","","","",""},names,LAMBDA(acc,name,LET(',
    'days,FILTER(raw,INDEX(raw,,1)=name),',
    'cin,INDEX(days,,3),',
    'cout,INDEX(days,,4),',
    'daycol,ARRAYFORMULA(IF(ISNUMBER(INDEX(days,,2)),TEXT(INDEX(days,,2),"yyyy-MM-dd"),INDEX(days,,2))),',
    'states,ARRAYFORMULA(IF((ISNUMBER(SEARCH("예정",cin)))+(ISNUMBER(SEARCH("예정",cout))),"예정",IF((cin<>"")*(cout<>""),"정상",IF((cin<>"")*(cout=""),IF(daycol=TEXT(TODAY(),"yyyy-MM-dd"),"오늘 근무 중","퇴근 빠짐"),IF((cin="")*(cout<>""),"출근 빠짐",""))))),',
    'mins,ARRAYFORMULA(IFERROR(IF((cin="")+(cout="")+(ISNUMBER(SEARCH("예정",cin&cout))),0,LET(sh,VALUE(LEFT(cin,2)),sm,VALUE(MID(cin,4,2)),eh,VALUE(LEFT(cout,2)),em,VALUE(MID(cout,4,2)),start,sh*60+sm,endMin,eh*60+em,IF(endMin<start,endMin-start+1440,endMin-start))),0)),',
    'shown,HSTACK(INDEX(days,,1),daycol,cin,cout,INDEX(days,,5),states),',
    'summary,HSTACK(name,"합계","","",IF(SUM(mins)<=0,"0분",IF(INT(SUM(mins)/60)=0,MOD(SUM(mins),60)&"분",IF(MOD(SUM(mins),60)=0,INT(SUM(mins)/60)&"시간",INT(SUM(mins)/60)&"시간 "&MOD(SUM(mins),60)&"분"))),"근무일수 "&COUNTIF(states,"정상")&"일 · 퇴근 빠짐 "&COUNTIF(states,"퇴근 빠짐")&"일"),',
    'VSTACK(acc,shown,summary)))),',
    'FILTER(stacked,INDEX(stacked,,1)<>"")),"")'
  ].join("");
}

function attendanceNamesForWorkSheet(sheetName) {
  var name = String(sheetName || "").trim();
  if (name === "근무기록") {
    return { sheet: "근태(11월)", title: "11월 근태", workTitle: "11월 근무기록" };
  }
  var match = name.match(/^근무기록\((\d+)월\)$/);
  if (!match) {
    return null;
  }
  return {
    sheet: "근태(" + match[1] + "월)",
    title: match[1] + "월 근태",
    workTitle: match[1] + "월 근무기록"
  };
}

function attendanceMinutes(clockIn, clockOut) {
  var start = sanitizeTime(clockIn);
  var end = sanitizeTime(clockOut);
  if (!start || !end || start.planned || end.planned) {
    return 0;
  }
  var minutes = end.h * 60 + end.m - (start.h * 60 + start.m);
  if (minutes < 0) {
    minutes += 24 * 60;
  }
  return minutes;
}

function attendanceDay(block) {
  var start = sanitizeTime(block && block.clockIn);
  var end = sanitizeTime(block && block.clockOut);
  var counted = attendanceMinutes(start, end);
  var both = !!(start && end && !start.planned && !end.planned);
  return {
    kind: "day",
    name: String(block.name || "").trim(),
    date: validDate(block.date),
    clockIn: timeCell(start),
    clockOut: timeCell(end),
    total: both ? formatDuration(start, end) : "",
    minutes: both ? counted : 0
  };
}

function attendanceTable(blocks) {
  var groups = {};
  var order = [];
  (blocks || []).forEach(function (block) {
    var day = attendanceDay(block);
    if (!day.name || !day.date) {
      return;
    }
    if (!groups[day.name]) {
      groups[day.name] = [];
      order.push(day.name);
    }
    groups[day.name].push(day);
  });
  order.sort(function (left, right) {
    return left < right ? -1 : left > right ? 1 : 0;
  });
  var rows = [];
  order.forEach(function (name) {
    groups[name].sort(function (left, right) {
      return left.date < right.date ? -1 : left.date > right.date ? 1 : 0;
    });
    groups[name].forEach(function (day) {
      rows.push(day);
    });
    rows.push({ kind: "summary", name: name });
  });
  return rows;
}

function attendanceStatusFormula(row) {
  var line = String(row);
  return '=IF(OR(ISNUMBER(SEARCH("예정",C' + line + ')),ISNUMBER(SEARCH("예정",D' + line + '))),"예정",IF(AND(C' + line + '<>"",D' + line + '<>""),"정상",IF(AND(C' + line + '<>"",D' + line + '=""),IF(B' + line + '=TEXT(TODAY(),"yyyy-MM-dd"),"오늘 근무 중","퇴근 빠짐"),IF(AND(C' + line + '="",D' + line + '<>""),"출근 빠짐",""))))';
}

function attendanceSummaryHoursFormula(row) {
  var line = String(row);
  var sum = "SUMIF($A$3:$A$2000,A" + line + ",$G$3:$G$2000)";
  var hours = "INT((" + sum + ")/60)";
  var mins = "MOD((" + sum + "),60)";
  return '=IF((' + sum + ')=0,"0분",IF(' + hours + '=0,' + mins + '&"분",IF(' + mins + '=0,' + hours + '&"시간",' + hours + '&"시간 "&' + mins + '&"분")))';
}

function attendanceSummaryStatusFormula(row) {
  var line = String(row);
  return '="근무일수 "&COUNTIFS($A$3:$A$2000,A' + line + ',$H$3:$H$2000,"정상")&"일 · 퇴근 빠짐 "&COUNTIFS($A$3:$A$2000,A' + line + ',$H$3:$H$2000,"퇴근 빠짐")&"일"';
}

function valuesFromBlocks(header, blocks) {
  void header;
  var out = [WORK_HEADER.slice()];
  (blocks || []).forEach(function (block) {
    rowsFromDay(block.name, block.date, block).forEach(function (row) {
      out.push(normalizeRow(row));
    });
  });
  return out;
}
