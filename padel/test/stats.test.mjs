import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStats, headToHead, totals, normalise } from '../js/stats.js';

const finishedMatch = ({ id, winner, a, b, at = 1, points = { A: 60, B: 40 }, sets = { A: 2, B: 0 } }) => ({
  id,
  kind: 'match',
  finished: true,
  winner,
  finishedAt: at,
  teams: { A: { players: a }, B: { players: b } },
  pointsWon: points,
  setsWon: sets,
  rallies: points.A + points.B
});

test('a win is credited to both players of the winning team', () => {
  const rows = buildStats([finishedMatch({ id: '1', winner: 'A', a: ['Sam', 'Noor'], b: ['Ravi', 'Bo'] })]);
  const sam = rows.find((r) => r.name === 'Sam');
  const ravi = rows.find((r) => r.name === 'Ravi');
  assert.equal(sam.wins, 1);
  assert.equal(sam.losses, 0);
  assert.equal(sam.winRate, 1);
  assert.equal(sam.pointsFor, 60);
  assert.equal(sam.pointsAgainst, 40);
  assert.equal(sam.setsFor, 2);
  assert.equal(ravi.losses, 1);
  assert.equal(ravi.pointsFor, 40);
});

test('names are matched case-insensitively but keep their first spelling', () => {
  const rows = buildStats([
    finishedMatch({ id: '1', winner: 'A', a: ['Sam', 'Noor'], b: ['Ravi', 'Bo'], at: 1 }),
    finishedMatch({ id: '2', winner: 'A', a: ['Ravi', 'Bo'], b: ['sam', 'Noor'], at: 2 })
  ]);
  assert.equal(rows.filter((r) => normalise(r.name) === 'sam').length, 1);
  const sam = rows.find((r) => normalise(r.name) === 'sam');
  assert.equal(sam.matches, 2);
  assert.equal(sam.wins, 1);
  assert.equal(sam.losses, 1);
  assert.equal(sam.name, 'Sam');
});

test('unfinished matches are ignored', () => {
  const rows = buildStats([{ ...finishedMatch({ id: '1', winner: 'A', a: ['Sam'], b: ['Bo'] }), finished: false }]);
  assert.deepEqual(rows, []);
});

test('win streaks run chronologically and the best one is kept', () => {
  const history = [
    finishedMatch({ id: '1', winner: 'A', a: ['Sam'], b: ['Bo'], at: 1 }),
    finishedMatch({ id: '2', winner: 'A', a: ['Sam'], b: ['Bo'], at: 2 }),
    finishedMatch({ id: '3', winner: 'A', a: ['Sam'], b: ['Bo'], at: 3 }),
    finishedMatch({ id: '4', winner: 'B', a: ['Sam'], b: ['Bo'], at: 4 })
  ];
  // Deliberately shuffled: buildStats must sort by time itself.
  const rows = buildStats([history[2], history[0], history[3], history[1]]);
  const sam = rows.find((r) => r.name === 'Sam');
  assert.equal(sam.bestStreak, 3);
  assert.equal(sam.streak, -1, 'currently on a one match losing run');
});

test('tournament results add points, a win and a podium', () => {
  const rows = buildStats([
    {
      id: 't1',
      kind: 'tournament',
      finishedAt: 5,
      standings: [
        { name: 'Bo', points: 72, against: 40 },
        { name: 'Sam', points: 60, against: 52 },
        { name: 'Noor', points: 50, against: 60 },
        { name: 'Ravi', points: 30, against: 60 }
      ]
    }
  ]);
  const bo = rows.find((r) => r.name === 'Bo');
  assert.equal(bo.tournamentWins, 1);
  assert.equal(bo.podiums, 1);
  assert.equal(bo.pointsFor, 72);
  assert.equal(rows.find((r) => r.name === 'Ravi').podiums, 0);
  assert.equal(rows.find((r) => r.name === 'Noor').podiums, 1);
});

test('head to head splits partnering from opposing', () => {
  const history = [
    finishedMatch({ id: '1', winner: 'A', a: ['Sam', 'Noor'], b: ['Ravi', 'Bo'] }),
    finishedMatch({ id: '2', winner: 'B', a: ['Sam', 'Ravi'], b: ['Noor', 'Bo'] }),
    finishedMatch({ id: '3', winner: 'A', a: ['Sam', 'Bo'], b: ['Noor', 'Ravi'] })
  ];
  const h2h = headToHead(history, 'Sam', 'Noor');
  assert.equal(h2h.together, 1);
  assert.equal(h2h.togetherWins, 1);
  assert.equal(h2h.against, 2);
  assert.equal(h2h.aWins, 1);
  assert.equal(h2h.bWins, 1);
});

test('totals count matches, tournaments and rallies', () => {
  const t = totals([
    finishedMatch({ id: '1', winner: 'A', a: ['Sam'], b: ['Bo'], points: { A: 50, B: 30 } }),
    { id: 't1', kind: 'tournament', standings: [] }
  ]);
  assert.deepEqual(t, { matches: 1, tournaments: 1, rallies: 80 });
});
