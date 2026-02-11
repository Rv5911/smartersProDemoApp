let isSortOptionsOpen = false;

function Navbar() {
  return `
    <div class="navbar-container">
      <div class="navbar-left">
        <img src="/assets/app-logo.png" alt="Logo" class="navbar-logo" />
        <div class="search-bar-container">
          <img src="/assets/search-icon-navbar.png" alt="Search Icon" class="nav-search-bar" />
          <input type="text" id="search-input" placeholder="Search" tabindex="0" class="search-bar" />
        </div>
      </div>
      <div class="navbar-right">
        <div class="nav-item" data-page="homePage" tabindex="0">Home</div>
        <div class="nav-item" data-page="moviesPage" tabindex="0">Movies</div>
        <div class="nav-item" data-page="seriesPage" tabindex="0">Series</div>
        <div class="nav-item" data-page="liveTvPage" tabindex="0">Live</div>


       <div class="navbar-profile">
  <img
    src="/assets/nav-profile-icon.png"
    alt="User Profile"
    id="profileIcon"
    tabindex="0"
    class="navbar-profile-icon"
  />
</div>

      </div>
    </div>

    <div id="sidebar" class="sidebar option-remove">
      <div class="sidebar-content-wrapper">
        <!-- Main Sidebar Section -->
        <div id="main-sidebar-section" class="sidebar-section active">
          <div class="sidebar-header">
            <div class="sidebar-user-info">
              <span>For SimonWinter</span>
            </div>
            <div class="sidebar-user-avatar">
              <i class="fa-solid fa-user"></i>
            </div>
          </div>

          <div class="sidebar-grid">
            <div class="sidebar-card" data-action="settings" tabindex="0">
              <i class="fa-solid fa-gear"></i>
              <span>Settings</span>
            </div>
            <div class="sidebar-card" data-action="playlist-info" tabindex="0">
              <i class="fa-solid fa-user"></i>
              <span>Playlist Info</span>
            </div>
            <div class="sidebar-card" data-action="switch-playlist" tabindex="0">
              <i class="fa-solid fa-arrows-rotate"></i>
              <span>Switch Playlist</span>
            </div>
            <div class="sidebar-card" data-action="add-playlist" tabindex="0">
              <i class="fa-solid fa-user-plus"></i>
              <span>Add Playlist</span>
            </div>
            <div class="sidebar-card" data-action="dark-mode" tabindex="0">
              <div class="sidebar-card-row">
                <i class="fa-solid fa-moon"></i>
                <div class="theme-toggle"></div>
              </div>
              <span>Dark Mode</span>
            </div>
            <div class="sidebar-card" data-action="sort" tabindex="0">
              <i class="fa-solid fa-filter"></i>
              <span>Sort</span>
            </div>
            <div class="sidebar-card" data-action="change-theme" tabindex="0">
              <i class="fa-solid fa-palette"></i>
              <span>Change Theme</span>
            </div>
          </div>

          <div class="sidebar-footer">
            <button class="footer-link-primary" data-action="switch-playlist-footer" tabindex="0">Switch Playlist</button>
            <span class="version-text">Version: v1.0</span>
            <span class="contact-text">Contact us at: <span class="contact-email">support@smarterspro.com</span></span>
          </div>
        </div>

        <!-- Playlist Info Section -->
        <div id="playlist-info-section" class="sidebar-section">
          <div class="nested-header">
            <div class="back-btn" tabindex="0">
              <i class="fa-solid fa-chevron-left"></i>
            </div>
            <span>Playlist Info</span>
          </div>

          <div class="info-list">
            <div class="info-row">
              <i class="fa-solid fa-user"></i>
              <span class="info-label">Username</span>
              <span class="info-value username-val">SimonWinter</span>
            </div>
            <div class="info-row">
              <i class="fa-solid fa-laptop-code"></i>
              <span class="info-label">Account Status</span>
              <span class="info-value status-val">N/A</span>
            </div>
            <div class="info-row">
              <i class="fa-solid fa-calendar-days"></i>
              <span class="info-label">Expiry Date</span>
              <span class="info-value expiry-val">Unlimited</span>
            </div>
            <div class="info-row">
              <i class="fa-solid fa-users"></i>
              <span class="info-label">Active Connections</span>
              <span class="info-value connections-val">N/A</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sort Dialog Overlay -->
    <div id="sort-dialog" class="sort-dialog-overlay option-remove">
      <div class="sort-dialog-content">
        <div class="sort-dialog-header">
           <span>Sort By</span>
        </div>
        <ul class="sort-list">
          <li class="sort-option" tabindex="0" data-sort="default">
            <label class="checkbox-container">
              <input type="checkbox" class="sort-checkbox" data-sort="default">
              <span class="checkmark"></span>
              Default
            </label>
          </li>
          <li class="sort-option" tabindex="0" data-sort="recently-added">
            <label class="checkbox-container">
              <input type="checkbox" class="sort-checkbox" data-sort="recently-added">
              <span class="checkmark"></span>
              Recently Added
            </label>
          </li>
          <li class="sort-option" tabindex="0" data-sort="a-z">
            <label class="checkbox-container">
              <input type="checkbox" class="sort-checkbox" data-sort="a-z">
              <span class="checkmark"></span>
              A-Z
            </label>
          </li>
          <li class="sort-option" tabindex="0" data-sort="z-a">
            <label class="checkbox-container">
              <input type="checkbox" class="sort-checkbox" data-sort="z-a">
              <span class="checkmark"></span>
              Z-A
            </label>
          </li>
          <li class="sort-option" tabindex="0" data-sort="top-rated">
            <label class="checkbox-container">
              <input type="checkbox" class="sort-checkbox" data-sort="top-rated">
              <span class="checkmark"></span>
              Top Rated
            </label>
          </li>
        </ul>
      </div>
    </div>
  `;
}

function buildDynamicSidebarOptions() {
  try {
    const sidebar = document.getElementById("sidebar");
    if (!sidebar) return;
    const grid = sidebar.querySelector(".sidebar-grid");
    if (!grid) return;

    // Remove existing dynamic cards
    grid
      .querySelectorAll(".dynamic-sidebar-option")
      .forEach((el) => el.remove());

    const currentPage = localStorage.getItem("currentPage");

    // Handle Sort Card Visibility
    const sortCard = grid.querySelector('[data-action="sort"]');
    if (sortCard) {
      const SORT_ENABLED_PAGES = ["moviesPage", "seriesPage", "liveTvPage"];
      if (SORT_ENABLED_PAGES.includes(currentPage)) {
        sortCard.classList.remove("option-remove");

        // Handle Top Rated option within the sort menu
        const topRatedOption = document.querySelector(
          '.sort-checkbox[data-sort="top-rated"]',
        );
        if (topRatedOption) {
          const li = topRatedOption.closest("li");
          if (li) {
            if (currentPage === "liveTvPage") li.classList.add("option-remove");
            else li.classList.remove("option-remove");
          }
        }
      } else {
        sortCard.classList.add("option-remove");
      }
    }

    const currentPlaylist = getCurrentPlaylist();
    if (!currentPlaylist) return;

    let label = "";
    let action = "";
    const allRecentlyWatchedMovies = currentPlaylist.continueWatchingMovies;
    const allRecentlyWatchedSeries = currentPlaylist.continueWatchingSeries;
    const allRecentlyWatchedChannels = currentPlaylist.ChannelListLive;
    const selectedMovieId = localStorage.getItem("selectedMovieId");
    const selectedSeriesId = localStorage.getItem("selectedSeriesId");

    const isIncludedInRecentlyWatchedMovies =
      allRecentlyWatchedMovies &&
      allRecentlyWatchedMovies.some((m) => m && m.itemId == selectedMovieId);
    const isIncludedInRecentlyWatchedSeries =
      allRecentlyWatchedSeries &&
      allRecentlyWatchedSeries.some((s) => s && s.itemId == selectedSeriesId);

    if (currentPage === "moviesPage") {
      if (allRecentlyWatchedMovies && allRecentlyWatchedMovies.length > 0) {
        label = "Clear Movie History";
        action = "remove-all-movies";
      }
    } else if (currentPage === "seriesPage") {
      if (allRecentlyWatchedSeries && allRecentlyWatchedSeries.length > 0) {
        label = "Clear Series History";
        action = "remove-all-series";
      }
    } else if (currentPage === "liveTvPage") {
      if (allRecentlyWatchedChannels && allRecentlyWatchedChannels.length > 0) {
        label = "Clear TV History";
        action = "clear-channel-history";
      }
    } else if (currentPage === "movieDetailPage") {
      if (isIncludedInRecentlyWatchedMovies) {
        label = "Remove Movie History";
        action = "remove-movie";
      }
    } else if (currentPage === "seriesDetailPage") {
      if (isIncludedInRecentlyWatchedSeries) {
        label = "Remove Series History";
        action = "remove-series";
      }
    }

    if (action) {
      const div = document.createElement("div");
      div.className = "sidebar-card dynamic-sidebar-option";
      div.setAttribute("tabindex", "0");
      div.dataset.action = action;
      div.innerHTML = `<i class="fa fa-trash"></i> <span>${label}</span>`;
      grid.appendChild(div);
    }
  } catch (e) {
    console.error("buildDynamicSidebarOptions error", e);
  }
}

// Helpers to update favourites in localStorage
function getSelectedPlaylistName() {
  try {
    const sel = JSON.parse(localStorage.getItem("selectedPlaylist") || "null");
    return sel && sel.playlistName ? sel.playlistName : null;
  } catch (e) {
    return null;
  }
}

function updatePlaylistsData(updateFn) {
  try {
    const playlists = JSON.parse(localStorage.getItem("playlistsData") || "[]");
    const name = getSelectedPlaylistName();
    if (!name)
      return {
        success: false,
      };
    const updated = playlists.map((pl) => {
      if (pl.playlistName === name) {
        return updateFn(pl);
      }
      return pl;
    });
    localStorage.setItem("playlistsData", JSON.stringify(updated));
    return {
      success: true,
    };
  } catch (e) {
    console.error("updatePlaylistsData error", e);
    return {
      success: false,
      error: e,
    };
  }
}

function removeAllFavoriteMovies() {
  const res = updatePlaylistsData((pl) => ({
    ...pl,
    favouriteMovies: [],
  }));
  if (res.success) {
    if (typeof refreshMoviesFavoritesList === "function")
      refreshMoviesFavoritesList();
    document
      .querySelectorAll(".movie-card-heart")
      .forEach((h) => (h.style.display = "none"));
    if (typeof Toaster !== "undefined" && Toaster.showToast) {
      Toaster.showToast("success", "Removed all favorite movies");
    }
  }
}

function removeAllFavoriteSeries() {
  const res = updatePlaylistsData((pl) => ({
    ...pl,
    favouriteSeries: [],
  }));
  if (res.success) {
    if (typeof refreshSeriesFavoritesList === "function")
      refreshSeriesFavoritesList();
    document
      .querySelectorAll(".series-card-heart")
      .forEach((h) => (h.style.display = "none"));
    if (typeof Toaster !== "undefined" && Toaster.showToast) {
      Toaster.showToast("success", "Removed all favorite series");
    }
  }
}

function removeAllChannelHistory() {
  const res = updatePlaylistsData((pl) => ({
    ...pl,
    ChannelListLive: [],
  }));
  if (res.success) {
    if (typeof Toaster !== "undefined" && Toaster.showToast) {
      Toaster.showToast("success", "Cleared channel history");
    }
  }
}

function removeFavoriteMovieById(streamId) {
  if (!streamId) return;
  const res = updatePlaylistsData((pl) => {
    const fav = Array.isArray(pl.favouriteMovies) ? pl.favouriteMovies : [];
    const filtered = fav.filter((id) => String(id) !== String(streamId));
    return {
      ...pl,
      favouriteMovies: filtered,
    };
  });
  if (res.success) {
    // Update detail page button if present
    const favBtn = document.querySelector(".movie-detail-fav-button");
    if (favBtn) {
      const heartIcon = favBtn.querySelector(".heart-icon");
      const favText = favBtn.querySelector(".fav-text");
      if (heartIcon)
        heartIcon.innerHTML = '<i class="fa-regular fa-heart"></i>';
      if (favText) favText.textContent = "Add to Favorites";
    }
    document
      .querySelectorAll(
        '.movie-card[data-stream-id="' + streamId + '"] .movie-card-heart',
      )
      .forEach((h) => (h.style.display = "none"));
    if (typeof refreshMoviesFavoritesList === "function")
      refreshMoviesFavoritesList();
    if (typeof Toaster !== "undefined" && Toaster.showToast) {
      Toaster.showToast("success", "Removed movie from favorites");
    }
  }
}

function removeFavoriteSeriesById(seriesId) {
  if (!seriesId) return;
  const res = updatePlaylistsData((pl) => {
    const fav = Array.isArray(pl.favouriteSeries) ? pl.favouriteSeries : [];
    const filtered = fav.filter((id) => String(id) !== String(seriesId));
    return {
      ...pl,
      favouriteSeries: filtered,
    };
  });
  if (res.success) {
    const favBtn = document.querySelector(".series-detail-fav-button");
    if (favBtn) {
      const heartIcon = favBtn.querySelector(".heart-icon");
      const favText = favBtn.querySelector(".fav-text");
      if (heartIcon)
        heartIcon.innerHTML = '<i class="fa-regular fa-heart"></i>';
      if (favText) favText.textContent = "Add to Favorites";
    }
    document
      .querySelectorAll(
        '.series-card[data-series-id="' + seriesId + '"] .series-card-heart',
      )
      .forEach((h) => (h.style.display = "none"));
    if (typeof refreshSeriesFavoritesList === "function")
      refreshSeriesFavoritesList();
    if (typeof Toaster !== "undefined" && Toaster.showToast) {
      Toaster.showToast("success", "Removed series from favorites");
    }
  }
}

function removeAllRecentlyWatchedMovies() {
  const res = updatePlaylistsData((pl) => ({
    ...pl,
    continueWatchingMovies: [],
  }));
  if (res.success) {
    if (typeof Toaster !== "undefined" && Toaster.showToast) {
      Toaster.showToast("success", "Cleared movies history");
    }
  }
}

function removeAllRecentlyWatchedSeries() {
  const res = updatePlaylistsData((pl) => ({
    ...pl,
    continueWatchingSeries: [],
  }));
  if (res.success) {
    if (typeof Toaster !== "undefined" && Toaster.showToast) {
      Toaster.showToast("success", "Cleared series history");
    }
  }
}

function removeRecentlyWatchedMovieById(streamId) {
  if (!streamId) return;
  const res = updatePlaylistsData((pl) => {
    const list = Array.isArray(pl.continueWatchingMovies)
      ? pl.continueWatchingMovies
      : [];
    const filtered = list.filter(
      (item) => item && String(item.itemId) !== String(streamId),
    );
    return {
      ...pl,
      continueWatchingMovies: filtered,
    };
  });
  if (res.success) {
    if (typeof Toaster !== "undefined" && Toaster.showToast) {
      Toaster.showToast("success", "Removed movie from history");
    }
  }
}

function removeRecentlyWatchedSeriesById(seriesId) {
  if (!seriesId) return;
  const res = updatePlaylistsData((pl) => {
    const list = Array.isArray(pl.continueWatchingSeries)
      ? pl.continueWatchingSeries
      : [];
    const filtered = list.filter(
      (item) => item && String(item.itemId) !== String(seriesId),
    );
    return {
      ...pl,
      continueWatchingSeries: filtered,
    };
  });
  if (res.success) {
    if (typeof Toaster !== "undefined" && Toaster.showToast) {
      Toaster.showToast("success", "Removed series from history");
    }
  }
}

function initNavbar() {
  const navItems = Array.from(document.querySelectorAll(".nav-item"));
  const sidebar = document.getElementById("sidebar");

  function highlightNavItem(index) {
    if (typeof setActiveItem === "function") {
      setActiveItem(index);
    }

    if (index === 0) {
      if (
        document.activeElement &&
        typeof document.activeElement.blur === "function"
      ) {
        document.activeElement.blur();
      }
      if (searchInput && typeof searchInput.blur === "function") {
        searchInput.blur();
      }
    } else if (index === totalItems - 1) {
      if (profileIcon && typeof profileIcon.focus === "function") {
        profileIcon.focus();
      }
    } else {
      if (
        navItems &&
        navItems[index - 1] &&
        typeof navItems[index - 1].focus === "function"
      ) {
        navItems[index - 1].focus();
      }
    }
  }

  // Navbar scroll logic
  // Navbar scroll logic refactored
  let currentScrollContainer = null;
  const navbarContainer = document.querySelector(".navbar-container");

  function handleNavbarScroll() {
    if (!navbarContainer) return;

    let scrollTop = 0;
    // Lower threshold to 20% of viewport
    const threshold = window.innerHeight * 0.2;

    if (currentScrollContainer === window) {
      scrollTop = window.scrollY;
    } else if (currentScrollContainer) {
      scrollTop = currentScrollContainer.scrollTop;
    }

    if (scrollTop > threshold) {
      navbarContainer.classList.add("navbar-hidden");
    } else {
      navbarContainer.classList.remove("navbar-hidden");
    }
  }

  function setupNavbarScrollListener() {
    const currentPage = localStorage.getItem("currentPage");
    let newContainer = window; // Default to window

    // Determine the scroll container based on the current page
    if (currentPage === "movieDetailPage") {
      const el = document.querySelector(".movie-detail-page-container");
      if (el) newContainer = el;
    } else if (currentPage === "seriesDetailPage") {
      const el = document.querySelector(
        ".series-detail-page-content-container",
      );
      if (el) newContainer = el;
    }
    // MoviesPage and SeriesPage typically scroll via window, so default applies

    // Only update if the container has changed or we need to re-attach
    // (Equality check for window works, DOM elements work by ref)
    if (currentScrollContainer !== newContainer || !currentScrollContainer) {
      // Clean up old listener
      if (currentScrollContainer) {
        currentScrollContainer.removeEventListener(
          "scroll",
          handleNavbarScroll,
        );
      }

      currentScrollContainer = newContainer;

      // Attach new listener
      if (currentScrollContainer) {
        currentScrollContainer.addEventListener("scroll", handleNavbarScroll);
        // Reset visibility state when switching pages
        if (navbarContainer) navbarContainer.classList.remove("navbar-hidden");
      }
    }
  }

  // Initial setup
  setupNavbarScrollListener();

  // Watch for page changes (DOM updates) to re-attach listeners
  const appContainer = document.getElementById("main-app-container");
  if (appContainer) {
    const observer = new MutationObserver(() => {
      // Re-run setup when DOM changes (navigation)
      setupNavbarScrollListener();
    });
    // Observer options: check for child list changes (new pages loading)
    observer.observe(appContainer, {
      childList: true,
      subtree: false,
    });
  }
  const profileIcon = document.getElementById("profileIcon");
  const searchInput = document.getElementById("search-input");

  // Legacy sort menu elements removed
  // const sortItem = sidebar.querySelector(".sidebar-sort");
  // const sortOptions = document.getElementById("sort-options");
  // const arrowIcon = sortItem.querySelector(".arrow-icon");
  // const sortCheckboxes = Array.from(
  //   document.querySelectorAll(".sort-checkbox"),
  // );

  let currentIndex = 0;
  const totalItems = navItems.length + 2;

  const pageIndexMap = {
    homePage: 0,
    moviesPage: 1,
    seriesPage: 2,
    liveTvPage: 3,
  };

  // Add this function to dispose Live TV player
  const disposeLiveTvPlayer = () => {
    if (localStorage.getItem("currentPage") === "liveTvPage") {
      // Call Live TV page cleanup if it exists
      if (
        typeof LiveTvPage !== "undefined" &&
        typeof LiveTvPage.cleanup === "function"
      ) {
        LiveTvPage.cleanup();
      }

      // Additional cleanup for live player
      if (window.livePlayer) {
        try {
          if (typeof window.livePlayer.dispose === "function") {
            window.livePlayer.dispose();
          } else if (typeof window.livePlayer.destroy === "function") {
            window.livePlayer.destroy();
          }
        } catch (error) {
          console.log("Error disposing live player:", error);
        }
        window.livePlayer = null;
      }

      // Clean up video elements
      const videoWrappers = document.querySelectorAll(
        ".livetv-video-wrapper, .live-video-player-div",
      );
      videoWrappers.forEach((wrapper) => {
        const videos = wrapper.querySelectorAll("video");
        videos.forEach((video) => {
          video.pause();
          video.src = "";
          video.load();
        });
      });
    }
  };

  const resetParentalControlState = () => {
    if (typeof window.resetMoviesParentalState === "function") {
      window.resetMoviesParentalState();
    }
    if (typeof window.resetSeriesParentalState === "function") {
      window.resetSeriesParentalState();
    }
  };
  // Initialize search query in window object
  window.searchQuery = window.searchQuery || "";

  setSortOption("default");

  updateNavbarActive(localStorage.getItem("currentPage"));
  buildDynamicSidebarOptions();

  let searchDebounceTimer = null;
  const SEARCH_DEBOUNCE_MS = 500;
  searchInput.addEventListener("input", (e) => {
    window.searchQuery = e.target.value || "";

    const currentPage = localStorage.getItem("currentPage");
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("global-search", {
          detail: window.searchQuery,
        }),
      );

      if (currentPage === "moviesPage") {
        try {
          if (typeof window.rerenderMoviesPage === "function") {
            Router.showPage("moviesPage");
            localStorage.setItem("navigationFocus", "navbar");
            searchInput.focus();
          }
        } catch (err) {}
      } else if (currentPage === "seriesPage") {
        try {
          if (typeof window.rerenderSeriesPage === "function") {
            Router.showPage("seriesPage");
            localStorage.setItem("navigationFocus", "navbar");
            searchInput.focus();
          }
        } catch (err) {}
      }
    }, SEARCH_DEBOUNCE_MS);
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" || e.key === "Delete") {
      e.stopPropagation();
    }
  });

  navItems.forEach((item, index) => {
    item.addEventListener("click", () => {
      // Clear search query
      window.searchQuery = "";
      if (searchInput) searchInput.value = "";

      const page = item.getAttribute("data-page");
      disposeLiveTvPlayer();
      resetParentalControlState();
      Router.showPage(page);
      updateNavbarActive(page);
      buildDynamicSidebarOptions();
    });

    item.addEventListener("focus", () => {
      localStorage.setItem("navigationFocus", "navbar");
      setActiveItem(index + 1);
    });
  });

  profileIcon.addEventListener("click", openSidebar);
  profileIcon.addEventListener("focus", () => {
    localStorage.setItem("navigationFocus", "navbar");
    setActiveItem(totalItems - 1);
  });
  profileIcon.addEventListener("blur", () => {
    profileIcon.classList.remove("active");
  });

  // Restore sort listeners
  const sortItem = sidebar.querySelector('[data-action="sort"]');
  if (sortItem) sortItem.addEventListener("click", toggleSortMenu);

  const sortCheckboxes = Array.from(
    document.querySelectorAll(".sort-checkbox"),
  );
  if (sortCheckboxes) {
    sortCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", (e) => {
        if (e.target.checked) {
          setSortOption(e.target.dataset.sort);
        }
      });
    });
  }

  // Sidebar card focus management
  const sidebarCards = document.querySelectorAll(".sidebar-card");
  sidebarCards.forEach((card) => {
    card.addEventListener("focus", () => {
      // Remove active from all other cards
      document
        .querySelectorAll(".sidebar-card")
        .forEach((c) => c.classList.remove("active"));
      card.classList.add("active");
    });
    card.addEventListener("blur", () => {
      // Keep Sort card active while its dialog is open
      if (card.dataset.action === "sort" && isSortOptionsOpen) return;
      card.classList.remove("active");
    });
  });

  setSortOption("default");

  document.addEventListener("keydown", (e) => {
    const navigationFocus = localStorage.getItem("navigationFocus");
    const currentPage = localStorage.getItem("currentPage");
    const key = e.key;
    const keyCode = e.keyCode;

    // Pages where navbar should not be active
    const NAVBAR_INACTIVE_PAGES = [
      "loginPage",
      "listPage",
      // "settingsPage",
      "exitModal",
    ];
    if (NAVBAR_INACTIVE_PAGES.includes(currentPage)) {
      return; // Don't process any navbar keydown events on these pages
    }

    if (isSortOptionsOpen) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      handleSortOptionsKeys(e);
      return;
    }

    const isSearchFocused = document.activeElement === searchInput;

    const backKeys = [
      10009,
      100079,
      8,
      461,
      27,
      "Escape",
      "Back",
      "BrowserBack",
      "XF86Back",
      "Backspace",
    ];

    const isBackKey = backKeys.includes(key) || backKeys.includes(keyCode);

    if (isBackKey) {
      if (sidebar && !sidebar.classList.contains("option-remove")) {
        e.preventDefault();
        // CRITICAL: prevent page-level "back" handlers from firing
        // when we're just closing the sidebar.
        e.stopPropagation();
        e.stopImmediatePropagation();
        closeSidebar();
        return;
      }

      if (currentPage !== "homePage") {
        if (currentPage === "movieDetailPage") {
          e.preventDefault();
          localStorage.removeItem("selectedMovieId");
          Router.showPage("moviesPage");
          return;
        }
        if (currentPage === "seriesDetailPage") {
          const dropdownList = document.getElementById("season-dropdown-list");
          if (dropdownList && !dropdownList.classList.contains("hidden")) {
            // Let SeriesDetailPage handle closing the dropdown
            return;
          }
          e.preventDefault();
          localStorage.removeItem("selectedSeriesId");
          Router.showPage("seriesPage");
          return;
        }
        return;
      }
      e.preventDefault();
      localStorage.setItem("returnPage", currentPage);
      localStorage.setItem("returnFocus", "navbar");
      localStorage.setItem("currentPage", "exitModal");
      Router.showPage("exitModal");
      return;
    }

    if (
      isSearchFocused &&
      !["ArrowLeft", "ArrowRight", "ArrowDown"].includes(key)
    ) {
      return;
    }

    if (sidebar && !sidebar.classList.contains("option-remove")) {
      if (
        [
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "Enter",
          "Escape",
          "Backspace",
          "XF86Back",
        ].includes(key) ||
        isBackKey
      ) {
        e.preventDefault();
        // Prevent underlying page from also handling the same key
        e.stopPropagation();
        e.stopImmediatePropagation();
        handleSidebarKeys(e);
        return;
      }
    }

    // Only process navbar keys if navigation focus is navbar
    if (navigationFocus !== "navbar") {
      return;
    }

    // Allow ArrowLeft/ArrowRight default behavior if search input is focused
    if (isSearchFocused && ["ArrowLeft", "ArrowRight"].includes(key)) {
      // Do not prevent default
    } else if (["ArrowLeft", "ArrowRight"].includes(key)) {
      e.preventDefault();
    }

    switch (key) {
      case "ArrowRight":
        if (profileIcon.classList.contains("active")) {
          return;
        } else {
          currentIndex = (currentIndex + 1) % totalItems;
          highlightNavItem(currentIndex);
          break;
        }
      case "ArrowLeft":
        if (searchInput.classList.contains("active")) {
          document
            .querySelectorAll(".nav-item")
            .forEach((item) => item.classList.remove("active"));
          profileIcon.classList.remove("active");
          searchInput.blur();
        } else {
          // If Home is focused (currentIndex === 1) and search is hidden, do nothing
          if (currentIndex === 1) {
            const searchContainer = document.querySelector(
              ".search-bar-container",
            );
            if (
              searchContainer &&
              searchContainer.style.visibility === "hidden"
            ) {
              return;
            }
          }
          currentIndex = (currentIndex - 1 + totalItems) % totalItems;
          highlightNavItem(currentIndex);
        }
        break;
      case "ArrowDown":
        // Handle ArrowDown for homePage, moviesPage, liveTvPage, and seriesPage
        if (
          (currentPage === "homePage" ||
            currentPage === "moviesPage" ||
            currentPage === "liveTvPage" ||
            currentPage == "movieDetailPage" ||
            currentPage == "seriesDetailPage" ||
            currentPage === "seriesPage" ||
            currentPage === "settingsPage") &&
          navigationFocus === "navbar"
        ) {
          e.preventDefault();
          e.stopImmediatePropagation();

          if (
            document.activeElement &&
            typeof document.activeElement.blur === "function"
          ) {
            document.activeElement.blur();
          }
          searchInput.blur();

          navItems.forEach((item) => item.classList.remove("active"));
          searchInput.classList.remove("active");
          profileIcon.classList.remove("active");

          // For homePage, prioritize Banner
          if (currentPage === "homePage") {
            localStorage.setItem("navigationFocus", "homePage");
            // Dispatched custom event can be handled in HomePage if needed
            window.dispatchEvent(
              new CustomEvent("navigation-focus-change", {
                detail: {
                  page: "homePage",
                  focus: "watchNow",
                },
              }),
            );
            return;
          }

          // For liveTvPage, focus on category search input
          if (currentPage === "liveTvPage") {
            localStorage.setItem("navigationFocus", "sidebarSearch");

            // Dispatch event to let LivePage know focus has changed
            window.dispatchEvent(new CustomEvent("navigation-focus-change"));

            e.preventDefault();
            e.stopImmediatePropagation();
            return;
          }

          if (currentPage === "seriesDetailPage") {
            localStorage.setItem("navigationFocus", "seriesDetailPage");

            setTimeout(() => {
              // Remove navbar focus
              navItems.forEach((item) => item.classList.remove("active"));
              searchInput.classList.remove("active");
              profileIcon.classList.remove("active");

              // Focus on play button in series detail
              const playBtn = document.querySelector(
                ".series-detail-play-button",
              );
              if (playBtn) {
                playBtn.classList.add("series-detail-button-focused");
                playBtn.focus();
              }
            }, 10);

            e.preventDefault();
            e.stopImmediatePropagation();
            return;
          }

          if (currentPage === "movieDetailPage") {
            localStorage.setItem("navigationFocus", "movieDetailPage");
            setTimeout(() => {
              const firstDetailPlayBtn = document.querySelector(
                ".movie-detail-play-button",
              );
              if (firstDetailPlayBtn) {
                document
                  .querySelectorAll(".movie-detail-button-focused")
                  .forEach((btn) =>
                    btn.classList.remove("movie-detail-button-focused"),
                  );
                firstDetailPlayBtn.classList.add("movie-detail-button-focused");
                firstDetailPlayBtn.focus();
                localStorage.setItem("navigationFocus", "movieDetailPage");
                localStorage.setItem("currentPage", "movieDetailPage");
              }
            }, 0);
            e.preventDefault();
            e.stopImmediatePropagation();
            return;
          }

          // MoviesPage: prioritize Banner on initial down from navbar
          if (currentPage === "moviesPage" && window.moviesNavigationState) {
            localStorage.setItem("navigationFocus", "moviesPage");
            if (window.searchQuery) {
              if (typeof window.focusFirstMoviesCard === "function") {
                window.focusFirstMoviesCard();
              } else {
                // Fallback if function not ready
                window.moviesNavigationState.focus = "categories";
                window.moviesNavigationState.currentCategoryIndex = 0;
                window.moviesNavigationState.currentCardIndex = 0;
                if (typeof window.updateMoviesFocus === "function") {
                  window.updateMoviesFocus();
                }
              }
            } else {
              window.moviesNavigationState.focus = "watchNow";
              window.moviesNavigationState.currentCategoryIndex = 0;
              window.moviesNavigationState.currentCardIndex = 0;
              window.moviesNavigationState.justTransitioned = true; // Prevent immediate jump

              if (typeof window.updateMoviesFocus === "function") {
                window.updateMoviesFocus();
              }
            }

            if (typeof window.saveMoviesNavigationState === "function") {
              window.saveMoviesNavigationState();
            }
            e.preventDefault();
            e.stopImmediatePropagation();
            return;
          }

          // SeriesPage: prioritize Banner on initial down from navbar
          if (currentPage === "seriesPage" && window.seriesNavigationState) {
            localStorage.setItem("navigationFocus", "seriesPage");
            if (window.searchQuery) {
              if (typeof window.focusFirstSeriesCard === "function") {
                window.focusFirstSeriesCard();
              } else {
                // Fallback
                window.seriesNavigationState.focus = "categories";
                window.seriesNavigationState.currentCategoryIndex = 0;
                window.seriesNavigationState.currentCardIndex = 0;
                if (typeof window.updateSeriesFocus === "function") {
                  window.updateSeriesFocus();
                }
              }
            } else {
              window.seriesNavigationState.focus = "watchNow";
              window.seriesNavigationState.currentCategoryIndex = 0;
              window.seriesNavigationState.currentCardIndex = 0;
              window.seriesNavigationState.justTransitioned = true; // Prevent immediate jump

              if (typeof window.updateSeriesFocus === "function") {
                window.updateSeriesFocus();
              }
            }

            if (typeof window.saveSeriesNavigationState === "function") {
              window.saveSeriesNavigationState();
            }
            e.preventDefault();
            e.stopImmediatePropagation();
            return;
          }

          // SettingsPage: Release focus from navbar
          if (currentPage === "settingsPage") {
            localStorage.setItem("navigationFocus", "settingsPage"); // Use specific focus

            navItems.forEach((item) => item.classList.remove("active"));
            searchInput.classList.remove("active");
            profileIcon.classList.remove("active");
            if (
              document.activeElement &&
              typeof document.activeElement.blur === "function"
            ) {
              document.activeElement.blur();
            }

            // Dispatch event or call method to focus first settings item if needed
            // In SettingsPage.js, it likely watches navigationFocus or we can dispatch an event
            window.dispatchEvent(
              new CustomEvent("settings-focus-change", {
                detail: {
                  focus: "start",
                },
              }),
            );

            e.preventDefault();
            e.stopImmediatePropagation();
            return;
          }
        }
        break;
      case "Enter":
        if (currentIndex === 0) {
          searchInput.focus();
        } else if (currentIndex === totalItems - 1) {
          openSidebar();
        } else {
          if (window.cleanupMoviesNavigation) {
            window.cleanupMoviesNavigation();
          }
          if (window.cleanupSeriesNavigation) {
            window.cleanupSeriesNavigation();
          }
          const page = navItems[currentIndex - 1].getAttribute("data-page");
          window.searchQuery = "";
          clearMoviesAndSeriesLocalStorage();
          disposeLiveTvPlayer();
          resetParentalControlState();
          Router.showPage(page);
          updateNavbarActive(page);
        }
        break;
      case "Escape":
      case "Backspace":
      case "XF86Back":
        // This block is now mostly redundant due to isBackKey check at the top
        if (sidebar && !sidebar.classList.contains("option-remove")) {
          closeSidebar();
        }
        break;
    }
  });
  searchInput.addEventListener("focus", () => {
    localStorage.setItem("navigationFocus", "navbar");
    setActiveItem(0);
  });

  searchInput.addEventListener("blur", () => {
    searchInput.classList.remove("active");
  });

  function setActiveItem(index) {
    currentIndex = index;
    searchInput.classList.remove("active");
    navItems.forEach((i) => i.classList.remove("active"));
    profileIcon.classList.remove("active");

    if (index === 0) {
      searchInput.classList.add("active");
    } else if (index === totalItems - 1) {
      profileIcon.classList.add("active");
    } else {
      const item = navItems[index - 1];
      if (item) item.classList.add("active");
    }
  }

  function updateSearchVisibility(page) {
    // Pages where search input should be visible
    const PAGES_WITH_SEARCH = ["moviesPage", "seriesPage"];

    // Handle search input visibility
    const searchContainer = document.querySelector(".search-bar-container");
    const searchInput = document.getElementById("search-input");
    const searchIcon = document.querySelector(".nav-search-bar");

    if (searchContainer) {
      let checkPage = page;
      if (page === "exitModal") {
        checkPage = localStorage.getItem("returnPage") || page;
      }

      if (PAGES_WITH_SEARCH.includes(checkPage)) {
        searchContainer.style.visibility = "visible";
        // Reset display property that might have been set by other pages (e.g., LivePage)
        if (searchInput) searchInput.style.display = "";
        if (searchIcon) searchIcon.style.display = "";
      } else {
        searchContainer.style.visibility = "hidden";
      }
    }
  }

  function updateNavbarActive(page) {
    const index = pageIndexMap[page] || 0;
    currentIndex = index + 1;
    highlightNavItem(currentIndex);
    localStorage.setItem("navigationFocus", "navbar");

    updateSearchVisibility(page);
  }

  window.updateSearchVisibility = updateSearchVisibility;

  function openSidebar() {
    buildDynamicSidebarOptions();
    sidebar.classList.remove("option-remove");
    sidebar.classList.add("active");
    sidebar.style.display = "flex";
    localStorage.setItem("navigationFocus", "sidebar");

    // Switch to main view by default
    showSidebarSection("main");

    // Populate user info
    const selectedPlaylist = JSON.parse(
      localStorage.getItem("selectedPlaylist") || "{}",
    );
    const username =
      selectedPlaylist.username || selectedPlaylist.playlistName || "User";

    const headerName = document.querySelector(".sidebar-user-info span");
    if (headerName) headerName.textContent = `For ${username}`;

    const infoName = document.querySelector(".username-val");
    if (infoName) infoName.textContent = username;

    const info = selectedPlaylist.subscription || {};
    if (document.querySelector(".status-val"))
      document.querySelector(".status-val").textContent = info.status || "N/A";
    if (document.querySelector(".expiry-val"))
      document.querySelector(".expiry-val").textContent = info.expiry_date
        ? new Date(info.expiry_date * 1000).toLocaleDateString()
        : "Unlimited";
    if (document.querySelector(".connections-val"))
      document.querySelector(".connections-val").textContent =
        info.active_cons || "N/A";

    // Focus first card
    const firstCard = document.querySelector(".sidebar-card");
    if (firstCard) firstCard.focus();
  }

  function showSidebarSection(section) {
    const mainSection = document.getElementById("main-sidebar-section");
    const infoSection = document.getElementById("playlist-info-section");

    if (section === "main") {
      mainSection.classList.add("active");
      infoSection.classList.remove("active");
    } else {
      mainSection.classList.remove("active");
      infoSection.classList.add("active");
    }
  }

  window.setNavbarFocus = function (pageName) {
    const index = pageIndexMap[pageName];
    if (index !== undefined) {
      currentIndex = index + 1; // +1 because 0 is search
      highlightNavItem(currentIndex);
      localStorage.setItem("navigationFocus", "navbar");
    }
  };

  function closeSidebar() {
    sidebar.classList.remove("active");
    setTimeout(() => {
      sidebar.classList.add("option-remove");
      sidebar.style.display = "none";
    }, 300);

    localStorage.setItem("navigationFocus", "navbar");

    localStorage.setItem("navigationFocus", "navbar");
    isSortOptionsOpen = false;

    setTimeout(() => {
      if (profileIcon) {
        profileIcon.focus();
        profileIcon.classList.add("active");
      }
    }, 10);
  }
  window.closeSidebar = closeSidebar;

  function handleLogOut() {
    // Clear HomeCarousel cache
    window.homeCarouselCachedSliderData = null;
    window.homeCarouselCachedPlaylistName = null;

    localStorage.setItem("isLogin", false);

    // const playlistsData = localStorage.getItem("playlistsData")
    //   ? JSON.parse(localStorage.getItem("playlistsData"))
    //   : [];

    // if (playlistsData.length > 0) {
    //   localStorage.removeItem("currentPlaylistData");
    //   localStorage.removeItem("selectedPlaylist");
    //   localStorage.setItem("navigationFocus", "");
    //   localStorage.setItem("isLogin", false);
    //   Router.showPage("listPage");
    // } else {
    //   resetParentalControlState();
    //   localStorage.removeItem("currentPlaylistData");
    //   localStorage.removeItem("selectedPlaylist");
    //   localStorage.setItem("currentPage", "login");
    //   Router.showPage("login");
    // }

    resetParentalControlState();
    localStorage.removeItem("currentPlaylistData");
    localStorage.removeItem("selectedPlaylist");
    localStorage.setItem("currentPage", "login");
    Router.showPage("login");

    closeSidebar();
  }

  function handleSidebarKeys(e) {
    if (isSortOptionsOpen) {
      handleSortOptionsKeys(e);
      return;
    }

    const activeSection = document.querySelector(".sidebar-section.active");
    if (!activeSection) return;

    const focusableItems = Array.from(
      activeSection.querySelectorAll('[tabindex="0"]'),
    );
    let activeIndex = focusableItems.indexOf(document.activeElement);

    if (activeSection.id === "main-sidebar-section") {
      // Grid Navigation for Main Section
      const gridItems = Array.from(
        activeSection.querySelectorAll(".sidebar-card:not(.option-remove)"),
      );
      const footerBtn = activeSection.querySelector(".footer-link-primary");

      let gridIndex = gridItems.indexOf(document.activeElement);

      switch (e.key) {
        case "ArrowRight":
          if (
            gridIndex !== -1 &&
            gridIndex % 2 === 0 &&
            gridIndex + 1 < gridItems.length
          ) {
            gridItems[gridIndex + 1].focus();
          }
          break;
        case "ArrowLeft":
          if (gridIndex !== -1 && gridIndex % 2 !== 0) {
            gridItems[gridIndex - 1].focus();
          }
          break;
        case "ArrowDown":
          if (gridIndex !== -1) {
            if (gridIndex + 2 < gridItems.length) {
              gridItems[gridIndex + 2].focus();
            } else {
              if (footerBtn) {
                footerBtn.focus();
              }
            }
          }
          break;
        case "ArrowUp":
          if (gridIndex !== -1) {
            if (gridIndex - 2 >= 0) {
              gridItems[gridIndex - 2].focus();
            }
          } else if (document.activeElement === footerBtn) {
            gridItems[gridItems.length - 1].focus();
          }
          break;
        case "Enter":
          const action = document.activeElement.dataset.action;
          if (action === "sort") {
            toggleSortMenu();
          } else if (action === "settings") {
            disposeLiveTvPlayer();
            Router.showPage("settingsPage");
            closeSidebar();
          } else if (action === "playlist-info") {
            showSidebarSection("info");
            setTimeout(() => document.querySelector(".back-btn").focus(), 10);
          } else if (
            action === "switch-playlist" ||
            action === "switch-playlist-footer"
          ) {
            disposeLiveTvPlayer();
            localStorage.removeItem("selectedPlaylist");
            localStorage.setItem("isLogin", false);
            Router.showPage("listPage");
            closeSidebar();
          } else if (action === "add-playlist") {
            handleLogOut();
          } else if (action === "remove-all-movies") {
            removeAllRecentlyWatchedMovies();
            closeSidebar();
            Router.showPage("moviesPage");
          } else if (action === "remove-all-series") {
            removeAllRecentlyWatchedSeries();
            closeSidebar();
            Router.showPage("seriesPage");
          } else if (action === "clear-channel-history") {
            removeAllChannelHistory();
            closeSidebar();
            if (localStorage.getItem("currentPage") === "liveTvPage") {
              Router.showPage("liveTvPage");
            }
          } else if (action === "remove-movie") {
            const mid = localStorage.getItem("selectedMovieId");
            removeRecentlyWatchedMovieById(mid);
            closeSidebar();
            Router.showPage("movieDetailPage");
          } else if (action === "remove-series") {
            const sid = localStorage.getItem("selectedSeriesId");
            removeRecentlyWatchedSeriesById(sid);
            closeSidebar();
            Router.showPage("seriesDetailPage");
          } else if (action === "dark-mode" || action === "change-theme") {
            alert("This feature will be available soon!");
          }
          break;
        case "Escape":
        case "Backspace":
        case "XF86Back":
          closeSidebar();
          break;
      }
    } else if (activeSection.id === "playlist-info-section") {
      // Navigation for Playlist Info Section
      switch (e.key) {
        case "Enter":
          if (document.activeElement.classList.contains("back-btn")) {
            showSidebarSection("main");
            setTimeout(
              () =>
                document.querySelector('[data-action="playlist-info"]').focus(),
              10,
            );
          }
          break;
        case "Escape":
        case "Backspace":
        case "XF86Back":
          showSidebarSection("main");
          setTimeout(
            () =>
              document.querySelector('[data-action="playlist-info"]').focus(),
            10,
          );
          break;
      }
    }
  }

  function updateSidebarSelection(items, index) {
    // Legacy helper - no longer needed with native focus but keeping for safety if called elsewhere
    if (items[index]) items[index].focus();
  }

  function toggleSortMenu() {
    const sortDialog = document.getElementById("sort-dialog");
    if (!sortDialog) return;
    const expanded = !sortDialog.classList.contains("option-remove");
    if (expanded) {
      closeSortMenu();
    } else {
      openSortMenu();
    }
  }

  function openSortMenu() {
    const sortDialog = document.getElementById("sort-dialog");
    if (!sortDialog) return;

    sortDialog.classList.remove("option-remove");
    isSortOptionsOpen = true;

    // Ensure sort menu item stays active
    const sortMenuItem = sidebar.querySelector('[data-action="sort"]');
    if (sortMenuItem) {
      sortMenuItem.classList.add("active");
    }

    const sortOptionItems = Array.from(
      sortDialog.querySelectorAll(".sort-option"),
    );
    if (sortOptionItems.length > 0) {
      updateSortOptionsSelection(sortOptionItems, 0);
    }
  }

  function closeSortMenu() {
    const sortDialog = document.getElementById("sort-dialog");
    if (!sortDialog) return;
    sortDialog.classList.add("option-remove");
    isSortOptionsOpen = false;

    const sortMenuItem = sidebar.querySelector('[data-action="sort"]');
    if (sortMenuItem) {
      // Remove active from any other card first
      document
        .querySelectorAll(".sidebar-card")
        .forEach((c) => c.classList.remove("active"));

      setTimeout(() => {
        sortMenuItem.classList.add("active");
        sortMenuItem.focus();
      }, 10);
    }
  }

  function setSortOption(sortType) {
    const prevSort = localStorage.getItem("sortvalue") || "";
    if (String(prevSort) === String(sortType)) {
      const selectedCheckbox = document.querySelector(
        `.sort-checkbox[data-sort="${sortType}"]`,
      );
      if (selectedCheckbox) selectedCheckbox.checked = true;
      return;
    }

    const sortCheckboxes = Array.from(
      document.querySelectorAll(".sort-checkbox"),
    );
    sortCheckboxes.forEach((checkbox) => {
      checkbox.checked = false;
    });

    const selectedCheckbox = document.querySelector(
      `.sort-checkbox[data-sort="${sortType}"]`,
    );
    if (selectedCheckbox) {
      selectedCheckbox.checked = true;
    }

    localStorage.setItem("sortvalue", sortType);

    const sortEvent = new CustomEvent("sortChanged", {
      detail: {
        sortType: sortType,
        page: localStorage.getItem("currentPage"),
      },
    });
    document.dispatchEvent(sortEvent);

    if (sidebar && !sidebar.classList.contains("option-remove")) {
      localStorage.setItem("navigationFocus", "sidebar");
    }
  }

  function handleSortOptionsKeys(e) {
    const sortDialog = document.getElementById("sort-dialog");
    const sortOptionItems = Array.from(
      sortDialog.querySelectorAll(".sort-option"),
    );
    if (!sortOptionItems.length) return;

    let activeIndex = sortOptionItems.findIndex((item) =>
      item.classList.contains("active"),
    );
    if (activeIndex === -1) activeIndex = 0;

    switch (e.key) {
      case "ArrowDown":
        activeIndex = (activeIndex + 1) % sortOptionItems.length;
        updateSortOptionsSelection(sortOptionItems, activeIndex);
        break;
      case "ArrowUp":
        activeIndex =
          (activeIndex - 1 + sortOptionItems.length) % sortOptionItems.length;
        updateSortOptionsSelection(sortOptionItems, activeIndex);
        break;
      case "Enter":
        const activeSortItem = sortOptionItems[activeIndex];
        const checkbox = activeSortItem.querySelector(".sort-checkbox");
        if (checkbox) {
          checkbox.checked = true;
          setSortOption(checkbox.dataset.sort);
          closeSortMenu();
        }
        break;
      case "Escape":
      case "Backspace":
      case "Back":
      case "BrowserBack":
      case "XF86Back":
      case "10009":
      case "461":
      case 10009:
      case 461:
        closeSortMenu();
        break;
    }
  }

  function updateSortOptionsSelection(items, index) {
    items.forEach((item) => {
      item.classList.remove("active");
    });
    const activeItem = items[index];
    if (activeItem) {
      activeItem.classList.add("active");
      activeItem.focus();
    }
  }

  window.updateSearchVisibility = updateSearchVisibility;
}

window.buildDynamicSidebarOptions = buildDynamicSidebarOptions;
