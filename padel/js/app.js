/**
 * App shell: routing, state and every user action.
 *
 * The whole screen is re-rendered after each action -- the views are cheap and
 * a single render path means the display can never drift from the stored
 * match. Events are handled by delegation on #app, so re-rendering never
 * leaves a dangling listener behind.
 */

import { html, raw } from './dom.js';
import * as store from './store.js';
import {
  createMatch,
  computeState,
  addPoint,
  undoPoint,
  summarise as summariseMatch,
  DEFAULT_CONFIG
} from './engine.js';
import {
  createTournament,
  addRound,
  setMatchScore,
  currentRound,
  roundComplete,
  summarise as summariseTournament,
  maxCourts,
  DEFAULT_FORMAT
} from './tournament.js';
import { buildStats, totals } from './stats.js';
import * as views from './views.js';

const app = document.getElementById('app');
const toastEl = document.getElementById('toast');

const state = {
  route: { name: 'home', param: null },
  live: null,
  matchDraft: null,
  tournamentDraft: null
};

// ---------------------------------------------------------------- drafts

function freshMatchDraft() {
  const saved = store.getSettings().lastMatchConfig;
  return {
    teamA: ['', ''],
    teamB: ['', ''],
    config: { ...DEFAULT_CONFIG, ...(saved || {}) }
  };
}

function freshTournamentDraft() {
  const saved = store.getSettings().lastTournamentConfig || {};
  return {
    type: saved.type || 'americano',
    players: [],
    courts: saved.courts || 1,
    format: { ...DEFAULT_FORMAT, ...(saved.format || {}) }
  };
}

// ---------------------------------------------------------------- routing

function parseRoute() {
  const hash = location.hash.replace(/^#\/?/, '');
  const [name = '', param = null] = hash.split('/');
  switch (name) {
    case '':
      return { name: 'home', param: null };
    case 'new':
      return { name: 'new-match', param: null };
    case 'match':
      return { name: 'match', param: null };
    case 'tournament':
      return { name: param === 'new' ? 'new-tournament' : 'tournament', param: null };
    case 'history':
      return { name: param ? 'history-detail' : 'history', param };
    case 'stats':
      return { name: 'stats', param: null };
    case 'players':
      return { name: 'players', param: null };
    case 'settings':
      return { name: 'settings', param: null };
    default:
      return { name: 'home', param: null };
  }
}

function go(href) {
  if (location.hash === href) render();
  else location.hash = href;
}

// ---------------------------------------------------------------- render

let renderedRoute = '';

function render() {
  state.route = parseRoute();
  const { name, param } = state.route;
  const history = store.getHistory();

  let markup;
  switch (name) {
    case 'new-match':
      if (!state.matchDraft) state.matchDraft = freshMatchDraft();
      markup = views.newMatchView({ draft: state.matchDraft, players: store.getPlayers() });
      break;

    case 'match':
      if (!state.live || state.live.kind !== 'match') return go('#/');
      markup = views.matchView(state.live);
      break;

    case 'new-tournament':
      if (!state.tournamentDraft) state.tournamentDraft = freshTournamentDraft();
      markup = views.newTournamentView({ draft: state.tournamentDraft, players: store.getPlayers() });
      break;

    case 'tournament':
      if (!state.live || state.live.kind !== 'tournament') return go('#/');
      markup = views.tournamentView(state.live);
      break;

    case 'history':
      markup = views.historyView(history);
      break;

    case 'history-detail': {
      const item = store.findInHistory(param);
      if (!item) return go('#/history');
      markup = views.historyDetailView(item);
      break;
    }

    case 'stats':
      markup = views.statsView({ rows: buildStats(history), totals: totals(history) });
      break;

    case 'players':
      markup = views.playersView(store.getPlayers());
      break;

    case 'settings':
      markup = views.settingsView({ settings: store.getSettings(), storageOk: store.storageAvailable() });
      break;

    default:
      markup = views.homeView({ live: state.live, history, totals: totals(history) });
  }

  app.innerHTML = markup;

  // Jump back to the top on a new screen, but stay put while a screen is
  // re-rendering in place -- scoring a tournament point must not scroll away.
  const key = `${name}/${param || ''}`;
  if (key !== renderedRoute) {
    renderedRoute = key;
    window.scrollTo(0, 0);
  }

  syncWakeLock();
}

// ---------------------------------------------------------------- feedback

let toastTimer = null;
function toast(message) {
  toastEl.textContent = message;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.hidden = true;
  }, 2200);
}

function buzz(ms = 12) {
  if (!store.getSettings().haptics) return;
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* not supported, never mind */
  }
}

// ---------------------------------------------------------------- wake lock

let wakeLock = null;

async function syncWakeLock() {
  const wants = store.getSettings().keepAwake && ['match', 'tournament'].includes(state.route.name);
  if (!('wakeLock' in navigator)) return;
  try {
    if (wants && !wakeLock) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => {
        wakeLock = null;
      });
    } else if (!wants && wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch {
    wakeLock = null; // denied or the tab is hidden; harmless
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') syncWakeLock();
});

// ---------------------------------------------------------------- live state

function setLive(item) {
  state.live = item;
  store.saveLive(item);
}

function endLive() {
  state.live = null;
  store.clearLive();
}

// ---------------------------------------------------------------- actions

const actions = {
  nav(el) {
    go(el.dataset.href);
  },

  // --- new match form ---

  'draft-name'(el) {
    // Deliberately no re-render: the input already shows what was typed.
    const [side, index] = [el.dataset.key[0], Number(el.dataset.key[1])];
    const key = side === 'a' ? 'teamA' : 'teamB';
    state.matchDraft[key][index] = el.value;
  },

  'draft-set'(el) {
    const { key, value } = el.dataset;
    const num = Number(value);
    const parsed = Number.isNaN(num) || value === '' ? value : num;

    if (state.route.name === 'new-match') {
      state.matchDraft.config[key] = parsed;
    } else if (state.route.name === 'new-tournament') {
      const draft = state.tournamentDraft;
      if (key === 'formatMode') draft.format.mode = value;
      else if (key === 'formatPoints') draft.format.points = num;
      else draft[key] = parsed;
    }
    render();
  },

  'draft-toggle'(el) {
    const { key } = el.dataset;
    if (state.route.name === 'settings') {
      store.saveSettings({ [key]: el.getAttribute('aria-pressed') !== 'true' });
      syncWakeLock();
    } else if (state.route.name === 'new-match') {
      state.matchDraft.config[key] = !state.matchDraft.config[key];
    }
    render();
  },

  'swap-teams'() {
    readMatchInputs();
    const draft = state.matchDraft;
    [draft.teamA, draft.teamB] = [draft.teamB, draft.teamA];
    render();
  },

  'start-match'() {
    readMatchInputs();
    const draft = state.matchDraft;
    const names = [...draft.teamA, ...draft.teamB].map((n) => n.trim()).filter(Boolean);
    store.rememberNames(names);
    store.saveSettings({ lastMatchConfig: draft.config });

    setLive(
      createMatch({
        teamA: { players: draft.teamA, name: draft.teamA.filter(Boolean).join(' & ') || 'Team 1' },
        teamB: { players: draft.teamB, name: draft.teamB.filter(Boolean).join(' & ') || 'Team 2' },
        config: draft.config
      })
    );
    state.matchDraft = null;
    go('#/match');
  },

  // --- live match ---

  score(el) {
    const before = computeState(state.live);
    if (before.finished) return;
    setLive(addPoint(state.live, el.dataset.team));
    buzz();
    const after = computeState(state.live);
    if (after.finished) buzz(60);
    render();
  },

  undo() {
    if (!state.live?.points?.length) return;
    setLive(undoPoint(state.live));
    render();
  },

  'finish-match'() {
    store.archive(summariseMatch(state.live));
    const id = state.live.id;
    endLive();
    toast('Wedstrijd opgeslagen');
    go(`#/history/${id}`);
  },

  'abandon-match'() {
    if (!confirm('Wedstrijd stoppen?')) return;
    if (state.live.points.length > 0) {
      store.archive(summariseMatch(state.live));
      toast('Opgeslagen als afgebroken wedstrijd');
    }
    endLive();
    go('#/');
  },

  // --- roster ---

  'add-player-form'(form) {
    const input = form.querySelector('input[name="name"]');
    const name = input.value.trim();
    if (!name) return;
    const players = store.addPlayer(name);
    if (state.route.name === 'new-tournament') {
      const added = players.find((p) => p.name.toLowerCase() === name.toLowerCase());
      if (added && !state.tournamentDraft.players.some((p) => p.id === added.id)) {
        state.tournamentDraft.players.push(added);
      }
    }
    input.value = '';
    render();
  },

  'remove-player'(el) {
    store.removePlayer(el.dataset.id);
    render();
  },

  // --- new tournament ---

  'toggle-player'(el) {
    const draft = state.tournamentDraft;
    const id = el.dataset.id;
    const at = draft.players.findIndex((p) => p.id === id);
    if (at >= 0) draft.players.splice(at, 1);
    else {
      const player = store.getPlayers().find((p) => p.id === id);
      if (player) draft.players.push(player);
    }
    draft.courts = Math.min(draft.courts, Math.max(1, maxCourts(draft.players.length)));
    render();
  },

  'start-tournament'() {
    const draft = state.tournamentDraft;
    if (draft.players.length < 4) return;
    store.saveSettings({ lastTournamentConfig: { type: draft.type, courts: draft.courts, format: draft.format } });
    const tournament = createTournament({
      type: draft.type,
      players: draft.players,
      courts: Math.min(draft.courts, maxCourts(draft.players.length)),
      format: draft.format
    });
    setLive(addRound(tournament));
    state.tournamentDraft = null;
    go('#/tournament');
  },

  // --- live tournament ---

  tscore(el) {
    const { match, team, delta } = el.dataset;
    const round = currentRound(state.live);
    const current = round.matches.find((m) => m.id === match);
    if (!current) return;
    const value = (team === 'A' ? current.scoreA : current.scoreB) + Number(delta);
    setLive(setMatchScore(state.live, match, team, value));
    buzz();
    render();
  },

  'next-round'() {
    const round = currentRound(state.live);
    if (!round || !roundComplete(round, state.live.format)) return;
    setLive(addRound(state.live));
    toast(`Ronde ${state.live.rounds.length}`);
    render();
  },

  'finish-tournament'() {
    if (!confirm('Toernooi afronden en opslaan?')) return;
    const finished = { ...state.live, finishedAt: Date.now() };
    store.archive(summariseTournament(finished));
    const id = finished.id;
    endLive();
    toast('Toernooi opgeslagen');
    go(`#/history/${id}`);
  },

  'abandon-tournament'() {
    if (!confirm('Toernooi stoppen zonder op te slaan?')) return;
    endLive();
    go('#/');
  },

  // --- history and settings ---

  'delete-history'(el) {
    if (!confirm('Verwijderen uit je historie?')) return;
    store.removeFromHistory(el.dataset.id);
    go('#/history');
  },

  'clear-history'() {
    if (!confirm('Alle historie en statistieken wissen? Dit kan niet ongedaan worden gemaakt.')) return;
    store.clearHistory();
    toast('Historie gewist');
    render();
  },

  async export() {
    const data = JSON.stringify(store.exportAll(), null, 2);
    const file = new File([data], 'padel-backup.json', { type: 'application/json' });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Padel back-up' });
        return;
      }
    } catch {
      return; // the user dismissed the share sheet
    }
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'padel-backup.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  import() {
    document.querySelector('[data-action="import-file"]')?.click();
  },

  async 'import-file'(el) {
    const file = el.files?.[0];
    if (!file) return;
    try {
      store.importAll(JSON.parse(await file.text()));
      toast('Back-up teruggezet');
    } catch (error) {
      toast(error.message || 'Kon dit bestand niet lezen');
    }
    el.value = '';
    render();
  }
};

/** The name fields are uncontrolled, so read them before anything re-renders. */
function readMatchInputs() {
  for (const input of app.querySelectorAll('[data-action="draft-name"]')) {
    const side = input.dataset.key[0];
    const index = Number(input.dataset.key[1]);
    state.matchDraft[side === 'a' ? 'teamA' : 'teamB'][index] = input.value;
  }
}

// ---------------------------------------------------------------- wiring

app.addEventListener('click', (event) => {
  const el = event.target.closest('[data-action]');
  if (!el || el.tagName === 'FORM' || el.disabled) return;
  const handler = actions[el.dataset.action];
  if (!handler) return;
  event.preventDefault();
  handler(el, event);
});

app.addEventListener('input', (event) => {
  const el = event.target.closest('[data-action="draft-name"]');
  if (el) actions['draft-name'](el);
});

app.addEventListener('change', (event) => {
  const el = event.target.closest('[data-action="import-file"]');
  if (el) actions['import-file'](el);
});

app.addEventListener('submit', (event) => {
  const form = event.target.closest('form[data-action]');
  if (!form) return;
  event.preventDefault();
  actions[form.dataset.action]?.(form, event);
});

window.addEventListener('hashchange', render);

// ---------------------------------------------------------------- boot

state.live = store.getLive();
render();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* offline support is a bonus, not a requirement */
    });
  });
}
