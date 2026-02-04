function SettingsPage() {
    setTimeout(function() {
        if (SettingsPage.cleanup) SettingsPage.cleanup();

        const container = document.querySelector(".settings-pages-container");
        const items = Array.from(container.querySelectorAll("p"));
        let activeIndex = 0;
        let isInSubPage = false;
        let currentOpenTab = items[0]; // Default to first item

        // Show AccountInformation by default
        const secondContainer = document.querySelector(
            ".settings-second-container"
        );
        secondContainer.innerHTML = AccountInformation();
        isInSubPage = false;

        function updateActiveItem() {
            items.forEach((item, index) => {
                if (index === activeIndex) {
                    item.classList.add("settings-pages-container-active");
                    const img = item.querySelector("img");
                    if (img) img.classList.add("settings-pages-container-image-active");
                } else {
                    item.classList.remove("settings-pages-container-active");
                    const img = item.querySelector("img");
                    if (img)
                        img.classList.remove("settings-pages-container-image-active");
                }
            });
        }

        updateActiveItem();

        function settingsKeydownEvents(e) {
            if (isInSubPage) return;

            if (
                localStorage.getItem("currentPage") !== "settingsPage" &&
                localStorage.getItem("settingPage") !== "settingsPage"
            )
                return;

            // Respect global navigation focus
            if (localStorage.getItem("navigationFocus") === "navbar") return;

            const key = e.key;
            const selectedItem = items[activeIndex];
            console.log(selectedItem, "selectedItem");

            switch (key) {
                case "ArrowDown":
                    if (selectedItem.classList.contains("clear-app-cache")) return;
                    if (activeIndex < items.length - 1) {
                        activeIndex++;
                        updateActiveItem();
                    }
                    break;

                case "ArrowUp":
                    if (activeIndex === 0) {
                        // If first item (Account Info or whatever is first)
                        localStorage.setItem("navigationFocus", "navbar");
                        if (window.setNavbarFocus) {
                            // Assuming Settings is index 4 or similar, finding "Profile" which is last
                            // Or we can just focus the last item used or Profile
                            // Let's default to Profile since Settings is usually accessed via Sidebar which is near Profile
                            // But wait, Navbar is at top. Let's focus Profile icon as it's on right side usually.
                            // Actually, let's just focus the last element in Navbar or Profile.

                            // Better: dispatch event or let Navbar pick up focus
                            // But Navbar logic needs to be triggered.

                            // Let's use the helper exposed in Navbar if available or manual focus
                            const profileIcon = document.getElementById("profileIcon");
                            if (profileIcon) {
                                profileIcon.focus();
                                profileIcon.classList.add("active");
                            }
                        }
                        return;
                    }
                    if (selectedItem.classList.contains("account-info")) return; // Redundant if activeIndex check covers it, but keeping safe
                    activeIndex = (activeIndex - 1 + items.length) % items.length;
                    updateActiveItem();
                    break;

                case "ArrowLeft":
                    // Do nothing
                    break;

                case "ArrowRight":
                    if (selectedItem.classList.contains("account-info")) return;
                    localStorage.setItem("settingPage", "settingsPage");
                    handleSelection(currentOpenTab); // Use currently open tab
                    break;

                case "Enter":
                    handleSelection(selectedItem);
                    break;

                case "Backspace":
                case "Escape":
                case "Back":
                case "BrowserBack":
                case "XF86Back":
                case "10009":
                    SettingsPage.cleanup();

                    Router.showPage("homePage");

                    // Focus on the Home nav item in Navbar
                    localStorage.setItem("navigationFocus", "navbar");
                    setTimeout(() => {
                        // Use setNavbarFocus if available, otherwise focus directly
                        if (window.setNavbarFocus) {
                            window.setNavbarFocus("homePage");
                        } else {
                            const homeNavItem = document.querySelector('.nav-item[data-page="homePage"]');
                            if (homeNavItem) {
                                homeNavItem.focus();
                                homeNavItem.classList.add("active");
                            }
                        }
                    }, 50);
                    break;

                default:
                    break;
            }
        }

        function handleSelection(item) {
            const container = document.querySelector(".settings-second-container");

            if (!item.classList.contains("clear-app-cache")) {
                currentOpenTab = item;
            }

            if (item.classList.contains("account-info")) {
                container.innerHTML = AccountInformation();
                isInSubPage = false;
                return;
            }

            isInSubPage = true;

            if (item.classList.contains("stream-format")) {
                container.innerHTML = StreamFormat();
                // Set up cleanup for when returning from StreamFormat
                setupSubPageCleanup();
            } else if (item.classList.contains("time-format")) {
                container.innerHTML = TimeFormat();
                setupSubPageCleanup();
            } else if (item.classList.contains("parental-control")) {
                container.innerHTML = ParentalControl();
                setupSubPageCleanup();
            } else if (item.classList.contains("account-info")) {
                container.innerHTML = AccountInformation();
                setupSubPageCleanup();
            } else if (item.classList.contains("clear-app-cache")) {
                alert("Clear App Cache selected");
            }
        }

        function setupSubPageCleanup() {}

        setupSubPageCleanup();

        // Listen for exit event from subpages
        function handleSubPageExit() {
            isInSubPage = false;
            updateActiveItem();
        }
        document.addEventListener("settings-subpage-exit", handleSubPageExit);

        document.addEventListener("keydown", settingsKeydownEvents);

        SettingsPage.cleanup = function() {
            document.removeEventListener("keydown", settingsKeydownEvents);
            document.removeEventListener("settings-subpage-exit", handleSubPageExit);
            isInSubPage = false;
        };
    }, 0);

    return `
    <div class="settings-main-container">
      <div class="settings-first-container">
        <div class="settings-first-content">
          <h1 class="settings-title"><i class="fa-solid fa-angle-left"></i>Settings</h1>
          <div class="settings-pages-container">
            <p class="account-info"><img src="/assets/account-user.png"/>Account Information</p>

            <p class="stream-format"><img src="/assets/streamformat-icon.png"/>Stream Format</p>
            <p class="time-format"><img src="/assets/timeIcon.png"/>Time Format</p>
            <p class="parental-control"><img src="/assets/parental-lock-icon.png"/>Parental Control</p>
            <!-- <p class="clear-app-cache"><img src="/assets/clear-cache-icon-white.png"/>Clear App Cache</p> -->
          </div>
        </div>
      </div>
      <div class="settings-second-container"></div>
    </div>
  `;
}