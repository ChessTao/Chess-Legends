const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertIncludes(file, needle, message) {
  assert(file.includes(needle), message);
}

const indexHtml = read("index.html");
const dataJs = read("data/data.js");
const scriptJs = read("src/script.js");
const screensJs = read("src/screens.js");
const matchPlayersJs = read("src/match-players.js");
const profileJs = read("src/profile.js");
const packageJson = read("package.json");

const appStateIndex = indexHtml.indexOf('src="src/app-state.js"');
const screensIndex = indexHtml.indexOf('src="src/screens.js"');
const profileFormIndex = indexHtml.indexOf('src="src/profile-form.js"');
const matchPlayersIndex = indexHtml.indexOf('src="src/match-players.js"');
const gameIndex = indexHtml.indexOf('src="src/game-preview.js"');
const infoPagesIndex = indexHtml.indexOf('src="src/info-pages.js"');
const scriptIndex = indexHtml.indexOf('src="src/script.js"');

assert(appStateIndex > -1, "index.html must load src/app-state.js");
assert(profileFormIndex > -1, "index.html must load src/profile-form.js");
assert(matchPlayersIndex > -1, "index.html must load src/match-players.js");
assert(infoPagesIndex > -1, "index.html must load src/info-pages.js");
assert(!indexHtml.includes("content/biographies/index.js"), "Biographies should come from data/data.js");
assert(appStateIndex < screensIndex, "app-state.js must load before screens.js");
assert(profileFormIndex < matchPlayersIndex, "profile-form.js must load before match-players.js");
assert(matchPlayersIndex < gameIndex, "match-players.js must load before game-preview.js");
assert(gameIndex < infoPagesIndex, "game-preview.js must load before info-pages.js");
assert(infoPagesIndex < scriptIndex, "info-pages.js must load before script.js");
assert(gameIndex < scriptIndex, "game-preview.js must load before script.js");

assertIncludes(indexHtml, 'id="backFromInfoButton"', "Info pages need a visible back button");
assertIncludes(indexHtml, 'class="back-button info-back-button"', "Info back button must be in the header style");
assertIncludes(indexHtml, 'id="matchPlayer1Select" hidden', "Player 1 select should stay hidden in two-player setup");
assertIncludes(indexHtml, '<span>Соперник</span>', "Two-player setup should expose one opponent field");

assertIncludes(screensJs, "getScreenByName", "screens.js should own screen name lookup");
assertIncludes(screensJs, "getScreenName", "screens.js should own screen reverse lookup");
assertIncludes(scriptJs, "loadAppState", "script.js should use app-state.js");
assertIncludes(scriptJs, "createProfileFormController", "script.js should use profile-form.js");
assertIncludes(scriptJs, "createMatchPlayersController", "script.js should use match-players.js");
assertIncludes(scriptJs, "createInfoPagesController", "script.js should use info-pages.js");
assertIncludes(scriptJs, "ChessLegendsData.biographies", "script.js should read biographies from unified data");
assertIncludes(scriptJs, "ChessLegendsData.photoCredits", "script.js should read photo credits from unified data");
assert(!scriptJs.includes('const GUEST_MATCH_PLAYER_ID = "__guest__"'), "Guest id should live in match-players.js");
assert(!scriptJs.includes("function renderMarkdown"), "Markdown rendering should live in info-pages.js");
assert(!scriptJs.includes("function confirmProfileEntry"), "Profile entry flow should live in profile-form.js");

assertIncludes(dataJs, "biographies: chessLegends.map", "data/data.js should derive biographies from legends");
assertIncludes(dataJs, "photoCredits: chessLegends.map", "data/data.js should derive photo credits from legends");
assertIncludes(dataJs, "nameRu", "Unified legend data must include Russian display names");
assertIncludes(dataJs, "credits", "Unified legend data must include photo credits");

const legendCount = (dataJs.match(/id: "/g) || []).length;
assert(legendCount === 32, `Expected 32 unified legend records, got ${legendCount}`);

const dataContext = { window: {} };
vm.runInNewContext(dataJs, dataContext);
const chessData = dataContext.window.ChessLegendsData;
const legendIds = new Set(chessData.legends.map((legend) => legend.id));
const missingAssets = [];

chessData.legends.forEach((legend) => {
  [legend.photo, legend.biography.ru, legend.biography.en].forEach((assetPath) => {
    if (!fs.existsSync(path.join(root, assetPath))) {
      missingAssets.push(assetPath);
    }
  });
});

assert(chessData.legends.length === 32, "Unified data must expose 32 game legends");
assert(chessData.biographies.length === 32, "Unified data must derive 32 biographies");
assert(chessData.photoCredits.length === 32, "Unified data must derive 32 photo credits");
assert(legendIds.size === 32, "Unified legend ids must be unique");
assert(missingAssets.length === 0, `Unified data references missing assets: ${missingAssets.join(", ")}`);

const profileStorage = new Map();
const profileContext = {
  window: {},
  localStorage: {
    getItem: (key) => profileStorage.has(key) ? profileStorage.get(key) : null,
    setItem: (key, value) => profileStorage.set(key, String(value)),
    removeItem: (key) => profileStorage.delete(key)
  },
  Date,
  Math,
  JSON,
  Number,
  Object,
  String,
  Array
};

vm.runInNewContext(profileJs, profileContext);

const profileApi = profileContext.window.ChessLegendsProfile;
const playerA = profileApi.createProfile({ name: "A", country: "" });
const playerB = profileApi.createProfile({ name: "B", country: "" });
const matchResult = {
  settings: { mode: "Два игрока", difficulty: "КМС" },
  scores: [5, 3],
  winner: 0,
  moves: 20,
  seconds: 0
};

profileApi.recordMatchResult(playerA.id, playerB.id, matchResult);

const playerAAfterMatch = profileApi.getProfile(playerA.id);
const playerBAfterMatch = profileApi.getProfile(playerB.id);

assert(playerAAfterMatch.matchRating > 1000, "Match winner rating should increase");
assert(playerBAfterMatch.matchRating < 1000, "Match loser rating should decrease");
assert(playerAAfterMatch.twoPlayerWins === 1, "Winner profile should record one match win");
assert(playerBAfterMatch.twoPlayerLosses === 1, "Loser profile should record one match loss");

profileApi.recordProfileResult(playerA.id, {
  settings: { mode: "Два игрока", difficulty: "Начинающий" },
  scores: [2, 4],
  winner: 1,
  moves: 12,
  seconds: 0
});

const playerAAfterGuestMatch = profileApi.getProfile(playerA.id);
assert(playerAAfterGuestMatch.matchGamesPlayed === 2, "Guest match should be recorded for local profile");
assert(playerAAfterGuestMatch.twoPlayerLosses === 1, "Guest match loss should be recorded for local profile");

assertIncludes(matchPlayersJs, 'new Option("Новый игрок"', "Opponent select must include New player");
assertIncludes(matchPlayersJs, "GUEST_MATCH_PLAYER_ID", "match-players.js should own guest selection semantics");
assertIncludes(matchPlayersJs, "Выберите соперника", "Opponent select must start with an explicit placeholder");

assertIncludes(packageJson, "src/app-state.js", "npm run check must include app-state.js");
assertIncludes(packageJson, "src/profile-form.js", "npm run check must include profile-form.js");
assertIncludes(packageJson, "src/match-players.js", "npm run check must include match-players.js");
assertIncludes(packageJson, "src/info-pages.js", "npm run check must include info-pages.js");

console.log("Smoke checks passed.");
