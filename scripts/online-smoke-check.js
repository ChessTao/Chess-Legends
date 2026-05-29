const BASE_URL = process.env.TEST_BASE_URL || "http://127.0.0.1:4173";
const ROOM_PASSWORD = "room-pass";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
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
  assert(result.data.profile?.id, `${name}: profile id missing`);
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
      name: "Smoke room",
      level: "Начинающий",
      password: ROOM_PASSWORD
    }
  });

  assert(result.response.status === 201, `private room creation failed with ${result.response.status}`);
  assert(result.data.room?.id, "created room id missing");
  assert(result.data.room?.code, "created room code missing for creator");
  assert(result.data.playerToken, "creator player token missing");
  assert(result.data.room.status === "waiting", "created room should wait for opponent");

  return {
    room: result.data.room,
    playerToken: result.data.playerToken
  };
}

async function assertPrivateRoomHidden(roomId) {
  const result = await request("/api/online/rooms");

  assert(result.response.status === 200, `public room list failed with ${result.response.status}`);
  assert(Array.isArray(result.data.rooms), "public room list missing");
  assert(!result.data.rooms.some((room) => room.id === roomId), "private room leaked into public room list");
  assert(!result.data.rooms.some((room) => room.isPrivate), "public room list contains a private room");
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
  assert(result.data.room?.status === "playing", "room should start after second player joins");
  assert(result.data.room?.players?.length === 2, "joined room should have two players");
  assert(result.data.room?.game?.cards?.length > 0, "joined room game cards missing");
  assert(result.data.playerToken, "joiner player token missing");

  return {
    room: result.data.room,
    playerToken: result.data.playerToken
  };
}

async function getRoom(roomId, player) {
  const result = await request(`/api/online/rooms/${encodeURIComponent(roomId)}?token=${encodeURIComponent(player.playerToken)}`, {
    cookie: player.cookie
  });

  assert(result.response.status === 200, `room state failed with ${result.response.status}`);
  assert(result.data.room?.id === roomId, "room state id mismatch");

  return result.data.room;
}

async function reveal(roomId, player, index) {
  return request(`/api/online/rooms/${encodeURIComponent(roomId)}/reveal`, {
    method: "POST",
    cookie: player.cookie,
    body: {
      playerToken: player.playerToken,
      index
    }
  });
}

async function rematch(roomId, player) {
  return request(`/api/online/rooms/${encodeURIComponent(roomId)}/rematch`, {
    method: "POST",
    cookie: player.cookie,
    body: {
      playerToken: player.playerToken
    }
  });
}

async function finishRoom(room, players) {
  let currentRoom = room;

  while (currentRoom.status !== "finished") {
    const openCard = currentRoom.game.cards.find((card) => card.isOpen && !card.isMatched);
    const currentPlayer = players.find((player) => player.playerIndex === currentRoom.game.turnIndex);

    assert(currentPlayer, "current online player should be known");

    if (openCard) {
      const mateIndex = currentRoom.game.cards.findIndex((card) => {
        return !card.isOpen && !card.isMatched && card.pairId === openCard.pairId;
      });

      assert(mateIndex >= 0, "open card should have a closed mate");
      const result = await reveal(currentRoom.id, currentPlayer, mateIndex);

      assert(result.response.status === 200, `mate finishing reveal failed with ${result.response.status}`);
      currentRoom = result.data.room;
      continue;
    }

    const pairs = new Map();

    currentRoom.game.cards.forEach((card, index) => {
      if (card.isMatched) {
        return;
      }

      const indexes = pairs.get(card.pairId) || [];
      indexes.push(index);
      pairs.set(card.pairId, indexes);
    });

    const pairIndexes = [...pairs.values()].find((indexes) => indexes.length >= 2);

    assert(pairIndexes, "unfinished room should contain a revealable pair");

    let result = await reveal(currentRoom.id, currentPlayer, pairIndexes[0]);
    assert(result.response.status === 200, `first finishing reveal failed with ${result.response.status}`);
    currentRoom = result.data.room;

    result = await reveal(currentRoom.id, currentPlayer, pairIndexes[1]);
    assert(result.response.status === 200, `second finishing reveal failed with ${result.response.status}`);
    currentRoom = result.data.room;
  }

  return currentRoom;
}

async function assertRematchStarts(roomId, players) {
  const firstResult = await rematch(roomId, players[0]);

  assert(firstResult.response.status === 200, `first rematch failed with ${firstResult.response.status}`);
  assert(firstResult.data.room?.status === "waiting", "first rematch should wait for second player");
  players[0].playerToken = firstResult.data.playerToken;
  players[0].playerIndex = firstResult.data.room.playerIndex;

  const secondResult = await rematch(roomId, players[1]);

  assert(secondResult.response.status === 200, `second rematch failed with ${secondResult.response.status}`);
  assert(secondResult.data.room?.status === "playing", "second rematch should start game");
  players[1].playerToken = secondResult.data.playerToken;
  players[1].playerIndex = secondResult.data.room.playerIndex;

  const retryResult = await rematch(roomId, players[0]);

  assert(retryResult.response.status === 200, `idempotent rematch retry failed with ${retryResult.response.status}`);
  assert(retryResult.data.room?.status === "playing", "idempotent rematch retry should return active game");
  players[0].playerToken = retryResult.data.playerToken;
  players[0].playerIndex = retryResult.data.room.playerIndex;

  return retryResult.data.room;
}

async function assertWrongTurnRejected(room, players) {
  const wrongPlayer = players.find((player) => player.playerIndex !== room.game.turnIndex);
  const result = await reveal(room.id, wrongPlayer, 0);

  assert(result.response.status === 409, `wrong turn should be rejected, got ${result.response.status}`);
}

async function assertCurrentPlayerCanReveal(room, players) {
  const currentPlayer = players.find((player) => player.playerIndex === room.game.turnIndex);
  const result = await reveal(room.id, currentPlayer, 0);

  assert(result.response.status === 200, `valid reveal failed with ${result.response.status}`);
  assert(result.data.room?.game?.cards?.[0]?.isOpen === true, "revealed card should be open");

  return result.data.room;
}

async function assertActiveRoomRestores(player, roomId) {
  const result = await request("/api/online/active", {
    cookie: player.cookie
  });

  assert(result.response.status === 200, `active room lookup failed with ${result.response.status}`);
  assert(result.data.room?.id === roomId, "active room id mismatch");
  assert(result.data.playerToken, "active room player token missing");
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
  const playerA = await registerPlayer(`Smoke A ${suffix}`);
  const playerB = await registerPlayer(`Smoke B ${suffix}`);

  const created = await createPrivateRoom(playerA);
  await assertPrivateRoomHidden(created.room.id);

  const joined = await joinPrivateRoom(playerB, created);
  const roomForA = await getRoom(created.room.id, {
    cookie: playerA.cookie,
    playerToken: created.playerToken
  });
  const roomForB = await getRoom(created.room.id, {
    cookie: playerB.cookie,
    playerToken: joined.playerToken
  });

  assert(roomForA.game.cards.length === roomForB.game.cards.length, "players see different deck sizes");

  const players = [
    {
      cookie: playerA.cookie,
      playerToken: created.playerToken,
      playerIndex: roomForA.playerIndex
    },
    {
      cookie: playerB.cookie,
      playerToken: joined.playerToken,
      playerIndex: roomForB.playerIndex
    }
  ];

  await assertWrongTurnRejected(roomForA, players);
  const updatedRoom = await assertCurrentPlayerCanReveal(roomForA, players);

  await assertActiveRoomRestores(playerA, updatedRoom.id);
  await assertActiveRoomRestores(playerB, updatedRoom.id);

  const finishedRoom = await finishRoom(updatedRoom, players);
  const rematchRoom = await assertRematchStarts(finishedRoom.id, players);

  await leaveRoom(rematchRoom.id, players[0]);
  await leaveRoom(rematchRoom.id, players[1]);

  console.log("Online smoke/e2e check passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
