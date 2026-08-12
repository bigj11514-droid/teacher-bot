const { loadTeacherBot } = require("./helpers/loadTeacherBot");
const { dashboardPage } = require("./helpers/fixtures");

const REVIEWS_KEY = "ycohde-reviews";
const reviewSectionMarkup = '<div id="review-section"></div><div id="public-reviews-list"></div>';

const storeReviews = (reviews) => localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
const storedReviews = () => JSON.parse(localStorage.getItem(REVIEWS_KEY) || "[]");

describe("renderReviewForm", () => {
  test("does nothing when the review section is missing", () => {
    const { bot } = loadTeacherBot({ body: "<div></div>" });
    expect(() => bot.renderReviewForm("Mathematics")).not.toThrow();
  });

  test("prefills the signed-in student name and names the subject", () => {
    const { bot } = loadTeacherBot({ body: reviewSectionMarkup, session: { name: "Ama Mensah" } });
    bot.renderReviewForm("Mathematics");

    expect(document.getElementById("review-name").value).toBe("Ama Mensah");
    expect(document.querySelector("#review-section p").textContent).toContain("Mathematics");
    expect(document.querySelectorAll(".review-star")).toHaveLength(5);
  });

  test("falls back to a generic subject label", () => {
    const { bot } = loadTeacherBot({ body: reviewSectionMarkup, session: null });
    bot.renderReviewForm();
    expect(document.querySelector("#review-section p").textContent).toContain("this subject");
    expect(document.getElementById("review-name").value).toBe("");
  });

  test("clicking a star highlights it and every star below it", () => {
    const { bot } = loadTeacherBot({ body: reviewSectionMarkup });
    bot.renderReviewForm("Science");

    document.querySelector('.review-star[data-value="3"]').click();

    const active = Array.from(document.querySelectorAll(".review-star.active")).map((s) => s.dataset.value);
    expect(active).toEqual(["1", "2", "3"]);
  });

  test("submitting saves the review, thanks the student and refreshes the public list", () => {
    const { bot } = loadTeacherBot({ body: reviewSectionMarkup, session: { name: "Ama Mensah" } });
    bot.renderReviewForm("Science");

    document.querySelector('.review-star[data-value="4"]').click();
    document.getElementById("review-text").value = "  Clear lessons  ";
    document.getElementById("review-form").dispatchEvent(new window.Event("submit", { cancelable: true }));

    const reviews = storedReviews();
    expect(reviews).toHaveLength(1);
    expect(reviews[0]).toMatchObject({ rating: 4, text: "Clear lessons", subject: "Science", studentName: "Ama Mensah" });
    expect(document.getElementById("review-feedback").textContent).toContain("Thanks for your review");
    expect(document.querySelectorAll("#public-reviews-list .review-post")).toHaveLength(1);
  });

  test("ignores an empty review", () => {
    const { bot } = loadTeacherBot({ body: reviewSectionMarkup });
    bot.renderReviewForm("Science");

    document.getElementById("review-text").value = "   ";
    document.getElementById("review-form").dispatchEvent(new window.Event("submit", { cancelable: true }));

    expect(storedReviews()).toHaveLength(0);
  });

  test("uses a default author when the name field is cleared", () => {
    const { bot } = loadTeacherBot({ body: reviewSectionMarkup, session: null });
    bot.renderReviewForm("Science");

    document.getElementById("review-name").value = "";
    document.getElementById("review-text").value = "Helpful";
    document.getElementById("review-form").dispatchEvent(new window.Event("submit", { cancelable: true }));

    expect(storedReviews()[0].studentName).toBe("A student");
  });
});

describe("renderPublicReviews", () => {
  test("does nothing when the list container is missing", () => {
    const { bot } = loadTeacherBot({ body: "<div></div>" });
    expect(() => bot.renderPublicReviews()).not.toThrow();
  });

  test("shows an empty state when nobody has reviewed yet", () => {
    const { bot } = loadTeacherBot({ body: '<div id="public-reviews-list"></div>' });
    bot.renderPublicReviews();
    expect(document.querySelector("#public-reviews-list .empty-state").textContent).toContain("No reviews yet");
  });

  test("shows the six newest reviews, newest first", () => {
    const { bot } = loadTeacherBot({ body: '<div id="public-reviews-list"></div>' });
    storeReviews(
      Array.from({ length: 8 }, (_, index) => ({
        rating: 3,
        text: `Review ${index}`,
        subject: "Maths",
        studentName: `Student ${index}`,
        createdAt: "today"
      }))
    );

    bot.renderPublicReviews();

    const posts = Array.from(document.querySelectorAll("#public-reviews-list .review-post"));
    expect(posts).toHaveLength(6);
    expect(posts[0].textContent).toContain("Student 7");
    expect(posts[0].querySelector(".stars").textContent).toBe("★★★");
  });
});

describe("setupCommunityPage", () => {
  test("does nothing when the community list is missing", () => {
    const { bot } = loadTeacherBot({ body: "<div></div>" });
    expect(() => bot.setupCommunityPage()).not.toThrow();
  });

  test("shows the built-in highlights when there are no saved reviews", () => {
    const { bot } = loadTeacherBot({ body: '<div id="community-list"></div>' });
    bot.setupCommunityPage();

    const cards = document.querySelectorAll("#community-list .community-card");
    expect(cards).toHaveLength(3);
    expect(cards[0].textContent).toContain("Ama K.");
  });

  test("lists saved reviews before the built-in highlights", () => {
    const { bot } = loadTeacherBot({ body: '<div id="community-list"></div>' });
    storeReviews([{ rating: 2, text: "Nice", subject: "Science", studentName: "Kojo", createdAt: "today" }]);

    bot.setupCommunityPage();

    const cards = document.querySelectorAll("#community-list .community-card");
    expect(cards).toHaveLength(4);
    expect(cards[0].querySelector("h3").textContent).toBe("Kojo");
    expect(cards[0].querySelector(".community-rating").textContent).toBe("★★☆☆☆");
  });

  test("escapes review content instead of rendering it as markup", () => {
    const { bot } = loadTeacherBot({ body: '<div id="community-list"></div>' });
    storeReviews([
      { rating: 5, text: "<script>alert(1)</script>", subject: "Science", studentName: "<b>Kojo</b>", createdAt: "today" }
    ]);

    bot.setupCommunityPage();

    const card = document.querySelector("#community-list .community-card");
    expect(card.querySelector("h3").textContent).toBe("<b>Kojo</b>");
    expect(card.querySelector("script")).toBeNull();
  });

  test("uses fallbacks for reviews saved without details", () => {
    const { bot } = loadTeacherBot({ body: '<div id="community-list"></div>' });
    storeReviews([{}]);

    bot.setupCommunityPage();

    const card = document.querySelector("#community-list .community-card");
    expect(card.querySelector("h3").textContent).toBe("Y_Cohde student");
    expect(card.querySelector(".community-rating").textContent).toBe("★★★★★");
  });
});

describe("setupEngagementFeatures", () => {
  test("does nothing when the engagement markup is missing", () => {
    const { bot } = loadTeacherBot({ body: "<div></div>" });
    expect(() => bot.setupEngagementFeatures()).not.toThrow();
  });

  test("confirms a newsletter sign-up and clears the field", () => {
    const { bot } = loadTeacherBot({ body: dashboardPage });
    bot.setupEngagementFeatures();

    document.getElementById("newsletter-email").value = " ama@example.com ";
    document.getElementById("newsletter-form").dispatchEvent(new window.Event("submit", { cancelable: true }));

    expect(document.getElementById("newsletter-status").textContent).toContain("ama@example.com has joined");
    expect(document.getElementById("newsletter-email").value).toBe("");
  });

  test("ignores an empty newsletter sign-up", () => {
    const { bot } = loadTeacherBot({ body: dashboardPage });
    bot.setupEngagementFeatures();

    document.getElementById("newsletter-email").value = "   ";
    document.getElementById("newsletter-form").dispatchEvent(new window.Event("submit", { cancelable: true }));

    expect(document.getElementById("newsletter-status").textContent).toBe("");
  });

  test("uses the Web Share API when it is available", async () => {
    const { bot } = loadTeacherBot({ body: dashboardPage });
    navigator.share = jest.fn().mockResolvedValue(undefined);
    bot.setupEngagementFeatures();

    document.getElementById("share-btn").click();
    await Promise.resolve();
    await Promise.resolve();

    expect(navigator.share).toHaveBeenCalledWith(expect.objectContaining({ title: "Y_Cohde Study Page" }));
    expect(document.getElementById("share-feedback").textContent).toContain("Thanks for sharing");
    delete navigator.share;
  });

  test("explains a cancelled share", async () => {
    const { bot } = loadTeacherBot({ body: dashboardPage });
    navigator.share = jest.fn().mockRejectedValue(new Error("cancelled"));
    bot.setupEngagementFeatures();

    document.getElementById("share-btn").click();
    await Promise.resolve();
    await Promise.resolve();

    expect(document.getElementById("share-feedback").textContent).toContain("Sharing was cancelled");
    delete navigator.share;
  });

  test("suggests copying the link when sharing is unsupported", () => {
    const { bot } = loadTeacherBot({ body: dashboardPage });
    bot.setupEngagementFeatures();

    document.getElementById("share-btn").click();

    expect(document.getElementById("share-feedback").textContent).toContain("Copy the page link");
  });

  test("acknowledges a recommendation", () => {
    const { bot } = loadTeacherBot({ body: dashboardPage });
    bot.setupEngagementFeatures();

    document.getElementById("recommend-btn").click();

    expect(document.getElementById("share-feedback").textContent).toContain("Recommended!");
  });

  test("sets a study reminder and shows a notification when permission is granted", () => {
    const { bot } = loadTeacherBot({ body: dashboardPage });
    const notification = jest.fn();
    window.Notification = Object.assign(notification, { permission: "granted", requestPermission: jest.fn() });
    bot.setupEngagementFeatures();

    document.getElementById("reminder-select").value = "45";
    document.getElementById("reminder-btn").click();

    expect(document.getElementById("reminder-status").textContent).toContain("Reminder set for 45 minutes");
    expect(notification).toHaveBeenCalled();
    delete window.Notification;
  });

  test("asks for notification permission when it has not been decided", async () => {
    const { bot } = loadTeacherBot({ body: dashboardPage });
    const notification = jest.fn();
    const requestPermission = jest.fn().mockImplementation(() => {
      window.Notification.permission = "granted";
      return Promise.resolve("granted");
    });
    window.Notification = Object.assign(notification, { permission: "default", requestPermission });
    bot.setupEngagementFeatures();

    document.getElementById("reminder-btn").click();
    await Promise.resolve();
    await Promise.resolve();

    expect(requestPermission).toHaveBeenCalled();
    expect(notification).toHaveBeenCalled();
    delete window.Notification;
  });

  test("still confirms the reminder when notifications are denied", () => {
    const { bot } = loadTeacherBot({ body: dashboardPage });
    window.Notification = Object.assign(jest.fn(), { permission: "denied", requestPermission: jest.fn() });
    bot.setupEngagementFeatures();

    document.getElementById("reminder-btn").click();

    expect(document.getElementById("reminder-status").textContent).toContain("Reminder set for 20 minutes");
    delete window.Notification;
  });
});
