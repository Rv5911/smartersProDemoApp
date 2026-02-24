async function HomeCarousel(contentType = "movie") {
  // Determine current playlist name for cache sensitivity
  let isOnDetailPage=localStorage.getItem("currentPage")=="movieDetailPage" || localStorage.getItem("currentPage")=="seriesDetailPage" ? true : false;
  let currentPlaylistName = "default";
  try {
    const sel = JSON.parse(localStorage.getItem("selectedPlaylist") || "null");
    if (sel && sel.playlistName) currentPlaylistName = sel.playlistName;
  } catch (e) {}

  const cacheKey = `homeCarouselCachedSliderData_${contentType}`;

  // Check if we have valid cached data for the CURRENT playlist and content type
  if (
    window[cacheKey] &&
    window.homeCarouselCachedPlaylistName === currentPlaylistName &&
    Array.isArray(window[cacheKey]) &&
    window[cacheKey].length > 0
  ) {
    console.log(
      "HomeCarousel: Using cached slider data for",
      currentPlaylistName,
      contentType,
    );
    const sliderData = window[cacheKey];
    window.homeCarouselSliderData = sliderData;

    // Re-setup carousel functionality after DOM is ready
    setupCarouselLogic();

    return renderCarouselHtml(sliderData);
  }

  // Use correct stream source based on contentType
  let allStreams = [];
  if (contentType === "movie") {
    allStreams = window.allMoviesStreams || [];
  } else if (contentType === "series") {
    allStreams = window.allSeriesStreams || [];
  }

  // Filter out adult content if needed, similar to previous logic
  let filteredItems = allStreams.filter((item) => {
    const name = (item.name || "").toLowerCase().trim();
    // Ensure adultsCategories is defined or default to empty array
    const categories =
      typeof adultsCategories !== "undefined" ? adultsCategories : [];

    // Check against keywords
    const isAdult =
      categories.some((keyword) =>
        name.toLowerCase().trim().includes(keyword.toLowerCase().trim()),
      ) || /(adult|xxx|18\+|18\s*plus|sex|porn|nsfw)/i.test(name);

    return !isAdult;
  });

  // Fallback if no items found
  if (filteredItems.length === 0) {
    console.warn("HomeCarousel: No streams found.");
    return `
      <div class="carousel-container">
        <div class="carousel-slides">
          <div class="slide">
            <p>No content available</p>
          </div>
        </div>
      </div>
    `;
  }

  // Get 4 random items
  let randomIndex = 0;
  if (filteredItems.length > 4) {
    randomIndex = Math.floor(Math.random() * (filteredItems.length - 4));
  }
  const selectedItems = filteredItems.slice(randomIndex, randomIndex + 4);

  // Fetch details for all selected items
  const detailsPromises = selectedItems.map((item) =>
    contentType === "movie"
      ? getMovieDetail(item.stream_id)
      : getSeriesDetail(item.series_id),
  );
  const details = await Promise.all(detailsPromises);

  // Filter out any null responses and ensure we have valid data
  const sliderData = details
    .filter((detail) => detail !== null && (detail.info || detail.series_info))
    .map((detail, idx) => {
      return {
        info: detail.info || detail.series_info,
        movie_data:
          detail.movie_data || detail.series_data || selectedItems[idx],
        contentType: contentType,
      };
    });

  // Store in cache
  window[cacheKey] = sliderData;
  window.homeCarouselCachedPlaylistName = currentPlaylistName;
  window.homeCarouselSliderData = sliderData;

  // If no valid details were fetched, return empty carousel
  if (sliderData.length === 0) {
    console.warn("HomeCarousel: No valid movie details found.");
    return `
      <div class="carousel-container">
        <div class="carousel-slides">
          <div class="slide">
            <p>No content available</p>
          </div>
        </div>
      </div>
    `;
  }

  // Immediately register this setup logic so it's available as soon as HomeCarousel is called.
  // This prevents race conditions where pages call it before the internal setTimeout fires.
  window.initHomeCarouselLogic = setupCarouselLogic;
  window.HomeCarousel = HomeCarousel;

  // Setup carousel functionality after DOM is ready
  setupCarouselLogic();

  return renderCarouselHtml(sliderData);

  // --- HELPER FUNCTIONS ---

  function getContinueWatchingIds() {
    try {
      const currentPlaylist = getCurrentPlaylist();
      const list =
        contentType === "movie"
          ? currentPlaylist.continueWatchingMovies
          : currentPlaylist.continueWatchingSeries;

      if (currentPlaylist && list) {
        return list.map((item) => String(item.itemId || item.series_id));
      }
    } catch (e) {}
    return [];
  }

  function setupCarouselLogic() {
    // If there's an existing cleanup, run it immediately to prevent double-intervals during rapid navigation
    if (HomeCarousel.cleanup) {
      HomeCarousel.cleanup();
    }

    setTimeout(function () {
      if (!document.querySelector(`.carousel-${contentType}`)) return;

      // Find all slide containers for this specific content type
      const allContainers = document.querySelectorAll(
        `.carousel-${contentType} .carousel-slides`,
      );
      let slidesContainer = null;

      // Prioritize the visible one (offsetParent is null if display:none)
      for (let el of allContainers) {
        if (el.offsetParent !== null) {
          slidesContainer = el;
          break;
        }
      }

      // Fallback to first if none visible or if only one exists
      if (!slidesContainer && allContainers.length > 0) {
        slidesContainer = allContainers[0];
      }

      if (!slidesContainer) return;

      // Scope lookups to this carousel instance
      const mainContainer = slidesContainer.closest(".carousel-container");
      if (!mainContainer) return;

      const slides = Array.from(slidesContainer.querySelectorAll(".slide"));
      const dots = Array.from(mainContainer.querySelectorAll(".carousel-dot"));
      let activeIndex = 0;

      window.carouselActiveIndex = 0;

      function updateCarousel() {
        if (!slidesContainer) return;
        window.carouselActiveIndex = activeIndex;
        slidesContainer.dataset.activeIndex = activeIndex;

        requestAnimationFrame(() => {
          if (!slidesContainer) return;

          // Use translate3d for hardware acceleration
          // slidesContainer.style.transform = `translate3d(${-activeIndex * 100}%, 0, 0)`;

          // Efficiently update dots and slides
          for (let i = 0; i < dots.length; i++) {
            dots[i].classList.toggle("active", i === activeIndex);
          }
          for (let i = 0; i < slides.length; i++) {
            slides[i].classList.toggle("active", i === activeIndex);
          }

          window.dispatchEvent(
            new CustomEvent("carousel-slide-changed", {
              detail: {
                activeIndex: activeIndex,
              },
            }),
          );
        });
      }

      function goNextSlide() {
        // Guard against page removal
        if (!document.body.contains(slidesContainer)) return;
        activeIndex = (activeIndex + 1) % slides.length;
        updateCarousel();
      }

      let autoSlideInterval;
      window.carouselAutoSlideInterval = null;

      function startAutoSlide() {
        if (slides.length <= 1) return;

        if (autoSlideInterval) {
          clearInterval(autoSlideInterval);
        }

        const focusedEl = document.activeElement;
        const isButtonFocused =
          focusedEl &&
          focusedEl.closest(".carousel-container") &&
          (focusedEl.classList.contains("carousel-watch-now-btn") ||
            focusedEl.classList.contains("carousel-more-info-btn"));

        if (isButtonFocused) return;

        autoSlideInterval = setInterval(() => {
          goNextSlide();
        }, 5000);

        window.carouselAutoSlideInterval = autoSlideInterval;
      }

      function stopAutoSlide() {
        if (autoSlideInterval) {
          clearInterval(autoSlideInterval);
          autoSlideInterval = null;
          window.carouselAutoSlideInterval = null;
        }
      }

      const carouselBtns = Array.from(
        mainContainer.querySelectorAll(
          ".carousel-watch-now-btn, .carousel-fav-btn",
        ),
      );
      carouselBtns.forEach((btn) => {
        btn.addEventListener("focus", () => {
          stopAutoSlide();
        });
        btn.addEventListener("blur", () => {
          // Restart after a short delay to allow for focus move
          setTimeout(() => {
            // Only restart if the carousel container is still in the DOM and visible
            if (
              document.body.contains(slidesContainer) &&
              slidesContainer.offsetParent !== null
            ) {
              startAutoSlide();
            }
          }, 100);
        });
      });

      updateCarousel();
      startAutoSlide();

      // Define cleanup for this specific instance
      const visibilityHandler = () => {
        if (document.visibilityState === "visible") {
          startAutoSlide();
        } else {
          stopAutoSlide();
        }
      };
      document.addEventListener("visibilitychange", visibilityHandler);

      HomeCarousel.cleanup = function () {
        stopAutoSlide();
        document.removeEventListener("visibilitychange", visibilityHandler);
      };
    }, 50);
  }

  function renderCarouselHtml(data) {
    const cwIds = getContinueWatchingIds();
    return `
        <div class="carousel-container carousel-${contentType}">
          <div class="carousel-slides">
            ${data
              .map((item, index) => generateSlide(item, index, cwIds))
              .join("")}
          </div>
          <div class="carousel-dots">
            ${data
              .map(
                (_, index) =>
                  `<div class="carousel-dot ${
                    index === 0 ? "active" : ""
                  }" data-index="${index}"></div>`,
              )
              .join("")}
          </div>
        </div>
      `;
  }

  function generateSlide(item, index, cwIds = []) {
    const backdrop =
      (item.info && item.info.backdrop_path && item.info.backdrop_path[0]) ||
      (item.info && item.info.backdrop) ||
      (item.info && item.info.cover) ||
      "./assets/demo-img-card.png";
    const name =
      (item.info && item.info.name) ||
      (item.movie_data && (item.movie_data.name || item.movie_data.title)) ||
      "Unknown Title";
    const originalRating =
      (item.info && item.info.rating) ||
      (item.movie_data && item.movie_data.rating_5based) ||
      0;

    // Normalize rating to 5-star scale
    // If rating is > 5, assume it's 10-based and divide by 2
    let normalizedRating = parseFloat(originalRating);
    if (normalizedRating > 5) {
      normalizedRating = normalizedRating / 2;
    }
    const rating = normalizedRating.toFixed(1);

    const starsHtml = getStarRatingHtml(normalizedRating);

    const plot =
      (item.info && item.info.plot) ||
      (item.info && item.info.description) ||
      "No description available.";
    const duration =
      contentType === "movie"
        ? formatDuration(item.info && item.info.duration_secs)
        : "";

    const streamId =
      (item.movie_data &&
        (item.movie_data.stream_id || item.movie_data.series_id)) ||
      "";
    const isContinueWatching = cwIds.includes(String(streamId));
    const buttonText = isContinueWatching ? "Resume" : "Play Now";

    const director = (item.info && item.info.director) || "N/A";
    const genre = (item.info && item.info.genre) || "N/A";

    // Favorite state logic
    const favType =
      contentType === "movie" ? "favouriteMovies" : "favouriteSeries";
    const isFavorite =
      typeof isItemFavoriteForPlaylist === "function"
        ? isItemFavoriteForPlaylist(item.movie_data, favType)
        : false;

    return `
        <div class="slide" data-index="${index}">
          <img class="carousel-image" src="${backdrop}" alt="${name}"/>
          <div class="carousel-content">
              <h1 class="carousel-title">${name}</h1>
              <div class="carousel-meta" style="display: ${isOnDetailPage ? "flex" : "none"};">
                  <span class="carousel-rating-stars">
                    ${starsHtml}
                  </span>
                  <span class="carousel-rating-value"  style="display: ${isOnDetailPage ? "flex" : "none"};">${rating}</span>
                  ${
                    duration
                      ? `<span class="carousel-duration"  style="display: ${isOnDetailPage ? "flex" : "none"};"><i class="far fa-clock" style="margin-right: 8px;"></i>${duration}</span>`
                      : ""
                  }
                  <span class="carousel-resolution-badge"  style="display: ${isOnDetailPage ? "flex" : "none"};">HD</span>
              </div>
              <div class="carousel-credits"  style="display: ${isOnDetailPage ? "flex" : "none"};">
                <p><strong>Directed By :</strong> ${director}</p>
                <p><strong>Genre :</strong> ${genre}</p>
              </div>
              <p class="carousel-description">${plot}</p>
              <div class="carousel-actions">
                <button class="carousel-watch-now-btn gradient-btn" tabindex="0" data-stream-id="${streamId}" data-content-type="${contentType}">
                    <i class="fa fa-play"></i>
                    ${buttonText}
                </button>
                <button class="carousel-fav-btn gradient-btn" tabindex="0" data-stream-id="${streamId}" data-content-type="${contentType}">
                    <i class="${isFavorite ? "fas" : "far"} fa-heart" style="color: ${isFavorite ? "white" : "white"}; opacity: ${isFavorite ? "1" : "0.6"};"></i>
                    My Fav
                </button>
              </div>
          </div>
        </div>
      `;
  }

  function formatDuration(durationSecs) {
    if (!durationSecs) return "N/A";
    const hours = Math.floor(durationSecs / 3600);
    const minutes = Math.floor((durationSecs % 3600) / 60);
    return `${hours}h ${minutes}min`;
  }

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
}
