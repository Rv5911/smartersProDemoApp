function SettingsPage() {
  setTimeout(function () {
    if (SettingsPage.cleanup) SettingsPage.cleanup();

    const container = document.querySelector(".settings-pages-container");
    const items = Array.from(container.querySelectorAll("p"));
    let activeIndex = 0;
    let isInSubPage = false;
    let currentOpenTab = items[0]; // Default to first item

    // Show AccountInformation by default
    const secondContainer = document.querySelector(
      ".settings-second-container",
    );
    secondContainer.innerHTML = AccountInformation();
    isInSubPage = false;

    function updateActiveItem() {
      items.forEach((item, index) => {
        if (index === activeIndex) {
          item.classList.add("settings-pages-container-active");
          const img = item.querySelector("img");
          if (img) img.classList.add("settings-pages-container-image-active");
        } else {
          item.classList.remove("settings-pages-container-active");
          const img = item.querySelector("img");
          if (img)
            img.classList.remove("settings-pages-container-image-active");
        }
      });
    }

    updateActiveItem();

    function settingsKeydownEvents(e) {
      if (isInSubPage) return;

      if (
        localStorage.getItem("currentPage") !== "settingsPage" &&
        localStorage.getItem("settingPage") !== "settingsPage"
      )
        return;

      // Respect global navigation focus
      if (localStorage.getItem("navigationFocus") === "navbar") return;

      const key = e.key;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key)) {
        e.preventDefault();
      }

      const selectedItem = items[activeIndex];

      switch (key) {
        case "ArrowDown":
          if (selectedItem.classList.contains("clear-app-cache")) return;
          if (activeIndex < items.length - 1) {
            activeIndex++;
            updateActiveItem();
          }
          break;

        case "ArrowUp":
          if (activeIndex === 0) {
            localStorage.setItem("navigationFocus", "navbar");
            items.forEach((item) => {
              item.classList.remove("settings-pages-container-active");
              const img = item.querySelector("img");
              if (img)
                img.classList.remove("settings-pages-container-image-active");
            });

            if (window.setNavbarFocus) {
              window.setNavbarFocus("settingsPage");
            } else {
              const profileIcon = document.getElementById("profileIcon");
              if (profileIcon) {
                profileIcon.focus();
                profileIcon.classList.add("active");
              }
            }
            return;
          }
          activeIndex = (activeIndex - 1 + items.length) % items.length;
          updateActiveItem();
          break;

        case "ArrowLeft":
          // Do nothing
          break;

        case "ArrowRight":
          localStorage.setItem("settingPage", "settingsPage");
          handleSelection(selectedItem);
          break;

        case "Enter":
          handleSelection(selectedItem);
          break;

        case "Backspace":
        case "Escape":
        case "Back":
        case "BrowserBack":
        case "XF86Back":
        case "10009":
          SettingsPage.cleanup();

          Router.showPage("homePage");

          // Focus on the Home nav item in Navbar
          localStorage.setItem("navigationFocus", "navbar");
          setTimeout(() => {
            // Use setNavbarFocus if available, otherwise focus directly
            if (window.setNavbarFocus) {
              window.setNavbarFocus("homePage");
            } else {
              const homeNavItem = document.querySelector(
                '.nav-item[data-page="homePage"]',
              );
              if (homeNavItem) {
                homeNavItem.focus();
                homeNavItem.classList.add("active");
              }
            }
          }, 50);
          break;

        default:
          break;
      }
    }

    function handleSelection(item) {
      const container = document.querySelector(".settings-second-container");

      if (!item.classList.contains("clear-app-cache")) {
        currentOpenTab = item;
      }

      if (item.classList.contains("account-info")) {
        if (!isInSubPage || container.innerHTML === "") {
          container.innerHTML = AccountInformation();
          isInSubPage = true;
        } else {
          window.dispatchEvent(new CustomEvent("subpage-focus-start"));
        }
        return;
      }

      if (item.classList.contains("stream-format")) {
        container.innerHTML = StreamFormat();
        isInSubPage = true;
      } else if (item.classList.contains("time-format")) {
        container.innerHTML = TimeFormat();
        isInSubPage = true;
      } else if (item.classList.contains("parental-control")) {
        container.innerHTML = ParentalControl();
        isInSubPage = true;
      } else if (item.classList.contains("clear-app-cache")) {
        alert("Clear App Cache selected");
      }
    }

    function setupSubPageCleanup() {}

    setupSubPageCleanup();

    // Listen for exit event from subpages
    function handleSubPageExit() {
      isInSubPage = false;
      updateActiveItem();
    }

    function handleSettingsFocusChange(e) {
      if (e.detail && e.detail.focus === "start") {
        if (isInSubPage) {
          // Dispatch to subpage
          document.dispatchEvent(new CustomEvent("subpage-focus-start"));
        } else {
          localStorage.setItem("navigationFocus", "settingsPage");
          activeIndex = 0;
          updateActiveItem();
        }
      }
    }

    window.addEventListener("settings-focus-change", handleSettingsFocusChange);
    document.addEventListener("settings-subpage-exit", handleSubPageExit);

    document.addEventListener("keydown", settingsKeydownEvents);

    SettingsPage.cleanup = function () {
      document.removeEventListener("keydown", settingsKeydownEvents);
      document.removeEventListener("settings-subpage-exit", handleSubPageExit);
      window.removeEventListener(
        "settings-focus-change",
        handleSettingsFocusChange,
      );
      isInSubPage = false;
    };
  }, 0);

  return `
    <div class="settings-main-container">
      <div class="settings-first-container">
        <div class="settings-first-content">
          <h1 class="settings-title"><i class="fa-solid fa-angle-left"></i>Settings</h1>
          <div class="settings-pages-container">
            <p class="account-info"><img src="/assets/account-user.png"/>Playlist Information</p>

            <p class="stream-format"><img src="/assets/streamformat-icon.png"/>Stream Format</p>
            <p class="time-format"><img src="/assets/timeIcon.png"/>Time Format</p>
            <p class="parental-control"><img src="/assets/parental-lock-icon.png"/>Parental Control</p>
            <!-- <p class="clear-app-cache"><img src="/assets/clear-cache-icon-white.png"/>Clear App Cache</p> -->
          </div>
        </div>
      </div>
      <div class="settings-second-container"></div>
    </div>
  `;
}
