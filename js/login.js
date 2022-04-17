import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-database.js";

function onSignIn(googleUser) {
    var profile = googleUser.getBasicProfile();
    console.log('Email: ' + profile.getEmail()); // This is null if the 'email' scope is not present.
    setCookie(profile.getName(),profile.getEmail(),360)
}

function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    let expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
  }