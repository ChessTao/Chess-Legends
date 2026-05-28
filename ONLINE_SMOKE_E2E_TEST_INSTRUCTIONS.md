# Инструкция: сетевой smoke/e2e тест

Цель теста: автоматически проверить, что два игрока могут пройти базовый онлайн-сценарий через серверные API.

Этот тест можно делать локально, даже если проект еще не опубликован в интернете.

## Что проверяет тест

Минимальный сценарий:

1. Запущен локальный сервер игры.
2. Скрипт регистрирует игрока A.
3. Скрипт регистрирует игрока B.
4. Скрипт сохраняет cookies обоих игроков.
5. Игрок A создает приватную комнату.
6. Игрок B входит в комнату по коду и паролю.
7. Сервер запускает общую онлайн-партию.
8. Игроки получают состояние одной и той же комнаты.
9. Сервер не разрешает ходить не в свой ход.
10. Сервер принимает корректный ход текущего игрока.

Позже тест можно расширить до полного завершения партии и проверки рейтинга.

## Где создать файл теста

Создать новый файл:

```text
scripts/online-smoke-check.js
```

## Как запускать сервер перед тестом

В одном терминале:

```bash
npm.cmd start
```

Сервер должен быть доступен по адресу:

```text
http://127.0.0.1:4173
```

Во втором терминале запускать тест:

```bash
node scripts/online-smoke-check.js
```

## Базовая структура теста

Тест должен иметь несколько маленьких helper-функций:

```js
const BASE_URL = process.env.TEST_BASE_URL || "http://127.0.0.1:4173";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.cookie ? { Cookie: options.cookie } : {}),
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));

  return {
    response,
    data,
    cookie: response.headers.get("set-cookie") || ""
  };
}
```

## Шаг 1. Зарегистрировать двух игроков

```js
async function registerPlayer(name) {
  const password = "test-password";
  const result = await request("/api/register", {
    method: "POST",
    body: JSON.stringify({
      name,
      password,
      country: "Hungary",
      profile: { name, country: "Hungary" }
    })
  });

  assert(result.response.status === 201, `${name}: registration failed`);
  assert(result.data.profile?.id, `${name}: profile id missing`);
  assert(result.cookie.includes("chess_legends_session="), `${name}: session cookie missing`);

  return {
    profile: result.data.profile,
    cookie: result.cookie.split(";")[0],
    password
  };
}
```

Важно: имена игроков должны быть уникальными при каждом запуске, например:

```js
const suffix = Date.now();
const playerA = await registerPlayer(`Smoke A ${suffix}`);
const playerB = await registerPlayer(`Smoke B ${suffix}`);
```

## Шаг 2. Создать приватную комнату игроком A

```js
async function createPrivateRoom(player) {
  const result = await request("/api/online/rooms/private", {
    method: "POST",
    cookie: player.cookie,
    body: JSON.stringify({
      name: "Smoke room",
      level: "Начинающий",
      password: "room-pass"
    })
  });

  assert(result.response.status === 201, "private room creation failed");
  assert(result.data.room?.id, "room id missing");
  assert(result.data.room?.code, "private room code missing for creator");
  assert(result.data.playerToken, "creator player token missing");

  return {
    room: result.data.room,
    playerToken: result.data.playerToken,
    password: "room-pass"
  };
}
```

## Шаг 3. Войти в комнату игроком B

```js
async function joinPrivateRoom(player, roomInfo) {
  const result = await request("/api/online/rooms/private/join", {
    method: "POST",
    cookie: player.cookie,
    body: JSON.stringify({
      code: roomInfo.room.code,
      password: roomInfo.password
    })
  });

  assert(result.response.status === 200, "private room join failed");
  assert(result.data.room?.status === "playing", "room should start playing after second player joins");
  assert(result.data.room?.players?.length === 2, "room should have two players");
  assert(result.data.playerToken, "second player token missing");

  return {
    room: result.data.room,
    playerToken: result.data.playerToken
  };
}
```

## Шаг 4. Проверить, что приватные комнаты не видны в публичном списке

```js
async function assertPrivateRoomHidden(roomId) {
  const result = await request("/api/online/rooms");

  assert(result.response.status === 200, "public rooms list failed");
  assert(Array.isArray(result.data.rooms), "rooms list missing");
  assert(!result.data.rooms.some((room) => room.id === roomId), "private room leaked into public room list");
}
```

## Шаг 5. Проверить запрет хода не в свой ход

После входа второго игрока партия начинается. Обычно первый ход у игрока с `playerIndex === 0`.

```js
async function assertWrongTurnRejected(room, player) {
  const wrongTurnResult = await request(`/api/online/rooms/${encodeURIComponent(room.id)}/reveal`, {
    method: "POST",
    cookie: player.cookie,
    body: JSON.stringify({
      playerToken: player.playerToken,
      index: 0
    })
  });

  assert(wrongTurnResult.response.status === 409, "wrong turn should be rejected");
}
```

## Шаг 6. Сделать корректный ход

```js
async function revealOneCard(room, player) {
  const result = await request(`/api/online/rooms/${encodeURIComponent(room.id)}/reveal`, {
    method: "POST",
    cookie: player.cookie,
    body: JSON.stringify({
      playerToken: player.playerToken,
      index: 0
    })
  });

  assert(result.response.status === 200, "valid reveal failed");
  assert(result.data.room?.game?.cards?.[0]?.isOpen === true, "card should be open after reveal");

  return result.data.room;
}
```

## Полный минимальный скрипт

В конце файла:

```js
async function main() {
  const suffix = Date.now();
  const playerA = await registerPlayer(`Smoke A ${suffix}`);
  const playerB = await registerPlayer(`Smoke B ${suffix}`);

  const created = await createPrivateRoom(playerA);
  await assertPrivateRoomHidden(created.room.id);

  const joined = await joinPrivateRoom(playerB, created);
  const room = joined.room;

  const playerAInRoom = {
    cookie: playerA.cookie,
    playerToken: created.playerToken
  };
  const playerBInRoom = {
    cookie: playerB.cookie,
    playerToken: joined.playerToken
  };

  if (room.playerIndex === 1) {
    await assertWrongTurnRejected(room, playerBInRoom);
    await revealOneCard(room, playerAInRoom);
  } else {
    await assertWrongTurnRejected(room, playerBInRoom);
    await revealOneCard(room, playerAInRoom);
  }

  console.log("Online smoke/e2e check passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

Примечание: если сервер когда-нибудь начнет назначать первый ход иначе, проверку хода нужно строить по `room.game.turnIndex`.

## Как добавить в package.json

В `package.json` можно добавить отдельную команду:

```json
"online-smoke": "node scripts/online-smoke-check.js"
```

Тогда запуск будет:

```bash
npm.cmd run online-smoke
```

## Как запускать против опубликованного сайта

Когда проект будет в интернете, можно не менять код теста, а передать другой адрес:

```bash
$env:TEST_BASE_URL="https://your-domain.example"; node scripts/online-smoke-check.js
```

Такой же тест проверит уже настоящий сервер.

## Что тест не проверяет

Этот тест не проверяет:

- красоту интерфейса;
- мобильную верстку;
- удобство кликов;
- читаемость сообщений;
- реальные браузерные состояния.

Это остается за ручной проверкой из пункта 1 файла `Last preparations for online.md`.

