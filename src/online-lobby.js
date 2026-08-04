(() => {
  const DEFAULT_PRIVATE_LEVEL = "Начинающий";

  async function requestJson(path, payload = null) {
    const response = await fetch(path, {
      method: payload ? "POST" : "GET",
      headers: payload ? { "Content-Type": "application/json" } : {},
      body: payload ? JSON.stringify(payload) : null
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || "Сетевая ошибка.");
    }

    return data;
  }

  function createOnlineLobbyController({ elements, getProfile, onLogout, onRoomJoined, onShowSolo, onStateChange }) {
    const {
      roomList,
      roomName,
      roomLevel,
      createPassword,
      joinPassword,
      roomCode,
      status,
      createPrivateButton,
      joinPrivateButton,
      spectatePrivateButton,
      logoutButton,
      soloButton
    } = elements;
    let selectedPublicRoomName = "";
    let selectedPublicRoomLevel = "";
    let selectedPublicRoomId = "";
    let refreshTimerId = 0;

    function setStatus(message) {
      if (status) {
        status.textContent = message;
      }
    }

    function save(extraState = {}) {
      onStateChange?.("online", {
        ...getSnapshot(),
        ...extraState
      });
    }

    function getSnapshot() {
      return {
        selectedPublicRoomId,
        selectedPublicRoomName,
        selectedPublicRoomLevel
      };
    }

    function restore(state = {}) {
      selectedPublicRoomId = state.selectedPublicRoomId || "";
      selectedPublicRoomName = state.selectedPublicRoomName || "";
      selectedPublicRoomLevel = state.selectedPublicRoomLevel || "";

      resetPrivateFields();

      roomList?.querySelectorAll(".online-room-card").forEach((button) => {
        const isSelected = button.dataset.roomName === selectedPublicRoomName
          && button.dataset.roomLevel === selectedPublicRoomLevel;

        button.classList.toggle("is-selected", isSelected);
      });
    }

    function resetPrivateFields() {
      roomName && (roomName.value = "");
      createPassword && (createPassword.value = "");
      joinPassword && (joinPassword.value = "");
      roomCode && (roomCode.value = "");
      roomLevel && (roomLevel.value = DEFAULT_PRIVATE_LEVEL);
    }

    function getRoomState(room, players) {
      if (room?.status === "playing") {
        return {
          label: "Смотреть",
          title: "Партия уже идет. Нажмите, чтобы наблюдать.",
          className: "is-busy"
        };
      }

      if (players === 1) {
        const playerName = room.players?.[0]?.name || "игрок";

        return {
          label: "Ждет 1/2",
          title: `В комнате ждет ${playerName}`,
          className: "is-waiting"
        };
      }

      return {
        label: "Свободно",
        title: "Свободная комната",
        className: "is-free"
      };
    }

    function ensureRoomStateBadge(button) {
      let badge = button.querySelector(".online-room-state");

      if (!badge) {
        badge = document.createElement("span");
        badge.className = "online-room-state";
        button.append(badge);
      }

      return badge;
    }

    function buildPrivateInviteText(room, password) {
      return [
        `Код входа: ${room.code}`,
        `Пароль: ${password}`
      ].join("\n");
    }

    async function refreshRooms() {
      try {
        const data = await requestJson("/api/online/rooms");
        const roomsByKey = new Map(data.rooms.map((room) => [`${room.level}:${room.name}`, room]));

        roomList?.querySelectorAll(".online-room-card").forEach((button) => {
          const room = roomsByKey.get(`${button.dataset.roomLevel}:${button.dataset.roomName}`);
          const players = room?.players?.length || 0;
          const state = getRoomState(room, players);
          const badge = ensureRoomStateBadge(button);

          button.dataset.roomId = room?.id || "";
          button.dataset.roomPlayers = String(players);
          button.classList.toggle("is-free", state.className === "is-free");
          button.classList.toggle("is-waiting", state.className === "is-waiting");
          button.classList.toggle("is-busy", state.className === "is-busy");
          button.title = state.title;
          button.setAttribute("aria-label", `${button.dataset.roomName}: ${state.title}`);
          badge.textContent = state.label;
        });
      } catch {
        setStatus("Не удалось обновить список комнат. Проверьте, запущен ли сервер.");
      }
    }

    async function joinSelectedPublicRoom(roomButton) {
      selectedPublicRoomId = roomButton.dataset.roomId || "";
      selectedPublicRoomName = roomButton.dataset.roomName || "комната";
      selectedPublicRoomLevel = roomButton.dataset.roomLevel || DEFAULT_PRIVATE_LEVEL;

      roomList.querySelectorAll(".online-room-card").forEach((button) => {
        button.classList.toggle("is-selected", button === roomButton);
      });

      setStatus(`Подключаемся к комнате «${selectedPublicRoomName}»...`);
      save();

      const data = await requestJson("/api/online/rooms/join", {
        id: selectedPublicRoomId,
        name: selectedPublicRoomName,
        level: selectedPublicRoomLevel,
        profile: getProfile()
      });

      setStatus(data.room.status === "waiting"
        ? `Комната «${data.room.name}» создана. Ждем второго игрока.`
        : `Партия в комнате «${data.room.name}» началась.`);
      onRoomJoined?.(data.room, data.playerToken);
    }

    async function spectatePublicRoom(roomButton) {
      const roomId = roomButton.dataset.roomId || "";
      const roomName = roomButton.dataset.roomName || "комната";

      if (!roomId) {
        setStatus("Комната пока не готова для просмотра.");
        return;
      }

      setStatus(`Заглядываем в комнату «${roomName}»...`);
      const data = await requestJson(`/api/online/rooms/${encodeURIComponent(roomId)}/spectate`);

      setStatus(`Вы наблюдаете за партией в комнате «${data.room.name}».`);
      onRoomJoined?.(data.room, "", {
        spectator: true,
        spectatorToken: data.spectatorToken || ""
      });
    }

    async function createPrivateRoom() {
      const privateRoomName = roomName.value.trim();
      const privateRoomLevel = roomLevel.value;
      const password = createPassword.value.trim();

      if (!privateRoomName) {
        setStatus("Введите название приватной комнаты.");
        roomName.focus();
        save();
        return;
      }

      if (!password) {
        setStatus("Придумайте пароль для приглашения. Его нужно передать сопернику вместе с кодом.");
        createPassword.focus();
        save();
        return;
      }

      setStatus("Создаем приватную комнату...");

      const data = await requestJson("/api/online/rooms/private", {
        name: privateRoomName,
        level: privateRoomLevel,
        password,
        profile: getProfile()
      });

      if (roomCode) {
        roomCode.value = data.room.code;
      }

      const privateInviteText = buildPrivateInviteText(data.room, password);

      setStatus(`Приватная комната «${data.room.name}» создана. Она не появится в списке: передайте сопернику код ${data.room.code} и пароль.`);
      save();
      onRoomJoined?.(data.room, data.playerToken, { privateInviteText });
    }

    async function joinPrivateRoom() {
      const code = roomCode.value.trim();
      const password = joinPassword.value.trim();

      if (!code || !password) {
        setStatus("Введите код входа и пароль, которые дал создатель комнаты.");
        (code ? joinPassword : roomCode).focus();
        return;
      }

      setStatus("Входим в приватную комнату...");

      const data = await requestJson("/api/online/rooms/private/join", {
        code,
        password,
        profile: getProfile()
      });

      setStatus(`Вы вошли в комнату «${data.room.name}».`);
      onRoomJoined?.(data.room, data.playerToken);
    }

    async function spectatePrivateRoom() {
      const code = roomCode.value.trim();
      const password = joinPassword.value.trim();

      if (!code || !password) {
        setStatus("Введите код входа и пароль, чтобы наблюдать за приватной партией.");
        (code ? joinPassword : roomCode).focus();
        return;
      }

      setStatus("Пробуем заглянуть в приватную комнату...");

      const data = await requestJson("/api/online/rooms/private/spectate", {
        code,
        password
      });

      setStatus(`Вы наблюдаете за партией в комнате «${data.room.name}».`);
      onRoomJoined?.(data.room, "", {
        spectator: true,
        spectatorToken: data.spectatorToken || ""
      });
    }

    function init() {
      soloButton?.addEventListener("click", onShowSolo);
      logoutButton?.addEventListener("click", onLogout);

      roomList?.addEventListener("click", (event) => {
        const roomButton = event.target.closest(".online-room-card");

        if (!roomButton) {
          return;
        }

        if (roomButton.classList.contains("is-busy")) {
          spectatePublicRoom(roomButton).catch((error) => {
            setStatus(error.message);
            refreshRooms();
          });
          return;
        }

        joinSelectedPublicRoom(roomButton).catch((error) => {
          setStatus(error.message);
          refreshRooms();
        });
      });

      createPrivateButton?.addEventListener("click", () => {
        createPrivateRoom().catch((error) => setStatus(error.message));
      });
      joinPrivateButton?.addEventListener("click", () => {
        joinPrivateRoom().catch((error) => setStatus(error.message));
      });
      spectatePrivateButton?.addEventListener("click", () => {
        spectatePrivateRoom().catch((error) => setStatus(error.message));
      });
      roomName?.addEventListener("input", () => save());
      roomLevel?.addEventListener("change", () => save());
      refreshRooms();
      if (!refreshTimerId) {
        refreshTimerId = window.setInterval(refreshRooms, 4000);
      }
    }

    return {
      getSnapshot,
      init,
      refreshRooms,
      resetPrivateFields,
      restore
    };
  }

  window.ChessLegendsOnlineLobby = {
    createOnlineLobbyController
  };
})();
