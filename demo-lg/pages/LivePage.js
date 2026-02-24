function LivePage() {
  let loadingHTML =
    '<div id="live-page-loader" class="custom-page-loader">' +
    '<div class="custom-loader-content">' +
    '<div class="custom-loader-spinner"></div>' +
    "</div>" +
    "</div>";

  let filteredStreams = [];
  let selectedCategoryId = "All";

  // Navigation State
  let focusedSection = "player"; // Start with player focused
  let sidebarIndex = 0;
  let channelIndex = 0;
  let buttonFocusIndex = -1; // -1 = no button focused, 0 = heart, 1 = remove
  let playerSubFocus = 0; // 0 = Video Border, 1 = Play/Pause, 2 = Aspect Ratio

  let playerVisualFocus = true; // Separate variable to track player visual focus (red border)

  let epgIndex = -1; // -1 = Header (Favorite), 0+ = List Items
  let currentEpgData = [];
  let currentPlayingStream = null;
  let lastToggleTime = 0;
  let isVideoLoading = false; // Track video player loading state

  // Search State
  let categorySearchQuery = "";
  let channelSearchQuery = "";
  let currentSortOption = "default";

  // Chunking State
  let categoryChunk = 1;
  let channelChunk = 1;
  const categoryPageSize = 20;
  const channelPageSize = 20;

  // Optimized State Tracking
  let lastCategoryId = null;
  let lastCategoryQuery = "";
  let lastChannelQuery = "";
  let lastSort = "default";
  let cachedCats = null;
  let cachedStreams = null;
  let currentFocusElement = null; // Track focused element for efficiency
  let lastFocusedSection = null;
  let lastEnterTime = 0;
  let lastEnteredChannelId = null;

  // DOM Elements
  let container;

  // Get current playlist - MOVED UP to avoid reference error
  const getCurrentPlaylist = () => {
    try {
      const currentPlaylistName = JSON.parse(
        localStorage.getItem("selectedPlaylist") || "{}",
      ).playlistName;
      const playlistsData = JSON.parse(
        localStorage.getItem("playlistsData") || "[]",
      );
      return playlistsData.find(
        (pl) => pl.playlistName === currentPlaylistName,
      );
    } catch (e) {
      return null;
    }
  };

  // Parental Control State
  const unlockedLiveAdultCatIds = new Set();
  const unlockedLiveAdultChannelsInAll = new Set();
  const unlockedLiveAdultChannelsInFavorites = new Set();
  const unlockedLiveAdultChannelsInHistory = new Set();
  const unlockedLiveAdultChannelsInCategories = new Set();

  // Adult category detection
  const isLiveAdultCategory = (name) => {
    if (!name) return false;
    const normalized = name.trim().toLowerCase();
    const configured = Array.isArray(window.adultsCategories)
      ? window.adultsCategories.map((k) => String(k).toLowerCase())
      : [];

    // Exact match against configured keywords
    if (configured.includes(normalized)) return true;

    // Partial match (includes) against configured keywords
    if (configured.some((keyword) => normalized.includes(keyword))) return true;

    // Regexp fallback for common patterns
    return /(adult|xxx|18\+|18\s*plus|sex|porn|nsfw|erotic|nude|xnxx|xvideo|hot|porn)/i.test(
      normalized,
    );
  };

  // Initialize
  setTimeout(() => {
    if (window.cleanupLivePage) {
      window.cleanupLivePage();
    }
    init();
  }, 0);

  // Cross-browser fullscreen detection helper
  const checkIsFullscreen = () => {
    const container = document.querySelector(".live-video-player-div");

    // 1️⃣ Trust our own CSS class (most reliable on LG)
    const cssFs = !!(
      container && container.classList.contains("fullscreen-mode")
    );

    // 2️⃣ Video.js fullscreen state
    const vjsFs = !!(
      window.livePlayer &&
      typeof window.livePlayer.isFullscreen === "function" &&
      window.livePlayer.isFullscreen()
    );

    // 3️⃣ Native browser fullscreen (fallback only)
    const nativeFs = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement ||
      document.webkitIsFullScreen ||
      document.mozFullScreen ||
      (document.msFullscreenElement !== null &&
        document.msFullscreenElement !== undefined)
    );

    return cssFs || vjsFs || nativeFs;
  };

  const isCategoryAdult = (catId, catName) => {
    if (!catId) return false;

    // Check by name first
    if (isLiveAdultCategory(catName)) return true;

    const currentPlaylist = getCurrentPlaylist();
    const playlistUsername = currentPlaylist
      ? currentPlaylist.playlistName
      : null;

    if (catId === "favorites") {
      // Use currentPlaylist.favoritesLiveTV to ensure we check the correct data
      const allFavs =
        currentPlaylist && currentPlaylist.favoritesLiveTV
          ? currentPlaylist.favoritesLiveTV
          : [];

      return allFavs.some((fav) => {
        if (isLiveAdultCategory(fav.name)) return true;
        const stream = (window.allLiveStreams || []).find(
          (s) => String(s.stream_id) === String(fav.stream_id),
        );
        if (!stream) return false;
        if (isLiveAdultCategory(stream.name)) return true;
        const itemCat = (window.liveCategories || []).find(
          (c) => String(c.category_id) === String(stream.category_id),
        );
        return itemCat ? isLiveAdultCategory(itemCat.category_name) : false;
      });
    }

    if (catId === "All") {
      const hasAdultCat = (window.liveCategories || []).some(
        (c) =>
          isLiveAdultCategory(c.category_name) &&
          getCategoryCount(c.category_id) > 0,
      );
      const hasAdultChannelName = (window.allLiveStreams || []).some((s) =>
        isLiveAdultCategory(s.name),
      );
      return hasAdultCat || hasAdultChannelName;
    }

    return false;
  };

  // Add this function after state variables, before cleanup function
  const toggleFullscreen = () => {
    const playerContainer = document.querySelector(".live-video-player-div");
    if (!playerContainer) return;

    if (playerContainer.classList.contains("fullscreen-mode")) {
      // Exit CSS fullscreen
      playerContainer.classList.remove("fullscreen-mode");

      // Also trigger a manual layout update since we're bypassing native events
      handleFullscreenChange();
    } else {
      // Enter CSS fullscreen
      playerContainer.classList.add("fullscreen-mode");

      // Also trigger a manual layout update since we're bypassing native events
      handleFullscreenChange();
    }
  };

  const cleanup = () => {
    window.removeEventListener("keydown", handleFullscreenBackCapture, true);
    document.removeEventListener("keydown", handleKeydown);
    document.removeEventListener("sortChanged", handleSortChange);
    document.removeEventListener("fullscreenchange", handleFullscreenChange);
    document.removeEventListener(
      "webkitfullscreenchange",
      handleFullscreenChange,
    );
    document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
    document.removeEventListener("msfullscreenchange", handleFullscreenChange);

    const grid = document.getElementById("lp-channels-grid");
    if (grid) {
      grid.removeEventListener("scroll", handleScroll);
    }

    if (window.livePlayer) {
      try {
        window.livePlayer.dispose();
      } catch (e) {}
      window.livePlayer = null;
    }

    window.cleanupLivePage = null;
  };

  const init = () => {
    // Explicitly reset state on init
    focusedSection = "player"; // Start with player focused
    sidebarIndex = 0;
    channelIndex = 0;
    buttonFocusIndex = -1;
    playerSubFocus = 0;
    playerVisualFocus = true; // Player should have visual focus initially
    epgIndex = -1;
    currentPlayingStream = null;
    lastToggleTime = 0;
    categorySearchQuery = "";
    channelSearchQuery = "";
    selectedCategoryId = "All";
    categoryChunk = 1;
    channelChunk = 1;
    isVideoLoading = false;

    console.log("LivePage init called");

    // Find the loading indicator
    let loader = document.getElementById("live-page-loader");
    if (loader) {
      // Replace loader with main container
      loader.outerHTML = '<div class="lp-main-container"></div>';
    }

    container = document.querySelector(".lp-main-container");
    if (!container) return;

    render();
    document.addEventListener("keydown", handleKeydown);
    document.addEventListener("sortChanged", handleSortChange);

    // Add fullscreen event listeners
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("msfullscreenchange", handleFullscreenChange);

    // Register capture-phase handler
    window.addEventListener("keydown", handleFullscreenBackCapture, true);

    window.cleanupLivePage = cleanup;

    // Listen for focus changes from Navbar
    window.addEventListener(
      "navigation-focus-change",
      handleNavigationFocusChange,
    );

    // ✅ Handle forced play from Search
    const forceChannelId = localStorage.getItem("forcePlayChannelId");
    if (forceChannelId) {
      localStorage.removeItem("forcePlayChannelId");

      // Visual Hack: Immediate "Fake" Fullscreen to hide UI
      const style = document.createElement("style");
      style.id = "lp-temp-forced-style";
      style.innerHTML = `
        .lp-player-container { 
            position: fixed !important; 
            top: 0; 
            left: 0; 
            width: 100vw !important; 
            height: 100vh !important; 
            z-index: 99999; 
            background: black; 
        }
        #navbar-root { display: none !important; }
      `;
      document.head.appendChild(style);

      const streams = window.allLiveStreams || [];
      const stream = streams.find(
        (s) => String(s.stream_id) === String(forceChannelId),
      );
      if (stream) {
        // Execute immediately, no delay
        requestAnimationFrame(() => {
          // Select category of this stream
          selectedCategoryId = stream.category_id || "All";
          renderCategories();

          // Find stream in filtered list
          const filtered = getFilteredChannels();
          const idx = filtered.findIndex(
            (s) => String(s.stream_id) === String(forceChannelId),
          );

          if (idx !== -1) {
            channelIndex = idx;
            focusedSection = "channels";
          }

          // Trigger play immediately
          playChannel(stream);

          // Enter fullscreen if requested
          if (localStorage.getItem("forceFullscreen") === "true") {
            localStorage.removeItem("forceFullscreen");
            // Small delay to ensure player is in DOM and ready for fullscreen
            setTimeout(() => {
              if (!checkIsFullscreen()) toggleFullscreen();

              // Cleanup the fake fullscreen style
              const s = document.getElementById("lp-temp-forced-style");
              if (s) s.remove();
            }, 300);
          } else {
            // Fallback cleanup
            setTimeout(() => {
              const s = document.getElementById("lp-temp-forced-style");
              if (s) s.remove();
            }, 1000);
          }
        });
      } else {
        // Stream not found, cleanup style
        const s = document.getElementById("lp-temp-forced-style");
        if (s) s.remove();
      }
    }

    // Add styles for parental control features
    if (!document.getElementById("lp-parental-styles")) {
      const styles = document.createElement("style");
      styles.id = "lp-parental-styles";
      styles.textContent = `
        .lp-category-locked { position: relative; }
        .lp-category-name-wrapper { position: relative; display: flex; align-items: center; width: 100%; }
        .lp-blur-text { filter: blur(5px); opacity: 0.5; pointer-events: none; transition: filter 0.3s ease; display: inline-block; width: 100%; }
        .lp-cat-lock-icon { 
          position: absolute; 
          left: 50%; top: 50%; 
          transform: translate(-50%, -50%); 
          color: #ffca28; 
          font-size: 1.4em; 
          z-index: 10; 
          text-shadow: 0 0 15px rgba(0,0,0,1), 0 0 5px rgba(0,0,0,1);
          pointer-events: none;
        }
        .lp-adult-warning-banner { 
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          backdrop-filter: blur(8px);
          border-radius: 8px;
        }
        .lp-warning-content { 
          display: flex; 
          flex-direction: column;
          align-items: center; 
          gap: 20px; 
          color: #ff5252; 
          font-size: 1.4em; 
          font-weight: 600; 
          text-align: center;
          padding: 40px;
          border: 2px solid rgba(255, 82, 82, 0.3);
          border-radius: 12px;
          background: rgba(40, 0, 0, 0.4);
        }
        .lp-warning-content i { font-size: 3em; color: #ffca28; }
        .lp-warning-text { text-transform: uppercase; letter-spacing: 1px; }
      `;
      document.head.appendChild(styles);
    }
  };

  const handleNavigationFocusChange = () => {
    const navFocus = localStorage.getItem("navigationFocus");
    if (navFocus === "sidebarSearch") {
      focusedSection = "sidebarSearch";
      updateFocus();
    }
  };

  const getFilteredCategories = () => {
    // Return cache if parameters haven't changed
    if (cachedCats && categorySearchQuery === lastCategoryQuery) {
      const start = 0;
      const end = categoryChunk * categoryPageSize;
      return cachedCats.slice(start, end);
    }

    let cats = [
      {
        category_id: "All",
        category_name: "All Channels",
      },
      {
        category_id: "favorites",
        category_name: "Favorite Channels",
      },
      {
        category_id: "channelHistory",
        category_name: "Channels History",
      },
    ];

    if (window.liveCategories) {
      cats = [...cats, ...window.liveCategories];
    }

    if (categorySearchQuery) {
      cats = cats.filter((c) =>
        c.category_name
          .toLowerCase()
          .includes(categorySearchQuery.toLowerCase()),
      );
    }

    // Update Cache
    cachedCats = cats;
    lastCategoryQuery = categorySearchQuery;

    // Return only the current chunk
    const start = 0;
    const end = categoryChunk * categoryPageSize;
    return cats.slice(start, end);
  };

  const getAllFilteredCategories = () => {
    let cats = [
      {
        category_id: "All",
        category_name: "All Channels",
      },
      {
        category_id: "favorites",
        category_name: "Favorite Channels",
      },
      {
        category_id: "channelHistory",
        category_name: "Channels History",
      },
    ];

    if (window.liveCategories) {
      cats = [...cats, ...window.liveCategories];
    }

    if (categorySearchQuery) {
      cats = cats.filter((c) =>
        c.category_name
          .toLowerCase()
          .includes(categorySearchQuery.toLowerCase()),
      );
    }

    return cats;
  };

  const getFilteredChannels = () => {
    // Return cache if parameters haven't changed
    if (
      cachedStreams &&
      selectedCategoryId === lastCategoryId &&
      channelSearchQuery === lastChannelQuery &&
      currentSortOption === lastSort
    ) {
      return cachedStreams;
    }

    let streams = [];

    if (selectedCategoryId === "All") {
      streams = window.allLiveStreams || [];
    } else if (selectedCategoryId === "favorites") {
      // Always get fresh data from localStorage
      const currentPlaylist = getCurrentPlaylist();
      streams = currentPlaylist ? currentPlaylist.favoritesLiveTV || [] : [];
    } else if (selectedCategoryId === "channelHistory") {
      // Always get fresh data from localStorage
      const currentPlaylist = getCurrentPlaylist();
      streams = currentPlaylist ? currentPlaylist.ChannelListLive || [] : [];
    } else {
      streams = (window.allLiveStreams || []).filter(
        (s) => String(s.category_id) === String(selectedCategoryId),
      );
    }

    if (channelSearchQuery) {
      streams = streams.filter((s) =>
        (s.name || "").toLowerCase().includes(channelSearchQuery.toLowerCase()),
      );
    }

    // Apply Sorting
    if (currentSortOption === "a-z") {
      streams.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (currentSortOption === "z-a") {
      streams.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
    } else if (currentSortOption === "recently-added") {
      streams.sort((a, b) => {
        const timeA = a.added ? parseInt(a.added) : 0;
        const timeB = b.added ? parseInt(b.added) : 0;
        return timeB - timeA;
      });
    }

    // Update Cache
    cachedStreams = streams;
    lastCategoryId = selectedCategoryId;
    lastChannelQuery = channelSearchQuery;
    lastSort = currentSortOption;

    return streams;
  };

  const getCategoryCount = (catId) => {
    if (catId === "All") return (window.allLiveStreams || []).length;
    if (catId === "favorites") {
      const currentPlaylist = getCurrentPlaylist();
      return currentPlaylist && currentPlaylist.favoritesLiveTV
        ? currentPlaylist.favoritesLiveTV.length
        : 0;
    }
    if (catId === "channelHistory") {
      const currentPlaylist = getCurrentPlaylist();
      return currentPlaylist && currentPlaylist.ChannelListLive
        ? currentPlaylist.ChannelListLive.length
        : 0;
    }
    return (window.allLiveStreams || []).filter(
      (s) => String(s.category_id) === String(catId),
    ).length;
  };

  const render = () => {
    // Aggressive DOM Caching: Preserve the structure if it exists
    if (!container.innerHTML.trim()) {
      container.innerHTML = `
        <div class="lp-layout-wrapper">
          <!-- Column 1: Categories -->
          <div class="lp-sidebar">
            <div class="lp-search-box" id="lp-cat-search-box">
              <i class="fas fa-search lp-search-icon" style="color: #aaa; margin-right: 15px;"></i>
              <input type="text" class="lp-search-input" id="lp-cat-search-input" placeholder="Search Category" value="${categorySearchQuery}">
            </div>
            <ul class="lp-category-list" id="lp-category-list"></ul>
            <div id="lp-category-indicator" class="lp-category-indicator-floating">
              <img src="./assets/live-selected-icon.png" alt="Selected" />
            </div>
          </div>

          <!-- Column 2: Channels -->
          <div class="lp-channels-section">
            <div class="lp-channel-search-bar" id="lp-chan-search-box">
              <i class="fas fa-search lp-search-icon" style="color: #aaa; margin-right: 15px;"></i>
              <input type="text" class="lp-channel-search-input" id="lp-chan-search-input" placeholder="Search Channels" value="${channelSearchQuery}">
            </div>
            <div class="lp-channels-list" id="lp-channels-grid"></div>
          </div>

          <!-- Column 3: Player & EPG -->
          <div class="lp-right-column">
            <div class="lp-player-container" id="lp-player-container">
              <div class="lp-video-wrapper">
                <div style="width:100%; height:100%; background:black; display:flex; align-items:center; justify-content:center; flex-direction:column; color:#666;">
                  <i class="fas fa-play-circle" style="font-size: 80px; margin-bottom:20px;"></i>
                  <p>Select a channel to play</p>
                </div>
              </div>
            </div>
            <div class="lp-epg-container" id="lp-epg-container">
              <div class="lp-epg-header"><span>Program Guide</span></div>
              <div class="lp-epg-list" id="lp-epg-list">
                <div style="padding:20px; color:#aaa; text-align:center;">
                  Select a channel to view program information
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      setupInputListeners();
      setupScrollListener();
      setupClickListeners();
    }

    renderCategories();
    renderChannels();

    // Hide the loader quickly (Note: loader was already replaced in init,
    // but extra safety check here if it wasn't replaced)
    const loaderElement = document.querySelector("#live-page-loader");
    if (loaderElement) {
      loaderElement.style.animation = "fadeOut 0.2s ease-out";
      setTimeout(() => {
        if (loaderElement && loaderElement.parentNode) {
          loaderElement.parentNode.removeChild(loaderElement);
        }
      }, 200);
    }
  };

  const updateCategoryIndicator = () => {
    const indicator = document.getElementById("lp-category-indicator");
    const selectedItem = document.querySelector(
      ".lp-category-item.lp-selected",
    );
    const list = document.getElementById("lp-category-list");

    if (!indicator || !list) return;

    if (selectedItem) {
      const itemRect = selectedItem.getBoundingClientRect();
      const listRect = list.getBoundingClientRect();
      const sidebarRect = document
        .querySelector(".lp-sidebar")
        .getBoundingClientRect();

      // Check if item is within visible part of the list
      if (itemRect.top < listRect.bottom && itemRect.bottom > listRect.top) {
        indicator.style.display = "flex";
        // Position relative to .lp-sidebar which is position: relative
        const topPos = itemRect.top - sidebarRect.top + itemRect.height / 2;
        indicator.style.top = `${topPos}px`;
        indicator.style.transform = "translate(-40px, -50%)";
      } else {
        indicator.style.display = "none";
      }
    } else {
      indicator.style.display = "none";
    }
  };

  const renderCategories = () => {
    const list = document.getElementById("lp-category-list");
    if (!list) return;

    const cats = getFilteredCategories();

    if (cats.length === 0) {
      list.innerHTML =
        '<div style="padding:20px; zoom:1.4; color:#aaa; text-align:center;">No category found</div>';
      return;
    }

    const currentPlaylistForParental = getCurrentPlaylist();
    const parentalEnabled =
      currentPlaylistForParental &&
      !!currentPlaylistForParental.parentalPassword;

    list.innerHTML = cats
      .map((cat, idx) => {
        const isSelected =
          String(selectedCategoryId) === String(cat.category_id);
        let isAdult = isCategoryAdult(cat.category_id, cat.category_name);

        const isLocked =
          isAdult &&
          parentalEnabled &&
          !unlockedLiveAdultCatIds.has(String(cat.category_id));

        return `
        <li class="lp-category-item ${isSelected ? "lp-selected" : ""} ${
          isLocked ? "lp-category-locked" : ""
        }" data-id="${cat.category_id}" data-index="${idx}">
          <span class="lp-category-name">${cat.category_name}</span>
          <div style="display: flex; align-items: center; gap: 10px;">
            ${
              isLocked
                ? '<i class="fas fa-lock lp-cat-lock-icon" style="position:static; font-size: 14px; color: #aaa;"></i>'
                : ""
            }
            <span class="lp-category-count">${getCategoryCount(
              cat.category_id,
            )}</span>
          </div>
        </li>
      `;
      })
      .join("");

    // Update indicator position after render
    setTimeout(updateCategoryIndicator, 50);
  };

  const renderChannels = () => {
    const grid = document.getElementById("lp-channels-grid");
    if (!grid) return;

    filteredStreams = getFilteredChannels();
    grid.innerHTML = "";

    // Clear existing warning if any
    const existingWarning = document.querySelector(".lp-adult-warning-banner");
    if (existingWarning) existingWarning.remove();

    // Add adult content warning for "All" or "favorites" category if applicable
    if (selectedCategoryId === "All" || selectedCategoryId === "favorites") {
      const currentPlaylistForParental = getCurrentPlaylist();
      const parentalEnabled =
        currentPlaylistForParental &&
        !!currentPlaylistForParental.parentalPassword;

      const cats = getAllFilteredCategories();
      const currentCat = cats.find(
        (c) => String(c.category_id) === String(selectedCategoryId),
      );
      const catName = currentCat ? currentCat.category_name : "";

      if (
        parentalEnabled &&
        isCategoryAdult(selectedCategoryId, catName) &&
        !unlockedLiveAdultCatIds.has(String(selectedCategoryId)) &&
        !(selectedCategoryId === "All" && unlockedLiveAdultCatIds.has("All"))
      ) {
        grid.innerHTML = ""; // Don't show channels in background
        const warning = document.createElement("div");
        warning.className = "lp-adult-warning-banner";
        warning.style.cursor = "pointer";
        // Make it focusable for TV remotes
        warning.tabIndex = 0;

        warning.innerHTML = `
          <div class="lp-warning-content">
            <i class="fas fa-exclamation-triangle"></i>
            <span class="lp-warning-text">Contains Adult Content</span>
            <p style="font-size: 0.6em; margin-top: 10px; color: #aaa; font-weight: normal;">Click or Press Enter to unlock</p>
          </div>
        `;

        const unlockHandler = (e) => {
          e.stopPropagation();
          ParentalPinDialog(
            () => {
              unlockedLiveAdultCatIds.add(String(selectedCategoryId));

              // Explicitly handle "All" special case
              if (selectedCategoryId === "All") {
                unlockedLiveAdultCatIds.add("All");
              }

              // Re-render
              renderCategories();
              renderChannels();

              // Restore focus
              setTimeout(() => {
                updateFocus();
                const firstCard = document.querySelector(
                  ".lp-channel-card, .lp-channel-card-history",
                );
                if (firstCard) {
                  channelIndex = 0;
                  focusedSection = "channels";
                  updateFocus();
                }
              }, 100);
            },
            () => {
              console.log("PIN incorrect");
            },
            currentPlaylistForParental,
            "liveTvPage",
          );
        };

        warning.onclick = unlockHandler;
        warning.onkeydown = (e) => {
          if (e.key === "Enter") {
            unlockHandler(e);
          }
        };

        // Auto-focus the warning if we are in the channels section
        if (focusedSection === "channels") {
          setTimeout(() => warning.focus(), 0);
        }
        grid.style.position = "relative";
        grid.appendChild(warning);
        return; // Stop further rendering
      }
    }

    if (filteredStreams.length === 0) {
      grid.innerHTML =
        '<div style="padding:20px; color:#aaa; text-align:center;">No channels found</div>';
      return;
    }

    // Calculate which channels to show
    const endIdx = Math.min(
      channelChunk * channelPageSize,
      filteredStreams.length,
    );
    const channelsToRender = filteredStreams.slice(0, endIdx);

    const fragment = document.createDocumentFragment();

    channelsToRender.forEach((stream, idx) => {
      const currentPlaylistObj = getCurrentPlaylist();
      const playlistUsername = currentPlaylistObj
        ? currentPlaylistObj.playlistName
        : null;
      const isFav = window.isItemFavoriteForPlaylist
        ? window.isItemFavoriteForPlaylist(
            stream,
            "favoritesLiveTV",
            playlistUsername,
          )
        : false;

      const cardWrapper = document.createElement("div");
      cardWrapper.className = "lp-channel-card-wrapper";
      cardWrapper.dataset.index = idx;

      const card = document.createElement("div");
      const isPlaying =
        currentPlayingStream &&
        String(currentPlayingStream.stream_id) === String(stream.stream_id);
      card.className =
        (selectedCategoryId === "channelHistory"
          ? "lp-channel-card-history"
          : "lp-channel-card") + (isPlaying ? " lp-channel-card-playing" : "");
      card.dataset.streamId = stream.stream_id;
      card.dataset.index = idx;

      const randomProgress = Math.floor(Math.random() * 100);

      card.innerHTML = `
        <div class="lp-channel-number">${idx + 1}.</div>
        <div class="lp-channel-logo-container">
          <img src="${
            stream.stream_icon || "./assets/placeholder-img.png"
          }" onerror="this.src = 'assets/placeholder-img.png'">
        <div class="lp-fav-indicator" style="display: ${
          isFav ? "flex" : "none"
        };">
            <i class="fa-solid fa-heart"></i>
          </div> 
        </div>
        <div class="lp-channel-info-wrapper">
          <div class="lp-channel-name-container"><div class="lp-channel-name">${stream.name}</div></div>
          <div class="lp-program-info">Program info Entertainment</div>
          <div class="lp-progress-container">
      <div class="lp-progress-bar">
              <div class="lp-progress-fill" style="width: ${randomProgress}%;"></div>
              <div class="lp-progress-thumb" style="left: ${randomProgress}%;"></div>
            </div>
          </div>
        </div>
      `;

      const controls = document.createElement("div");
      if (selectedCategoryId === "channelHistory") {
        controls.className = "lp-channel-history-controls";
      } else {
        controls.className = "lp-channel-controls";
      }

      if (selectedCategoryId === "channelHistory") {
        // Show both heart and cross icons for Channel History
        controls.innerHTML = `
          <div class="lp-history-heart-btn ${
            isFav ? "lp-active" : ""
          }" data-stream-id="${stream.stream_id}">
            <i class="${isFav ? "fa-solid" : "fa-regular"} fa-heart"></i>
          </div>
          <div class="lp-history-remove-btn" data-stream-id="${stream.stream_id}">
            <i class="fa-solid fa-xmark"></i>
          </div>
        `;
      } else {
        // Show heart icon for Favorites and all other categories
        controls.innerHTML = `
          <div class="lp-channel-card-heart-button ${
            isFav ? "lp-active" : ""
          }" data-stream-id="${stream.stream_id}">
            <i class="${isFav ? "fa-solid" : "fa-regular"} fa-heart"></i>
          </div>
        `;
      }

      cardWrapper.appendChild(card);
      cardWrapper.appendChild(controls);
      fragment.appendChild(cardWrapper);
    });

    grid.appendChild(fragment);
  };

  const toggleFavorite = (stream, showToast = true) => {
    if (!window.toggleFavoriteItem) {
      console.error("toggleFavoriteItem function not available");
      return;
    }

    const now = Date.now();
    if (now - lastToggleTime < 500) {
      console.warn("Toggle favorite called too quickly, ignoring");
      return;
    }
    lastToggleTime = now;

    // CRITICAL FIX: Get fresh playlist data and check CURRENT favorite state BEFORE toggling
    const freshPlaylist = getCurrentPlaylist();
    const playlistUsername = freshPlaylist ? freshPlaylist.playlistName : null;

    if (!playlistUsername) {
      console.error("No playlist username found");
      if (showToast && window.Toaster && window.Toaster.showToast) {
        window.Toaster.showToast("error", "Failed to update favorites");
      }
      return;
    }

    // Check if the item is CURRENTLY a favorite (before toggling)
    const isCurrentlyFavorite = window.isItemFavoriteForPlaylist
      ? window.isItemFavoriteForPlaylist(
          stream,
          "favoritesLiveTV",
          playlistUsername,
        )
      : false;

    // Now perform the toggle operation
    const result = window.toggleFavoriteItem(stream, "favoritesLiveTV");

    // Clear data cache on update
    cachedStreams = null;
    cachedCats = null;

    // Check if the operation was successful
    if (!result || !result.success) {
      console.error(
        "Failed to toggle favorite:",
        result ? result.message : "unknown error",
      );
      if (showToast && window.Toaster && window.Toaster.showToast) {
        window.Toaster.showToast("error", "Failed to update favorites");
      }
      return;
    }

    // Show toast based on what we INTENDED to do (opposite of current state)
    // If it was a favorite, we removed it. If it wasn't, we added it.
    if (showToast && window.Toaster && window.Toaster.showToast) {
      const actionMessage = isCurrentlyFavorite
        ? "Removed from favorites"
        : "Added to favorites";
      const toastType = isCurrentlyFavorite ? "error" : "success";

      window.Toaster.showToast(toastType, actionMessage);
    }

    // Force refresh of the current playlist data from localStorage after toggle
    const updatedPlaylist = getCurrentPlaylist();

    if (selectedCategoryId === "favorites" && isCurrentlyFavorite) {
      // If we're in favorites view and removed an item, re-render everything
      channelChunk = 1;
      renderChannels();
      renderCategories();
      if (channelIndex >= filteredStreams.length) {
        channelIndex = Math.max(0, filteredStreams.length - 1);
      }
      buttonFocusIndex = -1;
      updateFocus();
    } else {
      // Update the specific card's heart icon based on fresh data
      const cardEl = document.querySelector(
        `.lp-channel-card[data-stream-id="${stream.stream_id}"], .lp-channel-card-history[data-stream-id="${stream.stream_id}"]`,
      );
      const controls = cardEl
        ? cardEl.parentElement.querySelector(".lp-channel-controls") ||
          cardEl.parentElement.querySelector(".lp-channel-history-controls")
        : null;

      if (controls) {
        const favBtnContainer =
          controls.querySelector(".lp-channel-card-heart-button") ||
          controls.querySelector(".lp-history-heart-btn");
        const favIcon = favBtnContainer
          ? favBtnContainer.querySelector("i")
          : null;

        if (favBtnContainer && favIcon) {
          // Check the actual favorite status from fresh playlist data after toggle
          const updatedPlaylistUsername = updatedPlaylist
            ? updatedPlaylist.playlistName
            : null;
          const actualIsFav = window.isItemFavoriteForPlaylist
            ? window.isItemFavoriteForPlaylist(
                stream,
                "favoritesLiveTV",
                updatedPlaylistUsername,
              )
            : result.isFav;

          favIcon.className = actualIsFav
            ? "fa-solid fa-heart"
            : "fa-regular fa-heart";

          if (actualIsFav) {
            favBtnContainer.classList.add("lp-active");
          } else {
            favBtnContainer.classList.remove("lp-active");
          }

          const logoIndicator = cardEl.querySelector(".lp-fav-indicator");
          if (logoIndicator) {
            logoIndicator.style.display = actualIsFav ? "flex" : "none";
          }
        }
      }

      // If this is the currently playing stream, update EPG heart icon too
      if (
        currentPlayingStream &&
        String(currentPlayingStream.stream_id) === String(stream.stream_id)
      ) {
        updateEPG(stream);
      }

      renderCategories();
    }
  };

  const removeFromHistory = (stream) => {
    const currentPlaylistName = JSON.parse(
      localStorage.getItem("selectedPlaylist"),
    ).playlistName;
    const playlistsData = JSON.parse(localStorage.getItem("playlistsData"));
    const currentPlaylistIndex = playlistsData.findIndex(
      (pl) => pl.playlistName === currentPlaylistName,
    );

    if (currentPlaylistIndex !== -1) {
      playlistsData[currentPlaylistIndex].ChannelListLive = (
        playlistsData[currentPlaylistIndex].ChannelListLive || []
      ).filter((ch) => String(ch.stream_id) !== String(stream.stream_id));

      localStorage.setItem("playlistsData", JSON.stringify(playlistsData));
    }
    window.Toaster.showToast("error", "Removed from Channel History");

    // Clear data cache on update
    cachedStreams = null;
    cachedCats = null;
    channelChunk = 1;
    renderChannels();
    renderCategories();

    if (channelIndex >= filteredStreams.length) {
      channelIndex = Math.max(0, filteredStreams.length - 1);
    }
    buttonFocusIndex = -1;
    updateFocus();
  };

  const updateFocus = () => {
    const clearFast = (className) => {
      const elements = document.getElementsByClassName(className);
      while (elements.length > 0) {
        elements[0].classList.remove(className);
      }
    };

    // Marquee cleanup
    const clearMarquees = () => {
      const activeMarquees = document.querySelectorAll(".lp-marquee-active");
      activeMarquees.forEach((el) => {
        el.classList.remove("lp-marquee-active");
        el.removeAttribute("data-marquee");
        el.style.removeProperty("--duration");
      });
    };

    const handleMarquee = (element, selector) => {
      if (!element) return;
      const textElement = element.querySelector(selector);
      if (textElement) {
        // Clear any other active marquees first, except this one
        const activeMarquees = document.querySelectorAll(".lp-marquee-active");
        activeMarquees.forEach((el) => {
          if (el !== textElement) {
            el.classList.remove("lp-marquee-active");
            el.removeAttribute("data-marquee");
            el.style.removeProperty("--duration");
          }
        });

        if (textElement.classList.contains("lp-marquee-active")) return;

        if (textElement.scrollWidth > textElement.clientWidth) {
          const text = (textElement.textContent || "").trim();
          textElement.setAttribute("data-marquee", text);
          const pxPerSecond = 50;
          const durationSeconds = Math.max(
            8,
            Math.round(textElement.scrollWidth / pxPerSecond),
          );
          textElement.style.setProperty("--duration", `${durationSeconds}s`);
          textElement.classList.add("lp-marquee-active");
        }
      }
    };

    const navFocus = localStorage.getItem("navigationFocus");
    if (navFocus === "navbar" || navFocus === "sidebar") {
      clearFast("lp-focused");
      clearFast("lp-control-focused");
      clearMarquees();
      return;
    }

    clearFast("lp-focused");
    clearFast("lp-control-focused");
    // clearMarquees(); removed from here, handled in handleMarquee

    // Blur inputs if not in search
    if (
      focusedSection !== "sidebarSearch" &&
      focusedSection !== "channelSearch"
    ) {
      const catInput = document.getElementById("lp-cat-search-input");
      const chanInput = document.getElementById("lp-chan-search-input");
      if (catInput) catInput.blur();
      if (chanInput) chanInput.blur();
    }

    if (focusedSection === "sidebarSearch") {
      const box = document.getElementById("lp-cat-search-box");
      if (box) box.classList.add("lp-focused");
    } else if (focusedSection === "sidebar") {
      const items = document.getElementsByClassName("lp-category-item");
      const target = items[sidebarIndex];
      if (target) {
        target.classList.add("lp-focused");
        target.scrollIntoView({
          block: "nearest",
        });
        handleMarquee(target, ".lp-category-name");
      }
    } else if (focusedSection === "channelSearch") {
      const box = document.getElementById("lp-chan-search-box");
      if (box) box.classList.add("lp-focused");
    } else if (focusedSection === "channels") {
      const items = document.querySelectorAll(
        ".lp-channel-card, .lp-channel-card-history",
      );
      const target = items[channelIndex];
      if (target) {
        target.classList.add("lp-focused");
        target.scrollIntoView({
          block: "nearest",
        });
        handleMarquee(target, ".lp-channel-name");

        if (buttonFocusIndex === 0) {
          const favBtn =
            target.parentElement.querySelector(
              ".lp-channel-card-heart-button",
            ) || target.parentElement.querySelector(".lp-history-heart-btn");
          if (favBtn) favBtn.classList.add("lp-focused");
        } else if (buttonFocusIndex === 1) {
          const removeBtn =
            target.parentElement.querySelector(
              ".lp-channel-card-remove-button",
            ) || target.parentElement.querySelector(".lp-history-remove-btn");
          if (removeBtn) removeBtn.classList.add("lp-focused");
        }
      }
    } else if (focusedSection === "player") {
      const player = document.getElementById("lp-player-container");
      if (player) {
        player.classList.add("lp-focused");
        if (playerSubFocus === 1) {
          const playBtn =
            document.querySelector(".play-pause-icon") ||
            document.getElementById("live-play-pause-btn");
          if (playBtn) playBtn.classList.add("lp-control-focused");
        } else if (playerSubFocus === 2) {
          const isFullscreen = checkIsFullscreen();
          const aspectRatioBtn =
            document.getElementById("videojs-aspect-ratio") ||
            document.getElementById("flow-aspect-ratio");

          if (isFullscreen && aspectRatioBtn) {
            aspectRatioBtn.classList.add("lp-control-focused");
          } else {
            const fullScreenBtn = document.getElementById("lp-fullscreen-btn");
            if (fullScreenBtn)
              fullScreenBtn.classList.add("lp-control-focused");
          }
        }
      }
    } else if (focusedSection === "epg") {
      const items = document.getElementsByClassName("lp-epg-item");
      const target = items[epgIndex];
      if (target) {
        target.classList.add("lp-focused");
        target.scrollIntoView({
          block: "nearest",
        });
      }
    }

    // Update categorical indicator whenever focus or selection might have changed position
    updateCategoryIndicator();
  };
  const playChannel = (stream) => {
    if (!stream) {
      isVideoLoading = false; // Reset loading state
      // Stop Player Logic
      const videoWrapper = document.querySelector(".lp-video-wrapper");
      if (videoWrapper) {
        if (
          typeof LiveVideoJsComponent !== "undefined" &&
          typeof LiveVideoJsComponent.cleanup === "function"
        ) {
          try {
            LiveVideoJsComponent.cleanup();
          } catch (err) {}
        }

        if (window.livePlayer) {
          try {
            window.livePlayer.dispose();
          } catch (e) {}
          window.livePlayer = null;
        }

        videoWrapper.innerHTML = `
          <div class="lp-video-placeholder" style="width:100%; height:100%; background:black; display:flex; align-items:center; justify-content:center; flex-direction:column; color:#666;">
            <i class="fas fa-play-circle" style="font-size: 50px; margin-bottom:10px;"></i>
            <p>Select a channel to play</p>
          </div>
        `;
      }

      // Reset EPG
      const epgList = document.getElementById("lp-epg-list");
      if (epgList) {
        epgList.innerHTML = `
          <div style="padding:20px; text-align:center; color:#aaa; zoom:1.3;">
            Select a channel to view program information
          </div>
        `;
      }
      const epgHeader = document.querySelector(".lp-epg-header");
      if (epgHeader) {
        epgHeader.innerHTML = `<span>Program Guide</span>`;
      }

      currentPlayingStream = null;

      document
        .querySelectorAll(".lp-channel-card, .lp-channel-card-history")
        .forEach((c) => {
          c.classList.remove("lp-channel-card-playing");
        });
      return;
    }
    if (
      currentPlayingStream &&
      String(currentPlayingStream.stream_id) === String(stream.stream_id)
    ) {
      console.log("Channel already playing, skipping reload");
      return;
    }

    currentPlayingStream = stream; // Set early to prevent multiple reloads
    isVideoLoading = true; // Set loading state

    // Show loading indicator
    const videoWrapper = document.querySelector(".lp-video-wrapper");
    if (videoWrapper) {
      videoWrapper.innerHTML = `
        <div style="width:100%; height:100%; background:black; display:flex; align-items:center; justify-content:center; flex-direction:column; color:#fff;">
          <i class="fas fa-spinner fa-spin" style="font-size: 50px; margin-bottom:10px;"></i>
          <p>Loading channel...</p>
        </div>
      `;
    }

    try {
      const currentPlaylistData = JSON.parse(
        localStorage.getItem("currentPlaylistData"),
      );
      const playlistLiveExtension = JSON.parse(
        localStorage.getItem("selectedPlaylist"),
      );

      if (!currentPlaylistData || !playlistLiveExtension) {
        console.error("Missing playlist data");
        return;
      }

      const liveVideoUrl = `${
        currentPlaylistData.server_info.server_protocol
      }://${currentPlaylistData.server_info.url}:${
        currentPlaylistData.server_info.port
      }/live/${currentPlaylistData.user_info.username}/${
        currentPlaylistData.user_info.password
      }/${stream.stream_id}.${playlistLiveExtension.streamFormat || "m3u8"}`;

      const videoWrapper = document.querySelector(".lp-video-wrapper");
      if (!videoWrapper) return;

      const videoEl = videoWrapper.querySelector("video");
      const currentStreamId = videoEl ? videoEl.dataset.streamId : null;

      if (currentStreamId !== String(stream.stream_id)) {
        if (typeof LiveVideoJsComponent.cleanup === "function") {
          try {
            LiveVideoJsComponent.cleanup();
          } catch (err) {}
        }

        if (window.livePlayer) {
          try {
            window.livePlayer.dispose();
          } catch (e) {}
          window.livePlayer = null;
        }

        const currentPlaylist = getCurrentPlaylist();
        const isTs =
          (currentPlaylist.streamFormat
            ? currentPlaylist.streamFormat
            : ""
          ).toLowerCase() === "ts";

        if (isTs && typeof FlowLivePlayerComponent === "function") {
          videoWrapper.innerHTML = FlowLivePlayerComponent(
            stream.stream_id,
            liveVideoUrl,
            stream.stream_icon,
            "100%",
            stream.name || "",
          );
        } else if (typeof LiveVideoJsComponent === "function") {
          videoWrapper.innerHTML = LiveVideoJsComponent(
            stream.stream_id,
            liveVideoUrl,
            stream.stream_icon,
            "100%",
            stream.name || "",
          );
        } else {
          videoWrapper.innerHTML = `<video src="${liveVideoUrl}" controls autoplay style="width:100%; height:100%;" data-stream-id="${stream.stream_id}"></video>`;
        }

        // Clear loading state after a short delay to allow player initialization
        setTimeout(() => {
          isVideoLoading = false;

          // OLD TIZEN REPAINT FIX: Old Tizen WebKit doesn't paint video frames
          // inside overflow:hidden flex containers unless a repaint is forced.
          // Reading offsetHeight forces a layout reflow, then toggling
          // the container's display triggers the GPU compositing layer.
          try {
            const playerContainer = document.getElementById(
              "lp-player-container",
            );
            if (playerContainer) {
              // Force reflow
              void playerContainer.offsetHeight;
              playerContainer.style.display = "none";
              void playerContainer.offsetHeight;
              playerContainer.style.display = "";
            }
          } catch (e) {}
        }, 1000);
      } else {
        if (window.livePlayer && typeof window.livePlayer.play === "function") {
          window.livePlayer.play();
        }
      }

      document
        .querySelectorAll(".lp-channel-card, .lp-channel-card-history")
        .forEach((c) => {
          c.classList.remove("lp-channel-card-playing");
        });

      const playingCard = document.querySelector(
        `.lp-channel-card[data-stream-id="${stream.stream_id}"], .lp-channel-card-history[data-stream-id="${stream.stream_id}"]`,
      );
      if (playingCard) {
        playingCard.classList.add("lp-channel-card-playing");
      }

      if (selectedCategoryId !== "channelHistory" && window.addItemToHistory) {
        // Prevent adult channels from being added to history
        const category = (window.liveCategories || []).find(
          (c) => c.category_id === stream.category_id,
        );
        const isAdultChannel =
          (category && isLiveAdultCategory(category.category_name)) ||
          isLiveAdultCategory(stream.name);

        if (!isAdultChannel) {
          window.addItemToHistory(stream, "ChannelListLive");
          setTimeout(() => {
            renderCategories();
          }, 100);
        }
      }

      updateEPG(stream);
    } catch (error) {
      console.error("Error playing channel:", error);
    }
  };

  const checkParentalAndPlay = (stream, onUnlockSuccess) => {
    if (!stream) return;

    const category = (window.liveCategories || []).find(
      (c) => String(c.category_id) === String(stream.category_id),
    );
    const isAdultChannel =
      (category && isLiveAdultCategory(category.category_name)) ||
      isLiveAdultCategory(stream.name);

    const currentPlaylistForParental = getCurrentPlaylist();
    const parentalEnabled =
      currentPlaylistForParental &&
      !!currentPlaylistForParental.parentalPassword;

    let isChannelUnlocked = true;
    let unlockSet = null;

    if (isAdultChannel && parentalEnabled) {
      if (selectedCategoryId === "All") {
        isChannelUnlocked = unlockedLiveAdultChannelsInAll.has(
          String(stream.stream_id),
        );
        unlockSet = unlockedLiveAdultChannelsInAll;
      } else if (selectedCategoryId === "favorites") {
        isChannelUnlocked = unlockedLiveAdultChannelsInFavorites.has(
          String(stream.stream_id),
        );
        unlockSet = unlockedLiveAdultChannelsInFavorites;
      } else if (selectedCategoryId === "channelHistory") {
        isChannelUnlocked = unlockedLiveAdultChannelsInHistory.has(
          String(stream.stream_id),
        );
        unlockSet = unlockedLiveAdultChannelsInHistory;
      } else {
        isChannelUnlocked = unlockedLiveAdultChannelsInCategories.has(
          String(stream.stream_id),
        );
        unlockSet = unlockedLiveAdultChannelsInCategories;
      }
    }

    if (isAdultChannel && parentalEnabled && !isChannelUnlocked && unlockSet) {
      ParentalPinDialog(
        () => {
          unlockSet.add(String(stream.stream_id));
          // Refresh background card state if it exists
          const card = document.querySelector(
            `.lp-channel-card[data-stream-id="${stream.stream_id}"], .lp-channel-card-history[data-stream-id="${stream.stream_id}"]`,
          );
          if (card) {
            const logoContainer = card.querySelector(
              ".lp-channel-logo-container",
            );
            if (logoContainer)
              logoContainer.classList.remove("lp-channel-card-locked");
            const lockIcon = card.querySelector(".lp-channel-lock-icon");
            if (lockIcon) lockIcon.remove();
          }
          if (onUnlockSuccess) onUnlockSuccess(stream);
          playChannel(stream);
        },
        () => {
          console.log("Parental PIN incorrect");
        },
        currentPlaylistForParental,
        "liveTvPage",
      );
    } else {
      if (onUnlockSuccess) onUnlockSuccess(stream);
      playChannel(stream);
    }
  };

  const updateEPG = (stream) => {
    currentPlayingStream = stream;
    const epgList = document.getElementById("lp-epg-list");
    const epgHeader = document.querySelector(".lp-epg-header");

    if (!epgList || !epgHeader) return;

    // Render Header immediately
    const currentPlaylistObj = getCurrentPlaylist();
    const playlistUsername = currentPlaylistObj
      ? currentPlaylistObj.playlistName
      : null;
    const isFav = window.isItemFavoriteForPlaylist
      ? window.isItemFavoriteForPlaylist(
          stream,
          "favoritesLiveTV",
          playlistUsername,
        )
      : false;

    const heartIcon = `<i class="${isFav ? "fa-solid" : "fa-regular"} fa-heart" style="color:${isFav ? "#ff4444" : "#aaa"}; margin-left: 10px; zoom:1.6;"></i>`;

    epgHeader.innerHTML = `
        <div style="display:flex; width:100%; justify-content:space-between; align-items:center;">
            <div style="display:flex; justify-content:space-between; align-items:center; gap: 10px;">
                <img src="${stream.stream_icon || "./assets/placeholder-img.png"}" 
                     style="border-radius: 4px; object-fit: contain;" 
                     onerror="this.src='assets/placeholder-img.png'">
            </div>
            <div>


            
            ${heartIcon}
        </div>
            </div>
    `;

    epgList.innerHTML = `
      <div style="padding:20px; text-align:center; color:#aaa;">
        <i class="fas fa-spinner fa-spin"></i> Loading EPG...
      </div>
    `;

    if (window.getLiveStreamEpg) {
      window
        .getLiveStreamEpg(stream.stream_id)
        .then((data) => {
          currentEpgData = data && data.epg_listings ? data.epg_listings : [];
          renderEPGList();
        })
        .catch((err) => {
          console.error("EPG Fetch Error", err);
          currentEpgData = [];
          renderEPGList();
        });
    } else {
      currentEpgData = [];
      renderEPGList();
    }
  };

  const decodeBase64 = (str) => {
    try {
      return decodeURIComponent(escape(window.atob(str)));
    } catch (e) {
      return str;
    }
  };

  const resetControlsTimer = () => {
    // Show controls
    const playPauseIcon =
      document.querySelector(".play-pause-icon") ||
      document.getElementById("live-play-pause-btn");
    const aspectRatioBtn =
      document.getElementById("videojs-aspect-ratio") ||
      document.getElementById("flow-aspect-ratio");

    if (playPauseIcon) playPauseIcon.style.display = "flex";
    if (aspectRatioBtn) aspectRatioBtn.style.display = "block";

    // Clear existing timeout
    if (window._controlsTimer) clearTimeout(window._controlsTimer);

    // Set new timeout to hide after 3 seconds
    window._controlsTimer = setTimeout(() => {
      if (playPauseIcon) playPauseIcon.style.display = "none";
      if (aspectRatioBtn) aspectRatioBtn.style.display = "none";
    }, 3000);
  };

  const togglePlayPauseGlobal = () => {
    if (!window.livePlayer) return;

    // Toggle Play/Pause
    if (typeof window.livePlayer.togglePlayPause === "function") {
      window.livePlayer.togglePlayPause();
    } else {
      // Video.js instance
      if (window.livePlayer.paused()) {
        window.livePlayer.play();
      } else {
        window.livePlayer.pause();
      }
    }

    resetControlsTimer();
  };

  const formatTime = (dateStr, format) => {
    let date;
    if (!isNaN(dateStr)) {
      const ts = dateStr.toString().length === 10 ? dateStr * 1000 : dateStr;
      date = new Date(parseInt(ts));
    } else {
      date = new Date(dateStr);
    }
    if (isNaN(date.getTime())) return "";

    const options =
      format === "12hrs"
        ? {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }
        : {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          };
    return new Intl.DateTimeFormat(undefined, options).format(date);
  };

  const renderEPGList = () => {
    const epgList = document.getElementById("lp-epg-list");
    if (!epgList) return;

    if (!currentEpgData || currentEpgData.length === 0) {
      epgList.innerHTML = `
            <div style="padding:20px; text-align:center; color:#666;">
                No Program Information Available
            </div>
          `;
      return;
    }

    // Get Time Format
    const currentPlaylist = getCurrentPlaylist();
    const timeFormatSetting =
      currentPlaylist && currentPlaylist.timeFormat
        ? currentPlaylist.timeFormat
        : "12hrs";

    epgList.innerHTML = currentEpgData
      .map((prog, idx) => {
        let timeDisplay = "";
        if (prog.start && prog.end) {
          const startStr = formatTime(
            prog.start_timestamp || prog.start,
            timeFormatSetting,
          );
          const endStr = formatTime(
            prog.stop_timestamp || prog.end,
            timeFormatSetting,
          );
          if (startStr && endStr) {
            timeDisplay = `${startStr} - ${endStr}`;
          } else {
            timeDisplay = "Upcoming";
          }
        }

        const title = prog.title ? decodeBase64(prog.title) : "No Title";
        const description = prog.description
          ? decodeBase64(prog.description)
          : prog.descr || "";

        return `
            <div class="lp-epg-item" data-index="${idx}">
                <div class="lp-epg-time" style="font-size:14px; color:white; margin-bottom:4px;">${timeDisplay}</div>
                <div class="lp-epg-title" style="font-size:16px; font-weight:bold; margin-bottom:2px;">${title}</div>
            </div>
          `;
      })
      .join("");
  };

  const isVideoPlaceholderVisible = () => {
    const videoWrapper = document.querySelector(".lp-video-wrapper");
    if (!videoWrapper) return false;
    // Check if the placeholder text exists
    return videoWrapper.innerText.includes("Select a channel to play");
  };

  const handleFullscreenChange = () => {
    const playerContainer = document.getElementById("lp-player-container");
    if (!playerContainer) return;

    // Cross-browser fullscreen detection
    const isFullscreen = checkIsFullscreen();

    const playPauseIcon =
      document.querySelector(".play-pause-icon") ||
      document.getElementById("live-play-pause-btn");

    // Clear auto-hide timer when fullscreen state changes
    if (playPauseIcon && playPauseIcon._hideTimeout) {
      clearTimeout(playPauseIcon._hideTimeout);
      playPauseIcon._hideTimeout = null;
    }

    if (isFullscreen) {
      // Entering fullscreen - hide border and play/pause icon initially
      playerContainer.classList.add("fullscreen-mode"); // Add fullscreen class
      playerContainer.classList.remove("lp-focused");
      playerContainer.classList.remove("lp-player-active");

      // Set focus to play/pause button automatically in fullscreen
      focusedSection = "player";
      playerSubFocus = 1;

      // Show both icons in fullscreen
      if (playPauseIcon) {
        playPauseIcon.style.display = "flex";
      }

      const aspectRatioBtn =
        document.getElementById("videojs-aspect-ratio") ||
        document.getElementById("flow-aspect-ratio");
      if (aspectRatioBtn) {
        aspectRatioBtn.style.display = "block";
      }

      resetControlsTimer();
      updateFocus();
    } else {
      // Exiting fullscreen - show border and ensure controls are hidden
      playerContainer.classList.remove("fullscreen-mode"); // Remove fullscreen class
      playerContainer.classList.remove("lp-focused"); // Remove yellow border
      playerContainer.classList.remove("lp-player-active");

      // Ensure aspect ratio buttons are hidden immediately
      const arBtns = document.querySelectorAll(
        ".videojs-aspect-ratio-div, .flow-aspect-ratio-div",
      );
      arBtns.forEach((btn) => (btn.style.display = "none"));

      // Ensure video is visible after exiting fullscreen
      const videoWrapper = document.querySelector(".lp-video-wrapper");
      if (videoWrapper) {
        const video = videoWrapper.querySelector("video");
        if (video) {
          video.style.display = "block";
          video.style.visibility = "visible";
          video.style.opacity = "1";
          video.style.width = "100%";
          video.style.height = "100%";
        }
      }

      // Always show play/pause icon when exiting fullscreen
      if (playPauseIcon) {
        playPauseIcon.style.display = "flex";
        // playPauseIcon.classList.add("lp-control-focused"); // Don't force focus here, let logic handle it
      }

      // Set focus to play/pause button
      focusedSection = "player";
      playerSubFocus = 1;
      updateFocus();

      // OLD TIZEN REPAINT FIX: After exiting fullscreen, force video repaint.
      // Old Tizen WebKit sometimes loses the video rendering context when
      // transitioning from fullscreen back to windowed mode.
      setTimeout(() => {
        try {
          const videoWrapper = document.querySelector(".lp-video-wrapper");
          if (videoWrapper) {
            const video = videoWrapper.querySelector("video");
            if (video) {
              void video.offsetHeight;
              video.style.display = "none";
              void video.offsetHeight;
              video.style.display = "block";
              video.style.width = "100%";
              video.style.height = "100%";
            }
            // Also force repaint on player container
            const playerContainer = document.getElementById(
              "lp-player-container",
            );
            if (playerContainer) {
              void playerContainer.offsetHeight;
              playerContainer.style.opacity = "0.99";
              void playerContainer.offsetHeight;
              playerContainer.style.opacity = "";
            }
          }
        } catch (e) {}
      }, 200);
    }
  };

  const handleSortChange = (e) => {
    if (e.detail.page === "liveTvPage") {
      // Avoid re-rendering channels when closing dropdown or re-selecting same sort
      if (currentSortOption === e.detail.sortType) return;
      currentSortOption = e.detail.sortType;
      channelChunk = 1;
      renderChannels();
    }
  };

  // ====================================================
  // CAPTURE-PHASE back button handler for CSS/Native fullscreen
  // Fires BEFORE all other listeners.
  // ====================================================
  const handleFullscreenBackCapture = (e) => {
    if (localStorage.getItem("currentPage") !== "liveTvPage") return;

    const isBackKey =
      e.keyCode === 461 ||
      e.keyCode === 10009 ||
      e.key === "Back" ||
      e.key === "BrowserBack" ||
      e.key === "XF86Back" ||
      e.key === "Escape" ||
      e.key === "SoftLeft" ||
      e.key === "Backspace";

    if (!isBackKey) return;

    const isFullscreen = checkIsFullscreen();
    const playerContainer = document.querySelector(".live-video-player-div");
    const isCssFullscreen =
      playerContainer && playerContainer.classList.contains("fullscreen-mode");

    if (isFullscreen || isCssFullscreen) {
      e.preventDefault();
      e.stopImmediatePropagation();

      console.log("[LivePage] Capture handler: exiting fullscreen");

      if (isCssFullscreen) {
        playerContainer.classList.remove("fullscreen-mode");
        // Trigger layout update
        handleFullscreenChange();
      }

      // Exit native fullscreen if active
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitCancelFullScreen) {
        document.webkitCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }

      // Ensure focus returns correctly
      focusedSection = "player";
      playerSubFocus = 1;
      updateFocus();

      return;
    }
  };

  const handleKeydown = (e) => {
    // Check if sidebar is open
    const sidebar = document.getElementById("sidebar");
    if (sidebar && !sidebar.classList.contains("option-remove")) {
      return; // Let Navbar handle the event
    }

    // Only process keydown events if navigationFocus is on this page
    const navigationFocus = localStorage.getItem("navigationFocus");
    const currentPage = localStorage.getItem("currentPage");

    if (currentPage !== "liveTvPage" || !document.body.contains(container)) {
      return;
    }

    if (
      navigationFocus !== "liveTvPage" &&
      navigationFocus !== "sidebarSearch" &&
      navigationFocus !== "channelSearch"
    ) {
      return; // Don't process keydown events until user navigates into the page
    }

    // Block navigation when video is loading
    if (isVideoLoading && ["ArrowRight"].includes(e.key)) {
      e.preventDefault();
      if (window.Toaster) {
        window.Toaster.showToast("info", "Please wait, loading channel...");
      }
      return;
    }

    // Cross-browser fullscreen detection
    const isFullscreen = checkIsFullscreen();

    // Handle Fullscreen Exit
    if (
      [
        "Escape",
        "Back",
        "BrowserBack",
        "XF86Back",
        "SoftLeft",
        "Backspace",
      ].includes(e.key) ||
      e.keyCode === 10009 ||
      e.keyCode === 461
    ) {
      if (isFullscreen) {
        // This is now handled entirely by handleFullscreenBackCapture in the capture phase
        return;
      }

      // Not in fullscreen, allow navigating back to navbar
      e.preventDefault();
      e.stopImmediatePropagation();
      localStorage.setItem("navigationFocus", "navbar");
      const navItem = document.querySelector(
        '.nav-item[data-page="liveTvPage"]',
      );
      if (navItem) navItem.focus();
      return;
    }

    // If in fullscreen, allow Enter to toggle play/pause and show icon
    if (isFullscreen && e.key === "Enter") {
      e.preventDefault();
      e.stopImmediatePropagation(); // Ensure it doesn't propagate

      // If focused on Aspect Ratio, click it
      if (playerSubFocus === 2) {
        const btn =
          document.getElementById("videojs-aspect-ratio") ||
          document.getElementById("flow-aspect-ratio");
        if (btn) btn.click();
        resetControlsTimer();
        return;
      }

      // Otherwise (Play/Pause focus or general player focus)
      // Toggle play/pause AND Show Controls AND Focus Play/Pause
      const playPauseIcon =
        document.querySelector(".play-pause-icon") ||
        document.getElementById("live-play-pause-btn");
      const aspectRatioBtn =
        document.getElementById("videojs-aspect-ratio") ||
        document.getElementById("flow-aspect-ratio");

      // Show both icons in fullscreen
      if (playPauseIcon) playPauseIcon.style.display = "flex";
      if (aspectRatioBtn) aspectRatioBtn.style.display = "block";

      // Toggle Play/Pause
      togglePlayPauseGlobal();

      // Ensure Play/Pause is focused
      if (playerSubFocus !== 1) {
        playerSubFocus = 1;
        updateFocus();
      }

      resetControlsTimer();
      return;
    }

    // In fullscreen, we let navigate functions handle arrows.
    // IMPORTANT: We do NOT call resetControlsTimer() here for arrows,
    // to prevent waking up the UI on random arrow presses.

    // Handle Enter key to focus search inputs
    if (focusedSection === "sidebarSearch" && e.key === "Enter") {
      const catInput = document.getElementById("lp-cat-search-input");
      if (catInput) {
        catInput.focus({
          preventScroll: true,
        });
        e.preventDefault();
        return;
      }
    }

    if (focusedSection === "channelSearch" && e.key === "Enter") {
      const chanInput = document.getElementById("lp-chan-search-input");
      if (chanInput) {
        chanInput.focus({
          preventScroll: true,
        });
        e.preventDefault();
        return;
      }
    }

    // Prevent default for navigation keys
    if (
      ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter"].includes(
        e.key,
      )
    ) {
      e.preventDefault();
      // CRITICAL: Stop propagation for Enter to prevent it from triggering click events
      if (e.key === "Enter") {
        e.stopImmediatePropagation();
      }
    }

    switch (e.key) {
      case "ArrowUp":
        navigateUp();
        break;
      case "ArrowDown":
        navigateDown();
        break;
      case "ArrowLeft":
        if (focusedSection === "player") {
          // In fullscreen, ArrowLeft ALWAYS switches to previous channel
          if (checkIsFullscreen()) {
            if (channelIndex > 0) {
              channelIndex--;
              const stream = filteredStreams[channelIndex];
              if (stream) {
                checkParentalAndPlay(stream, () => {
                  renderChannels(); // Keep background in sync
                });
              }
            } else {
              if (window.Toaster) {
                window.Toaster.showToast(
                  "info",
                  "No previous channel available",
                );
              }
            }
          } else {
            // Not in fullscreen - original behavior
            navigateLeft();
          }
        } else {
          navigateLeft();
        }
        break;
      case "ArrowRight":
        if (focusedSection === "player") {
          // In fullscreen, ArrowRight ALWAYS switches to next channel
          if (checkIsFullscreen()) {
            if (channelIndex < filteredStreams.length - 1) {
              channelIndex++;
              const stream = filteredStreams[channelIndex];
              if (stream) {
                checkParentalAndPlay(stream, () => {
                  renderChannels(); // Keep background in sync
                });
              }
            } else {
              if (window.Toaster) {
                window.Toaster.showToast("info", "No next channel available");
              }
            }
          } else {
            // Not in fullscreen - move to player controls first if not already there
            if (playerSubFocus === 0) {
              playerSubFocus = 1;
            } else if (currentEpgData && currentEpgData.length > 0) {
              focusedSection = "epg";
              epgIndex = 0;
            }
          }
        } else {
          navigateRight();
        }
        break;
      case "Enter":
        handleEnter();
        break;
    }

    if (focusedSection === "player" && !checkIsFullscreen()) {
      resetControlsTimer();
    }

    updateFocus();
  };

  const proceedWithSelection = (newCategoryId, shouldFocusChannels) => {
    // Check if we are switching categories
    if (String(selectedCategoryId) !== String(newCategoryId)) {
      selectedCategoryId = newCategoryId;
      channelSearchQuery = "";
      const chanInput = document.getElementById("lp-chan-search-input");
      if (chanInput) chanInput.value = "";
      channelChunk = 1;
      channelIndex = 0;
      buttonFocusIndex = -1;
    }

    renderCategories();
    renderChannels();

    if (shouldFocusChannels) {
      if (focusedSection !== "channels") {
        focusedSection = "channels";
      }

      // Ensure we highlight the first channel if switching via ArrowRight
      // But if we just stayed on the same category, keep the index unless it's out of bounds
      const items = document.querySelectorAll(
        ".lp-channel-card, .lp-channel-card-history",
      );
      if (items.length > 0) {
        if (channelIndex >= items.length) {
          channelIndex = 0;
        }
      }
    }
    updateFocus();
  };

  const handleCategorySelect = (index, shouldFocusChannels = false) => {
    const cats = getFilteredCategories();
    // Ensure index is valid
    if (index < 0 || index >= cats.length) return;

    const cat = cats[index];
    const newCategoryId = cat.category_id;

    // Parental Control Check
    let isAdult = isCategoryAdult(newCategoryId, cat.category_name);
    const currentPlaylistForParental = getCurrentPlaylist();
    const parentalEnabled =
      currentPlaylistForParental &&
      !!currentPlaylistForParental.parentalPassword;

    const isLocked =
      isAdult &&
      parentalEnabled &&
      !unlockedLiveAdultCatIds.has(String(newCategoryId));

    if (isLocked) {
      ParentalPinDialog(
        () => {
          unlockedLiveAdultCatIds.add(String(newCategoryId));
          // Explicitly add "All" special case
          if (String(newCategoryId) === "All") {
            unlockedLiveAdultCatIds.add("All");
          }

          proceedWithSelection(newCategoryId, shouldFocusChannels);
        },
        () => {
          console.log("Parental PIN incorrect for category");
          // Stay on sidebar, do NOT focus channels
        },
        currentPlaylistForParental,
        "liveTvPage",
      );
    } else {
      proceedWithSelection(newCategoryId, shouldFocusChannels);
    }
  };

  const navigateUp = () => {
    if (focusedSection === "sidebar") {
      if (sidebarIndex > 0) {
        sidebarIndex--;
      } else {
        focusedSection = "sidebarSearch";
      }
    } else if (focusedSection === "sidebarSearch") {
      localStorage.setItem("navigationFocus", "navbar");
      const navItem = document.querySelector(
        '.nav-item[data-page="liveTvPage"]',
      );
      if (navItem) navItem.focus();
    } else if (focusedSection === "channels") {
      // Direct focus on previous card, reset button focus
      buttonFocusIndex = -1;
      if (channelIndex > 0) {
        channelIndex--;
      } else {
        focusedSection = "channelSearch";
      }
    } else if (focusedSection === "channelSearch") {
      localStorage.setItem("navigationFocus", "navbar");
      const navItem = document.querySelector(
        '.nav-item[data-page="liveTvPage"]',
      );
      if (navItem) navItem.focus();
    } else if (focusedSection === "epg") {
      if (epgIndex > 0) {
        epgIndex--;
      } else {
        focusedSection = "player";
        playerSubFocus = 2; // Focus Full Screen
      }
    } else if (focusedSection === "player") {
      if (playerSubFocus === 2) {
        playerSubFocus = 1; // Move from Full Screen back to Play/Pause
        resetControlsTimer();
      } else {
        localStorage.setItem("navigationFocus", "navbar");
        const navItem = document.querySelector(
          '.nav-item[data-page="liveTvPage"]',
        );
        if (navItem) navItem.focus();
      }
    }
  };

  const navigateDown = () => {
    if (focusedSection === "sidebarSearch") {
      focusedSection = "sidebar";
      sidebarIndex = 0;
    } else if (focusedSection === "sidebar") {
      const loadedCats = getFilteredCategories();
      if (sidebarIndex < loadedCats.length - 1) {
        sidebarIndex++;
      } else {
        const allCats = getAllFilteredCategories();
        if (loadedCats.length < allCats.length) {
          categoryChunk++;
          renderCategories();
          sidebarIndex++;
        }
      }
    } else if (focusedSection === "channelSearch") {
      focusedSection = "channels";
      channelIndex = 0;
    } else if (focusedSection === "channels") {
      // Direct focus on next card, reset button focus.
      // Heart icon can only be focused by pressing Arrow Right.
      buttonFocusIndex = -1;
      if (channelIndex < filteredStreams.length - 1) {
        const loadedCount = channelChunk * channelPageSize;
        if (
          channelIndex + 1 >= loadedCount &&
          loadedCount < filteredStreams.length
        ) {
          channelChunk++;
          renderChannels();
        }
        channelIndex++;
      }
    } else if (focusedSection === "player") {
      if (playerSubFocus === 1) {
        playerSubFocus = 2; // Move from Play/Pause to Full Screen
        resetControlsTimer();
      } else if (playerSubFocus === 2) {
        if (currentEpgData && currentEpgData.length > 0) {
          focusedSection = "epg";
          epgIndex = 0;
        }
      } else {
        playerSubFocus = 1; // Default to Play/Pause
      }
    } else if (focusedSection === "epg") {
      if (epgIndex < currentEpgData.length - 1) {
        epgIndex++;
      }
    }
  };

  const navigateLeft = () => {
    if (focusedSection === "channelSearch") {
      focusedSection = "sidebarSearch";
    } else if (focusedSection === "channels") {
      if (buttonFocusIndex === 1) {
        buttonFocusIndex = 0; // Move from remove back to heart
      } else if (buttonFocusIndex === 0) {
        buttonFocusIndex = -1; // Move from heart back to card
      } else {
        focusedSection = "sidebar";
      }
    } else if (focusedSection === "player") {
      focusedSection = "channels";
    } else if (focusedSection === "epg") {
      focusedSection = "channels";
      // Check if remove button exists to focus it, otherwise focus heart
      if (selectedCategoryId === "channelHistory") {
        buttonFocusIndex = 1; // Focus remove icon first from EPG if it exists
      } else {
        buttonFocusIndex = 0; // Focus heart (standard or for Favorites)
      }
    }
  };

const navigateRight = () => {
        if (focusedSection === "sidebarSearch") {
            focusedSection = "channelSearch";
        } else if (focusedSection === "sidebar") {
  focusedSection = "channels";
  channelIndex = 0;      // reset highlight to first channel
  buttonFocusIndex = -1; // clear button focus

    } else if (focusedSection === "channelSearch") {
      if (!currentPlayingStream) return;
      focusedSection = "player";
      playerSubFocus = 1; // Focus Play/Pause
    } else if (focusedSection === "channels") {
      if (buttonFocusIndex === -1) {
        buttonFocusIndex = 0; // Focus Heart Button
      } else if (
        buttonFocusIndex === 0 &&
        selectedCategoryId === "channelHistory"
      ) {
        buttonFocusIndex = 1; // Focus Remove Button
      } else {
        if (!currentPlayingStream) return;
        focusedSection = "player";
        playerSubFocus = 1; // Focus Play/Pause
        buttonFocusIndex = -1;
      }
    }
  };

  const handleEnter = () => {
    if (
      focusedSection === "sidebarSearch" ||
      focusedSection === "channelSearch"
    ) {
      const input =
        focusedSection === "sidebarSearch"
          ? document.getElementById("lp-cat-search-input")
          : document.getElementById("lp-chan-search-input");
      if (input) input.focus();
    } else if (focusedSection === "sidebar") {
      // Simply select the category but stay on the sidebar.
      // User will press Arrow Right when they want to focus on channels.
      handleCategorySelect(sidebarIndex, false);
    } else if (focusedSection === "channels") {
      const stream = filteredStreams[channelIndex];
      if (!stream) return;

      if (buttonFocusIndex === 0) {
        toggleFavorite(stream, true);
      } else if (buttonFocusIndex === 1) {
        if (selectedCategoryId === "favorites") {
          toggleFavorite(stream, true);
        } else {
          removeFromHistory(stream);
        }
      } else {
        checkParentalAndPlay(stream);
      }
    } else if (focusedSection === "player") {
      if (playerSubFocus === 2) {
        toggleFullscreen();
      } else {
        togglePlayPauseGlobal();
      }
    }
  };

  const handleChannelAction = (stream) => {
    const now = Date.now();
    if (
      lastEnteredChannelId === String(stream.stream_id) &&
      now - lastEnterTime < 500
    ) {
      // First ensure it's playing (might already be if user clicked once then again)
      playChannel(stream);

      // Now toggle fullscreen
      toggleFullscreen();

      // Set focus to controls and show them
      focusedSection = "player";
      playerSubFocus = 1; // Play/Pause
      updateFocus();
      resetControlsTimer();

      lastEnterTime = 0;
    } else {
      lastEnterTime = now;
      lastEnteredChannelId = String(stream.stream_id);
      playChannel(stream);
    }
  };

  const setupClickListeners = () => {
    const categoryList = document.getElementById("lp-category-list");
    if (categoryList) {
      categoryList.addEventListener("click", (e) => {
        const item = e.target.closest(".lp-category-item");
        if (item) {
          const index = parseInt(item.dataset.index, 10);
          if (!isNaN(index)) {
            localStorage.setItem("navigationFocus", "liveTvPage");
            focusedSection = "sidebar";

            // Use shared handler
            handleCategorySelect(index, false);
          }
        }
      });
    }

    const channelGrid = document.getElementById("lp-channels-grid");
    if (channelGrid) {
      channelGrid.addEventListener("click", (e) => {
        const card = e.target.closest(
          ".lp-channel-card, .lp-channel-card-history",
        );
        if (card) {
          localStorage.setItem("navigationFocus", "liveTvPage");
          const index = parseInt(card.dataset.index, 10);
          if (!isNaN(index)) {
            focusedSection = "channels";
            channelIndex = index;
            updateFocus();

            const favBtn =
              e.target.closest(".lp-channel-card-heart-button") ||
              e.target.closest(".lp-history-heart-btn");
            const removeBtn =
              e.target.closest(".lp-channel-remove-btn") ||
              e.target.closest(".lp-channel-card-remove-button") ||
              e.target.closest(".lp-history-remove-btn");

            const stream = filteredStreams[channelIndex];
            if (stream) {
              if (favBtn) {
                e.stopPropagation();
                toggleFavorite(stream, true);
              } else if (removeBtn) {
                e.stopPropagation();
                removeFromHistory(stream);
              } else {
                // Check for adult content lock before playing
                const category = (window.liveCategories || []).find(
                  (c) => c.category_id === stream.category_id,
                );
                const isAdultChannel = category
                  ? isLiveAdultCategory(category.category_name)
                  : false;
                const currentPlaylistForParental = getCurrentPlaylist();
                const parentalEnabled =
                  currentPlaylistForParental &&
                  !!currentPlaylistForParental.parentalPassword;

                // Determine if channel is unlocked
                let isChannelUnlocked = true;
                let unlockSet = null;

                if (isAdultChannel && parentalEnabled) {
                  if (selectedCategoryId === "All") {
                    isChannelUnlocked = unlockedLiveAdultChannelsInAll.has(
                      String(stream.stream_id),
                    );
                    unlockSet = unlockedLiveAdultChannelsInAll;
                  } else if (selectedCategoryId === "favorites") {
                    isChannelUnlocked =
                      unlockedLiveAdultChannelsInFavorites.has(
                        String(stream.stream_id),
                      );
                    unlockSet = unlockedLiveAdultChannelsInFavorites;
                  } else if (selectedCategoryId === "channelHistory") {
                    isChannelUnlocked = unlockedLiveAdultChannelsInHistory.has(
                      String(stream.stream_id),
                    );
                    unlockSet = unlockedLiveAdultChannelsInHistory;
                  } else {
                    isChannelUnlocked =
                      unlockedLiveAdultChannelsInCategories.has(
                        String(stream.stream_id),
                      );
                    unlockSet = unlockedLiveAdultChannelsInCategories;
                  }
                }

                if (
                  isAdultChannel &&
                  parentalEnabled &&
                  !isChannelUnlocked &&
                  unlockSet
                ) {
                  // Show parental PIN dialog
                  ParentalPinDialog(
                    () => {
                      // PIN correct - unlock and play
                      unlockSet.add(String(stream.stream_id));

                      // Single channel unlock (All/Favorites/History/Category)
                      const card = document.querySelector(
                        `.lp-channel-card[data-stream-id="${stream.stream_id}"], .lp-channel-card-history[data-stream-id="${stream.stream_id}"]`,
                      );
                      if (card) {
                        const logoContainer = card.querySelector(
                          ".lp-channel-logo-container",
                        );
                        if (logoContainer) {
                          logoContainer.classList.remove(
                            "lp-channel-card-locked",
                          );
                        }
                        const lockIcon = card.querySelector(
                          ".lp-channel-lock-icon",
                        );
                        if (lockIcon) lockIcon.remove();
                      }

                      playChannel(stream);
                    },
                    () => {
                      // PIN incorrect - do nothing
                      console.log("Parental PIN incorrect");
                    },
                    currentPlaylistForParental,
                    "liveTvPage",
                  );
                  return;
                }

                // Play channel if not locked or already unlocked
                handleChannelAction(stream);
              }
            }
          }
        }
      });
    }
  };

  const setupInputListeners = () => {
    const catInput = document.getElementById("lp-cat-search-input");
    if (catInput) {
      catInput.addEventListener("input", (e) => {
        categorySearchQuery = e.target.value;
        categoryChunk = 1;
        sidebarIndex = 0; // Reset focus to top when searching
        renderCategories();
      });
      catInput.addEventListener("focus", () => {
        localStorage.setItem("navigationFocus", "liveTvPage");
        focusedSection = "sidebarSearch";
        updateFocus();
      });
    }

    const chanInput = document.getElementById("lp-chan-search-input");
    if (chanInput) {
      chanInput.addEventListener("input", (e) => {
        channelSearchQuery = e.target.value;
        channelChunk = 1;
        renderChannels();
      });
      chanInput.addEventListener("focus", () => {
        localStorage.setItem("navigationFocus", "liveTvPage");
        focusedSection = "channelSearch";
        updateFocus();
      });
    }
  };

  const setupScrollListener = () => {
    const grid = document.getElementById("lp-channels-grid");
    if (!grid) return;

    grid.removeEventListener("scroll", handleScroll);
    grid.addEventListener("scroll", handleScroll);

    const catList = document.getElementById("lp-category-list");
    if (catList) {
      catList.removeEventListener("scroll", updateCategoryIndicator);
      catList.addEventListener("scroll", updateCategoryIndicator);
    }
  };

  const handleScroll = () => {
    const grid = document.getElementById("lp-channels-grid");
    if (!grid) return;

    const scrollPosition = grid.scrollTop + grid.clientHeight;
    const scrollHeight = grid.scrollHeight;

    if (scrollPosition >= scrollHeight - 100) {
      const loadedChannels = channelChunk * channelPageSize;
      if (loadedChannels < filteredStreams.length) {
        channelChunk++;
        renderChannels();
      }
    }
  };

  return loadingHTML;
}
