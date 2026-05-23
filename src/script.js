const appLegends = window.ChessLegendsData.legends;
const appDifficultySettings = window.ChessLegendsData.difficultySettings;
const { loadAppState, saveAppState } = window.ChessLegendsAppState;
const { getActiveScreen, getScreenByName, getScreenName, showScreen } = window.ChessLegendsScreens;
const { getGameSettings, setGameSettings, initSetupControls } = window.ChessLegendsSetup;
const {
  clearProfiles,
  createBlankProfile,
  getProfile,
  hasSavedProfile,
  listProfiles,
  loadProfile,
  initProfile,
  loginProfileWithPassword,
  recordMatchResult,
  recordProfileResult,
  registerProfileWithPassword,
  renderProfile,
  removeProfiles,
  resetSinglePlayerStats,
  saveProfileFromForm,
  saveProfile,
  syncProfilesFromServer,
  updateProfileWithResult,
  validatePassword
} = window.ChessLegendsProfile;
const { createProfileFormController } = window.ChessLegendsProfileForm;
const { createMatchPlayersController } = window.ChessLegendsMatchPlayers;
const { renderGamePreview, stopGame } = window.ChessLegendsGamePreview;
const { initIntro } = window.ChessLegendsIntro;
const { createInfoPagesController } = window.ChessLegendsInfoPages;

const PROFILE_CLEANUP_KEY = "chessLegendsCleanupRemovedProfiles20260513";

const introScreen = document.querySelector("#introScreen");
const profileScreen = document.querySelector("#profileScreen");
const accountScreen = document.querySelector("#accountScreen");
const setupScreen = document.querySelector("#setupScreen");
const gameScreen = document.querySelector("#gameScreen");
const infoScreen = document.querySelector("#infoScreen");
const startButton = document.querySelector("#startButton");
const loginProfileButton = document.querySelector("#loginProfileButton");
const registerProfileButton = document.querySelector("#registerProfileButton");
const confirmLoginButton = document.querySelector("#confirmLoginButton");
const playButton = document.querySelector("#playButton");
const backToProfileButton = document.querySelector("#backToProfileButton");
const backToSetupFromAccountButton = document.querySelector("#backToSetupFromAccountButton");
const logoutProfileButton = document.querySelector("#logoutProfileButton");
const backToSetup = document.querySelector("#backToSetup");
const currentPlayerLabel = document.querySelector("#currentPlayerLabel");
const matchPlayersPanel = document.querySelector("#matchPlayersPanel");
const matchPlayer1Select = document.querySelector("#matchPlayer1Select");
const matchPlayer2Select = document.querySelector("#matchPlayer2Select");
const matchGuestFields = document.querySelector("#matchGuestFields");
const matchGuestName = document.querySelector("#matchGuestName");
const matchGuestCountry = document.querySelector("#matchGuestCountry");
const matchPlayersNotice = document.querySelector("#matchPlayersNotice");
const countryList = document.querySelector("#countryList");
const profileNameList = document.querySelector("#profileNameList");
const gameChoice = document.querySelector("#gameChoice");
const scorePanel = document.querySelector("#scorePanel");
const memoryBoard = document.querySelector("#memoryBoard");
const resultPanel = document.querySelector("#resultPanel");
const resultTitle = document.querySelector("#resultTitle");
const resultSummary = document.querySelector("#resultSummary");
const replayButton = document.querySelector("#replayButton");
const changeSettingsButton = document.querySelector("#changeSettingsButton");
const backFromInfoButton = document.querySelector("#backFromInfoButton");
const infoPageTitle = document.querySelector("#infoPageTitle");
const infoArticles = document.querySelectorAll(".info-article");
const projectLinks = document.querySelectorAll(".project-links a[data-info-page]");
const biographyList = document.querySelector("#biographyList");
const biographyReader = document.querySelector("#biographyReader");
const photoCreditsList = document.querySelector("#photoCreditsList");
const biographyItems = window.ChessLegendsData.biographies || [];
const photoCredits = window.ChessLegendsData.photoCredits || [];
const profileElements = {
  name: document.querySelector("#profileName"),
  password: document.querySelector("#profilePassword"),
  passwordLabel: document.querySelector("#profilePasswordLabel"),
  country: document.querySelector("#profileCountry"),
  subtitle: document.querySelector("#profileSubtitle"),
  remember: document.querySelector("#rememberProfile")
};
const accountElements = {
  name: document.querySelector("#accountName"),
  country: document.querySelector("#accountCountry"),
  stats: document.querySelector("#accountStats")
};
const profileModeButtons = document.querySelectorAll(".profile-mode");
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

const profileForm = createProfileFormController({
  accountElements,
  createBlankProfile,
  elements: {
    confirmButton: confirmLoginButton,
    modeButtons: profileModeButtons,
    nameList: profileNameList,
    profileElements
  },
  findProfileByName,
  listProfiles,
  loginProfileWithPassword,
  normalizeCountryName,
  normalizeProfileCountryField,
  normalizeProfileName,
  onCurrentPlayerChange: updateCurrentPlayerLabel,
  onShowSetup: showSetupScreen,
  registerProfileWithPassword,
  renderProfile,
  saveState,
  validatePassword
});

const {
  bindNameList: bindProfileNameList,
  confirmEntry: confirmProfileEntry,
  enableNameInput: enableProfileNameInput,
  fillCountryFromProfileName,
  getMode: getProfileMode,
  hideNameList: hideProfileNameList,
  refreshNameList: refreshProfileNameList,
  resetForm: resetProfileForm,
  setMode: setProfileMode,
  updateNameSuggestions: updateProfileNameSuggestions
} = profileForm;

const matchPlayers = createMatchPlayersController({
  elements: {
    panel: matchPlayersPanel,
    player1Select: matchPlayer1Select,
    player2Select: matchPlayer2Select,
    guestFields: matchGuestFields,
    guestName: matchGuestName,
    guestCountry: matchGuestCountry,
    notice: matchPlayersNotice
  },
  getGameSettings,
  getProfile,
  listProfiles,
  loadProfile,
  normalizeCountryValue,
  normalizeProfileName
});

const {
  clearGuestFields: clearGuestMatchFields,
  getSelection: getMatchPlayerSelection,
  getSnapshot: getMatchPlayerSnapshot,
  isGuestSelected: isGuestMatchPlayerSelected,
  isMatchModeSelected,
  populateControls: populateMatchPlayerControls,
  updateNotice: updateMatchPlayerNotice,
  updatePanel: updateMatchPlayersPanel,
  validate: validateMatchPlayers
} = matchPlayers;

const infoPages = createInfoPagesController({
  biographyItems,
  photoCredits,
  elements: {
    backButton: backFromInfoButton,
    biographyList,
    biographyReader,
    creditsList: photoCreditsList,
    infoScreen,
    pageTitle: infoPageTitle,
    articles: infoArticles,
    projectLinks
  },
  getActiveScreen,
  getScreenName,
  onStateChange: saveState,
  screens: {
    profileScreen,
    setupScreen,
    gameScreen
  },
  showScreen
});

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

function handleStartupActions() {
  const url = new URL(window.location.href);

  if (url.searchParams.get("resetProfiles") === "1") {
    clearProfiles();
    resetProfileForm();
    setProfileMode("register");
    refreshProfileNameList();
    updateCurrentPlayerLabel();
    url.searchParams.delete("resetProfiles");
    window.history.replaceState({}, "", url);
    return;
  }

  if (localStorage.getItem(PROFILE_CLEANUP_KEY) !== "1") {
    removeProfiles((profile) => {
      const name = normalizeProfileName(profile.name || "");
      const country = normalizeCountryName(profile.country || "");

      return (
        (name === normalizeProfileName("Ирина") && country === "") ||
        (name === normalizeProfileName("Иван") && country === normalizeCountryName("Германия")) ||
        name === normalizeProfileName("Лионель")
      );
    });
    localStorage.setItem(PROFILE_CLEANUP_KEY, "1");
    refreshProfileNameList();
  }

  if (url.searchParams.get("resetStats") !== "1") {
    return;
  }

  resetSinglePlayerStats();
  url.searchParams.delete("resetStats");
  window.history.replaceState({}, "", url);
}

function saveState(screenName, extraState = {}) {
  saveAppState({
    screen: screenName,
    profileMode: shouldRememberProfile() ? getProfileMode() : "register",
    rememberProfile: shouldRememberProfile(),
    matchPlayers: getMatchPlayerSnapshot(),
    settings: getGameSettings(),
    ...extraState
  });
}

function shouldRememberProfile() {
  return Boolean(profileElements.remember?.checked);
}

function findProfileByName(name) {
  const normalizedName = normalizeProfileName(name);

  if (!normalizedName) {
    return null;
  }

  return listProfiles().find((profile) => normalizeProfileName(profile.name || "") === normalizedName) || null;
}

function recordSelectedMatchResult(result) {
  const { player1Id, player2Id, player2IsGuest } = getMatchPlayerSelection();

  if (player1Id && player2Id && !player2IsGuest) {
    recordMatchResult(player1Id, player2Id, result);
  } else if (player1Id && player2IsGuest) {
    recordProfileResult(player1Id, result);
  }

  const activeProfile = loadProfile();

  renderProfile(profileElements, activeProfile);
  renderProfile(accountElements, activeProfile);
  return { messages: [] };
}

function updateCurrentPlayerLabel() {
  logoutProfileButton.hidden = false;
  currentPlayerLabel.replaceChildren();

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
  normalizeProfileCountryField(profileElements);
  saveProfileFromForm(profileElements);
  refreshProfileNameList();
  renderProfile(accountElements, loadProfile());
  normalizeProfileCountryField(accountElements);

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
  setProfileMode("register");
  updateCurrentPlayerLabel();
  showScreen(profileScreen);
  saveState("profile");
}

function startGamePreview() {
  if (!validateMatchPlayers()) {
    return;
  }

  normalizeProfileCountryField(profileElements);
  saveProfileFromForm(profileElements);
  refreshProfileNameList();
  updateCurrentPlayerLabel();

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
  const state = loadAppState();
  const shouldRestoreProfile = state.rememberProfile === true && hasSavedProfile();
  const savedScreenName = state.screen || "intro";

  setGameSettings(state.settings);
  profileElements.remember.checked = shouldRestoreProfile;
  renderProfile(profileElements, shouldRestoreProfile ? loadProfile() : createBlankProfile());
  renderProfile(accountElements, shouldRestoreProfile ? loadProfile() : createBlankProfile());
  normalizeProfileCountryField(profileElements);
  normalizeProfileCountryField(accountElements);
  setProfileMode(shouldRestoreProfile ? state.profileMode || "register" : "register");
  populateMatchPlayerControls(state.matchPlayers);
  updateMatchPlayersPanel();
  updateCurrentPlayerLabel();

  if (savedScreenName === "info") {
    infoPages.restore(state.infoPage || "rules", getScreenByName(state.previousScreen) || profileScreen);
    return;
  }

  if (savedScreenName === "game") {
    showScreen(setupScreen);
    saveState("setup");
    return;
  }

  const targetScreen = getScreenByName(savedScreenName) || introScreen;

  showScreen(targetScreen);
}

initIntro(appLegends);
initSetupControls();
initCountryList();
refreshProfileNameList();
initProfile(profileElements);
syncProfilesFromServer()
  .then(() => {
    refreshProfileNameList();
    renderProfile(profileElements, loadProfile());
    normalizeProfileCountryField(profileElements);
    updateCurrentPlayerLabel();
  })
  .catch(() => {});
handleStartupActions();
restoreState();

startButton.addEventListener("click", () => {
  showScreen(profileScreen);
  saveState("profile");
});

loginProfileButton.addEventListener("click", () => setProfileMode("login"));
registerProfileButton.addEventListener("click", () => setProfileMode("register"));
confirmLoginButton.addEventListener("click", confirmProfileEntry);

infoPages.init();

backToProfileButton.addEventListener("click", () => {
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
  updateMatchPlayerNotice();
  saveState("setup");
});

matchPlayer2Select.addEventListener("change", () => {
  if (isGuestMatchPlayerSelected()) {
    clearGuestMatchFields();
  }

  updateMatchPlayerNotice();
  saveState("setup");
});

matchGuestName?.addEventListener("input", () => {
  updateMatchPlayerNotice();
  saveState("setup");
});

matchGuestCountry?.addEventListener("change", () => {
  matchGuestCountry.value = normalizeCountryValue(matchGuestCountry.value);
  updateMatchPlayerNotice();
  saveState("setup");
});

profileElements.name.addEventListener("input", () => {
  fillCountryFromProfileName(profileElements.name, profileElements.country);
  updateProfileNameSuggestions();
  updateCurrentPlayerLabel();
});

profileElements.name.addEventListener("pointerdown", () => {
  enableProfileNameInput();
});

profileElements.name.addEventListener("focus", () => {
  enableProfileNameInput();
  updateProfileNameSuggestions();
});

bindProfileNameList();

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
