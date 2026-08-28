const { loadTeacherBot } = require("./helpers/loadTeacherBot");
const { quizPage } = require("./helpers/fixtures");

const openQuizPage = (search = "?subject=maths&class=jhs2&department=jhs") =>
  loadTeacherBot({ body: quizPage, url: `https://example.com/quiz.html${search}` });

const answerButtons = () => Array.from(document.getElementById("answers").children);
const textOf = (id) => document.getElementById(id).textContent;

describe("setupQuizPage", () => {
  test("does nothing when the quiz setup markup is absent", () => {
    const { bot } = loadTeacherBot({ body: "<div></div>" });
    expect(() => bot.setupQuizPage()).not.toThrow();
  });

  test("pre-selects the department, class and subject from the query string", () => {
    const { bot } = openQuizPage("?subject=science&class=jhs3&department=jhs");
    bot.setupQuizPage();

    expect(document.getElementById("quiz-department-select").value).toBe("jhs");
    expect(document.getElementById("quiz-class-select").value).toBe("jhs3");
    expect(document.getElementById("quiz-subject-select").value).toBe("science");
    expect(textOf("setup-class-label")).toBe("JHS 3");
    expect(textOf("setup-subject-label")).toContain("Science is ready");
  });

  test("derives the department from the class when the query string omits it", () => {
    const { bot } = openQuizPage("?class=shs1&course=general-science");
    bot.setupQuizPage();
    expect(document.getElementById("quiz-department-select").value).toBe("shs");
  });

  test("rebuilds the class and subject options when the department changes", () => {
    const { bot } = openQuizPage("?subject=maths&class=basic2&department=basic");
    bot.setupQuizPage();

    const departmentSelect = document.getElementById("quiz-department-select");
    departmentSelect.value = "shs";
    departmentSelect.dispatchEvent(new window.Event("change"));

    const classOptions = Array.from(document.getElementById("quiz-class-select").options).map((o) => o.value);
    const subjectOptions = Array.from(document.getElementById("quiz-subject-select").options).map((o) => o.value);
    expect(classOptions).toEqual(["shs1", "shs2", "shs3"]);
    expect(subjectOptions).toContain("core-maths");
    expect(subjectOptions).not.toContain("creative");
  });

  test("keeps the chosen subject when only the class changes inside a department", () => {
    const { bot } = openQuizPage("?subject=science&class=jhs1&department=jhs");
    bot.setupQuizPage();

    const classSelect = document.getElementById("quiz-class-select");
    classSelect.value = "jhs3";
    classSelect.dispatchEvent(new window.Event("change"));

    expect(document.getElementById("quiz-subject-select").value).toBe("science");
  });

  test("refreshes the setup labels when the subject changes", () => {
    const { bot } = openQuizPage("?subject=maths&class=basic1&department=basic");
    bot.setupQuizPage();

    const subjectSelect = document.getElementById("quiz-subject-select");
    subjectSelect.value = "science";
    subjectSelect.dispatchEvent(new window.Event("change"));

    expect(textOf("setup-subject-label")).toContain("Science is ready");
  });

  test("falls back to a 15 second timer when the timer value is unusable", () => {
    const { bot } = openQuizPage("?subject=maths&class=basic1&department=basic");
    jest.spyOn(window.history, "replaceState").mockImplementation(() => {});
    bot.setupQuizPage();

    const timerSelect = document.getElementById("timer-select");
    timerSelect.innerHTML = '<option value="soon">Soon</option>';
    timerSelect.value = "soon";
    document.getElementById("start-quiz-btn").click();

    expect(textOf("timer")).toBe("Time left: 15s");
  });

  test("starting the quiz applies the timer, reveals the quiz area and updates the URL", () => {
    const { bot } = openQuizPage("?subject=maths&class=jhs2&department=jhs");
    const replaceState = jest.spyOn(window.history, "replaceState").mockImplementation(() => {});
    bot.setupQuizPage();

    document.getElementById("timer-select").value = "60";
    document.getElementById("start-quiz-btn").click();

    expect(document.getElementById("quiz-setup").style.display).toBe("none");
    expect(document.getElementById("quiz-active-area").style.display).toBe("flex");
    expect(textOf("timer")).toBe("Time left: 60s");
    expect(replaceState).toHaveBeenCalledWith({}, "", expect.stringContaining("subject=maths"));
  });

  test("adds the course parameter when starting an SHS quiz", () => {
    const { bot } = openQuizPage("?class=shs2&department=shs");
    const replaceState = jest.spyOn(window.history, "replaceState").mockImplementation(() => {});
    bot.setupQuizPage();

    document.getElementById("start-quiz-btn").click();

    expect(replaceState).toHaveBeenCalledWith({}, "", expect.stringContaining("course=general-arts"));
  });
});

describe("setupQuiz", () => {
  test("shows a helpful message when the subject does not exist", () => {
    const { bot } = openQuizPage("?subject=astrophysics&class=basic1");
    bot.setupQuiz();

    expect(textOf("questions")).toBe("Subject not found.");
    expect(document.getElementById("answers").innerHTML).toContain("Choose subject");
    expect(document.getElementById("nextbtn").style.display).toBe("none");
  });

  test("does nothing when the quiz markup is missing", () => {
    const { bot } = loadTeacherBot({ body: "<div></div>", url: "https://example.com/quiz.html?subject=maths" });
    expect(() => bot.setupQuiz()).not.toThrow();
  });

  test("renders the first question with the class level questions", () => {
    const { bot } = openQuizPage("?subject=maths&class=jhs2");
    bot.setupQuiz();

    const expected = bot.subjects.maths.jhs.map((question) => question.question);
    expect(expected).toContain(textOf("questions"));
    expect(textOf("subject-title")).toBe("Mathematics • JHS 2");
    expect(textOf("progress")).toBe(`Question 1 of ${expected.length}`);
    expect(answerButtons().length).toBeGreaterThan(1);
    expect(document.getElementById("nextbtn").disabled).toBe(true);
  });

  test("falls back to the early questions for an unknown class", () => {
    const { bot } = openQuizPage("?subject=maths&class=creche");
    bot.setupQuiz();

    expect(bot.subjects.maths.early.map((question) => question.question)).toContain(textOf("questions"));
    expect(textOf("subject-title")).toBe("Mathematics • Class");
  });

  test("shows the practice mode badge by default and the exam badge in exam mode", () => {
    const practice = openQuizPage("?subject=maths&class=basic1");
    practice.bot.setupQuiz();
    expect(textOf("mode-badge")).toContain("Practice Mode");

    const exam = openQuizPage("?subject=maths&class=basic1&mode=exam");
    exam.bot.setupQuiz();
    expect(textOf("mode-badge")).toContain("Exam Mode");
  });
});

describe("answering questions", () => {
  const startQuiz = (search) => {
    const loaded = openQuizPage(search);
    loaded.bot.setupQuiz();
    return loaded.bot;
  };

  test("marks a correct answer, scores it and disables the answers", () => {
    const bot = startQuiz("?subject=maths&class=basic1");
    const buttons = answerButtons();
    const questionText = textOf("questions");
    const source = bot.subjects.maths.early.find((item) => item.question === questionText);
    const correctText = source.answers[source.correct];
    const chosen = buttons.find((button) => button.textContent === correctText);

    chosen.click();

    expect(textOf("feedback")).toContain("Correct");
    expect(textOf("score")).toContain("Score: 1");
    expect(textOf("score")).toContain("Mistakes: 0");
    expect(buttons.every((button) => button.disabled)).toBe(true);
    expect(document.getElementById("nextbtn").disabled).toBe(false);
  });

  test("marks a wrong answer, counts a mistake and explains the answer", () => {
    const bot = startQuiz("?subject=maths&class=basic1");
    const buttons = answerButtons();
    const questionText = textOf("questions");
    const source = bot.subjects.maths.early.find((item) => item.question === questionText);
    const correctText = source.answers[source.correct];
    const wrong = buttons.find((button) => button.textContent !== correctText);

    wrong.click();

    expect(textOf("feedback")).toContain("Wrong");
    expect(textOf("score")).toContain("Score: 0");
    expect(textOf("score")).toContain("Mistakes: 1");
    expect(textOf("explanation")).toContain("Explanation:");
  });

  test("running out of time counts a mistake and unlocks the next button", () => {
    jest.useFakeTimers();
    startQuiz("?subject=maths&class=basic1");

    jest.advanceTimersByTime(15000);

    expect(textOf("feedback")).toContain("Time is up");
    expect(textOf("score")).toContain("Mistakes: 1");
    expect(answerButtons().every((button) => button.disabled)).toBe(true);
    expect(document.getElementById("nextbtn").disabled).toBe(false);
    jest.useRealTimers();
  });

  test("the timer counts down every second", () => {
    jest.useFakeTimers();
    startQuiz("?subject=maths&class=basic1");

    jest.advanceTimersByTime(3000);
    expect(textOf("timer")).toBe("Time left: 12s");
    jest.useRealTimers();
  });

  test("handleTimeout is a no-op when there is no current question", () => {
    const { bot } = openQuizPage("?subject=maths&class=basic1");
    expect(() => bot.handleTimeout()).not.toThrow();
  });
});

describe("nextQuestion", () => {
  test("advances to the following question and resets the feedback", () => {
    const { bot } = openQuizPage("?subject=maths&class=basic1");
    bot.setupQuiz();
    const firstQuestion = textOf("questions");

    answerButtons()[0].click();
    bot.nextQuestion();

    expect(textOf("progress")).toBe(`Question 2 of ${bot.subjects.maths.early.length}`);
    expect(textOf("questions")).not.toBe(firstQuestion);
    expect(textOf("feedback")).toBe("");
    expect(textOf("explanation")).toBe("Explanations are shown here");
  });

  test("shows the summary, the review form and a link back to the subjects at the end", () => {
    const { bot, location } = openQuizPage("?subject=maths&class=basic1");
    bot.setupQuiz();

    const total = bot.subjects.maths.early.length;
    for (let index = 0; index < total; index++) {
      answerButtons()[0].click();
      bot.nextQuestion();
    }

    expect(textOf("questions")).toContain(`/ ${total}`);
    expect(textOf("progress")).toBe("Quiz complete");
    expect(textOf("timer")).toBe("");
    expect(document.getElementById("answers").innerHTML).toBe("");
    expect(document.querySelector("#review-section .review-card")).not.toBeNull();

    const nextBtn = document.getElementById("nextbtn");
    expect(nextBtn.textContent).toBe("Choose another subject");
    nextBtn.click();
    expect(location.href).toBe("-index.html");
  });
});

describe("the review form after a quiz", () => {
  test("labels the review with a generic subject when the URL has none", () => {
    const { bot } = openQuizPage("?subject=maths&class=basic1");
    bot.setupQuiz();
    window.location.search = "?class=basic1";

    const total = bot.subjects.maths.early.length;
    for (let index = 0; index < total; index++) {
      answerButtons()[0].click();
      bot.nextQuestion();
    }

    expect(document.querySelector("#review-section p").textContent).toContain("this quiz");
  });
});

describe("showDiagramForQuestion", () => {
  test("renders a diagram placeholder image for visual questions", () => {
    const { bot } = openQuizPage();
    bot.showDiagramForQuestion({ question: "Draw the shape of a triangle" });
    expect(document.querySelector("#diagram-area img")).not.toBeNull();
  });

  test("renders helper text for questions without a visual prompt", () => {
    const { bot } = openQuizPage();
    bot.showDiagramForQuestion({ question: "What is 2 + 2?" });
    expect(textOf("diagram-area")).toContain("Sketch-style questions");
  });

  test("handles a question without any text", () => {
    const { bot } = openQuizPage();
    bot.showDiagramForQuestion({});
    expect(textOf("diagram-area")).toContain("Sketch-style questions");
  });

  test("does nothing when the page has no diagram area", () => {
    const { bot } = loadTeacherBot({ body: "<div></div>" });
    expect(() => bot.showDiagramForQuestion({ question: "shape" })).not.toThrow();
  });
});
