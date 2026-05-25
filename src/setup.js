(() => {
  function getSelectedValue(selector) {
    return document.querySelector(`${selector} .is-selected`).dataset.value;
  }

  function getGameSettings() {
    return {
      cardType: getSelectedValue(".option-row"),
      mode: "Один игрок",
      difficulty: getSelectedValue(".difficulty-row")
    };
  }

  function setSelectedValue(selector, value) {
    const group = document.querySelector(selector);
    const selectedButton = group?.querySelector(`[data-value="${value}"]`);

    if (!group || !selectedButton) {
      return;
    }

    group.querySelectorAll("button").forEach((item) => {
      const isSelected = item === selectedButton;

      item.classList.toggle("is-selected", isSelected);
      item.setAttribute("aria-pressed", String(isSelected));
    });
  }

  function setGameSettings(settings) {
    if (!settings) {
      return;
    }

    setSelectedValue(".option-row", settings.cardType);
    setSelectedValue(".difficulty-row", settings.difficulty);
  }

  function initSetupControls() {
    document.querySelectorAll(".option-row, .difficulty-row").forEach((group) => {
      group.addEventListener("click", (event) => {
        const button = event.target.closest("button");

        if (!button || !group.contains(button)) {
          return;
        }

        group.querySelectorAll("button").forEach((item) => {
          const isSelected = item === button;

          item.classList.toggle("is-selected", isSelected);
          item.setAttribute("aria-pressed", String(isSelected));
        });
      });
    });
  }

  window.ChessLegendsSetup = {
    getGameSettings,
    setGameSettings,
    initSetupControls
  };
})();
