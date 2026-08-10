// Client-side sign-in for this static site. There is no backend, so this only
// records a display name for the dashboard. Real credential checks must happen
// on a server before any private data is served.
const menuButton = document.querySelector(".simple-menu-toggle");
const navigation = document.getElementById("simple-nav");
if (menuButton && navigation) {
  menuButton.addEventListener("click", () => {
    const open = navigation.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", open);
  });
}

const sessionKey = "ycohdeStudentSession";
const MAX_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 254;
const MIN_PASSWORD_LENGTH = 8;
const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M}\s'.-]*$/u;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

if (localStorage.getItem(sessionKey)) window.location.replace("index.html");

document.getElementById("login-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = document.getElementById("student-name").value.trim();
  const email = document.getElementById("student-email").value.trim();
  const password = document.getElementById("student-password").value;
  const error = document.getElementById("login-error");

  if (name.length > MAX_NAME_LENGTH || !NAME_PATTERN.test(name)) {
    error.textContent = `Enter your real name using letters only (up to ${MAX_NAME_LENGTH} characters).`;
    return;
  }
  if (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
    error.textContent = "Enter a valid email address, for example you@example.com.";
    return;
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    error.textContent = `Use a password of at least ${MIN_PASSWORD_LENGTH} characters.`;
    return;
  }

  // The password is never stored or transmitted by this static site.
  localStorage.setItem(sessionKey, JSON.stringify({ name, email }));
  window.location.replace("index.html");
});
