/**
 * Every screen, as a pure function from state to an HTML string.
 * Interaction happens through data-action attributes; app.js does the wiring.
 */

import { html, raw, when, esc, formatDate, plural, percent } from './dom.js';
import { DEUCE_MODES, computeState, scoreline } from './engine.js';
import { standings, isMatchComplete, scoreLimits, roundComplete, FORMAT_TOTAL, FORMAT_FIRST_TO } from './tournament.js';

const BACK = '‹';

export function topbar(title, { back = null, right = '' } = {}) {
  return html`
    <header class="topbar">
      ${back
        ? raw(`<button class="icon-btn ghost" data-action="nav" data-href="${esc(back)}" aria-label="Terug">${BACK}</button>`)
        : raw('<span style="min-width:44px"></span>')}
      <h1>${title}</h1>
      ${raw(right || '<span style="min-width:44px"></span>')}
    </header>
  `;
}

// ---------------------------------------------------------------- home

export function homeView({ live, history, totals }) {
  const recent = history.slice(0, 3);
  return html`
    ${raw(topbar('Padel scorebord', {
      right: '<button class="icon-btn ghost" data-action="nav" data-href="#/settings" aria-label="Instellingen">⚙︎</button>'
    }))}
    <main class="screen">
      <div class="hero">
        <p>Tel de score zonder gedoe. Alles blijft op je telefoon.</p>
      </div>

      ${when(live, () => resumeTile(live))}

      <button class="tile" data-action="nav" data-href="#/new">
        <span class="tile-icon">🎾</span>
        <span class="tile-body">
          <strong>Nieuwe wedstrijd</strong>
          <span>2 tegen 2, sets en tiebreak</span>
        </span>
      </button>

      <button class="tile alt" data-action="nav" data-href="#/tournament/new">
        <span class="tile-icon">🏆</span>
        <span class="tile-body">
          <strong>Americano of Mexicano</strong>
          <span>4 tot 16 spelers, wisselende koppels</span>
        </span>
      </button>

      <div class="grid-2">
        <button class="tile compact" data-action="nav" data-href="#/history">
          <span class="tile-body">
            <strong>Historie</strong>
            <span>${totals.matches + totals.tournaments} gespeeld</span>
          </span>
        </button>
        <button class="tile compact" data-action="nav" data-href="#/stats">
          <span class="tile-body">
            <strong>Statistieken</strong>
            <span>ranglijst</span>
          </span>
        </button>
      </div>

      ${when(recent.length > 0, () => html`
        <div class="card-title" style="margin-top:6px">Laatste wedstrijden</div>
        <div class="list">${recent.map(historyRow)}</div>
      `)}

      <button class="icon-btn ghost" data-action="nav" data-href="#/players" style="align-self:center;margin-top:4px">
        Spelers beheren
      </button>
    </main>
  `;
}

function resumeTile(live) {
  const isMatch = live.kind === 'match';
  const label = isMatch
    ? `${live.teams.A.name} vs ${live.teams.B.name}`
    : `${live.name} · ronde ${live.rounds.length}`;
  const sub = isMatch ? scoreline(live) : plural(live.players.length, 'speler', 'spelers');
  return html`
    <button class="tile resume" data-action="nav" data-href="${isMatch ? '#/match' : '#/tournament'}">
      <span class="tile-icon">⏱️</span>
      <span class="tile-body">
        <strong>Hervat: ${label}</strong>
        <span>${sub}</span>
      </span>
    </button>
  `;
}

// ---------------------------------------------------------------- new match

export function newMatchView({ draft, players }) {
  const datalist = `<datalist id="roster">${players.map((p) => `<option value="${esc(p.name)}"></option>`).join('')}</datalist>`;
  return html`
    ${raw(topbar('Nieuwe wedstrijd', { back: '#/' }))}
    <main class="screen">
      ${raw(datalist)}

      <div class="card">
        <div class="card-title">Team 1</div>
        ${raw(nameInput('a0', draft.teamA[0], 'Speler 1'))}
        ${raw(nameInput('a1', draft.teamA[1], 'Speler 2'))}
      </div>

      <button class="icon-btn" data-action="swap-teams" style="align-self:center">⇅ Wissel teams</button>

      <div class="card">
        <div class="card-title">Team 2</div>
        ${raw(nameInput('b0', draft.teamB[0], 'Speler 3'))}
        ${raw(nameInput('b1', draft.teamB[1], 'Speler 4'))}
      </div>

      <div class="card">
        <div class="card-title">Wedstrijdvorm</div>

        <div class="field">
          <label>Aantal sets</label>
          ${raw(segmented('bestOf', [
            { value: 1, label: '1 set' },
            { value: 3, label: 'Best of 3' },
            { value: 5, label: 'Best of 5' }
          ], draft.config.bestOf))}
        </div>

        <div class="field">
          <label>Games per set</label>
          ${raw(segmented('gamesPerSet', [
            { value: 4, label: '4' },
            { value: 6, label: '6' },
            { value: 9, label: '9' }
          ], draft.config.gamesPerSet))}
        </div>

        <div class="field">
          <label>Bij 40-40</label>
          ${raw(segmented('deuceMode', DEUCE_MODES.map((m) => ({ value: m.id, label: m.short })), draft.config.deuceMode))}
          <p class="faint">${DEUCE_MODES.find((m) => m.id === draft.config.deuceMode)?.hint || ''}</p>
        </div>

        ${when(draft.config.bestOf > 1, () => html`
          <div class="switch-row">
            <span class="label">Beslissende set als super&nbsp;tiebreak
              <span class="faint" style="display:block;font-weight:400">Tot 10 punten in plaats van een hele set</span>
            </span>
            ${raw(toggle('finalSetSuperTiebreak', draft.config.finalSetSuperTiebreak))}
          </div>
        `)}
      </div>

      <button class="btn btn-primary" data-action="start-match">Start wedstrijd</button>
      <p class="faint" style="text-align:center">Namen zijn optioneel — laat leeg en je speelt als Team 1 en Team 2.</p>
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
    aria-pressed="${on ? 'true' : 'false'}" aria-label="Aan of uit"><span></span></button>`;
}

// ---------------------------------------------------------------- live match

export function matchView(match) {
  const state = computeState(match);

  return html`
    ${raw(topbar(state.finished ? 'Uitslag' : 'Wedstrijd', { back: '#/' }))}
    <main class="board">
      <div class="setline">
        ${state.completedSets.map((s, i) => html`<span class="set">Set ${i + 1}: ${s.A}-${s.B}</span>`)}
        ${when(state.completedSets.length === 0, '<span class="set">Eerste set</span>')}
      </div>

      ${raw(matchBanner(state))}

      <div class="teams">
        ${raw(teamPanel('A', match, state))}
        ${raw(teamPanel('B', match, state))}
      </div>

      ${state.finished
        ? raw(`
          <div class="board-actions">
            <button class="btn" data-action="undo">↩ Toch verder</button>
            <button class="btn btn-accent" data-action="finish-match">Opslaan</button>
          </div>`)
        : raw(`
          <p class="tap-hint">Tik op een team om dat punt toe te kennen</p>
          <div class="board-actions">
            <button class="btn" data-action="abandon-match">Stoppen</button>
            <button class="btn" data-action="undo" ${match.points.length ? '' : 'disabled'}>↩ Undo</button>
          </div>`)}
    </main>
  `;
}

function matchBanner(state) {
  if (state.finished) {
    return html`<div class="banner">🏆 ${state.winner === 'A' ? 'Team 1' : 'Team 2'} wint</div>`;
  }
  if (state.decidingPoint) {
    const label = state.config.deuceMode === 'star' ? 'Star point' : 'Gouden punt';
    return html`<div class="banner hot">⭐ ${label} — het ontvangende koppel kiest de kant</div>`;
  }
  if (state.inTiebreak) {
    const kind = state.isSuperTiebreak ? 'Super tiebreak' : 'Tiebreak';
    return html`<div class="banner">${kind} tot ${state.tiebreakTarget}${state.changeEnds ? ' · wissel van kant' : ''}</div>`;
  }
  if (state.changeEnds) {
    return html`<div class="banner">🔄 Wissel van kant</div>`;
  }
  if (state.deuce > 1) {
    return html`<div class="banner calm">Deuce ${state.deuce}</div>`;
  }
  const serving = state.serve ? `Service: ${state.serve.team === 'A' ? 'team 1' : 'team 2'}, van ${state.serve.side}` : '';
  return html`<div class="banner calm">${serving}</div>`;
}

function teamPanel(team, match, state) {
  const info = match.teams[team];
  const players = info.players.length ? info.players : [team === 'A' ? 'Speler 1' : 'Speler 2', team === 'A' ? 'Speler 3' : 'Speler 4'];
  const serving = state.serve && state.serve.team === team ? state.serve.player : -1;
  const isWinner = state.finished && state.winner === team;
  const score = state.display[team];

  const playerRows = players
    .map((name, i) => {
      const on = i === serving;
      return `<span class="player${on ? ' serving' : ''}"><span class="serve-dot"></span>${esc(name)}${on ? ' <span class="sr-only">(serveert)</span>' : ''}</span>`;
    })
    .join('');

  const sets = state.setsWon[team];
  return `
    <button class="team-panel ${team.toLowerCase()}${isWinner ? ' winner' : ''}"
      data-action="score" data-team="${team}" ${state.finished ? 'disabled' : ''}
      aria-label="Punt voor ${esc(info.name)}">
      <span class="team-meta">
        <span class="team-name">${esc(info.name)}</span>
        <span class="team-players">${playerRows}</span>
        <span class="team-games">
          <b>${state.games[team]}</b> games${sets ? ` · <b>${sets}</b> set${sets === 1 ? '' : 's'}` : ''}
        </span>
      </span>
      <span class="team-score${state.inTiebreak ? ' small' : ''}">${esc(score)}</span>
    </button>`;
}

// ---------------------------------------------------------------- new tournament

export function newTournamentView({ draft, players }) {
  const selected = draft.players;
  const canStart = selected.length >= 4;
  const courtsMax = Math.max(1, Math.floor(selected.length / 4));

  return html`
    ${raw(topbar('Nieuw toernooi', { back: '#/' }))}
    <main class="screen">
      <div class="card">
        <div class="card-title">Vorm</div>
        ${raw(segmented('type', [
          { value: 'americano', label: 'Americano' },
          { value: 'mexicano', label: 'Mexicano' }
        ], draft.type))}
        <p class="faint">
          ${draft.type === 'mexicano'
            ? 'Mexicano: na elke ronde bepaalt de stand de koppels. Nummer 1 speelt met nummer 4 tegen 2 en 3, dus de partijen blijven spannend.'
            : 'Americano: iedereen speelt om de beurt met iedereen. Elk punt dat je wint telt voor jezelf.'}
        </p>
      </div>

      <div class="card">
        <div class="card-title">Spelers (${selected.length})</div>
        <div class="stack">
          ${players.map((p) => html`
            <button class="pick" data-action="toggle-player" data-id="${p.id}" aria-pressed="${selected.some((s) => s.id === p.id)}">
              <span class="tickbox">${raw(selected.some((s) => s.id === p.id) ? '✓' : '')}</span>
              <span class="grow">${p.name}</span>
            </button>
          `)}
        </div>
        ${when(players.length === 0, '<p class="faint">Nog geen spelers. Voeg ze hieronder toe.</p>')}
        <form data-action="add-player-form" class="btn-row" style="margin-top:10px">
          <input type="text" name="name" placeholder="Naam toevoegen" autocomplete="off" autocapitalize="words" aria-label="Naam toevoegen">
          <button type="submit" class="btn" style="flex:0 0 auto;width:auto;padding:0 18px">+</button>
        </form>
      </div>

      <div class="card">
        <div class="card-title">Banen</div>
        ${raw(segmented('courts', Array.from({ length: courtsMax }, (_, i) => ({ value: i + 1, label: `${i + 1}` })), Math.min(draft.courts, courtsMax)))}
        <p class="faint">
          ${selected.length % 4 === 0 || selected.length < 4
            ? 'Iedereen speelt elke ronde.'
            : `${plural(selected.length - courtsMax * 4, 'speler', 'spelers')} rust per ronde — de app wisselt dat eerlijk af.`}
        </p>
      </div>

      <div class="card">
        <div class="card-title">Punten per ronde</div>
        ${raw(segmented('formatMode', [
          { value: FORMAT_TOTAL, label: 'Totaal' },
          { value: FORMAT_FIRST_TO, label: 'Eerste tot' }
        ], draft.format.mode))}
        ${raw(segmented('formatPoints', [16, 21, 24, 32].map((v) => ({ value: v, label: String(v) })), draft.format.points))}
        <p class="faint">
          ${draft.format.mode === FORMAT_TOTAL
            ? `Elke ronde gaat tot ${draft.format.points} punten in totaal; elk gewonnen punt telt voor jou.`
            : `De ronde stopt zodra een koppel ${draft.format.points} punten heeft.`}
        </p>
      </div>

      <button class="btn btn-primary" data-action="start-tournament" ${canStart ? '' : 'disabled'}>
        ${canStart ? 'Start toernooi' : 'Kies minstens 4 spelers'}
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
    ${raw(topbar(tournament.name, { back: '#/' }))}
    <main class="screen">
      <div class="chip-row">
        <span class="chip">Ronde ${round ? round.number : 0}</span>
        <span class="chip">${plural(tournament.players.length, 'speler', 'spelers')}</span>
        <span class="chip">${tournament.format.mode === FORMAT_TOTAL ? 'tot' : 'eerste tot'} ${tournament.format.points}</span>
      </div>

      ${when(round && round.sitOut.length > 0, () =>
        html`<div class="banner calm">Rust deze ronde: ${round.sitOut.map(name).join(', ')}</div>`)}

      ${round ? raw(round.matches.map((m) => matchCard(m, tournament, name)).join('')) : raw('')}

      <div class="btn-row">
        <button class="btn ${done ? 'btn-primary' : ''}" data-action="next-round" ${done ? '' : 'disabled'}>
          ${done ? 'Volgende ronde' : 'Vul alle uitslagen in'}
        </button>
      </div>

      <div class="card">
        <div class="card-title">Stand</div>
        ${raw(standingsTable(table))}
      </div>

      <div class="btn-row">
        <button class="btn" data-action="abandon-tournament">Stoppen</button>
        <button class="btn btn-accent" data-action="finish-tournament">Afronden</button>
      </div>
    </main>
  `;
}

function matchCard(match, tournament, name) {
  const limits = scoreLimits(match, tournament.format);
  const complete = isMatchComplete(match, tournament.format);
  const side = (team) => {
    const ids = team === 'A' ? match.teamA : match.teamB;
    const score = team === 'A' ? match.scoreA : match.scoreB;
    return `
      <div class="match-side">
        <span class="names">${ids.map(name).map(esc).join(' &amp; ')}</span>
        <span class="stepper">
          <button data-action="tscore" data-match="${match.id}" data-team="${team}" data-delta="-1"
            ${score <= 0 ? 'disabled' : ''} aria-label="Punt eraf">−</button>
          <span class="value">${score}</span>
          <button data-action="tscore" data-match="${match.id}" data-team="${team}" data-delta="1"
            ${score >= limits[team] ? 'disabled' : ''} aria-label="Punt erbij">+</button>
        </span>
      </div>`;
  };
  return `
    <div class="match-card${complete ? ' done' : ''}">
      <div class="match-head"><span>Baan ${match.court}</span><span>${complete ? 'klaar' : `${match.scoreA + match.scoreB} punten`}</span></div>
      ${side('A')}
      ${side('B')}
    </div>`;
}

function standingsTable(table) {
  if (!table.length) return '<p class="faint">Nog geen punten.</p>';
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
    <thead><tr><th>#</th><th>Speler</th><th>W</th><th>+/−</th><th>Ptn</th></tr></thead>
    <tbody>${rows}</tbody></table></div>`;
}

// ---------------------------------------------------------------- history

export function historyView(history) {
  return html`
    ${raw(topbar('Historie', { back: '#/' }))}
    <main class="screen">
      ${history.length === 0
        ? raw('<div class="empty">Nog niets gespeeld.<br>Zodra je een wedstrijd afrondt staat hij hier.</div>')
        : html`<div class="list">${history.map(historyRow)}</div>`}
    </main>
  `;
}

export function historyRow(item) {
  if (item.kind === 'tournament') {
    return html`
      <button class="list-item" data-action="nav" data-href="#/history/${item.id}">
        <span class="grow">
          <strong>🏆 ${item.name}</strong>
          <span class="sub">${formatDate(item.finishedAt || item.createdAt)} · ${plural(item.rounds, 'ronde', 'rondes')}</span>
        </span>
        <span class="score-badge">${item.leader ? item.leader.name : '—'}</span>
      </button>
    `;
  }
  const winner = item.winner === 'A' ? item.teams.A.name : item.teams.B.name;
  return html`
    <button class="list-item" data-action="nav" data-href="#/history/${item.id}">
      <span class="grow">
        <strong>${item.teams.A.name} vs ${item.teams.B.name}</strong>
        <span class="sub">${formatDate(item.finishedAt || item.createdAt)}${item.finished ? ` · ${winner} won` : ' · afgebroken'}</span>
      </span>
      <span class="score-badge">${item.scoreline}</span>
    </button>
  `;
}

export function historyDetailView(item) {
  const remove = `<button class="icon-btn ghost" data-action="delete-history" data-id="${esc(item.id)}" aria-label="Verwijderen">🗑</button>`;
  if (item.kind === 'tournament') {
    return html`
      ${raw(topbar(item.name, { back: '#/history', right: remove }))}
      <main class="screen">
        <div class="chip-row">
          <span class="chip">${item.type === 'mexicano' ? 'Mexicano' : 'Americano'}</span>
          <span class="chip">${plural(item.rounds, 'ronde', 'rondes')}</span>
          <span class="chip">${formatDate(item.finishedAt || item.createdAt)}</span>
        </div>
        <div class="card">
          <div class="card-title">Eindstand</div>
          ${raw(standingsTable(item.standings || []))}
        </div>
      </main>
    `;
  }
  const rows = (item.setsDetail || []).map((s, i) => html`<span class="set">Set ${i + 1}: ${s.A}-${s.B}</span>`);
  return html`
    ${raw(topbar('Wedstrijd', { back: '#/history', right: remove }))}
    <main class="screen">
      <div class="card">
        <div class="card-title">${formatDate(item.finishedAt || item.createdAt)}</div>
        <h2>${item.teams.A.name}<span class="muted"> vs </span>${item.teams.B.name}</h2>
        <div class="setline" style="justify-content:flex-start">${rows}</div>
        <p class="muted">${item.finished ? `${item.winner === 'A' ? item.teams.A.name : item.teams.B.name} won met ${item.scoreline}` : `Afgebroken bij ${item.scoreline}`}</p>
      </div>
      <div class="grid-2">
        <div class="stat"><b>${item.pointsWon.A}–${item.pointsWon.B}</b><span>punten gewonnen</span></div>
        <div class="stat"><b>${item.rallies}</b><span>rally's gespeeld</span></div>
      </div>
    </main>
  `;
}

// ---------------------------------------------------------------- stats

export function statsView({ rows, totals }) {
  return html`
    ${raw(topbar('Statistieken', { back: '#/' }))}
    <main class="screen">
      <div class="grid-2">
        <div class="stat"><b>${totals.matches}</b><span>wedstrijden</span></div>
        <div class="stat"><b>${totals.tournaments}</b><span>toernooien</span></div>
      </div>

      ${rows.length === 0
        ? raw('<div class="empty">Nog geen statistieken.<br>Speel een wedstrijd en de ranglijst vult zich vanzelf.</div>')
        : html`
          <div class="card">
            <div class="card-title">Ranglijst</div>
            <div class="scroll-x">
              <table>
                <thead><tr><th>#</th><th>Speler</th><th>W</th><th>V</th><th>%</th><th>Reeks</th></tr></thead>
                <tbody>
                  ${rows.map((r, i) => html`
                    <tr${raw(i === 0 ? ' class="leader"' : '')}>
                      <td>${i + 1}</td>
                      <td>${r.name}</td>
                      <td>${r.wins}</td>
                      <td>${r.losses}</td>
                      <td>${percent(r.winRate)}</td>
                      <td>${r.streak > 0 ? `${r.streak}×W` : r.streak < 0 ? `${-r.streak}×V` : '—'}</td>
                    </tr>
                  `)}
                </tbody>
              </table>
            </div>
          </div>

          <div class="card">
            <div class="card-title">Toernooien</div>
            <div class="scroll-x">
              <table>
                <thead><tr><th>#</th><th>Speler</th><th>Gesp.</th><th>Top 3</th><th>Wint</th></tr></thead>
                <tbody>
                  ${rows.filter((r) => r.tournaments > 0).map((r, i) => html`
                    <tr><td>${i + 1}</td><td>${r.name}</td><td>${r.tournaments}</td><td>${r.podiums}</td><td>${r.tournamentWins}</td></tr>
                  `)}
                </tbody>
              </table>
            </div>
            ${when(rows.every((r) => r.tournaments === 0), '<p class="faint">Nog geen toernooi gespeeld.</p>')}
          </div>

          <div class="card">
            <div class="card-title">Langste winreeks</div>
            <div class="chip-row">
              ${rows.filter((r) => r.bestStreak > 1).slice(0, 6).map((r) => html`<span class="chip">${r.name} · ${r.bestStreak}×</span>`)}
            </div>
            ${when(rows.every((r) => r.bestStreak <= 1), '<p class="faint">Nog niemand heeft twee wedstrijden op rij gewonnen.</p>')}
          </div>
        `}
    </main>
  `;
}

// ---------------------------------------------------------------- players

export function playersView(players) {
  return html`
    ${raw(topbar('Spelers', { back: '#/' }))}
    <main class="screen">
      <form data-action="add-player-form" class="btn-row">
        <input type="text" name="name" placeholder="Naam" autocomplete="off" autocapitalize="words" aria-label="Naam">
        <button type="submit" class="btn btn-primary" style="flex:0 0 auto;width:auto;padding:0 20px">Toevoegen</button>
      </form>

      ${players.length === 0
        ? raw('<div class="empty">Voeg je vaste padelmaatjes toe.<br>Dan hoef je hun naam nooit meer te typen.</div>')
        : html`
          <div class="list">
            ${players.map((p) => html`
              <div class="list-item">
                <span class="grow"><strong>${p.name}</strong></span>
                <button class="icon-btn ghost" data-action="remove-player" data-id="${p.id}" aria-label="${p.name} verwijderen">🗑</button>
              </div>
            `)}
          </div>
        `}
    </main>
  `;
}

// ---------------------------------------------------------------- settings

export function settingsView({ settings, storageOk }) {
  return html`
    ${raw(topbar('Instellingen', { back: '#/' }))}
    <main class="screen">
      ${when(!storageOk, '<div class="banner hot">Je browser bewaart niets. Zet privémodus uit, anders ben je je historie kwijt.</div>')}

      <div class="card">
        <div class="switch-row">
          <span class="label">Scherm aan houden
            <span class="faint" style="display:block;font-weight:400">Tijdens een wedstrijd gaat je telefoon niet in slaap</span>
          </span>
          ${raw(toggle('keepAwake', settings.keepAwake))}
        </div>
        <div class="switch-row">
          <span class="label">Trilling bij een punt
            <span class="faint" style="display:block;font-weight:400">Werkt niet op elke iPhone</span>
          </span>
          ${raw(toggle('haptics', settings.haptics))}
        </div>
      </div>

      <div class="card">
        <div class="card-title">Back-up</div>
        <p class="faint">Alles staat alleen op dit toestel. Maak af en toe een back-up, of zet hem over naar een andere telefoon.</p>
        <div class="btn-row">
          <button class="btn" data-action="export">Exporteren</button>
          <button class="btn" data-action="import">Importeren</button>
        </div>
        <input type="file" accept="application/json,.json" data-action="import-file" hidden>
      </div>

      <div class="card">
        <div class="card-title">Opruimen</div>
        <button class="btn btn-danger" data-action="clear-history">Historie wissen</button>
      </div>

      <p class="faint" style="text-align:center">
        Padel scorebord · werkt offline<br>
        Zet hem op je beginscherm via Deel → Zet op beginscherm.
      </p>
    </main>
  `;
}
