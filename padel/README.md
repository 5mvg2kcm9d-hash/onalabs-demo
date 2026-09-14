# Padel scorebord

Een gratis scorebord-app voor padel. Draait als app op je iPhone, werkt volledig
offline en bewaart alles op je eigen telefoon — geen account, geen advertenties,
geen abonnement.

<img src="icons/icon-512.png" width="96" alt="">

## Wat het doet

**Wedstrijd bijhouden**
- Tik op een team om dat punt toe te kennen — één tik, één punt.
- Punten, games, sets, tiebreak en super tiebreak.
- Bij 40-40 kies je zelf: voordeel, gouden punt of het **star point** van de
  FIP-regels voor 2026 (twee keer voordeel, daarna één beslissend punt).
- De app houdt bij wie serveert, van welke kant, en wanneer je van kant wisselt.
- Undo voor elk punt, ook dwars door een gewonnen game of set heen.

**Americano en Mexicano**
- 4 tot 16 spelers op 1 tot 4 banen.
- Americano: de app zoekt elke ronde de indeling met de minste herhaalde
  koppels, zodat je zoveel mogelijk met iedereen speelt.
- Mexicano: na elke ronde bepaalt de stand de koppels — 1 met 4 tegen 2 en 3.
- Wie moet rusten rouleert eerlijk als het aantal spelers niet op 4 uitkomt.
- Live stand per speler, want in beide vormen speel je voor jezelf.

**Historie en statistieken**
- Elke afgeronde wedstrijd en elk toernooi wordt bewaard.
- Ranglijst van je vriendengroep: gewonnen, verloren, winstpercentage, langste
  winreeks, podiumplaatsen.
- Back-up exporteren en importeren, zodat je niets kwijtraakt bij een nieuwe
  telefoon.

## Op je iPhone zetten

1. Zet de map online (zie hieronder) en open de URL in **Safari**.
2. Tik op de deelknop en kies **Zet op beginscherm**.
3. Open hem voortaan vanaf je beginscherm: hij start fullscreen, zonder
   browserbalk, en werkt zonder internet.

Let op: gebruik Safari om hem te installeren — vanuit Chrome op iOS werkt "Zet
op beginscherm" niet hetzelfde.

## Online zetten

De app is platte HTML, CSS en JavaScript zonder bouwstap. Elke statische
hosting werkt.

**GitHub Pages** — zet Pages in de repo-instellingen aan voor deze branch; de
app staat dan op `https://<gebruiker>.github.io/<repo>/padel/`.

**Lokaal proberen**

```sh
cd padel
npx http-server -p 8123 -c-1 .
# open http://localhost:8123
```

Open `index.html` niet rechtstreeks vanaf schijf: ES-modules en de service
worker vragen om `http://`.

## Tests

```sh
cd padel
node --test 'test/*.test.mjs'
```

De scoreregels, de toernooi-indeling, de statistieken en de HTML-escaping
hebben allemaal hun eigen tests.

## Hoe het in elkaar zit

```
padel/
  index.html              de shell
  manifest.webmanifest    maakt er een installeerbare app van
  sw.js                   cachet alles voor offline gebruik
  css/app.css
  js/
    engine.js             scoreregels (punten, games, sets, tiebreak, serveerbeurt)
    tournament.js         Americano- en Mexicano-indeling en stand
    stats.js              ranglijst uit de historie
    store.js              opslag op het toestel
    views.js              alle schermen
    dom.js                veilige HTML-templates
    app.js                routing, state en acties
  test/                   node:test
```

Een wedstrijd wordt opgeslagen als de lijst van gewonnen rally's, niets meer.
Alles wat je op het scherm ziet — de stand, wie serveert, of het een star point
is — wordt daaruit opnieuw berekend. Daardoor kan de weergave nooit uit de pas
lopen met de stand, en is undo simpelweg het laatste punt weglaten.

## Privacy

Er gaat niets naar een server. Alles staat in de lokale opslag van je browser.
Wis je je browsergegevens, dan ben je je historie kwijt — maak dus af en toe een
back-up via Instellingen.
