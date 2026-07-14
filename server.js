const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const vm = require("vm");

const root = path.resolve(__dirname);
const port = Number(process.env.PORT) || 4173;
const host = process.env.HOST || (process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1");
const runtimeDir = path.join(root, ".runtime");
const profilesFile = path.join(runtimeDir, "profiles.json");
const sessionsFile = path.join(runtimeDir, "sessions.json");
const roomsFile = path.join(runtimeDir, "online-rooms.json");
const serverErrorsFile = path.join(runtimeDir, "server-errors.log");
const sessions = new Map();
const onlineRooms = new Map();
const privateRoomCreateTimes = new Map();
const MAX_PRIVATE_ROOMS_PER_PLAYER = 3;
const PRIVATE_ROOM_CREATE_COOLDOWN_MS = 5000;
const PLAYER_DISCONNECT_AFTER_MS = 12000;
const EMPTY_PRIVATE_ROOM_TTL_MS = 10 * 60 * 1000;
const FINISHED_ROOM_TTL_MS = 30 * 60 * 1000;
const PUBLIC_FINISHED_RESET_MS = 60 * 1000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const publicRoomGroups = [
  { level: "Начинающий", names: ["Прага", "Рига", "София"] },
  { level: "КМС", names: ["Будапешт", "Вильнюс", "Краков"] },
  { level: "Мастер", names: ["Рейкьявик", "Амстердам", "Лозанна"] },
  { level: "Гроссмейстер", names: ["Касабланка", "Цюрих", "Мерано"] }
];

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png"
};

function getHeaders(type, filePath) {
  const extension = path.extname(filePath);
  const isHtml = extension === ".html";
  const isLiveAsset = [".css", ".js"].includes(extension);

  return {
    "Content-Type": type,
    "Cache-Control": isHtml || isLiveAsset ? "no-cache, no-store, must-revalidate" : "public, max-age=3600",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin"
  };
}

function send(response, status, body, type = "text/plain; charset=utf-8") {
  response.writeHead(status, { "Content-Type": type });
  response.end(body);
}

function sendJson(response, status, payload, extraHeaders = {}) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...extraHeaders
  });
  response.end(JSON.stringify(payload));
}

function readRequestJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 65536) {
        reject(new Error("Payload too large"));
        request.destroy();
      }
    });

    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });

    request.on("error", reject);
  });
}

function ensureRuntimeDir() {
  fs.mkdirSync(runtimeDir, { recursive: true });
}

function getApiErrorStatus(error) {
  return error.statusCode || (error.message === "Payload too large" ? 413 : 400);
}

function logApiError(request, url, error) {
  const status = getApiErrorStatus(error);
  const lines = [
    `[${new Date().toISOString()}] ${request.method} ${url.pathname}${url.search} -> ${status}`,
    `message: ${error.message || String(error)}`,
    `remote: ${request.socket?.remoteAddress || "unknown"}`,
    `user-agent: ${request.headers["user-agent"] || "unknown"}`
  ];

  if (!error.statusCode && error.stack) {
    lines.push("stack:");
    lines.push(error.stack);
  }

  try {
    ensureRuntimeDir();
    fs.appendFileSync(serverErrorsFile, `${lines.join("\n")}\n\n`, "utf8");
  } catch (logError) {
    console.error("Failed to write API error log:", logError);
  }
}

function readJsonFile(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJsonFileAtomic(filePath, payload) {
  ensureRuntimeDir();
  const temporaryFile = `${filePath}.${process.pid}.tmp`;

  fs.writeFileSync(temporaryFile, `${JSON.stringify(payload, null, 2)}\n`);
  fs.renameSync(temporaryFile, filePath);
}

function readProfiles() {
  try {
    const content = fs.readFileSync(profilesFile, "utf8");
    const parsed = JSON.parse(content);

    return Array.isArray(parsed.profiles) ? parsed.profiles : [];
  } catch {
    return [];
  }
}

function writeProfiles(profiles) {
  writeJsonFileAtomic(profilesFile, { profiles });
}

function loadSessions() {
  const parsed = readJsonFile(sessionsFile, { sessions: [] });
  const now = Date.now();
  let changed = false;

  sessions.clear();
  if (!Array.isArray(parsed.sessions)) {
    return;
  }

  parsed.sessions.forEach((session) => {
    if (session?.token && session?.profileId) {
      const createdAt = Number(session.createdAt) || now;
      const expiresAt = Number(session.expiresAt) || createdAt + SESSION_TTL_MS;

      if (expiresAt > now) {
        sessions.set(String(session.token), {
          profileId: String(session.profileId),
          createdAt,
          expiresAt
        });
      } else {
        changed = true;
      }
    }
  });

  if (changed) {
    saveSessions();
  }
}

function saveSessions() {
  writeJsonFileAtomic(sessionsFile, {
    sessions: [...sessions.entries()].map(([token, session]) => ({
      token,
      profileId: session.profileId,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt
    }))
  });
}

function normalizeProfileName(name = "") {
  return name.trim().replace(/\s+/g, " ").toLocaleLowerCase("ru");
}

function createProfileId() {
  return `profile-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(String(password), salt, 120000, 32, "sha256").toString("hex");

  return { passwordHash: hash, passwordSalt: salt };
}

function verifyPassword(profile, password) {
  if (!profile.passwordHash || !profile.passwordSalt) {
    return false;
  }

  const { passwordHash } = hashPassword(password, profile.passwordSalt);
  const expected = Buffer.from(profile.passwordHash, "hex");
  const actual = Buffer.from(passwordHash, "hex");

  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function toPublicProfile(profile) {
  const { passwordHash, passwordSalt, ...publicProfile } = profile;

  return publicProfile;
}

function getSessionToken(request) {
  const cookie = request.headers.cookie || "";

  return cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("chess_legends_session="))
    ?.split("=")[1];
}

function cleanupSessions() {
  const now = Date.now();
  let changed = false;

  for (const [token, session] of sessions.entries()) {
    if (!session?.profileId || Number(session.expiresAt) <= now) {
      sessions.delete(token);
      changed = true;
    }
  }

  if (changed) {
    saveSessions();
  }
}

function getSessionProfileId(request) {
  const token = getSessionToken(request);
  const session = token ? sessions.get(token) : null;

  if (!session || Number(session.expiresAt) <= Date.now()) {
    if (token && session) {
      sessions.delete(token);
      saveSessions();
    }
    return null;
  }

  return session.profileId;
}

function getSessionProfile(request) {
  const profileId = getSessionProfileId(request);

  if (!profileId) {
    return null;
  }

  return readProfiles().find((profile) => profile.id === profileId) || null;
}

function requireSessionProfile(request) {
  const profile = getSessionProfile(request);

  if (!profile) {
    const error = new Error("Нужно войти в профиль.");
    error.statusCode = 403;
    throw error;
  }

  return profile;
}

function createSessionCookie(profileId) {
  const token = crypto.randomBytes(24).toString("hex");
  const createdAt = Date.now();
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  sessions.set(token, {
    profileId,
    createdAt,
    expiresAt: createdAt + SESSION_TTL_MS
  });
  saveSessions();
  return `chess_legends_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000${secure}`;
}

function createExpiredSessionCookie() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  return `chess_legends_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`;
}

function mergePublicProfile(storedProfile, incomingProfile) {
  return {
    ...storedProfile,
    ...incomingProfile,
    id: storedProfile.id,
    name: storedProfile.name,
    passwordHash: storedProfile.passwordHash,
    passwordSalt: storedProfile.passwordSalt
  };
}

function loadGameData() {
  const context = { window: {} };
  const dataSource = fs.readFileSync(path.join(root, "data", "data.js"), "utf8");

  vm.runInNewContext(dataSource, context);
  return context.window.ChessLegendsData;
}

const gameData = loadGameData();
const allowedLevels = new Set(Object.keys(gameData.difficultySettings));

function shuffle(items) {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = crypto.randomInt(index + 1);
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }

  return result;
}

function buildOnlineDeck(settings) {
  const difficulty = gameData.difficultySettings[settings.difficulty] || gameData.difficultySettings["Начинающий"];
  const selectedLegends = shuffle(gameData.legends).slice(0, difficulty.pairs);

  return shuffle(selectedLegends.flatMap((legend, pairId) => [
    { id: `${legend.id}-a`, pairId, type: "photo", photo: legend.photo, surname: legend.surname },
    { id: `${legend.id}-b`, pairId, type: "photo", photo: legend.photo, surname: legend.surname }
  ])).map((card, index) => ({
    ...card,
    index,
    isOpen: false,
    isMatched: false
  }));
}

function createRoomId(prefix = "room") {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
}

function createPlayerToken() {
  return crypto.randomBytes(18).toString("hex");
}

function normalizeOnlineLevel(level) {
  const normalizedLevel = String(level || "Начинающий").trim();

  if (!allowedLevels.has(normalizedLevel)) {
    const error = new Error("Некорректный уровень комнаты.");
    error.statusCode = 400;
    throw error;
  }

  return normalizedLevel;
}

function sanitizePlayer(profile = {}) {
  return {
    id: String(profile.id || createRoomId("guest")),
    name: String(profile.name || "Игрок").trim().slice(0, 24) || "Игрок",
    country: String(profile.country || "").trim().slice(0, 64)
  };
}

function getPublicRoomId(name, level) {
  return `public:${level}:${name}`;
}

function touchPlayer(player, status = "connected") {
  player.connectionStatus = status;
  player.lastSeenAt = Date.now();
  if (status === "connected") {
    delete player.leftAt;
  }
}

function createRoom({ id = createRoomId(), code = "", name, level, isPrivate = false, passwordHash = "", passwordSalt = "", rematchProfileIds = [] }) {
  return {
    id,
    code: isPrivate ? code || crypto.randomBytes(3).toString("hex").toUpperCase() : "",
    name,
    level,
    isPrivate,
    passwordHash,
    passwordSalt,
    status: "waiting",
    players: [],
    rematchProfileIds,
    game: null,
    resultSaved: false,
    updatedAt: Date.now()
  };
}

function shouldPersistRoom(room) {
  return room.isPrivate
    || room.status !== "waiting"
    || room.players.some((player) => player.connectionStatus !== "left");
}

function normalizeLoadedRoom(room) {
  if (!room || typeof room !== "object" || !room.id) {
    return null;
  }

  const legacyPassword = String(room.password || "");
  const legacyPasswordHash = legacyPassword ? hashPassword(legacyPassword) : null;
  const loadedRoom = {
    id: String(room.id),
    code: String(room.code || ""),
    name: String(room.name || "Комната").slice(0, 24),
    level: normalizeOnlineLevel(room.level),
    isPrivate: Boolean(room.isPrivate),
    passwordHash: String(room.passwordHash || legacyPasswordHash?.passwordHash || ""),
    passwordSalt: String(room.passwordSalt || legacyPasswordHash?.passwordSalt || ""),
    status: ["waiting", "playing", "finished"].includes(room.status) ? room.status : "waiting",
    players: Array.isArray(room.players) ? room.players : [],
    rematchProfileIds: Array.isArray(room.rematchProfileIds) ? room.rematchProfileIds.map(String) : [],
    game: room.game && typeof room.game === "object" ? room.game : null,
    resultSaved: Boolean(room.resultSaved),
    updatedAt: Number(room.updatedAt) || Date.now()
  };

  loadedRoom.players = loadedRoom.players.map((player) => ({
    id: String(player.id || createRoomId("guest")),
    name: String(player.name || "Игрок").trim().slice(0, 24) || "Игрок",
    country: String(player.country || "").trim().slice(0, 64),
    token: String(player.token || createPlayerToken()),
    connectionStatus: player.connectionStatus === "left" ? "left" : "disconnected",
    joinedAt: Number(player.joinedAt) || loadedRoom.updatedAt,
    lastSeenAt: Number(player.lastSeenAt) || loadedRoom.updatedAt,
    leftAt: player.leftAt ? Number(player.leftAt) : undefined
  }));

  return loadedRoom;
}

function loadOnlineRooms() {
  const parsed = readJsonFile(roomsFile, { rooms: [] });

  onlineRooms.clear();
  if (!Array.isArray(parsed.rooms)) {
    return;
  }

  parsed.rooms.forEach((room) => {
    try {
      const loadedRoom = normalizeLoadedRoom(room);

      if (loadedRoom && shouldPersistRoom(loadedRoom)) {
        onlineRooms.set(loadedRoom.id, loadedRoom);
      }
    } catch {
      // Skip malformed room records; a bad runtime file must not block startup.
    }
  });
}

function saveOnlineRooms() {
  writeJsonFileAtomic(roomsFile, {
    rooms: [...onlineRooms.values()].filter(shouldPersistRoom)
  });
}

function ensurePublicRooms() {
  publicRoomGroups.forEach((group) => {
    group.names.forEach((name) => {
      const id = getPublicRoomId(name, group.level);

      if (!onlineRooms.has(id)) {
        onlineRooms.set(id, createRoom({ id, name, level: group.level }));
      }
    });
  });
}

function getRoomPlayer(room, token) {
  return room.players.find((player) => player.token === token) || null;
}

function isPublicRoom(room) {
  return !room.isPrivate && String(room.id || "").startsWith("public:");
}

function resetPublicRoom(room) {
  return createRoom({ id: room.id, name: room.name, level: room.level });
}

function resetRoomForRematch(room) {
  return createRoom({
    id: room.id,
    code: room.code,
    name: room.name,
    level: room.level,
    isPrivate: room.isPrivate,
    passwordHash: room.passwordHash,
    passwordSalt: room.passwordSalt,
    rematchProfileIds: room.players.map((player) => player.id)
  });
}

function getRoomPlayerByProfile(room, profileId) {
  return room.players.find((player) => player.id === profileId && player.connectionStatus !== "left") || null;
}

function getAuthorizedRoomPlayer(request, room, token = "") {
  const profile = requireSessionProfile(request);
  const player = token ? getRoomPlayer(room, token) : getRoomPlayerByProfile(room, profile.id);

  if (!player || player.id !== profile.id || player.connectionStatus === "left") {
    const error = new Error("Нет доступа к этой комнате.");
    error.statusCode = 403;
    throw error;
  }

  touchPlayer(player);
  room.updatedAt = Date.now();
  return player;
}

function refreshRoomConnections(room) {
  const now = Date.now();

  room.players.forEach((player) => {
    if (player.connectionStatus === "connected" && now - (player.lastSeenAt || room.updatedAt) > PLAYER_DISCONNECT_AFTER_MS) {
      player.connectionStatus = "disconnected";
    }
  });
}

function cleanupOnlineRooms() {
  const now = Date.now();
  let changed = false;

  for (const [id, room] of onlineRooms.entries()) {
    const previousPlayers = JSON.stringify(room.players.map((player) => [player.id, player.connectionStatus]));

    refreshRoomConnections(room);
    changed = changed || previousPlayers !== JSON.stringify(room.players.map((player) => [player.id, player.connectionStatus]));

    const isFinishedExpired = room.status === "finished" && now - (room.game?.finishedAt || room.updatedAt) > (
      isPublicRoom(room) ? PUBLIC_FINISHED_RESET_MS : FINISHED_ROOM_TTL_MS
    );

    if (isPublicRoom(room) && isFinishedExpired) {
      onlineRooms.set(id, resetPublicRoom(room));
      changed = true;
      continue;
    }

    if (!room.isPrivate) {
      continue;
    }

    const activePlayers = room.players.filter((player) => player.connectionStatus !== "left");
    const isEmptyExpired = activePlayers.length === 0 && now - room.updatedAt > EMPTY_PRIVATE_ROOM_TTL_MS;

    if (isEmptyExpired || isFinishedExpired) {
      onlineRooms.delete(id);
      changed = true;
    }
  }

  if (changed) {
    saveOnlineRooms();
  }
}

function findActiveRoomForProfile(profileId) {
  cleanupOnlineRooms();

  return [...onlineRooms.values()].find((room) => {
    if (room.status === "finished") {
      return false;
    }

    return Boolean(getRoomPlayerByProfile(room, profileId));
  }) || null;
}

function closeExpiredMismatch(room) {
  const pending = room.game?.pendingMismatch;

  if (!pending || Date.now() < pending.closeAt) {
    return;
  }

  pending.indexes.forEach((index) => {
    if (room.game.cards[index] && !room.game.cards[index].isMatched) {
      room.game.cards[index].isOpen = false;
    }
  });
  room.game.openCards = [];
  room.game.pendingMismatch = null;
  room.game.turnIndex = room.game.turnIndex === 0 ? 1 : 0;
  room.updatedAt = Date.now();
  saveOnlineRooms();
}

function serializeRoom(room, token = "") {
  closeExpiredMismatch(room);
  refreshRoomConnections(room);

  const player = token ? getRoomPlayer(room, token) : null;
  const canSeePrivateCode = !room.isPrivate || Boolean(player);

  return {
    id: room.id,
    code: canSeePrivateCode ? room.code : "",
    name: room.name,
    level: room.level,
    isPrivate: room.isPrivate,
    status: room.status,
    playerIndex: player ? room.players.indexOf(player) : null,
    players: room.players
      .filter((publicPlayer) => publicPlayer.connectionStatus !== "left")
      .map(({ token: _token, joinedAt: _joinedAt, lastSeenAt: _lastSeenAt, leftAt: _leftAt, ...publicPlayer }) => publicPlayer),
    game: player && room.game ? {
      settings: room.game.settings,
      cards: room.game.cards,
      moves: room.game.moves,
      matchedPairs: room.game.matchedPairs,
      scores: room.game.scores,
      turnIndex: room.game.turnIndex,
      winner: room.game.winner,
      finishedAt: room.game.finishedAt || null
    } : null
  };
}

function startOnlineGame(room) {
  const settings = {
    mode: "Сетевая игра",
    cardType: "Фото - фото",
    difficulty: room.level
  };

  room.status = "playing";
  room.game = {
    settings,
    cards: buildOnlineDeck(settings),
    openCards: [],
    pendingMismatch: null,
    matchedPairs: 0,
    moves: 0,
    scores: [0, 0],
    turnIndex: 0,
    winner: null,
    startedAt: Date.now()
  };
  room.updatedAt = Date.now();
}

function joinRoom(room, profile) {
  const player = sanitizePlayer(profile);
  const existingPlayer = room.players.find((item) => item.id === player.id);

  if (existingPlayer) {
    touchPlayer(existingPlayer);
    saveOnlineRooms();
    return existingPlayer;
  }

  if (room.status !== "finished") {
    room.players = room.players.filter((item) => item.connectionStatus !== "left");
  }

  if (room.players.filter((item) => item.connectionStatus !== "left").length >= 2) {
    const error = new Error("Комната уже занята.");
    error.statusCode = 409;
    throw error;
  }

  const joinedPlayer = {
    ...player,
    token: createPlayerToken(),
    connectionStatus: "connected",
    joinedAt: Date.now(),
    lastSeenAt: Date.now()
  };

  room.players.push(joinedPlayer);
  room.updatedAt = Date.now();

  if (room.players.filter((item) => item.connectionStatus !== "left").length === 2) {
    startOnlineGame(room);
  }

  saveOnlineRooms();

  return joinedPlayer;
}

function calculateOnlineRatingDelta(room, playerIndex) {
  const winner = room.game.winner;
  const scoreDiff = Math.abs((room.game.scores[0] || 0) - (room.game.scores[1] || 0));
  const baseDelta = 12 + Math.min(scoreDiff, 8) * 2;

  if (winner === null) {
    return 1;
  }

  return winner === playerIndex ? baseDelta : -Math.ceil(baseDelta * 0.7);
}

function saveOnlineResult(room) {
  if (room.resultSaved || room.status !== "finished") {
    return;
  }

  const profiles = readProfiles();

  room.players.forEach((player, playerIndex) => {
    const profileIndex = profiles.findIndex((profile) => profile.id === player.id);

    if (profileIndex < 0) {
      return;
    }

    const profile = profiles[profileIndex];
    const difficulty = room.level;
    const record = {
      wins: 0,
      losses: 0,
      draws: 0,
      matchWins: 0,
      matchLosses: 0,
      matchDraws: 0,
      singleGames: 0,
      totalSingleSeconds: 0,
      totalSingleMoves: 0,
      recentSingleSeconds: [],
      recentSingleMoves: [],
      ...(profile.recordsByDifficulty?.[difficulty] || {})
    };
    const isDraw = room.game.winner === null;
    const isWin = room.game.winner === playerIndex;

    profile.gamesPlayed = (profile.gamesPlayed || 0) + 1;
    profile.matchGamesPlayed = (profile.matchGamesPlayed || 0) + 1;
    profile.matchRating = Math.max(100, (profile.matchRating || 1000) + calculateOnlineRatingDelta(room, playerIndex));
    profile.recordsByDifficulty = profile.recordsByDifficulty || {};

    if (isDraw) {
      profile.twoPlayerDraws = (profile.twoPlayerDraws || 0) + 1;
      record.matchDraws += 1;
    } else if (isWin) {
      profile.twoPlayerWins = (profile.twoPlayerWins || 0) + 1;
      record.matchWins += 1;
    } else {
      profile.twoPlayerLosses = (profile.twoPlayerLosses || 0) + 1;
      record.matchLosses += 1;
    }

    profile.recordsByDifficulty[difficulty] = record;
    profiles[profileIndex] = profile;
  });

  writeProfiles(profiles);
  room.resultSaved = true;
  saveOnlineRooms();
}

function revealOnlineCard(room, player, index) {
  closeExpiredMismatch(room);

  if (room.status !== "playing" || !room.game) {
    const error = new Error("Партия еще не началась.");
    error.statusCode = 409;
    throw error;
  }

  const playerIndex = room.players.indexOf(player);

  if (playerIndex < 0 || player.connectionStatus === "left" || playerIndex !== room.game.turnIndex) {
    const error = new Error("Сейчас ход соперника.");
    error.statusCode = 409;
    throw error;
  }

  if (room.game.pendingMismatch) {
    const error = new Error("Дождитесь закрытия карточек.");
    error.statusCode = 409;
    throw error;
  }

  const card = room.game.cards[index];

  if (!card || card.isOpen || card.isMatched) {
    const error = new Error("Эту карточку нельзя открыть.");
    error.statusCode = 400;
    throw error;
  }

  card.isOpen = true;
  room.game.openCards.push(index);

  if (room.game.openCards.length === 2) {
    const [firstIndex, secondIndex] = room.game.openCards;
    const firstCard = room.game.cards[firstIndex];
    const secondCard = room.game.cards[secondIndex];

    room.game.moves += 1;

    if (firstCard.pairId === secondCard.pairId) {
      firstCard.isMatched = true;
      secondCard.isMatched = true;
      room.game.openCards = [];
      room.game.matchedPairs += 1;
      room.game.scores[playerIndex] += 1;

      if (room.game.matchedPairs === (gameData.difficultySettings[room.level]?.pairs || 8)) {
        room.status = "finished";
        room.game.finishedAt = Date.now();
        room.game.winner = room.game.scores[0] === room.game.scores[1]
          ? null
          : room.game.scores[0] > room.game.scores[1] ? 0 : 1;
        saveOnlineResult(room);
      }
    } else {
      room.game.pendingMismatch = {
        indexes: [firstIndex, secondIndex],
        closeAt: Date.now() + 900
      };
    }
  }

  room.updatedAt = Date.now();
  saveOnlineRooms();
}

async function handleApi(request, response, url) {
  cleanupSessions();
  ensurePublicRooms();
  cleanupOnlineRooms();

  if (request.method === "GET" && url.pathname === "/api/health") {
    sendJson(response, 200, { ok: true });
    return true;
  }

  if (request.method === "GET" && url.pathname === "/api/online/rooms") {
    sendJson(response, 200, {
      rooms: [...onlineRooms.values()]
        .filter((room) => !room.isPrivate)
        .map((room) => serializeRoom(room))
    });
    return true;
  }

  if (request.method === "GET" && url.pathname === "/api/online/active") {
    const profile = requireSessionProfile(request);
    const room = findActiveRoomForProfile(profile.id);

    if (!room) {
      sendJson(response, 200, { room: null, playerToken: "" });
      return true;
    }

    const player = getRoomPlayerByProfile(room, profile.id);
    touchPlayer(player);
    sendJson(response, 200, {
      playerToken: player.token,
      room: serializeRoom(room, player.token)
    });
    return true;
  }

  if (request.method === "POST" && url.pathname === "/api/online/rooms/join") {
    const profile = requireSessionProfile(request);
    const body = await readRequestJson(request);
    const id = body.id || getPublicRoomId(body.name, body.level);
    const room = onlineRooms.get(id);

    if (!room || room.isPrivate) {
      sendJson(response, 404, { error: "Комната не найдена." });
      return true;
    }

    const player = joinRoom(room, profile);

    sendJson(response, 200, {
      playerToken: player.token,
      room: serializeRoom(room, player.token)
    });
    return true;
  }

  if (request.method === "POST" && url.pathname === "/api/online/rooms/private") {
    const profile = requireSessionProfile(request);
    const body = await readRequestJson(request);
    const password = String(body.password || "");
    const now = Date.now();
    const lastCreatedAt = privateRoomCreateTimes.get(profile.id) || 0;

    if (password.length < 1) {
      sendJson(response, 400, { error: "Пароль приватной комнаты обязателен." });
      return true;
    }

    if (password.length > 32) {
      sendJson(response, 400, { error: "Пароль приватной комнаты слишком длинный." });
      return true;
    }

    if (now - lastCreatedAt < PRIVATE_ROOM_CREATE_COOLDOWN_MS) {
      sendJson(response, 429, { error: "Подождите несколько секунд перед созданием новой комнаты." });
      return true;
    }

    const activePrivateRooms = [...onlineRooms.values()].filter((room) => {
      return room.isPrivate && room.status !== "finished" && Boolean(getRoomPlayerByProfile(room, profile.id));
    });

    if (activePrivateRooms.length >= MAX_PRIVATE_ROOMS_PER_PLAYER) {
      sendJson(response, 429, { error: "Слишком много активных приватных комнат." });
      return true;
    }

    const roomName = String(body.name || "").trim().replace(/\s+/g, " ").slice(0, 24);

    if (!roomName) {
      sendJson(response, 400, { error: "Название приватной комнаты обязательно." });
      return true;
    }

    const room = createRoom({
      name: roomName,
      level: normalizeOnlineLevel(body.level),
      isPrivate: true,
      ...hashPassword(password)
    });
    const player = joinRoom(room, profile);

    privateRoomCreateTimes.set(profile.id, now);
    onlineRooms.set(room.id, room);
    saveOnlineRooms();
    sendJson(response, 201, {
      playerToken: player.token,
      room: serializeRoom(room, player.token)
    });
    return true;
  }

  if (request.method === "POST" && url.pathname === "/api/online/rooms/private/join") {
    const profile = requireSessionProfile(request);
    const body = await readRequestJson(request);
    const code = String(body.code || "").trim().toUpperCase();
    const room = [...onlineRooms.values()].find((item) => item.isPrivate && item.code === code);

    if (!room || !verifyPassword(room, String(body.password || ""))) {
      sendJson(response, 401, { error: "Неверный код или пароль комнаты." });
      return true;
    }

    const player = joinRoom(room, profile);

    sendJson(response, 200, {
      playerToken: player.token,
      room: serializeRoom(room, player.token)
    });
    return true;
  }

  const onlineRoomStatusMatch = url.pathname.match(/^\/api\/online\/rooms\/([^/]+)$/);

  if (request.method === "GET" && onlineRoomStatusMatch) {
    const room = onlineRooms.get(decodeURIComponent(onlineRoomStatusMatch[1]));

    if (!room) {
      sendJson(response, 404, { error: "Комната не найдена." });
      return true;
    }

    const player = getAuthorizedRoomPlayer(request, room, url.searchParams.get("token") || "");

    sendJson(response, 200, { room: serializeRoom(room, player.token) });
    return true;
  }

  const onlineRoomRevealMatch = url.pathname.match(/^\/api\/online\/rooms\/([^/]+)\/reveal$/);

  if (request.method === "POST" && onlineRoomRevealMatch) {
    const room = onlineRooms.get(decodeURIComponent(onlineRoomRevealMatch[1]));
    const body = await readRequestJson(request);

    if (!room) {
      sendJson(response, 404, { error: "Комната не найдена." });
      return true;
    }

    const player = getAuthorizedRoomPlayer(request, room, String(body.playerToken || ""));

    revealOnlineCard(room, player, Number(body.index));
    sendJson(response, 200, { room: serializeRoom(room, player.token) });
    return true;
  }

  const onlineRoomRematchMatch = url.pathname.match(/^\/api\/online\/rooms\/([^/]+)\/rematch$/);

  if (request.method === "POST" && onlineRoomRematchMatch) {
    const profile = requireSessionProfile(request);
    const roomId = decodeURIComponent(onlineRoomRematchMatch[1]);
    const room = onlineRooms.get(roomId);
    const body = await readRequestJson(request);
    const playerToken = String(body.playerToken || "");

    if (!room) {
      sendJson(response, 404, { error: "Комната не найдена." });
      return true;
    }

    if (room.status === "finished") {
      const previousPlayer = playerToken ? getRoomPlayer(room, playerToken) : getRoomPlayerByProfile(room, profile.id);

      if (!previousPlayer || previousPlayer.id !== profile.id) {
        sendJson(response, 403, { error: "Нет доступа к этой комнате." });
        return true;
      }

      const rematchRoom = resetRoomForRematch(room);
      onlineRooms.set(roomId, rematchRoom);
      const player = joinRoom(rematchRoom, profile);

      sendJson(response, 200, {
        playerToken: player.token,
        room: serializeRoom(rematchRoom, player.token)
      });
      return true;
    }

    if (room.status === "waiting") {
      if (room.rematchProfileIds?.length && !room.rematchProfileIds.includes(profile.id)) {
        sendJson(response, 403, { error: "Нет доступа к этой комнате." });
        return true;
      }

      const player = joinRoom(room, profile);

      sendJson(response, 200, {
        playerToken: player.token,
        room: serializeRoom(room, player.token)
      });
      return true;
    }

    if (room.status === "playing") {
      const player = getRoomPlayerByProfile(room, profile.id);

      if (player) {
        touchPlayer(player);
        room.updatedAt = Date.now();
        sendJson(response, 200, {
          playerToken: player.token,
          room: serializeRoom(room, player.token)
        });
        return true;
      }
    }

    sendJson(response, 409, { error: "Реванш уже начался. Вернитесь в лобби и подключитесь заново." });
    return true;
  }

  const onlineRoomLeaveMatch = url.pathname.match(/^\/api\/online\/rooms\/([^/]+)\/leave$/);

  if (request.method === "POST" && onlineRoomLeaveMatch) {
    const room = onlineRooms.get(decodeURIComponent(onlineRoomLeaveMatch[1]));
    const body = await readRequestJson(request);

    if (room) {
      const player = getAuthorizedRoomPlayer(request, room, String(body.playerToken || ""));

      player.connectionStatus = "left";
      player.leftAt = Date.now();
      room.updatedAt = Date.now();

      const activePlayers = room.players.filter((item) => item.connectionStatus !== "left");

      if (!room.isPrivate && activePlayers.length === 0) {
        onlineRooms.set(room.id, createRoom({ id: room.id, name: room.name, level: room.level }));
      } else if (room.isPrivate && activePlayers.length === 0) {
        onlineRooms.delete(room.id);
      } else if (room.status !== "finished") {
        room.status = "waiting";
        room.game = null;
      }
      saveOnlineRooms();
    }

    sendJson(response, 200, { ok: true });
    return true;
  }

  if (request.method === "GET" && url.pathname === "/api/profiles") {
    sendJson(response, 200, { profiles: readProfiles().map(toPublicProfile) });
    return true;
  }

  if (request.method === "POST" && url.pathname === "/api/logout") {
    const token = getSessionToken(request);

    if (token) {
      sessions.delete(token);
      saveSessions();
    }

    sendJson(response, 200, { ok: true }, {
      "Set-Cookie": createExpiredSessionCookie()
    });
    return true;
  }

  if (request.method === "POST" && url.pathname === "/api/register") {
    const body = await readRequestJson(request);
    const name = String(body.name || "").trim().replace(/\s+/g, " ");
    const password = String(body.password || "");

    if (!name || password.length < 4) {
      sendJson(response, 400, { error: "Имя и пароль от 4 символов обязательны." });
      return true;
    }

    const profiles = readProfiles();
    if (profiles.some((profile) => normalizeProfileName(profile.name) === normalizeProfileName(name))) {
      sendJson(response, 409, { error: "Такой профиль уже есть." });
      return true;
    }

    const profile = {
      ...body.profile,
      id: createProfileId(),
      name,
      country: String(body.country || body.profile?.country || "").trim(),
      ...hashPassword(password)
    };

    profiles.push(profile);
    writeProfiles(profiles);
    sendJson(response, 201, { profile: toPublicProfile(profile) }, {
      "Set-Cookie": createSessionCookie(profile.id)
    });
    return true;
  }

  if (request.method === "POST" && url.pathname === "/api/login") {
    const body = await readRequestJson(request);
    const name = String(body.name || "").trim();
    const password = String(body.password || "");
    const profile = readProfiles().find((item) => normalizeProfileName(item.name) === normalizeProfileName(name));

    if (!profile || !verifyPassword(profile, password)) {
      sendJson(response, 401, { error: "Неверное имя или пароль." });
      return true;
    }

    sendJson(response, 200, { profile: toPublicProfile(profile) }, {
      "Set-Cookie": createSessionCookie(profile.id)
    });
    return true;
  }

  if (request.method === "POST" && url.pathname === "/api/profiles/save") {
    const sessionProfileId = getSessionProfileId(request);
    const body = await readRequestJson(request);

    if (!sessionProfileId || body.profile?.id !== sessionProfileId) {
      sendJson(response, 403, { error: "Нужно войти в профиль." });
      return true;
    }

    const profiles = readProfiles();
    const profileIndex = profiles.findIndex((profile) => profile.id === sessionProfileId);

    if (profileIndex < 0) {
      sendJson(response, 404, { error: "Профиль не найден." });
      return true;
    }

    profiles[profileIndex] = mergePublicProfile(profiles[profileIndex], body.profile);
    writeProfiles(profiles);
    sendJson(response, 200, { profile: toPublicProfile(profiles[profileIndex]) });
    return true;
  }

  return false;
}

loadSessions();
cleanupSessions();
loadOnlineRooms();
ensurePublicRooms();
cleanupOnlineRooms();
saveOnlineRooms();

http.createServer(async (request, response) => {
  let url;

  try {
    url = new URL(request.url, `http://${request.headers.host || host}`);
  } catch {
    send(response, 400, "Bad request");
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    try {
      const handled = await handleApi(request, response, url);

      if (!handled) {
        sendJson(response, 404, { error: "Not found" });
      }
    } catch (error) {
      logApiError(request, url, error);
      sendJson(response, getApiErrorStatus(error), { error: error.message });
    }
    return;
  }

  const pathname = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = path.resolve(root, `.${pathname}`);
  const relativePath = path.relative(root, filePath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    send(response, 403, "Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      send(response, 404, "Not found");
      return;
    }

    response.writeHead(200, getHeaders(types[path.extname(filePath)] || "application/octet-stream", filePath));
    response.end(content);
  });
}).listen(port, host, () => {
  console.log(`Chess Legends is running at http://${host}:${port}/`);
});
