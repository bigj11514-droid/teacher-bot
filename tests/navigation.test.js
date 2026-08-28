const { loadTeacherBot, fireDomContentLoaded } = require("./helpers/loadTeacherBot");
const { sidebarNav, simpleNav, quizPage, departmentPage, dashboardPage } = require("./helpers/fixtures");

const setWindowWidth = (width) => {
  Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: width });
};

describe("setupMobileMenu", () => {
  test("does nothing when the sidebar or toggle is missing", () => {
    const { bot } = loadTeacherBot({ body: '<nav id="site-nav"></nav>' });
    expect(() => bot.setupMobileMenu()).not.toThrow();
  });

  test("toggles the sidebar open and closed", () => {
    const { bot } = loadTeacherBot({ body: sidebarNav });
    bot.setupMobileMenu();

    const toggle = document.querySelector(".menu-toggle");
    toggle.click();

    expect(document.querySelector(".sidebar").classList.contains("open")).toBe(true);
    expect(document.body.classList.contains("menu-open")).toBe(true);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");

    toggle.click();

    expect(document.querySelector(".sidebar").classList.contains("open")).toBe(false);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  test("closes the menu when a navigation link is used on a small screen", () => {
    const { bot } = loadTeacherBot({ body: sidebarNav });
    bot.setupMobileMenu();
    setWindowWidth(500);

    document.querySelector(".menu-toggle").click();
    document.querySelector("#site-nav a").click();

    expect(document.querySelector(".sidebar").classList.contains("open")).toBe(false);
  });

  test("keeps the menu open when a navigation link is used on a wide screen", () => {
    const { bot } = loadTeacherBot({ body: sidebarNav });
    bot.setupMobileMenu();
    setWindowWidth(1200);

    document.querySelector(".menu-toggle").click();
    const link = document.querySelector("#site-nav a");
    link.addEventListener("click", (event) => event.preventDefault());
    link.click();

    expect(document.querySelector(".sidebar").classList.contains("open")).toBe(true);
  });

  test("closes the menu when clicking outside the sidebar", () => {
    const { bot } = loadTeacherBot({ body: `${sidebarNav}<main id="outside">content</main>` });
    bot.setupMobileMenu();

    document.querySelector(".menu-toggle").click();
    document.getElementById("outside").click();

    expect(document.querySelector(".sidebar").classList.contains("open")).toBe(false);
  });

  test("closes the menu when the window grows past the mobile breakpoint", () => {
    const { bot } = loadTeacherBot({ body: sidebarNav });
    bot.setupMobileMenu();

    document.querySelector(".menu-toggle").click();
    setWindowWidth(1200);
    window.dispatchEvent(new window.Event("resize"));

    expect(document.querySelector(".sidebar").classList.contains("open")).toBe(false);
    expect(document.body.classList.contains("menu-open")).toBe(false);
  });
});

describe("setupSimpleHamburgerMenu", () => {
  test("does nothing when the simple menu is missing", () => {
    const { bot } = loadTeacherBot({ body: "<div></div>" });
    expect(() => bot.setupSimpleHamburgerMenu()).not.toThrow();
  });

  test("toggles the simple navigation", () => {
    const { bot } = loadTeacherBot({ body: simpleNav });
    bot.setupSimpleHamburgerMenu();

    const button = document.querySelector(".simple-menu-toggle");
    button.click();

    expect(document.getElementById("simple-nav").classList.contains("open")).toBe(true);
    expect(button.getAttribute("aria-expanded")).toBe("true");
  });

  test("closes the simple navigation after a link is used", () => {
    const { bot } = loadTeacherBot({ body: simpleNav });
    bot.setupSimpleHamburgerMenu();

    document.querySelector(".simple-menu-toggle").click();
    document.querySelector("#simple-nav a").click();

    expect(document.getElementById("simple-nav").classList.contains("open")).toBe(false);
    expect(document.querySelector(".simple-menu-toggle").getAttribute("aria-expanded")).toBe("false");
  });
});

describe("page bootstrap", () => {
  test("the department page builds its selects once the DOM is ready", () => {
    loadTeacherBot({ body: departmentPage, url: "https://example.com/department.html?department=jhs" });
    fireDomContentLoaded();

    expect(Array.from(document.getElementById("class-select").options).map((o) => o.value)).toEqual([
      "jhs1",
      "jhs2",
      "jhs3"
    ]);
    expect(document.querySelector(".site-nav .logout-btn")).not.toBeNull();
  });

  test("the quiz page prepares the setup card and wires the next button", () => {
    loadTeacherBot({ body: quizPage, url: "https://example.com/quiz.html?subject=maths&class=basic1" });
    fireDomContentLoaded();

    expect(document.getElementById("quiz-subject-select").value).toBe("maths");

    document.getElementById("start-quiz-btn").click();
    const firstQuestion = document.getElementById("questions").textContent;
    document.querySelector("#answers button").click();
    document.getElementById("nextbtn").click();

    expect(document.getElementById("questions").textContent).not.toBe(firstQuestion);
  });

  test("other pages render the explorer, community list and reviews", () => {
    loadTeacherBot({ body: dashboardPage, url: "https://example.com/index.html" });
    fireDomContentLoaded();

    expect(document.querySelectorAll("#learning-explorer .year-chip").length).toBeGreaterThan(0);
    expect(document.querySelectorAll("#community-list .community-card").length).toBe(3);
    expect(document.querySelector("#public-reviews-list .empty-state")).not.toBeNull();
  });

  test("a signed-out visitor is sent to the login page instead", () => {
    const { location } = loadTeacherBot({ body: dashboardPage, session: null });
    fireDomContentLoaded();

    expect(location.replace).toHaveBeenCalledWith("login.html");
    expect(document.getElementById("learning-explorer").innerHTML).toBe("");
  });
});
