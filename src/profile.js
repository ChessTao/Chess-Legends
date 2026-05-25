(() => {
  const LEGACY_STORAGE_KEY = "chessLegendsProfile";
  const PROFILES_STORAGE_KEY = "chessLegendsProfiles";
  const ACTIVE_PROFILE_ID_KEY = "chessLegendsActiveProfileId";
  const PASSWORD_MIN_LENGTH = 4;
  const API_TIMEOUT_MS = 6000;
  const PROFILE_SERVER_ERROR = "Для входа с паролем откройте игру через сервер профилей: npm start, затем http://127.0.0.1:4173/.";
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
    serverProfile: false,
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

  function createPasswordSalt() {
    const bytes = new Uint8Array(16);

    if (window.crypto?.getRandomValues) {
      window.crypto.getRandomValues(bytes);
    } else {
      for (let index = 0; index < bytes.length; index += 1) {
        bytes[index] = Math.floor(Math.random() * 256);
      }
    }

    return bytesToHex(bytes);
  }

  function bytesToHex(bytes) {
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  function fallbackHash(value) {
    let hash = 2166136261;

    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }

    return `fallback-${(hash >>> 0).toString(16).padStart(8, "0")}`;
  }

  async function hashPassword(password, salt) {
    const value = `${salt}:${password}`;

    if (window.crypto?.subtle && window.TextEncoder) {
      const encodedValue = new TextEncoder().encode(value);
      const digest = await window.crypto.subtle.digest("SHA-256", encodedValue);

      return `sha256-${bytesToHex(new Uint8Array(digest))}`;
    }

    return fallbackHash(value);
  }

  function validatePassword(password) {
    return password.length >= PASSWORD_MIN_LENGTH;
  }

  function hasProfilePassword(profile) {
    return Boolean(profile?.passwordHash && profile?.passwordSalt);
  }

  async function createPasswordFields(password) {
    const passwordSalt = createPasswordSalt();
    const passwordHash = await hashPassword(password, passwordSalt);

    return { passwordHash, passwordSalt };
  }

  async function setProfilePassword(profile, password) {
    return {
      ...profile,
      ...(await createPasswordFields(password))
    };
  }

  async function verifyProfilePassword(profile, password) {
    if (!hasProfilePassword(profile)) {
      return false;
    }

    const passwordHash = await hashPassword(password, profile.passwordSalt);

    return passwordHash === profile.passwordHash;
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

  function mergeServerProfiles(localProfiles, serverProfiles) {
    const mergedProfiles = [...localProfiles];

    serverProfiles.forEach((serverProfile) => {
      const existingIndex = mergedProfiles.findIndex((profile) => profile.id === serverProfile.id);

      if (existingIndex >= 0) {
        mergedProfiles[existingIndex] = {
          ...mergedProfiles[existingIndex],
          ...serverProfile,
          serverProfile: true
        };
      } else {
        mergedProfiles.push(serverProfile);
      }
    });

    return mergedProfiles.map(normalizeProfile);
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

  function clearProfiles() {
    localStorage.removeItem(PROFILES_STORAGE_KEY);
    localStorage.removeItem(ACTIVE_PROFILE_ID_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
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

  function removeProfiles(matcher) {
    const profiles = listProfiles();
    const filteredProfiles = profiles.filter((profile) => !matcher(profile));
    const activeProfileId = getActiveProfileId();

    if (filteredProfiles.length === profiles.length) {
      return filteredProfiles;
    }

    writeProfiles(filteredProfiles);

    if (activeProfileId && !filteredProfiles.some((profile) => profile.id === activeProfileId)) {
      if (filteredProfiles[0]) {
        setActiveProfile(filteredProfiles[0].id);
        localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(filteredProfiles[0]));
      } else {
        localStorage.removeItem(ACTIVE_PROFILE_ID_KEY);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
    }

    return filteredProfiles;
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

    if (normalizedProfile.serverProfile && !options.skipServerSync) {
      syncProfileToServer(normalizedProfile);
    }

    return normalizedProfile;
  }

  async function requestProfileApi(path, payload = null, options = {}) {
    if (typeof fetch !== "function") {
      throw new Error("Сервер профилей недоступен.");
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
      const response = await fetch(path, {
        method: payload ? "POST" : "GET",
        credentials: "same-origin",
        headers: payload ? { "Content-Type": "application/json" } : {},
        body: payload ? JSON.stringify(payload) : undefined,
        signal: controller.signal
      });
      const contentType = response.headers.get("Content-Type") || "";
      const data = contentType.includes("application/json")
        ? await response.json().catch(() => ({}))
        : {};

      if (!response.ok) {
        throw new Error(data.error || options.errorMessage || PROFILE_SERVER_ERROR);
      }

      if (!contentType.includes("application/json")) {
        throw new Error(PROFILE_SERVER_ERROR);
      }

      return data;
    } catch (error) {
      if (error.name === "AbortError" || error instanceof TypeError) {
        throw new Error(PROFILE_SERVER_ERROR);
      }

      throw error;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  async function syncProfilesFromServer() {
    const localProfiles = readStoredProfiles();
    const data = await requestProfileApi("/api/profiles", null, {
      errorMessage: "Не удалось загрузить профили с сервера."
    });
    const serverProfiles = Array.isArray(data.profiles)
      ? data.profiles.map((profile) => normalizeProfile({ ...profile, serverProfile: true }))
      : [];
    const activeProfileId = getActiveProfileId();
    const mergedProfiles = mergeServerProfiles(localProfiles, serverProfiles);

    writeProfiles(mergedProfiles);

    if (activeProfileId && !mergedProfiles.some((profile) => profile.id === activeProfileId)) {
      localStorage.removeItem(ACTIVE_PROFILE_ID_KEY);
    }

    return mergedProfiles;
  }

  async function registerProfileWithPassword(profileData, password) {
    if (!validatePassword(password)) {
      throw new Error("Пароль должен быть не короче 4 символов.");
    }

    const normalizedProfile = normalizeProfile(profileData);
    const data = await requestProfileApi("/api/register", {
      name: normalizedProfile.name,
      country: normalizedProfile.country,
      password,
      profile: normalizedProfile
    });

    return saveProfile({ ...data.profile, serverProfile: true }, { skipServerSync: true });
  }

  async function loginProfileWithPassword(name, password) {
    if (!password) {
      throw new Error("Введите пароль.");
    }

    const data = await requestProfileApi("/api/login", { name, password });

    return saveProfile({ ...data.profile, serverProfile: true }, { skipServerSync: true });
  }

  function syncProfileToServer(profile) {
    requestProfileApi("/api/profiles/save", { profile }).catch(() => {});
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

  function updateProfileWithResult(result) {
    const activeProfile = loadProfile();
    const profileResult = applyResultToProfile(activeProfile, result);

    saveProfile(profileResult.profile);
    return profileResult;
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
          <strong>${record.singleGames || 0} игр</strong>
          <small>Лучшее: ${formatTime(record.bestTime)} / ${formatMoves(difficulty, record.bestMoves)}</small>
          <small>Среднее: ${formatTime(averageSeconds)} / ${formatMoves(difficulty, averageMoves)}</small>
          <small>Последние 5: ${formatTime(recentAverageSeconds)} / ${formatMoves(difficulty, recentAverageMoves)}</small>
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
        <span>Матчевая статистика</span>
        <strong>Рейтинг: ${profile.matchRating || defaultProfile.matchRating}</strong>
        <small>Матчей: ${profile.matchGamesPlayed || 0}</small>
        <small>Счет: ${profile.twoPlayerWins || 0}-${profile.twoPlayerLosses || 0}</small>
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
    clearProfiles,
    hasProfilePassword,
    getProfile,
    hasSavedProfile,
    listProfiles,
    loadProfile,
    initProfile,
    loginProfileWithPassword,
    registerProfileWithPassword,
    removeProfiles,
    renderProfile,
    renderProfileStats,
    resetSinglePlayerStats,
    saveProfileFromForm,
    saveProfile,
    setProfilePassword,
    syncProfilesFromServer,
    updateProfile,
    updateProfileWithResult,
    validatePassword,
    verifyProfilePassword
  };
})();
