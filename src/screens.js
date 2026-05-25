(() => {
  const screenIds = {
    intro: "introScreen",
    profile: "profileScreen",
    account: "accountScreen",
    mode: "playModeScreen",
    online: "onlineScreen",
    setup: "setupScreen",
    game: "gameScreen",
    info: "infoScreen"
  };

  function showScreen(screen) {
    document.querySelectorAll(".screen").forEach((item) => {
      item.classList.toggle("is-active", item === screen);
    });
  }

  function getActiveScreen(fallbackScreen = null) {
    return document.querySelector(".screen.is-active") || fallbackScreen;
  }

  function getScreenByName(screenName) {
    const screenId = screenIds[screenName];

    return screenId ? document.querySelector(`#${screenId}`) : null;
  }

  function getScreenName(screen) {
    return Object.entries(screenIds).find(([, screenId]) => {
      return screen === document.querySelector(`#${screenId}`);
    })?.[0] || "profile";
  }

  window.ChessLegendsScreens = {
    getActiveScreen,
    getScreenByName,
    getScreenName,
    showScreen
  };
})();
