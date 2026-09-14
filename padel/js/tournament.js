/**
 * Americano and Mexicano tournaments.
 *
 * Both are individual formats: you keep swapping partners and every point you
 * win is added to your own tally, so the winner is a player, not a pair.
 *
 *  - Americano  : partners rotate so that, as far as the numbers allow, you
 *                 play with everyone once.
 *  - Mexicano   : after each round the standings decide the pairings -- 1st
 *                 plays with 4th against 2nd and 3rd, so the games stay close.
 */

import { newId } from './engine.js';

export const FORMAT_FIRST_TO = 'firstTo';
export const FORMAT_TOTAL = 'total';

export const DEFAULT_FORMAT = { mode: FORMAT_TOTAL, points: 24 };

export function createTournament({ name, type = 'americano', players = [], courts = 1, format = {} } = {}) {
  return {
    id: newId(),
    kind: 'tournament',
    type,
    name: (name || '').trim() || (type === 'mexicano' ? 'Mexicano' : 'Americano'),
    createdAt: Date.now(),
    finishedAt: null,
    courts: Math.max(1, courts),
    format: { ...DEFAULT_FORMAT, ...format },
    players: players.map((p) =>
      typeof p === 'string' ? { id: newId(), name: p.trim() } : { id: p.id || newId(), name: String(p.name).trim() }
    ),
    rounds: []
  };
}

export function maxCourts(playerCount) {
  return Math.max(1, Math.floor(playerCount / 4));
}

/** How many rounds it takes for everyone to have partnered everyone once. */
export function suggestedRounds(playerCount) {
  if (playerCount < 4) return 0;
  return playerCount % 2 === 0 ? playerCount - 1 : playerCount;
}

// --- counters replayed from the rounds played so far -------------------------

function pairKey(a, b) {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function tallies(tournament) {
  const partners = new Map();
  const opponents = new Map();
  const sitOuts = new Map();
  const played = new Map();
  for (const p of tournament.players) {
    sitOuts.set(p.id, 0);
    played.set(p.id, 0);
  }
  const bump = (map, key) => map.set(key, (map.get(key) || 0) + 1);

  for (const round of tournament.rounds) {
    for (const id of round.sitOut) bump(sitOuts, id);
    for (const m of round.matches) {
      bump(partners, pairKey(m.teamA[0], m.teamA[1]));
      bump(partners, pairKey(m.teamB[0], m.teamB[1]));
      for (const a of m.teamA) {
        bump(played, a);
        for (const b of m.teamB) bump(opponents, pairKey(a, b));
      }
      for (const b of m.teamB) bump(played, b);
    }
  }
  return { partners, opponents, sitOuts, played };
}

// --- round generation --------------------------------------------------------

const SPLITS = [
  [[0, 1], [2, 3]],
  [[0, 2], [1, 3]],
  [[0, 3], [1, 2]]
];

function quadCost(quad, split, partners, opponents) {
  const [ia, ib] = split;
  const teamA = [quad[ia[0]], quad[ia[1]]];
  const teamB = [quad[ib[0]], quad[ib[1]]];
  // Repeat partners hurt much more than repeat opponents: with 4 players you
  // cannot avoid facing the same people, but you can avoid the same partner.
  let cost = 10 * (partners.get(pairKey(...teamA)) || 0) ** 2;
  cost += 10 * (partners.get(pairKey(...teamB)) || 0) ** 2;
  for (const a of teamA) for (const b of teamB) cost += (opponents.get(pairKey(a, b)) || 0) ** 2;
  return { cost, teamA, teamB };
}

function bestArrangement(playing, partners, opponents) {
  const matches = [];
  let total = 0;
  for (let i = 0; i < playing.length; i += 4) {
    const quad = playing.slice(i, i + 4);
    let best = null;
    for (const split of SPLITS) {
      const candidate = quadCost(quad, split, partners, opponents);
      if (!best || candidate.cost < best.cost) best = candidate;
    }
    matches.push({ teamA: best.teamA, teamB: best.teamB });
    total += best.cost;
  }
  return { matches, cost: total };
}

function shuffled(list, rng) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Pick who sits out: whoever has sat out least so far. */
function pickSitOuts(tournament, count, sitOuts, rng) {
  if (count <= 0) return [];
  return shuffled(tournament.players.map((p) => p.id), rng)
    .sort((a, b) => (sitOuts.get(a) || 0) - (sitOuts.get(b) || 0))
    .slice(0, count);
}

/**
 * Build the next round. Americano searches for the arrangement with the fewest
 * repeated partners; Mexicano seeds the courts straight from the standings.
 */
export function generateRound(tournament, { rng = Math.random, attempts = 400 } = {}) {
  const playerCount = tournament.players.length;
  if (playerCount < 4) throw new Error('Een Americano heeft minstens 4 spelers nodig.');

  const courts = Math.min(tournament.courts, maxCourts(playerCount));
  const slots = courts * 4;
  const { partners, opponents, sitOuts } = tallies(tournament);
  const sitOut = pickSitOuts(tournament, playerCount - slots, sitOuts, rng);
  const available = tournament.players.map((p) => p.id).filter((id) => !sitOut.includes(id));

  let arrangement;
  if (tournament.type === 'mexicano' && tournament.rounds.length > 0) {
    const order = standings(tournament)
      .map((row) => row.id)
      .filter((id) => available.includes(id));
    // 1st + 4th against 2nd + 3rd on every court.
    const matches = [];
    for (let i = 0; i < order.length; i += 4) {
      const q = order.slice(i, i + 4);
      matches.push({ teamA: [q[0], q[3]], teamB: [q[1], q[2]] });
    }
    arrangement = { matches };
  } else {
    let best = null;
    for (let i = 0; i < attempts; i++) {
      const candidate = bestArrangement(shuffled(available, rng), partners, opponents);
      if (!best || candidate.cost < best.cost) best = candidate;
      if (best.cost === 0) break;
    }
    arrangement = best;
  }

  return {
    number: tournament.rounds.length + 1,
    sitOut,
    matches: arrangement.matches.map((m, i) => ({
      id: newId(),
      court: i + 1,
      teamA: m.teamA,
      teamB: m.teamB,
      scoreA: 0,
      scoreB: 0,
      done: false
    }))
  };
}

export function addRound(tournament, options) {
  return { ...tournament, rounds: [...tournament.rounds, generateRound(tournament, options)] };
}

// --- scoring -----------------------------------------------------------------

/** Has this match reached its finish under the tournament's format? */
export function isMatchComplete(match, format) {
  if (format.mode === FORMAT_FIRST_TO) return match.scoreA >= format.points || match.scoreB >= format.points;
  return match.scoreA + match.scoreB >= format.points;
}

export function scoreLimits(match, format) {
  if (format.mode === FORMAT_FIRST_TO) return { A: format.points, B: format.points };
  const left = format.points - match.scoreA - match.scoreB;
  return { A: match.scoreA + Math.max(0, left), B: match.scoreB + Math.max(0, left) };
}

/** Change one side's score, clamped to what the format allows. */
export function setMatchScore(tournament, matchId, team, value) {
  const rounds = tournament.rounds.map((round) => ({
    ...round,
    matches: round.matches.map((m) => {
      if (m.id !== matchId) return m;
      const limits = scoreLimits(m, tournament.format);
      const next = { ...m, [team === 'A' ? 'scoreA' : 'scoreB']: clamp(value, 0, limits[team]) };
      next.done = isMatchComplete(next, tournament.format);
      return next;
    })
  }));
  return { ...tournament, rounds };
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

export function roundComplete(round, format) {
  return round.matches.every((m) => isMatchComplete(m, format));
}

export function currentRound(tournament) {
  return tournament.rounds[tournament.rounds.length - 1] || null;
}

/** Player standings: points won is the ranking, difference breaks ties. */
export function standings(tournament) {
  const rows = new Map(
    tournament.players.map((p) => [
      p.id,
      { id: p.id, name: p.name, points: 0, against: 0, diff: 0, wins: 0, draws: 0, losses: 0, played: 0, sitOut: 0 }
    ])
  );

  for (const round of tournament.rounds) {
    for (const id of round.sitOut) {
      const row = rows.get(id);
      if (row) row.sitOut += 1;
    }
    for (const m of round.matches) {
      const played = m.scoreA + m.scoreB > 0;
      const sides = [
        { ids: m.teamA, for: m.scoreA, against: m.scoreB },
        { ids: m.teamB, for: m.scoreB, against: m.scoreA }
      ];
      for (const side of sides) {
        for (const id of side.ids) {
          const row = rows.get(id);
          if (!row) continue;
          row.points += side.for;
          row.against += side.against;
          if (m.done) {
            row.played += 1;
            if (side.for > side.against) row.wins += 1;
            else if (side.for === side.against) row.draws += 1;
            else row.losses += 1;
          } else if (played) {
            row.played += 1;
          }
        }
      }
    }
  }

  return [...rows.values()]
    .map((r) => ({ ...r, diff: r.points - r.against }))
    .sort((a, b) => b.points - a.points || b.diff - a.diff || b.wins - a.wins || a.name.localeCompare(b.name));
}

export function summarise(tournament) {
  const table = standings(tournament);
  return {
    id: tournament.id,
    kind: 'tournament',
    type: tournament.type,
    name: tournament.name,
    createdAt: tournament.createdAt,
    finishedAt: tournament.finishedAt,
    rounds: tournament.rounds.length,
    players: tournament.players.length,
    leader: table[0] || null,
    standings: table
  };
}
