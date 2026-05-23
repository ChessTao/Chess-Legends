const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = path.resolve(__dirname);
const port = Number(process.env.PORT) || 4173;
const host = process.env.HOST || (process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1");
const runtimeDir = path.join(root, ".runtime");
const profilesFile = path.join(runtimeDir, "profiles.json");
const sessions = new Map();

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
  fs.writeFileSync(profilesFile, `${JSON.stringify({ profiles }, null, 2)}\n`);
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

async function handleApi(request, response, url) {
  if (request.method === "GET" && url.pathname === "/api/health") {
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
      sendJson(response, error.message === "Payload too large" ? 413 : 400, { error: error.message });
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
