let seriesNavigationState = {
    currentCategoryIndex: 0,
    currentCardIndex: 0,
    lastFocusedCategory: 0,
    lastFocusedCard: 0,
    focus: "categories", // 'carousel', 'watchNow', 'categories'
    justTransitioned: false, // Flag to prevent immediate jump after navbar transition
};

let allSeriesStreamsData = window.allSeriesStreams || [];
let favoriteSeriesIds = [];
const unlockedSeriesAdultIds = new Set();

const isSeriesAdult = (name) => {
    const normalized = (name || "").trim().toLowerCase();
    const configured = window.adultsCategories || [];
    if (configured.includes(normalized)) return true;
    return /(adult|xxx|18\+|18\s*plus|sex|porn|nsfw)/i.test(normalized);
};

window.resetSeriesParentalState = () => {
    unlockedSeriesAdultIds.clear();
};

let isSeriesNavigationInitialized = false;

let seriesChunkLoadingState = {
    loadedCategories: 0,
    categoryChunkSize: 4,
    loadedChunks: {},
    horizontalChunkSize: 12,
    isLoading: false,
};

let seriesEnterKeyState = {
    isPressed: false,
    pressStartTime: 0,
    longPressThreshold: 400,
    timeoutId: null,
};

let seriesNavigationDebounce = {
    lastKeyPress: 0,
    debounceTime: 300,
    isDebouncing: false,
};

// Optimized Focus Tracking
let currentFocusedSeriesElement = null;
let seriesContainerElement = null;
let seriesNavRootElement = null;

// Fast class removal helper
function clearSeriesFocusFast(className) {
    const elements = document.getElementsByClassName(className);
    while (elements.length > 0) {
        elements[0].classList.remove(className);
    }
}

function normalizeTextSeries(s) {
    return (s || "").toLowerCase();
}

function deduplicateStreamsByName(streams) {
    const seen = new Set();
    return (streams || []).filter((s) => {
        const name = (s && s.name ? s.name : "").toLowerCase().trim();
        if (!name) return true;
        if (seen.has(name)) return false;
        seen.add(name);
        return true;
    });
}

function getSeriesSearchQuery() {
    return normalizeTextSeries(window.searchQuery || "");
}

function filterSeriesByQuery(streams) {
    const q = getSeriesSearchQuery();
    if (!q) return streams;
    return (streams || []).filter((s) =>
        normalizeTextSeries(s && s.name).includes(q),
    );
}

function formatSeriesData(seriesStream) {
    if (!seriesStream) return null;

    // console.log(seriesStream, "seriesStreamseriesStream");

    return {
        id: seriesStream.series_id || seriesStream.num,
        series_id: seriesStream.series_id,
        title: seriesStream.name || "Unknown",
        genre: seriesStream.category_name || "Series",
        year: formatSeriesYear(seriesStream.added),
        image: seriesStream.cover ||
            seriesStream.stream_icon ||
            "./assets/demo-img-card.png",
        rating: seriesStream.rating_5based ? seriesStream.rating_5based : "0",
        seasons: seriesStream.seasons || "1",
        category_id: seriesStream.category_id ? seriesStream.category_id : null,
    };
}

function formatSeriesYear(timestamp) {
    if (!timestamp) return "Unknown";
    try {
        return new Date(Number(timestamp) * 1000).getFullYear().toString();
    } catch (e) {
        return "Unknown";
    }
}

function formatSeriesSeasons(series) {
    return (series.seasons || "1") + " Seasons";
}

function getFavoriteSeries() {
    try {
        const username = getCurrentPlaylistUsername();
        if (!username) return [];

        const playlists = getPlaylistsData();
        const playlist = playlists.find((p) => p.playlistName === username);

        if (playlist && playlist.series) {
            console.log(playlist.series, "PLAYLIST SERIES");
            return playlist.series.map((id) => id.toString());
        }

        return [];
    } catch (e) {
        console.error("Error getting favorite series:", e);
        return [];
    }
}

function getRecentlyWatchedSeries() {
    try {
        let username = window.getCurrentPlaylistUsername ?
            window.getCurrentPlaylistUsername() :
            null;
        if (!username) return [];

        let playlists = window.getPlaylistsData ? window.getPlaylistsData() : [];
        for (let i = 0; i < playlists.length; i++) {
            if (playlists[i].playlistUsername === username) {
                let recent = playlists[i].continueWatchingSeries || [];
                return recent
                    .slice(0, 15)
                    .map(formatSeriesData)
                    .filter((s) => s !== null);
            }
        }
        return [];
    } catch (e) {
        return [];
    }
}

function getPopularSeries() {
    try {
        if (allSeriesStreamsData.length === 0) return [];

        let sorted = allSeriesStreamsData.slice(0, 50);
        console.log(sorted, "SORTED");
        sorted.sort(function(a, b) {
            return (
                (parseFloat(b.rating_5based) || 0) - (parseFloat(a.rating_5based) || 0)
            );
        });

        return deduplicateStreamsByName(sorted)
            .slice(0, 30)
            .map(formatSeriesData)
            .filter((s) => s !== null);
    } catch (e) {
        return [];
    }
}

function getAPISeriesCategories(sortType = "default") {
    let allSeriesCategoriesData = window.allseriesCategories || [];
    let allSeriesStreamsData = window.allSeriesStreams || [];

    if (
        allSeriesCategoriesData.length === 0 ||
        allSeriesStreamsData.length === 0
    ) {
        return [];
    }

    let categories = [];
    for (let i = 0; i < allSeriesCategoriesData.length; i++) {
        let category = allSeriesCategoriesData[i];
        let series = [];

        for (let j = 0; j < allSeriesStreamsData.length; j++) {
            let stream = allSeriesStreamsData[j];
            if (stream.category_id == category.category_id) {
                series.push(stream);
            }
        }
        series = deduplicateStreamsByName(filterSeriesByQuery(series)).slice(0, 50);

        categories.push({
            title: category.category_name || "Category",
            series: series,
            id: category.category_id,
            containerClass: "series-category-container",
            category_id: category.category_id,
        });
    }

    // Apply sorting based on selected sort option
    return sortSeriesCategories(categories, sortType);
}

function sortSeriesCategories(categories, sortType) {
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
            // Top Rated - sort by average rating of series in category
            return categories.sort((a, b) => {
                const avgRatingA =
                    a.series && a.series.length > 0 ?
                    a.series.reduce(
                        (sum, series) => sum + (parseFloat(series.rating_5based) || 0),
                        0,
                    ) / a.series.length :
                    0;
                const avgRatingB =
                    b.series && b.series.length > 0 ?
                    b.series.reduce(
                        (sum, series) => sum + (parseFloat(series.rating_5based) || 0),
                        0,
                    ) / b.series.length :
                    0;
                return avgRatingB - avgRatingA;
            });

        case "default":
        default:
            // Default - return as is (no sorting)
            return categories;
    }
}

function createSeriesCard(seriesData, size, categoryIndex, seriesIndex) {
    let isLarge = size === "large";
    let cardClass = isLarge ? "series-card series-card-large" : "series-card";
    let seriesId = String(seriesData.series_id || seriesData.id);

    let isSeriesFav =
        Array.isArray(favoriteSeriesIds) &&
        favoriteSeriesIds.some((favId) => String(favId) === String(seriesId));

    let imageUrl = seriesData.image || "./assets/demo-img-card.png";
    let titleClass = "series-title-marquee";

    let currentCardCategory = window.allseriesCategories ?
        window.allseriesCategories.filter(
            (cat) => cat.category_id == seriesData.category_id,
        ) :
        [];

    let categoryName =
        currentCardCategory.length > 0 ?
        currentCardCategory[0].category_name :
        seriesData.genre || "Series";

    const isAdult =
        isSeriesAdult(seriesData.genre) || isSeriesAdult(categoryName);
    const currentPlaylist = getCurrentPlaylist();
    const hasParentalPassword =
        currentPlaylist && currentPlaylist.parentalPassword;
    const isLocked = isAdult && !unlockedSeriesAdultIds.has(String(seriesId));

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
            data-index="${seriesIndex}" 
            data-series-id="${seriesId}" 
            data-is-adult="${isAdult}"
            data-is-locked="${isLocked}"
            data-image-url="${imageUrl}"
            tabindex="0">
            <div class="series-card-inner" style="background-image: url('${
              imageUrl ? imageUrl : "./assets/placeholder-img.png"
            }')">
                <img src="${imageUrl}" style="display: none;" onerror="this.parentElement.style.backgroundImage = 'url(./assets/placeholder-img.png)'" />
                ${overlayHtml}
                <div class="series-card-heart-container">
                    <i class="${
                      isSeriesFav ? "fas" : "far"
                    } fa-heart series-card-heart"></i>
                </div>
                <div class="movie-card-rating">
                  <i class="fas fa-star"></i>
                    ${seriesData.rating ? seriesData.rating : "0"}
                </div>
                <div class="series-card-play-div">
                    <img src="./assets/card-play-icon.png" alt="Play" class="series-card-play" />
                </div>
                <div class="series-card-text">
                    <h2 class="${titleClass}">${seriesData.title || "Unknown"}</h2>
                </div>
            </div>
        </div>`;
}

function createSeriesLoadingIndicator(categoryIndex) {
    return (
        '<div class="series-loading-indicator" data-category="' +
        categoryIndex +
        '">' +
        "<p>Loading...</p>" +
        "</div>"
    );
}

function getSeriesLoadedChunkCount(categoryIndex) {
    return seriesChunkLoadingState.loadedChunks[categoryIndex] || 0;
}

function setSeriesLoadedChunkCount(categoryIndex, count) {
    seriesChunkLoadingState.loadedChunks[categoryIndex] = count;
}

function loadSeriesChunk(category, categoryIndex) {
    if (!category || !category.series || category.series.length === 0) return "";

    let loadedCount = getSeriesLoadedChunkCount(categoryIndex);
    let chunkSize = seriesChunkLoadingState.horizontalChunkSize;
    let totalSeries = category.series.length;

    if (loadedCount >= totalSeries) return "";

    let endIndex = Math.min(loadedCount + chunkSize, totalSeries);
    let cardsHTML = "";

    for (let i = loadedCount; i < endIndex; i++) {
        let seriesData = formatSeriesData(category.series[i]);
        if (!seriesData) continue;

        let size = category.id === "popular" ? "normal" : "normal";
        cardsHTML += createSeriesCard(seriesData, size, categoryIndex, i);
    }

    setSeriesLoadedChunkCount(categoryIndex, endIndex);
    return cardsHTML;
}

function seriesCategoryHasSeries(categoryIndex) {
    let categories = window.allSeriesCategories || [];
    let category = categories[categoryIndex];

    if (!category) {
        return false;
    }

    // Check if the category exists in the DOM and has cards
    let cardList = document.querySelector(
        '.series-card-list[data-category="' + categoryIndex + '"]',
    );
    if (!cardList) {
        return false;
    }

    // Check if there are actual card elements in the DOM
    let cardsInDOM = cardList.querySelectorAll(".series-card");
    if (cardsInDOM.length > 0) {
        return true;
    }

    // Fallback: check the data structure
    if (!category.series || category.series.length === 0) {
        return false;
    }

    // Logic changed: If we have data in the model, the category IS valid.
    // We shouldn't rely on loadedCount or DOM status for navigation validation,
    // otherwise we skip categories that are valid but effectively "loading".
    return true;
}

function findNextSeriesCategoryWithSeries(startIndex, direction) {
    let allCategories = window.allSeriesCategories || [];

    if (direction === 1) {
        for (let i = startIndex; i < allCategories.length; i++) {
            if (seriesCategoryHasSeries(i)) {
                return i;
            }
        }
    } else {
        for (let i = startIndex; i >= 0; i--) {
            if (seriesCategoryHasSeries(i)) {
                return i;
            }
        }
    }

    return -1;
}

function loadMoreSeriesCategories() {
    if (seriesChunkLoadingState.isLoading) return;

    let allCategories = window.allSeriesCategories || [];
    let currentLoaded = seriesChunkLoadingState.loadedCategories;

    // If searching and no remaining categories have items, remove any indicator and stop
    const remainingHasItems = allCategories
        .slice(currentLoaded)
        .some(function(cat) {
            return cat && cat.series && cat.series.length > 0;
        });
    if (!remainingHasItems) {
        let container = document.querySelector(".series-page-container");
        if (container) {
            let categoriesLoading = container.querySelector(
                ".categories-loading-indicator",
            );
            if (categoriesLoading) categoriesLoading.remove();
        }
        seriesChunkLoadingState.isLoading = false;
        return;
    }

    if (currentLoaded >= allCategories.length) {
        let container = document.querySelector(".series-page-container");
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

    seriesChunkLoadingState.isLoading = true;

    // 🔴 UX Improvement: Show loader immediately
    let containerForLoader = document.querySelector(".series-page-container");
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
        currentLoaded + seriesChunkLoadingState.categoryChunkSize,
        allCategories.length,
    );

    let safetyTimeout = setTimeout(function() {
        if (seriesChunkLoadingState.isLoading) {
            console.warn(
                "loadMoreSeriesCategories: Safety timeout triggered, resetting loading state",
            );
            seriesChunkLoadingState.isLoading = false;
            let container = document.querySelector(".series-page-container");
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

    setTimeout(function() {
        try {
            let container = document.querySelector(".series-page-container");
            if (!container) {
                clearTimeout(safetyTimeout);
                seriesChunkLoadingState.isLoading = false;
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

                if (category.series && category.series.length > 0) {
                    try {
                        let categoryHTML = createSeriesCategorySection(category, i);
                        container.insertAdjacentHTML("beforeend", categoryHTML);
                        categoriesAdded++;
                    } catch (e) {
                        console.error("Error creating series category section:", e);
                    }
                }
            }

            let hasMoreCategories = false;
            for (let i = nextChunk; i < allCategories.length; i++) {
                let category = allCategories[i];
                if (category && category.series && category.series.length > 0) {
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

            // Removed loading indicator - categories load quickly without needing it

            seriesChunkLoadingState.loadedCategories = nextChunk;
            clearTimeout(safetyTimeout);
            seriesChunkLoadingState.isLoading = false;

            if (categoriesAdded > 0) {
                updateSeriesFocus();
            }
        } catch (e) {
            console.error("Error in loadMoreSeriesCategories:", e);
            clearTimeout(safetyTimeout);
            seriesChunkLoadingState.isLoading = false;

            let container = document.querySelector(".series-page-container");
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

function createSeriesCategorySection(category, categoryIndex) {
    let size = category.id === "popular" ? "large" : "normal";
    const isEmptyFav =
        category.id === "fav" && (!category.series || category.series.length === 0);
    const isEmptyRecent =
        category.id === "recent" &&
        (!category.series || category.series.length === 0);

    let html =
        '<div class="' +
        category.containerClass +
        (isEmptyFav || isEmptyRecent ? " empty-fav" : "") +
        '" style="' +
        (isEmptyFav || isEmptyRecent ? "display: none;" : "") +
        '">';
    html += "<h1>" + category.title + "</h1>";
    html +=
        '<div class="series-card-list ' +
        category.id +
        '-list" data-category="' +
        categoryIndex +
        '">';

    let initialSeries = loadSeriesChunk(category, categoryIndex);
    html += initialSeries;

    html += "</div>";
    html += "</div>";

    return html;
}

function createSeriesNoDataMessage(categoryTitle) {
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

function createSeriesNoSearchMessage(query) {
    return (
        '<div class="no-data-container">' +
        '<div class="no-data-content">' +
        '<h2>No result found for "' +
        query +
        '"</h2>' +
        "</div>" +
        "</div>"
    );
}

function handleSeriesEnterKey(e) {
    let currentPage = localStorage.getItem("currentPage");
    let navigationFocus = localStorage.getItem("navigationFocus");

    if (currentPage !== "seriesPage" || navigationFocus !== "seriesPage") {
        return;
    }

    if (e.key === "Enter") {
        e.preventDefault();

        if (e.type === "keydown") {
            seriesEnterKeyState.isPressed = true;
            seriesEnterKeyState.pressStartTime = Date.now();

            seriesEnterKeyState.timeoutId = setTimeout(function() {
                if (seriesEnterKeyState.isPressed) {
                    handleSeriesLongPressEnter();
                    seriesEnterKeyState.isPressed = false;
                }
            }, seriesEnterKeyState.longPressThreshold);
        } else if (e.type === "keyup") {
            if (seriesEnterKeyState.isPressed) {
                let pressDuration = Date.now() - seriesEnterKeyState.pressStartTime;

                if (pressDuration < seriesEnterKeyState.longPressThreshold) {
                    clearTimeout(seriesEnterKeyState.timeoutId);
                    handleSeriesSimpleEnter();
                }

                seriesEnterKeyState.isPressed = false;
            }
        }
    }
}

function handleSeriesSimpleEnter() {
    if (seriesNavigationState.focus === "watchNow") {
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

        localStorage.setItem("selectedSeriesId", data.movie_data.series_id);
        localStorage.setItem("selectedSeriesItem", JSON.stringify(data.movie_data));

        // Play first episode directly
        getSeriesDetail(data.movie_data.series_id)
            .then((detail) => {
                if (detail && detail.episodes) {
                    const episodes = detail.episodes;
                    const seasonKeys = Object.keys(episodes).sort(
                        (a, b) => parseInt(a) - parseInt(b),
                    );
                    if (seasonKeys.length > 0) {
                        const firstSeason = episodes[seasonKeys[0]];
                        if (firstSeason && firstSeason.length > 0) {
                            const firstEpisode = firstSeason[0];
                            const playlist = JSON.parse(
                                localStorage.getItem("currentPlaylistData") || "{}",
                            );
                            const url = `${playlist.server_info.server_protocol}://${playlist.server_info.url}:${playlist.server_info.port}/series/${playlist.user_info.username}/${playlist.user_info.password}/${firstEpisode.id}.${firstEpisode.container_extension}`;

                            localStorage.setItem(
                                "playingItemData",
                                JSON.stringify(firstEpisode),
                            );
                            localStorage.setItem("selectedVideoItemUrl", url);
                            localStorage.setItem("selectedEpisodeId", firstEpisode.id);
                            localStorage.setItem("selectedSeason", seasonKeys[0]);
                            localStorage.setItem("from", "series");
                            localStorage.setItem("fromSeriesPage", "true");
                            localStorage.setItem("currentPage", "videojsPlayer");

                            Router.showPage("videoJsPlayer");
                            if (document.querySelector("#navbar-root"))
                                document.querySelector("#navbar-root").style.display = "none";
                            cleanupSeriesNavigation();
                            return;
                        }
                    }
                }
                // Fallback to detail page if no episodes found
                localStorage.setItem("currentPage", "seriesDetailPage");
                localStorage.setItem("navigationFocus", "seriesDetailPage");
                Router.showPage("seriesDetailPage");
                cleanupSeriesNavigation();
            })
            .catch((err) => {
                console.error("Error fetching series detail for Play Now:", err);
                localStorage.setItem("currentPage", "seriesDetailPage");
                localStorage.setItem("navigationFocus", "seriesDetailPage");
                Router.showPage("seriesDetailPage");
                cleanupSeriesNavigation();
            });
        return;
    }

    if (seriesNavigationState.focus === "moreInfo") {
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

        const seriesId = data.movie_data.series_id;
        const result = toggleFavoriteItem(
            data.movie_data,
            "favouriteSeries",
            getCurrentPlaylistUsername(),
        );

        // Invalidate Carousel Cache
        const cacheKey = "homeCarouselCachedSliderData_series";
        if (window[cacheKey]) delete window[cacheKey];

        // Update ALL cards heart display
        updateAllSeriesCardsHeartDisplay(seriesId, result.isFav);

        // Show toast
        if (typeof Toaster !== "undefined" && Toaster.showToast) {
            Toaster.showToast(
                result.isFav ? "success" : "error",
                result.isFav ? "Added to Favorites" : "Removed from Favorites",
            );
        }

        // Update the heart icon in the carousel (for all slides matching this ID)
        document
            .querySelectorAll(`.carousel-fav-btn[data-stream-id="${seriesId}"] i`)
            .forEach((icon) => {
                icon.className = result.isFav ? "fas fa-heart" : "far fa-heart";
                icon.style.color = result.isFav ? "#ff4d4d" : "white";
                icon.style.opacity = result.isFav ? "1" : "0.6";
            });

        // Cross-page Sync
        const syncItem = {
            ...data.movie_data,
            type: "series",
        };

        // Update current page
        updateMyFavSeriesCategoryRealtime(seriesId, result.isFav, 0, 0);

        // Update HomePage if registered
        if (window.updateHomePageFavorites) {
            window.updateHomePageFavorites(syncItem, result.isFav);
        }
        if (window.updateAllHomeCardsHeartDisplay) {
            window.updateAllHomeCardsHeartDisplay(seriesId, "series", result.isFav);
        }

        // Update MoviesPage if registered
        if (window.updateMoviesPageFavorites) {
            window.updateMoviesPageFavorites(seriesId, result.isFav);
        }
        if (window.updateAllMovieCardsHeartDisplay) {
            window.updateAllMovieCardsHeartDisplay(seriesId, result.isFav);
        }

        return;
    }

    if (seriesNavigationState.focus === "favButton") {
        handleSeriesLongPressEnter();
        return;
    }

    if (!seriesCategoryHasSeries(seriesNavigationState.currentCategoryIndex)) {
        return;
    }

    let categoryIndex = seriesNavigationState.currentCategoryIndex;
    let cardIndex = seriesNavigationState.currentCardIndex;

    let currentCard = document.querySelector(
        '.series-card[data-category="' +
        categoryIndex +
        '"][data-index="' +
        cardIndex +
        '"]',
    );

    if (currentCard) {
        let seriesId = currentCard.getAttribute("data-series-id");

        const isAdult = currentCard.getAttribute("data-is-adult") === "true";
        const isLocked = currentCard.getAttribute("data-is-locked") === "true";
        const currentPlaylist = getCurrentPlaylist();
        const hasParentalPassword =
            currentPlaylist && currentPlaylist.parentalPassword;

        if (isAdult && isLocked) {
            if (hasParentalPassword) {
                ParentalPinDialog(
                    () => {
                        unlockedSeriesAdultIds.add(String(seriesId));
                        const overlay = currentCard.querySelector(".adult-overlay");
                        if (overlay) overlay.remove();
                        currentCard.setAttribute("data-is-locked", "false");
                        proceedToSeriesDetail(categoryIndex, cardIndex, seriesId);
                    },
                    () => {
                        // Stay on page
                    },
                    currentPlaylist,
                    "seriesPage",
                );
                return;
            } else {
                proceedToSeriesDetail(categoryIndex, cardIndex, seriesId);
                return;
            }
        }

        proceedToSeriesDetail(categoryIndex, cardIndex, seriesId);
    }
}

function proceedToSeriesDetail(categoryIndex, cardIndex, seriesId) {
    localStorage.setItem("previousPage", "seriesPage");
    localStorage.setItem("seriesCategoryIndex", categoryIndex);
    localStorage.setItem("seriesCardIndex", cardIndex);
    localStorage.setItem("seriesSelectedCategoryId", categoryIndex);

    localStorage.setItem("selectedSeriesId", seriesId);

    const selectedSeriesItem = window.allSeriesStreams.find(
        (item) => item.series_id == seriesId,
    );
    if (selectedSeriesItem) {
        localStorage.setItem(
            "selectedSeriesItem",
            JSON.stringify(selectedSeriesItem),
        );
    }

    saveSeriesNavigationState(); // Save state before navigating

    cleanupSeriesNavigation();

    localStorage.setItem("currentPage", "seriesDetailPage");
    localStorage.setItem("navigationFocus", "seriesDetailPage");

    Router.showPage("seriesDetailPage");
}

function handleSeriesLongPressEnter() {
    if (!seriesCategoryHasSeries(seriesNavigationState.currentCategoryIndex)) {
        return;
    }

    let categoryIndex = seriesNavigationState.currentCategoryIndex;
    let cardIndex = seriesNavigationState.currentCardIndex;

    let currentCard = document.querySelector(
        '.series-card[data-category="' +
        categoryIndex +
        '"][data-index="' +
        cardIndex +
        '"]',
    );

    if (currentCard) {
        let seriesId = currentCard.getAttribute("data-series-id");

        // FIX: Capture visual position relative to viewport BEFORE any changes
        const rectBefore = currentCard.getBoundingClientRect();
        const topBefore = rectBefore.top;

        const seriesContainer = document.querySelector(".series-page-container");

        const seriesObj = (window.allSeriesStreams || []).find(
            (s) => String(s.series_id) === String(seriesId),
        );

        // Toggle favorite
        const result = toggleFavoriteItem(
            seriesObj || {
                series_id: seriesId,
            },
            "favouriteSeries",
            getCurrentPlaylistUsername(),
        );

        // Update ALL cards heart display
        updateAllSeriesCardsHeartDisplay(seriesId, result.isFav);

        // Show toast
        if (typeof Toaster !== "undefined" && Toaster.showToast) {
            Toaster.showToast(
                result.isFav ? "success" : "error",
                result.isFav ? "Added to Favorites" : "Removed from Favorites",
            );
        }

        // Update My Fav category in real-time
        updateMyFavSeriesCategoryRealtime(
            seriesId,
            result.isFav,
            categoryIndex,
            cardIndex,
        );

        // Cross-page Sync: Notify other pages
        const syncItem = {
            ...(seriesObj || {
                series_id: seriesId,
            }),
            type: "series",
        };

        if (window.updateHomePageFavorites) {
            window.updateHomePageFavorites(syncItem, result.isFav);
        }
        if (window.updateAllHomeCardsHeartDisplay) {
            window.updateAllHomeCardsHeartDisplay(seriesId, "series", result.isFav);
        }
        if (window.updateMoviesPageFavorites) {
            window.updateMoviesPageFavorites(seriesId, result.isFav);
        }
        if (window.updateAllMovieCardsHeartDisplay) {
            window.updateAllMovieCardsHeartDisplay(seriesId, result.isFav);
        }

        // FIX: Restore visual position relative to viewport AFTER changes
        if (seriesContainer) {
            const rectAfter = currentCard.getBoundingClientRect();
            const topAfter = rectAfter.top;
            const diff = topAfter - topBefore;

            if (diff !== 0) {
                seriesContainer.scrollTop += diff;
            }
        }

        // Maintain focus on the same card position
        setTimeout(() => {
            // Re-check position in case of async layout shifts
            if (seriesContainer) {
                const rectAfterAsync = currentCard.getBoundingClientRect();
                const topAfterAsync = rectAfterAsync.top;
                const diffAsync = topAfterAsync - topBefore;
                // Assuming synchronous fix covered it, but good for safety
            }
            updateSeriesFocus();
        }, 50);

        saveSeriesNavigationState();
    }
}

function updateAllSeriesCardsHeartDisplay(seriesId, isFav) {
    // Update heart icon on ALL cards with this series_id across all categories
    document
        .querySelectorAll('.series-card[data-series-id="' + seriesId + '"]')
        .forEach(function(card) {
            const heartEl = card.querySelector(".series-card-heart");
            if (heartEl) {
                if (isFav) {
                    heartEl.classList.remove("far");
                    heartEl.classList.add("fas");
                } else {
                    heartEl.classList.remove("fas");
                    heartEl.classList.add("far");
                }
            }
        });
}

function updateMyFavSeriesCategoryRealtime(
    seriesId,
    isFav,
    currentCategoryIndex,
    currentCardIndex,
) {
    const currentPlaylist = getCurrentPlaylist();
    const favIdsRaw = currentPlaylist ?
        currentPlaylist.favouriteSeries || [] :
        [];
    const favIds = Array.isArray(favIdsRaw) ?
        favIdsRaw.map((id) =>
            typeof id === "object" && id !== null ?
            String(id.series_id || id.id || "") :
            String(id),
        ) :
        [];
    favoriteSeriesIds = favIds;

    const favouriteSeries =
        window.allSeriesStreams && favIds.length ?
        window.allSeriesStreams.filter(
            (s) => s && favIds.includes(String(s.series_id)),
        ) :
        [];

    const isSearchMode = !!getSeriesSearchQuery();
    let favList = document.querySelector(".series-card-list.fav-list");
    let favContainer = document.querySelector(".series-fav-container");

    if (!favList || !favContainer) {
        if (isFav) {
            createMyFavSeriesCategory();
            favList = document.querySelector(".series-card-list.fav-list");
            favContainer = document.querySelector(".series-fav-container");
            if (!favList || !favContainer) return;
        } else {
            return;
        }
    }

    const favCategoryIndex = 1; // Fixed index
    const isCurrentlyInFavCategory = currentCategoryIndex === favCategoryIndex;

    if (isFav) {
        favContainer.style.display = "block";
        favContainer.classList.remove("empty-fav");

        const newSeries = window.allSeriesStreams.find(
            (s) => s && String(s.series_id) === String(seriesId),
        );
        if (newSeries) {
            const seriesData = formatSeriesData(newSeries);
            if (seriesData) {
                const currentCardsInList = favList.querySelectorAll(".series-card");
                const newIndex = currentCardsInList.length;
                const cardHTML = createSeriesCard(
                    seriesData,
                    "normal",
                    favCategoryIndex,
                    newIndex,
                );
                favList.insertAdjacentHTML("beforeend", cardHTML);

                setSeriesLoadedChunkCount(favCategoryIndex, newIndex + 1);
            }

            if (window.allSeriesCategories && window.allSeriesCategories[1]) {
                if (!window.allSeriesCategories[1].series)
                    window.allSeriesCategories[1].series = [];
                const exists = window.allSeriesCategories[1].series.some(
                    (s) => String(s.series_id) === String(seriesId),
                );
                if (!exists) window.allSeriesCategories[1].series.push(newSeries);
            }
        }
    } else {
        const cardToRemove = favList.querySelector(
            '.series-card[data-series-id="' + seriesId + '"]',
        );

        if (cardToRemove) {
            cardToRemove.remove();

            const remainingCards = favList.querySelectorAll(".series-card");
            remainingCards.forEach((card, index) => {
                card.setAttribute("data-index", index);
            });

            setSeriesLoadedChunkCount(favCategoryIndex, remainingCards.length);

            if (window.allSeriesCategories && window.allSeriesCategories[1]) {
                window.allSeriesCategories[1].series = favouriteSeries;
            }

            if (remainingCards.length === 0) {
                favContainer.style.display = "none";
                favContainer.classList.add("empty-fav");

                if (isCurrentlyInFavCategory) {
                    moveSeriesDown();
                }
            } else if (isCurrentlyInFavCategory) {
                seriesNavigationState.currentCardIndex = Math.min(
                    currentCardIndex,
                    remainingCards.length - 1,
                );
                updateSeriesFocus();
            }
        }
    }
}

function createMyFavSeriesCategory() {
    const pageContainer = document.querySelector(".series-page-container");
    if (!pageContainer) return;

    // Check if My Fav already exists
    const existingFav = document.querySelector(".series-fav-container");
    if (existingFav) return;

    // FIX: Removed scroll capture from here

    // Create My Fav category at index 1
    const favCategory = {
        title: "My Fav",
        series: [], // Will be populated by adding cards
        id: "fav",
        containerClass: "series-fav-container",
    };

    // Create the HTML structure for My Fav category
    let html = '<div class="' + favCategory.containerClass + '">';
    html += "<h1>" + favCategory.title + "</h1>";
    html += '<div class="series-card-list fav-list" data-category="1">';
    html += "</div>";
    html += "</div>";

    // Insert after the first category (index 0, which is Continue Watching)
    const firstCategory = pageContainer.querySelector(".series-card-list");
    if (firstCategory && firstCategory.parentElement) {
        firstCategory.parentElement.insertAdjacentHTML("afterend", html);
    } else {
        pageContainer.insertAdjacentHTML("afterbegin", html);
    }

    // Shift all chunk loading states from index 1 onwards
    const oldChunks = {
        ...seriesChunkLoadingState.loadedChunks,
    };
    seriesChunkLoadingState.loadedChunks = {};
    seriesChunkLoadingState.loadedChunks[0] = oldChunks[0] || 0; // Keep Continue Watching
    seriesChunkLoadingState.loadedChunks[1] = 0; // My Fav starts with 0 loaded

    Object.keys(oldChunks).forEach((key) => {
        const oldIndex = parseInt(key, 10);
        if (oldIndex < 1) return;
        const newIndex = oldIndex + 1;
        seriesChunkLoadingState.loadedChunks[newIndex] = oldChunks[key];
    });

    // Update all existing category indices (shift them by 1 starting from index 1)
    const allCategoryLists = pageContainer.querySelectorAll(
        ".series-card-list:not(.fav-list)",
    );
    allCategoryLists.forEach((list) => {
        const currentIndex = parseInt(list.getAttribute("data-category"), 10);
        if (currentIndex < 1) return;
        const newIndex = currentIndex + 1;
        list.setAttribute("data-category", newIndex);

        // Update all cards in this category
        const cards = list.querySelectorAll(".series-card");
        cards.forEach((card) => {
            card.setAttribute("data-category", newIndex);
        });

        // Update loading indicators if any
        const loadingIndicator = list.querySelector(".series-loading-indicator");
        if (loadingIndicator) {
            loadingIndicator.setAttribute("data-category", newIndex);
        }
    });

    // Adjust current navigation state if we were below index 0
    if (seriesNavigationState.currentCategoryIndex >= 1) {
        seriesNavigationState.currentCategoryIndex += 1;
    }
    if (seriesNavigationState.lastFocusedCategory >= 1) {
        seriesNavigationState.lastFocusedCategory += 1;
    }

    // Update window.allSeriesCategories to include My Fav at index 1
    if (window.allSeriesCategories && window.allSeriesCategories.length > 0) {
        // Check if My Fav already exists in the array
        const favIndex = window.allSeriesCategories.findIndex(
            (cat) => cat.id === "fav",
        );
        if (favIndex === -1) {
            // My Fav doesn't exist, insert at index 1
            window.allSeriesCategories.splice(1, 0, favCategory);
        } else if (favIndex !== 1) {
            // My Fav exists but not at index 1, move it
            const favCat = window.allSeriesCategories.splice(favIndex, 1)[0];
            window.allSeriesCategories.splice(1, 0, favCat);
        }
    }

    // Increment loaded categories count
    seriesChunkLoadingState.loadedCategories += 1;

    // FIX: Removed scroll restoration from here
}

function removeMyFavSeriesCategory() {
    const favContainer = document.querySelector(".series-fav-container");
    if (!favContainer) return;

    const pageContainer = document.querySelector(".series-page-container");
    if (!pageContainer) return;

    // Remove My Fav container
    favContainer.remove();

    // Shift all chunk loading states back by 1 index (starting after index 1)
    const oldChunks = {
        ...seriesChunkLoadingState.loadedChunks,
    };
    seriesChunkLoadingState.loadedChunks = {};
    seriesChunkLoadingState.loadedChunks[0] = oldChunks[0] || 0; // Keep Continue Watching

    Object.keys(oldChunks).forEach((key) => {
        const oldIndex = parseInt(key, 10);
        if (oldIndex <= 1) return; // Skip Continue Watching (0) and My Fav (1)
        const newIndex = oldIndex - 1;
        seriesChunkLoadingState.loadedChunks[newIndex] = oldChunks[key];
    });

    // Update all category indices (shift them back by 1 for indices > 1)
    const allCategoryLists = pageContainer.querySelectorAll(".series-card-list");
    allCategoryLists.forEach((list) => {
        const currentIndex = parseInt(list.getAttribute("data-category"), 10);
        if (currentIndex <= 1) return;
        const newIndex = currentIndex - 1;
        list.setAttribute("data-category", newIndex);

        // Update all cards in this category
        const cards = list.querySelectorAll(".series-card");
        cards.forEach((card) => {
            card.setAttribute("data-category", newIndex);
        });

        // Update loading indicators if any
        const loadingIndicator = list.querySelector(".series-loading-indicator");
        if (loadingIndicator) {
            loadingIndicator.setAttribute("data-category", newIndex);
        }
    });

    // Adjust navigation state (shift back by 1 if we were below My Fav)
    if (seriesNavigationState.currentCategoryIndex > 1) {
        seriesNavigationState.currentCategoryIndex -= 1;
    }
    if (seriesNavigationState.lastFocusedCategory > 1) {
        seriesNavigationState.lastFocusedCategory -= 1;
    }

    // Remove from window.allSeriesCategories
    if (window.allSeriesCategories && window.allSeriesCategories.length > 0) {
        const favIndex = window.allSeriesCategories.findIndex(
            (cat) => cat.id === "fav",
        );
        if (favIndex !== -1) {
            window.allSeriesCategories.splice(favIndex, 1);
        }
    }

    // Decrement loaded categories count
    if (seriesChunkLoadingState.loadedCategories > 0) {
        seriesChunkLoadingState.loadedCategories -= 1;
    }

    // FIX: Removed scroll restoration from here
}

function refreshSeriesFavoritesList() {
    const currentPlaylist = getCurrentPlaylist();
    const favIdsRaw = currentPlaylist ?
        currentPlaylist.favouriteSeries || [] :
        [];
    const favIds = Array.isArray(favIdsRaw) ?
        favIdsRaw.map((id) =>
            typeof id === "object" && id !== null ?
            String(id.series_id || id.id || "") :
            String(id),
        ) :
        [];
    favoriteSeriesIds = favIds; // Update global favorite IDs

    const favouriteSeries =
        window.allSeriesStreams && favIds.length ?
        window.allSeriesStreams.filter(
            (s) => s && favIds.includes(String(s.series_id)),
        ) :
        [];

    // If in search mode, do not show My Fav section; keep page focused on search results
    const isSearchMode = !!getSeriesSearchQuery();
    if (isSearchMode) {
        const favContainerSearch = document.querySelector(".series-fav-container");
        const favListSearch = document.querySelector(".series-card-list.fav-list");
        if (favListSearch) {
            const categoryIndexAttr = favListSearch.getAttribute("data-category");
            const categoryIndex = categoryIndexAttr ?
                parseInt(categoryIndexAttr, 10) :
                0;
            setSeriesLoadedChunkCount(categoryIndex, 0);
        }
        if (favContainerSearch) {
            favContainerSearch.remove();
        }
        // If focus points to removed fav category, shift to next available category
        const currentList = document.querySelector(
            '.series-card-list[data-category="' +
            seriesNavigationState.currentCategoryIndex +
            '"]',
        );
        if (!currentList) {
            const nextIdx = findNextSeriesCategoryWithSeries(
                seriesNavigationState.currentCategoryIndex + 1,
                1,
            );
            seriesNavigationState.currentCategoryIndex = nextIdx !== -1 ? nextIdx : 0;
            seriesNavigationState.currentCardIndex = 0;
            updateSeriesFocus();
            saveSeriesNavigationState();
        }
        return;
    }

    // If there are no favorites, remove the entire My Fav category section
    if (!favouriteSeries.length) {
        const favContainer = document.querySelector(".series-fav-container");
        const favListForIdx = document.querySelector(".series-card-list.fav-list");
        if (favListForIdx) {
            const categoryIndexAttr = favListForIdx.getAttribute("data-category");
            const categoryIndex = categoryIndexAttr ?
                parseInt(categoryIndexAttr, 10) :
                0;
            setSeriesLoadedChunkCount(categoryIndex, 0);
        }
        if (favContainer) {
            favContainer.remove();
        }
        // If focus points to a non-existent list, shift focus
        const currentList = document.querySelector(
            '.series-card-list[data-category="' +
            seriesNavigationState.currentCategoryIndex +
            '"]',
        );
        if (!currentList) {
            const nextIdx = findNextSeriesCategoryWithSeries(
                seriesNavigationState.currentCategoryIndex + 1,
                1,
            );
            seriesNavigationState.currentCategoryIndex = nextIdx !== -1 ? nextIdx : 0;
            seriesNavigationState.currentCardIndex = 0;
            updateSeriesFocus();
            saveSeriesNavigationState();
        }
        return;
    }

    // Ensure My Fav container exists; if not, create it at the top
    let favContainer = document.querySelector(".series-fav-container");
    let favList = document.querySelector(".series-card-list.fav-list");

    if (!favContainer || !favList) {
        const pageContainer = document.querySelector(".series-page-container");
        if (pageContainer) {
            const favCategory = {
                title: "My Fav",
                series: favouriteSeries,
                id: "fav",
                containerClass: "series-fav-container",
            };
            const favHTML = createSeriesCategorySection(favCategory, 1);

            const firstCategory = pageContainer.querySelector(".series-card-list");
            if (firstCategory && firstCategory.parentElement) {
                firstCategory.parentElement.insertAdjacentHTML("afterend", favHTML);
            } else {
                pageContainer.insertAdjacentHTML("afterbegin", favHTML);
            }
            favContainer = document.querySelector(".series-fav-container");
            favList = document.querySelector(".series-card-list.fav-list");
        }
    }

    if (!favList) return;

    const categoryIndexAttr = favList.getAttribute("data-category");
    const categoryIndex = categoryIndexAttr ? parseInt(categoryIndexAttr, 10) : 1;

    let html = "";
    for (let i = 0; i < favouriteSeries.length; i++) {
        const seriesData = formatSeriesData(favouriteSeries[i]);
        if (!seriesData) continue;
        html += createSeriesCard(seriesData, "normal", categoryIndex, i);
    }

    favList.innerHTML = html;
    setSeriesLoadedChunkCount(categoryIndex, favouriteSeries.length);

    // After rendering, restore or set focus on My Fav cards
    const navigationFocus = localStorage.getItem("navigationFocus");
    if (navigationFocus === "seriesPage") {
        const hasFocused = document.querySelector(".series-card.focused");
        if (!hasFocused) {
            seriesNavigationState.currentCategoryIndex = categoryIndex;
            seriesNavigationState.currentCardIndex = Math.max(
                0,
                Math.min(
                    seriesNavigationState.currentCardIndex,
                    favouriteSeries.length - 1,
                ),
            );
        } else if (seriesNavigationState.currentCategoryIndex === categoryIndex) {
            seriesNavigationState.currentCardIndex = Math.max(
                0,
                Math.min(
                    seriesNavigationState.currentCardIndex,
                    favouriteSeries.length - 1,
                ),
            );
        }
        updateSeriesFocus();
        saveSeriesNavigationState();
    }
}

function handleSeriesKeyNavigation(e) {
    // Check if sidebar is open
    const sidebar = document.getElementById("sidebar");
    if (sidebar && !sidebar.classList.contains("option-remove")) {
        return;
    }

    let currentPage = localStorage.getItem("currentPage");
    let navigationFocus = localStorage.getItem("navigationFocus");

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

    if (currentPage !== "seriesPage") return;

    if (isBackKey) {
        const firstRowIdxS = findNextSeriesCategoryWithSeries ?
            findNextSeriesCategoryWithSeries(0, 1) :
            0;
        const isAtRootS =
            navigationFocus === "navbar" ||
            seriesNavigationState.focus === "watchNow" ||
            seriesNavigationState.focus === "moreInfo" ||
            seriesNavigationState.focus === "carousel" ||
            (seriesNavigationState.focus === "categories" &&
                seriesNavigationState.currentCategoryIndex === firstRowIdxS);

        if (!isAtRootS) {
            seriesNavigationState.focus = "categories";
            seriesNavigationState.currentCategoryIndex = firstRowIdxS;
            seriesNavigationState.currentCardIndex = 0;

            const seriesContainer = document.querySelector(".series-page-container");
            if (seriesContainer) seriesContainer.scrollTop = 0;

            const navbarElS = document.querySelector("#navbar-root");
            if (navbarElS) navbarElS.style.display = "block";

            localStorage.setItem("navigationFocus", "seriesPage");
            updateSeriesFocus();
            saveSeriesNavigationState();

            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            return;
        }
        // If already at root, let it bubble to Navbar.js for Exit Modal
        return;
    }

    if (navigationFocus !== "seriesPage") {
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
        handleSeriesEnterKey(e);
        return;
    }

    const now = Date.now();
    if (
        now - seriesNavigationDebounce.lastKeyPress <
        seriesNavigationDebounce.debounceTime
    ) {
        e.preventDefault();
        return;
    }

    e.preventDefault();

    seriesNavigationDebounce.lastKeyPress = now;

    switch (e.key) {
        case "ArrowRight":
            moveSeriesRight();
            break;
        case "ArrowLeft":
            moveSeriesLeft();
            break;
        case "ArrowDown":
            moveSeriesDown();
            break;
        case "ArrowUp":
            moveSeriesUp();
            break;
        default:
            break;
    }

    updateSeriesFocus();
    saveSeriesNavigationState();
}

function cleanupSeriesNavigation() {
    document.removeEventListener("keydown", handleSeriesKeyNavigation, true);
    document.removeEventListener("keyup", handleSeriesKeyNavigation, true);

    if (window.seriesCarouselSlideChangeHandler) {
        window.removeEventListener(
            "carousel-slide-changed",
            window.seriesCarouselSlideChangeHandler,
        );
        window.seriesCarouselSlideChangeHandler = null;
    }

    isSeriesNavigationInitialized = false;
    seriesNavigationDebounce.lastKeyPress = 0;
    seriesNavigationDebounce.isDebouncing = false;

    // Clear any pending timeouts
    if (seriesEnterKeyState.timeoutId) {
        clearTimeout(seriesEnterKeyState.timeoutId);
        seriesEnterKeyState.timeoutId = null;
    }
    seriesEnterKeyState.isPressed = false;
}

function getSeriesCurrentVisibleIndex(categoryIndex, cardIndex) {
    let cardList = document.querySelector(
        '.series-card-list[data-category="' + categoryIndex + '"]',
    );
    if (!cardList) return 0;

    let containerWidth = cardList.offsetWidth;
    let firstCard = cardList.querySelector(".series-card");
    if (!firstCard) return 0;

    let cardWidth = firstCard.offsetWidth + 16;
    let visibleCardsCount = Math.floor(containerWidth / cardWidth);

    // Clamp to last visible card index
    if (cardIndex >= visibleCardsCount) {
        return visibleCardsCount - 1;
    }

    return cardIndex;
}

function moveSeriesRight() {
    if (seriesNavigationState.focus === "watchNow") {
        seriesNavigationState.focus = "moreInfo";
        updateSeriesFocus();
        return;
    }

    if (seriesNavigationState.focus !== "categories") return;

    if (!seriesCategoryHasSeries(seriesNavigationState.currentCategoryIndex)) {
        return;
    }

    let currentCategory = getCurrentSeriesCategory();
    if (!currentCategory) return;

    let loadedCount = getSeriesLoadedChunkCount(
        seriesNavigationState.currentCategoryIndex,
    );
    let totalSeries = currentCategory.series ? currentCategory.series.length : 0;

    if (seriesNavigationState.currentCardIndex < loadedCount - 1) {
        seriesNavigationState.currentCardIndex++;
        updateSeriesFocus();

        // Pre-fetch
        if (
            loadedCount < totalSeries &&
            seriesNavigationState.currentCardIndex >= loadedCount - 2
        ) {
            loadMoreSeriesForCategory(seriesNavigationState.currentCategoryIndex);
        }
    } else {
        if (loadedCount < totalSeries) {
            loadMoreSeriesForCategory(seriesNavigationState.currentCategoryIndex);
        }
    }

    seriesNavigationState.lastFocusedCategory =
        seriesNavigationState.currentCategoryIndex;
    seriesNavigationState.lastFocusedCard =
        seriesNavigationState.currentCardIndex;
}

function moveSeriesLeft() {
    if (seriesNavigationState.focus === "moreInfo") {
        seriesNavigationState.focus = "watchNow";
        updateSeriesFocus();
        return;
    }

    if (seriesNavigationState.focus !== "categories") return;

    if (!seriesCategoryHasSeries(seriesNavigationState.currentCategoryIndex)) {
        return;
    }

    if (seriesNavigationState.currentCardIndex > 0) {
        seriesNavigationState.currentCardIndex--;
        updateSeriesFocus();
    }

    seriesNavigationState.lastFocusedCategory =
        seriesNavigationState.currentCategoryIndex;
    seriesNavigationState.lastFocusedCard =
        seriesNavigationState.currentCardIndex;
}

function moveSeriesDown() {
    // When on carousel (arrows), first move to Watch Now button
    if (seriesNavigationState.focus === "carousel") {
        seriesNavigationState.focus = "watchNow";
        updateSeriesFocus();
        return;
    }

    // When on Watch Now or More Info buttons, move to categories (cards)
    if (
        seriesNavigationState.focus === "watchNow" ||
        seriesNavigationState.focus === "moreInfo"
    ) {
        // Prevent immediate jump from navbar
        if (seriesNavigationState.justTransitioned) {
            seriesNavigationState.justTransitioned = false;
            return;
        }
        const firstCategoryIdx = findNextSeriesCategoryWithSeries(0, 1);
        if (firstCategoryIdx !== -1) {
            if (window.HomeCarousel && window.HomeCarousel.cleanup) {
                window.HomeCarousel.cleanup();
            }
            seriesNavigationState.focus = "categories";
            seriesNavigationState.currentCategoryIndex = firstCategoryIdx;
            seriesNavigationState.currentCardIndex = 0;
            updateSeriesFocus();
        }
        return;
    }

    let allCategories = window.allSeriesCategories || [];
    if (allCategories.length === 0) return;

    let currentIndex = seriesNavigationState.currentCategoryIndex;
    let currentCardIndex = seriesNavigationState.currentCardIndex;

    let nextCategoryIndex = findNextSeriesCategoryWithSeries(currentIndex + 1, 1);

    if (nextCategoryIndex > 2) {
        const navbarEl = document.querySelector("#navbar-root");
        if (navbarEl) {
            navbarEl.style.display = "none";
        }
    }

    if (nextCategoryIndex !== -1) {
        seriesNavigationState.currentCategoryIndex = nextCategoryIndex;

        let newCategory = getCurrentSeriesCategory();
        if (newCategory) {
            let loadedCount = getSeriesLoadedChunkCount(
                seriesNavigationState.currentCategoryIndex,
            );

            let visiblePosition = getSeriesCurrentVisibleIndex(
                currentIndex,
                currentCardIndex,
            );
            seriesNavigationState.currentCardIndex =
                loadedCount > 0 ? Math.min(visiblePosition, loadedCount - 1) : 0;
        } else {
            seriesNavigationState.currentCardIndex = 0;
        }

        let loadedCategoriesCount = seriesChunkLoadingState.loadedCategories;
        if (
            seriesNavigationState.currentCategoryIndex >=
            loadedCategoriesCount - 2
        ) {
            loadMoreSeriesCategories();
        }
    } else {
        // Try to load more categories if we are at the bottom
        loadMoreSeriesCategories();
    }
}

function moveSeriesUp() {
    if (
        seriesNavigationState.focus === "watchNow" ||
        seriesNavigationState.focus === "moreInfo" ||
        seriesNavigationState.focus === "carousel"
    ) {
        // Move focus from buttons/carousel directly to Navbar
        // First, ensure navbar is visible
        const navbarEl = document.querySelector("#navbar-root");
        if (navbarEl) {
            navbarEl.style.display = "block";
        }

        try {
            const seriesContainer = document.querySelector(".series-page-container");
            if (seriesContainer) seriesContainer.scrollTop = 0;
            window.scrollTo({
                top: 0,
                behavior: "smooth",
            });
        } catch (e) {}

        removeAllSeriesFocus();
        saveSeriesNavigationState();
        localStorage.setItem("navigationFocus", "navbar");

        setTimeout(() => {
            // Re-ensure visibility in case something hid it
            const navbarElCheck = document.querySelector("#navbar-root");
            if (navbarElCheck) {
                navbarElCheck.style.display = "block";
            }

            const seriesNavItem = document.querySelector(
                '.nav-item[data-page="seriesPage"]',
            );
            if (seriesNavItem) {
                seriesNavItem.focus();
                seriesNavItem.classList.add("active");
            }
        }, 50);
        return;
    }

    let currentIndex = seriesNavigationState.currentCategoryIndex;
    let currentCardIndex = seriesNavigationState.currentCardIndex;

    let prevCategoryIndex = findNextSeriesCategoryWithSeries(
        currentIndex - 1,
        -1,
    );

    if (prevCategoryIndex !== -1) {
        seriesNavigationState.currentCategoryIndex = prevCategoryIndex;

        let newCategory = getCurrentSeriesCategory();
        if (newCategory) {
            let loadedCount = getSeriesLoadedChunkCount(
                seriesNavigationState.currentCategoryIndex,
            );

            let visiblePosition = getSeriesCurrentVisibleIndex(
                currentIndex,
                currentCardIndex,
            );
            seriesNavigationState.currentCardIndex =
                loadedCount > 0 ? Math.min(visiblePosition, loadedCount - 1) : 0;
        } else {
            seriesNavigationState.currentCardIndex = 0;
        }
        updateSeriesFocus();
    } else {
        // Move to banner or navbar
        if (getSeriesSearchQuery()) {
            // If searching, skip carousel and go straight to navbar
            const navbarEl = document.querySelector("#navbar-root");
            if (navbarEl) {
                navbarEl.style.display = "block";
            }
            try {
                const seriesContainer = document.querySelector(
                    ".series-page-container",
                );
                if (seriesContainer) seriesContainer.scrollTop = 0;
                window.scrollTo({
                    top: 0,
                    behavior: "smooth",
                });
            } catch (e) {}

            removeAllSeriesFocus();
            saveSeriesNavigationState();
            localStorage.setItem("navigationFocus", "navbar");

            setTimeout(() => {
                const navbarElCheck = document.querySelector("#navbar-root");
                if (navbarElCheck) {
                    navbarElCheck.style.display = "block";
                }
                const seriesNavItem = document.querySelector(
                    '.nav-item[data-page="seriesPage"]',
                );
                if (seriesNavItem) {
                    seriesNavItem.focus();
                    seriesNavItem.classList.add("active");
                }
            }, 50);
        } else {
            // Normal behavior: Move to banner
            seriesNavigationState.focus = "watchNow";
            seriesNavigationState.isHeartFocused = false;

            // Ensure container is scrolled up to see the banner
            const container = document.querySelector(".series-page-container");
            if (container) container.scrollTop = 0;

            updateSeriesFocus();
        }
    }
}

function loadMoreSeriesForCategory(categoryIndex) {
    if (seriesChunkLoadingState.isLoading) return;

    let categories = window.allSeriesCategories || [];
    if (categoryIndex < 0 || categoryIndex >= categories.length) return;

    let category = categories[categoryIndex];
    if (!category) return;

    let loadedCount = getSeriesLoadedChunkCount(categoryIndex);
    let totalSeries = category.series ? category.series.length : 0;

    if (loadedCount >= totalSeries) {
        let cardList = document.querySelector(
            '.series-card-list[data-category="' + categoryIndex + '"]',
        );
        if (cardList) {
            let loadingEl = cardList.querySelector(".series-loading-indicator");
            if (loadingEl) {
                loadingEl.remove();
            }
        }
        return;
    }

    seriesChunkLoadingState.isLoading = true;

    // 🔴 UX Improvement: Show loader immediately
    let cardListForLoader = document.querySelector(
        '.series-card-list[data-category="' + categoryIndex + '"]',
    );
    if (cardListForLoader) {
        let existing = cardListForLoader.querySelector(".series-loading-indicator");
        if (!existing) {
            cardListForLoader.insertAdjacentHTML(
                "beforeend",
                createSeriesLoadingIndicator(categoryIndex),
            );
        }
    }

    // Unified Loader Logic:
    let cardList = document.querySelector(
        '.series-card-list[data-category="' + categoryIndex + '"]',
    );
    if (!cardList) {
        seriesChunkLoadingState.isLoading = false;
        return;
    }

    // Ensure one loader exists (double check)
    let existingLoading = cardList.querySelector(".series-loading-indicator");
    if (!existingLoading) {
        cardList.insertAdjacentHTML(
            "beforeend",
            createSeriesLoadingIndicator(categoryIndex),
        );
    }

    let safetyTimeout = setTimeout(function() {
        if (seriesChunkLoadingState.isLoading) {
            console.warn(
                "loadMoreSeriesForCategory: Safety timeout triggered, resetting loading state",
            );
            seriesChunkLoadingState.isLoading = false;
            let cardList = document.querySelector(
                '.series-card-list[data-category="' + categoryIndex + '"]',
            );
            if (cardList) {
                let loadingEl = cardList.querySelector(".series-loading-indicator");
                if (loadingEl) {
                    loadingEl.remove();
                }
            }
        }
    }, 3000);

    setTimeout(function() {
        try {
            let cardList = document.querySelector(
                '.series-card-list[data-category="' + categoryIndex + '"]',
            );
            if (!cardList) {
                clearTimeout(safetyTimeout);
                seriesChunkLoadingState.isLoading = false;
                return;
            }

            let newCardsHTML = loadSeriesChunk(category, categoryIndex);

            let loadingEl = cardList.querySelector(".series-loading-indicator");
            if (loadingEl) {
                loadingEl.remove();
            }

            if (newCardsHTML) {
                cardList.insertAdjacentHTML("beforeend", newCardsHTML);

                if (seriesNavigationState.currentCategoryIndex === categoryIndex) {
                    updateSeriesFocus();
                }
            }

            clearTimeout(safetyTimeout);
            seriesChunkLoadingState.isLoading = false;
        } catch (e) {
            console.error("Error in loadMoreSeriesForCategory:", e);
            clearTimeout(safetyTimeout);
            seriesChunkLoadingState.isLoading = false;

            let cardList = document.querySelector(
                '.series-card-list[data-category="' + categoryIndex + '"]',
            );
            if (cardList) {
                let loadingEl = cardList.querySelector(".series-loading-indicator");
                if (loadingEl) {
                    loadingEl.remove();
                }
            }
        }
    }, 100);
}

function removeAllSeriesFocus() {
    clearSeriesFocusFast("focused");
    clearSeriesFocusFast("marquee-active");
    currentFocusedSeriesElement = null;
}

function updateSeriesFocus() {
    if (localStorage.getItem("navigationFocus") === "seriesPage") {
        const container = document.querySelector(".series-page-container");
        if (!container) return;

        if (
            seriesNavigationState.focus === "watchNow" ||
            seriesNavigationState.focus === "moreInfo"
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
                seriesNavigationState.focus === "watchNow" ?
                ".carousel-watch-now-btn" :
                ".carousel-fav-btn";

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
                clearSeriesFocusFast("focused");
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

        if (seriesNavigationState.focus === "carousel") {
            clearSeriesFocusFast("focused");
            try {
                container.scrollTop = 0;
            } catch (e) {}
            return;
        }

        if (seriesCategoryHasSeries(seriesNavigationState.currentCategoryIndex)) {
            const container = document.querySelector(".series-page-container");
            const currentCard = container ?
                container.querySelector(
                    '.series-card[data-category="' +
                    seriesNavigationState.currentCategoryIndex +
                    '"][data-index="' +
                    seriesNavigationState.currentCardIndex +
                    '"]',
                ) :
                null;

            if (currentCard) {
                // Fast class management
                if (
                    currentFocusedSeriesElement &&
                    currentFocusedSeriesElement !== currentCard
                ) {
                    currentFocusedSeriesElement.classList.remove("focused");
                    const oldTitle = currentFocusedSeriesElement.querySelector(
                        ".series-title-marquee",
                    );
                    if (oldTitle) oldTitle.classList.remove("marquee-active");
                }

                currentCard.classList.add("focused");
                currentFocusedSeriesElement = currentCard;
                scrollToSeriesElement(currentCard);

                // Show navbar when focused on first category (any card in category 0)
                if (!seriesNavRootElement) {
                    seriesNavRootElement = document.querySelector("#navbar-root");
                }
                if (seriesNavRootElement) {
                    seriesNavRootElement.style.display =
                        seriesNavigationState.currentCategoryIndex === 0 ? "block" : "none";
                }

                seriesNavigationState.lastFocusedCategory =
                    seriesNavigationState.currentCategoryIndex;
                seriesNavigationState.lastFocusedCard =
                    seriesNavigationState.currentCardIndex;

                activateSeriesMarquee(currentCard);
            }
        }
    }
}

function activateSeriesMarquee(card) {
    if (!card) return;

    // Use requestAnimationFrame to separate layout read from the navigation event loop.
    // This allows the focus to move INSTANTLY, and the marquee calculation helps 1 frame later.
    requestAnimationFrame(() => {
        // Critical Optimization: If the user has already moved away (rapid scrolling),
        // DO NOT measure layout. This saves massive CPU on Tizen.
        if (!card.classList.contains("focused")) return;

        const titleElement = card.querySelector(".series-title-marquee");
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

function scrollToSeriesElement(element) {
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
                console.log("Series scroll failed");
            }
        }
    }
}

function saveSeriesNavigationState() {
    try {
        localStorage.setItem(
            "seriesNavState",
            JSON.stringify({
                currentCategoryIndex: seriesNavigationState.currentCategoryIndex,
                currentCardIndex: seriesNavigationState.currentCardIndex,
                lastFocusedCategory: seriesNavigationState.lastFocusedCategory,
                lastFocusedCard: seriesNavigationState.lastFocusedCard,
                focus: seriesNavigationState.focus,
            }),
        );
    } catch (e) {
        console.log("Error saving series navigation state:", e);
    }
}

function restoreSeriesNavigationState() {
    try {
        let saved = localStorage.getItem("seriesNavState");
        if (saved) {
            let state = JSON.parse(saved);
            seriesNavigationState.currentCategoryIndex =
                state.currentCategoryIndex || 0;
            seriesNavigationState.currentCardIndex = state.currentCardIndex || 0;
            seriesNavigationState.lastFocusedCategory =
                state.lastFocusedCategory || 0;
            seriesNavigationState.lastFocusedCard = state.lastFocusedCard || 0;
            seriesNavigationState.focus = state.focus || "categories";

            // Loader is already present from the main page render if we are restoring state.
            // No need to add a new one.

            setTimeout(() => {
                validateAndAdjustRestoredSeriesState();
            }, 100);
        }
    } catch (e) {
        console.log("Error restoring series navigation state:", e);
        // Ensure loader is removed if restoration fails
        const loader = document.getElementById("series-page-loader");
        if (loader) loader.remove();
    }
}

function doesSeriesCardExist(categoryIndex, cardIndex) {
    let cardList = document.querySelector(
        '.series-card-list[data-category="' + categoryIndex + '"]',
    );
    if (!cardList) return false;

    let card = cardList.querySelector(
        '.series-card[data-index="' + cardIndex + '"]',
    );
    return card !== null;
}

function validateAndAdjustRestoredSeriesState() {
    let targetCategoryIndex = seriesNavigationState.currentCategoryIndex;
    let targetCardIndex = seriesNavigationState.currentCardIndex;
    let allCategories = window.allSeriesCategories || [];

    // 1. Ensure Category is Loaded
    if (!seriesCategoryHasSeries(targetCategoryIndex)) {
        if (targetCategoryIndex < allCategories.length) {
            let container = document.querySelector(".series-page-container");
            if (container) {
                let currentLoaded = seriesChunkLoadingState.loadedCategories;
                for (let i = currentLoaded; i <= targetCategoryIndex + 2; i++) {
                    if (i >= allCategories.length) break;
                    let category = allCategories[i];
                    if (
                        (category.series && category.series.length > 0) ||
                        category.id === "fav"
                    ) {
                        let categoryHTML = createSeriesCategorySection(category, i);
                        let noResults = container.querySelector(".no-more-categories");
                        if (noResults) noResults.remove();

                        container.insertAdjacentHTML("beforeend", categoryHTML);
                    }
                }
                seriesChunkLoadingState.loadedCategories = Math.max(
                    seriesChunkLoadingState.loadedCategories,
                    targetCategoryIndex + 3,
                );
            }
        }
    }

    // 2. Ensure Card is Loaded (Horizontal)
    if (seriesCategoryHasSeries(targetCategoryIndex)) {
        let currentCategory = allCategories[targetCategoryIndex];
        let loadedCount = getSeriesLoadedChunkCount(targetCategoryIndex);

        if (targetCardIndex >= loadedCount) {
            let cardList = document.querySelector(
                '.series-card-list[data-category="' + targetCategoryIndex + '"]',
            );
            if (cardList) {
                while (
                    getSeriesLoadedChunkCount(targetCategoryIndex) <= targetCardIndex
                ) {
                    let newCardsHTML = loadSeriesChunk(
                        currentCategory,
                        targetCategoryIndex,
                    );
                    if (!newCardsHTML) break;

                    let loadingEl = cardList.querySelector(".series-loading-indicator");
                    if (loadingEl) loadingEl.remove();
                    cardList.insertAdjacentHTML("beforeend", newCardsHTML);
                }
            }
        }
    }

    // 3. Final Validation
    if (!seriesCategoryHasSeries(seriesNavigationState.currentCategoryIndex)) {
        let nextCategoryIndex = findNextSeriesCategoryWithSeries(0, 1);
        if (nextCategoryIndex !== -1) {
            seriesNavigationState.currentCategoryIndex = nextCategoryIndex;
            seriesNavigationState.currentCardIndex = 0;
        } else {
            seriesNavigationState.currentCategoryIndex = 0;
            seriesNavigationState.currentCardIndex = 0;
        }
    } else {
        let currentCategory = getCurrentSeriesCategory();
        if (currentCategory) {
            let loadedCount = getSeriesLoadedChunkCount(
                seriesNavigationState.currentCategoryIndex,
            );

            if (seriesNavigationState.currentCardIndex >= loadedCount) {
                seriesNavigationState.currentCardIndex = Math.max(0, loadedCount - 1);
            }

            if (
                !doesSeriesCardExist(
                    seriesNavigationState.currentCategoryIndex,
                    seriesNavigationState.currentCardIndex,
                ) &&
                loadedCount < currentCategory.series.length
            ) {
                loadMoreSeriesForCategory(seriesNavigationState.currentCategoryIndex);
            }
        }
    }

    setTimeout(() => {
        const navFocus = localStorage.getItem("navigationFocus");
        if (navFocus === "seriesPage") {
            updateSeriesFocus();
        }

        // Only remove loader if we successfully focused something (or if we timed out waiting)
        const checkFocusAndRemoveLoader = () => {
            const navFocus = localStorage.getItem("navigationFocus");
            const focusedCard = document.querySelector(".series-card.focused");
            if (focusedCard || navFocus !== "seriesPage") {
                const loader = document.getElementById("series-page-loader");
                if (loader) loader.remove();
            } else {
                // Fallback if focus failed for some reason
                setTimeout(() => {
                    const loader = document.getElementById("series-page-loader");
                    if (loader) loader.remove();
                }, 200);
            }
        };

        // Give a simpler small delay to ensure rendering
        setTimeout(checkFocusAndRemoveLoader, 100);
    }, 100);
}

function getCurrentSeriesCategory() {
    let categories = window.allSeriesCategories || [];
    return categories[seriesNavigationState.currentCategoryIndex];
}

function initSeriesNavigation() {
    if (isSeriesNavigationInitialized) {
        cleanupSeriesNavigation();
    }

    const handleCarouselSlideChange = (e) => {
        // Only update focus if we're currently focused on carousel buttons
        if (
            seriesNavigationState.focus === "watchNow" ||
            seriesNavigationState.focus === "moreInfo"
        ) {
            updateSeriesFocus();
        }
    };

    // Store the handler so we can remove it later
    window.seriesCarouselSlideChangeHandler = handleCarouselSlideChange;

    document.addEventListener("keydown", handleSeriesKeyNavigation, true);
    document.addEventListener("keyup", handleSeriesKeyNavigation, true);
    window.addEventListener("carousel-slide-changed", handleCarouselSlideChange);
    isSeriesNavigationInitialized = true;
}

function hasAnySeriesCategoryData() {
    let categories = window.allSeriesCategories || [];
    for (let i = 0; i < categories.length; i++) {
        if (categories[i].series && categories[i].series.length > 0) {
            return true;
        }
    }
    return false;
}

function validateSeriesData() {
    // Clean up window.allSeriesStreams
    if (window.allSeriesStreams && Array.isArray(window.allSeriesStreams)) {
        window.allSeriesStreams = window.allSeriesStreams.filter(
            (series) =>
            series !== null && series !== undefined && typeof series === "object",
        );
    }

    // Clean up window.allseriesCategories
    if (window.allseriesCategories && Array.isArray(window.allseriesCategories)) {
        window.allseriesCategories = window.allseriesCategories.filter(
            (category) =>
            category !== null &&
            category !== undefined &&
            typeof category === "object",
        );
    }
}

function SeriesPage() {
    validateSeriesData();

    const currentSort = localStorage.getItem("sortvalue") || "default";
    window.__seriesLastSortType = currentSort;

    // Check if there's no initial data and return early
    if (
        !window.allSeriesStreams ||
        !window.allseriesCategories ||
        window.allSeriesStreams.length == 0 ||
        window.allseriesCategories.length == 0
    ) {
        let loadingHTML = `
      <div class="series-page-container">
        <div class="no-data-container">
          <div class="no-data-content">
            <h2>No Data Available</h2>
            <p>No series found</p>
          </div>
        </div>
      </div>
    `;

        const prevPage = localStorage.getItem("previousPage");
        if (prevPage !== "masterSearchPage") {
            localStorage.setItem(
                "previousPage",
                localStorage.getItem("currentPage") || "",
            );
        }
        localStorage.setItem("currentPage", "seriesPage");
        const activeEl = document.activeElement;
        const isSearchFocused = activeEl && activeEl.id === "search-input";
        if (!isSearchFocused) {
            localStorage.setItem("navigationFocus", "seriesPage");
        }

        return loadingHTML;
    }

    let loadingHTML =
        '<div id="series-page-loader" class="custom-page-loader">' +
        '<div class="custom-loader-content">' +
        '<div class="custom-loader-spinner"></div>' +
        "</div>" +
        "</div>";

    const prevPage = localStorage.getItem("previousPage");
    const previousPageVal = localStorage.getItem("currentPage");
    if (prevPage !== "masterSearchPage") {
        localStorage.setItem("previousPage", previousPageVal || "");
    }
    localStorage.setItem("currentPage", "seriesPage");

    const activeEl = document.activeElement;
    const isSearchFocused = activeEl && activeEl.id === "search-input";
    const navFocus = localStorage.getItem("navigationFocus");
    if (!isSearchFocused && navFocus !== "sidebar") {
        // Keep existing seriesPage focus (e.g. when returning from SeriesDetailPage)
        // so we can restore the previously focused card; otherwise default to navbar.
        if (navFocus === "seriesPage" || previousPageVal === "seriesDetailPage") {
            localStorage.setItem("navigationFocus", "seriesPage");
        } else {
            localStorage.setItem("navigationFocus", "navbar");
            // Ensure physical focus is on the navbar link
            setTimeout(() => {
                const navLink = document.querySelector(
                    '.nav-item[data-page="seriesPage"]',
                );
                if (navLink) navLink.focus();
            }, 50);
        }
    }

    favoriteSeriesIds = [];

    setTimeout(async function() {
        const currentPlaylist = getCurrentPlaylist();
        const currentPlaylistFavObjects = currentPlaylist ?
            currentPlaylist.favouriteSeries :
            [];

        // Extract IDs from favorite objects (they store full objects, not just IDs)
        const currentPlaylistFavIds = Array.isArray(currentPlaylistFavObjects) ?
            currentPlaylistFavObjects
            .map((item) => item && (item.series_id || item.id))
            .filter(Boolean) :
            [];

        favoriteSeriesIds = currentPlaylistFavIds || [];

        // Convert favorite IDs to strings for consistent comparison
        const favIdsAsStrings = currentPlaylistFavIds ?
            currentPlaylistFavIds.map((id) => String(id)) :
            [];

        let favouriteSeries =
            window.allSeriesStreams && favIdsAsStrings.length > 0 ?
            filterSeriesByQuery(
                window.allSeriesStreams.filter((s) =>
                    favIdsAsStrings.includes(String(s.series_id)),
                ),
            ) :
            [];
        let popularSeries = window.allSeriesStreams ?
            filterSeriesByQuery(
                window.allSeriesStreams.filter((s) => s.rating_5based > 4),
            ).slice(0, 10) :
            [];

        let recentlyWatchedSeriesIds =
            currentPlaylist && currentPlaylist.continueWatchingSeries ?
            currentPlaylist.continueWatchingSeries
            .filter((m) => m !== null && m !== undefined)
            .map((item) => item.itemId) :
            [];

        let recentSeriesArray =
            window.allSeriesStreams && recentlyWatchedSeriesIds ?
            filterSeriesByQuery(
                window.allSeriesStreams.filter((m) =>
                    recentlyWatchedSeriesIds.includes(m.series_id.toString()),
                ),
            ) :
            [];

        // Pass current sort option to getAPISeriesCategories
        let apiCategories = getAPISeriesCategories(currentSort);

        // Filter categories that have results if search query is active
        if (getSeriesSearchQuery()) {
            apiCategories = apiCategories.filter(
                (cat) => cat.series && cat.series.length > 0,
            );
        }

        // ALWAYS show these two categories at the top, in this specific order
        let fixedTopCategories = [{
                title: "Continue Watching",
                series: recentSeriesArray,
                id: "recent",
                containerClass: "recently-watched-container",
            },
            {
                title: "My Fav",
                series: favouriteSeries,
                id: "fav",
                containerClass: "series-fav-container",
            },
        ];

        // ALWAYS show these two categories at the top, in this specific order
        let initialCategories = fixedTopCategories.filter((category) => {
            if (category.id === "fav" || category.id === "recent") return true; // Keep indices stable
            return category.series && category.series.length > 0;
        });

        // Add the first few API categories after the fixed ones
        let apiCategoriesToLoad = apiCategories.slice(0, 3);
        initialCategories = initialCategories.concat(apiCategoriesToLoad);

        // Set up the complete categories list (fixed top + all API categories)
        window.allSeriesCategories = initialCategories.concat(
            apiCategories.slice(3),
        );

        seriesChunkLoadingState.loadedCategories = initialCategories.length;
        seriesChunkLoadingState.loadedChunks = {};
        seriesChunkLoadingState.isLoading = false;

        const carouselHtml = getSeriesSearchQuery() ?
            "" :
            await HomeCarousel("series");

        let searchQuery = getSeriesSearchQuery();
        let html = `<div class="series-page-container" ${searchQuery ? 'style="padding-top: 200px;"' : ""}>`;
        if (carouselHtml) {
            html += `<div class="home-poster">${carouselHtml}</div>`;
        }

        for (let i = 0; i < initialCategories.length; i++) {
            let category = initialCategories[i];
            if (
                (category.series && category.series.length > 0) ||
                category.id === "fav"
            ) {
                html += createSeriesCategorySection(category, i);
            }
        }

        if (searchQuery) {
            const resultsFound = window.allSeriesCategories.some(
                (cat) => cat.series && cat.series.length > 0,
            );
            if (!resultsFound) {
                html += createSeriesNoSearchMessage(searchQuery);
            }
        }

        let hasMoreCategories = false;
        for (
            let i = initialCategories.length; i < window.allSeriesCategories.length; i++
        ) {
            let category = window.allSeriesCategories[i];
            if (category && category.series && category.series.length > 0) {
                hasMoreCategories = true;
                break;
            }
        }

        // Removed loading indicator - categories load quickly enough without it

        html += "</div>";

        let container = document.querySelector("#series-page-loader");
        const hasSavedState = localStorage.getItem("seriesNavState");

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
            const pageEl = document.getElementById("series-page");
            if (pageEl) {
                pageEl.insertAdjacentHTML("beforeend", html);
            }
        }

        // Initialize carousel logic now that elements are in the DOM
        if (window.initHomeCarouselLogic) {
            window.initHomeCarouselLogic();
        }

        restoreSeriesNavigationState();

        setTimeout(function() {
            initSeriesNavigation();
        }, 100);
    }, 500);

    return loadingHTML;
}

document.addEventListener("sortChanged", function(e) {
    const {
        sortType,
        page
    } = e.detail;

    if (page === "seriesPage") {
        // Avoid "reload" when dropdown closes or same sort is re-selected
        if (window.__seriesLastSortType === sortType) return;
        window.__seriesLastSortType = sortType;

        if (typeof window.rerenderSeriesPage === "function") {
            Router.showPage("seriesPage");
        }
    }
});

function focusFirstSeriesCard() {
    // Find first category with series
    let categories = window.allSeriesCategories || [];
    let foundIndex = -1;
    for (let i = 0; i < categories.length; i++) {
        if (seriesCategoryHasSeries(i)) {
            foundIndex = i;
            break;
        }
    }

    if (foundIndex !== -1) {
        seriesNavigationState.focus = "categories";
        seriesNavigationState.currentCategoryIndex = foundIndex;
        seriesNavigationState.currentCardIndex = 0;
        updateSeriesFocus();
    }
}

window.cleanupSeriesNavigation = cleanupSeriesNavigation;
window.seriesNavigationState = seriesNavigationState;
window.updateSeriesFocus = updateSeriesFocus;
window.saveSeriesNavigationState = saveSeriesNavigationState;
window.rerenderSeriesPage = SeriesPage;
window.updateSeriesPageFavorites = updateMyFavSeriesCategoryRealtime;
window.updateAllSeriesCardsHeartDisplay = updateAllSeriesCardsHeartDisplay;
window.focusFirstSeriesCard = focusFirstSeriesCard;