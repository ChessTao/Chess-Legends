const { spawn } = require("child_process");

const PORT = Number(process.env.RUNTIME_RESTART_PORT) || 4183;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const ROOM_PASSWORD = "restart-check-pass";

let serverProcess = null;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getCookie(setCookieHeader) {
  return String(setCookieHeader || "").split(";")[0];
}

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.cookie ? { Cookie: options.cookie } : {}),
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await response.json().catch(() => ({}));

  return {
    response,
    data,
    cookie: getCookie(response.headers.get("set-cookie"))
  };
}

async function waitForHealth() {
  const deadline = Date.now() + 8000;

  while (Date.now() < deadline) {
    try {
      const result = await request("/api/health");

      if (result.response.status === 200 && result.data.ok) {
        return;
      }
    } catch {
      // The server may still be booting.
    }

    await delay(200);
  }

  throw new Error("Server did not become healthy in time.");
}

async function startServer() {
  serverProcess = spawn(process.execPath, ["server.js"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      HOST: "127.0.0.1",
      PORT: String(PORT),
      NODE_ENV: "test"
    },
    stdio: "ignore"
  });

  serverProcess.on("exit", (code) => {
    if (serverProcess && code !== null && code !== 0) {
      console.error(`Server process exited with code ${code}.`);
    }
  });

  await waitForHealth();
}

async function stopServer() {
  if (!serverProcess || serverProcess.killed) {
    return;
  }

  const currentProcess = serverProcess;

  await new Promise((resolve) => {
    const timeout = setTimeout(resolve, 2000);

    currentProcess.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });

    currentProcess.kill();
  });

  if (serverProcess === currentProcess) {
    serverProcess = null;
  }
}

async function registerPlayer(name) {
  const result = await request("/api/register", {
    method: "POST",
    body: {
      name,
      password: "test-password",
      country: "Hungary",
      profile: { name, country: "Hungary" }
    }
  });

  assert(result.response.status === 201, `${name}: registration failed with ${result.response.status}`);
  assert(result.cookie.includes("chess_legends_session="), `${name}: session cookie missing`);

  return {
    cookie: result.cookie,
    profile: result.data.profile
  };
}

async function createPrivateRoom(player) {
  const result = await request("/api/online/rooms/private", {
    method: "POST",
    cookie: player.cookie,
    body: {
      name: "Restart check",
      level: "Начинающий",
      password: ROOM_PASSWORD
    }
  });

  assert(result.response.status === 201, `private room creation failed with ${result.response.status}`);
  assert(result.data.room?.id, "created room id missing");
  assert(result.data.room?.code, "created room code missing");
  assert(result.data.playerToken, "creator player token missing");

  return {
    room: result.data.room,
    playerToken: result.data.playerToken
  };
}

async function joinPrivateRoom(player, roomInfo) {
  const result = await request("/api/online/rooms/private/join", {
    method: "POST",
    cookie: player.cookie,
    body: {
      code: roomInfo.room.code,
      password: ROOM_PASSWORD
    }
  });

  assert(result.response.status === 200, `private room join failed with ${result.response.status}`);
  assert(result.data.room?.status === "playing", "room should be playing before restart");
  assert(result.data.playerToken, "joiner player token missing");

  return {
    room: result.data.room,
    playerToken: result.data.playerToken
  };
}

async function assertActiveRoomRestored(player, roomId) {
  const result = await request("/api/online/active", {
    cookie: player.cookie
  });

  assert(result.response.status === 200, `active room lookup failed with ${result.response.status}`);
  assert(result.data.room?.id === roomId, "active room id was not restored after restart");
  assert(result.data.room?.status === "playing", "restored room should still be playing");
  assert(result.data.playerToken, "restored player token missing");

  return result.data.playerToken;
}

async function leaveRoom(roomId, player) {
  await request(`/api/online/rooms/${encodeURIComponent(roomId)}/leave`, {
    method: "POST",
    cookie: player.cookie,
    body: {
      playerToken: player.playerToken
    }
  });
}

async function main() {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  await startServer();

  const playerA = await registerPlayer(`Restart A ${suffix}`);
  const playerB = await registerPlayer(`Restart B ${suffix}`);
  const created = await createPrivateRoom(playerA);
  const joined = await joinPrivateRoom(playerB, created);
  const roomId = joined.room.id;

  await stopServer();
  await startServer();

  const playerAToken = await assertActiveRoomRestored(playerA, roomId);
  const playerBToken = await assertActiveRoomRestored(playerB, roomId);

  await leaveRoom(roomId, {
    cookie: playerA.cookie,
    playerToken: playerAToken
  });
  await leaveRoom(roomId, {
    cookie: playerB.cookie,
    playerToken: playerBToken
  });

  console.log("Runtime restart check passed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await stopServer();
  });
