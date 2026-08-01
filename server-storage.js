const fs = require("fs");
const path = require("path");

const STORE_KEYS = {
  profiles: "profiles",
  sessions: "sessions",
  rooms: "online_rooms"
};

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJsonFile(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJsonFileAtomic(runtimeDir, filePath, payload) {
  ensureDir(runtimeDir);
  const temporaryFile = `${filePath}.${process.pid}.tmp`;

  fs.writeFileSync(temporaryFile, `${JSON.stringify(payload, null, 2)}\n`);
  fs.renameSync(temporaryFile, filePath);
}

function createJsonStorage({ root }) {
  const runtimeDir = path.join(root, ".runtime");
  const profilesFile = path.join(runtimeDir, "profiles.json");
  const sessionsFile = path.join(runtimeDir, "sessions.json");
  const roomsFile = path.join(runtimeDir, "online-rooms.json");
  const serverErrorsFile = path.join(runtimeDir, "server-errors.log");

  return {
    type: "json",
    runtimeDir,
    serverErrorsFile,

    ensureReady() {
      ensureDir(runtimeDir);
    },

    readProfiles() {
      const parsed = readJsonFile(profilesFile, { profiles: [] });

      return Array.isArray(parsed.profiles) ? parsed.profiles : [];
    },

    writeProfiles(profiles) {
      writeJsonFileAtomic(runtimeDir, profilesFile, { profiles });
    },

    readSessions() {
      const parsed = readJsonFile(sessionsFile, { sessions: [] });

      return Array.isArray(parsed.sessions) ? parsed.sessions : [];
    },

    writeSessions(sessions) {
      writeJsonFileAtomic(runtimeDir, sessionsFile, { sessions });
    },

    readRooms() {
      const parsed = readJsonFile(roomsFile, { rooms: [] });

      return Array.isArray(parsed.rooms) ? parsed.rooms : [];
    },

    writeRooms(rooms) {
      writeJsonFileAtomic(runtimeDir, roomsFile, { rooms });
    },

    appendServerError(lines) {
      this.ensureReady();
      fs.appendFileSync(serverErrorsFile, `${lines.join("\n")}\n\n`, "utf8");
    }
  };
}

function loadPgModule() {
  try {
    return require("pg");
  } catch (error) {
    const wrapped = new Error("PostgreSQL storage requires the npm package 'pg'. Run: npm install pg");
    wrapped.cause = error;
    throw wrapped;
  }
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function createPostgresStorage({ databaseUrl }) {
  const { Pool } = loadPgModule();
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined
  });
  const cache = {
    profiles: [],
    sessions: [],
    rooms: []
  };
  let writeQueue = Promise.resolve();

  function enqueueWrite(task) {
    writeQueue = writeQueue.then(task, task).catch((error) => {
      console.error("PostgreSQL storage write failed:", error);
    });

    return writeQueue;
  }

  async function upsertStore(key, payload) {
    await pool.query(
      `INSERT INTO app_store (key, data, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (key)
       DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [key, JSON.stringify(payload)]
    );
  }

  async function readStore(key, fallback) {
    const result = await pool.query("SELECT data FROM app_store WHERE key = $1", [key]);

    return result.rows[0]?.data || fallback;
  }

  return {
    type: "postgres",

    async ensureReady() {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS app_store (
          key TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      const profilesPayload = await readStore(STORE_KEYS.profiles, { profiles: [] });
      const sessionsPayload = await readStore(STORE_KEYS.sessions, { sessions: [] });
      const roomsPayload = await readStore(STORE_KEYS.rooms, { rooms: [] });

      cache.profiles = normalizeArray(profilesPayload.profiles);
      cache.sessions = normalizeArray(sessionsPayload.sessions);
      cache.rooms = normalizeArray(roomsPayload.rooms);
    },

    readProfiles() {
      return cloneJson(cache.profiles);
    },

    writeProfiles(profiles) {
      cache.profiles = normalizeArray(profiles);
      return enqueueWrite(() => upsertStore(STORE_KEYS.profiles, { profiles: cache.profiles }));
    },

    readSessions() {
      return cloneJson(cache.sessions);
    },

    writeSessions(sessions) {
      cache.sessions = normalizeArray(sessions);
      return enqueueWrite(() => upsertStore(STORE_KEYS.sessions, { sessions: cache.sessions }));
    },

    readRooms() {
      return cloneJson(cache.rooms);
    },

    writeRooms(rooms) {
      cache.rooms = normalizeArray(rooms);
      return enqueueWrite(() => upsertStore(STORE_KEYS.rooms, { rooms: cache.rooms }));
    },

    appendServerError(lines) {
      const entry = {
        createdAt: new Date().toISOString(),
        lines
      };

      return enqueueWrite(async () => {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS server_errors (
            id BIGSERIAL PRIMARY KEY,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            entry JSONB NOT NULL
          )
        `);
        await pool.query("INSERT INTO server_errors (entry) VALUES ($1::jsonb)", [JSON.stringify(entry)]);
      });
    },

    waitForIdle() {
      return writeQueue;
    },

    async close() {
      await writeQueue;
      await pool.end();
    }
  };
}

function createStorage(options) {
  if (process.env.DATABASE_URL) {
    return createPostgresStorage({
      ...options,
      databaseUrl: process.env.DATABASE_URL
    });
  }

  return createJsonStorage(options);
}

module.exports = {
  createStorage
};
