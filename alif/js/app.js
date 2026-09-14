/* Alif — Quran & Prayer Times.  Application shell: state, prayer day model,
   Today / Qibla / Tracker / Settings screens, notifications and the tasbih. */
(function () {
  'use strict';
  var T = window.AlifTimes;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var el = function (tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  var pad = function (n) { return n < 10 ? '0' + n : '' + n; };

  /* ------------------------------------------------------------- prayers */
  var PRAYERS = [
    { k: 'fajr', n: 'Fajr', ar: 'الفجر', d: 'Dawn', track: true },
    { k: 'sunrise', n: 'Sunrise', ar: 'الشروق', d: 'Shuruq · end of Fajr', track: false },
    { k: 'dhuhr', n: 'Dhuhr', ar: 'الظهر', d: 'Midday', track: true },
    { k: 'asr', n: 'Asr', ar: 'العصر', d: 'Afternoon', track: true },
    { k: 'maghrib', n: 'Maghrib', ar: 'المغرب', d: 'Sunset', track: true },
    { k: 'isha', n: 'Isha', ar: 'العشاء', d: 'Night', track: true }
  ];
  var TRACKED = PRAYERS.filter(function (p) { return p.track; });
  var GLYPH = {
    fajr: '<svg viewBox="0 0 24 24"><path d="M12 6.5V3M5.6 9.1 3.5 7M18.4 9.1 20.5 7M3 14h18M2 18h20"/><path d="M8 14a4 4 0 0 1 8 0"/></svg>',
    sunrise: '<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="3.4"/><path d="M12 5.5V3M5 8l1.6 1.6M19 8l-1.6 1.6M2.5 17.5h19M4 13h1.6M18.4 13H20"/></svg>',
    dhuhr: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.2"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"/></svg>',
    asr: '<svg viewBox="0 0 24 24"><circle cx="10" cy="11" r="3.6"/><path d="M10 4v1.8M4.4 6.4 5.7 7.7M3 11h1.8M15.6 6.4 14.3 7.7M2.5 19.5h19M13 19.5V13l6-3v9.5"/></svg>',
    maghrib: '<svg viewBox="0 0 24 24"><path d="M12 15.5V19M5.6 12.9 3.5 15M18.4 12.9 20.5 15M2.5 9.5h19"/><path d="M8 9.5a4 4 0 0 1 8 0"/><path d="M2.5 19.5h19"/></svg>',
    isha: '<svg viewBox="0 0 24 24"><path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5Z"/><path d="M16.5 4.5 17 6l1.5.5L17 7l-.5 1.5L16 7l-1.5-.5L16 6Z"/></svg>'
  };
  var STATUS = [
    { k: 'jamaah', n: 'In congregation', s: 'Jama‘ah', ch: '✓', prayed: true },
    { k: 'ontime', n: 'Prayed on time', s: 'On time', ch: '✓', prayed: true },
    { k: 'late', n: 'Prayed late', s: 'Late', ch: '~', prayed: true },
    { k: 'qada', n: 'Made up later (qada)', s: 'Qada', ch: 'Q', prayed: true },
    { k: 'missed', n: 'Missed', s: 'Missed', ch: '×', prayed: false }
  ];
  var CYCLE = ['ontime', 'jamaah', 'late', 'missed', ''];

  var SKY = {
    night:   ['#0C1A33', '#050B12'],
    fajr:    ['#243560', '#7C5A63'],
    morning: ['#4B84B4', '#A9C7D8'],
    midday:  ['#3C7FB8', '#8FB9D6'],
    asr:     ['#C08A4E', '#7A7794'],
    maghrib: ['#7E4055', '#241F38']
  };

  var VERSES = [
    [2, 152, 'فَٱذْكُرُونِىٓ أَذْكُرْكُمْ وَٱشْكُرُوا۟ لِى وَلَا تَكْفُرُونِ', 'So remember Me; I will remember you. And thank Me, and never be ungrateful.'],
    [13, 28, 'أَلَا بِذِكْرِ ٱللَّهِ تَطْمَئِنُّ ٱلْقُلُوبُ', 'Surely in the remembrance of Allah do hearts find comfort.'],
    [94, 6, 'إِنَّ مَعَ ٱلْعُسْرِ يُسْرًا', 'Surely with hardship comes ease.'],
    [65, 3, 'وَمَن يَتَوَكَّلْ عَلَى ٱللَّهِ فَهُوَ حَسْبُهُۥ', 'And whoever puts their trust in Allah, then He alone is sufficient for them.'],
    [20, 14, 'وَأَقِمِ ٱلصَّلَوٰةَ لِذِكْرِىٓ', 'And establish prayer for My remembrance.'],
    [2, 286, 'لَا يُكَلِّفُ ٱللَّهُ نَفْسًا إِلَّا وُسْعَهَا', 'Allah does not require of any soul more than what it can afford.'],
    [29, 45, 'إِنَّ ٱلصَّلَوٰةَ تَنْهَىٰ عَنِ ٱلْفَحْشَآءِ وَٱلْمُنكَرِ', 'Indeed, prayer restrains one from shameful and unjust deeds.'],
    [3, 200, 'يَـٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوا۟ ٱصْبِرُوا۟ وَصَابِرُوا۟', 'O believers! Patiently endure, persevere.'],
    [55, 13, 'فَبِأَىِّ ءَالَآءِ رَبِّكُمَا تُكَذِّبَانِ', 'Then which of your Lord’s favours will you both deny?'],
    [39, 53, 'لَا تَقْنَطُوا۟ مِن رَّحْمَةِ ٱللَّهِ', 'Do not despair of Allah’s mercy.'],
    [17, 78, 'أَقِمِ ٱلصَّلَوٰةَ لِدُلُوكِ ٱلشَّمْسِ إِلَىٰ غَسَقِ ٱلَّيْلِ', 'Establish prayer from the decline of the sun until the darkness of the night.'],
    [2, 45, 'وَٱسْتَعِينُوا۟ بِٱلصَّبْرِ وَٱلصَّلَوٰةِ', 'And seek help through patience and prayer.']
  ];

  var DHIKR = [
    { ar: 'سُبْحَانَ اللّٰهِ', tr: 'SubhanAllah', en: 'Glory be to Allah', target: 33 },
    { ar: 'اَلْحَمْدُ لِلّٰهِ', tr: 'Alhamdulillah', en: 'All praise is for Allah', target: 33 },
    { ar: 'اَللّٰهُ أَكْبَرُ', tr: 'Allahu Akbar', en: 'Allah is the Greatest', target: 34 },
    { ar: 'لَا إِلٰهَ إِلَّا اللّٰهُ', tr: 'La ilaha illallah', en: 'There is no god but Allah', target: 100 },
    { ar: 'أَسْتَغْفِرُ اللّٰهَ', tr: 'Astaghfirullah', en: 'I seek forgiveness from Allah', target: 100 },
    { ar: 'اَللّٰهُمَّ صَلِّ عَلَى مُحَمَّدٍ', tr: 'Allahumma salli ala Muhammad', en: 'O Allah, send blessings upon Muhammad', target: 100 }
  ];

  /* --------------------------------------------------------------- state */
  var KEY = 'alif.state.v1';
  var DEFAULT_LOC = { name: 'Amsterdam', country: 'Netherlands', lat: 52.3676, lng: 4.9041, tz: 'Europe/Amsterdam', source: 'default' };
  var S = {
    loc: DEFAULT_LOC,
    method: 'MWL', asr: 'Standard', highLat: 'NightMiddle',
    adjust: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
    hijriOffset: 0, timeFormat: '24', theme: 'auto',
    notif: { on: false, before: 0, sound: 'chime', per: { fajr: true, sunrise: false, dhuhr: true, asr: true, maghrib: true, isha: true } },
    quran: { translation: 'en', translit: false, arSize: 26, txSize: 14, lastRead: null, bookmarks: [] },
    log: {}, tasbih: { idx: 0, count: 0, total: 0 },
    autoLoc: true, seen: false
  };
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return;
      var o = JSON.parse(raw);
      Object.keys(o).forEach(function (k) {
        if (o[k] && typeof o[k] === 'object' && !Array.isArray(o[k]) && S[k]) {
          S[k] = Object.assign({}, S[k], o[k]);
          if (k === 'notif' && o.notif.per) S.notif.per = Object.assign({}, S.notif.per, o.notif.per);
        } else S[k] = o[k];
      });
    } catch (e) { /* first run, or storage unavailable */ }
  }
  var saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
    }, 120);
  }
  window.AlifState = { get: function () { return S; }, save: save };

  /* ------------------------------------------------------------ day model */
  function settings() {
    return { method: S.method, asr: S.asr, highLat: S.highLat, adjust: S.adjust, hijriOffset: S.hijriOffset };
  }
  function todayParts(d) { return T.localParts(S.loc.tz, d || new Date()); }
  function dayModel(y, m, d) {
    var probe = new Date(Date.UTC(y, m - 1, d, 12));
    var tz = T.tzOffset(S.loc.tz, probe);
    var t = T.computeTimes({ y: y, m: m, d: d, lat: S.loc.lat, lng: S.loc.lng, tz: tz, settings: settings() });
    var out = { y: y, m: m, d: d, hours: t, approx: !!t.approx, at: {} };
    ['imsak', 'fajr', 'sunrise', 'dhuhr', 'asr', 'sunset', 'maghrib', 'isha', 'midnight', 'lastThird'].forEach(function (k) {
      out.at[k] = T.zonedEpoch(S.loc.tz, y, m, d, t[k]);
    });
    return out;
  }
  function shiftDate(y, m, d, delta) {
    var t = new Date(Date.UTC(y, m - 1, d));
    t.setUTCDate(t.getUTCDate() + delta);
    return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
  }
  function dayKey(y, m, d) { return y + '-' + pad(m) + '-' + pad(d); }

  function fmtTime(epoch) {
    var p = T.localParts(S.loc.tz, new Date(epoch));
    return fmtHM(p.hh, p.mm);
  }
  function fmtHM(hh, mm) {
    if (S.timeFormat === '12') {
      var ap = hh >= 12 ? 'PM' : 'AM', h12 = hh % 12; if (h12 === 0) h12 = 12;
      return h12 + ':' + pad(mm) + ' ' + ap;
    }
    return pad(hh) + ':' + pad(mm);
  }
  function fmtDur(ms) {
    if (ms < 0) ms = 0;
    var s = Math.floor(ms / 1000);
    return pad(Math.floor(s / 3600)) + ':' + pad(Math.floor(s / 60) % 60) + ':' + pad(s % 60);
  }
  function relWords(ms) {
    var mins = Math.round(ms / 60000);
    if (mins < 1) return 'in less than a minute';
    if (mins < 60) return 'in ' + mins + ' minute' + (mins === 1 ? '' : 's');
    var h = Math.floor(mins / 60), r = mins % 60;
    return 'in ' + h + ' h' + (r ? ' ' + r + ' m' : '');
  }

  var GREG_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'];
  var DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  function dowIndex(y, m, d) { return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); }

  /* --------------------------------------------------------------- state */
  var day = null, tomorrow = null, nextInfo = null, tickTimer = null;

  function rebuild() {
    var p = todayParts();
    day = dayModel(p.y, p.m, p.d);
    var n = shiftDate(p.y, p.m, p.d, 1);
    tomorrow = dayModel(n.y, n.m, n.d);
    renderToday();
    renderTracker();
    renderQibla();
    scheduleNotifications();
  }

  function computeNext(now) {
    var seq = [];
    PRAYERS.forEach(function (p) { seq.push({ k: p.k, n: p.n, at: day.at[p.k] }); });
    seq.push({ k: 'fajr', n: 'Fajr', at: tomorrow.at.fajr, tomorrow: true });
    var idx = 0;
    while (idx < seq.length && seq[idx].at <= now) idx++;
    var next = seq[Math.min(idx, seq.length - 1)];
    var prev = idx > 0 ? seq[idx - 1] : { k: 'isha', n: 'Isha', at: day.at.isha - 86400000 };
    return { next: next, prev: prev };
  }

  function phaseFor(prevKey) {
    if (prevKey === 'fajr') return 'fajr';
    if (prevKey === 'sunrise') return 'morning';
    if (prevKey === 'dhuhr') return 'midday';
    if (prevKey === 'asr') return 'asr';
    if (prevKey === 'maghrib') return 'maghrib';
    return 'night';
  }

  /* ---------------------------------------------------------- render: today */
  function renderToday() {
    var p = todayParts();
    var h = T.toHijri(p.y, p.m, p.d, S.hijriOffset);
    $('#loc-name').textContent = S.loc.name;
    $('#date-line').textContent = h.d + ' ' + h.monthName + ' ' + h.y + ' AH · ' +
      DOW[dowIndex(p.y, p.m, p.d)].slice(0, 3) + ' ' + p.d + ' ' + GREG_MONTHS[p.m - 1].slice(0, 3);

    renderRamadan();
    renderTimesCard();
    renderStrip();
    renderTools();
    renderAyah();
    renderEvent();
    tick();
  }

  // During Ramadan the day is framed by suhoor and iftar rather than by the
  // next prayer, so it gets its own card above the timetable.
  function renderRamadan() {
    var existing = document.getElementById('ramadan-card');
    var p = todayParts();
    var h = T.toHijri(p.y, p.m, p.d, S.hijriOffset);
    if (h.m !== 9) { if (existing) existing.remove(); return; }
    var card = existing || el('div', 'ramadan');
    card.id = 'ramadan-card';
    card.innerHTML = '';
    var lbl = el('div', 'lbl');
    lbl.appendChild(el('b', null, 'Ramadan ' + h.y + ' · day ' + h.d));
    lbl.appendChild(el('span', null, 'Suhoor ends ' + fmtTime(day.at.imsak) + ' · Iftar ' + fmtTime(day.at.maghrib)));
    card.appendChild(lbl);
    card.appendChild(el('div', 'cd num', '--:--'));
    if (!existing) $('#times-card').parentNode.insertBefore(card, $('#times-card'));
    updateRamadan();
  }
  function updateRamadan() {
    var card = document.getElementById('ramadan-card');
    if (!card || !day) return;
    var now = Date.now();
    var cd = card.querySelector('.cd');
    var lbl = card.querySelector('.lbl b');
    if (now < day.at.imsak) {
      cd.textContent = fmtDur(day.at.imsak - now);
      lbl.textContent = 'Suhoor ends in';
    } else if (now < day.at.maghrib) {
      cd.textContent = fmtDur(day.at.maghrib - now);
      lbl.textContent = 'Iftar in';
    } else {
      cd.textContent = fmtDur(tomorrow.at.imsak - now);
      lbl.textContent = 'Suhoor ends in';
    }
  }

  function renderTimesCard() {
    var card = $('#times-card');
    card.innerHTML = '';
    var head = el('div', 'card-h');
    head.appendChild(el('h2', 'eyebrow', 'Prayer times · ' + (T.METHODS[S.method] || {}).name));
    var more = el('button', 'more', 'Month');
    more.addEventListener('click', openMonthTable);
    head.appendChild(more);
    card.appendChild(head);

    var now = Date.now();
    var ni = computeNext(now);
    PRAYERS.forEach(function (pr) {
      var row = el('div', 'prow');
      var isNow = ni.prev.k === pr.k && !ni.prev.tomorrow;
      if (isNow) row.classList.add('is-now');
      else if (day.at[pr.k] < now) row.classList.add('is-past');
      row.appendChild(el('div', 'glyph', GLYPH[pr.k]));
      var nm = el('div', 'nm');
      nm.appendChild(el('b', null, pr.n + ' <span style="font-family:Amiri,serif;font-weight:400;opacity:.55;font-size:13px">' + pr.ar + '</span>'));
      nm.appendChild(el('span', null, isNow ? 'Current · until ' + fmtTime(ni.next.at) : pr.d));
      row.appendChild(nm);
      row.appendChild(el('div', 'tm num', fmtTime(day.at[pr.k])));

      var bell = el('button', 'bell', bellSvg(S.notif.per[pr.k]));
      bell.setAttribute('data-on', S.notif.per[pr.k] ? '1' : '0');
      bell.setAttribute('aria-label', 'Athan for ' + pr.n);
      bell.addEventListener('click', function (e) {
        e.stopPropagation();
        S.notif.per[pr.k] = !S.notif.per[pr.k];
        if (S.notif.per[pr.k] && !S.notif.on) enableNotifications();
        save(); renderTimesCard(); scheduleNotifications();
        toast(pr.n + ' athan ' + (S.notif.per[pr.k] ? 'on' : 'off'));
      });
      row.appendChild(bell);

      if (pr.track) {
        var st = (S.log[dayKey(day.y, day.m, day.d)] || {})[pr.k] || '';
        var dot = el('button', 'logdot', st ? statusOf(st).ch : '');
        if (st) dot.setAttribute('data-s', st);
        dot.setAttribute('aria-label', 'Log ' + pr.n);
        dot.addEventListener('click', function (e) {
          e.stopPropagation();
          cycleLog(dayKey(day.y, day.m, day.d), pr.k);
          renderTimesCard(); renderTracker();
        });
        row.appendChild(dot);
      } else {
        row.appendChild(el('div', null, '<span style="width:26px;display:block"></span>'));
      }
      card.appendChild(row);
    });

    if (day.approx) {
      var note = el('div', null, '');
      note.style.cssText = 'padding:10px 16px;border-top:1px solid var(--line-soft);font-size:11.5px;color:var(--muted)';
      note.textContent = 'At this latitude the sun does not reach the required angle. Times use the nearest-latitude rule (aqrab al-bilad).';
      card.appendChild(note);
    }
  }
  function bellSvg(on) {
    return on
      ? '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M18 15v-4a6 6 0 1 0-12 0v4l-1.6 2.4h15.2Z"/><path d="M10 19.5a2 2 0 0 0 4 0Z"/></svg>'
      : '<svg viewBox="0 0 24 24"><path d="M18 15v-4a6 6 0 1 0-12 0v4l-1.6 2.4h15.2Z"/><path d="M10 20a2 2 0 0 0 4 0"/><path d="m4 4 16 16" stroke-width="1.4"/></svg>';
  }
  function statusOf(k) {
    for (var i = 0; i < STATUS.length; i++) if (STATUS[i].k === k) return STATUS[i];
    return { k: '', ch: '', s: 'Not logged', prayed: false };
  }
  function cycleLog(dk, pk) {
    var d = S.log[dk] || (S.log[dk] = {});
    var cur = d[pk] || '';
    var i = CYCLE.indexOf(cur);
    var nx = CYCLE[(i + 1) % CYCLE.length];
    if (nx) d[pk] = nx; else delete d[pk];
    if (!Object.keys(d).length) delete S.log[dk];
    save();
    if (nx) toast(pk.charAt(0).toUpperCase() + pk.slice(1) + ' · ' + statusOf(nx).s);
  }

  function renderStrip() {
    var s = $('#sun-strip');
    s.innerHTML = '';
    [['Sunrise', fmtTime(day.at.sunrise)], ['Midnight', fmtTime(day.at.midnight)],
     ['Last third', fmtTime(day.at.lastThird)]].forEach(function (r) {
      var d = el('div');
      d.appendChild(el('span', null, r[0]));
      d.appendChild(el('b', 'num', r[1]));
      s.appendChild(d);
    });
  }

  function renderTools() {
    var strip = $('#tools-strip');
    if (!strip) return;
    strip.innerHTML = '';
    [['Calendar', '<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3.5v3M16 3.5v3"/></svg>',
      function () { if (window.AlifExtras) window.AlifExtras.openCalendar(); }],
     ['99 Names', '<svg viewBox="0 0 24 24"><path d="M12 3.5 14.3 9l5.7.4-4.4 3.7 1.4 5.6L12 15.6 7 18.7l1.4-5.6L4 9.4 9.7 9Z"/></svg>',
      function () { if (window.AlifExtras) window.AlifExtras.openNames(); }],
     ['Tasbih', '<svg viewBox="0 0 24 24"><circle cx="12" cy="6" r="2.2"/><circle cx="17.5" cy="9.5" r="2.2"/><circle cx="17.5" cy="15" r="2.2"/><circle cx="12" cy="18.5" r="2.2"/><circle cx="6.5" cy="15" r="2.2"/><circle cx="6.5" cy="9.5" r="2.2"/></svg>',
      function () { openTasbih(); }]
    ].forEach(function (t) {
      var b = el('button');
      b.innerHTML = '<span style="display:grid;place-items:center;color:var(--brass)">' +
        t[1].replace('<svg', '<svg style="width:19px;height:19px;stroke:currentColor;fill:none;stroke-width:1.5;stroke-linejoin:round"') +
        '</span>';
      var lab = el('b', null, t[0]);
      lab.style.fontSize = '12.5px';
      b.appendChild(lab);
      b.addEventListener('click', t[2]);
      strip.appendChild(b);
    });
  }

  function renderAyah() {
    var p = todayParts();
    var seed = (p.y * 372 + p.m * 31 + p.d) % VERSES.length;
    var v = VERSES[seed];
    var c = $('#ayah-card');
    c.innerHTML = '';
    c.appendChild(el('div', 'eyebrow', 'Verse of the day'));
    c.appendChild(el('div', 'ayah-ar', v[2]));
    c.appendChild(el('div', 'ayah-tx', v[3]));
    var ref = el('button', 'ayah-rf', 'Surah ' + (window.SURAHS ? window.SURAHS[v[0] - 1][2] : v[0]) + ' · ' + v[0] + ':' + v[1] + '  →');
    ref.addEventListener('click', function () {
      showScreen('quran');
      if (window.AlifQuran) window.AlifQuran.open(v[0], v[1]);
    });
    c.appendChild(ref);
  }

  // Inverse of toHijri: the tabular conversion, moved back by the user's
  // sighting offset so events line up with the dates Alif displays.
  function gregorianOfHijri(hy, hm, hd) {
    var g = T.fromHijri(hy, hm, hd);
    var t = new Date(Date.UTC(g.y, g.m - 1, g.d));
    t.setUTCDate(t.getUTCDate() - (S.hijriOffset || 0));
    return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
  }

  function renderEvent() {
    var card = $('#event-card');
    var p = todayParts();
    var h = T.toHijri(p.y, p.m, p.d, S.hijriOffset);
    var best = null;
    T.HIJRI_EVENTS.forEach(function (ev) {
      [h.y, h.y + 1].forEach(function (yy) {
        var g = gregorianOfHijri(yy, ev.m, ev.d);
        var days = Math.round((Date.UTC(g.y, g.m - 1, g.d) - Date.UTC(p.y, p.m - 1, p.d)) / 86400000);
        if (days >= 0 && days <= 400 && (!best || days < best.days)) best = { ev: ev, days: days, g: g };
      });
    });
    if (!best) { card.hidden = true; return; }
    card.hidden = false;
    card.innerHTML = '';
    var row = el('div', 'li');
    row.style.borderTop = '0';
    var t = el('div', 't');
    t.appendChild(el('b', null, best.ev.name));
    t.appendChild(el('span', null, best.days === 0 ? 'Today' :
      best.days === 1 ? 'Tomorrow · ' + best.g.d + ' ' + GREG_MONTHS[best.g.m - 1] :
      'in ' + best.days + ' days · ' + best.g.d + ' ' + GREG_MONTHS[best.g.m - 1] + ' ' + best.g.y));
    row.appendChild(el('div', 'glyph', '<svg viewBox="0 0 24 24" style="width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:1.5"><path d="M19 13.5A7.5 7.5 0 0 1 9.5 4a7.5 7.5 0 1 0 9.5 9.5Z"/></svg>'));
    row.appendChild(t);
    row.appendChild(el('div', 'badge', 'Hijri'));
    card.appendChild(row);
  }

  /* --------------------------------------------------------------- the arc */
  function renderArc(prev, next, now) {
    var svg = $('#arc');
    var fajr = day.at.fajr, isha = day.at.isha;
    var span = isha - fajr;
    var frac = Math.max(0, Math.min(1, (now - fajr) / span));
    var pt = function (t) {
      return [170 - 156 * Math.cos(Math.PI * t), 70 - 52 * Math.sin(Math.PI * t)];
    };
    var arcPath = function (a, b) {
      var out = [], steps = 60;
      for (var i = 0; i <= steps; i++) {
        var t = a + (b - a) * i / steps, q = pt(t);
        out.push((i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1));
      }
      return out.join(' ');
    };
    var parts = ['<path class="track" d="' + arcPath(0, 1) + '"/>'];
    if (frac > 0.002) parts.push('<path class="prog" d="' + arcPath(0, frac) + '"/>');
    var labelled = { fajr: 'Fajr', dhuhr: 'Dhuhr', isha: 'Isha' };
    PRAYERS.forEach(function (pr) {
      var f = Math.max(0, Math.min(1, (day.at[pr.k] - fajr) / span));
      var q = pt(f);
      parts.push('<circle class="tick' + (day.at[pr.k] <= now ? ' done' : '') + '" cx="' + q[0].toFixed(1) +
        '" cy="' + q[1].toFixed(1) + '" r="2.6"/>');
      if (labelled[pr.k]) {
        var anchor = f < 0.15 ? 'start' : f > 0.85 ? 'end' : 'middle';
        parts.push('<text class="lbl" x="' + q[0].toFixed(1) + '" y="' + (q[1] - 9).toFixed(1) +
          '" text-anchor="' + anchor + '">' + labelled[pr.k] + '</text>');
      }
    });
    var s = pt(frac);
    parts.push('<circle class="sun" cx="' + s[0].toFixed(1) + '" cy="' + s[1].toFixed(1) + '" r="5"/>');
    svg.innerHTML = parts.join('');
  }

  /* ------------------------------------------------------------------ tick */
  function tick() {
    if (!day) return;
    var now = Date.now();
    var p = todayParts(new Date(now));
    if (p.d !== day.d || p.m !== day.m || p.y !== day.y) { rebuild(); return; }
    var ni = computeNext(now);
    nextInfo = ni;
    $('#next-name').textContent = ni.next.n + (ni.next.tomorrow ? ' · tomorrow' : '');
    $('#countdown').innerHTML = fmtDur(ni.next.at - now);
    $('#count-sub').textContent = 'at ' + fmtTime(ni.next.at) + ' · ' + relWords(ni.next.at - now) +
      (ni.prev.k && !ni.prev.tomorrow ? ' · ' + ni.prev.n + ' since ' + fmtTime(ni.prev.at) : '');
    var ph = SKY[phaseFor(ni.prev.tomorrow ? 'isha' : ni.prev.k)];
    var bg = $('#sky-bg');
    bg.style.setProperty('--sky-a', ph[0]);
    bg.style.setProperty('--sky-b', ph[1]);
    renderArc(ni.prev, ni.next, now);
    updateRamadan();
    var cur = $('.prow.is-now');
    if (!cur || cur.querySelector('.nm b').textContent.indexOf(ni.prev.n) !== 0) renderTimesCard();
  }

  /* --------------------------------------------------------- month table */
  function openMonthTable() {
    var p = todayParts();
    var state = { y: p.y, m: p.m };
    function body() {
      var wrap = el('div');
      var nav = el('div');
      nav.style.cssText = 'display:flex;align-items:center;gap:10px;padding:4px 18px 10px';
      var prev = el('button', 'iconbtn', '<svg viewBox="0 0 24 24"><path d="m14 6-6 6 6 6"/></svg>');
      var next = el('button', 'iconbtn', '<svg viewBox="0 0 24 24"><path d="m10 6 6 6-6 6"/></svg>');
      var ttl = el('div', null, '<b>' + GREG_MONTHS[state.m - 1] + ' ' + state.y + '</b>');
      ttl.style.cssText = 'flex:1;text-align:center;font-size:14px';
      prev.addEventListener('click', function () { state.m--; if (state.m < 1) { state.m = 12; state.y--; } refresh(); });
      next.addEventListener('click', function () { state.m++; if (state.m > 12) { state.m = 1; state.y++; } refresh(); });
      nav.appendChild(prev); nav.appendChild(ttl); nav.appendChild(next);
      wrap.appendChild(nav);

      var tw = el('div', 'tblwrap');
      var rows = ['<tr><th>Date</th>' + PRAYERS.map(function (x) { return '<th>' + x.n.slice(0, 3) + '</th>'; }).join('') + '</tr>'];
      var dim = new Date(Date.UTC(state.y, state.m, 0)).getUTCDate();
      for (var d = 1; d <= dim; d++) {
        var m = dayModel(state.y, state.m, d);
        var h = T.toHijri(state.y, state.m, d, S.hijriOffset);
        var isToday = (state.y === p.y && state.m === p.m && d === p.d);
        rows.push('<tr class="' + (isToday ? 'today' : '') + '"><td>' + d + ' <span style="color:var(--muted);font-size:10.5px">' +
          DOW[dowIndex(state.y, state.m, d)].slice(0, 2) + ' · ' + h.d + '/' + h.m + '</span></td>' +
          PRAYERS.map(function (x) { return '<td>' + fmtTime(m.at[x.k]) + '</td>'; }).join('') + '</tr>');
      }
      tw.innerHTML = '<table class="mtable">' + rows.join('') + '</table>';
      wrap.appendChild(tw);
      var hint = el('div', 'note', 'Times for ' + S.loc.name + ' · ' + (T.METHODS[S.method] || {}).name +
        ' · Asr: ' + (S.asr === 'Hanafi' ? 'Hanafi' : 'Standard') + '.');
      wrap.appendChild(hint);
      return wrap;
    }
    function refresh() { sheet('Monthly timetable', body()); }
    refresh();
  }

  /* --------------------------------------------------------------- qibla */
  var compassOn = false, headingNow = null;
  function renderQibla() {
    var b = T.qiblaBearing(S.loc.lat, S.loc.lng);
    var dist = T.distanceToKaaba(S.loc.lat, S.loc.lng);
    $('#qibla-loc').textContent = S.loc.name + ' · ' + S.loc.lat.toFixed(3) + ', ' + S.loc.lng.toFixed(3);
    drawCompass(b, headingNow);
    var deg = $('#qibla-deg');
    if (headingNow == null) {
      deg.textContent = Math.round(b) + '°';
      $('#qibla-sub').textContent = 'from true north · ' + compassPoint(b);
    } else {
      var rel = ((b - headingNow) % 360 + 360) % 360;
      var off = rel > 180 ? rel - 360 : rel;
      deg.innerHTML = Math.abs(off) < 3
        ? '<span class="aligned">Facing Qibla</span>'
        : Math.round(Math.abs(off)) + '°<span style="font-size:16px"> ' + (off > 0 ? 'right' : 'left') + '</span>';
      $('#qibla-sub').textContent = 'Qibla ' + Math.round(b) + '° · heading ' + Math.round(headingNow) + '°';
      if (Math.abs(off) < 3) buzz(18);
    }
    var strip = $('#qibla-strip');
    strip.innerHTML = '';
    [['Bearing', Math.round(b) + '°'], ['Distance', dist.toLocaleString('en-US') + ' km'],
     ['Compass', compassPoint(b)]].forEach(function (r) {
      var d = el('div'); d.appendChild(el('span', null, r[0])); d.appendChild(el('b', 'num', r[1])); strip.appendChild(d);
    });
    if (dist <= 5) {
      $('#qibla-sub').textContent = 'You are at the Sacred Mosque in Makkah — face the Kaaba itself.';
    }
    $('#qibla-note').textContent = compassOn
      ? 'Live compass on. Hold the phone flat and away from metal or magnets. Move it in a figure-of-eight to recalibrate.'
      : 'Without a live compass, turn until true north (N on the dial) lines up with north, then face the brass needle. Enable the live compass for real-time alignment.';
  }
  function compassPoint(b) {
    var names = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return names[Math.round(b / 22.5) % 16];
  }
  function drawCompass(bearing, heading) {
    var rot = heading == null ? 0 : -heading;
    var parts = ['<svg viewBox="0 0 200 200">'];
    parts.push('<circle class="c-face" cx="100" cy="100" r="94"/>');
    parts.push('<circle class="c-ring" cx="100" cy="100" r="94"/>');
    parts.push('<circle class="c-ring" cx="100" cy="100" r="72"/>');
    parts.push('<g transform="rotate(' + rot.toFixed(1) + ' 100 100)">');
    for (var a = 0; a < 360; a += 6) {
      var maj = a % 30 === 0;
      var r1 = maj ? 78 : 84, r2 = 90;
      var rad = (a - 90) * Math.PI / 180;
      parts.push('<line class="c-tick' + (maj ? ' major' : '') + '" x1="' + (100 + r1 * Math.cos(rad)).toFixed(1) +
        '" y1="' + (100 + r1 * Math.sin(rad)).toFixed(1) + '" x2="' + (100 + r2 * Math.cos(rad)).toFixed(1) +
        '" y2="' + (100 + r2 * Math.sin(rad)).toFixed(1) + '"/>');
    }
    [['N', 0], ['E', 90], ['S', 180], ['W', 270]].forEach(function (c) {
      var rad = (c[1] - 90) * Math.PI / 180;
      parts.push('<text class="c-card' + (c[1] === 0 ? ' n' : '') + '" x="' + (100 + 64 * Math.cos(rad)).toFixed(1) +
        '" y="' + (100 + 64 * Math.sin(rad) + 3.5).toFixed(1) + '" text-anchor="middle">' + c[0] + '</text>');
    });
    // qibla needle
    var qr = (bearing - 90) * Math.PI / 180;
    var tipx = 100 + 66 * Math.cos(qr), tipy = 100 + 66 * Math.sin(qr);
    var lr = (bearing + 90 - 90) * Math.PI / 180;
    parts.push('<path class="c-needle" d="M' + tipx.toFixed(1) + ' ' + tipy.toFixed(1) +
      ' L' + (100 + 13 * Math.cos(lr)).toFixed(1) + ' ' + (100 + 13 * Math.sin(lr)).toFixed(1) +
      ' L' + (100 - 13 * Math.cos(lr)).toFixed(1) + ' ' + (100 - 13 * Math.sin(lr)).toFixed(1) + ' Z"/>');
    // kaaba mark at the needle tip
    var kx = 100 + 80 * Math.cos(qr), ky = 100 + 80 * Math.sin(qr);
    parts.push('<g transform="translate(' + kx.toFixed(1) + ' ' + ky.toFixed(1) + ')">' +
      '<rect class="c-kaaba" x="-7" y="-7" width="14" height="14" rx="2"/>' +
      '<rect x="-7" y="-2.4" width="14" height="2.4" fill="var(--brass)"/></g>');
    parts.push('</g>');
    parts.push('<circle cx="100" cy="100" r="4" fill="var(--surface)" stroke="var(--brass)" stroke-width="1.5"/>');
    parts.push('<path d="M100 4 l6 10 h-12 z" fill="var(--clay)"/>');
    parts.push('</svg>');
    $('#compass').innerHTML = parts.join('');
  }
  function startCompass() {
    function attach() {
      compassOn = true;
      $('#btn-compass-start').textContent = 'Live compass on';
      window.addEventListener('deviceorientationabsolute', onOrient, true);
      window.addEventListener('deviceorientation', onOrient, true);
      renderQibla();
    }
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission().then(function (r) {
        if (r === 'granted') attach();
        else toast('Motion access denied — using the static dial');
      }).catch(function () { toast('Compass unavailable on this device'); });
    } else if ('ondeviceorientationabsolute' in window || 'ondeviceorientation' in window) {
      attach();
    } else {
      toast('This device has no compass — use the static dial');
    }
  }
  var lastCompassPaint = 0;
  function onOrient(e) {
    var hd = null;
    if (typeof e.webkitCompassHeading === 'number') hd = e.webkitCompassHeading;
    else if (e.absolute && typeof e.alpha === 'number') hd = 360 - e.alpha;
    if (hd == null || isNaN(hd)) return;
    headingNow = ((hd % 360) + 360) % 360;
    var now = Date.now();
    if (now - lastCompassPaint > 90) { lastCompassPaint = now; renderQibla(); }
  }
  function buzz(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }

  /* ------------------------------------------------------------- tracker */
  function logStats() {
    var p = todayParts();
    var counts = {}, total = 0, jamaah = 0, ontime = 0, daysTracked = 0;
    Object.keys(S.log).forEach(function (k) {
      var d = S.log[k], any = false;
      TRACKED.forEach(function (pr) {
        var v = d[pr.k];
        if (!v) return;
        any = true;
        if (statusOf(v).prayed) { total++; counts[pr.k] = (counts[pr.k] || 0) + 1; }
        if (v === 'jamaah') { jamaah++; ontime++; }
        if (v === 'ontime') ontime++;
      });
      if (any) daysTracked++;
    });

    // A day counts towards a streak when all five obligatory prayers are
    // logged as prayed. Today is exempt until its last prayer is logged.
    function complete(y, m, d) {
      var l = S.log[dayKey(y, m, d)] || {};
      return TRACKED.every(function (pr) { return l[pr.k] && statusOf(l[pr.k]).prayed; });
    }
    var streak = 0;
    var cur = complete(p.y, p.m, p.d) ? { y: p.y, m: p.m, d: p.d } : shiftDate(p.y, p.m, p.d, -1);
    while (complete(cur.y, cur.m, cur.d)) {
      streak++;
      cur = shiftDate(cur.y, cur.m, cur.d, -1);
      if (streak > 3650) break;
    }

    // longest streak over every day that has a log entry
    var keys = Object.keys(S.log).filter(function (k) {
      var q = k.split('-');
      return complete(+q[0], +q[1], +q[2]);
    }).sort();
    var best = 0, run = 0, prevKey = null;
    keys.forEach(function (k) {
      var q = k.split('-');
      var yesterday = shiftDate(+q[0], +q[1], +q[2], -1);
      run = (prevKey === dayKey(yesterday.y, yesterday.m, yesterday.d)) ? run + 1 : 1;
      if (run > best) best = run;
      prevKey = k;
    });

    var missed = 0;
    Object.keys(S.log).forEach(function (k) {
      TRACKED.forEach(function (pr) { if (S.log[k][pr.k] === 'missed') missed++; });
    });
    return { counts: counts, total: total, jamaah: jamaah, ontime: ontime, missed: missed,
             streak: streak, best: Math.max(best, streak), days: daysTracked };
  }

  function dayCount(y, m, d) {
    var l = S.log[dayKey(y, m, d)] || {};
    var n = 0;
    TRACKED.forEach(function (pr) { if (l[pr.k] && statusOf(l[pr.k]).prayed) n++; });
    return n;
  }

  function renderTracker() {
    var p = todayParts();
    var st = logStats();
    $('#tracker-sub').textContent = st.days + ' day' + (st.days === 1 ? '' : 's') + ' tracked · ' + st.total + ' prayers logged';

    var sc = $('#streak-card');
    sc.innerHTML = '';
    sc.appendChild(el('div', 'big display num', String(st.streak)));
    var txt = el('div', 'txt');
    txt.appendChild(el('b', null, st.streak === 1 ? 'day streak' : 'day streak'));
    txt.appendChild(el('span', null, st.streak === 0
      ? 'Log all five prayers today to start a streak'
      : 'Longest streak ' + st.best + ' day' + (st.best === 1 ? '' : 's') +
        ' · ' + st.jamaah + ' prayer' + (st.jamaah === 1 ? '' : 's') + ' in congregation'));
    sc.appendChild(txt);

    var tt = $('#track-today');
    tt.innerHTML = '';
    var dk = dayKey(p.y, p.m, p.d);
    TRACKED.forEach(function (pr) {
      var row = el('button', 'prow');
      row.style.width = '100%';
      row.appendChild(el('div', 'glyph', GLYPH[pr.k]));
      var nm = el('div', 'nm');
      nm.appendChild(el('b', null, pr.n));
      var cur = (S.log[dk] || {})[pr.k] || '';
      nm.appendChild(el('span', null, cur ? statusOf(cur).n : 'Not logged · ' + fmtTime(day.at[pr.k])));
      row.appendChild(nm);
      var dot = el('div', 'logdot', cur ? statusOf(cur).ch : '');
      if (cur) dot.setAttribute('data-s', cur);
      row.appendChild(dot);
      row.addEventListener('click', function () { openStatusSheet(dk, pr); });
      tt.appendChild(row);
    });

    // heatmap — 12 weeks ending today
    var heat = $('#heat');
    heat.innerHTML = '';
    var cursor = shiftDate(p.y, p.m, p.d, -83);   // 12 weeks, ending on today
    var htotal = 0;
    for (var i = 0; i < 84; i++) {
      var n = dayCount(cursor.y, cursor.m, cursor.d);
      htotal += n;
      var cell = el('i');
      cell.setAttribute('data-n', String(n));
      cell.title = cursor.d + ' ' + GREG_MONTHS[cursor.m - 1] + ' · ' + n + '/5';
      if (cursor.y === p.y && cursor.m === p.m && cursor.d === p.d) cell.className = 'today';
      heat.appendChild(cell);
      cursor = shiftDate(cursor.y, cursor.m, cursor.d, 1);
    }
    $('#heat-total').textContent = htotal + ' prayers';

    // week bars
    var bars = $('#week-bars');
    bars.innerHTML = '';
    var wsum = 0;
    for (var w = 6; w >= 0; w--) {
      var dd = shiftDate(p.y, p.m, p.d, -w);
      var c = dayCount(dd.y, dd.m, dd.d);
      wsum += c;
      var col = el('div');
      var bar = el('div', 'b' + (c <= 2 ? ' low' : c <= 4 ? ' mid' : ''));
      bar.style.height = Math.max(3, (c / 5) * 100) + '%';
      bar.title = c + '/5';
      col.appendChild(bar);
      col.appendChild(el('span', null, DOW[dowIndex(dd.y, dd.m, dd.d)].slice(0, 1)));
      bars.appendChild(col);
    }
    $('#week-pct').textContent = Math.round(wsum / 35 * 100) + '%';

    // per prayer 30 days
    var pr30 = $('#pct-rows');
    pr30.innerHTML = '';
    TRACKED.forEach(function (pr) {
      var n = 0;
      for (var i2 = 0; i2 < 30; i2++) {
        var dd2 = shiftDate(p.y, p.m, p.d, -i2);
        var v = (S.log[dayKey(dd2.y, dd2.m, dd2.d)] || {})[pr.k];
        if (v && statusOf(v).prayed) n++;
      }
      var pct = Math.round(n / 30 * 100);
      var row = el('div', 'pct-row');
      row.appendChild(el('div', 'nmm', pr.n));
      var bw = el('div', 'barw');
      var bf = el('div', 'barf');
      bf.style.width = pct + '%';
      if (pct < 40) bf.style.background = 'var(--clay)';
      else if (pct < 75) bf.style.background = 'var(--brass)';
      bw.appendChild(bf);
      row.appendChild(bw);
      row.appendChild(el('div', 'val num', pct + '%'));
      pr30.appendChild(row);
    });

    var sg = $('#stat-grid');
    sg.innerHTML = '';
    var onTimeRate = st.total ? Math.round(st.ontime / st.total * 100) + '%' : '—';
    [[st.total, 'Prayers logged'], [onTimeRate, 'On time or jama‘ah'],
     [st.jamaah, 'In congregation'], [st.missed, 'Missed to make up'],
     [st.best, 'Longest streak'], [st.days, 'Days tracked']].forEach(function (r) {
      var d = el('div');
      d.appendChild(el('b', 'num', String(r[0])));
      d.appendChild(el('span', null, r[1]));
      sg.appendChild(d);
    });
  }

  function openStatusSheet(dk, pr) {
    var body = el('div');
    var cur = (S.log[dk] || {})[pr.k] || '';
    STATUS.forEach(function (s) {
      var b = el('button', 'opt' + (cur === s.k ? ' is-on' : ''));
      var t = el('div', 't');
      t.appendChild(el('b', null, s.n));
      t.appendChild(el('span', null, s.k === 'qada' ? 'Counts as prayed, outside its window' :
        s.k === 'jamaah' ? 'Prayed with the congregation' : ''));
      var dot = el('div', 'logdot', s.ch);
      dot.setAttribute('data-s', s.k);
      b.appendChild(dot);
      b.appendChild(t);
      b.innerHTML += '<svg class="tick" viewBox="0 0 24 24"><path d="m5 13 4 4 10-10"/></svg>';
      b.addEventListener('click', function () {
        var d = S.log[dk] || (S.log[dk] = {});
        d[pr.k] = s.k;
        save(); closeSheet(); renderTracker(); renderTimesCard();
      });
      body.appendChild(b);
    });
    if (cur) {
      var clr = el('button', 'btn ghost', 'Clear log');
      clr.addEventListener('click', function () {
        delete S.log[dk][pr.k];
        if (!Object.keys(S.log[dk]).length) delete S.log[dk];
        save(); closeSheet(); renderTracker(); renderTimesCard();
      });
      body.appendChild(clr);
    }
    sheet(pr.n + ' · ' + dk, body);
  }

  function openMonthLog() {
    var p = todayParts();
    var state = { y: p.y, m: p.m };
    function build() {
      var wrap = el('div');
      var nav = el('div');
      nav.style.cssText = 'display:flex;align-items:center;gap:10px;padding:4px 18px 6px';
      var prev = el('button', 'iconbtn', '<svg viewBox="0 0 24 24"><path d="m14 6-6 6 6 6"/></svg>');
      var next = el('button', 'iconbtn', '<svg viewBox="0 0 24 24"><path d="m10 6 6 6-6 6"/></svg>');
      var ttl = el('div', null, '<b>' + GREG_MONTHS[state.m - 1] + ' ' + state.y + '</b>');
      ttl.style.cssText = 'flex:1;text-align:center;font-size:14px';
      prev.addEventListener('click', function () { state.m--; if (state.m < 1) { state.m = 12; state.y--; } sheet('Month', build()); });
      next.addEventListener('click', function () { state.m++; if (state.m > 12) { state.m = 1; state.y++; } sheet('Month', build()); });
      nav.appendChild(prev); nav.appendChild(ttl); nav.appendChild(next);
      wrap.appendChild(nav);
      var cal = el('div', 'cal');
      ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(function (d) { cal.appendChild(el('div', 'dow', d)); });
      var first = dowIndex(state.y, state.m, 1);
      for (var b = 0; b < first; b++) cal.appendChild(el('div', 'day blank'));
      var dim = new Date(Date.UTC(state.y, state.m, 0)).getUTCDate();
      var monthTotal = 0;
      for (var d = 1; d <= dim; d++) {
        (function (d) {
          var n = dayCount(state.y, state.m, d);
          monthTotal += n;
          var cell = el('button', 'day' + (state.y === p.y && state.m === p.m && d === p.d ? ' today' : ''));
          cell.appendChild(el('span', null, String(d)));
          var pips = el('div', 'pips');
          for (var i = 0; i < n; i++) pips.appendChild(el('i'));
          cell.appendChild(pips);
          cell.addEventListener('click', function () { openDaySheet(state.y, state.m, d); });
          cal.appendChild(cell);
        })(d);
      }
      wrap.appendChild(cal);
      wrap.appendChild(el('div', 'note', monthTotal + ' prayers logged this month · tap a day to edit it.'));
      return wrap;
    }
    sheet('Month', build());
  }

  function openDaySheet(y, m, d) {
    var dk = dayKey(y, m, d);
    var body = el('div');
    TRACKED.forEach(function (pr) {
      var cur = (S.log[dk] || {})[pr.k] || '';
      var b = el('button', 'opt');
      var t = el('div', 't');
      t.appendChild(el('b', null, pr.n));
      t.appendChild(el('span', null, cur ? statusOf(cur).n : 'Not logged'));
      var dot = el('div', 'logdot', cur ? statusOf(cur).ch : '');
      if (cur) dot.setAttribute('data-s', cur);
      b.appendChild(dot); b.appendChild(t);
      b.addEventListener('click', function () {
        cycleLog(dk, pr.k); renderTracker(); renderTimesCard(); openDaySheet(y, m, d);
      });
      body.appendChild(b);
    });
    body.appendChild(el('div', 'note', 'Tap a prayer to cycle: on time → congregation → late → missed → clear.'));
    sheet(d + ' ' + GREG_MONTHS[m - 1] + ' ' + y, body);
  }

  /* ------------------------------------------------------- notifications */
  var notifTimers = [];
  function enableNotifications() {
    if (!('Notification' in window)) { toast('This browser has no notifications'); return; }
    Notification.requestPermission().then(function (r) {
      S.notif.on = (r === 'granted');
      save();
      toast(S.notif.on ? 'Athan notifications on' : 'Notifications blocked in the browser');
      renderMore(); scheduleNotifications();
    });
  }
  function scheduleNotifications() {
    notifTimers.forEach(clearTimeout);
    notifTimers = [];
    if (!S.notif.on || !day) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    var now = Date.now();
    var list = [];
    PRAYERS.forEach(function (pr) {
      if (!S.notif.per[pr.k]) return;
      list.push({ n: pr.n, at: day.at[pr.k] });
      list.push({ n: pr.n, at: tomorrow.at[pr.k] });
    });
    list.forEach(function (item) {
      var fireAt = item.at - S.notif.before * 60000;
      var delay = fireAt - now;
      if (delay <= 0 || delay > 26 * 3600000) return;
      notifTimers.push(setTimeout(function () {
        try {
          new Notification(item.n + (S.notif.before ? ' in ' + S.notif.before + ' minutes' : ' — it is time'), {
            body: fmtTime(item.at) + ' · ' + S.loc.name,
            tag: 'alif-' + item.n + '-' + item.at,
            silent: S.notif.sound === 'silent'
          });
        } catch (e) {}
        playAthan();
        buzz([120, 80, 120]);
      }, delay));
    });
  }
  var audioCtx = null;
  function playAthan() {
    if (S.notif.sound === 'silent' || S.notif.sound === 'vibrate') return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      var seq = S.notif.sound === 'bell' ? [[392, 0], [523.25, .55], [392, 1.1]] : [[523.25, 0], [659.25, .38], [783.99, .76], [659.25, 1.2]];
      seq.forEach(function (s) {
        var t0 = audioCtx.currentTime + s[1];
        var osc = audioCtx.createOscillator(), g = audioCtx.createGain();
        osc.type = 'sine'; osc.frequency.value = s[0];
        var o2 = audioCtx.createOscillator(), g2 = audioCtx.createGain();
        o2.type = 'triangle'; o2.frequency.value = s[0] * 2.01; g2.gain.value = .12;
        g.gain.setValueAtTime(0, t0);
        g.gain.linearRampToValueAtTime(.22, t0 + .02);
        g.gain.exponentialRampToValueAtTime(.0008, t0 + 1.8);
        osc.connect(g); o2.connect(g2); g2.connect(g); g.connect(audioCtx.destination);
        osc.start(t0); o2.start(t0); osc.stop(t0 + 1.9); o2.stop(t0 + 1.9);
      });
    } catch (e) {}
  }

  /* ------------------------------------------------------------ location */
  function openLocationSheet(after) {
    var body = el('div');
    var gps = el('button', 'opt');
    gps.innerHTML = '<div class="glyph" style="width:30px;height:30px;border-radius:10px;display:grid;place-items:center;background:var(--surface-2)">' +
      '<svg viewBox="0 0 24 24" style="width:16px;height:16px;stroke:var(--brass);fill:none;stroke-width:1.6"><path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/></svg></div>' +
      '<div class="t"><b>Use my location</b><span>Reads GPS once and matches the nearest city for the time zone</span></div>';
    gps.addEventListener('click', useGPS);
    body.appendChild(gps);

    var sb = el('div', 'searchbar');
    sb.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>';
    var input = el('input');
    input.type = 'search'; input.placeholder = 'Search 2,000+ cities'; input.autocomplete = 'off';
    sb.appendChild(input);
    body.appendChild(sb);

    var results = el('div', 'list');
    body.appendChild(results);
    var manual = el('button', 'btn ghost', 'Enter coordinates manually');
    manual.addEventListener('click', openManualCoords);
    body.appendChild(manual);

    function paint(q) {
      results.innerHTML = '';
      var list = window.CITIES || [];
      var out = [];
      if (!q) {
        ['Makkah', 'Madinah', 'Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Istanbul', 'Cairo', 'London', 'Jakarta'].forEach(function (n) {
          for (var i = 0; i < list.length; i++) if (list[i][0] === n) { out.push(list[i]); break; }
        });
      } else {
        var ql = q.toLowerCase();
        for (var i = 0; i < list.length && out.length < 60; i++) {
          var c = list[i];
          if (c[0].toLowerCase().indexOf(ql) === 0) out.push(c);
        }
        for (var j = 0; j < list.length && out.length < 60; j++) {
          var c2 = list[j];
          if (c2[0].toLowerCase().indexOf(ql) > 0 || c2[1].toLowerCase().indexOf(ql) === 0) {
            if (out.indexOf(c2) < 0) out.push(c2);
          }
        }
      }
      if (!out.length) results.appendChild(el('div', 'empty', '<span class="mark">؟</span>No city matches “' + q + '”. Try another spelling, or enter coordinates.'));
      out.forEach(function (c) {
        var b = el('button', 'li');
        var t = el('div', 't');
        t.appendChild(el('b', null, c[0]));
        t.appendChild(el('span', null, c[1] + ' · ' + c[4]));
        b.appendChild(t);
        b.innerHTML += '<svg class="chev" viewBox="0 0 24 24"><path d="m10 6 6 6-6 6"/></svg>';
        b.addEventListener('click', function () {
          S.loc = { name: c[0], country: c[1], lat: c[2], lng: c[3], tz: c[4], source: 'manual' };
          save(); closeSheet(); rebuild(); renderMore();
          toast('Location set to ' + c[0]);
          if (typeof after === 'function') after();
        });
        results.appendChild(b);
      });
    }
    input.addEventListener('input', function () { paint(input.value.trim()); });
    paint('');
    sheet('Location', body);
  }

  function nearestCity(lat, lng) {
    var list = window.CITIES || [], best = null, bd = Infinity;
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      var dLat = (c[2] - lat) * 111, dLng = (c[3] - lng) * 111 * Math.cos(lat * Math.PI / 180);
      var d = dLat * dLat + dLng * dLng;
      if (d < bd) { bd = d; best = c; }
    }
    return { city: best, km: Math.sqrt(bd) };
  }
  function useGPS(after) {
    if (!navigator.geolocation) { toast('Location services unavailable'); return; }
    toast('Locating…');
    navigator.geolocation.getCurrentPosition(function (pos) {
      var lat = pos.coords.latitude, lng = pos.coords.longitude;
      var near = nearestCity(lat, lng);
      var tz = (near.km < 150 && near.city) ? near.city[4] :
        (Intl.DateTimeFormat().resolvedOptions().timeZone || null);
      S.loc = {
        name: near.km < 40 && near.city ? near.city[0] : 'My location',
        country: near.city ? near.city[1] : '',
        lat: Math.round(lat * 10000) / 10000, lng: Math.round(lng * 10000) / 10000,
        tz: tz, source: 'gps'
      };
      save(); closeSheet(); rebuild(); renderMore();
      toast('Location updated · ' + S.loc.name);
      if (typeof after === 'function') after();
    }, function (err) {
      toast(err.code === 1 ? 'Location permission denied' : 'Could not read your location');
    }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 600000 });
  }
  function openManualCoords() {
    var body = el('div');
    var wrap = el('div');
    wrap.style.cssText = 'padding:8px 18px 4px;display:grid;gap:10px';
    function field(label, val, step) {
      var l = el('label');
      l.style.cssText = 'display:grid;gap:5px;font-size:11.5px;color:var(--muted);font-weight:600';
      l.appendChild(el('span', null, label));
      var i = el('input');
      i.type = 'number'; i.step = step || 'any'; i.value = val;
      i.style.cssText = 'padding:11px 12px;border-radius:12px;border:1px solid var(--line);background:var(--surface-2);font-size:15px';
      l.appendChild(i);
      wrap.appendChild(l);
      return i;
    }
    var nameI = el('input');
    var nl = el('label');
    nl.style.cssText = 'display:grid;gap:5px;font-size:11.5px;color:var(--muted);font-weight:600';
    nl.appendChild(el('span', null, 'Place name'));
    nameI.type = 'text'; nameI.value = S.loc.name;
    nameI.style.cssText = 'padding:11px 12px;border-radius:12px;border:1px solid var(--line);background:var(--surface-2);font-size:15px';
    nl.appendChild(nameI); wrap.appendChild(nl);
    var latI = field('Latitude (−90…90)', S.loc.lat);
    var lngI = field('Longitude (−180…180)', S.loc.lng);
    body.appendChild(wrap);
    var tzNote = el('div', 'note', 'Times use the time zone ' + (S.loc.tz || Intl.DateTimeFormat().resolvedOptions().timeZone) + '. Pick a city instead if you need a different zone.');
    body.appendChild(tzNote);
    var ok = el('button', 'btn', 'Save location');
    ok.addEventListener('click', function () {
      var la = parseFloat(latI.value), ln = parseFloat(lngI.value);
      if (isNaN(la) || isNaN(ln) || la < -90 || la > 90 || ln < -180 || ln > 180) {
        toast('Enter a latitude between −90 and 90 and a longitude between −180 and 180');
        return;
      }
      S.loc = { name: nameI.value.trim() || 'Custom', country: '', lat: la, lng: ln, tz: S.loc.tz, source: 'manual' };
      save(); closeSheet(); rebuild(); renderMore();
    });
    body.appendChild(ok);
    sheet('Coordinates', body);
  }

  // "Updated automatically as you travel": with permission already granted,
  // re-read the position when the app comes back to the foreground and move
  // the timetable if the device has travelled a meaningful distance.
  var lastAutoCheck = 0;
  function maybeRefreshLocation() {
    if (!S.autoLoc || S.loc.source !== 'gps' || !navigator.geolocation) return;
    if (Date.now() - lastAutoCheck < 10 * 60000) return;
    lastAutoCheck = Date.now();
    function read() {
      navigator.geolocation.getCurrentPosition(function (pos) {
        var lat = pos.coords.latitude, lng = pos.coords.longitude;
        var dLat = (lat - S.loc.lat) * 111;
        var dLng = (lng - S.loc.lng) * 111 * Math.cos(lat * Math.PI / 180);
        var moved = Math.sqrt(dLat * dLat + dLng * dLng);
        if (moved < 25) return;
        var near = nearestCity(lat, lng);
        S.loc = {
          name: near.km < 40 && near.city ? near.city[0] : 'My location',
          country: near.city ? near.city[1] : '',
          lat: Math.round(lat * 10000) / 10000, lng: Math.round(lng * 10000) / 10000,
          tz: (near.km < 150 && near.city) ? near.city[4] : Intl.DateTimeFormat().resolvedOptions().timeZone,
          source: 'gps'
        };
        save(); rebuild(); renderMore();
        toast('You have travelled — times now for ' + S.loc.name);
      }, function () {}, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
    }
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then(function (st) {
        if (st.state === 'granted') read();
      }).catch(function () {});
    } else read();
  }

  /* ------------------------------------------------------------ settings */
  function optionSheet(title, options, current, onPick, note) {
    var body = el('div');
    options.forEach(function (o) {
      var b = el('button', 'opt' + (o.v === current ? ' is-on' : ''));
      var t = el('div', 't');
      t.appendChild(el('b', null, o.n));
      if (o.s) t.appendChild(el('span', null, o.s));
      b.appendChild(t);
      b.innerHTML += '<svg class="tick" viewBox="0 0 24 24"><path d="m5 13 4 4 10-10"/></svg>';
      b.addEventListener('click', function () { onPick(o.v); closeSheet(); });
      body.appendChild(b);
    });
    if (note) body.appendChild(el('div', 'note', note));
    sheet(title, body);
  }

  function row(label, value, onClick, opts) {
    opts = opts || {};
    var b = el(onClick ? 'button' : 'div', 'li');
    var t = el('div', 't');
    t.appendChild(el('b', null, label));
    if (opts.sub) t.appendChild(el('span', null, opts.sub));
    b.appendChild(t);
    if (opts.toggle !== undefined) {
      var sw = el('div', 'sw');
      sw.setAttribute('data-on', opts.toggle ? '1' : '0');
      b.appendChild(sw);
    } else {
      if (value != null) b.appendChild(el('div', 'v', value));
      if (onClick) b.innerHTML += '<svg class="chev" viewBox="0 0 24 24"><path d="m10 6 6 6-6 6"/></svg>';
    }
    if (onClick) b.addEventListener('click', onClick);
    return b;
  }

  function renderMore() {
    var body = $('#more-body');
    if (!body) return;
    body.innerHTML = '';
    var q = S.quran;

    function group(title, rows) {
      body.appendChild(el('div', 'section-title', title));
      var list = el('div', 'list');
      rows.forEach(function (r) { list.appendChild(r); });
      body.appendChild(list);
    }

    group('Location', [
      row('Place', S.loc.name, openLocationSheet, { sub: S.loc.country || (S.loc.lat.toFixed(2) + ', ' + S.loc.lng.toFixed(2)) }),
      row('Time zone', S.loc.tz || 'device', null, { sub: 'Follows the selected city' }),
      row('Use my location', null, function () { useGPS(); }, { sub: 'One-time GPS reading' }),
      row('Follow me as I travel', null, function () {
        S.autoLoc = !S.autoLoc; save(); renderMore();
        if (S.autoLoc) { lastAutoCheck = 0; maybeRefreshLocation(); }
      }, { toggle: !!S.autoLoc, sub: 'Re-check the position when Alif reopens' })
    ]);

    var methodNames = Object.keys(T.METHODS).map(function (k) {
      return { v: k, n: T.METHODS[k].name, s: describeMethod(k) };
    });
    group('Calculation', [
      row('Method', T.METHODS[S.method].name, function () {
        optionSheet('Calculation method', methodNames, S.method, function (v) {
          S.method = v; save(); rebuild(); renderMore();
        }, 'Local mosques may follow a different convention — pick the one your community uses.');
      }),
      row('Asr', S.asr === 'Hanafi' ? 'Hanafi' : 'Standard', function () {
        optionSheet('Asr calculation', [
          { v: 'Standard', n: 'Standard', s: 'Shafi‘i, Maliki, Hanbali — shadow ×1' },
          { v: 'Hanafi', n: 'Hanafi', s: 'Shadow ×2, later Asr' }
        ], S.asr, function (v) { S.asr = v; save(); rebuild(); renderMore(); });
      }),
      row('High latitude rule', hlName(S.highLat), function () {
        optionSheet('High latitude rule', [
          { v: 'NightMiddle', n: 'Middle of the night', s: 'Split the night in half' },
          { v: 'OneSeventh', n: 'One-seventh of the night', s: 'Fajr and Isha at 1/7 of the night' },
          { v: 'AngleBased', n: 'Angle based', s: 'Portion proportional to the twilight angle' },
          { v: 'None', n: 'None', s: 'Pure astronomical times' }
        ], S.highLat, function (v) { S.highLat = v; save(); rebuild(); renderMore(); },
        'Used when the sun stays too close to the horizon for a true Fajr or Isha — common above roughly 48° latitude.');
      }),
      row('Manual adjustments', adjustSummary(), openAdjustSheet, { sub: 'Fine-tune each prayer by minutes' }),
      row('Time format', S.timeFormat === '12' ? '12-hour' : '24-hour', function () {
        S.timeFormat = S.timeFormat === '12' ? '24' : '12'; save(); rebuild(); renderMore();
      })
    ]);

    var perOn = PRAYERS.filter(function (p) { return S.notif.per[p.k]; }).length;
    group('Athan & notifications', [
      row('Notifications', null, function () {
        if (S.notif.on) { S.notif.on = false; save(); scheduleNotifications(); renderMore(); }
        else enableNotifications();
      }, { toggle: S.notif.on }),
      row('Prayers', perOn + ' of 6 on', openPerPrayerSheet),
      row('Remind me', S.notif.before ? S.notif.before + ' min before' : 'At prayer time', function () {
        optionSheet('Reminder', [0, 5, 10, 15, 30].map(function (m) {
          return { v: m, n: m ? m + ' minutes before' : 'At prayer time' };
        }), S.notif.before, function (v) { S.notif.before = v; save(); scheduleNotifications(); renderMore(); });
      }),
      row('Sound', soundName(S.notif.sound), function () {
        optionSheet('Athan sound', [
          { v: 'chime', n: 'Chime', s: 'Four rising tones' },
          { v: 'bell', n: 'Bell', s: 'Three slow tones' },
          { v: 'vibrate', n: 'Vibrate only', s: 'Silent alert with haptics' },
          { v: 'silent', n: 'Silent', s: 'Banner only' }
        ], S.notif.sound, function (v) { S.notif.sound = v; save(); renderMore(); playAthan(); });
      }),
      row('Test notification', null, function () {
        playAthan(); buzz([120, 80, 120]);
        if (S.notif.on && 'Notification' in window && Notification.permission === 'granted') {
          try { new Notification('Alif — test athan', { body: 'Notifications are working.' }); } catch (e) {}
          toast('Test sent');
        } else toast('Sound played · turn notifications on for banners');
      }, { sub: 'Play the sound and show a banner' })
    ]);
    body.appendChild(el('div', 'note', 'A web app can only raise notifications while Alif is open in a browser tab. Keep the tab open (or install it to your home screen) for athan alerts.'));

    group('Quran', [
      row('Translation', translationName(q.translation), function () {
        optionSheet('Translation', [
          { v: 'en', n: 'English', s: 'Dr. Mustafa Khattab — The Clear Quran' },
          { v: 'nl', n: 'Nederlands', s: 'Sofian S. Siregar' },
          { v: 'none', n: 'Arabic only', s: 'Hide the translation' }
        ], q.translation, function (v) { q.translation = v; save(); renderMore(); if (window.AlifQuran) window.AlifQuran.refresh(); });
      }),
      row('Transliteration', null, function () {
        q.translit = !q.translit; save(); renderMore(); if (window.AlifQuran) window.AlifQuran.refresh();
      }, { toggle: q.translit, sub: 'Latin reading aid under each ayah' }),
      row('Arabic size', q.arSize + ' px', function () { openSizeSheet(); }),
      row('Bookmarks', q.bookmarks.length + ' saved', function () {
        showScreen('quran');
        if (window.AlifQuran) window.AlifQuran.setMode('bookmarks');
      })
    ]);

    group('Calendar', [
      row('Hijri date', hijriToday(), function () {
        optionSheet('Hijri adjustment', [-2, -1, 0, 1, 2].map(function (n) {
          var p = todayParts();
          var h = T.toHijri(p.y, p.m, p.d, n);
          return { v: n, n: (n > 0 ? '+' : '') + n + ' day' + (Math.abs(n) === 1 ? '' : 's'), s: h.d + ' ' + h.monthName + ' ' + h.y };
        }), S.hijriOffset, function (v) { S.hijriOffset = v; save(); rebuild(); renderMore(); },
        'Alif uses the tabular Islamic calendar. Shift it to match your local moon sighting.');
      }, { sub: 'Offset ' + (S.hijriOffset > 0 ? '+' : '') + S.hijriOffset + ' day(s)' })
    ]);

    group('Appearance', [
      row('Theme', S.theme === 'auto' ? 'Match device' : S.theme === 'dark' ? 'Dark' : 'Light', function () {
        optionSheet('Theme', [
          { v: 'auto', n: 'Match device' }, { v: 'dark', n: 'Dark' }, { v: 'light', n: 'Light' }
        ], S.theme, function (v) { S.theme = v; save(); applyTheme(); renderMore(); });
      })
    ]);

    group('Tools', [
      row('Islamic calendar', hijriToday(), function () {
        if (window.AlifExtras) window.AlifExtras.openCalendar();
      }, { sub: 'Hijri month view and upcoming dates' }),
      row('99 Names of Allah', 'Al-Asma’ ul-Husna', function () {
        if (window.AlifExtras) window.AlifExtras.openNames();
      }, { sub: 'Meanings, verses, and count them on the tasbih' }),
      row('Tasbih counter', String(S.tasbih.total) + ' total', openTasbih, { sub: 'Digital dhikr beads with haptics' }),
      row('Monthly timetable', null, openMonthTable, { sub: 'Every prayer time for the month' }),
      row('Prayer log calendar', null, openMonthLog, { sub: 'Edit any past day' })
    ]);

    group('Data', [
      row('Copy backup', null, function () {
        var text = JSON.stringify(S);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () { toast('Backup copied to the clipboard'); },
            function () { showBackup(text); });
        } else showBackup(text);
      }, { sub: 'Your settings and prayer log as JSON' }),
      row('Restore backup', null, openRestore, { sub: 'Paste a backup to replace your data' }),
      row('Reset everything', null, function () {
        var body2 = el('div');
        body2.appendChild(el('div', 'note', 'This deletes your prayer log, bookmarks and settings on this device. It cannot be undone.'));
        var yes = el('button', 'btn danger', 'Delete all Alif data');
        yes.addEventListener('click', function () {
          try { localStorage.removeItem(KEY); } catch (e) {}
          location.reload();
        });
        body2.appendChild(yes);
        sheet('Reset', body2);
      }, { sub: 'Delete the prayer log and settings' })
    ]);

    body.appendChild(el('div', 'section-title', 'About'));
    var about = el('div', 'list');
    about.appendChild(row('Alif', '1.0', null, { sub: 'Quran & Prayer Times' }));
    about.appendChild(row('Prayer times', 'Astronomical', null, { sub: 'USNO solar position, iterative solver' }));
    about.appendChild(row('Quran text', 'Uthmani', null, { sub: 'Tanzil Uthmani script · Khattab and Siregar translations' }));
    about.appendChild(row('Storage', 'On this device', null, { sub: 'Nothing leaves your browser' }));
    body.appendChild(about);
    body.appendChild(el('div', 'note', 'Prayer times are calculated, not measured. Where your local mosque differs, set the method and manual adjustments to match it.'));
    body.appendChild(el('div', null, '<div style="text-align:center;padding:22px 18px 30px;font-family:Amiri,serif;font-size:30px;color:var(--line)">ا</div>'));
  }

  function showBackup(text) {
    var body = el('div');
    var ta = el('textarea');
    ta.value = text;
    ta.readOnly = true;
    ta.style.cssText = 'width:calc(100% - 36px);margin:8px 18px;height:180px;border-radius:12px;border:1px solid var(--line);background:var(--surface-2);padding:10px;font-size:11px;font-family:ui-monospace,monospace';
    body.appendChild(ta);
    body.appendChild(el('div', 'note', 'Select all and copy this text to keep a backup.'));
    sheet('Backup', body);
    setTimeout(function () { ta.select(); }, 100);
  }
  function openRestore() {
    var body = el('div');
    var ta = el('textarea');
    ta.placeholder = 'Paste your Alif backup JSON here';
    ta.style.cssText = 'width:calc(100% - 36px);margin:8px 18px;height:160px;border-radius:12px;border:1px solid var(--line);background:var(--surface-2);padding:10px;font-size:11px;font-family:ui-monospace,monospace';
    body.appendChild(ta);
    var b = el('button', 'btn', 'Restore');
    b.addEventListener('click', function () {
      try {
        var o = JSON.parse(ta.value);
        if (!o || typeof o !== 'object') throw 0;
        localStorage.setItem(KEY, JSON.stringify(o));
        location.reload();
      } catch (e) { toast('That is not a valid Alif backup'); }
    });
    body.appendChild(b);
    sheet('Restore backup', body);
  }

  function describeMethod(k) {
    var m = T.METHODS[k];
    var f = 'Fajr ' + m.fajr + '°';
    var i = m.ishaMin != null ? 'Isha ' + m.ishaMin + ' min after Maghrib' : 'Isha ' + m.isha + '°';
    return f + ' · ' + i;
  }
  function hlName(v) {
    return { NightMiddle: 'Middle of night', OneSeventh: 'One-seventh', AngleBased: 'Angle based', None: 'None' }[v] || v;
  }
  function soundName(v) { return { chime: 'Chime', bell: 'Bell', vibrate: 'Vibrate only', silent: 'Silent' }[v]; }
  function translationName(v) { return { en: 'English · Khattab', nl: 'Nederlands · Siregar', none: 'Arabic only' }[v]; }
  function hijriToday() {
    var p = todayParts();
    var h = T.toHijri(p.y, p.m, p.d, S.hijriOffset);
    return h.d + ' ' + h.monthName;
  }
  function adjustSummary() {
    var n = 0;
    Object.keys(S.adjust).forEach(function (k) { if (S.adjust[k]) n++; });
    return n ? n + ' adjusted' : 'None';
  }
  function openAdjustSheet() {
    var body = el('div');
    PRAYERS.forEach(function (pr) {
      var r = el('div', 'li');
      var t = el('div', 't');
      t.appendChild(el('b', null, pr.n));
      t.appendChild(el('span', null, fmtTime(day.at[pr.k])));
      r.appendChild(t);
      var st = el('div', 'stepper');
      var minus = el('button', null, '−');
      var val = el('b', null, (S.adjust[pr.k] > 0 ? '+' : '') + S.adjust[pr.k] + ' min');
      var plus = el('button', null, '+');
      function upd(d) {
        S.adjust[pr.k] = Math.max(-60, Math.min(60, (S.adjust[pr.k] || 0) + d));
        val.textContent = (S.adjust[pr.k] > 0 ? '+' : '') + S.adjust[pr.k] + ' min';
        save(); rebuild();
        t.querySelector('span').textContent = fmtTime(day.at[pr.k]);
      }
      minus.addEventListener('click', function () { upd(-1); });
      plus.addEventListener('click', function () { upd(1); });
      st.appendChild(minus); st.appendChild(val); st.appendChild(plus);
      r.appendChild(st);
      body.appendChild(r);
    });
    var reset = el('button', 'btn ghost', 'Reset all to 0');
    reset.addEventListener('click', function () {
      Object.keys(S.adjust).forEach(function (k) { S.adjust[k] = 0; });
      save(); rebuild(); closeSheet(); renderMore();
    });
    body.appendChild(reset);
    body.appendChild(el('div', 'note', 'Use this to match a printed mosque timetable exactly.'));
    sheet('Manual adjustments', body);
  }
  function openPerPrayerSheet() {
    var body = el('div');
    PRAYERS.forEach(function (pr) {
      var r = el('button', 'opt');
      var t = el('div', 't');
      t.appendChild(el('b', null, pr.n));
      t.appendChild(el('span', null, fmtTime(day.at[pr.k])));
      r.appendChild(t);
      var sw = el('div', 'sw');
      sw.setAttribute('data-on', S.notif.per[pr.k] ? '1' : '0');
      r.appendChild(sw);
      r.addEventListener('click', function () {
        S.notif.per[pr.k] = !S.notif.per[pr.k];
        sw.setAttribute('data-on', S.notif.per[pr.k] ? '1' : '0');
        save(); scheduleNotifications(); renderTimesCard(); renderMore();
      });
      body.appendChild(r);
    });
    sheet('Athan per prayer', body);
  }
  function openSizeSheet() {
    var q = S.quran;
    var body = el('div');
    function stepRow(label, key, min, max) {
      var r = el('div', 'li');
      var t = el('div', 't');
      t.appendChild(el('b', null, label));
      r.appendChild(t);
      var st = el('div', 'stepper');
      var minus = el('button', null, '−');
      var val = el('b', null, q[key] + ' px');
      var plus = el('button', null, '+');
      function upd(d) {
        q[key] = Math.max(min, Math.min(max, q[key] + d));
        val.textContent = q[key] + ' px';
        save();
        document.documentElement.style.setProperty(key === 'arSize' ? '--ar-size' : '--tx-size', q[key] + 'px');
      }
      minus.addEventListener('click', function () { upd(-2); });
      plus.addEventListener('click', function () { upd(2); });
      st.appendChild(minus); st.appendChild(val); st.appendChild(plus);
      r.appendChild(st);
      body.appendChild(r);
    }
    stepRow('Arabic', 'arSize', 18, 46);
    stepRow('Translation', 'txSize', 12, 22);
    var prev = el('div');
    prev.style.cssText = 'padding:14px 18px';
    prev.innerHTML = '<div class="ar-text">إِنَّ مَعَ ٱلْعُسْرِ يُسْرًا</div><div class="tx-text">Surely with hardship comes ease.</div>';
    body.appendChild(prev);
    sheet('Reading size', body);
  }

  /* -------------------------------------------------------------- tasbih */
  function openTasbih(custom) {
    var t = S.tasbih;
    var body = el('div', 'tasbih');
    var d = custom || DHIKR[t.idx % DHIKR.length];
    var transient = custom ? { count: 0 } : null;
    var ar = el('div', 'dhikr-ar', d.ar);
    var tr = el('div', 'dhikr-tr', d.tr + ' · ' + d.en);
    body.appendChild(ar); body.appendChild(tr);
    var btn = el('button', 'beadbtn');
    var n = el('div', 'n num', String(transient ? transient.count : t.count));
    var of = el('div', 'of num', 'of ' + d.target);
    var inner = el('div');
    inner.style.textAlign = 'center';
    inner.appendChild(n); inner.appendChild(of);
    btn.appendChild(inner);
    btn.addEventListener('click', function () {
      var c = transient ? ++transient.count : ++t.count;
      t.total++;
      n.textContent = String(c);
      buzz(c % d.target === 0 ? [40, 60, 40] : 12);
      if (c % d.target === 0) { playAthan(); toast(d.tr + ' × ' + d.target + ' complete'); }
      save();
    });
    body.appendChild(btn);
    var ctr = el('div');
    ctr.style.cssText = 'display:flex;gap:10px;padding:14px 0 4px;width:100%';
    var reset = el('button', 'btn ghost', 'Reset');
    reset.style.margin = '0';
    reset.addEventListener('click', function () {
      if (transient) transient.count = 0; else t.count = 0;
      n.textContent = '0'; save();
    });
    ctr.appendChild(reset);
    if (!transient) {
      var next = el('button', 'btn ghost', 'Next dhikr');
      next.style.margin = '0';
      next.addEventListener('click', function () {
        t.idx = (t.idx + 1) % DHIKR.length; t.count = 0; save(); closeSheet(); openTasbih();
      });
      ctr.appendChild(next);
    }
    body.appendChild(ctr);
    body.appendChild(el('div', 'note', 'Total counted in Alif: ' + t.total + '. The count is kept on this device.'));
    sheet(custom ? custom.tr : 'Tasbih', body);
  }

  /* --------------------------------------------------------------- shell */
  function showScreen(name) {
    $$('.screen').forEach(function (s) { s.classList.toggle('is-active', s.dataset.screen === name); });
    if (name !== 'quran') { var r = $('#reader'); if (r) r.classList.remove('is-open'); }
    var pg = $('#page'); if (pg) pg.classList.remove('is-open');
    $$('.tab').forEach(function (t) {
      var on = t.dataset.tab === name;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    if (name === 'more') renderMore();
    if (name === 'tracker') renderTracker();
    if (name === 'quran' && window.AlifQuran) window.AlifQuran.ensure();
    if (name === 'qibla') renderQibla();
  }
  function sheet(title, node) {
    $('#sheet-title').textContent = title;
    var b = $('#sheet-body');
    b.innerHTML = '';
    b.appendChild(node);
    b.scrollTop = 0;
    $('#sheet').classList.add('is-open');
    $('#scrim').classList.add('is-open');
  }
  function closeSheet() {
    $('#sheet').classList.remove('is-open');
    $('#scrim').classList.remove('is-open');
  }
  var toastTimer = null;
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('is-on'); }, 2200);
  }
  function applyTheme() {
    if (S.theme === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', S.theme);
  }

  /* ---------------------------------------------------------------- boot */
  function boot() {
    load();
    applyTheme();
    document.documentElement.style.setProperty('--ar-size', S.quran.arSize + 'px');
    document.documentElement.style.setProperty('--tx-size', S.quran.txSize + 'px');

    $$('.tab').forEach(function (t) {
      t.addEventListener('click', function () { showScreen(t.dataset.tab); });
    });
    $('#btn-location').addEventListener('click', openLocationSheet);
    $('#btn-notif').addEventListener('click', function () { showScreen('more'); });
    $('#sheet-close').addEventListener('click', closeSheet);
    $('#scrim').addEventListener('click', closeSheet);
    $('#btn-compass-start').addEventListener('click', startCompass);
    $('#btn-calibrate').addEventListener('click', function () {
      var b = el('div');
      b.appendChild(el('div', 'note', 'Hold the device flat, screen up. Move it in a figure-of-eight a few times to recalibrate the magnetometer. Stay away from laptops, speakers and metal desks — they pull the needle.'));
      b.appendChild(el('div', 'note', 'Alif points along the great circle to the Kaaba (' + T.KAABA.lat.toFixed(4) + '°N, ' + T.KAABA.lng.toFixed(4) + '°E), the same convention used by mosque compasses. The dial shows true north; phone compasses report magnetic north corrected by the device, so small differences are normal.'));
      sheet('Compass calibration', b);
    });
    $('#btn-tracker-cal').addEventListener('click', openMonthLog);

    rebuild();
    renderMore();
    tickTimer = setInterval(tick, 1000);

    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) { rebuild(); maybeRefreshLocation(); }
    });
    window.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); });
  }

  window.Alif = {
    el: el, $: $, $$: $$, sheet: sheet, closeSheet: closeSheet, toast: toast,
    showScreen: showScreen, state: S, save: save, buzz: buzz,
    PRAYERS: PRAYERS, TRACKED: TRACKED, GREG_MONTHS: GREG_MONTHS, DOW: DOW,
    todayParts: todayParts, fmtTime: fmtTime, dayModel: dayModel,
    day: function () { return day; },
    rebuild: rebuild, renderMore: renderMore, openTasbih: openTasbih,
    openLocationSheet: openLocationSheet, useGPS: useGPS,
    enableNotifications: enableNotifications
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
