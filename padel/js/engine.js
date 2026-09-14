/**
 * Padel scoring engine.
 *
 * Pure functions only: a match is an immutable-ish record of who won each
 * rally, and every derived value (games, sets, whose serve, deciding point)
 * is replayed from that list. Undo is therefore just "drop the last rally",
 * which is the only way to keep undo honest across tiebreaks and set ends.
 */

export const DEUCE_ADVANTAGE = 'advantage';
export const DEUCE_GOLDEN = 'golden';
export const DEUCE_STAR = 'star';

export const DEUCE_MODES = [
  {
    id: DEUCE_ADVANTAGE,
    name: 'Voordeel',
    short: 'Voordeel',
    hint: 'Klassiek: bij 40-40 speel je door tot iemand twee punten voorsprong heeft.'
  },
  {
    id: DEUCE_GOLDEN,
    name: 'Gouden punt',
    short: 'Gouden punt',
    hint: 'Bij 40-40 beslist één punt. Het ontvangende koppel kiest de kant.'
  },
  {
    id: DEUCE_STAR,
    name: 'Star point (FIP 2026)',
    short: 'Star point',
    hint: 'Twee keer voordeel spelen; staat het daarna nog gelijk, dan beslist één star point.'
  }
];

export const DEFAULT_CONFIG = {
  bestOf: 3,
  gamesPerSet: 6,
  deuceMode: DEUCE_GOLDEN,
  tiebreakTo: 7,
  finalSetSuperTiebreak: true,
  superTiebreakTo: 10
};

const OTHER = { A: 'B', B: 'A' };

export function otherTeam(team) {
  return OTHER[team];
}

/** Serve rotation for doubles: teams alternate, partners alternate within the team. */
const SERVE_ORDER = [
  { team: 'A', player: 0 },
  { team: 'B', player: 0 },
  { team: 'A', player: 1 },
  { team: 'B', player: 1 }
];

export function createMatch({ teamA, teamB, config = {} } = {}) {
  return {
    id: newId(),
    kind: 'match',
    createdAt: Date.now(),
    finishedAt: null,
    config: { ...DEFAULT_CONFIG, ...config },
    teams: {
      A: normaliseTeam(teamA, 'Team 1'),
      B: normaliseTeam(teamB, 'Team 2')
    },
    points: []
  };
}

function normaliseTeam(team, fallbackName) {
  const players = (team && team.players ? team.players : []).map((p) => String(p || '').trim()).filter(Boolean);
  const name = (team && team.name ? String(team.name).trim() : '') || players.join(' & ') || fallbackName;
  return { name, players };
}

export function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Has `mine` won the game at this raw point count? */
export function isGameWon(mine, theirs, deuceMode) {
  if (mine < 4) return false;
  if (mine - theirs >= 2) return true;
  if (deuceMode === DEUCE_GOLDEN) return mine > theirs;
  // Star point: two advantages are allowed (deuce at 3-3 and 4-4), the third
  // deuce (5-5) is decided by a single point.
  if (deuceMode === DEUCE_STAR) return theirs >= 5 && mine - theirs === 1;
  return false;
}

/** The sudden-death rally that ends the game right now, if there is one. */
export function isDecidingPoint(a, b, deuceMode) {
  if (a !== b) return false;
  if (deuceMode === DEUCE_GOLDEN) return a >= 3;
  if (deuceMode === DEUCE_STAR) return a >= 5;
  return false;
}

/** 3-3 is deuce 1, 4-4 is deuce 2, 5-5 is deuce 3. 0 when not at deuce. */
export function deuceNumber(a, b) {
  if (a !== b || a < 3) return 0;
  return a - 2;
}

export function pointLabel(mine, theirs) {
  if (mine < 3) return ['0', '15', '30'][mine];
  if (theirs < 3) return '40';
  if (mine === theirs) return '40';
  return mine > theirs ? 'AD' : '40';
}

export function setsToWin(config) {
  return Math.floor(config.bestOf / 2) + 1;
}

/**
 * Replay every rally and return the full derived state of the match.
 */
export function computeState(match) {
  const config = { ...DEFAULT_CONFIG, ...match.config };
  const target = setsToWin(config);

  const setsWon = { A: 0, B: 0 };
  const completedSets = [];
  const pointsWon = { A: 0, B: 0 };
  let games = { A: 0, B: 0 };
  let pts = { A: 0, B: 0 };
  let gamesCompleted = 0; // whole match, drives the serve rotation
  let finished = false;
  let winner = null;

  const superTiebreakNow = () =>
    config.finalSetSuperTiebreak && setsWon.A === target - 1 && setsWon.B === target - 1;
  const tiebreakNow = () =>
    superTiebreakNow() || (games.A >= config.gamesPerSet && games.B >= config.gamesPerSet);

  for (const rally of match.points) {
    if (finished) break;
    const w = rally === 'A' || rally === 'B' ? rally : rally.winner;
    const l = OTHER[w];
    const isSuper = superTiebreakNow();
    const inTiebreak = tiebreakNow();

    pts[w] += 1;
    pointsWon[w] += 1;

    if (inTiebreak) {
      const to = isSuper ? config.superTiebreakTo : config.tiebreakTo;
      if (pts[w] >= to && pts[w] - pts[l] >= 2) {
        if (isSuper) {
          completedSets.push({ A: pts.A, B: pts.B, superTiebreak: true });
        } else {
          games[w] += 1;
          completedSets.push({ A: games.A, B: games.B, tiebreak: { A: pts.A, B: pts.B } });
        }
        setsWon[w] += 1;
        gamesCompleted += 1;
        games = { A: 0, B: 0 };
        pts = { A: 0, B: 0 };
        if (setsWon[w] >= target) {
          finished = true;
          winner = w;
        }
      }
    } else if (isGameWon(pts[w], pts[l], config.deuceMode)) {
      games[w] += 1;
      gamesCompleted += 1;
      pts = { A: 0, B: 0 };
      if (games[w] >= config.gamesPerSet && games[w] - games[l] >= 2) {
        completedSets.push({ A: games.A, B: games.B });
        setsWon[w] += 1;
        games = { A: 0, B: 0 };
        if (setsWon[w] >= target) {
          finished = true;
          winner = w;
        }
      }
    }
  }

  const isSuper = !finished && superTiebreakNow();
  const inTiebreak = !finished && tiebreakNow();
  const rallies = pts.A + pts.B;

  // Serve: in a tiebreak the opening server serves one rally, everyone after
  // that serves two.
  const slot = inTiebreak
    ? (gamesCompleted + Math.floor((rallies + 1) / 2)) % 4
    : gamesCompleted % 4;
  const serve = SERVE_ORDER[slot];

  const changeEnds = inTiebreak
    ? rallies > 0 && rallies % 6 === 0
    : rallies === 0 && (games.A + games.B) % 2 === 1;

  return {
    config,
    finished,
    winner,
    setsWon,
    completedSets,
    games: { ...games },
    rawPoints: { ...pts },
    pointsWon: { ...pointsWon },
    inTiebreak,
    isSuperTiebreak: isSuper,
    tiebreakTarget: isSuper ? config.superTiebreakTo : config.tiebreakTo,
    display: inTiebreak
      ? { A: String(pts.A), B: String(pts.B) }
      : { A: pointLabel(pts.A, pts.B), B: pointLabel(pts.B, pts.A) },
    deuce: inTiebreak ? 0 : deuceNumber(pts.A, pts.B),
    decidingPoint: !finished && !inTiebreak && isDecidingPoint(pts.A, pts.B, config.deuceMode),
    serve: finished ? null : { ...serve, side: rallies % 2 === 0 ? 'rechts' : 'links' },
    changeEnds: !finished && changeEnds,
    gamesCompleted,
    totalRallies: match.points.length
  };
}

export function addPoint(match, team) {
  const state = computeState(match);
  if (state.finished) return match;
  const next = { ...match, points: [...match.points, team] };
  const after = computeState(next);
  next.finishedAt = after.finished ? Date.now() : null;
  return next;
}

export function undoPoint(match) {
  if (!match.points.length) return match;
  return { ...match, points: match.points.slice(0, -1), finishedAt: null };
}

/** "6-4 3-6 10-8" — the completed sets, plus the set in progress. */
export function scoreline(match, state = computeState(match)) {
  const parts = state.completedSets.map((s) => `${s.A}-${s.B}`);
  if (!state.finished) {
    if (state.isSuperTiebreak) parts.push(`${state.rawPoints.A}-${state.rawPoints.B}`);
    else if (state.games.A || state.games.B || parts.length === 0) parts.push(`${state.games.A}-${state.games.B}`);
  }
  return parts.join(' ');
}

/** Everything the history screen needs, without replaying the match again. */
export function summarise(match) {
  const state = computeState(match);
  return {
    id: match.id,
    kind: 'match',
    createdAt: match.createdAt,
    finishedAt: match.finishedAt,
    finished: state.finished,
    winner: state.winner,
    teams: match.teams,
    setsWon: state.setsWon,
    pointsWon: state.pointsWon,
    scoreline: scoreline(match, state),
    setsDetail: state.completedSets,
    rallies: match.points.length,
    config: state.config
  };
}
