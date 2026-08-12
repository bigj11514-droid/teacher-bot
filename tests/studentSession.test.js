const { loadTeacherBot } = require("./helpers/loadTeacherBot");
const { sidebarNav, simpleNav } = require("./helpers/fixtures");

describe("getStudentSession", () => {
  test("returns the stored student", () => {
    const { bot } = loadTeacherBot({ session: { name: "Ama Mensah" } });
    expect(bot.getStudentSession()).toEqual({ name: "Ama Mensah" });
  });

  test("returns null when nothing is stored", () => {
    const { bot } = loadTeacherBot({ session: null });
    expect(bot.getStudentSession()).toBeNull();
  });

  test("returns null when the stored value is not valid JSON", () => {
    const { bot } = loadTeacherBot({ session: null });
    localStorage.setItem(bot.STUDENT_SESSION_KEY, "not-json");
    expect(bot.getStudentSession()).toBeNull();
  });
});

describe("requireStudentLogin", () => {
  test("allows the page to continue for a signed-in student", () => {
    const { bot, location } = loadTeacherBot({ session: { name: "Ama" } });
    expect(bot.requireStudentLogin()).toBe(true);
    expect(location.replace).not.toHaveBeenCalled();
  });

  test("redirects to the login page when signed out", () => {
    const { bot, location } = loadTeacherBot({ session: null });
    expect(bot.requireStudentLogin()).toBe(false);
    expect(location.replace).toHaveBeenCalledWith("login.html");
  });
});

describe("setupStudentSession", () => {
  test("does nothing when there is no session", () => {
    const { bot } = loadTeacherBot({ body: sidebarNav, session: null });
    bot.setupStudentSession();
    expect(document.querySelector(".profile-pill strong").textContent).toBe("Student");
    expect(document.querySelector(".logout-btn")).toBeNull();
  });

  test("shows the student name and initials in every profile pill", () => {
    const { bot } = loadTeacherBot({ body: sidebarNav, session: { name: "ama serwaa mensah" } });
    bot.setupStudentSession();
    expect(document.querySelector(".profile-pill strong").textContent).toBe("ama serwaa mensah");
    expect(document.querySelector(".profile-pill span").textContent).toBe("AS");
  });

  test("falls back to ST initials when the name has no usable words", () => {
    const { bot } = loadTeacherBot({ body: sidebarNav, session: { name: "   " } });
    bot.setupStudentSession();
    expect(document.querySelector(".profile-pill span").textContent).toBe("ST");
  });

  test("adds the community link, department quiz menu and logout button once", () => {
    const { bot } = loadTeacherBot({ body: sidebarNav });
    bot.setupStudentSession();
    bot.setupStudentSession();

    const nav = document.getElementById("site-nav");
    expect(nav.querySelectorAll(".community-nav-link")).toHaveLength(1);
    expect(nav.querySelectorAll(".department-quiz-nav")).toHaveLength(1);
    expect(nav.querySelectorAll(".logout-btn")).toHaveLength(1);
    expect(
      Array.from(nav.querySelectorAll(".department-quiz-nav a")).map((link) => link.getAttribute("href"))
    ).toEqual(["quiz.html?department=basic", "quiz.html?department=jhs", "quiz.html?department=shs"]);
  });

  test("logging out clears the session and returns to the login page", () => {
    const { bot, location } = loadTeacherBot({ body: sidebarNav });
    bot.setupStudentSession();

    document.querySelector(".site-nav .logout-btn").click();

    expect(localStorage.getItem(bot.STUDENT_SESSION_KEY)).toBeNull();
    expect(location.replace).toHaveBeenCalledWith("login.html");
  });

  test("adds a community link and logout button to the simple navigation", () => {
    const { bot } = loadTeacherBot({ body: simpleNav });
    bot.setupStudentSession();

    const nav = document.getElementById("simple-nav");
    expect(nav.querySelector(".community-nav-link").textContent).toBe("Student community");
    expect(nav.querySelector(".simple-nav-logout.logout-btn")).not.toBeNull();
  });
});
