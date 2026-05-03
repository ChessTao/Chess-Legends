(() => {
  let state = null;
  let timerId = null;

  function formatTime(totalSeconds) {
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");

    return `${minutes}:${seconds}`;
  }

  function stopTimer() {
    window.clearInterval(timerId);
    timerId = null;
  }

  function startTimer() {
    stopTimer();

    timerId = window.setInterval(() => {
      if (!state || state.isComplete) {
        stopTimer();
        return;
      }

      state.seconds += 1;
      updateScorePanel();
    }, 1000);
  }

  function createCard(card, index) {
    const button = document.createElement("button");

    button.className = "memory-card";
    button.type = "button";
    button.dataset.index = index;
    button.setAttribute("aria-label", "Закрытая карточка Memory");

    if (card.type === "photo") {
      button.innerHTML = `
        <span class="card-back">♞</span>
        <span class="card-front">
          <img src="${card.photo}" alt="${card.surname}">
        </span>
      `;
    } else {
      button.innerHTML = `
        <span class="card-back">♞</span>
        <span class="card-front name-card">${card.surname}</span>
      `;
    }

    return button;
  }

  function buildDeck(settings, legends, difficultySettings, shuffle) {
    const { pairs } = difficultySettings[settings.difficulty];
    const selectedLegends = shuffle(legends).slice(0, pairs);

    if (settings.cardType === "Фото - фамилия") {
      return shuffle(selectedLegends.flatMap((legend, pairId) => [
        { ...legend, pairId, type: "photo" },
        { ...legend, pairId, type: "name" }
      ]));
    }

    return shuffle(selectedLegends.flatMap((legend, pairId) => [
      { ...legend, pairId, type: "photo" },
      { ...legend, pairId, type: "photo" }
    ]));
  }

  function updateScorePanel() {
    const { scorePanel, settings, difficultySettings, matchedPairs, moves, seconds, scores, currentPlayer } = state;
    const { pairs } = difficultySettings[settings.difficulty];

    if (settings.mode === "Два игрока") {
      scorePanel.innerHTML = `
        <div class="score-card${currentPlayer === 0 ? " is-current" : ""}">
          <span class="score-label">Игрок 1</span>
          <strong>${scores[0]}</strong>
        </div>
        <div class="score-card${currentPlayer === 1 ? " is-current" : ""}">
          <span class="score-label">Игрок 2</span>
          <strong>${scores[1]}</strong>
        </div>
        <div class="score-card">
          <span class="score-label">Ход</span>
          <strong>Игрок ${currentPlayer + 1}</strong>
        </div>
        <div class="score-card">
          <span class="score-label">Ходы</span>
          <strong>${moves}</strong>
        </div>
      `;
      return;
    }

    scorePanel.innerHTML = `
      <div class="score-card">
        <span class="score-label">Время</span>
        <strong>${formatTime(seconds)}</strong>
      </div>
      <div class="score-card">
        <span class="score-label">Ходы</span>
        <strong>${moves}</strong>
      </div>
      <div class="score-card">
        <span class="score-label">Пары</span>
        <strong>${matchedPairs} / ${pairs}</strong>
      </div>
    `;
  }

  function setCardOpen(index, isOpen) {
    const cardElement = state.cardElements[index];
    const card = state.cards[index];

    cardElement.classList.toggle("is-open", isOpen);
    cardElement.setAttribute(
      "aria-label",
      isOpen ? `Открыта карточка: ${card.surname}` : "Закрытая карточка Memory"
    );
  }

  function setCardMatched(index) {
    const cardElement = state.cardElements[index];

    cardElement.classList.add("is-matched");
    cardElement.disabled = true;
    cardElement.setAttribute("aria-label", "Найденная пара");
  }

  function showResult() {
    const { resultPanel, resultTitle, resultSummary, settings, scores, moves, seconds } = state;

    stopTimer();
    state.isComplete = true;

    if (settings.mode === "Два игрока") {
      const resultText = scores[0] === scores[1]
        ? "Ничья"
        : `Победил Игрок ${scores[0] > scores[1] ? 1 : 2}`;

      resultTitle.textContent = resultText;
      resultSummary.textContent = `Счет ${scores[0]}:${scores[1]}, всего ходов: ${moves}.`;
    } else {
      resultTitle.textContent = "Все пары найдены";
      resultSummary.textContent = `Время: ${formatTime(seconds)}. Ходы: ${moves}.`;
    }

    resultPanel.classList.add("is-visible");
    resultPanel.setAttribute("aria-hidden", "false");
  }

  function handleMatchedPair(firstIndex, secondIndex) {
    state.matchedPairs += 1;

    setCardMatched(firstIndex);
    setCardMatched(secondIndex);

    if (state.settings.mode === "Два игрока") {
      state.scores[state.currentPlayer] += 1;
    }

    state.openCards = [];
    state.isLocked = false;
    updateScorePanel();

    if (state.matchedPairs === state.difficultySettings[state.settings.difficulty].pairs) {
      showResult();
    }
  }

  function handleMismatchedPair(firstIndex, secondIndex) {
    const activeState = state;

    window.setTimeout(() => {
      if (state !== activeState) {
        return;
      }

      setCardOpen(firstIndex, false);
      setCardOpen(secondIndex, false);

      if (state.settings.mode === "Два игрока") {
        state.currentPlayer = state.currentPlayer === 0 ? 1 : 0;
      }

      state.openCards = [];
      state.isLocked = false;
      updateScorePanel();
    }, 850);
  }

  function handleCardClick(event) {
    const button = event.target.closest(".memory-card");

    if (!button || !state || state.isLocked || state.isComplete) {
      return;
    }

    const index = Number(button.dataset.index);

    if (state.openCards.includes(index) || state.cards[index].isMatched) {
      return;
    }

    if (!timerId && state.settings.mode === "Один игрок") {
      startTimer();
    }

    setCardOpen(index, true);
    state.openCards.push(index);

    if (state.openCards.length < 2) {
      return;
    }

    state.moves += 1;
    state.isLocked = true;

    const [firstIndex, secondIndex] = state.openCards;
    const firstCard = state.cards[firstIndex];
    const secondCard = state.cards[secondIndex];

    if (firstCard.pairId === secondCard.pairId) {
      firstCard.isMatched = true;
      secondCard.isMatched = true;
      const activeState = state;

      window.setTimeout(() => {
        if (state === activeState) {
          handleMatchedPair(firstIndex, secondIndex);
        }
      }, 260);
    } else {
      updateScorePanel();
      handleMismatchedPair(firstIndex, secondIndex);
    }
  }

  function hideResultPanel(resultPanel) {
    resultPanel.classList.remove("is-visible");
    resultPanel.setAttribute("aria-hidden", "true");
  }

  function renderGamePreview(options) {
    const {
      settings,
      legends,
      difficultySettings,
      gameChoice,
      scorePanel,
      memoryBoard,
      resultPanel,
      resultTitle,
      resultSummary,
      replayButton,
      changeSettingsButton,
      showSetup,
      shuffle
    } = options;
    const { pairs, columns } = difficultySettings[settings.difficulty];
    const cards = buildDeck(settings, legends, difficultySettings, shuffle);
    const rows = Math.ceil(cards.length / columns);

    stopTimer();
    gameChoice.textContent = `${settings.cardType} / ${settings.mode} / ${settings.difficulty}`;
    hideResultPanel(resultPanel);

    memoryBoard.innerHTML = "";
    memoryBoard.style.setProperty("--columns", columns);
    memoryBoard.style.setProperty("--rows", rows);
    memoryBoard.dataset.columns = columns;
    memoryBoard.dataset.rows = rows;
    memoryBoard.dataset.size = pairs > 8 ? "large" : "regular";

    cards.forEach((card, index) => {
      memoryBoard.append(createCard(card, index));
    });

    state = {
      settings,
      cards,
      legends,
      difficultySettings,
      scorePanel,
      memoryBoard,
      resultPanel,
      resultTitle,
      resultSummary,
      cardElements: [...memoryBoard.querySelectorAll(".memory-card")],
      openCards: [],
      matchedPairs: 0,
      moves: 0,
      seconds: 0,
      currentPlayer: 0,
      scores: [0, 0],
      isLocked: false,
      isComplete: false
    };

    updateScorePanel();

    memoryBoard.removeEventListener("click", handleCardClick);
    memoryBoard.addEventListener("click", handleCardClick);

    replayButton.onclick = () => renderGamePreview(options);
    changeSettingsButton.onclick = showSetup;
  }

  function stopGame() {
    stopTimer();

    if (state?.memoryBoard) {
      state.memoryBoard.removeEventListener("click", handleCardClick);
    }

    if (state) {
      state.isComplete = true;
    }
  }

  window.ChessLegendsGamePreview = {
    renderGamePreview,
    stopGame
  };
})();
