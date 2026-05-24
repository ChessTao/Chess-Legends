(() => {
  const GUEST_MATCH_PLAYER_ID = "__guest__";

  function createMatchPlayersController(options) {
    const {
      elements,
      getGameSettings,
      getProfile,
      listProfiles,
      loadProfile,
      normalizeCountryValue,
      normalizeProfileName
    } = options;
    const {
      panel,
      player1Select,
      player2Select,
      guestFields,
      guestName,
      guestCountry,
      notice
    } = elements;

    function getProfileOptionText(profile) {
      const country = profile.country ? `, ${profile.country}` : "";

      return `${profile.name || "Игрок"}${country}`;
    }

    function getSelection() {
      const player2Id = player2Select?.value || "";

      return {
        player1Id: player1Select?.value || "",
        player2Id,
        player2IsGuest: player2Id === GUEST_MATCH_PLAYER_ID,
        guestName: guestName?.value.trim().replace(/\s+/g, " ") || "",
        guestCountry: normalizeCountryValue(guestCountry?.value || "")
      };
    }

    function getMatchPlayerProfile(playerId) {
      return playerId ? getProfile(playerId) : null;
    }

    function getSnapshot() {
      const { player1Id, player2Id, player2IsGuest } = getSelection();
      const player1Profile = getMatchPlayerProfile(player1Id);
      const player2Profile = getMatchPlayerProfile(player2Id);

      return {
        player1Id,
        player2Id: player2IsGuest ? "" : player2Id,
        player1Name: player1Profile?.name || "Игрок 1",
        player2Name: player2IsGuest ? "Игрок 2" : player2Profile?.name || "Игрок 2",
        player1Country: player1Profile?.country || "",
        player2Country: player2IsGuest ? "" : player2Profile?.country || "",
        player2IsGuest
      };
    }

    function populateSelect(select, selectedValue, selectOptions = {}) {
      const { excludeIds = [], emptyText = "Нет сохраненных профилей" } = selectOptions;
      const profiles = listProfiles().filter((profile) => !excludeIds.includes(profile.id));
      const isOpponentSelect = select === player2Select;
      const fallbackValue = selectedValue || (
        isOpponentSelect
          ? profiles.length ? "" : GUEST_MATCH_PLAYER_ID
          : profiles[0]?.id || ""
      );

      select.replaceChildren();

      if (isOpponentSelect) {
        const placeholder = new Option("Выберите соперника", "");

        placeholder.disabled = true;
        placeholder.hidden = true;
        select.append(placeholder);
        select.append(new Option("Новый игрок", GUEST_MATCH_PLAYER_ID));
      }

      profiles.forEach((profile) => {
        select.append(new Option(getProfileOptionText(profile), profile.id));
      });

      if (!select.options.length) {
        const option = new Option(emptyText, "");

        option.disabled = true;
        select.append(option);
      }

      select.value = [...select.options].some((option) => option.value === fallbackValue)
        ? fallbackValue
        : select.options[0].value;
    }

    function getSavedProfileId(profileId) {
      if (!profileId) {
        return null;
      }

      return getProfile(profileId) ? profileId : null;
    }

    function clearGuestFields() {
      if (guestName) {
        guestName.value = "";
      }

      if (guestCountry) {
        guestCountry.value = "";
      }
    }

    function populateControls(savedSelection = {}) {
      const activeProfile = loadProfile();
      const player1Id = activeProfile.id || "";
      let player2Id = getSavedProfileId(savedSelection.player2Id) || "";

      if (player2Id && player2Id === player1Id) {
        player2Id = "";
      }

      clearGuestFields();

      populateSelect(player1Select, player1Id, {
        excludeIds: activeProfile.id ? listProfiles().map((profile) => profile.id).filter((id) => id !== activeProfile.id) : []
      });
      populateSelect(player2Select, player2Id, {
        excludeIds: [player1Id],
        emptyText: "Нет второго профиля"
      });
      updateGuestFields();
      updateNotice();
    }

    function updateGuestFields() {
      if (!guestFields) {
        return;
      }

      guestFields.hidden = player2Select?.value !== GUEST_MATCH_PLAYER_ID;
    }

    function isMatchModeSelected() {
      return getGameSettings().mode === "Два игрока";
    }

    function updatePanel() {
      panel.hidden = !isMatchModeSelected();

      updateNotice();
    }

    function getMatchPlayerName(playerId, fallbackName) {
      return getMatchPlayerProfile(playerId)?.name || fallbackName;
    }

    function updateNotice() {
      updateGuestFields();

      const { player1Id, player2Id, player2IsGuest, guestName: selectedGuestName } = getSelection();
      const hasDuplicateProfiles = player1Id && player1Id === player2Id;

      if (hasDuplicateProfiles) {
        notice.textContent = "Выберите разные профили для игроков.";
        return;
      }

      if (!isMatchModeSelected()) {
        notice.textContent = "";
        return;
      }

      if (player2IsGuest) {
        notice.textContent = `${getMatchPlayerName(player1Id, "Игрок 1")} против ${selectedGuestName || "новый игрок"}`;
        return;
      }

      if (!player2Id) {
        notice.textContent = "Выберите соперника или добавьте нового игрока.";
        return;
      }

      notice.textContent = `${getMatchPlayerName(player1Id, "Игрок 1")} против ${getMatchPlayerName(player2Id, "Игрок 2")}`;
    }

    function validate() {
      if (!isMatchModeSelected()) {
        return true;
      }

      const { player1Id, player2Id, player2IsGuest, guestName: selectedGuestName } = getSelection();

      if (!player1Id || !player2Id) {
        window.alert("Для матча выберите второго игрока или добавьте нового.");
        return false;
      }

      if (!player2IsGuest && player1Id === player2Id) {
        window.alert("Для матча выберите два разных профиля.");
        return false;
      }

      if (player2IsGuest) {
        const player1Name = getMatchPlayerName(player1Id, "Игрок 1");

        if (!selectedGuestName) {
          window.alert("Введите имя второго игрока.");
          guestName?.focus();
          return false;
        }

        if (normalizeProfileName(selectedGuestName) === normalizeProfileName(player1Name)) {
          window.alert("Введите другое имя для второго игрока.");
          guestName?.focus();
          return false;
        }
      }

      return true;
    }

    function isGuestSelected() {
      return player2Select?.value === GUEST_MATCH_PLAYER_ID;
    }

    return {
      clearGuestFields,
      getSelection,
      getSnapshot,
      isGuestSelected,
      isMatchModeSelected,
      populateControls,
      updateNotice,
      updatePanel,
      validate
    };
  }

  window.ChessLegendsMatchPlayers = {
    GUEST_MATCH_PLAYER_ID,
    createMatchPlayersController
  };
})();
