var firebaseConfig = {
  apiKey: "AIzaSyC9id2H-Mwwb12XQG8qIoZkl1erUEVuLy4",
  authDomain: "smarterspro-smarttv.firebaseapp.com",
  projectId: "smarterspro-smarttv",
  storageBucket: "smarterspro-smarttv.firebasestorage.app",
  messagingSenderId: "802563511642",
  appId: "1:802563511642:web:119d286afcf047ed030f63",
  measurementId: "G-0MMJ8QX7MB"
  };

firebase.initializeApp(firebaseConfig);
firebase.analytics();

var db = firebase.firestore();

window.logAllDnsEntries = function () {
  db.collection("DNS").get()
    .then(function (snapshot) {
      snapshot.forEach(function (doc) {
        console.log("DNS Entry:", doc.id, "=>", doc.data());
        localStorage.setItem("all_dns", JSON.stringify(doc.data().DNS));
      });

    })
    .catch(function (error) {
      alert("Error getting DNS entries: " + error.message);
    });
};

window.getTmbdId = function () {
  db.collection("TMDBID").get()
    .then(function (snapshot) {
      snapshot.forEach(function (doc) {
        const tmbdId=doc.data().tmbd_api_key? doc.data().tmbd_api_key : ""
        // console.log("TMDBID Entry:", doc.id, "=>", tmbdId);
        localStorage.setItem("tmbdId", tmbdId.trim());
        window.TMBD_API_KEY = tmbdId.trim();
        console.log("TMDBID from Firebase:", window.TMBD_API_KEY);
        // localStorage.setItem("tmbdId", tmbdId);
      });

    })
    .catch(function (error) {
      alert("Error getting TMDBID entries: " + error.message);
    });
};

window.getDnsSalt = function () {
  return db.collection("dnsSalt").get()
    .then(function (snapshot) {
      snapshot.forEach(function (doc) {
        const salt = doc.data().dnsSalt ? doc.data().dnsSalt : "";
        console.log(salt, "firebase Salt");
        window.SecretToken = salt.trim();
      });
    })
    .catch(function (error) {
      alert("Error getting TMDBID entries: " + error.message);
    });
};

window.showQrCode = function () {
  return db.collection("qr_code").get()
    .then(function (snapshot) {
      snapshot.forEach(function (doc) {
        const qr_code = doc.data().qr_code ? doc.data().qr_code : "";
        console.log(qr_code, "firebase qr_code");
        window.isQrCode = qr_code;
  
      });
    })
    .catch(function (error) {
      alert("Error getting TMDBID entries: " + error.message);
    });
};

window.getApiBaseUrl = function () {
  return db.collection("API_BASE_URL").get()
    .then(function (snapshot) {
      snapshot.forEach(function (doc) {
        const api_base_url = doc.data().api_base_url ? doc.data().api_base_url : "";
        console.log(api_base_url, "firebase api_base_url");
        window.apiBaseUrl = api_base_url.trim();
  
      });
    })
    .catch(function (error) {
      alert("Error getting TMDBID entries: " + error.message);
    });
};

window.getCartLink = function () {
  return db.collection("whmcs_links").get()
    .then(function (snapshot) {
      snapshot.forEach(function (doc) {
        const cart_link = doc.data().cart_link ? doc.data().cart_link : "";
        const website_link = doc.data().website_link ? doc.data().website_link : "";
        console.log(cart_link, "firebase cart_link");
        window.cartLink = cart_link;
        window.websiteLink=website_link;
  
      });
    })
    .catch(function (error) {
      alert("Error getting API_BASE_URL entries: " + error.message);
    });
};