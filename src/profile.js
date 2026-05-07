(() => {
  const STORAGE_KEY = "chessLegendsProfile";

  const defaultProfile = {
    name: "Игрок",
    country: "",
    chessRating: "",
    gameRating: 1000,
    gamesPlayed: 0,
    twoPlayerWins: 0,
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

  function saveProfile(profile) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }

  function getProfileFromForm(elements) {
    const rating = Number(elements.chessRating.value);

    return {
      ...loadProfile(),
      name: elements.name.value.trim() || defaultProfile.name,
      country: elements.country.value.trim(),
      chessRating: Number.isFinite(rating) && rating > 0 ? String(Math.round(rating)) : ""
    };
  }

  function calculateRatingGain(result) {
    const difficultyBonus = {
      "Начинающий": 8,
      "КМС": 14,
      "Мастер": 20,
      "Гроссмейстер": 28
    };

    const modeBonus = result.settings.mode === "Два игрока" ? 6 : 0;

    return (difficultyBonus[result.settings.difficulty] || 8) + modeBonus;
  }

  function updateProfileWithResult(result) {
    const profile = loadProfile();
    const updatedProfile = {
      ...profile,
      gamesPlayed: profile.gamesPlayed + 1,
      gameRating: profile.gameRating + calculateRatingGain(result),
      recordsByDifficulty: { ...profile.recordsByDifficulty }
    };

    if (result.settings.mode === "Два игрока") {
      if (result.winner === 0) {
        updatedProfile.twoPlayerWins += 1;
      }

      saveProfile(updatedProfile);
      return { profile: updatedProfile, messages: [] };
    }

    const messages = [];
    const difficulty = result.settings.difficulty;
    const difficultyRecord = {
      ...(updatedProfile.recordsByDifficulty[difficulty] || {})
    };

    if (!updatedProfile.bestTime || result.seconds < updatedProfile.bestTime) {
      updatedProfile.bestTime = result.seconds;
      messages.push(`Новый рекорд времени: ${formatTime(result.seconds)}.`);
    }

    if (!updatedProfile.bestMoves || result.moves < updatedProfile.bestMoves) {
      updatedProfile.bestMoves = result.moves;
      messages.push(`Новый рекорд ходов: ${result.moves}.`);
    }

    if (!difficultyRecord.bestTime || result.seconds < difficultyRecord.bestTime) {
      difficultyRecord.bestTime = result.seconds;
    }

    if (!difficultyRecord.bestMoves || result.moves < difficultyRecord.bestMoves) {
      difficultyRecord.bestMoves = result.moves;
    }

    updatedProfile.recordsByDifficulty[difficulty] = difficultyRecord;
    saveProfile(updatedProfile);

    return { profile: updatedProfile, messages };
  }

  function renderProfile(elements, profile = loadProfile()) {
    elements.name.value = profile.name;
    elements.country.value = profile.country;
    elements.chessRating.value = profile.chessRating;

    elements.stats.innerHTML = `
      <div class="profile-stat">
        <span>Игровой рейтинг</span>
        <strong>${profile.gameRating}</strong>
      </div>
      <div class="profile-stat">
        <span>Партий</span>
        <strong>${profile.gamesPlayed}</strong>
      </div>
      <div class="profile-stat">
        <span>Лучшее время</span>
        <strong>${formatTime(profile.bestTime)}</strong>
      </div>
      <div class="profile-stat">
        <span>Лучшие ходы</span>
        <strong>${profile.bestMoves || "-"}</strong>
      </div>
      <div class="profile-stat">
        <span>Победы вдвоем</span>
        <strong>${profile.twoPlayerWins}</strong>
      </div>
    `;
  }

  function initProfile(elements) {
    if (!elements.name || !elements.country || !elements.chessRating || !elements.stats || !elements.saveButton) {
      return;
    }

    renderProfile(elements);

    elements.saveButton.addEventListener("click", () => {
      saveProfileFromForm(elements);
    });
  }

  function saveProfileFromForm(elements) {
    const profile = getProfileFromForm(elements);

    saveProfile(profile);
    renderProfile(elements, profile);

    return profile;
  }

  window.ChessLegendsProfile = {
    initProfile,
    renderProfile,
    saveProfileFromForm,
    updateProfileWithResult
  };
})();
