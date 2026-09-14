/**
 * Every screen, as a pure function from state to an HTML string.
 * Interaction happens through data-action attributes; app.js does the wiring.
 * All display text comes from i18n.js -- no literal copy lives here.
 */

import { html, raw, when, esc, percent } from './dom.js';
import { t, formatDate, LANGUAGES, getLanguage, languageName, detectLanguage } from './i18n.js';
import { DEUCE_MODE_IDS, computeState, scoreline } from './engine.js';
import { standings, isMatchComplete, scoreLimits, roundComplete, FORMAT_TOTAL, FORMAT_FIRST_TO } from './tournament.js';

const BACK = '‹';

/** Teams may be unnamed; fall back to the players, then to "Team 1"/"Team 2". */
function teamLabel(teams, team) {
  const info = teams ? teams[team] : null;
  const named = info && info.name ? info.name : '';
  const fromPlayers = ((info && info.players) || []).filter(Boolean).join(' & ');
  return named || fromPlayers || t('match.team', { n: team === 'A' ? 1 : 2 });
}

function tournamentLabel(tournament) {
  return tournament.name || t(tournament.type === 'mexicano' ? 'tour.mexicano' : 'tour.americano');
}

export function topbar(title, { back = null, right = '' } = {}) {
  return html`
    <header class="topbar">
      ${back
        ? raw(`<button class="icon-btn ghost" data-action="nav" data-href="${esc(back)}" aria-label="${esc(t('a11y.back'))}">${BACK}</button>`)
        : raw('<span style="min-width:44px"></span>')}
      <h1>${title}</h1>
      ${raw(right || '<span style="min-width:44px"></span>')}
    </header>
  `;
}

// ---------------------------------------------------------------- home

export function homeView({ live, history, totals }) {
  const recent = history.slice(0, 3);
  const settings = `<button class="icon-btn ghost" data-action="nav" data-href="#/settings" aria-label="${esc(t('a11y.settings'))}">⚙︎</button>`;

  return html`
    ${raw(topbar(t('app.title'), { right: settings }))}
    <main class="screen">
      <div class="hero">
        <p>${t('home.tagline')}</p>
      </div>

      ${when(live, () => resumeTile(live))}

      <button class="tile" data-action="nav" data-href="#/new">
        <span class="tile-icon">🎾</span>
        <span class="tile-body">
          <strong>${t('home.newMatch')}</strong>
          <span>${t('home.newMatchSub')}</span>
        </span>
      </button>

      <button class="tile alt" data-action="nav" data-href="#/tournament/new">
        <span class="tile-icon">🏆</span>
        <span class="tile-body">
          <strong>${t('home.tournament')}</strong>
          <span>${t('home.tournamentSub')}</span>
        </span>
      </button>

      <div class="grid-2">
        <button class="tile compact" data-action="nav" data-href="#/history">
          <span class="tile-body">
            <strong>${t('home.history')}</strong>
            <span>${t('home.played', { count: totals.matches + totals.tournaments })}</span>
          </span>
        </button>
        <button class="tile compact" data-action="nav" data-href="#/stats">
          <span class="tile-body">
            <strong>${t('home.stats')}</strong>
            <span>${t('home.statsSub')}</span>
          </span>
        </button>
      </div>

      ${when(recent.length > 0, () => html`
        <div class="card-title" style="margin-top:6px">${t('home.recent')}</div>
        <div class="list">${recent.map(historyRow)}</div>
      `)}

      <button class="icon-btn ghost" data-action="nav" data-href="#/players" style="align-self:center;margin-top:4px">
        ${t('home.players')}
      </button>
    </main>
  `;
}

function resumeTile(live) {
  const isMatch = live.kind === 'match';
  const label = isMatch
    ? `${teamLabel(live.teams, 'A')} vs ${teamLabel(live.teams, 'B')}`
    : `${tournamentLabel(live)} · ${t('tour.round', { n: live.rounds.length })}`;
  const sub = isMatch ? scoreline(live) : t('tour.playerCount', { count: live.players.length });
  return html`
    <button class="tile resume" data-action="nav" data-href="${isMatch ? '#/match' : '#/tournament'}">
      <span class="tile-icon">⏱️</span>
      <span class="tile-body">
        <strong>${t('home.resume', { label })}</strong>
        <span>${sub}</span>
      </span>
    </button>
  `;
}

// ---------------------------------------------------------------- new match

export function newMatchView({ draft, players }) {
  const datalist = `<datalist id="roster">${players.map((p) => `<option value="${esc(p.name)}"></option>`).join('')}</datalist>`;
  const hint = t(`deuce.${draft.config.deuceMode}.hint`);

  return html`
    ${raw(topbar(t('match.new'), { back: '#/' }))}
    <main class="screen">
      ${raw(datalist)}

      <div class="card">
        <div class="card-title">${t('match.team', { n: 1 })}</div>
        ${raw(nameInput('a0', draft.teamA[0], t('match.player', { n: 1 })))}
        ${raw(nameInput('a1', draft.teamA[1], t('match.player', { n: 2 })))}
      </div>

      <button class="icon-btn" data-action="swap-teams" style="align-self:center">⇅ ${t('match.swap')}</button>

      <div class="card">
        <div class="card-title">${t('match.team', { n: 2 })}</div>
        ${raw(nameInput('b0', draft.teamB[0], t('match.player', { n: 3 })))}
        ${raw(nameInput('b1', draft.teamB[1], t('match.player', { n: 4 })))}
      </div>

      <div class="card">
        <div class="card-title">${t('match.format')}</div>

        <div class="field">
          <label>${t('match.sets')}</label>
          ${raw(segmented('bestOf', [
            { value: 1, label: t('match.oneSet') },
            { value: 3, label: t('match.bestOf', { n: 3 }) },
            { value: 5, label: t('match.bestOf', { n: 5 }) }
          ], draft.config.bestOf))}
        </div>

        <div class="field">
          <label>${t('match.gamesPerSet')}</label>
          ${raw(segmented('gamesPerSet', [4, 6, 9].map((v) => ({ value: v, label: String(v) })), draft.config.gamesPerSet))}
        </div>

        <div class="field">
          <label>${t('match.atDeuce')}</label>
          ${raw(segmented('deuceMode', DEUCE_MODE_IDS.map((id) => ({ value: id, label: t(`deuce.${id}`) })), draft.config.deuceMode))}
          <p class="faint">${hint}</p>
        </div>

        ${when(draft.config.bestOf > 1, () => html`
          <div class="switch-row">
            <span class="label">${t('match.superTiebreak')}
              <span class="faint" style="display:block;font-weight:400">${t('match.superTiebreakSub')}</span>
            </span>
            ${raw(toggle('finalSetSuperTiebreak', draft.config.finalSetSuperTiebreak))}
          </div>
        `)}
      </div>

      <button class="btn btn-primary" data-action="start-match">${t('match.start')}</button>
      <p class="faint" style="text-align:center">${t('match.namesOptional')}</p>
    </main>
  `;
}

function nameInput(key, value, placeholder) {
  return `<input type="text" list="roster" autocomplete="off" autocapitalize="words"
    data-action="draft-name" data-key="${key}" value="${esc(value || '')}"
    placeholder="${esc(placeholder)}" aria-label="${esc(placeholder)}">`;
}

function segmented(key, options, current) {
  const buttons = options
    .map(
      (o) =>
        `<button type="button" data-action="draft-set" data-key="${key}" data-value="${esc(o.value)}"
          aria-pressed="${String(o.value) === String(current)}">${esc(o.label)}</button>`
    )
    .join('');
  return `<div class="segmented" role="group">${buttons}</div>`;
}

function toggle(key, on) {
  return `<button type="button" class="toggle" data-action="draft-toggle" data-key="${key}"
    aria-pressed="${on ? 'true' : 'false'}" aria-label="${esc(t('a11y.toggle'))}"><span></span></button>`;
}

// ---------------------------------------------------------------- live match

export function matchView(match) {
  const state = computeState(match);

  return html`
    ${raw(topbar(state.finished ? t('live.result') : t('live.match'), { back: '#/' }))}
    <main class="board">
      <div class="setline">
        ${state.completedSets.map((s, i) => html`<span class="set">${t('live.setScore', { n: i + 1, a: s.A, b: s.B })}</span>`)}
        ${when(state.completedSets.length === 0, () => html`<span class="set">${t('live.firstSet')}</span>`)}
      </div>

      ${matchBanner(match, state)}

      <div class="teams">
        ${raw(teamPanel('A', match, state))}
        ${raw(teamPanel('B', match, state))}
      </div>

      ${state.finished
        ? html`
          <div class="board-actions">
            <button class="btn" data-action="undo">↩ ${t('live.keepPlaying')}</button>
            <button class="btn btn-accent" data-action="finish-match">${t('live.save')}</button>
          </div>`
        : html`
          <p class="tap-hint">${t('live.tapHint')}</p>
          <div class="board-actions">
            <button class="btn" data-action="abandon-match">${t('live.stop')}</button>
            <button class="btn" data-action="undo" ${raw(match.points.length ? '' : 'disabled')}>↩ ${t('live.undo')}</button>
          </div>`}
    </main>
  `;
}

function matchBanner(match, state) {
  if (state.finished) {
    return html`<div class="banner">🏆 ${t('live.wins', { team: teamLabel(match.teams, state.winner) })}</div>`;
  }
  if (state.decidingPoint) {
    const label = t(`deuce.${state.config.deuceMode}`);
    return html`<div class="banner hot">⭐ ${t('live.deciding', { label })}</div>`;
  }
  if (state.inTiebreak) {
    const kind = t(state.isSuperTiebreak ? 'live.superTiebreak' : 'live.tiebreak', { n: state.tiebreakTarget });
    return html`<div class="banner">${kind}${state.changeEnds ? ` · ${t('live.changeEndsShort')}` : ''}</div>`;
  }
  if (state.changeEnds) {
    return html`<div class="banner">🔄 ${t('live.changeEnds')}</div>`;
  }
  if (state.deuce > 1) {
    return html`<div class="banner calm">${t('live.deuce', { n: state.deuce })}</div>`;
  }
  if (!state.serve) return html`<div class="banner calm"></div>`;
  return html`<div class="banner calm">${t('live.serving', {
    team: t('live.teamShort', { n: state.serve.team === 'A' ? 1 : 2 }),
    side: t(`live.${state.serve.side}`)
  })}</div>`;
}

function teamPanel(team, match, state) {
  const label = teamLabel(match.teams, team);
  const given = (match.teams[team].players || []).filter(Boolean);
  const players = given.length ? given : [t('match.player', { n: team === 'A' ? 1 : 3 }), t('match.player', { n: team === 'A' ? 2 : 4 })];
  const serving = state.serve && state.serve.team === team ? state.serve.player : -1;
  const isWinner = state.finished && state.winner === team;

  const playerRows = players
    .map((name, i) => {
      const on = i === serving;
      return `<span class="player${on ? ' serving' : ''}"><span class="serve-dot"></span>${esc(name)}${
        on ? ` <span class="sr-only">${esc(t('a11y.serving'))}</span>` : ''
      }</span>`;
    })
    .join('');

  const games = state.games[team];
  const sets = state.setsWon[team];
  const setPart = sets ? ` · <b>${sets}</b> ${esc(t('live.sets', { count: sets }))}` : '';

  return `
    <button class="team-panel ${team.toLowerCase()}${isWinner ? ' winner' : ''}"
      data-action="score" data-team="${team}" ${state.finished ? 'disabled' : ''}
      aria-label="${esc(t('a11y.pointFor', { team: label }))}">
      <span class="team-meta">
        <span class="team-name">${esc(label)}</span>
        <span class="team-players">${playerRows}</span>
        <span class="team-games">
          <b>${games}</b> ${esc(t('live.games', { count: games }))}${setPart}
        </span>
      </span>
      <span class="team-score${state.inTiebreak ? ' small' : ''}">${esc(state.display[team])}</span>
    </button>`;
}

// ---------------------------------------------------------------- new tournament

export function newTournamentView({ draft, players }) {
  const selected = draft.players;
  const canStart = selected.length >= 4;
  const courtsMax = Math.max(1, Math.floor(selected.length / 4));
  const resting = selected.length - courtsMax * 4;

  return html`
    ${raw(topbar(t('tour.new'), { back: '#/' }))}
    <main class="screen">
      <div class="card">
        <div class="card-title">${t('tour.format')}</div>
        ${raw(segmented('type', [
          { value: 'americano', label: t('tour.americano') },
          { value: 'mexicano', label: t('tour.mexicano') }
        ], draft.type))}
        <p class="faint">${t(draft.type === 'mexicano' ? 'tour.mexicanoHint' : 'tour.americanoHint')}</p>
      </div>

      <div class="card">
        <div class="card-title">${t('tour.players', { count: selected.length })}</div>
        <div class="stack">
          ${players.map((p) => html`
            <button class="pick" data-action="toggle-player" data-id="${p.id}" aria-pressed="${selected.some((s) => s.id === p.id)}">
              <span class="tickbox">${raw(selected.some((s) => s.id === p.id) ? '✓' : '')}</span>
              <span class="grow">${p.name}</span>
            </button>
          `)}
        </div>
        ${when(players.length === 0, () => html`<p class="faint">${t('tour.noPlayers')}</p>`)}
        <form data-action="add-player-form" class="btn-row" style="margin-top:10px">
          <input type="text" name="name" placeholder="${esc(t('tour.addName'))}" autocomplete="off" autocapitalize="words" aria-label="${esc(t('tour.addName'))}">
          <button type="submit" class="btn" style="flex:0 0 auto;width:auto;padding:0 18px">+</button>
        </form>
      </div>

      <div class="card">
        <div class="card-title">${t('tour.courts')}</div>
        ${raw(segmented('courts', Array.from({ length: courtsMax }, (_, i) => ({ value: i + 1, label: `${i + 1}` })), Math.min(draft.courts, courtsMax)))}
        <p class="faint">
          ${resting <= 0
            ? t('tour.everyonePlays')
            : t('tour.resting', { count: t('tour.playerCount', { count: resting }) })}
        </p>
      </div>

      <div class="card">
        <div class="card-title">${t('tour.pointsPerRound')}</div>
        ${raw(segmented('formatMode', [
          { value: FORMAT_TOTAL, label: t('tour.total') },
          { value: FORMAT_FIRST_TO, label: t('tour.firstTo') }
        ], draft.format.mode))}
        ${raw(segmented('formatPoints', [16, 21, 24, 32].map((v) => ({ value: v, label: String(v) })), draft.format.points))}
        <p class="faint">
          ${t(draft.format.mode === FORMAT_TOTAL ? 'tour.totalHint' : 'tour.firstToHint', { points: draft.format.points })}
        </p>
      </div>

      <button class="btn btn-primary" data-action="start-tournament" ${raw(canStart ? '' : 'disabled')}>
        ${canStart ? t('tour.start') : t('tour.needFour')}
      </button>
    </main>
  `;
}

// ---------------------------------------------------------------- live tournament

export function tournamentView(tournament) {
  const round = tournament.rounds[tournament.rounds.length - 1];
  const table = standings(tournament);
  const done = round ? roundComplete(round, tournament.format) : false;
  const names = new Map(tournament.players.map((p) => [p.id, p.name]));
  const name = (id) => names.get(id) || '?';

  return html`
    ${raw(topbar(tournamentLabel(tournament), { back: '#/' }))}
    <main class="screen">
      <div class="chip-row">
        <span class="chip">${t('tour.round', { n: round ? round.number : 0 })}</span>
        <span class="chip">${t('tour.playerCount', { count: tournament.players.length })}</span>
        <span class="chip">${t(tournament.format.mode === FORMAT_TOTAL ? 'tour.chipTotal' : 'tour.chipFirstTo', { n: tournament.format.points })}</span>
      </div>

      ${when(round && round.sitOut.length > 0, () =>
        html`<div class="banner calm">${t('tour.restingNow', { names: round.sitOut.map(name).join(', ') })}</div>`)}

      ${round ? raw(round.matches.map((m) => matchCard(m, tournament, name)).join('')) : raw('')}

      <div class="btn-row">
        <button class="btn ${done ? 'btn-primary' : ''}" data-action="next-round" ${raw(done ? '' : 'disabled')}>
          ${done ? t('tour.nextRound') : t('tour.fillScores')}
        </button>
      </div>

      <div class="card">
        <div class="card-title">${t('tour.standings')}</div>
        ${raw(standingsTable(table))}
      </div>

      <div class="btn-row">
        <button class="btn" data-action="abandon-tournament">${t('tour.stop')}</button>
        <button class="btn btn-accent" data-action="finish-tournament">${t('tour.finish')}</button>
      </div>
    </main>
  `;
}

function matchCard(match, tournament, name) {
  const limits = scoreLimits(match, tournament.format);
  const complete = isMatchComplete(match, tournament.format);
  const played = match.scoreA + match.scoreB;

  const side = (team) => {
    const ids = team === 'A' ? match.teamA : match.teamB;
    const score = team === 'A' ? match.scoreA : match.scoreB;
    return `
      <div class="match-side">
        <span class="names">${ids.map(name).map(esc).join(' &amp; ')}</span>
        <span class="stepper">
          <button data-action="tscore" data-match="${match.id}" data-team="${team}" data-delta="-1"
            ${score <= 0 ? 'disabled' : ''} aria-label="−">−</button>
          <span class="value">${score}</span>
          <button data-action="tscore" data-match="${match.id}" data-team="${team}" data-delta="1"
            ${score >= limits[team] ? 'disabled' : ''} aria-label="+">+</button>
        </span>
      </div>`;
  };

  return `
    <div class="match-card${complete ? ' done' : ''}">
      <div class="match-head">
        <span>${esc(t('tour.court', { n: match.court }))}</span>
        <span>${esc(complete ? t('tour.done') : t('tour.pointsSoFar', { count: played }))}</span>
      </div>
      ${side('A')}
      ${side('B')}
    </div>`;
}

function standingsTable(table) {
  if (!table.length) return `<p class="faint">${esc(t('tour.noPoints'))}</p>`;
  const rows = table
    .map(
      (r, i) => `
      <tr${i === 0 && r.points > 0 ? ' class="leader"' : ''}>
        <td>${i + 1}</td>
        <td>${esc(r.name)}</td>
        <td>${r.wins}</td>
        <td>${r.diff > 0 ? '+' : ''}${r.diff}</td>
        <td><b>${r.points}</b></td>
      </tr>`
    )
    .join('');
  return `<div class="scroll-x"><table>
    <thead><tr>
      <th>${esc(t('table.rank'))}</th><th>${esc(t('table.player'))}</th>
      <th>${esc(t('table.won'))}</th><th>${esc(t('table.diff'))}</th><th>${esc(t('table.points'))}</th>
    </tr></thead>
    <tbody>${rows}</tbody></table></div>`;
}

// ---------------------------------------------------------------- history

export function historyView(history) {
  return html`
    ${raw(topbar(t('hist.title'), { back: '#/' }))}
    <main class="screen">
      ${history.length === 0
        ? html`<div class="empty">${t('hist.empty')}</div>`
        : html`<div class="list">${history.map(historyRow)}</div>`}
    </main>
  `;
}

export function historyRow(item) {
  if (item.kind === 'tournament') {
    return html`
      <button class="list-item" data-action="nav" data-href="#/history/${item.id}">
        <span class="grow">
          <strong>🏆 ${tournamentLabel(item)}</strong>
          <span class="sub">${formatDate(item.finishedAt || item.createdAt)} · ${t('tour.rounds', { count: item.rounds })}</span>
        </span>
        <span class="score-badge">${item.leader ? item.leader.name : '—'}</span>
      </button>
    `;
  }
  const status = item.finished
    ? t('hist.won', { name: teamLabel(item.teams, item.winner) })
    : t('hist.abandoned');
  return html`
    <button class="list-item" data-action="nav" data-href="#/history/${item.id}">
      <span class="grow">
        <strong>${teamLabel(item.teams, 'A')} vs ${teamLabel(item.teams, 'B')}</strong>
        <span class="sub">${formatDate(item.finishedAt || item.createdAt)} · ${status}</span>
      </span>
      <span class="score-badge">${item.scoreline}</span>
    </button>
  `;
}

export function historyDetailView(item) {
  const remove = `<button class="icon-btn ghost" data-action="delete-history" data-id="${esc(item.id)}" aria-label="${esc(t('a11y.delete'))}">🗑</button>`;

  if (item.kind === 'tournament') {
    return html`
      ${raw(topbar(tournamentLabel(item), { back: '#/history', right: remove }))}
      <main class="screen">
        <div class="chip-row">
          <span class="chip">${t(item.type === 'mexicano' ? 'tour.mexicano' : 'tour.americano')}</span>
          <span class="chip">${t('tour.rounds', { count: item.rounds })}</span>
          <span class="chip">${formatDate(item.finishedAt || item.createdAt)}</span>
        </div>
        <div class="card">
          <div class="card-title">${t('hist.finalStandings')}</div>
          ${raw(standingsTable(item.standings || []))}
        </div>
      </main>
    `;
  }

  const sets = (item.setsDetail || []).map((s, i) => html`<span class="set">${t('live.setScore', { n: i + 1, a: s.A, b: s.B })}</span>`);
  const summary = item.finished
    ? t('hist.wonWith', { name: teamLabel(item.teams, item.winner), score: item.scoreline })
    : t('hist.abandonedAt', { score: item.scoreline });

  return html`
    ${raw(topbar(t('hist.match'), { back: '#/history', right: remove }))}
    <main class="screen">
      <div class="card">
        <div class="card-title">${formatDate(item.finishedAt || item.createdAt)}</div>
        <h2>${teamLabel(item.teams, 'A')}<span class="muted"> vs </span>${teamLabel(item.teams, 'B')}</h2>
        <div class="setline" style="justify-content:flex-start">${sets}</div>
        <p class="muted">${summary}</p>
      </div>
      <div class="grid-2">
        <div class="stat"><b>${item.pointsWon.A}–${item.pointsWon.B}</b><span>${t('hist.pointsWon')}</span></div>
        <div class="stat"><b>${item.rallies}</b><span>${t('hist.rallies')}</span></div>
      </div>
    </main>
  `;
}

// ---------------------------------------------------------------- stats

export function statsView({ rows, totals }) {
  const withTournaments = rows.filter((r) => r.tournaments > 0);
  const streaks = rows.filter((r) => r.bestStreak > 1).slice(0, 6);

  return html`
    ${raw(topbar(t('stats.title'), { back: '#/' }))}
    <main class="screen">
      <div class="grid-2">
        <div class="stat"><b>${totals.matches}</b><span>${t('stats.matches')}</span></div>
        <div class="stat"><b>${totals.tournaments}</b><span>${t('stats.tournaments')}</span></div>
      </div>

      ${rows.length === 0
        ? html`<div class="empty">${t('stats.empty')}</div>`
        : html`
          <div class="card">
            <div class="card-title">${t('stats.ranking')}</div>
            <div class="scroll-x">
              <table>
                <thead><tr>
                  <th>${t('table.rank')}</th><th>${t('table.player')}</th><th>${t('table.won')}</th>
                  <th>${t('table.lost')}</th><th>${t('table.percent')}</th><th>${t('table.streak')}</th>
                </tr></thead>
                <tbody>
                  ${rows.map((r, i) => html`
                    <tr${raw(i === 0 ? ' class="leader"' : '')}>
                      <td>${i + 1}</td>
                      <td>${r.name}</td>
                      <td>${r.wins}</td>
                      <td>${r.losses}</td>
                      <td>${percent(r.winRate)}</td>
                      <td>${r.streak > 0
                        ? t('stats.streakWon', { n: r.streak })
                        : r.streak < 0
                          ? t('stats.streakLost', { n: -r.streak })
                          : '—'}</td>
                    </tr>
                  `)}
                </tbody>
              </table>
            </div>
          </div>

          <div class="card">
            <div class="card-title">${t('stats.tournamentTable')}</div>
            ${withTournaments.length === 0
              ? html`<p class="faint">${t('stats.noTournaments')}</p>`
              : html`
                <div class="scroll-x">
                  <table>
                    <thead><tr>
                      <th>${t('table.rank')}</th><th>${t('table.player')}</th><th>${t('table.played')}</th>
                      <th>${t('table.podium')}</th><th>${t('table.wins')}</th>
                    </tr></thead>
                    <tbody>
                      ${withTournaments.map((r, i) => html`
                        <tr><td>${i + 1}</td><td>${r.name}</td><td>${r.tournaments}</td><td>${r.podiums}</td><td>${r.tournamentWins}</td></tr>
                      `)}
                    </tbody>
                  </table>
                </div>`}
          </div>

          <div class="card">
            <div class="card-title">${t('stats.bestStreak')}</div>
            ${streaks.length === 0
              ? html`<p class="faint">${t('stats.noStreak')}</p>`
              : html`<div class="chip-row">${streaks.map((r) => html`<span class="chip">${r.name} · ${r.bestStreak}×</span>`)}</div>`}
          </div>
        `}
    </main>
  `;
}

// ---------------------------------------------------------------- players

export function playersView(players) {
  return html`
    ${raw(topbar(t('players.title'), { back: '#/' }))}
    <main class="screen">
      <form data-action="add-player-form" class="btn-row">
        <input type="text" name="name" placeholder="${esc(t('players.name'))}" autocomplete="off" autocapitalize="words" aria-label="${esc(t('players.name'))}">
        <button type="submit" class="btn btn-primary" style="flex:0 0 auto;width:auto;padding:0 20px">${t('players.add')}</button>
      </form>

      ${players.length === 0
        ? html`<div class="empty">${t('players.empty')}</div>`
        : html`
          <div class="list">
            ${players.map((p) => html`
              <div class="list-item">
                <span class="grow"><strong>${p.name}</strong></span>
                <button class="icon-btn ghost" data-action="remove-player" data-id="${p.id}" aria-label="${esc(t('a11y.removePlayer', { name: p.name }))}">🗑</button>
              </div>
            `)}
          </div>
        `}
    </main>
  `;
}

// ---------------------------------------------------------------- settings

export function settingsView({ settings, storageOk }) {
  const chosen = settings.language || 'auto';
  const option = (id, label, sub) => html`
    <button class="pick" data-action="set-language" data-id="${id}" aria-pressed="${chosen === id}">
      <span class="tickbox">${raw(chosen === id ? '✓' : '')}</span>
      <span class="grow">${label}${when(sub, () => html`<span class="faint" style="display:block">${sub}</span>`)}</span>
    </button>
  `;

  return html`
    ${raw(topbar(t('set.title'), { back: '#/' }))}
    <main class="screen">
      ${when(!storageOk, () => html`<div class="banner hot">${t('set.noStorage')}</div>`)}

      <div class="card">
        <div class="card-title">${t('set.language')}</div>
        <div class="stack">
          ${option('auto', t('set.languageAuto'), t('set.languageAutoSub', { name: languageName(detectLanguage()) }))}
          ${LANGUAGES.map((l) => option(l.id, l.name, ''))}
        </div>
      </div>

      <div class="card">
        <div class="switch-row">
          <span class="label">${t('set.keepAwake')}
            <span class="faint" style="display:block;font-weight:400">${t('set.keepAwakeSub')}</span>
          </span>
          ${raw(toggle('keepAwake', settings.keepAwake))}
        </div>
        <div class="switch-row">
          <span class="label">${t('set.haptics')}
            <span class="faint" style="display:block;font-weight:400">${t('set.hapticsSub')}</span>
          </span>
          ${raw(toggle('haptics', settings.haptics))}
        </div>
      </div>

      <div class="card">
        <div class="card-title">${t('set.backup')}</div>
        <p class="faint">${t('set.backupHint')}</p>
        <div class="btn-row">
          <button class="btn" data-action="export">${t('set.export')}</button>
          <button class="btn" data-action="import">${t('set.import')}</button>
        </div>
        <input type="file" accept="application/json,.json" data-action="import-file" hidden>
      </div>

      <div class="card">
        <div class="card-title">${t('set.cleanup')}</div>
        <button class="btn btn-danger" data-action="clear-history">${t('set.clearHistory')}</button>
      </div>

      <p class="faint" style="text-align:center">
        ${t('set.footer')}<br>
        ${t('set.install')}
      </p>
    </main>
  `;
}
