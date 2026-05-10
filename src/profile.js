(() => {
  const LEGACY_STORAGE_KEY = "chessLegendsProfile";
  const PROFILES_STORAGE_KEY = "chessLegendsProfiles";
  const ACTIVE_PROFILE_ID_KEY = "chessLegendsActiveProfileId";
  const minimumMovesByDifficulty = {
    "Начинающий": 8,
    "КМС": 16,
    "Мастер": 24,
    "Гроссмейстер": 32
  };

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

  function getMinimumMoves(difficulty) {
    return minimumMovesByDifficulty[difficulty] || 0;
  }

  function isValidMoveCount(difficulty, moves) {
    return Number.isFinite(moves) && moves >= getMinimumMoves(difficulty);
  }

  function formatMoves(difficulty, moves) {
    return isValidMoveCount(difficulty, moves) ? String(moves) : "-";
  }

  function createProfileId() {
    return `profile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function normalizeProfile(profile = {}) {
    return {
      ...defaultProfile,
      ...profile,
      id: profile.id || createProfileId(),
      recordsByDifficulty: profile.recordsByDifficulty || {}
    };
  }

  function readJson(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch {
      return fallback;
    }
  }

  function writeProfiles(profiles) {
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
  }

  function readStoredProfiles() {
    const profiles = readJson(PROFILES_STORAGE_KEY, []);

    return Array.isArray(profiles) ? profiles.map(normalizeProfile) : [];
  }

  function readLegacyProfile() {
    const profile = readJson(LEGACY_STORAGE_KEY, null);

    return profile ? normalizeProfile(profile) : null;
  }

  function getActiveProfileId() {
    return localStorage.getItem(ACTIVE_PROFILE_ID_KEY);
  }

  function setActiveProfile(profileId) {
    localStorage.setItem(ACTIVE_PROFILE_ID_KEY, profileId);
  }

  function listProfiles() {
    const profiles = readStoredProfiles();

    if (profiles.length) {
      return profiles;
    }

    const legacyProfile = readLegacyProfile();

    if (!legacyProfile) {
      return [];
    }

    writeProfiles([legacyProfile]);
    setActiveProfile(legacyProfile.id);
    return [legacyProfile];
  }

  function getProfile(profileId) {
    return listProfiles().find((profile) => profile.id === profileId) || null;
  }

  function loadProfile() {
    const profiles = listProfiles();
    const activeProfile = getProfile(getActiveProfileId());

    return activeProfile || profiles[0] || { ...defaultProfile };
  }

  function saveProfile(profile, options = {}) {
    const normalizedProfile = normalizeProfile(profile);
    const profiles = listProfiles();
    const existingIndex = profiles.findIndex((item) => item.id === normalizedProfile.id);
    const shouldActivate = options.activate !== false;

    if (existingIndex >= 0) {
      profiles[existingIndex] = normalizedProfile;
    } else {
      profiles.push(normalizedProfile);
    }

    writeProfiles(profiles);

    if (shouldActivate) {
      setActiveProfile(normalizedProfile.id);
      localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(normalizedProfile));
    }

    return normalizedProfile;
  }

  function createBlankProfile() {
    return {
      ...defaultProfile,
      name: "",
      country: ""
    };
  }

  function hasSavedProfile() {
    return listProfiles().length > 0;
  }

  function createProfile(profileData = {}, options = {}) {
    return saveProfile(normalizeProfile(profileData), options);
  }

  function updateProfile(profileId, patch) {
    const profile = getProfile(profileId);

    if (!profile) {
      return null;
    }

    return saveProfile({
      ...profile,
      ...patch,
      id: profile.id
    });
  }

  function resetSinglePlayerStats() {
    const profile = loadProfile();
    const resetProfile = {
      ...profile,
      singleGamesPlayed: 0,
      recordsByDifficulty: Object.fromEntries(
        Object.entries(profile.recordsByDifficulty || {}).map(([difficulty, record]) => [
          difficulty,
          {
            wins: record.wins || 0,
            losses: record.losses || 0,
            draws: record.draws || 0,
            matchWins: record.matchWins || 0,
            matchLosses: record.matchLosses || 0,
            matchDraws: record.matchDraws || 0,
            singleGames: 0,
            totalSingleSeconds: 0,
            totalSingleMoves: 0,
            recentSingleSeconds: [],
            recentSingleMoves: []
          }
        ])
      )
    };

    saveProfile(resetProfile);
    return resetProfile;
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

  function applyResultToProfile(profile, result) {
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
      totalSingleMoves: 0,
      recentSingleSeconds: [],
      recentSingleMoves: [],
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
      return { profile: updatedProfile, messages: [] };
    }

    const messages = [];

    updatedProfile.singleGamesPlayed = (updatedProfile.singleGamesPlayed || 0) + 1;
    difficultyRecord.singleGames += 1;
    difficultyRecord.totalSingleSeconds += result.seconds;
    if (isValidMoveCount(difficulty, result.moves)) {
      difficultyRecord.totalSingleMoves = (difficultyRecord.totalSingleMoves || 0) + result.moves;
      difficultyRecord.recentSingleMoves = [
        ...(difficultyRecord.recentSingleMoves || []),
        result.moves
      ].slice(-5);
    }
    difficultyRecord.recentSingleSeconds = [
      ...(difficultyRecord.recentSingleSeconds || []),
      result.seconds
    ].slice(-5);

    if (!difficultyRecord.bestTime || result.seconds < difficultyRecord.bestTime) {
      difficultyRecord.bestTime = result.seconds;
      messages.push(`Новый рекорд времени на уровне ${difficulty}: ${formatTime(result.seconds)}.`);
    }

    if (isValidMoveCount(difficulty, result.moves) && (!difficultyRecord.bestMoves || result.moves < difficultyRecord.bestMoves)) {
      difficultyRecord.bestMoves = result.moves;
      messages.push(`Новый рекорд ходов на уровне ${difficulty}: ${result.moves}.`);
    }

    updatedProfile.recordsByDifficulty[difficulty] = difficultyRecord;

    return { profile: updatedProfile, messages };
  }

  function recordSingleResult(profileId, result) {
    const profile = getProfile(profileId);

    if (!profile || result.settings.mode === "Два игрока") {
      return { profile, messages: [] };
    }

    const profileResult = applyResultToProfile(profile, result);

    saveProfile(profileResult.profile);
    return profileResult;
  }

  function recordProfileResult(profileId, result, options = {}) {
    const profile = getProfile(profileId);

    if (!profile) {
      return { profile: null, messages: [] };
    }

    const profileResult = applyResultToProfile(profile, result);

    saveProfile(profileResult.profile, options);
    return profileResult;
  }

  function getMirroredMatchResult(result) {
    const mirroredWinner = result.winner === null ? null : result.winner === 0 ? 1 : 0;

    return {
      ...result,
      scores: [...(result.scores || [])].reverse(),
      winner: mirroredWinner
    };
  }

  function recordMatchResult(player1Id, player2Id, result) {
    const player1 = getProfile(player1Id);
    const player2 = getProfile(player2Id);

    if (!player1 || !player2 || player1Id === player2Id || result.settings.mode !== "Два игрока") {
      return { player1: null, player2: null, messages: [] };
    }

    const activeProfileId = getActiveProfileId();
    const player1Result = applyResultToProfile(player1, result);
    const player2Result = applyResultToProfile(player2, getMirroredMatchResult(result));

    saveProfile(player1Result.profile, { activate: false });
    saveProfile(player2Result.profile, { activate: false });

    if (activeProfileId) {
      setActiveProfile(activeProfileId);
    }

    return {
      player1: player1Result.profile,
      player2: player2Result.profile,
      messages: []
    };
  }

  function updateProfileWithResult(result) {
    const activeProfile = loadProfile();

    if (!activeProfile.id) {
      const profileResult = applyResultToProfile(activeProfile, result);

      saveProfile(profileResult.profile);
      return profileResult;
    }

    return recordProfileResult(activeProfile.id, result);
  }

  function renderDifficultyRecords(profile) {
    return ["Начинающий", "КМС", "Мастер", "Гроссмейстер"].map((difficulty) => {
      const record = profile.recordsByDifficulty[difficulty] || {};
      const recentSeconds = record.recentSingleSeconds || [];
      const recentMoves = (record.recentSingleMoves || []).filter((moves) => isValidMoveCount(difficulty, moves));
      const hasValidAverageMoves = record.singleGames > 0
        && Number.isFinite(record.totalSingleMoves)
        && record.totalSingleMoves >= record.singleGames * getMinimumMoves(difficulty);
      const averageSeconds = record.singleGames
        ? Math.round((record.totalSingleSeconds || 0) / record.singleGames)
        : null;
      const averageMoves = hasValidAverageMoves
        ? Math.round((record.totalSingleMoves || 0) / record.singleGames)
        : null;
      const recentAverageSeconds = recentSeconds.length
        ? Math.round(recentSeconds.reduce((sum, seconds) => sum + seconds, 0) / recentSeconds.length)
        : null;
      const recentAverageMoves = recentMoves.length
        ? Math.round(recentMoves.reduce((sum, moves) => sum + moves, 0) / recentMoves.length)
        : null;

      return `
        <div class="profile-stat profile-stat-record">
          <span>${difficulty}</span>
          <strong>${record.singleGames || 0}</strong>
          <small>Одиночных партий</small>
          <small>Лучшее время: ${formatTime(record.bestTime)}</small>
          <small>Лучший результат: ${formatMoves(difficulty, record.bestMoves)}</small>
          <small>Среднее время за всё время: ${formatTime(averageSeconds)}</small>
          <small>Средние ходы за всё время: ${formatMoves(difficulty, averageMoves)}</small>
          <small>Время за последние 5 игр: ${formatTime(recentAverageSeconds)}</small>
          <small>Среднее количество ходов за последние 5 игр: ${formatMoves(difficulty, recentAverageMoves)}</small>
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
        <strong>Матчи: ${profile.matchGamesPlayed || 0}</strong>
        <small>Счёт: ${profile.twoPlayerWins || 0}-${profile.twoPlayerLosses || 0}</small>
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
    createProfile,
    getProfile,
    hasSavedProfile,
    listProfiles,
    loadProfile,
    initProfile,
    recordMatchResult,
    recordProfileResult,
    recordSingleResult,
    renderProfile,
    renderProfileStats,
    resetSinglePlayerStats,
    saveProfileFromForm,
    saveProfile,
    updateProfile,
    updateProfileWithResult
  };
})();
