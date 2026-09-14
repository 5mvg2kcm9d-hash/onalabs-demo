/**
 * Player statistics, rebuilt from the archived matches and tournaments.
 * Players are matched on their name, case-insensitively, so "Bo" and "bo" are
 * the same person.
 */

export function normalise(name) {
  return String(name || '').trim().toLowerCase();
}

function blank(name) {
  return {
    key: normalise(name),
    name,
    matches: 0,
    wins: 0,
    losses: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    setsFor: 0,
    setsAgainst: 0,
    tournaments: 0,
    tournamentWins: 0,
    podiums: 0,
    streak: 0,
    bestStreak: 0
  };
}

/**
 * @param {Array} history archived summaries, newest first
 */
export function buildStats(history) {
  const table = new Map();
  const get = (name) => {
    const key = normalise(name);
    if (!key) return null;
    if (!table.has(key)) table.set(key, blank(String(name).trim()));
    return table.get(key);
  };

  // Oldest first so the win streaks read in chronological order.
  const ordered = [...history].sort((a, b) => (a.finishedAt || a.createdAt || 0) - (b.finishedAt || b.createdAt || 0));

  for (const item of ordered) {
    if (item.kind === 'match') applyMatch(item, get);
    else if (item.kind === 'tournament') applyTournament(item, get);
  }

  return [...table.values()]
    .map((row) => ({
      ...row,
      winRate: row.matches ? row.wins / row.matches : 0,
      pointDiff: row.pointsFor - row.pointsAgainst
    }))
    .sort((a, b) => b.wins - a.wins || b.winRate - a.winRate || b.pointDiff - a.pointDiff || a.name.localeCompare(b.name));
}

function applyMatch(item, get) {
  if (!item.finished || !item.winner) return;
  const sides = [
    { team: 'A', players: item.teams?.A?.players || [] },
    { team: 'B', players: item.teams?.B?.players || [] }
  ];
  for (const side of sides) {
    const other = side.team === 'A' ? 'B' : 'A';
    const won = item.winner === side.team;
    for (const name of side.players) {
      const row = get(name);
      if (!row) continue;
      row.matches += 1;
      row.pointsFor += item.pointsWon?.[side.team] || 0;
      row.pointsAgainst += item.pointsWon?.[other] || 0;
      row.setsFor += item.setsWon?.[side.team] || 0;
      row.setsAgainst += item.setsWon?.[other] || 0;
      if (won) {
        row.wins += 1;
        row.streak = row.streak >= 0 ? row.streak + 1 : 1;
        row.bestStreak = Math.max(row.bestStreak, row.streak);
      } else {
        row.losses += 1;
        row.streak = row.streak <= 0 ? row.streak - 1 : -1;
      }
    }
  }
}

function applyTournament(item, get) {
  const table = item.standings || [];
  table.forEach((entry, index) => {
    const row = get(entry.name);
    if (!row) return;
    row.tournaments += 1;
    row.pointsFor += entry.points || 0;
    row.pointsAgainst += entry.against || 0;
    if (index === 0) row.tournamentWins += 1;
    if (index < 3) row.podiums += 1;
  });
}

/** Head to head between two players, counting only regular matches. */
export function headToHead(history, nameA, nameB) {
  const a = normalise(nameA);
  const b = normalise(nameB);
  const result = { together: 0, togetherWins: 0, against: 0, aWins: 0, bWins: 0 };
  for (const item of history) {
    if (item.kind !== 'match' || !item.finished) continue;
    const teamA = (item.teams?.A?.players || []).map(normalise);
    const teamB = (item.teams?.B?.players || []).map(normalise);
    const aIn = teamA.includes(a) ? 'A' : teamB.includes(a) ? 'B' : null;
    const bIn = teamA.includes(b) ? 'A' : teamB.includes(b) ? 'B' : null;
    if (!aIn || !bIn) continue;
    if (aIn === bIn) {
      result.together += 1;
      if (item.winner === aIn) result.togetherWins += 1;
    } else {
      result.against += 1;
      if (item.winner === aIn) result.aWins += 1;
      else result.bWins += 1;
    }
  }
  return result;
}

export function totals(history) {
  const matches = history.filter((h) => h.kind === 'match');
  const tournaments = history.filter((h) => h.kind === 'tournament');
  return {
    matches: matches.length,
    tournaments: tournaments.length,
    rallies: matches.reduce((sum, m) => sum + (m.rallies || 0), 0)
  };
}
