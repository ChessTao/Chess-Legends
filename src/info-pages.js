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
      listProfiles,
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
      leaderboardsList,
      pageTitle,
      articles,
      projectLinks
    } = elements;
    const { profileScreen, setupScreen, gameScreen } = screens;
    let previousInfoScreen = null;
    const difficultyNames = ["Начинающий", "КМС", "Мастер", "Гроссмейстер"];

    function getDetachedInfoUrl(pageName) {
      const url = new URL(window.location.href);

      url.searchParams.set("infoPage", pageName || "rules");
      url.searchParams.delete("openScreen");
      return url.toString();
    }

    function formatTime(totalSeconds) {
      if (!Number.isFinite(totalSeconds)) {
        return "-";
      }

      const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
      const seconds = String(totalSeconds % 60).padStart(2, "0");

      return `${minutes}:${seconds}`;
    }

    function formatProfileName(profile) {
      return profile.country ? `${profile.name}, ${profile.country}` : profile.name || "Игрок";
    }

    function formatLeaderboardName(profile) {
      return profile.name || "Игрок";
    }

    function isServiceProfile(profile) {
      return /^(Smoke|Restart|Test|Тест|ТЕСТ)(\s|$)/i.test(String(profile.name || ""));
    }

    function appendEmptyMessage(container) {
      const message = document.createElement("p");
      message.className = "leaderboard-empty";
      message.textContent = "Пока нет результатов.";
      container.append(message);
    }

    function createProfilePreview(profile) {
      const section = document.createElement("section");
      const heading = document.createElement("div");
      const title = document.createElement("h3");
      const closeButton = document.createElement("button");
      const details = document.createElement("div");
      const records = document.createElement("div");

      section.className = "leaderboard-profile";
      heading.className = "leaderboard-profile-head";
      title.textContent = formatProfileName(profile);
      closeButton.type = "button";
      closeButton.textContent = "Закрыть";
      closeButton.addEventListener("click", () => section.remove());
      heading.append(title, closeButton);

      details.className = "leaderboard-profile-details";
      [
        ["Матчевый рейтинг", String(profile.matchRating || 1000)],
        ["Матчей", String(profile.matchGamesPlayed || 0)],
        ["Счет", `${profile.twoPlayerWins || 0}-${profile.twoPlayerLosses || 0}`],
        ["Ничьи", String(profile.twoPlayerDraws || 0)]
      ].forEach(([label, value]) => {
        const item = document.createElement("div");
        const itemLabel = document.createElement("span");
        const itemValue = document.createElement("strong");

        itemLabel.textContent = label;
        itemValue.textContent = value;
        item.append(itemLabel, itemValue);
        details.append(item);
      });

      records.className = "leaderboard-profile-records";
      difficultyNames.forEach((difficulty) => {
        const record = profile.recordsByDifficulty?.[difficulty] || {};
        const card = document.createElement("div");
        const name = document.createElement("span");
        const games = document.createElement("strong");
        const best = document.createElement("small");

        card.className = "leaderboard-profile-record";
        name.textContent = difficulty;
        games.textContent = `${record.singleGames || 0} игр`;
        best.textContent = `Лучшее: ${formatTime(record.bestTime)} / ${Number.isFinite(record.bestMoves) ? record.bestMoves : "-"}`;
        card.append(name, games, best);
        records.append(card);
      });

      section.append(heading, details, records);
      return section;
    }

    function showProfilePreview(profile) {
      if (!leaderboardsList) {
        return;
      }

      leaderboardsList.querySelector(".leaderboard-profile")?.remove();
      leaderboardsList.prepend(createProfilePreview(profile));
    }

    function createLeaderboardSection(title, rows, columns) {
      const section = document.createElement("section");
      const heading = document.createElement("h3");
      const table = document.createElement("div");
      const head = document.createElement("div");

      section.className = "leaderboard-section";
      heading.textContent = title;
      table.className = "leaderboard-table";
      head.className = "leaderboard-row leaderboard-head";

      columns.forEach((column) => {
        const cell = document.createElement("span");
        cell.textContent = column;
        head.append(cell);
      });

      table.append(head);

      if (!rows.length) {
        appendEmptyMessage(table);
      } else {
        rows.forEach((row, index) => {
          const item = document.createElement("div");
          item.className = "leaderboard-row";

          row.values.forEach((value, valueIndex) => {
            let cell;

            if (valueIndex === 1 && row.profile) {
              cell = document.createElement("button");
              cell.type = "button";
              cell.addEventListener("click", () => showProfilePreview(row.profile));
            } else {
              cell = document.createElement(valueIndex === 1 ? "strong" : "span");
            }

            cell.textContent = valueIndex === 0 ? String(index + 1) : value;
            cell.title = row.titles?.[valueIndex] || cell.textContent;
            item.append(cell);
          });

          table.append(item);
        });
      }

      section.append(heading, table);
      return section;
    }

    function renderLeaderboards() {
      if (!leaderboardsList) {
        return;
      }

      const profiles = (typeof listProfiles === "function" ? listProfiles() : [])
        .filter((profile) => profile.name && !isServiceProfile(profile));
      const fragment = document.createDocumentFragment();
      const matchRows = profiles
        .filter((profile) => (profile.matchGamesPlayed || 0) > 0)
        .sort((first, second) => (second.matchRating || 1000) - (first.matchRating || 1000))
        .slice(0, 5)
        .map((profile) => ({
          profile,
          values: [
            "",
            formatLeaderboardName(profile),
            String(profile.matchRating || 1000),
            String(profile.matchGamesPlayed || 0)
          ],
          titles: [
            "",
            formatProfileName(profile),
            "Матчевый рейтинг",
            "Матчей сыграно"
          ]
        }));

      fragment.append(createLeaderboardSection("Матчевый рейтинг", matchRows, [
        "#",
        "Игрок",
        "Рейтинг",
        "Матчи"
      ]));

      difficultyNames.forEach((difficulty) => {
        const difficultyRows = profiles
          .map((profile) => ({
            profile,
            record: profile.recordsByDifficulty?.[difficulty] || {}
          }))
          .filter(({ profile, record }) => profile.name && Number.isFinite(record.bestTime))
          .sort((first, second) => {
            if (first.record.bestTime !== second.record.bestTime) {
              return first.record.bestTime - second.record.bestTime;
            }

            return (first.record.bestMoves || Infinity) - (second.record.bestMoves || Infinity);
          })
          .slice(0, 5)
          .map(({ profile, record }) => ({
            profile,
            values: [
              "",
              formatLeaderboardName(profile),
              formatTime(record.bestTime),
              Number.isFinite(record.bestMoves) ? String(record.bestMoves) : "-"
            ],
            titles: [
              "",
              formatProfileName(profile),
              "Лучшее время",
              "Лучшие ходы"
            ]
          }));

        fragment.append(createLeaderboardSection(difficulty, difficultyRows, [
          "#",
          "Игрок",
          "Время",
          "Ходы"
        ]));
      });

      leaderboardsList.replaceChildren(fragment);
    }

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

    function showCreditsCards() {
      if (!creditsList) {
        return;
      }

      creditsList.querySelector(".credits-reader")?.remove();
      creditsList.querySelector(".credits-grid")?.removeAttribute("hidden");
    }

    function openCredit(credit) {
      if (!creditsList) {
        return;
      }

      const grid = creditsList.querySelector(".credits-grid");
      const reader = document.createElement("section");
      const backButton = document.createElement("button");
      const title = document.createElement("h3");
      const text = document.createElement("p");

      grid.hidden = true;
      creditsList.querySelector(".credits-reader")?.remove();

      reader.className = "credits-reader";
      backButton.className = "biography-back";
      backButton.type = "button";
      backButton.textContent = "К списку";
      backButton.addEventListener("click", showCreditsCards);
      title.textContent = credit.name;
      text.textContent = `${credit.name}. Источник: ${credit.source}. Лицензия: ${credit.license}.`;
      reader.append(backButton, title, text);
      creditsList.append(reader);
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
      if (!creditsList) {
        return;
      }

      const listItems = document.createDocumentFragment();
      const note = document.createElement("p");
      const grid = document.createElement("div");

      note.className = "credits-note";
      note.textContent = "Наведите на портрет, чтобы быстро увидеть автора и лицензию. Нажмите на карточку, чтобы открыть текст credits и скопировать его.";
      grid.className = "credits-grid";

      photoCredits.forEach((credit) => {
        const item = document.createElement("button");
        const photo = document.createElement("img");
        const name = document.createElement("strong");
        const overlay = document.createElement("span");

        item.className = "credit-item";
        item.type = "button";
        photo.src = credit.photo;
        photo.alt = credit.name;
        photo.loading = "lazy";
        name.textContent = credit.name;
        overlay.textContent = `${credit.source}. ${credit.license}`;
        item.title = overlay.textContent;
        item.append(photo, name, overlay);
        item.addEventListener("click", () => openCredit(credit));
        listItems.append(item);
      });

      grid.append(listItems);
      creditsList.replaceChildren(note, grid);
    }

    function showPage(pageName, titleText) {
      infoScreen.classList.toggle("is-biographies", pageName === "biographies");
      infoScreen.classList.toggle("is-leaderboards", pageName === "leaderboards");
      infoScreen.classList.toggle("is-photo-credits", pageName === "photo-credits");

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

      if (normalizedPageName === "leaderboards") {
        renderLeaderboards();
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
      infoScreen.classList.remove("is-leaderboards");
      infoScreen.classList.remove("is-photo-credits");
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

          if (getActiveScreen(profileScreen) === gameScreen) {
            window.open(getDetachedInfoUrl(link.dataset.infoPage), "_blank", "noopener");
            return;
          }

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
