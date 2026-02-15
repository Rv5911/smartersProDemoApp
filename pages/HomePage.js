async function HomePage() {
  const selectedPlaylistData = localStorage.getItem("selectedPlaylist")
    ? JSON.parse(localStorage.getItem("selectedPlaylist"))
    : {};

  // Create and show custom home page loader immediately
  const homeLoader = document.createElement("div");
  homeLoader.id = "home-page-loader";
  homeLoader.innerHTML = `
    <div class="home-loader-content">
      <div class="home-loader-spinner"></div>
    </div>
  `;
  document.body.appendChild(homeLoader);

  // Function to update loader progress
  window.updateHomeLoaderProgress = function (percentage) {
    const percentageEl = document.getElementById("home-loader-percentage");
    const barFillEl = document.getElementById("home-loader-bar-fill");
    if (percentageEl) {
      percentageEl.textContent = Math.round(percentage) + "%";
    }
    if (barFillEl) {
      barFillEl.style.width = percentage + "%";
    }
  };

  // Simulate initial progress
  window.updateHomeLoaderProgress(10);

  setTimeout(function () {
    if (HomePage.cleanup) HomePage.cleanup();
    const loadingEl = document.querySelector("#loading-overlay");
    if (loadingEl) {
      loadingEl.style.background = "rgba(0, 0, 0, 0.7)";
      loadingEl.style.marginTop = "0px";
    }

    // Navigation state
    let navState = {
      focus: "carousel", // 'carousel', 'watchNow', 'favButton', 'categories'
      currentCategory: 0,
      currentCard: 0,
      carouselStopped: false,
    };

    let enterKeyState = {
      isPressed: false,
      pressStartTime: 0,
      longPressThreshold: 500,
      timeoutId: null,
    };

    function scrollToHomeElement(element) {
      if (!element) return;
      try {
        element.scrollIntoView({
          block: "center",
          inline: "nearest",
        });
      } catch (e) {
        try {
          element.scrollIntoView();
        } catch (error) {}
      }
    }

    function updateFocus() {
      // Localized focus clearing is faster and avoids flicker
      const container = document.querySelector(".home-page-container");
      if (!container) return;

      // Clear ALL focused elements in the container to prevent dual focus
      container
        .querySelectorAll(".focused")
        .forEach((el) => el.classList.remove("focused"));

      if (navState.focus === "watchNow" || navState.focus === "favButton") {
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

        let btnClass = "";
        if (navState.focus === "watchNow") {
          btnClass = ".carousel-watch-now-btn";
        } else if (navState.focus === "favButton") {
          btnClass = ".carousel-fav-btn";
        }

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
          btn.classList.add("focused");
          btn.focus({
            preventScroll: true,
          });
        }
      } else if (navState.focus === "categories") {
        const currentCard = container.querySelector(
          `.home-card[data-category="${navState.currentCategory}"][data-index="${navState.currentCard}"]`,
        );
        if (currentCard) {
          currentCard.classList.add("focused");
          currentCard.focus();
          scrollToHomeElement(currentCard);

          // Marquee logic
          const title = currentCard.querySelector(".home-title-marquee");
          if (title) {
            title.classList.remove("marquee-active");
            title.removeAttribute("data-marquee");
            title.style.removeProperty("--duration");
            if (title.scrollWidth > title.clientWidth) {
              // Duplicate-text marquee (seamless loop) + slower pace
              title.setAttribute("data-marquee", title.textContent || "");
              const pxPerSecond = 70; // lower = slower
              const durationSeconds = Math.max(
                10,
                Math.round(title.scrollWidth / pxPerSecond),
              );
              title.style.setProperty("--duration", `${durationSeconds}s`);
              title.classList.add("marquee-active");
            }
          }
        }
      }
    }

    function updateAllHomeCardsHeartDisplay(id, type, isFav) {
      const idStr = String(id);
      document
        .querySelectorAll(
          `.home-card[data-stream-id="${idStr}"][data-type="${type}"]`,
        )
        .forEach((card) => {
          const icon = card.querySelector(".home-card-heart");
          if (icon) {
            if (isFav) {
              icon.classList.remove("far");
              icon.classList.add("fas");
            } else {
              icon.classList.remove("fas");
              icon.classList.add("far");
            }
          }
        });
    }

    function updateHomeFavCategoryRealtime(item, isFav) {
      let favContainer = document.querySelector(".home-fav-container");
      const idStr = String(item.stream_id || item.series_id);
      const type = item.type || "movie";

      // Resolve the item from global streams to ensure we have correct image/fields
      let resolvedItem = item;
      if (type === "movie") {
        const found = (window.allMoviesStreams || []).find(
          (m) => String(m.stream_id) === idStr,
        );
        if (found)
          resolvedItem = {
            ...found,
            type: "movie",
          };
      } else {
        const found = (window.allSeriesStreams || []).find(
          (s) => String(s.series_id) === idStr,
        );
        if (found)
          resolvedItem = {
            ...found,
            type: "series",
          };
      }

      if (isFav) {
        // If container doesn't exist, create it
        if (!favContainer) {
          const homePageContainer = document.querySelector(
            ".home-page-container",
          );
          if (homePageContainer) {
            const newContainerHTML = `
                            <div class="home-fav-container">
                                <h1>My Fav</h1>
                                <div class="home-card-list" data-category="1"></div>
                            </div>
                        `;

            // Insert logic: order is Recent(1) -> Fav(0) -> Added(2)
            // Try to insert after Recent
            const recentContainer = homePageContainer.querySelector(
              ".home-recent-container",
            );
            if (recentContainer) {
              recentContainer.insertAdjacentHTML("afterend", newContainerHTML);
            } else {
              // If no recent, try to insert before Added
              const addedContainer = homePageContainer.querySelector(
                ".home-recently-added-container",
              );
              if (addedContainer) {
                addedContainer.insertAdjacentHTML(
                  "beforebegin",
                  newContainerHTML,
                );
              } else {
                // If neither, insert after poster
                const poster = homePageContainer.querySelector(".home-poster");
                if (poster) {
                  poster.insertAdjacentHTML("afterend", newContainerHTML);
                } else {
                  // Fallback
                  homePageContainer.insertAdjacentHTML(
                    "beforeend",
                    newContainerHTML,
                  );
                }
              }
            }
            favContainer = document.querySelector(".home-fav-container");
          }
        }

        if (!favContainer) return;

        const favList = favContainer.querySelector(".home-card-list");
        if (!favList) return;

        // Check if already in list
        if (
          !favList.querySelector(
            `.home-card[data-stream-id="${idStr}"][data-type="${type}"]`,
          )
        ) {
          const newIndex = favList.querySelectorAll(".home-card").length;
          const cardHTML = createHomeCard(resolvedItem, 0, newIndex);
          favList.insertAdjacentHTML("beforeend", cardHTML);
        }
      } else {
        if (!favContainer) return;

        const favList = favContainer.querySelector(".home-card-list");
        if (!favList) return;

        const cardToRemove = favList.querySelector(
          `.home-card[data-stream-id="${idStr}"][data-type="${type}"]`,
        );

        if (cardToRemove) {
          const wasFocused = cardToRemove.classList.contains("focused");
          cardToRemove.remove();

          // Re-index
          const remainingCards = favList.querySelectorAll(".home-card");
          remainingCards.forEach((c, idx) => {
            c.setAttribute("data-index", idx);
          });

          // If list empty, remove container
          if (remainingCards.length === 0) {
            favContainer.remove();
            // If we were in this category, move focus
            if (navState.currentCategory === 1) {
              // Try moving to Recent (0) or Added (2) or WatchNow
              navState.currentCategory = 0;
              navState.currentCard = 0;

              // Check if cat 0 exists
              if (
                !document.querySelector('.home-card-list[data-category="0"]')
              ) {
                navState.currentCategory = 2; // Try added
                if (
                  !document.querySelector('.home-card-list[data-category="2"]')
                ) {
                  navState.focus = "watchNow"; // Fallback to top
                }
              }
              updateFocus();
            }
          } else {
            // If we removed the currently focused card in Fav row, adjust navState
            if (wasFocused && navState.currentCategory === 1) {
              if (navState.currentCard >= remainingCards.length) {
                navState.currentCard = Math.max(0, remainingCards.length - 1);
              }
              updateFocus();
            }
          }
        }
      }
    }

    function toggleHomeFavorite() {
      const currentCard = document.querySelector(
        `.home-card[data-category="${navState.currentCategory}"][data-index="${navState.currentCard}"]`,
      );
      if (!currentCard) return;

      const streamId = currentCard.getAttribute("data-stream-id");
      const type = currentCard.getAttribute("data-type");
      const isMovie = type === "movie";
      const nameEl = currentCard.querySelector(".home-title-marquee");
      const name = nameEl ? nameEl.textContent : "";

      const ratingEl = currentCard.querySelector(".home-card-rating");
      const rating = ratingEl ? ratingEl.textContent.trim() : "0";

      const item = {
        stream_id: streamId,
        series_id: streamId,
        name: name,
        type: type,
        rating_5based: rating,
        stream_icon: currentCard.getAttribute("data-image-url"),
      };

      const typeKey = isMovie ? "favouriteMovies" : "favouriteSeries";
      const result = toggleFavoriteItem(item, typeKey);

      if (result && result.success) {
        const isNowFav = result.isFav;

        if (window.showToaster) {
          showToaster(
            isNowFav
              ? `${isMovie ? "Movie" : "Series"} added to favorites`
              : `${isMovie ? "Movie" : "Series"} removed from favorites`,
            isNowFav ? "success" : "info",
          );
        }

        updateAllHomeCardsHeartDisplay(streamId, type, isNowFav);
        updateHomeFavCategoryRealtime(item, isNowFav);

        // Cross-page Sync: Notify other pages
        if (type === "movie") {
          if (window.updateMoviesPageFavorites)
            window.updateMoviesPageFavorites(streamId, isNowFav);
          if (window.updateAllMovieCardsHeartDisplay)
            window.updateAllMovieCardsHeartDisplay(streamId, isNowFav);
        } else if (type === "series") {
          if (window.updateSeriesPageFavorites)
            window.updateSeriesPageFavorites(streamId, isNowFav);
          if (window.updateAllSeriesCardsHeartDisplay)
            window.updateAllSeriesCardsHeartDisplay(streamId, isNowFav);
        }
      }
    }

    function stopCarousel() {
      if (HomeCarousel.cleanup) HomeCarousel.cleanup();
      navState.carouselStopped = true;
    }

    function homePageKeydownEvents(e) {
      const key = e.key;
      if (localStorage.getItem("navigationFocus") !== "homePage") return;

      switch (key) {
        case "ArrowDown":
          e.preventDefault();
          if (navState.focus === "carousel") {
            navState.focus = "watchNow";
            updateFocus();
            return;
          }
          if (
            navState.focus === "watchNow" ||
            navState.focus === "moreInfo" ||
            navState.focus === "favButton"
          ) {
            // Remove focus from carousel buttons
            document
              .querySelectorAll(
                ".carousel-watch-now-btn.focused, .carousel-more-info-btn.focused, .carousel-fav-btn.focused",
              )
              .forEach((btn) => {
                btn.classList.remove("focused");
              });

            const firstCard = document.querySelector(".home-card");
            if (firstCard) {
              stopCarousel();
              navState.focus = "categories";
              navState.currentCategory = parseInt(
                firstCard.getAttribute("data-category"),
              );
              navState.currentCard = parseInt(
                firstCard.getAttribute("data-index"),
              );
              navState.isHeartFocused = false;
              updateFocus();
            }
            return;
          } else if (navState.focus === "categories") {
            const allLists = document.querySelectorAll(
              ".home-card-list[data-category]",
            );
            const available = Array.from(allLists)
              .map((l) => parseInt(l.getAttribute("data-category")))
              .filter((id) => {
                const l = document.querySelector(
                  `.home-card-list[data-category="${id}"]`,
                );
                return l && l.querySelectorAll(".home-card").length > 0;
              })
              .sort((a, b) => {
                const order = [0, 1, 2, 3];
                return order.indexOf(a) - order.indexOf(b);
              });

            const idx = available.indexOf(navState.currentCategory);
            if (idx < available.length - 1) {
              navState.currentCategory = available[idx + 1];
              const list = document.querySelector(
                `.home-card-list[data-category="${navState.currentCategory}"]`,
              );
              const count = list
                ? list.querySelectorAll(".home-card").length
                : 0;
              navState.currentCard = Math.min(navState.currentCard, count - 1);
              updateFocus();
            }
          }
          break;

        case "ArrowUp":
          e.preventDefault();
          if (navState.focus === "carousel") {
            // From carousel, go to navbar
            localStorage.setItem("navigationFocus", "navbar");
            setTimeout(() => {
              const item = document.querySelector(
                '.nav-item[data-page="homePage"]',
              );
              if (item) {
                item.focus();
                item.classList.add("active");
              }
            }, 50);
            return;
          } else if (
            navState.focus === "watchNow" ||
            navState.focus === "moreInfo" ||
            navState.focus === "favButton"
          ) {
            // Remove focus from buttons
            document
              .querySelectorAll(
                ".carousel-watch-now-btn.focused, .carousel-more-info-btn.focused, .carousel-fav-btn.focused",
              )
              .forEach((btn) => {
                btn.classList.remove("focused");
              });

            // Ensure scroll to top for visibility
            try {
              const homeContainer = document.querySelector(
                ".home-page-container",
              );
              if (homeContainer) homeContainer.scrollTop = 0;
              window.scrollTo(0, 0);
            } catch (err) {}

            // Go directly to navbar
            localStorage.setItem("navigationFocus", "navbar");
            setTimeout(() => {
              const item = document.querySelector(
                '.nav-item[data-page="homePage"]',
              );
              if (item) {
                item.focus();
                item.classList.add("active");
              }
              // Fallback if specific item not found
              else {
                const firstNav = document.querySelector(".nav-item");
                if (firstNav) {
                  firstNav.focus();
                  firstNav.classList.add("active");
                }
              }
            }, 50);

            return;
          } else if (navState.focus === "categories") {
            const allLists = document.querySelectorAll(
              ".home-card-list[data-category]",
            );
            const available = Array.from(allLists)
              .map((l) => parseInt(l.getAttribute("data-category")))
              .filter((id) => {
                const l = document.querySelector(
                  `.home-card-list[data-category="${id}"]`,
                );
                return l && l.querySelectorAll(".home-card").length > 0;
              })
              .sort((a, b) => {
                const order = [0, 1, 2, 3];
                return order.indexOf(a) - order.indexOf(b);
              });

            const idx = available.indexOf(navState.currentCategory);
            if (idx > 0) {
              navState.currentCategory = available[idx - 1];
              const list = document.querySelector(
                `.home-card-list[data-category="${navState.currentCategory}"]`,
              );
              const count = list
                ? list.querySelectorAll(".home-card").length
                : 0;
              navState.currentCard = Math.min(navState.currentCard, count - 1);
              updateFocus();
            } else {
              navState.focus = "watchNow";
              updateFocus();

              // Scroll to top to make Watch Now button visible (Tizen compatible)
              try {
                const homeContainer = document.querySelector(
                  ".home-page-container",
                );
                if (homeContainer) {
                  homeContainer.scrollTop = 0;
                }
                // Use basic scrollTo for old Tizen TV compatibility
                window.scrollTo(0, 0);
              } catch (err) {
                console.log("Scroll to top failed:", err);
              }
            }
          }
          break;

        case "ArrowRight":
          e.preventDefault();
          if (navState.focus === "watchNow") {
            navState.focus = "favButton";
            updateFocus();
          } else if (navState.focus === "categories") {
            const list = document.querySelector(
              `.home-card-list[data-category="${navState.currentCategory}"]`,
            );
            const cards = list ? list.querySelectorAll(".home-card") : [];
            if (navState.currentCard < cards.length - 1) {
              navState.currentCard++;
              updateFocus();
            }
          }
          break;

        case "ArrowLeft":
          e.preventDefault();
          if (navState.focus === "favButton") {
            navState.focus = "watchNow";
            updateFocus();
          } else if (navState.focus === "categories") {
            if (navState.currentCard > 0) {
              navState.currentCard--;
              updateFocus();
            }
          }
          break;

        case "Enter":
          e.preventDefault();
          if (navState.focus === "favButton") {
            const activeEl = document.activeElement;
            const streamIdRaw = activeEl
              ? activeEl.getAttribute("data-stream-id")
              : null;
            const contentType = activeEl
              ? activeEl.getAttribute("data-content-type")
              : "movie";

            const data = (window.homeCarouselSliderData || []).find(
              (d) =>
                d &&
                d.movie_data &&
                String(d.movie_data.stream_id || d.movie_data.series_id) ===
                  String(streamIdRaw),
            );

            if (!data || !data.movie_data) return;

            const streamId =
              data.movie_data.stream_id || data.movie_data.series_id;
            const type = contentType || "movie"; // Use contentType from activeEl
            const typeKey =
              type === "movie" ? "favouriteMovies" : "favouriteSeries";

            const result = toggleFavoriteItem(data.movie_data, typeKey);
            if (result && result.success) {
              const isNowFav = result.isFav;

              // Invalidate Carousel Cache
              const cacheKey = `homeCarouselCachedSliderData_${type}`;
              if (window[cacheKey]) delete window[cacheKey];
              if (window.showToaster) {
                showToaster(
                  isNowFav
                    ? `${type === "movie" ? "Movie" : "Series"} added to favorites`
                    : `${type === "movie" ? "Movie" : "Series"} removed from favorites`,
                  isNowFav ? "success" : "info",
                );
              }

              // Update the heart icon in the carousel (for all slides matching this ID)
              document
                .querySelectorAll(
                  `.carousel-fav-btn[data-stream-id="${streamId}"] i`,
                )
                .forEach((icon) => {
                  icon.className = isNowFav ? "fas fa-heart" : "far fa-heart";
                  icon.style.color = isNowFav ? "#ff4d4d" : "white";
                  icon.style.opacity = isNowFav ? "1" : "0.6";
                });

              // Ensure type is set on the data passed to real-time update
              data.movie_data.type = type;
              updateAllHomeCardsHeartDisplay(streamId, type, isNowFav);
              updateHomeFavCategoryRealtime(data.movie_data, isNowFav);

              // Cross-page Sync: Notify other pages
              if (type === "movie") {
                if (window.updateMoviesPageFavorites)
                  window.updateMoviesPageFavorites(streamId, isNowFav);
                if (window.updateAllMovieCardsHeartDisplay)
                  window.updateAllMovieCardsHeartDisplay(streamId, isNowFav);
              } else if (type === "series") {
                if (window.updateSeriesPageFavorites)
                  window.updateSeriesPageFavorites(streamId, isNowFav);
                if (window.updateAllSeriesCardsHeartDisplay)
                  window.updateAllSeriesCardsHeartDisplay(streamId, isNowFav);
              }
            }
            return;
          } else if (navState.focus === "watchNow") {
            const activeEl = document.activeElement;
            const streamIdRaw = activeEl
              ? activeEl.getAttribute("data-stream-id")
              : null;

            const data = (window.homeCarouselSliderData || []).find(
              (d) =>
                d &&
                d.movie_data &&
                String(d.movie_data.stream_id || d.movie_data.series_id) ===
                  String(streamIdRaw),
            );

            if (!data || !data.movie_data) return;

            const playlist = JSON.parse(
              localStorage.getItem("currentPlaylistData") || "{}",
            );
            const url = playlist.server_info
              ? `${playlist.server_info.server_protocol}://${playlist.server_info.url}:${playlist.server_info.port}/movie/${playlist.user_info.username}/${playlist.user_info.password}/${data.movie_data.stream_id}.${data.movie_data.container_extension}`
              : "";

            localStorage.setItem(
              "playingItemData",
              JSON.stringify(data.movie_data),
            );
            localStorage.setItem("selectedVideoItemUrl", url);
            localStorage.setItem("selectedMovieId", data.movie_data.stream_id);
            localStorage.setItem("from", "movie");
            localStorage.setItem("fromHome", "true");
            localStorage.setItem("currentPage", "videojsPlayer");

            Router.showPage("videoJsPlayer");
            if (document.querySelector("#navbar-root"))
              document.querySelector("#navbar-root").style.display = "none";
            document.removeEventListener("keydown", homePageKeydownEvents);
            return;
          } else if (navState.focus === "categories") {
            const card = document.querySelector(
              `.home-card[data-category="${navState.currentCategory}"][data-index="${navState.currentCard}"]`,
            );
            if (card) {
              const id = card.getAttribute("data-stream-id");
              const type = card.getAttribute("data-type");

              if (type === "movie") {
                localStorage.setItem(
                  "moviesCategoryIndex",
                  navState.currentCategory,
                );
                localStorage.setItem("moviesCardIndex", navState.currentCard);
                localStorage.setItem("selectedMovieId", id);
                const pl = getCurrentPlaylist();
                const isCW = (pl.continueWatchingMovies || []).some(
                  (m) => m && m.itemId == id,
                );
                localStorage.setItem(
                  "isContinueWatchingMovie",
                  isCW.toString(),
                );

                const movie = window.allMoviesStreams.find(
                  (m) => m.stream_id == id,
                );
                if (movie)
                  localStorage.setItem(
                    "selectedMovieData",
                    JSON.stringify(movie),
                  );

                // Skip detail page for "Continue Watching" category (category 0)
                if (navState.currentCategory === 0 && movie) {
                  const playlist = JSON.parse(
                    localStorage.getItem("currentPlaylistData") || "{}",
                  );
                  const url = playlist.server_info
                    ? `${playlist.server_info.server_protocol}://${playlist.server_info.url}:${playlist.server_info.port}/movie/${playlist.user_info.username}/${playlist.user_info.password}/${movie.stream_id}.${movie.container_extension}`
                    : "";

                  localStorage.setItem(
                    "playingItemData",
                    JSON.stringify(movie),
                  );
                  localStorage.setItem("selectedVideoItemUrl", url);
                  localStorage.setItem("selectedMovieId", movie.stream_id);
                  localStorage.setItem("from", "movie");
                  localStorage.setItem("fromHome", "true");
                  localStorage.setItem("currentPage", "videojsPlayer");

                  if (HomePage.cleanup) HomePage.cleanup();
                  Router.showPage("videoJsPlayer");
                } else {
                  if (HomePage.cleanup) HomePage.cleanup();
                  Router.showPage("movieDetailPage");
                }
              } else if (type === "series") {
                localStorage.setItem(
                  "seriesCategoryIndex",
                  navState.currentCategory,
                );
                localStorage.setItem("seriesCardIndex", navState.currentCard);
                localStorage.setItem("selectedSeriesId", id);

                const series = window.allSeriesStreams.find(
                  (s) => s.series_id == id,
                );
                if (series)
                  localStorage.setItem(
                    "selectedSeriesItem",
                    JSON.stringify(series),
                  );

                if (HomePage.cleanup) HomePage.cleanup();
                Router.showPage("seriesDetailPage");
              }
            }
          }
      }
    }

    function handleHomeEnterKey(e) {
      if (localStorage.getItem("navigationFocus") !== "homePage") return;

      if (e.key === "Enter") {
        if (e.type === "keydown") {
          if (enterKeyState.isPressed) return; // Prevent repeat keydown
          enterKeyState.isPressed = true;
          enterKeyState.pressStartTime = Date.now();

          enterKeyState.timeoutId = setTimeout(function () {
            if (enterKeyState.isPressed) {
              if (navState.focus === "categories") {
                toggleHomeFavorite();
              }
              enterKeyState.isPressed = false;
            }
          }, enterKeyState.longPressThreshold);
        } else if (e.type === "keyup") {
          if (enterKeyState.isPressed) {
            let pressDuration = Date.now() - enterKeyState.pressStartTime;
            if (pressDuration < enterKeyState.longPressThreshold) {
              clearTimeout(enterKeyState.timeoutId);
              // Enter logic is already handled by homePageKeydownEvents
            }
            enterKeyState.isPressed = false;
          }
        }
      }
    }

    const handleNavFocusChange = (e) => {
      if (e.detail && e.detail.page === "homePage") {
        navState.focus = e.detail.focus || "watchNow";
        updateFocus();
      }
    };

    const handleCarouselSlideChange = (e) => {
      // Only update focus if we're currently focused on carousel buttons
      if (navState.focus === "watchNow" || navState.focus === "moreInfo") {
        updateFocus();
      }
    };

    document.addEventListener("keydown", homePageKeydownEvents);
    document.addEventListener("keydown", handleHomeEnterKey);
    document.addEventListener("keyup", handleHomeEnterKey);
    window.addEventListener("navigation-focus-change", handleNavFocusChange);
    window.addEventListener(
      "carousel-slide-changed",
      handleCarouselSlideChange,
    );

    HomePage.cleanup = function () {
      document.removeEventListener("keydown", homePageKeydownEvents);
      document.removeEventListener("keydown", handleHomeEnterKey);
      document.removeEventListener("keyup", handleHomeEnterKey);
      window.removeEventListener(
        "navigation-focus-change",
        handleNavFocusChange,
      );
      window.removeEventListener(
        "carousel-slide-changed",
        handleCarouselSlideChange,
      );
    };

    window.updateHomePageFavorites = updateHomeFavCategoryRealtime;
    window.updateAllHomeCardsHeartDisplay = updateAllHomeCardsHeartDisplay;
  }, 0);

  // Data fetching and UI building
  const currentPlaylist = getCurrentPlaylist();
  const deduplicateByName = (items) => {
    const seen = new Set();
    return items.filter((item) => {
      const name = (item && item.name ? item.name : "").toLowerCase().trim();
      if (!name || seen.has(name)) return false;
      seen.add(name);
      return true;
    });
  };

  const favMoviesIds = (currentPlaylist.favouriteMovies || []).map(String);
  const favSeriesIds = (currentPlaylist.favouriteSeries || []).map(String);

  const allMovies = window.allMoviesStreams || [];
  const allSeries = window.allSeriesStreams || [];

  const favMovies = allMovies
    .filter((m) => favMoviesIds.includes(String(m.stream_id)))
    .map((m) => ({
      ...m,
      type: "movie",
    }));
  const favSeries = allSeries
    .filter((s) => favSeriesIds.includes(String(s.series_id)))
    .map((s) => ({
      ...s,
      type: "series",
    }));
  const allFavorites = deduplicateByName([...favMovies, ...favSeries]);

  const recentMovies = (currentPlaylist.continueWatchingMovies || [])
    .map((cw) => {
      const m = allMovies.find(
        (s) => String(s.stream_id) === String(cw.itemId),
      );
      return m
        ? {
            ...m,
            type: "movie",
          }
        : null;
    })
    .filter(Boolean);

  const recentSeries = (currentPlaylist.continueWatchingSeries || [])
    .map((cw) => {
      const s = allSeries.find(
        (sr) => String(sr.series_id) === String(cw.itemId),
      );
      return s
        ? {
            ...s,
            type: "series",
          }
        : null;
    })
    .filter(Boolean);

  const allRecent = deduplicateByName([...recentMovies, ...recentSeries]).slice(
    0,
    20,
  );

  const addedMovies = [...allMovies]
    .sort((a, b) => (b.added || 0) - (a.added || 0))
    .slice(0, 10)
    .map((m) => ({
      ...m,
      type: "movie",
    }));
  const addedSeries = [...allSeries]
    .sort((a, b) => (b.added || 0) - (a.added || 0))
    .slice(0, 10)
    .map((s) => ({
      ...s,
      type: "series",
    }));
  const allAdded = deduplicateByName([...addedMovies, ...addedSeries]).sort(
    (a, b) => (b.added || 0) - (a.added || 0),
  );

  function createHomeCard(item, catIdx, cardIdx) {
    const type = item.type || "movie";
    const id = type === "movie" ? item.stream_id : item.series_id;
    const name = item.name || "Unknown";
    const image =
      type === "movie"
        ? item.stream_icon || "./assets/demo-img-card.png"
        : item.cover || item.stream_icon || "./assets/demo-img-card.png";
    const rating = item.rating_5based || "0";
    const isFav =
      type === "movie"
        ? favMoviesIds.includes(String(id))
        : favSeriesIds.includes(String(id));

    let progressHtml = "";
    if (type === "movie" && catIdx === 0) {
      try {
        const currentPlaylist = getCurrentPlaylist();
        const recentData = currentPlaylist.continueWatchingMovies || [];
        const matched = recentData.find(
          (item) => item && String(item.itemId) === String(id),
        );
        if (matched && matched.duration > 0) {
          const progress = (matched.resumeTime / matched.duration) * 100;
          progressHtml = `
            <div class="home-movie-progress-container">
              <div class="home-movie-progress-bar" style="width: ${progress}%"></div>
            </div>
          `;
        }
      } catch (e) {
        console.error("Error calculating progress in createHomeCard:", e);
      }
    }

    return `
            <div class="home-card" data-category="${catIdx}" data-index="${cardIdx}" data-stream-id="${id}" data-type="${type}" data-image-url="${image}" tabindex="0">
                <div class="home-card-inner" style="background-image: url('${
                  image || "./assets/placeholder-img.png"
                }')">
                    <img src="${image}" style="display: none;" onerror="this.parentElement.style.backgroundImage = 'url(./assets/placeholder-img.png)'" />
                    <div class="home-card-heart-container">
                        <i class="${
                          isFav ? "fas" : "far"
                        } fa-heart home-card-heart"></i>
                    </div>
                    <div class="home-card-rating">
       <i class="fas fa-star"></i>                        ${rating}
                    </div>
                    <div class="home-card-play-div">
                        <img src="./assets/card-play-icon.png" alt="Play" class="home-card-play" />
                    </div>
                    <div class="home-card-text">
                        <h2 class="home-title-marquee">${name}</h2>
                    </div>
                    ${progressHtml}
                </div>
            </div>
        `;
  }

  const carouselHtml = await HomeCarousel();
  const loader = document.querySelector("#home-page-loader");
  if (loader) {
    loader.style.animation = "fadeOut 0.3s ease-out";
    setTimeout(() => loader.remove(), 300);
  }

  if (
    !carouselHtml &&
    allRecent.length === 0 &&
    allFavorites.length === 0 &&
    allAdded.length === 0
  ) {
    return `<div class="home-page-no-data"><p>No Data found</p></div>`;
  }

  return `
        <div class="home-page-container">
            <div class="home-poster">${carouselHtml}</div>
            ${
              allRecent.length > 0
                ? `
                <div class="home-recent-container">
                    <h1>Continue Watching</h1>
                    <div class="home-card-list" data-category="0">${allRecent
                      .map((it, idx) => createHomeCard(it, 0, idx))
                      .join("")}</div>
                </div>
            `
                : ""
            }
            ${
              allFavorites.length > 0
                ? `
                <div class="home-fav-container">
                    <h1>My Fav</h1>
                    <div class="home-card-list" data-category="1">${allFavorites
                      .map((it, idx) => createHomeCard(it, 1, idx))
                      .join("")}</div>
                </div>
            `
                : ""
            }
            ${
              allAdded.length > 0
                ? `
                <div class="home-recently-added-container">
                    <h1>Recently Added</h1>
                    <div class="home-card-list" data-category="2">${allAdded
                      .map((it, idx) => createHomeCard(it, 2, idx))
                      .join("")}</div>
                </div>
            `
                : ""
            }
        </div>
    `;
}
