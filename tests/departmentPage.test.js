const { loadTeacherBot } = require("./helpers/loadTeacherBot");
const { departmentPage, subjectLinksPage } = require("./helpers/fixtures");

const openDepartmentPage = (search = "") =>
  loadTeacherBot({ body: departmentPage, url: `https://example.com/department.html${search}` });

const classOptions = () => Array.from(document.getElementById("class-select").options).map((o) => o.value);

describe("updateDepartmentVisual", () => {
  test.each(["basic", "jhs", "shs"])("renders the %s illustration", (department) => {
    const { bot } = openDepartmentPage();
    bot.updateDepartmentVisual(department);
    const visual = document.getElementById("department-visual");
    expect(visual.querySelector("img").getAttribute("src")).toContain("images.unsplash.com");
    expect(visual.querySelector("p").textContent.length).toBeGreaterThan(0);
  });

  test("falls back to the basic illustration for an unknown department", () => {
    const { bot } = openDepartmentPage();
    bot.updateDepartmentVisual("postgrad");
    expect(document.getElementById("department-visual").textContent).toContain("Basic learners");
  });

  test("does nothing when the visual container is missing", () => {
    const { bot } = loadTeacherBot({ body: "<div></div>" });
    expect(() => bot.updateDepartmentVisual("basic")).not.toThrow();
  });
});

describe("setupDepartmentPage", () => {
  test("does nothing when the department controls are missing", () => {
    const { bot } = loadTeacherBot({ body: "<div></div>" });
    expect(() => bot.setupDepartmentPage()).not.toThrow();
  });

  test("defaults to the basic department with its classes and message", () => {
    const { bot } = openDepartmentPage();
    bot.setupDepartmentPage();

    expect(document.getElementById("department-select").value).toBe("basic");
    expect(classOptions()).toEqual(["basic1", "basic2", "basic3", "basic4", "basic5", "basic6"]);
    expect(document.getElementById("class-select").options[0].textContent).toBe("Basic 1");
    expect(document.getElementById("department-message").textContent).toContain("Basic students");
    expect(document.getElementById("course-select").style.display).toBe("none");
  });

  test("restores the department, class and course from the query string", () => {
    const { bot } = openDepartmentPage("?department=shs&class=shs3&course=business");
    bot.setupDepartmentPage();

    expect(classOptions()).toEqual(["shs1", "shs2", "shs3"]);
    expect(document.getElementById("class-select").value).toBe("shs3");
    expect(document.getElementById("course-select").value).toBe("business");
    expect(document.getElementById("course-select").style.display).toBe("inline-block");
    expect(document.getElementById("course-label").style.display).toBe("inline-block");
  });

  test("ignores a class that does not belong to the selected department", () => {
    const { bot } = openDepartmentPage("?department=jhs&class=basic5");
    bot.setupDepartmentPage();
    expect(document.getElementById("class-select").value).toBe("jhs1");
  });

  test("switching department refreshes the classes, message and illustration", () => {
    const { bot } = openDepartmentPage();
    bot.setupDepartmentPage();

    const departmentSelect = document.getElementById("department-select");
    departmentSelect.value = "jhs";
    departmentSelect.dispatchEvent(new window.Event("change"));

    expect(classOptions()).toEqual(["jhs1", "jhs2", "jhs3"]);
    expect(document.getElementById("department-message").textContent).toContain("Junior High");
    expect(document.getElementById("department-visual").textContent).toContain("JHS learners");
  });

  test("shows the course picker only for SHS", () => {
    const { bot } = openDepartmentPage();
    bot.setupDepartmentPage();

    const departmentSelect = document.getElementById("department-select");
    departmentSelect.value = "shs";
    departmentSelect.dispatchEvent(new window.Event("change"));
    expect(document.getElementById("course-select").style.display).toBe("inline-block");
    expect(document.getElementById("department-message").textContent).toContain("Senior High");

    departmentSelect.value = "basic";
    departmentSelect.dispatchEvent(new window.Event("change"));
    expect(document.getElementById("course-select").style.display).toBe("none");
  });

  test("continue sends the learner to the subject page with their selection", () => {
    const { bot, location } = openDepartmentPage("?department=jhs&class=jhs2");
    bot.setupDepartmentPage();

    document.getElementById("continue-btn").click();

    expect(location.href).toBe("-index.html?class=jhs2&department=jhs");
  });

  test("continue includes the course for SHS learners", () => {
    const { bot, location } = openDepartmentPage("?department=shs&class=shs1&course=general-science");
    bot.setupDepartmentPage();

    document.getElementById("continue-btn").click();

    expect(location.href).toContain("course=general-science");
  });
});

describe("renderSubjectLinks", () => {
  test("renders a link per subject with the class in the query string", () => {
    const { bot } = loadTeacherBot({ body: subjectLinksPage, url: "https://example.com/-index.html" });
    const container = document.getElementById("subject-links");

    bot.renderSubjectLinks("jhs2", container);

    const links = Array.from(container.querySelectorAll("a.subject-link"));
    expect(links).toHaveLength(bot.subjectCatalog.jhs.length);
    expect(container.querySelector("p.select").textContent).toContain("JHS 2 has 7 subject options");
    expect(links[0].getAttribute("href")).toBe("quiz.html?subject=maths&class=jhs2");
  });

  test("keeps the course in SHS subject links", () => {
    const { bot } = loadTeacherBot({
      body: subjectLinksPage,
      url: "https://example.com/-index.html?course=business"
    });
    const container = document.getElementById("subject-links");

    bot.renderSubjectLinks("shs2", container);

    expect(container.querySelector("a.subject-link").getAttribute("href")).toContain("&course=business");
  });

  test("uses a neutral intro for an unknown class", () => {
    const { bot } = loadTeacherBot({ body: subjectLinksPage, url: "https://example.com/-index.html" });
    const container = document.getElementById("subject-links");

    bot.renderSubjectLinks("basic9", container);

    expect(container.querySelector("p.select").textContent).toContain("Your class has");
  });
});

describe("setupSubjectLinks", () => {
  test("does nothing when the subject link markup is missing", () => {
    const { bot } = loadTeacherBot({ body: "<div></div>" });
    expect(() => bot.setupSubjectLinks()).not.toThrow();
  });

  test("renders the subjects for the class in the query string", () => {
    const { bot } = loadTeacherBot({
      body: subjectLinksPage,
      url: "https://example.com/-index.html?class=jhs2"
    });
    bot.setupSubjectLinks();

    expect(document.getElementById("class-select").value).toBe("jhs2");
    expect(document.querySelectorAll("#subject-links a.subject-link")).toHaveLength(7);
    expect(document.getElementById("department-message").textContent).toContain("Choose a subject");
  });

  test("greets SHS learners with the senior high message", () => {
    const { bot } = loadTeacherBot({
      body: subjectLinksPage,
      url: "https://example.com/-index.html?class=shs1"
    });
    bot.setupSubjectLinks();

    expect(document.getElementById("department-message").textContent).toContain("Senior High");
  });

  test("re-renders the subjects when the class changes", () => {
    const { bot } = loadTeacherBot({
      body: subjectLinksPage,
      url: "https://example.com/-index.html?class=basic1"
    });
    bot.setupSubjectLinks();

    const classSelect = document.getElementById("class-select");
    classSelect.value = "shs1";
    classSelect.dispatchEvent(new window.Event("change"));

    const labels = Array.from(document.querySelectorAll("#subject-links a.subject-link")).map((a) => a.textContent);
    expect(labels).toContain("Core Mathematics");
    expect(document.getElementById("department-message").textContent).toContain("Senior High");
  });
});
