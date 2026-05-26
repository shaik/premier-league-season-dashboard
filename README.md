# Premier League Season Dashboard

Static HTML dashboard for the Football-Data Premier League season files, the player stats snapshot through matchday 35, and historical Premier League match files from 2000-01 through 2025-26. The 2025-26 season (`pl2025.csv`) is both the featured "current" season and the newest entry on the history timeline.

## Files

- `index.html` - page structure and controls.
- `styles.css` - responsive dashboard styling.
- `app.js` - CSV parsing, season/player/history modelling, and SVG chart rendering.
- `pl2025.csv` - featured current season (2025-26) match data; also the newest history file.
- `E0-notes.txt` - field definitions from Football-Data (the shared `plYYYY.csv` schema).
- `premier_league_complete_stats_until35thGameDayOnSeason2025-26.csv` - primary player stats source.
- `plYYYY.csv` - Football-Data season files (2000-2025), where `YYYY` is the season start year.
- `.nojekyll` - keeps GitHub Pages from applying Jekyll processing.

## Local Preview

Browsers usually block `fetch("pl2025.csv")` when opening `index.html` directly from disk. Preview it with a tiny local server:

```sh
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## Deploy To GitHub Pages

Commit these files at the repository root and enable GitHub Pages for the branch. There is no build step and no package installation.

## Data Notes

The dashboard computes round-by-round standings from completed matches in `pl2025.csv`. The app shows whatever rounds are present in the file rather than assuming a full 380-fixture season, so it keeps working if a mid-season file is dropped in.

Player visuals use the matchday-35 snapshot because it has stable player IDs and clean UTF-8 names. Team names in that player file are normalized to the shorter `plYYYY.csv` names used by the season dashboard.

The season tab also derives form heatmaps, position sparklines, attack/defense scatter, and halftime-to-fulltime swing counts directly from `pl2025.csv`.

The history tab loads `pl2000.csv` through `pl2025.csv` and compares full seasons by scoring environment, home/draw/away result mix, cards, title-winning points, top-four cutoff, survival line, title winners, and selected-club final-table arcs. Two charts at the top of the tab answer a specific question — when Arsenal won 2025-26 on a modest points total, was the whole league scoring less, or was it just Arsenal? They plot total goals per season and Arsenal's goals-per-game against the rest of the league across the full Premier League era.

## Data Credits

- [Football-Data.co.uk](https://www.football-data.co.uk/)
- [TheSportsDB English Premier League](https://www.thesportsdb.com/league/4328-English-Premier-League)
