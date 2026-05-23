(() => {
  function renderMarkdown(markdownText) {
    const fragment = document.createDocumentFragment();
    const lines = markdownText.split(/\r?\n/);
    let list = null;

    lines.forEach((line) => {
      const text = line.trim();

      if (!text) {
        list = null;
        return;
      }

      if (text.startsWith("# ")) {
        const title = document.createElement("h3");
        title.textContent = text.slice(2);
        fragment.append(title);
        list = null;
        return;
      }

      if (text.startsWith("## ")) {
        const subtitle = document.createElement("h4");
        subtitle.textContent = text.slice(3);
        fragment.append(subtitle);
        list = null;
        return;
      }

      if (text.startsWith("- ")) {
        if (!list) {
          list = document.createElement("ul");
          fragment.append(list);
        }

        const item = document.createElement("li");
        item.textContent = text.slice(2);
        list.append(item);
        return;
      }

      const paragraph = document.createElement("p");
      paragraph.textContent = text;
      fragment.append(paragraph);
      list = null;
    });

    return fragment;
  }

  function createInfoPagesController(options) {
    const {
      biographyItems,
      photoCredits = [],
      elements,
      getActiveScreen,
      getScreenName,
      onStateChange,
      screens,
      showScreen
    } = options;
    const {
      backButton,
      biographyList,
      biographyReader,
      creditsList,
      infoScreen,
      pageTitle,
      articles,
      projectLinks
    } = elements;
    const { profileScreen, setupScreen, gameScreen } = screens;
    let previousInfoScreen = null;

    function showBiographyCards() {
      if (!biographyList || !biographyReader) {
        return;
      }

      biographyList.hidden = false;
      biographyReader.hidden = true;
      biographyReader.replaceChildren();
    }

    async function openBiography(biography) {
      if (!biographyReader) {
        return;
      }

      biographyList.hidden = true;
      biographyReader.hidden = false;
      biographyReader.textContent = "Загружаем биографию...";

      const backButton = document.createElement("button");
      backButton.className = "biography-back";
      backButton.type = "button";
      backButton.textContent = "К списку";
      backButton.addEventListener("click", showBiographyCards);

      try {
        const response = await fetch(biography.fileRu);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const markdownText = await response.text();
        biographyReader.replaceChildren(backButton, renderMarkdown(markdownText));
      } catch {
        const message = document.createElement("p");
        message.textContent = "Не удалось загрузить биографию. Проверьте, что проект открыт через локальный сервер.";
        biographyReader.replaceChildren(backButton, message);
      }
    }

    function renderBiographyList() {
      if (!biographyList || biographyList.childElementCount > 0) {
        return;
      }

      const listItems = document.createDocumentFragment();

      biographyItems.forEach((biography) => {
        const link = document.createElement("button");
        const portrait = document.createElement("img");
        const name = document.createElement("span");

        link.className = "biography-card";
        link.type = "button";
        link.dataset.biographyId = biography.id;
        portrait.src = biography.photo;
        portrait.alt = biography.nameRu;
        portrait.loading = "lazy";
        name.textContent = biography.nameRu;
        link.append(portrait, name);
        link.addEventListener("click", () => openBiography(biography));
        listItems.append(link);
      });

      biographyList.replaceChildren(listItems);
    }

    function renderPhotoCredits() {
      if (!creditsList || creditsList.childElementCount > 0) {
        return;
      }

      const listItems = document.createDocumentFragment();

      photoCredits.forEach((credit) => {
        const item = document.createElement("div");
        const name = document.createElement("strong");
        const source = document.createElement("span");
        const license = document.createElement("small");

        item.className = "credit-item";
        name.textContent = credit.name;
        source.textContent = credit.source;
        license.textContent = credit.license;
        item.append(name, source, license);
        listItems.append(item);
      });

      creditsList.replaceChildren(listItems);
    }

    function showPage(pageName, titleText) {
      infoScreen.classList.toggle("is-biographies", pageName === "biographies");

      const activeArticle = [...articles].find((article) => article.dataset.infoPage === pageName);
      const normalizedPageName = activeArticle?.dataset.infoPage || "rules";
      const fallbackTitle = activeArticle?.dataset.title || "Правила и условия";

      articles.forEach((article) => {
        article.hidden = article.dataset.infoPage !== normalizedPageName;
      });

      pageTitle.textContent = titleText || fallbackTitle;
      showScreen(infoScreen);

      if (normalizedPageName === "biographies") {
        renderBiographyList();
        showBiographyCards();
      }

      if (normalizedPageName === "photo-credits") {
        renderPhotoCredits();
      }

      return normalizedPageName;
    }

    function open(pageName, titleText) {
      previousInfoScreen = getActiveScreen(profileScreen);
      const previousScreenName = getScreenName(previousInfoScreen);
      const normalizedPageName = showPage(pageName, titleText);

      onStateChange("info", {
        infoPage: normalizedPageName,
        previousScreen: previousScreenName
      });
    }

    function close() {
      const targetScreen = previousInfoScreen === gameScreen
        ? setupScreen
        : previousInfoScreen || profileScreen;

      infoScreen.classList.remove("is-biographies");
      showScreen(targetScreen);
      onStateChange(getScreenName(targetScreen));
      previousInfoScreen = null;
    }

    function restore(pageName, previousScreen) {
      previousInfoScreen = previousScreen || profileScreen;
      showPage(pageName || "rules");
    }

    function init() {
      projectLinks.forEach((link) => {
        link.addEventListener("click", (event) => {
          event.preventDefault();
          open(link.dataset.infoPage, link.textContent.trim());
        });
      });

      backButton.addEventListener("click", close);
    }

    return {
      init,
      restore
    };
  }

  window.ChessLegendsInfoPages = {
    createInfoPagesController
  };
})();
