(function () {
  "use strict";

  const CSV_FILE = "pl2025.csv";
  const PLAYER_CSV_FILE = "premier_league_complete_stats_until35thGameDayOnSeason2025-26.csv";
  const HISTORY_FILES = Array.from({ length: 26 }, (_, index) => {
    const year = 2000 + index;
    return {
      year,
      file: `pl${year}.csv`,
      label: `${year}-${String((year + 1) % 100).padStart(2, "0")}`,
    };
  });
  const CHART = {
    width: 1000,
    height: 360,
    positionHeight: 460,
    margin: { top: 28, right: 138, bottom: 46, left: 54 },
    miniMargin: { top: 24, right: 28, bottom: 42, left: 48 },
  };

  const TEAM_COLORS = {
    Arsenal: "#e11d48",
    "Aston Villa": "#7c3aed",
    Bournemouth: "#db2777",
    Brentford: "#ef4444",
    Brighton: "#1264b0",
    Burnley: "#8f2d56",
    Chelsea: "#034694",
    "Crystal Palace": "#4338ca",
    Everton: "#1c52a3",
    Fulham: "#2a2f35",
    Leeds: "#b58a00",
    Leicester: "#0053a0",
    Liverpool: "#7f1d1d",
    "Man City": "#4f97c7",
    "Man United": "#f97316",
    Newcastle: "#2b2b2b",
    "Nott'm Forest": "#15803d",
    Sunderland: "#dc2626",
    Tottenham: "#132257",
    "West Ham": "#7a263a",
    Wolves: "#c88b00",
    Blackburn: "#1d4ed8",
    Bolton: "#5b7083",
    Cardiff: "#2563eb",
    Charlton: "#b91c1c",
    Coventry: "#38a7d8",
    Derby: "#44403c",
    Hull: "#d97706",
    Ipswich: "#2563eb",
    Middlesbrough: "#dc2626",
    Norwich: "#facc15",
    Portsmouth: "#2563eb",
    QPR: "#1d4ed8",
    Reading: "#1e40af",
    Sheffield: "#be123c",
    Southampton: "#dc2626",
    Stoke: "#b91c1c",
    Swansea: "#334155",
    Watford: "#f59e0b",
    Wigan: "#2563eb",
  };

  const FALLBACK_COLORS = [
    "#0f766e",
    "#b42318",
    "#6d5dfc",
    "#2563eb",
    "#ca8a04",
    "#9f1239",
    "#15803d",
    "#7c3aed",
    "#be123c",
    "#0e7490",
    "#a16207",
    "#0891b2",
    "#4d7c0f",
    "#c2410c",
    "#4338ca",
    "#be185d",
  ];

  const METRICS = {
    cumulativePoints: {
      label: "Cumulative points",
      type: "history",
      formatter: (value) => String(Math.round(value)),
      accessor: (team, round) => historyValue(team, round, "points"),
    },
    weeklyPoints: {
      label: "Points per round",
      type: "round",
      formatter: (value) => String(Math.round(value)),
      accessor: (team, round) => roundValue(team, round, "points"),
    },
    goalDifference: {
      label: "Goal difference",
      type: "history",
      formatter: signed,
      accessor: (team, round) => historyValue(team, round, "gd"),
    },
    shotsFor: {
      label: "Shots per round",
      type: "round",
      formatter: (value) => value.toFixed(0),
      accessor: (team, round) => roundValue(team, round, "shotsFor"),
    },
    shotAccuracy: {
      label: "Shot accuracy",
      type: "round",
      suffix: "%",
      formatter: (value) => `${value.toFixed(0)}%`,
      accessor: (team, round) => {
        const shots = roundValue(team, round, "shotsFor");
        const onTarget = roundValue(team, round, "sotFor");
        return shots ? (onTarget / shots) * 100 : 0;
      },
    },
    discipline: {
      label: "Discipline points",
      type: "round",
      formatter: (value) => String(Math.round(value)),
      accessor: (team, round) => roundValue(team, round, "yellow") + roundValue(team, round, "red") * 2,
    },
  };

  const PLAYER_TEAM_ALIASES = {
    "Brighton & Hove Albion": "Brighton",
    "Brighton &amp; Hove Albion": "Brighton",
    "Leeds United": "Leeds",
    "Liverpool FC": "Liverpool",
    "Manchester City": "Man City",
    "Manchester United": "Man United",
    "Newcastle United": "Newcastle",
    "Nottingham Forest": "Nott'm Forest",
    "Tottenham Hotspur": "Tottenham",
    "West Ham United": "West Ham",
    Wolverhampton: "Wolves",
  };

  const POSITION_LABELS = {
    F: "Forward",
    M: "Midfielder",
    D: "Defender",
    G: "Goalkeeper",
  };

  const PLAYER_METRICS = {
    goalsAssistsSum: { label: "Goals + assists", formatter: (value) => value.toFixed(0) },
    goals: { label: "Goals", formatter: (value) => value.toFixed(0) },
    assists: { label: "Assists", formatter: (value) => value.toFixed(0) },
    expectedGoals: { label: "Expected goals", formatter: (value) => value.toFixed(2) },
    expectedAssists: { label: "Expected assists", formatter: (value) => value.toFixed(2) },
    rating: { label: "Average rating", formatter: (value) => value.toFixed(2) },
    minutesPlayed: { label: "Minutes", formatter: (value) => value.toLocaleString() },
    totalShots: { label: "Shots", formatter: (value) => value.toFixed(0) },
    keyPasses: { label: "Key passes", formatter: (value) => value.toFixed(0) },
    tacklesWon: { label: "Tackles won", formatter: (value) => value.toFixed(0) },
    saves: { label: "Saves", formatter: (value) => value.toFixed(0) },
  };

  const HISTORY_METRICS = {
    goalsPerMatch: {
      label: "Goals per match",
      formatter: (value) => value.toFixed(2),
      accessor: (season) => season.goalsPerMatch,
    },
    homeWinRate: {
      label: "Home win rate",
      formatter: (value) => `${value.toFixed(0)}%`,
      accessor: (season) => season.homeWinRate,
    },
    drawRate: {
      label: "Draw rate",
      formatter: (value) => `${value.toFixed(0)}%`,
      accessor: (season) => season.drawRate,
    },
    awayWinRate: {
      label: "Away win rate",
      formatter: (value) => `${value.toFixed(0)}%`,
      accessor: (season) => season.awayWinRate,
    },
    cardsPerMatch: {
      label: "Cards per match",
      formatter: (value) => value.toFixed(2),
      accessor: (season) => season.cardsPerMatch,
    },
    championPoints: {
      label: "Champion points",
      formatter: (value) => value.toFixed(0),
      accessor: (season) => season.championPoints,
    },
    titleMargin: {
      label: "Title margin",
      formatter: (value) => value.toFixed(0),
      accessor: (season) => season.titleMargin,
    },
    topFourCutoff: {
      label: "Top-four cutoff",
      formatter: (value) => value.toFixed(0),
      accessor: (season) => season.topFourCutoff,
    },
    survivalPoints: {
      label: "17th-place points",
      formatter: (value) => value.toFixed(0),
      accessor: (season) => season.survivalPoints,
    },
    avgAttendance: {
      label: "Average attendance",
      formatter: (value) => (value ? Math.round(value).toLocaleString() : "n/a"),
      accessor: (season) => season.avgAttendance,
    },
  };

  const HISTORY_TEAM_METRICS = {
    position: { label: "Final position", formatter: (value) => `#${value.toFixed(0)}` },
    points: { label: "Points", formatter: (value) => value.toFixed(0) },
    gd: { label: "Goal difference", formatter: signed },
    gf: { label: "Goals scored", formatter: (value) => value.toFixed(0) },
    ga: { label: "Goals conceded", formatter: (value) => value.toFixed(0) },
    pointsPerMatch: { label: "Points per match", formatter: (value) => value.toFixed(2) },
  };

  const state = {
    data: null,
    players: null,
    history: null,
    activeTab: "season",
    selectedTeams: new Set(),
    teamSearch: "",
    roundLimit: 1,
    metric: "cumulativePoints",
    tableSort: { key: "position", direction: "asc" },
    playerTeam: "all",
    playerPosition: "all",
    playerSearch: "",
    playerMinMinutes: 90,
    playerMinAppearances: 1,
    playerMetric: "goalsAssistsSum",
    playerTableSort: { key: "metric", direction: "desc" },
    selectedPlayers: new Set(),
    historyStart: 2000,
    historyEnd: 2024,
    historyMetric: "goalsPerMatch",
    historyTeam: "Arsenal",
    historyTeamMetric: "position",
    historyCompareA: 2024,
    historyCompareB: 2003,
  };

  const els = {};

  document.addEventListener("DOMContentLoaded", init);
  window.addEventListener(
    "resize",
    debounce(() => {
      if (!state.data) return;
      renderCharts();
      if (state.players) renderPlayerCharts();
      if (state.history) renderHistoryCharts();
    }, 120),
  );

  async function init() {
    cacheElements();
    bindControls();

    try {
      const [matchResponse, playerResponse, ...historyResponses] = await Promise.all([
        fetch(CSV_FILE, { cache: "no-store" }),
        fetch(PLAYER_CSV_FILE, { cache: "no-store" }),
        ...HISTORY_FILES.map((source) => fetch(source.file, { cache: "no-store" })),
      ]);
      if (!matchResponse.ok) {
        throw new Error(`${CSV_FILE} request failed with ${matchResponse.status}`);
      }
      if (!playerResponse.ok) {
        throw new Error(`${PLAYER_CSV_FILE} request failed with ${playerResponse.status}`);
      }
      const failedHistory = historyResponses.find((response) => !response.ok);
      if (failedHistory) {
        throw new Error(`Historical CSV request failed with ${failedHistory.status}`);
      }
      const csvText = await matchResponse.text();
      const playerCsvText = await playerResponse.text();
      const historyCsvTexts = await Promise.all(historyResponses.map((response) => response.text()));
      const rows = parseCSV(csvText);
      const playerRows = parseCSV(playerCsvText);
      const historyItems = HISTORY_FILES.map((source, index) => ({
        ...source,
        rows: parseCSV(historyCsvTexts[index]),
      }));
      const data = buildSeasonModel(rows);
      const players = buildPlayerModel(playerRows, data.teams);
      const history = buildHistoryModel(historyItems);
      state.data = data;
      state.players = players;
      state.history = history;
      state.roundLimit = data.maxRound;
      state.selectedTeams = new Set(data.teams.includes("Arsenal") ? ["Arsenal"] : [data.latestStandings[0].team]);
      state.selectedPlayers = new Set(players.topPlayers.slice(0, 8).map((player) => player.id));
      state.historyStart = history.minYear;
      state.historyEnd = history.maxYear;
      state.historyTeam = history.teams.includes("Arsenal") ? "Arsenal" : history.teams[0];
      state.historyCompareA = history.maxYear;
      state.historyCompareB = history.byYear.has(2003) ? 2003 : history.minYear;
      hydrateControls(data, players, history);
      renderAll();
    } catch (error) {
      showLoadError(error);
    }
  }

  function cacheElements() {
    els.tabButtons = Array.from(document.querySelectorAll(".tab-button"));
    els.tabPanels = Array.from(document.querySelectorAll(".tab-panel"));
    els.seasonKpis = document.getElementById("seasonKpis");
    els.teamSearch = document.getElementById("teamSearch");
    els.teamSelector = document.getElementById("teamSelector");
    els.selectTopTeams = document.getElementById("selectTopTeams");
    els.selectAllTeams = document.getElementById("selectAllTeams");
    els.clearTeams = document.getElementById("clearTeams");
    els.roundRange = document.getElementById("roundRange");
    els.roundLabel = document.getElementById("roundLabel");
    els.roundMaxLabel = document.getElementById("roundMaxLabel");
    els.metricSelect = document.getElementById("metricSelect");
    els.positionChart = document.getElementById("positionChart");
    els.positionLegend = document.getElementById("positionLegend");
    els.goalsForChart = document.getElementById("goalsForChart");
    els.goalsAgainstChart = document.getElementById("goalsAgainstChart");
    els.metricChart = document.getElementById("metricChart");
    els.metricChartTitle = document.getElementById("metricChartTitle");
    els.teamMapChart = document.getElementById("teamMapChart");
    els.formHeatmap = document.getElementById("formHeatmap");
    els.htftChart = document.getElementById("htftChart");
    els.teamProfile = document.getElementById("teamProfile");
    els.standingsTitle = document.getElementById("standingsTitle");
    els.standingsBody = document.getElementById("standingsBody");
    els.standingsTable = document.querySelector(".standings-table");
    els.playerTeamFilter = document.getElementById("playerTeamFilter");
    els.playerPositionFilter = document.getElementById("playerPositionFilter");
    els.playerSearch = document.getElementById("playerSearch");
    els.playerMinMinutes = document.getElementById("playerMinMinutes");
    els.playerMinAppearances = document.getElementById("playerMinAppearances");
    els.playerMetricSelect = document.getElementById("playerMetricSelect");
    els.selectTopPlayers = document.getElementById("selectTopPlayers");
    els.selectVisiblePlayers = document.getElementById("selectVisiblePlayers");
    els.clearPlayers = document.getElementById("clearPlayers");
    els.playerSelector = document.getElementById("playerSelector");
    els.playerKpis = document.getElementById("playerKpis");
    els.playerScatterChart = document.getElementById("playerScatterChart");
    els.playerBarChart = document.getElementById("playerBarChart");
    els.playerBarTitle = document.getElementById("playerBarTitle");
    els.playerComparison = document.getElementById("playerComparison");
    els.playerTableTitle = document.getElementById("playerTableTitle");
    els.playerMetricColumn = document.getElementById("playerMetricColumn");
    els.playerTable = document.querySelector(".player-table");
    els.playerTableBody = document.getElementById("playerTableBody");
    els.historyStartSeason = document.getElementById("historyStartSeason");
    els.historyEndSeason = document.getElementById("historyEndSeason");
    els.historyMetricSelect = document.getElementById("historyMetricSelect");
    els.historyTeamSelect = document.getElementById("historyTeamSelect");
    els.historyTeamMetricSelect = document.getElementById("historyTeamMetricSelect");
    els.historyCompareA = document.getElementById("historyCompareA");
    els.historyCompareB = document.getElementById("historyCompareB");
    els.historyKpis = document.getElementById("historyKpis");
    els.historyMetricTitle = document.getElementById("historyMetricTitle");
    els.historyMetricChart = document.getElementById("historyMetricChart");
    els.historyTeamChartTitle = document.getElementById("historyTeamChartTitle");
    els.historyTeamChart = document.getElementById("historyTeamChart");
    els.titleWinnersChart = document.getElementById("titleWinnersChart");
    els.historyComparison = document.getElementById("historyComparison");
    els.leagueGoalsChart = document.getElementById("leagueGoalsChart");
    els.goalsSplitChart = document.getElementById("goalsSplitChart");
    els.goalsVerdict = document.getElementById("goalsVerdict");
    els.championsTimeline = document.getElementById("championsTimeline");
    els.tooltip = document.getElementById("tooltip");
    els.loadError = document.getElementById("loadError");
  }

  function bindControls() {
    els.tabButtons.forEach((button) => {
      button.addEventListener("click", () => setActiveTab(button.dataset.tab));
    });

    els.teamSearch.addEventListener("input", (event) => {
      state.teamSearch = event.target.value.trim().toLowerCase();
      renderTeamSelector();
    });

    els.selectTopTeams.addEventListener("click", () => {
      state.selectedTeams = new Set(standingsForRound().slice(0, 6).map((row) => row.team));
      renderAll();
    });

    els.selectAllTeams.addEventListener("click", () => {
      state.selectedTeams = new Set(state.data.teams);
      renderAll();
    });

    els.clearTeams.addEventListener("click", () => {
      state.selectedTeams.clear();
      renderAll();
    });

    els.roundRange.addEventListener("input", (event) => {
      state.roundLimit = Number(event.target.value);
      renderAll();
    });

    els.metricSelect.addEventListener("change", (event) => {
      state.metric = event.target.value;
      renderCharts();
      renderTeamProfile();
    });

    els.standingsTable.addEventListener("click", (event) => {
      const header = event.target.closest("th[data-sort]");
      if (!header) return;
      updateTableSort(header.dataset.sort);
    });

    els.playerTeamFilter.addEventListener("change", (event) => {
      state.playerTeam = event.target.value;
      refreshPlayerSelectionForFilter();
      renderPlayerDashboard();
    });

    els.playerPositionFilter.addEventListener("change", (event) => {
      state.playerPosition = event.target.value;
      refreshPlayerSelectionForFilter();
      renderPlayerDashboard();
    });

    els.playerSearch.addEventListener("input", (event) => {
      state.playerSearch = event.target.value.trim().toLowerCase();
      renderPlayerDashboard();
    });

    els.playerMinMinutes.addEventListener("input", (event) => {
      state.playerMinMinutes = Math.max(0, Number(event.target.value) || 0);
      refreshPlayerSelectionForFilter();
      renderPlayerDashboard();
    });

    els.playerMinAppearances.addEventListener("input", (event) => {
      state.playerMinAppearances = Math.max(0, Number(event.target.value) || 0);
      refreshPlayerSelectionForFilter();
      renderPlayerDashboard();
    });

    els.playerMetricSelect.addEventListener("change", (event) => {
      state.playerMetric = event.target.value;
      renderPlayerDashboard();
    });

    els.selectTopPlayers.addEventListener("click", () => {
      state.selectedPlayers = new Set(filteredPlayers().slice(0, 8).map((player) => player.id));
      renderPlayerDashboard();
    });

    els.selectVisiblePlayers.addEventListener("click", () => {
      state.selectedPlayers = new Set(filteredPlayers().slice(0, 20).map((player) => player.id));
      renderPlayerDashboard();
    });

    els.clearPlayers.addEventListener("click", () => {
      state.selectedPlayers.clear();
      renderPlayerDashboard();
    });

    els.playerTable.addEventListener("click", (event) => {
      const header = event.target.closest("th[data-player-sort]");
      if (!header) return;
      updatePlayerTableSort(header.dataset.playerSort);
    });

    els.playerTableBody.addEventListener("click", (event) => {
      const row = event.target.closest("tr[data-player-id]");
      if (!row) return;
      togglePlayer(row.dataset.playerId);
    });

    els.historyStartSeason.addEventListener("change", (event) => {
      state.historyStart = Number(event.target.value);
      if (state.historyStart > state.historyEnd) state.historyEnd = state.historyStart;
      syncHistorySeasonControls();
      renderHistoryDashboard();
    });

    els.historyEndSeason.addEventListener("change", (event) => {
      state.historyEnd = Number(event.target.value);
      if (state.historyEnd < state.historyStart) state.historyStart = state.historyEnd;
      syncHistorySeasonControls();
      renderHistoryDashboard();
    });

    els.historyMetricSelect.addEventListener("change", (event) => {
      state.historyMetric = event.target.value;
      renderHistoryDashboard();
    });

    els.historyTeamSelect.addEventListener("change", (event) => {
      state.historyTeam = event.target.value;
      renderHistoryDashboard();
    });

    els.historyTeamMetricSelect.addEventListener("change", (event) => {
      state.historyTeamMetric = event.target.value;
      renderHistoryDashboard();
    });

    els.historyCompareA.addEventListener("change", (event) => {
      state.historyCompareA = Number(event.target.value);
      renderHistoryComparison();
    });

    els.historyCompareB.addEventListener("change", (event) => {
      state.historyCompareB = Number(event.target.value);
      renderHistoryComparison();
    });

    document.addEventListener("pointermove", moveTooltip);
    document.addEventListener("pointerleave", hideTooltip);
  }

  function hydrateControls(data, players, history) {
    els.roundRange.min = "1";
    els.roundRange.max = String(data.maxRound);
    els.roundRange.value = String(data.maxRound);
    els.roundMaxLabel.textContent = `Round ${data.maxRound}`;
    els.metricSelect.value = state.metric;
    els.playerMetricSelect.value = state.playerMetric;
    els.playerMinMinutes.value = String(state.playerMinMinutes);
    els.playerMinAppearances.value = String(state.playerMinAppearances);
    els.playerTeamFilter.innerHTML = [
      `<option value="all">All teams</option>`,
      ...data.teams.map((team) => `<option value="${escapeAttr(team)}">${escapeHTML(team)}</option>`),
    ].join("");
    els.playerTeamFilter.value = state.playerTeam;
    els.playerPositionFilter.value = state.playerPosition;
    hydrateHistoryControls(history);
  }

  function hydrateHistoryControls(history) {
    const seasonOptions = history.seasons.map((season) => seasonOption(season)).join("");
    els.historyStartSeason.innerHTML = seasonOptions;
    els.historyEndSeason.innerHTML = seasonOptions;
    els.historyCompareA.innerHTML = seasonOptions;
    els.historyCompareB.innerHTML = seasonOptions;
    els.historyMetricSelect.value = state.historyMetric;
    els.historyTeamMetricSelect.value = state.historyTeamMetric;
    els.historyTeamSelect.innerHTML = history.teams
      .map((team) => `<option value="${escapeAttr(team)}">${escapeHTML(team)}</option>`)
      .join("");
    els.historyTeamSelect.value = state.historyTeam;
    els.historyCompareA.value = String(state.historyCompareA);
    els.historyCompareB.value = String(state.historyCompareB);
    syncHistorySeasonControls();
  }

  function syncHistorySeasonControls() {
    els.historyStartSeason.value = String(state.historyStart);
    els.historyEndSeason.value = String(state.historyEnd);
  }

  function setActiveTab(tabName) {
    state.activeTab = tabName;
    els.tabButtons.forEach((button) => {
      const isActive = button.dataset.tab === tabName;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", isActive ? "true" : "false");
    });
    els.tabPanels.forEach((panel) => {
      const isActive = panel.dataset.tabPanel === tabName;
      panel.classList.toggle("is-active", isActive);
      panel.hidden = !isActive;
    });
    window.requestAnimationFrame(() => {
      if (tabName === "players") {
        renderPlayerDashboard();
      } else if (tabName === "history") {
        renderHistoryDashboard();
      } else {
        renderCharts();
      }
    });
  }

  function parseCSV(text) {
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;
    const cleanText = text.replace(/^\uFEFF/, "");

    for (let index = 0; index < cleanText.length; index += 1) {
      const char = cleanText[index];
      const next = cleanText[index + 1];

      if (char === '"') {
        if (inQuotes && next === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        row.push(field);
        field = "";
      } else if ((char === "\n" || char === "\r") && !inQuotes) {
        if (char === "\r" && next === "\n") index += 1;
        row.push(field);
        if (row.some((value) => value.trim() !== "")) rows.push(row);
        row = [];
        field = "";
      } else {
        field += char;
      }
    }

    if (field || row.length) {
      row.push(field);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
    }

    if (rows.length < 2) return [];

    const headers = rows[0].map((header) => header.replace(/^\uFEFF/, "").trim());
    return rows.slice(1).map((values, originalIndex) => {
      const record = { originalIndex };
      headers.forEach((header, index) => {
        record[header] = values[index] ? values[index].trim() : "";
      });
      return record;
    });
  }

  function buildSeasonModel(rows) {
    const matches = rows
      .filter((row) => row.HomeTeam && row.AwayTeam && row.FTHG !== "" && row.FTAG !== "")
      .map((row) => {
        const date = parseDate(row.Date, row.Time);
        return {
          ...row,
          date,
          sortKey: date.getTime(),
          homeGoals: toNumber(row.FTHG),
          awayGoals: toNumber(row.FTAG),
          homeHalfGoals: toNumber(row.HTHG),
          awayHalfGoals: toNumber(row.HTAG),
          homeShots: toNumber(row.HS),
          awayShots: toNumber(row.AS),
          homeShotsOnTarget: toNumber(row.HST),
          awayShotsOnTarget: toNumber(row.AST),
          homeCorners: toNumber(row.HC),
          awayCorners: toNumber(row.AC),
          homeYellow: toNumber(row.HY),
          awayYellow: toNumber(row.AY),
          homeRed: toNumber(row.HR),
          awayRed: toNumber(row.AR),
        };
      })
      .sort((a, b) => a.sortKey - b.sortKey || a.originalIndex - b.originalIndex);

    const teams = Array.from(new Set(matches.flatMap((match) => [match.HomeTeam, match.AwayTeam]))).sort(
      (a, b) => a.localeCompare(b),
    );
    const matchesPerRound = Math.max(1, teams.length / 2);
    matches.forEach((match, index) => {
      match.round = Math.floor(index / matchesPerRound) + 1;
    });
    const maxRound = Math.max(...matches.map((match) => match.round));

    const table = new Map(teams.map((team) => [team, emptyCumulative(team)]));
    const roundStats = new Map(teams.map((team) => [team, makeRoundStats(maxRound)]));
    const teamHistory = new Map(teams.map((team) => [team, []]));
    const standingsByRound = [];
    const rounds = Array.from({ length: maxRound }, (_, index) => index + 1);

    rounds.forEach((round) => {
      matches.filter((match) => match.round === round).forEach((match) => applyMatch(match, table, roundStats));
      const ranked = rankTable(Array.from(table.values()));
      standingsByRound[round] = ranked.map((row) => ({ ...row, form: [...row.form] }));
      ranked.forEach((row) => {
        teamHistory.get(row.team)[round] = { ...row, form: [...row.form] };
      });
    });

    const latestStandings = standingsByRound[maxRound];
    const totalGoals = matches.reduce((sum, match) => sum + match.homeGoals + match.awayGoals, 0);
    const dates = matches.map((match) => match.date).filter(Boolean);

    return {
      matches,
      teams,
      rounds,
      maxRound,
      matchesPerRound,
      roundStats,
      teamHistory,
      standingsByRound,
      latestStandings,
      totalGoals,
      firstDate: dates[0],
      lastDate: dates[dates.length - 1],
    };
  }

  function buildPlayerModel(rows, knownTeams) {
    const knownTeamSet = new Set(knownTeams);
    const players = rows
      .filter((row) => row.player_name && row.team_name)
      .map((row, index) => {
        const rawTeam = decodeEntities(row.team_name);
        const team = normalizePlayerTeam(rawTeam);
        const name = decodeEntities(row.player_name);
        const goals = toNumber(row.goals);
        const assists = toNumber(row.assists);
        const minutes = toNumber(row.minutesPlayed);
        const appearances = toNumber(row.appearances);
        const expectedGoals = toNumber(row.expectedGoals);
        const expectedAssists = toNumber(row.expectedAssists);
        const goalsAssistsSum = toNumber(row.goalsAssistsSum) || goals + assists;
        const totalShots = toNumber(row.totalShots);
        const shotsOnTarget = toNumber(row.shotsOnTarget);

        return {
          raw: row,
          id: row.id || `${name}|${team}|${index}`,
          name,
          team,
          rawTeam,
          teamMatched: knownTeamSet.has(team),
          position: row.position || "U",
          appearances,
          assists,
          goals,
          goalsAssistsSum,
          expectedGoals,
          expectedAssists,
          bigChancesCreated: toNumber(row.bigChancesCreated),
          bigChancesMissed: toNumber(row.bigChancesMissed),
          keyPasses: toNumber(row.keyPasses),
          minutesPlayed: minutes,
          rating: toNumber(row.rating),
          totalShots,
          shotsOnTarget,
          tackles: toNumber(row.tackles),
          tacklesWon: toNumber(row.tacklesWon),
          totalDuelsWon: toNumber(row.totalDuelsWon),
          cleanSheet: toNumber(row.cleanSheet),
          saves: toNumber(row.saves),
          accuratePassesPercentage: toNumber(row.accuratePassesPercentage),
          successfulDribbles: toNumber(row.successfulDribbles),
          yellowCards: toNumber(row.yellowCards),
          redCards: toNumber(row.redCards) + toNumber(row.directRedCards),
          finishingDelta: goals - expectedGoals,
          goalsPer90: per90(goals, minutes),
          assistsPer90: per90(assists, minutes),
          goalsAssistsPer90: per90(goals + assists, minutes),
          xgPer90: per90(expectedGoals, minutes),
          xaPer90: per90(expectedAssists, minutes),
          shotsPer90: per90(totalShots, minutes),
          keyPassesPer90: per90(toNumber(row.keyPasses), minutes),
          tacklesWonPer90: per90(toNumber(row.tacklesWon), minutes),
          savePercentage: toNumber(row.saves) + toNumber(row.goalsPrevented) > 0 ? toNumber(row.goalsPrevented) : 0,
        };
      });

    const byId = new Map(players.map((player) => [player.id, player]));
    const byTeam = new Map();
    players.forEach((player) => {
      if (!byTeam.has(player.team)) byTeam.set(player.team, []);
      byTeam.get(player.team).push(player);
    });

    return {
      source: PLAYER_CSV_FILE,
      players,
      byId,
      byTeam,
      teams: Array.from(new Set(players.map((player) => player.team))).sort((a, b) => a.localeCompare(b)),
      topPlayers: [...players].sort(playerComparator("goalsAssistsSum")).slice(0, 16),
    };
  }

  function buildHistoryModel(items) {
    const seasons = items
      .map(buildHistorySeason)
      .filter((season) => season.matches.length)
      .sort((a, b) => a.year - b.year);
    const teams = Array.from(new Set(seasons.flatMap((season) => season.teams))).sort((a, b) => a.localeCompare(b));
    const byYear = new Map(seasons.map((season) => [season.year, season]));

    return {
      seasons,
      teams,
      byYear,
      minYear: seasons[0]?.year || HISTORY_FILES[0].year,
      maxYear: seasons[seasons.length - 1]?.year || HISTORY_FILES[HISTORY_FILES.length - 1].year,
    };
  }

  function buildHistorySeason(source) {
    const matches = source.rows
      .filter((row) => row.HomeTeam && row.AwayTeam && row.FTHG !== "" && row.FTAG !== "")
      .map((row) => {
        const date = parseDate(row.Date, row.Time);
        return {
          ...row,
          date,
          sortKey: date.getTime(),
          homeGoals: toNumber(row.FTHG),
          awayGoals: toNumber(row.FTAG),
          homeHalfGoals: toNumber(row.HTHG),
          awayHalfGoals: toNumber(row.HTAG),
          homeShots: toNumber(row.HS),
          awayShots: toNumber(row.AS),
          homeShotsOnTarget: toNumber(row.HST),
          awayShotsOnTarget: toNumber(row.AST),
          homeCorners: toNumber(row.HC),
          awayCorners: toNumber(row.AC),
          homeYellow: toNumber(row.HY),
          awayYellow: toNumber(row.AY),
          homeRed: toNumber(row.HR),
          awayRed: toNumber(row.AR),
          attendance: toNumber(row.Attendance),
        };
      })
      .sort((a, b) => a.sortKey - b.sortKey || a.originalIndex - b.originalIndex);

    const teams = Array.from(new Set(matches.flatMap((match) => [match.HomeTeam, match.AwayTeam]))).sort(
      (a, b) => a.localeCompare(b),
    );
    const table = new Map(teams.map((team) => [team, emptyCumulative(team)]));
    matches.forEach((match) => applyHistoryMatch(match, table));

    const standings = rankTable(Array.from(table.values())).map((row) => ({
      ...row,
      pointsPerMatch: row.played ? row.points / row.played : 0,
    }));
    const byTeam = new Map(standings.map((row) => [row.team, row]));
    const totalGoals = matches.reduce((sum, match) => sum + match.homeGoals + match.awayGoals, 0);
    const totalCards = matches.reduce(
      (sum, match) => sum + match.homeYellow + match.awayYellow + match.homeRed + match.awayRed,
      0,
    );
    const attendanceValues = matches.map((match) => match.attendance).filter((value) => value > 0);
    const homeWins = matches.filter((match) => match.homeGoals > match.awayGoals).length;
    const draws = matches.filter((match) => match.homeGoals === match.awayGoals).length;
    const awayWins = matches.filter((match) => match.homeGoals < match.awayGoals).length;
    const champion = standings[0] || emptyCumulative("n/a");
    const runnerUp = standings[1] || emptyCumulative("n/a");
    const matchCount = Math.max(1, matches.length);

    return {
      year: source.year,
      label: source.label,
      file: source.file,
      matches,
      matchCount: matches.length,
      teams,
      standings,
      byTeam,
      champion,
      runnerUp,
      championPoints: champion.points || 0,
      titleMargin: Math.max(0, (champion.points || 0) - (runnerUp.points || 0)),
      topFourCutoff: standings[3]?.points || 0,
      survivalPoints: standings[16]?.points || 0,
      totalGoals,
      goalsPerMatch: totalGoals / matchCount,
      homeWinRate: (homeWins / matchCount) * 100,
      drawRate: (draws / matchCount) * 100,
      awayWinRate: (awayWins / matchCount) * 100,
      cardsPerMatch: totalCards / matchCount,
      avgAttendance: attendanceValues.length ? average(attendanceValues) : 0,
    };
  }

  function applyHistoryMatch(match, table) {
    const home = table.get(match.HomeTeam);
    const away = table.get(match.AwayTeam);

    addTeamMatch(home, {
      gf: match.homeGoals,
      ga: match.awayGoals,
      shotsFor: match.homeShots,
      shotsAgainst: match.awayShots,
      sotFor: match.homeShotsOnTarget,
      sotAgainst: match.awayShotsOnTarget,
      cornersFor: match.homeCorners,
      cornersAgainst: match.awayCorners,
      yellow: match.homeYellow,
      red: match.homeRed,
    });
    addTeamMatch(away, {
      gf: match.awayGoals,
      ga: match.homeGoals,
      shotsFor: match.awayShots,
      shotsAgainst: match.homeShots,
      sotFor: match.awayShotsOnTarget,
      sotAgainst: match.homeShotsOnTarget,
      cornersFor: match.awayCorners,
      cornersAgainst: match.homeCorners,
      yellow: match.awayYellow,
      red: match.awayRed,
    });

    if (match.homeGoals > match.awayGoals) {
      home.wins += 1;
      away.losses += 1;
      home.points += 3;
      home.form.push("W");
      away.form.push("L");
    } else if (match.homeGoals < match.awayGoals) {
      away.wins += 1;
      home.losses += 1;
      away.points += 3;
      away.form.push("W");
      home.form.push("L");
    } else {
      home.draws += 1;
      away.draws += 1;
      home.points += 1;
      away.points += 1;
      home.form.push("D");
      away.form.push("D");
    }
  }

  function emptyCumulative(team) {
    return {
      team,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      points: 0,
      shotsFor: 0,
      shotsAgainst: 0,
      sotFor: 0,
      sotAgainst: 0,
      cornersFor: 0,
      cornersAgainst: 0,
      yellow: 0,
      red: 0,
      form: [],
    };
  }

  function makeRoundStats(maxRound) {
    const stats = [];
    for (let round = 1; round <= maxRound; round += 1) {
      stats[round] = {
        round,
        played: false,
        gf: 0,
        ga: 0,
        points: 0,
        shotsFor: 0,
        shotsAgainst: 0,
        sotFor: 0,
        sotAgainst: 0,
        cornersFor: 0,
        cornersAgainst: 0,
        yellow: 0,
        red: 0,
        result: "",
      };
    }
    return stats;
  }

  function applyMatch(match, table, roundStats) {
    const home = table.get(match.HomeTeam);
    const away = table.get(match.AwayTeam);
    const homeRound = roundStats.get(match.HomeTeam)[match.round];
    const awayRound = roundStats.get(match.AwayTeam)[match.round];

    addTeamMatch(home, {
      gf: match.homeGoals,
      ga: match.awayGoals,
      shotsFor: match.homeShots,
      shotsAgainst: match.awayShots,
      sotFor: match.homeShotsOnTarget,
      sotAgainst: match.awayShotsOnTarget,
      cornersFor: match.homeCorners,
      cornersAgainst: match.awayCorners,
      yellow: match.homeYellow,
      red: match.homeRed,
    });
    addTeamMatch(away, {
      gf: match.awayGoals,
      ga: match.homeGoals,
      shotsFor: match.awayShots,
      shotsAgainst: match.homeShots,
      sotFor: match.awayShotsOnTarget,
      sotAgainst: match.homeShotsOnTarget,
      cornersFor: match.awayCorners,
      cornersAgainst: match.homeCorners,
      yellow: match.awayYellow,
      red: match.awayRed,
    });

    updateRoundStat(homeRound, {
      gf: match.homeGoals,
      ga: match.awayGoals,
      shotsFor: match.homeShots,
      shotsAgainst: match.awayShots,
      sotFor: match.homeShotsOnTarget,
      sotAgainst: match.awayShotsOnTarget,
      cornersFor: match.homeCorners,
      cornersAgainst: match.awayCorners,
      yellow: match.homeYellow,
      red: match.homeRed,
    });
    updateRoundStat(awayRound, {
      gf: match.awayGoals,
      ga: match.homeGoals,
      shotsFor: match.awayShots,
      shotsAgainst: match.homeShots,
      sotFor: match.awayShotsOnTarget,
      sotAgainst: match.homeShotsOnTarget,
      cornersFor: match.awayCorners,
      cornersAgainst: match.homeCorners,
      yellow: match.awayYellow,
      red: match.awayRed,
    });

    if (match.homeGoals > match.awayGoals) {
      home.wins += 1;
      away.losses += 1;
      home.points += 3;
      home.form.push("W");
      away.form.push("L");
      homeRound.points = 3;
      awayRound.points = 0;
      homeRound.result = "W";
      awayRound.result = "L";
    } else if (match.homeGoals < match.awayGoals) {
      away.wins += 1;
      home.losses += 1;
      away.points += 3;
      away.form.push("W");
      home.form.push("L");
      awayRound.points = 3;
      homeRound.points = 0;
      awayRound.result = "W";
      homeRound.result = "L";
    } else {
      home.draws += 1;
      away.draws += 1;
      home.points += 1;
      away.points += 1;
      home.form.push("D");
      away.form.push("D");
      homeRound.points = 1;
      awayRound.points = 1;
      homeRound.result = "D";
      awayRound.result = "D";
    }
  }

  function addTeamMatch(team, matchStats) {
    team.played += 1;
    team.gf += matchStats.gf;
    team.ga += matchStats.ga;
    team.gd = team.gf - team.ga;
    team.shotsFor += matchStats.shotsFor;
    team.shotsAgainst += matchStats.shotsAgainst;
    team.sotFor += matchStats.sotFor;
    team.sotAgainst += matchStats.sotAgainst;
    team.cornersFor += matchStats.cornersFor;
    team.cornersAgainst += matchStats.cornersAgainst;
    team.yellow += matchStats.yellow;
    team.red += matchStats.red;
  }

  function updateRoundStat(round, values) {
    round.played = true;
    Object.entries(values).forEach(([key, value]) => {
      round[key] += value;
    });
  }

  function rankTable(rows) {
    return rows
      .map((row) => ({ ...row, form: [...row.form] }))
      .sort(
        (a, b) =>
          b.points - a.points ||
          b.gd - a.gd ||
          b.gf - a.gf ||
          a.ga - b.ga ||
          a.team.localeCompare(b.team),
      )
      .map((row, index) => ({ ...row, position: index + 1 }));
  }

  function renderAll() {
    renderSeasonKpis();
    renderTeamSelector();
    renderCharts();
    renderTeamProfile();
    renderStandings();
    renderPlayerDashboard();
    renderHistoryDashboard();
    updateRoundControls();
  }

  function renderCharts() {
    renderPositionChart();
    renderGoalsChart(els.goalsForChart, {
      metric: "gf",
      label: "Goals scored",
      emptyLabel: "Goals scored per round",
    });
    renderGoalsChart(els.goalsAgainstChart, {
      metric: "ga",
      label: "Goals conceded",
      emptyLabel: "Goals conceded per round",
    });
    renderMetricChart();
    renderTeamMapChart();
    renderFormHeatmap();
    renderHtftChart();
    renderLegend();
  }

  function renderPlayerDashboard() {
    if (!state.players) return;
    renderPlayerKpis();
    renderPlayerSelector();
    renderPlayerCharts();
    renderPlayerComparison();
    renderPlayerTable();
  }

  function renderPlayerCharts() {
    if (!state.players) return;
    renderPlayerScatterChart();
    renderPlayerBarChart();
  }

  function renderHistoryDashboard() {
    if (!state.history) return;
    renderHistoryKpis();
    renderHistoryCharts();
    renderGoalsVerdict();
    renderHistoryComparison();
    renderChampionsTimeline();
  }

  function renderHistoryCharts() {
    if (!state.history) return;
    renderLeagueGoalsChart();
    renderGoalsSplitChart();
    renderHistoryMetricChart();
    renderHistoryTeamChart();
    renderTitleWinnersChart();
  }

  function renderHistoryKpis() {
    const seasons = historySeasonsInRange();
    if (!seasons.length) {
      els.historyKpis.innerHTML = `<div class="kpi-card"><div class="empty-state">No seasons in this range.</div></div>`;
      return;
    }

    const titleLeader = historyTitleCounts(seasons)[0];
    const highestScoring = [...seasons].sort((a, b) => b.goalsPerMatch - a.goalsPerMatch)[0];
    const tightestRace = [...seasons].sort((a, b) => a.titleMargin - b.titleMargin || b.championPoints - a.championPoints)[0];
    const averageGoals = average(seasons.map((season) => season.goalsPerMatch));
    const cards = [
      {
        label: "Seasons loaded",
        value: seasons.length,
        detail: `${seasons[0].label} through ${seasons[seasons.length - 1].label}`,
      },
      {
        label: "Most titles",
        value: titleLeader ? titleLeader.team : "n/a",
        detail: titleLeader ? `${titleLeader.count} titles in selected era` : "No champion data",
      },
      {
        label: "Highest scoring",
        value: highestScoring.label,
        detail: `${highestScoring.goalsPerMatch.toFixed(2)} goals per match`,
      },
      {
        label: "Tightest race",
        value: tightestRace.label,
        detail: `${tightestRace.champion.team} won by ${tightestRace.titleMargin} pts · era avg ${averageGoals.toFixed(2)} G/m`,
      },
    ];

    els.historyKpis.innerHTML = cards
      .map(
        (card) => `
          <div class="kpi-card">
            <div class="kpi-label">${escapeHTML(card.label)}</div>
            <div class="kpi-value">${escapeHTML(String(card.value))}</div>
            <div class="kpi-detail">${escapeHTML(card.detail)}</div>
          </div>
        `,
      )
      .join("");
  }

  function renderHistoryMetricChart() {
    const svg = els.historyMetricChart;
    const metric = HISTORY_METRICS[state.historyMetric];
    const seasons = historySeasonsInRange();
    const points = seasons
      .map((season) => ({ season, year: season.year, value: metric.accessor(season) }))
      .filter((point) => Number.isFinite(point.value) && (state.historyMetric !== "avgAttendance" || point.value > 0));
    els.historyMetricTitle.textContent = metric.label;

    const { width, height } = chartBox(svg, CHART.width, CHART.height);
    const margin = { top: 24, right: 26, bottom: 46, left: state.historyMetric === "avgAttendance" ? 74 : 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    clearSVG(svg, width, height);
    if (points.length < 2) {
      appendText(svg, "No historical values for this metric in the selected era.", width / 2, height / 2, "axis-label", "middle");
      return;
    }

    const yearMin = seasons[0].year;
    const yearMax = seasons[seasons.length - 1].year;
    const yScaleInfo = niceLinearScale(Math.min(0, ...points.map((point) => point.value)), Math.max(...points.map((point) => point.value)));
    drawGrid(svg, {
      width,
      height,
      margin,
      xTicks: historyYearTicks(seasons),
      yTicks: yScaleInfo.ticks,
      xScale: (year) => xScaleValue(year, yearMin, yearMax, margin.left, innerWidth),
      yScale: (value) => yScaleValue(value, yScaleInfo.min, yScaleInfo.max, margin.top, innerHeight),
      yFormatter: metric.formatter,
    });
    appendText(svg, "Season start year", width / 2, height - 10, "axis-label", "middle");
    appendText(svg, metric.label, 14, margin.top + innerHeight / 2, "axis-label", "middle", -90);

    const path = pathFromSeries(points, (point) => xScaleValue(point.year, yearMin, yearMax, margin.left, innerWidth), (point) =>
      yScaleValue(point.value, yScaleInfo.min, yScaleInfo.max, margin.top, innerHeight),
    );
    svg.append(
      svgEl("path", {
        class: "chart-line",
        d: path,
        stroke: "#0f766e",
        "stroke-width": 3,
        opacity: 0.94,
      }),
    );

    const avg = average(points.map((point) => point.value));
    const avgY = yScaleValue(avg, yScaleInfo.min, yScaleInfo.max, margin.top, innerHeight);
    svg.append(
      svgEl("line", {
        x1: margin.left,
        x2: margin.left + innerWidth,
        y1: avgY,
        y2: avgY,
        stroke: "#9aa8b2",
        "stroke-width": 1,
        "stroke-dasharray": "5 5",
      }),
    );
    appendText(svg, `Avg ${metric.formatter(avg)}`, margin.left + innerWidth - 4, avgY - 7, "axis-label", "end");

    points.forEach((point) => {
      svg.append(
        svgEl("circle", {
          class: "chart-point",
          cx: xScaleValue(point.year, yearMin, yearMax, margin.left, innerWidth),
          cy: yScaleValue(point.value, yScaleInfo.min, yScaleInfo.max, margin.top, innerHeight),
          r: 4,
          fill: "#0f766e",
          opacity: 0.82,
          "data-tooltip": `${point.season.label}|${metric.label}: ${metric.formatter(point.value)}|Champion: ${point.season.champion.team} (${point.season.championPoints} pts)|${point.season.matchCount} matches`,
        }),
      );
    });
  }

  function renderHistoryTeamChart() {
    const svg = els.historyTeamChart;
    const team = state.historyTeam;
    const metricKey = state.historyTeamMetric;
    const metric = HISTORY_TEAM_METRICS[metricKey];
    const seasons = historySeasonsInRange();
    const points = seasons
      .map((season) => {
        const row = season.byTeam.get(team);
        return row ? { season, year: season.year, row, value: historyTeamMetricValue(row, metricKey) } : null;
      })
      .filter(Boolean);
    els.historyTeamChartTitle.textContent = `${team}: ${metric.label}`;

    const { width, height } = chartBox(svg, CHART.width, CHART.height);
    const margin = { top: 24, right: 28, bottom: 46, left: 52 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    clearSVG(svg, width, height);
    if (points.length < 2) {
      appendText(svg, `${team} has fewer than two top-flight seasons in this range.`, width / 2, height / 2, "axis-label", "middle");
      return;
    }

    const yearMin = seasons[0].year;
    const yearMax = seasons[seasons.length - 1].year;
    const color = teamColor(team);
    const isPosition = metricKey === "position";
    const yScaleInfo = isPosition ? null : niceLinearScale(Math.min(0, ...points.map((point) => point.value)), Math.max(...points.map((point) => point.value)));
    const yFor = (value) =>
      isPosition
        ? yScalePosition(value, 20, margin.top, innerHeight)
        : yScaleValue(value, yScaleInfo.min, yScaleInfo.max, margin.top, innerHeight);

    drawGrid(svg, {
      width,
      height,
      margin,
      xTicks: historyYearTicks(seasons),
      yTicks: isPosition ? positionTicks(20) : yScaleInfo.ticks,
      xScale: (year) => xScaleValue(year, yearMin, yearMax, margin.left, innerWidth),
      yScale: yFor,
      yFormatter: isPosition ? (value) => `#${value}` : metric.formatter,
    });
    appendText(svg, "Season start year", width / 2, height - 10, "axis-label", "middle");
    appendText(svg, metric.label, 14, margin.top + innerHeight / 2, "axis-label", "middle", -90);

    const path = pathFromSeries(points, (point) => xScaleValue(point.year, yearMin, yearMax, margin.left, innerWidth), (point) => yFor(point.value));
    svg.append(svgEl("path", { class: "chart-line", d: path, stroke: color, "stroke-width": 3, opacity: 0.94 }));

    points.forEach((point) => {
      svg.append(
        svgEl("circle", {
          class: "chart-point",
          cx: xScaleValue(point.year, yearMin, yearMax, margin.left, innerWidth),
          cy: yFor(point.value),
          r: 4,
          fill: color,
          opacity: 0.82,
          "data-tooltip": `${team} · ${point.season.label}|${metric.label}: ${metric.formatter(point.value)}|#${point.row.position}, ${point.row.points} pts, ${signed(point.row.gd)} GD|${point.row.gf} GF, ${point.row.ga} GA`,
        }),
      );
    });
  }

  function renderTitleWinnersChart() {
    const svg = els.titleWinnersChart;
    const seasons = historySeasonsInRange();
    const rows = historyTitleCounts(seasons);
    const { width, height } = chartBox(svg, CHART.width, CHART.height);
    const margin = { top: 18, right: 48, bottom: 28, left: width < 620 ? 118 : 150 };
    const innerWidth = width - margin.left - margin.right;
    const rowHeight = Math.max(22, (height - margin.top - margin.bottom) / Math.max(1, rows.length));
    const maxValue = Math.max(1, ...rows.map((row) => row.count));

    clearSVG(svg, width, height);
    if (!rows.length) {
      appendText(svg, "No title data in this range.", width / 2, height / 2, "axis-label", "middle");
      return;
    }

    rows.forEach((row, index) => {
      const y = margin.top + index * rowHeight;
      const barWidth = (row.count / maxValue) * innerWidth;
      appendText(svg, row.team, margin.left - 9, y + rowHeight * 0.64, "axis-label", "end");
      svg.append(
        svgEl("rect", {
          x: margin.left,
          y: y + rowHeight * 0.2,
          width: Math.max(3, barWidth),
          height: Math.max(12, rowHeight * 0.6),
          rx: 4,
          fill: teamColor(row.team),
          opacity: 0.88,
          "data-tooltip": `${row.team}|${row.count} title${row.count === 1 ? "" : "s"}|${row.seasons.join(", ")}`,
        }),
      );
      appendText(svg, row.count, margin.left + barWidth + 7, y + rowHeight * 0.64, "axis-label", "start");
    });
  }

  function renderHistoryComparison() {
    if (!state.history) return;
    const seasonA = state.history.byYear.get(state.historyCompareA);
    const seasonB = state.history.byYear.get(state.historyCompareB);
    if (!seasonA || !seasonB) {
      els.historyComparison.innerHTML = `<div class="empty-state">Pick two loaded seasons to compare.</div>`;
      return;
    }

    const statRows = [
      { label: "Goals/match", value: (season) => season.goalsPerMatch, formatter: (value) => value.toFixed(2) },
      { label: "Champion pts", value: (season) => season.championPoints, formatter: (value) => value.toFixed(0) },
      { label: "Title margin", value: (season) => season.titleMargin, formatter: (value) => value.toFixed(0) },
      { label: "Top-four cutoff", value: (season) => season.topFourCutoff, formatter: (value) => value.toFixed(0) },
      { label: "17th pts", value: (season) => season.survivalPoints, formatter: (value) => value.toFixed(0) },
      { label: "Home win rate", value: (season) => season.homeWinRate, formatter: (value) => `${value.toFixed(0)}%` },
    ];

    els.historyComparison.innerHTML = `
      <div class="history-season-cards">
        ${[seasonA, seasonB]
          .map(
            (season) => `
              <article class="history-season-card" style="--team-color: ${teamColor(season.champion.team)}">
                <span>${escapeHTML(season.label)}</span>
                <strong>${escapeHTML(season.champion.team)}</strong>
                <small>${season.championPoints} pts champion · ${season.goalsPerMatch.toFixed(2)} goals/match</small>
              </article>
            `,
          )
          .join("")}
      </div>
      <div class="history-delta-grid">
        ${statRows
          .map((row) => {
            const aValue = row.value(seasonA);
            const bValue = row.value(seasonB);
            return `
              <div class="history-delta-row">
                <span>${escapeHTML(row.label)}</span>
                <strong>${escapeHTML(formatDelta(aValue - bValue, row.formatter))}</strong>
                <small>${escapeHTML(row.formatter(aValue))} vs ${escapeHTML(row.formatter(bValue))}</small>
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  }

  function renderChampionsTimeline() {
    const seasons = historySeasonsInRange();
    els.championsTimeline.innerHTML = seasons
      .map(
        (season) => `
          <article class="champion-tile" style="--team-color: ${teamColor(season.champion.team)}">
            <span>${escapeHTML(season.label)}</span>
            <strong>${escapeHTML(season.champion.team)}</strong>
            <small>${season.championPoints} pts · +${season.titleMargin}</small>
          </article>
        `,
      )
      .join("");
  }

  function renderLeagueGoalsChart() {
    const svg = els.leagueGoalsChart;
    if (!svg) return;
    const series = goalsTrendSeries();
    const { width, height } = chartBox(svg, CHART.width, CHART.height);
    const margin = { top: 28, right: 24, bottom: 52, left: 62 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    clearSVG(svg, width, height);
    if (series.length < 2) {
      appendText(svg, "Not enough seasons to chart league scoring.", width / 2, height / 2, "axis-label", "middle");
      return;
    }

    const maxValue = Math.max(...series.map((point) => Math.max(point.totalGoals, point.projectedGoals)));
    const yScaleInfo = niceLinearScale(0, maxValue);
    const yFor = (value) => yScaleValue(value, yScaleInfo.min, yScaleInfo.max, margin.top, innerHeight);
    const baseY = margin.top + innerHeight;

    yScaleInfo.ticks.forEach((tick) => {
      const y = yFor(tick);
      svg.append(svgEl("line", { class: "grid-line", x1: margin.left, x2: margin.left + innerWidth, y1: y, y2: y }));
      appendText(svg, String(Math.round(tick)), margin.left - 10, y + 4, "axis-label", "end");
    });
    svg.append(svgEl("line", { class: "axis-line", x1: margin.left, x2: margin.left, y1: margin.top, y2: baseY }));
    svg.append(svgEl("line", { class: "axis-line", x1: margin.left, x2: margin.left + innerWidth, y1: baseY, y2: baseY }));
    appendText(svg, "Total goals scored leaguewide", 14, margin.top + innerHeight / 2, "axis-label", "middle", -90);
    if (series.some((point) => point.partial)) {
      appendText(svg, "Dashed cap = current season on full-season pace", margin.left + innerWidth, margin.top - 12, "axis-label", "end");
    }

    const latestYear = series[series.length - 1].year;
    const slot = innerWidth / series.length;
    const barWidth = Math.max(4, slot * 0.66);

    series.forEach((point, index) => {
      const isLatest = point.year === latestYear;
      const cx = margin.left + (index + 0.5) * slot;
      const x = cx - barWidth / 2;
      const color = isLatest ? "#e11d48" : "#0f766e";
      const y = yFor(point.totalGoals);

      if (point.partial && point.projectedGoals > point.totalGoals) {
        const projY = yFor(point.projectedGoals);
        svg.append(
          svgEl("rect", {
            x,
            y: projY,
            width: barWidth,
            height: Math.max(0, baseY - projY),
            rx: 3,
            fill: "none",
            stroke: color,
            "stroke-width": 1.4,
            "stroke-dasharray": "4 4",
            opacity: 0.7,
            "data-tooltip": `${point.label} · on pace|≈${Math.round(point.projectedGoals)} goals over a full season|${point.goalsPerMatch.toFixed(2)} per match so far|${point.matchCount}/${point.fullMatches} matches played`,
          }),
        );
      }

      svg.append(
        svgEl("rect", {
          class: "chart-point",
          x,
          y,
          width: barWidth,
          height: Math.max(1, baseY - y),
          rx: 3,
          fill: color,
          opacity: point.partial ? 0.92 : 0.82,
          "data-tooltip": `${point.label}${point.partial ? " (in progress)" : ""}|${point.totalGoals} goals|${point.goalsPerMatch.toFixed(2)} per match|Champion: ${point.champion}`,
        }),
      );

      if (isLatest || index === 0 || point.year % 5 === 0) {
        appendText(svg, String(point.year), cx, baseY + 18, "axis-label", "middle");
      }
    });
  }

  function renderGoalsSplitChart() {
    const svg = els.goalsSplitChart;
    if (!svg) return;
    const series = goalsTrendSeries();
    const { width, height } = chartBox(svg, CHART.width, CHART.height);
    const margin = { top: 36, right: 30, bottom: 48, left: 54 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    clearSVG(svg, width, height);
    if (series.length < 2) {
      appendText(svg, "Not enough seasons to compare.", width / 2, height / 2, "axis-label", "middle");
      return;
    }

    const yearMin = series[0].year;
    const yearMax = series[series.length - 1].year;
    const latestYear = yearMax;
    const maxValue = Math.max(...series.map((point) => Math.max(point.arsenalPerGame, point.restPerGame)));
    const yScaleInfo = niceLinearScale(0, maxValue);
    const xFor = (year) => xScaleValue(year, yearMin, yearMax, margin.left, innerWidth);
    const yFor = (value) => yScaleValue(value, yScaleInfo.min, yScaleInfo.max, margin.top, innerHeight);

    drawGrid(svg, {
      width,
      height,
      margin,
      xTicks: yearTicksFor(yearMin, yearMax),
      yTicks: yScaleInfo.ticks,
      xScale: xFor,
      yScale: yFor,
      yFormatter: (value) => value.toFixed(1),
    });
    appendText(svg, "Season start year", width / 2, height - 10, "axis-label", "middle");
    appendText(svg, "Goals scored per game", 14, margin.top + innerHeight / 2, "axis-label", "middle", -90);

    const lines = [
      { key: "restPerGame", label: "Rest of league (avg club)", color: "#64748b", dash: "6 4" },
      { key: "arsenalPerGame", label: "Arsenal", color: teamColor("Arsenal"), dash: null },
    ];

    let legendX = margin.left;
    lines.forEach((line) => {
      svg.append(
        svgEl("line", {
          x1: legendX,
          x2: legendX + 22,
          y1: 16,
          y2: 16,
          stroke: line.color,
          "stroke-width": 3,
          "stroke-dasharray": line.dash || "0",
        }),
      );
      appendText(svg, line.label, legendX + 28, 20, "axis-label", "start");
      legendX += line.label.length * 6.6 + 60;
    });

    lines.forEach((line) => {
      const path = pathFromSeries(series, (point) => xFor(point.year), (point) => yFor(point[line.key]));
      const attrs = { class: "chart-line", d: path, stroke: line.color, "stroke-width": 3, opacity: 0.94 };
      if (line.dash) attrs["stroke-dasharray"] = line.dash;
      svg.append(svgEl("path", attrs));

      series.forEach((point) => {
        const isCurrent = point.year === latestYear;
        svg.append(
          svgEl("circle", {
            class: "chart-point",
            cx: xFor(point.year),
            cy: yFor(point[line.key]),
            r: isCurrent ? 5.5 : 3.4,
            fill: line.color,
            stroke: isCurrent ? "#172026" : "#ffffff",
            "stroke-width": isCurrent ? 1.6 : 0.8,
            opacity: 0.9,
            "data-tooltip": `${line.label} · ${point.label}|${point[line.key].toFixed(2)} goals per game|League: ${point.goalsPerMatch.toFixed(2)} per match|Champion: ${point.champion}`,
          }),
        );
      });
    });
  }

  function renderGoalsVerdict() {
    if (!els.goalsVerdict) return;
    const series = goalsTrendSeries();
    const current = series[series.length - 1];
    if (!current) {
      els.goalsVerdict.innerHTML = "";
      return;
    }

    const priorFull = series.filter((point) => !point.partial && point.year < current.year);
    const recent = priorFull.slice(-5);
    const recentAvg = recent.length ? average(recent.map((point) => point.goalsPerMatch)) : current.goalsPerMatch;
    const leagueDelta = current.goalsPerMatch - recentAvg;
    const arsVsRest = current.arsenalPerGame - current.restPerGame;

    const leaguePhrase =
      leagueDelta <= -0.08
        ? `down on the ${recentAvg.toFixed(2)} averaged across the previous five seasons — scoring has cooled leaguewide`
        : leagueDelta >= 0.08
          ? `up on the ${recentAvg.toFixed(2)} averaged across the previous five seasons — scoring is actually higher than recent years`
          : `right in line with the ${recentAvg.toFixed(2)} of the previous five seasons`;

    const arsPhrase =
      arsVsRest >= 0
        ? `still out-scored the average rival club (${current.restPerGame.toFixed(2)} per game), so the champions are not the ones dragging the numbers down`
        : `scored fewer than the average rival club (${current.restPerGame.toFixed(2)} per game) — a genuinely blunt title win`;

    const verdict =
      leagueDelta <= -0.08 && arsVsRest >= 0
        ? "Verdict: a leaguewide dip, not a boring Arsenal."
        : arsVsRest < 0
          ? "Verdict: Arsenal really were the boring ones."
          : "Verdict: scoring held up — the low points haul came from a tight, evenly-matched race.";

    els.goalsVerdict.innerHTML = `
      In <strong>${escapeHTML(current.label)}</strong> the league is averaging
      <strong>${current.goalsPerMatch.toFixed(2)}</strong> goals per match, ${escapeHTML(leaguePhrase)}.
      Arsenal themselves managed <strong>${current.arsenalPerGame.toFixed(2)}</strong> goals per game and
      ${escapeHTML(arsPhrase)}. <strong>${escapeHTML(verdict)}</strong>
    `;
  }

  function renderSeasonKpis() {
    const data = state.data;
    const standings = standingsForRound();
    const leader = standings[0];
    const matchesShown = data.matches.filter((match) => match.round <= state.roundLimit);
    const goalsShown = matchesShown.reduce((sum, match) => sum + match.homeGoals + match.awayGoals, 0);
    const avgGoals = matchesShown.length ? goalsShown / matchesShown.length : 0;

    const cards = [
      {
        label: "Matches loaded",
        value: `${matchesShown.length}/${data.matches.length}`,
        detail: `${data.teams.length} clubs, ${state.roundLimit} rounds shown`,
      },
      {
        label: "Leader",
        value: leader.team,
        detail: `${leader.points} pts, ${signed(leader.gd)} GD`,
      },
      {
        label: "Goals",
        value: goalsShown,
        detail: `${avgGoals.toFixed(2)} per match`,
      },
      {
        label: "Date range",
        value: formatShortDate(data.firstDate),
        detail: `through ${formatShortDate(data.lastDate)}`,
      },
    ];

    els.seasonKpis.innerHTML = cards
      .map(
        (card) => `
          <div class="kpi-card">
            <div class="kpi-label">${escapeHTML(card.label)}</div>
            <div class="kpi-value">${escapeHTML(String(card.value))}</div>
            <div class="kpi-detail">${escapeHTML(card.detail)}</div>
          </div>
        `,
      )
      .join("");
  }

  function renderTeamSelector() {
    const teams = state.data.teams.filter((team) => team.toLowerCase().includes(state.teamSearch));
    const byTeam = new Map(standingsForRound().map((row) => [row.team, row]));

    if (!teams.length) {
      els.teamSelector.innerHTML = `<div class="empty-state">No teams match that filter.</div>`;
      return;
    }

    els.teamSelector.innerHTML = teams
      .map((team) => {
        const isSelected = state.selectedTeams.has(team);
        const row = byTeam.get(team);
        return `
          <button
            class="team-chip ${isSelected ? "is-selected" : ""}"
            type="button"
            data-team="${escapeAttr(team)}"
            style="--team-color: ${teamColor(team)}"
            aria-pressed="${isSelected ? "true" : "false"}"
          >
            <span class="team-dot"></span>
            <span class="team-name">${escapeHTML(team)}</span>
            <span class="team-position">#${row.position}</span>
          </button>
        `;
      })
      .join("");

    els.teamSelector.querySelectorAll(".team-chip").forEach((button) => {
      button.addEventListener("click", () => {
        toggleTeam(button.dataset.team);
      });
    });
  }

  function renderPositionChart() {
    const svg = els.positionChart;
    const data = state.data;
    const { width, height } = chartBox(svg, CHART.width, CHART.positionHeight);
    const margin = {
      ...CHART.margin,
      left: width < 760 ? 44 : CHART.margin.left,
      right: state.selectedTeams.size ? (width < 760 ? 104 : CHART.margin.right) : 34,
    };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const rounds = visibleRounds();
    const selectedCount = state.selectedTeams.size;
    const teamCount = data.teams.length;

    clearSVG(svg, width, height);
    drawPositionBands(svg, {
      margin,
      innerWidth,
      innerHeight,
      teamCount,
    });

    drawGrid(svg, {
      width,
      height,
      margin,
      xTicks: roundTicks(state.roundLimit),
      yTicks: positionTicks(teamCount),
      xScale: (round) => xScale(round, state.roundLimit, margin.left, innerWidth),
      yScale: (position) => yScalePosition(position, teamCount, margin.top, innerHeight),
      yFormatter: (position) => String(position),
    });

    appendText(svg, "Round", width / 2, height - 10, "axis-label", "middle");
    appendText(svg, "Position", 14, margin.top + innerHeight / 2, "axis-label", "middle", -90);

    const lineGroup = svgEl("g", { class: "line-layer" });
    const pointGroup = svgEl("g", { class: "point-layer" });
    svg.append(lineGroup, pointGroup);

    const teamsByPriority = [...data.teams].sort((a, b) => {
      const aSelected = state.selectedTeams.has(a) ? 1 : 0;
      const bSelected = state.selectedTeams.has(b) ? 1 : 0;
      return aSelected - bSelected;
    });

    teamsByPriority.forEach((team) => {
      const series = rounds
        .map((round) => {
          const row = historyAt(team, round);
          return row ? { round, value: row.position, row } : null;
        })
        .filter(Boolean);

      if (series.length < 2) return;

      const isSelected = state.selectedTeams.has(team);
      const isDimmed = selectedCount > 0 && !isSelected;
      const path = pathFromSeries(series, (item) => xScale(item.round, state.roundLimit, margin.left, innerWidth), (item) =>
        yScalePosition(item.value, teamCount, margin.top, innerHeight),
      );

      const line = svgEl("path", {
        class: "chart-line",
        d: path,
        stroke: isDimmed ? "#b8c2ca" : teamColor(team),
        "stroke-width": isSelected ? 3.8 : selectedCount ? 1.4 : 1.8,
        opacity: isDimmed ? 0.35 : selectedCount ? 0.98 : 0.58,
        "data-team": team,
      });
      line.style.cursor = "pointer";
      line.style.pointerEvents = "stroke";
      line.addEventListener("click", () => toggleTeam(team));
      lineGroup.append(line);

      series.forEach((item) => {
        const circleOpacity = isSelected ? 0.96 : selectedCount ? 0 : 0.16;
        const circle = svgEl("circle", {
          class: "chart-point",
          cx: xScale(item.round, state.roundLimit, margin.left, innerWidth),
          cy: yScalePosition(item.value, teamCount, margin.top, innerHeight),
          r: isSelected ? 4.2 : 3,
          fill: isDimmed ? "#b8c2ca" : teamColor(team),
          opacity: circleOpacity,
          "data-tooltip": `${team}|Round ${item.round}|Position ${item.value}|${item.row.points} pts`,
          "data-team": team,
        });
        if (selectedCount && !isSelected) circle.style.pointerEvents = "none";
        circle.addEventListener("click", () => toggleTeam(team));
        pointGroup.append(circle);
      });
    });

    placeEndpointLabels(svg, rounds, margin, innerWidth, innerHeight, teamCount);
  }

  function drawPositionBands(svg, options) {
    const { margin, innerWidth, innerHeight, teamCount } = options;
    const bands = [
      { from: 1, to: 4, label: "UCL", fill: "#e7f1fb" },
      { from: 5, to: 5, label: "UEL", fill: "#fff5d8" },
      { from: 6, to: 6, label: "UECL", fill: "#f4eadf" },
      { from: 18, to: 20, label: "Relegation", fill: "#fdebea" },
    ];

    bands.forEach((band) => {
      const y1 = positionBandBoundary(band.from - 0.5, teamCount, margin.top, innerHeight);
      const y2 = positionBandBoundary(band.to + 0.5, teamCount, margin.top, innerHeight);
      const y = Math.max(margin.top, Math.min(y1, y2));
      const height = Math.min(margin.top + innerHeight, Math.max(y1, y2)) - y;
      if (height <= 0) return;
      svg.append(
        svgEl("rect", {
          x: margin.left,
          y,
          width: innerWidth,
          height,
          fill: band.fill,
          opacity: 0.62,
        }),
      );
      appendText(svg, band.label, margin.left + 8, y + Math.min(16, height - 3), "band-label", "start");
    });
  }

  function positionBandBoundary(boundary, teamCount, top, innerHeight) {
    const y = top + ((boundary - 1) / Math.max(1, teamCount - 1)) * innerHeight;
    return Math.max(top, Math.min(top + innerHeight, y));
  }

  function placeEndpointLabels(svg, rounds, margin, innerWidth, innerHeight, teamCount) {
    const labels = [...state.selectedTeams]
      .map((team) => {
        const row = historyAt(team, state.roundLimit);
        if (!row) return null;
        return {
          team,
          y: yScalePosition(row.position, teamCount, margin.top, innerHeight),
          position: row.position,
          points: row.points,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.y - b.y);

    let previousY = -Infinity;
    labels.forEach((label) => {
      label.y = Math.max(label.y, previousY + 18);
      previousY = label.y;
    });

    labels.forEach((label) => {
      const x = xScale(rounds[rounds.length - 1], state.roundLimit, margin.left, innerWidth) + 10;
      const group = svgEl("g", {});
      group.append(
        svgEl("line", {
          x1: x - 9,
          y1: yScalePosition(label.position, teamCount, margin.top, innerHeight),
          x2: x - 1,
          y2: label.y,
          stroke: teamColor(label.team),
          "stroke-width": 1.4,
          opacity: 0.6,
        }),
      );
      const labelText = svgEl("text", {
        x,
        y: label.y + 4,
        fill: teamColor(label.team),
        "font-size": 12,
        "font-weight": 850,
      });
      labelText.textContent = `${label.team} #${label.position}`;
      group.append(labelText);
      svg.append(group);
    });
  }

  function renderGoalsChart(svg, options) {
    const teams = activeTrendTeams();
    const seriesList = teams.map((team) => ({
      team,
      values: visibleRounds().map((round) => ({
        round,
        value: roundValue(team, round, options.metric),
        tooltip: `${team}|Round ${round}|${options.label}: ${roundValue(team, round, options.metric)}`,
      })),
    }));

    renderLineChart(svg, {
      seriesList,
      yMin: 0,
      yLabel: options.label,
      valueFormatter: (value) => String(Math.round(value)),
      emptyLabel: options.emptyLabel,
    });
  }

  function renderMetricChart() {
    const metric = METRICS[state.metric];
    els.metricChartTitle.textContent = metric.label;
    const teams = activeTrendTeams();
    const values = teams.map((team) => ({
      team,
      values: visibleRounds().map((round) => {
        const value = metric.accessor(team, round);
        return {
          round,
          value,
          tooltip: `${team}|Round ${round}|${metric.label}: ${metric.formatter(value)}`,
        };
      }),
    }));

    renderLineChart(els.metricChart, {
      seriesList: values,
      yLabel: metric.label,
      valueFormatter: metric.formatter,
      emptyLabel: metric.label,
    });
  }

  function renderTeamMapChart() {
    const svg = els.teamMapChart;
    const standings = standingsForRound();
    const { width, height } = chartBox(svg, CHART.width, CHART.height);
    const margin = {
      top: 24,
      right: width < 620 ? 18 : 30,
      bottom: 48,
      left: width < 620 ? 42 : 52,
    };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const points = standings.map((row) => ({
      team: row.team,
      position: row.position,
      points: row.points,
      x: row.played ? row.ga / row.played : 0,
      y: row.played ? row.gf / row.played : 0,
      gd: row.gd,
    }));
    const xMax = Math.max(1, ...points.map((point) => point.x)) + 0.25;
    const yMax = Math.max(1, ...points.map((point) => point.y)) + 0.25;

    clearSVG(svg, width, height);
    drawGrid(svg, {
      width,
      height,
      margin,
      xTicks: decimalTicks(0, xMax, 0.5),
      yTicks: decimalTicks(0, yMax, 0.5),
      xScale: (value) => xScaleValue(value, 0, xMax, margin.left, innerWidth),
      yScale: (value) => yScaleValue(value, 0, yMax, margin.top, innerHeight),
      yFormatter: (value) => value.toFixed(1),
    });

    appendText(svg, "Goals conceded per match", width / 2, height - 10, "axis-label", "middle");
    appendText(svg, "Goals for per match", 14, margin.top + innerHeight / 2, "axis-label", "middle", -90);

    const selectedCount = state.selectedTeams.size;
    points.forEach((point) => {
      const isSelected = state.selectedTeams.has(point.team);
      const isDimmed = selectedCount > 0 && !isSelected;
      const radius = 5 + Math.sqrt(Math.max(0, point.points)) * 0.8;
      const circle = svgEl("circle", {
        class: "chart-point",
        cx: xScaleValue(point.x, 0, xMax, margin.left, innerWidth),
        cy: yScaleValue(point.y, 0, yMax, margin.top, innerHeight),
        r: isSelected ? radius + 2 : radius,
        fill: isDimmed ? "#b8c2ca" : teamColor(point.team),
        opacity: isDimmed ? 0.28 : 0.78,
        stroke: isSelected ? "#172026" : "#ffffff",
        "stroke-width": isSelected ? 1.7 : 1,
        "data-tooltip": `${point.team}|#${point.position}, ${point.points} pts|GF/m ${point.y.toFixed(2)} · GA/m ${point.x.toFixed(2)}|GD ${signed(point.gd)}`,
      });
      circle.addEventListener("click", () => toggleTeam(point.team));
      svg.append(circle);
    });

    points
      .filter((point) => state.selectedTeams.has(point.team) || point.position <= 4)
      .forEach((point) => {
        appendText(
          svg,
          point.team,
          xScaleValue(point.x, 0, xMax, margin.left, innerWidth) + 10,
          yScaleValue(point.y, 0, yMax, margin.top, innerHeight) + 4,
          "axis-label",
          "start",
        );
      });
  }

  function renderFormHeatmap() {
    const rows = standingsForRound();
    const rounds = visibleRounds();
    const showEvery = state.roundLimit > 30 ? 5 : state.roundLimit > 16 ? 3 : 2;

    els.formHeatmap.innerHTML = `
      <div class="heatmap-scroll">
        <div class="heatmap-grid" style="--round-count: ${rounds.length}">
          <div class="heatmap-team heatmap-header">Club</div>
          ${rounds
            .map(
              (round) =>
                `<div class="heatmap-round heatmap-header">${round === 1 || round === state.roundLimit || round % showEvery === 0 ? round : ""}</div>`,
            )
            .join("")}
          ${rows
            .map((row) => {
              const cells = rounds
                .map((round) => {
                  const result = roundValue(row.team, round, "result");
                  const className = result === "W" ? "win" : result === "D" ? "draw" : result === "L" ? "loss" : "blank";
                  return `<div class="heatmap-cell ${className}" title="${escapeAttr(`${row.team}, round ${round}: ${result || "no match"}`)}">${escapeHTML(result)}</div>`;
                })
                .join("");
              return `
                <div class="heatmap-team">
                  <span class="team-dot" style="--team-color: ${teamColor(row.team)}"></span>
                  <span>${escapeHTML(row.team)}</span>
                </div>
                ${cells}
              `;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  function renderHtftChart() {
    const svg = els.htftChart;
    const { width, height } = chartBox(svg, CHART.width, CHART.height);
    const margin = { top: 44, right: 30, bottom: 28, left: width < 640 ? 112 : 150 };
    const innerWidth = width - margin.left - margin.right;
    const rows = htftStatsForRound()
      .filter((row) => row.total > 0)
      .sort((a, b) => b.total - a.total || a.team.localeCompare(b.team));
    const rowHeight = Math.max(12, (height - margin.top - margin.bottom) / Math.max(1, rows.length));
    const maxTotal = Math.max(1, ...rows.map((row) => row.total));
    const segments = [
      { key: "heldLeads", label: "Held lead", color: "#117f59" },
      { key: "comebackWins", label: "Comeback win", color: "#2563eb" },
      { key: "rescuedDraws", label: "Rescued draw", color: "#7a8793" },
      { key: "blownLeads", label: "Blown lead", color: "#c0392b" },
    ];

    clearSVG(svg, width, height);
    if (!rows.length) {
      appendText(svg, "No halftime data for this round cutoff.", width / 2, height / 2, "axis-label", "middle");
      return;
    }

    let legendX = margin.left;
    segments.forEach((segment) => {
      svg.append(svgEl("rect", { x: legendX, y: 13, width: 10, height: 10, rx: 2, fill: segment.color }));
      appendText(svg, segment.label, legendX + 15, 22, "axis-label", "start");
      legendX += segment.label.length * 7 + 42;
    });

    rows.forEach((row, index) => {
      const y = margin.top + index * rowHeight;
      appendText(svg, row.team, margin.left - 9, y + rowHeight * 0.66, "axis-label", "end");
      let x = margin.left;
      segments.forEach((segment) => {
        const value = row[segment.key];
        const segmentWidth = (value / maxTotal) * innerWidth;
        if (value > 0) {
          svg.append(
            svgEl("rect", {
              x,
              y: y + rowHeight * 0.18,
              width: Math.max(2, segmentWidth),
              height: Math.max(7, rowHeight * 0.62),
              rx: 3,
              fill: segment.color,
              opacity: 0.86,
              "data-tooltip": `${row.team}|${segment.label}: ${value}|${row.total} HT→FT state changes tracked`,
            }),
          );
        }
        x += segmentWidth;
      });
      appendText(svg, row.total, margin.left + (row.total / maxTotal) * innerWidth + 7, y + rowHeight * 0.66, "axis-label", "start");
    });
  }

  function renderLineChart(svg, options) {
    const { width, height } = chartBox(svg, CHART.width, CHART.height);
    const margin = {
      ...CHART.miniMargin,
      left: width < 620 ? 40 : CHART.miniMargin.left,
      right: width < 620 ? 16 : CHART.miniMargin.right,
    };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const rounds = visibleRounds();
    const allValues = options.seriesList.flatMap((series) => series.values.map((item) => item.value));
    const minValue = options.yMin === undefined ? Math.min(0, ...allValues) : options.yMin;
    const maxValue = Math.max(1, ...allValues);
    const yDomain = niceDomain(minValue, maxValue);

    clearSVG(svg, width, height);

    if (!options.seriesList.length) {
      appendText(svg, "Select teams to draw this trend.", width / 2, height / 2, "axis-label", "middle");
      return;
    }

    drawGrid(svg, {
      width,
      height,
      margin,
      xTicks: roundTicks(state.roundLimit),
      yTicks: valueTicks(yDomain[0], yDomain[1]),
      xScale: (round) => xScale(round, state.roundLimit, margin.left, innerWidth),
      yScale: (value) => yScaleValue(value, yDomain[0], yDomain[1], margin.top, innerHeight),
      yFormatter: options.valueFormatter,
    });

    options.seriesList.forEach((series) => {
      const path = pathFromSeries(series.values, (item) => xScale(item.round, state.roundLimit, margin.left, innerWidth), (item) =>
        yScaleValue(item.value, yDomain[0], yDomain[1], margin.top, innerHeight),
      );
      svg.append(
        svgEl("path", {
          class: "chart-line",
          d: path,
          stroke: teamColor(series.team),
          "stroke-width": 2.6,
          opacity: 0.9,
        }),
      );

      series.values.forEach((item) => {
        svg.append(
          svgEl("circle", {
            class: "chart-point",
            cx: xScale(item.round, state.roundLimit, margin.left, innerWidth),
            cy: yScaleValue(item.value, yDomain[0], yDomain[1], margin.top, innerHeight),
            r: 3.2,
            fill: teamColor(series.team),
            opacity: 0.72,
            "data-tooltip": item.tooltip,
            "data-team": series.team,
          }),
        );
      });
    });
  }

  function renderLegend() {
    const teams = state.selectedTeams.size ? [...state.selectedTeams] : activeTrendTeams();
    els.positionLegend.innerHTML = teams
      .map(
        (team) => `
          <span class="legend-pill">
            <span class="team-dot" style="--team-color: ${teamColor(team)}"></span>
            ${escapeHTML(team)}
          </span>
        `,
      )
      .join("");
  }

  function renderTeamProfile() {
    const teams = activeTrendTeams();
    const rowsByTeam = new Map(standingsForRound().map((row) => [row.team, row]));
    const cards = teams.map((team) => {
      const row = rowsByTeam.get(team);
      const shotAccuracy = row.shotsFor ? (row.sotFor / row.shotsFor) * 100 : 0;
      const goalsPerMatch = row.played ? row.gf / row.played : 0;
      const concededPerMatch = row.played ? row.ga / row.played : 0;
      return `
        <article class="profile-card" style="--team-color: ${teamColor(team)}">
          <div class="profile-title">
            <h3>${escapeHTML(team)}</h3>
            <span class="profile-rank">#${row.position}</span>
          </div>
          <div class="profile-grid">
            <div class="profile-stat"><span>Points</span><strong>${row.points}</strong></div>
            <div class="profile-stat"><span>Record</span><strong>${row.wins}-${row.draws}-${row.losses}</strong></div>
            <div class="profile-stat"><span>Goals/match</span><strong>${goalsPerMatch.toFixed(2)}</strong></div>
            <div class="profile-stat"><span>Against/match</span><strong>${concededPerMatch.toFixed(2)}</strong></div>
            <div class="profile-stat"><span>GD</span><strong>${signed(row.gd)}</strong></div>
            <div class="profile-stat"><span>Shots</span><strong>${row.shotsFor}</strong></div>
            <div class="profile-stat"><span>Shot accuracy</span><strong>${shotAccuracy.toFixed(0)}%</strong></div>
            <div class="profile-stat"><span>Cards</span><strong>${row.yellow + row.red}</strong></div>
          </div>
          <div class="form-row" aria-label="Recent form">
            ${formBadges(row.form.slice(-5))}
          </div>
        </article>
      `;
    });

    els.teamProfile.innerHTML = cards.join("");
  }

  function renderPlayerKpis() {
    const players = filteredPlayers();
    const metric = PLAYER_METRICS[state.playerMetric];
    const metricLeader = players[0];
    const topScorer = [...players].sort(playerComparator("goals"))[0];
    const topCreator = [...players].sort(playerComparator("expectedAssists"))[0];
    const selectedText = state.playerTeam === "all" ? "all teams" : state.playerTeam;

    const cards = [
      {
        label: "Players in view",
        value: players.length,
        detail: `${selectedText}, ${state.playerPosition === "all" ? "all positions" : POSITION_LABELS[state.playerPosition]} · ${state.playerMinMinutes}+ min, ${state.playerMinAppearances}+ app`,
      },
      {
        label: `Top ${metric.label}`,
        value: metricLeader ? metricLeader.name : "No players",
        detail: metricLeader ? `${metric.formatter(playerMetricValue(metricLeader))} · ${metricLeader.team}` : "Adjust filters",
      },
      {
        label: "Top scorer",
        value: topScorer ? topScorer.name : "n/a",
        detail: topScorer ? `${topScorer.goals} goals · ${topScorer.team}` : "",
      },
      {
        label: "Creative leader",
        value: topCreator ? topCreator.name : "n/a",
        detail: topCreator ? `${topCreator.expectedAssists.toFixed(2)} xA · ${topCreator.team}` : "",
      },
    ];

    els.playerKpis.innerHTML = cards
      .map(
        (card) => `
          <div class="kpi-card">
            <div class="kpi-label">${escapeHTML(card.label)}</div>
            <div class="kpi-value">${escapeHTML(String(card.value))}</div>
            <div class="kpi-detail">${escapeHTML(card.detail)}</div>
          </div>
        `,
      )
      .join("");
  }

  function renderPlayerSelector() {
    const players = filteredPlayers().slice(0, 72);

    if (!players.length) {
      els.playerSelector.innerHTML = `<div class="empty-state">No players match the current filters.</div>`;
      return;
    }

    els.playerSelector.innerHTML = players
      .map((player) => {
        const isSelected = state.selectedPlayers.has(player.id);
        return `
          <button
            class="player-chip ${isSelected ? "is-selected" : ""}"
            type="button"
            data-player-id="${escapeAttr(player.id)}"
            style="--team-color: ${teamColor(player.team)}"
            aria-pressed="${isSelected ? "true" : "false"}"
          >
            <span class="team-dot"></span>
            <span class="player-chip-main">
              <span class="team-name">${escapeHTML(player.name)}</span>
              <span class="player-chip-meta">${escapeHTML(player.team)} · ${escapeHTML(player.position)}</span>
            </span>
            <span class="team-position">${escapeHTML(PLAYER_METRICS[state.playerMetric].formatter(playerMetricValue(player)))}</span>
          </button>
        `;
      })
      .join("");

    els.playerSelector.querySelectorAll(".player-chip").forEach((button) => {
      button.addEventListener("click", () => togglePlayer(button.dataset.playerId));
    });
  }

  function renderPlayerScatterChart() {
    const svg = els.playerScatterChart;
    const { width, height } = chartBox(svg, CHART.width, CHART.height);
    const margin = { top: 24, right: 28, bottom: 46, left: 48 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const filtered = filteredPlayers();
    const selected = selectedPlayerObjects();
    const selectedIds = new Set(selected.map((player) => player.id));
    const selectedCount = selectedIds.size;
    const visible = mergeUniquePlayers(
      filtered.filter((player) => player.minutesPlayed >= 180).slice(0, 180),
      selected,
    );
    const xMax = Math.max(1, ...visible.map((player) => player.expectedGoals)) + 2;
    const yMax = Math.max(1, ...visible.map((player) => player.goals)) + 2;

    clearSVG(svg, width, height);
    if (!visible.length) {
      appendText(svg, "No player data for this filter.", width / 2, height / 2, "axis-label", "middle");
      return;
    }

    drawGrid(svg, {
      width,
      height,
      margin,
      xTicks: valueTicks(0, xMax),
      yTicks: valueTicks(0, yMax),
      xScale: (value) => xScaleValue(value, 0, xMax, margin.left, innerWidth),
      yScale: (value) => yScaleValue(value, 0, yMax, margin.top, innerHeight),
      yFormatter: (value) => String(Math.round(value)),
    });
    appendText(svg, "Expected goals", width / 2, height - 10, "axis-label", "middle");
    appendText(svg, "Goals", 14, margin.top + innerHeight / 2, "axis-label", "middle", -90);

    const diagonalMax = Math.min(xMax, yMax);
    svg.append(
      svgEl("line", {
        x1: xScaleValue(0, 0, xMax, margin.left, innerWidth),
        y1: yScaleValue(0, 0, yMax, margin.top, innerHeight),
        x2: xScaleValue(diagonalMax, 0, xMax, margin.left, innerWidth),
        y2: yScaleValue(diagonalMax, 0, yMax, margin.top, innerHeight),
        stroke: "#9aa8b2",
        "stroke-width": 1,
        "stroke-dasharray": "5 5",
      }),
    );

    visible.forEach((player) => {
      const isSelected = selectedIds.has(player.id);
      const isDimmed = selectedCount > 0 && !isSelected;
      const radius = 3.5 + Math.min(8, Math.sqrt(player.appearances || 1));
      const circle = svgEl("circle", {
        class: "chart-point",
        cx: xScaleValue(player.expectedGoals, 0, xMax, margin.left, innerWidth),
        cy: yScaleValue(player.goals, 0, yMax, margin.top, innerHeight),
        r: isSelected ? radius + 2 : radius,
        fill: isDimmed ? "#b8c2ca" : teamColor(player.team),
        opacity: isDimmed ? 0.26 : 0.76,
        stroke: isSelected ? "#172026" : "#ffffff",
        "stroke-width": isSelected ? 1.8 : 0.9,
        "data-tooltip": `${player.name}|${player.team} · ${positionLabel(player.position)}|${player.goals} goals from ${player.expectedGoals.toFixed(2)} xG|${signedDecimal(player.finishingDelta)} finishing`,
      });
      circle.addEventListener("click", () => togglePlayer(player.id));
      svg.append(circle);
    });

    selected.slice(0, 10).forEach((player) => {
      const labelX = xScaleValue(player.expectedGoals, 0, xMax, margin.left, innerWidth);
      const anchor = labelX > width - 130 ? "end" : "start";
      appendText(
        svg,
        shortPlayerName(player.name),
        labelX + (anchor === "end" ? -10 : 10),
        yScaleValue(player.goals, 0, yMax, margin.top, innerHeight) + 4,
        "axis-label",
        anchor,
      );
    });
  }

  function renderPlayerBarChart() {
    const svg = els.playerBarChart;
    const metric = PLAYER_METRICS[state.playerMetric];
    const players = filteredPlayers().slice(0, 12);
    const { width, height } = chartBox(svg, CHART.width, CHART.height);
    const margin = { top: 18, right: 54, bottom: 24, left: width < 620 ? 118 : 170 };
    const innerWidth = width - margin.left - margin.right;
    const rowHeight = Math.max(18, (height - margin.top - margin.bottom) / Math.max(1, players.length));
    const maxValue = Math.max(1, ...players.map(playerMetricValue));
    els.playerBarTitle.textContent = `Top ${metric.label.toLowerCase()}`;

    clearSVG(svg, width, height);
    if (!players.length) {
      appendText(svg, "No player data for this filter.", width / 2, height / 2, "axis-label", "middle");
      return;
    }

    players.forEach((player, index) => {
      const value = playerMetricValue(player);
      const y = margin.top + index * rowHeight;
      const barWidth = (value / maxValue) * innerWidth;
      const isSelected = state.selectedPlayers.has(player.id);
      appendText(svg, shortPlayerName(player.name), margin.left - 9, y + rowHeight * 0.62, "axis-label", "end");
      const bar = svgEl("rect", {
        x: margin.left,
        y: y + rowHeight * 0.18,
        width: Math.max(2, barWidth),
        height: Math.max(10, rowHeight * 0.62),
        rx: 4,
        fill: teamColor(player.team),
        opacity: isSelected || !state.selectedPlayers.size ? 0.86 : 0.45,
        "data-tooltip": `${player.name}|${player.team} · ${positionLabel(player.position)}|${metric.label}: ${metric.formatter(value)}|${player.goals}G ${player.assists}A`,
      });
      bar.style.cursor = "pointer";
      bar.addEventListener("click", () => togglePlayer(player.id));
      svg.append(bar);
      appendText(svg, metric.formatter(value), margin.left + barWidth + 7, y + rowHeight * 0.62, "axis-label", "start");
    });
  }

  function renderPlayerComparison() {
    const players = selectedPlayerObjects().sort(playerComparator(state.playerMetric));

    if (!players.length) {
      els.playerComparison.innerHTML = `<div class="empty-state">Select players from the list, chart, or table to compare them here.</div>`;
      return;
    }

    els.playerComparison.innerHTML = players
      .map((player) => {
        const metric = PLAYER_METRICS[state.playerMetric];
        return `
          <article class="profile-card player-card" style="--team-color: ${teamColor(player.team)}">
            <div class="profile-title">
              <div>
                <h3>${escapeHTML(player.name)}</h3>
                <span class="player-subtitle">${escapeHTML(player.team)} · ${escapeHTML(positionLabel(player.position))}</span>
              </div>
              <span class="profile-rank">${escapeHTML(metric.formatter(playerMetricValue(player)))}</span>
            </div>
            <div class="profile-grid">
              <div class="profile-stat"><span>Goals</span><strong>${player.goals}</strong></div>
              <div class="profile-stat"><span>Assists</span><strong>${player.assists}</strong></div>
              <div class="profile-stat"><span>xG</span><strong>${player.expectedGoals.toFixed(2)}</strong></div>
              <div class="profile-stat"><span>xA</span><strong>${player.expectedAssists.toFixed(2)}</strong></div>
              <div class="profile-stat"><span>G+A/90</span><strong>${(player.goalsPer90 + player.assistsPer90).toFixed(2)}</strong></div>
              <div class="profile-stat"><span>Shots</span><strong>${player.totalShots}</strong></div>
              <div class="profile-stat"><span>Rating</span><strong>${player.rating.toFixed(2)}</strong></div>
              <div class="profile-stat"><span>Minutes</span><strong>${player.minutesPlayed.toLocaleString()}</strong></div>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function renderPlayerTable() {
    const metric = PLAYER_METRICS[state.playerMetric];
    const players = sortedPlayerTableRows().slice(0, 120);
    els.playerTableTitle.textContent = `${players.length} players shown`;
    els.playerMetricColumn.textContent = metric.label;
    renderPlayerTableSortState();
    els.playerTableBody.innerHTML = players
      .map((player) => {
        const isSelected = state.selectedPlayers.has(player.id);
        return `
          <tr class="${isSelected ? "is-selected" : ""}" data-player-id="${escapeAttr(player.id)}">
            <td>
              <span class="club-cell">
                <span class="team-dot" style="--team-color: ${teamColor(player.team)}"></span>
                ${escapeHTML(player.name)}
              </span>
            </td>
            <td>${escapeHTML(player.team)}</td>
            <td>${escapeHTML(player.position)}</td>
            <td>${player.appearances}</td>
            <td>${player.minutesPlayed.toLocaleString()}</td>
            <td>${player.goals}</td>
            <td>${player.assists}</td>
            <td>${player.expectedGoals.toFixed(2)}</td>
            <td>${player.expectedAssists.toFixed(2)}</td>
            <td>${player.rating.toFixed(2)}</td>
            <td>${player.goalsAssistsPer90.toFixed(2)}</td>
            <td><strong>${escapeHTML(metric.formatter(playerMetricValue(player)))}</strong></td>
          </tr>
        `;
      })
      .join("");
  }

  function sortedPlayerTableRows() {
    const { key, direction } = state.playerTableSort;
    const multiplier = direction === "asc" ? 1 : -1;
    return [...filteredPlayers()].sort((a, b) => {
      const primary = comparePlayerTableValues(playerTableValue(a, key), playerTableValue(b, key), key);
      if (primary !== 0) return primary * multiplier;
      return b.minutesPlayed - a.minutesPlayed || a.name.localeCompare(b.name);
    });
  }

  function playerTableValue(player, key) {
    if (key === "metric") return playerMetricValue(player);
    return player[key];
  }

  function comparePlayerTableValues(a, b, key) {
    if (key === "name" || key === "team" || key === "position") {
      return String(a || "").localeCompare(String(b || ""));
    }
    return (Number(a) || 0) - (Number(b) || 0);
  }

  function updatePlayerTableSort(key) {
    if (state.playerTableSort.key === key) {
      state.playerTableSort.direction = state.playerTableSort.direction === "asc" ? "desc" : "asc";
    } else {
      state.playerTableSort = { key, direction: defaultPlayerSortDirection(key) };
    }
    renderPlayerTable();
  }

  function defaultPlayerSortDirection(key) {
    return key === "name" || key === "team" || key === "position" ? "asc" : "desc";
  }

  function renderPlayerTableSortState() {
    els.playerTable.querySelectorAll("th[data-player-sort]").forEach((header) => {
      const isActive = header.dataset.playerSort === state.playerTableSort.key;
      header.setAttribute(
        "aria-sort",
        isActive ? (state.playerTableSort.direction === "asc" ? "ascending" : "descending") : "none",
      );
      const button = header.querySelector(".sort-button");
      const arrow = header.querySelector(".sort-arrow");
      button.classList.toggle("is-active", isActive);
      arrow.textContent = isActive ? (state.playerTableSort.direction === "asc" ? "▲" : "▼") : "";
    });
  }

  function renderStandings() {
    const selected = state.selectedTeams;
    renderStandingsSortState();
    els.standingsTitle.textContent = `Standings after round ${state.roundLimit}`;
    els.standingsBody.innerHTML = sortedStandings()
      .map((row) => {
        const isSelected = selected.has(row.team);
        return `
          <tr class="${isSelected ? "is-selected" : ""}">
            <td>${row.position}</td>
            <td>
              <span class="club-cell">
                <span class="team-dot" style="--team-color: ${teamColor(row.team)}"></span>
                ${escapeHTML(row.team)}
              </span>
            </td>
            <td>${row.played}</td>
            <td>${row.wins}</td>
            <td>${row.draws}</td>
            <td>${row.losses}</td>
            <td>${row.gf}</td>
            <td>${row.ga}</td>
            <td class="${row.gd > 0 ? "gd-positive" : row.gd < 0 ? "gd-negative" : ""}">${signed(row.gd)}</td>
            <td><strong>${row.points}</strong></td>
            <td class="sparkline-cell">${positionSparkline(row.team)}</td>
            <td>${formBadges(row.form.slice(-5))}</td>
          </tr>
        `;
      })
      .join("");
  }

  function positionSparkline(team) {
    const width = 88;
    const height = 26;
    const pad = 3;
    const teamCount = state.data.teams.length;
    const rounds = visibleRounds();
    const series = rounds.map((round) => ({ round, row: historyAt(team, round) })).filter((item) => item.row);
    if (series.length < 2) return "";
    const xFor = (round) => (state.roundLimit <= 1 ? width / 2 : pad + ((round - 1) / (state.roundLimit - 1)) * (width - pad * 2));
    const yFor = (position) => pad + ((position - 1) / Math.max(1, teamCount - 1)) * (height - pad * 2);
    const path = series
      .map((item, index) => `${index ? "L" : "M"}${xFor(item.round).toFixed(1)},${yFor(item.row.position).toFixed(1)}`)
      .join(" ");
    const last = series[series.length - 1];
    const color = teamColor(team);
    return `
      <svg class="position-sparkline" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttr(`${team} position trend`)}">
        <path d="${path}" fill="none" stroke="${color}" stroke-width="2" vector-effect="non-scaling-stroke"></path>
        <circle cx="${xFor(last.round).toFixed(1)}" cy="${yFor(last.row.position).toFixed(1)}" r="2.4" fill="${color}"></circle>
      </svg>
    `;
  }

  function sortedStandings() {
    const { key, direction } = state.tableSort;
    const multiplier = direction === "asc" ? 1 : -1;
    return [...standingsForRound()].sort((a, b) => {
      const primary = compareTableValues(a[key], b[key], key);
      if (primary !== 0) return primary * multiplier;
      return a.position - b.position || a.team.localeCompare(b.team);
    });
  }

  function compareTableValues(a, b, key) {
    if (key === "team") return String(a).localeCompare(String(b));
    return Number(a) - Number(b);
  }

  function updateTableSort(key) {
    if (state.tableSort.key === key) {
      state.tableSort.direction = state.tableSort.direction === "asc" ? "desc" : "asc";
    } else {
      state.tableSort = { key, direction: defaultSortDirection(key) };
    }
    renderStandings();
  }

  function defaultSortDirection(key) {
    return key === "position" || key === "team" ? "asc" : "desc";
  }

  function renderStandingsSortState() {
    els.standingsTable.querySelectorAll("th[data-sort]").forEach((header) => {
      const isActive = header.dataset.sort === state.tableSort.key;
      header.setAttribute(
        "aria-sort",
        isActive ? (state.tableSort.direction === "asc" ? "ascending" : "descending") : "none",
      );
      const button = header.querySelector(".sort-button");
      const arrow = header.querySelector(".sort-arrow");
      button.classList.toggle("is-active", isActive);
      arrow.textContent = isActive ? (state.tableSort.direction === "asc" ? "▲" : "▼") : "";
    });
  }

  function updateRoundControls() {
    els.roundRange.value = String(state.roundLimit);
    els.roundLabel.textContent = `round ${state.roundLimit}`;
  }

  function drawGrid(svg, options) {
    const { width, height, margin, xTicks, yTicks, xScale: sx, yScale: sy, yFormatter } = options;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    yTicks.forEach((tick) => {
      const y = sy(tick);
      svg.append(svgEl("line", { class: "grid-line", x1: margin.left, x2: margin.left + innerWidth, y1: y, y2: y }));
      appendText(svg, yFormatter(tick), margin.left - 10, y + 4, "axis-label", "end");
    });

    xTicks.forEach((tick) => {
      const x = sx(tick);
      svg.append(svgEl("line", { class: "grid-line", x1: x, x2: x, y1: margin.top, y2: margin.top + innerHeight }));
      appendText(svg, tick, x, margin.top + innerHeight + 24, "axis-label", "middle");
    });

    svg.append(svgEl("line", { class: "axis-line", x1: margin.left, x2: margin.left, y1: margin.top, y2: margin.top + innerHeight }));
    svg.append(
      svgEl("line", {
        class: "axis-line",
        x1: margin.left,
        x2: margin.left + innerWidth,
        y1: margin.top + innerHeight,
        y2: margin.top + innerHeight,
      }),
    );
  }

  function clearSVG(svg, width, height) {
    svg.replaceChildren();
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  }

  function chartBox(svg, fallbackWidth, fallbackHeight) {
    const rect = svg.getBoundingClientRect();
    return {
      width: Math.max(320, Math.round(rect.width || fallbackWidth)),
      height: Math.max(260, Math.round(rect.height || fallbackHeight)),
    };
  }

  function svgEl(name, attrs) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.entries(attrs).forEach(([key, value]) => {
      el.setAttribute(key, value);
    });
    return el;
  }

  function appendText(svg, text, x, y, className, anchor, rotate) {
    const attrs = { x, y, class: className, "text-anchor": anchor || "start" };
    if (rotate) attrs.transform = `rotate(${rotate} ${x} ${y})`;
    const el = svgEl("text", attrs);
    el.textContent = text;
    svg.append(el);
    return el;
  }

  function pathFromSeries(series, xAccessor, yAccessor) {
    return series
      .map((item, index) => {
        const command = index === 0 ? "M" : "L";
        return `${command}${xAccessor(item).toFixed(2)},${yAccessor(item).toFixed(2)}`;
      })
      .join(" ");
  }

  function visibleRounds() {
    return state.data.rounds.filter((round) => round <= state.roundLimit);
  }

  function activeTrendTeams() {
    if (state.selectedTeams.size) return [...state.selectedTeams].sort((a, b) => a.localeCompare(b));
    return standingsForRound()
      .slice(0, 6)
      .map((row) => row.team);
  }

  function historySeasonsInRange() {
    if (!state.history) return [];
    const start = Math.min(state.historyStart, state.historyEnd);
    const end = Math.max(state.historyStart, state.historyEnd);
    return state.history.seasons.filter((season) => season.year >= start && season.year <= end);
  }

  function historyTitleCounts(seasons) {
    const counts = new Map();
    seasons.forEach((season) => {
      const team = season.champion.team;
      if (!counts.has(team)) counts.set(team, { team, count: 0, seasons: [] });
      const row = counts.get(team);
      row.count += 1;
      row.seasons.push(season.label);
    });
    return [...counts.values()].sort((a, b) => b.count - a.count || a.team.localeCompare(b.team));
  }

  function historyTeamMetricValue(row, key) {
    if (key === "pointsPerMatch") return row.played ? row.points / row.played : 0;
    return Number(row[key]) || 0;
  }

  function currentSeasonMeta() {
    const date = state.data?.firstDate || state.data?.lastDate;
    let year = new Date().getFullYear();
    if (date) {
      year = date.getMonth() >= 6 ? date.getFullYear() : date.getFullYear() - 1;
    }
    return { year, label: `${year}-${String((year + 1) % 100).padStart(2, "0")}` };
  }

  function makeGoalsPoint(input) {
    const matchCount = Math.max(1, input.matchCount);
    const fullMatches = Math.max(matchCount, input.fullMatches || matchCount);
    const teamGames = matchCount * 2;
    const restGames = Math.max(1, teamGames - input.arsenalGames);
    const restGoals = Math.max(0, input.totalGoals - input.arsenalGF);
    return {
      year: input.year,
      label: input.label,
      champion: input.champion,
      partial: Boolean(input.partial),
      totalGoals: input.totalGoals,
      matchCount: input.matchCount,
      fullMatches,
      projectedGoals: input.partial ? (input.totalGoals / matchCount) * fullMatches : input.totalGoals,
      goalsPerMatch: input.totalGoals / matchCount,
      arsenalGF: input.arsenalGF,
      arsenalGames: input.arsenalGames,
      arsenalPerGame: input.arsenalGames ? input.arsenalGF / input.arsenalGames : 0,
      restPerGame: restGoals / restGames,
    };
  }

  // Full league-scoring timeline: the 25 historical seasons plus the live one,
  // each split into Arsenal vs the rest so we can see if a low title points haul
  // reflects a leaguewide scoring dip or just a blunt Arsenal.
  function goalsTrendSeries() {
    const byYear = new Map();
    (state.history?.seasons || []).forEach((season) => {
      const arsenal = season.byTeam.get("Arsenal");
      byYear.set(
        season.year,
        makeGoalsPoint({
          year: season.year,
          label: season.label,
          champion: season.champion.team,
          totalGoals: season.totalGoals,
          matchCount: season.matchCount,
          arsenalGF: arsenal ? arsenal.gf : 0,
          arsenalGames: arsenal ? arsenal.played : 0,
          fullMatches: Math.max(1, season.teams.length * (season.teams.length - 1)),
        }),
      );
    });
    if (state.data) {
      const meta = currentSeasonMeta();
      const arsenal = state.data.latestStandings.find((row) => row.team === "Arsenal");
      const champion = state.data.latestStandings[0];
      const teamCount = state.data.teams.length;
      const fullMatches = Math.max(1, teamCount * (teamCount - 1));
      const point = makeGoalsPoint({
        year: meta.year,
        label: meta.label,
        champion: champion ? champion.team : "n/a",
        totalGoals: state.data.totalGoals,
        matchCount: state.data.matches.length,
        arsenalGF: arsenal ? arsenal.gf : 0,
        arsenalGames: arsenal ? arsenal.played : 0,
        partial: state.data.matches.length < fullMatches,
        fullMatches,
      });
      // The featured season may also be loaded as a history file; keep whichever
      // source has more matches so a mid-season snapshot never hides a full one.
      const existing = byYear.get(meta.year);
      if (!existing || point.matchCount > existing.matchCount) byYear.set(meta.year, point);
    }
    return [...byYear.values()].sort((a, b) => a.year - b.year);
  }

  function yearTicksFor(min, max) {
    const ticks = new Set([min, max]);
    const start = Math.ceil(min / 5) * 5;
    for (let year = start; year < max; year += 5) ticks.add(year);
    return [...ticks].sort((a, b) => a - b);
  }

  function filteredPlayers() {
    if (!state.players) return [];
    const search = state.playerSearch;
    return state.players.players
      .filter((player) => state.playerTeam === "all" || player.team === state.playerTeam)
      .filter((player) => state.playerPosition === "all" || player.position === state.playerPosition)
      .filter((player) => !search || player.name.toLowerCase().includes(search) || player.team.toLowerCase().includes(search))
      .filter((player) => player.minutesPlayed >= state.playerMinMinutes)
      .filter((player) => player.appearances >= state.playerMinAppearances)
      .sort(playerComparator(state.playerMetric));
  }

  function selectedPlayerObjects() {
    if (!state.players) return [];
    return [...state.selectedPlayers].map((id) => state.players.byId.get(id)).filter(Boolean);
  }

  function mergeUniquePlayers(primary, secondary) {
    const seen = new Set();
    return [...primary, ...secondary].filter((player) => {
      if (seen.has(player.id)) return false;
      seen.add(player.id);
      return true;
    });
  }

  function playerComparator(metricKey) {
    return (a, b) => {
      const primary = playerMetricValue(b, metricKey) - playerMetricValue(a, metricKey);
      if (primary !== 0) return primary;
      return b.minutesPlayed - a.minutesPlayed || a.name.localeCompare(b.name);
    };
  }

  function playerMetricValue(player, metricKey = state.playerMetric) {
    return Number(player[metricKey]) || 0;
  }

  function refreshPlayerSelectionForFilter() {
    const availableIds = new Set(filteredPlayers().map((player) => player.id));
    state.selectedPlayers = new Set([...state.selectedPlayers].filter((id) => availableIds.has(id)));
    if (!state.selectedPlayers.size) {
      state.selectedPlayers = new Set(filteredPlayers().slice(0, 8).map((player) => player.id));
    }
  }

  function htftStatsForRound() {
    const stats = new Map(
      state.data.teams.map((team) => [
        team,
        { team, heldLeads: 0, comebackWins: 0, rescuedDraws: 0, blownLeads: 0, total: 0 },
      ]),
    );

    state.data.matches
      .filter((match) => match.round <= state.roundLimit)
      .forEach((match) => {
        applyHtftForTeam(stats.get(match.HomeTeam), compareGoals(match.homeHalfGoals, match.awayHalfGoals), compareGoals(match.homeGoals, match.awayGoals));
        applyHtftForTeam(stats.get(match.AwayTeam), compareGoals(match.awayHalfGoals, match.homeHalfGoals), compareGoals(match.awayGoals, match.homeGoals));
      });

    return [...stats.values()].map((row) => ({
      ...row,
      total: row.heldLeads + row.comebackWins + row.rescuedDraws + row.blownLeads,
    }));
  }

  function applyHtftForTeam(row, halftimeState, fulltimeState) {
    if (halftimeState === "lead" && fulltimeState === "lead") row.heldLeads += 1;
    if (halftimeState === "lead" && fulltimeState !== "lead") row.blownLeads += 1;
    if (halftimeState === "trail" && fulltimeState === "lead") row.comebackWins += 1;
    if (halftimeState === "trail" && fulltimeState === "draw") row.rescuedDraws += 1;
  }

  function compareGoals(forGoals, againstGoals) {
    if (forGoals > againstGoals) return "lead";
    if (forGoals < againstGoals) return "trail";
    return "draw";
  }

  function standingsForRound() {
    return state.data.standingsByRound[state.roundLimit] || state.data.latestStandings;
  }

  function historyAt(team, round) {
    return state.data.teamHistory.get(team)[round];
  }

  function historyValue(team, round, key) {
    const row = historyAt(team, round);
    return row ? row[key] : 0;
  }

  function roundValue(team, round, key) {
    const row = state.data.roundStats.get(team)[round];
    return row ? row[key] : 0;
  }

  function teamColor(team) {
    if (TEAM_COLORS[team]) return TEAM_COLORS[team];
    const teamLists = [state.data?.teams || [], state.history?.teams || []];
    for (const teams of teamLists) {
      const index = teams.indexOf(team);
      if (index >= 0) return FALLBACK_COLORS[index % FALLBACK_COLORS.length];
    }
    return FALLBACK_COLORS[hashString(team) % FALLBACK_COLORS.length];
  }

  function toggleTeam(team) {
    if (!team) return;
    if (state.selectedTeams.has(team)) {
      state.selectedTeams.delete(team);
    } else {
      state.selectedTeams.add(team);
    }
    renderAll();
  }

  function togglePlayer(playerId) {
    if (!playerId) return;
    if (state.selectedPlayers.has(playerId)) {
      state.selectedPlayers.delete(playerId);
    } else {
      state.selectedPlayers.add(playerId);
    }
    renderPlayerDashboard();
  }

  function xScale(round, maxRound, left, innerWidth) {
    if (maxRound <= 1) return left + innerWidth / 2;
    return left + ((round - 1) / (maxRound - 1)) * innerWidth;
  }

  function xScaleValue(value, min, max, left, innerWidth) {
    if (max === min) return left + innerWidth / 2;
    return left + ((value - min) / (max - min)) * innerWidth;
  }

  function yScalePosition(position, teamCount, top, innerHeight) {
    if (teamCount <= 1) return top + innerHeight / 2;
    return top + ((position - 1) / (teamCount - 1)) * innerHeight;
  }

  function yScaleValue(value, min, max, top, innerHeight) {
    if (max === min) return top + innerHeight / 2;
    return top + innerHeight - ((value - min) / (max - min)) * innerHeight;
  }

  function roundTicks(maxRound) {
    const ticks = new Set([1, maxRound]);
    const step = maxRound > 28 ? 5 : maxRound > 14 ? 3 : 2;
    for (let round = step; round < maxRound; round += step) ticks.add(round);
    return [...ticks].sort((a, b) => a - b);
  }

  function positionTicks(teamCount) {
    return [1, 5, 10, 15, teamCount].filter((value, index, arr) => value <= teamCount && arr.indexOf(value) === index);
  }

  function historyYearTicks(seasons) {
    if (!seasons.length) return [];
    const minYear = seasons[0].year;
    const maxYear = seasons[seasons.length - 1].year;
    const ticks = new Set([minYear, maxYear]);
    const firstFive = Math.ceil(minYear / 5) * 5;
    for (let year = firstFive; year < maxYear; year += 5) ticks.add(year);
    return [...ticks].sort((a, b) => a - b);
  }

  function valueTicks(min, max) {
    const ticks = [];
    const span = max - min;
    const step = span <= 6 ? 1 : span <= 20 ? 5 : span <= 60 ? 10 : 20;
    const start = Math.ceil(min / step) * step;
    for (let value = start; value <= max; value += step) ticks.push(value);
    if (!ticks.includes(min)) ticks.unshift(min);
    if (!ticks.includes(max)) ticks.push(max);
    return [...new Set(ticks)].sort((a, b) => a - b);
  }

  function decimalTicks(min, max, step) {
    const ticks = [];
    for (let value = min; value <= max + step / 2; value += step) {
      ticks.push(Number(value.toFixed(2)));
    }
    return ticks;
  }

  function niceLinearScale(min, max, targetTickCount = 5) {
    let lower = Number.isFinite(min) ? min : 0;
    let upper = Number.isFinite(max) ? max : 1;
    if (lower === upper) {
      lower = Math.min(0, lower - 1);
      upper += 1;
    }
    const span = upper - lower;
    const rawStep = span / Math.max(1, targetTickCount);
    const power = 10 ** Math.floor(Math.log10(rawStep || 1));
    const factor = rawStep / power;
    const niceFactor = factor <= 1 ? 1 : factor <= 2 ? 2 : factor <= 5 ? 5 : 10;
    const step = niceFactor * power;
    const niceMin = Math.floor(lower / step) * step;
    const niceMax = Math.ceil(upper / step) * step;
    const precision = Math.max(0, Math.ceil(-Math.log10(step)) + 2);
    const ticks = [];
    for (let value = niceMin; value <= niceMax + step / 2; value += step) {
      ticks.push(Number(value.toFixed(precision)));
    }
    return { min: niceMin, max: niceMax, ticks };
  }

  function niceDomain(min, max) {
    const lower = Math.min(0, Math.floor(min));
    const upper = Math.ceil(max);
    if (upper <= 6) return [lower, Math.max(3, upper)];
    if (upper <= 20) return [lower, Math.ceil(upper / 5) * 5];
    if (upper <= 60) return [lower, Math.ceil(upper / 10) * 10];
    return [lower, Math.ceil(upper / 20) * 20];
  }

  function parseDate(dateText, timeText) {
    const [day, month, yearValue] = dateText.split("/").map(Number);
    const year = yearValue < 100 ? 2000 + yearValue : yearValue;
    const [hour = 0, minute = 0] = (timeText || "00:00").split(":").map(Number);
    return new Date(year, month - 1, day, hour, minute);
  }

  function normalizePlayerTeam(team) {
    return PLAYER_TEAM_ALIASES[team] || team;
  }

  function decodeEntities(value) {
    return String(value || "")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&apos;/g, "'");
  }

  function toNumber(value) {
    const number = Number(String(value || "").replace(/,/g, ""));
    return Number.isFinite(number) ? number : 0;
  }

  function per90(value, minutes) {
    return minutes > 0 ? (value * 90) / minutes : 0;
  }

  function average(values) {
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  }

  function signed(value) {
    return value > 0 ? `+${value}` : String(value);
  }

  function formatDelta(value, formatter) {
    const absolute = formatter(Math.abs(value));
    if (value > 0) return `+${absolute}`;
    if (value < 0) return `-${absolute}`;
    return formatter(0);
  }

  function signedDecimal(value) {
    return value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
  }

  function positionLabel(position) {
    return POSITION_LABELS[position] || position || "Unknown";
  }

  function shortPlayerName(name) {
    const parts = name.split(" ").filter(Boolean);
    if (parts.length <= 2) return name;
    return `${parts[0][0]}. ${parts.slice(1).join(" ")}`;
  }

  function formatShortDate(date) {
    if (!date) return "n/a";
    return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(date);
  }

  function seasonOption(season) {
    return `<option value="${season.year}">${escapeHTML(season.label)}</option>`;
  }

  function hashString(value) {
    return String(value)
      .split("")
      .reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 0);
  }

  function formBadges(form) {
    if (!form.length) return `<span class="empty-state">No matches</span>`;
    return form
      .map((result) => {
        const className = result === "W" ? "win" : result === "D" ? "draw" : "loss";
        return `<span class="form-badge ${className}">${result}</span>`;
      })
      .join("");
  }

  function showTooltip(target) {
    const text = target.getAttribute("data-tooltip");
    if (!text) return;
    const [title, lineOne, lineTwo, lineThree] = text.split("|");
    els.tooltip.innerHTML = `
      <strong>${escapeHTML(title)}</strong>
      <span>${escapeHTML(lineOne || "")}</span><br>
      <span>${escapeHTML(lineTwo || "")}</span>
      ${lineThree ? `<br><span>${escapeHTML(lineThree)}</span>` : ""}
    `;
    els.tooltip.hidden = false;
  }

  function moveTooltip(event) {
    const target = event.target.closest ? event.target.closest("[data-tooltip]") : null;
    if (!target) {
      hideTooltip();
      return;
    }
    showTooltip(target);
    const x = Math.min(window.innerWidth - 280, event.clientX + 14);
    const y = Math.min(window.innerHeight - 120, event.clientY + 14);
    els.tooltip.style.left = `${Math.max(12, x)}px`;
    els.tooltip.style.top = `${Math.max(12, y)}px`;
  }

  function hideTooltip() {
    if (els.tooltip) els.tooltip.hidden = true;
  }

  function showLoadError(error) {
    els.loadError.hidden = false;
    els.loadError.innerHTML = `
      <strong>Could not load dashboard data.</strong>
      <div>${escapeHTML(error.message)}</div>
      <div>For local preview, run <code>python3 -m http.server 8080</code> in this folder and open <code>http://localhost:8080</code>.</div>
    `;
  }

  function escapeHTML(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttr(value) {
    return escapeHTML(value);
  }

  function debounce(fn, delay) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  }
})();
