/**
 * Local storage. Everything lives on the phone: no account, no server, no
 * network. Every read and write is guarded because Safari throws on storage
 * access in private windows and when the quota is full.
 */

import { newId } from './engine.js';

const PREFIX = 'padel.v1.';
const KEYS = {
  players: PREFIX + 'players',
  history: PREFIX + 'history',
  live: PREFIX + 'live',
  settings: PREFIX + 'settings'
};

export const DEFAULT_SETTINGS = {
  keepAwake: true,
  haptics: true,
  lastMatchConfig: null,
  lastTournamentConfig: null
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const value = JSON.parse(raw);
    return value === null || value === undefined ? fallback : value;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

// --- roster ------------------------------------------------------------------

export function getPlayers() {
  const list = read(KEYS.players, []);
  return Array.isArray(list) ? list.filter((p) => p && p.name) : [];
}

export function savePlayers(players) {
  return write(KEYS.players, players);
}

export function addPlayer(name) {
  const clean = String(name || '').trim();
  if (!clean) return getPlayers();
  const players = getPlayers();
  if (players.some((p) => p.name.toLowerCase() === clean.toLowerCase())) return players;
  const next = [...players, { id: newId(), name: clean }];
  savePlayers(next);
  return next;
}

export function removePlayer(id) {
  const next = getPlayers().filter((p) => p.id !== id);
  savePlayers(next);
  return next;
}

/** Pull any names used in a match or tournament into the roster. */
export function rememberNames(names) {
  for (const name of names) addPlayer(name);
}

// --- the game in progress ----------------------------------------------------

export function getLive() {
  return read(KEYS.live, null);
}

export function saveLive(item) {
  return write(KEYS.live, item);
}

export function clearLive() {
  try {
    localStorage.removeItem(KEYS.live);
  } catch {
    /* nothing we can do */
  }
}

// --- history -----------------------------------------------------------------

export function getHistory() {
  const list = read(KEYS.history, []);
  return Array.isArray(list) ? list : [];
}

/** Archive a finished match or tournament, newest first. */
export function archive(item) {
  const history = getHistory().filter((h) => h.id !== item.id);
  const next = [{ ...item, archivedAt: Date.now() }, ...history].slice(0, 500);
  write(KEYS.history, next);
  return next;
}

export function removeFromHistory(id) {
  const next = getHistory().filter((h) => h.id !== id);
  write(KEYS.history, next);
  return next;
}

export function findInHistory(id) {
  return getHistory().find((h) => h.id === id) || null;
}

export function clearHistory() {
  write(KEYS.history, []);
}

// --- settings ----------------------------------------------------------------

export function getSettings() {
  return { ...DEFAULT_SETTINGS, ...read(KEYS.settings, {}) };
}

export function saveSettings(patch) {
  const next = { ...getSettings(), ...patch };
  write(KEYS.settings, next);
  return next;
}

// --- backup ------------------------------------------------------------------

export function exportAll() {
  return {
    app: 'padel-scorebord',
    version: 1,
    exportedAt: new Date().toISOString(),
    players: getPlayers(),
    history: getHistory(),
    settings: getSettings()
  };
}

export function importAll(data) {
  if (!data || data.app !== 'padel-scorebord') throw new Error('Dit bestand komt niet uit deze app.');
  if (Array.isArray(data.players)) savePlayers(data.players);
  if (Array.isArray(data.history)) write(KEYS.history, data.history);
  if (data.settings) saveSettings(data.settings);
}

export function storageAvailable() {
  try {
    const probe = PREFIX + 'probe';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}
