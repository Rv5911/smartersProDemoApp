async function SeriesDetailPage() {
  if (SeriesDetailPage.cleanup) SeriesDetailPage.cleanup();
  const castImageUrl = "https://image.tmdb.org/t/p/w500";
  const selectedSeriesItem = JSON.parse(
    localStorage.getItem("selectedSeriesItem"),
  );

  let seriesIsContinueWatching = false;
  let castList = [];
  let getSeriesCastData = [];
  let selectedSeason = 1;
  let lastFocused = null;
  let focusableEls = [];
  let isDropdownOpen = false;

  const seriesDetailId = localStorage.getItem("selectedSeriesId");

  // Create custom loader
  const customLoader = document.createElement("div");
  customLoader.id = "series-detail-loader";
  customLoader.className = "custom-page-loader";
  customLoader.innerHTML = `
    <div class="custom-loader-content">
      <div class="custom-loader-spinner"></div>
    </div>
  `;
  document.body.appendChild(customLoader);

  // --- Setup back navigation handler FIRST ---
  let navigationInterrupted = false;

  function handleBackNavigationDuringLoading(e) {
    if (
      (e.keyCode === 10009 ||
        e.keyCode === 100079 ||
        e.key === "Escape" ||
        e.key === "Back" ||
        e.key === "BrowserBack" ||
        e.key === "XF86Back") &&
      localStorage.getItem("currentPage") === "seriesDetailPage"
    ) {
      e.preventDefault();
      e.stopPropagation();

      navigationInterrupted = true;

      const loader = document.getElementById("series-detail-loader");
      if (loader) loader.remove();

      document.removeEventListener(
        "keydown",
        handleBackNavigationDuringLoading,
      );

      localStorage.removeItem("selectedSeriesId");
      localStorage.setItem("currentPage", "seriesPage");
      Router.showPage("seriesPage");
      document.body.style.backgroundImage = "none";
      document.body.style.backgroundColor = "black";

      return true;
    }
  }

  document.addEventListener("keydown", handleBackNavigationDuringLoading);

  const seriesDetailData = await getSeriesDetail(seriesDetailId);
  if (navigationInterrupted) {
    document.removeEventListener("keydown", handleBackNavigationDuringLoading);
    return;
  }

  if (!seriesDetailData || !seriesDetailData.info) {
    const loader = document.getElementById("series-detail-loader");
    if (loader) loader.remove();
    document.removeEventListener("keydown", handleBackNavigationDuringLoading);

    Toaster.showToast("error", "No Data Found of Selected Series");
    localStorage.removeItem("selectedSeriesId");
    localStorage.setItem("currentPage", "seriesPage");
    Router.showPage("seriesPage");
    document.body.style.backgroundImage = "none";
    document.body.style.backgroundColor = "black";
    return;
  }

  const lastPlayedEpisodeId = localStorage.getItem("lastPlayedEpisodeId");

  if (seriesDetailData) {
    localStorage.setItem(
      "seriesEpisodesData",
      JSON.stringify(seriesDetailData.episodes || {}),
    );
  }

  // Determine initial selected season
  const episodes = seriesDetailData.episodes || {};
  if (lastPlayedEpisodeId) {
    Object.keys(episodes).forEach((seasonKey) => {
      const seasonEpisodes = episodes[seasonKey];
      const playedEpisode = seasonEpisodes.find(
        (ep) => ep.id.toString() === lastPlayedEpisodeId,
      );
      if (playedEpisode) {
        selectedSeason = parseInt(seasonKey);
      }
    });
  }

  localStorage.setItem("selectedSeason", selectedSeason.toString());

  const currentPlaylistName = JSON.parse(
    localStorage.getItem("selectedPlaylist"),
  ).playlistName;
  const currentPlaylist = JSON.parse(
    localStorage.getItem("playlistsData"),
  ).filter((pl) => pl.playlistName === currentPlaylistName)[0];

  const continueWatchingEpisodes = currentPlaylist.continueWatchingSeries || [];
  if (continueWatchingEpisodes.length > 0) {
    seriesIsContinueWatching = continueWatchingEpisodes.some(
      (item) => item.itemId === seriesDetailId,
    );
  }

  const continueWatchingMap = {};
  (continueWatchingEpisodes || []).forEach((item) => {
    if (!item || !item.episodeId) return;
    const seasonKey = 1; // Simplify mapping if necessary
    const episodeKey = Number(item.episodeId);
    if (!continueWatchingMap[seasonKey]) continueWatchingMap[seasonKey] = {};
    const progress = item.duration
      ? Math.min(Math.max((item.resumeTime / item.duration) * 100, 0), 100)
      : 0;
    continueWatchingMap[seasonKey][episodeKey] = progress;
  });

  document.removeEventListener("keydown", handleBackNavigationDuringLoading);

  const seriesInfo = seriesDetailData.info || {};

  // --- Helper Functions ---

  const toggleNavbar = (show) => {
    const navbar = document.querySelector("#navbar-root");
    if (navbar) {
      navbar.style.display = show ? "flex" : "none";
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0 min";
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    } else {
      return `${mins} min`;
    }
  };

  const getEpisodeDurationInSeconds = (episode) => {
    if (episode.info && episode.info.duration_secs)
      return parseInt(episode.info.duration_secs);
    if (episode.duration) return parseInt(episode.duration);
    if (episode.info && episode.info.duration) {
      const val = parseInt(episode.info.duration);
      if (!isNaN(val)) return val * 60;
    }
    if (continueWatchingEpisodes) {
      const found = continueWatchingEpisodes.find(
        (item) => item.episodeId === episode.id.toString(),
      );
      if (found && found.duration) return parseInt(found.duration);
    }
    return 0;
  };

  const setFocus = (el, smoothScroll = true) => {
    if (lastFocused) {
      lastFocused.classList.remove("series-detail-button-focused");
    }
    if (!el) return;

    el.classList.add("series-detail-button-focused");
    el.focus();
    lastFocused = el;

    // Navbar Visibility Logic - UPDATED: Only hide on episodes
    if (el.classList.contains("seasons-episodes-item")) {
      toggleNavbar(false);
    } else {
      toggleNavbar(true);
    }

    // Scroll Handling
    const scrollContainer = document.querySelector(
      ".series-detail-page-container",
    );

    if (el.classList.contains("seasons-episodes-item")) {
      el.scrollIntoView({
        block: "center",
        inline: "nearest",
        behavior: smoothScroll ? "smooth" : "auto",
      });
    } else if (
      el.classList.contains("series-detail-play-button") ||
      el.classList.contains("series-detail-fav-button") ||
      el.id === "season-dropdown-btn"
    ) {
      if (scrollContainer) {
        scrollContainer.scrollTo({
          top: 0,
          behavior: smoothScroll ? "smooth" : "auto",
        });
      }
    } else if (el.classList.contains("dropdown-item")) {
      // Ensure dropdown item is visible in dropdown list
      el.scrollIntoView({
        block: "nearest",
        behavior: "auto",
      });
    }
  };

  const rebuildFocusable = () => {
    if (isDropdownOpen) {
      focusableEls = Array.from(
        document.querySelectorAll("#season-dropdown-list .dropdown-item"),
      );
    } else {
      const topButtons = Array.from(
        document.querySelectorAll(".series-detail-buttons button"),
      );
      const episodeItems = Array.from(
        document.querySelectorAll(".seasons-episodes-item"),
      );
      focusableEls = [...topButtons, ...episodeItems];
    }
  };

  const renderEpisodes = () => {
    const container = document.querySelector(".series-detail-cast");
    const headerTitle = document.querySelector("#current-season-display-title");
    if (headerTitle) headerTitle.textContent = `Season ${selectedSeason}`;

    if (!container) return;

    const seasonEpisodes = episodes[selectedSeason.toString()] || [];

    const episodeHtml = seasonEpisodes
      .map((episode, j) => {
        const seasonKey = 1;
        const episodeKey = Number(episode.id);
        let progress = 0;
        if (
          continueWatchingMap[seasonKey] &&
          continueWatchingMap[seasonKey][episodeKey]
        ) {
          progress = continueWatchingMap[seasonKey][episodeKey];
        }

        const durationStr = formatTime(getEpisodeDurationInSeconds(episode));

        return `
               <div class="seasons-episodes-item" tabindex="0" data-episode-index="${j}" data-episode-id="${episode.id}">
                 <div class="episode-row-left">
                     <div class="episode-image-container">
                        <div class="episode-card-inner" style="background-image: url('${episode.info.movie_image || seriesInfo.cover || "./assets/placeholder-img.png"}')">
                            <div class="play-icon-overlay">
                                <img src="./assets/playicon.png" />
                            </div>
                            ${
                              progress > 0
                                ? `
                            <div class="episode-red-progress-container">
                                <div class="episode-red-progress-bar" style="width: ${progress}%;"></div>
                            </div>`
                                : ""
                            }
                        </div>
                     </div>
                 </div>
                 <div class="episode-row-right">
                    <div class="episode-number-title-row">
                         <span class="episode-number-title">${j + 1}. ${episode.title || `Episode ${episode.episode_num}`} (${seriesDetailData.info.releaseDate ? seriesDetailData.info.releaseDate.split("-")[0] : ""}) - S${selectedSeason.toString().padStart(2, "0")}E${(episode.episode_num || j + 1).toString().padStart(2, "0")} - ${episode.title || "Unknown"}</span>
                    </div>
                    ${durationStr ? `<div class="episode-duration-text">${durationStr}</div>` : ""}
                     <p class="episode-description">${episode.info.plot || episode.plot || seriesInfo.plot || "No description available."}</p>
                 </div>
               </div>
             `;
      })
      .join("");

    container.innerHTML = episodeHtml;
    rebuildFocusable();
  };

  const updateSeasonButtonText = (season) => {
    const btn = document.querySelector("#season-dropdown-btn");
    if (btn) {
      // Provide icon if not 'no-dropdown'
      const isStatic = btn.classList.contains("no-dropdown");
      btn.innerHTML = `Season ${season} ${!isStatic ? '<i class="fas fa-chevron-down dropdown-icon" style="margin-left: 10px;"></i>' : ""}`;
    }
  };

  const toggleDropdown = () => {
    const dropdown = document.getElementById("season-dropdown-list");
    const container = document.querySelector(".season-dropdown-container");
    const icon = document.querySelector("#season-dropdown-btn .dropdown-icon");

    if (!dropdown) return;

    if (isDropdownOpen) {
      // Close
      dropdown.classList.add("hidden");
      if (container) container.classList.remove("open");
      isDropdownOpen = false;

      if (icon) icon.className = "fas fa-chevron-down dropdown-icon";

      // Restore Focus to Button
      const btn = document.getElementById("season-dropdown-btn");
      if (btn) {
        setFocus(btn);
      }
    } else {
      // Open
      dropdown.classList.remove("hidden");
      if (container) container.classList.add("open");
      isDropdownOpen = true;

      if (icon) icon.className = "fas fa-chevron-up dropdown-icon";

      rebuildFocusable();
      // Focus selected season or first
      let selectedItem = dropdown.querySelector(
        `.dropdown-item[data-season="${selectedSeason}"]`,
      );
      if (!selectedItem)
        selectedItem = dropdown.querySelector(".dropdown-item");

      if (selectedItem) setFocus(selectedItem);
    }
  };

  const playEpisode = (episodeId, episodeIndex, startFromBeginning = false) => {
    const seasonEpisodes = episodes[selectedSeason.toString()] || [];
    const episode = seasonEpisodes[episodeIndex];

    if (episode) {
      localStorage.setItem("selectedEpisodeId", episodeId);
      localStorage.setItem("selectedSeason", selectedSeason.toString());

      const currentPlaylist = JSON.parse(
        localStorage.getItem("currentPlaylistData"),
      );
      const seriesEpisodeVideoUrl = `${currentPlaylist.server_info.server_protocol}://${currentPlaylist.server_info.url}:${currentPlaylist.server_info.port}/series/${currentPlaylist.user_info.username}/${currentPlaylist.user_info.password}/${episodeId}.${episode.container_extension}`;

      const playingItemData = {
        ...episode,
      };

      if (startFromBeginning) {
        playingItemData.resumeTime = 0;
        const username = currentPlaylist.user_info.username;
        removeItemFromHistoryById(
          episodeId,
          "continueWatchingSeries",
          username,
        );

        // Update local storage playlist data
        const playlistsData = JSON.parse(
          localStorage.getItem("playlistsData") || "[]",
        );
        const updatedPlaylists = playlistsData.map((playlist) => {
          if (playlist.playlistName === currentPlaylistName) {
            const updatedContinueWatching = (
              playlist.continueWatchingSeries || []
            ).filter((item) => item.episodeId !== episodeId);
            return {
              ...playlist,
              continueWatchingSeries: updatedContinueWatching,
            };
          }
          return playlist;
        });
        localStorage.setItem("playlistsData", JSON.stringify(updatedPlaylists));
      }

      localStorage.setItem("playingItemData", JSON.stringify(playingItemData));
      localStorage.setItem("selectedVideoItemUrl", seriesEpisodeVideoUrl);
      localStorage.setItem("from", "series");
      localStorage.setItem("currentPage", "videojsPlayer");

      const navbarEl = document.querySelector("#navbar-root");
      if (navbarEl) navbarEl.style.display = "none";

      Router.showPage("videoJsPlayer");
      document.body.style.backgroundImage = "none";
      document.body.style.backgroundColor = "black";
    }
  };

  // --- KEYDOWN HANDLER ---
  const seriesDetailPageKeydownHandler = (e) => {
    if (localStorage.getItem("currentPage") !== "seriesDetailPage") return;

    // Helper to detect back keys consistently
    const isBackKey = (event) => {
      return (
        ["Escape", "Back", "BrowserBack", "XF86Back", "Backspace"].includes(
          event.key,
        ) || [10009, 100079, 8, 461, 27].includes(event.keyCode)
      );
    };

    // Robust check for dropdown state using DOM visibility
    const dropdownList = document.getElementById("season-dropdown-list");
    const actuallyOpen =
      dropdownList && !dropdownList.classList.contains("hidden");

    // Force sync local variable with actual state
    if (actuallyOpen !== isDropdownOpen) {
      isDropdownOpen = actuallyOpen;
    }

    // Check dropdown state FIRST
    if (isDropdownOpen) {
      // If dropdown is open, handle keys exclusively
      if (isBackKey(e)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        toggleDropdown();
        return;
      }

      const activeEl = document.activeElement;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        rebuildFocusable(); // Update focusableEls
        const idx = focusableEls.indexOf(activeEl);
        if (idx < focusableEls.length - 1) setFocus(focusableEls[idx + 1]);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        rebuildFocusable(); // Update focusableEls
        const idx = focusableEls.indexOf(activeEl);
        if (idx > 0) setFocus(focusableEls[idx - 1]);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const season = parseInt(activeEl.getAttribute("data-season"));
        if (!isNaN(season)) {
          if (season !== selectedSeason) {
            selectedSeason = season;
            localStorage.setItem("selectedSeason", selectedSeason.toString());
            updateSeasonButtonText(selectedSeason);
            renderEpisodes();
          }
          toggleDropdown(); // Close and focus button
        }
      }
      return; // BLOCK other interactions while dropdown is open
    }

    rebuildFocusable();
    const activeEl = document.activeElement;

    // Back Navigation (Normal)
    if (isBackKey(e)) {
      // Re-verify dropdown state just in case
      const dropdownListInner = document.getElementById("season-dropdown-list");
      if (
        dropdownListInner &&
        !dropdownListInner.classList.contains("hidden")
      ) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        toggleDropdown();
        return;
      }

      // Check if sidebar is open - if so, let navbar handle it
      const sidebar = document.querySelector(".sidebar");
      if (sidebar && !sidebar.classList.contains("option-remove")) {
        // Sidebar is open, don't navigate away - navbar will close it
        return;
      }

      e.preventDefault();
      localStorage.removeItem("selectedSeriesId");
      localStorage.removeItem("lastPlayedEpisodeId");
      localStorage.setItem("currentPage", "seriesPage");
      Router.showPage("seriesPage");
      document.body.style.backgroundImage = "none";
      document.body.style.backgroundColor = "black";
      return;
    }

    // Identify Section
    const isTopButton =
      activeEl.classList.contains("series-detail-play-button") ||
      activeEl.classList.contains("series-detail-fav-button") ||
      activeEl.id === "season-dropdown-btn";

    const isEpisode = activeEl.classList.contains("seasons-episodes-item");

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (isTopButton) {
        const firstEpisode = document.querySelector(".seasons-episodes-item");
        if (firstEpisode) setFocus(firstEpisode);
      } else if (isEpisode) {
        const idx = focusableEls.indexOf(activeEl);
        // Find next episode
        if (idx !== -1 && idx < focusableEls.length - 1) {
          setFocus(focusableEls[idx + 1]);
        }
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (isEpisode) {
        const idx = focusableEls.indexOf(activeEl);
        // Filter focusableEls to just episodes to find index within episodes
        const episodes = document.querySelectorAll(".seasons-episodes-item");
        const epArray = Array.from(episodes);
        const epIndex = epArray.indexOf(activeEl);

        if (epIndex > 0) {
          setFocus(epArray[epIndex - 1]);
        } else {
          // Go to play button or active top button
          // Default to Play button
          const playBtn = document.querySelector(".series-detail-play-button");
          if (playBtn) setFocus(playBtn);
        }
      } else if (isTopButton) {
        // Go to Navbar
        const scrollContainer = document.querySelector(
          ".series-detail-page-container",
        );
        if (scrollContainer) {
          scrollContainer.scrollTo({
            top: 0,
          });
        }
        localStorage.setItem("navigationFocus", "navbar");
        if (lastFocused)
          lastFocused.classList.remove("series-detail-button-focused");
        const navItem =
          document.querySelector(".nav-item[data-page='seriesPage']") ||
          document.querySelector(".nav-item");
        if (navItem) {
          navItem.focus();
          navItem.classList.add("active");
        }
      }
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (isTopButton) {
        const idx = focusableEls.indexOf(activeEl);
        if (idx !== -1 && idx < focusableEls.length - 1) {
          const next = focusableEls[idx + 1];
          if (
            next.classList.contains("series-detail-fav-button") ||
            next.id === "season-dropdown-btn"
          ) {
            setFocus(next);
          }
        }
      }
      // Episodes are vertical, Right/Left does nothing or ignores
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (isTopButton) {
        const idx = focusableEls.indexOf(activeEl);
        if (idx > 0) {
          const prev = focusableEls[idx - 1];
          if (
            prev.classList.contains("series-detail-play-button") ||
            prev.classList.contains("series-detail-fav-button") ||
            prev.id === "season-dropdown-btn"
          ) {
            setFocus(prev);
          }
        }
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (isTopButton) {
        if (activeEl.classList.contains("series-detail-play-button")) {
          // Play Logic
          const dataSeason =
            activeEl.getAttribute("data-last-season") ||
            Object.keys(episodes)[0];
          const dataEpIndex =
            activeEl.getAttribute("data-last-episode-index") || 0;
          const dataEpId = activeEl.getAttribute("data-last-episode-id");

          if (dataEpId) {
            // Switch to that season if different
            if (parseInt(dataSeason) !== selectedSeason) {
              selectedSeason = parseInt(dataSeason);
              renderEpisodes();
              // Check if we need to update button text too
              updateSeasonButtonText(selectedSeason);
            }
            playEpisode(dataEpId, parseInt(dataEpIndex));
          }
        } else if (activeEl.classList.contains("series-detail-fav-button")) {
          const result = toggleFavoriteItem(
            selectedSeriesItem.series_id,
            "favouriteSeries",
          );
          // Refresh Button State
          const icon = activeEl.querySelector("i");
          if (icon) {
            icon.className = result.isFav
              ? "fa-solid fa-heart"
              : "fa-regular fa-heart";
            icon.style.color = "#ff4d4d";
            icon.style.opacity = result.isFav ? "1" : "0.6";
          }
          Toaster.showToast(
            result.isFav ? "success" : "error",
            result.isFav ? "Added to Favorites" : "Removed from Favorites",
          );
        } else if (activeEl.id === "season-dropdown-btn") {
          const hasMultipleSeasons = Object.keys(episodes).length > 1;
          if (hasMultipleSeasons) {
            toggleDropdown();
          }
        }
      } else if (isEpisode) {
        const epIndex = parseInt(activeEl.dataset.episodeIndex);
        const epId = activeEl.dataset.episodeId;
        playEpisode(epId, epIndex);
      }
    }
  };

  document.addEventListener("keydown", seriesDetailPageKeydownHandler);
  SeriesDetailPage.cleanup = function () {
    document.removeEventListener("keydown", seriesDetailPageKeydownHandler);
  };

  // --- INITIAL RENDER ---

  const renderSeriesDetailPage = () => {
    const sortedSeasons = Object.keys(episodes)
      .map((k) => ({
        season: parseInt(k),
        count: episodes[k].length,
      }))
      .sort((a, b) => a.season - b.season);

    // Buttons HTML
    let playButtonHtml = `<button class="series-detail-play-button gradient-btn" tabindex="0"><i class="fa fa-play"></i> Play</button>`;

    // Check continue watching for better Play button
    if (continueWatchingEpisodes.length > 0) {
      const last = continueWatchingEpisodes.find(
        (x) => x.itemId === seriesDetailId,
      );
      if (last) {
        // Find episode details
        let seasonKey, epIndex, epId;
        Object.keys(episodes).forEach((sk) => {
          const idx = episodes[sk].findIndex(
            (e) => e.id.toString() === last.episodeId,
          );
          if (idx !== -1) {
            seasonKey = sk;
            epIndex = idx;
            epId = last.episodeId;
          }
        });
        if (seasonKey) {
          const ep = episodes[seasonKey][epIndex];
          playButtonHtml = `<button class="series-detail-play-button gradient-btn" tabindex="0" 
                           data-last-season="${seasonKey}" data-last-episode-index="${epIndex}" data-last-episode-id="${epId}">
                           <i class="fas fa-play"></i> Resume S${seasonKey.padStart(2, "0")}:E${ep.episode_num}
                       </button>`;
        }
      }
    }

    // Always set default "Play S1 EP1" if no resume button was set
    if (
      playButtonHtml.includes("> Play</button>") &&
      sortedSeasons.length > 0 &&
      episodes[sortedSeasons[0].season].length > 0
    ) {
      const s1 = sortedSeasons[0].season;
      const ep1 = episodes[s1][0];
      playButtonHtml = `<button class="series-detail-play-button gradient-btn" tabindex="0"
                data-last-season="${s1}" data-last-episode-index="0" data-last-episode-id="${ep1.id}">
                <i class="fas fa-play"></i> Play S${s1} EP${ep1.episode_num}
             </button>`;
    }

    const isFavorite = isItemFavoriteForPlaylist(
      selectedSeriesItem.series_id,
      "favouriteSeries",
    );

    var heartIconHtml = `<i class="${isFavorite ? "fa-solid" : "fa-regular"} fa-heart" 
        style="color: ${isFavorite ? "#ff4d4d" : "white"}; opacity: ${isFavorite ? "1" : "0.6"};"></i>`;

    const backdrop =
      seriesInfo.backdrop || seriesInfo.cover || "./assets/placeholder.png";

    // Rating logic
    let originalRating = seriesInfo.rating_5based || 0;
    let normalizedRating = parseFloat(originalRating);
    if (normalizedRating > 5) normalizedRating = normalizedRating / 2;
    const ratingStr = normalizedRating.toFixed(1);

    function getStarRatingHtml(rating) {
      let stars = "";
      const fullStars = Math.floor(rating);
      const hasHalfStar = rating % 1 >= 0.5;
      const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

      for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
      }
      if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
      }
      for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
      }
      return stars;
    }
    const starsHtml = getStarRatingHtml(normalizedRating);

    // Dropdown HTML
    const hasMultipleSeasons = sortedSeasons.length > 1;
    const seasonBtnHtml = `
        <div class="season-dropdown-container">
            <button id="season-dropdown-btn" class="series-detail-season-button gradient-btn ${!hasMultipleSeasons ? "no-dropdown" : ""}" tabindex="0">
                Season ${selectedSeason} ${hasMultipleSeasons ? '<i class="fas fa-chevron-down dropdown-icon" style="margin-left: 10px;"></i>' : ""}
            </button>
            <ul id="season-dropdown-list" class="season-dropdown-list hidden">
                ${sortedSeasons
                  .map(
                    (s) => `
                    <li class="dropdown-item" tabindex="0" data-season="${s.season}">Season ${s.season}</li>
                `,
                  )
                  .join("")}
            </ul>
        </div>
    `;

    return `
        <div class="series-detail-page-container">
            <img class="series-detail-backdrop-image" src="${backdrop}" onerror="this.src='./assets/demo-img-card.png'" />
            <div class="series-detail-overlay"></div>
            
        <div class="series-content-layout">
                 <div class="series-info-container">
                     <div class="series-detail-logo-container">
                         ${seriesInfo.logo_path ? `<img src="${seriesInfo.logo_path}" />` : ""}
                     </div>
                     
                     ${!seriesInfo.logo_path ? `<h1 class="series-detail-title">${seriesInfo.name || "Unknown Series"}</h1>` : ""}
                    
                    <div class="series-detail-meta">
                         <span class="series-detail-season-count">${sortedSeasons.length} Seasons</span>
                         <span class="series-detail-date">${seriesInfo.releaseDate ? seriesInfo.releaseDate.split("-")[0] : "N/A"}</span>
                         <span class="series-detail-resolution-badge">HD</span>
                    </div>

                     <div class="series-detail-credits">
                        <p><strong>Genre:</strong> ${seriesInfo.genre || "N/A"}</p>
                     </div>

                    <p class="series-detail-description">${seriesInfo.plot || seriesInfo.description || "No description available."}</p>

                    <div class="series-detail-buttons">
                        ${playButtonHtml}
                        <button class="series-detail-fav-button gradient-btn" tabindex="0">
                            <span class="heart-icon">${heartIconHtml}</span>
                        </button>
                         ${seasonBtnHtml}
                    </div>

                 </div>

                 <!-- Episodes List -->
                 <div class="series-episodes-container">
                    <div class="seasons-header">
                        <h2 id="current-season-display-title">Season ${selectedSeason}</h2>
                        <span class="episodes-label">Episodes</span>
                    </div>
                    
                    <div class="series-detail-cast">
                        <!-- Episodes injected here -->
                    </div>
                </div>
            </div>
        </div>
        `;
  };

  setTimeout(() => {
    renderEpisodes();
    rebuildFocusable();

    const isReturning =
      localStorage.getItem("isReturningFromPlayer") === "true";
    const lastEpId = localStorage.getItem("lastPlayedEpisodeId");

    if (isReturning && lastEpId) {
      localStorage.removeItem("isReturningFromPlayer");
      const epEl = document.querySelector(
        `.seasons-episodes-item[data-episode-id="${lastEpId}"]`,
      );
      if (epEl) {
        setFocus(epEl);
        const loader = document.getElementById("series-detail-loader");
        if (loader) loader.remove();
        return;
      }
    }

    localStorage.removeItem("isReturningFromPlayer");

    const firstBtn = document.querySelector(".series-detail-play-button");
    if (firstBtn) setFocus(firstBtn);

    const loader = document.getElementById("series-detail-loader");
    if (loader) loader.remove();
  }, 500);

  return renderSeriesDetailPage();
}
