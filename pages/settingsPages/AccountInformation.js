function AccountInformation() {
  var currentPlaylistData =
    JSON.parse(localStorage.getItem("currentPlaylistData")) || {};
  var userInfo = currentPlaylistData.user_info || {};

  var container = null;
  var accountInfoKeydownEvents = null;

  setTimeout(function () {
    container = document.querySelector(".account-info-container");
    if (!container) return;

    function handleSubPageFocusStart() {
      localStorage.setItem("navigationFocus", "settingsPage");
      var firstItem = document.querySelector(".account-detail-item");
      if (firstItem) firstItem.focus();
    }

    window.addEventListener("subpage-focus-start", handleSubPageFocusStart);

    accountInfoKeydownEvents = function (e) {
      if (localStorage.getItem("navigationFocus") === "navbar") return;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          window.removeEventListener(
            "subpage-focus-start",
            handleSubPageFocusStart,
          );
          document.removeEventListener("keydown", accountInfoKeydownEvents);
          document.dispatchEvent(new Event("settings-subpage-exit"));
          localStorage.setItem("currentPage", "settingsPage");
          localStorage.setItem("settingPage", "settingsPage");
          break;
        case "ArrowUp":
          // If focusing first item and press up, go to navbar? Or wrap?
          // Currently let's go to navbar
          if (
            document.activeElement &&
            document.activeElement.previousElementSibling === null &&
            !document.activeElement.classList.contains("account-header")
          ) {
            localStorage.setItem("navigationFocus", "navbar");
            if (window.setNavbarFocus) {
              window.setNavbarFocus("settingsPage");
            }
          }
          // Browser default handles up/down between focusable items
          break;
        case "Backspace":
        case "Escape":
        case "Back":
        case "BrowserBack":
        case "XF86Back":
        case "10009":
          window.removeEventListener(
            "subpage-focus-start",
            handleSubPageFocusStart,
          );
          document.removeEventListener("keydown", accountInfoKeydownEvents);
          localStorage.setItem("currentPage", "homePage");
          Router.showPage("homePage");
          localStorage.setItem("navigationFocus", "navbar");
          if (window.setNavbarFocus) {
            window.setNavbarFocus("homePage");
          }
          e.preventDefault();
          break;
      }
    };

    document.addEventListener("keydown", accountInfoKeydownEvents);

    // Cleanup function
    AccountInformation.cleanup = function () {
      document.removeEventListener("keydown", accountInfoKeydownEvents);
      window.removeEventListener(
        "subpage-focus-start",
        handleSubPageFocusStart,
      );
    };

    // Initial focus if entering
    handleSubPageFocusStart();
  }, 0);

  return `
    <div class="account-info-container">
      <div class="account-header">Playlist information</div>
      
      <div class="account-details-list">
        <div class="account-detail-item" tabindex="0">
            <span class="detail-label">Username</span>
            <span class="detail-value">${userInfo.username || "N/A"}</span>
        </div>
        <div class="account-detail-item" tabindex="0">
            <span class="detail-label">Account Status</span>
            <span class="detail-value status-active">${
              userInfo.status || "N/A"
            }</span>
        </div>
        <div class="account-detail-item" tabindex="0">
            <span class="detail-label">Expiry Date</span>
            <span class="detail-value">${formatUnixDate(
              userInfo.exp_date || "N/A",
            )}</span>
        </div>
        <div class="account-detail-item" tabindex="0">
            <span class="detail-label">Active Connections</span>
            <span class="detail-value">${userInfo.active_cons || "N/A"}</span>
        </div>
      </div>
    </div>`;
}
