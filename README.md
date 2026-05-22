# Premier League Season Dashboard

Static HTML dashboard for the Football-Data `E0.csv` Premier League season file and the player stats snapshot through matchday 35.

## Files

- `index.html` - page structure and controls.
- `styles.css` - responsive dashboard styling.
- `app.js` - CSV parsing, season/player modelling, and SVG chart rendering.
- `E0.csv` - source match data.
- `E0-notes.txt` - field definitions from Football-Data.
- `premier_league_complete_stats_until35thGameDayOnSeason2025-26.csv` - primary player stats source.
- `.nojekyll` - keeps GitHub Pages from applying Jekyll processing.

## Local Preview

Browsers usually block `fetch("E0.csv")` when opening `index.html` directly from disk. Preview it with a tiny local server:

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

The dashboard computes round-by-round standings from completed matches in `E0.csv`. The current file contains 370 match rows, so the app shows the rounds present in the file instead of assuming the season has all 380 Premier League fixtures.

Player visuals use the matchday-35 snapshot because it has stable player IDs and clean UTF-8 names. Team names in that player file are normalized to the shorter `E0.csv` names used by the season dashboard.

The season tab also derives form heatmaps, position sparklines, attack/defense scatter, and halftime-to-fulltime swing counts directly from `E0.csv`.
