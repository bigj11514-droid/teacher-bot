const { loadTeacherBot } = require("./helpers/loadTeacherBot");

const url = (search) => `https://example.com/quiz.html${search}`;

describe("query string readers", () => {
  test("read subject, class, department and course in lower case", () => {
    const { bot } = loadTeacherBot({ url: url("?subject=MATHS&class=JHS2&department=JHS&course=Business") });
    expect(bot.getSubjectKey()).toBe("maths");
    expect(bot.getClassKey()).toBe("jhs2");
    expect(bot.getDepartmentKey()).toBe("jhs");
    expect(bot.getCourseKey()).toBe("business");
  });

  test("fall back to defaults when parameters are missing", () => {
    const { bot } = loadTeacherBot({ url: url("") });
    expect(bot.getSubjectKey()).toBeUndefined();
    expect(bot.getClassKey()).toBe("basic1");
    expect(bot.getDepartmentKey()).toBe("");
    expect(bot.getCourseKey()).toBe("general-arts");
  });
});

describe("getDepartmentFromClass", () => {
  test.each([
    ["shs2", "shs"],
    ["jhs1", "jhs"],
    ["basic4", "basic"],
    ["unknown", "basic"]
  ])("maps %s to %s", (classKey, expected) => {
    const { bot } = loadTeacherBot();
    expect(bot.getDepartmentFromClass(classKey)).toBe(expected);
  });
});

describe("getSubjectCatalogForClass", () => {
  test("returns the basic subject list for basic classes", () => {
    const { bot } = loadTeacherBot();
    expect(bot.getSubjectCatalogForClass("basic3")).toBe(bot.subjectCatalog.basic);
  });

  test("returns the JHS subject list for JHS classes", () => {
    const { bot } = loadTeacherBot();
    expect(bot.getSubjectCatalogForClass("jhs1")).toBe(bot.subjectCatalog.jhs);
  });

  test("returns the course catalog for SHS classes", () => {
    const { bot } = loadTeacherBot({ url: url("?course=general-science") });
    expect(bot.getSubjectCatalogForClass("shs1")).toBe(bot.shsCourseCatalog["general-science"]);
  });

  test("falls back to general arts for an unknown SHS course", () => {
    const { bot } = loadTeacherBot({ url: url("?course=rocket-science") });
    expect(bot.getSubjectCatalogForClass("shs3")).toBe(bot.shsCourseCatalog["general-arts"]);
  });
});

describe("shuffleArray", () => {
  test("keeps every item and does not mutate the input", () => {
    const { bot } = loadTeacherBot();
    const input = [1, 2, 3, 4, 5];
    const shuffled = bot.shuffleArray(input);

    expect(shuffled).not.toBe(input);
    expect(input).toEqual([1, 2, 3, 4, 5]);
    expect([...shuffled].sort()).toEqual(input);
  });

  test("reverses the array when Math.random always returns 0", () => {
    const { bot } = loadTeacherBot();
    jest.spyOn(Math, "random").mockReturnValue(0);
    expect(bot.shuffleArray(["a", "b", "c"])).toEqual(["b", "c", "a"]);
    Math.random.mockRestore();
  });
});

describe("buildShuffledQuestion", () => {
  test("tracks the correct answer through the shuffle", () => {
    const { bot } = loadTeacherBot();
    const question = { question: "2 + 2?", answers: ["3", "4", "5", "6"], correct: 1, explanation: "Add" };

    for (let run = 0; run < 25; run++) {
      const shuffled = bot.buildShuffledQuestion(question);
      expect(shuffled.answers).toHaveLength(4);
      expect([...shuffled.answers].sort()).toEqual(["3", "4", "5", "6"]);
      expect(shuffled.answers[shuffled.correct]).toBe("4");
      expect(shuffled.explanation).toBe("Add");
    }
  });
});

describe("getExplanationForCurrentQuestion", () => {
  test("uses the authored explanation when present", () => {
    const { bot } = loadTeacherBot();
    expect(
      bot.getExplanationForCurrentQuestion({ question: "Q", answers: ["a"], correct: 0, explanation: "Because." })
    ).toBe("Because.");
  });

  test("builds a fallback explanation naming the correct answer", () => {
    const { bot } = loadTeacherBot();
    const explanation = bot.getExplanationForCurrentQuestion({
      question: "Which is a noun?",
      answers: ["Run", "Book"],
      correct: 1
    });
    expect(explanation).toContain('The correct answer is "Book"');
    expect(explanation).toContain("Which is a noun?");
  });
});

describe("escapeCommunityText", () => {
  test("escapes markup so reviews cannot inject HTML", () => {
    const { bot } = loadTeacherBot();
    expect(bot.escapeCommunityText("<img src=x onerror=alert(1)>")).toBe(
      "&lt;img src=x onerror=alert(1)&gt;"
    );
  });

  test("returns an empty string for missing values", () => {
    const { bot } = loadTeacherBot();
    expect(bot.escapeCommunityText(undefined)).toBe("");
  });
});

describe("getNextLessonTarget", () => {
  test("follows an explicit next pointer when the lesson defines one", () => {
    const { bot } = loadTeacherBot();
    expect(
      bot.getNextLessonTarget(bot.learningCatalog.ges, "Science", "Living things", "What is a plant?")
    ).toEqual({ subject: "Science", topic: "Living things", subtopic: "Types of plants" });
  });

  test("moves to the next subtopic inside the same topic", () => {
    const { bot } = loadTeacherBot();
    expect(
      bot.getNextLessonTarget(bot.learningCatalog.ges, "Mathematics", "Numbers and operations", "Place value")
    ).toEqual({ subject: "Mathematics", topic: "Numbers and operations", subtopic: "Addition" });
  });

  test("moves to the first subtopic of the next topic at the end of a topic", () => {
    const { bot } = loadTeacherBot();
    expect(
      bot.getNextLessonTarget(bot.learningCatalog.ges, "Mathematics", "Shapes and measurement", "Width")
    ).toEqual({ subject: "Mathematics", topic: "Data and patterns", subtopic: "Pictographs" });
  });

  test("moves to the next subject once a subject is finished", () => {
    const { bot } = loadTeacherBot();
    const syllabus = {
      topics: {
        Mathematics: { Counting: { Ones: {} } },
        Science: { Plants: { Roots: {} } }
      }
    };
    expect(bot.getNextLessonTarget(syllabus, "Mathematics", "Counting", "Ones")).toEqual({
      subject: "Science",
      topic: "Plants",
      subtopic: "Roots"
    });
  });

  test("returns null at the very end of the syllabus", () => {
    const { bot } = loadTeacherBot();
    const syllabus = { topics: { Science: { Plants: { Roots: {} } } } };
    expect(bot.getNextLessonTarget(syllabus, "Science", "Plants", "Roots")).toBeNull();
  });

  test("returns null for an unknown subject or topic", () => {
    const { bot } = loadTeacherBot();
    const syllabus = { topics: { Science: { Plants: { Roots: {} } } } };
    expect(bot.getNextLessonTarget(syllabus, "History", "Plants", "Roots")).toBeNull();
    expect(bot.getNextLessonTarget(syllabus, "Science", "Rocks", "Roots")).toBeNull();
  });
});
