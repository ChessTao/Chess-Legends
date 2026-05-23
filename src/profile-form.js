(() => {
  function createProfileFormController(options) {
    const {
      accountElements,
      createBlankProfile,
      createProfile,
      elements,
      findProfileByName,
      listProfiles,
      normalizeCountryName,
      normalizeProfileCountryField,
      normalizeProfileName,
      onCurrentPlayerChange,
      onShowSetup,
      renderProfile,
      saveProfile,
      saveState
    } = options;
    const { confirmButton, modeButtons, nameList, profileElements } = elements;

    function hideNameList() {
      if (nameList) {
        nameList.hidden = true;
      }
    }

    function refreshNameList() {
      if (!nameList) {
        return;
      }

      const listItems = document.createDocumentFragment();

      listProfiles().forEach((profile) => {
        if (!profile.name) {
          return;
        }

        const option = document.createElement("button");

        option.className = "profile-name-option";
        option.type = "button";
        option.dataset.name = profile.name;
        option.dataset.country = profile.country || "";

        const nameText = document.createElement("strong");
        nameText.textContent = profile.name;
        option.append(nameText);

        if (profile.country) {
          const countryText = document.createElement("small");
          countryText.textContent = `${profile.name}, ${profile.country}`;
          option.append(countryText);
        }

        listItems.append(option);
      });

      nameList.replaceChildren(listItems);
    }

    function updateNameSuggestions() {
      if (!nameList || profileElements.name.disabled) {
        hideNameList();
        return;
      }

      const query = normalizeProfileName(profileElements.name.value);
      let visibleCount = 0;

      nameList.querySelectorAll(".profile-name-option").forEach((option) => {
        const name = normalizeProfileName(option.dataset.name || "");
        const country = normalizeCountryName(option.dataset.country || "");
        const isVisible = !query || name.includes(query) || country.includes(query);

        option.hidden = !isVisible;
        visibleCount += isVisible ? 1 : 0;
      });

      nameList.hidden = visibleCount === 0;
    }

    function selectNameOption(option) {
      profileElements.name.value = option.dataset.name || "";
      profileElements.country.value = option.dataset.country || "";
      hideNameList();
      onCurrentPlayerChange();
    }

    function enableNameInput() {
      if (!profileElements.name.readOnly) {
        return;
      }

      profileElements.name.readOnly = false;
    }

    function fillCountryFromProfileName() {
      const profile = findProfileByName(profileElements.name.value);

      if (!profile?.country) {
        return;
      }

      profileElements.country.value = profile.country;
    }

    function getMode() {
      return document.querySelector(".profile-mode.is-selected")?.dataset.value || "register";
    }

    function setMode(mode) {
      const isLogin = mode === "login";

      modeButtons.forEach((button) => {
        const isSelected = button.dataset.value === mode;

        button.classList.toggle("is-selected", isSelected);
      });

      profileElements.name.disabled = false;
      profileElements.country.disabled = false;
      profileElements.country.closest(".profile-field").hidden = isLogin;
      profileElements.remember.disabled = false;
      confirmButton.hidden = false;
      confirmButton.textContent = isLogin ? "ВОЙТИ" : "ВХОД";
      profileElements.name.readOnly = true;
      profileElements.subtitle.textContent = "Рекорды сохраняются на этом устройстве";

      normalizeProfileCountryField(profileElements);
    }

    function resetForm() {
      profileElements.remember.checked = false;
      renderProfile(profileElements, createBlankProfile());
      normalizeProfileCountryField(profileElements);
      hideNameList();
    }

    function login() {
      const requestedName = profileElements.name.value.trim();

      if (!requestedName) {
        resetForm();
        setMode("login");
        onCurrentPlayerChange();
        saveState("profile");
        return;
      }

      const profile = findProfileByName(requestedName);

      if (!profile) {
        window.alert("Такой профиль не найден.");
        profileElements.name.focus();
        return;
      }

      saveProfile(profile);
      renderProfile(profileElements, profile);
      renderProfile(accountElements, profile);
      normalizeProfileCountryField(profileElements);
      normalizeProfileCountryField(accountElements);
      setMode("login");
      onShowSetup();
    }

    function register() {
      const name = profileElements.name.value.trim().replace(/\s+/g, " ");

      if (!name) {
        resetForm();
        setMode("register");
        onCurrentPlayerChange();
        saveState("profile");
        return;
      }

      if (findProfileByName(name)) {
        window.alert("Такой профиль уже есть. Нажмите «Войти».");
        profileElements.name.focus();
        return;
      }

      normalizeProfileCountryField(profileElements);

      const profile = createProfile({
        name,
        country: profileElements.country.value.trim()
      });

      renderProfile(profileElements, profile);
      renderProfile(accountElements, profile);
      refreshNameList();
      setMode("register");
      onShowSetup();
    }

    function confirmEntry() {
      if (getMode() === "login") {
        login();
        return;
      }

      const requestedName = profileElements.name.value.trim();
      const existingProfile = findProfileByName(requestedName);

      if (existingProfile) {
        saveProfile(existingProfile);
        renderProfile(profileElements, existingProfile);
        renderProfile(accountElements, existingProfile);
        normalizeProfileCountryField(profileElements);
        normalizeProfileCountryField(accountElements);
        onShowSetup();
        return;
      }

      register();
    }

    function bindNameList() {
      nameList.addEventListener("mousedown", (event) => {
        const option = event.target.closest(".profile-name-option");

        if (!option) {
          return;
        }

        event.preventDefault();
        selectNameOption(option);
      });

      document.addEventListener("mousedown", (event) => {
        if (event.target === profileElements.name || nameList.contains(event.target)) {
          return;
        }

        hideNameList();
      });
    }

    return {
      bindNameList,
      confirmEntry,
      enableNameInput,
      fillCountryFromProfileName,
      getMode,
      hideNameList,
      refreshNameList,
      resetForm,
      setMode,
      updateNameSuggestions
    };
  }

  window.ChessLegendsProfileForm = {
    createProfileFormController
  };
})();
