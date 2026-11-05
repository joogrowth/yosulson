'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const q = require('./quote.js');

const ledger = JSON.parse(fs.readFileSync('./data/trips.json', 'utf8'));

test('confirmed trips stay tied to the quote that was given', function () {
  assert.equal(ledger.trips.length, 3);
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
  assert.ok(trip.km > venue.km[1]);

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
});
