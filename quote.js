'use strict';

/*
 * 요술손케이터링 배송·출장 견적.
 * 인건비는 소수 시간(2.43시간)이 아니라 분으로 계산한다.
 *   지급액 = round(시급 × 분 ÷ 60)
 * 유류비는 편도 × 2 를 100원 단위로 올린다.
 * 차량 운영비는 왕복 km × 222원이고 유류비는 들어가지 않는다.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.YosulQuote = api;
})(typeof window !== 'undefined' ? window : null, function () {
  var KM_RATE = 222;
  var DEFAULT_WAGES = [11000, 12000, 13000];
  var WAGE_PRESETS = [11000, 12000, 12500, 13000, 14000];
  var DIVIDER = '--------------------------------';
  var WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'];

  var EXAMPLES = {
    rough: [
      '[상담배송/출장] 허원혜 / 서울대학교',
      '26.11.20',
      '',
      '출발 : ',
      '도착 : 13:00',
      '행사시작 : 14:00 ~ 17:00',
      '',
      '서울대학교 우성경제관 223동 504호',
      '',
      '*디저트 50인분 반출장'
    ].join('\n')
  };
  EXAMPLES.confirmed = EXAMPLES.rough + '\n\n' + [
    '출발 11:30',
    '편도거리 30km',
    '연료비 6,000원',
    '도착소요시간 1시간',
    '복귀소요시간 1시간 30분',
    '적재이동비 10,000원 추가'
  ].join('\n');

  function pad(n) {
    n = Math.round(Number(n));
    return (n < 10 ? '0' : '') + n;
  }

  function compact(s) {
    return String(s == null ? '' : s).replace(/[•ㆍ\s]/g, '');
  }

  function formatNumber(n) {
    var sign = Number(n) < 0 ? '-' : '';
    var digits = String(Math.abs(Math.round(Number(n))));
    return sign + digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function formatWon(n) {
    return formatNumber(n) + '원';
  }

  function formatKm(n) {
    var v = Math.round(Number(n) * 10) / 10;
    if (!Number.isFinite(v)) return '';
    return Number.isInteger(v) ? String(v) : v.toFixed(1);
  }

  function formatPhone(raw) {
    var digits = String(raw || '').replace(/\D/g, '');
    if (digits.length === 9 && digits.indexOf('02') === 0) return '02 ' + digits.slice(2, 5) + ' ' + digits.slice(5);
    if (digits.length === 10 && digits.indexOf('02') === 0) return '02 ' + digits.slice(2, 6) + ' ' + digits.slice(6);
    if (digits.length === 11) return digits.slice(0, 3) + ' ' + digits.slice(3, 7) + ' ' + digits.slice(7);
    if (digits.length === 10) return digits.slice(0, 3) + ' ' + digits.slice(3, 6) + ' ' + digits.slice(6);
    return String(raw || '').trim();
  }

  function isValidYMD(y, m, d) {
    if (m < 1 || m > 12 || d < 1 || d > 31) return false;
    var dt = new Date(Date.UTC(y, m - 1, d));
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
  }

  function weekdayIndex(y, m, d) {
    var t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
    var yy = y;
    if (m < 3) yy -= 1;
    return (yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) + t[m - 1] + d) % 7;
  }

  function formatDateLabel(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!m) return '';
    var y = Number(m[1]);
    var mo = Number(m[2]);
    var d = Number(m[3]);
    if (!isValidYMD(y, mo, d)) return '';
    return String(y).slice(2) + '.' + m[2] + '.' + m[3] + '(' + WEEKDAY[weekdayIndex(y, mo, d)] + ')';
  }

  function parseDate(raw) {
    if (!raw) return '';
    var s = String(raw).trim();
    var y;
    var m;
    var d;
    var full = s.match(/(\d{2,4})\s*[.\-/]\s*(\d{1,2})\s*[.\-/]\s*(\d{1,2})/);
    if (full) {
      y = parseInt(full[1], 10);
      m = parseInt(full[2], 10);
      d = parseInt(full[3], 10);
      if (y < 100) y += 2000;
    } else {
      var md = s.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
      if (!md) return '';
      y = new Date().getFullYear();
      m = parseInt(md[1], 10);
      d = parseInt(md[2], 10);
    }
    if (!isValidYMD(y, m, d)) return '';
    return y + '-' + pad(m) + '-' + pad(d);
  }

  function isDateOnly(line) {
    var found = line.match(/(\d{2,4}\s*[.\-/]\s*\d{1,2}\s*[.\-/]\s*\d{1,2}|\d{1,2}\s*월\s*\d{1,2}\s*일)/);
    if (!found) return false;
    var rest = line.replace(found[0], '').replace(/[()（）.\s가-힣]/g, '');
    return rest === '';
  }

  function laborWon(wage, minutes) {
    var w = Math.round(Number(wage));
    var m = Math.round(Number(minutes));
    if (w <= 0 || m <= 0) return 0;
    return Math.floor((w * m + 30) / 60);
  }

  function ceil100(n) {
    n = Math.round(Number(n));
    if (n <= 0) return 0;
    return Math.ceil(n / 100) * 100;
  }

  function vehicleCost(onewayKm) {
    var milli = Math.round(Number(onewayKm) * 1000);
    if (milli <= 0) return 0;
    return Math.round(milli * 2 * KM_RATE / 1000);
  }

  function roundKmOf(onewayKm) {
    return Math.round(Number(onewayKm) * 2 * 1000) / 1000;
  }

  function bandFee(roundKm) {
    var km = Math.round(Number(roundKm) * 1000) / 1000;
    if (!(km > 0)) return 0;
    if (km <= 40) return 8000;
    var steps = Math.ceil((km - 40) / 20);
    return 8000 + steps * 1000;
  }

  function bandLabel(roundKm) {
    var km = Math.round(Number(roundKm) * 1000) / 1000;
    if (!(km > 0) || km <= 40) return '40km 이하';
    var steps = Math.ceil((km - 40) / 20);
    var hi = 40 + steps * 20;
    var lo = hi - 19;
    return lo + '~' + hi + 'km 구간';
  }

  function formatDuration(min) {
    min = Math.round(Number(min) || 0);
    var h = Math.floor(min / 60);
    var m = min % 60;
    if (h && m) return h + '시간 ' + m + '분';
    if (h) return h + '시간';
    return m + '분';
  }

  function isShopping(type) {
    return /장보기/.test(type || '');
  }

  function headcount(items) {
    var m = String(items || '').match(/(\d+)\s*(?:인|명)/);
    return m ? parseInt(m[1], 10) : 0;
  }

  function snuNote(place) {
    var text = place || '';
    var building = (text.match(/([가-힣]{2,}관)/) || [])[1] || '';
    var roomMatch = text.match(/(\d{3,4})호/);
    var room = roomMatch ? roomMatch[1] + '호' : '';
    var floor = '';
    if (roomMatch && roomMatch[1].length === 3) floor = roomMatch[1].charAt(0) + '층';
    var bits = [building, floor, room].filter(Boolean);
    if (!bits.length) return '고지대·층수 운반';
    return bits.join(' ') + ' 기물/세팅 운반';
  }

  var VENUES = [
    {
      id: 'snu',
      name: '서울대학교(관악)',
      keys: ['우성경제관', '서울대학교', '서울대', '관악캠퍼스'],
      km: [27, 30],
      toll: 0,
      goMin: [50, 60],
      prepMin: [25, 30],
      prepNote: '정문 통과, 고지대 이동, 주차, 층수 운반',
      suggest: function (ctx) {
        return [{ label: '적재이동비', amount: 10000, note: snuNote(ctx.place || ctx.event || '') }];
      }
    },
    {
      id: 'dongtan',
      name: '동탄 하이게이트',
      keys: ['하이게이트', '동탄'],
      km: 83,
      toll: 6800,
      tollNote: '편도 6,800원, 왕복 13,600원 고정'
    },
    {
      id: 'gwangmyeong',
      name: '광명 아브릴모마',
      keys: ['아브릴 모마', '아브릴모마', '아브릴', '광명'],
      km: 33,
      kmUsual: [28, 32],
      fuel: 5300,
      toll: 2800,
      tollNote: '2026-11-14 실측. 톨게이트를 안 타면 0원'
    },
    {
      id: 'banyan',
      name: '반얀트리 호텔',
      keys: ['반얀트리', '반얀'],
      km: 27,
      toll: 0,
      suggest: function (ctx) {
        var big = ctx.headcount >= 100 || /대규모/.test((ctx.items || '') + ' ' + (ctx.type || ''));
        if (!big) return [];
        return [{ label: '적재이동비', amount: 30000, note: '대규모 식사 출장 기물 적재이동' }];
      }
    },
    {
      id: 'pocheon',
      name: '포천 군부대(자작동)',
      keys: ['자작동', '포천'],
      km: 58,
      toll: 1800
    },
    {
      id: 'icheon',
      name: '이천소방서',
      keys: ['이천소방서', '이천소방'],
      km: 95,
      toll: 7000
    },
    {
      id: 'itaewon',
      name: '이태원 에어비앤비',
      keys: ['이태원'],
      km: [21, 23],
      toll: 0,
      suggest: function () {
        return [{ label: '적재이동비', amount: 10000, note: '3층 하역' }];
      }
    }
  ];

  function matchVenue(ctx) {
    ctx = ctx || {};
    var primary = findVenueIn((ctx.place || '') + ' ' + (ctx.event || ''));
    if (primary) return primary;
    return findVenueIn((ctx.items || '') + ' ' + (ctx.type || ''));
  }

  function findVenueIn(text) {
    if (!String(text || '').trim()) return null;
    var best = null;
    var bestLen = 0;
    for (var i = 0; i < VENUES.length; i++) {
      var venue = VENUES[i];
      for (var k = 0; k < venue.keys.length; k++) {
        var key = venue.keys[k];
        if (text.indexOf(key) !== -1 && key.length > bestLen) {
          best = venue;
          bestLen = key.length;
        }
      }
    }
    return best;
  }

  function loadSuggestions(ctx) {
    ctx = ctx || {};
    var context = {
      type: ctx.type || '',
      place: ctx.place || '',
      event: ctx.event || '',
      items: ctx.items || '',
      headcount: headcount(ctx.items)
    };
    if (isShopping(context.type)) return [];
    var list = [];
    var venue = matchVenue(context);
    if (venue && typeof venue.suggest === 'function') {
      venue.suggest(context).forEach(function (item) { list.push(item); });
    }
    if (context.headcount >= 100 && context.headcount <= 200 && !list.some(function (s) { return s.amount >= 20000; })) {
      list.push({
        label: '기물 적재이동비',
        amount: 20000,
        altAmount: 30000,
        note: context.headcount + '인 기물 적재이동'
      });
    }
    return list;
  }

  function describeVenue(venue) {
    if (!venue) return '';
    var km = Array.isArray(venue.km)
      ? '편도 ' + venue.km[0] + '~' + venue.km[1] + 'km'
      : '편도 ' + venue.km + 'km';
    var toll = venue.tollOptional
      ? '통행료는 타면 ' + formatWon(venue.toll) + ', 안 타면 0원'
      : '편도 통행료 ' + formatWon(venue.toll);
    var drive = '';
    if (venue.goMin) {
      var g = Array.isArray(venue.goMin) ? venue.goMin[0] + '~' + venue.goMin[1] : String(venue.goMin);
      drive = ' · 가는 길 약 ' + g + '분';
    }
    return venue.name + ' · ' + km + ' · ' + toll + drive;
  }

  function applyVenueDefaults(input) {
    var venue = matchVenue(input || {});
    var next = Object.assign({}, input);
    if (!venue) return next;
    var kmEmpty = next.km == null || next.km === '';
    var fuelEmpty = next.fuel == null || next.fuel === '';
    var tollEmpty = next.toll == null || next.toll === '';
    var filled = [];
    if (kmEmpty && typeof venue.km === 'number') {
      next.km = venue.km;
      filled.push('편도 ' + venue.km + 'km');
    }
    if (fuelEmpty && typeof venue.fuel === 'number') {
      next.fuel = venue.fuel;
      filled.push('연료비 ' + formatWon(venue.fuel));
    }
    if (tollEmpty && typeof venue.toll === 'number' && !venue.tollOptional) {
      next.toll = venue.toll;
      filled.push('통행료 ' + formatWon(venue.toll));
    }
    if (filled.length) {
      next.warnings = (next.warnings || []).concat(
        venue.name + ' 지난 실측을 넣었습니다. ' + filled.join(', ') + '.'
      );
    }
    return next;
  }

  function to24(ap, h, m) {
    var hh = Number(h);
    var mm = Number(m || 0);
    if (ap === '오후' && hh < 12) hh += 12;
    if (ap === '오전' && hh === 12) hh = 0;
    return pad(hh) + ':' + pad(mm);
  }

  function extractClocks(raw) {
    var s = String(raw || '');
    s = s.replace(/(오전|오후)\s*(\d{1,2})\s*:\s*(\d{2})/g, function (_, ap, h, m) { return to24(ap, h, m); });
    s = s.replace(/(오전|오후)\s*(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분?)?/g, function (_, ap, h, m) { return to24(ap, h, m || 0); });
    s = s.replace(/(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분?)?/g, function (_, h, m) { return pad(h) + ':' + pad(m || 0); });
    var out = [];
    var re = /(\d{1,2}):(\d{2})/g;
    var found;
    while ((found = re.exec(s))) {
      var hh = Number(found[1]);
      var mm = Number(found[2]);
      if (hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59) out.push(pad(hh) + ':' + pad(mm));
    }
    return out;
  }

  function clockToMin(hhmm) {
    var m = /^(\d{2}):(\d{2})$/.exec(hhmm || '');
    if (!m) return null;
    return Number(m[1]) * 60 + Number(m[2]);
  }

  function minToClock(mins) {
    var m = ((Math.round(mins) % 1440) + 1440) % 1440;
    return pad(Math.floor(m / 60)) + ':' + pad(m % 60);
  }

  function asRange(v) {
    if (Array.isArray(v)) return [Number(v[0]), Number(v[1])];
    return [Number(v), Number(v)];
  }

  function rangePhrase(r, unit) {
    if (r[0] === r[1]) return r[0] + unit;
    return r[0] + '~' + r[1] + unit;
  }

  function suggestDeparture(ctx) {
    ctx = ctx || {};
    var clocks = extractClocks(ctx.arrive || '');
    if (!clocks.length) return null;
    var arriveMin = clockToMin(clocks[0]);
    var venue = matchVenue(ctx);
    var go = null;
    if (ctx.goMin != null && ctx.goMin !== '') go = asRange(ctx.goMin);
    else if (venue && venue.goMin) go = asRange(venue.goMin);
    if (!go || go.some(function (n) { return !Number.isFinite(n); })) return null;
    var prep = venue && venue.prepMin ? asRange(venue.prepMin) : [0, 0];
    var fromMin = arriveMin - go[1] - prep[1];
    var toMin = arriveMin - go[0] - prep[0];
    var from = minToClock(fromMin);
    var to = fromMin === toMin ? '' : minToClock(toMin);
    var bits = ['도착 ' + clocks[0] + ' 기준', '가는 시간 ' + rangePhrase(go, '분')];
    if (prep[1] > 0) {
      var prepText = venue && venue.prepNote ? venue.prepNote + ' ' : '';
      bits.push(prepText + '여유 ' + rangePhrase(prep, '분'));
    }
    bits.push('출발 ' + from + (to ? '~' + to : ''));
    return { from: from, to: to, apply: from, reason: bits.join('. ') + '.' };
  }

  function parseDuration(raw) {
    if (raw == null) return null;
    var s = String(raw).trim();
    if (!s) return null;
    s = s.replace(/약|대략/g, '');
    s = s.replace(/\([^)]*\)/g, '').trim();
    if (!s) return null;
    var hm = s.match(/(\d+)\s*시간\s*(\d+)\s*분/);
    if (hm) return Number(hm[1]) * 60 + Number(hm[2]);
    var h = s.match(/(\d+(?:\.\d+)?)\s*시간/);
    var minute = s.match(/(\d+)\s*분/);
    if (h && minute) return Math.round(parseFloat(h[1]) * 60) + Number(minute[1]);
    if (h) return Math.round(parseFloat(h[1]) * 60);
    if (minute) return Number(minute[1]);
    var colon = s.match(/(\d+)\s*:\s*(\d+)/);
    if (colon) return Number(colon[1]) * 60 + Number(colon[2]);
    var num = s.match(/(\d+(?:\.\d+)?)/);
    if (num) return Math.round(parseFloat(num[1]));
    return null;
  }

  function parseMoney(raw) {
    if (raw == null) return null;
    var s = String(raw).trim();
    if (!s || s === '별도') return null;
    if (/없|미발생|무료/.test(s)) return 0;
    s = s.replace(/약/g, '').replace(/추가/g, '').replace(/\([^)]*\)/g, '').trim();
    if (/\d\s*[~～]\s*\d/.test(s)) return { range: true };
    var man = s.match(/(\d+)\s*만/);
    var cheon = s.match(/(\d+)\s*천/);
    if (man || cheon) {
      return (man ? parseInt(man[1], 10) * 10000 : 0) + (cheon ? parseInt(cheon[1], 10) * 1000 : 0);
    }
    var digits = s.replace(/[^\d]/g, '');
    if (!digits) return null;
    return parseInt(digits, 10);
  }

  function parseKm(raw) {
    if (raw == null) return null;
    var s = String(raw).trim();
    if (!s) return null;
    s = s.replace(/\([^)]*\)/g, '').trim();
    var range = s.match(/(\d+(?:\.\d+)?)\s*[~～\-]\s*(\d+(?:\.\d+)?)/);
    if (range) return { km: null, range: [parseFloat(range[1]), parseFloat(range[2])] };
    var n = s.match(/(\d+(?:\.\d+)?)/);
    if (!n) return null;
    var km = parseFloat(n[1]);
    if (/왕복/.test(s) && !/편도/.test(s)) km = km / 2;
    return { km: km, range: null };
  }

  function normalizeWhen(rest) {
    var clocks = extractClocks(rest);
    if (!clocks.length) return '';
    if (clocks.length === 1) return clocks[0];
    return clocks[0] + ' ~ ' + clocks[1];
  }

  var PHONE_RE = /01[016789][-\s.]?\d{3,4}[-\s.]?\d{4}|0(?:2[-\s.]?\d{3,4}|[3-6]\d[-\s.]?\d{3,4}|70[-\s.]?\d{3,4})[-\s.]?\d{4}/;

  function extractPhone(line) {
    var m = String(line || '').match(PHONE_RE);
    return m ? m[0] : '';
  }

  function isPhoneOnly(line) {
    var phone = extractPhone(line);
    if (!phone) return false;
    return String(line).replace(phone, '').replace(/[\s().\-]/g, '') === '';
  }

  var LABELS = [
    { label: '도착소요시간', key: 'goMin' },
    { label: '도착소요', key: 'goMin' },
    { label: '가는시간', key: 'goMin' },
    { label: '갈때', key: 'goMin' },
    { label: '복귀소요시간', key: 'backMin' },
    { label: '복귀소요', key: 'backMin' },
    { label: '오는시간', key: 'backMin' },
    { label: '올때', key: 'backMin' },
    { label: '복귀시간', key: 'backMin' },
    { label: '현장체류', key: 'shopMin' },
    { label: '현장시간', key: 'shopMin' },
    { label: '세팅시간', key: 'shopMin' },
    { label: '장보기시간', key: 'shopMin' },
    { label: '출발시각', key: 'depart' },
    { label: '출발시간', key: 'depart' },
    { label: '출발', key: 'depart' },
    { label: '도착시간', key: 'arrive' },
    { label: '도착', key: 'arrive' },
    { label: '행사시작', key: 'eventTime' },
    { label: '행사시간', key: 'eventTime' },
    { label: '행사', key: 'eventTime' },
    { label: '장소', key: 'place' },
    { label: '주소', key: 'place' },
    { label: '담당자', key: 'personLine' },
    { label: '연락처', key: 'phone' },
    { label: '전화번호', key: 'phone' },
    { label: '품목', key: 'items' },
    { label: '메뉴', key: 'items' },
    { label: '편도거리', key: 'km' },
    { label: '편도연료비', key: 'fuel' },
    { label: '편도통행료', key: 'toll' },
    { label: '연료비', key: 'fuel' },
    { label: '유류비', key: 'fuel' },
    { label: '통행료', key: 'toll' },
    { label: '톨비', key: 'toll' },
    { label: '주차비', key: 'parking' },
    { label: '일자', key: 'date' },
    { label: '날짜', key: 'date' },
    { label: '일시', key: 'date' },
    { label: '거리', key: 'km' },
    { label: '편도', key: 'km' },
    { label: '배송/출장수고비', kind: 'band' },
    { label: '배송출장수고비', kind: 'band' },
    { label: '배송수고비', kind: 'band' },
    { label: '구간수고비', kind: 'band' },
    { label: '기본수고비', kind: 'band' },
    { label: '수고비', kind: 'band' },
    { label: '구간추가할증', kind: 'percent' },
    { label: '구간할증', kind: 'percent' },
    { label: '세팅완료', key: 'setupDone' },
    { label: '세팅수고비', kind: 'extra', name: '세팅수고비' },
    { label: '주말할증', kind: 'extra', name: '주말할증' },
    { label: '휴일할증', kind: 'extra', name: '휴일할증' },
    { label: '상하차수고비', kind: 'extra', name: '상하차 수고비' },
    { label: '적재이동비', kind: 'extra', name: '적재이동비' },
    { label: '적재수고비', kind: 'extra', name: '적재이동비' },
    { label: '적대이동비', kind: 'extra', name: '적재이동비' },
    { label: '기물적재이동비', kind: 'extra', name: '기물 적재이동비' },
    { label: '층수운반비', kind: 'extra', name: '층수운반비' },
    { label: '외곽수고비', kind: 'extra', name: '외곽수고비' }
  ];

  function stripPrefix(original, label) {
    var target = compact(label);
    var s = String(original).replace(/^[•ㆍ]\s*/, '');
    var i = 0;
    var t = 0;
    while (i < s.length && t < target.length) {
      if (/\s/.test(s[i]) || s[i] === '•' || s[i] === 'ㆍ') { i++; continue; }
      if (s[i] !== target[t]) return null;
      i++;
      t++;
    }
    if (t !== target.length) return null;
    return s.slice(i).replace(/^[\s:：]+/, '').trim();
  }

  function matchLabel(line) {
    var best = null;
    var bestLen = 0;
    for (var i = 0; i < LABELS.length; i++) {
      var rest = stripPrefix(line, LABELS[i].label);
      if (rest == null) continue;
      var len = compact(LABELS[i].label).length;
      if (len > bestLen) {
        best = { def: LABELS[i], rest: rest };
        bestLen = len;
      }
    }
    return best;
  }

  function shouldIgnore(line) {
    var c = compact(line);
    if (/^(총소요시간|합계|인건비|차량운영비)/.test(c)) return true;
    if (/^[•ㆍ]/.test(line.trim()) && /^(유류비|통행료)/.test(c)) return true;
    if (/^\(/.test(line.trim())) {
      var inner = line.trim().replace(/^\(+/, '').replace(/\)+$/, '').trim();
      if (looksLikePlace(inner) || /건물|회관|빌딩|타워|홀|로비/.test(inner)) return false;
      if (/시급|왕복|편도|유류|km|별도|포함|기준|\d[\d,]*\s*원/.test(inner)) return true;
      return false;
    }
    if (/^[-–—_=]{4,}$/.test(line.trim())) return true;
    return false;
  }

  function looksLikeInstruction(line) {
    return /(?:해줘|해주세요|뽑아|참고|기입|계산해|알겠지|부탁해|부탁드립니다)/.test(line);
  }

  function nextContentLine(lines, index) {
    for (var i = index + 1; i < lines.length; i++) {
      var line = String(lines[i] || '').replace(/\*\*/g, '').trim();
      if (!line || shouldIgnore(line)) continue;
      return line;
    }
    return '';
  }

  function looksLikeNameStub(line) {
    if (line.length < 2 || line.length > 24) return false;
    if (looksLikeInstruction(line) || looksLikePlace(line)) return false;
    if (/[.?!。？！\d]/.test(line)) return false;
    if (/분|시급|합계|원|출발|도착|행사/.test(line)) return false;
    return /[가-힣]{2,}/.test(line);
  }

  function looksLikePlace(line) {
    if (line.length < 4) return false;
    if (/[.?!。？！]/.test(line)) return false;
    if (/분|km|시급|합계/i.test(line)) return false;
    if (/\d[\d,]*\s*원/.test(line)) return false;
    return /[가-힣]/.test(line) && /(?:로|길|\d+동|\d+호|[가-힣]+구|[가-힣]+시|[가-힣]+군|읍|면|리|\d+층|호텔|관|홀|대학교|센터|빌딩|타워|캠퍼스|원(?![가-힣]))/.test(line);
  }

  function emptyParsed() {
    return {
      type: '',
      person: '',
      event: '',
      date: '',
      phone: '',
      contacts: [],
      place: '',
      items: '',
      depart: '',
      arrive: '',
      eventTime: '',
      setupDone: '',
      goMin: null,
      backMin: null,
      shopMin: null,
      km: null,
      kmRange: null,
      fuel: null,
      toll: null,
      parking: null,
      includeBand: false,
      requestedBand: null,
      percentMode: 'none',
      extras: [],
      warnings: []
    };
  }

  function addContact(parsed, name, phone) {
    phone = String(phone || '').trim();
    name = String(name || '').replace(phone, '').replace(/[()（）]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!name) {
      if (phone && !parsed.phone) parsed.phone = phone;
      return;
    }
    if (!phone) return;
    parsed.contacts = parsed.contacts || [];
    var key = name + '|' + phone;
    for (var i = 0; i < parsed.contacts.length; i++) {
      if (parsed.contacts[i].name + '|' + parsed.contacts[i].phone === key) return;
    }
    parsed.contacts.push({ name: name, phone: phone });
    if (phone && !parsed.phone) parsed.phone = phone;
  }

  function addItem(parsed, text) {
    text = String(text || '').replace(/^\*\s*/, '').trim();
    if (!text) return;
    if (!parsed.items) parsed.items = text;
    else if (parsed.items.indexOf(text) === -1) parsed.items = parsed.items + ', ' + text;
  }

  function applyPersonLine(parsed, rest) {
    var phone = extractPhone(rest);
    var name = rest.replace(/연락처\s*확인\s*중/g, '');
    if (phone) name = name.replace(phone, '');
    name = name.replace(/[()（）]/g, ' ').replace(/\s+/g, ' ').trim();
    if (name) parsed.person = name;
    if (phone) parsed.phone = phone;
  }

  function applyKm(parsed, rest) {
    var parsedKm = parseKm(rest);
    if (!parsedKm) return;
    if (parsedKm.range) parsed.kmRange = parsedKm.range;
    if (parsedKm.km != null) parsed.km = parsedKm.km;
  }

  function applyMoneyField(parsed, key, rest) {
    var money = parseMoney(rest);
    if (money && typeof money === 'object') return;
    if (typeof money !== 'number') return;
    parsed[key] = money;
  }

  function applyExtra(parsed, def, rest) {
    var noteMatch = rest.match(/\(([^)]*)\)\s*$/);
    var note = noteMatch ? noteMatch[1].trim() : '';
    var amountSrc = noteMatch ? rest.slice(0, noteMatch.index) : rest;
    var amount = parseMoney(amountSrc);
    if (typeof amount !== 'number' || !(amount > 0)) return;
    var row = { label: def.name, amount: amount, note: note, noteAuto: !note };
    var idx = -1;
    for (var i = 0; i < parsed.extras.length; i++) {
      if (parsed.extras[i].label === def.name) idx = i;
    }
    if (idx >= 0) parsed.extras[idx] = row;
    else parsed.extras.push(row);
  }

  function applyBand(parsed, rest) {
    if (isShopping(parsed.type)) {
      parsed.includeBand = false;
      parsed.warnings.push('장보기 견적이라 수고비는 빼 두었습니다.');
      return;
    }
    parsed.includeBand = true;
    var amount = parseMoney(rest);
    if (typeof amount === 'number') parsed.requestedBand = amount;
  }

  function applyPercent(parsed, rest) {
    if (/10\s*%|10％|10\s*퍼/.test(rest)) {
      parsed.percentMode = 'percent10';
      return;
    }
    var amount = parseMoney(rest);
    if (amount == null || amount === 5000) {
      parsed.percentMode = 'fixed5000';
      return;
    }
    if (typeof amount === 'number' && amount > 0) {
      parsed.extras.push({ label: '구간할증', amount: amount, note: '', noteAuto: false });
    }
  }

  function applyLabeled(parsed, labeled) {
    var key = labeled.def.key;
    var kind = labeled.def.kind;
    var rest = labeled.rest;
    if (kind === 'band') return applyBand(parsed, rest);
    if (kind === 'extra') return applyExtra(parsed, labeled.def, rest);
    if (kind === 'percent') return applyPercent(parsed, rest);
    if (key === 'goMin' || key === 'backMin' || key === 'shopMin') {
      var minutes = parseDuration(rest);
      if (minutes == null) return;
      parsed[key] = minutes;
      return;
    }
    if (key === 'depart' || key === 'arrive' || key === 'eventTime' || key === 'setupDone') {
      var when = normalizeWhen(rest);
      if (!when) return;
      parsed[key] = when;
      return;
    }
    if (key === 'km') return applyKm(parsed, rest);
    if (key === 'fuel' || key === 'toll' || key === 'parking') return applyMoneyField(parsed, key, rest);
    if (key === 'date') {
      var date = parseDate(rest);
      if (date) parsed.date = date;
      return;
    }
    if (key === 'personLine') return applyPersonLine(parsed, rest);
    if (key === 'phone') {
      var phone = extractPhone(rest) || rest.trim();
      if (phone) parsed.phone = phone;
      return;
    }
    if (key === 'items') return addItem(parsed, rest);
    if (key === 'place') {
      if (rest) parsed.place = rest;
    }
  }

  function parseHeader(line) {
    var m = line.match(/^\[([^\]]+)\]\s*(.*)$/);
    if (!m) return null;
    var type = m[1].trim();
    var parts = m[2].trim().split(/\s*[/／]\s*/).map(function (s) { return s.trim(); }).filter(Boolean);
    var person = '';
    var event = '';
    if (parts.length >= 2) {
      person = parts[0];
      event = parts.slice(1).join(' / ');
    } else if (parts.length === 1) {
      if (matchVenue({ place: parts[0], event: '', items: '', type: '' })) event = parts[0];
      else person = parts[0];
    }
    return { type: type, person: person, event: event };
  }

  function parseMemo(text) {
    var parsed = emptyParsed();
    var pendingName = '';
    var lines = String(text || '').replace(/\r/g, '').split('\n');
    for (var n = 0; n < lines.length; n++) {
      var line = lines[n].replace(/\*\*/g, '').trim();
      if (!line || shouldIgnore(line)) continue;
      var header = parseHeader(line);
      if (header) {
        if (header.type) parsed.type = header.type;
        if (header.person) parsed.person = header.person;
        if (header.event) parsed.event = header.event;
        var headerPhone = extractPhone(line);
        if (headerPhone) parsed.phone = headerPhone;
        continue;
      }
      var labeled = matchLabel(line);
      if (labeled) {
        applyLabeled(parsed, labeled);
        var linePhone = extractPhone(line);
        if (linePhone) parsed.phone = linePhone;
        continue;
      }
      if (isDateOnly(line)) {
        var date = parseDate(line);
        if (date) parsed.date = date;
        continue;
      }
      if (/^\*/.test(line)) {
        addItem(parsed, line);
        continue;
      }
      var upcoming = nextContentLine(lines, n);
      var phone = extractPhone(line);
      if (!phone && isPhoneOnly(upcoming) && !looksLikeInstruction(line) && !looksLikePlace(line) && !/[.?!。？！]/.test(line) && !/\d[\d,]*\s*원/.test(line)) {
        pendingName = line;
        continue;
      }
      if (phone) {
        var nameSource = isPhoneOnly(line) && pendingName ? pendingName + ' ' + phone : line;
        pendingName = '';
        addContact(parsed, nameSource, phone);
        continue;
      }
      if (!looksLikeInstruction(line) && (looksLikePlace(line) || matchVenue({ place: line, event: '' }))) {
        parsed.place = parsed.place ? parsed.place + ' ' + line : line;
        continue;
      }
      if (looksLikeNameStub(line) && upcoming && (looksLikePlace(upcoming) || matchVenue({ place: upcoming, event: '' }))) {
        parsed.place = parsed.place ? parsed.place + ' ' + line : line;
        continue;
      }
      if (!parsed.items && /\d+\s*(?:인|명)/.test(line)) {
        addItem(parsed, line);
        continue;
      }
      if (parsed.items && !looksLikeInstruction(line) && !/[.?!。？！]/.test(line) && !/\d[\d,]*\s*원/.test(line)) {
        addItem(parsed, line.replace(/^\(+/, '').replace(/\)+$/, ''));
      }
    }
    if (isShopping(parsed.type)) parsed.includeBand = false;
    return parsed;
  }

  function decorateExtras(extras, suggestions) {
    return (extras || []).map(function (ex) {
      if (ex.note || ex.noteAuto === false) return ex;
      var hit = null;
      for (var i = 0; i < suggestions.length; i++) {
        var s = suggestions[i];
        if (s.label === ex.label && Number(s.amount) === Number(ex.amount) && s.note) hit = s;
      }
      if (!hit) return ex;
      return Object.assign({}, ex, { note: hit.note, noteAuto: true });
    });
  }

  function withAutoNotes(input) {
    return decorateExtras((input && input.extras) || [], loadSuggestions(input || {}));
  }

  function asMoney(n) {
    if (n == null || n === '') return 0;
    var v = Number(String(n).replace(/,/g, ''));
    return Number.isFinite(v) ? Math.round(v) : 0;
  }

  function asKm(v) {
    if (v == null || v === '') return null;
    var n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  function asMinutes(v) {
    if (v == null || v === '') return null;
    var n = Number(v);
    if (!Number.isFinite(n) || n < 0) return null;
    return Math.round(n);
  }

  function normalizeWages(list) {
    var src = list && list.length ? list : DEFAULT_WAGES;
    var out = [];
    src.forEach(function (w) {
      var n = Math.round(Number(w));
      if (n > 0 && out.indexOf(n) === -1) out.push(n);
    });
    out.sort(function (a, b) { return a - b; });
    return out.length ? out : DEFAULT_WAGES.slice();
  }

  function moneyFor(wage, parts) {
    var labor = laborWon(wage, parts.minutes);
    var before = labor + parts.vehicle + parts.fuel + parts.toll + parts.band + parts.extraSum;
    var percent = 0;
    if (parts.percentMode === 'fixed5000') percent = 5000;
    if (parts.percentMode === 'percent10') percent = Math.round(before * 0.1);
    return { wage: wage, labor: labor, before: before, percent: percent, total: before + percent };
  }

  function settlementOf(minutes, wage, basePay, vehicle, fuel, toll, band, extraSum, percentMode) {
    var gross = laborWon(wage, minutes);
    var before = gross + vehicle + fuel + toll + band + extraSum;
    var percent = 0;
    if (percentMode === 'fixed5000') percent = 5000;
    else if (percentMode === 'percent10') percent = Math.round(before * 0.1);
    var service = band + extraSum + percent;
    var pure = vehicle + fuel + toll;
    var withService = pure + service;
    var pay = gross;
    return {
      gross: gross,
      basePay: basePay,
      pay: pay,
      pure: pure,
      withService: withService,
      percent: percent,
      service: service,
      total: pay + withService
    };
  }

  function formatTitle(input) {
    var type = String(input.type || '출장').trim() || '출장';
    var person = String(input.person || '').trim();
    var event = String(input.event || '').trim();
    var rest = person;
    if (event) rest = rest ? rest + ' / ' + event : event;
    return '[' + type + ']' + (rest ? ' ' + rest : '');
  }

  function formatHeader(input) {
    var lines = [];
    lines.push(formatTitle(input));
    var dateLabel = input.date ? formatDateLabel(input.date) : '';
    if (dateLabel) lines.push('일자: ' + dateLabel);
    var times = [];
    if (input.depart) times.push('출발: ' + input.depart);
    if (input.arrive) times.push('도착: ' + input.arrive);
    if (input.setupDone) times.push('세팅완료: ' + input.setupDone);
    if (input.eventTime) times.push('행사시작: ' + input.eventTime);
    if (times.length) {
      lines.push('');
      times.forEach(function (t) { lines.push(t); });
    }
    if (input.place) {
      lines.push('');
      lines.push('장소: ' + input.place);
    }
    var contacts = input.contacts || [];
    var namedContacts = contacts.filter(function (c) { return c.name; });
    if (input.person || namedContacts.length) {
      lines.push('');
      if (input.person) {
        var phone = input.phone ? formatPhone(input.phone) : '';
        var phoneIsNamed = namedContacts.some(function (c) { return c.phone && formatPhone(c.phone) === phone; });
        if (phone && !phoneIsNamed) lines.push('담당자: ' + input.person + ' (' + phone + ')');
        else if (namedContacts.length) lines.push('담당자: ' + input.person);
        else lines.push('담당자: ' + input.person + ' (연락처 확인중)');
      }
      if (namedContacts.length) {
        var bits = namedContacts.map(function (c) {
          var p = c.phone ? formatPhone(c.phone) : '';
          return p ? c.name + ' (' + p + ')' : c.name;
        });
        lines.push('연락처: ' + bits.join(', '));
      }
    }
    if (input.items) {
      lines.push('');
      lines.push('품목: ' + input.items);
    }
    return lines.join('\n');
  }

  function wageList(wages) {
    return wages.map(formatNumber).join(' / ') + '원';
  }

  function formatCosts(model) {
    var lines = [];
    lines.push('편도거리: ' + formatKm(model.km) + 'km (왕복 ' + formatKm(model.roundKm) + 'km)');
    lines.push('편도 연료비: ' + formatWon(model.fuel));
    lines.push('편도 통행료: ' + formatWon(model.toll));
    lines.push('도착소요시간: ' + formatDuration(model.goMin) + ' (' + model.goMin + '분)');
    lines.push('복귀소요시간: ' + formatDuration(model.backMin) + ' (' + model.backMin + '분)');
    if (model.shopMin > 0) lines.push('현장체류: ' + model.shopMin + '분');
    lines.push('총소요시간: ' + model.minutes + '분 (' + formatDuration(model.minutes) + ')');
    var wagesText = wageList(model.wages);
    lines.push('•인건비 ' + model.rows.map(function (r) { return formatWon(r.labor); }).join(' / '));
    lines.push('(시급 ' + wagesText + ' × ' + model.minutes + '분)');
    if (model.band > 0) {
      lines.push('•배송/출장 수고비 ' + formatWon(model.band));
      lines.push('(왕복 ' + formatKm(model.roundKm) + 'km, ' + bandLabel(model.roundKm) + ')');
    }
    model.extras.forEach(function (e) {
      lines.push('•' + e.label + ' ' + formatWon(e.amount) + (e.note ? ' (' + e.note + ')' : ''));
    });
    if (model.percentMode === 'percent10') {
      lines.push('•구간할증 ' + model.rows.map(function (r) { return formatWon(r.percent); }).join(' / '));
      lines.push('(인건비와 실비를 더한 금액의 10%)');
    } else if (model.percentMode === 'fixed5000') {
      lines.push('•구간할증 ' + formatWon(5000));
    }
    lines.push('•차량 운영비 ' + formatWon(model.vehicle));
    lines.push('(왕복 ' + formatKm(model.roundKm) + 'km × ' + KM_RATE + '원/km, 유류비 제외)');
    lines.push('•유류비 ' + formatWon(model.fuelRound));
    if (model.fuelRound !== model.fuel * 2) {
      lines.push('(편도 ' + formatWon(model.fuel) + ' × 2 = ' + formatWon(model.fuel * 2) + ', 100원 단위 올림)');
    } else {
      lines.push('(편도 ' + formatWon(model.fuel) + ' × 왕복 2)');
    }
    lines.push('•통행료 ' + formatWon(model.tollRound));
    if (model.toll > 0) lines.push('(편도 ' + formatWon(model.toll) + ' × 왕복 2)');
    var keeps = model.rows.map(function (r) { return r.total - r.labor; });
    var keepSame = keeps.every(function (n) { return n === keeps[0]; });
    lines.push('•인건비 제외 차량유지비 ' + (keepSame ? formatWon(keeps[0]) : keeps.map(formatWon).join(' / ')));
    lines.push('•합계 ' + model.rows.map(function (r) { return formatWon(r.total); }).join(' / '));
    var includeNames = [];
    if (model.band > 0) includeNames.push('배송/출장 수고비');
    model.extras.forEach(function (e) {
      if (includeNames.indexOf(e.label) === -1) includeNames.push(e.label);
    });
    if (model.percentMode === 'percent10' || model.percentMode === 'fixed5000') includeNames.push('구간할증');
    var tail = '(시급 ' + wagesText + ' 기준';
    if (includeNames.length) tail += ', ' + includeNames.join('·') + ' 포함';
    tail += ')';
    lines.push(tail);
    lines.push(model.parking > 0 ? '주차비 ' + formatWon(model.parking) + ' (별도)' : '주차비 별도');
    return lines.join('\n');
  }

  function formatSettlementText(input, settlement, rows) {
    var who = formatTitle(input);
    var customer = null;
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].wage === settlement.wage) customer = rows[i];
    }
    var lines = [
      '[사내 정산] ' + who.replace(/^\[[^\]]+\]\s*/, ''),
      '총 소요: ' + settlement.minutes + '분',
      '적용 시급: ' + formatWon(settlement.wage),
      '계산: ROUND(' + formatNumber(settlement.wage) + ' × ' + settlement.minutes + ' ÷ 60) = ' + formatWon(settlement.gross),
      '운송 인건비: ' + formatWon(settlement.gross),
      '실제 운송급여: ' + formatWon(settlement.pay),
      '차량 운영비: ' + formatWon(settlement.vehicle),
      '유류비: ' + formatWon(settlement.fuel),
      '통행료: ' + formatWon(settlement.toll),
      '순수 실비: ' + formatWon(settlement.pure),
      '수고·할증: ' + formatWon(settlement.service),
      '수고 포함 실비: ' + formatWon(settlement.withService),
      '총 정산: ' + formatWon(settlement.total),
      '주차비: ' + (settlement.parking > 0 ? formatWon(settlement.parking) + ' (별도)' : '별도')
    ];
    if (customer) lines.push('고객 견적(시급 ' + formatWon(settlement.wage) + '): ' + formatWon(customer.total));
    return lines.join('\n');
  }

  function buildQuote(input) {
    input = input || {};
    var warnings = (input.warnings || []).slice();
    var shopping = isShopping(input.type);
    if (shopping && input.includeBand) warnings.push('장보기 견적이라 구간 수고비는 넣지 않았습니다.');
    var includeBand = !shopping && !!input.includeBand;
    var percentMode = input.percentMode === 'fixed5000' || input.percentMode === 'percent10' ? input.percentMode : 'none';
    var km = asKm(input.km);
    var goMin = asMinutes(input.goMin);
    var backMin = asMinutes(input.backMin);
    var shopMin = asMinutes(input.shopMin) || 0;
    var fuelMissing = input.fuel == null || input.fuel === '';
    var fuel = fuelMissing ? null : asMoney(input.fuel);
    var toll = input.toll == null || input.toll === '' ? 0 : asMoney(input.toll);
    var parking = input.parking == null || input.parking === '' ? 0 : asMoney(input.parking);
    var wages = normalizeWages(input.wages);
    var suggestions = loadSuggestions(input);
    var extras = decorateExtras(input.extras || [], suggestions)
      .filter(function (e) { return e.on !== false; })
      .map(function (e) { return { label: String(e.label || '').trim(), amount: asMoney(e.amount), note: String(e.note || '').trim() }; })
      .filter(function (e) { return e.label && e.amount > 0; });

    var missing = [];
    if (!(km > 0)) missing.push('편도 거리');
    if (goMin == null) missing.push('가는 시간');
    if (backMin == null) missing.push('오는 시간');
    if (fuel == null) missing.push('편도 연료비');
    var minutes = (goMin || 0) + (backMin || 0) + shopMin;
    if (goMin != null && backMin != null && minutes <= 0 && missing.indexOf('가는 시간') === -1) missing.push('소요 시간');

    var roundKm = km > 0 ? roundKmOf(km) : 0;
    var band = includeBand && roundKm > 0 ? bandFee(roundKm) : 0;
    if (includeBand && input.requestedBand != null && km > 0 && band !== Number(input.requestedBand)) {
      warnings.push('메모의 수고비는 ' + formatWon(input.requestedBand) + '이고, 구간 규정은 ' + formatWon(band) + '입니다. 구간 규정 금액을 넣었습니다.');
    }
    var vehicle = km > 0 ? vehicleCost(km) : 0;
    var fuelRound = fuel == null ? 0 : ceil100(fuel * 2);
    var tollRound = toll * 2;
    var extraSum = extras.reduce(function (sum, e) { return sum + e.amount; }, 0);
    var parts = { minutes: minutes, vehicle: vehicle, fuel: fuelRound, toll: tollRound, band: band, extraSum: extraSum, percentMode: percentMode };
    var rows = wages.map(function (w) { return moneyFor(w, parts); });
    var ready = missing.length === 0;
    var header = formatHeader(input);
    var text = header;
    if (ready) {
      text = header + '\n\n' + DIVIDER + '\n\n' + formatCosts({
        km: km,
        roundKm: roundKm,
        fuel: fuel,
        fuelRound: fuelRound,
        toll: toll,
        tollRound: tollRound,
        goMin: goMin,
        backMin: backMin,
        shopMin: shopMin,
        minutes: minutes,
        wages: wages,
        rows: rows,
        band: band,
        extras: extras,
        percentMode: percentMode,
        vehicle: vehicle,
        parking: parking
      });
    }

    var payWage = normalizeWages([input.payWage == null || input.payWage === '' ? 13000 : input.payWage])[0];
    var basePay = asMoney(input.basePay || 0);
    var settlement = null;
    if (ready) {
      var settled = settlementOf(minutes, payWage, basePay, vehicle, fuelRound, tollRound, band, extraSum, percentMode);
      settled.minutes = minutes;
      settled.wage = payWage;
      settled.vehicle = vehicle;
      settled.fuel = fuelRound;
      settled.toll = tollRound;
      settled.parking = parking;
      settled.text = formatSettlementText(input, settled, rows.concat([moneyFor(payWage, parts)]));
      settlement = settled;
    }

    return {
      ready: ready,
      missing: missing,
      warnings: warnings,
      text: text,
      rows: ready ? rows : [],
      suggestions: suggestions,
      extras: extras,
      roundKm: roundKm,
      band: band,
      vehicle: vehicle,
      fuelRound: fuelRound,
      tollRound: tollRound,
      minutes: minutes,
      venue: matchVenue(input),
      departure: suggestDeparture(input),
      settlement: settlement
    };
  }

  return {
    KM_RATE: KM_RATE,
    DEFAULT_WAGES: DEFAULT_WAGES,
    WAGE_PRESETS: WAGE_PRESETS,
    DIVIDER: DIVIDER,
    EXAMPLES: EXAMPLES,
    VENUES: VENUES,
    parseMemo: parseMemo,
    buildQuote: buildQuote,
    laborWon: laborWon,
    bandFee: bandFee,
    bandLabel: bandLabel,
    vehicleCost: vehicleCost,
    ceil100: ceil100,
    matchVenue: matchVenue,
    loadSuggestions: loadSuggestions,
    suggestDeparture: suggestDeparture,
    applyVenueDefaults: applyVenueDefaults,
    describeVenue: describeVenue,
    withAutoNotes: withAutoNotes,
    formatDateLabel: formatDateLabel,
    formatWon: formatWon,
    formatNumber: formatNumber,
    formatKm: formatKm,
    formatPhone: formatPhone,
    parseDuration: parseDuration,
    parseMoney: parseMoney,
    headcount: headcount,
    isShopping: isShopping
  };
});
