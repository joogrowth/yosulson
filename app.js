'use strict';

(function () {
  if (!window.YosulQuote) {
    document.body.textContent = '계산 파일을 불러오지 못했습니다.';
    return;
  }
  var Q = window.YosulQuote;
  var seq = 1;
  var state = blankState();

  var textFields = ['type', 'person', 'event', 'date', 'phone', 'place', 'items', 'depart', 'arrive', 'eventTime'];
  var numFields = ['goMin', 'backMin', 'shopMin', 'km', 'fuel', 'toll', 'parking', 'basePay'];

  textFields.concat(numFields).forEach(function (id) {
    document.getElementById(id).addEventListener('input', function (e) {
      state[id] = e.target.value;
      if (id === 'km' || id === 'toll') state.autoNote = '';
      render();
    });
  });

  document.getElementById('band').addEventListener('change', function (e) {
    state.includeBand = e.target.checked;
    render();
  });
  document.getElementById('percent').addEventListener('change', function (e) {
    state.percentMode = e.target.value;
    render();
  });
  document.getElementById('payWage').addEventListener('change', function (e) {
    state.payWage = Number(e.target.value);
    render();
  });

  var wageBox = document.getElementById('wages');
  var paySelect = document.getElementById('payWage');
  Q.WAGE_PRESETS.forEach(function (wage) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'chip';
    button.dataset.act = 'wage';
    button.dataset.value = String(wage);
    button.textContent = Q.formatNumber(wage);
    wageBox.appendChild(button);
    var option = document.createElement('option');
    option.value = String(wage);
    option.textContent = Q.formatNumber(wage) + '원';
    if (wage === 13000) option.selected = true;
    paySelect.appendChild(option);
  });

  document.body.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (!el) return;
    var act = el.dataset.act;
    if (act === 'wage') {
      var wage = Number(el.dataset.value);
      var has = state.wages.indexOf(wage) !== -1;
      if (has && state.wages.length === 1) return;
      state.wages = has
        ? state.wages.filter(function (w) { return w !== wage; })
        : state.wages.concat(wage).sort(function (a, b) { return a - b; });
    } else if (act === 'km') {
      state.km = el.dataset.value;
      state.autoNote = '';
      setValue('km', state.km);
    } else if (act === 'toll') {
      var toll = Number(el.dataset.value);
      state.toll = Number(state.toll) === toll ? 0 : toll;
      setValue('toll', state.toll);
    } else if (act === 'depart') {
      state.depart = el.dataset.value;
      setValue('depart', state.depart);
    } else if (act === 'extra') {
      toggleExtra(el.dataset.label, Number(el.dataset.amount), el.dataset.note || '');
      return;
    }
    render();
  });

  document.getElementById('extras').addEventListener('input', function (e) {
    var row = e.target.closest('.extra');
    if (!row) return;
    var extra = findExtra(row.dataset.id);
    if (!extra) return;
    if (e.target.classList.contains('ex-label')) extra.label = e.target.value;
    if (e.target.classList.contains('ex-amount')) extra.amount = e.target.value;
    if (e.target.classList.contains('ex-note')) {
      extra.note = e.target.value;
      extra.noteAuto = false;
    }
    render();
  });
  document.getElementById('extras').addEventListener('click', function (e) {
    if (!e.target.classList.contains('ex-del')) return;
    var row = e.target.closest('.extra');
    state.extras = state.extras.filter(function (extra) { return extra.id !== row.dataset.id; });
    renderExtras();
    render();
  });
  document.getElementById('add-extra').addEventListener('click', function () {
    state.extras.push({ id: nextId(), label: '', amount: '', note: '', noteAuto: false });
    renderExtras();
    var labels = document.querySelectorAll('.ex-label');
    if (labels.length) labels[labels.length - 1].focus();
  });

  var memo = document.getElementById('memo');
  document.getElementById('apply').addEventListener('click', applyMemo);
  memo.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      applyMemo();
    }
  });
  memo.addEventListener('paste', function () { setTimeout(applyMemo, 0); });
  document.getElementById('ex-rough').addEventListener('click', function () {
    memo.value = Q.EXAMPLES.rough;
    applyMemo();
  });
  document.getElementById('ex-ok').addEventListener('click', function () {
    memo.value = Q.EXAMPLES.confirmed;
    applyMemo();
  });
  document.getElementById('clear').addEventListener('click', function () {
    memo.value = '';
    state = blankState();
    writeState();
    renderExtras();
    render();
  });
  document.getElementById('copy').addEventListener('click', function () {
    copyText(document.getElementById('quote').textContent, this, '카톡·캘린더에 복사');
  });
  document.getElementById('copy-settle').addEventListener('click', function () {
    copyText(document.getElementById('settle').textContent, this, '정산 내역 복사');
  });

  var themeBtn = document.getElementById('theme');
  try {
    if (localStorage.getItem('yosul-theme') === 'dark') setTheme(true);
  } catch (err) {}
  themeBtn.addEventListener('click', function () {
    setTheme(document.documentElement.dataset.theme !== 'dark');
  });

  renderExtras();
  render();

  function blankState() {
    return {
      type: '', person: '', event: '', date: '', phone: '', place: '', items: '',
      depart: '', arrive: '', eventTime: '',
      goMin: '', backMin: '', shopMin: '',
      km: '', fuel: '', toll: '', parking: '',
      includeBand: false, percentMode: 'none',
      wages: [11000, 12000, 13000],
      extras: [], payWage: 13000, basePay: '',
      warnings: [], autoNote: '', kmRange: null
    };
  }

  function nextId() { return 'x' + (seq++); }
  function findExtra(id) {
    for (var i = 0; i < state.extras.length; i++) {
      if (state.extras[i].id === id) return state.extras[i];
    }
    return null;
  }
  function setValue(id, value) {
    document.getElementById(id).value = value == null ? '' : value;
  }
  function setTheme(dark) {
    document.documentElement.dataset.theme = dark ? 'dark' : '';
    themeBtn.textContent = dark ? '밝게' : '어둡게';
    try { localStorage.setItem('yosul-theme', dark ? 'dark' : ''); } catch (err) {}
  }

  function applyMemo() {
    var parsed = Q.parseMemo(memo.value);
    var beforeKm = parsed.km;
    var beforeToll = parsed.toll;
    parsed = Q.applyVenueDefaults(parsed);
    parsed.extras = Q.withAutoNotes(parsed);
    if (parsed.phone) parsed.phone = Q.formatPhone(parsed.phone);
    state.type = parsed.type || '';
    state.person = parsed.person || '';
    state.event = parsed.event || '';
    state.date = parsed.date || '';
    state.phone = parsed.phone || '';
    state.place = parsed.place || '';
    state.items = parsed.items || '';
    state.depart = parsed.depart || '';
    state.arrive = parsed.arrive || '';
    state.eventTime = parsed.eventTime || '';
    state.goMin = parsed.goMin == null ? '' : parsed.goMin;
    state.backMin = parsed.backMin == null ? '' : parsed.backMin;
    state.shopMin = parsed.shopMin == null ? '' : parsed.shopMin;
    state.km = parsed.km == null ? '' : parsed.km;
    state.fuel = parsed.fuel == null ? '' : parsed.fuel;
    state.toll = parsed.toll == null ? '' : parsed.toll;
    state.parking = parsed.parking == null ? '' : parsed.parking;
    state.includeBand = !!parsed.includeBand;
    state.percentMode = parsed.percentMode || 'none';
    state.warnings = parsed.warnings || [];
    state.kmRange = parsed.kmRange || null;
    state.extras = (parsed.extras || []).map(function (extra) {
      return {
        id: nextId(),
        label: extra.label,
        amount: extra.amount,
        note: extra.note || '',
        noteAuto: !!extra.noteAuto
      };
    });
    var auto = [];
    if (beforeKm == null && parsed.km != null) auto.push('편도 ' + parsed.km + 'km');
    if (beforeToll == null && Number(parsed.toll) > 0) auto.push('편도 통행료 ' + Q.formatWon(parsed.toll));
    var venue = Q.matchVenue(parsed);
    state.autoNote = auto.length && venue
      ? venue.name + ' 고정 제원을 넣었습니다. ' + auto.join(', ') + '. 이번 경로가 다르면 숫자를 고치세요.'
      : '';
    writeState();
    renderExtras();
    render();
    if (window.matchMedia('(max-width: 900px)').matches) {
      document.getElementById('quote-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function writeState() {
    textFields.concat(numFields).forEach(function (id) { setValue(id, state[id]); });
    document.getElementById('percent').value = state.percentMode;
    document.getElementById('payWage').value = String(state.payWage);
  }

  function toggleExtra(label, amount, note) {
    var index = -1;
    for (var i = 0; i < state.extras.length; i++) {
      if (state.extras[i].label === label && Number(state.extras[i].amount) === amount) index = i;
    }
    if (index >= 0) state.extras.splice(index, 1);
    else {
      state.extras = state.extras.filter(function (extra) { return extra.label !== label; });
      state.extras.push({ id: nextId(), label: label, amount: amount, note: note, noteAuto: false });
    }
    renderExtras();
    render();
  }

  function renderExtras() {
    var root = document.getElementById('extras');
    root.innerHTML = '';
    state.extras.forEach(function (extra) {
      var row = document.createElement('div');
      row.className = 'extra';
      row.dataset.id = extra.id;
      row.appendChild(field('ex-label', extra.label, '항목'));
      row.appendChild(field('ex-amount', extra.amount, '금액', 'numeric'));
      row.appendChild(field('ex-note', extra.note, '괄호 안 설명'));
      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'ex-del';
      del.textContent = '빼기';
      row.appendChild(del);
      root.appendChild(row);
    });
  }

  function field(className, value, placeholder, mode) {
    var input = document.createElement('input');
    input.className = className;
    input.value = value == null ? '' : value;
    input.placeholder = placeholder;
    if (className === 'ex-note') input.classList.add('ex-note');
    if (mode) input.inputMode = mode;
    return input;
  }

  function isBlank() {
    var keys = ['type', 'person', 'event', 'date', 'phone', 'place', 'items', 'depart', 'arrive', 'eventTime', 'goMin', 'backMin', 'shopMin', 'km', 'fuel', 'toll', 'parking'];
    if (keys.some(function (key) { return String(state[key] || '').trim() !== ''; })) return false;
    if (state.extras.length || state.includeBand) return false;
    return true;
  }

  function render() {
    var shopping = Q.isShopping(state.type);
    if (shopping) state.includeBand = false;
    var result = Q.buildQuote(state);
    renderBand(shopping, result);
    renderVenue(result);
    renderDeparture(result);
    renderHints();
    renderChips(result);
    renderOutput(result);
  }

  function renderBand(shopping, result) {
    var box = document.getElementById('band');
    box.disabled = shopping;
    box.checked = state.includeBand && !shopping;
    var help = document.getElementById('band-help');
    var label = document.getElementById('band-label');
    if (shopping) {
      label.textContent = '구간 수고비';
      help.textContent = '장보기 견적은 배송 수고비를 넣지 않습니다.';
      return;
    }
    if (!(Number(state.km) > 0)) {
      label.textContent = '구간 수고비';
      help.textContent = '편도 거리를 넣으면 구간 수고비가 계산됩니다. 왕복 40km 이하는 8,000원, 그 다음은 20km마다 1,000원입니다.';
      return;
    }
    var fee = Q.bandFee(result.roundKm);
    label.textContent = '구간 수고비 ' + Q.formatWon(fee);
    help.textContent = '왕복 ' + Q.formatKm(result.roundKm) + 'km · ' + Q.bandLabel(result.roundKm) + '. 체크하면 문단에 들어갑니다.';
  }

  function renderVenue(result) {
    var box = document.getElementById('venue');
    box.innerHTML = '';
    if (!result.venue && !state.autoNote && !state.kmRange) {
      box.hidden = true;
      return;
    }
    box.hidden = false;
    if (result.venue) {
      var title = document.createElement('div');
      title.textContent = Q.describeVenue(result.venue);
      box.appendChild(title);
    }
    if (state.autoNote) {
      var note = document.createElement('div');
      note.textContent = state.autoNote;
      box.appendChild(note);
    }
    var chips = document.createElement('div');
    chips.className = 'chips';
    chips.style.marginTop = '8px';
    var venue = result.venue;
    if (venue && Array.isArray(venue.km)) {
      venue.km.forEach(function (km) {
        chips.appendChild(chip('편도 ' + km + 'km', 'km', String(km), String(state.km) === String(km)));
      });
    } else if (venue && typeof venue.km === 'number' && String(state.km) !== String(venue.km)) {
      chips.appendChild(chip('고정 ' + venue.km + 'km 넣기', 'km', String(venue.km), false));
    }
    if (venue && venue.tollOptional) {
      chips.appendChild(chip('통행료 ' + Q.formatWon(venue.toll), 'toll', String(venue.toll), Number(state.toll) === venue.toll));
    }
    if (chips.childNodes.length) box.appendChild(chips);
  }

  function renderDeparture(result) {
    var box = document.getElementById('depart-sug');
    box.innerHTML = '';
    if (!result.departure || state.depart) {
      box.hidden = true;
      return;
    }
    box.hidden = false;
    var p = document.createElement('p');
    p.style.margin = '0 0 8px';
    p.textContent = result.departure.reason + ' 견적 시간에는 더하지 않습니다.';
    box.appendChild(p);
    var row = document.createElement('div');
    row.className = 'chips';
    row.appendChild(chip(result.departure.from + ' 넣기', 'depart', result.departure.from, false));
    if (result.departure.to) row.appendChild(chip(result.departure.to + ' 넣기', 'depart', result.departure.to, false));
    box.appendChild(row);
  }

  function renderHints() {
    var km = Number(state.km);
    var fuel = state.fuel === '' ? null : Number(state.fuel);
    document.getElementById('km-hint').textContent = km > 0
      ? '왕복 ' + Q.formatKm(km * 2) + 'km · 차량 운영비 ' + Q.formatWon(Q.vehicleCost(km))
      : '';
    document.getElementById('fuel-hint').textContent = fuel == null || !Number.isFinite(fuel)
      ? ''
      : '왕복 유류비 ' + Q.formatWon(Q.ceil100(fuel * 2)) + (Q.ceil100(fuel * 2) !== fuel * 2 ? ' · 100원 단위 올림' : '');
    document.getElementById('date-view').textContent = state.date ? Q.formatDateLabel(state.date) : '';
  }

  function renderChips(result) {
    Array.prototype.forEach.call(document.querySelectorAll('#wages .chip'), function (button) {
      var on = state.wages.indexOf(Number(button.dataset.value)) !== -1;
      button.classList.toggle('on', on);
      button.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    var root = document.getElementById('sugg');
    root.innerHTML = '';
    if (!result.suggestions.length) return;
    var row = document.createElement('div');
    row.className = 'chips';
    row.style.margin = '8px 0';
    result.suggestions.forEach(function (item) {
      addSuggestion(row, item, item.amount);
      if (item.altAmount) addSuggestion(row, item, item.altAmount);
    });
    root.appendChild(row);
  }

  function addSuggestion(row, item, amount) {
    var on = state.extras.some(function (extra) {
      return extra.label === item.label && Number(extra.amount) === Number(amount);
    });
    var button = chip(item.label + ' ' + Q.formatWon(amount), 'extra', '', on);
    button.dataset.label = item.label;
    button.dataset.amount = String(amount);
    button.dataset.note = item.note || '';
    button.title = item.note || '';
    row.appendChild(button);
  }

  function chip(label, act, value, on) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'chip' + (on ? ' on' : '');
    button.dataset.act = act;
    if (value != null) button.dataset.value = value;
    button.textContent = label;
    button.setAttribute('aria-pressed', on ? 'true' : 'false');
    return button;
  }

  function renderOutput(result) {
    var quote = document.getElementById('quote');
    var missing = document.getElementById('missing');
    var missingTitle = document.getElementById('missing-title');
    var warnings = document.getElementById('warnings');
    var totals = document.getElementById('totals');
    var copy = document.getElementById('copy');
    warnings.innerHTML = '';
    result.warnings.forEach(function (warning) {
      var p = document.createElement('p');
      p.className = 'warn';
      p.textContent = warning;
      warnings.appendChild(p);
    });
    if (state.depart === '' && (state.place || state.arrive || state.person)) {
      var soft = document.createElement('p');
      soft.className = 'note';
      soft.textContent = '출발 시각이 비어 있어 문단에 빠집니다.';
      warnings.appendChild(soft);
    }
    if (isBlank()) {
      quote.textContent = '메모를 반영하면 문단이 여기 쌓입니다.';
      missing.hidden = true;
      missingTitle.hidden = true;
      totals.hidden = true;
      copy.disabled = true;
      renderSettlement(null);
      return;
    }
    quote.textContent = result.text;
    missing.innerHTML = '';
    missingTitle.hidden = result.missing.length === 0;
    if (result.missing.length) {
      missing.hidden = false;
      result.missing.forEach(function (item) {
        var li = document.createElement('li');
        li.textContent = item;
        missing.appendChild(li);
      });
    } else missing.hidden = true;
    totals.innerHTML = '';
    totals.hidden = !result.ready;
    if (result.ready) {
      result.rows.forEach(function (row) {
        var line = document.createElement('div');
        var name = document.createElement('span');
        name.textContent = '시급 ' + Q.formatNumber(row.wage) + '원';
        line.appendChild(name);
        line.appendChild(document.createTextNode(Q.formatWon(row.total)));
        totals.appendChild(line);
      });
    }
    copy.disabled = !result.ready;
    renderSettlement(result);
  }

  function renderSettlement(result) {
    var pre = document.getElementById('settle');
    var button = document.getElementById('copy-settle');
    var reconcile = document.getElementById('reconcile');
    if (!result || !result.ready || !result.settlement) {
      pre.textContent = '';
      reconcile.textContent = '';
      button.disabled = true;
      return;
    }
    pre.textContent = result.settlement.text;
    button.disabled = false;
    var customer = null;
    result.rows.forEach(function (row) {
      if (row.wage === Number(state.payWage)) customer = row;
    });
    if (customer && result.settlement.basePay > 0) {
      reconcile.textContent = '고객 견적 ' + Q.formatWon(customer.total) + '에서 이미 급여에 들어간 ' + Q.formatWon(result.settlement.basePay) + '을 빼면, 이번에 더 지급할 운송급여는 ' + Q.formatWon(result.settlement.pay) + '입니다.';
    } else if (customer) {
      reconcile.textContent = '기본급 차감이 없으면 이 시급의 고객 견적 ' + Q.formatWon(customer.total) + '과 총 정산이 같습니다.';
    } else {
      reconcile.textContent = '';
    }
  }

  function copyText(text, button, label) {
    function done() {
      button.textContent = '복사했습니다';
      setTimeout(function () { button.textContent = label; }, 1600);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () { fallback(text); done(); });
    } else {
      fallback(text);
      done();
    }
  }
  function fallback(text) {
    var area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.focus();
    area.select();
    try { document.execCommand('copy'); } catch (err) {}
    document.body.removeChild(area);
  }
})();
