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
      roomPassword,
      roomCode,
      status,
      createPrivateButton,
      joinPrivateButton,
      logoutButton,
      soloButton
    } = elements;
    let selectedPublicRoomName = "";
    let selectedPublicRoomLevel = "";
    let selectedPublicRoomId = "";

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
        selectedPublicRoomLevel,
        privateRoomName: roomName?.value.trim() || "",
        privateRoomLevel: roomLevel?.value || DEFAULT_PRIVATE_LEVEL
      };
    }

    function restore(state = {}) {
      selectedPublicRoomId = state.selectedPublicRoomId || "";
      selectedPublicRoomName = state.selectedPublicRoomName || "";
      selectedPublicRoomLevel = state.selectedPublicRoomLevel || "";

      if (roomName) {
        roomName.value = state.privateRoomName || "";
      }

      if (roomLevel && (state.privateRoomLevel || state.onlineRoomLevel)) {
        roomLevel.value = state.privateRoomLevel || state.onlineRoomLevel;
      }

      roomList?.querySelectorAll(".online-room-card").forEach((button) => {
        const isSelected = button.dataset.roomName === selectedPublicRoomName
          && button.dataset.roomLevel === selectedPublicRoomLevel;

        button.classList.toggle("is-selected", isSelected);
      });
    }

    async function refreshRooms() {
      try {
        const data = await requestJson("/api/online/rooms");
        const roomsByKey = new Map(data.rooms.map((room) => [`${room.level}:${room.name}`, room]));

        roomList?.querySelectorAll(".online-room-card").forEach((button) => {
          const room = roomsByKey.get(`${button.dataset.roomLevel}:${button.dataset.roomName}`);
          const players = room?.players?.length || 0;

          button.dataset.roomId = room?.id || "";
          button.classList.toggle("is-busy", room?.status === "playing");
          button.title = room?.status === "playing" ? "Партия уже идет" : `${players}/2 игроков`;
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

    async function createPrivateRoom() {
      const privateRoomName = roomName.value.trim() || "Приватная комната";
      const privateRoomLevel = roomLevel.value;
      const password = roomPassword.value.trim();

      if (!password) {
        setStatus("Введите пароль для приватной комнаты.");
        roomPassword.focus();
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

      setStatus(`Приватная комната «${data.room.name}» создана. Код: ${data.room.code}.`);
      save({ privateRoomCode: data.room.code });
      onRoomJoined?.(data.room, data.playerToken);
    }

    async function joinPrivateRoom() {
      const code = roomCode.value.trim();
      const password = roomPassword.value.trim();

      if (!code || !password) {
        setStatus("Введите код и пароль приватной комнаты.");
        (code ? roomPassword : roomCode).focus();
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

    function init() {
      soloButton?.addEventListener("click", onShowSolo);
      logoutButton?.addEventListener("click", onLogout);

      roomList?.addEventListener("click", (event) => {
        const roomButton = event.target.closest(".online-room-card");

        if (!roomButton) {
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
      roomName?.addEventListener("input", () => save());
      roomLevel?.addEventListener("change", () => save());
      roomPassword?.addEventListener("input", () => save());
      roomCode?.addEventListener("input", () => save());
      refreshRooms();
    }

    return {
      getSnapshot,
      init,
      refreshRooms,
      restore
    };
  }

  window.ChessLegendsOnlineLobby = {
    createOnlineLobbyController
  };
})();
