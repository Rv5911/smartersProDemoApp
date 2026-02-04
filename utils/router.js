const Router = (function() {
    const pages = {
        login: {
            el: document.getElementById("login-page"),
            render: LoginPage,
        },
        policyPage: {
            el: document.getElementById("policy-page"),
            render: PolicyPage,
        },
        listPage: {
            el: document.getElementById("list-users-page"),
            render: ListUsersPage,
        },
        splashScreen: {
            el: document.getElementById("splash-page"),
            render: SplashScreen,
        },
        paymentPage: {
            el: document.getElementById("payment-page"),
            render: PaymentPage,
        },
        homePage: {
            el: document.getElementById("home-page"),
            render: HomePage,
            cleanup: () => {
                if (window.HomePage && window.HomePage.cleanup)
                    window.HomePage.cleanup();
            },
        },
        settingsPage: {
            el: document.getElementById("settings-page"),
            render: SettingsPage,
        },
        moviesPage: {
            el: document.getElementById("movies-page"),
            render: MoviesPage,
            cleanup: () => {
                if (window.cleanupMoviesNavigation) window.cleanupMoviesNavigation();
            },
        },
        seriesPage: {
            el: document.getElementById("series-page"),
            render: SeriesPage,
            cleanup: () => {
                if (window.cleanupSeriesNavigation) window.cleanupSeriesNavigation();
            },
        },
        liveTvPage: {
            el: document.getElementById("livetv-page"),
            render: LivePage,
            cleanup: () => {
                if (window.cleanupLiveNavigation) window.cleanupLiveNavigation();
            },
        },
        accountPage: {
            el: document.getElementById("account-page"),
            render: AccountPage,
        },
        preLoginPage: {
            el: document.getElementById("prelogin-page"),
            render: PreLoginPage,
        },
        movieDetailPage: {
            el: document.getElementById("movies-detail-page"),
            render: MovieDetailPage,
        },
        videoJsPlayer: {
            el: document.getElementById("videojs-player"),
            render: VideoJsPlayer,
        },
        seriesDetailPage: {
            el: document.getElementById("series-detail-page"),
            render: SeriesDetailPage,
        },
        exitModal: {
            el: document.getElementById("exit-modal"),
            render: ExitModal,
        },
    };

    var currentPageName = null;

    function showPage(name) {
        if (
            currentPageName &&
            typeof pages[currentPageName].cleanup === "function" &&
            name !== "exitModal"
        ) {
            pages[currentPageName].cleanup();
        }

        // Only hide other pages if we are NOT opening the exit modal (overlay)
        if (name !== "exitModal") {
            Object.values(pages).forEach(function(p) {
                if (p.el) p.el.style.display = "none";
            });
        }

        var page = pages[name];
        if (!page) return;

        if (typeof page.render === "function") {
            // Handle both sync and async render functions
            const renderResult = page.render();
            if (renderResult instanceof Promise) {
                renderResult.then((html) => {
                    page.el.innerHTML = html;
                    page.el.style.display = "block";

                    if (typeof page.init === "function") {
                        page.init(page.el);
                    }
                });
            } else {
                page.el.innerHTML = renderResult;
                page.el.style.display = "block";

                if (typeof page.init === "function") {
                    page.init(page.el);
                }
            }
        } else {
            page.el.style.display = "block";
        }

        currentPageName = name;
        localStorage.setItem("currentPage", name);
    }

    return {
        showPage,
    };
})();

window.Router = Router;