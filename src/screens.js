(() => {
  function showScreen(screen) {
    document.querySelectorAll(".screen").forEach((item) => {
      item.classList.toggle("is-active", item === screen);
    });
  }

  window.ChessLegendsScreens = {
    showScreen
  };
})();
