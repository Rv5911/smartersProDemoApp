let msState = {
  query: "",
  activeTab: "movies", // movies, series, live
  focusedSection: "", // input, tabs, cards
  tabIndex: 0,
  cardIndex: 0,
  chunks: {
    movies: 1,
    series: 1,
    live: 1,
  },
  chunkSize: 20,
  results: {
    movies: [],
    series: [],
    live: [],
  },
};

function MasterSearch() {
  return `
    <div class="ms-page-container">
      <div id="ms-loader" class="custom-page-loader" style="display: none;">
        <div class="custom-loader-content">
          <div class="custom-loader-spinner"></div>
        </div>
      </div>
      <div class="ms-search-header">
        <div class="ms-search-input-wrapper" id="ms-input-container">
        <i class="fas fa-search"></i>
          <input type="text" id="ms-input" class="ms-search-input" placeholder="Search movies, series or live channels..." tabindex="-1" autocomplete="off">
        </div>
        <div class="ms-tabs-container" id="ms-tabs" style="display: none;"></div>
      </div>
      <div class="ms-results-grid" id="ms-grid"></div>
    </div>
  `;
}

const getMSCurrentPlaylist = () => {
  try {
    const currentPlaylistName = JSON.parse(
      localStorage.getItem("selectedPlaylist") || "{}",
    ).playlistName;
    const playlistsData = JSON.parse(
      localStorage.getItem("playlistsData") || "[]",
    );
    return playlistsData.find((pl) => pl.playlistName === currentPlaylistName);
  } catch (e) {
    return null;
  }
};

const isStreamAdult = (name) => {
  const normalized = (name || "").trim().toLowerCase();
  const configured = window.adultsCategories || [];
  if (configured.includes(normalized)) return true;
  return /(adult|xxx|18\+|18\s*plus|sex|porn|nsfw)/i.test(normalized);
};

const getResults = () => {
  const q = msState.query.trim().toLowerCase();

  if (!q) {
    msState.results = {
      movies: [],
      series: [],
      live: [],
    };
    renderTabs();
    renderCards();
    return;
  }

  const filteredMovies = (
    Array.isArray(window.allMoviesStreams) ? window.allMoviesStreams : []
  ).filter((m) => (m.name || "").toLowerCase().includes(q));
  const filteredSeries = (
    Array.isArray(window.allSeriesStreams) ? window.allSeriesStreams : []
  ).filter((s) => (s.name || "").toLowerCase().includes(q));
  const filteredLive = (
    Array.isArray(window.allLiveStreams) ? window.allLiveStreams : []
  ).filter((ch) => (ch.name || "").toLowerCase().includes(q));

  msState.results = {
    movies: filteredMovies,
    series: filteredSeries,
    live: filteredLive,
  };

  // Switch to first tab with results if current is empty
  if (msState.results[msState.activeTab].length === 0) {
    const visible = getVisibleTabs();
    if (visible.length > 0) {
      msState.activeTab = visible[0].id;
    }
  }

  renderTabs();
  renderCards();
};

const getVisibleTabs = () => {
  return [
    {
      id: "movies",
      label: "Movies",
      count: msState.results.movies.length,
    },
    {
      id: "series",
      label: "Series",
      count: msState.results.series.length,
    },
    {
      id: "live",
      label: "Live TV",
      count: msState.results.live.length,
    },
  ].filter((t) => t.count > 0);
};

const renderTabs = () => {
  const tabsContainer = document.getElementById("ms-tabs");
  if (!tabsContainer) return;

  const visibleTabs = getVisibleTabs();

  if (!msState.query.trim() || visibleTabs.length === 0) {
    tabsContainer.style.display = "none";
    return;
  } else {
    tabsContainer.style.display = "flex";
  }

  const isMSPageFocused =
    localStorage.getItem("navigationFocus") === "masterSearchPage";

  tabsContainer.innerHTML = visibleTabs
    .map((tab, idx) => {
      const isTabFocused =
        isMSPageFocused &&
        msState.focusedSection === "tabs" &&
        msState.tabIndex === idx;
      return `
      <div class="ms-tab ${msState.activeTab === tab.id ? "active" : ""} ${isTabFocused ? "focused" : ""}" 
           data-tab="${tab.id}" data-idx="${idx}">
        <span>${tab.label}</span>
        <span class="ms-tab-count">${tab.count}</span>
      </div>
    `;
    })
    .join("");
};

const renderCards = () => {
  const grid = document.getElementById("ms-grid");
  if (!grid) return;

  if (!msState.query.trim()) {
    grid.innerHTML = `<div class="ms-no-results">Type something to search...</div>`;
    return;
  }

  const isMSPageFocused =
    localStorage.getItem("navigationFocus") === "masterSearchPage";
  const currentResults = msState.results[msState.activeTab];
  const chunkCount = msState.chunks[msState.activeTab];
  const displayResults = currentResults.slice(
    0,
    chunkCount * msState.chunkSize,
  );

  if (displayResults.length === 0) {
    const totalCount =
      msState.results.movies.length +
      msState.results.series.length +
      msState.results.live.length;
    let emptyMsg = "No results found";
    if (totalCount === 0) {
      emptyMsg = "No Results Found";
    } else if (msState.activeTab === "movies") {
      emptyMsg = "No Movies Found";
    } else if (msState.activeTab === "series") {
      emptyMsg = "No Series Found";
    } else if (msState.activeTab === "live") {
      emptyMsg = "No Live Channels Found";
    }

    grid.innerHTML = `<div class="ms-no-results">${emptyMsg}</div>`;
    return;
  }

  grid.innerHTML = displayResults
    .map((item, idx) => {
      const isFocused =
        isMSPageFocused &&
        msState.focusedSection === "cards" &&
        msState.cardIndex === idx;
      const imageUrl =
        item.stream_icon || item.cover || "./assets/demo-img-card.png";
      const rating = item.rating_5based || item.rating || "0";
      const streamId = item.stream_id || item.series_id || item.num;

      const isAdult = isStreamAdult(item.name);
      const isLocked = isAdult;

      return `
      <div class="movie-card ms-card ${isFocused ? "focused" : ""}" 
           data-index="${idx}" data-stream-id="${streamId}">
          <div class="movie-card-inner" style="background-image: url('${imageUrl}')">
              <img src="${imageUrl}" style="display: none;" onerror="this.parentElement.style.backgroundImage = 'url(./assets/placeholder-img.png)'" />
              ${isLocked ? '<div class="adult-overlay"><i class="fas fa-lock card-lock-icon"></i></div>' : ""}
              <div class="movie-card-rating">
                  <i class="fas fa-star"></i> ${rating}
              </div>
              <div class="movie-card-play-div">
                  <img src="./assets/card-play-icon.png" alt="Play" class="movie-card-play" />
              </div>
              <div class="movie-card-text">
                  <h2 class="movie-title-marquee">${item.name || "Unknown"}</h2>
              </div>
          </div>
      </div>
    `;
    })
    .join("");
};

const loadMore = () => {
  const currentResults = msState.results[msState.activeTab];
  if (
    msState.chunks[msState.activeTab] * msState.chunkSize <
    currentResults.length
  ) {
    msState.chunks[msState.activeTab]++;
    renderCards();
  }
};

const saveMSState = () => {
  // Only save metadata, NOT the results array which is huge
  const stateToSave = {
    query: msState.query,
    activeTab: msState.activeTab,
    focusedSection: msState.focusedSection,
    tabIndex: msState.tabIndex,
    cardIndex: msState.cardIndex,
    chunks: msState.chunks,
  };
  try {
    localStorage.setItem("msSavedState", JSON.stringify(stateToSave));
  } catch (e) {
    console.error("MasterSearch: Error saving state metadata", e);
  }
};

const getGridColumns = () => {
  const grid = document.getElementById("ms-grid");
  if (!grid) return 1;
  try {
    const style = window.getComputedStyle(grid);
    const colStr = style.gridTemplateColumns;
    if (!colStr || colStr === "none") {
      // Fallback to calculation if grid-template-columns is not available
      const cardWidth = 280;
      const gap = 40; // gap from CSS
      const gridWidth = grid.offsetWidth;
      // Use logic accounting for gaps: n * w + (n-1) * gap <= W
      return Math.floor((gridWidth + gap) / (cardWidth + gap)) || 1;
    }
    return colStr.split(" ").length;
  } catch (e) {
    return 1;
  }
};

const handleMSKeydown = (e) => {
  if (localStorage.getItem("currentPage") !== "masterSearchPage") return;

  const navigationFocus = localStorage.getItem("navigationFocus");

  const key = e.key;
  const keyCode = e.keyCode;
  const backKeys = [
    "Escape",
    "Back",
    "BrowserBack",
    "XF86Back",
    "Backspace",
    "SoftLeft",
    10009,
    461,
  ];
  const isBackKey = backKeys.includes(key) || backKeys.includes(keyCode);

  if (isBackKey) {
    const activeTabResults = msState.results[msState.activeTab];
    const hasResults = activeTabResults && activeTabResults.length > 0;
    const cols = getGridColumns ? getGridColumns() : 1;
    const isAtRoot =
      navigationFocus === "navbar" ||
      msState.focusedSection === "input" ||
      msState.focusedSection === "tabs" ||
      (msState.focusedSection === "cards" && msState.cardIndex < cols);

    if (hasResults && !isAtRoot) {
      msState.focusedSection = "cards";
      msState.cardIndex = 0;

      const navbarEl = document.querySelector("#navbar-root");
      if (navbarEl) navbarEl.style.display = "block";

      localStorage.setItem("navigationFocus", "masterSearchPage");
      updateMSFocus();
      saveMSState();

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return;
    }
    // If already at root card OR no results, let it bubble to Navbar.js for Exit Modal
    return;
  }

  if (navigationFocus !== "masterSearchPage") return;
  const input = document.getElementById("ms-input");
  const isInputActive = document.activeElement === input;

  // Input Field Handling
  if (msState.focusedSection === "input") {
    if (key === "Enter") {
      if (!isInputActive) {
        input.focus();
        updateMSFocus();
        e.preventDefault();
        return;
      }
    }

    if (key === "ArrowDown") {
      if (!msState.query.trim()) return;
      const visibleTabs = getVisibleTabs();
      if (visibleTabs.length === 0) return;
      if (input) input.blur();
      msState.focusedSection = "tabs";
      const currentIdx = visibleTabs.findIndex(
        (t) => t.id === msState.activeTab,
      );
      msState.tabIndex = currentIdx !== -1 ? currentIdx : 0;
      updateMSFocus();
      e.preventDefault();
      return;
    }

    if (key === "ArrowUp") {
      if (input) input.blur();
      if (typeof window.setNavbarFocus === "function") {
        window.setNavbarFocus("masterSearchPage");
      } else {
        localStorage.setItem("navigationFocus", "navbar");
        const navItem = document.querySelector(
          '.nav-item[data-page="masterSearchPage"]',
        );
        if (navItem) {
          navItem.focus();
          navItem.classList.add("active");
        }
      }

      updateMSFocus();
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }

    if (isInputActive) {
      if (key === "ArrowLeft" || key === "ArrowRight") return;
    }
  }

  // Navigation Logic
  if (
    ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter"].includes(key)
  ) {
    if (!isInputActive) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }

  if (msState.focusedSection === "tabs") {
    const visibleTabs = getVisibleTabs();
    if (key === "ArrowRight") {
      msState.tabIndex = Math.min(visibleTabs.length - 1, msState.tabIndex + 1);
      updateMSFocus();
    } else if (key === "ArrowLeft") {
      msState.tabIndex = Math.max(0, msState.tabIndex - 1);
      updateMSFocus();
    } else if (key === "ArrowUp") {
      msState.focusedSection = "input";
      updateMSFocus();
    } else if (key === "Enter") {
      const tab = visibleTabs[msState.tabIndex];
      if (tab) {
        msState.activeTab = tab.id;
        msState.cardIndex = 0;
        if (msState.results[msState.activeTab].length > 0) {
          msState.focusedSection = "cards";
        }
        renderCards();
        updateMSFocus();
      }
    } else if (key === "ArrowDown") {
      const tab = visibleTabs[msState.tabIndex];
      if (tab && msState.results[tab.id].length > 0) {
        msState.activeTab = tab.id;
        msState.focusedSection = "cards";
        msState.cardIndex = 0;
        updateMSFocus();
      }
    }
  } else if (msState.focusedSection === "cards") {
    const grid = document.getElementById("ms-grid");
    if (!grid) return;
    const columns = getGridColumns();

    if (key === "ArrowRight") {
      if (msState.cardIndex < msState.results[msState.activeTab].length - 1) {
        msState.cardIndex++;
        updateMSFocus();
      }
    } else if (key === "ArrowLeft") {
      if (msState.cardIndex > 0) {
        msState.cardIndex--;
        updateMSFocus();
      }
    } else if (key === "ArrowUp") {
      if (msState.cardIndex < columns) {
        const visibleTabs = getVisibleTabs();
        msState.focusedSection = "tabs";
        const currentIdx = visibleTabs.findIndex(
          (t) => t.id === msState.activeTab,
        );
        msState.tabIndex = currentIdx !== -1 ? currentIdx : 0;
        updateMSFocus();
      } else {
        msState.cardIndex -= columns;
        updateMSFocus();
      }
    } else if (key === "ArrowDown") {
      if (
        msState.cardIndex + columns <
        msState.results[msState.activeTab].length
      ) {
        msState.cardIndex += columns;
        if (
          msState.cardIndex >=
          msState.chunks[msState.activeTab] * msState.chunkSize - columns
        ) {
          loadMore();
        }
        updateMSFocus();
      }
    } else if (key === "Enter") {
      saveMSState();
      playMSItem();
    }
  }
};

const activateMSMarquee = (card) => {
  if (!card) return;
  requestAnimationFrame(() => {
    if (!card.classList.contains("focused")) return;
    const titleElement = card.querySelector(".movie-title-marquee");
    if (!titleElement) return;
    const container = titleElement.parentElement;
    if (!container) return;

    if (titleElement.scrollWidth > container.offsetWidth) {
      titleElement.setAttribute("data-marquee", titleElement.textContent || "");
      const pxPerSecond = 70;
      const durationSeconds = Math.max(
        10,
        Math.round(titleElement.scrollWidth / pxPerSecond),
      );
      titleElement.style.setProperty("--duration", `${durationSeconds}s`);
      titleElement.classList.add("marquee-active");
    }
  });
};

const updateMSFocus = () => {
  const navigationFocus = localStorage.getItem("navigationFocus");
  const isPageFocused = navigationFocus === "masterSearchPage";

  // updateMSFocus should only update the focus classes on existing elements to avoid flickering
  // We only re-render the whole grid when data changes or tab switches

  // Update focus classes for tabs
  const tabElements = document.querySelectorAll(".ms-tab");
  tabElements.forEach((el, idx) => {
    const isTabFocused =
      isPageFocused &&
      msState.focusedSection === "tabs" &&
      msState.tabIndex === idx;
    if (isTabFocused) el.classList.add("focused");
    else el.classList.remove("focused");

    // Also ensure active class matches state
    if (msState.activeTab === el.dataset.tab) el.classList.add("active");
    else el.classList.remove("active");
  });

  // Update focus classes for cards
  const cardElements = document.querySelectorAll(".ms-card");
  cardElements.forEach((el, idx) => {
    const isFocused =
      isPageFocused &&
      msState.focusedSection === "cards" &&
      msState.cardIndex === idx;
    if (isFocused) el.classList.add("focused");
    else el.classList.remove("focused");
  });

  const input = document.getElementById("ms-input");
  const inputContainer = document.getElementById("ms-input-container");
  const container = document.querySelector(".ms-page-container");
  const navRoot = document.getElementById("navbar-root");

  if (!input || !inputContainer || !container) return;

  const isInputActive = document.activeElement === input;

  inputContainer.classList.remove("focused");
  input.classList.remove("focused");

  if (isPageFocused && msState.focusedSection === "input") {
    inputContainer.classList.add("focused");
    input.classList.add("focused");
    if (!isInputActive) input.blur();
    container.scrollTop = 0;
    if (navRoot) navRoot.style.display = "block";
  } else {
    input.blur();
    if (msState.focusedSection === "tabs") {
      container.scrollTop = 0;
      if (navRoot) navRoot.style.display = "block";
    } else if (msState.focusedSection === "cards") {
      const focusedCard = document.querySelector(".ms-card.focused");
      if (focusedCard) {
        focusedCard.scrollIntoView({
          block: "center",
        });
        activateMSMarquee(focusedCard);

        const columns = getGridColumns();
        const row = Math.floor(msState.cardIndex / columns);

        if (navRoot) {
          navRoot.style.display = row <= 1 ? "none" : "block";
        }
      }
    }
  }

  if (navigationFocus === "navbar" && navRoot) {
    navRoot.style.display = "block";
  }
};

const playMSItem = () => {
  const item = msState.results[msState.activeTab][msState.cardIndex];
  if (!item) return;

  // Set specific flag for robust back navigation
  localStorage.setItem("returnToMasterSearch", "true");
  // Keep previousPage for other logic potentially
  localStorage.setItem("previousPage", "masterSearchPage");

  if (msState.activeTab === "live") {
    // Determine if the channel is locked
    const isLocked = isStreamAdult(item.name);

    if (isLocked) {
      const currentPlaylist = getMSCurrentPlaylist();
      const parentalEnabled =
        currentPlaylist && !!currentPlaylist.parentalPassword;

      if (parentalEnabled && typeof ParentalPinDialog === "function") {
        ParentalPinDialog(
          () => {
            // Success callback
            const player = window.MasterSearchLivePlayer();
            player.play(item);
          },
          () => {
            console.log("PIN Cancelled");
          },
          currentPlaylist,
          "masterSearchPage",
        );
      } else {
        // Fallback if no pin dialog
        const player = window.MasterSearchLivePlayer();
        player.play(item);
      }
    } else {
      // Not locked, play immediately
      const player = window.MasterSearchLivePlayer();
      player.play(item);
    }
  } else {
    const isSeries = msState.activeTab === "series";
    if (isSeries) {
      localStorage.setItem("selectedSeriesId", item.series_id);
      localStorage.setItem("selectedSeriesItem", JSON.stringify(item));
      Router.showPage("seriesDetailPage");
    } else {
      localStorage.setItem("selectedMovieId", item.stream_id);
      localStorage.setItem("selectedMovieData", JSON.stringify(item));
      Router.showPage("movieDetailPage");
    }
  }
};

window.initMasterSearch = function () {
  const container = document.querySelector(".ms-page-container");
  const input = document.getElementById("ms-input");
  const loader = document.getElementById("ms-loader");

  // Check if we are coming from a Detail Page or Player
  const previousPage = localStorage.getItem("previousPage");
  const allowedPreviousPages = [
    "movieDetailPage",
    "seriesDetailPage",
    "liveTvPage",
    "videoJsPlayer",
    "masterSearchPage", // Self-refresh
  ];

  // Check for force reset (e.g. from Navbar)
  if (localStorage.getItem("forceMasterSearchReset") === "true") {
    localStorage.removeItem("msSavedState");
    localStorage.removeItem("forceMasterSearchReset");

    // Reset state immediately
    msState.query = "";
    msState.activeTab = "movies"; // Ensure we are on movies tab
    msState.results = {
      movies: [],
      series: [],
      live: [],
    };
    msState.chunks = {
      movies: 1,
      series: 1,
      live: 1,
    };
    msState.focusedSection = "input";
    msState.tabIndex = 0;
    msState.cardIndex = 0;

    if (input) {
      input.value = "";
    }

    // Force render empty state
    renderTabs();
    renderCards();
  }

  // If NOT returning from a known detail/player page, FORCE CLEAR state
  if (!allowedPreviousPages.includes(previousPage)) {
    localStorage.removeItem("msSavedState");
    msState.query = "";
    msState.activeTab = "movies";
    msState.results = {
      movies: [],
      series: [],
      live: [],
    };
    if (input) input.value = "";
  }

  const savedStateStr = localStorage.getItem("msSavedState");
  if (savedStateStr) {
    if (loader) loader.style.display = "flex";

    setTimeout(() => {
      try {
        const parsed = JSON.parse(savedStateStr);
        // Restore metadata
        msState.query = parsed.query || "";
        msState.activeTab = parsed.activeTab || "movies";
        msState.focusedSection = parsed.focusedSection || "";
        msState.tabIndex = parsed.tabIndex || 0;
        msState.cardIndex = parsed.cardIndex || 0;
        msState.chunks = parsed.chunks || {
          movies: 1,
          series: 1,
          live: 1,
        };

        if (input) input.value = msState.query;

        // REGENERATE results array in memory from search query
        getResults();

        // Set navigation focus back to this page
        localStorage.setItem("navigationFocus", "masterSearchPage");

        // DO NOT remove msSavedState here immediately if we want to support back/forth multiple levels
        // keeping it is safer, or remove it only on successful restore
        localStorage.removeItem("msSavedState");
      } catch (e) {
        console.error("MasterSearch: Error restoring state", e);
        localStorage.removeItem("msSavedState");
      } finally {
        if (loader) loader.style.display = "none";
        updateMSFocus();
      }
    }, 400);

    // Initialize player container if needed, though play() handles it.
  } else {
    if (input) {
      input.value = msState.query;
      input.addEventListener("input", (e) => {
        msState.query = e.target.value;
        msState.chunks = {
          movies: 1,
          series: 1,
          live: 1,
        };
        getResults();
      });
      input.addEventListener("focus", () => {
        msState.focusedSection = "input";
        localStorage.setItem("navigationFocus", "masterSearchPage");
        updateMSFocus();
      });
    }

    getResults();
    updateMSFocus();
  }

  if (container) {
    container.addEventListener("click", (e) => {
      const tab = e.target.closest(".ms-tab");
      if (tab) {
        e.preventDefault();
        e.stopPropagation();
        const idx = parseInt(tab.dataset.idx);
        msState.tabIndex = idx;
        msState.activeTab = tab.dataset.tab;
        msState.focusedSection = "tabs";
        msState.cardIndex = 0;
        localStorage.setItem("navigationFocus", "masterSearchPage");
        updateMSFocus();
        return;
      }

      const card = e.target.closest(".ms-card");
      if (card) {
        e.preventDefault();
        e.stopPropagation();
        const idx = parseInt(card.dataset.index);
        msState.cardIndex = idx;
        msState.focusedSection = "cards";
        localStorage.setItem("navigationFocus", "masterSearchPage");
        updateMSFocus();

        saveMSState();
        playMSItem();
        return;
      }

      const inputSearch = e.target.closest("#ms-input");
      if (inputSearch) {
        msState.focusedSection = "input";
        localStorage.setItem("navigationFocus", "masterSearchPage");
        updateMSFocus();
      }
    });

    container.onscroll = () => {
      if (
        container.scrollTop + container.clientHeight >=
        container.scrollHeight - 500
      ) {
        loadMore();
      }
    };
  }

  document.addEventListener("keydown", handleMSKeydown, true);
  window.addEventListener("search-page-focus", handleSearchPageFocus);
};

const handleSearchPageFocus = () => {
  msState.focusedSection = "input";
  if (localStorage.getItem("currentPage") === "masterSearchPage") {
    updateMSFocus();
  }
};

window.cleanupMasterSearch = function () {
  // Clean up player if it's active
  if (window.MasterSearchLivePlayer) {
    window.MasterSearchLivePlayer().cleanup();
  }

  document.removeEventListener("keydown", handleMSKeydown, true);
  window.removeEventListener("search-page-focus", handleSearchPageFocus);

  const navRoot = document.getElementById("navbar-root");
  if (navRoot) navRoot.style.display = "block";

  // Check where we are going
  const nextPage = localStorage.getItem("currentPage");
  const detailPages = [
    "movieDetailPage",
    "seriesDetailPage",
    "liveTvPage",
    "videoJsPlayer",
    "masterSearchPage",
  ];

  // Only reset state if we are navigating AWAY from the search flow
  // (e.g. going to Home, Movies Page, etc.)
  if (!detailPages.includes(nextPage)) {
    msState.query = "";
    const input = document.getElementById("ms-input");
    if (input) {
      input.value = "";
    }
    msState.results = {
      movies: [],
      series: [],
      live: [],
    };
    msState.chunks = {
      movies: 1,
      series: 1,
      live: 1,
    };
    msState.focusedSection = "input";
    msState.tabIndex = 0;
    msState.cardIndex = 0;

    // Also explicitly remove saved state
    localStorage.removeItem("msSavedState");
    msState.query = "";
    msState.activeTab = "movies";
    msState.results = {
      movies: [],
      series: [],
      live: [],
    };
    msState.chunks = {
      movies: 1,
      series: 1,
      live: 1,
    };
  }
};
