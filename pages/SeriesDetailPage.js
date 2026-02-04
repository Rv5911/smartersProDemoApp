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
  let currentFocusIndex = 0;

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

  // Setup Cast Data
  // NOTE: Simplified cast loading; assuming getSeriesCast or existing data is used if needed.
  // For now we initialize empty or load if available.

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
    const seasonKey = 1; // Simplify mapping if necessary, or use real season
    const episodeKey = Number(item.episodeId);
    if (!continueWatchingMap[seasonKey]) continueWatchingMap[seasonKey] = {};
    const progress = item.duration
      ? Math.min(Math.max((item.resumeTime / item.duration) * 100, 0), 100)
      : 0;
    continueWatchingMap[seasonKey][episodeKey] = progress;
  });

  document.removeEventListener("keydown", handleBackNavigationDuringLoading);
  // Loader removal moved to setTimeout below

  const seriesInfo = seriesDetailData.info || {};

  // --- Helper Functions ---

  const toggleNavbar = (show) => {
    const navbar = document.querySelector("#navbar-root");
    if (navbar) {
      navbar.style.display = show ? "flex" : "none";
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00:00";
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
      return `${hours}:${mins < 10 ? "0" : ""}${mins}:${
        secs < 10 ? "0" : ""
      }${secs}`;
    } else {
      return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
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

    // Navbar Visibility Logic
    if (
      el.classList.contains("seasons-episodes-item") ||
      el.classList.contains("season-tab")
    ) {
      toggleNavbar(false);
    } else {
      toggleNavbar(true);
    }

    // Scroll Handling
    const scrollContainer = document.querySelector(
      ".series-detail-page-container",
    );

    if (el.classList.contains("seasons-episodes-item")) {
      if (scrollContainer) {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: smoothScroll ? "smooth" : "auto",
        });
      }

      el.scrollIntoView({
        block: "center",
        inline: "center",
        behavior: smoothScroll ? "smooth" : "auto",
      });
    } else if (el.classList.contains("season-tab")) {
      el.scrollIntoView({
        block: "nearest",
        inline: "center",
        behavior: smoothScroll ? "smooth" : "auto",
      });
    } else if (
      el.classList.contains("series-detail-play-button") ||
      el.classList.contains("series-detail-fav-button")
    ) {
      if (scrollContainer) {
        scrollContainer.scrollTo({
          top: 0,
          behavior: smoothScroll ? "smooth" : "auto",
        });
      }
    } else {
      // Fallback for other elements
      el.scrollIntoView({
        block: "nearest",
        inline: "nearest",
        behavior: smoothScroll ? "smooth" : "auto",
      });
    }
  };

  const rebuildFocusable = () => {
    const topButtons = Array.from(
      document.querySelectorAll(".series-detail-buttons button"),
    );
    const seasonTabs = Array.from(document.querySelectorAll(".season-tab"));
    const episodeItems = Array.from(
      document.querySelectorAll(".seasons-episodes-item"),
    );

    focusableEls = [...topButtons, ...seasonTabs, ...episodeItems];
  };

  const updateSeasonTabsStyles = () => {
    const tabs = document.querySelectorAll(".season-tab");
    tabs.forEach((tab) => {
      const seasonNum = parseInt(tab.dataset.season);
      if (seasonNum === selectedSeason) {
        tab.classList.add("active");
      } else {
        tab.classList.remove("active");
      }
    });
  };

  const renderEpisodes = () => {
    const container = document.querySelector(".series-detail-cast");
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

        return `
               <div class="seasons-episodes-item" tabindex="0" data-episode-index="${j}" data-episode-id="${episode.id}">
                 <div class="episode-image-container">
                    <div class="episode-card-inner" style="background-image: url('${episode.info.movie_image || seriesInfo.cover || "./assets/placeholder-img.png"}')">
                        <div class="play-icon-overlay">
                            <img src="./assets/playicon.png" />
                        </div>
                      
                        
                        <!-- Red Progress Bar at the very bottom -->
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
                 <div class="episode-info-container">
                    <div class="episode-info-row-1">
                        <span class="episode-number-title">${j + 1}. ${episode.title || `Episode ${episode.episode_num}`}</span>
                    </div>
                    <div class="episode-info-divider"></div>
                    <p class="episode-description">${episode.info.plot || episode.plot || seriesInfo.plot || "No description available."}</p>
                 ${getEpisodeDurationInSeconds(episode) > 0 ? `<div class="episode-duration">${formatTime(getEpisodeDurationInSeconds(episode))}</div>` : ""}
                    </div>
                 <!-- Rating outside the image container -->
                 <span class="episode-rating-outside"><i class="fas fa-star"></i>${episode.info.rating_5based || seriesInfo.rating_5based || "N/A"}</span>
               </div>
             `;
      })
      .join("");

    container.innerHTML = episodeHtml; // Episodes are direct children of container now
    rebuildFocusable();
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

    rebuildFocusable();
    const activeEl = document.activeElement;

    // Back Navigation
    if (
      ["Escape", "Back", "BrowserBack", "XF86Back"].includes(e.key) ||
      e.keyCode === 10009
    ) {
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
      activeEl.classList.contains("series-detail-more-info-button") ||
      activeEl.classList.contains("series-detail-fav-button");
    const isSeasonTab = activeEl.classList.contains("season-tab");
    const isEpisode = activeEl.classList.contains("seasons-episodes-item");

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (isTopButton) {
        // alert("isTopButton");
        const activeTab =
          document.querySelector(".season-tab.active") ||
          document.querySelector(".season-tab");
        if (activeTab) setFocus(activeTab);
      } else if (isSeasonTab) {
        // Focus first episode

        const firstEpisode = document.querySelector(".seasons-episodes-item");
        if (firstEpisode) setFocus(firstEpisode);
      }
      // If episode, do nothing (or scroll down if grid)
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (isEpisode) {
        // Focus active season tab
        const activeTab =
          document.querySelector(".season-tab.active") ||
          document.querySelector(".season-tab");
        if (activeTab) setFocus(activeTab);
      } else if (isSeasonTab) {
        // Focus Play button
        const playBtn = document.querySelector(".series-detail-play-button");
        if (playBtn) setFocus(playBtn);
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
      const idx = focusableEls.indexOf(activeEl);
      if (idx !== -1 && idx < focusableEls.length - 1) {
        // Strict section check
        const nextEl = focusableEls[idx + 1];
        if (
          isTopButton &&
          !nextEl.classList.contains("series-detail-play-button") &&
          !nextEl.classList.contains("series-detail-more-info-button") &&
          !nextEl.classList.contains("series-detail-fav-button")
        )
          return;

        if (isSeasonTab && !nextEl.classList.contains("season-tab")) return;

        if (isEpisode && !nextEl.classList.contains("seasons-episodes-item"))
          return;

        setFocus(nextEl);
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const idx = focusableEls.indexOf(activeEl);
      if (idx > 0) {
        const prevEl = focusableEls[idx - 1];
        if (
          isTopButton &&
          !prevEl.classList.contains("series-detail-play-button") &&
          !prevEl.classList.contains("series-detail-more-info-button") &&
          !prevEl.classList.contains("series-detail-fav-button")
        )
          return; // Maybe go to menu?

        if (isSeasonTab && !prevEl.classList.contains("season-tab")) return;

        if (isEpisode && !prevEl.classList.contains("seasons-episodes-item"))
          return;

        setFocus(prevEl);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (isTopButton) {
        if (activeEl.classList.contains("series-detail-play-button")) {
          // Play Logic (simplified default)
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
              updateSeasonTabsStyles();
              renderEpisodes();
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
            icon.style.color = "#ff4d4d"; // Red color in real-time
            icon.style.opacity = result.isFav ? "1" : "0.6";
          }
          Toaster.showToast(
            result.isFav ? "success" : "error",
            result.isFav ? "Added to Favorites" : "Removed from Favorites",
          );
        }
      } else if (isSeasonTab) {
        const seasonNum = parseInt(activeEl.dataset.season);
        if (seasonNum !== selectedSeason) {
          selectedSeason = seasonNum;
          localStorage.setItem("selectedSeason", selectedSeason.toString());
          updateSeasonTabsStyles();
          renderEpisodes();
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

    // Updated heart icon HTML with inline styles for initial state (matching MovieDetailPage)
    var heartIconHtml = `<i class="${isFavorite ? "fa-solid" : "fa-regular"} fa-heart" 
        style="color: ${isFavorite ? "#ff4d4d" : "white"}; opacity: ${isFavorite ? "1" : "0.6"};"></i>`;

    const backdrop =
      seriesInfo.backdrop || seriesInfo.cover || "./assets/placeholder.png";

    // Rating logic
    let originalRating = seriesInfo.rating_5based || 0;
    let normalizedRating = parseFloat(originalRating);
    if (normalizedRating > 5) normalizedRating = normalizedRating / 2; // Assuming 10-base if > 5
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
                         <span class="series-detail-rating-stars">${starsHtml}</span>
                         <span class="series-detail-rating-value">${ratingStr}</span>
                         <span class="series-detail-date">${seriesInfo.releaseDate ? seriesInfo.releaseDate.split("-")[0] : "N/A"}</span>
                         <span class="series-detail-resolution-badge">HD</span>
                    </div>

                     <div class="series-detail-credits">
                        <p><strong>Directed By :</strong> ${seriesInfo.director || "N/A"}</p>
                        <p><strong>Genre :</strong> ${seriesInfo.genre || "N/A"}</p>
                     </div>

                    <p class="series-detail-description">${seriesInfo.plot || seriesInfo.description || "No description available."}</p>

                    <div class="series-detail-buttons">
                        ${playButtonHtml}
                        <!-- More Info button removed -->
                        <button class="series-detail-fav-button gradient-btn" tabindex="0">
                            <span class="heart-icon">${heartIconHtml}</span>
                        </button>
                    </div>
                 </div>

                 <!-- BOTTOM: Tabs & Episodes -->
                 <div class="series-episodes-container">
                    <div class="seasons-tabs-container">
                         ${sortedSeasons
                           .map(
                             (s) => `
                             <button class="season-tab ${s.season === selectedSeason ? "active" : ""}" 
                                     data-season="${s.season}" tabindex="0">
                                 Seasons ${s.season.toString().padStart(2, "0")}
                             </button>
                         `,
                           )
                           .join("")}
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
    updateSeasonTabsStyles();
    rebuildFocusable();

    // Check if we should focus a specific episode (ONLY when returning from video player)
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
        // Remove loader after focus is set
        const loader = document.getElementById("series-detail-loader");
        if (loader) loader.remove();
        return;
      }
    }

    // Always clear the flag
    localStorage.removeItem("isReturningFromPlayer");

    // Default: Focus Play button (for all other navigation scenarios)
    const firstBtn = document.querySelector(".series-detail-play-button");
    if (firstBtn) setFocus(firstBtn);

    // Remove loader after focus is set
    const loader = document.getElementById("series-detail-loader");
    if (loader) loader.remove();
  }, 500);

  return renderSeriesDetailPage();
}
