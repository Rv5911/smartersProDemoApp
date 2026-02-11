function ListUsersPage() {
  const listPlaylistsData = localStorage.getItem("playlistsData")
    ? JSON.parse(localStorage.getItem("playlistsData"))
    : [];

  setTimeout(() => {
    if (ListUsersPage.cleanup) ListUsersPage.cleanup();

    const container = document.querySelector(".playlist-cards-container");
    // const addUserBtn = document.querySelector(".list-users-navbar button"); // Removed

    // let onAddUser = false; // Removed
    let currentRow = 0;
    let currentCol = 0;
    let rows = [];
    let enterPressTimer = null;
    let dialogOpen = false;

    function updateCards() {
      return document.querySelectorAll(".playlist-card");
    }

    function computeRows() {
      const cards = updateCards();
      rows = [];
      let currentOffsetTop = null;
      let row = [];

      cards.forEach((card) => {
        if (currentOffsetTop === null || card.offsetTop === currentOffsetTop) {
          row.push(card);
          currentOffsetTop = card.offsetTop;
        } else {
          rows.push(row);
          row = [card];
          currentOffsetTop = card.offsetTop;
        }
      });

      if (row.length > 0) rows.push(row);

      // Ensure focus is strictly within bounds
      if (currentRow >= rows.length) currentRow = Math.max(0, rows.length - 1);
      if (rows[currentRow] && currentCol >= rows[currentRow].length)
        currentCol = Math.max(0, rows[currentRow].length - 1);
    }

    computeRows();
    window.addEventListener("resize", computeRows);

    function setFocus() {
      const cards = updateCards();
      cards.forEach((card) => {
        card.classList.remove("playlist-card-focused");
      });

      if (rows[currentRow] && rows[currentRow][currentCol]) {
        const card = rows[currentRow][currentCol];
        card.classList.add("playlist-card-focused");

        card.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest",
        });
      }
    }

    if (updateCards().length > 0) setFocus();

    function listUsersKeydownEvents(e) {
      if (dialogOpen) return;
      // if (localStorage.getItem("currentPage") !== "listPage") return;

      const key = e.key;
      switch (key) {
        case "ArrowRight":
          if (currentCol < rows[currentRow].length - 1) {
            currentCol++;
            setFocus();
          }
          break;
        case "ArrowLeft":
          if (currentCol > 0) {
            currentCol--;
            setFocus();
          }
          break;
        case "ArrowDown":
          if (currentRow < rows.length - 1) {
            currentRow++;
            currentCol = Math.min(currentCol, rows[currentRow].length - 1);
            setFocus();
          }
          break;
        case "ArrowUp":
          if (currentRow > 0) {
            currentRow--;
            currentCol = Math.min(currentCol, rows[currentRow].length - 1);
            setFocus();
          }
          break;
        case "Backspace":
        case "Escape":
          // Optional: handle back
          break;
      }
    }

    document.addEventListener("keydown", listUsersKeydownEvents);

    function handleEnterKeyDown(e) {
      if (dialogOpen) return;
      // if (localStorage.getItem("currentPage") !== "listPage") return;
      if (e.key !== "Enter") return;
      if (enterPressTimer) return;

      const card = rows[currentRow] && rows[currentRow][currentCol];
      // Do not allow long press on "Add Playlist" card
      if (card && card.dataset.action === "add-playlist") {
        localStorage.setItem("currentPage", "login");
        Router.showPage("login");
        ListUsersPage.cleanup();
        return;
      }

      enterPressTimer = setTimeout(() => {
        if (enterPressTimer) {
          // Check if not cleared
          computeRows();
          const currentCard = rows[currentRow] && rows[currentRow][currentCol];
          if (currentCard) showRemoveDialog(currentRow, currentCol);
          enterPressTimer = null; // Consume timer
        }
      }, 200); // 800ms for long press
    }

    function handleEnterKeyUp(e) {
      if (dialogOpen) return;
      // if (localStorage.getItem("currentPage") !== "listPage") return;
      if (e.key !== "Enter") return;

      if (enterPressTimer) {
        clearTimeout(enterPressTimer);
        enterPressTimer = null;

        const card = rows[currentRow] && rows[currentRow][currentCol];
        if (card) {
          if (card.dataset.action === "add-playlist") {
            // Navigate to Login Page
            localStorage.setItem("currentPage", "login");
            ListUsersPage.cleanup();
            Router.showPage("login");
          } else {
            // Existing Login Logic
            const titleElement = card.querySelector(".playlist-card-title");
            const playlistName = titleElement
              ? titleElement.textContent
              : "Unknown";

            const playlistsData =
              JSON.parse(localStorage.getItem("playlistsData")) || [];
            const targetIndex = playlistsData.findIndex(
              (pl) => pl.playlistName === playlistName,
            );

            if (targetIndex === -1) {
              console.error("Playlist not found:", playlistName);
              return;
            }

            // Call global loginApi
            if (typeof loginApi === "function") {
              loginApi(
                "",
                "",
                playlistsData[targetIndex].playlistName,
                true,
                playlistsData[targetIndex].playlistUrl,
              ).then((response) => {
                if (response) {
                  localStorage.setItem(
                    "selectedPlaylist",
                    JSON.stringify(playlistsData[targetIndex]),
                  );
                  const loadingEl = document.querySelector("#loading-overlay");
                  if (loadingEl) {
                    loadingEl.style.background = "rgba(0, 0, 0, 0.7)";
                    loadingEl.style.marginTop = "0px";
                  }
                  ListUsersPage.cleanup();
                }
              });
            } else {
              console.error("loginApi function not found");
            }
          }
        }
      }
    }

    document.addEventListener("keydown", handleEnterKeyDown);
    document.addEventListener("keyup", handleEnterKeyUp);

    // --- Remove dialog ---
    function showRemoveDialog(row, col) {
      dialogOpen = true;
      computeRows();
      const card = rows[row] && rows[row][col];
      if (!card) return;

      const titleElement = card.querySelector(".playlist-card-title");
      const title = titleElement ? titleElement.textContent : "Unknown";

      const dialog = document.createElement("div");
      dialog.className = "remove-dialog";
      dialog.innerHTML = `
        <div class="remove-dialog-content" tabindex="0">
          <h2>${title}</h2>
          <p>Are you sure want to delete?</p>
          <div class="remove-dialog-buttons">
            <button class="delete-btn">Delete</button>
            <button class="cancel-btn">Cancel</button>
          </div>
        </div>
      `;
      document.body.appendChild(dialog);

      const deleteBtn = dialog.querySelector(".delete-btn");
      const cancelBtn = dialog.querySelector(".cancel-btn");

      let dialogActiveBtn = "delete";

      function updateDialogFocus() {
        deleteBtn.style.border = "2px solid transparent";
        deleteBtn.style.transform = "scale(1)";
        cancelBtn.style.border = "2px solid transparent";
        cancelBtn.style.transform = "scale(1)";

        if (dialogActiveBtn === "delete") {
          deleteBtn.style.border = "2px solid #fff";
          deleteBtn.style.transform = "scale(1.1)";
          deleteBtn.focus();
        } else {
          cancelBtn.style.border = "2px solid #fff";
          cancelBtn.style.transform = "scale(1.1)";
          cancelBtn.focus();
        }
      }
      updateDialogFocus();

      function dialogKeydown(e) {
        if (!dialogOpen) return;
        e.preventDefault();
        e.stopPropagation();

        switch (e.key) {
          case "ArrowRight":
          case "Tab":
            dialogActiveBtn =
              dialogActiveBtn === "delete" ? "cancel" : "delete";
            updateDialogFocus();
            break;
          case "ArrowLeft":
            dialogActiveBtn =
              dialogActiveBtn === "cancel" ? "delete" : "cancel";
            updateDialogFocus();
            break;
          case "Enter":
            if (dialogActiveBtn === "delete") {
              removePlaylist(row, col);
              closeDialog();
            } else {
              closeDialog();
            }
            break;
          case "Escape":
          case "Backspace":
            closeDialog();
            break;
        }
      }

      function closeDialog() {
        dialogOpen = false;
        if (document.body.contains(dialog)) {
          document.body.removeChild(dialog);
        }
        document.removeEventListener("keydown", dialogKeydown);
        setFocus(); // Restore focus to cards page
      }

      document.addEventListener("keydown", dialogKeydown);

      deleteBtn.addEventListener("click", () => {
        removePlaylist(row, col);
        closeDialog();
      });

      cancelBtn.addEventListener("click", closeDialog);
    }

    function removePlaylist(row, col) {
      computeRows();

      // Calculate which card index to remove (flattened index)
      // Note: rows might include the "Add Playlist" card, but listPlaylistsData does not.
      // We must map row/col to index in listPlaylistsData.
      // Since "Add Playlist" is the LAST card, we should be careful.

      // Flatten rows to find generic index
      let flatIndex = 0;
      for (let r = 0; r < row; r++) {
        flatIndex += rows[r].length;
      }
      flatIndex += col;

      // If flatIndex is out of bounds of data arrow (i.e. it's the Add Playlist card)
      // we shouldn't be here anyway due to checks, but just in case.

      const data = JSON.parse(localStorage.getItem("playlistsData")) || [];

      if (flatIndex >= data.length) {
        console.error("Attempted to remove non-data card");
        return;
      }

      // Remove selected item
      data.splice(flatIndex, 1);

      // Save updated list
      localStorage.setItem("playlistsData", JSON.stringify(data));

      // Reload/Cleanup
      if (data.length === 0) {
        localStorage.setItem("currentPage", "loginPage");
        ListUsersPage.cleanup();
        Router.showPage("login");
      } else {
        ListUsersPage.cleanup();
        Router.showPage("listPage");
      }
    }

    ListUsersPage.cleanup = function () {
      document.removeEventListener("keydown", listUsersKeydownEvents);
      document.removeEventListener("keydown", handleEnterKeyDown);
      document.removeEventListener("keyup", handleEnterKeyUp);
      window.removeEventListener("resize", computeRows);
    };
  }, 0);

  const cardsHTML = listPlaylistsData
    .map(
      (user, index) => `
      <div class="playlist-card" data-index="${index}">
        <div class="playlist-icon-wrapper user-icon-wrapper">
             <img src="./assets/account-user.png" alt="User" class="user-avatar" />
        </div>
        <div class="playlist-card-content">
          <p class="playlist-card-title">${user ? user.playlistName : "N/A"}</p>
          <p class="playlist-card-username">${
            user ? user.playlistUsername : "N/A"
          }</p>
        </div>
      </div>
    `,
    )
    .join("");

  // Add Playlist Card HTML
  const addPlaylistCardHTML = `
      <div class="playlist-card" data-action="add-playlist">
        <div class="playlist-icon-wrapper add-icon-wrapper">
             <!-- Use text logic for perfect green circle plus if image fails, or use image -->
             <span style="font-size: 60px; color: white; line-height: 0; padding-bottom: 8px;">+</span>
        </div>
        <div class="playlist-card-content">
          <p class="playlist-card-title">Add Playlist</p>
        </div>
      </div>
  `;

  return `
    <div class="list-users-container">
      <div class="list-users-header">
    <svg width="507" height="180" viewBox="0 0 507 180" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<rect width="506.4" height="180" fill="url(#pattern0_476_257)"/>
<defs>
<pattern id="pattern0_476_257" patternContentUnits="objectBoundingBox" width="1" height="1">
<use xlink:href="#image0_476_257" transform="scale(0.00236967 0.00666667)"/>
</pattern>
<image id="image0_476_257" width="422" height="150" preserveAspectRatio="none" xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAaYAAACWCAYAAACVfCwaAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA2tpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDYuMC1jMDAyIDc5LjE2NDQ2MCwgMjAyMC8wNS8xMi0xNjowNDoxNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpmY2EzYTRhNy0wOTMyLWQyNGMtYjA1My0xNzhjOTgzYWIzZTIiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6NEEwRjIwQzIxMDFCMTFFRUI1QzhCNjM1Mjc4NjQ3ODciIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NEEwRjIwQzExMDFCMTFFRUI1QzhCNjM1Mjc4NjQ3ODciIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDIyLjUgKFdpbmRvd3MpIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6MjY2NkFBN0EwQjQ2MTFFRThGOTRBNTBDM0E0RjQ4QjAiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6MjY2NkFBN0IwQjQ2MTFFRThGOTRBNTBDM0E0RjQ4QjAiLz4gPC9yZGY6RGVz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"/>
</defs>
</svg>
      </div>
      <div class="playlist-cards-container">
        ${cardsHTML}
        ${addPlaylistCardHTML}
      </div>
      <div class="playlist-instructions">
         <p>Hold Enter to Remove Playlist</p>
      </div>
    </div>
  `;
}
