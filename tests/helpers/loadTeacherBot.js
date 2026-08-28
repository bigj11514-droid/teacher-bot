const path = require("path");

const SCRIPT_PATH = path.join(__dirname, "..", "..", "teacherbot.js");

/**
 * Replaces window.location with a plain stub so navigation performed by the
 * page script can be asserted instead of triggering jsdom "not implemented".
 */
function stubLocation(url) {
  const parsed = new URL(url);
  const location = {
    href: parsed.href,
    search: parsed.search,
    pathname: parsed.pathname,
    origin: parsed.origin,
    replace: jest.fn(),
    assign: jest.fn(),
    reload: jest.fn()
  };
  delete window.location;
  Object.defineProperty(window, "location", {
    configurable: true,
    writable: true,
    value: location
  });
  return location;
}

/**
 * Loads teacherbot.js against a fresh DOM.
 *
 * @param {object} options
 * @param {string} options.body markup placed inside document.body
 * @param {string} options.url page URL used for query string parsing
 * @param {object|null} options.session student session stored in localStorage
 * @returns {{ bot: object, location: object }}
 */
function loadTeacherBot({ body = "", url = "https://example.com/index.html", session = { name: "Ama Mensah" } } = {}) {
  document.body.innerHTML = body;
  document.body.className = "";
  localStorage.clear();
  if (session) {
    localStorage.setItem("ycohdeStudentSession", JSON.stringify(session));
  }
  const location = stubLocation(url);
  jest.resetModules();
  const bot = require(SCRIPT_PATH);
  return { bot, location };
}

/** Fires DOMContentLoaded so the script's page bootstrap runs. */
function fireDomContentLoaded() {
  document.dispatchEvent(new window.Event("DOMContentLoaded"));
}

module.exports = { loadTeacherBot, fireDomContentLoaded, stubLocation, SCRIPT_PATH };
