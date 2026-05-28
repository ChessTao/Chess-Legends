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
const onlineLobbyJs = read("src/online-lobby.js");
const onlineGameJs = read("src/online-game.js");
const screensJs = read("src/screens.js");
const profileJs = read("src/profile.js");
const serverJs = read("server.js");
const packageJson = read("package.json");

const appStateIndex = indexHtml.indexOf('src="src/app-state.js"');
const screensIndex = indexHtml.indexOf('src="src/screens.js"');
const profileFormIndex = indexHtml.indexOf('src="src/profile-form.js"');
const gameIndex = indexHtml.indexOf('src="src/game-preview.js"');
const infoPagesIndex = indexHtml.indexOf('src="src/info-pages.js"');
const onlineLobbyIndex = indexHtml.indexOf('src="src/online-lobby.js"');
const onlineGameIndex = indexHtml.indexOf('src="src/online-game.js"');
const scriptIndex = indexHtml.indexOf('src="src/script.js"');

assert(appStateIndex > -1, "index.html must load src/app-state.js");
assert(profileFormIndex > -1, "index.html must load src/profile-form.js");
assert(infoPagesIndex > -1, "index.html must load src/info-pages.js");
assert(!indexHtml.includes("content/biographies/index.js"), "Biographies should come from data/data.js");
assert(appStateIndex < screensIndex, "app-state.js must load before screens.js");
assert(profileFormIndex < gameIndex, "profile-form.js must load before game-preview.js");
assert(gameIndex < infoPagesIndex, "game-preview.js must load before info-pages.js");
assert(onlineLobbyIndex > -1, "index.html must load src/online-lobby.js");
assert(onlineGameIndex > -1, "index.html must load src/online-game.js");
assert(infoPagesIndex < onlineLobbyIndex, "info-pages.js must load before online-lobby.js");
assert(onlineLobbyIndex < onlineGameIndex, "online-lobby.js must load before online-game.js");
assert(onlineGameIndex < scriptIndex, "online-game.js must load before script.js");
assert(infoPagesIndex < scriptIndex, "info-pages.js must load before script.js");
assert(gameIndex < scriptIndex, "game-preview.js must load before script.js");

assertIncludes(indexHtml, 'id="backFromInfoButton"', "Info pages need a visible back button");
assertIncludes(indexHtml, 'class="back-button info-back-button"', "Info back button must be in the header style");
assertIncludes(indexHtml, 'id="playFromInfoButton"', "Info pages need a play button in the side panel");
assertIncludes(indexHtml, 'id="sideProfileButton"', "Side panel should expose profile after login");
assertIncludes(indexHtml, 'id="playModeScreen"', "App should expose a post-login play mode screen");
assertIncludes(indexHtml, 'id="soloModeButton"', "Play mode screen should expose solo play");
assertIncludes(indexHtml, 'id="onlineModeButton"', "Play mode screen should expose online play");
assertIncludes(indexHtml, 'id="onlineScreen"', "App should expose a separate online play screen");
assertIncludes(indexHtml, 'id="onlineRoomList"', "Online screen should expose public room list");
assertIncludes(indexHtml, 'id="onlineBeginnerRooms"', "Online screen should group beginner rooms");
assertIncludes(indexHtml, 'id="onlineCandidateRooms"', "Online screen should group candidate master rooms");
assertIncludes(indexHtml, 'id="onlineMasterRooms"', "Online screen should group master rooms");
assertIncludes(indexHtml, 'id="onlineGrandmasterRooms"', "Online screen should group grandmaster rooms");
assertIncludes(indexHtml, 'id="createPrivateRoomButton"', "Online screen should expose private room creation");
assertIncludes(indexHtml, 'id="joinPrivateRoomButton"', "Online screen should expose private room join");
assertIncludes(indexHtml, 'id="onlineRoomCode"', "Online screen should expose private room code");
assertIncludes(indexHtml, 'id="onlineRoomLevel"', "Private rooms should expose difficulty selection");
assert(!indexHtml.includes('id="backToModeFromOnlineButton"'), "Online screen should not show the old back button");
assert(!indexHtml.includes('src="src/match-players.js"'), "Local two-player module should not load");
assert(!indexHtml.includes('id="matchPlayersPanel"'), "Local two-player setup should be removed");
assertIncludes(indexHtml, 'data-info-page="leaderboards"', "Side panel should expose leaderboards");
assertIncludes(indexHtml, 'id="leaderboardsList"', "Leaderboards page needs a render target");

assertIncludes(screensJs, "getScreenByName", "screens.js should own screen name lookup");
assertIncludes(screensJs, "getScreenName", "screens.js should own screen reverse lookup");
assertIncludes(scriptJs, "loadAppState", "script.js should use app-state.js");
assertIncludes(scriptJs, "createProfileFormController", "script.js should use profile-form.js");
assert(!scriptJs.includes("createMatchPlayersController"), "script.js should not initialize local match players");
assertIncludes(scriptJs, "createInfoPagesController", "script.js should use info-pages.js");
assertIncludes(scriptJs, "ChessLegendsData.biographies", "script.js should read biographies from unified data");
assertIncludes(scriptJs, "ChessLegendsData.photoCredits", "script.js should read photo credits from unified data");
assertIncludes(scriptJs, "leaderboardsList", "script.js should wire leaderboards render target");
assertIncludes(scriptJs, "updateSideProfileButton", "script.js should toggle side profile button");
assertIncludes(scriptJs, "openAccountInNewTab", "Account button should not interrupt active games");
assertIncludes(scriptJs, "requestedInfoPage", "New info tabs should restore requested info page");
assertIncludes(scriptJs, "hasConfirmedProfile", "Play from info should respect confirmed profile state");
assertIncludes(scriptJs, "showPlayModeScreen();", "Play from info should open play mode choice for a confirmed profile");
assertIncludes(scriptJs, "showProfileScreen();", "Play from info should open profile before confirmation");
assertIncludes(scriptJs, "showOnlineScreen", "script.js should route online mode separately");
assertIncludes(scriptJs, "createOnlineLobbyController", "script.js should initialize online lobby module");
assertIncludes(scriptJs, "createOnlineGameController", "script.js should initialize online game module");
assertIncludes(scriptJs, "onlineLobby.getSnapshot", "script.js should persist online lobby snapshot");
assertIncludes(scriptJs, "onlineLobby.restore", "script.js should restore online lobby state");
assertIncludes(scriptJs, "startOnlineGame", "script.js should route joined rooms into online game");
assertIncludes(onlineLobbyJs, "/api/online/rooms/join", "Online lobby should join public rooms through the server");
assertIncludes(onlineLobbyJs, "/api/online/rooms/private", "Online lobby should create private rooms through the server");
assertIncludes(onlineGameJs, "/api/online/rooms/", "Online game should poll and play through server rooms");
assertIncludes(onlineGameJs, "/api/online/active", "Online game should resume active server rooms after refresh");
assertIncludes(onlineGameJs, "playerToken", "Online game should keep player token separate from room state");
assertIncludes(serverJs, "onlineRooms", "Server should own online room state");
assertIncludes(serverJs, "/api/online/rooms", "Server should expose online room API");
assertIncludes(serverJs, "requireSessionProfile", "Online room actions should be bound to server login sessions");
assertIncludes(serverJs, "connectionStatus", "Online rooms should track player connection state");
assertIncludes(serverJs, "MAX_PRIVATE_ROOMS_PER_PLAYER", "Server should limit private room creation");
assertIncludes(serverJs, "sessionsFile", "Server should persist login sessions");
assertIncludes(serverJs, "roomsFile", "Server should persist active online rooms");
assertIncludes(serverJs, "loadOnlineRooms", "Server should restore online rooms at startup");
assertIncludes(serverJs, "PUBLIC_FINISHED_RESET_MS", "Public rooms should reset after finished games");
assertIncludes(serverJs, "SESSION_TTL_MS", "Server sessions should expire");
assertIncludes(serverJs, "/api/logout", "Server should expose logout for session cleanup");
assertIncludes(serverJs, "verifyPassword(room", "Private room passwords should be verified from hashes");
assert(!serverJs.includes("room.password !=="), "Private room passwords must not be compared as plain text");
assertIncludes(serverJs, ".filter((room) => !room.isPrivate)", "Public room list must not expose private rooms");
assertIncludes(serverJs, "lastSeenAt: _lastSeenAt", "Room serialization should strip private player timestamps");
assertIncludes(serverJs, "revealOnlineCard", "Server should validate online card reveals");
assertIncludes(serverJs, "saveOnlineResult", "Server should save completed online match results");
assertIncludes(onlineLobbyJs, "roomList", "Online lobby should wire public room selection");
assertIncludes(onlineLobbyJs, "selectedPublicRoomName", "Online lobby should store public room separately");
assertIncludes(onlineLobbyJs, "privateRoomName", "Online lobby should store private room draft separately");
assertIncludes(profileJs, "mergeServerProfiles", "Profile sync should merge server profiles into local profiles");
assert(!profileJs.includes("writeProfiles(serverProfiles);"), "Profile sync must not overwrite local profiles with server-only list");
assert(!profileJs.includes("recordMatchResult"), "Profile API should not expose local match recording");
assert(!profileJs.includes("recordProfileResult"), "Profile API should not expose profile-to-profile local match recording");
assertIncludes(profileJs, "matchRating", "Profile should keep future online match rating fields");
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
profileApi.saveProfile(playerA);
profileApi.updateProfileWithResult({
  settings: { mode: "Один игрок", difficulty: "Начинающий" },
  moves: 12,
  seconds: 30
});

const playerAAfterSingleGame = profileApi.getProfile(playerA.id);
assert(playerAAfterSingleGame.singleGamesPlayed === 1, "Single-player result should update active profile");
assert(playerAAfterSingleGame.matchGamesPlayed === 0, "Single-player result should not touch match stats");

assertIncludes(packageJson, "src/app-state.js", "npm run check must include app-state.js");
assertIncludes(packageJson, "src/profile-form.js", "npm run check must include profile-form.js");
assert(!packageJson.includes("src/match-players.js"), "npm run check should not include removed local match module");
assertIncludes(packageJson, "src/info-pages.js", "npm run check must include info-pages.js");
assertIncludes(packageJson, "src/online-game.js", "npm run check must include online-game.js");

console.log("Smoke checks passed.");
