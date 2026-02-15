let msState = {
  query: "",
  activeTab: "movies", // movies, series, live
  focusedSection: "input", // input, tabs, cards
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
      <div class="ms-search-header">
        <div class="ms-search-input-wrapper" id="ms-input-container">
          <i class="fas fa-search"></i>
          <input type="text" id="ms-input" class="ms-search-input" placeholder="Search movies, series or live channels..." tabindex="-1">
        </div>
        <div class="ms-tabs-container" id="ms-tabs"></div>
      </div>
      <div class="ms-results-grid" id="ms-grid"></div>
    </div>
  `;
}

const isStreamAdult = (name) => {
  const normalized = (name || "").trim().toLowerCase();
  const configured = window.adultsCategories || [];
  if (configured.includes(normalized)) return true;
  return /(adult|xxx|18\+|18\s*plus|sex|porn|nsfw)/i.test(normalized);
};

const getResults = () => {
  const q = msState.query.trim().toLowerCase();

  if (!q) {
    msState.results = { movies: [], series: [], live: [] };
    renderTabs();
    renderCards();
    return;
  }

  const filteredMovies = (window.allMoviesStreams || []).filter((m) =>
    (m.name || "").toLowerCase().includes(q),
  );
  const filteredSeries = (window.allSeriesStreams || []).filter((s) =>
    (s.name || "").toLowerCase().includes(q),
  );
  const filteredLive = (window.allLiveStreams || []).filter((ch) =>
    (ch.name || "").toLowerCase().includes(q),
  );

  msState.results = {
    movies: filteredMovies,
    series: filteredSeries,
    live: filteredLive,
  };

  renderTabs();
  renderCards();
};

const renderTabs = () => {
  const tabsContainer = document.getElementById("ms-tabs");
  if (!tabsContainer) return;

  const tabs = [
    { id: "movies", label: "Movies", count: msState.results.movies.length },
    { id: "series", label: "Series", count: msState.results.series.length },
    { id: "live", label: "Live TV", count: msState.results.live.length },
  ];

  tabsContainer.innerHTML = tabs
    .map(
      (tab, idx) => `
    <div class="ms-tab ${msState.activeTab === tab.id ? "active" : ""} ${msState.focusedSection === "tabs" && msState.tabIndex === idx ? "focused" : ""}" 
         data-tab="${tab.id}" data-idx="${idx}">
      <span>${tab.label}</span>
      <span class="ms-tab-count">${tab.count}</span>
    </div>
  `,
    )
    .join("");
};

const renderCards = () => {
  const grid = document.getElementById("ms-grid");
  if (!grid) return;

  if (!msState.query.trim()) {
    grid.innerHTML = `<div class="ms-no-results">Type something to search...</div>`;
    return;
  }

  const currentResults = msState.results[msState.activeTab];
  const chunkCount = msState.chunks[msState.activeTab];
  const displayResults = currentResults.slice(
    0,
    chunkCount * msState.chunkSize,
  );

  if (displayResults.length === 0) {
    let emptyMsg = "No results found";
    if (msState.activeTab === "movies") emptyMsg = "No Movies Found";
    else if (msState.activeTab === "series") emptyMsg = "No Series Found";
    else if (msState.activeTab === "live") emptyMsg = "No Live Channels Found";

    grid.innerHTML = `<div class="ms-no-results">${emptyMsg}</div>`;
    return;
  }

  grid.innerHTML = displayResults
    .map((item, idx) => {
      const isFocused =
        msState.focusedSection === "cards" && msState.cardIndex === idx;
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

const handleMSKeydown = (e) => {
  if (localStorage.getItem("currentPage") !== "masterSearchPage") return;
  if (localStorage.getItem("navigationFocus") === "navbar") return;

  const key = e.key;
  const input = document.getElementById("ms-input");
  const isInputActive = document.activeElement === input;

  if (msState.focusedSection === "input") {
    if (key === "ArrowDown") {
      msState.focusedSection = "tabs";
      msState.tabIndex = ["movies", "series", "live"].indexOf(
        msState.activeTab,
      );
      updateMSFocus();
      if (input) input.blur();
      e.preventDefault();
      return;
    }

    if (key === "ArrowUp") {
      if (input) input.blur();

      // Cleanup visual focus before leaving
      const inputContainer = document.getElementById("ms-input-container");
      if (inputContainer) inputContainer.classList.remove("focused");
      if (input) input.classList.remove("focused");

      localStorage.setItem("navigationFocus", "navbar");
      const navItem = document.querySelector(
        '.nav-item[data-page="masterSearchPage"]',
      );
      if (navItem) {
        navItem.focus();
        navItem.classList.add("active");
      }
      updateMSFocus();
      e.preventDefault();
      return;
    }

    if (key === "Enter") {
      if (!isInputActive) {
        if (input) input.focus();
        updateMSFocus();
        e.preventDefault();
      }
      return;
    }

    if (isInputActive) {
      if (key === "ArrowLeft" || key === "ArrowRight") return;
      if (key === "ArrowDown") {
        input.blur();
        msState.focusedSection = "tabs";
        msState.tabIndex = ["movies", "series", "live"].indexOf(
          msState.activeTab,
        );
        updateMSFocus();
        e.preventDefault();
        return;
      }
    }
  }

  if (
    ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter"].includes(key)
  ) {
    if (!isInputActive) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }

  if (msState.focusedSection === "tabs") {
    if (key === "ArrowRight") {
      msState.tabIndex = Math.min(2, msState.tabIndex + 1);
      updateMSFocus();
    } else if (key === "ArrowLeft") {
      msState.tabIndex = Math.max(0, msState.tabIndex - 1);
      updateMSFocus();
    } else if (key === "ArrowUp") {
      msState.focusedSection = "input";
      updateMSFocus();
    } else if (key === "Enter") {
      msState.activeTab = ["movies", "series", "live"][msState.tabIndex];
      msState.cardIndex = 0;
      if (msState.results[msState.activeTab].length > 0) {
        msState.focusedSection = "cards";
      }
      updateMSFocus();
    } else if (key === "ArrowDown") {
      if (msState.results[msState.activeTab].length > 0) {
        msState.focusedSection = "cards";
        msState.cardIndex = 0;
        updateMSFocus();
      }
    }
  } else if (msState.focusedSection === "cards") {
    const grid = document.getElementById("ms-grid");
    if (!grid) return;
    const cardWidth = 280;
    const gridWidth = grid.offsetWidth;
    const columns = Math.floor(gridWidth / cardWidth) || 1;

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
        msState.focusedSection = "tabs";
        msState.tabIndex = ["movies", "series", "live"].indexOf(
          msState.activeTab,
        );
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

    titleElement.classList.remove("marquee-active");
    titleElement.removeAttribute("data-marquee");
    titleElement.style.removeProperty("--duration");

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
  renderTabs();
  renderCards();

  const input = document.getElementById("ms-input");
  const inputContainer = document.getElementById("ms-input-container");
  const container = document.querySelector(".ms-page-container");
  const navRoot = document.getElementById("navbar-root");

  if (!input || !inputContainer || !container) return;

  const isInputActive = document.activeElement === input;

  inputContainer.classList.remove("focused");
  input.classList.remove("focused");

  if (msState.focusedSection === "input") {
    inputContainer.classList.add("focused");
    input.classList.add("focused");
    if (!isInputActive) input.blur();
    container.scrollTop = 0; // Always scroll to top on input focus
    if (navRoot) navRoot.style.display = "block";
  } else if (msState.focusedSection === "tabs") {
    container.scrollTop = 0; // Always scroll to top on tabs focus
    if (navRoot) navRoot.style.display = "block";
  } else if (msState.focusedSection === "cards") {
    const focusedCard = document.querySelector(".ms-card.focused");
    if (focusedCard) {
      focusedCard.scrollIntoView({ behavior: "smooth", block: "center" });
      activateMSMarquee(focusedCard);

      // Hide Navbar if Row >= 3 (indexing from 0)
      const cardWidth = 280;
      const gridWidth = document.getElementById("ms-grid").offsetWidth || 1;
      const columns = Math.floor(gridWidth / cardWidth) || 1;
      const row = Math.floor(msState.cardIndex / columns);

      if (navRoot) {
        navRoot.style.display = row >= 3 ? "none" : "block";
      }
    }
  }

  // Final check to blur input if we moved away
  if (msState.focusedSection !== "input" && isInputActive) {
    input.blur();
  }
};

const playMSItem = () => {
  const item = msState.results[msState.activeTab][msState.cardIndex];
  if (!item) return;

  if (msState.activeTab === "live") {
    localStorage.setItem("forcePlayChannelId", item.stream_id);
    localStorage.setItem("forceFullscreen", "true");
    Router.showPage("liveTvPage");
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

  if (input) {
    input.value = msState.query;
    input.addEventListener("input", (e) => {
      msState.query = e.target.value;
      msState.chunks = { movies: 1, series: 1, live: 1 };
      getResults();
    });
    input.addEventListener("focus", () => {
      msState.focusedSection = "input";
      updateMSFocus();
    });
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
        updateMSFocus();
        playMSItem();
        return;
      }

      const inputSearch = e.target.closest("#ms-input");
      if (inputSearch) {
        msState.focusedSection = "input";
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

  document.addEventListener("keydown", handleMSKeydown);

  window.addEventListener("search-page-focus", () => {
    msState.focusedSection = "input";
    if (localStorage.getItem("currentPage") === "masterSearchPage") {
      updateMSFocus();
    }
  });

  getResults();
  updateMSFocus();
};

window.cleanupMasterSearch = function () {
  document.removeEventListener("keydown", handleMSKeydown);

  // Restore Navbar visibility
  const navRoot = document.getElementById("navbar-root");
  if (navRoot) navRoot.style.display = "block";

  msState.query = "";
  const input = document.getElementById("ms-input");
  if (input) {
    input.value = "";
  }
  msState.results = { movies: [], series: [], live: [] };
  msState.chunks = { movies: 1, series: 1, live: 1 };
  msState.focusedSection = "input";
  msState.tabIndex = 0;
  msState.cardIndex = 0;
};
