// Shared browser utilities used by every page of the static site.
// Loaded before teacherbot.js (and before the inline login script) so the
// helpers below are available as globals.

const STORAGE_KEYS = {
  studentSession: "ycohdeStudentSession",
  reviews: "ycohde-reviews"
};

function readStoredJson(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeStoredJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getStudentSession() {
  return readStoredJson(STORAGE_KEYS.studentSession);
}

function saveStudentSession(session) {
  writeStoredJson(STORAGE_KEYS.studentSession, session);
}

function clearStudentSession() {
  localStorage.removeItem(STORAGE_KEYS.studentSession);
}

function getStoredReviews() {
  const reviews = readStoredJson(STORAGE_KEYS.reviews, []);
  return Array.isArray(reviews) ? reviews : [];
}

function addStoredReview(review) {
  const reviews = getStoredReviews();
  reviews.push(review);
  writeStoredJson(STORAGE_KEYS.reviews, reviews);
}

function getRecentReviews(limit = 6) {
  return getStoredReviews().slice(-limit).reverse();
}

function getQueryParam(name, fallback = "") {
  const value = new URLSearchParams(window.location.search).get(name);
  return value === null ? fallback : value;
}

function getQueryKey(name, fallback = "") {
  return getQueryParam(name, fallback).toLowerCase();
}

function byId(id) {
  return document.getElementById(id);
}

function setText(target, text) {
  const element = typeof target === "string" ? byId(target) : target;
  if (element) element.textContent = text;
  return element;
}

function setHtml(target, html) {
  const element = typeof target === "string" ? byId(target) : target;
  if (element) element.innerHTML = html;
  return element;
}

function disableAll(elements) {
  Array.from(elements || []).forEach((element) => {
    element.disabled = true;
  });
}

function setExpanded(element, isExpanded) {
  if (element) element.setAttribute("aria-expanded", String(isExpanded));
}

function escapeHtml(value) {
  const element = document.createElement("div");
  element.textContent = value === undefined || value === null ? "" : value;
  return element.innerHTML;
}

function renderStars(rating, { showEmpty = false, total = 5 } = {}) {
  const filled = Math.max(0, Math.min(total, Number(rating) || 0));
  return "★".repeat(filled) + (showEmpty ? "☆".repeat(total - filled) : "");
}

function renderOptions(options, { value = "value", label = "label" } = {}) {
  return options
    .map((option) => `<option value="${option[value]}">${option[label]}</option>`)
    .join("");
}

// Runs `onTick` immediately and once per second until the countdown reaches
// zero, then calls `onComplete`. The returned handle stops the countdown.
function createCountdown({ seconds, onTick, onComplete }) {
  let remaining = seconds;
  let intervalId = null;

  const stop = () => {
    clearInterval(intervalId);
    intervalId = null;
  };

  onTick(remaining);
  intervalId = setInterval(() => {
    remaining -= 1;
    onTick(remaining);
    if (remaining <= 0) {
      stop();
      if (onComplete) onComplete();
    }
  }, 1000);

  return { stop };
}

function formatClock(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function setupSimpleHamburgerMenu() {
  const button = document.querySelector(".simple-menu-toggle");
  const navigation = byId("simple-nav");
  if (!button || !navigation) return;

  const setOpen = (isOpen) => {
    navigation.classList.toggle("open", isOpen);
    setExpanded(button, isOpen);
  };

  button.addEventListener("click", () => setOpen(!navigation.classList.contains("open")));
  navigation.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setOpen(false)));
}
