 const TMBD_API_KEY =  window.TMBD_API_KEY ?  window.TMBD_API_KEY: "a21eeaca44af5d2a4349214ecba1b338";


const apiPostFields = {
  m: "m",
  k: "k",
  sc: "sc",
  r: "r",
  av: "av",
  dt: "dt",
  d: "d",
  do: "do",
  dos: "dos",
  app_type: "app_type",
};

const castImageUrl = "https://image.tmdb.org/t/p/w500";

let currentAnimationId = null;
let currentLoadingValue = 0;

function resetLoadingPercentage() {
  const progressElement = document.getElementById("loading-progress");
  if (progressElement) {
    progressElement.textContent = "0%";
    progressElement.style.display = "block"; // Ensure it's visible
  }

  if (currentAnimationId) {
    cancelAnimationFrame(currentAnimationId);
    currentAnimationId = null;
  }

  currentLoadingValue = 0;

  const messageElement = document.getElementById("loading-message");
  if (messageElement) {
    messageElement.textContent = "";
    messageElement.style.display = "block"; // Ensure it's visible
  }

  const loadingOverlay = document.getElementById("loading-overlay");
  if (loadingOverlay) {
    loadingOverlay.style.background = "rgba(0, 0, 0, 0.85)";
    loadingOverlay.style.marginTop = "0px";
  }
}

function updateLoadingPercentage(targetPercentage, message = "Loading your playlist content...") {
  const progressElement = document.getElementById("loading-progress");
  const messageElement = document.getElementById("loading-message");

  if (messageElement && message) {
    messageElement.textContent = message;
  }

  if (!progressElement) return;

  if (currentAnimationId) {
    cancelAnimationFrame(currentAnimationId);
    currentAnimationId = null;
  }

  // Use the stored value instead of parsing the DOM
  const currentPercentage = currentLoadingValue;

  // If already at target, just ensure it's displayed
  if (targetPercentage === currentPercentage) {
    progressElement.textContent = `${targetPercentage}%`;
    return;
  }

  const duration = 300;
  const startTime = Date.now();
  const startPercentage = currentPercentage;

  function animate() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    const currentValue = Math.round(
      startPercentage + (targetPercentage - startPercentage) * easeOutQuart,
    );

    currentLoadingValue = currentValue;
    progressElement.textContent = `${currentValue}%`;

    if (progress < 1) {
      currentAnimationId = requestAnimationFrame(animate);
    } else {
      currentLoadingValue = targetPercentage;
      progressElement.textContent = `${targetPercentage}%`;
      currentAnimationId = null;
    }
  }

  // Start animation immediately
  currentAnimationId = requestAnimationFrame(animate);
}

function buildLoginUrl(dns, username, password) {
  dns = dns.trim();
  if (!dns.endsWith("/")) {
    dns += "/";
  }
  return `${dns}player_api.php?username=${username}&password=${password}`;
}

async function loginApi(
  username,
  password,
  playlistName,
  fromPlaylist = false,
  playlistUrl = "",
  serverAddress = "",
) {
  const existingPlaylists =
    JSON.parse(localStorage.getItem("playlistsData")) || [];

  if (!fromPlaylist) {
    const duplicate = existingPlaylists.find(
      (p) =>
        p.playlistName.toLowerCase().trim() ===
        playlistName.toLowerCase().trim(),
    );

    if (duplicate) {
      Toaster.showToast("error", "Playlist name already exists!");
      return null;
    }
  }

  resetLoadingPercentage();

  const loadingOverlay = document.getElementById("loading-overlay");
  loadingOverlay.classList.remove("hidden");

  let lastStatusCode = null;
  let loginCancelled = false;

  enableKeyBlock(() => {
    loginCancelled = true;
    loadingOverlay.classList.add("hidden");
    resetLoadingPercentage();
    Toaster.showToast("error", "Login Aborted!");
    if (localStorage.getItem("currentPage") != "listPage") {
      localStorage.setItem("currentPage", "login");
      Router.showPage("login");
    }
  });
  try {
   if (fromPlaylist && playlistUrl) {
      try {
        updateLoadingPercentage(10, "");
        const response = await fetch(playlistUrl);
        if (loginCancelled) {
          return null;
        }

        if (!response.ok) {
          lastStatusCode = response.status;
          throw new Error(`Invalid response ${response.status}`);
        }

        updateLoadingPercentage(20, "Loading your playlist content...");
        const data = await response.json();
        if (loginCancelled) {
          return null;
        }

        if (data && data.user_info) {
          if (data.user_info.auth === 1 && data.user_info.status === "Active") {
            const newPlaylist = {
              playlistName,
              playlistUrl,
              playlistUsername: username,
              playlistServerAddress: serverAddress || "",
            };

            localStorage.setItem(
              "selectedPlaylist",
              JSON.stringify(newPlaylist),
            );
            const newCurrentPlaylistData = {
              ...data,
              playlistName: playlistName,
            };
            localStorage.setItem(
              "currentPlaylistData",
              JSON.stringify(newCurrentPlaylistData),
            );

            updateLoadingPercentage(30, "Loading your playlist content...");
            const vodMovies = await getAllVodMovies();
            if (loginCancelled || !vodMovies) {
              throw new Error("Failed to load movies data");
            }
            await new Promise((r) => setTimeout(r, 100));

            updateLoadingPercentage(40, "Loading your playlist content...");
            const moviesCategories = await getMoviesCategories();
            if (loginCancelled || !moviesCategories) {
              throw new Error("Failed to load movie categories");
            }
            await new Promise((r) => setTimeout(r, 100));

            updateLoadingPercentage(50, "Loading your playlist content...");
            const vodSeries = await getAllVodSeries();
            if (loginCancelled || !vodSeries) {
              throw new Error("Failed to load series data");
            }
            await new Promise((r) => setTimeout(r, 100));

            updateLoadingPercentage(60, "Loading your playlist content...");
            const seriesCategories = await getSeriesCategories();
            if (loginCancelled || !seriesCategories) {
              throw new Error("Failed to load series categories");
            }
            await new Promise((r) => setTimeout(r, 100));

            updateLoadingPercentage(70, "Loading your playlist content...");
            const vodAllLiveStreams = await getAllLiveStreams();
            if (loginCancelled || !vodAllLiveStreams) {
              throw new Error("Failed to load live streams");
            }
            await new Promise((r) => setTimeout(r, 100));

            updateLoadingPercentage(80, "Loading your playlist content...");
            const liveCategories = await getLiveCategories();
            if (loginCancelled || !liveCategories) {
              throw new Error("Failed to load live categories");
            }
            await new Promise((r) => setTimeout(r, 100));

            window.allMoviesStreams = vodMovies;
            window.moviesCategories = moviesCategories;
            window.allSeriesStreams = vodSeries;
            window.allseriesCategories = seriesCategories;
            window.allLiveStreams = vodAllLiveStreams;
            window.liveCategories = liveCategories;

            updateLoadingPercentage(100, "Loading your playlist content...");

            if (!fromPlaylist) {
              existingPlaylists.push(newPlaylist);
              localStorage.setItem(
                "playlistsData",
                JSON.stringify(existingPlaylists),
              );
            }

            setTimeout(() => {
              localStorage.setItem("isLogin", true);

              localStorage.setItem("navigationFocus", "navbar");
              localStorage.setItem("currentPage", "moviesPage");
              Router.showPage("moviesPage");
              if (typeof window.setNavbarFocus === "function") {
                window.setNavbarFocus("moviesPage");
              }
              loadingOverlay.classList.add("hidden");
              disableKeyBlock();
            }, 500);
            return true;
          } else {
            throw new Error("Account not activated");
          }
        } else {
          throw new Error("Invalid Credentials");
        }
      } catch (error) {
        if (loginCancelled) return null;

        console.log("❌ Failed to load playlist:", playlistUrl, error);
        throw new Error(
          `Invalid Credentials ${
            lastStatusCode ? `(Status: ${lastStatusCode})` : ""
          }`,
        );
      }
    }

    const verifyApiData = await verifyServerDns(serverAddress);
    console.log(verifyApiData, "verifyApiData");
    if (verifyApiData) {
      window.dnsNotValid =
        verifyApiData.status == true ||
        verifyApiData.status === "true" ||
        verifyApiData.success === true
          ? false
          : true;
    } else {
      window.dnsNotValid = true;
    }
  } catch (e) {
    console.error("DNS verification failed", e);
    window.dnsNotValid = true; // Block by default on error
  }

  if (window.dnsNotValid === true) {
    // If we are on PreLoginPage or ListUsersPage, navigate to LoginPage first so the dialog renders there
    const isPreLoginPage = document.querySelector(".prelogin-page-container");
    const isListPageForDns = document.querySelector(".list-users-container");
    if (isPreLoginPage || isListPageForDns) {
      loadingOverlay.classList.add("hidden");
      disableKeyBlock();
      localStorage.setItem("currentPage", "login");
      Router.showPage("login");
      // Short delay to let the login page render before showing dialog
      await new Promise((r) => setTimeout(r, 300));
    }

    showQrCode()
      .then(() => {
        console.log(
          window.dnsNotValid,
          " window.dnsNotValid window.dnsNotValid",
        );
        if (loginCancelled) return null;

        const isLoginPage = document.querySelector(".login-page-container");
        const isListUsersPage = document.querySelector(".list-users-container");

        if (isLoginPage || isListUsersPage) {
          const previousActiveElement = document.activeElement;

          // Create Dialog
          const dialog = document.createElement("div");
          dialog.id = "dns-dialog";

          const content = document.createElement("div");
          content.className = "dns-dialog-content";

          content.innerHTML = `
                <div style=" margin-bottom: 20px;" class="dns-website-logo-container">
              <img src="assets/app-logo.webp" alt="Website Icon" class="website-logo"  />
            </div>
            <h2 class="dns-dialog-title">Server address is not whitelisted</h2>
            <p class="dns-dialog-message"> ${window.isQrCode == true ? "Please whitelist your server address scan the QR code to continue or using the link below " : "Please whitelist your server address using the link below to continue"}</p>

            <div class="dns-qr-container" id="dns-qr-code" style="display: ${window.isQrCode == true ? "inline-block" : "none"}">
            </div>

            <div  class="dns-website-container">
            <div style="display:none;" class="dns-website-logo-container">
              <img src="assets/app-logo.webp" alt="Website Icon" class="website-logo"  />
            </div>
              <p style="display: ${window.isQrCode == true ? "block" : "none"}" class="dns-website-or">OR</p>
                     <p class="dns-dialog-message-website-link" style="display:none;">Please whitelist your server address using the link below to continue</p>
              <a target="_blank" style="display: ${window.websiteLink ? "block" : "none"}" href="${window.websiteLink}" class="dns-website-link">${window.websiteLink}</a>
            </div>

            <div class="dns-close-hint">
              Press Back to Close
            </div>
          `;

          dialog.appendChild(content);
          document.body.appendChild(dialog);

          // Generate QR Code locally
          if (window.isQrCode == true) {
            const qrContainer = document.getElementById("dns-qr-code");
            if (qrContainer) {
              new QRCode(qrContainer, {
                text: `${window.cartLink}${serverAddress}`,
                width: 300,
                height: 300,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H,
              });
            }
          }

          // Hide loader and disable global key block (so we can handle back button for dialog)
          loadingOverlay.classList.add("hidden");
          disableKeyBlock();

          // Define closeDialog first
          const closeDialog = () => {
            console.log("Closing DNS dialog");

            // Remove event listener
            document.removeEventListener("keydown", handleKeydown, true);

            // Remove dialog from DOM
            if (document.body.contains(dialog)) {
              document.body.removeChild(dialog);
            }

            // Restore focus
            if (previousActiveElement) {
              previousActiveElement.focus();
            }
          };

          // Block background interactions and handle Back
          const handleKeydown = (e) => {
            console.log("DNS Dialog key pressed:", e.key);
            e.stopPropagation();
            e.stopImmediatePropagation();
            e.preventDefault();
            const backKeys = [
              10009,
              100079,
              8,
              461,
              27,
              "Escape",
              "Back",
              "BrowserBack",
              "XF86Back",
              "Backspace",
            ];

            if (backKeys.includes(e.key) || backKeys.includes(e.keyCode)) {
              closeDialog();
            }
          };

          // Add event listener with capture phase
          document.addEventListener("keydown", handleKeydown, true);

          // ABORT LOGIN FLOW
          return null;
        }
      })
      .catch((error) => {
        Toaster.showToast(
          "error",
          "DNS is not whitelisted. Please register your DNS to continue.",
        );
        return;
      });

    return null;
  }

  try {

    let dnsToCheck = [];
    let isSingleDns = false;

    if (serverAddress) {
      let processedAddress = serverAddress.trim();
      if (!processedAddress.endsWith("/")) {
        processedAddress += "/";
      }

      const lowerAddr = processedAddress.toLowerCase();
      if (lowerAddr.startsWith("http://") || lowerAddr.startsWith("https://")) {
        dnsToCheck = [processedAddress];
        isSingleDns = true;
      } else {
        dnsToCheck = [
          `http://${processedAddress}`,
          `https://${processedAddress}`,
        ];
        isSingleDns = false;
      }
    } else {
      throw new Error("Server address is required");
    }
    let success = false;

    for (let i = 0; i < dnsToCheck.length; i++) {
      if (loginCancelled) {
        return null;
      }

      const apiUrl = buildLoginUrl(dnsToCheck[i], username, password);
      updateLoadingPercentage(10 + i * 5, "");

      try {
        const response = await fetch(apiUrl);
        if (loginCancelled) {
          return null;
        }

        if (!response.ok) {
          lastStatusCode = response.status;
          console.log(
            `❌ Failed DNS: ${dnsToCheck[i]} (Status: ${response.status})`,
          );

          if (isSingleDns) {
            updateLoadingPercentage(100, "");
            setTimeout(() => {
              loadingOverlay.classList.add("hidden");
              disableKeyBlock();
              resetLoadingPercentage();
              Toaster.showToast(
                "error",
                `Login Failed: Status ${response.status} ${
                  response.statusText || ""
                }`,
              );
            }, 500);
            return null;
          }
          continue;
        }

        const data = await response.json();
        if (loginCancelled) {
          return null;
        }

        if (data && data.user_info) {
          if (data.user_info.auth === 1 && data.user_info.status === "Active") {
            const newPlaylist = {
              playlistName,
              playlistUrl: apiUrl,
              playlistUsername: username,
              playlistServerAddress: serverAddress || "",
            };

            localStorage.setItem(
              "selectedPlaylist",
              JSON.stringify(newPlaylist),
            );
            const newCurrentPlaylistData = {
              ...data,
              playlistName: playlistName,
            };
            localStorage.setItem(
              "currentPlaylistData",
              JSON.stringify(newCurrentPlaylistData),
            );

            updateLoadingPercentage(35, "Loading your playlist content...");
            const vodMovies = await getAllVodMovies();
            if (loginCancelled || !vodMovies) {
              throw new Error("Failed to load movies data");
            }
            await new Promise((r) => setTimeout(r, 100));

            updateLoadingPercentage(45, "Loading your playlist content...");
            const moviesCategories = await getMoviesCategories();
            if (loginCancelled || !moviesCategories) {
              throw new Error("Failed to load movie categories");
            }
            await new Promise((r) => setTimeout(r, 100));

            updateLoadingPercentage(55, "Loading your playlist content...");
            const vodSeries = await getAllVodSeries();
            if (loginCancelled || !vodSeries) {
              throw new Error("Failed to load series data");
            }
            await new Promise((r) => setTimeout(r, 100));

            updateLoadingPercentage(65, "Loading your playlist content...");
            const seriesCategories = await getSeriesCategories();
            if (loginCancelled || !seriesCategories) {
              throw new Error("Failed to load series categories");
            }
            await new Promise((r) => setTimeout(r, 100));

            updateLoadingPercentage(75, "Loading your playlist content...");
            const vodAllLiveStreams = await getAllLiveStreams();
            if (loginCancelled || !vodAllLiveStreams) {
              throw new Error("Failed to load live streams");
            }
            await new Promise((r) => setTimeout(r, 100));

            updateLoadingPercentage(85, "Loading your playlist content...");
            const liveCategories = await getLiveCategories();
            if (loginCancelled || !liveCategories) {
              throw new Error("Failed to load live categories");
            }
            await new Promise((r) => setTimeout(r, 100));

            window.allMoviesStreams = vodMovies;
            window.moviesCategories = moviesCategories;
            window.allSeriesStreams = vodSeries;
            window.allseriesCategories = seriesCategories;
            window.allLiveStreams = vodAllLiveStreams;
            window.liveCategories = liveCategories;

            if (!fromPlaylist) {
              existingPlaylists.push(newPlaylist);
              localStorage.setItem(
                "playlistsData",
                JSON.stringify(existingPlaylists),
              );
            }

            updateLoadingPercentage(100, "Loading your playlist content...");
            success = true;

            setTimeout(() => {
              localStorage.setItem("isLogin", true);

              localStorage.setItem("navigationFocus", "navbar");
              localStorage.setItem("currentPage", "moviesPage");
              Router.showPage("moviesPage");
              if (typeof window.setNavbarFocus === "function") {
                window.setNavbarFocus("moviesPage");
              }
              loadingOverlay.classList.add("hidden");
              disableKeyBlock();
            }, 500);
            return true;
          } else {
            throw new Error("Account not activated");
          }
        }
      } catch (error) {
        if (loginCancelled) return null;
        console.log("❌ Failed DNS:", dnsToCheck[i], error);

        if (isSingleDns) {
          updateLoadingPercentage(100, "");
          setTimeout(() => {
            loadingOverlay.classList.add("hidden");
            disableKeyBlock();
            resetLoadingPercentage();
            Toaster.showToast("error", `Connection Error: ${error.message}`);
          }, 500);
          return null;
        }
        continue;
      }
    }

    if (!success) {
      throw new Error(
        `Invalid Credentials${
          lastStatusCode ? ` (Status: ${lastStatusCode})` : ""
        }`,
      );
    }


  } catch (error) {
    if (loginCancelled) return null;

    console.log("❌ Login failed:", error);
    updateLoadingPercentage(100, "Login failed");

    // Check if it's an "Invalid Playlist Data" error
    const isInvalidPlaylistError =
      error.message && error.message.includes("Invalid Playlist Data");

    setTimeout(() => {
      loadingOverlay.classList.add("hidden");
      disableKeyBlock();
      resetLoadingPercentage();

      // If Invalid Playlist Data error, clear session and navigate to login
      if (isInvalidPlaylistError) {
        console.log("🔄 Invalid Playlist Data detected - redirecting to login");

        // Clear login state
        localStorage.removeItem("isLogin");
        localStorage.removeItem("selectedPlaylist");
        localStorage.removeItem("currentPlaylistData");

        // Navigate to login page
        localStorage.setItem("navigationFocus", "navbar");
        localStorage.setItem("currentPage", "loginPage");
        Router.showPage("loginPage");

        Toaster.showToast(
          "error",
          "Invalid Playlist Data. Please login again.",
        );
      } else {
        // Show normal error toast
        Toaster.showToast("error", error.message);
      }
    }, 500);
    return null;
  }
}

// ✅ Get movies categories
async function getMoviesCategories() {
  const selectedPlaylist = JSON.parse(localStorage.getItem("selectedPlaylist"));
  try {
    if (selectedPlaylist) {
      const response = await fetch(
        `${selectedPlaylist.playlistUrl}&action=get_vod_categories`,
      );
      if (!response.ok) throw new Error("Failed to fetch categories");
      return await response.json();
    }
  } catch (error) {
    console.log("❌ Failed to get movies categories:", error);
  }
  return null;
}

// ✅ Get all VOD movies
async function getAllVodMovies() {
  const selectedPlaylist = JSON.parse(localStorage.getItem("selectedPlaylist"));
  try {
    if (selectedPlaylist) {
      const response = await fetch(
        `${selectedPlaylist.playlistUrl}&action=get_vod_streams`,
      );
      if (!response.ok) throw new Error("Failed to fetch movies");
      return await response.json();
    }
  } catch (error) {
    console.log("❌ Failed to get movies:", error);
  }
  return null;
}

async function getMovieDetail(movieId) {
  const selectedPlaylist = JSON.parse(localStorage.getItem("selectedPlaylist"));
  try {
    if (selectedPlaylist) {
      const response = await fetch(
        `${selectedPlaylist.playlistUrl}&action=get_vod_info&vod_id=${movieId}`,
      );
      if (!response.ok) throw new Error("Failed to fetch movies");
      return await response.json();
    }
  } catch (error) {
    console.log("❌ Failed to get movies:", error);
  }
  return null;
}

//series API's
async function getAllVodSeries() {
  const selectedPlaylist = JSON.parse(localStorage.getItem("selectedPlaylist"));
  try {
    if (selectedPlaylist) {
      const response = await fetch(
        `${selectedPlaylist.playlistUrl}&action=get_series`,
      );
      if (!response.ok) throw new Error("Failed to fetch get_series");
      return await response.json();
    }
  } catch (error) {
    console.log("❌ Failed to get get_series:", error);
  }
  return null;
}

async function getSeriesCategories() {
  const selectedPlaylist = JSON.parse(localStorage.getItem("selectedPlaylist"));
  try {
    if (selectedPlaylist) {
      const response = await fetch(
        `${selectedPlaylist.playlistUrl}&action=get_series_categories`,
      );
      if (!response.ok)
        throw new Error("Failed to get_series_categories categories");
      return await response.json();
    }
  } catch (error) {
    console.log("❌ Failed to get get_series_categories categories:", error);
  }
  return null;
}

async function getSeriesDetail(seriesId) {
  const selectedPlaylist = JSON.parse(localStorage.getItem("selectedPlaylist"));
  try {
    if (selectedPlaylist) {
      const response = await fetch(
        `${selectedPlaylist.playlistUrl}&action=get_series_info&series_id=${seriesId}`,
      );
      if (!response.ok) throw new Error("Failed to get_series_detail item");
      return await response.json();
    }
  } catch (error) {
    console.log("❌ Failed to get_series_detail item:", error);
  }
  return null;
}
//Live API's

async function getAllLiveStreams() {
  const selectedPlaylist = JSON.parse(localStorage.getItem("selectedPlaylist"));
  try {
    if (selectedPlaylist) {
      const response = await fetch(
        `${selectedPlaylist.playlistUrl}&action=get_live_streams`,
      );
      if (!response.ok) throw new Error("Failed to fetch get_live_streams");
      return await response.json();
    }
  } catch (error) {
    console.log("❌ Failed to get get_live_streams:", error);
  }
  return null;
}

async function getLiveCategories() {
  const selectedPlaylist = JSON.parse(localStorage.getItem("selectedPlaylist"));
  try {
    if (selectedPlaylist) {
      const response = await fetch(
        `${selectedPlaylist.playlistUrl}&action=get_live_categories`,
      );
      if (!response.ok)
        throw new Error("Failed to get_live_categories categories");
      return await response.json();
    }
  } catch (error) {
    console.log("❌ Failed to get get_live_categories categories:", error);
  }
  return null;
}

async function getSeriesTmbdId(seriesName) {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/search/tv?api_key=${localStorage.getItem(
        "tmbdId",
      )}&query=${seriesName}`,
    );

    if (!response.ok) throw new Error("Failed to fetch getSeriesTmbdId");
    return await response.json();
  } catch (error) {
    console.log("❌ Failed to get getSeriesTmbdId:", error);
  }
}

async function getSeriesCast(seriesId) {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/tv/${seriesId}/credits?api_key=${localStorage.getItem(
        "tmbdId",
      )}`,
    );
    if (!response.ok) throw new Error("Failed to fetch getSeriesCasts");
    return await response.json();
  } catch (error) {
    console.log("❌ Failed to get getSeriesCasts:", error);
  }
}

async function getMovieCast(movies_tmbd_id) {
  try {
    const repsonse = await fetch(
      `https://api.themoviedb.org/3/movie/${movies_tmbd_id}/credits?api_key=${localStorage.getItem(
        "tmbdId",
      )}`,
    );

    if (!repsonse.ok) throw new Error("Failed to fetch getMovieCast");
    return await repsonse.json();
  } catch (error) {
    console.log("❌ Failed to get getMovieCast:", error);
  }
}

async function getLiveStreamEpg(liveStreamId) {
  const selectedPlaylist = JSON.parse(localStorage.getItem("selectedPlaylist"));
  try {
    if (selectedPlaylist) {
      const response = await fetch(
        `${selectedPlaylist.playlistUrl}&action=get_short_epg&stream_id=${liveStreamId}`,
      );
      if (!response.ok) throw new Error("Failed to fetch getLiveStreamEpg");
      return await response.json();
    }
  } catch (error) {
    console.log("❌ Failed to get getLiveStreamEpg:", error);
  }
  return null;
}

function getDnsIsValid(dataToSend) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    Object.keys(dataToSend).forEach((key) => {
      if (apiPostFields.hasOwnProperty(key)) {
        formData.append(apiPostFields[key], dataToSend[key]);
      }
    });

    getApiBaseUrl().then((apiBaseUrl) => {
      // console.log(apiBaseUrl,"apiBaseUrl")
      fetch(window.apiBaseUrl, {
        method: "POST",
        body: formData,
      })
        .then((response) => {
          if (!response.ok) {
            reject(new Error("Failed to fetch getDnsIsValid"));
          }
          //   console.log(response.json(), "RESPSONE JSON");
          return response.json();
        })
        .then(resolve)
        .catch(reject);
    });
  });
}
