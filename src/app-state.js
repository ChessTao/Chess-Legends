(() => {
  const STORAGE_KEY = "chessLegendsState";

  function loadAppState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  }

  function saveAppState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  window.ChessLegendsAppState = {
    loadAppState,
    saveAppState
  };
})();
