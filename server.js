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
const sessions = new Map();
const onlineRooms = new Map();

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

  return {
    "Content-Type": type,
    "Cache-Control": isHtml ? "no-cache" : "public, max-age=3600",
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
  ensureRuntimeDir();
  const temporaryFile = `${profilesFile}.${process.pid}.tmp`;

  fs.writeFileSync(temporaryFile, `${JSON.stringify({ profiles }, null, 2)}\n`);
  fs.renameSync(temporaryFile, profilesFile);
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

function getSessionProfileId(request) {
  const cookie = request.headers.cookie || "";
  const token = cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("chess_legends_session="))
    ?.split("=")[1];

  return token ? sessions.get(token) || null : null;
}

function createSessionCookie(profileId) {
  const token = crypto.randomBytes(24).toString("hex");

  sessions.set(token, profileId);
  return `chess_legends_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000`;
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

function createRoom({ id = createRoomId(), name, level, isPrivate = false, password = "" }) {
  return {
    id,
    code: isPrivate ? crypto.randomBytes(3).toString("hex").toUpperCase() : "",
    name,
    level,
    isPrivate,
    password,
    status: "waiting",
    players: [],
    game: null,
    resultSaved: false,
    updatedAt: Date.now()
  };
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
}

function serializeRoom(room, token = "") {
  closeExpiredMismatch(room);

  const player = token ? getRoomPlayer(room, token) : null;

  return {
    id: room.id,
    code: room.code,
    name: room.name,
    level: room.level,
    isPrivate: room.isPrivate,
    status: room.status,
    playerIndex: player ? room.players.indexOf(player) : null,
    players: room.players.map(({ token: _token, ...publicPlayer }) => publicPlayer),
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
    return existingPlayer;
  }

  if (room.players.length >= 2) {
    const error = new Error("Комната уже занята.");
    error.statusCode = 409;
    throw error;
  }

  const joinedPlayer = {
    ...player,
    token: createPlayerToken()
  };

  room.players.push(joinedPlayer);
  room.updatedAt = Date.now();

  if (room.players.length === 2) {
    startOnlineGame(room);
  }

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
}

function revealOnlineCard(room, token, index) {
  closeExpiredMismatch(room);

  if (room.status !== "playing" || !room.game) {
    const error = new Error("Партия еще не началась.");
    error.statusCode = 409;
    throw error;
  }

  const player = getRoomPlayer(room, token);
  const playerIndex = room.players.indexOf(player);

  if (!player || playerIndex !== room.game.turnIndex) {
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
}

async function handleApi(request, response, url) {
  ensurePublicRooms();

  if (request.method === "GET" && url.pathname === "/api/health") {
    sendJson(response, 200, { ok: true });
    return true;
  }

  if (request.method === "GET" && url.pathname === "/api/online/rooms") {
    sendJson(response, 200, {
      rooms: [...onlineRooms.values()].map((room) => serializeRoom(room))
    });
    return true;
  }

  if (request.method === "POST" && url.pathname === "/api/online/rooms/join") {
    const body = await readRequestJson(request);
    const id = body.id || getPublicRoomId(body.name, body.level);
    const room = onlineRooms.get(id);

    if (!room || room.isPrivate) {
      sendJson(response, 404, { error: "Комната не найдена." });
      return true;
    }

    const player = joinRoom(room, body.profile);

    sendJson(response, 200, {
      playerToken: player.token,
      room: serializeRoom(room, player.token)
    });
    return true;
  }

  if (request.method === "POST" && url.pathname === "/api/online/rooms/private") {
    const body = await readRequestJson(request);
    const password = String(body.password || "");

    if (password.length < 1) {
      sendJson(response, 400, { error: "Пароль приватной комнаты обязателен." });
      return true;
    }

    const room = createRoom({
      name: String(body.name || "").trim().slice(0, 24) || "Приватная комната",
      level: String(body.level || "Начинающий"),
      isPrivate: true,
      password
    });
    const player = joinRoom(room, body.profile);

    onlineRooms.set(room.id, room);
    sendJson(response, 201, {
      playerToken: player.token,
      room: serializeRoom(room, player.token)
    });
    return true;
  }

  if (request.method === "POST" && url.pathname === "/api/online/rooms/private/join") {
    const body = await readRequestJson(request);
    const code = String(body.code || "").trim().toUpperCase();
    const room = [...onlineRooms.values()].find((item) => item.isPrivate && item.code === code);

    if (!room || room.password !== String(body.password || "")) {
      sendJson(response, 401, { error: "Неверный код или пароль комнаты." });
      return true;
    }

    const player = joinRoom(room, body.profile);

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

    sendJson(response, 200, { room: serializeRoom(room, url.searchParams.get("token") || "") });
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

    revealOnlineCard(room, String(body.playerToken || ""), Number(body.index));
    sendJson(response, 200, { room: serializeRoom(room, String(body.playerToken || "")) });
    return true;
  }

  const onlineRoomLeaveMatch = url.pathname.match(/^\/api\/online\/rooms\/([^/]+)\/leave$/);

  if (request.method === "POST" && onlineRoomLeaveMatch) {
    const room = onlineRooms.get(decodeURIComponent(onlineRoomLeaveMatch[1]));
    const body = await readRequestJson(request);

    if (room) {
      room.players = room.players.filter((player) => player.token !== String(body.playerToken || ""));
      if (!room.isPrivate && room.players.length === 0) {
        onlineRooms.set(room.id, createRoom({ id: room.id, name: room.name, level: room.level }));
      } else if (room.isPrivate && room.players.length === 0) {
        onlineRooms.delete(room.id);
      } else if (room.status !== "finished") {
        room.status = "waiting";
        room.game = null;
      }
    }

    sendJson(response, 200, { ok: true });
    return true;
  }

  if (request.method === "GET" && url.pathname === "/api/profiles") {
    sendJson(response, 200, { profiles: readProfiles().map(toPublicProfile) });
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
      sendJson(response, error.statusCode || (error.message === "Payload too large" ? 413 : 400), { error: error.message });
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
