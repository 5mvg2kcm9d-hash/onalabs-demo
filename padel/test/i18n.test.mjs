import test from 'node:test';
import assert from 'node:assert/strict';
import {
  t,
  setLanguage,
  getLanguage,
  detectLanguage,
  languageName,
  formatDate,
  keysOf,
  entryOf,
  LANGUAGES,
  FALLBACK,
  DEFAULT_LANGUAGE
} from '../js/i18n.js';
import { DEFAULT_SETTINGS } from '../js/store.js';

const OTHERS = LANGUAGES.map((l) => l.id).filter((id) => id !== FALLBACK);

test('English and Russian are both offered', () => {
  const ids = LANGUAGES.map((l) => l.id);
  assert.ok(ids.includes('en'), ids.join(','));
  assert.ok(ids.includes('ru'), ids.join(','));
});

test('the app opens in Russian before anyone picks a language', () => {
  assert.equal(DEFAULT_LANGUAGE, 'ru');
  assert.equal(DEFAULT_SETTINGS.language, 'ru', 'a fresh install starts Russian');
  setLanguage(DEFAULT_SETTINGS.language);
  assert.equal(t('home.newMatch'), 'Новый матч');
});

test('a missing key still falls back to English rather than to the default', () => {
  assert.equal(FALLBACK, 'en');
  setLanguage('ru');
  assert.equal(t('nope.not.here'), 'nope.not.here');
});

test('every language has exactly the same keys as English', () => {
  const reference = keysOf(FALLBACK);
  for (const lang of OTHERS) {
    const keys = keysOf(lang);
    const missing = reference.filter((k) => !keys.includes(k));
    const extra = keys.filter((k) => !reference.includes(k));
    assert.deepEqual(missing, [], `${lang} is missing keys`);
    assert.deepEqual(extra, [], `${lang} has keys English does not`);
  }
});

test('nothing is left untranslated', () => {
  for (const lang of OTHERS) {
    for (const key of keysOf(lang)) {
      const value = entryOf(lang, key);
      const strings = typeof value === 'object' ? Object.values(value) : [value];
      for (const s of strings) assert.ok(String(s).trim().length > 0, `${lang}:${key} is empty`);
    }
  }
});

test('plural keys cover every form the language needs', () => {
  for (const lang of LANGUAGES.map((l) => l.id)) {
    const categories = new Intl.PluralRules(lang).resolvedOptions().pluralCategories;
    for (const key of keysOf(lang)) {
      const value = entryOf(lang, key);
      if (typeof value !== 'object') continue;
      for (const form of categories) {
        assert.ok(form in value, `${lang}:${key} has no "${form}" form`);
      }
    }
  }
});

test('a plural key is a plural key in every language', () => {
  for (const key of keysOf(FALLBACK)) {
    const isPlural = typeof entryOf(FALLBACK, key) === 'object';
    for (const lang of OTHERS) {
      assert.equal(typeof entryOf(lang, key) === 'object', isPlural, `${lang}:${key} disagrees with English`);
    }
  }
});

test('every placeholder in English appears in the translations', () => {
  const holders = (value) =>
    [...new Set(String(typeof value === 'object' ? Object.values(value).join(' ') : value).match(/\{\w+\}/g) || [])].sort();
  for (const key of keysOf(FALLBACK)) {
    const expected = holders(entryOf(FALLBACK, key));
    for (const lang of OTHERS) {
      assert.deepEqual(holders(entryOf(lang, key)), expected, `${lang}:${key} placeholders differ`);
    }
  }
});

test('Russian picks one/few/many correctly', () => {
  setLanguage('ru');
  assert.equal(t('tour.playerCount', { count: 1 }), '1 игрок');
  assert.equal(t('tour.playerCount', { count: 3 }), '3 игрока');
  assert.equal(t('tour.playerCount', { count: 8 }), '8 игроков');
  assert.equal(t('tour.playerCount', { count: 21 }), '21 игрок');
  assert.equal(t('tour.rounds', { count: 2 }), '2 раунда');
});

test('English picks one/other correctly', () => {
  setLanguage('en');
  assert.equal(t('tour.playerCount', { count: 1 }), '1 player');
  assert.equal(t('tour.playerCount', { count: 5 }), '5 players');
  assert.equal(t('live.games', { count: 1 }), 'game');
  assert.equal(t('live.games', { count: 0 }), 'games');
});

test('placeholders are filled', () => {
  setLanguage('en');
  assert.equal(t('live.setScore', { n: 2, a: 6, b: 4 }), 'Set 2: 6-4');
  setLanguage('ru');
  assert.equal(t('live.setScore', { n: 2, a: 6, b: 4 }), 'Сет 2: 6-4');
});

test('a missing placeholder is left alone rather than printing undefined', () => {
  setLanguage('en');
  assert.equal(t('live.setScore', { n: 1 }), 'Set 1: {a}-{b}');
});

test('an unknown key returns the key itself', () => {
  setLanguage('en');
  assert.equal(t('nope.not.here'), 'nope.not.here');
});

test('an unsupported language falls back instead of breaking', () => {
  setLanguage('xx');
  assert.ok(LANGUAGES.some((l) => l.id === getLanguage()));
  assert.equal(typeof t('app.title'), 'string');
});

test('detectLanguage always returns a supported language', () => {
  assert.ok(LANGUAGES.some((l) => l.id === detectLanguage()));
});

test('languageName gives the native name', () => {
  assert.equal(languageName('ru'), 'Русский');
  assert.equal(languageName('en'), 'English');
});

test('dates are formatted in the active language', () => {
  setLanguage('ru');
  assert.ok(formatDate(Date.now()).startsWith('Сегодня'));
  setLanguage('en');
  assert.ok(formatDate(Date.now()).startsWith('Today'));
  assert.equal(formatDate(null), '');
});

test('the three screens people see most are fully translated', () => {
  for (const lang of LANGUAGES.map((l) => l.id)) {
    setLanguage(lang);
    for (const key of ['app.title', 'home.newMatch', 'match.start', 'live.tapHint', 'tour.standings']) {
      assert.notEqual(t(key), key, `${lang}:${key}`);
    }
  }
  setLanguage('en');
});
