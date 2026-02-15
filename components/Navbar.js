let isSortOptionsOpen = false;

function Navbar() {
  return `
    <div class="navbar-container">
      <div class="navbar-left">
<svg width="207" class="navbar-logo" height="63" viewBox="0 0 207 63" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M35.4824 49.3673C34.3396 49.3673 33.2826 49.3673 32.0541 49.3673C32.0541 44.9105 32.0541 40.4823 32.0541 36.054C31.9112 36.0255 31.7684 36.0255 31.6255 35.9969C30.5685 40.4251 29.4829 44.8819 28.3972 49.4244C27.4259 49.4244 26.426 49.5101 25.4546 49.3673C25.1403 49.3387 24.7118 48.8245 24.6261 48.4816C24.1976 46.7389 23.8547 44.9391 23.4548 43.1678C22.9119 40.8822 22.3406 38.5967 21.712 36.054C21.5978 36.7397 21.4549 37.2539 21.4549 37.7396C21.3978 39.1967 21.4264 40.6822 21.3692 42.1393C21.2549 44.5105 21.1121 46.9103 20.9978 49.3387C20.0265 49.3387 19.0551 49.3387 17.998 49.3387C17.998 43.2249 17.998 37.1397 17.998 30.9402C19.6265 30.9402 21.2549 30.9116 22.8834 30.9687C23.0834 30.9687 23.3976 31.283 23.4833 31.483C23.8547 32.74 24.169 34.0256 24.5118 35.2827C24.9975 37.0254 25.4832 38.7395 25.9688 40.4537C26.1974 41.2536 26.3688 42.0536 26.5688 42.8821C26.6831 42.8821 26.7974 42.8535 26.9116 42.8535C27.3116 41.2822 27.683 39.7109 28.083 38.1396C28.2544 37.4254 28.4258 36.7397 28.6258 36.0255C28.9686 34.6542 29.3114 33.3114 29.6828 31.9401C29.8828 31.2544 30.1971 30.8259 31.0542 30.883C32.5112 30.9687 33.9682 30.9116 35.511 30.9116C35.4824 37.0825 35.4824 43.1678 35.4824 49.3673Z" fill="white"/>
<path d="M67.9654 41.5678C70.308 43.739 73.3935 48.0815 73.5649 49.3671C72.3364 49.3671 71.0794 49.51 69.8795 49.31C69.3652 49.2243 68.9367 48.4815 68.5653 47.9673C67.4511 46.4245 66.3369 44.8818 65.2513 43.3105C64.2228 41.8249 62.7943 41.7677 61.1088 41.9963C61.1088 44.4532 61.1088 46.8531 61.1088 49.31C59.8803 49.31 58.7661 49.31 57.5662 49.31C57.5376 48.9672 57.509 48.6243 57.509 48.3101C57.509 42.8819 57.5376 37.4252 57.4805 31.9971C57.4805 31.14 57.6519 30.8257 58.5661 30.8543C61.3087 30.9114 64.0514 30.7972 66.7655 30.9114C68.8224 30.9972 70.8223 31.4828 71.7936 33.6541C72.9364 36.2539 72.365 39.8822 69.1653 40.9678C68.7939 41.1106 68.4225 41.3392 67.9654 41.5678ZM61.1659 38.9108C62.5944 38.9108 63.9657 38.9394 65.3084 38.8823C65.9655 38.8537 66.6226 38.7108 67.2226 38.4823C68.3082 38.0823 68.6796 37.2252 68.5367 35.7682C68.451 34.9111 67.6797 33.9684 66.7655 33.9398C64.9085 33.8541 63.0515 33.9112 61.1373 33.9112C61.1659 35.5968 61.1659 37.1681 61.1659 38.9108Z" fill="white"/>
<path d="M118.963 41.6252C121.763 43.625 123.049 46.5391 124.906 49.396C123.334 49.396 122.049 49.5103 120.82 49.3388C120.363 49.2531 119.963 48.5103 119.592 47.9961C118.449 46.4248 117.306 44.882 116.22 43.2822C115.221 41.8251 113.792 41.8251 112.192 42.0251C112.192 44.4535 112.192 46.8533 112.192 49.3103C110.964 49.3103 109.821 49.3103 108.621 49.3103C108.621 43.225 108.621 37.1398 108.621 30.9974C108.907 30.9689 109.164 30.9117 109.421 30.9117C112.249 30.9117 115.106 30.826 117.935 30.9403C119.306 30.9974 120.677 31.226 121.849 32.283C124.42 34.5971 123.877 39.9967 120.163 41.0252C119.792 41.1109 119.477 41.368 118.963 41.6252ZM112.221 38.9968C114.392 38.654 116.535 39.511 118.477 38.4254C118.992 38.1397 119.449 37.3969 119.563 36.7684C119.763 35.8828 119.706 34.8828 118.677 34.3972C116.592 33.3972 114.392 34.1972 112.221 33.9115C112.221 35.6256 112.221 37.1969 112.221 38.9968Z" fill="white"/>
<path d="M129.532 43.3684C130.332 46.6824 132.989 47.7109 135.903 46.3682C136.789 45.9682 137.36 44.9683 137.189 43.9969C137.046 43.0827 136.303 42.6542 135.474 42.3685C133.532 41.7114 131.56 41.1114 129.646 40.3401C127.732 39.5401 126.047 36.4832 126.961 34.2834C127.761 32.3121 128.989 31.2836 130.932 30.7122C133.389 29.998 135.732 30.3123 137.931 31.4265C139.103 32.0264 140.674 33.8263 140.188 35.7976C140.074 35.8261 139.96 35.9118 139.846 35.9118C138.846 35.9118 137.846 35.9118 136.874 35.9118C135.874 32.9978 133.246 32.8549 130.961 33.9977C130.075 34.4548 130.018 35.8261 130.903 36.3118C131.76 36.7975 132.703 37.0832 133.617 37.3974C135.16 37.9688 136.76 38.3688 138.217 39.0544C140.017 39.9115 140.788 41.5114 140.874 43.4827C140.988 46.0825 140.074 48.1966 137.617 49.1394C135.646 49.8822 133.56 50.225 131.36 49.5679C130.103 49.1965 128.846 48.9394 127.932 47.9395C126.904 46.8253 126.218 45.5968 126.189 43.9398C127.304 43.7684 128.418 43.5684 129.532 43.3684Z" fill="white"/>
<path d="M13.9703 35.9117C12.999 35.9117 11.9991 35.9402 10.9991 35.8831C10.7992 35.8831 10.542 35.5688 10.4563 35.3403C9.51354 33.3404 6.34236 32.6262 4.62821 34.0547C3.7997 34.7689 3.7997 35.826 4.82819 36.3116C6.17094 36.9402 7.62797 37.3973 9.05643 37.8544C10.5706 38.34 12.0848 38.7972 13.2561 39.9399C14.5417 41.1684 14.656 42.7111 14.6846 44.3681C14.7131 46.7965 12.5419 49.3392 10.2278 49.4535C9.05643 49.5106 7.8851 49.8249 6.71376 49.8534C3.51401 49.882 1.14277 48.225 0.114275 45.2252C-0.0285709 44.8253 0.0285692 44.3681 0 43.9396C1.17134 43.7111 2.28553 43.5111 3.39973 43.3111C3.82827 44.7395 4.37109 45.9395 5.77098 46.5965C7.31371 47.3108 10.0564 46.6537 10.9134 45.2824C11.5134 44.311 10.7134 42.7397 9.48497 42.3683C7.8851 41.8826 6.28522 41.3969 4.71392 40.8827C3.25689 40.397 1.99984 39.5685 1.28561 38.2258C0.657091 37.083 0.457106 35.826 0.799936 34.4261C1.4856 31.5691 4.22824 30.5121 6.88517 30.3692C8.51362 30.2835 10.0278 30.5978 11.4848 31.312C13.199 32.1405 14.256 33.9118 13.9703 35.9117Z" fill="white"/>
<path d="M95.2225 33.9685C95.2225 35.2827 95.2225 36.5112 95.2225 37.8539C95.6225 37.8825 95.9939 37.9111 96.3939 37.9111C98.7365 37.9111 101.079 37.9396 103.393 37.9111C104.05 37.9111 104.279 38.1111 104.25 38.7682C104.193 41.3965 104.565 40.8823 102.193 40.9108C99.9079 40.9394 97.5938 40.9108 95.2511 40.9108C95.2511 42.7678 95.2511 44.5106 95.2511 46.3676C98.5651 46.3676 101.851 46.3676 105.222 46.3676C105.222 47.396 105.222 48.3103 105.222 49.3102C100.708 49.3102 96.2225 49.3102 91.6228 49.3102C91.5942 48.9959 91.5657 48.6817 91.5657 48.3674C91.5657 42.8821 91.5657 37.4254 91.5371 31.9401C91.5371 31.1116 91.7657 30.8545 92.5942 30.8545C96.3653 30.8831 100.136 30.9116 103.908 30.8545C104.85 30.8545 105.222 31.1116 105.165 32.083C105.05 33.8543 105.536 33.8828 103.393 33.8828C101.079 33.8828 98.7937 33.8828 96.4796 33.8828C96.0225 33.9114 95.6511 33.94 95.2225 33.9685Z" fill="white"/>
<path d="M44.1412 30.9112C45.6268 30.9112 47.0267 30.8541 48.4266 30.9398C48.7694 30.9684 49.2265 31.3683 49.3693 31.7112C49.8265 32.7111 50.1407 33.7967 50.5121 34.8252C51.3121 37.025 52.1406 39.2534 52.9119 41.4533C53.4833 43.0246 53.9976 44.5959 54.5404 46.1672C54.8832 47.1671 55.2546 48.1956 55.626 49.3098C54.2547 49.3098 52.9976 49.3098 51.712 49.3098C51.2835 48.0527 50.8549 46.7386 50.3978 45.3958C48.0837 45.3958 45.7411 45.3672 43.3984 45.4244C43.1127 45.4244 42.7127 45.8815 42.5984 46.1958C42.227 47.0814 41.9699 48.0528 41.6271 48.967C41.57 49.1384 41.2843 49.3669 41.0843 49.3669C40.0844 49.3955 39.0844 49.3955 37.7988 49.3955C39.7987 43.1103 42.0556 37.0822 44.1412 30.9112ZM43.9126 42.3103C45.7696 42.3103 47.4266 42.3103 49.3408 42.3103C48.5123 39.682 47.7123 37.1965 46.8838 34.6538C46.6267 34.7395 46.2839 34.7395 46.2267 34.8824C45.4268 37.3107 44.684 39.7677 43.9126 42.3103Z" fill="white"/>
<path d="M89.1084 30.9688C89.1084 31.9401 89.1084 32.8543 89.1084 33.9114C87.7371 33.9114 86.3658 33.9685 85.023 33.8828C83.9945 33.8257 83.7088 34.1685 83.7088 35.197C83.766 39.2252 83.7374 43.2821 83.7374 47.3103C83.7374 49.3959 83.7374 49.3959 81.709 49.3959C81.2233 49.3959 80.7091 49.3959 80.1091 49.3959C80.1091 44.2534 80.1091 39.1681 80.1091 33.9114C78.5949 33.9114 77.2236 33.8542 75.8237 33.9399C74.881 33.9971 74.4524 33.74 74.5953 32.74C74.681 32.1972 74.5953 31.6258 74.5953 30.9973C79.4806 30.9687 84.2516 30.9688 89.1084 30.9688Z" fill="white"/>
<path d="M181.614 42.0546C184.585 43.9687 185.7 47.1685 187.757 49.654C185.985 50.3111 184.842 49.9968 183.928 48.6255C182.814 46.9685 181.786 45.2543 180.557 43.683C179.729 42.626 178.643 41.7975 177.1 41.9118C176.186 41.9975 175.243 41.9403 174.243 41.9403C174.243 44.5973 174.243 47.1685 174.243 49.8254C173.358 49.8254 172.586 49.8254 171.758 49.8254C171.758 43.7402 171.758 37.6264 171.758 31.484C172.072 31.4554 172.358 31.4269 172.643 31.4269C175.443 31.4269 178.243 31.3697 181.043 31.4554C182.014 31.484 183.014 31.7411 183.9 32.1411C185.214 32.7125 185.928 33.9981 186.157 35.2837C186.671 38.0835 185.842 40.5976 182.757 41.4832C182.386 41.5689 182.043 41.826 181.614 42.0546ZM174.272 39.969C176.872 39.6262 179.471 40.4833 181.986 39.4548C183.043 39.0263 183.643 38.1978 183.728 37.0264C183.871 35.1694 183.271 34.3695 182.128 33.8838C179.557 32.8268 176.9 33.6838 174.243 33.3696C174.272 35.6265 174.272 37.7121 174.272 39.969Z" fill="white"/>
<path d="M206.784 40.9402C207.041 43.5114 206.127 45.9398 204.212 48.0253C203.355 48.9681 202.241 49.5966 201.013 49.9109C199.984 50.168 198.87 50.4537 197.813 50.3966C194.556 50.1966 192.042 48.7967 190.613 45.6541C188.985 42.0258 189.156 38.3975 190.842 34.9406C191.756 33.0551 193.442 31.6552 195.699 31.3124C196.756 31.1409 197.841 30.941 198.927 30.9124C201.698 30.8838 204.641 33.1122 205.812 35.5692C206.612 37.2547 206.812 38.9118 206.784 40.9402ZM204.355 40.1974C204.355 39.0546 204.212 37.2833 203.212 35.7406C202.47 34.5692 201.47 33.7693 200.127 33.2551C198.156 32.4837 195.099 33.1693 193.728 34.7978C192.528 36.1977 192.27 37.8833 191.985 39.626C191.613 41.9115 192.042 44.0256 193.299 45.8541C195.47 49.0538 199.898 49.3966 202.527 46.4826C204.012 44.8541 204.327 42.9114 204.355 40.1974Z" fill="white"/>
<path d="M154.702 31.3971C157.759 31.3971 160.73 31.1685 163.616 31.4542C167.301 31.7971 169.044 34.3112 168.53 37.7966C168.244 39.7107 167.216 41.682 164.387 42.0534C163.159 42.1962 161.902 42.3391 160.645 42.3962C159.531 42.4534 158.388 42.3962 157.102 42.3962C157.102 43.8247 157.102 45.196 157.102 46.5388C157.102 47.3387 157.074 48.1386 157.102 48.9386C157.131 49.6242 156.902 49.9385 156.188 49.8814C155.702 49.8528 155.217 49.8814 154.674 49.8814C154.702 43.6818 154.702 37.5966 154.702 31.3971ZM157.188 40.3964C158.931 40.3964 160.645 40.3964 162.33 40.3964C164.245 40.3964 165.33 39.7393 165.93 37.968C166.559 36.1396 165.616 33.6541 163.33 33.4541C161.33 33.2541 159.273 33.4255 157.159 33.4255C157.188 35.7396 157.188 38.0252 157.188 40.3964Z" fill="white"/>
<path d="M149.417 44.9679V26.5408C148.931 13.8275 136.989 14.7988 136.989 14.7988L120.762 15.9416L124.019 3.77113C124.819 3.62829 125.447 2.94263 125.447 2.08555C125.447 1.14277 124.676 0.371399 123.733 0.371399C122.79 0.371399 122.019 1.14277 122.019 2.08555C122.019 2.71407 122.333 3.22832 122.819 3.54258L120.133 12.6276C120.133 12.6276 119.276 16.3416 117.991 16.3416C116.705 16.3416 116.419 15.1988 116.419 15.1988L110.048 3.77113C110.391 3.37116 110.591 2.85692 110.591 2.28553C110.591 1.02849 109.563 0 108.306 0C107.049 0 106.02 1.02849 106.02 2.28553C106.02 3.54258 107.049 4.57107 108.306 4.57107C108.448 4.57107 108.591 4.5425 108.706 4.5425L115.277 16.4844C115.277 16.4844 108.963 17.6272 100.221 19.0556C91.4784 20.4841 91.6212 27.5121 91.6212 27.5121C94.3353 20.9126 102.649 20.3413 102.649 20.3413C102.649 20.3413 126.59 16.7987 136.046 16.7987C145.503 16.7987 146.36 25.6837 146.36 25.6837C146.36 25.6837 146.645 28.5406 146.503 45.4536C146.36 62.3665 135.075 62.7379 135.075 62.7379C150.759 65.3949 149.417 44.9679 149.417 44.9679Z" fill="var(--app-text-color)"/>
</svg>
        <div class="search-bar-container">
          <img src="/assets/search-icon-navbar.png" alt="Search Icon" class="nav-search-bar" />
          <input type="text" id="search-input" placeholder="Search" tabindex="0" class="search-bar" />
        </div>
      </div>
      <div class="navbar-right">
        <!-- <div class="nav-item" data-page="homePage" tabindex="0">Home</div> -->
        <div class="nav-item" data-page="masterSearchPage" tabindex="0">Search</div>

        <div class="nav-item" data-page="moviesPage" tabindex="0">Movies</div>
        <div class="nav-item" data-page="seriesPage" tabindex="0">Series</div>
        <div class="nav-item" data-page="liveTvPage" tabindex="0">Live</div>


       <div class="navbar-profile">

    <svg    id="profileIcon"  class="navbar-profile-icon"  width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"> <rect width="60" height="60" rx="4" fill="white" /> <g clip-path="url(#clip0_361_2296)"> <path d="M30.0624 44.225C26.8093 44.225 23.556 44.2285 20.303 44.2235C18.8382 44.2211 17.8594 43.224 17.9038 41.7631C17.9213 41.1892 17.9609 40.6082 18.0707 40.0461C18.9228 35.6867 22.2318 32.5121 26.6314 31.8148C26.976 31.7604 27.3276 31.7287 27.6762 31.7263C29.2307 31.7163 30.7854 31.6958 32.3393 31.7245C36.746 31.8059 40.6546 34.8255 41.8669 39.0614C42.1144 39.9257 42.2517 40.8065 42.2659 41.708C42.2899 43.2503 41.3416 44.2235 39.791 44.2244C36.548 44.2261 33.305 44.225 30.0624 44.225Z" fill="#615dfc" /> <path d="M37.6646 23.461C37.6696 27.6413 34.2642 31.0483 30.0809 31.048C25.8994 31.0477 22.4912 27.6372 22.4981 23.4598C22.5049 19.2851 25.8843 15.9075 30.0664 15.8951C34.2538 15.8826 37.6596 19.2739 37.6646 23.461Z" fill="#F0B696" /> </g> <defs> <clipPath id="clip0_361_2296"> <rect width="29.5973" height="29.5973" fill="white" transform="translate(15.2734 15.2727)" /> </clipPath> </defs> </svg>
</div>

      </div>
    </div>

    <div id="sidebar" class="sidebar option-remove">
      <div class="sidebar-content-wrapper">
        <!-- Main Sidebar Section -->
        <div id="main-sidebar-section" class="sidebar-section active">
          <div class="sidebar-header">
            <div class="sidebar-user-info">
              <span>${JSON.parse(localStorage.getItem("selectedPlaylist")) ? JSON.parse(localStorage.getItem("selectedPlaylist")).playlistName : "N/A"}</span>
            </div>
            <div class="sidebar-user-avatar">
    <svg     width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"> <rect width="60" height="60" rx="4" fill="white" /> <g clip-path="url(#clip0_361_2296)"> <path d="M30.0624 44.225C26.8093 44.225 23.556 44.2285 20.303 44.2235C18.8382 44.2211 17.8594 43.224 17.9038 41.7631C17.9213 41.1892 17.9609 40.6082 18.0707 40.0461C18.9228 35.6867 22.2318 32.5121 26.6314 31.8148C26.976 31.7604 27.3276 31.7287 27.6762 31.7263C29.2307 31.7163 30.7854 31.6958 32.3393 31.7245C36.746 31.8059 40.6546 34.8255 41.8669 39.0614C42.1144 39.9257 42.2517 40.8065 42.2659 41.708C42.2899 43.2503 41.3416 44.2235 39.791 44.2244C36.548 44.2261 33.305 44.225 30.0624 44.225Z" fill="#615dfc" /> <path d="M37.6646 23.461C37.6696 27.6413 34.2642 31.0483 30.0809 31.048C25.8994 31.0477 22.4912 27.6372 22.4981 23.4598C22.5049 19.2851 25.8843 15.9075 30.0664 15.8951C34.2538 15.8826 37.6596 19.2739 37.6646 23.461Z" fill="#F0B696" /> </g> <defs> <clipPath id="clip0_361_2296"> <rect width="29.5973" height="29.5973" fill="white" transform="translate(15.2734 15.2727)" /> </clipPath> </defs> </svg>
            </div>
          </div>

          <div class="sidebar-grid">
            <div class="sidebar-card" data-action="settings" tabindex="0">
              <i class="fa-solid fa-gear"></i>
              <span>Settings</span>
            </div>
            <div class="sidebar-card" data-action="playlist-info" tabindex="0">
              <i class="fa-solid fa-user"></i>
              <span>Playlist Info</span>
            </div>
            <div class="sidebar-card" data-action="switch-playlist" tabindex="0">
              <i class="fa-solid fa-arrows-rotate"></i>
              <span>Switch Playlist</span>
            </div>
            <div class="sidebar-card" data-action="add-playlist" tabindex="0">
              <i class="fa-solid fa-user-plus"></i>
              <span>Add Playlist</span>
            </div>
            <div class="sidebar-card" data-action="dark-mode" tabindex="0">
              <div class="sidebar-card-row">
                <i class="fa-solid fa-moon" id="dark-mode-icon"></i>
                <div class="theme-toggle"></div>
              </div>
              <span class="dark-mode-text">Dark Mode</span>
            </div>
            <div class="sidebar-card" data-action="sort" tabindex="0">
              <i class="fa-solid fa-filter"></i>
              <span>Sort</span>
            </div>
            <div class="sidebar-card" data-action="change-theme" tabindex="0" id="theme-card-container">
              <div id="theme-default-view">
                <i class="fa-solid fa-palette"></i>
                <span>Change Theme</span>
              </div>
              <div id="theme-dots-view" class="option-remove">
                <div class="theme-dots-container">
                  <div class="theme-dot red" data-theme="red" tabindex="0"></div>
                  <div class="theme-dot blue" data-theme="purple" tabindex="0"></div>
                  <div class="theme-dot green" data-theme="green" tabindex="0"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="sidebar-footer">
            <button class="footer-link-primary" data-action="switch-playlist-footer" tabindex="0">Switch Playlist</button>
            <span class="version-text">Version: v1.0</span>
            <span class="contact-text">Contact us at: <span class="contact-email">support@smarterspro.com</span></span>
          </div>
        </div>

        <!-- Playlist Info Section -->
        <div id="playlist-info-section" class="sidebar-section">
          <div class="nested-header">
   
            <span>Playlist Info</span>
          </div>

          <div class="info-list">
            <div class="info-row">
              <i class="fa-solid fa-user"></i>
              <span class="info-label">Username</span>
              <span class="info-value username-val">SimonWinter</span>
            </div>
            <div class="info-row">
              <i class="fa-solid fa-laptop-code"></i>
              <span class="info-label">Account Status</span>
              <span class="info-value status-val">N/A</span>
            </div>
            <div class="info-row">
              <i class="fa-solid fa-calendar-days"></i>
              <span class="info-label">Expiry Date</span>
              <span class="info-value expiry-val">Unlimited</span>
            </div>
            <div class="info-row">
              <i class="fa-solid fa-users"></i>
              <span class="info-label">Active Connections</span>
              <span class="info-value connections-val">N/A</span>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Sort Dialog Overlay -->
    <div id="sort-dialog" class="sort-dialog-overlay option-remove">
      <div class="sort-dialog-content">
        <div class="sort-dialog-header">
           <span>Sort By</span>
        </div>
        <ul class="sort-list">
          <li class="sort-option" tabindex="0" data-sort="default">
            <label class="checkbox-container">
              <input type="checkbox" class="sort-checkbox" data-sort="default">
              <span class="checkmark"></span>
              Default
            </label>
          </li>
          <li class="sort-option" tabindex="0" data-sort="recently-added">
            <label class="checkbox-container">
              <input type="checkbox" class="sort-checkbox" data-sort="recently-added">
              <span class="checkmark"></span>
              Recently Added
            </label>
          </li>
          <li class="sort-option" tabindex="0" data-sort="a-z">
            <label class="checkbox-container">
              <input type="checkbox" class="sort-checkbox" data-sort="a-z">
              <span class="checkmark"></span>
              A-Z
            </label>
          </li>
          <li class="sort-option" tabindex="0" data-sort="z-a">
            <label class="checkbox-container">
              <input type="checkbox" class="sort-checkbox" data-sort="z-a">
              <span class="checkmark"></span>
              Z-A
            </label>
          </li>
          <li class="sort-option" tabindex="0" data-sort="top-rated">
            <label class="checkbox-container">
              <input type="checkbox" class="sort-checkbox" data-sort="top-rated">
              <span class="checkmark"></span>
              Top Rated
            </label>
          </li>
        </ul>
      </div>
    </div>
  `;
}

function buildDynamicSidebarOptions() {
  try {
    const sidebar = document.getElementById("sidebar");
    if (!sidebar) return;
    const grid = sidebar.querySelector(".sidebar-grid");
    if (!grid) return;

    // Remove existing dynamic cards
    grid
      .querySelectorAll(".dynamic-sidebar-option")
      .forEach((el) => el.remove());

    const currentPage = localStorage.getItem("currentPage");

    // Handle Sort Card Visibility
    const sortCard = grid.querySelector('[data-action="sort"]');
    if (sortCard) {
      const SORT_ENABLED_PAGES = ["moviesPage", "seriesPage", "liveTvPage"];
      if (SORT_ENABLED_PAGES.includes(currentPage)) {
        sortCard.classList.remove("option-remove");

        // Handle Top Rated option within the sort menu
        const topRatedOption = document.querySelector(
          '.sort-checkbox[data-sort="top-rated"]',
        );
        if (topRatedOption) {
          const li = topRatedOption.closest("li");
          if (li) {
            if (currentPage === "liveTvPage") li.classList.add("option-remove");
            else li.classList.remove("option-remove");
          }
        }
      } else {
        sortCard.classList.add("option-remove");
      }
    }

    const currentPlaylist = getCurrentPlaylist();
    if (!currentPlaylist) return;

    let label = "";
    let action = "";
    const allRecentlyWatchedMovies = currentPlaylist.continueWatchingMovies;
    const allRecentlyWatchedSeries = currentPlaylist.continueWatchingSeries;
    const allRecentlyWatchedChannels = currentPlaylist.ChannelListLive;
    const selectedMovieId = localStorage.getItem("selectedMovieId");
    const selectedSeriesId = localStorage.getItem("selectedSeriesId");

    const isIncludedInRecentlyWatchedMovies =
      allRecentlyWatchedMovies &&
      allRecentlyWatchedMovies.some((m) => m && m.itemId == selectedMovieId);
    const isIncludedInRecentlyWatchedSeries =
      allRecentlyWatchedSeries &&
      allRecentlyWatchedSeries.some((s) => s && s.itemId == selectedSeriesId);

    if (currentPage === "moviesPage") {
      if (allRecentlyWatchedMovies && allRecentlyWatchedMovies.length > 0) {
        label = "Clear Movie History";
        action = "remove-all-movies";
      }
    } else if (currentPage === "seriesPage") {
      if (allRecentlyWatchedSeries && allRecentlyWatchedSeries.length > 0) {
        label = "Clear Series History";
        action = "remove-all-series";
      }
    } else if (currentPage === "liveTvPage") {
      if (allRecentlyWatchedChannels && allRecentlyWatchedChannels.length > 0) {
        label = "Clear TV History";
        action = "clear-channel-history";
      }
    } else if (currentPage === "movieDetailPage") {
      if (isIncludedInRecentlyWatchedMovies) {
        label = "Remove Movie History";
        action = "remove-movie";
      }
    } else if (currentPage === "seriesDetailPage") {
      if (isIncludedInRecentlyWatchedSeries) {
        label = "Remove Series History";
        action = "remove-series";
      }
    }

    if (action) {
      const div = document.createElement("div");
      div.className = "sidebar-card dynamic-sidebar-option";
      div.setAttribute("tabindex", "0");
      div.dataset.action = action;
      div.innerHTML = `<i class="fa fa-trash"></i> <span>${label}</span>`;
      grid.appendChild(div);
    }
  } catch (e) {
    console.error("buildDynamicSidebarOptions error", e);
  }
}

// Helpers to update favourites in localStorage
function getSelectedPlaylistName() {
  try {
    const sel = JSON.parse(localStorage.getItem("selectedPlaylist") || "null");
    return sel && sel.playlistName ? sel.playlistName : null;
  } catch (e) {
    return null;
  }
}

function updatePlaylistsData(updateFn) {
  try {
    const playlists = JSON.parse(localStorage.getItem("playlistsData") || "[]");
    const name = getSelectedPlaylistName();
    if (!name)
      return {
        success: false,
      };
    const updated = playlists.map((pl) => {
      if (pl.playlistName === name) {
        return updateFn(pl);
      }
      return pl;
    });
    localStorage.setItem("playlistsData", JSON.stringify(updated));
    return {
      success: true,
    };
  } catch (e) {
    console.error("updatePlaylistsData error", e);
    return {
      success: false,
      error: e,
    };
  }
}

function removeAllFavoriteMovies() {
  const res = updatePlaylistsData((pl) => ({
    ...pl,
    favouriteMovies: [],
  }));
  if (res.success) {
    if (typeof refreshMoviesFavoritesList === "function")
      refreshMoviesFavoritesList();
    document
      .querySelectorAll(".movie-card-heart")
      .forEach((h) => (h.style.display = "none"));
    if (typeof Toaster !== "undefined" && Toaster.showToast) {
      Toaster.showToast("success", "Removed all favorite movies");
    }
  }
}

function removeAllFavoriteSeries() {
  const res = updatePlaylistsData((pl) => ({
    ...pl,
    favouriteSeries: [],
  }));
  if (res.success) {
    if (typeof refreshSeriesFavoritesList === "function")
      refreshSeriesFavoritesList();
    document
      .querySelectorAll(".series-card-heart")
      .forEach((h) => (h.style.display = "none"));
    if (typeof Toaster !== "undefined" && Toaster.showToast) {
      Toaster.showToast("success", "Removed all favorite series");
    }
  }
}

function removeAllChannelHistory() {
  const res = updatePlaylistsData((pl) => ({
    ...pl,
    ChannelListLive: [],
  }));
  if (res.success) {
    if (typeof Toaster !== "undefined" && Toaster.showToast) {
      Toaster.showToast("success", "Cleared channel history");
    }
  }
}

function removeFavoriteMovieById(streamId) {
  if (!streamId) return;
  const res = updatePlaylistsData((pl) => {
    const fav = Array.isArray(pl.favouriteMovies) ? pl.favouriteMovies : [];
    const filtered = fav.filter((id) => String(id) !== String(streamId));
    return {
      ...pl,
      favouriteMovies: filtered,
    };
  });
  if (res.success) {
    // Update detail page button if present
    const favBtn = document.querySelector(".movie-detail-fav-button");
    if (favBtn) {
      const heartIcon = favBtn.querySelector(".heart-icon");
      const favText = favBtn.querySelector(".fav-text");
      if (heartIcon)
        heartIcon.innerHTML = '<i class="fa-regular fa-heart"></i>';
      if (favText) favText.textContent = "Add to Favorites";
    }
    document
      .querySelectorAll(
        '.movie-card[data-stream-id="' + streamId + '"] .movie-card-heart',
      )
      .forEach((h) => (h.style.display = "none"));
    if (typeof refreshMoviesFavoritesList === "function")
      refreshMoviesFavoritesList();
    if (typeof Toaster !== "undefined" && Toaster.showToast) {
      Toaster.showToast("success", "Removed movie from favorites");
    }
  }
}

function removeFavoriteSeriesById(seriesId) {
  if (!seriesId) return;
  const res = updatePlaylistsData((pl) => {
    const fav = Array.isArray(pl.favouriteSeries) ? pl.favouriteSeries : [];
    const filtered = fav.filter((id) => String(id) !== String(seriesId));
    return {
      ...pl,
      favouriteSeries: filtered,
    };
  });
  if (res.success) {
    const favBtn = document.querySelector(".series-detail-fav-button");
    if (favBtn) {
      const heartIcon = favBtn.querySelector(".heart-icon");
      const favText = favBtn.querySelector(".fav-text");
      if (heartIcon)
        heartIcon.innerHTML = '<i class="fa-regular fa-heart"></i>';
      if (favText) favText.textContent = "Add to Favorites";
    }
    document
      .querySelectorAll(
        '.series-card[data-series-id="' + seriesId + '"] .series-card-heart',
      )
      .forEach((h) => (h.style.display = "none"));
    if (typeof refreshSeriesFavoritesList === "function")
      refreshSeriesFavoritesList();
    if (typeof Toaster !== "undefined" && Toaster.showToast) {
      Toaster.showToast("success", "Removed series from favorites");
    }
  }
}

function removeAllRecentlyWatchedMovies() {
  const res = updatePlaylistsData((pl) => ({
    ...pl,
    continueWatchingMovies: [],
  }));
  if (res.success) {
    if (typeof Toaster !== "undefined" && Toaster.showToast) {
      Toaster.showToast("success", "Cleared movies history");
    }
  }
}

function removeAllRecentlyWatchedSeries() {
  const res = updatePlaylistsData((pl) => ({
    ...pl,
    continueWatchingSeries: [],
  }));
  if (res.success) {
    if (typeof Toaster !== "undefined" && Toaster.showToast) {
      Toaster.showToast("success", "Cleared series history");
    }
  }
}

function removeRecentlyWatchedMovieById(streamId) {
  if (!streamId) return;
  const res = updatePlaylistsData((pl) => {
    const list = Array.isArray(pl.continueWatchingMovies)
      ? pl.continueWatchingMovies
      : [];
    const filtered = list.filter(
      (item) => item && String(item.itemId) !== String(streamId),
    );
    return {
      ...pl,
      continueWatchingMovies: filtered,
    };
  });
  if (res.success) {
    if (typeof Toaster !== "undefined" && Toaster.showToast) {
      Toaster.showToast("success", "Removed movie from history");
    }
  }
}

function removeRecentlyWatchedSeriesById(seriesId) {
  if (!seriesId) return;
  const res = updatePlaylistsData((pl) => {
    const list = Array.isArray(pl.continueWatchingSeries)
      ? pl.continueWatchingSeries
      : [];
    const filtered = list.filter(
      (item) => item && String(item.itemId) !== String(seriesId),
    );
    return {
      ...pl,
      continueWatchingSeries: filtered,
    };
  });
  if (res.success) {
    if (typeof Toaster !== "undefined" && Toaster.showToast) {
      Toaster.showToast("success", "Removed series from history");
    }
  }
}

function initNavbar() {
  const navItems = Array.from(document.querySelectorAll(".nav-item"));
  const sidebar = document.getElementById("sidebar");
  let sidebarTimeout = null;

  function highlightNavItem(index) {
    if (typeof setActiveItem === "function") {
      setActiveItem(index);
    }

    if (index === 0) {
      if (
        document.activeElement &&
        typeof document.activeElement.blur === "function"
      ) {
        document.activeElement.blur();
      }
      if (searchInput && typeof searchInput.blur === "function") {
        searchInput.blur();
      }
    } else if (index === totalItems - 1) {
      if (profileIcon && typeof profileIcon.focus === "function") {
        profileIcon.focus();
      }
    } else {
      if (
        navItems &&
        navItems[index - 1] &&
        typeof navItems[index - 1].focus === "function"
      ) {
        navItems[index - 1].focus();
      }
    }
  }

  // Navbar scroll logic
  // Navbar scroll logic refactored
  let currentScrollContainer = null;
  const navbarContainer = document.querySelector(".navbar-container");

  function handleNavbarScroll() {
    if (!navbarContainer) return;

    let scrollTop = 0;
    // Lower threshold to 20% of viewport
    const threshold = window.innerHeight * 0.2;

    if (currentScrollContainer === window) {
      scrollTop = window.scrollY;
    } else if (currentScrollContainer) {
      scrollTop = currentScrollContainer.scrollTop;
    }

    if (scrollTop > threshold) {
      navbarContainer.classList.add("navbar-hidden");
    } else {
      navbarContainer.classList.remove("navbar-hidden");
    }
  }

  function setupNavbarScrollListener() {
    const currentPage = localStorage.getItem("currentPage");
    let newContainer = window; // Default to window

    // Determine the scroll container based on the current page
    if (currentPage === "movieDetailPage") {
      const el = document.querySelector(".movie-detail-page-container");
      if (el) newContainer = el;
    } else if (currentPage === "seriesDetailPage") {
      const el = document.querySelector(
        ".series-detail-page-content-container",
      );
      if (el) newContainer = el;
    }
    // MoviesPage and SeriesPage typically scroll via window, so default applies

    // Only update if the container has changed or we need to re-attach
    // (Equality check for window works, DOM elements work by ref)
    if (currentScrollContainer !== newContainer || !currentScrollContainer) {
      // Clean up old listener
      if (currentScrollContainer) {
        currentScrollContainer.removeEventListener(
          "scroll",
          handleNavbarScroll,
        );
      }

      currentScrollContainer = newContainer;

      // Attach new listener
      if (currentScrollContainer) {
        currentScrollContainer.addEventListener("scroll", handleNavbarScroll);
        // Reset visibility state when switching pages
        if (navbarContainer) navbarContainer.classList.remove("navbar-hidden");
      }
    }
  }

  // Initial setup
  setupNavbarScrollListener();

  // Watch for page changes (DOM updates) to re-attach listeners
  const appContainer = document.getElementById("main-app-container");
  if (appContainer) {
    const observer = new MutationObserver(() => {
      // Re-run setup when DOM changes (navigation)
      setupNavbarScrollListener();
    });
    // Observer options: check for child list changes (new pages loading)
    observer.observe(appContainer, {
      childList: true,
      subtree: false,
    });
  }
  const profileIcon = document.getElementById("profileIcon");
  const searchInput = document.getElementById("search-input");

  // Legacy sort menu elements removed
  // const sortItem = sidebar.querySelector(".sidebar-sort");
  // const sortOptions = document.getElementById("sort-options");
  // const arrowIcon = sortItem.querySelector(".arrow-icon");
  // const sortCheckboxes = Array.from(
  //   document.querySelectorAll(".sort-checkbox"),
  // );

  let currentIndex = 0;
  const totalItems = navItems.length + 2;

  const pageIndexMap = {
    masterSearchPage: 0,
    moviesPage: 1,
    seriesPage: 2,
    liveTvPage: 3,
  };

  // Add this function to dispose Live TV player
  const disposeLiveTvPlayer = () => {
    if (localStorage.getItem("currentPage") === "liveTvPage") {
      // Call Live TV page cleanup if it exists
      if (
        typeof LiveTvPage !== "undefined" &&
        typeof LiveTvPage.cleanup === "function"
      ) {
        LiveTvPage.cleanup();
      }

      // Additional cleanup for live player
      if (window.livePlayer) {
        try {
          if (typeof window.livePlayer.dispose === "function") {
            window.livePlayer.dispose();
          } else if (typeof window.livePlayer.destroy === "function") {
            window.livePlayer.destroy();
          }
        } catch (error) {
          console.log("Error disposing live player:", error);
        }
        window.livePlayer = null;
      }

      // Clean up video elements
      const videoWrappers = document.querySelectorAll(
        ".livetv-video-wrapper, .live-video-player-div",
      );
      videoWrappers.forEach((wrapper) => {
        const videos = wrapper.querySelectorAll("video");
        videos.forEach((video) => {
          video.pause();
          video.src = "";
          video.load();
        });
      });
    }
  };

  const resetParentalControlState = () => {
    if (typeof window.resetMoviesParentalState === "function") {
      window.resetMoviesParentalState();
    }
    if (typeof window.resetSeriesParentalState === "function") {
      window.resetSeriesParentalState();
    }
  };
  // Initialize search query in window object
  window.searchQuery = window.searchQuery || "";

  setSortOption("default");

  updateNavbarActive(localStorage.getItem("currentPage"));
  buildDynamicSidebarOptions();

  let searchDebounceTimer = null;
  const SEARCH_DEBOUNCE_MS = 500;
  searchInput.addEventListener("input", (e) => {
    window.searchQuery = e.target.value || "";

    const currentPage = localStorage.getItem("currentPage");
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("global-search", {
          detail: window.searchQuery,
        }),
      );

      if (currentPage === "moviesPage") {
        try {
          if (typeof window.rerenderMoviesPage === "function") {
            Router.showPage("moviesPage");
            localStorage.setItem("navigationFocus", "navbar");
            searchInput.focus();
          }
        } catch (err) {}
      } else if (currentPage === "seriesPage") {
        try {
          if (typeof window.rerenderSeriesPage === "function") {
            Router.showPage("seriesPage");
            localStorage.setItem("navigationFocus", "navbar");
            searchInput.focus();
          }
        } catch (err) {}
      }
    }, SEARCH_DEBOUNCE_MS);
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" || e.key === "Delete") {
      e.stopPropagation();
    }
  });

  navItems.forEach((item, index) => {
    item.addEventListener("click", () => {
      // Clear search query
      window.searchQuery = "";
      if (searchInput) searchInput.value = "";

      const page = item.getAttribute("data-page");
      disposeLiveTvPlayer();
      resetParentalControlState();
      Router.showPage(page);
      updateNavbarActive(page);
      buildDynamicSidebarOptions();
    });

    item.addEventListener("focus", () => {
      localStorage.setItem("navigationFocus", "navbar");
      setActiveItem(index + 1);
    });
  });

  profileIcon.addEventListener("click", openSidebar);
  profileIcon.addEventListener("focus", () => {
    localStorage.setItem("navigationFocus", "navbar");
    setActiveItem(totalItems - 1);
  });
  profileIcon.addEventListener("blur", () => {
    profileIcon.classList.remove("active");
  });

  // Restore sort listeners
  const sortItem = sidebar.querySelector('[data-action="sort"]');
  if (sortItem) sortItem.addEventListener("click", toggleSortMenu);

  const sortCheckboxes = Array.from(
    document.querySelectorAll(".sort-checkbox"),
  );
  if (sortCheckboxes) {
    sortCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", (e) => {
        if (e.target.checked) {
          setSortOption(e.target.dataset.sort);
        }
      });
    });
  }

  // Sidebar card focus management
  const sidebarCards = document.querySelectorAll(".sidebar-card");
  sidebarCards.forEach((card) => {
    card.addEventListener("focus", () => {
      // Remove active from all other cards
      document
        .querySelectorAll(".sidebar-card")
        .forEach((c) => c.classList.remove("active"));
      card.classList.add("active");
    });
    card.addEventListener("blur", () => {
      // Keep Sort card active while its dialog is open
      if (card.dataset.action === "sort" && isSortOptionsOpen) return;
      card.classList.remove("active");
    });
  });

  setSortOption("default");

  document.addEventListener("keydown", (e) => {
    const navigationFocus = localStorage.getItem("navigationFocus");
    const currentPage = localStorage.getItem("currentPage");
    const key = e.key;
    const keyCode = e.keyCode;

    // Pages where navbar should not be active
    const NAVBAR_INACTIVE_PAGES = [
      "loginPage",
      "listPage",
      // "settingsPage",
      "exitModal",
    ];
    if (NAVBAR_INACTIVE_PAGES.includes(currentPage)) {
      return; // Don't process any navbar keydown events on these pages
    }

    if (isSortOptionsOpen) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      handleSortOptionsKeys(e);
      return;
    }

    const isSearchFocused = document.activeElement === searchInput;

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

    const isBackKey = backKeys.includes(key) || backKeys.includes(keyCode);

    if (isBackKey) {
      if (sidebar && !sidebar.classList.contains("option-remove")) {
        // Handle Theme Dots logic first
        const dotsView = document.getElementById("theme-dots-view");
        if (dotsView && !dotsView.classList.contains("option-remove")) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          const defaultView = document.getElementById("theme-default-view");
          const card = document.getElementById("theme-card-container");
          dotsView.classList.add("option-remove");
          if (defaultView) defaultView.classList.remove("option-remove");
          if (card) {
            card.setAttribute("tabindex", "0");
            setTimeout(() => card.focus(), 10);
          }
          return;
        }

        // If we're in the Playlist Info section, go back to main sidebar instead of closing
        const infoSection = document.getElementById("playlist-info-section");
        if (infoSection && infoSection.classList.contains("active")) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          showSidebarSection("main");
          setTimeout(() => {
            const infoCard = document.querySelector(
              '[data-action="playlist-info"]',
            );
            if (infoCard) infoCard.focus();
          }, 10);
          return;
        }

        e.preventDefault();
        // CRITICAL: prevent page-level "back" handlers from firing
        // when we're just closing the sidebar.
        e.stopPropagation();
        e.stopImmediatePropagation();
        closeSidebar();
        return;
      }

      if (currentPage !== "homePage") {
        if (currentPage === "movieDetailPage") {
          e.preventDefault();
          localStorage.removeItem("selectedMovieId");
          Router.showPage("moviesPage");
          return;
        }
        if (currentPage === "seriesDetailPage") {
          const dropdownList = document.getElementById("season-dropdown-list");
          if (dropdownList && !dropdownList.classList.contains("hidden")) {
            // Let SeriesDetailPage handle closing the dropdown
            return;
          }
          e.preventDefault();
          localStorage.removeItem("selectedSeriesId");
          Router.showPage("seriesPage");
          return;
        }
        return;
      }
      e.preventDefault();
      localStorage.setItem("returnPage", currentPage);
      localStorage.setItem("returnFocus", "navbar");
      localStorage.setItem("currentPage", "exitModal");
      Router.showPage("exitModal");
      return;
    }

    if (
      isSearchFocused &&
      !["ArrowLeft", "ArrowRight", "ArrowDown"].includes(key)
    ) {
      return;
    }

    if (sidebar && !sidebar.classList.contains("option-remove")) {
      if (
        [
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "Enter",
          "Escape",
          "Backspace",
          "XF86Back",
        ].includes(key) ||
        isBackKey
      ) {
        e.preventDefault();
        // Prevent underlying page from also handling the same key
        e.stopPropagation();
        e.stopImmediatePropagation();
        handleSidebarKeys(e);
        return;
      }
    }

    // Only process navbar keys if navigation focus is navbar
    if (navigationFocus !== "navbar") {
      return;
    }

    // Allow ArrowLeft/ArrowRight default behavior if search input is focused
    if (isSearchFocused && ["ArrowLeft", "ArrowRight"].includes(key)) {
      // Do not prevent default
    } else if (["ArrowLeft", "ArrowRight"].includes(key)) {
      e.preventDefault();
    }

    switch (key) {
      case "ArrowRight":
        if (profileIcon.classList.contains("active")) {
          return;
        } else {
          currentIndex = (currentIndex + 1) % totalItems;
          highlightNavItem(currentIndex);
          break;
        }
      case "ArrowLeft":
        if (searchInput.classList.contains("active")) {
          document
            .querySelectorAll(".nav-item")
            .forEach((item) => item.classList.remove("active"));
          profileIcon.classList.remove("active");
          searchInput.blur();
        } else {
          // If Home is focused (currentIndex === 1) and search is hidden, do nothing
          if (currentIndex === 1) {
            const searchContainer = document.querySelector(
              ".search-bar-container",
            );
            if (
              searchContainer &&
              searchContainer.style.visibility === "hidden"
            ) {
              return;
            }
          }
          currentIndex = (currentIndex - 1 + totalItems) % totalItems;
          highlightNavItem(currentIndex);
        }
        break;
      case "ArrowDown":
        // Handle ArrowDown for homePage, moviesPage, liveTvPage, and seriesPage
        if (
          (currentPage === "homePage" ||
            currentPage === "moviesPage" ||
            currentPage === "liveTvPage" ||
            currentPage == "movieDetailPage" ||
            currentPage == "seriesDetailPage" ||
            currentPage === "seriesPage" ||
            currentPage === "masterSearchPage" ||
            currentPage === "settingsPage") &&
          navigationFocus === "navbar"
        ) {
          e.preventDefault();
          e.stopImmediatePropagation();

          if (
            document.activeElement &&
            typeof document.activeElement.blur === "function"
          ) {
            document.activeElement.blur();
          }
          searchInput.blur();

          navItems.forEach((item) => item.classList.remove("active"));
          searchInput.classList.remove("active");
          profileIcon.classList.remove("active");

          // For homePage, prioritize Banner
          if (currentPage === "homePage") {
            localStorage.setItem("navigationFocus", "homePage");
            // Dispatched custom event can be handled in HomePage if needed
            window.dispatchEvent(
              new CustomEvent("navigation-focus-change", {
                detail: {
                  page: "homePage",
                  focus: "watchNow",
                },
              }),
            );
            return;
          }

          // For liveTvPage, focus on category search input
          if (currentPage === "liveTvPage") {
            localStorage.setItem("navigationFocus", "sidebarSearch");

            // Dispatch event to let LivePage know focus has changed
            window.dispatchEvent(new CustomEvent("navigation-focus-change"));

            e.preventDefault();
            e.stopImmediatePropagation();
            return;
          }

          // For masterSearchPage, focus on search input
          if (currentPage === "masterSearchPage") {
            localStorage.setItem("navigationFocus", "masterSearchPage");
            window.dispatchEvent(new CustomEvent("search-page-focus"));

            navItems.forEach((item) => item.classList.remove("active"));
            searchInput.classList.remove("active");
            profileIcon.classList.remove("active");
            if (document.activeElement) document.activeElement.blur();

            e.preventDefault();
            e.stopImmediatePropagation();
            return;
          }

          if (currentPage === "seriesDetailPage") {
            localStorage.setItem("navigationFocus", "seriesDetailPage");

            setTimeout(() => {
              // Remove navbar focus
              navItems.forEach((item) => item.classList.remove("active"));
              searchInput.classList.remove("active");
              profileIcon.classList.remove("active");

              // Focus on play button in series detail
              const playBtn = document.querySelector(
                ".series-detail-play-button",
              );
              if (playBtn) {
                playBtn.classList.add("series-detail-button-focused");
                playBtn.focus();
              }
            }, 10);

            e.preventDefault();
            e.stopImmediatePropagation();
            return;
          }

          if (currentPage === "movieDetailPage") {
            localStorage.setItem("navigationFocus", "movieDetailPage");
            setTimeout(() => {
              const firstDetailPlayBtn = document.querySelector(
                ".movie-detail-play-button",
              );
              if (firstDetailPlayBtn) {
                document
                  .querySelectorAll(".movie-detail-button-focused")
                  .forEach((btn) =>
                    btn.classList.remove("movie-detail-button-focused"),
                  );
                firstDetailPlayBtn.classList.add("movie-detail-button-focused");
                firstDetailPlayBtn.focus();
                localStorage.setItem("navigationFocus", "movieDetailPage");
                localStorage.setItem("currentPage", "movieDetailPage");
              }
            }, 0);
            e.preventDefault();
            e.stopImmediatePropagation();
            return;
          }

          // MoviesPage: prioritize Banner on initial down from navbar
          if (currentPage === "moviesPage" && window.moviesNavigationState) {
            localStorage.setItem("navigationFocus", "moviesPage");
            if (window.searchQuery) {
              if (typeof window.focusFirstMoviesCard === "function") {
                window.focusFirstMoviesCard();
              } else {
                // Fallback if function not ready
                window.moviesNavigationState.focus = "categories";
                window.moviesNavigationState.currentCategoryIndex = 0;
                window.moviesNavigationState.currentCardIndex = 0;
                if (typeof window.updateMoviesFocus === "function") {
                  window.updateMoviesFocus();
                }
              }
            } else {
              window.moviesNavigationState.focus = "watchNow";
              window.moviesNavigationState.currentCategoryIndex = 0;
              window.moviesNavigationState.currentCardIndex = 0;
              window.moviesNavigationState.justTransitioned = true; // Prevent immediate jump

              if (typeof window.updateMoviesFocus === "function") {
                window.updateMoviesFocus();
              }
            }

            if (typeof window.saveMoviesNavigationState === "function") {
              window.saveMoviesNavigationState();
            }
            e.preventDefault();
            e.stopImmediatePropagation();
            return;
          }

          // SeriesPage: prioritize Banner on initial down from navbar
          if (currentPage === "seriesPage" && window.seriesNavigationState) {
            localStorage.setItem("navigationFocus", "seriesPage");
            if (window.searchQuery) {
              if (typeof window.focusFirstSeriesCard === "function") {
                window.focusFirstSeriesCard();
              } else {
                // Fallback
                window.seriesNavigationState.focus = "categories";
                window.seriesNavigationState.currentCategoryIndex = 0;
                window.seriesNavigationState.currentCardIndex = 0;
                if (typeof window.updateSeriesFocus === "function") {
                  window.updateSeriesFocus();
                }
              }
            } else {
              window.seriesNavigationState.focus = "watchNow";
              window.seriesNavigationState.currentCategoryIndex = 0;
              window.seriesNavigationState.currentCardIndex = 0;
              window.seriesNavigationState.justTransitioned = true; // Prevent immediate jump

              if (typeof window.updateSeriesFocus === "function") {
                window.updateSeriesFocus();
              }
            }

            if (typeof window.saveSeriesNavigationState === "function") {
              window.saveSeriesNavigationState();
            }
            e.preventDefault();
            e.stopImmediatePropagation();
            return;
          }

          // SettingsPage: Release focus from navbar
          if (currentPage === "settingsPage") {
            localStorage.setItem("navigationFocus", "settingsPage"); // Use specific focus

            navItems.forEach((item) => item.classList.remove("active"));
            searchInput.classList.remove("active");
            profileIcon.classList.remove("active");
            if (
              document.activeElement &&
              typeof document.activeElement.blur === "function"
            ) {
              document.activeElement.blur();
            }

            // Dispatch event or call method to focus first settings item if needed
            // In SettingsPage.js, it likely watches navigationFocus or we can dispatch an event
            window.dispatchEvent(
              new CustomEvent("settings-focus-change", {
                detail: {
                  focus: "start",
                },
              }),
            );

            e.preventDefault();
            e.stopImmediatePropagation();
            return;
          }
        }
        break;
      case "Enter":
        if (currentIndex === 0) {
          searchInput.focus();
        } else if (currentIndex === totalItems - 1) {
          openSidebar();
        } else {
          if (window.cleanupMoviesNavigation) {
            window.cleanupMoviesNavigation();
          }
          if (window.cleanupSeriesNavigation) {
            window.cleanupSeriesNavigation();
          }
          const page = navItems[currentIndex - 1].getAttribute("data-page");
          window.searchQuery = "";
          clearMoviesAndSeriesLocalStorage();
          disposeLiveTvPlayer();
          resetParentalControlState();
          Router.showPage(page);
          updateNavbarActive(page);
        }
        break;
      case "Escape":
      case "Backspace":
      case "XF86Back":
        // This block is now mostly redundant due to isBackKey check at the top
        if (sidebar && !sidebar.classList.contains("option-remove")) {
          closeSidebar();
        }
        break;
    }
  });
  searchInput.addEventListener("focus", () => {
    localStorage.setItem("navigationFocus", "navbar");
    setActiveItem(0);
  });

  searchInput.addEventListener("blur", () => {
    searchInput.classList.remove("active");
  });

  function setActiveItem(index) {
    currentIndex = index;
    searchInput.classList.remove("active");
    navItems.forEach((i) => i.classList.remove("active"));
    profileIcon.classList.remove("active");

    if (index === 0) {
      searchInput.classList.add("active");
    } else if (index === totalItems - 1) {
      profileIcon.classList.add("active");
    } else {
      const item = navItems[index - 1];
      if (item) item.classList.add("active");
    }
  }

  function updateSearchVisibility(page) {
    // Pages where search input should be visible
    const PAGES_WITH_SEARCH = ["moviesPage", "seriesPage"];

    // Handle search input visibility
    const searchContainer = document.querySelector(".search-bar-container");
    const searchInput = document.getElementById("search-input");
    const searchIcon = document.querySelector(".nav-search-bar");

    if (searchContainer) {
      let checkPage = page;
      if (page === "exitModal") {
        checkPage = localStorage.getItem("returnPage") || page;
      }

      if (PAGES_WITH_SEARCH.includes(checkPage)) {
        searchContainer.style.visibility = "visible";
        // Reset display property that might have been set by other pages (e.g., LivePage)
        if (searchInput) searchInput.style.display = "";
        if (searchIcon) searchIcon.style.display = "";
      } else {
        searchContainer.style.visibility = "hidden";
      }
    }
  }

  function updateNavbarActive(page) {
    const index = pageIndexMap[page] || 0;
    currentIndex = index + 1;
    highlightNavItem(currentIndex);
    localStorage.setItem("navigationFocus", "navbar");

    updateSearchVisibility(page);
  }

  window.updateSearchVisibility = updateSearchVisibility;

  function openSidebar() {
    buildDynamicSidebarOptions();

    if (sidebarTimeout) {
      clearTimeout(sidebarTimeout);
      sidebarTimeout = null;
    }

    sidebar.classList.remove("option-remove");
    sidebar.style.display = "flex";

    // Small delay to allow display change to register before transition
    setTimeout(() => {
      sidebar.classList.add("active");
    }, 10);

    localStorage.setItem("navigationFocus", "sidebar");

    // Switch to main view by default
    showSidebarSection("main");

    // Populate user info
    const selectedPlaylist = JSON.parse(
      localStorage.getItem("selectedPlaylist") || "{}",
    );
    const username =
      selectedPlaylist.username || selectedPlaylist.playlistName || "User";

    const headerName = document.querySelector(".sidebar-user-info span");
    if (headerName) headerName.textContent = `${username}`;

    const infoName = document.querySelector(".username-val");
    if (infoName) infoName.textContent = username;

    const info = selectedPlaylist.subscription || {};
    if (document.querySelector(".status-val"))
      document.querySelector(".status-val").textContent = info.status || "N/A";
    if (document.querySelector(".expiry-val"))
      document.querySelector(".expiry-val").textContent = info.expiry_date
        ? new Date(info.expiry_date * 1000).toLocaleDateString()
        : "Unlimited";
    if (document.querySelector(".connections-val"))
      document.querySelector(".connections-val").textContent =
        info.active_cons || "N/A";

    // Focus first card
    const firstCard = document.querySelector(".sidebar-card");
    if (firstCard) firstCard.focus();

    // Dark Mode initialization
    const currentPL = getCurrentPlaylist();
    if (currentPL) {
      const isDark = currentPL.DarkMode === true;
      const toggle = document.querySelector(".theme-toggle");
      const text = document.querySelector(".dark-mode-text");
      const icon = document.getElementById("dark-mode-icon");
      if (toggle) {
        if (isDark) toggle.classList.add("active");
        else toggle.classList.remove("active");
      }
      if (text) {
        text.textContent = isDark ? "Dark Mode" : "Light Mode";
      }
      if (icon) {
        icon.className = isDark ? "fa-solid fa-moon" : "fa-solid fa-sun";
      }
    }
    if (typeof applyTheme === "function") applyTheme();
  }

  function showSidebarSection(section) {
    const mainSection = document.getElementById("main-sidebar-section");
    const infoSection = document.getElementById("playlist-info-section");

    mainSection.classList.remove("active");
    infoSection.classList.remove("active");

    if (section === "main") {
      mainSection.classList.add("active");
      // Ensure theme card is reset to default view
      const defaultView = document.getElementById("theme-default-view");
      const dotsView = document.getElementById("theme-dots-view");
      if (defaultView) defaultView.classList.remove("option-remove");
      if (dotsView) dotsView.classList.add("option-remove");
    } else if (section === "info") {
      infoSection.classList.add("active");
    }
  }

  window.setNavbarFocus = function (pageName) {
    const index = pageIndexMap[pageName];
    if (index !== undefined) {
      currentIndex = index + 1; // +1 because 0 is search
      highlightNavItem(currentIndex);
      localStorage.setItem("navigationFocus", "navbar");
    }
  };

  function closeSidebar() {
    sidebar.classList.remove("active");

    if (sidebarTimeout) clearTimeout(sidebarTimeout);

    sidebarTimeout = setTimeout(() => {
      sidebar.classList.add("option-remove");
      sidebar.style.display = "none";
      sidebarTimeout = null;
    }, 300);

    localStorage.setItem("navigationFocus", "navbar");

    localStorage.setItem("navigationFocus", "navbar");
    isSortOptionsOpen = false;

    setTimeout(() => {
      if (profileIcon) {
        profileIcon.focus();
        profileIcon.classList.add("active");
      }
    }, 10);
  }
  window.closeSidebar = closeSidebar;

  function handleLogOut() {
    // Clear HomeCarousel cache
    window.homeCarouselCachedSliderData = null;
    window.homeCarouselCachedPlaylistName = null;

    localStorage.setItem("isLogin", false);

    // const playlistsData = localStorage.getItem("playlistsData")
    //   ? JSON.parse(localStorage.getItem("playlistsData"))
    //   : [];

    // if (playlistsData.length > 0) {
    //   localStorage.removeItem("currentPlaylistData");
    //   localStorage.removeItem("selectedPlaylist");
    //   localStorage.setItem("navigationFocus", "");
    //   localStorage.setItem("isLogin", false);
    //   Router.showPage("listPage");
    // } else {
    //   resetParentalControlState();
    //   localStorage.removeItem("currentPlaylistData");
    //   localStorage.removeItem("selectedPlaylist");
    //   localStorage.setItem("currentPage", "login");
    //   Router.showPage("login");
    // }

    resetParentalControlState();
    localStorage.removeItem("currentPlaylistData");
    localStorage.removeItem("selectedPlaylist");
    localStorage.setItem("currentPage", "login");
    Router.showPage("login");

    closeSidebar();
  }

  function handleSidebarKeys(e) {
    if (isSortOptionsOpen) {
      handleSortOptionsKeys(e);
      return;
    }

    const activeSection = document.querySelector(".sidebar-section.active");
    if (!activeSection) return;

    const focusableItems = Array.from(
      activeSection.querySelectorAll('[tabindex="0"]'),
    );
    let activeIndex = focusableItems.indexOf(document.activeElement);

    if (activeSection.id === "main-sidebar-section") {
      // Grid Navigation for Main Section
      const gridItems = Array.from(
        activeSection.querySelectorAll(".sidebar-card:not(.option-remove)"),
      );
      const footerBtn = activeSection.querySelector(".footer-link-primary");

      let gridIndex = gridItems.indexOf(document.activeElement);

      switch (e.key) {
        case "ArrowRight":
          if (
            gridIndex !== -1 &&
            gridIndex % 2 === 0 &&
            gridIndex + 1 < gridItems.length
          ) {
            gridItems[gridIndex + 1].focus();
          }
          break;
        case "ArrowLeft":
          if (gridIndex !== -1 && gridIndex % 2 !== 0) {
            gridItems[gridIndex - 1].focus();
          }
          break;
        case "ArrowDown":
          if (gridIndex !== -1) {
            if (gridIndex + 2 < gridItems.length) {
              gridItems[gridIndex + 2].focus();
            } else {
              if (footerBtn) {
                footerBtn.focus();
              }
            }
          }
          break;
        case "ArrowUp":
          if (gridIndex !== -1) {
            if (gridIndex - 2 >= 0) {
              gridItems[gridIndex - 2].focus();
            }
          } else if (document.activeElement === footerBtn) {
            gridItems[gridItems.length - 1].focus();
          }
          break;
        case "Enter":
          const action = document.activeElement.dataset.action;
          if (action === "sort") {
            toggleSortMenu();
          } else if (action === "settings") {
            disposeLiveTvPlayer();
            Router.showPage("settingsPage");
            closeSidebar();
          } else if (action === "playlist-info") {
            showSidebarSection("info");
          } else if (
            action === "switch-playlist" ||
            action === "switch-playlist-footer"
          ) {
            disposeLiveTvPlayer();
            localStorage.removeItem("selectedPlaylist");
            localStorage.setItem("isLogin", false);
            Router.showPage("listPage");
            closeSidebar();
          } else if (action === "add-playlist") {
            handleLogOut();
          } else if (action === "remove-all-movies") {
            removeAllRecentlyWatchedMovies();
            closeSidebar();
            Router.showPage("moviesPage");
          } else if (action === "remove-all-series") {
            removeAllRecentlyWatchedSeries();
            closeSidebar();
            Router.showPage("seriesPage");
          } else if (action === "clear-channel-history") {
            removeAllChannelHistory();
            closeSidebar();
            if (localStorage.getItem("currentPage") === "liveTvPage") {
              Router.showPage("liveTvPage");
            }
          } else if (action === "remove-movie") {
            const mid = localStorage.getItem("selectedMovieId");
            removeRecentlyWatchedMovieById(mid);
            closeSidebar();
            Router.showPage("movieDetailPage");
          } else if (action === "remove-series") {
            const sid = localStorage.getItem("selectedSeriesId");
            removeRecentlyWatchedSeriesById(sid);
            closeSidebar();
            Router.showPage("seriesDetailPage");
          } else if (action === "dark-mode") {
            const currentPL = getCurrentPlaylist();
            const newIsDark = !(currentPL && currentPL.DarkMode === true);
            const playlistName = getSelectedPlaylistName();
            if (playlistName) {
              updatePlaylistData(playlistName, "DarkMode", newIsDark);
              updatePlaylistData(
                playlistName,
                "themeColor",
                newIsDark ? "dark" : "light",
              );

              // Update UI
              const toggle = document.querySelector(".theme-toggle");
              const text = document.querySelector(".dark-mode-text");
              const icon = document.getElementById("dark-mode-icon");
              if (toggle) {
                if (newIsDark) toggle.classList.add("active");
                else toggle.classList.remove("active");
              }
              if (text) {
                text.textContent = newIsDark ? "Dark Mode" : "Light Mode";
              }
              if (icon) {
                icon.className = newIsDark
                  ? "fa-solid fa-moon"
                  : "fa-solid fa-sun";
              }

              if (typeof applyTheme === "function") applyTheme();

              if (typeof Toaster !== "undefined" && Toaster.showToast) {
                Toaster.showToast(
                  "success",
                  `${newIsDark ? "Dark" : "Light"} mode enabled`,
                );
              }
            }
          } else if (action === "change-theme") {
            const defaultView = document.getElementById("theme-default-view");
            const dotsView = document.getElementById("theme-dots-view");
            const card = document.getElementById("theme-card-container");
            if (defaultView && dotsView) {
              defaultView.classList.add("option-remove");
              dotsView.classList.remove("option-remove");
              if (card) card.removeAttribute("tabindex"); // Temporarily disable card focus
              setTimeout(() => {
                const firstDot = dotsView.querySelector(".theme-dot");
                if (firstDot) firstDot.focus();
              }, 10);
            }
          }
          break;
        case "Escape":
        case "Backspace":
        case "XF86Back":
          closeSidebar();
          break;
      }
    } else if (activeSection.id === "playlist-info-section") {
      // Navigation for Playlist Info Section
      switch (e.key) {
        case "Escape":
        case "Backspace":
        case "XF86Back":
          showSidebarSection("main");
          setTimeout(
            () =>
              document.querySelector('[data-action="playlist-info"]').focus(),
            10,
          );
          break;
      }
    }

    // Handle Theme Dots logic separately
    const dotsView = document.getElementById("theme-dots-view");
    if (dotsView && !dotsView.classList.contains("option-remove")) {
      const dots = Array.from(dotsView.querySelectorAll(".theme-dot"));
      const activeIdx = dots.indexOf(document.activeElement);

      if (activeIdx !== -1 || dots.includes(document.activeElement)) {
        // If one of the dots (or something inside) is focused
        switch (e.key) {
          case "ArrowRight":
            e.preventDefault();
            if (activeIdx < dots.length - 1) {
              dots[activeIdx + 1].focus();
            }
            break;
          case "ArrowLeft":
            e.preventDefault();
            if (activeIdx > 0) {
              dots[activeIdx - 1].focus();
            }
            break;
          case "ArrowDown":
          case "ArrowUp":
            e.preventDefault(); // Lock vertical movement while on dots
            break;
          case "Enter":
            e.preventDefault();
            const selectedTheme = dots[activeIdx].dataset.theme;
            const playlistName = getSelectedPlaylistName();
            if (playlistName) {
              updatePlaylistData(playlistName, "DarkMode", true);
              updatePlaylistData(playlistName, "themeColor", selectedTheme);
              if (typeof applyTheme === "function") applyTheme();
              if (typeof Toaster !== "undefined" && Toaster.showToast) {
                Toaster.showToast(
                  "success",
                  `Theme changed to ${selectedTheme}`,
                );
              }
            }
            break;
          case "Escape":
          case "Backspace":
          case "XF86Back":
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            const defaultView = document.getElementById("theme-default-view");
            const card = document.getElementById("theme-card-container");
            dotsView.classList.add("option-remove");
            if (defaultView) defaultView.classList.remove("option-remove");
            if (card) {
              card.setAttribute("tabindex", "0");
              setTimeout(() => card.focus(), 10);
            }
            break;
        }
        return; // Important: prevent falling through to main grid logic
      }
    }
  }

  function updateSidebarSelection(items, index) {
    // Legacy helper - no longer needed with native focus but keeping for safety if called elsewhere
    if (items[index]) items[index].focus();
  }

  function toggleSortMenu() {
    const sortDialog = document.getElementById("sort-dialog");
    if (!sortDialog) return;
    const expanded = !sortDialog.classList.contains("option-remove");
    if (expanded) {
      closeSortMenu();
    } else {
      openSortMenu();
    }
  }

  function openSortMenu() {
    const sortDialog = document.getElementById("sort-dialog");
    if (!sortDialog) return;

    sortDialog.classList.remove("option-remove");
    isSortOptionsOpen = true;

    // Ensure sort menu item stays active
    const sortMenuItem = sidebar.querySelector('[data-action="sort"]');
    if (sortMenuItem) {
      sortMenuItem.classList.add("active");
    }

    const sortOptionItems = Array.from(
      sortDialog.querySelectorAll(".sort-option"),
    );
    if (sortOptionItems.length > 0) {
      updateSortOptionsSelection(sortOptionItems, 0);
    }
  }

  function closeSortMenu() {
    const sortDialog = document.getElementById("sort-dialog");
    if (!sortDialog) return;
    sortDialog.classList.add("option-remove");
    isSortOptionsOpen = false;

    const sortMenuItem = sidebar.querySelector('[data-action="sort"]');
    if (sortMenuItem) {
      // Remove active from any other card first
      document
        .querySelectorAll(".sidebar-card")
        .forEach((c) => c.classList.remove("active"));

      setTimeout(() => {
        sortMenuItem.classList.add("active");
        sortMenuItem.focus();
      }, 10);
    }
  }

  function setSortOption(sortType) {
    const prevSort = localStorage.getItem("sortvalue") || "";
    if (String(prevSort) === String(sortType)) {
      const selectedCheckbox = document.querySelector(
        `.sort-checkbox[data-sort="${sortType}"]`,
      );
      if (selectedCheckbox) selectedCheckbox.checked = true;
      return;
    }

    const sortCheckboxes = Array.from(
      document.querySelectorAll(".sort-checkbox"),
    );
    sortCheckboxes.forEach((checkbox) => {
      checkbox.checked = false;
    });

    const selectedCheckbox = document.querySelector(
      `.sort-checkbox[data-sort="${sortType}"]`,
    );
    if (selectedCheckbox) {
      selectedCheckbox.checked = true;
    }

    localStorage.setItem("sortvalue", sortType);

    const sortEvent = new CustomEvent("sortChanged", {
      detail: {
        sortType: sortType,
        page: localStorage.getItem("currentPage"),
      },
    });
    document.dispatchEvent(sortEvent);

    if (sidebar && !sidebar.classList.contains("option-remove")) {
      localStorage.setItem("navigationFocus", "sidebar");
    }
  }

  function handleSortOptionsKeys(e) {
    const sortDialog = document.getElementById("sort-dialog");
    const sortOptionItems = Array.from(
      sortDialog.querySelectorAll(".sort-option"),
    );
    if (!sortOptionItems.length) return;

    let activeIndex = sortOptionItems.findIndex((item) =>
      item.classList.contains("active"),
    );
    if (activeIndex === -1) activeIndex = 0;

    switch (e.key) {
      case "ArrowDown":
        activeIndex = (activeIndex + 1) % sortOptionItems.length;
        updateSortOptionsSelection(sortOptionItems, activeIndex);
        break;
      case "ArrowUp":
        activeIndex =
          (activeIndex - 1 + sortOptionItems.length) % sortOptionItems.length;
        updateSortOptionsSelection(sortOptionItems, activeIndex);
        break;
      case "Enter":
        const activeSortItem = sortOptionItems[activeIndex];
        const checkbox = activeSortItem.querySelector(".sort-checkbox");
        if (checkbox) {
          checkbox.checked = true;
          setSortOption(checkbox.dataset.sort);
          closeSortMenu();
        }
        break;
      case "Escape":
      case "Backspace":
      case "Back":
      case "BrowserBack":
      case "XF86Back":
      case "10009":
      case "461":
      case 10009:
      case 461:
        closeSortMenu();
        break;
    }
  }

  function updateSortOptionsSelection(items, index) {
    items.forEach((item) => {
      item.classList.remove("active");
    });
    const activeItem = items[index];
    if (activeItem) {
      activeItem.classList.add("active");
      activeItem.focus();
    }
  }

  window.updateSearchVisibility = updateSearchVisibility;
  if (typeof applyTheme === "function") applyTheme();
}

window.buildDynamicSidebarOptions = buildDynamicSidebarOptions;
