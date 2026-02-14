async function MovieDetailPage() {
  localStorage.setItem("currentPage", "movieDetailPage");
  localStorage.setItem("navigationFocus", "movieDetailPage");
  if (MovieDetailPage.cleanup) MovieDetailPage.cleanup();

  const castImageUrl = "https://image.tmdb.org/t/p/w500";
  let getMovieCastData = [];
  // const loadingOverlay = document.getElementById("loading-overlay");

  // Create custom loader
  const customLoader = document.createElement("div");
  customLoader.id = "movie-detail-loader";
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
    const isBackKey =
      [10009, 461, 8, 27, 10079, 100079].includes(e.keyCode) ||
      ["Escape", "Back", "BrowserBack", "XF86Back", "Backspace"].includes(
        e.key,
      );

    if (
      isBackKey &&
      localStorage.getItem("currentPage") === "movieDetailPage"
    ) {
      e.preventDefault();
      e.stopPropagation();

      navigationInterrupted = true;

      // Force remove any loaders
      const loaders = document.querySelectorAll(
        ".custom-page-loader, #movie-detail-loader",
      );
      loaders.forEach((l) => l.remove());

      document.removeEventListener(
        "keydown",
        handleBackNavigationDuringLoading,
      );

      localStorage.removeItem("selectedMovieId");
      localStorage.setItem("currentPage", "moviesPage");
      Router.showPage("moviesPage");
      document.body.style.backgroundImage = "none";
      document.body.style.backgroundColor = "black";

      return true;
    }
  }

  document.addEventListener("keydown", handleBackNavigationDuringLoading);

  // --- Load movie data from localStorage ---
  var movieDetailId = localStorage.getItem("selectedMovieId");
  var selectedMovieItem = localStorage.getItem("selectedMovieData");
  if (!selectedMovieItem) {
    console.error("No selectedMovieData in localStorage");
    document.removeEventListener("keydown", handleBackNavigationDuringLoading);
    const loaders = document.querySelectorAll(
      ".custom-page-loader, #movie-detail-loader",
    );
    loaders.forEach((l) => l.remove());
    Router.showPage("moviesPage");
    return;
  }
  selectedMovieItem = JSON.parse(selectedMovieItem);

  // if (loadingOverlay) loadingOverlay.classList.remove("hidden");

  // --- Fetch movie details ---
  var movieDetailData = null;
  try {
    movieDetailData = await getMovieDetail(movieDetailId);
  } catch (err) {
    console.error("Error fetching movie detail:", err);
  }

  // Check if navigation was interrupted during await
  if (navigationInterrupted) {
    document.removeEventListener("keydown", handleBackNavigationDuringLoading);
    const loaders = document.querySelectorAll(
      ".custom-page-loader, #movie-detail-loader",
    );
    loaders.forEach((l) => l.remove());
    return;
  }

  if (!movieDetailData) {
    // if (loadingOverlay) loadingOverlay.classList.add("hidden");
    const loader = document.getElementById("movie-detail-loader");
    if (loader) loader.remove();
    localStorage.setItem("currentPage", "moviesPage");
    Router.showPage("moviesPage");
    document.body.style.backgroundImage = "none";
    document.body.style.backgroundColor = "black";
    document.removeEventListener("keydown", handleBackNavigationDuringLoading);
    return;
  }

  var tmdbId =
    movieDetailData.info && movieDetailData.info.tmdb_id
      ? movieDetailData.info.tmdb_id
      : 0;

  try {
    if (tmdbId) {
      // getMovieCastData = await getMovieCast(tmdbId);
      getMovieCastData = [];
    }
  } catch (err) {
    console.error("Error fetching movie cast:", err);
  }

  // Check again if navigation was interrupted during second await
  if (navigationInterrupted) {
    document.removeEventListener("keydown", handleBackNavigationDuringLoading);
    const loader = document.getElementById("movie-detail-loader");
    if (loader) loader.remove();
    return;
  }

  // Remove the loading navigation handler since we're done loading
  document.removeEventListener("keydown", handleBackNavigationDuringLoading);

  // --- Continue Watching logic ---
  var selectedPlaylistData = localStorage.getItem("selectedPlaylist");
  var currentPlaylistName = "";
  if (selectedPlaylistData) {
    var parsedPlaylist = JSON.parse(selectedPlaylistData);
    currentPlaylistName = parsedPlaylist.playlistName
      ? parsedPlaylist.playlistName
      : "";
  }

  var playlistsData = localStorage.getItem("playlistsData");
  var currentPlaylist = null;
  if (playlistsData) {
    playlistsData = JSON.parse(playlistsData);
    for (var i = 0; i < playlistsData.length; i++) {
      if (playlistsData[i].playlistName === currentPlaylistName) {
        currentPlaylist = playlistsData[i];
        break;
      }
    }
  }

  var continueWatchingIds = [];
  if (
    currentPlaylist &&
    currentPlaylist.continueWatchingMovies &&
    Array.isArray(currentPlaylist.continueWatchingMovies)
  ) {
    continueWatchingIds = currentPlaylist.continueWatchingMovies.map(
      function (item) {
        return item.itemId ? Number(item.itemId) : 0;
      },
    );
  }

  var isContinueWatchingMovie = false;
  if (selectedMovieItem && selectedMovieItem.stream_id) {
    isContinueWatchingMovie = continueWatchingIds.includes(
      Number(selectedMovieItem.stream_id),
    );
  }

  // if (loadingOverlay) loadingOverlay.classList.add("hidden");
  const loader = document.getElementById("movie-detail-loader");
  if (loader) loader.remove();

  var htmlContent = renderMovieDetailPage(movieDetailData);

  var currentFocusIndex = 0;
  var focusableEls = [];

  function setFocus(el) {
    const navbar = document.querySelector("#navbar-root");
    for (var i = 0; i < focusableEls.length; i++) {
      if (focusableEls[i]) {
        focusableEls[i].classList.remove("movie-detail-button-focused");
        focusableEls[i].classList.remove("focused");
        const marquee = focusableEls[i].querySelector(".movie-title-marquee");
        if (marquee) marquee.classList.remove("marquee-active");
      }
    }

    if (el) {
      const isMovieCard = el.classList.contains("movie-card");
      if (isMovieCard) {
        el.classList.add("focused");
        activateMoviesMarquee(el);
        // Hide navbar when focus is on "More Like This" cards
        if (navbar) navbar.style.display = "none";
      } else {
        el.classList.add("movie-detail-button-focused");
        // Show navbar when focus is on top buttons
        const isTopBtn =
          el.classList.contains("movie-detail-play-button") ||
          el.classList.contains("movie-detail-from-start-button") ||
          el.classList.contains("movie-detail-fav-button");
        if (isTopBtn && navbar) navbar.style.display = "flex";
      }

      try {
        el.focus();

        const isTopBtn =
          el.classList.contains("movie-detail-play-button") ||
          el.classList.contains("movie-detail-from-start-button") ||
          el.classList.contains("movie-detail-fav-button");

        if (isTopBtn) {
          // Force scroll to top when focused on top buttons
          const container = document.querySelector(
            ".movie-detail-page-container",
          );
          if (container) {
            container.scrollTo({ top: 0, behavior: "smooth" });
          }
        } else {
          if (el.scrollIntoViewIfNeeded) el.scrollIntoViewIfNeeded(true);
          else if (el.scrollIntoView) {
            el.scrollIntoView({
              block: "center",
              inline: "nearest",
            });
          }
        }
      } catch (err) {}
    }
  }

  function initFocus() {
    var fromStartBtn = document.querySelector(
      ".movie-detail-from-start-button",
    );
    focusableEls = [
      document.querySelector(".movie-detail-play-button"),
      fromStartBtn,
      // document.querySelector(".movie-detail-more-info-button"),
      document.querySelector(".movie-detail-fav-button"),
      document.querySelector(".movie-detail-page-header-menu"),
    ];

    var castEls = document.querySelectorAll(".movie-cast-item");
    if (castEls && castEls.length > 0) {
      for (var j = 0; j < castEls.length; j++) {
        focusableEls.push(castEls[j]);
      }
    }

    var moreLikeThisEls = document.querySelectorAll(
      ".movie-detail-more-like-this-list .movie-card",
    );
    if (moreLikeThisEls && moreLikeThisEls.length > 0) {
      for (var k = 0; k < moreLikeThisEls.length; k++) {
        focusableEls.push(moreLikeThisEls[k]);
      }
    }

    focusableEls = focusableEls.filter(Boolean);
    currentFocusIndex = 0;
    setFocus(focusableEls[currentFocusIndex]);
  }

  setTimeout(initFocus, 0);

  // --- Reset Resume Time ---
  function resetResumeTime(movieId) {
    if (!movieId) return;
    var playlistsData = localStorage.getItem("playlistsData");
    if (!playlistsData) return;
    playlistsData = JSON.parse(playlistsData);

    var selectedPlaylist = localStorage.getItem("selectedPlaylist");
    if (!selectedPlaylist) return;
    selectedPlaylist = JSON.parse(selectedPlaylist);
    var playlistName = selectedPlaylist.playlistName;

    for (var i = 0; i < playlistsData.length; i++) {
      if (
        playlistsData[i].playlistName === playlistName &&
        playlistsData[i].continueWatchingMovies
      ) {
        for (
          var j = 0;
          j < playlistsData[i].continueWatchingMovies.length;
          j++
        ) {
          if (
            Number(playlistsData[i].continueWatchingMovies[j].itemId) ===
            Number(movieId)
          ) {
            playlistsData[i].continueWatchingMovies[j].resumeTime = 0;
          }
        }
      }
    }

    localStorage.setItem("playlistsData", JSON.stringify(playlistsData));
  }

  function moviesDetailPageKeydownHandler(e) {
    if (
      localStorage.getItem("currentPage") == "movieDetailPage" &&
      localStorage.getItem("navigationFocus") == "movieDetailPage"
    ) {
      var focused = focusableEls[currentFocusIndex];
      if (!focused) return;

      var playBtn = document.querySelector(".movie-detail-play-button");
      var fromStartBtn = document.querySelector(
        ".movie-detail-from-start-button",
      );
      var trailerBtn = document.querySelector(".movie-detail-more-info-button");
      var favBtn = document.querySelector(".movie-detail-fav-button");
      var menuBtn = document.querySelector(".movie-detail-page-header-menu");
      var castItems = document.querySelectorAll(".movie-cast-item");

      // --- Enter key ---
      if (e.key === "Enter") {
        if (focused === playBtn || focused === fromStartBtn) {
          if (focused === fromStartBtn)
            resetResumeTime(selectedMovieItem.stream_id);

          var currentPlaylistData = localStorage.getItem("currentPlaylistData");
          if (!currentPlaylistData) return;
          currentPlaylistData = JSON.parse(currentPlaylistData);

          var movieVideoUrl = "";
          if (
            currentPlaylistData.server_info &&
            currentPlaylistData.user_info &&
            movieDetailData.movie_data &&
            movieDetailData.movie_data.stream_id &&
            movieDetailData.movie_data.container_extension
          ) {
            movieVideoUrl =
              currentPlaylistData.server_info.server_protocol +
              "://" +
              currentPlaylistData.server_info.url +
              ":" +
              currentPlaylistData.server_info.port +
              "/movie/" +
              currentPlaylistData.user_info.username +
              "/" +
              currentPlaylistData.user_info.password +
              "/" +
              movieDetailData.movie_data.stream_id +
              "." +
              movieDetailData.movie_data.container_extension;
          }

          localStorage.setItem(
            "playingItemData",
            JSON.stringify(movieDetailData.movie_data),
          );
          localStorage.setItem("selectedVideoItemUrl", movieVideoUrl);
          localStorage.setItem("from", "movie");
          localStorage.setItem("currentPage", "videojsPlayer");

          Router.showPage("videoJsPlayer");
          const navbarEl = document.querySelector("#navbar-root");
          if (navbarEl) {
            navbarEl.style.display = "none";
          }
          document.body.style.backgroundImage = "none";
          document.body.style.backgroundColor = "black";
          return;
        }

        if (focused === trailerBtn) {
          if (movieDetailData.info && movieDetailData.info.youtube_trailer) {
            var trailerUrl =
              "https://www.youtube.com/watch?v=" +
              movieDetailData.info.youtube_trailer;
            localStorage.setItem("selectedVideoItemUrl", trailerUrl);
            localStorage.setItem("from", "trailer_movie");
            localStorage.setItem("currentPage", "videojsPlayer");
            Router.showPage("videoJsPlayer");
            document.body.style.backgroundImage = "none";
            document.body.style.backgroundColor = "black";
          } else alert("No trailer available");
        }

        if (focused === favBtn) {
          var res = toggleFavoriteItem(
            movieDetailData.movie_data && movieDetailData.movie_data.stream_id
              ? movieDetailData.movie_data.stream_id
              : 0,
            "favouriteMovies",
          );
          if (res && res.success) {
            if (favBtn) {
              var heartIcon = favBtn.querySelector(".heart-icon i");

              if (heartIcon) {
                // Update class
                heartIcon.className = res.isFav
                  ? "fa-solid fa-heart"
                  : "fa-regular fa-heart";

                // Update styles
                heartIcon.style.color = res.isFav ? "#ff4d4d" : "white";
                heartIcon.style.opacity = res.isFav ? "1" : "0.6";
              }

              // Optional: Show toast
              Toaster.showToast(
                res.isFav ? "success" : "error",
                res.isFav ? "Added to Favorites" : "Removed from Favorites",
              );
            }
          } else {
            alert(res.message || "Unable to update favorites");
          }
          return;
        }

        if (focused.classList.contains("movie-card")) {
          const streamId = focused.getAttribute("data-stream-id");
          const movie = window.allMoviesStreams.find(
            (m) => String(m.stream_id) === String(streamId),
          );
          if (movie) {
            localStorage.setItem("selectedMovieId", streamId);
            localStorage.setItem("selectedMovieData", JSON.stringify(movie));
            // Re-render the detail page for the selected movie
            MovieDetailPage.cleanup();
            Router.showPage("movieDetailPage");
          }
        }
      }

      // --- Arrow navigation ---
      // Sync currentFocusIndex with the actual focused element if it's one of our focusable elements
      var isArrowKey = [
        "ArrowRight",
        "ArrowLeft",
        "ArrowUp",
        "ArrowDown",
      ].includes(e.key);
      if (
        !isArrowKey &&
        document.activeElement &&
        focusableEls.includes(document.activeElement)
      ) {
        currentFocusIndex = focusableEls.indexOf(document.activeElement);
      }

      // Define groups
      var buttons = [playBtn, fromStartBtn, trailerBtn, favBtn].filter(
        (el) => el && el.offsetParent !== null,
      );
      var castArr = Array.from(castItems);
      var mltCards = Array.from(
        document.querySelectorAll(
          ".movie-detail-more-like-this-list .movie-card",
        ),
      );

      if (e.key === "ArrowRight") {
        if (buttons.includes(focused)) {
          var idx = buttons.indexOf(focused);
          if (idx < buttons.length - 1) {
            setFocus(buttons[idx + 1]);
            currentFocusIndex = focusableEls.indexOf(buttons[idx + 1]);
          }
        } else if (castArr.includes(focused)) {
          var idx = castArr.indexOf(focused);
          if (idx < castArr.length - 1) {
            setFocus(castArr[idx + 1]);
            currentFocusIndex = focusableEls.indexOf(castArr[idx + 1]);
          }
        } else if (mltCards.includes(focused)) {
          var idx = mltCards.indexOf(focused);
          if (idx < mltCards.length - 1) {
            setFocus(mltCards[idx + 1]);
            currentFocusIndex = focusableEls.indexOf(mltCards[idx + 1]);
          }
        }
      } else if (e.key === "ArrowLeft") {
        if (buttons.includes(focused)) {
          var idx = buttons.indexOf(focused);
          if (idx > 0) {
            setFocus(buttons[idx - 1]);
            currentFocusIndex = focusableEls.indexOf(buttons[idx - 1]);
          }
        } else if (castArr.includes(focused)) {
          var idx = castArr.indexOf(focused);
          if (idx > 0) {
            setFocus(castArr[idx - 1]);
            currentFocusIndex = focusableEls.indexOf(castArr[idx - 1]);
          }
        } else if (mltCards.includes(focused)) {
          var idx = mltCards.indexOf(focused);
          if (idx > 0) {
            setFocus(mltCards[idx - 1]);
            currentFocusIndex = focusableEls.indexOf(mltCards[idx - 1]);
          }
        }
      } else if (e.key === "ArrowUp") {
        const allDetailBtns = document.querySelectorAll(
          ".movie-detail-button-focused, .focused",
        );
        allDetailBtns.forEach((btn) => {
          btn.classList.remove("movie-detail-button-focused");
          btn.classList.remove("focused");
        });

        if (buttons.includes(focused)) {
          if (window.setNavbarFocus) {
            window.setNavbarFocus("moviesPage");
          } else {
            localStorage.setItem("navigationFocus", "navbar");
          }
          e.preventDefault();
          e.stopPropagation();
          return;
        } else if (castArr.includes(focused)) {
          if (buttons.length > 0) {
            setFocus(buttons[0]);
            currentFocusIndex = focusableEls.indexOf(buttons[0]);
          }
        } else if (mltCards.includes(focused)) {
          if (castArr.length > 0) {
            setFocus(castArr[0]);
            currentFocusIndex = focusableEls.indexOf(castArr[0]);
          } else if (buttons.length > 0) {
            setFocus(buttons[0]);
            currentFocusIndex = focusableEls.indexOf(buttons[0]);
          }
        }
      } else if (e.key === "ArrowDown") {
        if (buttons.includes(focused)) {
          if (castArr.length > 0) {
            setFocus(castArr[0]);
            currentFocusIndex = focusableEls.indexOf(castArr[0]);
          } else if (mltCards.length > 0) {
            setFocus(mltCards[0]);
            currentFocusIndex = focusableEls.indexOf(mltCards[0]);
          }
        } else if (castArr.includes(focused)) {
          if (mltCards.length > 0) {
            setFocus(mltCards[0]);
            currentFocusIndex = focusableEls.indexOf(mltCards[0]);
          }
        }
        // If focused is menuBtn, maybe go to PlayBtn?
        else if (focused === menuBtn && buttons.length > 0) {
          setFocus(buttons[0]);
          currentFocusIndex = focusableEls.indexOf(buttons[0]);
        }
      }

      if (
        e.keyCode === 10009 ||
        e.key === "Escape" ||
        e.key === "Back" ||
        e.key === "BrowserBack" ||
        e.key === "XF86Back"
      ) {
        localStorage.removeItem("selectedMovieId");
        localStorage.setItem("currentPage", "moviesPage");
        Router.showPage("moviesPage");
        document.body.style.backgroundImage = "none";
        document.body.style.backgroundColor = "black";
        return;
      }

      setFocus(focusableEls[currentFocusIndex]);
    } else {
      return;
    }
  }

  document.addEventListener("keydown", moviesDetailPageKeydownHandler);
  MovieDetailPage.cleanup = function () {
    document.removeEventListener("keydown", moviesDetailPageKeydownHandler);
    document.removeEventListener("keydown", handleBackNavigationDuringLoading);
    const loaders = document.querySelectorAll(
      ".custom-page-loader, #movie-detail-loader",
    );
    loaders.forEach((l) => l.remove());
  };

  return htmlContent;

  function renderMovieDetailPage(data) {
    console.log(data, "DATA");
    var isFav =
      data.movie_data && data.movie_data.stream_id
        ? isItemFavoriteForPlaylist(
            data.movie_data.stream_id,
            "favouriteMovies",
          )
        : false;

    // Updated heart icon HTML with inline styles for initial state
    var heartIconHtml = `<i class="${isFav ? "fa-solid" : "fa-regular"} fa-heart" 
        style="color: ${isFav ? "#ff4d4d" : "white"}; opacity: ${isFav ? "1" : "0.6"};"></i>`;

    var backdrop =
      data.info && data.info.backdrop_path && data.info.backdrop_path[0]
        ? data.info.backdrop_path[0]
        : (data.info && data.info.backdrop) ||
          (data.info && data.info.cover) ||
          "https://developers.elementor.com/docs./assets/img/elementor-placeholder-image.png";

    // Fallback if backdrop is not valid, try poster
    if (!backdrop || backdrop.includes("placeholder")) {
      backdrop =
        data.info && data.info.movie_image
          ? data.info.movie_image
          : "assets/demo-img-card.png";
    }

    var movieName =
      data.movie_data && data.movie_data.name
        ? data.movie_data.name
        : "No title available";
    var director = data.info && data.info.director ? data.info.director : "N/A";
    var releaseDate =
      data.info && data.info.releasedate ? data.info.releasedate : "N/A";
    var genre = data.info && data.info.genre ? data.info.genre : "N/A";
    var description =
      data.info && data.info.plot ? data.info.plot : "No description available";

    // Rating logic similar to HomeCarousel
    var originalRating =
      (data.info && data.info.rating) ||
      (data.movie_data && data.movie_data.rating_5based) ||
      0;

    let normalizedRating = parseFloat(originalRating);
    // If rating is > 5, usually means it is out of 10.
    if (normalizedRating > 5) {
      normalizedRating = normalizedRating / 2;
    }
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

    var castHtml = "";
    if (
      getMovieCastData &&
      getMovieCastData.cast &&
      getMovieCastData.cast.length > 0
    ) {
      for (var i = 0; i < getMovieCastData.cast.length; i++) {
        var item = getMovieCastData.cast[i];
        var profile = item.profile_path
          ? castImageUrl + item.profile_path
          : "./assets/placeholder-img.png";
        var name = item.name ? item.name : "";

        castHtml +=
          '<div class="movie-cast-item" tabindex="0">' +
          '<img src="' +
          profile +
          '" alt="' +
          name +
          '" class="movie-cast-item-image" ' +
          "onerror=\"this.src='./assets/placeholder-img.png'\" />" +
          '<p class="movie-cast-item-name">' +
          name +
          "</p>" +
          "</div>";
      }
    }

    // Format duration
    const durationSec = data.info.duration_secs;
    let durationFormatted = "N/A";
    if (durationSec) {
      const h = Math.floor(durationSec / 3600);
      const m = Math.floor((durationSec % 3600) / 60);
      durationFormatted = `${h}h ${m}m`;
    }

    // --- More Like This logic ---
    const allMovies = window.allMoviesStreams || [];
    const currentCatId = data.movie_data ? data.movie_data.category_id : null;
    const currentStreamId = data.movie_data ? data.movie_data.stream_id : null;

    let relatedMovies = [];
    if (currentCatId) {
      relatedMovies = allMovies
        .filter(
          (m) =>
            m &&
            String(m.category_id) === String(currentCatId) &&
            String(m.stream_id) !== String(currentStreamId),
        )
        .slice(0, 20);
    }

    let moreLikeThisHtml = "";
    if (relatedMovies.length > 0) {
      moreLikeThisHtml = `
        <div class="movie-detail-more-like-this-section">
          <h3 class="movie-detail-cast-heading">More Like This</h3>
          <div class="movie-detail-more-like-this-list">
            ${relatedMovies
              .map((m, idx) => {
                // We use createMovieCard from MoviesPage.js which is globally available
                const movieData = formatMovieData(m);
                return createMovieCard(movieData, "normal", 999, idx);
              })
              .join("")}
          </div>
        </div>
      `;
    }

    return `
      <div class="movie-detail-page-container">
          <img class="movie-detail-backdrop-image" src="${backdrop}" onerror="this.src='./assets/demo-img-card.png'" />
          <div class="movie-detail-overlay"></div>
          
          <div class="movie-detail-scroll-container">
            <div class="movie-detail-content-wrapper">
                <h1 class="movie-detail-title">${movieName}</h1>
                
                <div class="movie-detail-meta">
                    <span class="movie-detail-rating-stars">
                       ${starsHtml}
                    </span>
                    <span class="movie-detail-rating-value">${ratingStr}</span>
                    <span class="movie-detail-duration"><i class="far fa-clock" style="margin-right: 8px;"></i>${durationFormatted}</span>
                    <span class="movie-detail-resolution-badge">HD</span>
                    <span class="movie-detail-date">${releaseDate}</span>
                </div>

                 <div class="movie-detail-credits">
                  <p><strong>Directed By :</strong> ${director}</p>
                  <p><strong>Genre :</strong> ${genre}</p>
                </div>

                <p class="movie-detail-description">${description}</p>

                <div class="movie-detail-buttons">
                    <button class="movie-detail-play-button gradient-btn" tabindex="0">
                        <i class="fa fa-play"></i>
                        ${isContinueWatchingMovie ? "Resume" : "Play Now"}
                    </button>
                    ${
                      isContinueWatchingMovie
                        ? '<button class="movie-detail-from-start-button gradient-btn" tabindex="0"><i class="fa fa-undo"></i> Start from beginning</button>'
                        : ""
                    }
                    ${
                      data.info && data.info.youtube_trailer
                        ? '<button class="movie-detail-more-info-button gradient-btn" style="display: none;" tabindex="0"><i class="fa fa-film"></i> Watch Trailer</button>'
                        : ""
                    }
                    <button class="movie-detail-fav-button gradient-btn" tabindex="0">
                      <span class="heart-icon">${heartIconHtml}</span>
                      <span class="fav-text" style="margin-left: 8px;">My Fav</span>
                    </button>
                </div>
            </div>

            <div class="movie-detail-cast-section-relative">
               <h3 class="movie-detail-cast-heading">Cast & Crew</h3>
               <div class="movie-detail-cast-list">
                  ${castHtml || '<p class="movie-no-cast-text">No cast information available</p>'}
               </div>
            </div>

            ${moreLikeThisHtml}
          </div>
      </div>
    `;
  }
}
