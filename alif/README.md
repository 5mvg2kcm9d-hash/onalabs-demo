# Alif — Quran & Prayer Times

A web build of the Alif prayer companion: prayer times, athan alerts, a Qibla
compass, a prayer tracker and the full Quran. Everything runs client-side and
works offline once loaded; nothing is sent to a server.

## Run it

Any static file server works — the app is plain HTML, CSS and JavaScript:

```
npx http-server alif -p 8123     # then open http://127.0.0.1:8123
```

Opening `index.html` straight from disk also works, except the Quran bundles,
which are injected as scripts and need an `http://` origin in some browsers.

## Layout

```
index.html          markup, design tokens and all styling
js/times.js         solar position, prayer time solver, Hijri calendar, Qibla
js/app.js           state, Today / Qibla / Tracker / Settings, notifications
js/quran.js         surah + juz index, search, reader, bookmarks
data/surahs.js      114 surahs, 30 juz boundaries, 15 sajda ayahs   (8 KB)
data/cities.js      2,193 cities with coordinates and IANA time zone (120 KB)
data/quran-ar.js    Arabic, Uthmani script                          (1.3 MB)
data/quran-en.js    English — Dr. Mustafa Khattab                   (876 KB)
data/quran-nl.js    Nederlands — Sofian S. Siregar                  (948 KB)
data/quran-tr.js    Latin transliteration                           (647 KB)
```

The four Quran bundles are loaded lazily, the first time the reader or a text
search needs them, so the app starts in well under 200 KB.

## Prayer times

`js/times.js` computes times astronomically — no network call, no API key.
Solar declination and the equation of time come from the low-precision USNO
algorithm; each prayer is solved iteratively from its sun angle, the way
PrayTimes does it. Supported: 15 calculation conventions, Standard and Hanafi
Asr, four high-latitude rules, per-prayer minute adjustments, and the
nearest-latitude (aqrab al-bilad) fallback where the sun never reaches the
required angle.

Time zones come from `Intl.DateTimeFormat`, so a city keeps its own DST rules
regardless of where the device is.

## Data sources

- Quran text and translations: the `fawazahmed0/quran-api` and
  `risan/quran-json` datasets (Tanzil Uthmani script, Khattab and Siregar
  translations).
- Cities and time zones: `kevinroberts/city-timezones`.

## Storage

Settings, the prayer log, bookmarks and the tasbih count live in
`localStorage` under `alif.state.v1`. Settings → Data has copy/restore for a
JSON backup, and a reset.
