function LoginPage() {
  let playlistsData = JSON.parse(localStorage.getItem("playlistsData"))
    ? JSON.parse(localStorage.getItem("playlistsData"))
    : [];

  setTimeout(function () {
    localStorage.removeItem("navigationFocus");
    if (localStorage.getItem("currentPage") !== "login") return;
    if (LoginPage.cleanup) LoginPage.cleanup();

    const playlistInput = document.querySelector(".playlistname-input");
    const usernameInput = document.querySelector(".username-input");
    const passwordInput = document.querySelector(".password-input");
    const serverInput = document.querySelector(".server-input");
    const addUserButton = document.querySelector(".add-user-button");
    const managePlaylistsButton = document.querySelector(
      ".manage-playlists-button",
    );
    const switchUserButton = document.querySelector(".switch-user-button");
    const deviceInfoButton = document.querySelector(".device-info-button");

    let currentSlide = 0;
    const totalSlides = 3;
    let sliderInterval;

    function updateSlider() {
      const slides = document.querySelectorAll(".slider-slide");
      const dots = document.querySelectorAll(".slider-dot");

      slides.forEach((slide, index) => {
        slide.classList.remove("active");
        if (index === currentSlide) {
          slide.classList.add("active");
        }
      });

      dots.forEach((dot, index) => {
        dot.classList.remove("active");
        if (index === currentSlide) {
          dot.classList.add("active");
        }
      });
    }

    function nextSlide() {
      currentSlide = (currentSlide + 1) % totalSlides;
      updateSlider();
    }

    sliderInterval = setInterval(nextSlide, 5000);

    const dots = document.querySelectorAll(".slider-dot");
    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => {
        currentSlide = index;
        updateSlider();
        clearInterval(sliderInterval);
        sliderInterval = setInterval(nextSlide, 5000);
      });
    });

    passwordInput.addEventListener("focus", () => {
      document.querySelector(".login-form-div").classList.add("shift-up");
    });

    passwordInput.addEventListener("blur", () => {
      document.querySelector(".login-form-div").classList.remove("shift-up");
    });

    usernameInput.addEventListener("focus", () => {
      document.querySelector(".login-form-div").classList.add("shift-up");
    });

    usernameInput.addEventListener("blur", () => {
      document.querySelector(".login-form-div").classList.remove("shift-up");
    });

    serverInput.addEventListener("focus", () => {
      document.querySelector(".login-form-div").classList.add("shift-up");
    });

    serverInput.addEventListener("blur", () => {
      document.querySelector(".login-form-div").classList.remove("shift-up");
    });

    if (!passwordInput) return;

    const inputs = [
      playlistInput,

      usernameInput,
      passwordInput,

      serverInput,
      addUserButton,
      managePlaylistsButton,
      // switchUserButton,
      // deviceInfoButton,
    ].filter(Boolean);

    let currentIndex = 0;
    let lastFocusedInput = null;

    const eyeIcon = document.querySelector(".eye-icon-login");

    // Add error handling for image loading
    if (eyeIcon) {
      eyeIcon.onerror = function () {
        console.error("Eye icon image failed to load");
        eyeIcon.alt = passwordVisible ? "Hide" : "Show";
      };
    }

    let passwordVisible = false;

    function togglePassword() {
      passwordVisible = !passwordVisible;
      passwordInput.type = passwordVisible ? "text" : "password";
      eyeIcon.src = passwordVisible
        ? "../assets/eye-open.png"
        : "../assets/eye-closed.png";
      eyeIcon.alt = passwordVisible ? "Hide password" : "Show password";
    }

    eyeIcon.addEventListener("click", togglePassword);

    if (inputs.length > 0) {
      inputs[currentIndex].classList.add("login-input-focused");
    }

    function clearFocusStyles() {
      document
        .querySelectorAll(
          ".login-input-focused, .login-button-focused, .list-button-focused, .eye-icon-focused",
        )
        .forEach(function (el) {
          el.classList.remove(
            "login-input-focused",
            "login-button-focused",
            "list-button-focused",
            "eye-icon-focused",
          );
        });
    }

    function updateFocus(newIndex) {
      if (newIndex < 0 || newIndex >= inputs.length) return;

      if (lastFocusedInput) {
        lastFocusedInput.blur();
        lastFocusedInput = null;
      }

      clearFocusStyles();
      currentIndex = newIndex;
      const focused = inputs[currentIndex];

      if (focused.classList.contains("login-input")) {
        focused.classList.add("login-input-focused");
      } else if (
        focused.classList.contains("add-user-button") ||
        focused.classList.contains("manage-playlists-button") ||
        focused.classList.contains("switch-user-button") ||
        focused.classList.contains("device-info-button")
      ) {
        focused.classList.add("login-input-focused");
      }
    }

    function handleLogin() {
      const playlistName = playlistInput.value.trim();
      const username = usernameInput.value.trim();
      const password = passwordInput.value.trim();
      const serverAddress = serverInput.value.trim();

      if (
        playlistName === "" ||
        username === "" ||
        password === "" ||
        serverAddress === ""
      ) {
        Toaster.showToast("error", "Please complete all fields!");
        return;
      }

      loginApi(username, password, playlistName, false, "", serverAddress).then(
        (response) => {
          if (response) {
            LoginPage.cleanup();
          }
        },
      );
    }

    function loginPageKeydownEvents(e) {
      if (localStorage.getItem("currentPage") !== "login") {
        return;
      }
      const key = e.key;
      const focused = inputs[currentIndex];
      const eyeFocused = eyeIcon.classList.contains("eye-icon-focused");

      const isInputFocused =
        document.activeElement &&
        (document.activeElement === playlistInput ||
          document.activeElement === usernameInput ||
          document.activeElement === passwordInput ||
          document.activeElement === serverInput);

      if (
        isInputFocused &&
        key !== "ArrowDown" &&
        key !== "ArrowUp" &&
        key !== "ArrowLeft" &&
        key !== "ArrowRight" &&
        key !== "Enter"
      ) {
        return;
      }

      switch (key) {
        case "ArrowDown":
          if (eyeFocused) {
            eyeIcon.classList.remove("eye-icon-focused");
            passwordInput.classList.add("login-input-focused");
          } else if (inputs[currentIndex] === serverInput) {
            updateFocus(inputs.indexOf(addUserButton));
          } else if (
            inputs[currentIndex] === addUserButton ||
            inputs[currentIndex] === managePlaylistsButton
          ) {
            // If device button is enabled, go there. Otherwise stay.
            if (
              deviceInfoButton &&
              !deviceInfoButton.classList.contains("hidden")
            ) {
              updateFocus(inputs.indexOf(deviceInfoButton));
            }
          } else {
            updateFocus(currentIndex + 1);
          }
          e.preventDefault();
          break;

        case "ArrowUp":
          if (eyeFocused) {
            eyeIcon.classList.remove("eye-icon-focused");
            passwordInput.classList.add("login-input-focused");
          } else if (
            inputs[currentIndex] === switchUserButton ||
            inputs[currentIndex] === managePlaylistsButton
          ) {
            updateFocus(inputs.indexOf(serverInput));
          } else {
            updateFocus(currentIndex - 1);
          }
          e.preventDefault();
          break;

        case "ArrowRight":
          if (inputs[currentIndex] === passwordInput) {
            clearFocusStyles();
            if (lastFocusedInput) lastFocusedInput.blur();
            eyeIcon.classList.add("eye-icon-focused");
          } else if (inputs[currentIndex] === addUserButton) {
            updateFocus(inputs.indexOf(managePlaylistsButton));
          } else if (inputs[currentIndex] === managePlaylistsButton) {
            // Stay or go to switchUser if enabled
            if (
              switchUserButton &&
              getComputedStyle(switchUserButton).display !== "none"
            ) {
              updateFocus(inputs.indexOf(switchUserButton));
            }
          }
          e.preventDefault();
          break;

        case "ArrowLeft":
          if (eyeFocused) {
            clearFocusStyles();
            passwordInput.classList.add("login-input-focused");
          } else if (inputs[currentIndex] === managePlaylistsButton) {
            updateFocus(inputs.indexOf(addUserButton));
          } else if (inputs[currentIndex] === switchUserButton) {
            updateFocus(inputs.indexOf(managePlaylistsButton));
          }
          e.preventDefault();
          break;

        case "Enter":
          if (eyeFocused) {
            togglePassword();
            e.preventDefault();
            break;
          }

          if (lastFocusedInput && lastFocusedInput !== focused) {
            lastFocusedInput.blur();
          }

          if (focused.classList.contains("login-input")) {
            focused.focus();
            if (focused.setSelectionRange) {
              const len = focused.value.length;
              focused.setSelectionRange(len, len);
            }
            lastFocusedInput = focused;
          } else if (focused.classList.contains("add-user-button")) {
            handleLogin();
          } else if (focused.classList.contains("manage-playlists-button")) {
            if (playlistsData.length === 0) {
              Toaster.showToast(
                "error",
                "No playlists available. Please add a playlist!",
              );
              e.preventDefault();
              return;
            } else {
              localStorage.setItem("currentPage", "listUsersPage");
              LoginPage.cleanup();
              Router.showPage("listPage");
            }
          } else if (focused.classList.contains("switch-user-button")) {
            const playlistsData = localStorage.getItem("playlistsData")
              ? JSON.parse(localStorage.getItem("playlistsData"))
              : [];
            if (playlistsData.length === 0) {
              Toaster.showToast(
                "error",
                "No playlists available. Please add a playlist!",
              );
              e.preventDefault();
              return;
            } else {
              localStorage.setItem("currentPage", "listUsersPage");
              LoginPage.cleanup();
              Router.showPage("listPage");
            }
          } else if (focused.classList.contains("device-info-button")) {
            Toaster.showToast("info", "Coming Soon");
          }
          e.preventDefault();
          break;
      }
    }

    document.addEventListener("keydown", loginPageKeydownEvents);
    addUserButton.addEventListener("click", handleLogin);
    managePlaylistsButton.addEventListener("click", () => {
      localStorage.setItem("currentPage", "listUsersPage");
      LoginPage.cleanup();
      Router.showPage("listPage");
    });

    playlistInput.addEventListener("input", (e) => {
      localStorage.setItem("login_playlistName", e.target.value);
    });
    usernameInput.addEventListener("input", (e) => {
      localStorage.setItem("login_username", e.target.value);
    });
    passwordInput.addEventListener("input", (e) => {
      localStorage.setItem("login_password", e.target.value);
    });
    serverInput.addEventListener("input", (e) => {
      localStorage.setItem("login_serverAddress", e.target.value);
    });

    LoginPage.cleanup = function () {
      document.removeEventListener("keydown", loginPageKeydownEvents);
      eyeIcon.removeEventListener("click", togglePassword);
      if (sliderInterval) clearInterval(sliderInterval);
    };
  }, 0);

  return `
    <div class="login-page-container">
      <div class="login-content-div">
        
        <div class="login-image-div">
          <div class="slider-container">
            <div class="slider-slide active">
              <img class="login-logo-slide" src="../assets/loginInfo1.png" alt="MultiVision Logo">
              <p class="slider-text" >Join Us & Explore thousands of Great Opportunities</p>
            </div>
            <div class="slider-slide">
              <img class="login-logo-slide" src="../assets/loginInfo2.png" alt="MultiVision Logo">
              <p class="slider-text">Join Us & Explore thousands of Great Opportunities</p>
            </div>
            <div class="slider-slide">
              <img class="login-logo-slide" src="../assets/loginInfo3.png" alt="MultiVision Logo">
              <p class="slider-text">Join Us & Explore thousands of Great Opportunities</p>
            </div>
          </div>
          
          <div class="slider-dots">
            <span class="slider-dot active"></span>
            <span class="slider-dot"></span>
            <span class="slider-dot"></span>
          </div>
        </div>

        <div class="login-form-div">
          <div class="login-inputs-div">
            <div class="input-group">
              <div class="login-input-container">
                <img class="input-icon" src="../assets/playlist.png" alt="Playlist">
                <input class="playlistname-input login-input" type="text" placeholder="Playlist Name" value="${localStorage.getItem("login_playlistName") || ""}">
              </div>
            </div>
      
            <div class="input-group">
              <div class="login-input-container">
                <img class="input-icon" src="../assets/username.png" alt="User">
                <input class="username-input login-input" type="text" placeholder="Username" value="${localStorage.getItem("login_username") || ""}">
              </div>
            </div>
            
            <div class="input-group">
              <div class="login-input-container password-wrapper">
                <img class="input-icon" src="../assets/password.png" alt="Password">
                <input class="password-input login-input" type="password" placeholder="Password" value="${localStorage.getItem("login_password") || ""}">
                <img class="eye-icon-login" src="../assets/eye-closed.png" alt="Toggle password visibility">
              </div>
            </div>

            <div class="input-group">
              <div class="login-input-container">
                <img class="input-icon" src="../assets/server.png" alt="Server">
                <input class="server-input login-input" type="text" placeholder="Server Address" value="${localStorage.getItem("login_serverAddress") || ""}">
              </div>
            </div>

            <div class="login-buttons-row">
              <button class="add-user-button">Add Playlist</button>
              <button class="manage-playlists-button"><svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeLarge icon css-6flbmm" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="ViewListIcon"><path d="M3 14h4v-4H3v4zm0 5h4v-4H3v4zM3 9h4V5H3v4zm5 5h13v-4H8v4zm0 5h13v-4H8v4zM8 5v4h13V5H8z"></path></svg>List Playlists</button>
              <button class="switch-user-button">Switch User</button>
            </div>

            <div class="device-info-button-div">
              <button class="device-info-button">Device Information</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
