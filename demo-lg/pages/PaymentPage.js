function PaymentPage() {
    setTimeout(function() {
        localStorage.removeItem("navigationFocus");
        if (localStorage.getItem("currentPage") !== "paymentPage") return;
        if (PaymentPage.cleanup) PaymentPage.cleanup();

        const customLink = document.querySelector(".payment-link");
        const addPlaylistButton = document.querySelector(".add-playlist-button");
        const reloadButton = document.querySelector(".reload-button");

        let currentSlide = 0;
        let sliderInterval;

        function updateSlider() {
            const slides = document.querySelectorAll(".payment-slider-slide");
            const dots = document.querySelectorAll(".payment-slider-dot");

            slides.forEach((slide, index) => {
                slide.classList.remove("active");
                if (index === currentSlide) {
                    slide.classList.add("active");
                }
            });

            dots.forEach((dot, index) => {
                dot.classList.remove("active");
                if (index === currentSlide) {
                    dot.classList.add("active");
                }
            });
        }

        function nextSlide() {
            const slides = document.querySelectorAll(".payment-slider-slide");
            if (slides.length > 0) {
                currentSlide = (currentSlide + 1) % slides.length;
                updateSlider();
            }
        }

        // Start the slider interval
        if (sliderInterval) clearInterval(sliderInterval);
        sliderInterval = setInterval(nextSlide, 5000);

        const dots = document.querySelectorAll(".payment-slider-dot");
        dots.forEach((dot, index) => {
            dot.addEventListener("click", () => {
                currentSlide = index;
                updateSlider();
                clearInterval(sliderInterval);
                sliderInterval = setInterval(nextSlide, 5000);
            });
        });

        // Focus Logic
        const inputs = [addPlaylistButton, reloadButton].filter(Boolean);

        let currentIndex = 0;
        let lastFocusedInput = null;

        if (inputs.length > 0) {
            inputs[currentIndex].classList.add("payment-button-focused");
        }

        function clearFocusStyles() {
            document
                .querySelectorAll(".payment-button-focused")
                .forEach(function(el) {
                    el.classList.remove("payment-button-focused");
                });
        }

        function updateFocus(newIndex) {
            if (newIndex < 0 || newIndex >= inputs.length) return;

            if (lastFocusedInput) {
                lastFocusedInput.blur();
                lastFocusedInput = null;
            }

            clearFocusStyles();
            currentIndex = newIndex;
            const focused = inputs[currentIndex];

            focused.classList.add("payment-button-focused");
            focused.focus(); // Ensure native focus if needed
        }

        function handleReload() {
            Toaster.showToast("info", "Reloading...");
            // Add reload logic here
            window.location.reload();
        }

        function handleAddPlaylist() {
            localStorage.setItem("currentPage", "login");
      Router.showPage("login");
        }

        function paymentPageKeydownEvents(e) {
            if (localStorage.getItem("currentPage") !== "paymentPage") {
                return;
            }
            const key = e.key;

            if (
                key !== "ArrowDown" &&
                key !== "ArrowUp" &&
                key !== "ArrowLeft" &&
                key !== "ArrowRight" &&
                key !== "Enter"
            ) {
                return;
            }

            switch (key) {
                case "ArrowRight":
                    if (inputs[currentIndex] === addPlaylistButton) {
                        updateFocus(inputs.indexOf(reloadButton));
                    }
                    e.preventDefault();
                    break;

                case "ArrowLeft":
                    if (inputs[currentIndex] === reloadButton) {
                        updateFocus(inputs.indexOf(addPlaylistButton));
                    }
                    e.preventDefault();
                    break;

                case "ArrowUp":
                case "ArrowDown":
                    // No vertical navigation needed for this row layout
                    e.preventDefault();
                    break;

                case "Enter":
                    const focused = inputs[currentIndex];
                    if (focused === addPlaylistButton) {
                        handleAddPlaylist();
                    } else if (focused === reloadButton) {
                        handleReload();
                    }
                    e.preventDefault();
                    break;
            }
        }

        document.addEventListener("keydown", paymentPageKeydownEvents);
        addPlaylistButton.addEventListener("click", handleAddPlaylist);
        reloadButton.addEventListener("click", handleReload);

        PaymentPage.cleanup = function() {
            document.removeEventListener("keydown", paymentPageKeydownEvents);
            addPlaylistButton.removeEventListener("click", handleAddPlaylist);
            reloadButton.removeEventListener("click", handleReload);
            if (sliderInterval) clearInterval(sliderInterval);
        };
    }, 0);

    return `
    <div class="payment-page-container">
      <div class="payment-content-div">
        
        <div class="payment-image-div">
          <div class="payment-slider-container">
            <div class="payment-slider-slide active">
              <img class="payment-logo" src="./assets/splash-logo.png" alt="MultiVision Logo">
              <p class="payment-slider-text">Over-The-Top (OTT) apps, which deliver content directly to consumers over the internet (like Netflix, Disney+, Spotify, etc.), offer numerous advantages for users. These benefits have contributed</p>
            </div>
            <!-- Additional slides can be added here if needed to match dots -->
             <div class="payment-slider-slide">
              <img class="payment-logo" src="./assets/splash-logo.png" alt="MultiVision Logo">
              <p class="payment-slider-text">Experience Premium IPTV</p>
            </div>
             <div class="payment-slider-slide">
              <img class="payment-logo" src="./assets/splash-logo.png" alt="MultiVision Logo">
              <p class="payment-slider-text">Watch Anywhere, Anytime</p>
            </div>
          </div>
          
          <div class="payment-slider-dots">
            <span class="payment-slider-dot active"></span>
            <span class="payment-slider-dot"></span>
            <span class="payment-slider-dot"></span>
          </div>
        </div>

        <div class="payment-form-div">
          <h2 class="payment-heading">Authenticate This Device: Scan the Code with Your App.</h2>

          <div class="payment-info-div">
             <div class="payment-device-details">
                <span class="payment-label">Mac ID:</span> <span class="payment-value">89:56:v3:mi:ik:85</span>
                <span class="payment-spacer"></span>
                <span class="payment-label device-key">Device Key:</span> <span class="payment-value">6801</span>
             </div>

             <div class="payment-instruction">
                Add your playlist by Scanning the QR Code or Using the link below.
             </div>

             <div class="payment-qr-container">
                <!-- Using a clear placeholder or generated QR if available -->
                <img class="payment-qr-code" loading="lazy" src="./assets/qr-code.png" style="width: 150px; height: 150px;" alt="QR Code"> 
             </div>

             <a href="#" class="payment-link">https://url_pluse532@12541@2242841685tat442</a>

            <div class="payment-buttons-row">
              <button class="add-playlist-button">Add Playlist From APP</button>
              <button class="reload-button">Reload <img class="payment-button-img" src="./assets/switch-user-icon.png" alt="Reload"></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}