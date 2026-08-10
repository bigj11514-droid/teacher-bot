const { loadTeacherBot } = require("./helpers/loadTeacherBot");
const { learningPage, dashboardPage } = require("./helpers/fixtures");

const openLearningPage = (search = "") =>
  loadTeacherBot({ body: learningPage, url: `https://example.com/learning.html${search}` });

const space = () => document.getElementById("learning-space");

describe("setupLearningExplorer", () => {
  test("lists every syllabus with links for each year", () => {
    const { bot } = loadTeacherBot({ body: dashboardPage });
    bot.setupLearningExplorer();

    const explorer = document.getElementById("learning-explorer");
    const rows = explorer.querySelectorAll("tbody tr");
    expect(rows).toHaveLength(Object.keys(bot.learningCatalog).length);
    expect(explorer.textContent).toContain(bot.learningCatalog.ges.name);
    expect(explorer.querySelectorAll(".year-chip")).toHaveLength(
      Object.values(bot.learningCatalog).reduce((total, syllabus) => total + syllabus.years.length, 0)
    );
    expect(explorer.querySelector(".year-chip").getAttribute("href")).toBe(
      "learning.html?syllabus=ges&year=Basic%201"
    );
  });

  test("does nothing when the explorer container is missing", () => {
    const { bot } = loadTeacherBot({ body: "<div></div>" });
    expect(() => bot.setupLearningExplorer()).not.toThrow();
  });
});

describe("startLessonTimer", () => {
  test("counts down and reports when the lesson time is over", () => {
    jest.useFakeTimers();
    const { bot } = loadTeacherBot({ body: '<div id="lesson-timer"></div>' });

    bot.startLessonTimer(3);
    expect(document.getElementById("lesson-timer").textContent).toBe("Lesson time: 0:03");

    jest.advanceTimersByTime(1000);
    expect(document.getElementById("lesson-timer").textContent).toBe("Lesson time: 0:02");

    jest.advanceTimersByTime(3000);
    expect(document.getElementById("lesson-timer").textContent).toBe(
      "Lesson time is complete — finish when you are ready."
    );
    jest.useRealTimers();
  });

  test("formats minutes and seconds for the default lesson length", () => {
    jest.useFakeTimers();
    const { bot } = loadTeacherBot({ body: '<div id="lesson-timer"></div>' });
    bot.startLessonTimer();
    expect(document.getElementById("lesson-timer").textContent).toBe("Lesson time: 10:00");
    jest.useRealTimers();
  });

  test("keeps running safely when the page has no timer element", () => {
    jest.useFakeTimers();
    const { bot } = loadTeacherBot({ body: "<div></div>" });
    bot.startLessonTimer(2);
    expect(() => jest.advanceTimersByTime(3000)).not.toThrow();
    jest.useRealTimers();
  });
});

describe("setupLearningSpace", () => {
  test("does nothing when the learning space is missing", () => {
    const { bot } = loadTeacherBot({ body: "<div></div>" });
    expect(() => bot.setupLearningSpace()).not.toThrow();
  });

  test("renders every subject and topic of the selected syllabus", () => {
    const { bot } = openLearningPage("?syllabus=ges&year=Basic%202");
    bot.setupLearningSpace();

    expect(space().textContent).toContain("GES Standard-Based Curriculum · Basic 2");
    expect(space().querySelectorAll(".topic-card")).toHaveLength(
      Object.keys(bot.learningCatalog.ges.topics).length
    );
    expect(space().querySelector('.subtopic-btn[data-subtopic="Place value"]')).not.toBeNull();
  });

  test("falls back to the GES syllabus for an unknown syllabus key", () => {
    const { bot } = openLearningPage("?syllabus=unknown");
    bot.setupLearningSpace();
    expect(space().textContent).toContain("GES Standard-Based Curriculum");
  });

  test("opens a lesson with its timer and returns to the topic list", () => {
    jest.useFakeTimers();
    const { bot } = openLearningPage();
    bot.setupLearningSpace();

    space().querySelector('.subtopic-btn[data-subtopic="Place value"]').click();

    expect(space().querySelector("h2").textContent).toBe("Place value");
    expect(space().textContent).toContain("Place value tells us");
    expect(document.getElementById("lesson-timer").textContent).toBe("Lesson time: 10:00");

    document.getElementById("back-to-topics").click();
    expect(space().querySelectorAll(".topic-card").length).toBeGreaterThan(0);
    jest.useRealTimers();
  });

  test("renders the lesson image when the subtopic has one", () => {
    const { bot } = openLearningPage();
    bot.setupLearningSpace();
    space().querySelector('.subtopic-btn[data-subtopic="What is a plant?"]').click();
    expect(space().querySelector("img.lesson-image")).not.toBeNull();
  });

  test("finishing a lesson opens the understanding modal", () => {
    const { bot } = openLearningPage();
    bot.setupLearningSpace();
    space().querySelector('.subtopic-btn[data-subtopic="Place value"]').click();

    document.getElementById("finish-lesson").click();

    expect(document.getElementById("understanding-modal").classList.contains("visible")).toBe(true);
  });

  test("answering 'not yet' closes the modal and suggests re-reading the lesson", () => {
    const { bot } = openLearningPage();
    bot.setupLearningSpace();
    space().querySelector('.subtopic-btn[data-subtopic="Place value"]').click();
    document.getElementById("finish-lesson").click();

    document.getElementById("understood-no").click();

    expect(document.getElementById("understanding-modal").classList.contains("visible")).toBe(false);
    expect(space().querySelector(".review-note").textContent).toContain("Read the lesson once more");
  });

  test("answering 'yes' starts the topic quiz and moves on to the next lesson", () => {
    jest.useFakeTimers();
    const { bot } = openLearningPage();
    bot.setupLearningSpace();
    space().querySelector('.subtopic-btn[data-subtopic="Place value"]').click();
    document.getElementById("finish-lesson").click();
    document.getElementById("understood-yes").click();

    expect(space().querySelector(".topic-quiz")).not.toBeNull();

    const lesson = bot.learningCatalog.ges.topics.Mathematics["Numbers and operations"]["Place value"];
    lesson.questions.forEach(() => {
      space().querySelector("[data-answer]").click();
      jest.advanceTimersByTime(1200);
    });

    document.getElementById("choose-another-topic").click();
    expect(space().querySelector("h2").textContent).toBe("Addition");
    jest.useRealTimers();
  });

  test("returns to the topic list after the last lesson of the syllabus", () => {
    jest.useFakeTimers();
    const { bot } = openLearningPage();
    bot.setupLearningSpace();
    space().querySelector('.subtopic-btn[data-subtopic="Safe movement"]').click();
    document.getElementById("finish-lesson").click();
    document.getElementById("understood-yes").click();

    const lesson = bot.learningCatalog.ges.topics["Physical Education"]["Games and safety"]["Safe movement"];
    lesson.questions.forEach(() => {
      space().querySelector("[data-answer]").click();
      jest.advanceTimersByTime(1200);
    });
    document.getElementById("choose-another-topic").click();

    expect(space().querySelectorAll(".topic-card").length).toBeGreaterThan(0);
    jest.useRealTimers();
  });
});

describe("renderTopicQuiz", () => {
  const lesson = {
    lesson: "Short lesson",
    questions: [
      ["Pick the first answer", ["Yes", "No"], 0],
      ["Pick the second answer", ["No", "Yes"], 1]
    ]
  };

  test("scores correct answers and reports a perfect result", () => {
    jest.useFakeTimers();
    const { bot } = openLearningPage();
    const afterQuiz = jest.fn();
    bot.renderTopicQuiz(lesson, afterQuiz);

    expect(space().textContent).toContain("Question 1 of 2");
    space().querySelector('[data-answer="0"]').click();
    expect(document.getElementById("topic-feedback").textContent).toContain("Correct");

    jest.advanceTimersByTime(1200);
    space().querySelector('[data-answer="1"]').click();
    jest.advanceTimersByTime(1200);

    expect(space().textContent).toContain("You scored 2 out of 2");
    expect(space().textContent).toContain("Excellent work");
    expect(space().textContent).toContain("Choose another topic");

    document.getElementById("choose-another-topic").click();
    expect(afterQuiz).toHaveBeenCalled();
    jest.useRealTimers();
  });

  test("explains the correct answer after a wrong choice and encourages practice", () => {
    jest.useFakeTimers();
    const { bot } = openLearningPage();
    bot.renderTopicQuiz(lesson, jest.fn());

    space().querySelector('[data-answer="1"]').click();
    expect(document.getElementById("topic-feedback").textContent).toBe("Not quite. The correct answer is Yes.");
    expect(space().querySelectorAll("[data-answer]")[0].disabled).toBe(true);

    jest.advanceTimersByTime(1200);
    space().querySelector('[data-answer="0"]').click();
    jest.advanceTimersByTime(1200);

    expect(space().textContent).toContain("You scored 0 out of 2");
    expect(space().textContent).toContain("Keep practising");
    jest.useRealTimers();
  });

  test("offers the next lesson when the lesson has a follow-up", () => {
    jest.useFakeTimers();
    const { bot } = openLearningPage();
    bot.renderTopicQuiz(
      { ...lesson, questions: [lesson.questions[0]], next: { subject: "Science", topic: "Living things", subtopic: "Types of plants" } },
      jest.fn()
    );

    space().querySelector('[data-answer="0"]').click();
    jest.advanceTimersByTime(1200);

    expect(space().textContent).toContain("Continue to the next lesson");
    expect(space().textContent).toContain("Your next learning step is ready.");
    jest.useRealTimers();
  });

  test("falls back to rebuilding the learning space when no callback is given", () => {
    jest.useFakeTimers();
    const { bot } = openLearningPage();
    bot.renderTopicQuiz({ ...lesson, questions: [lesson.questions[0]] });

    space().querySelector('[data-answer="0"]').click();
    jest.advanceTimersByTime(1200);
    document.getElementById("choose-another-topic").click();

    expect(space().querySelectorAll(".topic-card").length).toBeGreaterThan(0);
    jest.useRealTimers();
  });
});
