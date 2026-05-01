(() => {
  function createCard(card, index) {
    const button = document.createElement("button");
    const isOpen = index === 1 || index === 4;

    button.className = `memory-card${isOpen ? " is-preview-open" : ""}`;
    button.type = "button";
    button.setAttribute("aria-label", "Карточка Memory");

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

  function buildPreviewDeck(settings, legends, difficultySettings, shuffle) {
    const { pairs } = difficultySettings[settings.difficulty];
    const selectedLegends = legends.slice(0, pairs);

    if (settings.cardType === "Фото - фамилия") {
      return shuffle(selectedLegends.flatMap((legend) => [
        { ...legend, type: "photo" },
        { ...legend, type: "name" }
      ]));
    }

    return shuffle(selectedLegends.flatMap((legend) => [
      { ...legend, type: "photo" },
      { ...legend, type: "photo" }
    ]));
  }

  function updateScorePanel(scorePanel, settings, difficultySettings) {
    const { pairs } = difficultySettings[settings.difficulty];

    if (settings.mode === "Два игрока") {
      scorePanel.innerHTML = `
        <div class="score-card is-current">
          <span class="score-label">Игрок 1</span>
          <strong>0</strong>
        </div>
        <div class="score-card">
          <span class="score-label">Игрок 2</span>
          <strong>0</strong>
        </div>
        <div class="score-card">
          <span class="score-label">Ход</span>
          <strong>Игрок 1</strong>
        </div>
      `;
      return;
    }

    scorePanel.innerHTML = `
      <div class="score-card">
        <span class="score-label">Время</span>
        <strong>00:00</strong>
      </div>
      <div class="score-card">
        <span class="score-label">Ходы</span>
        <strong>0</strong>
      </div>
      <div class="score-card">
        <span class="score-label">Пары</span>
        <strong id="pairsPreview">0 / ${pairs}</strong>
      </div>
    `;
  }

  function renderGamePreview(options) {
    const {
      settings,
      legends,
      difficultySettings,
      gameChoice,
      scorePanel,
      memoryBoard,
      shuffle
    } = options;
    const { pairs, columns } = difficultySettings[settings.difficulty];
    const cards = buildPreviewDeck(settings, legends, difficultySettings, shuffle);
    const rows = Math.ceil(cards.length / columns);

    gameChoice.textContent = `${settings.cardType} / ${settings.mode} / ${settings.difficulty}`;
    updateScorePanel(scorePanel, settings, difficultySettings);

    memoryBoard.innerHTML = "";
    memoryBoard.style.setProperty("--columns", columns);
    memoryBoard.style.setProperty("--rows", rows);
    memoryBoard.dataset.columns = columns;
    memoryBoard.dataset.rows = rows;
    memoryBoard.dataset.size = pairs > 8 ? "large" : "regular";

    cards.forEach((card, index) => {
      memoryBoard.append(createCard(card, index));
    });
  }

  window.ChessLegendsGamePreview = {
    renderGamePreview
  };
})();
