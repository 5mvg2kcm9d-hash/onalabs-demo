import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createTournament,
  generateRound,
  addRound,
  standings,
  setMatchScore,
  isMatchComplete,
  roundComplete,
  maxCourts,
  suggestedRounds,
  FORMAT_FIRST_TO,
  FORMAT_TOTAL
} from '../js/tournament.js';

const names = (n) => Array.from({ length: n }, (_, i) => `Speler ${i + 1}`);
const make = (n, extra = {}) => createTournament({ players: names(n), courts: maxCourts(n), ...extra });

/** Deterministic RNG so pairing tests do not flake. */
function seeded(seed = 42) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

/** Play a whole round, giving teamA `aScore` of the available points. */
function playRound(t, aScore) {
  const round = t.rounds[t.rounds.length - 1];
  for (const m of round.matches) {
    t = setMatchScore(t, m.id, 'A', aScore);
    t = setMatchScore(t, m.id, 'B', t.format.points - aScore);
  }
  return t;
}

test('four players, three rounds, everyone partners everyone once', () => {
  let t = make(4);
  const seen = new Set();
  for (let i = 0; i < 3; i++) {
    t = addRound(t, { rng: seeded(i + 1) });
    const round = t.rounds[i];
    assert.equal(round.matches.length, 1);
    assert.equal(round.sitOut.length, 0);
    const m = round.matches[0];
    seen.add([...m.teamA].sort().join('|'));
    seen.add([...m.teamB].sort().join('|'));
  }
  assert.equal(seen.size, 6, 'all six possible pairs appear exactly once');
});

test('each round uses every playing player exactly once', () => {
  for (const n of [4, 8, 12]) {
    let t = make(n);
    for (let i = 0; i < 4; i++) t = addRound(t, { rng: seeded(n + i) });
    for (const round of t.rounds) {
      const ids = round.matches.flatMap((m) => [...m.teamA, ...m.teamB]);
      assert.equal(new Set(ids).size, ids.length, `no duplicate players (n=${n})`);
      assert.equal(ids.length + round.sitOut.length, n, `everyone accounted for (n=${n})`);
      assert.equal(round.matches.length, n / 4);
    }
  }
});

test('odd player counts rotate the sit-outs fairly', () => {
  let t = make(6); // one court, two players rest each round
  for (let i = 0; i < 6; i++) t = addRound(t, { rng: seeded(i * 7 + 1) });
  const counts = new Map(t.players.map((p) => [p.id, 0]));
  for (const round of t.rounds) {
    assert.equal(round.sitOut.length, 2);
    for (const id of round.sitOut) counts.set(id, counts.get(id) + 1);
  }
  const values = [...counts.values()];
  assert.ok(Math.max(...values) - Math.min(...values) <= 1, `sit-outs within one of each other: ${values}`);
});

test('a sitting player is never also on court', () => {
  let t = make(5);
  for (let i = 0; i < 5; i++) t = addRound(t, { rng: seeded(i + 99) });
  for (const round of t.rounds) {
    const onCourt = new Set(round.matches.flatMap((m) => [...m.teamA, ...m.teamB]));
    for (const id of round.sitOut) assert.ok(!onCourt.has(id));
  }
});

test('fewer than four players is refused', () => {
  assert.throws(() => generateRound(make(3)), /minstens 4 spelers/);
});

test('total-points format ends the match at exactly the target', () => {
  let t = addRound(make(4, { format: { mode: FORMAT_TOTAL, points: 24 } }), { rng: seeded(3) });
  const m = t.rounds[0].matches[0];
  t = setMatchScore(t, m.id, 'A', 10);
  assert.equal(t.rounds[0].matches[0].done, false);
  t = setMatchScore(t, m.id, 'B', 14);
  assert.equal(t.rounds[0].matches[0].done, true);
  assert.equal(roundComplete(t.rounds[0], t.format), true);
});

test('total-points format never lets the two scores exceed the target', () => {
  let t = addRound(make(4, { format: { mode: FORMAT_TOTAL, points: 24 } }), { rng: seeded(4) });
  const m = t.rounds[0].matches[0];
  t = setMatchScore(t, m.id, 'A', 20);
  t = setMatchScore(t, m.id, 'B', 99);
  const after = t.rounds[0].matches[0];
  assert.equal(after.scoreA + after.scoreB, 24);
  assert.equal(after.scoreB, 4);
});

test('first-to format ends as soon as one side reaches the target', () => {
  const format = { mode: FORMAT_FIRST_TO, points: 16 };
  assert.equal(isMatchComplete({ scoreA: 16, scoreB: 3 }, format), true);
  assert.equal(isMatchComplete({ scoreA: 15, scoreB: 15 }, format), false);
});

test('standings add every point to both partners', () => {
  let t = addRound(make(4, { format: { mode: FORMAT_TOTAL, points: 24 } }), { rng: seeded(5) });
  const m = t.rounds[0].matches[0];
  t = setMatchScore(t, m.id, 'A', 15);
  t = setMatchScore(t, m.id, 'B', 9);

  const table = standings(t);
  const winners = table.filter((r) => m.teamA.includes(r.id));
  const losers = table.filter((r) => m.teamB.includes(r.id));
  assert.deepEqual(winners.map((r) => r.points), [15, 15]);
  assert.deepEqual(losers.map((r) => r.points), [9, 9]);
  assert.deepEqual(winners.map((r) => r.wins), [1, 1]);
  assert.deepEqual(losers.map((r) => r.losses), [1, 1]);
  assert.equal(table[0].points, 15, 'leader first');
  assert.equal(table[0].diff, 6);
});

test('a draw counts for both sides', () => {
  let t = addRound(make(4, { format: { mode: FORMAT_TOTAL, points: 24 } }), { rng: seeded(6) });
  t = playRound(t, 12);
  assert.deepEqual(standings(t).map((r) => r.draws), [1, 1, 1, 1]);
});

test('mexicano seeds court one with ranks 1+4 against 2+3', () => {
  let t = make(8, { type: 'mexicano', format: { mode: FORMAT_TOTAL, points: 24 } });
  t = addRound(t, { rng: seeded(11) });
  // Give each court a clear winner so the standings spread out.
  const first = t.rounds[0];
  t = setMatchScore(t, first.matches[0].id, 'A', 20);
  t = setMatchScore(t, first.matches[0].id, 'B', 4);
  t = setMatchScore(t, first.matches[1].id, 'A', 14);
  t = setMatchScore(t, first.matches[1].id, 'B', 10);

  const ranked = standings(t).map((r) => r.id);
  t = addRound(t, { rng: seeded(12) });
  const court1 = t.rounds[1].matches[0];
  assert.deepEqual([...court1.teamA].sort(), [ranked[0], ranked[3]].sort());
  assert.deepEqual([...court1.teamB].sort(), [ranked[1], ranked[2]].sort());
});

test('helpers', () => {
  assert.equal(maxCourts(4), 1);
  assert.equal(maxCourts(11), 2);
  assert.equal(maxCourts(2), 1);
  assert.equal(suggestedRounds(4), 3);
  assert.equal(suggestedRounds(8), 7);
  assert.equal(suggestedRounds(3), 0);
});
