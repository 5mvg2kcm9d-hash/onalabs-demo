import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createMatch,
  computeState,
  addPoint,
  undoPoint,
  scoreline,
  isGameWon,
  isDecidingPoint,
  DEUCE_ADVANTAGE,
  DEUCE_GOLDEN,
  DEUCE_STAR
} from '../js/engine.js';

const match = (config) =>
  createMatch({
    teamA: { players: ['Sam', 'Noor'] },
    teamB: { players: ['Ravi', 'Bo'] },
    config
  });

/** Play a string like "AABBA" onto a match. */
const play = (m, seq) => [...seq].reduce((acc, t) => addPoint(acc, t), m);
/** Win `n` games in a row for `team` (4 straight rallies each). */
const winGames = (m, team, n) => play(m, team.repeat(4 * n));

test('game is won at 40-0 after four rallies', () => {
  const s = computeState(play(match(), 'AAAA'));
  assert.equal(s.games.A, 1);
  assert.equal(s.games.B, 0);
  assert.deepEqual(s.display, { A: '0', B: '0' });
});

test('point labels run 0/15/30/40', () => {
  const labels = ['AAA', 'AA', 'A', ''].map((seq) => computeState(play(match(), seq)).display.A);
  assert.deepEqual(labels, ['40', '30', '15', '0']);
});

test('advantage mode: needs a two point lead', () => {
  const m = match({ deuceMode: DEUCE_ADVANTAGE });
  let s = computeState(play(m, 'AAABBB')); // 40-40
  assert.deepEqual(s.display, { A: '40', B: '40' });
  assert.equal(s.deuce, 1);
  assert.equal(s.decidingPoint, false);

  s = computeState(play(m, 'AAABBBA')); // advantage A
  assert.deepEqual(s.display, { A: 'AD', B: '40' });
  assert.equal(s.games.A, 0, 'advantage must not end the game');

  s = computeState(play(m, 'AAABBBAB')); // back to deuce
  assert.deepEqual(s.display, { A: '40', B: '40' });
  assert.equal(s.deuce, 2);

  s = computeState(play(m, 'AAABBBAA')); // advantage converted
  assert.equal(s.games.A, 1);
});

test('golden point mode: one rally decides at 40-40', () => {
  const m = match({ deuceMode: DEUCE_GOLDEN });
  const s = computeState(play(m, 'AAABBB'));
  assert.equal(s.decidingPoint, true, '40-40 is the golden point');
  assert.equal(computeState(play(m, 'AAABBBA')).games.A, 1);
  assert.equal(computeState(play(m, 'AAABBBB')).games.B, 1);
});

test('golden point does not fire before 40-40', () => {
  assert.equal(computeState(play(match({ deuceMode: DEUCE_GOLDEN }), 'AAABB')).decidingPoint, false);
});

test('star point: two advantages, then sudden death at the third deuce', () => {
  const m = match({ deuceMode: DEUCE_STAR });
  let s = computeState(play(m, 'AAABBB')); // deuce 1
  assert.equal(s.deuce, 1);
  assert.equal(s.decidingPoint, false);

  s = computeState(play(m, 'AAABBB' + 'AB')); // deuce 2
  assert.equal(s.deuce, 2);
  assert.equal(s.decidingPoint, false);

  s = computeState(play(m, 'AAABBB' + 'AB' + 'AB')); // deuce 3 -> star point
  assert.equal(s.deuce, 3);
  assert.equal(s.decidingPoint, true, 'third deuce is the star point');

  s = computeState(play(m, 'AAABBB' + 'AB' + 'AB' + 'A'));
  assert.equal(s.games.A, 1, 'star point ends the game');
});

test('star point: an advantage at deuce 2 still wins normally', () => {
  const m = match({ deuceMode: DEUCE_STAR });
  assert.equal(computeState(play(m, 'AAABBB' + 'AB' + 'AA')).games.A, 1);
});

test('isGameWon / isDecidingPoint edge cases', () => {
  assert.equal(isGameWon(4, 2, DEUCE_ADVANTAGE), true);
  assert.equal(isGameWon(4, 3, DEUCE_ADVANTAGE), false);
  assert.equal(isGameWon(4, 3, DEUCE_GOLDEN), true);
  assert.equal(isGameWon(4, 3, DEUCE_STAR), false);
  assert.equal(isGameWon(6, 5, DEUCE_STAR), true);
  assert.equal(isGameWon(3, 0, DEUCE_ADVANTAGE), false);
  assert.equal(isDecidingPoint(3, 3, DEUCE_ADVANTAGE), false);
  assert.equal(isDecidingPoint(5, 5, DEUCE_STAR), true);
});

test('set is won at 6-4', () => {
  // interleaved to 4-4, then A takes the last two games
  let m = match();
  for (let i = 0; i < 4; i++) m = winGames(winGames(m, 'A', 1), 'B', 1);
  const s = computeState(winGames(m, 'A', 2));
  assert.equal(s.setsWon.A, 1);
  assert.deepEqual(s.completedSets[0], { A: 6, B: 4 });
  assert.equal(s.games.A, 0, 'games reset for the next set');
});

test('5-5 does not end the set, 7-5 does', () => {
  let m = match();
  for (let i = 0; i < 5; i++) m = winGames(winGames(m, 'A', 1), 'B', 1);
  assert.equal(computeState(m).setsWon.A, 0);
  m = winGames(m, 'A', 2);
  assert.equal(computeState(m).setsWon.A, 1);
  assert.deepEqual(computeState(m).completedSets[0], { A: 7, B: 5 });
});

test('6-6 starts a tiebreak to 7, won by two', () => {
  let m = match();
  for (let i = 0; i < 6; i++) m = winGames(winGames(m, 'A', 1), 'B', 1);
  let s = computeState(m);
  assert.equal(s.inTiebreak, true);
  assert.equal(s.tiebreakTarget, 7);

  s = computeState(play(m, 'AAAAAABBBBBB')); // 6-6 in the tiebreak
  assert.deepEqual(s.display, { A: '6', B: '6' });
  assert.equal(s.setsWon.A, 0, '7-6 is not enough');

  s = computeState(play(m, 'AAAAAABBBBBB' + 'AA'));
  assert.equal(s.setsWon.A, 1);
  assert.deepEqual(s.completedSets[0], { A: 7, B: 6, tiebreak: { A: 8, B: 6 } });
});

test('deciding set is a super tiebreak to 10 when enabled', () => {
  let m = match({ bestOf: 3, finalSetSuperTiebreak: true });
  m = winGames(m, 'A', 6); // set 1 to A
  m = winGames(m, 'B', 6); // set 2 to B
  let s = computeState(m);
  assert.equal(s.setsWon.A, 1);
  assert.equal(s.setsWon.B, 1);
  assert.equal(s.isSuperTiebreak, true);
  assert.equal(s.tiebreakTarget, 10);

  s = computeState(play(m, 'A'.repeat(10)));
  assert.equal(s.finished, true);
  assert.equal(s.winner, 'A');
  assert.deepEqual(s.completedSets[2], { A: 10, B: 0, superTiebreak: true });
});

test('deciding set is a normal set when the super tiebreak is off', () => {
  let m = match({ bestOf: 3, finalSetSuperTiebreak: false });
  m = winGames(winGames(m, 'A', 6), 'B', 6);
  const s = computeState(m);
  assert.equal(s.isSuperTiebreak, false);
  assert.equal(s.inTiebreak, false);
});

test('match ends after two sets and ignores further rallies', () => {
  let m = winGames(winGames(match(), 'A', 6), 'A', 6);
  const s = computeState(m);
  assert.equal(s.finished, true);
  assert.equal(s.winner, 'A');
  const after = addPoint(m, 'B');
  assert.equal(after.points.length, m.points.length, 'no rallies after match point');
});

test('best of one plays a single set', () => {
  const s = computeState(winGames(match({ bestOf: 1 }), 'A', 6));
  assert.equal(s.finished, true);
});

test('serve rotates A1 -> B1 -> A2 -> B2 and sides alternate', () => {
  let m = match();
  const slots = [];
  for (let i = 0; i < 5; i++) {
    slots.push(computeState(m).serve);
    m = winGames(m, 'A', 1);
  }
  assert.deepEqual(
    slots.map((s) => `${s.team}${s.player}`),
    ['A0', 'B0', 'A1', 'B1', 'A0']
  );
  assert.equal(computeState(match()).serve.side, 'right');
  assert.equal(computeState(play(match(), 'A')).serve.side, 'left');
});

test('tiebreak serve: one rally, then two each', () => {
  let m = match();
  for (let i = 0; i < 6; i++) m = winGames(winGames(m, 'A', 1), 'B', 1);
  const seen = [0, 1, 2, 3, 4].map((n) => {
    const s = computeState(play(m, 'A'.repeat(n))).serve;
    return `${s.team}${s.player}`;
  });
  assert.deepEqual(seen, ['A0', 'B0', 'B0', 'A1', 'A1']);
});

test('change ends after odd games and every six tiebreak rallies', () => {
  assert.equal(computeState(winGames(match(), 'A', 1)).changeEnds, true);
  assert.equal(computeState(winGames(match(), 'A', 2)).changeEnds, false);
  assert.equal(computeState(play(winGames(match(), 'A', 1), 'A')).changeEnds, false, 'only at the start of the game');

  let m = match();
  for (let i = 0; i < 6; i++) m = winGames(winGames(m, 'A', 1), 'B', 1);
  assert.equal(computeState(play(m, 'AAABBB')).changeEnds, true);
  assert.equal(computeState(play(m, 'AAABB')).changeEnds, false);
});

test('undo removes exactly one rally and reopens a finished match', () => {
  const m = play(match(), 'AAB');
  const back = undoPoint(m);
  assert.equal(back.points.length, 2);
  assert.deepEqual(computeState(back).display, { A: '30', B: '0' });

  const done = winGames(winGames(match(), 'A', 6), 'A', 6);
  assert.equal(computeState(undoPoint(done)).finished, false);
  assert.deepEqual(undoPoint(createMatch({})).points, []);
});

test('undo unwinds a completed set', () => {
  const m = winGames(match(), 'A', 6);
  assert.equal(computeState(m).setsWon.A, 1);
  const back = undoPoint(m);
  const s = computeState(back);
  assert.equal(s.setsWon.A, 0);
  assert.equal(s.games.A, 5);
  assert.deepEqual(s.display, { A: '40', B: '0' });
});

test('scoreline reads as sets, newest last', () => {
  let m = winGames(match({ finalSetSuperTiebreak: false }), 'A', 6);
  m = winGames(winGames(m, 'B', 6), 'A', 3);
  assert.equal(scoreline(m), '6-0 0-6 3-0');
  assert.equal(scoreline(createMatch({})), '0-0');
});

test('points won are tallied for both teams', () => {
  const s = computeState(play(match(), 'AABAB'));
  assert.deepEqual(s.pointsWon, { A: 3, B: 2 });
});
