/**
 * Translations.
 *
 * A key resolves to a string, or to an object of plural forms that
 * Intl.PluralRules picks from -- Russian needs one/few/many where English
 * needs one/other. Placeholders are written as {name} and filled from the
 * params object.
 */

export const LANGUAGES = [
  { id: 'en', name: 'English' },
  { id: 'ru', name: 'Русский' },
  { id: 'nl', name: 'Nederlands' }
];

/** Filled in for any key a language is missing. */
export const FALLBACK = 'en';

/** What the app opens in before anyone picks a language. */
export const DEFAULT_LANGUAGE = 'ru';

const LOCALES = { en: 'en-GB', ru: 'ru-RU', nl: 'nl-NL' };

const en = {
  'app.title': 'Padel scoreboard',
  'a11y.back': 'Back',
  'a11y.settings': 'Settings',
  'a11y.toggle': 'On or off',

  'home.tagline': 'Keep score without the fuss. Everything stays on your phone.',
  'home.newMatch': 'New match',
  'home.newMatchSub': '2 v 2, sets and tiebreak',
  'home.tournament': 'Americano or Mexicano',
  'home.tournamentSub': '4 to 16 players, rotating partners',
  'home.history': 'History',
  'home.played': '{count} played',
  'home.stats': 'Statistics',
  'home.statsSub': 'group ranking',
  'home.recent': 'Recent matches',
  'home.players': 'Manage players',
  'home.resume': 'Resume: {label}',

  'match.new': 'New match',
  'match.team': 'Team {n}',
  'match.player': 'Player {n}',
  'match.swap': 'Swap teams',
  'match.format': 'Match format',
  'match.sets': 'Number of sets',
  'match.oneSet': '1 set',
  'match.bestOf': 'Best of {n}',
  'match.gamesPerSet': 'Games per set',
  'match.atDeuce': 'At 40-40',
  'match.superTiebreak': 'Deciding set as super tiebreak',
  'match.superTiebreakSub': 'To 10 points instead of a full set',
  'match.start': 'Start match',
  'match.namesOptional': 'Names are optional — leave them blank and you play as Team 1 and Team 2.',

  'deuce.advantage': 'Advantage',
  'deuce.advantage.hint': 'Classic: at 40-40 you play on until one pair is two points clear.',
  'deuce.golden': 'Golden point',
  'deuce.golden.hint': 'At 40-40 a single rally decides the game. The receiving pair chooses the side.',
  'deuce.star': 'Star point',
  'deuce.star.full': 'Star point (FIP 2026)',
  'deuce.star.hint': 'Play two advantages; if the score is still level, one star point decides the game.',

  'live.match': 'Match',
  'live.result': 'Result',
  'live.firstSet': 'First set',
  'live.setScore': 'Set {n}: {a}-{b}',
  'live.wins': '{team} wins',
  'live.deciding': '{label} — the receiving pair chooses the side',
  'live.tiebreak': 'Tiebreak to {n}',
  'live.superTiebreak': 'Super tiebreak to {n}',
  'live.changeEndsShort': 'change ends',
  'live.changeEnds': 'Change ends',
  'live.deuce': 'Deuce {n}',
  'live.serving': 'Serving: {team}, from the {side}',
  'live.right': 'right',
  'live.left': 'left',
  'live.teamShort': 'team {n}',
  'live.tapHint': 'Tap a team to award the point',
  'live.games': { one: 'game', other: 'games' },
  'live.sets': { one: 'set', other: 'sets' },
  'live.stop': 'Stop',
  'live.undo': 'Undo',
  'live.keepPlaying': 'Keep playing',
  'live.save': 'Save',
  'a11y.pointFor': 'Point for {team}',
  'a11y.serving': '(serving)',

  'tour.new': 'New tournament',
  'tour.format': 'Format',
  'tour.americano': 'Americano',
  'tour.mexicano': 'Mexicano',
  'tour.americanoHint': 'Americano: you take turns playing with everyone. Every point you win counts for you personally.',
  'tour.mexicanoHint': 'Mexicano: the standings decide the pairs after every round. First plays with fourth against second and third, so the games stay close.',
  'tour.players': 'Players ({count})',
  'tour.noPlayers': 'No players yet. Add them below.',
  'tour.addName': 'Add a name',
  'tour.courts': 'Courts',
  'tour.everyonePlays': 'Everyone plays every round.',
  'tour.resting': 'Resting each round: {count}. The app rotates that fairly.',
  'tour.pointsPerRound': 'Points per round',
  'tour.total': 'Total',
  'tour.firstTo': 'First to',
  'tour.totalHint': 'Each round runs to {points} points in total; every point you win counts for you.',
  'tour.firstToHint': 'The round ends as soon as one pair reaches {points} points.',
  'tour.start': 'Start tournament',
  'tour.needFour': 'Pick at least 4 players',
  'tour.round': 'Round {n}',
  'tour.playerCount': { one: '{count} player', other: '{count} players' },
  'tour.chipTotal': 'to {n}',
  'tour.chipFirstTo': 'first to {n}',
  'tour.restingNow': 'Resting this round: {names}',
  'tour.court': 'Court {n}',
  'tour.done': 'done',
  'tour.pointsSoFar': { one: '{count} point', other: '{count} points' },
  'tour.nextRound': 'Next round',
  'tour.fillScores': 'Fill in every score',
  'tour.standings': 'Standings',
  'tour.finish': 'Finish',
  'tour.stop': 'Stop',
  'tour.noPoints': 'No points yet.',
  'tour.minPlayers': 'An Americano needs at least 4 players.',
  'tour.rounds': { one: '{count} round', other: '{count} rounds' },

  'table.rank': '#',
  'table.player': 'Player',
  'table.won': 'W',
  'table.lost': 'L',
  'table.diff': '+/−',
  'table.points': 'Pts',
  'table.percent': '%',
  'table.streak': 'Streak',
  'table.played': 'Played',
  'table.podium': 'Top 3',
  'table.wins': 'Wins',

  'hist.title': 'History',
  'hist.empty': 'Nothing played yet. Finish a match and it shows up here.',
  'hist.won': '{name} won',
  'hist.abandoned': 'abandoned',
  'hist.match': 'Match',
  'hist.wonWith': '{name} won {score}',
  'hist.abandonedAt': 'Abandoned at {score}',
  'hist.pointsWon': 'points won',
  'hist.rallies': 'rallies played',
  'hist.finalStandings': 'Final standings',
  'a11y.delete': 'Delete',

  'stats.title': 'Statistics',
  'stats.matches': 'matches',
  'stats.tournaments': 'tournaments',
  'stats.empty': 'No statistics yet. Play a match and the ranking fills itself.',
  'stats.ranking': 'Ranking',
  'stats.streakWon': '{n}×W',
  'stats.streakLost': '{n}×L',
  'stats.tournamentTable': 'Tournaments',
  'stats.noTournaments': 'No tournament played yet.',
  'stats.bestStreak': 'Longest winning streak',
  'stats.noStreak': 'Nobody has won two matches in a row yet.',

  'players.title': 'Players',
  'players.name': 'Name',
  'players.add': 'Add',
  'players.empty': 'Add the people you play with. Then you never have to type their name again.',
  'a11y.removePlayer': 'Remove {name}',

  'set.title': 'Settings',
  'set.noStorage': 'Your browser is not saving anything. Turn off private browsing or you will lose your history.',
  'set.keepAwake': 'Keep the screen on',
  'set.keepAwakeSub': 'Your phone will not sleep during a match',
  'set.haptics': 'Vibrate on a point',
  'set.hapticsSub': 'Not supported on every iPhone',
  'set.language': 'Language',
  'set.languageAuto': 'Automatic',
  'set.languageAutoSub': 'Follow your phone ({name})',
  'set.backup': 'Backup',
  'set.backupHint': 'Everything lives on this device only. Make a backup now and then, or move it to another phone.',
  'set.export': 'Export',
  'set.import': 'Import',
  'set.cleanup': 'Clean up',
  'set.clearHistory': 'Clear history',
  'set.footer': 'Padel scoreboard · works offline',
  'set.install': 'Add it to your home screen via Share → Add to Home Screen.',

  'confirm.stopMatch': 'Stop this match?',
  'confirm.finishTournament': 'Finish and save the tournament?',
  'confirm.stopTournament': 'Stop the tournament without saving?',
  'confirm.deleteHistory': 'Remove this from your history?',
  'confirm.clearHistory': 'Clear all history and statistics? This cannot be undone.',
  'toast.matchSaved': 'Match saved',
  'toast.abandonedSaved': 'Saved as an abandoned match',
  'toast.tournamentSaved': 'Tournament saved',
  'toast.historyCleared': 'History cleared',
  'toast.backupRestored': 'Backup restored',
  'toast.importFailed': 'Could not read that file',

  'date.today': 'Today {time}',
  'date.yesterday': 'Yesterday {time}'
};

const ru = {
  'app.title': 'Падел-табло',
  'a11y.back': 'Назад',
  'a11y.settings': 'Настройки',
  'a11y.toggle': 'Вкл или выкл',

  'home.tagline': 'Считайте очки без лишних хлопот. Всё остаётся на вашем телефоне.',
  'home.newMatch': 'Новый матч',
  'home.newMatchSub': '2 на 2, сеты и тай-брейк',
  'home.tournament': 'Американо или Мексикано',
  'home.tournamentSub': 'От 4 до 16 игроков, партнёры меняются',
  'home.history': 'История',
  'home.played': 'сыграно: {count}',
  'home.stats': 'Статистика',
  'home.statsSub': 'таблица компании',
  'home.recent': 'Последние матчи',
  'home.players': 'Игроки',
  'home.resume': 'Продолжить: {label}',

  'match.new': 'Новый матч',
  'match.team': 'Команда {n}',
  'match.player': 'Игрок {n}',
  'match.swap': 'Поменять команды',
  'match.format': 'Формат матча',
  'match.sets': 'Количество сетов',
  'match.oneSet': '1 сет',
  'match.bestOf': 'Из {n} сетов',
  'match.gamesPerSet': 'Геймов в сете',
  'match.atDeuce': 'При 40-40',
  'match.superTiebreak': 'Решающий сет — супер тай-брейк',
  'match.superTiebreakSub': 'До 10 очков вместо полного сета',
  'match.start': 'Начать матч',
  'match.namesOptional': 'Имена вводить необязательно — оставьте поля пустыми, и будут «Команда 1» и «Команда 2».',

  'deuce.advantage': 'Больше',
  'deuce.advantage.hint': 'Классика: при 40-40 играете, пока одна пара не оторвётся на два очка.',
  'deuce.golden': 'Золотое очко',
  'deuce.golden.hint': 'При 40-40 гейм решает один розыгрыш. Принимающая пара выбирает сторону.',
  'deuce.star': 'Стар-пойнт',
  'deuce.star.full': 'Стар-пойнт (FIP 2026)',
  'deuce.star.hint': 'Дважды играете «больше»; если счёт снова равный, гейм решает один стар-пойнт.',

  'live.match': 'Матч',
  'live.result': 'Итог',
  'live.firstSet': 'Первый сет',
  'live.setScore': 'Сет {n}: {a}-{b}',
  'live.wins': 'Побеждает {team}',
  'live.deciding': '{label} — принимающая пара выбирает сторону',
  'live.tiebreak': 'Тай-брейк до {n}',
  'live.superTiebreak': 'Супер тай-брейк до {n}',
  'live.changeEndsShort': 'смена сторон',
  'live.changeEnds': 'Смена сторон',
  'live.deuce': 'Ровно {n}',
  'live.serving': 'Подача: {team}, {side}',
  'live.right': 'справа',
  'live.left': 'слева',
  'live.teamShort': 'команда {n}',
  'live.tapHint': 'Нажмите на команду, чтобы отдать ей очко',
  'live.games': { one: 'гейм', few: 'гейма', many: 'геймов', other: 'гейма' },
  'live.sets': { one: 'сет', few: 'сета', many: 'сетов', other: 'сета' },
  'live.stop': 'Остановить',
  'live.undo': 'Отменить',
  'live.keepPlaying': 'Играть дальше',
  'live.save': 'Сохранить',
  'a11y.pointFor': 'Очко для {team}',
  'a11y.serving': '(подаёт)',

  'tour.new': 'Новый турнир',
  'tour.format': 'Формат',
  'tour.americano': 'Американо',
  'tour.mexicano': 'Мексикано',
  'tour.americanoHint': 'Американо: по очереди играете с каждым. Каждое выигранное очко идёт лично вам.',
  'tour.mexicanoHint': 'Мексикано: пары после каждого раунда определяет таблица. Первый играет с четвёртым против второго и третьего, так что матчи остаются равными.',
  'tour.players': 'Игроки ({count})',
  'tour.noPlayers': 'Пока нет игроков. Добавьте их ниже.',
  'tour.addName': 'Добавить имя',
  'tour.courts': 'Корты',
  'tour.everyonePlays': 'Все играют каждый раунд.',
  'tour.resting': 'Отдых каждый раунд: {count}. Приложение честно их чередует.',
  'tour.pointsPerRound': 'Очки за раунд',
  'tour.total': 'Всего',
  'tour.firstTo': 'До',
  'tour.totalHint': 'Раунд идёт до {points} очков в сумме; каждое выигранное очко засчитывается вам.',
  'tour.firstToHint': 'Раунд заканчивается, как только пара набирает {points} очков.',
  'tour.start': 'Начать турнир',
  'tour.needFour': 'Выберите минимум 4 игроков',
  'tour.round': 'Раунд {n}',
  'tour.playerCount': { one: '{count} игрок', few: '{count} игрока', many: '{count} игроков', other: '{count} игрока' },
  'tour.chipTotal': 'всего {n}',
  'tour.chipFirstTo': 'до {n}',
  'tour.restingNow': 'Отдыхают в этом раунде: {names}',
  'tour.court': 'Корт {n}',
  'tour.done': 'готово',
  'tour.pointsSoFar': { one: '{count} очко', few: '{count} очка', many: '{count} очков', other: '{count} очка' },
  'tour.nextRound': 'Следующий раунд',
  'tour.fillScores': 'Заполните все результаты',
  'tour.standings': 'Таблица',
  'tour.finish': 'Завершить',
  'tour.stop': 'Остановить',
  'tour.noPoints': 'Пока нет очков.',
  'tour.minPlayers': 'Для американо нужно минимум 4 игрока.',
  'tour.rounds': { one: '{count} раунд', few: '{count} раунда', many: '{count} раундов', other: '{count} раунда' },

  'table.rank': '№',
  'table.player': 'Игрок',
  'table.won': 'В',
  'table.lost': 'П',
  'table.diff': '+/−',
  'table.points': 'Очки',
  'table.percent': '%',
  'table.streak': 'Серия',
  'table.played': 'Сыграно',
  'table.podium': 'Топ-3',
  'table.wins': 'Победы',

  'hist.title': 'История',
  'hist.empty': 'Пока ничего не сыграно. Завершите матч, и он появится здесь.',
  'hist.won': 'победа: {name}',
  'hist.abandoned': 'прервано',
  'hist.match': 'Матч',
  'hist.wonWith': 'Победа: {name}, счёт {score}',
  'hist.abandonedAt': 'Прервано при счёте {score}',
  'hist.pointsWon': 'выигранных очков',
  'hist.rallies': 'сыграно розыгрышей',
  'hist.finalStandings': 'Итоговая таблица',
  'a11y.delete': 'Удалить',

  'stats.title': 'Статистика',
  'stats.matches': 'матчей',
  'stats.tournaments': 'турниров',
  'stats.empty': 'Статистики пока нет. Сыграйте матч, и таблица заполнится сама.',
  'stats.ranking': 'Таблица',
  'stats.streakWon': '{n}×В',
  'stats.streakLost': '{n}×П',
  'stats.tournamentTable': 'Турниры',
  'stats.noTournaments': 'Турниров пока не было.',
  'stats.bestStreak': 'Самая длинная серия побед',
  'stats.noStreak': 'Пока никто не выиграл два матча подряд.',

  'players.title': 'Игроки',
  'players.name': 'Имя',
  'players.add': 'Добавить',
  'players.empty': 'Добавьте тех, с кем играете постоянно. Тогда не придётся вводить имена заново.',
  'a11y.removePlayer': 'Удалить {name}',

  'set.title': 'Настройки',
  'set.noStorage': 'Браузер ничего не сохраняет. Отключите приватный режим, иначе история пропадёт.',
  'set.keepAwake': 'Не гасить экран',
  'set.keepAwakeSub': 'Во время матча телефон не уйдёт в спящий режим',
  'set.haptics': 'Вибрация при очке',
  'set.hapticsSub': 'Работает не на каждом iPhone',
  'set.language': 'Язык',
  'set.languageAuto': 'Автоматически',
  'set.languageAutoSub': 'Как на телефоне ({name})',
  'set.backup': 'Резервная копия',
  'set.backupHint': 'Все данные хранятся только на этом устройстве. Иногда делайте копию или переносите её на другой телефон.',
  'set.export': 'Экспорт',
  'set.import': 'Импорт',
  'set.cleanup': 'Очистка',
  'set.clearHistory': 'Очистить историю',
  'set.footer': 'Падел-табло · работает офлайн',
  'set.install': 'Добавьте на домашний экран: «Поделиться» → «На экран „Домой"».',

  'confirm.stopMatch': 'Остановить матч?',
  'confirm.finishTournament': 'Завершить и сохранить турнир?',
  'confirm.stopTournament': 'Остановить турнир без сохранения?',
  'confirm.deleteHistory': 'Удалить из истории?',
  'confirm.clearHistory': 'Очистить всю историю и статистику? Это нельзя отменить.',
  'toast.matchSaved': 'Матч сохранён',
  'toast.abandonedSaved': 'Сохранено как прерванный матч',
  'toast.tournamentSaved': 'Турнир сохранён',
  'toast.historyCleared': 'История очищена',
  'toast.backupRestored': 'Копия восстановлена',
  'toast.importFailed': 'Не удалось прочитать файл',

  'date.today': 'Сегодня {time}',
  'date.yesterday': 'Вчера {time}'
};

const nl = {
  'app.title': 'Padel scorebord',
  'a11y.back': 'Terug',
  'a11y.settings': 'Instellingen',
  'a11y.toggle': 'Aan of uit',

  'home.tagline': 'Tel de score zonder gedoe. Alles blijft op je telefoon.',
  'home.newMatch': 'Nieuwe wedstrijd',
  'home.newMatchSub': '2 tegen 2, sets en tiebreak',
  'home.tournament': 'Americano of Mexicano',
  'home.tournamentSub': '4 tot 16 spelers, wisselende koppels',
  'home.history': 'Historie',
  'home.played': '{count} gespeeld',
  'home.stats': 'Statistieken',
  'home.statsSub': 'ranglijst',
  'home.recent': 'Laatste wedstrijden',
  'home.players': 'Spelers beheren',
  'home.resume': 'Hervat: {label}',

  'match.new': 'Nieuwe wedstrijd',
  'match.team': 'Team {n}',
  'match.player': 'Speler {n}',
  'match.swap': 'Wissel teams',
  'match.format': 'Wedstrijdvorm',
  'match.sets': 'Aantal sets',
  'match.oneSet': '1 set',
  'match.bestOf': 'Best of {n}',
  'match.gamesPerSet': 'Games per set',
  'match.atDeuce': 'Bij 40-40',
  'match.superTiebreak': 'Beslissende set als super tiebreak',
  'match.superTiebreakSub': 'Tot 10 punten in plaats van een hele set',
  'match.start': 'Start wedstrijd',
  'match.namesOptional': 'Namen zijn optioneel — laat leeg en je speelt als Team 1 en Team 2.',

  'deuce.advantage': 'Voordeel',
  'deuce.advantage.hint': 'Klassiek: bij 40-40 speel je door tot een koppel twee punten voorsprong heeft.',
  'deuce.golden': 'Gouden punt',
  'deuce.golden.hint': 'Bij 40-40 beslist één rally de game. Het ontvangende koppel kiest de kant.',
  'deuce.star': 'Star point',
  'deuce.star.full': 'Star point (FIP 2026)',
  'deuce.star.hint': 'Twee keer voordeel spelen; staat het daarna nog gelijk, dan beslist één star point.',

  'live.match': 'Wedstrijd',
  'live.result': 'Uitslag',
  'live.firstSet': 'Eerste set',
  'live.setScore': 'Set {n}: {a}-{b}',
  'live.wins': '{team} wint',
  'live.deciding': '{label} — het ontvangende koppel kiest de kant',
  'live.tiebreak': 'Tiebreak tot {n}',
  'live.superTiebreak': 'Super tiebreak tot {n}',
  'live.changeEndsShort': 'wissel van kant',
  'live.changeEnds': 'Wissel van kant',
  'live.deuce': 'Deuce {n}',
  'live.serving': 'Service: {team}, van {side}',
  'live.right': 'rechts',
  'live.left': 'links',
  'live.teamShort': 'team {n}',
  'live.tapHint': 'Tik op een team om dat punt toe te kennen',
  'live.games': { one: 'game', other: 'games' },
  'live.sets': { one: 'set', other: 'sets' },
  'live.stop': 'Stoppen',
  'live.undo': 'Undo',
  'live.keepPlaying': 'Toch verder',
  'live.save': 'Opslaan',
  'a11y.pointFor': 'Punt voor {team}',
  'a11y.serving': '(serveert)',

  'tour.new': 'Nieuw toernooi',
  'tour.format': 'Vorm',
  'tour.americano': 'Americano',
  'tour.mexicano': 'Mexicano',
  'tour.americanoHint': 'Americano: iedereen speelt om de beurt met iedereen. Elk punt dat je wint telt voor jezelf.',
  'tour.mexicanoHint': 'Mexicano: na elke ronde bepaalt de stand de koppels. Nummer 1 speelt met nummer 4 tegen 2 en 3, dus de partijen blijven spannend.',
  'tour.players': 'Spelers ({count})',
  'tour.noPlayers': 'Nog geen spelers. Voeg ze hieronder toe.',
  'tour.addName': 'Naam toevoegen',
  'tour.courts': 'Banen',
  'tour.everyonePlays': 'Iedereen speelt elke ronde.',
  'tour.resting': 'Rust per ronde: {count}. De app wisselt dat eerlijk af.',
  'tour.pointsPerRound': 'Punten per ronde',
  'tour.total': 'Totaal',
  'tour.firstTo': 'Eerste tot',
  'tour.totalHint': 'Elke ronde gaat tot {points} punten in totaal; elk gewonnen punt telt voor jou.',
  'tour.firstToHint': 'De ronde stopt zodra een koppel {points} punten heeft.',
  'tour.start': 'Start toernooi',
  'tour.needFour': 'Kies minstens 4 spelers',
  'tour.round': 'Ronde {n}',
  'tour.playerCount': { one: '{count} speler', other: '{count} spelers' },
  'tour.chipTotal': 'tot {n}',
  'tour.chipFirstTo': 'eerste tot {n}',
  'tour.restingNow': 'Rust deze ronde: {names}',
  'tour.court': 'Baan {n}',
  'tour.done': 'klaar',
  'tour.pointsSoFar': { one: '{count} punt', other: '{count} punten' },
  'tour.nextRound': 'Volgende ronde',
  'tour.fillScores': 'Vul alle uitslagen in',
  'tour.standings': 'Stand',
  'tour.finish': 'Afronden',
  'tour.stop': 'Stoppen',
  'tour.noPoints': 'Nog geen punten.',
  'tour.minPlayers': 'Een Americano heeft minstens 4 spelers nodig.',
  'tour.rounds': { one: '{count} ronde', other: '{count} rondes' },

  'table.rank': '#',
  'table.player': 'Speler',
  'table.won': 'W',
  'table.lost': 'V',
  'table.diff': '+/−',
  'table.points': 'Ptn',
  'table.percent': '%',
  'table.streak': 'Reeks',
  'table.played': 'Gesp.',
  'table.podium': 'Top 3',
  'table.wins': 'Wint',

  'hist.title': 'Historie',
  'hist.empty': 'Nog niets gespeeld. Rond een wedstrijd af en hij staat hier.',
  'hist.won': '{name} won',
  'hist.abandoned': 'afgebroken',
  'hist.match': 'Wedstrijd',
  'hist.wonWith': '{name} won met {score}',
  'hist.abandonedAt': 'Afgebroken bij {score}',
  'hist.pointsWon': 'punten gewonnen',
  'hist.rallies': "rally's gespeeld",
  'hist.finalStandings': 'Eindstand',
  'a11y.delete': 'Verwijderen',

  'stats.title': 'Statistieken',
  'stats.matches': 'wedstrijden',
  'stats.tournaments': 'toernooien',
  'stats.empty': 'Nog geen statistieken. Speel een wedstrijd en de ranglijst vult zich vanzelf.',
  'stats.ranking': 'Ranglijst',
  'stats.streakWon': '{n}×W',
  'stats.streakLost': '{n}×V',
  'stats.tournamentTable': 'Toernooien',
  'stats.noTournaments': 'Nog geen toernooi gespeeld.',
  'stats.bestStreak': 'Langste winreeks',
  'stats.noStreak': 'Nog niemand heeft twee wedstrijden op rij gewonnen.',

  'players.title': 'Spelers',
  'players.name': 'Naam',
  'players.add': 'Toevoegen',
  'players.empty': 'Voeg je vaste padelmaatjes toe. Dan hoef je hun naam nooit meer te typen.',
  'a11y.removePlayer': '{name} verwijderen',

  'set.title': 'Instellingen',
  'set.noStorage': 'Je browser bewaart niets. Zet privémodus uit, anders ben je je historie kwijt.',
  'set.keepAwake': 'Scherm aan houden',
  'set.keepAwakeSub': 'Tijdens een wedstrijd gaat je telefoon niet in slaap',
  'set.haptics': 'Trilling bij een punt',
  'set.hapticsSub': 'Werkt niet op elke iPhone',
  'set.language': 'Taal',
  'set.languageAuto': 'Automatisch',
  'set.languageAutoSub': 'Volg je telefoon ({name})',
  'set.backup': 'Back-up',
  'set.backupHint': 'Alles staat alleen op dit toestel. Maak af en toe een back-up, of zet hem over naar een andere telefoon.',
  'set.export': 'Exporteren',
  'set.import': 'Importeren',
  'set.cleanup': 'Opruimen',
  'set.clearHistory': 'Historie wissen',
  'set.footer': 'Padel scorebord · werkt offline',
  'set.install': 'Zet hem op je beginscherm via Deel → Zet op beginscherm.',

  'confirm.stopMatch': 'Wedstrijd stoppen?',
  'confirm.finishTournament': 'Toernooi afronden en opslaan?',
  'confirm.stopTournament': 'Toernooi stoppen zonder op te slaan?',
  'confirm.deleteHistory': 'Verwijderen uit je historie?',
  'confirm.clearHistory': 'Alle historie en statistieken wissen? Dit kan niet ongedaan worden gemaakt.',
  'toast.matchSaved': 'Wedstrijd opgeslagen',
  'toast.abandonedSaved': 'Opgeslagen als afgebroken wedstrijd',
  'toast.tournamentSaved': 'Toernooi opgeslagen',
  'toast.historyCleared': 'Historie gewist',
  'toast.backupRestored': 'Back-up teruggezet',
  'toast.importFailed': 'Kon dit bestand niet lezen',

  'date.today': 'Vandaag {time}',
  'date.yesterday': 'Gisteren {time}'
};

const DICTIONARIES = { en, ru, nl };

let current = FALLBACK;

/** The best supported language for this device, or English. */
export function detectLanguage() {
  const wanted = typeof navigator !== 'undefined' ? navigator.languages || [navigator.language] : [];
  for (const tag of wanted) {
    if (!tag) continue;
    const base = String(tag).toLowerCase().split('-')[0];
    if (DICTIONARIES[base]) return base;
  }
  return FALLBACK;
}

export function setLanguage(id) {
  current = DICTIONARIES[id] ? id : detectLanguage();
  if (typeof document !== 'undefined') document.documentElement.lang = current;
  return current;
}

export function getLanguage() {
  return current;
}

export function languageName(id) {
  return (LANGUAGES.find((l) => l.id === id) || {}).name || id;
}

function fill(template, params) {
  return String(template).replace(/\{(\w+)\}/g, (match, key) => (key in params ? params[key] : match));
}

/**
 * Translate a key. Pass `count` for keys with plural forms; the plural rules
 * of the active language pick the right one.
 */
export function t(key, params = {}) {
  const entry = DICTIONARIES[current]?.[key] ?? DICTIONARIES[FALLBACK][key];
  if (entry === undefined) return key;
  if (typeof entry === 'object') {
    const form = new Intl.PluralRules(LOCALES[current] || current).select(Number(params.count) || 0);
    return fill(entry[form] ?? entry.other ?? entry.many ?? entry.one, params);
  }
  return fill(entry, params);
}

export function locale() {
  return LOCALES[current] || current;
}

export function formatDate(ts) {
  if (!ts) return '';
  const loc = locale();
  const d = new Date(ts);
  const now = new Date();
  const time = d.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === now.toDateString()) return t('date.today', { time });
  const yesterday = new Date(now.getTime() - 86400000);
  if (d.toDateString() === yesterday.toDateString()) return t('date.yesterday', { time });
  return `${d.toLocaleDateString(loc, { day: 'numeric', month: 'short', year: '2-digit' })} ${time}`;
}

/** Every key of the reference language, for the completeness test. */
export function keysOf(language) {
  return Object.keys(DICTIONARIES[language] || {});
}

export function entryOf(language, key) {
  return DICTIONARIES[language]?.[key];
}
