function PolicyPage() {
  setTimeout(() => {
    localStorage.removeItem("navigationFocus");
    if (localStorage.getItem("currentPage") !== "policyPage") return;
    if (PolicyPage.cleanup) PolicyPage.cleanup();

    const checkboxInput = document.getElementById("policy-checkbox-input");
    const acceptAllBtn = document.querySelector(".policy-accept-all");
    const agreeBtn = document.querySelector(".policy-agree");
    const focusables = [acceptAllBtn, agreeBtn].filter(Boolean);

    if (!checkboxInput || !acceptAllBtn || !agreeBtn) return;

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

    function proceedAfterAccept() {
      // Persist acceptance and continue app flow
      localStorage.setItem("termsAccepted", "true");
      const playlistsData = localStorage.getItem("playlistsData")
        ? JSON.parse(localStorage.getItem("playlistsData"))
        : [];
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

    function handleAcceptAll() {
      checkboxInput.checked = true;
      checkboxInput.setAttribute("aria-checked", "true");
      checkboxInput.classList.add("checked");
    }

    function handleAgree() {
      if (checkboxInput.checked) {
        // Toaster.showToast(
        //   "success",
        //   "Thank you — your acceptance has been recorded."
        // );
        proceedAfterAccept();
      } else {
        Toaster.showToast("error", "Please check the box before agreeing");
      }
    }

    acceptAllBtn.addEventListener("click", handleAcceptAll);
    agreeBtn.addEventListener("click", (e) => {
      if (!checkboxInput.checked) {
        e.preventDefault();
        e.stopPropagation();
      }
      handleAgree();
    });

    function handleBtnFocus(btn) {
      clearFocusStyles();
      btn.classList.add("policy-focus");
    }

    function handleBtnBlur(btn) {
      btn.classList.remove("policy-focus");
    }

    const acceptAllFocusHandler = function () {
      handleBtnFocus(acceptAllBtn);
    };
    const acceptAllBlurHandler = function () {
      handleBtnBlur(acceptAllBtn);
    };
    const agreeFocusHandler = function () {
      handleBtnFocus(agreeBtn);
    };
    const agreeBlurHandler = function () {
      handleBtnBlur(agreeBtn);
    };

    acceptAllBtn.addEventListener("focus", acceptAllFocusHandler);
    acceptAllBtn.addEventListener("blur", acceptAllBlurHandler);
    agreeBtn.addEventListener("focus", agreeFocusHandler);
    agreeBtn.addEventListener("blur", agreeBlurHandler);

    function checkboxChanged() {
      checkboxInput.setAttribute(
        "aria-checked",
        checkboxInput.checked ? "true" : "false"
      );
      checkboxInput.classList.toggle("checked", checkboxInput.checked);
    }

    checkboxInput.addEventListener("change", checkboxChanged);

    function policyPageKeydownEvents(e) {
      if (localStorage.getItem("currentPage") !== "policyPage") return;
      const key = e.key;
      const focused = focusables[currentIndex];

      switch (key) {
        case "ArrowDown":
        case "ArrowRight":
          updateFocus(currentIndex + 1);
          e.preventDefault();
          break;
        case "ArrowUp":
        case "ArrowLeft":
          updateFocus(currentIndex - 1);
          e.preventDefault();
          break;
        case "Enter":
        case " ":
        case "Spacebar":
          if (focused === acceptAllBtn) {
            handleAcceptAll();
          } else if (focused === agreeBtn) {
            handleAgree();
          }
          e.preventDefault();
          break;
      }
    }

    document.addEventListener("keydown", policyPageKeydownEvents);

    updateFocus(0);

    PolicyPage.cleanup = function () {
      document.removeEventListener("keydown", policyPageKeydownEvents);
      acceptAllBtn.removeEventListener("click", handleAcceptAll);
      agreeBtn.removeEventListener("click", handleAgree);
      checkboxInput.removeEventListener("change", checkboxChanged);
      acceptAllBtn.removeEventListener("focus", acceptAllFocusHandler);
      acceptAllBtn.removeEventListener("blur", acceptAllBlurHandler);
      agreeBtn.removeEventListener("focus", agreeFocusHandler);
      agreeBtn.removeEventListener("blur", agreeBlurHandler);
    };
  }, 0);
  return `<div class="policy-page-container">

  <div class="policy-page-content">
  <div class="policy-page-logo">
  <img src="assets/app-logo.png" alt="App Logo" loading="lazy" class="policy-page-logo-img" />
  </div>
  <div class="privacy-policy-text-container">
<p class="privacy-policy-heading"><img loading="lazy" src="assets/edit-file-icon.png" alt="Terms and Conditions of Use" />Terms and Conditions of Use</p>
<p class="privacy-policy-text">THE USER declares that he has carefully read all the above clauses and conditions, that he expressly accepts and in particular the conditions referred to in points : 3(USER OBLIGATIONS), 5 (INTELLECTUAL PROPERTY AND COPYRIGHT), 6 (SERVICES AND PLATFORM), 7 (EXCLUSION OF LIABILITY), 8 (Exclusion of the right of withdrawal), 9 (GUARANTEES), 10 (LINK TO EXTERNAL SITES), 11 (CONTENTS), 12 (COST OF SERVICES AND PAYMENTS), 13 (UPDATING OF THE APP AND RENEWAL OF THE SUBSCRIPTION), 15 (SUSPENSION AND CANCELLATION), 16 (AMENDMENTS TO THE CONTRACT), 17 (APPLICABLE LAW AND PLACE OF JURISDICTION), 18 (SEPARATION OF LEGAL ACTIONS) 19 LIMITS, 21 (AMENDMENT AND UPDATING OF THE CONDITIONS OF CONTRACT). Such clauses - re-read and approved - are accepted by the Purchaser itself for all subsequent effects.</p>

  <div class="policy-accept-container">
    <div class="policy-checkbox-wrapper">
    <input type="checkbox" id="policy-checkbox-input" class="policy-checkbox" tabindex="-1" aria-checked="false" />
      <label for="policy-checkbox-input" class="policy-checkbox-label">I HAVE READ AND APPROVED THE ABOVE CLAUSES</label>
    </div>

    <div class="policy-buttons-wrapper">
      <div class="policy-buttons">
        <button class="policy-accept-all" tabindex="0">I Accept All</button>
        <button class="policy-agree" tabindex="0">I Agree</button>
      </div>
    </div>
  </div>
  </div>
  </div>

</div>
`;
}
