function PolicyPage() {
    setTimeout(() => {
        localStorage.removeItem("navigationFocus");
        if (localStorage.getItem("currentPage") !== "policyPage") return;
        if (PolicyPage.cleanup) PolicyPage.cleanup();

        const acceptBtn = document.querySelector(".policy-accept");
        const cancelBtn = document.querySelector(".policy-cancel");
        const focusables = [acceptBtn].filter(Boolean);

        if (!acceptBtn || !cancelBtn) return;

        let currentIndex = 0;

        function clearFocusStyles() {
            focusables.forEach((el) => el.classList.remove("policy-focus"));
        }

        function updateFocus(newIndex) {
            if (newIndex < 0 || newIndex >= focusables.length) return;
            clearFocusStyles();
            currentIndex = newIndex;
            const el = focusables[currentIndex];
            el.classList.add("policy-focus");
            el.focus();
        }

        function proceedToNextFlow(termsAccepted) {
            // Set terms acceptance status
            localStorage.setItem("termsAccepted", termsAccepted);
            const playlistsData = localStorage.getItem("playlistsData") ?
                JSON.parse(localStorage.getItem("playlistsData")) :
                [];
            const isLogin = localStorage.getItem("isLogin") === "true";

            // Clean up listeners on this page before navigation
            if (PolicyPage.cleanup) PolicyPage.cleanup();

            if (isLogin) {
                localStorage.setItem("currentPage", "preLoginPage");
                Router.showPage("preLoginPage");
            } else if (playlistsData.length > 0 && !isLogin) {
                localStorage.removeItem("navigationFocus");
                localStorage.setItem("currentPage", "listPage");
                Router.showPage("listPage");
            } else {
                localStorage.setItem("currentPage", "login");
                Router.showPage("login");
            }
        }

        function handleAccept() {
            proceedToNextFlow("true");
        }

        function handleCancel() {
            proceedToNextFlow("false");
        }

        acceptBtn.addEventListener("click", handleAccept);
        cancelBtn.addEventListener("click", handleCancel);

        function handleBtnFocus(btn) {
            clearFocusStyles();
            btn.classList.add("policy-focus");
        }

        function handleBtnBlur(btn) {
            btn.classList.remove("policy-focus");
        }

        const acceptFocusHandler = function() {
            handleBtnFocus(acceptBtn);
        };
        const acceptBlurHandler = function() {
            handleBtnBlur(acceptBtn);
        };
        const cancelFocusHandler = function() {
            handleBtnFocus(cancelBtn);
        };
        const cancelBlurHandler = function() {
            handleBtnBlur(cancelBtn);
        };

        acceptBtn.addEventListener("focus", acceptFocusHandler);
        acceptBtn.addEventListener("blur", acceptBlurHandler);
        cancelBtn.addEventListener("focus", cancelFocusHandler);
        cancelBtn.addEventListener("blur", cancelBlurHandler);

        function policyPageKeydownEvents(e) {
            if (localStorage.getItem("currentPage") !== "policyPage") return;
            const key = e.key;
            const focused = focusables[currentIndex];
            const contentContainer = document.querySelector(
                ".privacy-policy-text-container",
            );

            switch (key) {
                case "ArrowDown":
                    // If there's more content to scroll, scroll down
                    if (
                        contentContainer &&
                        contentContainer.scrollTop <
                        contentContainer.scrollHeight - contentContainer.clientHeight
                    ) {
                        contentContainer.scrollTop += 50;
                        e.preventDefault();
                    } else {
                        // Otherwise, move focus to next button
                        updateFocus(currentIndex + 1);
                        e.preventDefault();
                    }
                    break;
                case "ArrowRight":
                    updateFocus(currentIndex + 1);
                    e.preventDefault();
                    break;
                case "ArrowUp":
                    // If scrolled down, scroll up
                    if (contentContainer && contentContainer.scrollTop > 0) {
                        contentContainer.scrollTop -= 50;
                        e.preventDefault();
                    } else {
                        // Otherwise, move focus to previous button
                        updateFocus(currentIndex - 1);
                        e.preventDefault();
                    }
                    break;
                case "ArrowLeft":
                    updateFocus(currentIndex - 1);
                    e.preventDefault();
                    break;
                case "Enter":
                case " ":
                case "Spacebar":
                    if (focused === acceptBtn) {
                        handleAccept();
                    } else if (focused === cancelBtn) {
                        handleCancel();
                    }
                    e.preventDefault();
                    break;
            }
        }

        document.addEventListener("keydown", policyPageKeydownEvents);

        updateFocus(0);

        PolicyPage.cleanup = function() {
            document.removeEventListener("keydown", policyPageKeydownEvents);
            acceptBtn.removeEventListener("click", handleAccept);
            cancelBtn.removeEventListener("click", handleCancel);
            acceptBtn.removeEventListener("focus", acceptFocusHandler);
            acceptBtn.removeEventListener("blur", acceptBlurHandler);
            cancelBtn.removeEventListener("focus", cancelFocusHandler);
            cancelBtn.removeEventListener("blur", cancelBlurHandler);
        };
    }, 0);
    return `<div class="policy-page-container">

  <div class="policy-page-content">
  <div class="policy-page-logo">
  <img src="assets/app-logo.webp" alt="App Logo" loading="lazy" class="policy-page-logo-img" />


  </div>
  <div class="privacy-policy-text-container">
<p class="privacy-policy-heading"><img loading="lazy" src="assets/edit-file-icon.png" alt="Terms and Conditions of Use" />Terms and Conditions of Use</p>
<p class="privacy-policy-text-heading">YOU HEREBY AGREE TO TERMS HERE OTHERWISE DO NOT USE THE APP
</p>

<ul class="list-containerr">
  <li>• We do not provide any actual playlists or contents.</li>
  <li>• This application is designed to use with the user's own or created playlist with legal contents.</li>
  <li>• You are responsible to check your created playlists/contents are legal and you have full rights to use and/or RECORD contents.</li>
  <li>• We are not responsible for misuse of copyright or third party contents using our software and please check your contents are legal and/or you have rights to use and/or RECORD.</li>
  <li>• By using our application means you accept the above terms and conditions</li>
</ul>
<ul class="list-containerr">
  <h2>Disclaimer</h2>
  <li>• Smarters Pro does not provide or solicit any audiovisual content to the users.</li>
  <li>• Smarters Pro has no affiliation with any third-party provider what so ever.</li>
  <li>• Users must provide their own contents.</li>
  <li>• We strictly do not endorse the streaming of copyright-protected material without permission of the copyright holder.</li>
</ul>
  <div class="policy-accept-container">
    <div class="policy-buttons-wrapper">
      <div class="policy-buttons">
        <button class="policy-accept" tabindex="0">Accept</button>
        <button class="policy-cancel" tabindex="0">Cancel</button>
      </div>
    </div>
  </div>
  </div>
  </div>

</div>
`;
}