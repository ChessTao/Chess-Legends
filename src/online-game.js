(() => {
  const POLL_INTERVAL_MS = 280;
  let state = null;
  let pollId = null;

  function stopPolling() {
    window.clearInterval(pollId);
    pollId = null;
  }

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

  function createCard(card) {
    const button = document.createElement("button");

    button.className = "memory-card";
    button.type = "button";
    button.dataset.index = card.index;
    button.setAttribute("aria-label", "Закрытая карточка Memory");
    button.innerHTML = `
      <span class="card-back">♞</span>
      <span class="card-front">
        <img src="${card.photo}" alt="${card.surname}">
      </span>
    `;

    return button;
  }

  function getPlayerName(player, fallback) {
    return player?.name || fallback;
  }

  function renderScore() {
    const { room, playerIndex, scorePanel } = state;
    const opponentIndex = playerIndex === 0 ? 1 : 0;
    const currentPlayer = room.players[room.game.turnIndex];

    scorePanel.innerHTML = `
      <div class="score-card">
        <span class="score-label">Вы</span>
        <strong>${room.game.scores[playerIndex] || 0}</strong>
      </div>
      <div class="score-card">
        <span class="score-label">${getPlayerName(room.players[opponentIndex], "Соперник")}</span>
        <strong>${room.game.scores[opponentIndex] || 0}</strong>
      </div>
      <div class="score-card">
        <span class="score-label">Ход</span>
        <strong>${getPlayerName(currentPlayer, "Игрок")}</strong>
      </div>
    `;
  }

  function renderResult() {
    const { room, playerIndex, resultPanel, resultTitle, resultSummary, replayButton, changeSettingsButton, onComplete } = state;
    const winner = room.game.winner;

    if (room.status !== "finished") {
      resultPanel.classList.remove("is-visible");
      resultPanel.setAttribute("aria-hidden", "true");
      return;
    }

    if (winner === null) {
      resultTitle.textContent = "Ничья";
    } else if (winner === playerIndex) {
      resultTitle.textContent = "Вы выиграли";
    } else {
      resultTitle.textContent = "Вы проиграли";
    }

    state.resultBaseSummary = `Счет: ${room.game.scores[0]}-${room.game.scores[1]}. Ходы: ${room.game.moves}.`;
    resultSummary.textContent = state.resultBaseSummary;
    replayButton.disabled = false;
    replayButton.textContent = "Реванш";
    changeSettingsButton.textContent = "В лобби";
    resultPanel.classList.add("is-visible");
    resultPanel.setAttribute("aria-hidden", "false");
    if (!state.resultHandled) {
      state.resultHandled = true;
      onComplete?.();
    }
  }

  function renderBoard() {
    const { room, memoryBoard } = state;

    room.game.cards.forEach((card) => {
      const element = state.cardElements[card.index];

      element.classList.toggle("is-open", card.isOpen || card.isMatched);
      element.classList.toggle("is-matched", card.isMatched);
      element.disabled = card.isMatched || room.status === "finished" || room.game.turnIndex !== state.playerIndex;
      element.setAttribute(
        "aria-label",
        card.isOpen || card.isMatched ? `Открытая карточка: ${card.surname}` : "Закрытая карточка Memory"
      );
    });

    memoryBoard.classList.toggle("is-waiting-turn", room.game.turnIndex !== state.playerIndex);
  }

  function renderWaitingRoom() {
    const { room, gameChoice, scorePanel, memoryBoard, resultPanel } = state;

    gameChoice.textContent = `${room.name} / ${room.level} / ожидание соперника`;
    scorePanel.innerHTML = `
      <div class="score-card">
        <span class="score-label">Комната</span>
        <strong>${room.code || room.name}</strong>
      </div>
      <div class="score-card">
        <span class="score-label">Игроки</span>
        <strong>${room.players.length} / 2</strong>
      </div>
      <div class="score-card">
        <span class="score-label">Статус</span>
        <strong>Ожидание</strong>
      </div>
    `;
    memoryBoard.innerHTML = "";
    memoryBoard.style.removeProperty("width");
    memoryBoard.style.removeProperty("--columns");
    memoryBoard.style.removeProperty("--rows");
    delete memoryBoard.dataset.columns;
    delete memoryBoard.dataset.rows;
    delete memoryBoard.dataset.size;
    memoryBoard.classList.remove("is-waiting-turn");
    renderWaitingInvite();
    resultPanel.classList.remove("is-visible");
    resultPanel.setAttribute("aria-hidden", "true");
  }

  function renderWaitingInvite() {
    const { room, memoryBoard } = state;

    if (!room.isPrivate) {
      const note = document.createElement("div");

      note.className = "waiting-room-note";
      note.textContent = "Ожидаем второго игрока в открытой комнате.";
      memoryBoard.append(note);
      return;
    }

    const panel = document.createElement("section");
    const title = document.createElement("h3");
    const textarea = document.createElement("textarea");
    const button = document.createElement("button");
    const inviteText = state.privateInviteText || [
      `Код входа: ${room.code}`,
      "Пароль: пароль, который придумал создатель"
    ].join("\n");

    panel.className = "waiting-invite";
    title.textContent = "Приглашение для соперника";
    textarea.readOnly = true;
    textarea.rows = 2;
    textarea.value = inviteText;
    button.className = "copy-invite-button";
    button.type = "button";
    button.textContent = "Копировать приглашение";
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(textarea.value);
        button.textContent = "Скопировано";
      } catch {
        textarea.focus();
        textarea.select();
        button.textContent = "Нажмите Ctrl+C";
      }
    });

    panel.append(title, textarea, button);
    memoryBoard.append(panel);
  }

  function renderRoom(room) {
    state.room = room;

    if (!room.game) {
      renderWaitingRoom();
      return;
    }

    const { gameChoice, memoryBoard } = state;
    const columns = state.difficultySettings[room.level]?.columns || 4;
    const rows = Math.ceil(room.game.cards.length / columns);

    gameChoice.textContent = `${room.name} / Сетевая игра / ${room.level}`;
    memoryBoard.style.setProperty("--columns", columns);
    memoryBoard.style.setProperty("--rows", rows);
    memoryBoard.dataset.columns = columns;
    memoryBoard.dataset.rows = rows;
    memoryBoard.dataset.size = room.game.cards.length > 16 ? "large" : "regular";

    if (memoryBoard.children.length !== room.game.cards.length) {
      memoryBoard.innerHTML = "";
      room.game.cards.forEach((card) => memoryBoard.append(createCard(card)));
      state.cardElements = [...memoryBoard.querySelectorAll(".memory-card")];
    }

    renderScore();
    renderBoard();
    renderResult();
    window.ChessLegendsBoardFit?.scheduleMemoryBoardFit(memoryBoard);
  }

  function createOnlineGameController({ elements, difficultySettings, onBackToLobby, onComplete, onStateChange }) {
    const {
      gameChoice,
      scorePanel,
      memoryBoard,
      resultPanel,
      resultTitle,
      resultSummary,
      replayButton,
      changeSettingsButton
    } = elements;

    async function requestRematch() {
      if (!state) {
        return;
      }

      replayButton.disabled = true;
      replayButton.textContent = "Ждем...";

      try {
        const data = await requestJson(`/api/online/rooms/${encodeURIComponent(state.room.id)}/rematch`, {
          playerToken: state.playerToken
        });

        state.playerToken = data.playerToken;
        state.playerIndex = data.room.playerIndex || 0;
        state.cardElements = [];
        state.resultHandled = false;
        renderRoom(data.room);
        startPolling();
        onStateChange?.("onlineGame", getSnapshot());
      } catch (error) {
        const message = /not found|не найд/i.test(error.message || "")
          ? "Комната не найдена на сервере. Вернитесь в лобби и создайте новую партию."
          : error.message || "Не удалось начать реванш.";

        replayButton.disabled = false;
        replayButton.textContent = "Реванш";
        resultSummary.textContent = `${state.resultBaseSummary || ""} ${message}`.trim();
      }
    }

    async function pollRoom() {
      if (!state) {
        return;
      }

      const data = await requestJson(`/api/online/rooms/${encodeURIComponent(state.room.id)}?token=${encodeURIComponent(state.playerToken)}`);

      renderRoom(data.room);
      onStateChange?.("onlineGame", getSnapshot());

      if (data.room.status === "finished") {
        stopPolling();
      }
    }

    function startPolling() {
      stopPolling();
      pollId = window.setInterval(() => {
        pollRoom().catch(() => {});
      }, POLL_INTERVAL_MS);
    }

    async function revealCard(index) {
      if (!state || state.room.status !== "playing" || state.room.game.turnIndex !== state.playerIndex) {
        return;
      }

      const data = await requestJson(`/api/online/rooms/${encodeURIComponent(state.room.id)}/reveal`, {
        playerToken: state.playerToken,
        index
      });

      renderRoom(data.room);
    }

    function start(room, playerToken, options = {}) {
      stop();
      state = {
        room,
        playerToken,
        playerIndex: room.playerIndex || 0,
        difficultySettings,
        gameChoice,
        scorePanel,
        memoryBoard,
        resultPanel,
        resultTitle,
        resultSummary,
        replayButton,
        changeSettingsButton,
        cardElements: [],
        resultHandled: false,
        resultBaseSummary: "",
        privateInviteText: options.privateInviteText || "",
        onComplete
      };

      renderRoom(room);
      startPolling();
      onStateChange?.("onlineGame", getSnapshot());
    }

    async function resumeActive(options = {}) {
      const data = await requestJson("/api/online/active");

      if (!data.room || !data.playerToken) {
        return false;
      }

      start(data.room, data.playerToken, options);
      return true;
    }

    function stop(options = {}) {
      const previousState = state;

      stopPolling();
      if (previousState && options.leave !== false) {
        requestJson(`/api/online/rooms/${encodeURIComponent(previousState.room.id)}/leave`, {
          playerToken: previousState.playerToken
        }).catch(() => {});
      }

      state = null;
    }

    function getSnapshot() {
      return state ? {
        onlineRoomId: state.room.id,
        onlinePlayerToken: state.playerToken,
        privateInviteText: state.privateInviteText || ""
      } : {};
    }

    function isActive() {
      return Boolean(state);
    }

    function handleBoardClick(event) {
      const button = event.target.closest(".memory-card");

      if (button) {
        revealCard(Number(button.dataset.index)).catch(() => {});
      }
    }

    function init() {
      memoryBoard.addEventListener("click", handleBoardClick);
      replayButton.onclick = requestRematch;
      changeSettingsButton.onclick = onBackToLobby;
    }

    return {
      getSnapshot,
      init,
      isActive,
      resumeActive,
      start,
      stop
    };
  }

  window.ChessLegendsOnlineGame = {
    createOnlineGameController
  };
})();
