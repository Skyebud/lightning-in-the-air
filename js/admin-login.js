import { signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { auth, firebaseEnabled } from "./firebase-client.js";

const status = document.querySelector("[data-config-status]");
const form = document.querySelector("[data-login-form]");
const message = document.querySelector("[data-login-message]");

if (!firebaseEnabled) {
  status.className = "admin-status error";
  status.textContent = "Firebase has not been connected yet. Follow FIREBASE-SETUP.md, then add the project configuration to js/firebase-config.js.";
  form.querySelectorAll("input,button").forEach((el) => el.disabled = true);
} else {
  status.className = "admin-status success";
  status.textContent = "Firebase is connected. Sign in with an authorized administrator account.";
  onAuthStateChanged(auth, (user) => { if (user) window.location.replace("index.html"); });
  form.addEventListener("submit", async (event) => {
    event.preventDefault(); message.textContent = "Signing in…";
    const data = new FormData(form);
    try {
      await signInWithEmailAndPassword(auth, data.get("email"), data.get("password"));
      window.location.replace("index.html");
    } catch (error) {
      console.error(error); message.className = "admin-message error"; message.textContent = "Sign-in failed. Check the email, password, and Firebase Authentication setup.";
    }
  });
}
