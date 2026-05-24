(() => {
  function createProfileFormController(options) {
    const {
      accountElements,
      createBlankProfile,
      createProfile,
      elements,
      findProfileByName,
      listProfiles,
      loginProfileWithPassword,
      normalizeCountryName,
      normalizeProfileCountryField,
      normalizeProfileName,
      onCurrentPlayerChange,
      onShowSetup,
      registerProfileWithPassword,
      renderProfile,
      saveState,
      validatePassword,
    } = options;
    const { confirmButton, modeButtons, profileElements } = elements;

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
      profileElements.password.disabled = false;
      profileElements.country.disabled = false;
      profileElements.country.closest(".profile-field").hidden = isLogin;
      profileElements.remember.disabled = false;
      confirmButton.hidden = false;
      confirmButton.textContent = isLogin ? "ВОЙТИ" : "ЗАРЕГИСТРИРОВАТЬСЯ";
      profileElements.password.autocomplete = isLogin ? "current-password" : "new-password";
      profileElements.password.placeholder = isLogin ? "Введите пароль" : "Придумайте пароль";
      if (profileElements.passwordLabel) {
        profileElements.passwordLabel.textContent = isLogin ? "Пароль" : "Новый пароль";
      }
      profileElements.subtitle.textContent = "Рекорды сохраняются на этом устройстве";

      normalizeProfileCountryField(profileElements);
    }

    function resetForm() {
      profileElements.remember.checked = false;
      profileElements.password.value = "";
      renderProfile(profileElements, createBlankProfile());
      normalizeProfileCountryField(profileElements);
    }

    async function login() {
      const requestedName = profileElements.name.value.trim();
      const password = profileElements.password.value;

      if (!requestedName) {
        resetForm();
        setMode("login");
        onCurrentPlayerChange();
        saveState("profile");
        return;
      }

      if (!password) {
        window.alert("Введите пароль.");
        profileElements.password.focus();
        return;
      }

      try {
        const profile = await loginProfileWithPassword(requestedName, password);

        profileElements.password.value = "";
        renderProfile(profileElements, profile);
        renderProfile(accountElements, profile);
        normalizeProfileCountryField(profileElements);
        normalizeProfileCountryField(accountElements);
        setMode("login");
        onShowSetup();
      } catch (error) {
        window.alert(error.message || "Не удалось войти.");
        profileElements.password.focus();
      }
    }

    async function register() {
      const name = profileElements.name.value.trim().replace(/\s+/g, " ");
      const password = profileElements.password.value;

      if (!name) {
        resetForm();
        setMode("register");
        onCurrentPlayerChange();
        saveState("profile");
        return;
      }

      if (!validatePassword(password)) {
        window.alert("Пароль должен быть не короче 4 символов.");
        profileElements.password.focus();
        return;
      }

      if (findProfileByName(name)) {
        window.alert("Такой профиль уже есть. Нажмите «Войти».");
        profileElements.name.focus();
        return;
      }

      normalizeProfileCountryField(profileElements);

      try {
        const profile = await registerProfileWithPassword({
          ...createBlankProfile(),
          name,
          country: profileElements.country.value.trim()
        }, password);

        profileElements.password.value = "";
        renderProfile(profileElements, profile);
        renderProfile(accountElements, profile);
        setMode("register");
        onShowSetup();
      } catch (error) {
        window.alert(error.message || "Не удалось зарегистрироваться.");
        profileElements.password.focus();
      }
    }

    async function confirmEntry() {
      if (getMode() === "login") {
        await login();
        return;
      }

      const requestedName = profileElements.name.value.trim();
      const existingProfile = findProfileByName(requestedName);

      if (existingProfile) {
        window.alert("Такой профиль уже есть. Нажмите «Войти» и введите пароль.");
        setMode("login");
        profileElements.password.focus();
        return;
      }

      await register();
    }

    return {
      confirmEntry,
      getMode,
      resetForm,
      setMode
    };
  }

  window.ChessLegendsProfileForm = {
    createProfileFormController
  };
})();
