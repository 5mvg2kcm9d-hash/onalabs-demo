/* Alif — astronomical prayer time engine, Hijri calendar and Qibla geometry.
   Solar position follows the standard low-precision USNO algorithm; the prayer
   time solver is the classic iterative scheme used by PrayTimes.org. */
(function (global) {
  'use strict';

  var DEG = Math.PI / 180;
  var sin = function (d) { return Math.sin(d * DEG); };
  var cos = function (d) { return Math.cos(d * DEG); };
  var tan = function (d) { return Math.tan(d * DEG); };
  var asin = function (x) { return Math.asin(x) / DEG; };
  var acos = function (x) { return Math.acos(x) / DEG; };
  var atan2 = function (y, x) { return Math.atan2(y, x) / DEG; };
  var acot = function (x) { return Math.atan(1 / x) / DEG; };

  function fixAngle(a) { return fix(a, 360); }
  function fixHour(a) { return fix(a, 24); }
  function fix(a, b) { a = a - b * Math.floor(a / b); return a < 0 ? a + b : a; }

  /* ---------------------------------------------------------------- methods */
  // angle: degrees below horizon. min: fixed minutes after the anchor time.
  var METHODS = {
    MWL:       { name: 'Muslim World League',            fajr: 18,   isha: 17 },
    ISNA:      { name: 'Islamic Society of North America', fajr: 15, isha: 15 },
    Egypt:     { name: 'Egyptian General Authority',      fajr: 19.5, isha: 17.5 },
    Makkah:    { name: 'Umm al-Qura, Makkah',             fajr: 18.5, ishaMin: 90, ramadanIshaMin: 120 },
    Karachi:   { name: 'University of Islamic Sciences, Karachi', fajr: 18, isha: 18 },
    Dubai:     { name: 'Dubai (UAE)',                     fajr: 18.2, isha: 18.2 },
    Qatar:     { name: 'Qatar',                           fajr: 18,   ishaMin: 90 },
    Kuwait:    { name: 'Kuwait',                          fajr: 18,   isha: 17.5 },
    Singapore: { name: 'Majlis Ugama Islam, Singapura',   fajr: 20,   isha: 18 },
    Turkey:    { name: 'Diyanet İşleri, Turkey',          fajr: 18,   isha: 17 },
    Tehran:    { name: 'Institute of Geophysics, Tehran', fajr: 17.7, isha: 14, maghrib: 4.5, midnight: 'Jafari' },
    Jafari:    { name: 'Shia Ithna-Ashari (Jafari)',      fajr: 16,   isha: 14, maghrib: 4, midnight: 'Jafari' },
    France:    { name: 'Union des Organisations Islamiques de France', fajr: 12, isha: 12 },
    Russia:    { name: 'Spiritual Adm. of Muslims of Russia', fajr: 16, isha: 15 },
    Moonsight: { name: 'Moonsighting Committee Worldwide', fajr: 18,  isha: 18, seasonal: true }
  };

  var DEFAULTS = {
    method: 'MWL',
    asr: 'Standard',        // Standard (Shafi/Maliki/Hanbali) | Hanafi
    highLat: 'NightMiddle', // None | NightMiddle | AngleBased | OneSeventh
    imsakMin: 10,
    dhuhrMin: 0,
    elevation: 0,
    adjust: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 }
  };

  var ORDER = ['imsak', 'fajr', 'sunrise', 'dhuhr', 'asr', 'sunset', 'maghrib', 'isha'];

  /* ------------------------------------------------------------ julian date */
  function julian(y, m, d) {
    if (m <= 2) { y -= 1; m += 12; }
    var a = Math.floor(y / 100);
    var b = 2 - a + Math.floor(a / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + b - 1524.5;
  }

  function sunPosition(jd) {
    var D = jd - 2451545.0;
    var g = fixAngle(357.529 + 0.98560028 * D);
    var q = fixAngle(280.459 + 0.98564736 * D);
    var L = fixAngle(q + 1.915 * sin(g) + 0.020 * sin(2 * g));
    var e = 23.439 - 0.00000036 * D;
    var RA = fixHour(atan2(cos(e) * sin(L), cos(L)) / 15);
    return { declination: asin(sin(e) * sin(L)), equation: q / 15 - RA };
  }

  /* ------------------------------------------------------------- the solver */
  function Solver(jdate, lat, elv) {
    this.jdate = jdate; this.lat = lat; this.elv = elv || 0;
  }
  Solver.prototype.midDay = function (t) {
    var eqt = sunPosition(this.jdate + t).equation;
    return fixHour(12 - eqt);
  };
  Solver.prototype.sunAngleTime = function (angle, t, ccw) {
    var decl = sunPosition(this.jdate + t).declination;
    var noon = this.midDay(t);
    var x = (-sin(angle) - sin(decl) * sin(this.lat)) / (cos(decl) * cos(this.lat));
    if (x > 1 || x < -1) return NaN;           // sun never reaches the angle
    var T = acos(x) / 15;
    return noon + (ccw ? -T : T);
  };
  Solver.prototype.asrTime = function (factor, t) {
    var decl = sunPosition(this.jdate + t).declination;
    var angle = -acot(factor + tan(Math.abs(this.lat - decl)));
    return this.sunAngleTime(angle, t);
  };
  Solver.prototype.riseSetAngle = function () {
    return 0.833 + 0.0347 * Math.sqrt(Math.max(0, this.elv));
  };

  function evalVal(v) { return typeof v === 'string' ? parseFloat(v) : v; }

  function timeDiff(a, b) { return fixHour(b - a); }

  /* -------------------------------------------------- high latitude helpers */
  function nightPortion(angle, night, mode) {
    var p = 0.5;
    if (mode === 'AngleBased') p = angle / 60;
    else if (mode === 'OneSeventh') p = 1 / 7;
    return p * night;
  }
  function adjustHL(time, base, angle, night, ccw, mode) {
    if (mode === 'None') return time;
    var portion = nightPortion(angle, night, mode);
    var diff = ccw ? timeDiff(time, base) : timeDiff(base, time);
    if (isNaN(time) || diff > portion) time = base + (ccw ? -portion : portion);
    return time;
  }

  /* ----------------------------------------------------------------- public */
  // opts: {y, m, d, lat, lng, tz (minutes east of UTC), settings}
  // In polar regions the sun may never cross the horizon; there the times are
  // recomputed at the nearest latitude where it does (the aqrab al-bilad rule)
  // and flagged as approximate.
  function computeTimes(opts) {
    var t = rawTimes(opts);
    if (isNaN(t.sunrise) || isNaN(t.sunset) || isNaN(t.fajr) || isNaN(t.isha)) {
      var clamped = Object.assign({}, opts, {
        lat: (opts.lat < 0 ? -1 : 1) * Math.min(Math.abs(opts.lat), 48)
      });
      var alt = rawTimes(clamped);
      alt.dhuhr = t.dhuhr;
      alt.approx = true;
      return alt;
    }
    return t;
  }

  function rawTimes(opts) {
    var s = Object.assign({}, DEFAULTS, opts.settings || {});
    s.adjust = Object.assign({}, DEFAULTS.adjust, (opts.settings || {}).adjust || {});
    var params = METHODS[s.method] || METHODS.MWL;
    var lat = opts.lat, lng = opts.lng, tzMin = opts.tz;
    var y = opts.y, m = opts.m, d = opts.d;

    var jdate = julian(y, m, d) - lng / (15 * 24);
    var solver = new Solver(jdate, lat, s.elevation);

    var t = { imsak: 5 / 24, fajr: 5 / 24, sunrise: 6 / 24, dhuhr: 12 / 24, asr: 13 / 24, sunset: 18 / 24, maghrib: 18 / 24, isha: 18 / 24 };
    var times = {};
    for (var pass = 0; pass < 2; pass++) {
      times.imsak = solver.sunAngleTime(evalVal(params.fajr) || 18, t.imsak, true);
      times.fajr = solver.sunAngleTime(evalVal(params.fajr), t.fajr, true);
      times.sunrise = solver.sunAngleTime(solver.riseSetAngle(), t.sunrise, true);
      times.dhuhr = solver.midDay(t.dhuhr);
      times.asr = solver.asrTime(s.asr === 'Hanafi' ? 2 : 1, t.asr);
      times.sunset = solver.sunAngleTime(solver.riseSetAngle(), t.sunset);
      times.maghrib = params.maghrib != null
        ? solver.sunAngleTime(params.maghrib, t.maghrib)
        : times.sunset;
      times.isha = params.isha != null
        ? solver.sunAngleTime(params.isha, t.isha)
        : NaN;
      for (var k in times) if (!isNaN(times[k])) t[k] = times[k] / 24;
    }

    // fixed-minute variants (Umm al-Qura style)
    if (params.ishaMin != null) {
      var mins = params.ishaMin;
      if (params.ramadanIshaMin && isRamadan(y, m, d, s.hijriOffset || 0)) mins = params.ramadanIshaMin;
      times.isha = times.maghrib + mins / 60;
    }
    times.imsak = times.fajr - s.imsakMin / 60;

    // Moonsighting Committee seasonal shift for very high latitudes is
    // approximated with the angle-based rule below.
    var night = timeDiff(times.sunset, times.sunrise);
    if (s.highLat !== 'None') {
      times.imsak = adjustHL(times.imsak, times.sunrise, evalVal(params.fajr) + 2, night, true, s.highLat);
      times.fajr = adjustHL(times.fajr, times.sunrise, evalVal(params.fajr), night, true, s.highLat);
      times.isha = adjustHL(times.isha, times.sunset, params.isha != null ? evalVal(params.isha) : 18, night, false, s.highLat);
      if (params.maghrib != null) times.maghrib = adjustHL(times.maghrib, times.sunset, evalVal(params.maghrib), night, false, s.highLat);
    }

    // timezone + manual offsets
    var tzHours = tzMin / 60;
    var shift = tzHours - lng / 15;
    ORDER.forEach(function (k) { times[k] = times[k] + shift; });
    times.dhuhr += s.dhuhrMin / 60;
    ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach(function (k) {
      times[k] += (s.adjust[k] || 0) / 60;
    });

    // derived night marks
    var nightLen = params.midnight === 'Jafari'
      ? timeDiff(times.sunset, times.fajr)
      : timeDiff(times.sunset, times.sunrise);
    times.midnight = times.sunset + nightLen / 2;
    times.lastThird = times.sunset + nightLen * 2 / 3;

    return times; // hours, local to the given tz (may exceed 24 for night marks)
  }

  /* ------------------------------------------------------------- timezones */
  var dtfCache = {};
  function partsIn(tz, date) {
    var dtf = dtfCache[tz] || (dtfCache[tz] = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hour12: false, era: 'short',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }));
    var out = {};
    dtf.formatToParts(date).forEach(function (p) { if (p.type !== 'literal') out[p.type] = p.value; });
    var year = parseInt(out.year, 10);
    if (out.era && /B/.test(out.era)) year = 1 - year;
    return {
      y: year, m: +out.month, d: +out.day,
      hh: (+out.hour) % 24, mm: +out.minute, ss: +out.second
    };
  }
  function tzOffset(tz, date) {
    if (!tz) return -date.getTimezoneOffset();
    var p = partsIn(tz, date);
    var asUTC = Date.UTC(p.y, p.m - 1, p.d, p.hh, p.mm, p.ss);
    return Math.round((asUTC - Math.floor(date.getTime() / 1000) * 1000) / 60000);
  }
  function localParts(tz, date) {
    if (!tz) {
      return { y: date.getFullYear(), m: date.getMonth() + 1, d: date.getDate(),
               hh: date.getHours(), mm: date.getMinutes(), ss: date.getSeconds() };
    }
    return partsIn(tz, date);
  }
  // epoch ms for a wall-clock time in a zone
  function zonedEpoch(tz, y, m, d, hours) {
    var utcGuess = Date.UTC(y, m - 1, d, 0, 0, 0);
    var off = tzOffset(tz, new Date(utcGuess));
    var ts = utcGuess - off * 60000;
    off = tzOffset(tz, new Date(ts));
    ts = utcGuess - off * 60000;
    return ts + Math.round(hours * 3600000);
  }

  /* ------------------------------------------------------------ hijri dates */
  var HIJRI_MONTHS = ['Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Thani",
    'Jumada al-Ula', 'Jumada al-Akhirah', 'Rajab', "Sha'ban", 'Ramadan',
    'Shawwal', "Dhu al-Qa'dah', ", 'Dhu al-Hijjah'];
  HIJRI_MONTHS[10] = "Dhu al-Qa'dah";
  var HIJRI_MONTHS_AR = ['محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى',
    'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'];

  // Tabular (Kuwaiti) civil Islamic calendar with a user offset in days.
  function toHijri(y, m, d, offsetDays) {
    var jd = Math.floor(julian(y, m, d) + 0.5) + (offsetDays || 0);
    var l = jd - 1948440 + 10632;
    var n = Math.floor((l - 1) / 10631);
    l = l - 10631 * n + 354;
    var j = Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) +
            Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
    l = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
        Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
    var hm = Math.floor((24 * l) / 709);
    var hd = l - Math.floor((709 * hm) / 24);
    var hy = 30 * n + j - 30;
    return { y: hy, m: hm, d: hd, monthName: HIJRI_MONTHS[hm - 1], monthAr: HIJRI_MONTHS_AR[hm - 1] };
  }
  function fromHijri(hy, hm, hd) { // -> {y,m,d} gregorian
    var jd = Math.floor((11 * hy + 3) / 30) + 354 * hy + 30 * hm -
             Math.floor((hm - 1) / 2) + hd + 1948440 - 385;
    var l = jd + 68569;
    var nn = Math.floor((4 * l) / 146097);
    l = l - Math.floor((146097 * nn + 3) / 4);
    var i = Math.floor((4000 * (l + 1)) / 1461001);
    l = l - Math.floor((1461 * i) / 4) + 31;
    var jj = Math.floor((80 * l) / 2447);
    var day = l - Math.floor((2447 * jj) / 80);
    l = Math.floor(jj / 11);
    var month = jj + 2 - 12 * l;
    var year = 100 * (nn - 49) + i + l;
    return { y: year, m: month, d: day };
  }
  function isRamadan(y, m, d, off) { return toHijri(y, m, d, off).m === 9; }

  var HIJRI_EVENTS = [
    { m: 1, d: 1, name: 'Islamic New Year' },
    { m: 1, d: 10, name: 'Day of Ashura' },
    { m: 3, d: 12, name: 'Mawlid an-Nabi' },
    { m: 7, d: 27, name: "Al-Isra' wal-Mi'raj" },
    { m: 8, d: 15, name: "Laylat al-Bara'ah" },
    { m: 9, d: 1, name: 'First day of Ramadan' },
    { m: 9, d: 27, name: 'Laylat al-Qadr (27th)' },
    { m: 10, d: 1, name: 'Eid al-Fitr' },
    { m: 12, d: 9, name: 'Day of Arafah' },
    { m: 12, d: 10, name: 'Eid al-Adha' }
  ];

  /* ------------------------------------------------------------------ qibla */
  var KAABA = { lat: 21.4224779, lng: 39.8251832 };
  function qiblaBearing(lat, lng) {
    var dLng = (KAABA.lng - lng) * DEG;
    var p1 = lat * DEG, p2 = KAABA.lat * DEG;
    var y = Math.sin(dLng);
    var x = Math.cos(p1) * Math.tan(p2) - Math.sin(p1) * Math.cos(dLng);
    return fixAngle(Math.atan2(y, x) / DEG);
  }
  function distanceToKaaba(lat, lng) {
    var R = 6371;
    var dLat = (KAABA.lat - lat) * DEG, dLng = (KAABA.lng - lng) * DEG;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat * DEG) * Math.cos(KAABA.lat * DEG) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return Math.round(2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  global.AlifTimes = {
    METHODS: METHODS, ORDER: ORDER, DEFAULTS: DEFAULTS,
    computeTimes: computeTimes,
    tzOffset: tzOffset, localParts: localParts, zonedEpoch: zonedEpoch,
    toHijri: toHijri, fromHijri: fromHijri, HIJRI_MONTHS: HIJRI_MONTHS,
    HIJRI_MONTHS_AR: HIJRI_MONTHS_AR, HIJRI_EVENTS: HIJRI_EVENTS,
    qiblaBearing: qiblaBearing, distanceToKaaba: distanceToKaaba, KAABA: KAABA
  };
})(window);
