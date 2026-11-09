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

  const gwang = q.matchVenue({ place: '광명 아브릴 모마' });
  assert.equal(gwang.id, 'gwangmyeong');
  assert.equal(gwang.tollOptional, undefined);
  const gwangFilled = q.applyVenueDefaults({ place: '광명 아브릴모마' });
  assert.equal(gwangFilled.km, 33);
  assert.equal(gwangFilled.fuel, 5300);
  assert.equal(gwangFilled.toll, 2800);
  const gwangKeep = q.applyVenueDefaults({ place: '광명 아브릴모마', km: 30, fuel: 4000, toll: 0 });
  assert.equal(gwangKeep.km, 30);
  assert.equal(gwangKeep.fuel, 4000);
  assert.equal(gwangKeep.toll, 0);

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

test('minute pay is not reduced by store wages', function () {
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
  assert.equal(quote.settlement.pay, 31633);
  assert.equal(quote.settlement.text.includes('차감'), false);
});

test('a sangam delivery keeps the building line and the 5,000 won surcharge', function () {
  const parsed = q.parseMemo([
    '[배송] 신서연 / 디지털에볼루션',
    '26.11.17(화)',
    '출발 : 12:50',
    '도착 : 13:15-13:30',
    '서울특별시 마포구 상암산로 48-6',
    '중앙일보빌딩 21층 다목적홀',
    '편도거리 11km',
    '연료비 2,000원',
    '도착소요시간 30분',
    '복귀소요시간 30분',
    '구간추가할증 5,000원',
    '신서연 010 7535 8381',
    '*샌드박스 40개'
  ].join('\n'));
  assert.equal(parsed.place, '서울특별시 마포구 상암산로 48-6 중앙일보빌딩 21층 다목적홀');
  assert.equal(parsed.arrive, '13:15 ~ 13:30');
  assert.equal(parsed.phone, '010 7535 8381');
  assert.equal(parsed.percentMode, 'fixed5000');
  assert.equal(parsed.items, '샌드박스 40개');
  const quote = q.buildQuote(parsed);
  assert.equal(quote.minutes, 60);
  assert.equal(quote.vehicle, 4884);
  assert.equal(quote.fuelRound, 4000);
  assert.equal(quote.band, 0);
  assert.deepEqual(quote.rows.map(function (row) { return row.total; }), [24884, 25884, 26884]);
  assert.match(quote.text, /중앙일보빌딩 21층 다목적홀/);
  assert.match(quote.text, /•구간할증 5,000원/);
  assert.match(quote.text, /010 7535 8381/);
  const withHandling = q.parseMemo('상하차 수고비 5,000원 추가');
  assert.equal(withHandling.extras[0].label, '상하차 수고비');
  assert.equal(withHandling.extras[0].amount, 5000);
  const added = q.buildQuote(Object.assign({}, parsed, { extras: withHandling.extras }));
  assert.deepEqual(added.rows.map(function (row) { return row.total; }), [29884, 30884, 31884]);
  assert.match(added.text, /•상하차 수고비 5,000원/);
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
  assert.equal(q.formatPhone('02 880 6113'), '02 880 6113');
});

test('a Seoul National consultation keeps the hall, the landline, and the surcharge', function () {
  const parsed = q.parseMemo([
    '[상담출장] 김현진 / 서울대불어 / 메일',
    '27.01.06(수)',
    '출발 : 12:50',
    '도착 : 14:00',
    '행사시작 : 16:00',
    '서울대학교 보름홀',
    '서울대 인문대학 8동 605호 보름홀',
    '02 880 6113',
    '* 출장 식사 60인분',
    '* 와인잔 60개 / 와인 25개',
    '편도거리 36km',
    '연료비 5,000원',
    '도착소요시간 1시간 10분',
    '복귀소요시간 1시간 10분',
    '구간할증 5,000원'
  ].join('\n'));
  assert.equal(parsed.phone, '02 880 6113');
  assert.equal(parsed.place, '서울대학교 보름홀 서울대 인문대학 8동 605호 보름홀');
  assert.equal(parsed.percentMode, 'fixed5000');
  assert.equal(q.formatDateLabel(parsed.date), '27.01.06(수)');
  const quote = q.buildQuote(parsed);
  assert.equal(quote.vehicle, 15984);
  assert.equal(quote.fuelRound, 10000);
  assert.equal(quote.minutes, 140);
  assert.equal(quote.band, 0);
  assert.deepEqual(quote.rows.map(function (row) { return row.total; }), [56651, 58984, 61317]);
  assert.equal(quote.suggestions[0].amount, 10000);
  assert.equal(quote.suggestions[0].note, '6층 605호 기물/세팅 운반');
  assert.match(quote.text, /02 880 6113/);
});

test('a Yonsei lunch delivery keeps an 8,000 won surcharge once', function () {
  const parsed = q.parseMemo([
    '[배송] 구원회 / 서포트도시락',
    '26.11.08(일)',
    '출발 : 11:40',
    '도착 : 12:30',
    '연세대 백주년 기념 콘서트 홀',
    '박물관 앞쪽에서 수령 요청',
    '메니저 : 010 7600 6954',
    '*서포트 도시락 6인',
    '편도거리 20km',
    '연료비 4,000원',
    '도착소요시간 50분',
    '복귀소요시간 50분',
    '구간할증 8,000원'
  ].join('\n'));
  assert.equal(parsed.phone, '010 7600 6954');
  assert.equal(parsed.percentMode, 'none');
  assert.equal(parsed.extras[0].amount, 8000);
  assert.equal(q.formatDateLabel(parsed.date), '26.11.08(일)');
  const quote = q.buildQuote(parsed);
  assert.equal(quote.minutes, 100);
  assert.equal(quote.vehicle, 8880);
  assert.equal(quote.fuelRound, 8000);
  assert.equal(quote.band, 0);
  assert.equal(q.bandFee(quote.roundKm), 8000);
  assert.deepEqual(quote.rows.map(function (row) { return row.labor; }), [18333, 20000, 21667]);
  assert.deepEqual(quote.rows.map(function (row) { return row.total; }), [43213, 44880, 46547]);
});

test('a Deogyang division outing uses the confirmed toll and leaves the band out', function () {
  const parsed = q.parseMemo([
    '[출장] 윤용덕 / 군부대',
    '26.11.17(화)',
    '출발 : 11:20',
    '도착 : 12:00',
    '행사시작 : 14:00',
    '덕양구 56사단 (주소확인중)',
    '010 9105 8508',
    '*출장케이터링 50인분',
    '편도거리 30km',
    '연료비 5,000원',
    '통행료 1,800원',
    '도착소요시간 40분',
    '복귀소요시간 40분'
  ].join('\n'));
  assert.equal(parsed.toll, 1800);
  assert.equal(parsed.phone, '010 9105 8508');
  assert.equal(q.formatDateLabel(parsed.date), '26.11.17(화)');
  assert.equal(q.matchVenue(parsed), null);
  const quote = q.buildQuote(parsed);
  assert.equal(quote.minutes, 80);
  assert.equal(quote.vehicle, 13320);
  assert.equal(quote.tollRound, 3600);
  assert.equal(quote.fuelRound, 10000);
  assert.equal(quote.band, 0);
  assert.equal(q.bandFee(quote.roundKm), 9000);
  assert.deepEqual(quote.rows.map(function (row) { return row.total; }), [41587, 42920, 44253]);
});

test('an Avril morning party reuses the recorded distance, fuel, and toll', function () {
  const parsed = q.applyVenueDefaults(q.parseMemo([
    '[상담출장] 정화 / 아브릴모마 1부',
    '26.11.29(일)',
    '출발 : 8:30',
    '도착 : 9:30',
    '행사시작 : 11:30',
    '광명 아브릴 모마',
    '* 돌잔치 출장 22명',
    '도착소요시간 1시간',
    '복귀소요시간 1시간 10분'
  ].join('\n')));
  assert.equal(parsed.depart, '08:30');
  assert.equal(parsed.km, 33);
  assert.equal(parsed.fuel, 5300);
  assert.equal(parsed.toll, 2800);
  assert.equal(parsed.goMin, 60);
  assert.equal(parsed.backMin, 70);
  assert.equal(parsed.place, '광명 아브릴 모마');
  assert.equal(q.formatDateLabel(parsed.date), '26.11.29(일)');
  const quote = q.buildQuote(parsed);
  assert.equal(quote.minutes, 130);
  assert.equal(quote.vehicle, 14652);
  assert.equal(quote.fuelRound, 10600);
  assert.equal(quote.tollRound, 5600);
  assert.equal(quote.band, 0);
  assert.deepEqual(quote.rows.map(function (row) { return row.total; }), [54685, 56852, 59019]);
  assert.match(quote.warnings.join('\n'), /지난 실측/);
});

test('a Jung-gu health center delivery keeps the institute name and the surcharge', function () {
  const parsed = q.parseMemo([
    '[상담배송] 박한솔 / 한국원자력안전재단',
    '26.11.16',
    '출발 : 10:20',
    '도착 : 11:20-11:30',
    '한국수력원자력 방사선 보건원',
    '서울 중구 서소문로 38 센트럴타워 2층 비전홀',
    '박한솔 010 9399 2681',
    '*대학생 도시락 23개 및 다과답례품 23개',
    '편도거리 20km',
    '연료비 5,000원',
    '도착소요시간 1시간 10분',
    '복귀소요시간 1시간 10분',
    '구간할증 5,000원'
  ].join('\n'));
  assert.equal(parsed.place, '한국수력원자력 방사선 보건원 서울 중구 서소문로 38 센트럴타워 2층 비전홀');
  assert.equal(parsed.phone, '010 9399 2681');
  assert.equal(parsed.percentMode, 'fixed5000');
  assert.equal(q.formatDateLabel(parsed.date), '26.11.16(월)');
  const quote = q.buildQuote(parsed);
  assert.equal(quote.minutes, 140);
  assert.equal(quote.vehicle, 8880);
  assert.equal(quote.fuelRound, 10000);
  assert.equal(quote.tollRound, 0);
  assert.equal(quote.band, 0);
  assert.deepEqual(quote.rows.map(function (row) { return row.total; }), [49547, 51880, 54213]);
});

test('the Nowon medical institute is a second drop, not a replacement', function () {
  const parsed = q.parseMemo([
    '[상담배송] 박한솔 / 한국원자력안전재단',
    '26.11.16',
    '출발 : 10:10',
    '도착 : 11:20-11:30',
    '한국원자력의학원',
    '서울 노원구 노원로 75(공릉동 215-4)',
    '국사방사선비상진료센터',
    '박한솔 010 9399 2681',
    '*대학생 도시락 23개 및 다과답례품 23개',
    '편도거리 43km',
    '통행료 3,700원',
    '연료비 8,000원',
    '도착소요시간 1시간 10분',
    '복귀소요시간 1시간 10분'
  ].join('\n'));
  assert.equal(parsed.place, '한국원자력의학원 서울 노원구 노원로 75(공릉동 215-4) 국사방사선비상진료센터');
  assert.equal(parsed.depart, '10:10');
  assert.equal(parsed.km, 43);
  assert.equal(parsed.fuel, 8000);
  assert.equal(parsed.toll, 3700);
  assert.equal(parsed.percentMode, 'none');
  const quote = q.buildQuote(parsed);
  assert.equal(quote.vehicle, 19092);
  assert.equal(quote.fuelRound, 16000);
  assert.equal(quote.tollRound, 7400);
  assert.equal(quote.band, 0);
  assert.deepEqual(quote.rows.map(function (row) { return row.total; }), [68159, 70492, 72825]);
});

test('an Airbnb half trip keeps the building and prices the measured specs', function () {
  const parsed = q.parseMemo([
    '[반출장] 강슬 / 에어비앤비',
    '26.11.10(화)',
    '출발 : 08:40',
    '도착 : 10:00',
    '행사시작 : 12:00',
    '서울 용산구 이태원로 127-3',
    '모디빌딩 3층 (에어비앤비)',
    '담당자 : 강슬 오피스 매니저',
    '010 9920 2879',
    '품목 : 반출장 점심 20인분',
    '우선 에어비앤비는 고정배송비로 40,000원으로 책정해놓고 있어.',
    '하지만 제원은 일관적으로 해줘. 알겠지?',
    '편도거리 22km',
    '연료비 3,700원',
    '도착소요시간 1시간 20분',
    '복귀소요시간 1시간'
  ].join('\n'));
  assert.equal(parsed.place, '서울 용산구 이태원로 127-3 모디빌딩 3층 (에어비앤비)');
  assert.equal(parsed.phone, '010 9920 2879');
  assert.equal(parsed.eventTime, '12:00');
  assert.equal(parsed.goMin, 80);
  assert.equal(parsed.backMin, 60);
  assert.equal(parsed.km, 22);
  assert.equal(parsed.fuel, 3700);
  assert.equal(parsed.toll, null);
  assert.equal(q.headcount(parsed.items), 20);
  assert.equal(q.formatDateLabel(parsed.date), '26.11.10(화)');
  const quote = q.buildQuote(parsed);
  assert.equal(quote.minutes, 140);
  assert.equal(quote.vehicle, 9768);
  assert.equal(quote.fuelRound, 7400);
  assert.equal(quote.tollRound, 0);
  assert.equal(quote.band, 0);
  assert.deepEqual(quote.rows.map(function (row) { return row.total; }), [42835, 45168, 47501]);
  assert.doesNotMatch(quote.text, /40,000원/);
});

test('a later Avril party reuses the measured distance, fuel, and toll', function () {
  const parsed = q.applyVenueDefaults(q.parseMemo([
    '[출장] 양지혜 / 아브릴모마',
    '27.03.07(일)',
    '출발 : 8:30',
    '도착 : 9:30',
    '행사시작 : 11:30',
    '광명 아브릴모마 1부',
    '*돌잔치 출장 25명',
    '아브릴모마 제원 참고해서 견적 뽑아줘'
  ].join('\n')));
  assert.equal(parsed.place, '광명 아브릴모마 1부');
  assert.equal(parsed.depart, '08:30');
  assert.equal(parsed.arrive, '09:30');
  assert.equal(parsed.eventTime, '11:30');
  assert.equal(parsed.km, 33);
  assert.equal(parsed.fuel, 5300);
  assert.equal(parsed.toll, 2800);
  assert.equal(parsed.goMin, null);
  assert.equal(q.formatDateLabel(parsed.date), '27.03.07(일)');
  assert.match(parsed.warnings.join('\n'), /지난 실측/);
  const quote = q.buildQuote(Object.assign({}, parsed, { goMin: 60, backMin: 70 }));
  assert.equal(quote.minutes, 130);
  assert.equal(quote.vehicle, 14652);
  assert.equal(quote.fuelRound, 10600);
  assert.equal(quote.tollRound, 5600);
  assert.deepEqual(quote.rows.map(function (row) { return row.total; }), [54685, 56852, 59019]);
});

test('a Sejong Saturday delivery keeps both contacts and both surcharges', function () {
  const parsed = q.parseMemo([
    '[배송] 김규연 / 백성현 서포트',
    '26.11.14(토)',
    '출발 : 14:50',
    '도착 : 15:40-16:00',
    '더베이크 1층 로비',
    '서울종로구 세종대로 175',
    '(세종문화회관 예술동 건물)',
    '한지영 010 9525 4832',
    '김나래 010 5723 1988',
    '*서토프 도시락 12개',
    '편도거리 34km',
    '연료비 6,000원',
    '구간할증 5,000원',
    '주말할증 5,000원',
    '도착소요시간 1시간 10분',
    '복귀소요시간 1시간 10분'
  ].join('\n'));
  assert.equal(parsed.place, '더베이크 1층 로비 서울종로구 세종대로 175 (세종문화회관 예술동 건물)');
  assert.equal(parsed.person, '김규연');
  assert.deepEqual(parsed.contacts, [
    { name: '한지영', phone: '010 9525 4832' },
    { name: '김나래', phone: '010 5723 1988' }
  ]);
  assert.equal(parsed.percentMode, 'fixed5000');
  assert.equal(parsed.extras[0].label, '주말할증');
  assert.equal(parsed.extras[0].amount, 5000);
  assert.equal(q.formatDateLabel(parsed.date), '26.11.14(토)');
  const quote = q.buildQuote(parsed);
  assert.equal(quote.minutes, 140);
  assert.equal(quote.vehicle, 15096);
  assert.equal(quote.fuelRound, 12000);
  assert.equal(quote.tollRound, 0);
  assert.equal(quote.band, 0);
  assert.deepEqual(quote.rows.map(function (row) { return row.total; }), [62763, 65096, 67429]);
  assert.match(quote.text, /한지영/);
  assert.match(quote.text, /김나래/);
  assert.match(quote.text, /주말할증 5,000원/);
  assert.match(quote.text, /구간할증 5,000원/);
});

test('a Mokdong kids setup keeps the flat fees and leaves the return time open', function () {
  const parsed = q.parseMemo([
    '[배송세팅] 최은서 / 키즈케이터링',
    '26.11.13(금)',
    '출발 : 15:00',
    '도착 : 15:50-16:00',
    '세팅완료 : 17:00',
    '양천구 목동남로 4길 81',
    '삼성래미안 2차 102동 801호',
    '010 2500 8071',
    '*키즈 10명 케이터링 박스 세팅',
    '창문쪽 풍선 및 가렌더 세팅 진행',
    '(풍선, 가렌더, 꼬깔모자, 테이블보 화이트)',
    '편도거리 18km',
    '연료비 3,000원',
    '구간할증 5,000원',
    '세팅수고비 5,000원'
  ].join('\n'));
  assert.equal(parsed.place, '양천구 목동남로 4길 81 삼성래미안 2차 102동 801호');
  assert.equal(parsed.phone, '010 2500 8071');
  assert.equal(parsed.setupDone, '17:00');
  assert.equal(parsed.goMin, null);
  assert.equal(parsed.backMin, null);
  assert.equal(parsed.percentMode, 'fixed5000');
  assert.equal(parsed.extras[0].label, '세팅수고비');
  assert.equal(parsed.extras[0].amount, 5000);
  assert.match(parsed.items, /가렌더/);
  assert.match(parsed.items, /꼬깔모자/);
  assert.equal(q.headcount(parsed.items), 10);
  assert.equal(q.formatDateLabel(parsed.date), '26.11.13(금)');
  const quote = q.buildQuote(parsed);
  assert.equal(quote.ready, false);
  assert.deepEqual(quote.missing, ['가는 시간', '오는 시간']);
  assert.equal(quote.vehicle, 7992);
  assert.equal(quote.fuelRound, 6000);
  assert.equal(q.bandFee(36), 8000);
});
