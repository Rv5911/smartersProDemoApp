let moviesNavigationState = {
  currentCategoryIndex: 0,
  currentCardIndex: 0,
  lastFocusedCategory: 0,
  lastFocusedCard: 0,
  isHeartFocused: false,
  focus: "categories", // 'carousel', 'watchNow', 'categories'
  justTransitioned: false, // Flag to prevent immediate jump after navbar transition
};

let allMoviesStreamsData = window.allMoviesStreams || [];
let favoriteMoviesIds = [];
const unlockedMovieAdultIds = new Set();

const isMovieAdult = (name) => {
  const normalized = (name || "").trim().toLowerCase();
  const configured = window.adultsCategories || [];
  if (configured.includes(normalized)) return true;
  return /(adult|xxx|18\+|18\s*plus|sex|porn|nsfw)/i.test(normalized);
};

window.resetMoviesParentalState = () => {
  unlockedMovieAdultIds.clear();
};

let isMoviesNavigationInitialized = false;

let moviesChunkLoadingState = {
  loadedCategories: 0,
  categoryChunkSize: 4,
  loadedChunks: {},
  horizontalChunkSize: 12,
  isLoading: false,
};

let moviesEnterKeyState = {
  isPressed: false,
  pressStartTime: 0,
  longPressThreshold: 400,
  timeoutId: null,
};

let moviesNavigationDebounce = {
  lastKeyPress: 0,
  debounceTime: 300,
  isDebouncing: false,
};
window.moviesNavigationDebounce = moviesNavigationDebounce;

// Optimized Focus Tracking
let currentFocusedMovieElement = null;
let moviesContainerElement = null;
let navRootElement = null;

// Fast class removal helper
function clearMoviesFocusFast(className) {
  const elements = document.getElementsByClassName(className);
  while (elements.length > 0) {
    elements[0].classList.remove(className);
  }
}

function normalizeText(s) {
  return (s || "").toLowerCase();
}

function deduplicateStreamsByName(streams) {
  const seen = new Set();
  return (streams || []).filter((s) => {
    const name = (s && s.name ? s.name : "").toLowerCase().trim();
    if (!name) return true; // Keep if no name to avoid accidental data loss, though usually they have names
    if (seen.has(name)) return false;
    seen.add(name);
    return true;
  });
}

function getMoviesSearchQuery() {
  return normalizeText(window.searchQuery || "");
}

function filterStreamsByQuery(streams) {
  const q = getMoviesSearchQuery();
  if (!q) return streams;
  return (streams || []).filter((s) => normalizeText(s && s.name).includes(q));
}

function formatMovieData(movieStream) {
  if (!movieStream) return null;

  // Safely get category_name with fallback
  const categoryName = movieStream.category_name || "Movie";

  return {
    id: movieStream.stream_id || movieStream.num,
    stream_id: movieStream.stream_id,
    title: movieStream.name || "Unknown",
    genre: categoryName,
    year: formatMovieYear(movieStream.added),
    image: movieStream.stream_icon || "./assets/demo-img-card.png",
    duration: formatMovieDuration(movieStream),
    rating: movieStream.rating_5based ? movieStream.rating_5based : "0",
    category_id: movieStream.category_id ? movieStream.category_id : null,
  };
}

function formatMovieYear(timestamp) {
  if (!timestamp) return "Unknown";
  try {
    return new Date(Number(timestamp) * 1000).getFullYear().toString();
  } catch (e) {
    return "Unknown";
  }
}

function formatMovieDuration(movie) {
  return "2h 0m";
}

function getFavoriteMovies() {
  try {
    const username = getCurrentPlaylistUsername();
    if (!username) return [];

    const playlists = getPlaylistsData();
    const playlist = playlists.find((p) => p.playlistName === username);

    if (playlist && playlist.movies) {
      return playlist.movies.map((id) => id.toString());
    }

    return [];
  } catch (e) {
    console.error("Error getting favorite movies:", e);
    return [];
  }
}

function getRecentlyWatchedMovies() {
  try {
    let username = window.getCurrentPlaylistUsername
      ? window.getCurrentPlaylistUsername()
      : null;
    if (!username) return [];

    let playlists = window.getPlaylistsData ? window.getPlaylistsData() : [];
    for (let i = 0; i < playlists.length; i++) {
      if (playlists[i].playlistUsername === username) {
        let recent = playlists[i].continueWatchingMovies || [];
        return recent
          .slice(0, 15)
          .map(formatMovieData)
          .filter((m) => m !== null);
      }
    }
    return [];
  } catch (e) {
    return [];
  }
}

function getPopularMovies() {
  try {
    if (allMoviesStreamsData.length === 0) return [];

    let sorted = allMoviesStreamsData.slice(0, 50);
    sorted.sort(function (a, b) {
      return (
        (parseFloat(b.rating_5based) || 0) - (parseFloat(a.rating_5based) || 0)
      );
    });

    return deduplicateStreamsByName(sorted)
      .slice(0, 30)
      .map(formatMovieData)
      .filter((m) => m !== null);
  } catch (e) {
    return [];
  }
}

function getAPICategories(sortType = "default") {
  let allMoviesCategoriesData = window.moviesCategories || [];
  let allMoviesStreamsData = window.allMoviesStreams || [];

  if (
    allMoviesCategoriesData.length === 0 ||
    allMoviesStreamsData.length === 0
  ) {
    return [];
  }

  let categories = [];
  for (let i = 0; i < allMoviesCategoriesData.length; i++) {
    let category = allMoviesCategoriesData[i];
    if (!category) continue;

    let movies = [];

    for (let j = 0; j < allMoviesStreamsData.length; j++) {
      let stream = allMoviesStreamsData[j];
      if (!stream) continue;

      if (stream.category_id == category.category_id) {
        movies.push(stream);
      }
    }
    movies = deduplicateStreamsByName(filterStreamsByQuery(movies)).slice(
      0,
      50,
    );

    categories.push({
      title: category.category_name
        ? category.category_name.replace(/[*]/g, "")
        : "Category",
      movies: movies,
      id: category.category_id,
      containerClass: "movies-category-container",
      category_id: category.category_id,
    });
  }

  // Apply sorting based on selected sort option
  return sortMovieCategories(categories, sortType);
}

function sortMovieCategories(categories, sortType) {
  if (!categories || categories.length === 0) return categories;

  // Separate categories into two groups: alphabetic and non-alphabetic
  let alphabeticCategories = [];
  let nonAlphabeticCategories = [];

  for (let i = 0; i < categories.length; i++) {
    let category = categories[i];
    let firstChar = category.title.charAt(0);

    // Check if first character is a letter (A-Z, a-z)
    if (/^[A-Za-z]$/.test(firstChar)) {
      alphabeticCategories.push(category);
    } else {
      nonAlphabeticCategories.push(category);
    }
  }

  // Sort based on selected sort option
  switch (sortType) {
    case "a-z":
      // A-Z: Alphabetic A-Z first, then non-alphabetic A-Z
      alphabeticCategories.sort((a, b) =>
        (a.title || "")
          .toLowerCase()
          .localeCompare((b.title || "").toLowerCase()),
      );
      nonAlphabeticCategories.sort((a, b) =>
        (a.title || "")
          .toLowerCase()
          .localeCompare((b.title || "").toLowerCase()),
      );
      return alphabeticCategories.concat(nonAlphabeticCategories);

    case "z-a":
      // Z-A: Alphabetic Z-A first, then non-alphabetic Z-A
      alphabeticCategories.sort((a, b) =>
        (b.title || "")
          .toLowerCase()
          .localeCompare((a.title || "").toLowerCase()),
      );
      nonAlphabeticCategories.sort((a, b) =>
        (b.title || "")
          .toLowerCase()
          .localeCompare((a.title || "").toLowerCase()),
      );
      return alphabeticCategories.concat(nonAlphabeticCategories);

    case "recently-added":
      // Recently Added - sort by category_id descending (assuming higher IDs are newer)
      return categories.sort(
        (a, b) => (b.category_id || 0) - (a.category_id || 0),
      );

    case "top-rated":
      // Top Rated - sort by average rating of movies in category
      return categories.sort((a, b) => {
        const avgRatingA =
          a.movies && a.movies.length > 0
            ? a.movies.reduce(
                (sum, movie) => sum + (parseFloat(movie.rating_5based) || 0),
                0,
              ) / a.movies.length
            : 0;
        const avgRatingB =
          b.movies && b.movies.length > 0
            ? b.movies.reduce(
                (sum, movie) => sum + (parseFloat(movie.rating_5based) || 0),
                0,
              ) / b.movies.length
            : 0;
        return avgRatingB - avgRatingA;
      });

    case "default":
    default:
      // Default - return as is (no sorting)
      return categories;
  }
}

function createMovieCard(movieData, size, categoryIndex, movieIndex) {
  if (!movieData) return ""; // Add safety check

  let isLarge = size === "large";
  let cardClass = isLarge ? "movie-card movie-card-large" : "movie-card";
  let movieId = String(movieData.stream_id || movieData.id);

  let isMovieFav =
    Array.isArray(favoriteMoviesIds) &&
    favoriteMoviesIds.some((favId) => String(favId) === String(movieId));

  let imageUrl = movieData.image || "./assets/demo-img-card.png";
  let titleClass = "movie-title-marquee";

  // Safely get category name
  let currentCardCategory = window.moviesCategories
    ? window.moviesCategories.filter(
        (cat) => cat.category_id == movieData.category_id,
      )
    : [];

  let categoryName =
    currentCardCategory.length > 0
      ? currentCardCategory[0].category_name
      : movieData.genre || "Movie"; // Use genre as fallback

  const isAdult = isMovieAdult(movieData.genre) || isMovieAdult(categoryName);
  const currentPlaylist = getCurrentPlaylist();
  const hasParentalPassword =
    currentPlaylist && currentPlaylist.parentalPassword;
  const isLocked = isAdult && !unlockedMovieAdultIds.has(String(movieId));

  let overlayHtml = "";
  if (isLocked) {
    if (hasParentalPassword) {
      overlayHtml = `<div class="adult-overlay"><i class="fas fa-lock card-lock-icon"></i></div>`;
    } else {
      overlayHtml = `<div class="adult-overlay"></div>`;
    }
  }

  return `<div class="${cardClass}" 
            data-category="${categoryIndex}" 
            data-index="${movieIndex}" 
            data-stream-id="${movieId}" 
            data-is-adult="${isAdult}"
            data-is-locked="${isLocked}"
            data-image-url="${imageUrl}">
            <div class="movie-card-inner" style="background-image: url('${
              imageUrl ? imageUrl : "./assets/placeholder-img.png"
            }')">
                <img src="${imageUrl}" style="display: none;" onerror="this.parentElement.style.backgroundImage = 'url(./assets/placeholder-img.png)'" />
                ${overlayHtml}
                <div class="movie-card-rating">
                <i class="fas fa-star"></i>
                    ${movieData.rating ? movieData.rating : "0"}
                </div>
                <div class="movie-card-play-div">
                    <img src="./assets/card-play-icon.png" alt="Play" loading="lazy" class="movie-card-play" />
                </div>
            </div>
            <div class="movie-card-text">
                <h2 class="${titleClass}">${movieData.title || "Unknown"}</h2>
            </div>
            <div class="movie-card-heart-button">
                <i class="${
                  isMovieFav ? "fas" : "far"
                } fa-heart movie-card-heart" style="color: ${
                  isMovieFav ? "#ff4d4d" : "white"
                }; opacity: ${isMovieFav ? "1" : "0.6"};"></i>
            </div>
        </div>`;
}

function createMoviesLoadingIndicator(categoryIndex) {
  return (
    '<div class="movies-loading-indicator" data-category="' +
    categoryIndex +
    '">' +
    "<p>Loading...</p>" +
    "</div>"
  );
}

function getMoviesLoadedChunkCount(categoryIndex) {
  return moviesChunkLoadingState.loadedChunks[categoryIndex] || 0;
}

function setMoviesLoadedChunkCount(categoryIndex, count) {
  ``;
  moviesChunkLoadingState.loadedChunks[categoryIndex] = count;
}

function loadMoviesChunk(category, categoryIndex) {
  if (!category || !category.movies || category.movies.length === 0) return "";

  let loadedCount = getMoviesLoadedChunkCount(categoryIndex);
  let chunkSize = moviesChunkLoadingState.horizontalChunkSize;
  let totalMovies = category.movies.length;

  if (loadedCount >= totalMovies) return "";

  let endIndex = Math.min(loadedCount + chunkSize, totalMovies);
  let cardsHTML = "";

  for (let i = loadedCount; i < endIndex; i++) {
    let movieStream = category.movies[i];
    if (!movieStream) continue; // Skip if movie stream is undefined

    let movieData = formatMovieData(movieStream);
    if (!movieData) continue;

    let size = category.id === "popular" ? "normal" : "normal";
    cardsHTML += createMovieCard(movieData, size, categoryIndex, i);
  }

  setMoviesLoadedChunkCount(categoryIndex, endIndex);
  return cardsHTML;
}

function moviesCategoryHasMovies(categoryIndex) {
  let categories = window.allMoviesCategories || [];
  let category = categories[categoryIndex];

  if (!category) {
    return false;
  }

  let cardList = document.querySelector(
    '.movies-card-list[data-category="' + categoryIndex + '"]',
  );
  if (!cardList) {
    return false;
  }

  let cardsInDOM = cardList.querySelectorAll(".movie-card");
  if (cardsInDOM.length > 0) {
    return true;
  }

  // Fallback: check the data structure
  if (!category.movies || category.movies.length === 0) {
    return false;
  }

  // Logic changed: If we have data in the model, the category IS valid.
  // We shouldn't rely on loadedCount or DOM status for navigation validation,
  // otherwise we skip categories that are valid but effectively "loading".
  return true;
}

function findNextMoviesCategoryWithMovies(startIndex, direction) {
  let allCategories = window.allMoviesCategories || [];

  if (direction === 1) {
    for (let i = startIndex; i < allCategories.length; i++) {
      if (moviesCategoryHasMovies(i)) {
        return i;
      }
    }
  } else {
    for (let i = startIndex; i >= 0; i--) {
      if (moviesCategoryHasMovies(i)) {
        return i;
      }
    }
  }

  return -1;
}

function loadMoreMoviesCategories() {
  if (moviesChunkLoadingState.isLoading) return;

  let allCategories = window.allMoviesCategories || [];
  let currentLoaded = moviesChunkLoadingState.loadedCategories;

  // If searching and no remaining categories have items, remove any indicator and stop
  const remainingHasItems = allCategories
    .slice(currentLoaded)
    .some(function (cat) {
      return cat && cat.movies && cat.movies.length > 0;
    });
  if (!remainingHasItems) {
    let container = document.querySelector(".movies-page-container");
    if (container) {
      let categoriesLoading = container.querySelector(
        ".categories-loading-indicator",
      );
      if (categoriesLoading) categoriesLoading.remove();
    }
    moviesChunkLoadingState.isLoading = false;
    return;
  }

  if (currentLoaded >= allCategories.length) {
    let container = document.querySelector(".movies-page-container");
    if (container) {
      let categoriesLoading = container.querySelector(
        ".categories-loading-indicator",
      );
      if (categoriesLoading) {
        categoriesLoading.remove();
      }
    }
    return;
  }

  moviesChunkLoadingState.isLoading = true;

  // 🔴 UX Improvement: Show loader immediately
  let containerForLoader = document.querySelector(".movies-page-container");
  if (containerForLoader) {
    let existing = containerForLoader.querySelector(
      ".categories-loading-indicator",
    );
    if (!existing) {
      containerForLoader.insertAdjacentHTML(
        "beforeend",
        '<div class="categories-loading-indicator"><div class="custom-loader-spinner small"></div></div>',
      );
    }
  }

  let nextChunk = Math.min(
    currentLoaded + moviesChunkLoadingState.categoryChunkSize,
    allCategories.length,
  );

  let safetyTimeout = setTimeout(function () {
    if (moviesChunkLoadingState.isLoading) {
      console.warn(
        "loadMoreMoviesCategories: Safety timeout triggered, resetting loading state",
      );
      moviesChunkLoadingState.isLoading = false;
      let container = document.querySelector(".movies-page-container");
      if (container) {
        let categoriesLoading = container.querySelector(
          ".categories-loading-indicator",
        );
        if (categoriesLoading) {
          categoriesLoading.remove();
        }
      }
    }
  }, 5000);

  setTimeout(function () {
    try {
      let container = document.querySelector(".movies-page-container");
      if (!container) {
        clearTimeout(safetyTimeout);
        moviesChunkLoadingState.isLoading = false;
        return;
      }

      let categoriesLoading = container.querySelector(
        ".categories-loading-indicator",
      );
      if (categoriesLoading) {
        categoriesLoading.remove();
      }

      let categoriesAdded = 0;
      for (let i = currentLoaded; i < nextChunk; i++) {
        let category = allCategories[i];
        if (!category) continue;

        if (category.movies && category.movies.length > 0) {
          try {
            let categoryHTML = createMoviesCategorySection(category, i);
            container.insertAdjacentHTML("beforeend", categoryHTML);
            categoriesAdded++;
          } catch (e) {
            console.error("Error creating movies category section:", e);
          }
        }
      }

      let hasMoreCategories = false;
      for (let i = nextChunk; i < allCategories.length; i++) {
        let category = allCategories[i];
        if (category && category.movies && category.movies.length > 0) {
          hasMoreCategories = true;
          break;
        }
      }

      // Show "No results found" if no more categories are available
      if (!hasMoreCategories && categoriesAdded === 0) {
        container.insertAdjacentHTML(
          "beforeend",
          '<div class="no-more-categories"><p>No results found</p></div>',
        );
      }

      moviesChunkLoadingState.loadedCategories = nextChunk;
      clearTimeout(safetyTimeout);
      moviesChunkLoadingState.isLoading = false;

      if (categoriesAdded > 0) {
        updateMoviesFocus();
      }
    } catch (e) {
      console.error("Error in loadMoreMoviesCategories:", e);
      clearTimeout(safetyTimeout);
      moviesChunkLoadingState.isLoading = false;

      let container = document.querySelector(".movies-page-container");
      if (container) {
        let categoriesLoading = container.querySelector(
          ".categories-loading-indicator",
        );
        if (categoriesLoading) {
          categoriesLoading.remove();
        }
      }
    }
  }, 50);
}

function createMoviesCategorySection(category, categoryIndex) {
  let size = category.id === "popular" ? "large" : "normal";
  const isEmptyFav =
    category.id === "fav" && (!category.movies || category.movies.length === 0);

  let html =
    '<div class="' +
    category.containerClass +
    (isEmptyFav ? " empty-fav" : "") +
    '" style="' +
    (isEmptyFav ? "display: none;" : "") +
    '">';
  html += "<h1>" + category.title + "</h1>";
  html +=
    '<div class="movies-card-list ' +
    category.id +
    '-list" data-category="' +
    categoryIndex +
    '">';

  let initialMovies = loadMoviesChunk(category, categoryIndex);
  html += initialMovies;

  html += "</div>";
  html += "</div>";

  return html;
}

function createMoviesNoDataMessage(categoryTitle) {
  return (
    '<div class="no-data-container">' +
    '<div class="no-data-content">' +
    "<h2>No Data Available</h2>" +
    "<p>No " +
    categoryTitle +
    " found</p>" +
    "</div>" +
    "</div>"
  );
}

function createMoviesNoSearchMessage() {
  return (
    '<div class="no-data-container">' +
    '<div class="no-data-content">' +
    "<h2>No Search Results Found</h2>" +
    "</div>" +
    "</div>"
  );
}

function handleMoviesEnterKey(e) {
  let currentPage = localStorage.getItem("currentPage");
  let navigationFocus = localStorage.getItem("navigationFocus");
  if (currentPage !== "moviesPage" || navigationFocus !== "moviesPage") {
    return;
  }

  if (e.key === "Enter") {
    e.preventDefault();

    if (e.type === "keydown") {
      moviesEnterKeyState.isPressed = true;
      moviesEnterKeyState.pressStartTime = Date.now();

      moviesEnterKeyState.timeoutId = setTimeout(function () {
        if (moviesEnterKeyState.isPressed) {
          handleMoviesLongPressEnter();
          moviesEnterKeyState.isPressed = false;
        }
      }, moviesEnterKeyState.longPressThreshold);
    } else if (e.type === "keyup") {
      if (moviesEnterKeyState.isPressed) {
        let pressDuration = Date.now() - moviesEnterKeyState.pressStartTime;

        if (pressDuration < moviesEnterKeyState.longPressThreshold) {
          clearTimeout(moviesEnterKeyState.timeoutId);
          handleMoviesSimpleEnter();
        }

        moviesEnterKeyState.isPressed = false;
      }
    }
  }
}

function handleMoviesSimpleEnter() {
  if (moviesNavigationState.focus === "watchNow") {
    const activeEl = document.activeElement;
    const streamId = activeEl ? activeEl.getAttribute("data-stream-id") : null;

    const data = (window.homeCarouselSliderData || []).find(
      (d) =>
        d &&
        d.movie_data &&
        String(d.movie_data.stream_id || d.movie_data.series_id) ===
          String(streamId),
    );

    if (!data || !data.movie_data) return;

    const playlist = JSON.parse(
      localStorage.getItem("currentPlaylistData") || "{}",
    );
    const url = playlist.server_info
      ? `${playlist.server_info.server_protocol}://${playlist.server_info.url}:${playlist.server_info.port}/movie/${playlist.user_info.username}/${playlist.user_info.password}/${data.movie_data.stream_id}.${data.movie_data.container_extension}`
      : "";

    localStorage.setItem("playingItemData", JSON.stringify(data.movie_data));
    localStorage.setItem("selectedVideoItemUrl", url);
    localStorage.setItem("selectedMovieId", data.movie_data.stream_id);
    localStorage.setItem("from", "movie");
    localStorage.setItem("fromHome", "true");
    localStorage.setItem("currentPage", "videojsPlayer");

    Router.showPage("videoJsPlayer");
    if (document.querySelector("#navbar-root"))
      document.querySelector("#navbar-root").style.display = "none";
    cleanupMoviesNavigation();
    return;
  }

  if (moviesNavigationState.focus === "moreInfo") {
    const activeEl = document.activeElement;
    const streamId = activeEl ? activeEl.getAttribute("data-stream-id") : null;

    const data = (window.homeCarouselSliderData || []).find(
      (d) =>
        d &&
        d.movie_data &&
        String(d.movie_data.stream_id || d.movie_data.series_id) ===
          String(streamId),
    );

    if (!data || !data.movie_data) return;

    const result = toggleFavoriteItem(
      data.movie_data,
      "favouriteMovies",
      getCurrentPlaylistUsername(),
    );

    // Invalidate Carousel Cache
    const cacheKey = "homeCarouselCachedSliderData_movie";
    if (window[cacheKey]) delete window[cacheKey];

    // Update ALL cards heart display on CURRENT page
    updateAllMovieCardsHeartDisplay(streamId, result.isFav);

    // Show toast
    if (typeof Toaster !== "undefined" && Toaster.showToast) {
      Toaster.showToast(
        result.isFav ? "success" : "error",
        result.isFav ? "Added to Favorites" : "Removed from Favorites",
      );
    }

    // Update the heart icon in the carousel (for all slides matching this ID)
    document
      .querySelectorAll(`.carousel-fav-btn[data-stream-id="${streamId}"] i`)
      .forEach((icon) => {
        icon.className = result.isFav ? "fas fa-heart" : "far fa-heart";
        icon.style.color = result.isFav ? "#ff4d4d" : "white";
        icon.style.opacity = result.isFav ? "1" : "0.6";
      });

    // Cross-page Sync: Notify other pages
    const syncItem = {
      ...data.movie_data,
      type: "movie",
    };

    // Update current page
    updateMyFavCategoryRealtime(streamId, result.isFav, 0, 0);

    // Update HomePage if registered
    if (window.updateHomePageFavorites) {
      window.updateHomePageFavorites(syncItem, result.isFav);
    }
    if (window.updateAllHomeCardsHeartDisplay) {
      window.updateAllHomeCardsHeartDisplay(streamId, "movie", result.isFav);
    }

    // Update SeriesPage if registered
    if (window.updateSeriesPageFavorites) {
      window.updateSeriesPageFavorites(streamId, result.isFav);
    }
    if (window.updateAllSeriesCardsHeartDisplay) {
      window.updateAllSeriesCardsHeartDisplay(streamId, result.isFav);
    }

    return;
  }

  if (moviesNavigationState.isHeartFocused) {
    handleMoviesLongPressEnter();
    return;
  }

  if (!moviesCategoryHasMovies(moviesNavigationState.currentCategoryIndex)) {
    return;
  }

  let categoryIndex = moviesNavigationState.currentCategoryIndex;
  let cardIndex = moviesNavigationState.currentCardIndex;

  let currentCard = document.querySelector(
    '.movie-card[data-category="' +
      categoryIndex +
      '"][data-index="' +
      cardIndex +
      '"]',
  );

  if (currentCard) {
    let streamId = currentCard.getAttribute("data-stream-id");

    const isAdult = currentCard.getAttribute("data-is-adult") === "true";
    const isLocked = currentCard.getAttribute("data-is-locked") === "true";
    const currentPlaylist = getCurrentPlaylist();
    const hasParentalPassword =
      currentPlaylist && currentPlaylist.parentalPassword;

    if (isAdult && isLocked) {
      if (hasParentalPassword) {
        ParentalPinDialog(
          () => {
            unlockedMovieAdultIds.add(String(streamId));
            const overlay = currentCard.querySelector(".adult-overlay");
            if (overlay) overlay.remove();
            currentCard.setAttribute("data-is-locked", "false");
            proceedToMovieDetail(categoryIndex, cardIndex, streamId);
          },
          () => {
            // Stay on page
          },
          currentPlaylist,
          "moviesPage",
        );
        return;
      } else {
        proceedToMovieDetail(categoryIndex, cardIndex, streamId);
        return;
      }
    }

    proceedToMovieDetail(categoryIndex, cardIndex, streamId);
  }
}

function proceedToMovieDetail(categoryIndex, cardIndex, streamId) {
  let isContinueWatchingMovie = false;
  localStorage.setItem("moviesCategoryIndex", categoryIndex);
  localStorage.setItem("moviesCardIndex", cardIndex);
  localStorage.setItem("moviesSelectedCategoryId", categoryIndex);

  localStorage.setItem("selectedMovieId", streamId);
  const currentPlaylist = getCurrentPlaylist();
  const allRecentlyWatchedMovies = currentPlaylist.continueWatchingMovies;
  if (allRecentlyWatchedMovies && Array.isArray(allRecentlyWatchedMovies)) {
    isContinueWatchingMovie = allRecentlyWatchedMovies.some(
      (movie) => movie && movie.itemId == streamId,
    );
  }

  localStorage.setItem(
    "isContinueWatchingMovie",
    isContinueWatchingMovie.toString(),
  );

  buildDynamicSidebarOptions();

  const selectedMovieItem = window.allMoviesStreams.find(
    (item) => item.stream_id == streamId,
  );
  if (selectedMovieItem) {
    localStorage.setItem(
      "selectedMovieData",
      JSON.stringify(selectedMovieItem),
    );
  }

  saveMoviesNavigationState(); // Save state before navigating

  cleanupMoviesNavigation();

  localStorage.setItem("currentPage", "movieDetailPage");
  localStorage.setItem("navigationFocus", "movieDetailPage");

  Router.showPage("movieDetailPage");
}

function handleMoviesLongPressEnter() {
  if (!moviesCategoryHasMovies(moviesNavigationState.currentCategoryIndex)) {
    return;
  }

  let categoryIndex = moviesNavigationState.currentCategoryIndex;
  let cardIndex = moviesNavigationState.currentCardIndex;

  let currentCard = document.querySelector(
    '.movie-card[data-category="' +
      categoryIndex +
      '"][data-index="' +
      cardIndex +
      '"]',
  );

  if (currentCard) {
    let streamId = currentCard.getAttribute("data-stream-id");

    // FIX: Capture visual position relative to viewport BEFORE any changes
    const rectBefore = currentCard.getBoundingClientRect();
    const topBefore = rectBefore.top;

    const moviesContainer = document.querySelector(".movies-page-container");

    const movieObj = (window.allMoviesStreams || []).find(
      (m) => String(m.stream_id) === String(streamId),
    );

    // Toggle favorite
    const result = toggleFavoriteItem(
      movieObj || {
        stream_id: streamId,
      },
      "favouriteMovies",
      getCurrentPlaylistUsername(),
    );

    // Update ALL cards across ALL categories with the same stream_id
    updateAllMovieCardsHeartDisplay(streamId, result.isFav);

    // Show toast
    if (typeof Toaster !== "undefined" && Toaster.showToast) {
      Toaster.showToast(
        result.isFav ? "success" : "error",
        result.isFav ? "Added to Favorites" : "Removed from Favorites",
      );
    }

    // Update My Fav category in real-time
    updateMyFavCategoryRealtime(
      streamId,
      result.isFav,
      categoryIndex,
      cardIndex,
    );

    // Cross-page Sync: Notify other pages
    const syncItem = {
      ...(movieObj || {
        stream_id: streamId,
      }),
      type: "movie",
    };

    if (window.updateHomePageFavorites) {
      window.updateHomePageFavorites(syncItem, result.isFav);
    }
    if (window.updateAllHomeCardsHeartDisplay) {
      window.updateAllHomeCardsHeartDisplay(streamId, "movie", result.isFav);
    }
    if (window.updateSeriesPageFavorites) {
      window.updateSeriesPageFavorites(streamId, result.isFav);
    }
    if (window.updateAllSeriesCardsHeartDisplay) {
      window.updateAllSeriesCardsHeartDisplay(streamId, result.isFav);
    }

    // FIX: Restore visual position relative to viewport AFTER changes
    // We do this immediately if possible, but also ensure focus is kept
    if (moviesContainer) {
      const rectAfter = currentCard.getBoundingClientRect();
      const topAfter = rectAfter.top;
      const diff = topAfter - topBefore;

      if (diff !== 0) {
        moviesContainer.scrollTop += diff;
      }
    }

    // Maintain focus on the same card position
    setTimeout(() => {
      // Re-check position in case of async layout shifts, though we try to do it synchronously above
      if (moviesContainer) {
        const rectAfterAsync = currentCard.getBoundingClientRect();
        const topAfterAsync = rectAfterAsync.top;
        const diffAsync = topAfterAsync - topBefore;

        // Only adjust if there's still a significant specific deviation that implies a layout shift happened async
        // A small threshold might be needed, but usually exact diff works.
        // However, if we already fixed it, diffAsync should be 0 (or close to 0 if user scrolled, which we shouldn't fight).
        // For now, let's trust the synchronous fix above for majority of cases,
        // but re-focusing might scroll it into view, so we just focus.
      }
      updateMoviesFocus();
    }, 50);

    saveMoviesNavigationState();
  }
}

function updateAllMovieCardsHeartDisplay(streamId, isFav) {
  // Update heart icon on ALL cards with this stream_id across all categories
  document
    .querySelectorAll('.movie-card[data-stream-id="' + streamId + '"]')
    .forEach(function (card) {
      const heartEl = card.querySelector(".movie-card-heart");
      if (heartEl) {
        if (isFav) {
          heartEl.classList.remove("far");
          heartEl.classList.add("fas");
          heartEl.style.color = "#ff4d4d";
          heartEl.style.opacity = "1";
        } else {
          heartEl.classList.remove("fas");
          heartEl.classList.add("far");
          heartEl.style.color = "white";
          heartEl.style.opacity = "0.6";
        }
      }
    });
}

function updateMyFavCategoryRealtime(
  streamId,
  isFav,
  currentCategoryIndex,
  currentCardIndex,
) {
  const currentPlaylist = getCurrentPlaylist();
  const favIdsRaw = currentPlaylist
    ? currentPlaylist.favouriteMovies || []
    : [];
  const favIds = Array.isArray(favIdsRaw)
    ? favIdsRaw.map((id) => String(id))
    : [];
  favoriteMoviesIds = favIds;

  const favouriteMovies =
    window.allMoviesStreams && favIds.length
      ? window.allMoviesStreams.filter(
          (m) => m && favIds.includes(String(m.stream_id)),
        )
      : [];

  const isSearchMode = !!getMoviesSearchQuery();
  let favList = document.querySelector(".movies-card-list.fav-list");
  let favContainer = document.querySelector(".movies-fav-container");

  if (!favList || !favContainer) {
    if (isFav) {
      createMyFavCategory();
      favList = document.querySelector(".movies-card-list.fav-list");
      favContainer = document.querySelector(".movies-fav-container");
      if (!favList || !favContainer) return;
    } else {
      return;
    }
  }

  const favCategoryIndex = 0; // Fixed index
  const isCurrentlyInFavCategory = currentCategoryIndex === favCategoryIndex;

  if (isFav) {
    // Show container if it was hidden
    favContainer.style.display = "block";
    favContainer.classList.remove("empty-fav");

    // Adding to favorites - append new card to My Fav
    const newMovie = window.allMoviesStreams.find(
      (m) => m && String(m.stream_id) === String(streamId),
    );
    if (newMovie) {
      const movieData = formatMovieData(newMovie);
      if (movieData) {
        const currentCards = favList.querySelectorAll(".movie-card");
        const newIndex = currentCards.length;
        const cardHTML = createMovieCard(
          movieData,
          "normal",
          favCategoryIndex,
          newIndex,
        );
        favList.insertAdjacentHTML("beforeend", cardHTML);

        setMoviesLoadedChunkCount(favCategoryIndex, currentCards.length + 1);

        if (window.allMoviesCategories && window.allMoviesCategories[0]) {
          if (!window.allMoviesCategories[0].movies)
            window.allMoviesCategories[0].movies = [];
          const exists = window.allMoviesCategories[0].movies.some(
            (m) => String(m.stream_id) === String(streamId),
          );
          if (!exists) window.allMoviesCategories[0].movies.push(newMovie);
        }
      }
    }
  } else {
    // Removing from favorites
    const cardToRemove = favList.querySelector(
      '.movie-card[data-stream-id="' + streamId + '"]',
    );

    if (cardToRemove) {
      cardToRemove.remove();

      const remainingCards = favList.querySelectorAll(".movie-card");
      remainingCards.forEach((card, index) => {
        card.setAttribute("data-index", index);
      });

      setMoviesLoadedChunkCount(favCategoryIndex, remainingCards.length);

      if (window.allMoviesCategories && window.allMoviesCategories[0]) {
        window.allMoviesCategories[0].movies = favouriteMovies;
      }

      if (remainingCards.length === 0) {
        favContainer.style.display = "none";
        favContainer.classList.add("empty-fav");

        if (isCurrentlyInFavCategory) {
          // Move focus to next category
          moveMoviesDown();
        }
      } else if (isCurrentlyInFavCategory) {
        moviesNavigationState.currentCardIndex = Math.min(
          currentCardIndex,
          remainingCards.length - 1,
        );
        updateMoviesFocus();
      }
    }
  }
}

function createMyFavCategory() {
  const pageContainer = document.querySelector(".movies-page-container");
  if (!pageContainer) return;

  // Check if My Fav already exists
  const existingFav = document.querySelector(".movies-fav-container");
  if (existingFav) return;

  // FIX: Removed scroll capture from here, handled in caller

  // Create My Fav category at the top (index 0)
  const favCategory = {
    title: "My Fav",
    movies: [], // Will be populated by adding cards
    id: "fav",
    containerClass: "movies-fav-container",
  };

  // Create the HTML structure for My Fav category
  let html = '<div class="' + favCategory.containerClass + '">';
  html += "<h1>" + favCategory.title + "</h1>";
  html += '<div class="movies-card-list fav-list" data-category="0">';
  html += "</div>";
  html += "</div>";

  // Insert at the beginning of the page
  pageContainer.insertAdjacentHTML("afterbegin", html);

  // Shift all chunk loading states by 1 index
  const oldChunks = {
    ...moviesChunkLoadingState.loadedChunks,
  };
  moviesChunkLoadingState.loadedChunks = {};
  moviesChunkLoadingState.loadedChunks[0] = 0; // My Fav starts with 0 loaded

  Object.keys(oldChunks).forEach((key) => {
    const oldIndex = parseInt(key, 10);
    const newIndex = oldIndex + 1;
    moviesChunkLoadingState.loadedChunks[newIndex] = oldChunks[key];
  });

  // Update all existing category indices (shift them by 1)
  const allCategoryLists = pageContainer.querySelectorAll(
    ".movies-card-list:not(.fav-list)",
  );
  allCategoryLists.forEach((list) => {
    const currentIndex = parseInt(list.getAttribute("data-category"), 10);
    const newIndex = currentIndex + 1;
    list.setAttribute("data-category", newIndex);

    // Update all cards in this category
    const cards = list.querySelectorAll(".movie-card");
    cards.forEach((card) => {
      card.setAttribute("data-category", newIndex);
    });

    // Update loading indicators if any
    const loadingIndicator = list.querySelector(".movies-loading-indicator");
    if (loadingIndicator) {
      loadingIndicator.setAttribute("data-category", newIndex);
    }
  });

  // Adjust current navigation state
  moviesNavigationState.currentCategoryIndex += 1;
  moviesNavigationState.lastFocusedCategory += 1;

  // Update window.allMoviesCategories to include My Fav at index 0
  if (window.allMoviesCategories && window.allMoviesCategories.length > 0) {
    // Check if My Fav already exists in the array
    const favIndex = window.allMoviesCategories.findIndex(
      (cat) => cat.id === "fav",
    );
    if (favIndex === -1) {
      // My Fav doesn't exist, add it at the beginning
      window.allMoviesCategories.unshift(favCategory);
    } else if (favIndex !== 0) {
      // My Fav exists but not at index 0, move it
      const favCat = window.allMoviesCategories.splice(favIndex, 1)[0];
      window.allMoviesCategories.unshift(favCat);
    }
  }

  // Increment loaded categories count
  moviesChunkLoadingState.loadedCategories += 1;

  // FIX: Removed scroll restoration from here
}

function removeMyFavCategory() {
  const favContainer = document.querySelector(".movies-fav-container");
  if (!favContainer) return;

  const pageContainer = document.querySelector(".movies-page-container");
  if (!pageContainer) return;

  // Remove My Fav container
  favContainer.remove();

  // Shift all chunk loading states back by 1 index
  const oldChunks = {
    ...moviesChunkLoadingState.loadedChunks,
  };
  moviesChunkLoadingState.loadedChunks = {};

  Object.keys(oldChunks).forEach((key) => {
    const oldIndex = parseInt(key, 10);
    if (oldIndex === 0) return; // Skip My Fav (index 0)
    const newIndex = oldIndex - 1;
    moviesChunkLoadingState.loadedChunks[newIndex] = oldChunks[key];
  });

  // Update all category indices (shift them back by 1)
  const allCategoryLists = pageContainer.querySelectorAll(".movies-card-list");
  allCategoryLists.forEach((list) => {
    const currentIndex = parseInt(list.getAttribute("data-category"), 10);
    const newIndex = currentIndex - 1;
    list.setAttribute("data-category", newIndex);

    // Update all cards in this category
    const cards = list.querySelectorAll(".movie-card");
    cards.forEach((card) => {
      card.setAttribute("data-category", newIndex);
    });

    // Update loading indicators if any
    const loadingIndicator = list.querySelector(".movies-loading-indicator");
    if (loadingIndicator) {
      loadingIndicator.setAttribute("data-category", newIndex);
    }
  });

  // Adjust navigation state (shift back by 1)
  if (moviesNavigationState.currentCategoryIndex > 0) {
    moviesNavigationState.currentCategoryIndex -= 1;
  }
  if (moviesNavigationState.lastFocusedCategory > 0) {
    moviesNavigationState.lastFocusedCategory -= 1;
  }

  // Remove from window.allMoviesCategories
  if (window.allMoviesCategories && window.allMoviesCategories.length > 0) {
    const favIndex = window.allMoviesCategories.findIndex(
      (cat) => cat.id === "fav",
    );
    if (favIndex !== -1) {
      window.allMoviesCategories.splice(favIndex, 1);
    }
  }

  // Decrement loaded categories count
  if (moviesChunkLoadingState.loadedCategories > 0) {
    moviesChunkLoadingState.loadedCategories -= 1;
  }

  // FIX: Removed scroll restoration from here
}

function refreshMoviesFavoritesList() {
  const currentPlaylist = getCurrentPlaylist();
  const favIdsRaw = currentPlaylist
    ? currentPlaylist.favouriteMovies || []
    : [];
  const favIds = Array.isArray(favIdsRaw)
    ? favIdsRaw.map((id) => String(id))
    : [];
  favoriteMoviesIds = favIds; // Update global favorite IDs

  // This function now only updates favoriteMoviesIds
  // All UI updates are handled by updateMyFavCategoryRealtime()
}

function handleMoviesKeyNavigation(e) {
  // Check if sidebar is open
  const sidebar = document.getElementById("sidebar");
  if (sidebar && !sidebar.classList.contains("option-remove")) {
    return;
  }

  let currentPage = localStorage.getItem("currentPage");
  let navigationFocus = localStorage.getItem("navigationFocus");

  if (currentPage !== "moviesPage" || navigationFocus !== "moviesPage") {
    return;
  }
  if (
    e &&
    e.target &&
    (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
  ) {
    return;
  }

  if (e.key === "Enter") {
    handleMoviesEnterKey(e);
    return;
  }

  const now = Date.now();
  if (
    now - moviesNavigationDebounce.lastKeyPress <
    moviesNavigationDebounce.debounceTime
  ) {
    e.preventDefault();
    return;
  }

  e.preventDefault();

  moviesNavigationDebounce.lastKeyPress = now;

  switch (e.key) {
    case "ArrowRight":
      moveMoviesRight();
      break;
    case "ArrowLeft":
      moveMoviesLeft();
      break;
    case "ArrowDown":
      moveMoviesDown();
      break;
    case "ArrowUp":
      moveMoviesUp();
      break;
    case "Escape":
    case "Back":
    case "BrowserBack":
    case "XF86Back":
    case "SoftLeft":
    case "Backspace":
    case 10009:
      moviesNavigationState.currentCategoryIndex = 0;
      moviesNavigationState.currentCardIndex = 0;

      const moviesContainer = document.querySelector(".movies-page-container");
      if (moviesContainer) {
        moviesContainer.scrollTop = 0;
      }

      const navbarEl = document.querySelector("#navbar-root");
      if (navbarEl) {
        navbarEl.style.display = "block";
      }
      break;
  }

  updateMoviesFocus();
  saveMoviesNavigationState();
}

function cleanupMoviesNavigation() {
  document.removeEventListener("keydown", handleMoviesKeyNavigation);
  document.removeEventListener("keyup", handleMoviesKeyNavigation);

  if (window.moviesCarouselSlideChangeHandler) {
    window.removeEventListener(
      "carousel-slide-changed",
      window.moviesCarouselSlideChangeHandler,
    );
    window.moviesCarouselSlideChangeHandler = null;
  }

  isMoviesNavigationInitialized = false;
  moviesNavigationDebounce.lastKeyPress = 0;
  moviesNavigationDebounce.isDebouncing = false;

  // Clear any pending timeouts
  if (moviesEnterKeyState.timeoutId) {
    clearTimeout(moviesEnterKeyState.timeoutId);
    moviesEnterKeyState.timeoutId = null;
  }
  moviesEnterKeyState.isPressed = false;
}

function getMoviesCurrentVisibleIndex(categoryIndex, cardIndex) {
  let cardList = document.querySelector(
    '.movies-card-list[data-category="' + categoryIndex + '"]',
  );
  if (!cardList) return 0;

  let containerWidth = cardList.offsetWidth;
  let firstCard = cardList.querySelector(".movie-card");
  if (!firstCard) return 0;

  let cardWidth = firstCard.offsetWidth + 16;
  let visibleCardsCount = Math.floor(containerWidth / cardWidth);

  // Clamp to last visible card index
  if (cardIndex >= visibleCardsCount) {
    return visibleCardsCount - 1;
  }

  return cardIndex;
}

function moveMoviesRight() {
  if (moviesNavigationState.focus === "watchNow") {
    moviesNavigationState.focus = "moreInfo";
    updateMoviesFocus();
    return;
  }

  if (moviesNavigationState.focus !== "categories") return;

  if (!moviesCategoryHasMovies(moviesNavigationState.currentCategoryIndex)) {
    return;
  }

  let currentCategory = getCurrentMoviesCategory();
  if (!currentCategory) return;

  let loadedCount = getMoviesLoadedChunkCount(
    moviesNavigationState.currentCategoryIndex,
  );
  let totalMovies = currentCategory.movies ? currentCategory.movies.length : 0;

  if (moviesNavigationState.currentCardIndex < loadedCount - 1) {
    moviesNavigationState.currentCardIndex++;
    moviesNavigationState.isHeartFocused = false; // Reset heart focus on horizontal move
    updateMoviesFocus();

    // Pre-fetch: triggered when we are close to the end (e.g., 2 items away)
    // This ensures the next chunk is loading/loaded BEFORE the user hits the edge.
    if (
      loadedCount < totalMovies &&
      moviesNavigationState.currentCardIndex >= loadedCount - 2
    ) {
      loadMoreMoviesForCategory(moviesNavigationState.currentCategoryIndex);
    }
  } else {
    if (loadedCount < totalMovies) {
      loadMoreMoviesForCategory(moviesNavigationState.currentCategoryIndex);
    }
  }

  moviesNavigationState.lastFocusedCategory =
    moviesNavigationState.currentCategoryIndex;
  moviesNavigationState.lastFocusedCard =
    moviesNavigationState.currentCardIndex;
}

function moveMoviesLeft() {
  if (moviesNavigationState.focus === "moreInfo") {
    moviesNavigationState.focus = "watchNow";
    updateMoviesFocus();
    return;
  }

  if (moviesNavigationState.focus !== "categories") return;

  if (!moviesCategoryHasMovies(moviesNavigationState.currentCategoryIndex)) {
    return;
  }

  if (moviesNavigationState.currentCardIndex > 0) {
    moviesNavigationState.currentCardIndex--;
    moviesNavigationState.isHeartFocused = false; // Reset heart focus on horizontal move
    updateMoviesFocus();
  } else {
    // Already at index 0, stay here (don't move to navbar/sidebar)
  }

  moviesNavigationState.lastFocusedCategory =
    moviesNavigationState.currentCategoryIndex;
  moviesNavigationState.lastFocusedCard =
    moviesNavigationState.currentCardIndex;
}

function moveMoviesDown() {
  // When on carousel (arrows), first move to Watch Now button
  if (moviesNavigationState.focus === "carousel") {
    moviesNavigationState.focus = "watchNow";
    updateMoviesFocus();
    return;
  }

  // When on Watch Now or More Info buttons, move to categories (cards)
  if (
    moviesNavigationState.focus === "watchNow" ||
    moviesNavigationState.focus === "moreInfo"
  ) {
    // Prevent immediate jump from navbar
    if (moviesNavigationState.justTransitioned) {
      moviesNavigationState.justTransitioned = false;
      return;
    }
    const firstCategoryIdx = findNextMoviesCategoryWithMovies(0, 1);
    if (firstCategoryIdx !== -1) {
      if (window.HomeCarousel && window.HomeCarousel.cleanup) {
        window.HomeCarousel.cleanup();
      }
      moviesNavigationState.focus = "categories";
      moviesNavigationState.currentCategoryIndex = firstCategoryIdx;
      moviesNavigationState.currentCardIndex = 0;
      moviesNavigationState.isHeartFocused = false;
      updateMoviesFocus();
    }
    return;
  }

  // Hierarchical navigation: Card -> Heart -> Next Row
  if (!moviesNavigationState.isHeartFocused) {
    moviesNavigationState.isHeartFocused = true;
    updateMoviesFocus();
    return;
  }
  moviesNavigationState.isHeartFocused = false;

  let allCategories = window.allMoviesCategories || [];
  if (allCategories.length === 0) return;

  let currentIndex = moviesNavigationState.currentCategoryIndex;
  let currentCardIndex = moviesNavigationState.currentCardIndex;

  let nextCategoryIndex = findNextMoviesCategoryWithMovies(currentIndex + 1, 1);

  if (nextCategoryIndex > 2) {
    const navbarEl = document.querySelector("#navbar-root");
    if (navbarEl) {
      navbarEl.style.display = "none";
    }
  }

  if (nextCategoryIndex !== -1) {
    moviesNavigationState.currentCategoryIndex = nextCategoryIndex;

    let newCategory = getCurrentMoviesCategory();
    if (newCategory) {
      let loadedCount = getMoviesLoadedChunkCount(
        moviesNavigationState.currentCategoryIndex,
      );

      let visiblePosition = getMoviesCurrentVisibleIndex(
        currentIndex,
        currentCardIndex,
      );
      moviesNavigationState.currentCardIndex =
        loadedCount > 0 ? Math.min(visiblePosition, loadedCount - 1) : 0;
    } else {
      moviesNavigationState.currentCardIndex = 0;
    }

    let loadedCategoriesCount = moviesChunkLoadingState.loadedCategories;
    if (
      moviesNavigationState.currentCategoryIndex >=
      loadedCategoriesCount - 2
    ) {
      loadMoreMoviesCategories();
    }
  } else {
    // Try to load more categories if we are at the bottom
    loadMoreMoviesCategories();
  }
}

function moveMoviesUp() {
  // Hierarchical navigation back: Heart -> Card -> Prev Row
  if (
    moviesNavigationState.focus === "watchNow" ||
    moviesNavigationState.focus === "moreInfo" ||
    moviesNavigationState.focus === "carousel"
  ) {
    // Move focus from buttons/carousel directly to Navbar
    // First, ensure navbar is visible
    const navbarEl = document.querySelector("#navbar-root");
    if (navbarEl) {
      navbarEl.style.display = "block";
    }

    try {
      const moviesContainer = document.querySelector(".movies-page-container");
      if (moviesContainer) moviesContainer.scrollTop = 0;
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (e) {}

    removeAllMoviesFocus();
    saveMoviesNavigationState();
    localStorage.setItem("navigationFocus", "navbar");

    setTimeout(() => {
      // Re-ensure visibility in case something hid it
      const navbarElCheck = document.querySelector("#navbar-root");
      if (navbarElCheck) {
        navbarElCheck.style.display = "block";
      }

      const moviesNavItem = document.querySelector(
        '.nav-item[data-page="moviesPage"]',
      );
      if (moviesNavItem) {
        moviesNavItem.focus();
        moviesNavItem.classList.add("active");
      }
    }, 50);
    return;
  }

  if (moviesNavigationState.isHeartFocused) {
    moviesNavigationState.isHeartFocused = false;
    updateMoviesFocus();
    return;
  }

  let currentIndex = moviesNavigationState.currentCategoryIndex;
  let currentCardIndex = moviesNavigationState.currentCardIndex;

  let prevCategoryIndex = findNextMoviesCategoryWithMovies(
    currentIndex - 1,
    -1,
  );

  if (prevCategoryIndex !== -1) {
    moviesNavigationState.currentCategoryIndex = prevCategoryIndex;

    let newCategory = getCurrentMoviesCategory();
    if (newCategory) {
      let loadedCount = getMoviesLoadedChunkCount(
        moviesNavigationState.currentCategoryIndex,
      );

      let visiblePosition = getMoviesCurrentVisibleIndex(
        currentIndex,
        currentCardIndex,
      );
      moviesNavigationState.currentCardIndex =
        loadedCount > 0 ? Math.min(visiblePosition, loadedCount - 1) : 0;
    } else {
      moviesNavigationState.currentCardIndex = 0;
    }
    updateMoviesFocus();
  } else {
    // Move to banner or navbar
    if (getMoviesSearchQuery()) {
      // If searching, skip carousel and go straight to navbar
      const navbarEl = document.querySelector("#navbar-root");
      if (navbarEl) {
        navbarEl.style.display = "block";
      }
      try {
        const moviesContainer = document.querySelector(
          ".movies-page-container",
        );
        if (moviesContainer) moviesContainer.scrollTop = 0;
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      } catch (e) {}

      removeAllMoviesFocus();
      saveMoviesNavigationState();
      localStorage.setItem("navigationFocus", "navbar");

      setTimeout(() => {
        const navbarElCheck = document.querySelector("#navbar-root");
        if (navbarElCheck) {
          navbarElCheck.style.display = "block";
        }
        const moviesNavItem = document.querySelector(
          '.nav-item[data-page="moviesPage"]',
        );
        if (moviesNavItem) {
          moviesNavItem.focus();
          moviesNavItem.classList.add("active");
        }
      }, 50);
    } else {
      // Normal behavior: Move to banner
      moviesNavigationState.focus = "watchNow";
      moviesNavigationState.isHeartFocused = false;

      // Ensure container is scrolled up to see the banner
      const container = document.querySelector(".movies-page-container");
      if (container) container.scrollTop = 0;

      updateMoviesFocus();
    }
  }
}

function loadMoreMoviesForCategory(categoryIndex) {
  if (moviesChunkLoadingState.isLoading) return;

  let categories = window.allMoviesCategories || [];
  if (categoryIndex < 0 || categoryIndex >= categories.length) return;

  let category = categories[categoryIndex];
  if (!category) return;

  let loadedCount = getMoviesLoadedChunkCount(categoryIndex);
  let totalMovies = category.movies ? category.movies.length : 0;

  if (loadedCount >= totalMovies) {
    let cardList = document.querySelector(
      '.movies-card-list[data-category="' + categoryIndex + '"]',
    );
    if (cardList) {
      let loadingEl = cardList.querySelector(".movies-loading-indicator");
      if (loadingEl) {
        loadingEl.remove();
      }
    }
    return;
  }

  moviesChunkLoadingState.isLoading = true;

  // 🔴 UX Improvement: Show loader immediately
  let cardListForLoader = document.querySelector(
    '.movies-card-list[data-category="' + categoryIndex + '"]',
  );
  if (cardListForLoader) {
    let existing = cardListForLoader.querySelector(".movies-loading-indicator");
    if (!existing) {
      cardListForLoader.insertAdjacentHTML(
        "beforeend",
        createMoviesLoadingIndicator(categoryIndex),
      );
    }
  }

  // Unified Loader Logic:
  // 1. We already added the loader in the "UX Improvement" block above if needed.
  // 2. We just ensure we have the cardList reference for the async operation.
  let cardList = document.querySelector(
    '.movies-card-list[data-category="' + categoryIndex + '"]',
  );
  if (!cardList) {
    moviesChunkLoadingState.isLoading = false;
    return;
  }

  // Ensure one loader exists (double check)
  let existingLoading = cardList.querySelector(".movies-loading-indicator");
  if (!existingLoading) {
    cardList.insertAdjacentHTML(
      "beforeend",
      createMoviesLoadingIndicator(categoryIndex),
    );
  }

  let safetyTimeout = setTimeout(function () {
    if (moviesChunkLoadingState.isLoading) {
      console.warn(
        "loadMoreMoviesForCategory: Safety timeout triggered, resetting loading state",
      );
      moviesChunkLoadingState.isLoading = false;
      let cardList = document.querySelector(
        '.movies-card-list[data-category="' + categoryIndex + '"]',
      );
      if (cardList) {
        let loadingEl = cardList.querySelector(".movies-loading-indicator");
        if (loadingEl) {
          loadingEl.remove();
        }
      }
    }
  }, 3000);

  setTimeout(function () {
    try {
      let cardList = document.querySelector(
        '.movies-card-list[data-category="' + categoryIndex + '"]',
      );
      if (!cardList) {
        clearTimeout(safetyTimeout);
        moviesChunkLoadingState.isLoading = false;
        return;
      }

      let newCardsHTML = loadMoviesChunk(category, categoryIndex);

      let loadingEl = cardList.querySelector(".movies-loading-indicator");
      if (loadingEl) {
        loadingEl.remove();
      }

      if (newCardsHTML) {
        cardList.insertAdjacentHTML("beforeend", newCardsHTML);

        if (moviesNavigationState.currentCategoryIndex === categoryIndex) {
          updateMoviesFocus();
        }
      }

      clearTimeout(safetyTimeout);
      moviesChunkLoadingState.isLoading = false;
    } catch (e) {
      console.error("Error in loadMoreMoviesForCategory:", e);
      clearTimeout(safetyTimeout);
      moviesChunkLoadingState.isLoading = false;

      let cardList = document.querySelector(
        '.movies-card-list[data-category="' + categoryIndex + '"]',
      );
      if (cardList) {
        let loadingEl = cardList.querySelector(".movies-loading-indicator");
        if (loadingEl) {
          loadingEl.remove();
        }
      }
    }
  }, 30);
}

function removeAllMoviesFocus() {
  clearMoviesFocusFast("focused");
  clearMoviesFocusFast("marquee-active");
  currentFocusedMovieElement = null;
}

function updateMoviesFocus() {
  if (localStorage.getItem("navigationFocus") === "moviesPage") {
    const container = document.querySelector(".movies-page-container");
    if (!container) return;

    if (
      moviesNavigationState.focus === "watchNow" ||
      moviesNavigationState.focus === "moreInfo"
    ) {
      // Get the active index from the carousel slides container's data attribute
      const slidesContainer = container.querySelector(".carousel-slides");
      let activeIndex = 0;

      if (
        slidesContainer &&
        slidesContainer.dataset.activeIndex !== undefined
      ) {
        activeIndex = parseInt(slidesContainer.dataset.activeIndex) || 0;
      } else if (window.carouselActiveIndex !== undefined) {
        activeIndex = window.carouselActiveIndex || 0;
      }

      // Find the currently active/visible slide
      const activeSlide = container.querySelector(
        `.slide[data-index="${activeIndex}"]`,
      );

      const btnClass =
        moviesNavigationState.focus === "watchNow"
          ? ".carousel-watch-now-btn"
          : ".carousel-fav-btn";

      let btn = null;

      if (activeSlide) {
        btn = activeSlide.querySelector(btnClass);
      }

      // Fallback: find the first visible slide if activeSlide not found
      if (!btn) {
        const allSlides = container.querySelectorAll(".slide");
        for (let slide of allSlides) {
          const testBtn = slide.querySelector(btnClass);
          if (testBtn && slide.classList.contains("active")) {
            btn = testBtn;
            break;
          }
        }
      }

      // Final fallback: just get the first button of the type
      if (!btn) {
        btn = container.querySelector(btnClass);
      }

      if (btn) {
        clearMoviesFocusFast("focused");
        btn.classList.add("focused");
        btn.focus({
          preventScroll: true,
        });
        try {
          container.scrollTop = 0;
        } catch (e) {}
      }
      return;
    }

    if (moviesNavigationState.focus === "carousel") {
      clearMoviesFocusFast("focused");
      try {
        container.scrollTop = 0;
      } catch (e) {}
      return;
    }

    if (moviesCategoryHasMovies(moviesNavigationState.currentCategoryIndex)) {
      const container = document.querySelector(".movies-page-container");
      const currentCard = container
        ? container.querySelector(
            '.movie-card[data-category="' +
              moviesNavigationState.currentCategoryIndex +
              '"][data-index="' +
              moviesNavigationState.currentCardIndex +
              '"]',
          )
        : null;

      if (currentCard) {
        // Fast class management
        if (
          currentFocusedMovieElement &&
          currentFocusedMovieElement !== currentCard
        ) {
          currentFocusedMovieElement.classList.remove("focused");
          const oldTitle = currentFocusedMovieElement.querySelector(
            ".movie-title-marquee",
          );
          if (oldTitle) oldTitle.classList.remove("marquee-active");

          // Reset heart button state on previous card
          const oldHeart = currentFocusedMovieElement.querySelector(
            ".movie-card-heart-button",
          );
          if (oldHeart) oldHeart.classList.remove("heart-focused");
        }

        currentCard.classList.add("focused");
        currentFocusedMovieElement = currentCard;
        scrollToMoviesElement(currentCard);

        // Show navbar when focused on first category (any card in category 0)
        if (!navRootElement) {
          navRootElement = document.querySelector("#navbar-root");
        }
        if (navRootElement) {
          navRootElement.style.display =
            moviesNavigationState.currentCategoryIndex === 0 ? "block" : "none";
        }

        moviesNavigationState.lastFocusedCategory =
          moviesNavigationState.currentCategoryIndex;
        moviesNavigationState.lastFocusedCard =
          moviesNavigationState.currentCardIndex;

        // Handle Heart Button focus
        const heartBtn = currentCard.querySelector(".movie-card-heart-button");
        if (heartBtn) {
          if (moviesNavigationState.isHeartFocused) {
            heartBtn.classList.add("heart-focused");
          } else {
            heartBtn.classList.remove("heart-focused");
          }
        }

        activateMoviesMarquee(currentCard);
      }
    }
  }
}

function activateMoviesMarquee(card) {
  if (!card) return;

  // Use requestAnimationFrame to separate layout read from the navigation event loop.
  // This allows the focus to move INSTANTLY, and the marquee calculation helps 1 frame later.
  requestAnimationFrame(() => {
    // Critical Optimization: If the user has already moved away (rapid scrolling),
    // DO NOT measure layout. This saves massive CPU on Tizen.
    if (!card.classList.contains("focused")) return;

    const titleElement = card.querySelector(".movie-title-marquee");
    if (!titleElement) return;
    const container = titleElement.parentElement;
    if (!container) return;

    // Reset marquee attributes first (prevents stale duplicates/durations)
    titleElement.classList.remove("marquee-active");
    titleElement.removeAttribute("data-marquee");
    titleElement.style.removeProperty("--duration");

    // Compare actual widths
    if (titleElement.scrollWidth > container.offsetWidth) {
      // Duplicate-text marquee (seamless loop) + slower pace
      titleElement.setAttribute("data-marquee", titleElement.textContent || "");
      const pxPerSecond = 70; // lower = slower
      const durationSeconds = Math.max(
        10,
        Math.round(titleElement.scrollWidth / pxPerSecond),
      );
      titleElement.style.setProperty("--duration", `${durationSeconds}s`);
      titleElement.classList.add("marquee-active");
    }
  });
}

function scrollToMoviesElement(element) {
  if (!element) return;

  try {
    document.body.scrollTop = 30;
    // Fix for "cut off" cards: Add scroll margin to account for scaling (focus zoom)
    // This ensures 'nearest' alignment leaves enough space for the glow/scale.
    element.style.scrollMargin = "40px";

    element.scrollIntoView({
      block: "center",
      inline: "nearest",
    });
  } catch (e) {
    try {
      element.style.scrollMargin = "40px";
      element.scrollIntoView({
        block: "center",
        inline: "nearest",
      });
    } catch (finalError) {
      try {
        element.scrollIntoView();
      } catch (error) {
        console.log("Movies scroll failed");
      }
    }
  }
}

function saveMoviesNavigationState() {
  try {
    localStorage.setItem(
      "moviesNavState",
      JSON.stringify({
        currentCategoryIndex: moviesNavigationState.currentCategoryIndex,
        currentCardIndex: moviesNavigationState.currentCardIndex,
        lastFocusedCategory: moviesNavigationState.lastFocusedCategory,
        lastFocusedCard: moviesNavigationState.lastFocusedCard,
      }),
    );
  } catch (e) {
    console.log("Error saving movies navigation state:", e);
  }
}

function restoreMoviesNavigationState() {
  try {
    let saved = localStorage.getItem("moviesNavState");
    if (saved) {
      let state = JSON.parse(saved);
      moviesNavigationState.currentCategoryIndex =
        state.currentCategoryIndex || 0;
      moviesNavigationState.currentCardIndex = state.currentCardIndex || 0;
      moviesNavigationState.lastFocusedCategory =
        state.lastFocusedCategory || 0;
      moviesNavigationState.lastFocusedCard = state.lastFocusedCard || 0;

      // Loader is already present from the main page render if we are restoring state.
      // No need to add a new one.

      setTimeout(() => {
        validateAndAdjustRestoredMoviesState();
      }, 100);
    }
  } catch (e) {
    console.log("Error restoring movies navigation state:", e);
    // Ensure loader is removed if restoration fails
    const loader = document.getElementById("movies-page-loader");
    if (loader) loader.remove();
  }
}

function doesMoviesCardExist(categoryIndex, cardIndex) {
  let cardList = document.querySelector(
    '.movies-card-list[data-category="' + categoryIndex + '"]',
  );
  if (!cardList) return false;

  let card = cardList.querySelector(
    '.movie-card[data-index="' + cardIndex + '"]',
  );
  return card !== null;
}

function validateAndAdjustRestoredMoviesState() {
  let targetCategoryIndex = moviesNavigationState.currentCategoryIndex;
  let targetCardIndex = moviesNavigationState.currentCardIndex;
  let allCategories = window.allMoviesCategories || [];

  // 1. Ensure Category is Loaded
  if (!moviesCategoryHasMovies(targetCategoryIndex)) {
    if (targetCategoryIndex < allCategories.length) {
      let container = document.querySelector(".movies-page-container");
      if (container) {
        let currentLoaded = moviesChunkLoadingState.loadedCategories;
        for (let i = currentLoaded; i <= targetCategoryIndex + 2; i++) {
          if (i >= allCategories.length) break;
          let category = allCategories[i];
          if (
            (category.movies && category.movies.length > 0) ||
            category.id === "fav"
          ) {
            let categoryHTML = createMoviesCategorySection(category, i);
            let noResults = container.querySelector(".no-more-categories");
            if (noResults) noResults.remove();

            container.insertAdjacentHTML("beforeend", categoryHTML);
          }
        }
        moviesChunkLoadingState.loadedCategories = Math.max(
          moviesChunkLoadingState.loadedCategories,
          targetCategoryIndex + 3,
        );
      }
    }
  }

  // 2. Ensure Card is Loaded (Horizontal)
  if (moviesCategoryHasMovies(targetCategoryIndex)) {
    let currentCategory = allCategories[targetCategoryIndex];
    let loadedCount = getMoviesLoadedChunkCount(targetCategoryIndex);

    if (targetCardIndex >= loadedCount) {
      let cardList = document.querySelector(
        '.movies-card-list[data-category="' + targetCategoryIndex + '"]',
      );
      if (cardList) {
        while (
          getMoviesLoadedChunkCount(targetCategoryIndex) <= targetCardIndex
        ) {
          let newCardsHTML = loadMoviesChunk(
            currentCategory,
            targetCategoryIndex,
          );
          if (!newCardsHTML) break;

          let loadingEl = cardList.querySelector(".movies-loading-indicator");
          if (loadingEl) loadingEl.remove();
          cardList.insertAdjacentHTML("beforeend", newCardsHTML);
        }
      }
    }
  }

  // 3. Final Validation
  if (!moviesCategoryHasMovies(moviesNavigationState.currentCategoryIndex)) {
    let nextCategoryIndex = findNextMoviesCategoryWithMovies(0, 1);
    if (nextCategoryIndex !== -1) {
      moviesNavigationState.currentCategoryIndex = nextCategoryIndex;
      moviesNavigationState.currentCardIndex = 0;
    } else {
      moviesNavigationState.currentCategoryIndex = 0;
      moviesNavigationState.currentCardIndex = 0;
    }
  } else {
    let currentCategory = getCurrentMoviesCategory();
    if (currentCategory) {
      let loadedCount = getMoviesLoadedChunkCount(
        moviesNavigationState.currentCategoryIndex,
      );

      if (moviesNavigationState.currentCardIndex >= loadedCount) {
        moviesNavigationState.currentCardIndex = Math.max(0, loadedCount - 1);
      }

      if (
        !doesMoviesCardExist(
          moviesNavigationState.currentCategoryIndex,
          moviesNavigationState.currentCardIndex,
        ) &&
        loadedCount < currentCategory.movies.length
      ) {
        loadMoreMoviesForCategory(moviesNavigationState.currentCategoryIndex);
      }
    }
  }

  setTimeout(() => {
    const navFocus = localStorage.getItem("navigationFocus");
    if (navFocus === "moviesPage") {
      updateMoviesFocus();
    }

    // Only remove loader if we successfully focused something (or if we timed out waiting)
    const checkFocusAndRemoveLoader = () => {
      const navFocus = localStorage.getItem("navigationFocus");
      const focusedCard = document.querySelector(".movie-card.focused");
      if (focusedCard || navFocus !== "moviesPage") {
        const loader = document.getElementById("movies-page-loader");
        if (loader) loader.remove();
      } else {
        // Fallback if focus failed for some reason
        setTimeout(() => {
          const loader = document.getElementById("movies-page-loader");
          if (loader) loader.remove();
        }, 200);
      }
    };

    // Give a simpler small delay to ensure rendering
    setTimeout(checkFocusAndRemoveLoader, 100);
  }, 100);
}

function getCurrentMoviesCategory() {
  let categories = window.allMoviesCategories || [];
  return categories[moviesNavigationState.currentCategoryIndex];
}

function initMoviesNavigation() {
  if (isMoviesNavigationInitialized) {
    cleanupMoviesNavigation();
  }

  const handleCarouselSlideChange = (e) => {
    // Only update focus if we're currently focused on carousel buttons
    if (
      moviesNavigationState.focus === "watchNow" ||
      moviesNavigationState.focus === "moreInfo"
    ) {
      updateMoviesFocus();
    }
  };

  // Store the handler so we can remove it later
  window.moviesCarouselSlideChangeHandler = handleCarouselSlideChange;

  document.addEventListener("keydown", handleMoviesKeyNavigation);
  document.addEventListener("keyup", handleMoviesKeyNavigation);
  window.addEventListener("carousel-slide-changed", handleCarouselSlideChange);
  isMoviesNavigationInitialized = true;
}

function hasAnyMoviesCategoryData() {
  let categories = window.allMoviesCategories || [];
  for (let i = 0; i < categories.length; i++) {
    if (categories[i].movies && categories[i].movies.length > 0) {
      return true;
    }
  }
  return false;
}

function validateMoviesData() {
  // Clean up window.allMoviesStreams
  if (window.allMoviesStreams && Array.isArray(window.allMoviesStreams)) {
    window.allMoviesStreams = window.allMoviesStreams.filter(
      (movie) =>
        movie !== null && movie !== undefined && typeof movie === "object",
    );
  }

  // Clean up window.moviesCategories
  if (window.moviesCategories && Array.isArray(window.moviesCategories)) {
    window.moviesCategories = window.moviesCategories.filter(
      (category) =>
        category !== null &&
        category !== undefined &&
        typeof category === "object",
    );
  }
}

function MoviesPage() {
  validateMoviesData();

  // Get current sort option
  const currentSort = localStorage.getItem("sortvalue") || "default";
  window.__moviesLastSortType = currentSort;

  // Check if there's no initial data and return early
  if (
    window.moviesCategories.length == 0 ||
    window.allMoviesStreams.length == 0
  ) {
    let loadingHTML = `
      <div class="movies-page-container">
        <div class="no-data-container">
          <div class="no-data-content">
            <h2>No Data Available</h2>
            <p>No movies found</p>
          </div>
        </div>
      </div>
    `;

    const previousPageVal = localStorage.getItem("currentPage");
    localStorage.setItem("previousPage", previousPageVal || "");
    localStorage.setItem("currentPage", "moviesPage");

    const activeEl = document.activeElement;
    const isSearchFocused = activeEl && activeEl.id === "search-input";

    if (!isSearchFocused) {
      // Fix: Default to 'navbar' focus when entering the page.
      // Only focus content ('moviesPage') if we are returning from the Detail Page.
      if (previousPageVal === "movieDetailPage") {
        localStorage.setItem("navigationFocus", "moviesPage");
      } else {
        localStorage.setItem("navigationFocus", "navbar");
        // Ensure physical focus is on the navbar link
        setTimeout(() => {
          const navLink = document.querySelector(
            '.nav-item[data-page="moviesPage"]',
          );
          if (navLink) navLink.focus();
        }, 50);
      }
    }

    return loadingHTML;
  }

  let loadingHTML =
    '<div id="movies-page-loader" class="custom-page-loader">' +
    '<div class="custom-loader-content">' +
    '<div class="custom-loader-spinner"></div>' +
    "</div>" +
    "</div>";

  localStorage.setItem(
    "previousPage",
    localStorage.getItem("currentPage") || "",
  );
  localStorage.setItem("currentPage", "moviesPage");
  const activeEl = document.activeElement;
  const isSearchFocused = activeEl && activeEl.id === "search-input";
  const navFocus = localStorage.getItem("navigationFocus");
  if (!isSearchFocused && navFocus !== "sidebar") {
    localStorage.setItem("navigationFocus", "moviesPage");
  }

  favoriteMoviesIds = [];

  setTimeout(async function () {
    const currentPlaylist = getCurrentPlaylist();
    const currentPlaylistFavIds = currentPlaylist
      ? currentPlaylist.favouriteMovies
      : [];

    favoriteMoviesIds = currentPlaylistFavIds || [];

    let favouriteMovies =
      window.allMoviesStreams && currentPlaylistFavIds
        ? filterStreamsByQuery(
            window.allMoviesStreams.filter(
              (m) => m && currentPlaylistFavIds.includes(m.stream_id),
            ),
          )
        : [];

    let popularMovies = window.allMoviesStreams
      ? filterStreamsByQuery(
          window.allMoviesStreams.filter((m) => m && m.rating_5based > 4),
        ).slice(0, 10)
      : [];

    let recentlyWatchedMoviesIds =
      currentPlaylist && currentPlaylist.continueWatchingMovies
        ? currentPlaylist.continueWatchingMovies
            .filter((m) => m !== null && m !== undefined)
            .map((item) => item.itemId)
        : [];

    let recentMoviesArray =
      window.allMoviesStreams && recentlyWatchedMoviesIds
        ? filterStreamsByQuery(
            window.allMoviesStreams.filter((m) =>
              recentlyWatchedMoviesIds.includes(m.stream_id.toString()),
            ),
          )
        : [];

    // Pass current sort option to getAPICategories
    let apiCategories = getAPICategories(currentSort);

    // ALWAYS show these three categories at the top, in this specific order
    let fixedTopCategories = [
      {
        title: "My Fav",
        movies: favouriteMovies,
        id: "fav",
        containerClass: "movies-fav-container",
      },
      {
        title: "Popular Movies",
        movies: popularMovies,
        id: "popular",
        containerClass: "movies-popular-container",
      },
      {
        title: "Recently Watched",
        movies: recentMoviesArray,
        id: "recent",
        containerClass: "recently-watched-container",
      },
    ];

    // Remove any fixed categories that have no movies (except My Fav which can be empty)
    let initialCategories = fixedTopCategories.filter((category) => {
      if (category.id === "fav") return true; // Always show My Fav even if empty to keep indices stable
      return category.movies && category.movies.length > 0;
    });

    // Add the first few API categories after the fixed ones
    let apiCategoriesToLoad = apiCategories.slice(0, 3);
    initialCategories = initialCategories.concat(apiCategoriesToLoad);

    // Set up the complete categories list (fixed top + all API categories)
    window.allMoviesCategories = initialCategories.concat(
      apiCategories.slice(3),
    );

    moviesChunkLoadingState.loadedCategories = initialCategories.length;
    moviesChunkLoadingState.loadedChunks = {};
    moviesChunkLoadingState.isLoading = false;

    const carouselHtml = getMoviesSearchQuery()
      ? ""
      : await HomeCarousel("movie");

    let html = '<div class="movies-page-container">';
    if (carouselHtml) {
      html += `<div class="home-poster">${carouselHtml}</div>`;
    }

    for (let i = 0; i < initialCategories.length; i++) {
      let category = initialCategories[i];
      if (
        (category.movies && category.movies.length > 0) ||
        category.id === "fav"
      ) {
        html += createMoviesCategorySection(category, i);
      }
    }

    let hasMoreCategories = false;
    for (
      let i = initialCategories.length;
      i < window.allMoviesCategories.length;
      i++
    ) {
      let category = window.allMoviesCategories[i];
      if (category && category.movies && category.movies.length > 0) {
        hasMoreCategories = true;
        break;
      }
    }

    // Removed loading indicator - categories load quickly enough without it

    html += "</div>";

    let container = document.querySelector("#movies-page-loader");
    const hasSavedState = localStorage.getItem("moviesNavState");

    if (container) {
      if (hasSavedState) {
        // Keep the loader visible while we restore state
        // Insert content BEFORE the loader so loader stays on top
        container.insertAdjacentHTML("beforebegin", html);
      } else {
        // No state to restore, just replace loader with content
        container.outerHTML = html;
      }
    } else {
      // Fallback: append content to page if loader is missing for some reason
      const pageEl = document.getElementById("movies-page");
      if (pageEl) {
        pageEl.insertAdjacentHTML("beforeend", html);
      }
    }

    // Initialize carousel logic now that elements are in the DOM
    if (window.initHomeCarouselLogic) {
      window.initHomeCarouselLogic();
    }

    restoreMoviesNavigationState();

    setTimeout(function () {
      initMoviesNavigation();
    }, 100);
  }, 500);

  return loadingHTML;
}

document.addEventListener("sortChanged", function (e) {
  const { sortType, page } = e.detail;

  if (page === "moviesPage") {
    // Avoid "reload" when dropdown closes or same sort is re-selected
    // (Router.showPage("moviesPage") re-renders the whole page)
    if (window.__moviesLastSortType === sortType) return;
    window.__moviesLastSortType = sortType;

    // Refresh movies page with new sort
    if (typeof window.rerenderMoviesPage === "function") {
      Router.showPage("moviesPage");
    }
  }
});

function focusFirstMoviesCard() {
  // Find first category with movies
  let categories = window.allMoviesCategories || [];
  let foundIndex = -1;
  for (let i = 0; i < categories.length; i++) {
    if (moviesCategoryHasMovies(i)) {
      foundIndex = i;
      break;
    }
  }

  if (foundIndex !== -1) {
    moviesNavigationState.focus = "categories";
    moviesNavigationState.currentCategoryIndex = foundIndex;
    moviesNavigationState.currentCardIndex = 0;
    updateMoviesFocus();
  }
}

window.cleanupMoviesNavigation = cleanupMoviesNavigation;
window.moviesNavigationState = moviesNavigationState;
window.updateMoviesFocus = updateMoviesFocus;
window.saveMoviesNavigationState = saveMoviesNavigationState;
window.rerenderMoviesPage = MoviesPage;
window.focusFirstMoviesCard = focusFirstMoviesCard;
window.updateMoviesPageFavorites = updateMyFavCategoryRealtime;
window.updateAllMovieCardsHeartDisplay = updateAllMovieCardsHeartDisplay;
