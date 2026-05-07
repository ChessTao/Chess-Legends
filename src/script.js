const appLegends = window.ChessLegendsData.legends;
const appDifficultySettings = window.ChessLegendsData.difficultySettings;
const { showScreen } = window.ChessLegendsScreens;
const { getGameSettings, setGameSettings, initSetupControls } = window.ChessLegendsSetup;
const { initProfile, renderProfile, saveProfileFromForm, updateProfileWithResult } = window.ChessLegendsProfile;
const { renderGamePreview, stopGame } = window.ChessLegendsGamePreview;
const { initIntro } = window.ChessLegendsIntro;

const STORAGE_KEY = "chessLegendsState";

const introScreen = document.querySelector("#introScreen");
const setupScreen = document.querySelector("#setupScreen");
const gameScreen = document.querySelector("#gameScreen");
const startButton = document.querySelector("#startButton");
const playButton = document.querySelector("#playButton");
const backToSetup = document.querySelector("#backToSetup");
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
  chessRating: document.querySelector("#profileChessRating"),
  stats: document.querySelector("#profileStats"),
  saveButton: document.querySelector("#profileSaveButton")
};

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveState(screenName) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    screen: screenName,
    settings: getGameSettings()
  }));
}

function startGamePreview() {
  saveProfileFromForm(profileElements);

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

  setGameSettings(state.settings);

  showScreen(introScreen);
}

initIntro(appLegends);
initSetupControls();
initProfile(profileElements);
restoreState();

startButton.addEventListener("click", () => {
  showScreen(setupScreen);
  saveState("setup");
});

playButton.addEventListener("click", startGamePreview);

backToSetup.addEventListener("click", () => {
  stopGame();
  showScreen(setupScreen);
  saveState("setup");
});

document.querySelectorAll(".option-row, .segmented-control, .difficulty-row").forEach((group) => {
  group.addEventListener("click", () => {
    window.setTimeout(() => saveState("setup"), 0);
  });
});
