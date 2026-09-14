/* Alif — Quran reader.  The Arabic text and each translation are separate
   bundles, fetched only the first time the reader needs them. */
(function () {
  'use strict';
  var A = window.Alif, T = window.AlifTimes;
  var el = A.el, $ = A.$, $$ = A.$$;
  var S = A.state;

  var SURAHS = window.SURAHS || [];
  var JUZ = window.JUZ || [];
  var SAJDA = {};
  (window.SAJDAS || []).forEach(function (s) { SAJDA[s[0] + ':' + s[1]] = true; });

  // Transliterations vary (Al-Ikhlaas / Al-Ikhlas / Ikhlaas), so names are
  // matched on a reduced form: letters only, doubles collapsed, h dropped.
  function simplify(s) {
    return String(s).toLowerCase().replace(/[^a-z]/g, '').replace(/h/g, '').replace(/(.)\1+/g, '$1');
  }

  var BUNDLES = {
    ar: { src: 'data/quran-ar.js', global: 'QURAN_AR' },
    en: { src: 'data/quran-en.js', global: 'QURAN_EN' },
    nl: { src: 'data/quran-nl.js', global: 'QURAN_NL' },
    tr: { src: 'data/quran-tr.js', global: 'QURAN_TR' }
  };
  var loading = {};
  function loadBundle(key) {
    var b = BUNDLES[key];
    if (!b) return Promise.resolve(null);
    if (window[b.global]) return Promise.resolve(window[b.global]);
    if (loading[key]) return loading[key];
    loading[key] = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = b.src;
      s.async = true;
      s.onload = function () { resolve(window[b.global]); };
      s.onerror = function () { loading[key] = null; reject(new Error('bundle')); };
      document.head.appendChild(s);
    });
    return loading[key];
  }
  function needed() {
    var list = ['ar'];
    if (S.quran.translation === 'en' || S.quran.translation === 'nl') list.push(S.quran.translation);
    if (S.quran.translit) list.push('tr');
    return list;
  }
  function ensureText() {
    return Promise.all(needed().map(loadBundle));
  }

  var mode = 'surah';
  var current = null;      // {s: surahIndex1based, a: ayah}
  var searchQuery = '';

  /* ------------------------------------------------------------- indexes */
  function surahRow(meta) {
    var b = el('button', 'surah');
    var w = el('div', 'idxw');
    w.innerHTML = '<span class="idx">' + meta[0] + '</span>';
    b.appendChild(w);
    var info = el('div', 'info');
    info.appendChild(el('b', null, meta[2]));
    info.appendChild(el('span', null, meta[3] + ' · ' + meta[5] + ' ayahs · ' + (meta[4] ? 'Medinan' : 'Meccan')));
    b.appendChild(info);
    b.appendChild(el('div', 'arname', meta[1]));
    b.addEventListener('click', function () { open(meta[0], 1); });
    return b;
  }

  function renderIndex() {
    var list = $('#quran-list');
    list.innerHTML = '';
    var cont = $('#quran-continue');
    cont.innerHTML = '';

    if (mode === 'surah' && !searchQuery && S.quran.lastRead) {
      var lr = S.quran.lastRead;
      var meta = SURAHS[lr.s - 1];
      var card = el('button', 'ayah-card');
      card.style.cssText = 'display:block;width:calc(100% - 28px);text-align:left';
      card.appendChild(el('div', 'eyebrow', 'Continue reading'));
      card.innerHTML += '<div style="display:flex;align-items:center;gap:12px;margin-top:8px">' +
        '<div><b style="font-size:16px">' + meta[2] + '</b>' +
        '<div style="font-size:12px;color:var(--muted)">Ayah ' + lr.a + ' of ' + meta[5] + '</div></div>' +
        '<div style="flex:1"></div><div class="arname" style="font-family:Amiri,serif;font-size:22px">' + meta[1] + '</div></div>';
      card.addEventListener('click', function () { open(lr.s, lr.a); });
      cont.appendChild(card);
    }

    if (mode === 'surah') {
      var q = searchQuery.toLowerCase();
      var qs = simplify(searchQuery);
      var rows = SURAHS.filter(function (m) {
        if (!q) return true;
        return String(m[0]) === q || m[1].indexOf(searchQuery) >= 0 ||
               simplify(m[2]).indexOf(qs) >= 0 || simplify(m[3]).indexOf(qs) >= 0;
      });
      if (!rows.length) {
        list.appendChild(el('div', 'empty', '<span class="mark">ا</span>No surah matches “' + searchQuery + '”.'));
        if (searchQuery.length >= 3) list.appendChild(textSearchButton());
      } else {
        rows.forEach(function (m) { list.appendChild(surahRow(m)); });
        if (searchQuery.length >= 3) list.appendChild(textSearchButton());
      }
    } else if (mode === 'juz') {
      JUZ.forEach(function (start, i) {
        var meta = SURAHS[start[0] - 1];
        var end = i < 29 ? JUZ[i + 1] : [114, 6];
        var b = el('button', 'surah');
        var w = el('div', 'idxw');
        w.innerHTML = '<span class="idx">' + (i + 1) + '</span>';
        b.appendChild(w);
        var info = el('div', 'info');
        info.appendChild(el('b', null, 'Juz ' + (i + 1)));
        info.appendChild(el('span', null, meta[2] + ' ' + start[0] + ':' + start[1] + ' → ' + SURAHS[end[0] - 1][2] + ' ' + end[0] + ':' + (end[1] > 1 ? end[1] - 1 : end[1])));
        b.appendChild(info);
        b.appendChild(el('div', 'arname', meta[1]));
        b.addEventListener('click', function () { open(start[0], start[1]); });
        list.appendChild(b);
      });
    } else {
      var bm = S.quran.bookmarks;
      if (!bm.length) {
        list.appendChild(el('div', 'empty', '<span class="mark">ا</span>No saved ayahs yet.<br>Tap the bookmark on any ayah while reading and it appears here.'));
      }
      bm.slice().reverse().forEach(function (p) {
        var meta = SURAHS[p[0] - 1];
        var b = el('button', 'surah');
        var w = el('div', 'idxw');
        w.innerHTML = '<span class="idx">' + p[0] + ':' + p[1] + '</span>';
        w.style.width = '46px';
        b.appendChild(w);
        var info = el('div', 'info');
        info.appendChild(el('b', null, meta[2] + ' ' + p[0] + ':' + p[1]));
        info.appendChild(el('span', null, meta[3]));
        b.appendChild(info);
        b.appendChild(el('div', 'arname', meta[1]));
        b.addEventListener('click', function () { open(p[0], p[1]); });
        list.appendChild(b);
      });
    }
  }

  function textSearchButton() {
    var b = el('button', 'btn ghost');
    b.textContent = 'Search “' + searchQuery + '” in the translation';
    b.addEventListener('click', function () { runTextSearch(searchQuery); });
    return b;
  }

  function runTextSearch(q) {
    var list = $('#quran-list');
    list.innerHTML = '';
    list.appendChild(el('div', 'empty', 'Searching…'));
    var key = S.quran.translation === 'nl' ? 'nl' : 'en';
    loadBundle(key).then(function (data) {
      var hits = [];
      var ql = q.toLowerCase();
      for (var s = 0; s < data.length && hits.length < 80; s++) {
        for (var a = 0; a < data[s].length; a++) {
          if (data[s][a].toLowerCase().indexOf(ql) >= 0) {
            hits.push([s + 1, a + 1, data[s][a]]);
            if (hits.length >= 80) break;
          }
        }
      }
      list.innerHTML = '';
      if (!hits.length) {
        list.appendChild(el('div', 'empty', '<span class="mark">ا</span>Nothing found for “' + q + '” in this translation.'));
        return;
      }
      list.appendChild(el('div', 'section-title', hits.length + (hits.length === 80 ? '+ ' : ' ') + 'ayahs'));
      hits.forEach(function (h) {
        var meta = SURAHS[h[0] - 1];
        var b = el('button', 'li');
        var t = el('div', 't');
        t.appendChild(el('b', null, meta[2] + ' ' + h[0] + ':' + h[1]));
        var snippet = h[2];
        if (snippet.length > 120) {
          var i = snippet.toLowerCase().indexOf(q.toLowerCase());
          snippet = (i > 40 ? '…' : '') + snippet.slice(Math.max(0, i - 40), i + 90) + '…';
        }
        t.appendChild(el('span', null, snippet));
        t.querySelector('span').style.whiteSpace = 'normal';
        b.appendChild(t);
        b.addEventListener('click', function () { open(h[0], h[1]); });
        list.appendChild(b);
      });
    }).catch(function () {
      list.innerHTML = '';
      list.appendChild(el('div', 'empty', 'The translation could not be loaded. Check your connection and try again.'));
    });
  }

  /* -------------------------------------------------------------- reader */
  function open(sIdx, ayah) {
    current = { s: sIdx, a: ayah || 1 };
    var reader = $('#reader');
    reader.classList.add('is-open');
    A.showScreen('quran');
    var meta = SURAHS[sIdx - 1];
    $('#reader-title').textContent = meta[2];
    $('#reader-sub').textContent = meta[3] + ' · ' + meta[5] + ' ayahs';
    var body = $('#reader-body');
    body.innerHTML = '<div class="empty">Loading the text…</div>';
    ensureText().then(function () {
      paint(sIdx, ayah);
    }).catch(function () {
      body.innerHTML = '';
      var e = el('div', 'empty', '<span class="mark">ا</span>The Quran text could not be loaded.<br>It downloads once and then stays available offline.');
      body.appendChild(e);
      var retry = el('button', 'btn ghost', 'Try again');
      retry.addEventListener('click', function () { open(sIdx, ayah); });
      body.appendChild(retry);
    });
  }

  function paint(sIdx, scrollTo) {
    var meta = SURAHS[sIdx - 1];
    var ar = window.QURAN_AR[sIdx - 1];
    var tx = S.quran.translation === 'none' ? null : window['QURAN_' + S.quran.translation.toUpperCase()];
    var tl = S.quran.translit ? window.QURAN_TR : null;
    var body = $('#reader-body');
    body.innerHTML = '';

    var plate = el('div', 'surah-plate');
    plate.innerHTML = '<div class="ar">سورة ' + meta[1] + '</div>' +
      '<div class="meta">' + meta[2] + ' · ' + meta[3] + ' · ' + (meta[4] ? 'Revealed in Madinah' : 'Revealed in Makkah') +
      ' · ' + meta[5] + ' ayahs</div>';
    body.appendChild(plate);
    if (sIdx !== 1 && sIdx !== 9) {
      body.appendChild(el('div', 'bism', 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ'));
    }

    var frag = document.createDocumentFragment();
    ar.forEach(function (text, i) {
      var n = i + 1;
      var node = el('div', 'ayah');
      node.id = 'a-' + sIdx + '-' + n;
      var head = el('div', 'ayah-head');
      head.appendChild(el('span', 'ayah-no', sIdx + ':' + n));
      head.appendChild(el('span', 'sp'));
      var saved = isSaved(sIdx, n);
      var bm = el('button', saved ? 'on' : '', '<svg viewBox="0 0 24 24"><path d="M7 4h10v16l-5-4-5 4z"/></svg>');
      bm.setAttribute('aria-label', 'Bookmark ayah ' + sIdx + ':' + n);
      bm.addEventListener('click', function () {
        toggleBookmark(sIdx, n);
        bm.className = isSaved(sIdx, n) ? 'on' : '';
        A.toast(isSaved(sIdx, n) ? 'Ayah saved' : 'Bookmark removed');
      });
      head.appendChild(bm);
      var cp = el('button', '', '<svg viewBox="0 0 24 24"><rect x="8.5" y="8.5" width="11" height="11" rx="2.5"/><path d="M15.5 5.5H6A1.5 1.5 0 0 0 4.5 7v9.5"/></svg>');
      cp.setAttribute('aria-label', 'Copy ayah');
      cp.addEventListener('click', function () {
        var out = text + '\n\n' + (tx ? tx[sIdx - 1][i] + '\n\n' : '') + '— ' + meta[2] + ' ' + sIdx + ':' + n;
        if (navigator.clipboard) navigator.clipboard.writeText(out).then(function () { A.toast('Ayah copied'); },
          function () { A.toast('Copy blocked by the browser'); });
        else A.toast('Copy is unavailable here');
      });
      head.appendChild(cp);
      node.appendChild(head);
      node.appendChild(el('div', 'ar-text', text));
      if (tl) node.appendChild(el('div', 'tr-text', tl[sIdx - 1][i]));
      if (tx) node.appendChild(el('div', 'tx-text', tx[sIdx - 1][i]));
      if (SAJDA[sIdx + ':' + n]) {
        node.appendChild(el('div', 'sajda-tag', '۩ Sajdah — prostration recommended'));
      }
      frag.appendChild(node);
    });
    body.appendChild(frag);

    var foot = el('div');
    foot.style.height = '20px';
    body.appendChild(foot);

    $('#reader-prev').disabled = sIdx <= 1;
    $('#reader-next').disabled = sIdx >= 114;
    $('#reader-prev').textContent = sIdx > 1 ? '← ' + SURAHS[sIdx - 2][2] : '←';
    $('#reader-next').textContent = sIdx < 114 ? SURAHS[sIdx][2] + ' →' : '→';

    body.scrollTop = 0;
    if (scrollTo && scrollTo > 1) {
      var target = document.getElementById('a-' + sIdx + '-' + scrollTo);
      if (target) {
        target.classList.add('is-hl');
        body.scrollTop = target.offsetTop - 70;
        setTimeout(function () { target.classList.remove('is-hl'); }, 2500);
      }
    }
    S.quran.lastRead = { s: sIdx, a: scrollTo || 1 };
    A.save();
    trackScroll(sIdx);
  }

  var scrollRaf = null;
  function trackScroll(sIdx) {
    var body = $('#reader-body');
    body.onscroll = function () {
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(function () {
        scrollRaf = null;
        var nodes = body.querySelectorAll('.ayah');
        for (var i = 0; i < nodes.length; i++) {
          if (nodes[i].offsetTop + nodes[i].offsetHeight > body.scrollTop + 90) {
            S.quran.lastRead = { s: sIdx, a: i + 1 };
            A.save();
            break;
          }
        }
      });
    };
  }

  function isSaved(s, a) {
    return S.quran.bookmarks.some(function (p) { return p[0] === s && p[1] === a; });
  }
  function toggleBookmark(s, a) {
    var i = -1;
    S.quran.bookmarks.forEach(function (p, k) { if (p[0] === s && p[1] === a) i = k; });
    if (i >= 0) S.quran.bookmarks.splice(i, 1);
    else S.quran.bookmarks.push([s, a]);
    A.save();
  }

  /* ---------------------------------------------------------------- wire */
  function setMode(m) {
    mode = m;
    $$('#quran-seg button').forEach(function (b) { b.classList.toggle('is-on', b.dataset.mode === m); });
    renderIndex();
  }

  function boot() {
    $('#quran-sub').textContent = '114 surahs · 6,236 ayahs · 30 juz';
    $$('#quran-seg button').forEach(function (b) {
      b.addEventListener('click', function () { setMode(b.dataset.mode); });
    });
    var si = $('#quran-search');
    si.addEventListener('input', function () {
      searchQuery = si.value.trim();
      if (mode !== 'surah') setMode('surah');
      else renderIndex();
    });
    $('#reader-back').addEventListener('click', function () {
      $('#reader').classList.remove('is-open');
      renderIndex();
    });
    $('#reader-prev').addEventListener('click', function () { if (current && current.s > 1) open(current.s - 1, 1); });
    $('#reader-next').addEventListener('click', function () { if (current && current.s < 114) open(current.s + 1, 1); });
    $('#reader-settings').addEventListener('click', openReadingSheet);
    $('#btn-quran-settings').addEventListener('click', openReadingSheet);
    renderIndex();
  }

  function openReadingSheet() {
    var q = S.quran;
    var body = el('div');
    function optRow(label, sub, on, fn) {
      var b = el('button', 'opt' + (on ? ' is-on' : ''));
      var t = el('div', 't');
      t.appendChild(el('b', null, label));
      if (sub) t.appendChild(el('span', null, sub));
      b.appendChild(t);
      b.innerHTML += '<svg class="tick" viewBox="0 0 24 24"><path d="m5 13 4 4 10-10"/></svg>';
      b.addEventListener('click', fn);
      return b;
    }
    body.appendChild(el('div', 'section-title', 'Translation'));
    [['en', 'English', 'Dr. Mustafa Khattab — The Clear Quran'],
     ['nl', 'Nederlands', 'Sofian S. Siregar'],
     ['none', 'Arabic only', 'Hide the translation']].forEach(function (o) {
      body.appendChild(optRow(o[1], o[2], q.translation === o[0], function () {
        q.translation = o[0]; A.save();
        ensureText().then(function () { if (current) paint(current.s, current.a); });
        A.closeSheet();
      }));
    });
    body.appendChild(el('div', 'section-title', 'Reading'));
    body.appendChild(optRow('Transliteration', 'Latin reading aid under each ayah', q.translit, function () {
      q.translit = !q.translit; A.save();
      ensureText().then(function () { if (current) paint(current.s, current.a); });
      A.closeSheet();
    }));
    function stepRow(label, key, min, max, step) {
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
        document.documentElement.style.setProperty(key === 'arSize' ? '--ar-size' : '--tx-size', q[key] + 'px');
        A.save();
      }
      minus.addEventListener('click', function () { upd(-step); });
      plus.addEventListener('click', function () { upd(step); });
      st.appendChild(minus); st.appendChild(val); st.appendChild(plus);
      r.appendChild(st);
      return r;
    }
    body.appendChild(stepRow('Arabic size', 'arSize', 18, 46, 2));
    body.appendChild(stepRow('Translation size', 'txSize', 12, 22, 1));
    body.appendChild(el('div', 'note', 'Arabic is set in the Uthmani script (Amiri Quran). Each translation downloads once, then stays cached by the browser.'));
    A.sheet('Reading settings', body);
  }

  window.AlifQuran = {
    open: open,
    setMode: setMode,
    ensure: function () { if (!$('#quran-list').children.length) renderIndex(); },
    refresh: function () {
      renderIndex();
      if (current && $('#reader').classList.contains('is-open')) {
        ensureText().then(function () { paint(current.s, current.a); });
      }
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
