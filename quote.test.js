'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const q = require('./quote.js');

test('dates and weekday do not depend on the machine timezone', function () {
  assert.equal(q.formatDateLabel('2026-11-20'), '26.11.20(금)');
  assert.equal(q.formatDateLabel('2026-01-01'), '26.01.01(목)');
  assert.equal(q.formatDateLabel('2026-02-31'), '');
});

test('labor follows minutes, not a rounded decimal hour', function () {
  assert.equal(q.laborWon(11000, 150), 27500);
  assert.equal(q.laborWon(12000, 150), 30000);
  assert.equal(q.laborWon(13000, 150), 32500);
  assert.equal(q.laborWon(13000, 146), 31633);
  assert.equal(q.laborWon(13000, 146) - 2210, 29423);
  assert.notEqual(Math.round(13000 * 2.43), 31633);
  assert.equal(q.laborWon(11000, 1), 183);
  assert.equal(q.laborWon(30, 1), 1);
  assert.equal(q.laborWon(90, 1), 2);
  assert.equal(q.laborWon(11000, 40), 7333);
});

test('distance band, vehicle cost, and fuel ceiling', function () {
  assert.equal(q.bandFee(0), 0);
  assert.equal(q.bandFee(40), 8000);
  assert.equal(q.bandLabel(40), '40km 이하');
  assert.equal(q.bandFee(40.1), 9000);
  assert.equal(q.bandFee(60), 9000);
  assert.equal(q.bandLabel(60), '41~60km 구간');
  assert.equal(q.bandFee(60.1), 10000);
  assert.equal(q.bandLabel(60.1), '61~80km 구간');
  assert.equal(q.bandFee(166), 15000);
  assert.equal(q.bandLabel(166), '161~180km 구간');
  assert.equal(q.vehicleCost(30), 13320);
  assert.equal(q.vehicleCost(83), 36852);
  assert.equal(q.vehicleCost(27.4), 12166);
  assert.equal(q.ceil100(8316), 8400);
  assert.equal(q.ceil100(12000), 12000);
  assert.equal(q.ceil100(0), 0);
});

test('a rough memo stays a draft and suggests a departure', function () {
  const parsed = q.parseMemo(q.EXAMPLES.rough);
  assert.equal(parsed.type, '상담배송/출장');
  assert.equal(parsed.person, '허원혜');
  assert.equal(parsed.event, '서울대학교');
  assert.equal(parsed.date, '2026-11-20');
  assert.equal(parsed.depart, '');
  assert.equal(parsed.arrive, '13:00');
  assert.equal(parsed.eventTime, '14:00 ~ 17:00');
  assert.equal(parsed.place, '서울대학교 우성경제관 223동 504호');
  assert.equal(parsed.items, '디저트 50인분 반출장');
  assert.equal(parsed.km, null);
  assert.equal(parsed.fuel, null);
  assert.equal(parsed.goMin, null);

  const quote = q.buildQuote(parsed);
  assert.equal(quote.ready, false);
  assert.deepEqual(quote.missing.slice().sort(), ['가는 시간', '오는 시간', '편도 거리', '편도 연료비'].sort());
  assert.equal(quote.text.includes('합계'), false);
  assert.match(quote.text, /\[상담배송\/출장\] 허원혜 \/ 서울대학교/);
  assert.match(quote.text, /담당자: 허원혜 \(연락처 확인중\)/);

  const sug = q.suggestDeparture(parsed);
  assert.equal(sug.from, '11:30');
  assert.equal(sug.to, '11:45');
  assert.match(sug.reason, /도착 13:00 기준/);
  assert.match(sug.reason, /50~60분/);
  assert.match(sug.reason, /25~30분/);

  const withGo = q.suggestDeparture(Object.assign({}, parsed, { goMin: 60 }));
  assert.equal(withGo.from, '11:30');
  assert.equal(withGo.to, '11:35');

  const suggestions = q.loadSuggestions(parsed);
  assert.equal(suggestions.length, 1);
  assert.equal(suggestions[0].amount, 10000);
  assert.equal(suggestions[0].note, '우성경제관 5층 504호 기물/세팅 운반');
});

test('confirmed memo matches the kakao paragraph and the worked total', function () {
  const parsed = q.parseMemo(q.EXAMPLES.confirmed);
  assert.equal(parsed.depart, '11:30');
  assert.equal(parsed.arrive, '13:00');
  assert.equal(parsed.km, 30);
  assert.equal(parsed.fuel, 6000);
  assert.equal(parsed.toll, null);
  assert.equal(parsed.goMin, 60);
  assert.equal(parsed.backMin, 90);
  assert.equal(parsed.includeBand, false);
  assert.equal(parsed.extras.length, 1);
  assert.equal(parsed.extras[0].label, '적재이동비');
  assert.equal(parsed.extras[0].amount, 10000);

  const quote = q.buildQuote(parsed);
  assert.equal(quote.ready, true);
  assert.equal(quote.vehicle, 13320);
  assert.equal(quote.fuelRound, 12000);
  assert.equal(quote.tollRound, 0);
  assert.equal(quote.band, 0);
  assert.deepEqual(quote.rows.map(function (r) { return r.total; }), [62820, 65320, 67820]);
  assert.equal(quote.text, [
    '[상담배송/출장] 허원혜 / 서울대학교',
    '일자: 26.11.20(금)',
    '',
    '출발: 11:30',
    '도착: 13:00',
    '행사시작: 14:00 ~ 17:00',
    '',
    '장소: 서울대학교 우성경제관 223동 504호',
    '',
    '담당자: 허원혜 (연락처 확인중)',
    '',
    '품목: 디저트 50인분 반출장',
    '',
    q.DIVIDER,
    '',
    '편도거리: 30km (왕복 60km)',
    '편도 연료비: 6,000원',
    '편도 통행료: 0원',
    '도착소요시간: 1시간 (60분)',
    '복귀소요시간: 1시간 30분 (90분)',
    '총소요시간: 150분 (2시간 30분)',
    '•인건비 27,500원 / 30,000원 / 32,500원',
    '(시급 11,000 / 12,000 / 13,000원 × 150분)',
    '•적재이동비 10,000원 (우성경제관 5층 504호 기물/세팅 운반)',
    '•차량 운영비 13,320원',
    '(왕복 60km × 222원/km, 유류비 제외)',
    '•유류비 12,000원',
    '(편도 6,000원 × 왕복 2)',
    '•통행료 0원',
    '•합계 62,820원 / 65,320원 / 67,820원',
    '(시급 11,000 / 12,000 / 13,000원 기준, 적재이동비 포함)',
    '주차비 별도'
  ].join('\n'));
  assert.equal(quote.settlement.gross, 32500);
  assert.equal(quote.settlement.total, 67820);
});

test('a finished paragraph round-trips, including a phone number', function () {
  const shot = {
    type: '출장',
    person: '허원혜',
    event: '서울대학교',
    date: '2026-11-20',
    phone: '01049333518',
    place: '서울대학교 우성경제관 223동 504호',
    items: '핑거푸드 30인 출장',
    depart: '10:50',
    arrive: '12:00',
    eventTime: '14:00 ~ 17:00',
    goMin: 60,
    backMin: 90,
    km: 30,
    fuel: 6000,
    toll: 0,
    includeBand: false,
    extras: [{ label: '적재이동비', amount: 10000, note: '우성경제관 5층 504호 기물/세팅 운반', noteAuto: false }]
  };
  const first = q.buildQuote(shot);
  assert.match(first.text, /담당자: 허원혜 \(010 4933 3518\)/);
  assert.equal(first.rows[2].total, 67820);
  const again = q.buildQuote(q.parseMemo(first.text));
  assert.equal(again.text, first.text);
});

test('typo 적대이동비 still becomes the Seoul National loading line', function () {
  const text = q.EXAMPLES.confirmed.replace('적재이동비', '적대이동비');
  const quote = q.buildQuote(q.parseMemo(text));
  assert.match(quote.text, /•적재이동비 10,000원 \(우성경제관 5층 504호 기물\/세팅 운반\)/);
});

test('distance band is opt-in and uses the rule amount', function () {
  const base = q.parseMemo(q.EXAMPLES.confirmed);
  const withBand = q.buildQuote(Object.assign({}, base, { includeBand: true }));
  assert.equal(withBand.band, 9000);
  assert.deepEqual(withBand.rows.map(function (r) { return r.total; }), [71820, 74320, 76820]);
  assert.match(withBand.text, /•배송\/출장 수고비 9,000원/);
  assert.match(withBand.text, /41~60km 구간/);
  assert.match(withBand.text, /배송\/출장 수고비·적재이동비 포함/);

  const mismatched = q.buildQuote(Object.assign({}, base, { includeBand: true, km: 10, requestedBand: 9000 }));
  assert.equal(mismatched.band, 8000);
  assert.ok(mismatched.warnings.some(function (w) { return w.includes('8,000원'); }));
});

test('shopping quotes never include the distance service fee', function () {
  const parsed = q.parseMemo([
    '[장보기] 김직원 / 마켓',
    '수고비 8,000원',
    '편도거리 5km',
    '연료비 2000',
    '가는시간 20분',
    '오는시간 20분'
  ].join('\n'));
  assert.equal(parsed.includeBand, false);
  assert.ok(parsed.warnings.some(function (w) { return w.includes('장보기'); }));
  const quote = q.buildQuote(parsed);
  assert.equal(quote.band, 0);
  assert.equal(quote.text.includes('•배송/출장 수고비'), false);
  assert.equal(q.loadSuggestions(parsed).length, 0);
  assert.equal(quote.rows[0].labor, 7333);
});

test('fuel that is not on a 100 won boundary is ceiled', function () {
  const quote = q.buildQuote({
    type: '배송',
    person: '홍길동',
    event: '테스트',
    goMin: 30,
    backMin: 30,
    km: 21,
    fuel: 4158,
    toll: 0
  });
  assert.equal(quote.fuelRound, 8400);
  assert.match(quote.text, /•유류비 8,400원/);
  assert.match(quote.text, /8,316원, 100원 단위 올림/);
});

test('fixed venues and conditional surcharges', function () {
  assert.equal(q.VENUES.length, 7);
  const dongtan = q.applyVenueDefaults(q.parseMemo('[배송] 김배송 / 동탄 하이게이트\n장소: 동탄 하이게이트'));
  assert.equal(dongtan.km, 83);
  assert.equal(dongtan.toll, 6800);
  const keepNaver = q.applyVenueDefaults(Object.assign({}, dongtan, { km: 80 }));
  assert.equal(keepNaver.km, 80);

  const snu = q.applyVenueDefaults(q.parseMemo(q.EXAMPLES.rough));
  assert.equal(snu.km, null);
  assert.equal(snu.toll, 0);

  const gwang = q.matchVenue({ place: '광명 아브릴모마' });
  assert.equal(gwang.tollOptional, true);
  assert.notEqual(q.applyVenueDefaults({ place: '광명 아브릴모마' }).toll, 2800);

  const quote = q.buildQuote({
    type: '배송',
    person: '김배송',
    event: '동탄 하이게이트',
    place: '동탄 하이게이트',
    date: '2026-11-20',
    depart: '08:00',
    arrive: '09:30',
    goMin: 90,
    backMin: 90,
    km: 83,
    fuel: 12000,
    toll: 6800,
    includeBand: true
  });
  assert.equal(quote.vehicle, 36852);
  assert.equal(quote.tollRound, 13600);
  assert.equal(quote.band, 15000);
  assert.equal(quote.rows[0].total, quote.rows[0].labor + 36852 + quote.fuelRound + 13600 + 15000);
  assert.match(quote.text, /36,852원/);
  assert.match(quote.text, /13,600원/);
  assert.match(quote.text, /161~180km 구간/);

  assert.equal(q.loadSuggestions({ place: '반얀트리 호텔', items: '디저트 20인' }).length, 0);
  const banyan = q.loadSuggestions({ place: '반얀트리 호텔', items: '식사 120인' });
  assert.equal(banyan.length, 1);
  assert.equal(banyan[0].amount, 30000);

  const large = q.loadSuggestions({ place: '수원컨벤션센터', items: '도시락 150인' });
  assert.equal(large[0].label, '기물 적재이동비');
  assert.equal(large[0].amount, 20000);
  assert.equal(large[0].altAmount, 30000);

  assert.equal(q.loadSuggestions({ place: '이태원 에어비앤비' })[0].note, '3층 하역');
  assert.equal(q.loadSuggestions({ place: '서울대학교' })[0].note, '고지대·층수 운반');
  assert.match(q.describeVenue(q.matchVenue({ place: '이천소방서' })), /95km/);
  assert.match(q.describeVenue(q.matchVenue({ place: '포천 자작동' })), /58km/);
});

test('ten percent and on-site minutes are added explicitly', function () {
  const quote = q.buildQuote(Object.assign({}, q.parseMemo(q.EXAMPLES.confirmed), {
    percentMode: 'percent10',
    shopMin: 30
  }));
  assert.equal(quote.minutes, 180);
  assert.equal(quote.rows[0].labor, 33000);
  assert.equal(quote.rows[0].percent, Math.round(quote.rows[0].before * 0.1));
  assert.match(quote.text, /현장체류: 30분/);
  assert.match(quote.text, /구간할증/);
});

test('payroll deduction keeps the customer quote and the paid wage apart', function () {
  const quote = q.buildQuote({
    type: '배송',
    person: '기사',
    event: '테스트',
    goMin: 70,
    backMin: 76,
    km: 10,
    fuel: 1000,
    toll: 0,
    payWage: 13000,
    basePay: 2210,
    wages: [13000]
  });
  assert.equal(quote.minutes, 146);
  assert.equal(quote.settlement.gross, 31633);
  assert.equal(quote.settlement.pay, 29423);
  assert.equal(quote.rows[0].total - quote.settlement.total, 2210);
  assert.match(quote.settlement.text, /ROUND\(13,000 × 146 ÷ 60\) = 31,633원/);
});

test('loose wording for money, clocks, and duration', function () {
  const parsed = q.parseMemo([
    '연료비 6천원',
    '통행료 없음',
    '편도 10km',
    '도착 오후 1시',
    '복귀소요시간 1시간 30분',
    '갈 때 90분'
  ].join('\n'));
  assert.equal(parsed.fuel, 6000);
  assert.equal(parsed.toll, 0);
  assert.equal(parsed.km, 10);
  assert.equal(parsed.arrive, '13:00');
  assert.equal(parsed.backMin, 90);
  assert.equal(parsed.goMin, 90);
  assert.equal(q.parseMoney('1만 2천'), 12000);
  assert.equal(q.parseDuration('1.5시간'), 90);
  assert.equal(q.formatPhone('010-4933-3518'), '010 4933 3518');
});
