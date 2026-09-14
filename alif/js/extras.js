/* Alif — Islamic calendar, the 99 Names of Allah, and the first-run setup.
   These share one push-over page container with the Quran reader. */
(function () {
  'use strict';
  var A = window.Alif, T = window.AlifTimes;
  var el = A.el, $ = A.$, $$ = A.$$;
  var S = A.state;
  var NAMES = window.NAMES99 || [];

  var DOW_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var GREG = A.GREG_MONTHS;

  /* ---------------------------------------------------------- page shell */
  function openPage(title, sub, node, action) {
    $('#page-title').textContent = title;
    $('#page-sub').textContent = sub || '';
    var body = $('#page-body');
    body.innerHTML = '';
    body.appendChild(node);
    body.scrollTop = 0;
    var act = $('#page-action');
    if (action) {
      act.hidden = false;
      act.innerHTML = action.icon;
      act.onclick = action.fn;
      act.setAttribute('aria-label', action.label || 'Action');
    } else { act.hidden = true; act.onclick = null; }
    $('#page').classList.add('is-open');
  }
  function closePage() { $('#page').classList.remove('is-open'); }

  /* ------------------------------------------------- 99 names of Allah -- */
  function namesPage(filter) {
    var wrap = el('div');
    var sb = el('div', 'searchbar');
    sb.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>';
    var input = el('input');
    input.type = 'search';
    input.placeholder = 'Search a name or meaning';
    input.value = filter || '';
    sb.appendChild(input);
    wrap.appendChild(sb);

    var list = el('div', 'list');
    wrap.appendChild(list);
    wrap.appendChild(el('div', 'note', 'Ninety-nine Names, in the order they are traditionally recited. Tap one for its meaning, the verses it appears in, and to count it on the tasbih.'));

    function paint(q) {
      list.innerHTML = '';
      var ql = (q || '').toLowerCase();
      var rows = NAMES.filter(function (n) {
        return !ql || n[2].toLowerCase().indexOf(ql) >= 0 || n[3].toLowerCase().indexOf(ql) >= 0 ||
          n[1].indexOf(q) >= 0 || String(n[0]) === ql;
      });
      if (!rows.length) {
        list.appendChild(el('div', 'empty', '<span class="mark">ا</span>No name matches “' + q + '”.'));
        return;
      }
      rows.forEach(function (n) {
        var b = el('button', 'name-row');
        b.appendChild(el('div', 'no num', String(n[0])));
        var info = el('div', 'info');
        info.appendChild(el('b', null, n[2]));
        info.appendChild(el('span', null, n[3]));
        b.appendChild(info);
        b.appendChild(el('div', 'ar', n[1]));
        b.addEventListener('click', function () { nameSheet(n); });
        list.appendChild(b);
      });
    }
    input.addEventListener('input', function () { paint(input.value.trim()); });
    paint(filter || '');
    return wrap;
  }

  function nameSheet(n) {
    var body = el('div');
    var hero = el('div', 'name-hero');
    hero.innerHTML = '<div class="ar">' + n[1] + '</div>' +
      '<div class="tl">' + n[2] + '</div><div class="mn">' + n[3] + '</div>';
    body.appendChild(hero);
    if (n[4]) {
      var d = el('div');
      d.style.cssText = 'padding:2px 18px 6px;font-size:13.5px;line-height:1.65;color:var(--text-2);max-width:62ch';
      d.textContent = n[4];
      body.appendChild(d);
    }
    var refs = parseRefs(n[5]);
    if (refs.length) {
      body.appendChild(el('div', 'section-title', 'Found in'));
      var list = el('div', 'list');
      refs.forEach(function (r) {
        var meta = window.SURAHS[r[0] - 1];
        if (!meta) return;
        var b = el('button', 'li');
        var t = el('div', 't');
        t.appendChild(el('b', null, meta[2] + ' ' + r[0] + ':' + r[1]));
        t.appendChild(el('span', null, meta[3]));
        b.appendChild(t);
        b.innerHTML += '<svg class="chev" viewBox="0 0 24 24"><path d="m10 6 6 6-6 6"/></svg>';
        b.addEventListener('click', function () {
          A.closeSheet(); closePage();
          A.showScreen('quran');
          if (window.AlifQuran) window.AlifQuran.open(r[0], r[1]);
        });
        list.appendChild(b);
      });
      body.appendChild(list);
    }
    var count = el('button', 'btn', 'Count this name on the tasbih');
    count.addEventListener('click', function () {
      A.closeSheet();
      A.openTasbih({ ar: n[1], tr: n[2], en: n[3], target: 33 });
    });
    body.appendChild(count);
    A.sheet(n[2], body);
  }

  function parseRefs(found) {
    var out = [];
    (found || '').replace(/(\d+)\s*:\s*(\d+)/g, function (_, s, a) {
      out.push([+s, +a]); return '';
    });
    return out.slice(0, 8);
  }

  /* ----------------------------------------------------- islamic calendar */
  // Gregorian date for a Hijri date, honouring the user's sighting offset.
  function gregOf(hy, hm, hd) {
    var g = T.fromHijri(hy, hm, hd);
    var t = new Date(Date.UTC(g.y, g.m - 1, g.d));
    t.setUTCDate(t.getUTCDate() - (S.hijriOffset || 0));
    return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), ms: t.getTime() };
  }
  function hijriMonthLength(hy, hm) {
    var a = gregOf(hy, hm, 1).ms;
    var nm = hm === 12 ? { y: hy + 1, m: 1 } : { y: hy, m: hm + 1 };
    var b = gregOf(nm.y, nm.m, 1).ms;
    return Math.round((b - a) / 86400000);
  }
  function todayHijri() {
    var p = A.todayParts();
    return T.toHijri(p.y, p.m, p.d, S.hijriOffset);
  }

  function calendarPage(state) {
    var p = A.todayParts();
    var th = todayHijri();
    var wrap = el('div');

    var nav = el('div');
    nav.style.cssText = 'display:flex;align-items:center;gap:10px;padding:12px 14px 6px';
    var prev = el('button', 'iconbtn', '<svg viewBox="0 0 24 24"><path d="m14 6-6 6 6 6"/></svg>');
    var next = el('button', 'iconbtn', '<svg viewBox="0 0 24 24"><path d="m10 6 6 6-6 6"/></svg>');
    var ttl = el('div');
    ttl.style.cssText = 'flex:1;text-align:center';
    var g1 = gregOf(state.hy, state.hm, 1);
    var len = hijriMonthLength(state.hy, state.hm);
    var gEnd = gregOf(state.hy, state.hm, len);
    ttl.innerHTML = '<b style="font-size:15px">' + T.HIJRI_MONTHS[state.hm - 1] + ' ' + state.hy + '</b>' +
      '<div style="font-size:11px;color:var(--muted)">' + GREG[g1.m - 1].slice(0, 3) + ' ' + g1.d +
      ' – ' + GREG[gEnd.m - 1].slice(0, 3) + ' ' + gEnd.d + ' ' + gEnd.y + '</div>';
    prev.addEventListener('click', function () {
      state.hm--; if (state.hm < 1) { state.hm = 12; state.hy--; }
      openCalendar(state);
    });
    next.addEventListener('click', function () {
      state.hm++; if (state.hm > 12) { state.hm = 1; state.hy++; }
      openCalendar(state);
    });
    nav.appendChild(prev); nav.appendChild(ttl); nav.appendChild(next);
    wrap.appendChild(nav);

    var arName = el('div');
    arName.style.cssText = 'text-align:center;font-family:Amiri,serif;font-size:22px;color:var(--brass);padding-bottom:4px';
    arName.textContent = T.HIJRI_MONTHS_AR[state.hm - 1];
    wrap.appendChild(arName);

    var cal = el('div', 'hcal');
    ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].forEach(function (d) { cal.appendChild(el('div', 'dow', d)); });
    var firstDow = new Date(g1.ms).getUTCDay();
    for (var b = 0; b < firstDow; b++) cal.appendChild(el('div', 'cell blank'));
    var eventsThisMonth = {};
    T.HIJRI_EVENTS.forEach(function (ev) { if (ev.m === state.hm) eventsThisMonth[ev.d] = ev.name; });
    for (var d = 1; d <= len; d++) {
      (function (d) {
        var g = gregOf(state.hy, state.hm, d);
        var dow = new Date(g.ms).getUTCDay();
        var cell = el('div', 'cell' + (dow === 5 ? ' friday' : '') +
          (eventsThisMonth[d] ? ' event' : '') +
          (state.hy === th.y && state.hm === th.m && d === th.d ? ' today' : ''));
        cell.appendChild(el('b', null, String(d)));
        cell.appendChild(el('span', null, String(g.d)));
        cell.title = d + ' ' + T.HIJRI_MONTHS[state.hm - 1] + ' · ' + g.d + ' ' + GREG[g.m - 1] + ' ' + g.y +
          (eventsThisMonth[d] ? ' · ' + eventsThisMonth[d] : '');
        cal.appendChild(cell);
      })(d);
    }
    wrap.appendChild(cal);

    var legend = el('div', 'heat-legend');
    legend.innerHTML = '<i style="background:var(--jade-wash)"></i><span>Friday</span>' +
      '<i style="background:var(--clay)"></i><span>Event</span>' +
      '<i style="background:var(--brass-wash);box-shadow:0 0 0 1px var(--brass)"></i><span>Today</span>';
    wrap.appendChild(legend);

    wrap.appendChild(el('div', 'section-title', 'Upcoming dates'));
    var list = el('div', 'list');
    var todayMs = Date.UTC(p.y, p.m - 1, p.d);
    var ups = [];
    [th.y, th.y + 1].forEach(function (hy) {
      T.HIJRI_EVENTS.forEach(function (ev) {
        var g = gregOf(hy, ev.m, ev.d);
        var days = Math.round((g.ms - todayMs) / 86400000);
        if (days >= 0 && days < 400) ups.push({ ev: ev, g: g, days: days, hy: hy });
      });
    });
    ups.sort(function (a, b) { return a.days - b.days; });
    ups.slice(0, 12).forEach(function (u) {
      var r = el('div', 'evrow' + (u.days === 0 ? ' is-today' : ''));
      var t = el('div', 't');
      t.appendChild(el('b', null, u.ev.name));
      t.appendChild(el('span', null, u.ev.d + ' ' + T.HIJRI_MONTHS[u.ev.m - 1] + ' ' + u.hy + ' · ' +
        DOW_SHORT[new Date(u.g.ms).getUTCDay()] + ' ' + u.g.d + ' ' + GREG[u.g.m - 1] + ' ' + u.g.y));
      r.appendChild(t);
      r.appendChild(el('div', 'cd num', u.days === 0 ? 'Today' : u.days === 1 ? 'Tomorrow' : u.days + ' days'));
      list.appendChild(r);
    });
    wrap.appendChild(list);
    wrap.appendChild(el('div', 'note', 'Alif uses the tabular Islamic calendar, which can differ by a day from a local moon sighting. Settings → Calendar shifts every date at once.'));
    return wrap;
  }

  function openCalendar(state) {
    var th = todayHijri();
    state = state || { hy: th.y, hm: th.m };
    openPage('Islamic calendar', th.d + ' ' + th.monthName + ' ' + th.y + ' AH', calendarPage(state), {
      icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 8.5v4l2.5 1.5"/></svg>',
      label: 'Jump to today',
      fn: function () { openCalendar({ hy: th.y, hm: th.m }); }
    });
  }

  function openNames() {
    openPage('99 Names of Allah', 'Al-Asma’ ul-Husna · أسماء الله الحسنى', namesPage(''));
  }

  /* ------------------------------------------------------------ onboarding */
  // Communities differ; these are the conventions most widely followed per
  // region, offered as a starting point the user can change.
  var METHOD_BY_COUNTRY = {
    'Saudi Arabia': 'Makkah', 'Yemen': 'Makkah', 'Bahrain': 'Makkah',
    'United Arab Emirates': 'Dubai', 'Qatar': 'Qatar', 'Kuwait': 'Kuwait', 'Oman': 'Makkah',
    'Egypt': 'Egypt', 'Sudan': 'Egypt', 'Libya': 'Egypt', 'Syria': 'Egypt', 'Jordan': 'Egypt',
    'Iraq': 'Egypt', 'Lebanon': 'Egypt', 'Palestine': 'Egypt',
    'Pakistan': 'Karachi', 'India': 'Karachi', 'Bangladesh': 'Karachi', 'Afghanistan': 'Karachi',
    'Turkey': 'Turkey', 'Iran': 'Tehran',
    'Indonesia': 'Singapore', 'Malaysia': 'Singapore', 'Singapore': 'Singapore', 'Brunei': 'Singapore',
    'United States': 'ISNA', 'Canada': 'ISNA', 'Mexico': 'ISNA',
    'France': 'France', 'Russia': 'Russia'
  };
  function suggestMethod(country) {
    return METHOD_BY_COUNTRY[country] || 'MWL';
  }

  function runOnboarding() {
    var host = el('div', 'onboard');
    host.id = 'onboard';
    var step = 0;
    var picked = { method: suggestMethod(S.loc.country), asr: S.asr };

    function paint() {
      host.innerHTML = '';
      host.appendChild(el('div', 'mark', 'ا'));
      var steps = el('div', 'steps');
      for (var i = 0; i < 3; i++) steps.appendChild(el('i', i <= step ? 'on' : ''));

      var body = el('div', 'ob-body');
      var foot = el('div', 'ob-foot');

      if (step === 0) {
        host.appendChild(el('h2', null, 'Prayer times, exactly where you are'));
        host.appendChild(el('p', null, 'Alif calculates the times on your device. Nothing is uploaded, and it keeps working without a connection.'));
        host.appendChild(steps);
        var gps = el('button', 'ob-choice');
        gps.innerHTML = '<div class="t"><b>Use my location</b><span>One GPS reading, matched to the nearest city</span></div>' +
          '<svg class="chev" viewBox="0 0 24 24" style="width:16px;height:16px;stroke:var(--muted);fill:none;stroke-width:1.6"><path d="m10 6 6 6-6 6"/></svg>';
        gps.addEventListener('click', function () {
          A.useGPS(function () { picked.method = suggestMethod(S.loc.country); step = 1; paint(); });
        });
        body.appendChild(gps);
        var pick = el('button', 'ob-choice');
        pick.innerHTML = '<div class="t"><b>Choose a city</b><span>Search 2,000+ cities worldwide</span></div>' +
          '<svg class="chev" viewBox="0 0 24 24" style="width:16px;height:16px;stroke:var(--muted);fill:none;stroke-width:1.6"><path d="m10 6 6 6-6 6"/></svg>';
        pick.addEventListener('click', function () {
          A.openLocationSheet(function () { picked.method = suggestMethod(S.loc.country); paint(); });
        });
        body.appendChild(pick);
        var cur = el('div', 'note');
        cur.textContent = 'Currently set to ' + S.loc.name + (S.loc.country ? ', ' + S.loc.country : '') + '.';
        cur.style.margin = '10px 0 0';
        body.appendChild(cur);
        var nextBtn = el('button', 'btn', 'Continue');
        nextBtn.addEventListener('click', function () { step = 1; paint(); });
        foot.appendChild(nextBtn);

      } else if (step === 1) {
        host.appendChild(el('h2', null, 'Which timetable do you follow?'));
        host.appendChild(el('p', null, 'Mosques differ in the angles they use. We suggested the convention most common in ' +
          (S.loc.country || 'your region') + ' — change it any time in Settings.'));
        host.appendChild(steps);
        ['MWL', 'ISNA', 'Egypt', 'Makkah', 'Karachi', 'Turkey', 'Singapore', 'France'].concat(
          ['Dubai', 'Qatar', 'Kuwait', 'Tehran', 'Jafari', 'Russia', 'Moonsight'].filter(function (k) { return k === picked.method; })
        ).forEach(function (k) {
          var m = T.METHODS[k];
          var b = el('button', 'ob-choice' + (picked.method === k ? ' is-on' : ''));
          b.innerHTML = '<div class="t"><b>' + m.name + '</b><span>Fajr ' + m.fajr + '° · ' +
            (m.ishaMin != null ? 'Isha ' + m.ishaMin + ' min after Maghrib' : 'Isha ' + m.isha + '°') + '</span></div>';
          b.addEventListener('click', function () { picked.method = k; paint(); });
          body.appendChild(b);
        });
        var asr = el('button', 'ob-choice' + (picked.asr === 'Hanafi' ? ' is-on' : ''));
        asr.innerHTML = '<div class="t"><b>Hanafi Asr</b><span>Later Asr, shadow ×2. Leave off for Shafi‘i, Maliki or Hanbali.</span></div>';
        asr.addEventListener('click', function () { picked.asr = picked.asr === 'Hanafi' ? 'Standard' : 'Hanafi'; paint(); });
        body.appendChild(el('div', 'section-title', 'Asr'));
        body.appendChild(asr);
        var back = el('button', 'btn ghost', 'Back');
        back.addEventListener('click', function () { step = 0; paint(); });
        var go = el('button', 'btn', 'Continue');
        go.addEventListener('click', function () {
          S.method = picked.method; S.asr = picked.asr; A.save(); A.rebuild();
          step = 2; paint();
        });
        foot.appendChild(back); foot.appendChild(go);

      } else {
        host.appendChild(el('h2', null, 'Be called to prayer'));
        host.appendChild(el('p', null, 'Alif can raise a banner and play the athan tone at each prayer, for as long as it is open in a tab. You can pick which prayers, and how early, later on.'));
        host.appendChild(steps);
        var times = el('div', 'list');
        times.style.margin = '0';
        A.PRAYERS.forEach(function (pr) {
          var r = el('div', 'li');
          var t = el('div', 't');
          t.appendChild(el('b', null, pr.n));
          r.appendChild(t);
          r.appendChild(el('div', 'v num', A.fmtTime(A.day().at[pr.k])));
          times.appendChild(r);
        });
        body.appendChild(el('div', 'section-title', 'Today in ' + S.loc.name));
        body.appendChild(times);
        var enable = el('button', 'btn', 'Turn on athan notifications');
        enable.addEventListener('click', function () { A.enableNotifications(); finish(); });
        var skip = el('button', 'btn ghost', 'Not now');
        skip.addEventListener('click', finish);
        foot.appendChild(skip); foot.appendChild(enable);
      }

      host.appendChild(body);
      host.appendChild(foot);
    }

    function finish() {
      S.seen = true; A.save();
      host.style.transition = 'opacity .3s';
      host.style.opacity = '0';
      setTimeout(function () { host.remove(); }, 320);
    }

    paint();
    $('#app').appendChild(host);
  }

  /* ---------------------------------------------------------------- wire */
  $('#page-back').addEventListener('click', closePage);
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && $('#page').classList.contains('is-open')) closePage();
  });

  window.AlifExtras = {
    openNames: openNames,
    openCalendar: openCalendar,
    closePage: closePage,
    runOnboarding: runOnboarding,
    suggestMethod: suggestMethod,
    todayHijri: todayHijri,
    gregOf: gregOf
  };

  // The app's own boot runs on DOMContentLoaded, so wait for it before
  // deciding whether this is a first run.
  function maybeOnboard() { if (!S.seen) runOnboarding(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(maybeOnboard, 400); });
  } else setTimeout(maybeOnboard, 400);
})();
