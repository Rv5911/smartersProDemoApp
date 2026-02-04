function AccountInformation() {
    var currentPlaylistData =
        JSON.parse(localStorage.getItem("currentPlaylistData")) || {};
    var userInfo = currentPlaylistData.user_info || {};

    return `
    <div class="account-info-container" tabindex="0">
      <div class="account-header">Account information</div>
      
      <div class="account-details-list">
        <div class="account-detail-item">
            <span class="detail-label">Username</span>
            <span class="detail-value">${userInfo.username || "N/A"}</span>
        </div>
        <div class="account-detail-item">
            <span class="detail-label">Account Status</span>
            <span class="detail-value status-active">${
              userInfo.status || "N/A"
            }</span>
        </div>
        <div class="account-detail-item">
            <span class="detail-label">Expiry Date</span>
            <span class="detail-value">${formatUnixDate(
              userInfo.exp_date || "N/A"
            )}</span>
        </div>
        <div class="account-detail-item">
            <span class="detail-label">Active Connections</span>
            <span class="detail-value">${userInfo.active_cons || "N/A"}</span>
        </div>
      </div>
    </div>`;
}