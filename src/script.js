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
const { renderGamePreview, stopGame } = window.ChessLegendsGamePreview;
const { initIntro } = window.ChessLegendsIntro;
const { createInfoPagesController } = window.ChessLegendsInfoPages;
const { createOnlineLobbyController } = window.ChessLegendsOnlineLobby;
const { createOnlineGameController } = window.ChessLegendsOnlineGame;

const PROFILE_CLEANUP_KEY = "chessLegendsCleanupRemovedProfiles20260513";
let hasConfirmedProfile = false;

const introScreen = document.querySelector("#introScreen");
const profileScreen = document.querySelector("#profileScreen");
const accountScreen = document.querySelector("#accountScreen");
const playModeScreen = document.querySelector("#playModeScreen");
const onlineScreen = document.querySelector("#onlineScreen");
const setupScreen = document.querySelector("#setupScreen");
const gameScreen = document.querySelector("#gameScreen");
const infoScreen = document.querySelector("#infoScreen");
const startButton = document.querySelector("#startButton");
const loginProfileButton = document.querySelector("#loginProfileButton");
const registerProfileButton = document.querySelector("#registerProfileButton");
const confirmLoginButton = document.querySelector("#confirmLoginButton");
const soloModeButton = document.querySelector("#soloModeButton");
const onlineModeButton = document.querySelector("#onlineModeButton");
const modeProfileButton = document.querySelector("#modeProfileButton");
const modeLogoutButton = document.querySelector("#modeLogoutButton");
const modeCurrentPlayerLabel = document.querySelector("#modeCurrentPlayerLabel");
const onlineCurrentPlayerLabel = document.querySelector("#onlineCurrentPlayerLabel");
const playButton = document.querySelector("#playButton");
const backToProfileButton = document.querySelector("#backToProfileButton");
const backToModeFromSetupButton = document.querySelector("#backToModeFromSetupButton");
const backToSetupFromAccountButton = document.querySelector("#backToSetupFromAccountButton");
const logoutProfileButton = document.querySelector("#logoutProfileButton");
const backToSetup = document.querySelector("#backToSetup");
const currentPlayerLabel = document.querySelector("#currentPlayerLabel");
const countryList = document.querySelector("#countryList");
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
const playFromInfoButton = document.querySelector("#playFromInfoButton");
const sideProfileButton = document.querySelector("#sideProfileButton");
const leaderboardsList = document.querySelector("#leaderboardsList");
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
    profileElements
  },
  findProfileByName,
  listProfiles,
  loginProfileWithPassword,
  normalizeCountryName,
  normalizeProfileCountryField,
  normalizeProfileName,
  onCurrentPlayerChange: updateCurrentPlayerLabel,
  onShowSetup: showPlayModeScreen,
  registerProfileWithPassword,
  renderProfile,
  saveState,
  validatePassword
});

const {
  confirmEntry: confirmProfileEntry,
  getMode: getProfileMode,
  resetForm: resetProfileForm,
  setMode: setProfileMode
} = profileForm;

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
    leaderboardsList,
    projectLinks
  },
  getActiveScreen,
  getScreenName,
  listProfiles,
  onStateChange: saveState,
  screens: {
    profileScreen,
    setupScreen,
    gameScreen
  },
  showScreen
});

const onlineLobby = createOnlineLobbyController({
  elements: {
    roomList: document.querySelector("#onlineRoomList"),
    roomName: document.querySelector("#onlineRoomName"),
    roomLevel: document.querySelector("#onlineRoomLevel"),
    roomPassword: document.querySelector("#onlineRoomPassword"),
    roomCode: document.querySelector("#onlineRoomCode"),
    status: document.querySelector("#onlineStatus"),
    createPrivateButton: document.querySelector("#createPrivateRoomButton"),
    joinPrivateButton: document.querySelector("#joinPrivateRoomButton"),
    logoutButton: document.querySelector("#onlineLogoutProfileButton"),
    soloButton: document.querySelector("#onlineSoloModeButton")
  },
  getProfile: getProfileForOnline,
  onLogout: logoutProfile,
  onRoomJoined: startOnlineGame,
  onShowSolo: showSetupScreen,
  onStateChange: saveState
});

const onlineGame = createOnlineGameController({
  elements: {
    gameChoice,
    scorePanel,
    memoryBoard,
    resultPanel,
    resultTitle,
    resultSummary,
    replayButton,
    changeSettingsButton
  },
  difficultySettings: appDifficultySettings,
  onBackToLobby: () => {
    onlineGame.stop();
    showOnlineScreen();
  },
  onComplete: () => {
    syncProfilesFromServer()
      .then(() => {
        renderProfile(profileElements, loadProfile());
        renderProfile(accountElements, loadProfile());
      })
      .catch(() => {});
  },
  onStateChange: saveState
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
    ...onlineLobby.getSnapshot(),
    ...onlineGame.getSnapshot(),
    settings: getGameSettings(),
    ...extraState
  });
}

function shouldRememberProfile() {
  return Boolean(profileElements.remember?.checked);
}

function updateSideProfileButton() {
  if (sideProfileButton) {
    sideProfileButton.hidden = !hasConfirmedProfile;
  }

  if (currentPlayerLabel) {
    currentPlayerLabel.hidden = !hasConfirmedProfile;
  }
}

function findProfileByName(name) {
  const normalizedName = normalizeProfileName(name);

  if (!normalizedName) {
    return null;
  }

  return listProfiles().find((profile) => normalizeProfileName(profile.name || "") === normalizedName) || null;
}

function renderCurrentPlayerLabel(label) {
  if (!label) {
    return;
  }

  label.replaceChildren();
  const name = profileElements.name.value.trim() || "Игрок";
  const country = profileElements.country.value.trim();
  const countryInfo = getCountryInfo(country);

  label.append(`Игрок: ${name}`);

  if (countryInfo) {
    const flag = document.createElement("img");

    flag.className = "player-flag";
    flag.src = getFlagUrl(countryInfo.code);
    flag.alt = "";
    flag.loading = "lazy";
    flag.title = countryInfo.name;
    flag.setAttribute("aria-label", countryInfo.name);
    label.append(" ", flag);
  }
}

function updateCurrentPlayerLabel() {
  logoutProfileButton.hidden = false;
  if (modeLogoutButton) {
    modeLogoutButton.hidden = false;
  }

  [currentPlayerLabel, modeCurrentPlayerLabel, onlineCurrentPlayerLabel].forEach(renderCurrentPlayerLabel);
}

function showProfileScreen() {
  stopGame();
  onlineGame.stop();
  showScreen(profileScreen);
  saveState("profile");
}

function showAccountScreen() {
  stopGame();
  onlineGame.stop({ leave: false });
  renderProfile(accountElements, loadProfile());
  normalizeProfileCountryField(accountElements);
  showScreen(accountScreen);
  saveState("account");
}

function showPlayModeScreen() {
  stopGame();
  onlineGame.stop();
  hasConfirmedProfile = true;
  updateSideProfileButton();
  normalizeProfileCountryField(profileElements);
  saveProfileFromForm(profileElements);
  renderProfile(accountElements, loadProfile());
  normalizeProfileCountryField(accountElements);
  updateCurrentPlayerLabel();
  showScreen(playModeScreen);
  saveState("mode");
}

function showSetupScreen() {
  hasConfirmedProfile = true;
  onlineGame.stop();
  updateSideProfileButton();
  setGameSettings({
    ...getGameSettings(),
    mode: "Один игрок"
  });
  normalizeProfileCountryField(profileElements);
  saveProfileFromForm(profileElements);
  renderProfile(accountElements, loadProfile());
  normalizeProfileCountryField(accountElements);

  updateCurrentPlayerLabel();
  showScreen(setupScreen);
  saveState("setup");
}

function showOnlineScreen() {
  stopGame();
  onlineGame.stop({ leave: false });
  hasConfirmedProfile = true;
  updateSideProfileButton();
  normalizeProfileCountryField(profileElements);
  saveProfileFromForm(profileElements);
  updateCurrentPlayerLabel();
  showScreen(onlineScreen);
  saveState("online");
}

function logoutServerSession() {
  if (typeof fetch !== "function") {
    return;
  }

  fetch("/api/logout", { method: "POST" }).catch(() => {});
}

function logoutProfile() {
  stopGame();
  onlineGame.stop();
  logoutServerSession();
  hasConfirmedProfile = false;
  updateSideProfileButton();
  profileElements.remember.checked = false;
  renderProfile(profileElements, createBlankProfile());
  setProfileMode("register");
  updateCurrentPlayerLabel();
  showScreen(profileScreen);
  saveState("profile");
}

function startGamePreview() {
  onlineGame.stop();
  setGameSettings({
    ...getGameSettings(),
    mode: "Один игрок"
  });

  normalizeProfileCountryField(profileElements);
  saveProfileFromForm(profileElements);
  updateCurrentPlayerLabel();

  renderGamePreview({
    settings: getGameSettings(),
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

function getProfileForOnline() {
  normalizeProfileCountryField(profileElements);
  saveProfileFromForm(profileElements);
  updateCurrentPlayerLabel();
  return loadProfile();
}

function startOnlineGame(room, playerToken) {
  stopGame();
  hasConfirmedProfile = true;
  updateSideProfileButton();
  onlineGame.start(room, playerToken);
  showScreen(gameScreen);
  saveState("onlineGame");
}

function restoreState() {
  const state = loadAppState();
  const shouldRestoreProfile = state.rememberProfile === true && hasSavedProfile();
  const savedScreenName = state.screen || "intro";
  const startupUrl = new URL(window.location.href);
  const requestedInfoPage = startupUrl.searchParams.get("infoPage");
  const requestedScreen = startupUrl.searchParams.get("openScreen");

  hasConfirmedProfile = shouldRestoreProfile && savedScreenName !== "intro" && savedScreenName !== "profile";
  updateSideProfileButton();
  setGameSettings(state.settings);
  profileElements.remember.checked = shouldRestoreProfile;
  renderProfile(profileElements, shouldRestoreProfile ? loadProfile() : createBlankProfile());
  renderProfile(accountElements, shouldRestoreProfile ? loadProfile() : createBlankProfile());
  normalizeProfileCountryField(profileElements);
  normalizeProfileCountryField(accountElements);
  setProfileMode(shouldRestoreProfile ? state.profileMode || "register" : "register");
  updateCurrentPlayerLabel();

  onlineLobby.restore(state);

  if (requestedInfoPage) {
    startupUrl.searchParams.delete("infoPage");
    window.history.replaceState({}, "", startupUrl);
    infoPages.restore(requestedInfoPage, getScreenByName("setup") || profileScreen);
    return;
  }

  if (requestedScreen === "account" && hasSavedProfile()) {
    startupUrl.searchParams.delete("openScreen");
    window.history.replaceState({}, "", startupUrl);
    hasConfirmedProfile = true;
    updateSideProfileButton();
    renderProfile(accountElements, loadProfile());
    normalizeProfileCountryField(accountElements);
    showScreen(accountScreen);
    saveState("account");
    return;
  }

  if (savedScreenName === "info") {
    infoPages.restore(state.infoPage || "rules", getScreenByName(state.previousScreen) || profileScreen);
    return;
  }

  if (savedScreenName === "onlineGame") {
    showScreen(hasConfirmedProfile ? playModeScreen : profileScreen);

    if (hasConfirmedProfile) {
      onlineGame.resumeActive()
        .then((resumed) => {
          if (resumed) {
            hasConfirmedProfile = true;
            updateSideProfileButton();
            showScreen(gameScreen);
            saveState("onlineGame");
            return;
          }
          saveState("mode");
        })
        .catch(() => {
          saveState("onlineGame", { pendingOnlineResume: true });
        });
    } else {
      saveState("profile");
    }
    return;
  }

  if (savedScreenName === "game") {
    showScreen(hasConfirmedProfile ? playModeScreen : profileScreen);
    saveState(hasConfirmedProfile ? "mode" : "profile");
    return;
  }

  if ((savedScreenName === "mode" || savedScreenName === "online" || savedScreenName === "setup") && !hasConfirmedProfile) {
    showScreen(profileScreen);
    saveState("profile");
    return;
  }

  const targetScreen = getScreenByName(savedScreenName) || introScreen;

  showScreen(targetScreen);
}

function openAccountInNewTab() {
  const url = new URL(window.location.href);

  url.searchParams.set("openScreen", "account");
  url.searchParams.delete("infoPage");
  window.open(url.toString(), "_blank", "noopener");
}

initIntro(appLegends);
initSetupControls();
initCountryList();
initProfile(profileElements);
syncProfilesFromServer()
  .then(() => {
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
onlineLobby.init();
onlineGame.init();

playFromInfoButton?.addEventListener("click", () => {
  infoScreen.classList.remove("is-biographies");
  infoScreen.classList.remove("is-leaderboards");
  infoScreen.classList.remove("is-photo-credits");
  if (hasConfirmedProfile) {
    showPlayModeScreen();
    return;
  }

  showProfileScreen();
});

sideProfileButton?.addEventListener("click", () => {
  if (getActiveScreen(profileScreen) === gameScreen) {
    openAccountInNewTab();
    return;
  }

  showAccountScreen();
});

soloModeButton?.addEventListener("click", showSetupScreen);
onlineModeButton?.addEventListener("click", showOnlineScreen);
modeProfileButton?.addEventListener("click", showAccountScreen);
modeLogoutButton?.addEventListener("click", logoutProfile);
backToModeFromSetupButton?.addEventListener("click", showOnlineScreen);

backToProfileButton?.addEventListener("click", () => {
  showAccountScreen();
});

backToSetupFromAccountButton.addEventListener("click", () => {
  normalizeProfileCountryField(accountElements);
  saveProfileFromForm(accountElements);
  renderProfile(profileElements, loadProfile());
  normalizeProfileCountryField(profileElements);
  updateCurrentPlayerLabel();
  showScreen(playModeScreen);
  saveState("mode");
});

logoutProfileButton.addEventListener("click", logoutProfile);

playButton.addEventListener("click", startGamePreview);

backToSetup.addEventListener("click", () => {
  if (onlineGame.isActive()) {
    onlineGame.stop();
    showOnlineScreen();
    return;
  }

  stopGame();
  showScreen(setupScreen);
  saveState("setup");
});

document.querySelectorAll(".option-row, .difficulty-row").forEach((group) => {
  group.addEventListener("click", () => {
    window.setTimeout(() => {
      saveState("setup");
    }, 0);
  });
});

profileElements.name.addEventListener("input", () => {
  updateCurrentPlayerLabel();
});

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
