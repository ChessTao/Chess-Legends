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
  removeProfiles,
  resetSinglePlayerStats,
  saveProfileFromForm,
  saveProfile,
  updateProfileWithResult
} = window.ChessLegendsProfile;
const { renderGamePreview, stopGame } = window.ChessLegendsGamePreview;
const { initIntro } = window.ChessLegendsIntro;

const STORAGE_KEY = "chessLegendsState";
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
const biographyItems = window.ChessLegendsBiographies || [];
const profileElements = {
  name: document.querySelector("#profileName"),
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
let previousInfoScreen = null;
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

function refreshProfileNameList() {
  if (!profileNameList) {
    return;
  }

  const listItems = document.createDocumentFragment();

  listProfiles().forEach((profile) => {
    if (!profile.name) {
      return;
    }

    const option = document.createElement("button");

    option.className = "profile-name-option";
    option.type = "button";
    option.dataset.name = profile.name;
    option.dataset.country = profile.country || "";

    const nameText = document.createElement("strong");
    nameText.textContent = profile.name;
    option.append(nameText);

    if (profile.country) {
      const countryText = document.createElement("small");
      countryText.textContent = `${profile.name}, ${profile.country}`;
      option.append(countryText);
    }

    listItems.append(option);
  });

  profileNameList.replaceChildren(listItems);
}

function hideProfileNameList() {
  if (profileNameList) {
    profileNameList.hidden = true;
  }
}

function updateProfileNameSuggestions() {
  if (!profileNameList || profileElements.name.disabled) {
    hideProfileNameList();
    return;
  }

  const query = normalizeProfileName(profileElements.name.value);
  let visibleCount = 0;

  profileNameList.querySelectorAll(".profile-name-option").forEach((option) => {
    const name = normalizeProfileName(option.dataset.name || "");
    const country = normalizeCountryName(option.dataset.country || "");
    const isVisible = !query || name.includes(query) || country.includes(query);

    option.hidden = !isVisible;
    visibleCount += isVisible ? 1 : 0;
  });

  profileNameList.hidden = visibleCount === 0;
}

function selectProfileNameOption(option) {
  profileElements.name.value = option.dataset.name || "";
  profileElements.country.value = option.dataset.country || "";
  hideProfileNameList();
  updateCurrentPlayerLabel();
}

function enableProfileNameInput() {
  if (!profileElements.name.readOnly) {
    return;
  }

  profileElements.name.readOnly = false;
}

function fillCountryFromProfileName(nameInput, countryInput) {
  const profile = findProfileByName(nameInput.value);

  if (!profile?.country) {
    return;
  }

  countryInput.value = profile.country;
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

function saveState(screenName) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    screen: screenName,
    profileMode: shouldRememberProfile() ? getProfileMode() : "register",
    rememberProfile: shouldRememberProfile(),
    matchPlayers: getMatchPlayerSnapshot(),
    settings: getGameSettings()
  }));
}

function shouldRememberProfile() {
  return Boolean(profileElements.remember?.checked);
}

function getProfileMode() {
  return document.querySelector(".profile-mode.is-selected")?.dataset.value || "register";
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
    player1Id: matchPlayer1Select?.value || "",
    player2Id: matchPlayer2Select?.value || ""
  };
}

function getMatchPlayerProfile(playerId) {
  return playerId ? getProfile(playerId) : null;
}

function getMatchPlayerSnapshot() {
  const { player1Id, player2Id } = getMatchPlayerSelection();
  const player1Profile = getMatchPlayerProfile(player1Id);
  const player2Profile = getMatchPlayerProfile(player2Id);

  return {
    player1Id,
    player2Id,
    player1Name: player1Profile?.name || "Игрок 1",
    player2Name: player2Profile?.name || "Игрок 2",
    player1Country: player1Profile?.country || "",
    player2Country: player2Profile?.country || ""
  };
}

function populateMatchPlayerSelect(select, selectedValue, options = {}) {
  const { excludeIds = [], emptyText = "Нет сохраненных профилей" } = options;
  const profiles = listProfiles().filter((profile) => !excludeIds.includes(profile.id));
  const fallbackValue = selectedValue || profiles[0]?.id || "";

  select.replaceChildren();

  profiles.forEach((profile) => {
    select.append(new Option(getProfileOptionText(profile), profile.id));
  });

  if (!select.options.length) {
    const option = new Option(emptyText, "");

    option.disabled = true;
    select.append(option);
  }

  select.value = [...select.options].some((option) => option.value === fallbackValue)
    ? fallbackValue
    : select.options[0].value;
}

function getSavedMatchProfileId(profileId) {
  if (!profileId) {
    return null;
  }

  return getProfile(profileId) ? profileId : null;
}

function populateMatchPlayerControls(savedSelection = {}) {
  const activeProfile = loadProfile();
  const player1Id = activeProfile.id || "";
  let player2Id = getSavedMatchProfileId(savedSelection.player2Id) || "";

  if (player2Id && player2Id === player1Id) {
    player2Id = "";
  }

  populateMatchPlayerSelect(matchPlayer1Select, player1Id, {
    excludeIds: activeProfile.id ? listProfiles().map((profile) => profile.id).filter((id) => id !== activeProfile.id) : []
  });
  populateMatchPlayerSelect(matchPlayer2Select, player2Id, {
    excludeIds: [player1Id],
    emptyText: "Нет второго профиля"
  });
  updateMatchPlayerNotice();
}

function isMatchModeSelected() {
  return getGameSettings().mode === "Два игрока";
}

function updateMatchPlayersPanel() {
  matchPlayersPanel.hidden = !isMatchModeSelected();

  updateMatchPlayerNotice();
}

function getMatchPlayerName(playerId, fallbackName) {
  return getMatchPlayerProfile(playerId)?.name || fallbackName;
}

function updateMatchPlayerNotice() {
  const { player1Id, player2Id } = getMatchPlayerSelection();
  const hasDuplicateProfiles = player1Id && player1Id === player2Id;

  if (hasDuplicateProfiles) {
    matchPlayersNotice.textContent = "Выберите разные профили для игроков.";
    return;
  }

  if (!isMatchModeSelected()) {
    matchPlayersNotice.textContent = "";
    return;
  }

  if (!player2Id) {
    matchPlayersNotice.textContent = "Создайте второй профиль на экране профиля, затем выберите его здесь.";
    return;
  }

  matchPlayersNotice.textContent = `${getMatchPlayerName(player1Id, "Игрок 1")} против ${getMatchPlayerName(player2Id, "Игрок 2")}`;
}

function validateMatchPlayers() {
  if (!isMatchModeSelected()) {
    return true;
  }

  const { player1Id, player2Id } = getMatchPlayerSelection();

  if (!player1Id || !player2Id) {
    window.alert("Для матча выберите второго игрока из сохраненных профилей.");
    return false;
  }

  if (player1Id === player2Id) {
    window.alert("Для матча выберите два разных профиля.");
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

  if (player1Id && player2Id) {
    recordMatchResult(player1Id, player2Id, result);
  }

  const activeProfile = loadProfile();

  renderProfile(profileElements, activeProfile);
  renderProfile(accountElements, activeProfile);
  return { messages: [] };
}

function setProfileMode(mode) {
  const isLogin = mode === "login";

  profileModeButtons.forEach((button) => {
    const isSelected = button.dataset.value === mode;

    button.classList.toggle("is-selected", isSelected);
  });

  profileElements.name.disabled = false;
  profileElements.country.disabled = false;
  profileElements.country.closest(".profile-field").hidden = isLogin;
  profileElements.remember.disabled = false;
  confirmLoginButton.hidden = !isLogin;
  profileElements.name.readOnly = true;
  profileElements.subtitle.textContent = "Рекорды сохраняются на этом устройстве";

  normalizeProfileCountryField(profileElements);
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

function getActiveScreen() {
  return document.querySelector(".screen.is-active") || profileScreen;
}

function renderMarkdown(markdownText) {
  const fragment = document.createDocumentFragment();
  const lines = markdownText.split(/\r?\n/);
  let list = null;

  lines.forEach((line) => {
    const text = line.trim();

    if (!text) {
      list = null;
      return;
    }

    if (text.startsWith("# ")) {
      const title = document.createElement("h3");
      title.textContent = text.slice(2);
      fragment.append(title);
      list = null;
      return;
    }

    if (text.startsWith("## ")) {
      const subtitle = document.createElement("h4");
      subtitle.textContent = text.slice(3);
      fragment.append(subtitle);
      list = null;
      return;
    }

    if (text.startsWith("- ")) {
      if (!list) {
        list = document.createElement("ul");
        fragment.append(list);
      }

      const item = document.createElement("li");
      item.textContent = text.slice(2);
      list.append(item);
      return;
    }

    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    fragment.append(paragraph);
    list = null;
  });

  return fragment;
}

async function openBiography(biography) {
  if (!biographyReader) {
    return;
  }

  biographyList.hidden = true;
  biographyReader.hidden = false;
  biographyReader.textContent = "Загружаем биографию...";

  const backButton = document.createElement("button");
  backButton.className = "biography-back";
  backButton.type = "button";
  backButton.textContent = "К списку";
  backButton.addEventListener("click", showBiographyCards);

  try {
    const response = await fetch(biography.fileRu);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const markdownText = await response.text();
    biographyReader.replaceChildren(backButton, renderMarkdown(markdownText));
  } catch {
    const message = document.createElement("p");
    message.textContent = "Не удалось загрузить биографию. Проверьте, что проект открыт через локальный сервер.";
    biographyReader.replaceChildren(backButton, message);
  }
}

function renderBiographyList() {
  if (!biographyList || biographyList.childElementCount > 0) {
    return;
  }

  const listItems = document.createDocumentFragment();

  biographyItems.forEach((biography) => {
    const link = document.createElement("button");
    const portrait = document.createElement("img");
    const name = document.createElement("span");

    link.className = "biography-card";
    link.type = "button";
    link.dataset.biographyId = biography.id;
    portrait.src = biography.photo;
    portrait.alt = biography.nameRu;
    portrait.loading = "lazy";
    name.textContent = biography.nameRu;
    link.append(portrait, name);
    link.addEventListener("click", () => openBiography(biography));
    listItems.append(link);
  });

  biographyList.replaceChildren(listItems);
}

function showBiographyCards() {
  if (!biographyList || !biographyReader) {
    return;
  }

  biographyList.hidden = false;
  biographyReader.hidden = true;
  biographyReader.replaceChildren();
}

function openInfoPage(pageName, titleText) {
  previousInfoScreen = getActiveScreen();
  infoScreen.classList.toggle("is-biographies", pageName === "biographies");

  const activeArticle = [...infoArticles].find((article) => article.dataset.infoPage === pageName);
  const fallbackTitle = activeArticle?.dataset.title || "Правила и условия";

  infoArticles.forEach((article) => {
    article.hidden = article.dataset.infoPage !== pageName;
  });

  infoPageTitle.textContent = titleText || fallbackTitle;
  showScreen(infoScreen);

  if (pageName === "biographies") {
    renderBiographyList();
    showBiographyCards();
  }
}

function closeInfoPage() {
  infoScreen.classList.remove("is-biographies");
  showScreen(previousInfoScreen || profileScreen);
  previousInfoScreen = null;
}

function resetProfileForm() {
  profileElements.remember.checked = false;
  renderProfile(profileElements, createBlankProfile());
  normalizeProfileCountryField(profileElements);
  hideProfileNameList();
}

function loginWithProfile() {
  const requestedName = profileElements.name.value.trim();

  if (!requestedName) {
    resetProfileForm();
    setProfileMode("login");
    updateCurrentPlayerLabel();
    saveState("profile");
    return;
  }

  const profile = findProfileByName(requestedName);

  if (!profile) {
    window.alert("Такой профиль не найден.");
    profileElements.name.focus();
    return;
  }

  saveProfile(profile);
  renderProfile(profileElements, profile);
  renderProfile(accountElements, profile);
  normalizeProfileCountryField(profileElements);
  normalizeProfileCountryField(accountElements);
  setProfileMode("login");
  showSetupScreen();
}

function registerProfile() {
  const name = profileElements.name.value.trim().replace(/\s+/g, " ");

  if (!name) {
    resetProfileForm();
    setProfileMode("register");
    updateCurrentPlayerLabel();
    saveState("profile");
    return;
  }

  if (findProfileByName(name)) {
    window.alert("Такой профиль уже есть. Нажмите «Войти».");
    profileElements.name.focus();
    return;
  }

  normalizeProfileCountryField(profileElements);

  const profile = createProfile({
    name,
    country: profileElements.country.value.trim()
  });

  renderProfile(profileElements, profile);
  renderProfile(accountElements, profile);
  refreshProfileNameList();
  setProfileMode("register");
  showSetupScreen();
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
  const state = loadState();
  const shouldRestoreProfile = state.rememberProfile === true && hasSavedProfile();

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

  showScreen(introScreen);
}

initIntro(appLegends);
initSetupControls();
initCountryList();
refreshProfileNameList();
initProfile(profileElements);
handleStartupActions();
restoreState();

startButton.addEventListener("click", () => {
  showScreen(profileScreen);
  saveState("profile");
});

loginProfileButton.addEventListener("click", loginWithProfile);
registerProfileButton.addEventListener("click", registerProfile);
confirmLoginButton.addEventListener("click", loginWithProfile);

projectLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    openInfoPage(link.dataset.infoPage, link.textContent.trim());
  });
});

backFromInfoButton.addEventListener("click", closeInfoPage);

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

profileNameList.addEventListener("mousedown", (event) => {
  const option = event.target.closest(".profile-name-option");

  if (!option) {
    return;
  }

  event.preventDefault();
  selectProfileNameOption(option);
});

document.addEventListener("mousedown", (event) => {
  if (event.target === profileElements.name || profileNameList.contains(event.target)) {
    return;
  }

  hideProfileNameList();
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
