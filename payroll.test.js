'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const p = require('./payroll.js');

test('a split day pays every minute and keeps store pay out of the delivery cost', function () {
  const slip = p.buildPayroll({
    person: '홍길동',
    dateLabel: '26.11.20(금)',
    clockIn: '08:00',
    depart: '10:00',
    returnAt: '12:30',
    clockOut: '14:00',
    wage: 13000,
    roundKm: 50,
    fuelRound: 8000,
    tollRound: 0,
    parking: 0,
    quoteLimit: 67820
  });
  assert.equal(slip.ready, true);
  assert.equal(slip.storeMinutes, 210);
  assert.equal(slip.deliveryMinutes, 150);
  assert.equal(slip.totalMinutes, 360);
  assert.equal(slip.storePay, 45500);
  assert.equal(slip.deliveryPay, 32500);
  assert.equal(slip.taxable, 78000);
  assert.equal(slip.vehicle, 11100);
  assert.equal(slip.expenses, 19100);
  assert.equal(slip.finalPay, 97100);
  assert.equal(slip.deliveryCost, 51600);
  assert.equal(slip.within, true);
  assert.equal(slip.gap, 16220);
  assert.equal(slip.text, [
    '[급여명세서] 홍길동',
    '일자: 26.11.20(금)',
    '출근 08:00 / 배송 출발 10:00 / 배송 복귀 12:30 / 퇴근 14:00',
    '매장 08:00~10:00 (120분) → 배송 10:00~12:30 (150분) → 매장 12:30~14:00 (90분)',
    '',
    '① 기본급 (매장)',
    '주방 제작 지원 및 마감 정리',
    '3.5시간 (210분)',
    '13,000원 × 3.5시간 = 45,500원',
    '',
    '② 배송 인건비',
    '배송 운송급여 (운전+전달)',
    '2.5시간 (150분)',
    'ROUND(13,000 × 150 ÷ 60) = 32,500원',
    '',
    '과세 급여 합계',
    '총 근무 6시간 (360분)',
    '45,500원 + 32,500원 = 78,000원',
    '',
    '③ 차량/경비 실비',
    '차량 운영비 왕복 50km × 222원 = 11,100원',
    '유류비 8,000원 (100원 단위 올림)',
    '통행료 / 주차비 0원',
    '비과세 실비 합계 19,100원',
    '',
    '최종 지급액 97,100원',
    '급여 78,000원 + 실비 19,100원',
    '',
    '배송 원가 검증',
    '실제 지급된 배송비 = 32,500원 + 19,100원 = 51,600원',
    '매장 기본급 45,500원은 배송비에 넣지 않습니다.',
    '고객 견적 한도 67,820원 이내입니다. 여유 16,220원'
  ].join('\n'));
});

test('uneven minutes stay on the minute formula and are not cut from pay', function () {
  const slip = p.buildPayroll({
    clockIn: '8시',
    depart: '8:00',
    returnAt: '10:26',
    clockOut: '10:26',
    wage: 13000,
    roundKm: 0,
    fuelRound: 0
  });
  assert.equal(slip.storeMinutes, 0);
  assert.equal(slip.deliveryMinutes, 146);
  assert.equal(slip.deliveryPay, 31633);
  assert.equal(slip.storePay, 0);
  assert.equal(slip.finalPay, 31633);
  assert.match(slip.text, /ROUND\(13,000 × 146 ÷ 60\) = 31,633원/);
  assert.equal(slip.text.includes('2.43'), false);
  assert.equal(slip.text.includes('차감'), false);
});

test('delivery cost over the quote limit is called out', function () {
  const slip = p.buildPayroll({
    clockIn: '08:00',
    depart: '10:00',
    returnAt: '12:30',
    clockOut: '14:00',
    wage: 13000,
    roundKm: 50,
    fuelRound: 8000,
    quoteLimit: 50000
  });
  assert.equal(slip.within, false);
  assert.equal(slip.gap, -1600);
  assert.match(slip.text, /고객 견적 한도 50,000원을 1,600원 넘습니다/);
});

test('punches have to be in order', function () {
  const slip = p.buildPayroll({
    clockIn: '10:00',
    depart: '08:00',
    returnAt: '12:30',
    clockOut: '14:00',
    wage: 13000
  });
  assert.equal(slip.ready, false);
  assert.ok(slip.warnings.some(function (w) { return w.includes('배송 출발'); }));
  const missing = p.buildPayroll({ clockIn: '08:00', depart: '10:00', returnAt: '12:30', wage: 13000 });
  assert.deepEqual(missing.missing, ['퇴근']);
});
