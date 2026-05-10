const appLegends = window.ChessLegendsData.legends;
const appDifficultySettings = window.ChessLegendsData.difficultySettings;
const { showScreen } = window.ChessLegendsScreens;
const { getGameSettings, setGameSettings, initSetupControls } = window.ChessLegendsSetup;
const {
  createBlankProfile,
  createProfile,
  getProfile,
  hasSavedProfile,
  listProfiles,
  loadProfile,
  initProfile,
  recordMatchResult,
  recordProfileResult,
  renderProfile,
  resetSinglePlayerStats,
  saveProfileFromForm,
  updateProfileWithResult
} = window.ChessLegendsProfile;
const { renderGamePreview, stopGame } = window.ChessLegendsGamePreview;
const { initIntro } = window.ChessLegendsIntro;

const STORAGE_KEY = "chessLegendsState";

const introScreen = document.querySelector("#introScreen");
const profileScreen = document.querySelector("#profileScreen");
const accountScreen = document.querySelector("#accountScreen");
const setupScreen = document.querySelector("#setupScreen");
const gameScreen = document.querySelector("#gameScreen");
const startButton = document.querySelector("#startButton");
const continueToSetupButton = document.querySelector("#continueToSetupButton");
const playButton = document.querySelector("#playButton");
const backToProfileButton = document.querySelector("#backToProfileButton");
const backToSetupFromAccountButton = document.querySelector("#backToSetupFromAccountButton");
const resetProfileStatsButton = document.querySelector("#resetProfileStatsButton");
const logoutProfileButton = document.querySelector("#logoutProfileButton");
const backToSetup = document.querySelector("#backToSetup");
const currentPlayerLabel = document.querySelector("#currentPlayerLabel");
const matchPlayersPanel = document.querySelector("#matchPlayersPanel");
const matchPlayer1Select = document.querySelector("#matchPlayer1Select");
const matchPlayer2Select = document.querySelector("#matchPlayer2Select");
const createMatchPlayer1Button = document.querySelector("#createMatchPlayer1Button");
const createMatchPlayer2Button = document.querySelector("#createMatchPlayer2Button");
const matchPlayersNotice = document.querySelector("#matchPlayersNotice");
const matchPlayerCreateForm = document.querySelector("#matchPlayerCreateForm");
const matchPlayerNameInput = document.querySelector("#matchPlayerName");
const matchPlayerCountryInput = document.querySelector("#matchPlayerCountry");
const cancelMatchPlayerButton = document.querySelector("#cancelMatchPlayerButton");
const matchPlayerCreateError = document.querySelector("#matchPlayerCreateError");
const countryList = document.querySelector("#countryList");
const gameChoice = document.querySelector("#gameChoice");
const scorePanel = document.querySelector("#scorePanel");
const memoryBoard = document.querySelector("#memoryBoard");
const resultPanel = document.querySelector("#resultPanel");
const resultTitle = document.querySelector("#resultTitle");
const resultSummary = document.querySelector("#resultSummary");
const replayButton = document.querySelector("#replayButton");
const changeSettingsButton = document.querySelector("#changeSettingsButton");
const profileElements = {
  name: document.querySelector("#profileName"),
  country: document.querySelector("#profileCountry"),
  subtitle: document.querySelector("#profileSubtitle"),
  remember: document.querySelector("#rememberProfile"),
  loadSavedButton: document.querySelector("#loadSavedProfileButton")
};
const accountElements = {
  name: document.querySelector("#accountName"),
  country: document.querySelector("#accountCountry"),
  stats: document.querySelector("#accountStats")
};
const profileModeButtons = document.querySelectorAll(".profile-mode");
const GUEST_PLAYER_ID = "guest";
let matchPlayerCreationTarget = null;
const countryCodes = [
  "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR", "AS", "AT", "AU", "AW", "AX", "AZ",
  "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS",
  "BT", "BV", "BW", "BY", "BZ", "CA", "CC", "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN",
  "CO", "CR", "CU", "CV", "CW", "CX", "CY", "CZ", "DE", "DJ", "DK", "DM", "DO", "DZ", "EC", "EE",
  "EG", "EH", "ER", "ES", "ET", "FI", "FJ", "FK", "FM", "FO", "FR", "GA", "GB", "GD", "GE", "GF",
  "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GT", "GU", "GW", "GY", "HK", "HM",
  "HN", "HR", "HT", "HU", "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS", "IT", "JE", "JM",
  "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN", "KP", "KR", "KW", "KY", "KZ", "LA", "LB", "LC",
  "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME", "MF", "MG", "MH", "MK",
  "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS", "MT", "MU", "MV", "MW", "MX", "MY", "MZ", "NA",
  "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU", "NZ", "OM", "PA", "PE", "PF", "PG",
  "PH", "PK", "PL", "PM", "PN", "PR", "PS", "PT", "PW", "PY", "QA", "RE", "RO", "RS", "RU", "RW",
  "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS",
  "ST", "SV", "SX", "SY", "SZ", "TC", "TD", "TF", "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO",
  "TR", "TT", "TV", "TW", "TZ", "UA", "UG", "UM", "US", "UY", "UZ", "VA", "VC", "VE", "VG", "VI",
  "VN", "VU", "WF", "WS", "YE", "YT", "ZA", "ZM", "ZW"
];
const countryDisplayNames = typeof Intl.DisplayNames === "function"
  ? new Intl.DisplayNames(["ru"], { type: "region" })
  : null;
const countryOptions = buildCountryOptions();

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function getCountryName(code) {
  return countryDisplayNames?.of(code) || "";
}

function normalizeCountryName(name) {
  return name.trim().toLocaleLowerCase("ru");
}

function normalizeProfileName(name) {
  return name.trim().replace(/\s+/g, " ").toLocaleLowerCase("ru");
}

function buildCountryOptions() {
  return countryCodes
    .map((code) => ({
      code,
      name: getCountryName(code)
    }))
    .filter((country) => country.name && country.name !== country.code)
    .sort((first, second) => first.name.localeCompare(second.name, "ru"));
}

function getCountryInfo(countryName) {
  const normalizedName = normalizeCountryName(countryName);
  const normalizedCode = countryName.trim().toUpperCase();

  if (!normalizedName) {
    return null;
  }

  return countryOptions.find((country) => {
    return normalizeCountryName(country.name) === normalizedName || country.code === normalizedCode;
  }) || null;
}

function normalizeCountryValue(countryName) {
  return getCountryInfo(countryName)?.name || countryName.trim();
}

function getFlagUrl(countryCode) {
  return `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;
}

function normalizeProfileCountryField(elements) {
  if (!elements.country) {
    return;
  }

  elements.country.value = normalizeCountryValue(elements.country.value);
}

function initCountryList() {
  if (!countryList) {
    return;
  }

  const listItems = document.createDocumentFragment();

  countryOptions.forEach((country) => {
    const option = document.createElement("option");

    option.value = country.name;
    listItems.append(option);
  });

  countryList.replaceChildren(listItems);
}

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function handleStartupActions() {
  const url = new URL(window.location.href);

  if (url.searchParams.get("resetStats") !== "1") {
    return;
  }

  resetSinglePlayerStats();
  url.searchParams.delete("resetStats");
  window.history.replaceState({}, "", url);
}

function saveState(screenName) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    screen: screenName,
    profileMode: shouldRememberProfile() ? getProfileMode() : "profile",
    rememberProfile: shouldRememberProfile(),
    matchPlayers: getMatchPlayerSnapshot(),
    settings: getGameSettings()
  }));
}

function shouldRememberProfile() {
  return Boolean(profileElements.remember?.checked);
}

function refreshSavedProfileButton() {
  profileElements.loadSavedButton.disabled = !hasSavedProfile() || getProfileMode() === "guest";
}

function getProfileMode() {
  return document.querySelector(".profile-mode.is-selected")?.dataset.value || "profile";
}

function getProfileOptionText(profile) {
  const country = profile.country ? `, ${profile.country}` : "";

  return `${profile.name || "Игрок"}${country}`;
}

function findProfileByName(name) {
  const normalizedName = normalizeProfileName(name);

  if (!normalizedName) {
    return null;
  }

  return listProfiles().find((profile) => normalizeProfileName(profile.name || "") === normalizedName) || null;
}

function getMatchPlayerSelection() {
  return {
    player1Id: matchPlayer1Select?.value || GUEST_PLAYER_ID,
    player2Id: matchPlayer2Select?.value || GUEST_PLAYER_ID
  };
}

function getMatchPlayerProfile(playerId) {
  return playerId === GUEST_PLAYER_ID ? null : getProfile(playerId);
}

function getMatchPlayerSnapshot() {
  const { player1Id, player2Id } = getMatchPlayerSelection();
  const player1Profile = getMatchPlayerProfile(player1Id);
  const player2Profile = getMatchPlayerProfile(player2Id);

  return {
    player1Id,
    player2Id,
    player1Name: player1Profile?.name || "Гость 1",
    player2Name: player2Profile?.name || "Гость 2",
    player1Country: player1Profile?.country || "",
    player2Country: player2Profile?.country || ""
  };
}

function populateMatchPlayerSelect(select, selectedValue) {
  const profiles = listProfiles();
  const fallbackValue = selectedValue || GUEST_PLAYER_ID;

  select.replaceChildren();
  select.append(new Option("Гость", GUEST_PLAYER_ID));

  profiles.forEach((profile) => {
    select.append(new Option(getProfileOptionText(profile), profile.id));
  });

  select.value = [...select.options].some((option) => option.value === fallbackValue)
    ? fallbackValue
    : GUEST_PLAYER_ID;
}

function getSavedMatchProfileId(profileId) {
  if (!profileId || profileId === GUEST_PLAYER_ID) {
    return null;
  }

  return getProfile(profileId) ? profileId : null;
}

function populateMatchPlayerControls(savedSelection = {}) {
  const activeProfile = loadProfile();
  const player1Id = getSavedMatchProfileId(savedSelection.player1Id) || activeProfile.id || GUEST_PLAYER_ID;
  let player2Id = getSavedMatchProfileId(savedSelection.player2Id) || GUEST_PLAYER_ID;

  if (player2Id !== GUEST_PLAYER_ID && player2Id === player1Id) {
    player2Id = GUEST_PLAYER_ID;
  }

  populateMatchPlayerSelect(matchPlayer1Select, player1Id);
  populateMatchPlayerSelect(matchPlayer2Select, player2Id);
  updateMatchPlayerNotice();
}

function isMatchModeSelected() {
  return getGameSettings().mode === "Два игрока";
}

function updateMatchPlayersPanel() {
  matchPlayersPanel.hidden = !isMatchModeSelected();

  if (matchPlayersPanel.hidden) {
    closeMatchPlayerCreateForm();
  }

  updateMatchPlayerNotice();
}

function getMatchPlayerName(playerId, fallbackName) {
  return getMatchPlayerProfile(playerId)?.name || fallbackName;
}

function updateMatchPlayerNotice() {
  const { player1Id, player2Id } = getMatchPlayerSelection();
  const hasDuplicateProfiles = player1Id !== GUEST_PLAYER_ID && player1Id === player2Id;

  if (hasDuplicateProfiles) {
    matchPlayersNotice.textContent = "Выберите разные профили для игроков.";
    return;
  }

  if (!isMatchModeSelected()) {
    matchPlayersNotice.textContent = "";
    return;
  }

  matchPlayersNotice.textContent = `${getMatchPlayerName(player1Id, "Гость 1")} против ${getMatchPlayerName(player2Id, "Гость 2")}`;
}

function openMatchPlayerCreateForm(select) {
  matchPlayerCreationTarget = select;
  select.value = GUEST_PLAYER_ID;
  matchPlayerCreateError.textContent = "";
  matchPlayerNameInput.value = "";
  matchPlayerCountryInput.value = "";
  matchPlayerCreateForm.hidden = false;
  updateMatchPlayerNotice();
  saveState("setup");
  matchPlayerNameInput.focus();
}

function closeMatchPlayerCreateForm() {
  matchPlayerCreationTarget = null;
  matchPlayerCreateError.textContent = "";
  matchPlayerCreateForm.hidden = true;
}

function createMatchPlayerFromForm(event) {
  event.preventDefault();

  const name = matchPlayerNameInput.value.trim().replace(/\s+/g, " ");

  if (!name) {
    matchPlayerCreateError.textContent = "Введите имя игрока.";
    matchPlayerNameInput.focus();
    return;
  }

  if (findProfileByName(name)) {
    matchPlayerCreateError.textContent = "Игрок с таким именем уже существует.";
    matchPlayerNameInput.focus();
    return;
  }

  const profile = createProfile({
    name,
    country: normalizeCountryValue(matchPlayerCountryInput.value)
  }, {
    activate: false
  });
  const targetSelect = matchPlayerCreationTarget || matchPlayer2Select;

  populateMatchPlayerControls(getMatchPlayerSelection());
  targetSelect.value = profile.id;
  closeMatchPlayerCreateForm();
  updateMatchPlayerNotice();
  saveState("setup");
}

function validateMatchPlayers() {
  if (!isMatchModeSelected()) {
    return true;
  }

  const { player1Id, player2Id } = getMatchPlayerSelection();

  if (player1Id !== GUEST_PLAYER_ID && player1Id === player2Id) {
    window.alert("Для матча выберите два разных профиля или гостя.");
    return false;
  }

  return true;
}

function getMirroredMatchResult(result) {
  return {
    ...result,
    scores: [...(result.scores || [])].reverse(),
    winner: result.winner === null ? null : result.winner === 0 ? 1 : 0
  };
}

function recordSelectedMatchResult(result) {
  const { player1Id, player2Id } = getMatchPlayerSelection();
  const hasPlayer1Profile = player1Id !== GUEST_PLAYER_ID;
  const hasPlayer2Profile = player2Id !== GUEST_PLAYER_ID;

  if (hasPlayer1Profile && hasPlayer2Profile) {
    recordMatchResult(player1Id, player2Id, result);
  } else if (hasPlayer1Profile) {
    recordProfileResult(player1Id, result, { activate: false });
  } else if (hasPlayer2Profile) {
    recordProfileResult(player2Id, getMirroredMatchResult(result), { activate: false });
  }

  const activeProfile = loadProfile();

  renderProfile(profileElements, activeProfile);
  renderProfile(accountElements, activeProfile);
  return { messages: [] };
}

function setProfileMode(mode) {
  const isGuest = mode === "guest";

  profileModeButtons.forEach((button) => {
    const isSelected = button.dataset.value === mode;

    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });

  profileElements.name.disabled = isGuest;
  profileElements.country.disabled = isGuest;
  profileElements.remember.disabled = isGuest;
  profileElements.subtitle.textContent = isGuest
    ? "Гостевая партия не изменит сохраненные рекорды"
    : "Рекорды сохраняются на этом устройстве";

  if (isGuest) {
    profileElements.remember.checked = false;
  }

  refreshSavedProfileButton();
}

function updateCurrentPlayerLabel() {
  const isGuest = getProfileMode() === "guest";

  logoutProfileButton.hidden = isGuest;
  currentPlayerLabel.replaceChildren();

  if (isGuest) {
    currentPlayerLabel.textContent = "Игрок: Гость";
    return;
  }

  const name = profileElements.name.value.trim() || "Игрок";
  const country = profileElements.country.value.trim();
  const countryInfo = getCountryInfo(country);

  currentPlayerLabel.append(`Игрок: ${name}`);

  if (countryInfo) {
    const flag = document.createElement("img");

    flag.className = "player-flag";
    flag.src = getFlagUrl(countryInfo.code);
    flag.alt = "";
    flag.loading = "lazy";
    flag.title = countryInfo.name;
    flag.setAttribute("aria-label", countryInfo.name);
    currentPlayerLabel.append(" ", flag);
  }
}

function showProfileScreen() {
  stopGame();
  showScreen(profileScreen);
  saveState("profile");
}

function showAccountScreen() {
  stopGame();
  renderProfile(accountElements, loadProfile());
  normalizeProfileCountryField(accountElements);
  showScreen(accountScreen);
  saveState("account");
}

function showSetupScreen() {
  if (getProfileMode() !== "guest") {
    normalizeProfileCountryField(profileElements);
    saveProfileFromForm(profileElements);
    refreshSavedProfileButton();
    renderProfile(accountElements, loadProfile());
    normalizeProfileCountryField(accountElements);
  }

  updateCurrentPlayerLabel();
  populateMatchPlayerControls(getMatchPlayerSelection());
  updateMatchPlayersPanel();
  showScreen(setupScreen);
  saveState("setup");
}

function logoutProfile() {
  stopGame();
  profileElements.remember.checked = false;
  renderProfile(profileElements, createBlankProfile());
  setProfileMode("profile");
  updateCurrentPlayerLabel();
  showScreen(profileScreen);
  saveState("profile");
}

function startGamePreview() {
  const isGuest = getProfileMode() === "guest";

  if (!validateMatchPlayers()) {
    return;
  }

  if (!isGuest) {
    normalizeProfileCountryField(profileElements);
    saveProfileFromForm(profileElements);
    refreshSavedProfileButton();
    updateCurrentPlayerLabel();
  }

  renderGamePreview({
    settings: getGameSettings(),
    matchPlayers: isMatchModeSelected() ? getMatchPlayerSnapshot() : null,
    legends: appLegends,
    difficultySettings: appDifficultySettings,
    gameChoice,
    scorePanel,
    memoryBoard,
    resultPanel,
    resultTitle,
    resultSummary,
    replayButton,
    changeSettingsButton,
    onGameComplete: (result) => {
      if (result.settings.mode === "Два игрока") {
        return recordSelectedMatchResult(result);
      }

      if (isGuest) {
        return { messages: [] };
      }

      const profileResult = updateProfileWithResult(result);

      renderProfile(profileElements, profileResult.profile);
      renderProfile(accountElements, profileResult.profile);
      return profileResult;
    },
    showSetup: () => {
      stopGame();
      showScreen(setupScreen);
      saveState("setup");
    },
    shuffle
  });
  showScreen(gameScreen);
  saveState("game");
}

function restoreState() {
  const state = loadState();
  const shouldRestoreProfile = state.rememberProfile === true && hasSavedProfile();

  setGameSettings(state.settings);
  profileElements.remember.checked = shouldRestoreProfile;
  renderProfile(profileElements, shouldRestoreProfile ? loadProfile() : createBlankProfile());
  renderProfile(accountElements, shouldRestoreProfile ? loadProfile() : createBlankProfile());
  normalizeProfileCountryField(profileElements);
  normalizeProfileCountryField(accountElements);
  setProfileMode(shouldRestoreProfile ? state.profileMode || "profile" : "profile");
  populateMatchPlayerControls(state.matchPlayers);
  updateMatchPlayersPanel();
  refreshSavedProfileButton();
  updateCurrentPlayerLabel();

  showScreen(introScreen);
}

initIntro(appLegends);
initSetupControls();
initCountryList();
initProfile(profileElements);
handleStartupActions();
restoreState();

startButton.addEventListener("click", () => {
  showScreen(profileScreen);
  saveState("profile");
});

continueToSetupButton.addEventListener("click", showSetupScreen);

backToProfileButton.addEventListener("click", () => {
  if (getProfileMode() === "guest") {
    showProfileScreen();
    return;
  }

  showAccountScreen();
});

backToSetupFromAccountButton.addEventListener("click", () => {
  normalizeProfileCountryField(accountElements);
  saveProfileFromForm(accountElements);
  renderProfile(profileElements, loadProfile());
  normalizeProfileCountryField(profileElements);
  updateCurrentPlayerLabel();
  populateMatchPlayerControls(getMatchPlayerSelection());
  updateMatchPlayersPanel();
  showScreen(setupScreen);
  saveState("setup");
});

resetProfileStatsButton.addEventListener("click", () => {
  const shouldReset = window.confirm("Обнулить статистику одиночных игр? Матчи и рейтинг останутся.");

  if (!shouldReset) {
    return;
  }

  const profile = resetSinglePlayerStats();

  renderProfile(profileElements, profile);
  renderProfile(accountElements, profile);
  normalizeProfileCountryField(profileElements);
  normalizeProfileCountryField(accountElements);
  updateCurrentPlayerLabel();
  saveState("account");
});

logoutProfileButton.addEventListener("click", logoutProfile);

playButton.addEventListener("click", startGamePreview);

backToSetup.addEventListener("click", () => {
  stopGame();
  showScreen(setupScreen);
  saveState("setup");
});

document.querySelectorAll(".option-row, .segmented-control, .difficulty-row").forEach((group) => {
  group.addEventListener("click", () => {
    window.setTimeout(() => {
      updateMatchPlayersPanel();
      saveState("setup");
    }, 0);
  });
});

matchPlayer1Select.addEventListener("change", () => {
  closeMatchPlayerCreateForm();
  updateMatchPlayerNotice();
  saveState("setup");
});

matchPlayer2Select.addEventListener("change", () => {
  closeMatchPlayerCreateForm();
  updateMatchPlayerNotice();
  saveState("setup");
});

createMatchPlayer1Button.addEventListener("click", () => {
  openMatchPlayerCreateForm(matchPlayer1Select);
});

createMatchPlayer2Button.addEventListener("click", () => {
  openMatchPlayerCreateForm(matchPlayer2Select);
});

matchPlayerCreateForm.addEventListener("submit", createMatchPlayerFromForm);
cancelMatchPlayerButton.addEventListener("click", closeMatchPlayerCreateForm);

profileModeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setProfileMode(button.dataset.value);
    updateCurrentPlayerLabel();
    saveState("profile");
  });
});

profileElements.loadSavedButton.addEventListener("click", () => {
  renderProfile(profileElements, loadProfile());
  renderProfile(accountElements, loadProfile());
  normalizeProfileCountryField(profileElements);
  normalizeProfileCountryField(accountElements);
  setProfileMode("profile");
  populateMatchPlayerControls(getMatchPlayerSelection());
  updateCurrentPlayerLabel();
  saveState("profile");
});

profileElements.name.addEventListener("input", updateCurrentPlayerLabel);

profileElements.country.addEventListener("input", updateCurrentPlayerLabel);

accountElements.country.addEventListener("change", () => {
  normalizeProfileCountryField(accountElements);
  saveProfileFromForm(accountElements);
  renderProfile(profileElements, loadProfile());
  normalizeProfileCountryField(profileElements);
  updateCurrentPlayerLabel();
  saveState("account");
});

profileElements.remember.addEventListener("change", () => {
  saveState("profile");
});
