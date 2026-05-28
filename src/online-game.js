(() => {
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
    const { room, playerIndex, resultPanel, resultTitle, resultSummary, onComplete } = state;
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

    resultSummary.textContent = `Счет: ${room.game.scores[0]}-${room.game.scores[1]}. Ходы: ${room.game.moves}.`;
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
    resultPanel.classList.remove("is-visible");
    resultPanel.setAttribute("aria-hidden", "true");
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
      }, 900);
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

    function start(room, playerToken) {
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
        cardElements: [],
        resultHandled: false,
        onComplete
      };

      renderRoom(room);
      startPolling();
      onStateChange?.("onlineGame", getSnapshot());
    }

    async function resumeActive() {
      const data = await requestJson("/api/online/active");

      if (!data.room || !data.playerToken) {
        return false;
      }

      start(data.room, data.playerToken);
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
        onlinePlayerToken: state.playerToken
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
      replayButton.onclick = onBackToLobby;
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
