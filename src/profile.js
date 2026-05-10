(() => {
  const STORAGE_KEY = "chessLegendsProfile";

  const defaultProfile = {
    name: "Игрок",
    country: "",
    gameRating: 1000,
    gamesPlayed: 0,
    matchRating: 1000,
    singleGamesPlayed: 0,
    matchGamesPlayed: 0,
    twoPlayerWins: 0,
    twoPlayerLosses: 0,
    twoPlayerDraws: 0,
    bestTime: null,
    bestMoves: null,
    recordsByDifficulty: {}
  };

  function formatTime(totalSeconds) {
    if (!Number.isFinite(totalSeconds)) {
      return "-";
    }

    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");

    return `${minutes}:${seconds}`;
  }

  function loadProfile() {
    try {
      return {
        ...defaultProfile,
        ...JSON.parse(localStorage.getItem(STORAGE_KEY))
      };
    } catch {
      return { ...defaultProfile };
    }
  }

  function createBlankProfile() {
    return {
      ...defaultProfile,
      name: "",
      country: ""
    };
  }

  function hasSavedProfile() {
    return Boolean(localStorage.getItem(STORAGE_KEY));
  }

  function saveProfile(profile) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }

  function getProfileFromForm(elements) {
    return {
      ...loadProfile(),
      name: elements.name.value.trim() || defaultProfile.name,
      country: elements.country.value.trim()
    };
  }

  function calculateMatchRatingGain(result) {
    const difficultyBonus = {
      "Начинающий": 8,
      "КМС": 14,
      "Мастер": 20,
      "Гроссмейстер": 28
    };

    return (difficultyBonus[result.settings.difficulty] || 8) + 6;
  }

  function updateProfileWithResult(result) {
    const profile = loadProfile();
    const difficulty = result.settings.difficulty;
    const difficultyRecord = {
      wins: 0,
      losses: 0,
      draws: 0,
      matchWins: 0,
      matchLosses: 0,
      matchDraws: 0,
      singleGames: 0,
      totalSingleSeconds: 0,
      recentSingleSeconds: [],
      ...(profile.recordsByDifficulty[difficulty] || {})
    };
    const updatedProfile = {
      ...profile,
      gamesPlayed: profile.gamesPlayed + 1,
      recordsByDifficulty: { ...profile.recordsByDifficulty }
    };

    if (result.settings.mode === "Два игрока") {
      updatedProfile.matchGamesPlayed = (updatedProfile.matchGamesPlayed || 0) + 1;
      updatedProfile.matchRating = (updatedProfile.matchRating || defaultProfile.matchRating) + calculateMatchRatingGain(result);

      if (result.winner === 0) {
        updatedProfile.twoPlayerWins += 1;
        difficultyRecord.matchWins += 1;
      } else if (result.winner === 1) {
        updatedProfile.twoPlayerLosses = (updatedProfile.twoPlayerLosses || 0) + 1;
        difficultyRecord.matchLosses += 1;
      } else {
        updatedProfile.twoPlayerDraws = (updatedProfile.twoPlayerDraws || 0) + 1;
        difficultyRecord.matchDraws += 1;
      }

      updatedProfile.recordsByDifficulty[difficulty] = difficultyRecord;
      saveProfile(updatedProfile);
      return { profile: updatedProfile, messages: [] };
    }

    const messages = [];

    updatedProfile.singleGamesPlayed = (updatedProfile.singleGamesPlayed || 0) + 1;
    difficultyRecord.singleGames += 1;
    difficultyRecord.totalSingleSeconds += result.seconds;
    difficultyRecord.recentSingleSeconds = [
      ...(difficultyRecord.recentSingleSeconds || []),
      result.seconds
    ].slice(-5);

    if (!difficultyRecord.bestTime || result.seconds < difficultyRecord.bestTime) {
      difficultyRecord.bestTime = result.seconds;
      messages.push(`Новый рекорд времени на уровне ${difficulty}: ${formatTime(result.seconds)}.`);
    }

    if (!difficultyRecord.bestMoves || result.moves < difficultyRecord.bestMoves) {
      difficultyRecord.bestMoves = result.moves;
      messages.push(`Новый рекорд ходов на уровне ${difficulty}: ${result.moves}.`);
    }

    updatedProfile.recordsByDifficulty[difficulty] = difficultyRecord;
    saveProfile(updatedProfile);

    return { profile: updatedProfile, messages };
  }

  function renderDifficultyRecords(profile) {
    return ["Начинающий", "КМС", "Мастер", "Гроссмейстер"].map((difficulty) => {
      const record = profile.recordsByDifficulty[difficulty] || {};
      const recentSeconds = record.recentSingleSeconds || [];
      const averageSeconds = record.singleGames
        ? Math.round((record.totalSingleSeconds || 0) / record.singleGames)
        : null;
      const recentAverageSeconds = recentSeconds.length
        ? Math.round(recentSeconds.reduce((sum, seconds) => sum + seconds, 0) / recentSeconds.length)
        : null;

      return `
        <div class="profile-stat profile-stat-record">
          <span>${difficulty}</span>
          <strong>${record.singleGames || 0}</strong>
          <small>Одиночных партий</small>
          <small>Лучшее: ${formatTime(record.bestTime)} / ${record.bestMoves || "-"}</small>
          <small>Среднее: ${formatTime(averageSeconds)}</small>
          <small>Последние 5: ${formatTime(recentAverageSeconds)}</small>
        </div>
      `;
    }).join("");
  }

  function renderProfile(elements, profile = createBlankProfile()) {
    elements.name.value = profile.name;
    elements.country.value = profile.country;

    renderProfileStats(elements, profile);
  }

  function renderProfileStats(elements, profile = loadProfile()) {
    if (!elements.stats) {
      return;
    }

    elements.stats.innerHTML = `
      <div class="profile-stat">
        <span>Матчевый рейтинг</span>
        <strong>${profile.matchRating || defaultProfile.matchRating}</strong>
      </div>
      <div class="profile-stat">
        <span>Матчи</span>
        <strong>${profile.matchGamesPlayed || 0}</strong>
      </div>
      <div class="profile-stat">
        <span>Счет матчей</span>
        <strong>${profile.twoPlayerWins || 0}-${profile.twoPlayerLosses || 0}</strong>
        <small>Ничьи: ${profile.twoPlayerDraws || 0}</small>
      </div>
      ${renderDifficultyRecords(profile)}
    `;
  }

  function initProfile(elements) {
    if (!elements.name || !elements.country) {
      return;
    }

    renderProfile(elements);
  }

  function saveProfileFromForm(elements) {
    const profile = getProfileFromForm(elements);

    saveProfile(profile);
    renderProfile(elements, profile);

    return profile;
  }

  window.ChessLegendsProfile = {
    createBlankProfile,
    hasSavedProfile,
    loadProfile,
    initProfile,
    renderProfile,
    renderProfileStats,
    saveProfileFromForm,
    updateProfileWithResult
  };
})();
