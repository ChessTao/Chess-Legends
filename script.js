const appLegends = window.ChessLegendsData.legends;
const appDifficultySettings = window.ChessLegendsData.difficultySettings;
const { showScreen } = window.ChessLegendsScreens;
const { getGameSettings, setGameSettings, initSetupControls } = window.ChessLegendsSetup;
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
