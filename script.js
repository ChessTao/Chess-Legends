const appLegends = window.ChessLegendsData.legends;
const appDifficultySettings = window.ChessLegendsData.difficultySettings;
const { showScreen } = window.ChessLegendsScreens;
const { getGameSettings, setGameSettings, initSetupControls } = window.ChessLegendsSetup;
const { renderGamePreview, stopGame } = window.ChessLegendsGamePreview;

const STORAGE_KEY = "chessLegendsState";

const board = document.querySelector("#board");
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
const lightCells = [];

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

function buildBoard() {
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const cell = document.createElement("div");
      const isLight = (row + col) % 2 === 0;

      cell.className = `cell ${isLight ? "light" : "dark"}`;
      board.append(cell);

      if (isLight) {
        lightCells.push(cell);
      }
    }
  }
}

function revealPortraits() {
  const cells = shuffle(lightCells);
  const images = shuffle(appLegends);

  cells.forEach((cell, index) => {
    const image = document.createElement("img");
    image.className = "portrait";
    image.src = images[index % images.length].photo;
    image.alt = "";
    image.style.animationDelay = `${900 + index * 128}ms`;
    cell.append(image);
  });
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

buildBoard();
revealPortraits();
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
