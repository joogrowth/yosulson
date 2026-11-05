'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const q = require('./quote.js');

const ledger = JSON.parse(fs.readFileSync('./data/trips.json', 'utf8'));

test('confirmed trips stay tied to the quote that was given', function () {
  assert.equal(ledger.trips.length, 8);
  const trip = ledger.trips.find(function (row) { return row.id === '20261114-avril-imyeonjeong'; });
  assert.equal(trip.id, '20261114-avril-imyeonjeong');
  assert.equal(trip.place, '광명 아브릴모마 2부');
  assert.equal(trip.km, 33);
  assert.equal(trip.fuel, 5300);
  assert.equal(trip.toll, 2800);
  assert.equal(trip.goMin, 70);
  assert.equal(trip.backMin, 70);
  assert.equal(trip.revisions[0].from, 60);
  assert.equal(trip.revisions[0].to, 70);

  const quote = q.buildQuote({
    type: trip.type,
    person: trip.person,
    event: trip.event,
    date: trip.date,
    depart: trip.depart,
    arrive: trip.arrive,
    eventTime: trip.eventTime,
    place: trip.place,
    items: trip.items,
    km: trip.km,
    fuel: trip.fuel,
    toll: trip.toll,
    goMin: trip.goMin,
    backMin: trip.backMin,
    includeBand: trip.includeBand
  });
  assert.equal(quote.ready, true);
  assert.deepEqual(quote.rows.map(function (row) { return row.labor; }), trip.quoted.labor);
  assert.deepEqual(quote.rows.map(function (row) { return row.total; }), trip.quoted.totals);
  assert.equal(quote.vehicle, trip.quoted.vehicle);
  assert.equal(quote.fuelRound, trip.quoted.fuelRound);
  assert.equal(quote.tollRound, trip.quoted.tollRound);
  assert.equal(q.bandFee(trip.quoted.roundKm), trip.quoted.bandIfIncluded);

  const venue = q.matchVenue({ place: trip.place, event: trip.event });
  assert.equal(venue.id, trip.venueId);
  assert.ok(trip.km > venue.kmUsual[1]);

  const sangam = ledger.trips.find(function (row) { return row.id === '20261117-sangam-shin'; });
  const sangamQuote = q.buildQuote({
    type: sangam.type,
    person: sangam.person,
    event: sangam.event,
    date: sangam.date,
    depart: sangam.depart,
    arrive: sangam.arrive,
    place: sangam.place,
    items: sangam.items,
    phone: sangam.phone,
    km: sangam.km,
    fuel: sangam.fuel,
    toll: sangam.toll,
    goMin: sangam.goMin,
    backMin: sangam.backMin,
    includeBand: sangam.includeBand,
    percentMode: sangam.percentMode,
    extras: sangam.extras
  });
  assert.equal(sangamQuote.ready, true);
  assert.deepEqual(sangamQuote.rows.map(function (row) { return row.total; }), sangam.quoted.totals);
  assert.equal(q.bandFee(sangam.quoted.roundKm), sangam.quoted.bandIfIncluded);
  assert.equal(q.formatDateLabel(sangam.date), '26.11.17(화)');

  const snu = ledger.trips.find(function (row) { return row.id === '20270106-snu-kim'; });
  const snuQuote = q.buildQuote({
    type: snu.type,
    person: snu.person,
    event: snu.event,
    date: snu.date,
    phone: snu.phone,
    depart: snu.depart,
    arrive: snu.arrive,
    eventTime: snu.eventTime,
    place: snu.place,
    items: snu.items,
    km: snu.km,
    fuel: snu.fuel,
    toll: snu.toll,
    goMin: snu.goMin,
    backMin: snu.backMin,
    includeBand: snu.includeBand,
    percentMode: snu.percentMode
  });
  assert.equal(snuQuote.ready, true);
  assert.deepEqual(snuQuote.rows.map(function (row) { return row.total; }), snu.quoted.totals);
  assert.equal(snuQuote.suggestions[0].note, '6층 605호 기물/세팅 운반');
  assert.equal(q.matchVenue({ place: snu.place }).id, snu.venueId);
  assert.equal(q.formatDateLabel(snu.date), '27.01.06(수)');
  assert.equal(q.formatPhone(snu.phone), '02 880 6113');

  const yonsei = ledger.trips.find(function (row) { return row.id === '20261108-yonsei-gu'; });
  const yonseiQuote = q.buildQuote({
    type: yonsei.type,
    person: yonsei.person,
    event: yonsei.event,
    date: yonsei.date,
    phone: yonsei.phone,
    depart: yonsei.depart,
    arrive: yonsei.arrive,
    place: yonsei.place,
    items: yonsei.items,
    km: yonsei.km,
    fuel: yonsei.fuel,
    toll: yonsei.toll,
    goMin: yonsei.goMin,
    backMin: yonsei.backMin,
    includeBand: yonsei.includeBand,
    percentMode: yonsei.percentMode,
    extras: yonsei.extras,
    parking: yonsei.parking
  });
  assert.equal(yonseiQuote.ready, true);
  assert.equal(yonseiQuote.band, 0);
  assert.deepEqual(yonseiQuote.rows.map(function (row) { return row.total; }), yonsei.quoted.totals);
  assert.equal(q.bandFee(yonsei.quoted.roundKm), yonsei.quoted.bandRegulation);
  assert.equal(yonsei.quoted.bandAlreadyInSurcharge, false);
  assert.match(yonseiQuote.text, /주차비 3,000원 \(별도\)/);
  assert.equal(yonseiQuote.rows[0].total, 40213);
  assert.equal(q.formatDateLabel(yonsei.date), '26.11.08(일)');

  const division = ledger.trips.find(function (row) { return row.id === '20261117-deogyang-yun'; });
  const divisionQuote = q.buildQuote({
    type: division.type,
    person: division.person,
    event: division.event,
    date: division.date,
    phone: division.phone,
    depart: division.depart,
    arrive: division.arrive,
    eventTime: division.eventTime,
    place: division.place,
    items: division.items,
    km: division.km,
    fuel: division.fuel,
    toll: division.toll,
    goMin: division.goMin,
    backMin: division.backMin,
    includeBand: division.includeBand
  });
  assert.equal(divisionQuote.ready, true);
  assert.equal(q.matchVenue({ place: division.place, event: division.event }), null);
  assert.deepEqual(divisionQuote.rows.map(function (row) { return row.total; }), division.quoted.totals);
  assert.equal(q.bandFee(division.quoted.roundKm), division.quoted.bandIfIncluded);
  assert.equal(q.formatDateLabel(division.date), '26.11.17(화)');

  const morning = ledger.trips.find(function (row) { return row.id === '20261129-avril-jeong'; });
  const earlier = ledger.trips.find(function (row) { return row.id === morning.inheritedFrom; });
  assert.equal(morning.km, earlier.km);
  assert.equal(morning.fuel, earlier.fuel);
  assert.equal(morning.toll, earlier.toll);
  assert.notEqual(morning.goMin, earlier.goMin);
  const morningQuote = q.buildQuote({
    type: morning.type,
    person: morning.person,
    event: morning.event,
    date: morning.date,
    depart: morning.depart,
    arrive: morning.arrive,
    eventTime: morning.eventTime,
    place: morning.place,
    items: morning.items,
    km: morning.km,
    fuel: morning.fuel,
    toll: morning.toll,
    goMin: morning.goMin,
    backMin: morning.backMin,
    includeBand: morning.includeBand
  });
  assert.deepEqual(morningQuote.rows.map(function (row) { return row.total; }), morning.quoted.totals);
  assert.equal(q.formatDateLabel(morning.date), '26.11.29(일)');

  const jung = ledger.trips.find(function (row) { return row.id === '20261116-seosomun-park'; });
  const jungQuote = q.buildQuote({
    type: jung.type,
    person: jung.person,
    event: jung.event,
    date: jung.date,
    phone: jung.phone,
    depart: jung.depart,
    arrive: jung.arrive,
    place: jung.place,
    items: jung.items,
    km: jung.km,
    fuel: jung.fuel,
    toll: jung.toll,
    goMin: jung.goMin,
    backMin: jung.backMin,
    includeBand: jung.includeBand,
    percentMode: jung.percentMode
  });
  assert.equal(jungQuote.ready, true);
  assert.deepEqual(jungQuote.rows.map(function (row) { return row.total; }), jung.quoted.totals);
  assert.equal(q.formatDateLabel(jung.date), '26.11.16(월)');
  assert.match(jungQuote.text, /보건원/);

  const nowon = ledger.trips.find(function (row) { return row.id === '20261116-nowon-park'; });
  assert.equal(nowon.date, jung.date);
  assert.notEqual(nowon.place, jung.place);
  assert.equal(nowon.percentMode, 'none');
  assert.equal(nowon.fuel, 7000);
  assert.equal(nowon.backMin, 60);
  assert.equal(nowon.toll, 2600);
  assert.equal(nowon.revisions.length, 4);
  const nowonQuote = q.buildQuote({
    type: nowon.type,
    person: nowon.person,
    event: nowon.event,
    date: nowon.date,
    phone: nowon.phone,
    depart: nowon.depart,
    arrive: nowon.arrive,
    place: nowon.place,
    items: nowon.items,
    km: nowon.km,
    fuel: nowon.fuel,
    toll: nowon.toll,
    goMin: nowon.goMin,
    backMin: nowon.backMin,
    includeBand: nowon.includeBand,
    percentMode: nowon.percentMode
  });
  assert.equal(nowonQuote.ready, true);
  assert.equal(nowonQuote.vehicle, 19092);
  assert.equal(nowonQuote.tollRound, 5200);
  assert.equal(nowonQuote.fuelRound, 14000);
  assert.equal(nowonQuote.minutes, 130);
  assert.deepEqual(nowonQuote.rows.map(function (row) { return row.total; }), nowon.quoted.totals);
  assert.equal(q.bandFee(nowon.quoted.roundKm), 11000);
  assert.doesNotMatch(nowonQuote.text, /구간할증/);
});
