'use strict';

/*
 * 급여명세서.
 * 직원은 출근부터 퇴근까지 전 시간에 시급을 받는다.
 * 고객 배송 원가는 배송 출발~복귀 구간의 인건비와 차량 실비만 본다.
 * 매장 근무 급여는 배송비에서 빼지도, 얹지도 않는다.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.YosulPayroll = api;
})(typeof window !== 'undefined' ? window : null, function () {
  var KM_RATE = 222;

  function pad(n) {
    n = Math.round(Number(n));
    return (n < 10 ? '0' : '') + n;
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
    if (!Number.isFinite(v)) return '0';
    return Number.isInteger(v) ? String(v) : v.toFixed(1);
  }

  function laborWon(wage, minutes) {
    var w = Math.round(Number(wage));
    var m = Math.round(Number(minutes));
    if (w <= 0 || m <= 0) return 0;
    return Math.floor((w * m + 30) / 60);
  }

  function vehicleCost(roundKm) {
    var milli = Math.round(Number(roundKm) * 1000);
    if (milli <= 0) return 0;
    return Math.round(milli * KM_RATE / 1000);
  }

  function asMoney(n) {
    if (n == null || n === '') return 0;
    var v = Number(String(n).replace(/,/g, ''));
    return Number.isFinite(v) ? Math.max(0, Math.round(v)) : 0;
  }

  function parseClock(raw) {
    if (raw == null || String(raw).trim() === '') return null;
    var s = String(raw).trim();
    var m = s.match(/^(\d{1,2}):(\d{2})$/);
    if (m) {
      var h = Number(m[1]);
      var min = Number(m[2]);
      if (h > 23 || min > 59) return null;
      return h * 60 + min;
    }
    var hm = s.match(/^(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분?)?$/);
    if (!hm) return null;
    var h2 = Number(hm[1]);
    var m2 = Number(hm[2] || 0);
    if (h2 > 23 || m2 > 59) return null;
    return h2 * 60 + m2;
  }

  function clockText(mins) {
    return pad(Math.floor(mins / 60)) + ':' + pad(mins % 60);
  }

  function exactHourText(minutes) {
    if (minutes % 6 !== 0) return '';
    var text = (minutes / 6 / 10).toFixed(1);
    return text.replace(/\.0$/, '');
  }

  function durationWords(minutes) {
    var h = Math.floor(minutes / 60);
    var m = minutes % 60;
    if (h && m) return h + '시간 ' + m + '분';
    if (h) return h + '시간';
    return m + '분';
  }

  function timeLabel(minutes) {
    var hours = exactHourText(minutes);
    if (hours) return hours + '시간 (' + minutes + '분)';
    return durationWords(minutes) + ' (' + minutes + '분)';
  }

  function moneyFormula(wage, minutes, amount, preferRound) {
    var hours = exactHourText(minutes);
    var simple = hours ? Math.round(wage * (minutes / 6) / 10) : NaN;
    if (!preferRound && hours && simple === amount) {
      return formatNumber(wage) + '원 × ' + hours + '시간 = ' + formatWon(amount);
    }
    return 'ROUND(' + formatNumber(wage) + ' × ' + minutes + ' ÷ 60) = ' + formatWon(amount);
  }

  function buildPayroll(input) {
    input = input || {};
    var labels = [
      ['clockIn', '출근'],
      ['depart', '배송 출발'],
      ['returnAt', '배송 복귀'],
      ['clockOut', '퇴근']
    ];
    var clocks = {};
    var missing = [];
    labels.forEach(function (pair) {
      var value = parseClock(input[pair[0]]);
      clocks[pair[0]] = value;
      if (value == null) missing.push(pair[1]);
    });
    var warnings = [];
    var ready = missing.length === 0;
    if (ready) {
      var seq = [clocks.clockIn, clocks.depart, clocks.returnAt, clocks.clockOut];
      for (var i = 1; i < seq.length; i++) {
        if (seq[i] < seq[i - 1]) {
          ready = false;
          warnings.push(labels[i][1] + '이 ' + labels[i - 1][1] + '보다 빠릅니다.');
          break;
        }
      }
    }

    var wage = Math.round(Number(input.wage));
    if (!(wage > 0)) {
      ready = false;
      missing.push('시급');
    }

    var storeBefore = ready ? clocks.depart - clocks.clockIn : 0;
    var delivery = ready ? clocks.returnAt - clocks.depart : 0;
    var storeAfter = ready ? clocks.clockOut - clocks.returnAt : 0;
    var storeMinutes = storeBefore + storeAfter;
    var totalMinutes = ready ? clocks.clockOut - clocks.clockIn : 0;
    var storePay = ready ? laborWon(wage, storeMinutes) : 0;
    var deliveryPay = ready ? laborWon(wage, delivery) : 0;
    var taxable = storePay + deliveryPay;
    var roundKm = Number(input.roundKm);
    if (!Number.isFinite(roundKm) || roundKm < 0) roundKm = 0;
    var vehicle = vehicleCost(roundKm);
    var fuel = asMoney(input.fuelRound);
    var toll = asMoney(input.tollRound);
    var parking = asMoney(input.parking);
    var expenses = vehicle + fuel + toll + parking;
    var deliveryCost = deliveryPay + expenses;
    var finalPay = taxable + expenses;
    var quoteLimit = input.quoteLimit == null || input.quoteLimit === '' ? null : asMoney(input.quoteLimit);
    var gap = quoteLimit == null ? null : quoteLimit - deliveryCost;
    var within = gap == null ? null : gap >= 0;

    var named = {
      clockIn: ready ? clockText(clocks.clockIn) : '',
      depart: ready ? clockText(clocks.depart) : '',
      returnAt: ready ? clockText(clocks.returnAt) : '',
      clockOut: ready ? clockText(clocks.clockOut) : ''
    };

    var timeline = '';
    if (ready) {
      var parts = [];
      if (storeBefore > 0) parts.push('매장 ' + named.clockIn + '~' + named.depart + ' (' + storeBefore + '분)');
      parts.push('배송 ' + named.depart + '~' + named.returnAt + ' (' + delivery + '분)');
      if (storeAfter > 0) parts.push('매장 ' + named.returnAt + '~' + named.clockOut + ' (' + storeAfter + '분)');
      timeline = parts.join(' → ');
    }

    return {
      ready: ready,
      missing: missing,
      warnings: warnings,
      text: ready ? statementText({
        person: String(input.person || '').trim(),
        dateLabel: String(input.dateLabel || '').trim(),
        named: named,
        timeline: timeline,
        wage: wage,
        storeMinutes: storeMinutes,
        delivery: delivery,
        totalMinutes: totalMinutes,
        storePay: storePay,
        deliveryPay: deliveryPay,
        taxable: taxable,
        roundKm: roundKm,
        vehicle: vehicle,
        fuel: fuel,
        toll: toll,
        parking: parking,
        expenses: expenses,
        deliveryCost: deliveryCost,
        finalPay: finalPay,
        quoteLimit: quoteLimit,
        gap: gap,
        within: within
      }) : '',
      timeline: timeline,
      storeBefore: storeBefore,
      storeAfter: storeAfter,
      storeMinutes: storeMinutes,
      deliveryMinutes: delivery,
      totalMinutes: totalMinutes,
      storePay: storePay,
      deliveryPay: deliveryPay,
      taxable: taxable,
      vehicle: vehicle,
      fuel: fuel,
      toll: toll,
      parking: parking,
      expenses: expenses,
      deliveryCost: deliveryCost,
      finalPay: finalPay,
      quoteLimit: quoteLimit,
      gap: gap,
      within: within,
      clockIn: named.clockIn,
      depart: named.depart,
      returnAt: named.returnAt,
      clockOut: named.clockOut
    };
  }

  function expenseLines(model) {
    var lines = [];
    lines.push('차량 운영비 왕복 ' + formatKm(model.roundKm) + 'km × ' + KM_RATE + '원 = ' + formatWon(model.vehicle));
    lines.push('유류비 ' + formatWon(model.fuel) + ' (100원 단위 올림)');
    if (model.toll === 0 && model.parking === 0) lines.push('통행료 / 주차비 0원');
    else lines.push('통행료 ' + formatWon(model.toll) + ' / 주차비 ' + formatWon(model.parking));
    return lines;
  }

  function statementText(model) {
    var lines = [];
    lines.push('[급여명세서]' + (model.person ? ' ' + model.person : ''));
    if (model.dateLabel) lines.push('일자: ' + model.dateLabel);
    lines.push('출근 ' + model.named.clockIn + ' / 배송 출발 ' + model.named.depart + ' / 배송 복귀 ' + model.named.returnAt + ' / 퇴근 ' + model.named.clockOut);
    lines.push(model.timeline);
    lines.push('');
    lines.push('① 기본급 (매장)');
    lines.push('주방 제작 지원 및 마감 정리');
    lines.push(timeLabel(model.storeMinutes));
    lines.push(moneyFormula(model.wage, model.storeMinutes, model.storePay, false));
    lines.push('');
    lines.push('② 배송 인건비');
    lines.push('배송 운송급여 (운전+전달)');
    lines.push(timeLabel(model.delivery));
    lines.push(moneyFormula(model.wage, model.delivery, model.deliveryPay, true));
    lines.push('');
    lines.push('과세 급여 합계');
    lines.push('총 근무 ' + timeLabel(model.totalMinutes));
    lines.push(formatWon(model.storePay) + ' + ' + formatWon(model.deliveryPay) + ' = ' + formatWon(model.taxable));
    lines.push('');
    lines.push('③ 차량/경비 실비');
    expenseLines(model).forEach(function (line) { lines.push(line); });
    lines.push('비과세 실비 합계 ' + formatWon(model.expenses));
    lines.push('');
    lines.push('최종 지급액 ' + formatWon(model.finalPay));
    lines.push('급여 ' + formatWon(model.taxable) + ' + 실비 ' + formatWon(model.expenses));
    lines.push('');
    lines.push('배송 원가 검증');
    lines.push('실제 지급된 배송비 = ' + formatWon(model.deliveryPay) + ' + ' + formatWon(model.expenses) + ' = ' + formatWon(model.deliveryCost));
    lines.push('매장 기본급 ' + formatWon(model.storePay) + '은 배송비에 넣지 않습니다.');
    if (model.quoteLimit != null) {
      if (model.within) {
        lines.push('고객 견적 한도 ' + formatWon(model.quoteLimit) + ' 이내입니다. 여유 ' + formatWon(model.gap));
      } else {
        lines.push('고객 견적 한도 ' + formatWon(model.quoteLimit) + '을 ' + formatWon(-model.gap) + ' 넘습니다.');
      }
    }
    return lines.join('\n');
  }

  return {
    KM_RATE: KM_RATE,
    laborWon: laborWon,
    vehicleCost: vehicleCost,
    parseClock: parseClock,
    buildPayroll: buildPayroll
  };
});
