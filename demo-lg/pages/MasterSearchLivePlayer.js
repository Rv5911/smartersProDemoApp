function MasterSearchLivePlayer() {
  const containerId = "ms-live-player-container";
  let playerContainer = document.getElementById(containerId);
  let isPlayerActive = false;
  let autoFullscreenTimeout = null;

  if (!playerContainer) {
    playerContainer = document.createElement("div");
    playerContainer.id = containerId;
    playerContainer.style.position = "fixed";
    playerContainer.style.top = "0";
    playerContainer.style.left = "0";
    playerContainer.style.width = "100%";
    playerContainer.style.height = "100%";
    playerContainer.style.zIndex = "9999";
    playerContainer.style.background = "black";
    playerContainer.style.display = "none";
    playerContainer.style.overflow = "hidden";
    document.body.appendChild(playerContainer);
  }

  const checkIsFullscreen = () => {
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement ||
      document.webkitIsFullScreen ||
      document.mozFullScreen ||
      (document.msFullscreenElement !== null &&
        document.msFullscreenElement !== undefined)
    );
  };

  const enterFullscreen = () => {
    if (checkIsFullscreen()) return;

    if (playerContainer.requestFullscreen) {
      playerContainer.requestFullscreen();
    } else if (playerContainer.webkitRequestFullscreen) {
      playerContainer.webkitRequestFullscreen();
    } else if (playerContainer.mozRequestFullScreen) {
      playerContainer.mozRequestFullScreen();
    } else if (playerContainer.msRequestFullscreen) {
      playerContainer.msRequestFullscreen();
    }
  };

  const exitFullscreen = () => {
    if (!checkIsFullscreen()) return;

    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitCancelFullScreen) {
      document.webkitCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  };

  const cleanup = () => {
    if (autoFullscreenTimeout) {
      clearTimeout(autoFullscreenTimeout);
      autoFullscreenTimeout = null;
    }

    if (controlsHideTimer) {
      clearTimeout(controlsHideTimer);
      controlsHideTimer = null;
    }

    // Exit fullscreen if active
    if (checkIsFullscreen()) {
      exitFullscreen();
    }

    if (playerContainer) {
      playerContainer.innerHTML = "";
      playerContainer.style.display = "none";
    }

    // Restore Navbar
    const navRoot = document.getElementById("navbar-root");
    if (navRoot) navRoot.style.display = "block";

    // Restore Master Search Page Focus
    localStorage.setItem("navigationFocus", "masterSearchPage");

    // Clean up event listeners
    document.removeEventListener("keydown", handlePlayerKeydown, true);
    document.removeEventListener("fullscreenchange", handleFullscreenChange);
    document.removeEventListener(
      "webkitfullscreenchange",
      handleFullscreenChange,
    );
    document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
    document.removeEventListener("msfullscreenchange", handleFullscreenChange);

    if (window.LiveVideoJsComponent && window.LiveVideoJsComponent.cleanup) {
      try {
        window.LiveVideoJsComponent.cleanup();
      } catch (e) {
        console.error("Error cleaning up LiveVideoJsComponent", e);
      }
    }

    if (window.livePlayer) {
      try {
        window.livePlayer.dispose();
      } catch (e) {}
      window.livePlayer = null;
    }

    isPlayerActive = false;
    playerSubFocus = 0;
  };

  const handleFullscreenChange = () => {
    const isFs = checkIsFullscreen();

    if (!isFs && isPlayerActive) {
      // User exited fullscreen, close the player
      cleanup();
    }
  };

  const togglePlayPause = () => {
    if (!window.livePlayer) return;

    const playPauseIcon = document.querySelector(".play-pause-icon");
    const updateIcon = (isPlaying) => {
      if (playPauseIcon) {
        const icon = playPauseIcon.querySelector("i");
        if (icon) {
          icon.className = isPlaying ? "fa-solid fa-pause" : "fa-solid fa-play";
        }
      }
    };

    try {
      if (window.livePlayer._fp) {
        // Flowplayer
        const fp = window.livePlayer._fp;
        if (fp.playing) {
          fp.pause();
          updateIcon(false);
        } else {
          fp.resume();
          updateIcon(true);
        }
      } else {
        // Video.js
        if (window.livePlayer.paused()) {
          window.livePlayer.play();
          updateIcon(true);
        } else {
          window.livePlayer.pause();
          updateIcon(false);
        }
      }
    } catch (err) {
      console.warn("Play/Pause toggle failed:", err);
    }
  };

  const handleAspectRatioChange = () => {
    const videoEl =
      document.querySelector("#live-videojs-player_html5_api") ||
      document.querySelector("#flowplayer-live video");
    if (videoEl && window.VideoAspectRatio) {
      const newLabel = window.VideoAspectRatio.cycle(videoEl);
      window.VideoAspectRatio.showOverlay(newLabel);
    } else {
      console.warn(
        "Aspect ratio handler: No video element or VideoAspectRatio module found",
      );
    }
  };

  // Control state
  let playerSubFocus = 0; // 0 = video border, 1 = play/pause, 2 = aspect ratio
  let controlsHideTimer = null;

  const showControls = () => {
    const playPauseIcon = document.querySelector(".play-pause-icon");
    const aspectRatioBtn = document.getElementById("videojs-aspect-ratio");
    const liveVideoLoader = document.querySelector(".live-video-loader");
    const liveVideoError = document.querySelector(".live-video-error");

    // Don't show controls if loader is visible or error is showing
    const loaderVisible =
      liveVideoLoader &&
      !liveVideoLoader.classList.contains("hidden") &&
      liveVideoLoader.style.display !== "none";

    const errorVisible =
      liveVideoError &&
      !liveVideoError.classList.contains("hidden") &&
      liveVideoError.style.display !== "none";

    if (loaderVisible || errorVisible) {
      // Hide controls when loader or error is showing
      if (playPauseIcon) {
        playPauseIcon.style.display = "none";
        playPauseIcon.style.opacity = "0";
      }
      if (aspectRatioBtn) {
        aspectRatioBtn.style.display = "none";
        aspectRatioBtn.style.opacity = "0";
      }
      return;
    }

    // Show controls only if loader and error are not visible
    if (playPauseIcon) {
      playPauseIcon.style.display = "flex";
      playPauseIcon.style.opacity = "1";
    }

    if (aspectRatioBtn) {
      aspectRatioBtn.style.display = "block";
      aspectRatioBtn.style.opacity = "1";
    }
  };

  const hideControls = () => {
    const playPauseIcon = document.querySelector(".play-pause-icon");
    const aspectRatioBtn = document.getElementById("videojs-aspect-ratio");

    // Always hide controls after timeout, even when focused
    if (playPauseIcon) {
      playPauseIcon.style.opacity = "0";
      setTimeout(() => {
        if (playPauseIcon) playPauseIcon.style.display = "none";
      }, 300);
    }

    if (aspectRatioBtn) {
      aspectRatioBtn.style.opacity = "0";
      setTimeout(() => {
        if (aspectRatioBtn) aspectRatioBtn.style.display = "none";
      }, 300);
    }
  };

  const resetControlsTimer = () => {
    // Clear existing timer
    if (controlsHideTimer) {
      clearTimeout(controlsHideTimer);
      controlsHideTimer = null;
    }

    // Show controls
    showControls();

    // Set new timer to hide after 5 seconds
    controlsHideTimer = setTimeout(() => {
      hideControls();
    }, 5000);
  };

  const updateFocus = () => {
    const playerContainer = document.getElementById("ms-live-player-container");
    const playPauseIcon = document.querySelector(".play-pause-icon");
    const aspectRatioBtn = document.getElementById("videojs-aspect-ratio");

    // Remove all focus classes
    if (playerContainer) playerContainer.classList.remove("lp-focused");
    if (playPauseIcon) playPauseIcon.classList.remove("focused");
    if (aspectRatioBtn) aspectRatioBtn.classList.remove("focused");

    // Apply focus based on playerSubFocus
    if (playerSubFocus === 0) {
      // Focus on video border
      if (playerContainer) playerContainer.classList.add("lp-focused");
    } else if (playerSubFocus === 1) {
      // Focus on play/pause
      if (playPauseIcon) {
        playPauseIcon.classList.add("focused");
        playPauseIcon.style.display = "flex";
        playPauseIcon.style.opacity = "1";
      }
      // Reset timer when focusing on controls
      resetControlsTimer();
    } else if (playerSubFocus === 2) {
      // Focus on aspect ratio
      if (aspectRatioBtn) {
        aspectRatioBtn.classList.add("focused");
        aspectRatioBtn.style.display = "block";
        aspectRatioBtn.style.opacity = "1";
      }
      // Reset timer when focusing on controls
      resetControlsTimer();
    }
  };

  const handlePlayerKeydown = (e) => {
    if (!isPlayerActive) return;

    const isFs = checkIsFullscreen();

    // Exit on Escape/Back
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
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      if (isFs) {
        exitFullscreen();
      } else {
        cleanup();
      }
      return;
    }

    // CRITICAL: Stop Enter key from propagating to video player controls
    if (e.key === "Enter" || e.keyCode === 13) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }

    // Show controls on any key press
    resetControlsTimer();

    // Arrow Down - Navigate to next control
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (playerSubFocus === 0) {
        playerSubFocus = 1; // Video → Play/Pause
      } else if (playerSubFocus === 1) {
        playerSubFocus = 2; // Play/Pause → Aspect Ratio
      }
      updateFocus();
      return;
    }

    // Arrow Up - Navigate to previous control
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (playerSubFocus === 2) {
        playerSubFocus = 1; // Aspect Ratio → Play/Pause
      } else if (playerSubFocus === 1) {
        playerSubFocus = 0; // Play/Pause → Video
      }
      updateFocus();
      return;
    }

    // Enter - Activate focused control
    if (e.key === "Enter" || e.keyCode === 13) {
      if (playerSubFocus === 1) {
        // Play/Pause button focused
        togglePlayPause();
      } else if (playerSubFocus === 2) {
        // Aspect Ratio button focused
        handleAspectRatioChange();
      } else if (playerSubFocus === 0) {
        // Video focused - default to play/pause
        togglePlayPause();
      }
      return;
    }
  };

  const play = (stream) => {
    if (!stream) return;

    isPlayerActive = true;

    // Hide Navbar
    const navRoot = document.getElementById("navbar-root");
    if (navRoot) navRoot.style.display = "none";

    // Show player container
    playerContainer.style.display = "block";
    playerContainer.innerHTML = `
      <div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:white;">
        <div style="text-align:center;">
          <i class="fas fa-spinner fa-spin" style="font-size: 50px; margin-bottom:20px;"></i>
          <p>Loading channel...</p>
        </div>
      </div>
    `;

    // Attach Event Listeners with capture to intercept before video player
    document.addEventListener("keydown", handlePlayerKeydown, true);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("msfullscreenchange", handleFullscreenChange);

    try {
      const currentPlaylistData = JSON.parse(
        localStorage.getItem("currentPlaylistData"),
      );
      const playlistLiveExtension = JSON.parse(
        localStorage.getItem("selectedPlaylist"),
      );

      if (!currentPlaylistData || !playlistLiveExtension) {
        console.error("Missing playlist data");
        playerContainer.innerHTML = `
          <div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:#ff5252;">
            <div style="text-align:center;">
              <i class="fas fa-exclamation-triangle" style="font-size: 50px; margin-bottom:20px;"></i>
              <p>Error: Missing playlist data</p>
              <p style="font-size:14px; margin-top:10px; color:#aaa;">Press Escape to go back</p>
            </div>
          </div>
        `;
        return;
      }

      const liveVideoUrl = `${
        currentPlaylistData.server_info.server_protocol
      }://${currentPlaylistData.server_info.url}:${
        currentPlaylistData.server_info.port
      }/live/${currentPlaylistData.user_info.username}/${
        currentPlaylistData.user_info.password
      }/${stream.stream_id}.${playlistLiveExtension.streamFormat || "m3u8"}`;

      if (window.LiveVideoJsComponent) {
        const playerHTML = window.LiveVideoJsComponent(
          stream.stream_id,
          liveVideoUrl,
          stream.stream_icon,
          "100%",
          stream.name || "",
        );

        playerContainer.innerHTML = `
          <div class="ms-player-wrapper" style="width: 100%; height: 100%; position: relative; display: block;">
            ${playerHTML}
          </div>
        `;

        // Wait for player to be ready and attach state listeners
        setTimeout(() => {
          const liveVideoLoader = document.querySelector(".live-video-loader");
          const liveVideoError = document.querySelector(".live-video-error");
          const playPauseIcon = document.querySelector(".play-pause-icon");
          const aspectRatioBtn = document.getElementById(
            "videojs-aspect-ratio",
          );

          // Function to update play/pause icon
          const updatePlayPauseIcon = (isPlaying) => {
            if (playPauseIcon) {
              const icon = playPauseIcon.querySelector("i");
              if (icon) {
                if (isPlaying) {
                  icon.className = "fa-solid fa-pause";
                } else {
                  icon.className = "fa-solid fa-play";
                }
              }
            }
          };

          // Function to hide loader
          const hideLoader = () => {
            if (liveVideoLoader) {
              liveVideoLoader.classList.add("hidden");
              liveVideoLoader.style.display = "none";
            }
          };

          // Function to show error and hide controls
          const showError = (message) => {
            hideLoader();

            // Hide controls
            if (playPauseIcon) playPauseIcon.style.display = "none";
            if (aspectRatioBtn) aspectRatioBtn.style.display = "none";

            // Show error
            if (liveVideoError) {
              liveVideoError.classList.remove("hidden");
              liveVideoError.style.display = "flex";
              const errorText = liveVideoError.querySelector("p");
              if (errorText && message) {
                errorText.textContent = message;
              }
            }
          };

          if (window.livePlayer) {
            if (window.livePlayer._fp) {
              // Flowplayer
              const fp = window.livePlayer._fp;

              fp.on("resume", () => {
                hideLoader();
                updatePlayPauseIcon(true);
              });

              fp.on("pause", () => {
                updatePlayPauseIcon(false);
              });

              fp.on("error", (e) => {
                showError("Failed to load video stream");
              });
            } else {
              // Video.js
              window.livePlayer.on("playing", () => {
                hideLoader();
                updatePlayPauseIcon(true);
              });

              window.livePlayer.on("pause", () => {
                updatePlayPauseIcon(false);
              });

              window.livePlayer.on("play", () => {
                updatePlayPauseIcon(true);
              });

              window.livePlayer.on("error", (e) => {
                const error = window.livePlayer.error();
                let message = "Failed to load video stream";
                if (error) {
                  message = error.message || message;
                }
                showError(message);
              });

              window.livePlayer.on("loadstart", () => {
                // Video is loading, icon should be play
                updatePlayPauseIcon(false);
              });
            }
          }

          // Initialize controls (show and start hide timer)
          resetControlsTimer();
          updateFocus(); // Apply initial focus
        }, 200);

        // Auto-enter fullscreen after a short delay to allow player to initialize
        autoFullscreenTimeout = setTimeout(() => {
          if (isPlayerActive && !checkIsFullscreen()) {
            enterFullscreen();
          }
        }, 500);
      } else {
        console.error("LiveVideoJsComponent is not defined");
        playerContainer.innerHTML = `
          <div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:#ff5252;">
            <div style="text-align:center;">
              <i class="fas fa-exclamation-triangle" style="font-size: 50px; margin-bottom:20px;"></i>
              <p>Player Error: Component Missing</p>
              <p style="font-size:14px; margin-top:10px; color:#aaa;">Press Escape to go back</p>
            </div>
          </div>
        `;
      }
    } catch (e) {
      console.error("Error initializing player", e);
      playerContainer.innerHTML = `
        <div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:#ff5252;">
          <div style="text-align:center;">
            <i class="fas fa-exclamation-triangle" style="font-size: 50px; margin-bottom:20px;"></i>
            <p>Error: ${e.message || "Failed to load player"}</p>
            <p style="font-size:14px; margin-top:10px; color:#aaa;">Press Escape to go back</p>
          </div>
        </div>
      `;
    }
  };

  return {
    play,
    cleanup,
  };
}

window.MasterSearchLivePlayer = MasterSearchLivePlayer;
