﻿console.log("Teacher Bot loaded");

const STUDENT_SESSION_KEY = "ycohdeStudentSession";
const CONTENT_OVERRIDES_KEY = "ycohdeContentOverrides";
const CONTRIBUTING_TEACHERS_KEY = "ycohdeContributingTeachers";
const STAFF_POSTS_KEY = "ycohdeStaffPosts";
const CATALOG_NAMES_KEY = "ycohdeCatalogNames";
const PENDING_CONTENT_KEY = "ycohdePendingContent";
const MEDIA_DATABASE_NAME = "ycohdeLessonMedia";
const MEDIA_STORE_NAME = "media";
const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_UPLOAD_BYTES = 100 * 1024 * 1024;
const SITE_NOTIFICATIONS_KEY = "ycohdeSiteNotifications";
const PUSH_SUBSCRIBERS_KEY = "ycohdePushSubscribers";

/**
 * @returns {Object|null} The student session object if found, or null if not.
 */
function getStudentSession() {
  try {
    return JSON.parse(localStorage.getItem(STUDENT_SESSION_KEY));
  } catch {
    return null;
  }
}

// Uploaded files live in IndexedDB, which is suitable for media unlike localStorage.
function openLessonMediaDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(MEDIA_DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(MEDIA_STORE_NAME))
        request.result.createObjectStore(MEDIA_STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveLessonMedia(file) {
  if (!file) return "";
  const id = `${Date.now()}-${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)}`;
  const database = await openLessonMediaDatabase();
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(MEDIA_STORE_NAME, "readwrite");
    transaction.objectStore(MEDIA_STORE_NAME).put(file, id);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
  return id;
}

async function getLessonMedia(id) {
  if (!id) return null;
  const database = await openLessonMediaDatabase();
  const result = await new Promise((resolve, reject) => {
    const request = database
      .transaction(MEDIA_STORE_NAME, "readonly")
      .objectStore(MEDIA_STORE_NAME)
      .get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
  database.close();
  return result;
}

function requireStudentLogin() {
  const user = getStudentSession();
  if (!user) {
    window.location.replace("login.html");
    return false;
  }
  if (user.role === "administrator") {
    window.location.replace("admin.html");
    return false;
  }
  if (user.role === "teacher") {
    window.location.replace("teacher.html");
    return false;
  }
  return true;
}

function requireRole(...roles) {
  const user = getStudentSession();
  if (!user || !roles.includes(user.role)) {
    window.location.replace(
      user?.role === "administrator"
        ? "admin.html"
        : user?.role === "teacher"
          ? "teacher.html"
          : "login.html",
    );
    return false;
  }
  return true;
}

function setupStudentSession() {
  const student = getStudentSession();
  if (!student) return;
  const studentName = String(student.name || "Student");

  document.querySelectorAll(".sidebar").forEach((sidebar) => {
    if (student.role !== "teacher" && student.role !== "administrator") return;
    const existingProfile = sidebar.querySelector(".staff-profile");
    if (existingProfile) existingProfile.remove();
    const isAdministrator = student.role === "administrator";
    const initials = studentName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
    const profile = document.createElement("section");
    profile.className = "staff-profile";
    profile.setAttribute(
      "aria-label",
      `${isAdministrator ? "Administrator" : "Teacher"} profile`,
    );
    profile.innerHTML = `<div class="staff-profile-image"><img src="picture in coat.jpeg" alt="${isAdministrator ? "Administrator" : "Teacher"} profile picture"><span>${initials || (isAdministrator ? "AD" : "TE")}</span></div><div class="staff-profile-details"><strong></strong><span>${student.occupation || (isAdministrator ? "Platform administrator" : "Learning content teacher")}</span><small>${student.school || "Y_Cohde Academy"}</small></div>`;
    profile.querySelector("strong").textContent = studentName;
    const image = profile.querySelector("img");
    image.addEventListener("error", () => {
      image.hidden = true;
    });
    sidebar.append(profile);
  });

  document.querySelectorAll(".profile-pill").forEach((profile) => {
    const initials = studentName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
    const nameElement = profile.querySelector("strong");
    const initialsElement = profile.querySelector("span");
    if (nameElement) nameElement.textContent = student.name;
    if (initialsElement) initialsElement.textContent = initials || "ST";
  });

  const addLogout = (navigation, className) => {
    if (!navigation || navigation.querySelector(".logout-btn")) return;
    const logoutButton = document.createElement("button");
    logoutButton.type = "button";
    logoutButton.className = `${className} logout-btn`;
    logoutButton.setAttribute("aria-label", "Log out of Y_Cohde");
    logoutButton.textContent = "Log out";
    logoutButton.addEventListener("click", () => {
      localStorage.removeItem(STUDENT_SESSION_KEY);
      // FIRST-VISIT ROLE CHOICE: let the next person choose their own role.
      sessionStorage.removeItem("ycohdeLoginRoleChoice");
      window.location.replace("login.html");
    });
    navigation.append(logoutButton);
  };

  document.querySelectorAll(".site-nav").forEach((navigation) => {
    const addContributionLink = () => {
      if (navigation.querySelector(".contribution-nav-link")) return;
      const contributionLink = document.createElement("a");
      contributionLink.className = "nav-item contribution-nav-link";
      contributionLink.href = "contribution.html";
      contributionLink.innerHTML = "<span>♥</span><span>Support Y_Cohde</span>";
      navigation.append(contributionLink);
    };
    const isStaffPanel = Boolean(
      document.getElementById("teacher-studio") ||
      document.getElementById("administrator-panel"),
    );
    if (isStaffPanel) {
      // Staff sidebars intentionally contain only their own studio. Students
      // retain the community and department-quiz navigation elsewhere.
      navigation
        .querySelectorAll(
          ".community-nav-link, .department-quiz-nav, .admin-nav-link, .teacher-nav-link",
        )
        .forEach((item) => item.remove());
      addContributionLink();
      addLogout(navigation, "nav-item");
      return;
    }
    if (
      student.role === "administrator" &&
      !navigation.querySelector(".admin-nav-link")
    ) {
      navigation.insertAdjacentHTML(
        "beforeend",
        '<a class="nav-item admin-nav-link" href="admin.html"><span>⚙</span><span>Administrator panel</span></a>',
      );
    }
    if (
      student.role === "teacher" &&
      !navigation.querySelector(".teacher-nav-link")
    ) {
      navigation.insertAdjacentHTML(
        "beforeend",
        '<a class="nav-item teacher-nav-link" href="teacher.html"><span>🎥</span><span>Teacher studio</span></a>',
      );
    }
    if (!navigation.querySelector(".community-nav-link")) {
      const communityLink = document.createElement("a");
      communityLink.className = "nav-item community-nav-link";
      communityLink.href = "community.html";
      communityLink.innerHTML = "<span>👥</span><span>Student community</span>";
      navigation.append(communityLink);
    }
    if (!navigation.querySelector(".department-quiz-nav")) {
      const quizMenu = document.createElement("details");
      quizMenu.className = "department-quiz-nav";
      quizMenu.innerHTML = `
        <summary>📝 Department quizzes</summary>
        <a href="quiz.html?department=basic">Basic quiz</a>
        <a href="quiz.html?department=jhs">JHS quiz</a>
        <a href="quiz.html?department=shs">SHS quiz</a>
      `;
      navigation.append(quizMenu);
    }
    addContributionLink();
    if (
      student.role === "student" &&
      !navigation.querySelector(".payment-nav-link")
    ) {
      const paymentLink = document.createElement("a");
      paymentLink.className = "nav-item payment-nav-link";
      paymentLink.href = "payment.html";
      paymentLink.innerHTML = "<span>💳</span><span>Monthly payment</span>";
      navigation.append(paymentLink);
    }
    addLogout(navigation, "nav-item");
  });
  const simpleNav = document.getElementById("simple-nav");
  if (simpleNav && !simpleNav.querySelector(".community-nav-link")) {
    const communityLink = document.createElement("a");
    communityLink.className = "community-nav-link";
    communityLink.href = "community.html";
    communityLink.textContent = "Student community";
    simpleNav.append(communityLink);
  }
  addLogout(simpleNav, "simple-nav-logout");
  // STUDENT-ONLY SIDEBAR: teachers and administrators do not see learning progress.
  if (student.role === "student") setupSidebarProgressCard();
  showSiteNotifications(student);
}

// CURRICULUM EDIT GUIDE
// - BASIC DEPARTMENT (Basic 1–6): edit the `ges` catalogue directly below.
// - JHS DEPARTMENT (JHS 1–3): edit `createJhsCatalog` further down.
// - SHS DEPARTMENT (SHS 1–3): edit `createShsCourseCatalog` and its course calls.
// - For one exact lesson, find its subject → main topic → subtopic in the
//   relevant section, then edit its `lesson`, `questions`, `examples` or `image`.
const learningCatalog = {
  // BASIC DEPARTMENT: this is the lesson content used by Basic 1, Basic 2,
  // Basic 3, Basic 4, Basic 5 and Basic 6. Question wording by class is set
  // in LEVEL_QUESTION_TEMPLATES below.
  ges: {
    name: "GES Standard-Based Curriculum",
    years: [
      "Basic 1",
      "Basic 2",
      "Basic 3",
      "Basic 4",
      "Basic 5",
      "Basic 6",
      "JHS 1",
      "JHS 2",
      "JHS 3",
    ],
    topics: {
      Mathematics: {
        "Numbers and operations": {
          "Place value": {
            lesson:
              "Place value tells us what each digit is worth because of its position. In 4,582, the 4 means 4 thousands, the 5 means 5 hundreds, the 8 means 8 tens, and the 2 means 2 ones.",
            examples: [
              {
                title: "Ones",
                problem: "In 3,471, what is the value of 1?",
                steps: ["The 1 is in the ones place."],
                result: "1 one = 1",
              },
              {
                title: "Tens",
                problem: "In 6,284, what is the value of 8?",
                steps: [
                  "The 8 is in the tens place.",
                  "Eight tens means 8 × 10.",
                ],
                result: "80",
              },
              {
                title: "Hundreds",
                problem: "In 5,639, what is the value of 6?",
                steps: [
                  "The 6 is in the hundreds place.",
                  "Six hundreds means 6 × 100.",
                ],
                result: "600",
              },
              {
                title: "Thousands",
                problem: "In 7,245, what is the value of 7?",
                steps: [
                  "The 7 is in the thousands place.",
                  "Seven thousands means 7 × 1,000.",
                ],
                result: "7,000",
              },
              {
                title: "All places together",
                problem: "Break down 4,582.",
                steps: [
                  "4 is thousands.",
                  "5 is hundreds, 8 is tens, and 2 is ones.",
                ],
                result: "4,000 + 500 + 80 + 2 = 4,582",
              },
            ],
            exercise: {
              question: "What is the value of 3 in 3,426?",
              answers: ["3000", "3,000"],
              hint: "Look at the position of 3: thousands, hundreds, tens or ones?",
            },
            questions: [
              [
                "What is the place value of 5 in 4,582?",
                ["5", "50", "500", "5,000"],
                2,
              ],
              [
                "Which digit is in the tens place in 4,582?",
                ["4", "5", "8", "2"],
                2,
              ],
              [
                "What is the place value of 6 in 5,639?",
                ["6", "60", "600", "6,000"],
                2,
              ],
              [
                "Which digit is in the thousands place in 7,245?",
                ["7", "2", "4", "5"],
                0,
              ],
              [
                "Which expanded form equals 4,582?",
                [
                  "4,000 + 500 + 80 + 2",
                  "400 + 50 + 8 + 2",
                  "4,000 + 50 + 8 + 2",
                  "4,000 + 500 + 8 + 2",
                ],
                0,
              ],
            ],
          },
          Addition: {
            lesson:
              "Addition combines quantities. Line up numbers by ones, tens and hundreds, then add each column from right to left. Regroup ten ones as one ten when needed.",
            examples: [
              {
                title: "Addition in Ones",
                problem: "What is 2 + 5?",
                steps: [
                  "Draw 2 strokes and 5 strokes on s sheet of papper. Now, add all the strokes. Count all your strokes",
                ],
                result:
                  "2 + 5 =  7. meaning: 2( | | ) + 5( | | | | | ) = 7( | | | | | | | ).",
              },
              {
                title: "Addition in Tens",
                problem: "what is 20 + 15?",
                steps: [
                  "Another way to find this: Put the bigger number in your head. So the bigger number we have in this Question is 20. Now Draw 15 strokes and start counting from 20: from 20 count forward and continue with the 15 strokes you drew.",
                ],
                result: "20 + 15 = 35",
              },
              {
                title: "Addition in Hundreds",
                problem: "What  is 234 + 458?",
                steps: ["what is 20 + 15?"],
                steps: [
                  "Put the bigger number in your head. So the bigger number we have in this Question is 20. Now Draw 15 strokes and start counting from 458: from 458 count forward and continue with the 458 strokes you drew.",
                ],
                result: "234 + 458 = 782",
              },
              {
                title: "Addition in Thousands",
                problem: "What is 7,245 + 3452?",
                steps: [
                  "Add them verticaly on thier correcnt place values. Meaning 5 and 2 place value is ONCE, 4 and 5 place value are in TENS, 2 and 4 place value are on HUNDREDS, 7 and 3 place value are in THOUSANDS.",
                ],
                result:
                  "So 7,245 + 3452 = 10,697. Starting from the RIght, 5 + 2 = 7, 4 + 5 = 9, 4 + 2 = 6, 7 + 3 = 10",
              },
              {
                title: "All places together",
                problem: "Break down 4,582.",
                steps: [
                  "4 is thousands.",
                  "5 is hundreds, 8 is tens, and 2 is ones.",
                ],
                result: "4,000 + 500 + 80 + 2 = 4,582",
              },
            ],
            questions: [
              ["What is 27 + 15?", ["32", "42", "52", "41"], 1],
              ["What is 127 + 125?", ["132", "42", "253", "41"], 2],
              ["Add 50 + 24", ["132", "42", "253", "74"], 3],
              [
                "Which column do you add first?",
                ["Hundreds", "Tens", "Ones", "Thousands"],
                2,
              ],
            ],
          },
          Multiplication: {
            lesson:
              "Multiplication is repeated addition. When you multiply two numbers, you are adding one number to itself a certain number of times. Learn your Multipication Time Table. 2 x 1 = 2, 2 x 2 = 4, etc",
            questions: [
              ["What is 3 × 4?", ["14", "12", "15", "20"], 1],
              ["What is 3 × 5?", ["14", "12", "15", "20"], 2],
              ["What is 4 × 5?", ["14", "20", "15", "20"], 1],
              ["What is 6 × 7?", ["14", "12", "15", "42"], 3],
              [
                "What is the symbol for Multiplication?",
                ["+", "-", "/", " x"],
                3,
              ],
              [
                "Which operation is the same as 5 + 5 + 5?",
                ["3 × 5", "5 × 3", "5 + 3", "3 + 5"],
                0,
              ],
            ],
            next: {
              subject: "Mathematics",
              topic: "Numbers and operations",
              subtopic: "Division",
            },
          },
          Division: {
            lesson:
              "Division is the process of sharing or grouping things equally. When you divide, you are splitting a quantity into equal parts. In other Words, Division is the invers(oposite) for Multiplication. Eg, 4 ÷ 2 = 2. How did we arrive at answer = 2 ? what this means is that 2 x ___ = 4. Another Example, 8 ÷ 2 = 4. Hence, 2 x ____ = 8.  ",
            questions: [
              ["What is 12 ÷ 3?", ["3", "4", "5", "6"], 1],
              ["What is 8 ÷ 4?", ["3", "4", "2", "6"], 2],
              ["What is 54 ÷ 6?", ["3", "5", "2", "6"], 1],
              [
                "Which operation is the inverse of multiplication?",
                ["Addition", "Subtraction", "Division", "Exponentiation"],
                2,
              ],
            ],
          },
          Subtraction: {
            lesson:
              "Subtraction means to take a small amount from a larger amount.",
            image:
              "https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=900&q=80",
            questions: [
              [
                "How do you understand the concept of subtraction?",
                ["To take something out", "To add something in"],
                0,
              ],
              [
                "What do most plants use to make food?",
                ["Sunlight", "Plastic", "Stones", "Toys"],
                0,
              ],
            ],
            next: {
              subject: "Science",
              topic: "Living things",
              subtopic: "Types of plants",
            },
          },
        },
        "Shapes and measurement": {
          "2D shapes": {
            lesson:
              "A 2D shapes are drawn with lines. A triangle has three sides(lines), a square has four equal sides, and a rectangle has two pairs of equal sides.",
            questions: [
              ["How many sides does a triangle have?", ["2", "3", "4", "5"], 1],
              [
                "Which shape has four equal sides?",
                ["Triangle", "Rectangle", "Square", "Circle"],
                2,
              ],
            ],
          },
          Length: {
            lesson:
              "Length tells us how long something is. We can measure small objects in centimetres and longer distances in metres. Always start the ruler at zero.",
            questions: [
              [
                "What unit is useful for measuring a pencil?",
                ["Kilometres", "Metres", "Centimetres", "Litres"],
                2,
              ],
              [
                "Where should a ruler start?",
                ["At 1", "At zero", "At the end", "Anywhere"],
                1,
              ],
            ],
          },
          Width: {
            lesson:
              "Width tells us how wide something is. We can measure small objects in centimetres and longer distances in metres. Always start the ruler at zero.",
            questions: [
              [
                "What unit is useful for measuring a pencil?",
                ["Kilometres", "Metres", "Centimetres", "Litres"],
                2,
              ],
              [
                "Where should a ruler start?",
                ["At 1", "At zero", "At the end", "Anywhere"],
                1,
              ],
            ],
          },
        },
        "Data and patterns": {
          Pictographs: {
            lesson:
              "A pictograph uses pictures or symbols to show information. Always read the key first, because one picture can stand for more than one item.",
            questions: [
              [
                "What should you read first on a pictograph?",
                ["The key", "The title only", "The answer", "A story"],
                0,
              ],
              [
                "A pictograph uses what to show data?",
                ["Pictures or symbols", "Only letters", "Songs", "Maps"],
                0,
              ],
            ],
          },
          "Number patterns": {
            lesson:
              "A number pattern follows a rule. Look at how one number changes to the next. The rule may be adding, subtracting, multiplying or dividing.",
            questions: [
              ["What comes next: 2, 4, 6, 8?", ["9", "10", "11", "12"], 1],
              ["The pattern 5, 10, 15 is adding…", ["2", "5", "10", "15"], 1],
            ],
          },
        },
      },
      Science: {
        "Living things": {
          "What is a plant?": {
            lesson:
              "A plant is a living thing. Most plants grow in the ground, make their own food using sunlight, and need water and air to stay healthy. Trees, grass, flowers and vegetables are all plants.",
            image:
              "https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=900&q=80",
            questions: [
              ["Is a plant a living thing?", ["Yes", "No"], 0],
              [
                "What do most plants use to make food?",
                ["Sunlight", "Plastic", "Stones", "Toys"],
                0,
              ],
            ],
            next: {
              subject: "Science",
              topic: "Living things",
              subtopic: "Types of plants",
            },
          },
          "Types of plants": {
            lesson:
              "Plants come in different types. Trees are tall and have hard woody stems. Shrubs are shorter and bushy. Herbs are small plants with soft stems. Climbers need support to grow upward, while creepers spread along the ground.",
            image:
              "https://images.unsplash.com/photo-1466781783364-36c955e42a7f?auto=format&fit=crop&w=900&q=80",
            questions: [
              [
                "Which plant type usually has a hard woody stem?",
                ["Herb", "Tree", "Creeper", "Climber"],
                1,
              ],
              [
                "Which plants grow along the ground?",
                ["Trees", "Shrubs", "Creepers", "Herbs"],
                2,
              ],
            ],
            next: {
              subject: "Science",
              topic: "Living things",
              subtopic: "Parts of a plant",
            },
          },
          "Parts of a plant": {
            lesson:
              "Plants have roots, stems, leaves, flowers and fruits. Roots hold the plant in soil and take in water. The stem supports the plant, while leaves use sunlight to help make food.",
            image:
              "https://images.unsplash.com/photo-1520412099551-62b6bafeb5bb?auto=format&fit=crop&w=900&q=80",
            questions: [
              [
                "Which part takes in water from the soil?",
                ["Flower", "Root", "Leaf", "Fruit"],
                1,
              ],
              [
                "What do leaves use to help make food?",
                ["Moonlight", "Sunlight", "Sand", "Wind"],
                1,
              ],
            ],
            next: {
              subject: "Science",
              topic: "Living things",
              subtopic: "What plants need",
            },
          },
          "What plants need": {
            lesson:
              "Plants need sunlight, water, air, space and nutrients from the soil. Without these, a plant may not grow well. Caring for plants means watering them, giving them enough light, and protecting them from harm.",
            image:
              "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=80",
            questions: [
              [
                "Which of these does a plant need to grow?",
                ["Water", "A television", "A shoe", "A toy"],
                0,
              ],
              [
                "Where do plants get nutrients?",
                [
                  "From the soil",
                  "From a book",
                  "From a chair",
                  "From a phone",
                ],
                0,
              ],
            ],
          },
          "The human body": {
            lesson:
              "The human body has systems that work together. The heart pumps blood, the lungs help us breathe, and the brain helps us think and control actions.",
            questions: [
              [
                "Which organ pumps blood?",
                ["Lung", "Brain", "Heart", "Stomach"],
                2,
              ],
              [
                "Which organ helps us think?",
                ["Brain", "Heart", "Skin", "Bone"],
                0,
              ],
            ],
          },
        },
        "Materials and energy": {
          "Solids, liquids and gases": {
            lesson:
              "Materials can be solids, liquids or gases. A solid keeps its shape, a liquid flows and takes the shape of its container, and a gas spreads out to fill space.",
            questions: [
              [
                "Which state of matter flows?",
                ["Solid", "Liquid", "Stone", "Metal"],
                1,
              ],
              [
                "Which state fills its container?",
                ["Gas", "Solid", "Wood", "Ice"],
                0,
              ],
            ],
          },
          "Sources of energy": {
            lesson:
              "Energy helps us do work. We get energy from the sun, food, fuel, wind and moving water. Solar energy comes from sunlight.",
            questions: [
              [
                "Solar energy comes from…",
                ["The sun", "The moon", "Soil", "Paper"],
                0,
              ],
              [
                "What gives our bodies energy?",
                ["Food", "A chair", "A pencil", "A book"],
                0,
              ],
            ],
          },
        },
      },
      "English Language": {
        "Reading and comprehension": {
          "Main idea": {
            lesson:
              "The main idea is the most important point in a passage. Think about what the whole passage is mostly telling you.",
            questions: [
              [
                "The main idea is…",
                [
                  "The main point",
                  "A spelling mistake",
                  "A picture",
                  "A page number",
                ],
                0,
              ],
              [
                "A main idea comes from the…",
                [
                  "Whole passage",
                  "First letter only",
                  "Last word only",
                  "Book cover only",
                ],
                0,
              ],
            ],
          },
          "Sequence of events": {
            lesson:
              "Sequence tells the order in which events happen. Words such as first, next, then and finally help us follow a sequence.",
            questions: [
              [
                "Which word can begin a sequence?",
                ["First", "Blue", "Jump", "Quiet"],
                0,
              ],
              [
                "Sequence means…",
                ["Order of events", "A colour", "A game", "A question"],
                0,
              ],
            ],
          },
        },
        "Writing and grammar": {
          Nouns: {
            lesson:
              "A noun names a person, place, animal or thing. For example, Ama, school, dog and book are nouns.",
            questions: [
              ["Which word is a noun?", ["Run", "Happy", "Book", "Quickly"], 2],
              [
                "A noun can name a…",
                ["Person", "Only action", "Only colour", "Only sound"],
                0,
              ],
            ],
          },
          Sentences: {
            lesson:
              "A complete sentence has a capital letter at the beginning, words that make sense together, and a punctuation mark at the end.",
            questions: [
              [
                "What begins a sentence?",
                ["A capital letter", "A full stop", "A comma", "A number"],
                0,
              ],
              [
                "What can end a statement?",
                ["Full stop", "Capital letter", "Space", "Heading"],
                0,
              ],
            ],
          },
        },
      },
      "Our World Our People": {
        "Ghana and community": {
          "National symbols": {
            lesson:
              "National symbols represent a country. Ghana's flag, coat of arms and national anthem help show Ghana's identity.",
            questions: [
              [
                "Which is a national symbol?",
                ["National flag", "School bag", "Pencil", "Desk"],
                0,
              ],
              [
                "The national anthem represents…",
                ["The country", "One classroom", "One book", "A toy"],
                0,
              ],
            ],
          },
          "Community helpers": {
            lesson:
              "Community helpers have jobs that support people. Teachers educate, nurses care for patients, police officers help keep people safe, and farmers grow food.",
            questions: [
              [
                "Who helps to educate learners?",
                ["Teacher", "Farmer", "Driver", "Tailor"],
                0,
              ],
              [
                "Who grows food for people?",
                ["Farmer", "Nurse", "Pilot", "Artist"],
                0,
              ],
            ],
          },
        },
        Environment: {
          "Keeping clean": {
            lesson:
              "A clean environment protects our health. Use bins, avoid littering, and help keep classrooms, homes and public spaces tidy.",
            questions: [
              [
                "Where should rubbish go?",
                ["In a bin", "On the road", "In a river", "Under a desk"],
                0,
              ],
              [
                "A clean environment helps our…",
                ["Health", "Litter", "Noise", "Waste"],
                0,
              ],
            ],
          },
          "Natural resources": {
            lesson:
              "Natural resources come from nature. Water, soil, trees, sunlight and minerals are resources we should use carefully.",
            questions: [
              [
                "Which is a natural resource?",
                ["Water", "Plastic ruler", "Notebook", "Shoe"],
                0,
              ],
              [
                "Trees are important because they are…",
                ["Natural resources", "Machines", "Toys", "Buildings"],
                0,
              ],
            ],
          },
        },
      },
      History: {
        "Ghana's past": {
          "Early communities": {
            lesson:
              "Long ago, people in Ghana lived in communities where they farmed, fished, traded and supported one another. Communities grew near places with water, fertile land and useful resources.",
            questions: [
              [
                "Why did many early communities grow near water?",
                [
                  "For water and food",
                  "For computers",
                  "For airports",
                  "For cinemas",
                ],
                0,
              ],
              [
                "People in early communities often…",
                [
                  "Farmed and traded",
                  "Used smartphones",
                  "Drove buses",
                  "Built rockets",
                ],
                0,
              ],
            ],
          },
          "Traditional leadership": {
            lesson:
              "Traditional leaders help guide their communities. Chiefs and elders work with community members to preserve customs, settle disagreements and promote development.",
            questions: [
              [
                "Who may help guide a traditional community?",
                [
                  "Chiefs and elders",
                  "Only tourists",
                  "Only children",
                  "Nobody",
                ],
                0,
              ],
              [
                "Traditional leaders can help settle…",
                [
                  "Disagreements",
                  "Rainfall",
                  "Homework only",
                  "Television shows",
                ],
                0,
              ],
            ],
          },
        },
        "National history": {
          Independence: {
            lesson:
              "Ghana became independent on 6 March 1957. Independence means a country governs itself instead of being ruled by another country.",
            questions: [
              [
                "When did Ghana become independent?",
                [
                  "6 March 1957",
                  "1 January 2000",
                  "25 December 1900",
                  "6 March 2020",
                ],
                0,
              ],
              [
                "Independence means a country…",
                [
                  "Governs itself",
                  "Stops learning",
                  "Has no people",
                  "Has no flag",
                ],
                0,
              ],
            ],
          },
          "Important national events": {
            lesson:
              "National events help us remember important moments in Ghana's story. We learn from the past so we can make thoughtful choices for the future.",
            questions: [
              [
                "Why do we learn national history?",
                [
                  "To understand the past",
                  "To forget everything",
                  "To avoid books",
                  "To stop asking questions",
                ],
                0,
              ],
              [
                "History can help us make…",
                [
                  "Thoughtful choices",
                  "No choices",
                  "Only mistakes",
                  "Random noise",
                ],
                0,
              ],
            ],
          },
        },
        "Historical skills": {
          Timelines: {
            lesson:
              "A timeline places events in the order they happened. It helps us see what happened first, next and later.",
            questions: [
              [
                "A timeline shows events in…",
                ["Order", "A circle only", "A song", "A colour list"],
                0,
              ],
              [
                "What comes first on a timeline?",
                [
                  "The earliest event",
                  "The newest event",
                  "Any event",
                  "A question",
                ],
                0,
              ],
            ],
          },
          "Historical sources": {
            lesson:
              "Historical sources give us clues about the past. They can include stories, photographs, objects, letters, buildings and records.",
            questions: [
              [
                "Which can be a historical source?",
                [
                  "An old photograph",
                  "Only a future plan",
                  "A made-up answer",
                  "Nothing",
                ],
                0,
              ],
              [
                "Sources give us clues about…",
                ["The past", "Only the future", "Only games", "Only weather"],
                0,
              ],
            ],
          },
        },
      },
      Computing: {
        "Computer basics": {
          "Parts of a computer": {
            lesson:
              "A computer has parts with different jobs. The monitor shows information, the keyboard enters letters, and the mouse helps us select items.",
            questions: [
              [
                "Which part shows information?",
                ["Monitor", "Keyboard", "Mouse", "Speaker"],
                0,
              ],
              [
                "Which part is used to type letters?",
                ["Keyboard", "Monitor", "Printer", "Camera"],
                0,
              ],
            ],
          },
          "Using a mouse": {
            lesson:
              "A mouse moves the pointer on a screen. You can click to choose something, double-click to open it, and drag to move it.",
            questions: [
              [
                "What does a click help you do?",
                [
                  "Choose an item",
                  "Print a book",
                  "Wash a screen",
                  "Turn off the sun",
                ],
                0,
              ],
              [
                "What can you do to move an item?",
                ["Drag it", "Sing to it", "Fold it", "Paint it"],
                0,
              ],
            ],
          },
        },
        "Digital safety": {
          "Personal information": {
            lesson:
              "Personal information includes your full name, address, school and passwords. Keep it private and ask a trusted adult before sharing online.",
            questions: [
              [
                "Which should stay private?",
                ["Password", "Favourite colour", "A drawing", "A song"],
                0,
              ],
              [
                "Who can help you online?",
                ["A trusted adult", "A stranger", "Nobody", "Any message"],
                0,
              ],
            ],
          },
          "Kind online behaviour": {
            lesson:
              "Be kind and respectful online. Use friendly words, do not bully others, and tell a trusted adult if something makes you uncomfortable.",
            questions: [
              [
                "What should you do if a message makes you uncomfortable?",
                [
                  "Tell a trusted adult",
                  "Keep it secret",
                  "Reply angrily",
                  "Share it everywhere",
                ],
                0,
              ],
              [
                "Online behaviour should be…",
                ["Kind", "Hurtful", "Secretive", "Rude"],
                0,
              ],
            ],
          },
        },
      },
      ICT: {
        "Digital devices": {
          "Input and output devices": {
            lesson:
              "Input devices send information to a computer. A keyboard, mouse and microphone are input devices. Output devices show results from a computer, such as a monitor, printer and speakers.",
            questions: [
              [
                "Which is an input device?",
                ["Keyboard", "Monitor", "Printer", "Speaker"],
                0,
              ],
              [
                "Which is an output device?",
                ["Monitor", "Mouse", "Microphone", "Keyboard"],
                0,
              ],
            ],
          },
          "Storage devices": {
            lesson:
              "Storage devices keep files and information for later use. A hard drive, memory card and USB flash drive can store digital files.",
            questions: [
              [
                "Which can store files?",
                ["USB flash drive", "Monitor", "Mouse pad", "Speaker"],
                0,
              ],
              [
                "A storage device keeps information for…",
                ["Later use", "One second only", "No use", "Printing only"],
                0,
              ],
            ],
          },
        },
        "Creating digital work": {
          "Word processing": {
            lesson:
              "Word processing lets us create and edit documents using a computer. We can type, correct mistakes, change text size and save our work.",
            questions: [
              [
                "Word processing helps you create…",
                ["Documents", "Plants", "Shoes", "Food"],
                0,
              ],
              [
                "What should you do after typing a document?",
                [
                  "Save it",
                  "Throw the computer",
                  "Delete it always",
                  "Ignore it",
                ],
                0,
              ],
            ],
          },
          Presentations: {
            lesson:
              "A presentation shares ideas using slides. Good slides use a clear title, short points and useful pictures without too much text.",
            questions: [
              [
                "A presentation is made from…",
                ["Slides", "Only pencils", "Only games", "Only tables"],
                0,
              ],
              [
                "Good slides should use…",
                [
                  "Short clear points",
                  "Very long paragraphs",
                  "No title",
                  "Random letters",
                ],
                0,
              ],
            ],
          },
        },
        "Internet and communication": {
          "Searching safely": {
            lesson:
              "A search engine helps people find information online. Use clear keywords, check trusted sources and ask a teacher or parent when you are unsure.",
            questions: [
              [
                "What helps you find information online?",
                [
                  "A search engine",
                  "A ruler",
                  "A calculator only",
                  "A pencil case",
                ],
                0,
              ],
              [
                "Who can help if you are unsure online?",
                [
                  "A trusted adult",
                  "Any stranger",
                  "Nobody",
                  "A random message",
                ],
                0,
              ],
            ],
          },
          "Email basics": {
            lesson:
              "Email is a way to send messages online. A polite email has a subject, greeting, clear message and respectful closing. Never share passwords by email.",
            questions: [
              [
                "What should an email include?",
                ["A clear message", "A password", "Only emojis", "No greeting"],
                0,
              ],
              [
                "Should you share passwords by email?",
                ["No", "Yes", "Only at night", "Only with strangers"],
                0,
              ],
            ],
          },
        },
      },
      "Creative Arts": {
        "Visual arts": {
          "Primary colours": {
            lesson:
              "The primary colours are red, yellow and blue. Artists can mix these colours to create other colours.",
            questions: [
              [
                "Which is a primary colour?",
                ["Red", "Green", "Purple", "Brown"],
                0,
              ],
              [
                "How many primary colours are there?",
                ["Three", "One", "Five", "Ten"],
                0,
              ],
            ],
          },
          Patterns: {
            lesson:
              "A pattern repeats in a planned way. Patterns can use lines, shapes, colours, sounds or movements.",
            questions: [
              [
                "A pattern does what?",
                ["Repeats", "Disappears", "Sleeps", "Breaks"],
                0,
              ],
              [
                "Patterns can use…",
                ["Shapes", "Only food", "Only books", "Only numbers"],
                0,
              ],
            ],
          },
        },
        "Music and movement": {
          Rhythm: {
            lesson:
              "Rhythm is a steady pattern of sounds and beats in music. You can clap, tap or move to show a rhythm.",
            questions: [
              [
                "Rhythm is a pattern of…",
                ["Beats", "Colours", "Pictures", "Smells"],
                0,
              ],
              [
                "How can you show rhythm?",
                ["Clapping", "Sleeping", "Reading only", "Drawing only"],
                0,
              ],
            ],
          },
          "Traditional dance": {
            lesson:
              "Traditional dances can tell stories and celebrate culture. They use planned body movements, music and sometimes special clothing.",
            questions: [
              [
                "Traditional dance can celebrate…",
                ["Culture", "A spelling test", "A computer", "A ruler"],
                0,
              ],
              [
                "Dance uses planned…",
                [
                  "Body movements",
                  "Only silence",
                  "Only paper",
                  "Only numbers",
                ],
                0,
              ],
            ],
          },
        },
      },
      French: {
        "Greetings and introductions": {
          "Saying hello": {
            lesson:
              "In French, Bonjour means hello or good day. Bonsoir means good evening. You can say Bonjour when greeting someone during the day.",
            questions: [
              [
                "What does Bonjour mean?",
                ["Hello", "Goodbye", "Thank you", "Please"],
                0,
              ],
              [
                "When can you say Bonsoir?",
                ["In the evening", "At breakfast", "At noon only", "Never"],
                0,
              ],
            ],
          },
          "Introducing yourself": {
            lesson:
              "Je m'appelle means my name is. You can say Je m'appelle Ama to introduce yourself politely in French.",
            questions: [
              [
                "What does Je m'appelle mean?",
                ["My name is", "Good morning", "Thank you", "See you"],
                0,
              ],
              [
                "How do you introduce your name in French?",
                ["Je m'appelle…", "Bonjour…", "Merci…", "Au revoir…"],
                0,
              ],
            ],
          },
        },
        "Everyday vocabulary": {
          Colours: {
            lesson:
              "Some French colours are rouge for red, bleu for blue, jaune for yellow and vert for green. Learning colours helps you describe objects.",
            questions: [
              [
                "What is bleu in English?",
                ["Blue", "Red", "Green", "Yellow"],
                0,
              ],
              [
                "What is rouge in English?",
                ["Red", "White", "Black", "Purple"],
                0,
              ],
            ],
          },
          "Numbers 1 to 10": {
            lesson:
              "French numbers begin un, deux, trois, quatre and cinq. Practise saying them slowly, then count familiar objects around you.",
            questions: [
              ["What is deux?", ["Two", "Three", "Five", "Ten"], 0],
              ["What is cinq?", ["Five", "One", "Four", "Eight"], 0],
            ],
          },
        },
      },
      "Religious and Moral Education": {
        Values: {
          Honesty: {
            lesson:
              "Honesty means telling the truth and doing what is right, even when nobody is watching. It helps people trust us.",
            questions: [
              [
                "Honesty means telling the…",
                ["Truth", "Funniest story", "Longest sentence", "Secret only"],
                0,
              ],
              [
                "Honesty helps build…",
                ["Trust", "Litter", "Noise", "Confusion"],
                0,
              ],
            ],
          },
          Respect: {
            lesson:
              "Respect means treating people, places and property with care. We show respect by listening, using kind words and following fair rules.",
            questions: [
              [
                "Respect can be shown by…",
                ["Listening", "Insulting", "Breaking things", "Ignoring rules"],
                0,
              ],
              [
                "Respect means treating others with…",
                ["Care", "Rudeness", "Anger", "Silence only"],
                0,
              ],
            ],
          },
        },
        "Peace and responsibility": {
          "Solving disagreements": {
            lesson:
              "When people disagree, they can speak calmly, listen to each other and look for a fair solution. Fighting usually makes problems worse.",
            questions: [
              [
                "A peaceful way to solve a disagreement is to…",
                ["Speak calmly", "Fight", "Shout", "Ignore everyone"],
                0,
              ],
              [
                "Listening helps people find a…",
                [
                  "Fair solution",
                  "Bigger problem",
                  "Louder voice",
                  "New argument",
                ],
                0,
              ],
            ],
          },
          "Caring for others": {
            lesson:
              "Caring for others means noticing when someone needs help and acting with kindness. Small helpful actions can make a big difference.",
            questions: [
              [
                "Caring for others means acting with…",
                ["Kindness", "Cruelty", "Laziness", "Jealousy"],
                0,
              ],
              [
                "Helping someone can make a…",
                ["Difference", "Mess", "Rule", "Problem only"],
                0,
              ],
            ],
          },
        },
      },
      "Physical Education": {
        "Healthy living": {
          Exercise: {
            lesson:
              "Exercise keeps the body strong and healthy. Walking, running, skipping and playing active games are all forms of exercise.",
            questions: [
              [
                "Which is exercise?",
                [
                  "Skipping",
                  "Watching a wall",
                  "Sleeping in class",
                  "Reading one word",
                ],
                0,
              ],
              [
                "Exercise helps keep the body…",
                ["Healthy", "Broken", "Invisible", "Untidy"],
                0,
              ],
            ],
          },
          "Healthy food": {
            lesson:
              "A balanced meal includes different healthy foods such as fruits, vegetables, grains and protein foods. Drinking water is also important.",
            questions: [
              [
                "Which is a healthy food?",
                ["Fruit", "Only sweets", "Plastic", "Sand"],
                0,
              ],
              [
                "What is important to drink?",
                ["Water", "Ink", "Paint", "Soap"],
                0,
              ],
            ],
          },
        },
        "Games and safety": {
          "Fair play": {
            lesson:
              "Fair play means following rules, taking turns and treating other players with respect. Winning is enjoyable, but playing fairly matters too.",
            questions: [
              [
                "Fair play includes…",
                ["Following rules", "Cheating", "Pushing", "Insulting"],
                0,
              ],
              [
                "Players should treat each other with…",
                ["Respect", "Anger", "Rudeness", "Fear"],
                0,
              ],
            ],
          },
          "Safe movement": {
            lesson:
              "Safe movement means checking your space, wearing suitable clothing and listening to instructions before active games or exercise.",
            questions: [
              [
                "Before a game, you should check your…",
                ["Space", "Phone only", "Homework only", "Desk only"],
                0,
              ],
              [
                "Safe movement includes listening to…",
                ["Instructions", "Rumours", "Music only", "Nobody"],
                0,
              ],
            ],
          },
        },
      },
    },
  },
  cambridge: {
    name: "Cambridge Primary",
    years: ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6"],
    topics: {
      English: {
        Reading: {
          "Main idea": {
            lesson:
              "The main idea is the most important message in a text. Look at the title, repeated words, and what most sentences are about to find it.",
            questions: [
              [
                "What is the main idea?",
                [
                  "A tiny detail",
                  "The main message",
                  "A page number",
                  "A character name",
                ],
                1,
              ],
              [
                "What can help you find the main idea?",
                [
                  "Repeated words",
                  "Only punctuation",
                  "The last letter",
                  "The page colour",
                ],
                0,
              ],
            ],
          },
          Vocabulary: {
            lesson:
              "Vocabulary means the words we know and use. When you meet a new word, read the sentence around it for clues, then check a dictionary if you can.",
            questions: [
              [
                "What can help explain a new word?",
                [
                  "Sentence clues",
                  "Skipping it",
                  "Guessing randomly",
                  "Closing the book",
                ],
                0,
              ],
              [
                "Vocabulary is about…",
                ["Numbers", "Words", "Maps", "Sports"],
                1,
              ],
            ],
          },
        },
        Writing: {
          Paragraphs: {
            lesson:
              "A paragraph is a group of sentences about one main idea. It usually has a topic sentence, supporting details and a closing sentence.",
            questions: [
              [
                "A paragraph focuses on…",
                [
                  "One main idea",
                  "Many random ideas",
                  "Only a title",
                  "Only a question",
                ],
                0,
              ],
              [
                "What can a paragraph include?",
                [
                  "Supporting details",
                  "Only numbers",
                  "No sentences",
                  "Only pictures",
                ],
                0,
              ],
            ],
          },
          Punctuation: {
            lesson:
              "Punctuation helps readers understand writing. A full stop ends a statement, a question mark ends a question, and a comma can separate ideas in a list.",
            questions: [
              [
                "Which mark ends a question?",
                ["Question mark", "Full stop", "Comma", "Apostrophe"],
                0,
              ],
              [
                "Which mark ends a statement?",
                ["Full stop", "Question mark", "Comma", "Dash"],
                0,
              ],
            ],
          },
        },
      },
      Mathematics: {
        Fractions: {
          "Equal parts": {
            lesson:
              "A fraction shows equal parts of one whole. In one half, the whole is split into two equal parts. The bottom number tells how many equal parts there are.",
            questions: [
              [
                "One half means a whole split into how many equal parts?",
                ["1", "2", "3", "4"],
                1,
              ],
              [
                "What does the bottom number in a fraction show?",
                ["Equal parts", "The colour", "The answer", "The shape"],
                0,
              ],
            ],
          },
        },
        Geometry: {
          Angles: {
            lesson:
              "An angle is made when two lines meet. A right angle is a square corner and measures 90 degrees.",
            questions: [
              ["A right angle measures…", ["90°", "45°", "180°", "360°"], 0],
              [
                "An angle is made when…",
                [
                  "Two lines meet",
                  "A circle moves",
                  "A number repeats",
                  "A word ends",
                ],
                0,
              ],
            ],
          },
          Perimeter: {
            lesson:
              "Perimeter is the distance around the outside of a shape. Add the lengths of all its sides to find it.",
            questions: [
              [
                "Perimeter means the distance…",
                [
                  "Around a shape",
                  "Inside a shape",
                  "Above a shape",
                  "Below a shape",
                ],
                0,
              ],
              [
                "How do you find perimeter?",
                [
                  "Add side lengths",
                  "Multiply colours",
                  "Count letters",
                  "Measure weight",
                ],
                0,
              ],
            ],
          },
        },
      },
      Science: {
        "Forces and motion": {
          "Pushes and pulls": {
            lesson:
              "A force is a push or a pull. Forces can make objects start moving, stop moving, speed up, slow down or change direction.",
            questions: [
              [
                "A force can be a…",
                ["Push or pull", "Colour", "Sound only", "Story"],
                0,
              ],
              [
                "A push can make an object…",
                ["Move", "Disappear", "Read", "Sleep"],
                0,
              ],
            ],
          },
          Friction: {
            lesson:
              "Friction is a force that happens when surfaces rub together. It can slow moving objects down.",
            questions: [
              [
                "Friction happens when surfaces…",
                ["Rub together", "Float apart", "Change colour", "Grow"],
                0,
              ],
              [
                "Friction can make objects…",
                ["Slow down", "Fly away", "Turn into water", "Read"],
                0,
              ],
            ],
          },
        },
        "Earth and space": {
          "The solar system": {
            lesson:
              "The solar system includes the Sun, planets, moons and other objects. Earth is the planet where we live.",
            questions: [
              [
                "What is at the centre of our solar system?",
                ["The Sun", "Earth", "The Moon", "Mars"],
                0,
              ],
              [
                "Which planet do we live on?",
                ["Earth", "Venus", "Jupiter", "Saturn"],
                0,
              ],
            ],
          },
          "Day and night": {
            lesson:
              "Day and night happen because Earth rotates. The side facing the Sun has day, while the side facing away has night.",
            questions: [
              [
                "Day and night happen because Earth…",
                ["Rotates", "Stops", "Melts", "Shrinks"],
                0,
              ],
              [
                "The side facing the Sun has…",
                ["Day", "Night", "Rain only", "Snow only"],
                0,
              ],
            ],
          },
        },
      },
      "Global Perspectives": {
        Community: {
          "Working together": {
            lesson:
              "Working together means sharing ideas and helping one another reach a goal. Listening respectfully makes teamwork stronger.",
            questions: [
              [
                "Teamwork means…",
                [
                  "Working together",
                  "Working alone always",
                  "Ignoring others",
                  "Stopping early",
                ],
                0,
              ],
              [
                "A good teammate should…",
                [
                  "Listen respectfully",
                  "Interrupt everyone",
                  "Refuse to help",
                  "Ignore the goal",
                ],
                0,
              ],
            ],
          },
          "Helping others": {
            lesson:
              "Helping others can make a community safer and kinder. Small actions, such as sharing, volunteering and including others, can make a difference.",
            questions: [
              [
                "Which action helps a community?",
                ["Volunteering", "Littering", "Bullying", "Excluding others"],
                0,
              ],
              [
                "Helping others can make a community…",
                ["Kinder", "Noisier only", "Smaller", "Empty"],
                0,
              ],
            ],
          },
        },
        Sustainability: {
          "Reducing waste": {
            lesson:
              "We can reduce waste by using less, reusing useful items and recycling materials when possible.",
            questions: [
              [
                "Which action reduces waste?",
                [
                  "Reusing a bottle",
                  "Throwing away everything",
                  "Littering",
                  "Wasting paper",
                ],
                0,
              ],
              [
                "Recycling helps us…",
                [
                  "Use materials again",
                  "Create more litter",
                  "Waste water",
                  "Avoid learning",
                ],
                0,
              ],
            ],
          },
          "Saving water": {
            lesson:
              "Fresh water is important for people, plants and animals. Turn taps off when not in use and report leaks to help save water.",
            questions: [
              [
                "How can you save water?",
                [
                  "Turn taps off",
                  "Leave taps running",
                  "Spill water",
                  "Ignore leaks",
                ],
                0,
              ],
              [
                "Water is important for…",
                [
                  "People, plants and animals",
                  "Only cars",
                  "Only toys",
                  "Only buildings",
                ],
                0,
              ],
            ],
          },
        },
      },
    },
  },
};

// Lesson enhancements.  Keep videos in one place: add a YouTube embed URL (or
// an .mp4 file URL) for any lesson key below when a video is ready.
const LESSON_VIDEO_URLS = {
  // Paste a YouTube *embed* URL, for example:
  // "Mathematics|Numbers and operations|Place value": "https://www.youtube.com/embed/VIDEO_ID",
  "Mathematics|Numbers and operations|Place value": "",
};
const LEARNING_PROGRESS_KEY = "ycohdeLearningProgress";
const SUBSCRIPTION_KEY = "ycohdeMonthlySubscription";
const QUIZ_HISTORY_KEY = "ycohdeQuizHistory";
const LESSON_CHECK_HISTORY_KEY = "ycohdeLessonCheckHistory";
const STUDY_ACTIVITY_KEY = "ycohdeStudyActivity";
const GAMIFICATION_KEY = "ycohdeGamification";
const LESSON_RESUME_KEY = "ycohdeLessonResume";
const FREE_LESSON_LIMIT = 3;
const EXTRA_SUBTOPIC_STEPS = [
  "Key vocabulary",
  "Important ideas",
  "Everyday connection",
  "Worked example",
  "Guided practice",
  "Think carefully",
  "Use the right method",
  "Check your work",
  "Common mistakes",
  "Quick recap",
  "Skill builder 1",
  "Skill builder 2",
  "Skill builder 3",
  "Skill builder 4",
  "Skill builder 5",
  "Challenge 1",
  "Challenge 2",
  "Challenge 3",
  "Challenge 4",
  "Challenge 5",
  "Revision 1",
  "Revision 2",
  "Revision 3",
  "Revision 4",
  "Revision 5",
  "Apply your learning",
  "Explain your thinking",
  "Real-life task",
  "Final practice",
  "Main-topic review",
];

function createExtraLesson(subject, topic, step, number) {
  // BASIC DEPARTMENT GENERATED SUBTOPICS: edit this template to update the
  // extra practice lessons added across the Basic curriculum.
  const title = `${topic}: ${step}`;
  return {
    lesson: `${step} helps you build confidence in ${topic}. Read the earlier lesson, identify the main idea, and use it to solve a small problem. Learning one step at a time makes the whole ${topic} topic easier to understand.`,
    examples: [
      {
        title: "How to practise",
        problem: `Use one idea from ${topic} in a daily-life situation.`,
        steps: [
          "Read the question carefully.",
          "Choose the idea or method that fits.",
          "Check that your answer makes sense.",
        ],
        result: "A clear, checked answer.",
      },
    ],
    exercise: {
      question: `In your own words, what is one important idea you learned about ${topic}?`,
      minLength: 3,
      hint: "Write a short sentence. Your teacher can review this answer later.",
    },
    questions: [
      [
        `Which habit helps you learn ${topic}?`,
        [
          "Skipping the lesson",
          "Reading, practising and checking",
          "Guessing without thinking",
          "Never asking questions",
        ],
        1,
      ],
    ],
    generated: true,
    order: number,
  };
}

function addThirtyExtraSubtopics() {
  Object.entries(learningCatalog).forEach(([, syllabus]) => {
    Object.entries(syllabus.topics).forEach(([subject, topics]) => {
      Object.entries(topics).forEach(([topic, subtopics]) => {
        EXTRA_SUBTOPIC_STEPS.forEach((step, index) => {
          const name = `${String(index + 1).padStart(2, "0")}. ${step}`;
          if (!subtopics[name])
            subtopics[name] = createExtraLesson(
              subject,
              topic,
              step,
              index + 1,
            );
        });
      });
    });
  });
}

function createDepartmentLesson(subject, topic, subtopic) {
  // DEPARTMENT GENERATOR: JHS and SHS lessons begin with no shared questions.
  // getFiveQuizQuestions creates five class-level checks when a student opens one.
  return {
    lesson: `${subtopic} is part of the ${subject} topic, ${topic}. Read the lesson, study the examples, and practise before moving forward.`,
    questions: [],
    generated: true,
    examples: Array.from({ length: 5 }, (_, index) => ({
      title: `${subtopic} example ${index + 1}`,
      problem: `Apply ${subtopic} to a ${subject} situation.`,
      steps: ["Read the task.", "Use the lesson idea.", "Check the result."],
      result: `A correct ${subtopic} response.`,
    })),
  };
}

function createJhsCatalog() {
  // JHS DEPARTMENT (JHS 1, JHS 2, JHS 3): edit subjects, topic totals and
  // generated lesson wording here. Use the content studio for one lesson.
  const topics = {};
  [
    "Mathematics",
    "Science",
    "English Language",
    "Our World Our People",
    "History",
    "Religious and Moral Education",
    "Creative Arts",
  ].forEach((subject) => {
    topics[subject] = {};
    for (let topicNumber = 1; topicNumber <= 71; topicNumber++) {
      const topic = `JHS ${subject} Topic ${String(topicNumber).padStart(2, "0")}`;
      topics[subject][topic] = {};
      for (let subtopicNumber = 1; subtopicNumber <= 30; subtopicNumber++) {
        const subtopic = `Subtopic ${String(subtopicNumber).padStart(2, "0")}`;
        topics[subject][topic][subtopic] = createDepartmentLesson(
          subject,
          topic,
          subtopic,
        );
      }
    }
  });
  learningCatalog.jhs = {
    name: "JHS Learning Programme",
    years: ["JHS 1", "JHS 2", "JHS 3"],
    topics,
  };
}

function createShsCourseCatalog(course, subjects) {
  // SHS DEPARTMENT (SHS 1, SHS 2, SHS 3): each call below creates one course.
  // Edit this function for all SHS courses, or edit a call for one course only.
  const topics = {};
  subjects.forEach((subject) => {
    topics[subject] = {};
    for (let topicNumber = 1; topicNumber <= 12; topicNumber++) {
      const topic = `${subject} Study Topic ${String(topicNumber).padStart(2, "0")}`;
      topics[subject][topic] = {};
      for (let subtopicNumber = 1; subtopicNumber <= 30; subtopicNumber++) {
        const subtopic = `Subtopic ${String(subtopicNumber).padStart(2, "0")}`;
        topics[subject][topic][subtopic] = createDepartmentLesson(
          subject,
          topic,
          subtopic,
        );
      }
    }
  });
  learningCatalog[`shs-${course}`] = {
    name: `SHS ${course.replace(/-/g, " ")}`,
    years: ["SHS 1", "SHS 2", "SHS 3"],
    topics,
  };
}

function applySavedCatalogNames() {
  try {
    const names = JSON.parse(localStorage.getItem(CATALOG_NAMES_KEY)) || {};
    // CURRICULUM EDIT: saved subject names are applied before their topics.
    Object.entries(names.subjects || {}).forEach(([key, nextName]) => {
      const [syllabusKey, subject] = key.split("|");
      const topics = learningCatalog[syllabusKey]?.topics;
      if (topics?.[subject] && nextName && !topics[nextName]) {
        topics[nextName] = topics[subject];
        delete topics[subject];
      }
    });
    Object.entries(names.topics || {}).forEach(([key, nextName]) => {
      const parts = key.split("|");
      const [syllabusKey, subject, topic] =
        parts.length === 3 ? parts : ["ges", ...parts];
      const topics = learningCatalog[syllabusKey]?.topics[subject];
      if (topics?.[topic] && nextName && !topics[nextName]) {
        topics[nextName] = topics[topic];
        delete topics[topic];
      }
    });
    Object.entries(names.subtopics || {}).forEach(([key, nextName]) => {
      const parts = key.split("|");
      const [syllabusKey, subject, topic, subtopic] =
        parts.length === 4 ? parts : ["ges", ...parts];
      const subtopics = learningCatalog[syllabusKey]?.topics[subject]?.[topic];
      if (subtopics?.[subtopic] && nextName && !subtopics[nextName]) {
        subtopics[nextName] = subtopics[subtopic];
        delete subtopics[subtopic];
      }
    });
  } catch {
    /* use the original catalogue if saved names are unavailable */
  }
}

// CURRICULUM EDIT: this is the single place that renames a subject, main topic,
// or subtopic. It is used immediately by administrators and on approval of a
// teacher's requested structural change.
function applyCatalogStructureChange({
  syllabusKey,
  originalSubject,
  originalTopic,
  originalSubtopic,
  subject,
  topic,
  subtopic,
}) {
  const syllabusTopics = learningCatalog[syllabusKey]?.topics;
  if (!syllabusTopics?.[originalSubject]) return false;
  const originalTopics = syllabusTopics[originalSubject];
  const originalSubtopics = originalTopics[originalTopic];
  // Validate every destination before changing anything, so an unsuccessful
  // approval cannot leave a partial subject/topic rename behind.
  if (
    !originalSubtopics ||
    (subject !== originalSubject && syllabusTopics[subject]) ||
    (topic !== originalTopic && originalTopics[topic]) ||
    (subtopic !== originalSubtopic && originalSubtopics[subtopic])
  )
    return false;
  const names = JSON.parse(localStorage.getItem(CATALOG_NAMES_KEY)) || {};
  names.subjects = names.subjects || {};
  names.topics = names.topics || {};
  names.subtopics = names.subtopics || {};
  if (subject !== originalSubject) {
    syllabusTopics[subject] = syllabusTopics[originalSubject];
    delete syllabusTopics[originalSubject];
    names.subjects[`${syllabusKey}|${originalSubject}`] = subject;
  }
  const activeSubject = syllabusTopics[subject];
  if (topic !== originalTopic) {
    activeSubject[topic] = activeSubject[originalTopic];
    delete activeSubject[originalTopic];
    names.topics[`${syllabusKey}|${subject}|${originalTopic}`] = topic;
  }
  const activeTopic = activeSubject[topic];
  if (subtopic !== originalSubtopic) {
    activeTopic[subtopic] = activeTopic[originalSubtopic];
    delete activeTopic[originalSubtopic];
    names.subtopics[`${syllabusKey}|${subject}|${topic}|${originalSubtopic}`] =
      subtopic;
  }
  localStorage.setItem(CATALOG_NAMES_KEY, JSON.stringify(names));
  return true;
}

function getLessonKey(subject, topic, subtopic) {
  return `${subject}|${topic}|${subtopic}`;
}

function getContentOverrides() {
  try {
    return JSON.parse(localStorage.getItem(CONTENT_OVERRIDES_KEY)) || {};
  } catch {
    return {};
  }
}

function getCatalogLessonKey(syllabusKey, subject, topic, subtopic) {
  return `${syllabusKey}|${getLessonKey(subject, topic, subtopic)}`;
}

function getLessonOverride(syllabusKey, subject, topic, subtopic) {
  const all = getContentOverrides();
  return (
    all[getCatalogLessonKey(syllabusKey, subject, topic, subtopic)] ||
    all[getLessonKey(subject, topic, subtopic)] ||
    {}
  );
}

function getLearningProgress() {
  try {
    return JSON.parse(localStorage.getItem(LEARNING_PROGRESS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveCompletedSubtopic(subject, topic, subtopic) {
  const progress = getLearningProgress();
  const isNewCompletion = !progress[getLessonKey(subject, topic, subtopic)];
  progress[getLessonKey(subject, topic, subtopic)] = true;
  localStorage.setItem(LEARNING_PROGRESS_KEY, JSON.stringify(progress));
  recordStudyActivity();
  if (isNewCompletion) awardXp(50);
  localStorage.removeItem(LESSON_RESUME_KEY);
  showFeatureRequestPopup("lesson-completed");
}

function showFeatureRequestPopup(trigger) {
  const user = getStudentSession();
  if (!user || document.getElementById("feature-request-modal")) return;
  document.body.insertAdjacentHTML(
    "beforeend",
    `<div class="understanding-modal feature-request-modal" id="feature-request-modal" aria-hidden="true"><div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="feature-request-title"><button class="modal-close" type="button" aria-label="Close feature request">&times;</button><p class="eyebrow">HELP SHAPE Y_COHDE</p><h2 id="feature-request-title">What feature would help you most?</h2><p>Your idea can help us make learning, teaching, and managing the website better.</p><form id="feature-request-form" class="feature-request-form"><label for="feature-request-input">Feature request<textarea id="feature-request-input" maxlength="500" required placeholder="I would like to see..."></textarea></label><div class="modal-actions"><button class="soft-btn modal-dismiss" type="button">Not now</button><button class="btn" type="submit">Send suggestion</button></div><p class="form-status" id="feature-request-status" role="status" aria-live="polite"></p></form></div></div>`,
  );
  const modal = document.getElementById("feature-request-modal");
  const form = document.getElementById("feature-request-form");
  const close = () => {
    modal.classList.remove("visible");
    modal.setAttribute("aria-hidden", "true");
    window.setTimeout(() => modal.remove(), 220);
  };
  modal
    .querySelectorAll(".modal-close, .modal-dismiss")
    .forEach((button) => button.addEventListener("click", close));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = document.getElementById("feature-request-input");
    const suggestion = input.value.trim();
    if (!suggestion) return;
    let requests = [];
    try {
      requests =
        JSON.parse(localStorage.getItem("ycohdeFeatureRequests")) || [];
    } catch {
      requests = [];
    }
    requests.push({
      suggestion,
      role: user.role || "student",
      name: user.name || "Anonymous",
      trigger,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem("ycohdeFeatureRequests", JSON.stringify(requests));
    document.getElementById("feature-request-status").textContent =
      "Thanks. Your suggestion has been recorded.";
    window.setTimeout(close, 900);
  });
  modal.classList.add("visible");
  modal.setAttribute("aria-hidden", "false");
  document.getElementById("feature-request-input").focus();
}

function recordStudyActivity() {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const days = JSON.parse(localStorage.getItem(STUDY_ACTIVITY_KEY)) || [];
    if (!days.includes(today)) {
      days.push(today);
      localStorage.setItem(STUDY_ACTIVITY_KEY, JSON.stringify(days));
    }
  } catch {
    localStorage.setItem(STUDY_ACTIVITY_KEY, JSON.stringify([today]));
  }
}

function saveQuizResult(scoreValue, total, subject) {
  try {
    const history = JSON.parse(localStorage.getItem(QUIZ_HISTORY_KEY)) || [];
    const student = getStudentSession() || {};
    history.push({
      score: scoreValue,
      total,
      subject,
      studentName: student.name || "Student",
      studentEmail: student.email || "",
      department: student.department || getDepartmentKey() || "",
      className: student.className || getClassKey() || "",
      date: new Date().toISOString(),
    });
    localStorage.setItem(QUIZ_HISTORY_KEY, JSON.stringify(history));
    recordStudyActivity();
    awardXp(10 + Math.round((scoreValue / total) * 40));
  } catch {
    /* The quiz remains usable if storage is unavailable. */
  }
}

function saveLessonCheckResult(scoreValue, total, metadata) {
  try {
    const history =
      JSON.parse(localStorage.getItem(LESSON_CHECK_HISTORY_KEY)) || [];
    const student = getStudentSession() || {};
    history.push({
      score: scoreValue,
      total,
      subject: metadata.subject,
      topic: metadata.topic,
      subtopic: metadata.subtopic,
      syllabus: metadata.syllabus,
      studentName: student.name || "Student",
      studentEmail: student.email || "",
      department:
        student.department || getSyllabusDepartment(metadata.syllabus) || "",
      className: student.className || "",
      date: new Date().toISOString(),
    });
    localStorage.setItem(
      LESSON_CHECK_HISTORY_KEY,
      JSON.stringify(history.slice(-500)),
    );
  } catch {
    /* learning can continue without local analytics */
  }
}

function getGamification() {
  try {
    return JSON.parse(localStorage.getItem(GAMIFICATION_KEY)) || { xp: 0 };
  } catch {
    return { xp: 0 };
  }
}

function awardXp(points) {
  const game = getGamification();
  const oldLevel = getLevel(game.xp || 0);
  game.xp = (game.xp || 0) + points;
  localStorage.setItem(GAMIFICATION_KEY, JSON.stringify(game));
  playFeedbackSound("xp");
  if (getLevel(game.xp) > oldLevel) playFeedbackSound("achievement");
}

function playFeedbackSound(type) {
  // Small synthesized sounds avoid extra audio files and work after a user action.
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const tones = {
      correct: 740,
      wrong: 180,
      xp: 880,
      achievement: 1047,
      notification: 660,
    };
    oscillator.frequency.value = tones[type] || 440;
    oscillator.type = type === "wrong" ? "sawtooth" : "sine";
    gain.gain.setValueAtTime(0.08, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.2);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.2);
    window.setTimeout(() => context.close(), 250);
  } catch {
    // Audio feedback is optional and may be unavailable in some browsers.
  }
}

function isFreeLesson(syllabus, subject, topic, subtopic) {
  const lessons = getAllLessons(syllabus);
  return (
    lessons.findIndex(
      (item) =>
        item.subject === subject &&
        item.topic === topic &&
        item.subtopic === subtopic,
    ) < FREE_LESSON_LIMIT
  );
}

function isSubtopicUnlocked(syllabus, subject, topic, subtopic) {
  // A paid learning pass opens every subtopic; free learners progress through
  // introductory lessons in order, with one starting lesson per subject.
  if (hasActiveSubscription()) return true;
  const firstTopic = Object.keys(syllabus.topics[subject])[0];
  const names = Object.keys(syllabus.topics[subject][topic]);
  const index = names.indexOf(subtopic);
  if (topic === firstTopic && index === 0) return true;
  if (!isFreeLesson(syllabus, subject, topic, subtopic)) return false;
  return (
    index === 0 ||
    Boolean(
      getLearningProgress()[getLessonKey(subject, topic, names[index - 1])],
    )
  );
}

function getLessonExtras(syllabusKey, subject, topic, subtopic, lesson) {
  const override = getLessonOverride(syllabusKey, subject, topic, subtopic);
  const subjectExamples = {
    Science: [
      "Observe a real object",
      "Name what happens",
      "Explain why it happens",
      "Compare two examples",
      "Use it in daily life",
    ],
    "English Language": [
      "Read the sentence",
      "Find the key word",
      "Choose the correct meaning",
      "Write your own sentence",
      "Check punctuation",
    ],
    Computing: [
      "Identify the computer part",
      "Say what it does",
      "Use it safely",
      "Follow the correct step",
      "Check your work",
    ],
    ICT: [
      "Choose the digital tool",
      "Follow the instructions",
      "Create a simple example",
      "Save your work safely",
      "Share responsibly",
    ],
    History: [
      "Read the event",
      "Identify who was involved",
      "Put events in order",
      "Explain what changed",
      "Connect it to Ghana today",
    ],
    French: [
      "Read the French phrase",
      "Say it aloud",
      "Match it to its meaning",
      "Use it in a short dialogue",
      "Practise with a friend",
    ],
    "Creative Arts": [
      "Look at the art idea",
      "Choose materials",
      "Make a simple design",
      "Add your own detail",
      "Talk about your work",
    ],
    "Physical Education": [
      "Prepare safely",
      "Practise the movement",
      "Keep good balance",
      "Follow the game rule",
      "Cool down afterwards",
    ],
    "Religious and Moral Education": [
      "Read the value",
      "Identify a kind action",
      "Think about a school example",
      "Choose the responsible response",
      "Explain why it matters",
    ],
    "Our World Our People": [
      "Look at the community example",
      "Name the people involved",
      "Explain the responsibility",
      "Choose a helpful action",
      "Connect it to Ghana",
    ],
  };
  const additionExamples =
    subject === "Mathematics" && subtopic === "Addition"
      ? [
          {
            title: "Adding without regrouping",
            problem: "23 + 14",
            steps: ["Add ones: 3 + 4 = 7.", "Add tens: 2 + 1 = 3."],
            result: "23 + 14 = 37",
          },
          {
            title: "Adding with regrouping",
            problem: "27 + 15",
            steps: ["Add tens: 2 + 1 + 1 carried ten = 4."],
            result: "27 + 15 = 42",
          },
        ]
      : (
          subjectExamples[subject] || [
            "Read the example",
            "Identify the main idea",
            "Use the idea",
            "Practise carefully",
            "Explain your answer",
          ]
        ).map((title, index) => ({
          title: `${subtopic}: ${title}`,
          problem: `Example ${index + 1}: Apply ${subtopic} while learning ${topic}.`,
          steps: [
            `Use the lesson definition of ${subtopic}.`,
            title,
            "Check that your answer matches the topic.",
          ],
          result: `This shows ${subtopic} in a ${subject} lesson.`,
        }));
  const examples = lesson.examples || additionExamples;
  while (examples.length < 5) {
    const number = examples.length + 1;
    examples.push({
      title: `Example ${number}`,
      problem: `Practise ${subtopic} with another simple situation.`,
      steps: ["Use the lesson idea.", "Work carefully.", "Check your answer."],
      result: `You are building your ${subtopic} skill.`,
    });
  }
  return {
    examples: override.examples || examples,
    questions: override.questions || lesson.questions || [],
    exercise: lesson.exercise || {
      question: `In one short sentence, explain what you learned about ${subtopic}.`,
      minLength: 3,
      hint: "Use your own words, then submit your answer to continue.",
    },
    videoUrl:
      override.videoUrl ||
      lesson.videoUrl ||
      LESSON_VIDEO_URLS[getLessonKey(subject, topic, subtopic)] ||
      "",
  };
}

function getYouTubeEmbedUrl(url) {
  if (!url) return "";
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{6,})/,
  );
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
}

// QUESTION EDITING BY DEPARTMENT/CLASS:
// - BASIC 1 to BASIC 6: edit the six `basic` entries below.
// - JHS 1 to JHS 3: edit the three `jhs` entries below.
// - SHS 1 to SHS 3: edit the three `shs` entries below.
// - Edit `questions` inside a specific lesson above to replace its five checks.
//   Administrator/teacher-authored five-question sets are never rewritten here.
const LEVEL_QUESTION_TEMPLATES = {
  basic1: [
    "Which picture or object shows",
    "Can you point to",
    "Choose the simple answer for",
    "What is one thing you remember about",
  ],
  basic2: [
    "Which answer matches",
    "Choose the best example of",
    "What happens when you use",
    "Show that you understand",
  ],
  basic3: [
    "Choose the correct idea about",
    "Use a short example to think about",
    "Which step helps with",
    "What did you learn about",
  ],
  basic4: [
    "Which example correctly uses",
    "Apply the lesson to",
    "Choose the best explanation of",
    "Check your understanding of",
  ],
  basic5: [
    "Apply what you learned about",
    "Which answer best explains",
    "Use an example to show",
    "Choose the correct method for",
  ],
  basic6: [
    "Which solution best applies",
    "Explain the main idea in",
    "Use the lesson to solve",
    "Which reasoning is correct for",
  ],
  jhs1: [
    "Choose the best explanation of",
    "Apply the concept in",
    "Which evidence supports",
    "What is the correct method for",
  ],
  jhs2: [
    "Analyse this idea about",
    "Which answer best applies",
    "Choose the strongest explanation for",
    "How would you solve a task on",
  ],
  jhs3: [
    "Evaluate the correct approach to",
    "Which conclusion follows from",
    "Apply your knowledge of",
    "Choose the most accurate explanation of",
  ],
  shs1: [
    "Apply the concept of",
    "Which explanation is most accurate for",
    "Analyse a problem involving",
    "Choose the best supporting reason for",
  ],
  shs2: [
    "Evaluate this application of",
    "Which method is most suitable for",
    "Analyse the relationship in",
    "Choose the strongest conclusion about",
  ],
  shs3: [
    "Which advanced application best shows",
    "Justify the best solution for",
    "Analyse and evaluate",
    "Choose the most defensible answer about",
  ],
};

function getLearnerClassKey(context = {}) {
  // LEARNER CLASS: learning.html carries `?class=basic1` (or jhs/shs) from
  // the department picker. Use it when the demo login has no stored class.
  const className =
    context.className || getStudentSession()?.className || getClassKey();
  return String(className).toLowerCase().replace(/\s+/g, "");
}

function getFiveQuizQuestions(
  lesson,
  subtopic,
  configuredQuestions,
  context = {},
) {
  const classKey = getLearnerClassKey(context);
  const templates =
    LEVEL_QUESTION_TEMPLATES[classKey] || LEVEL_QUESTION_TEMPLATES.basic4;
  const subject = context.subject ? ` in ${context.subject}` : "";
  const sourceQuestions =
    configuredQuestions ||
    lesson._guidedQuestions ||
    (lesson.generated ? [] : lesson.questions) ||
    [];
  // CLASS-TAILORED CHECKS: retain each lesson's correct answer, but phrase its
  // questions at the learner's level. This prevents Basic 1 and Basic 6 from
  // receiving the same question wording for the same subject.
  const questions = lesson._hasManagedQuestions
    ? [...sourceQuestions]
    : sourceQuestions.map(([question, answers, correct], index) => [
        `${templates[index % templates.length]} ${subtopic}${subject}: ${question}`,
        answers,
        correct,
      ]);
  const fillers = [
    ...templates,
    `For a ${classKey || "learner"}, what is the best final check for`,
  ].map((prompt) => [
    `${prompt} ${subtopic}${subject}?`,
    [
      "Use the lesson idea carefully",
      "Skip the lesson",
      "Choose without thinking",
      "Stop practising",
    ],
    0,
  ]);
  while (questions.length < 5)
    questions.push(fillers[questions.length % fillers.length]);
  return questions.slice(0, 5);
}

function getTenExerciseQuestions(lesson, subtopic, context = {}) {
  const base = getFiveQuizQuestions(lesson, subtopic, undefined, context);
  return Array.from({ length: 10 }, (_, index) => {
    const [question, answers, correct] = base[index % base.length];
    return { question, answer: answers[correct] };
  });
}

function showAnswerPopup(correct, answer, onClose) {
  let popup = document.getElementById("answer-mark-modal");
  if (!popup) {
    document.body.insertAdjacentHTML(
      "beforeend",
      '<div class="understanding-modal" id="answer-mark-modal"><div class="modal-card"><h2 id="answer-mark-title"></h2><p id="answer-mark-copy"></p><button class="btn" id="answer-mark-close">Continue</button></div></div>',
    );
    // MODAL NEXT-LESSON FIX: refresh the reference after creating the modal.
    // The Continue button can now call its stored callback and open the next lesson.
    popup = document.getElementById("answer-mark-modal");
    document
      .getElementById("answer-mark-close")
      .addEventListener("click", () => {
        popup.classList.remove("visible");
        popup._onClose?.();
      });
  }
  popup._onClose = onClose;
  document.getElementById("answer-mark-title").textContent = correct
    ? "Correct!"
    : "Not quite";
  document.getElementById("answer-mark-copy").textContent = correct
    ? "Great work. Your answer has been marked correct."
    : `The correct answer is: ${answer}. Try again.`;
  playFeedbackSound(correct ? "correct" : "wrong");
  popup.classList.add("visible");
}

function addSiteNotification(message, audience = "students") {
  try {
    const notifications =
      JSON.parse(localStorage.getItem(SITE_NOTIFICATIONS_KEY)) || [];
    notifications.unshift({
      message,
      audience,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem(
      SITE_NOTIFICATIONS_KEY,
      JSON.stringify(notifications.slice(0, 50)),
    );
  } catch {
    /* local notifications are optional */
  }
}

function addStaffPost(post) {
  try {
    const posts = JSON.parse(localStorage.getItem(STAFF_POSTS_KEY) || "[]");
    posts.unshift({
      ...post,
      createdAt: post.createdAt || new Date().toISOString(),
    });
    localStorage.setItem(STAFF_POSTS_KEY, JSON.stringify(posts.slice(0, 30)));
  } catch {
    /* staff posts are local demo content */
  }
}

function showSiteNotifications(user) {
  try {
    const notifications =
      JSON.parse(localStorage.getItem(SITE_NOTIFICATIONS_KEY)) || [];
    const subscribed = JSON.parse(
      localStorage.getItem(PUSH_SUBSCRIBERS_KEY) || "[]",
    );
    const canReceiveStudentPosts =
      user.role !== "student" ||
      subscribed.includes((user.email || "").toLowerCase());
    if (!canReceiveStudentPosts) return;
    const audience =
      user.role === "administrator" ? "administrator" : "students";
    const latest = notifications.find(
      (item) => item.audience === audience || item.audience === "all",
    );
    if (!latest) return;
    const seenKey = `ycohdeSeenNotification:${user.email || user.name}`;
    if (localStorage.getItem(seenKey) === latest.createdAt) return;
    localStorage.setItem(seenKey, latest.createdAt);
    const toast = document.createElement("div");
    toast.className = "site-notification";
    toast.innerHTML = `<strong>Y_Cohde update</strong><span>${latest.message}</span><button type="button" aria-label="Close notification">×</button>`;
    toast
      .querySelector("button")
      .addEventListener("click", () => toast.remove());
    document.body.append(toast);
    playFeedbackSound("notification");
    if ("Notification" in window && Notification.permission === "granted")
      new Notification("Y_Cohde update", { body: latest.message });
  } catch {
    /* browser notifications are optional */
  }
}

addThirtyExtraSubtopics();
createJhsCatalog();
createShsCourseCatalog("general-arts", [
  "Core Mathematics",
  "English Language",
  "Social Studies",
  "Economics",
  "Government",
  "ICT",
]);
createShsCourseCatalog("general-science", [
  "Core Mathematics",
  "English Language",
  "Integrated Science",
  "Social Studies",
  "ICT",
]);
createShsCourseCatalog("business", [
  "Core Mathematics",
  "English Language",
  "Economics",
  "Business Management",
  "Accounting",
  "ICT",
]);
createShsCourseCatalog("home-economics", [
  "Core Mathematics",
  "English Language",
  "Food and Nutrition",
  "Management in Living",
  "ICT",
]);
createShsCourseCatalog("visual-arts", [
  "Core Mathematics",
  "English Language",
  "General Knowledge in Art",
  "Graphic Design",
  "ICT",
]);
applySavedCatalogNames();

let lessonTimerId = null;

function startLessonTimer(seconds = 600) {
  clearInterval(lessonTimerId);
  let timeLeft = seconds;
  const timerElement = document.getElementById("lesson-timer");
  const updateTimer = () => {
    if (!timerElement) return;
    const minutes = Math.floor(timeLeft / 60);
    const remainingSeconds = String(timeLeft % 60).padStart(2, "0");
    timerElement.textContent = `Lesson time: ${minutes}:${remainingSeconds}`;
  };
  updateTimer();
  lessonTimerId = setInterval(() => {
    timeLeft -= 1;
    updateTimer();
    if (timeLeft <= 0) {
      clearInterval(lessonTimerId);
      lessonTimerId = null;
      if (timerElement)
        timerElement.textContent =
          "Lesson time is complete — finish when you are ready.";
    }
  }, 1000);
}

function setupLearningExplorer() {
  const explorer = document.getElementById("learning-explorer");
  if (!explorer) return;
  const classesByDepartment = {
    basic: ["basic1", "basic2", "basic3", "basic4", "basic5", "basic6"],
    jhs: ["jhs1", "jhs2", "jhs3"],
    shs: ["shs1", "shs2", "shs3"],
  };
  const student = getStudentSession() || {};
  const savedClass = String(student.className || getClassKey()).toLowerCase();
  const initialDepartment = normalizeDepartmentKey(
    student.department,
    getDepartmentFromClass(savedClass),
  );

  explorer.innerHTML = `<section class="class-picker department-card"><label for="explorer-department-select">Department</label><select id="explorer-department-select"><option value="basic">Basic</option><option value="jhs">JHS</option><option value="shs">SHS</option></select><label for="explorer-class-select">Class</label><select id="explorer-class-select"></select><label for="explorer-syllabus-select">Syllabus / course</label><select id="explorer-syllabus-select"></select><button id="explorer-start-btn" class="small-btn" type="button">Start learning</button></section><div id="explorer-catalog"></div>`;

  const departmentSelect = document.getElementById("explorer-department-select");
  const classSelect = document.getElementById("explorer-class-select");
  const syllabusSelect = document.getElementById("explorer-syllabus-select");
  const catalog = document.getElementById("explorer-catalog");

  const updateSyllabuses = () => {
    const choices = Object.entries(learningCatalog).filter(
      ([key]) => getSyllabusDepartment(key) === departmentSelect.value,
    );
    syllabusSelect.innerHTML = choices
      .map(([key, item]) => `<option value="${key}">${item.name}</option>`)
      .join("");
    catalog.innerHTML = `<p class="select">${classLabels[classSelect.value]} can choose from the syllabus or course above.</p>`;
  };
  const updateClasses = () => {
    const choices = classesByDepartment[departmentSelect.value];
    classSelect.innerHTML = choices
      .map((key) => `<option value="${key}">${classLabels[key]}</option>`)
      .join("");
    classSelect.value = choices.includes(savedClass) ? savedClass : choices[0];
    updateSyllabuses();
  };

  departmentSelect.value = initialDepartment;
  updateClasses();
  departmentSelect.addEventListener("change", updateClasses);
  classSelect.addEventListener("change", updateSyllabuses);
  document.getElementById("explorer-start-btn").addEventListener("click", () => {
    const activeStudent = getStudentSession();
    if (activeStudent) {
      localStorage.setItem(
        STUDENT_SESSION_KEY,
        JSON.stringify({
          ...activeStudent,
          department: departmentSelect.value,
          className: classSelect.value,
        }),
      );
    }
    window.location.href = `learning.html?${new URLSearchParams({ syllabus: syllabusSelect.value, class: classSelect.value }).toString()}`;
  });
}

function getStudyStreak() {
  try {
    const days = new Set(
      JSON.parse(localStorage.getItem(STUDY_ACTIVITY_KEY)) || [],
    );
    let streak = 0;
    const date = new Date();
    while (days.has(date.toISOString().slice(0, 10))) {
      streak++;
      date.setDate(date.getDate() - 1);
    }
    return streak;
  } catch {
    return 0;
  }
}

function setupStudentDashboard() {
  const dashboard = document.getElementById("student-dashboard");
  if (!dashboard) return;
  const student = getStudentSession() || { name: "Student" };
  const initials =
    student.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "ST";
  const completed = Object.keys(getLearningProgress()).length;
  const allLessons = getAllLessons(learningCatalog.ges).length;
  let history = [];
  try {
    history = JSON.parse(localStorage.getItem(QUIZ_HISTORY_KEY)) || [];
  } catch {
    /* empty */
  }
  const average = history.length
    ? Math.round(
        history.reduce(
          (sum, item) => sum + (item.score / item.total) * 100,
          0,
        ) / history.length,
      )
    : 0;
  const streak = getStudyStreak();
  const game = getGamification();
  const level = getLevel(game.xp || 0);
  const progress = Math.min(100, Math.round((completed / allLessons) * 100));
  const achievements = [
    completed >= 1
      ? "🎓 First lesson completed"
      : "🔒 Complete your first lesson",
    history.length >= 1
      ? "🧠 First quiz completed"
      : "🔒 Complete your first quiz",
    streak >= 3 ? "🔥 3-day study streak" : "🔒 Build a 3-day streak",
    average >= 80 && history.length
      ? "⭐ Quiz star: 80% average"
      : "🔒 Reach an 80% quiz average",
    (game.xp || 0) >= 200
      ? "🏅 Rising learner: Level 2"
      : "🔒 Earn 200 XP for Level 2",
  ];
  dashboard.innerHTML = `<section class="student-dashboard panel-card"><div class="dashboard-heading"><div><p class="eyebrow">My learning dashboard</p><h2>Your progress at a glance</h2></div><div class="profile-pill dashboard-profile"><span>${initials}</span><div><strong>${student.name}</strong><small>Student progress</small></div></div></div><div class="dashboard-stats"><article><span>Lessons completed</span><strong>${completed}</strong></article><article><span>Quizzes completed</span><strong>${history.length}</strong></article><article><span>Average quiz score</span><strong>${average}%</strong></article><article><span>Study streak</span><strong>${streak} day${streak === 1 ? "" : "s"}</strong></article></div><section class="progress-overview"><div><strong>Overall progress</strong><span>${progress}% complete</span></div><div class="subtopic-progress-bar"><div class="subtopic-progress-fill" style="width:${progress}%"></div></div></section><section class="gamification-card"><strong>Level ${level} · ${game.xp || 0} XP</strong><span>${200 - ((game.xp || 0) % 200)} XP to Level ${level + 1}</span></section><section class="achievement-list"><h3>Badges & achievements</h3>${achievements.map((item) => `<span>${item}</span>`).join("")}</section><a class="btn dashboard-continue" href="learning.html?syllabus=ges">Continue learning</a></section>`;
  setupSidebarProgressCard();
}

function setupSidebarProgressCard() {
  const sidebar = document.querySelector(".sidebar");
  const student = getStudentSession();
  if (!sidebar || !student) return;
  const studentName = String(student.name || "Student");
  const initials =
    studentName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "ST";
  // STUDENT-ONLY SIDEBAR: remove an old card and stop for teacher/admin views.
  sidebar.querySelector(".sidebar-progress-card")?.remove();
  if (student.role !== "student") return;
  const completed = Object.keys(getLearningProgress()).length;
  const progress = Math.min(
    100,
    Math.round((completed / getAllLessons(learningCatalog.ges).length) * 100),
  );
  const streak = getStudyStreak();
  const game = getGamification();
  const sideCard = document.createElement("section");
  sideCard.className = "sidebar-card sidebar-progress-card";
  sideCard.innerHTML = `<div class="sidebar-progress-name"><span>${initials}</span><strong>${studentName}</strong></div><p>Your learning progress</p><strong>${progress}% complete</strong><div class="subtopic-progress-bar"><div class="subtopic-progress-fill" style="width:${progress}%"></div></div><small>Level ${getLevel(game.xp || 0)} · ${game.xp || 0} XP · ${streak} day streak</small><a href="learning.html?syllabus=ges" class="small-btn">Continue learning</a>`;
  sidebar.append(sideCard);
}

function getNextLessonTarget(syllabus, subject, topic, subtopic) {
  const subjectOrder = Object.entries(syllabus.topics);
  const subjectIndex = subjectOrder.findIndex(
    ([subjectName]) => subjectName === subject,
  );

  if (subjectIndex === -1) return null;

  const topicOrder = Object.entries(syllabus.topics[subject]);
  const topicIndex = topicOrder.findIndex(([topicName]) => topicName === topic);

  if (topicIndex === -1) return null;

  const subtopics = Object.keys(syllabus.topics[subject][topic]);
  const subtopicIndex = subtopics.indexOf(subtopic);

  if (subtopicIndex !== -1 && subtopicIndex < subtopics.length - 1) {
    return {
      subject,
      topic,
      subtopic: subtopics[subtopicIndex + 1],
    };
  }

  const nextTopicEntry = topicOrder[topicIndex + 1];
  if (nextTopicEntry) {
    const [nextTopicName, nextSubtopics] = nextTopicEntry;
    const nextSubtopic = Object.keys(nextSubtopics)[0];
    return {
      subject,
      topic: nextTopicName,
      subtopic: nextSubtopic,
    };
  }

  const nextSubjectEntry = subjectOrder[subjectIndex + 1];
  if (nextSubjectEntry) {
    const [nextSubjectName, nextTopics] = nextSubjectEntry;
    const [nextTopicName, nextSubtopics] = Object.entries(nextTopics)[0];
    return {
      subject: nextSubjectName,
      topic: nextTopicName,
      subtopic: Object.keys(nextSubtopics)[0],
    };
  }

  return null;
}

function setupLearningSpace() {
  const space = document.getElementById("learning-space");
  if (!space) return;
  let syllabusKey =
    new URLSearchParams(window.location.search).get("syllabus") || "ges";
  const syllabus = learningCatalog[syllabusKey] || learningCatalog.ges;
  const selectedYear = new URLSearchParams(window.location.search).get("year");
  const classesByDepartment = {
    basic: ["basic1", "basic2", "basic3", "basic4", "basic5", "basic6"],
    jhs: ["jhs1", "jhs2", "jhs3"],
    shs: ["shs1", "shs2", "shs3"],
  };
  const selectedDepartment = getSyllabusDepartment(syllabusKey);
  const availableClasses = classesByDepartment[selectedDepartment];
  const requestedClass = getClassKey();
  const selectedClass = availableClasses.includes(requestedClass)
    ? requestedClass
    : availableClasses[0];

  // Keep class and syllabus selection available on the lesson page. This is
  // especially useful when students return directly to learning.html.
  const selectionControls = document.createElement("section");
  selectionControls.className = "class-picker department-card learning-selection";
  selectionControls.innerHTML = `
    <label for="learning-syllabus-select">Syllabus</label>
    <select id="learning-syllabus-select"></select>
    <label for="learning-class-select">Class</label>
    <select id="learning-class-select"></select>
    <button class="small-btn" id="apply-learning-selection" type="button">Start learning</button>
  `;

  const syllabusSelect = selectionControls.querySelector("#learning-syllabus-select");
  const classSelect = selectionControls.querySelector("#learning-class-select");
  const allowedSyllabuses = Object.entries(learningCatalog);
  syllabusSelect.innerHTML = allowedSyllabuses
    .map(([key, item]) => `<option value="${key}">${item.name}</option>`)
    .join("");
  syllabusSelect.value = syllabusKey;

  const updateClassChoices = () => {
    const department = getSyllabusDepartment(syllabusSelect.value);
    const classes = classesByDepartment[department];
    const previousClass = classSelect.value;
    classSelect.innerHTML = classes
      .map((key) => `<option value="${key}">${classLabels[key]}</option>`)
      .join("");
    classSelect.value = classes.includes(previousClass)
      ? previousClass
      : classes.includes(selectedClass)
        ? selectedClass
        : classes[0];
  };
  updateClassChoices();
  syllabusSelect.addEventListener("change", updateClassChoices);
  selectionControls
    .querySelector("#apply-learning-selection")
    .addEventListener("click", () => {
      const student = getStudentSession();
      if (student) {
        localStorage.setItem(
          STUDENT_SESSION_KEY,
          JSON.stringify({
            ...student,
            department: getSyllabusDepartment(syllabusSelect.value),
            className: classSelect.value,
          }),
        );
      }
      const params = new URLSearchParams({
        syllabus: syllabusSelect.value,
        class: classSelect.value,
      });
      window.location.href = `learning.html?${params.toString()}`;
    });
  let activeLesson;
  let activeLessonMeta = { subject: null, topic: null, subtopic: null };
  const renderTopics = () => {
    clearInterval(lessonTimerId);
    lessonTimerId = null;
    space.innerHTML = "";
    space.appendChild(selectionControls);
    const topicsPanel = document.createElement("div");
    topicsPanel.innerHTML = `<div class="panel-header"><p class="eyebrow">${syllabus.name}${selectedYear ? ` · ${selectedYear}` : ""}</p><h2>Pick a topic to learn</h2><p class="select">Open a topic, choose a subtopic, and read a short guided lesson.</p></div><div class="topic-grid">${Object.entries(
      syllabus.topics,
    )
      .map(
        ([subject, topics]) =>
          `<article class="topic-card"><h3>${subject}</h3>${Object.entries(
            topics,
          )
            .map(
              ([topic, subtopics]) =>
                `<details><summary>${topic}</summary><div class="subtopic-list">${Object.keys(
                  subtopics,
                )
                  .map((subtopic) => {
                    const unlocked = isSubtopicUnlocked(
                      syllabus,
                      subject,
                      topic,
                      subtopic,
                    );
                    const completed =
                      getLearningProgress()[
                        getLessonKey(subject, topic, subtopic)
                      ];
                    return `<button class="subtopic-btn" ${unlocked ? "" : "disabled"} data-subject="${subject}" data-topic="${topic}" data-subtopic="${subtopic}">${completed ? "✓ " : unlocked ? "" : "🔒 "}${subtopic}</button>`;
                  })
                  .join("")}</div></details>`,
            )
            .join("")}</article>`,
      )
      .join("")}</div>`;
    space.appendChild(topicsPanel);
    space
      .querySelectorAll(".subtopic-btn")
      .forEach((button) =>
        button.addEventListener("click", () =>
          renderLesson(
            button.dataset.subject,
            button.dataset.topic,
            button.dataset.subtopic,
          ),
        ),
      );
  };
  const renderExercise = () => {
    const exerciseQuestions = getTenExerciseQuestions(
      activeLesson,
      activeLessonMeta.subtopic,
      activeLessonMeta,
    );
    let questionIndex = 0;
    const showExerciseQuestion = () => {
      const current = exerciseQuestions[questionIndex];
      space.innerHTML = `<article class="lesson-card"><p class="eyebrow">Exercise · Question ${questionIndex + 1} of 10</p><h2>Apply what you learned</h2><section class="exercise-box"><h3>✎ ${current.question}</h3><div class="exercise-input-group"><input class="exercise-input" id="exercise-answer" type="text" autocomplete="off" placeholder="Type your answer here" /><button class="small-btn" id="check-exercise">Check answer</button></div><p class="hint-text">Type the exact answer from the lesson or quiz.</p></section></article>`;
      const input = document.getElementById("exercise-answer");
      const checkExercise = () => {
        const answer = input.value.trim();
        const correct = answer.toLowerCase() === current.answer.toLowerCase();
        showAnswerPopup(correct, current.answer, () => {
          if (!correct) {
            input.focus();
            return;
          }
          questionIndex++;
          if (questionIndex < exerciseQuestions.length) showExerciseQuestion();
          // NEXT LESSON: after the last marked exercise answer, go directly to
          // the following subtopic instead of leaving the learner in a modal.
          else continueAfterExercise();
        });
      };
      document
        .getElementById("check-exercise")
        .addEventListener("click", checkExercise);
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") checkExercise();
      });
    };
    showExerciseQuestion();
  };

  const renderLesson = (subject, topic, subtopic) => {
    activeLessonMeta = { subject, topic, subtopic };
    activeLesson = syllabus.topics[subject][topic][subtopic];
    saveLessonResume(subject, topic, subtopic);
    const contentOverride = getLessonOverride(
      syllabusKey,
      subject,
      topic,
      subtopic,
    );
    const lessonImage = contentOverride.imageMediaId
      ? `<div id="uploaded-lesson-image" class="lesson-media-placeholder"></div>`
      : activeLesson.image
        ? `<img class="lesson-image" src="${activeLesson.image}" alt="Illustration for ${subtopic}" />`
        : "";
    const extras = getLessonExtras(
      syllabusKey,
      subject,
      topic,
      subtopic,
      activeLesson,
    );
    const lessonExamples = extras.examples.length
      ? extras.examples
      : [
          {
            title: "Think it through",
            problem: `Use the main idea from ${subtopic}.`,
            steps: ["Read the lesson", "Identify the key idea", "Apply it carefully"],
            result: "You are ready to practise.",
          },
        ];
    const examples = Array.from({ length: 5 }, (_, index) =>
      lessonExamples[index % lessonExamples.length],
    )
      .map(
        (example) =>
          `<div class="example-card"><p class="example-title">${example.title}</p><p class="example-problem">${example.problem}</p><ol class="example-steps">${example.steps.map((step) => `<li>${step}</li>`).join("")}</ol><span class="example-result">${example.result}</span></div>`,
      )
      .join("");
    const videoUrl = getYouTubeEmbedUrl(extras.videoUrl);
    const video = contentOverride.videoMediaId
      ? `<div class="lesson-video-box" id="lesson-video-content"><h3>▶ Lesson video</h3><div class="video-wrapper lesson-media-placeholder"></div></div>`
      : videoUrl
        ? `<div class="lesson-video-box"><h3>▶ Lesson video</h3><div class="video-wrapper">${/\.(mp4|webm|ogg)(\?.*)?$/i.test(videoUrl) ? `<video controls src="${videoUrl}">Your browser cannot play this video.</video>` : `<iframe src="${videoUrl}" title="${subtopic} video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`}</div></div>`
        : `<div class="lesson-video-box"><h3>▶ Lesson video</h3><p>No video has been added for this lesson yet. Add its URL in <code>LESSON_VIDEO_URLS</code> in teacherbot.js.</p></div>`;
    space.innerHTML = `<button class="back-link" id="back-to-topics">← All topics</button><article class="lesson-card"><p class="eyebrow">${subject} · ${topic}</p><div class="lesson-timer" id="lesson-timer" role="timer" aria-live="polite"></div><h2>${subtopic}</h2>${lessonImage}<div class="lesson-copy"><p>${contentOverride.lesson || activeLesson.lesson}</p></div><section class="examples-section"><h3>✦ Five examples</h3>${examples}</section><button class="btn" id="finish-lesson">I am done learning</button></article>`;
    activeLesson._guidedVideo = video;
    activeLesson._guidedQuestions = extras.questions;
    // CONTENT-STUDIO QUESTIONS: exact five-question sets saved by an admin or
    // approved teacher are intentionally kept word-for-word for every class.
    // Built-in lesson questions use the department/class wording above instead.
    activeLesson._hasManagedQuestions = Boolean(contentOverride.questions);
    startLessonTimer();
    document
      .getElementById("back-to-topics")
      .addEventListener("click", renderTopics);
    document.getElementById("finish-lesson").addEventListener("click", () => {
      clearInterval(lessonTimerId);
      lessonTimerId = null;
      renderTopicQuiz(
        activeLesson,
        activeLessonMeta.subtopic,
        () => renderLesson(subject, topic, subtopic),
        continueAfterExercise,
        activeLessonMeta,
      );
    });
    if (contentOverride.imageMediaId) {
      getLessonMedia(contentOverride.imageMediaId)
        .then((file) => {
          const holder = document.getElementById("uploaded-lesson-image");
          if (!file || !holder) return;
          const image = document.createElement("img");
          image.className = "lesson-image";
          image.alt = `Uploaded illustration for ${subtopic}`;
          image.src = URL.createObjectURL(file);
          holder.replaceWith(image);
        })
        .catch(() => {});
    }
    if (contentOverride.videoMediaId) {
      getLessonMedia(contentOverride.videoMediaId)
        .then((file) => {
          const holder = document.querySelector(
            "#lesson-video-content .lesson-media-placeholder",
          );
          if (!file || !holder) return;
          const player = document.createElement("video");
          player.controls = true;
          player.src = URL.createObjectURL(file);
          player.textContent = "Your browser cannot play this video.";
          holder.replaceWith(player);
          const container = document.getElementById("lesson-video-content");
          if (container) activeLesson._guidedVideo = container.outerHTML;
        })
        .catch(() => {});
    }
    // Every lesson begins with its video. The student chooses when to move on
    // to the reading rather than being blocked by a timer or autoplay.
    const videoModal = document.getElementById("lesson-video-modal");
    document.getElementById("guided-video-content").innerHTML = video;
    videoModal.classList.add("visible");
    document.getElementById("start-topic-check").textContent = "Done watching";
    document.getElementById("start-topic-check").onclick = () => {
      videoModal.classList.remove("visible");
    };
  };
  const modal = document.getElementById("understanding-modal");
  if (!document.getElementById("lesson-video-modal")) {
    document.body.insertAdjacentHTML(
      "beforeend",
      '<div class="understanding-modal" id="lesson-video-modal" aria-hidden="true"><div class="modal-card lesson-video-modal-card"><h2>Watch the lesson video</h2><div id="guided-video-content"></div><div class="modal-actions"><button class="btn" id="start-topic-check">Done watching</button></div></div></div>',
    );
  }
  if (!document.getElementById("enjoyment-modal")) {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<div class="understanding-modal" id="enjoyment-modal" aria-hidden="true"><div class="modal-card"><h2>Did you enjoy the lesson?</h2><p>Your feedback helps us make Y_Cohde better for students.</p><div class="modal-actions"><button class="btn" id="enjoyed-yes">Yes, I enjoyed it</button><button class="soft-btn" id="enjoyed-no">Not yet</button></div></div></div>`,
    );
  }
  const continueAfterExercise = () => {
    const nextLesson = getNextLessonTarget(
      syllabus,
      activeLessonMeta.subject,
      activeLessonMeta.topic,
      activeLessonMeta.subtopic,
    );
    saveCompletedSubtopic(
      activeLessonMeta.subject,
      activeLessonMeta.topic,
      activeLessonMeta.subtopic,
    );
    if (!nextLesson) {
      renderTopics();
      return;
    }
    // NEXT LESSON: completion always opens the next subtopic. The learner has
    // already completed the prerequisite, so the modal must never block here.
    renderLesson(nextLesson.subject, nextLesson.topic, nextLesson.subtopic);
  };
  ["enjoyed-yes", "enjoyed-no"].forEach((id) => {
    document.getElementById(id).addEventListener("click", () => {
      document.getElementById("enjoyment-modal").classList.remove("visible");
      continueAfterExercise();
    });
  });
  document.getElementById("understood-yes").addEventListener("click", () => {
    modal.classList.remove("visible");
    clearInterval(lessonTimerId);
    lessonTimerId = null;
    const videoModal = document.getElementById("lesson-video-modal");
    document.getElementById("guided-video-content").innerHTML =
      activeLesson?._guidedVideo ||
      '<p class="review-note">No video has been added yet. You can continue to the learning check.</p>';
    videoModal.classList.add("visible");
    document.getElementById("start-topic-check").onclick = () => {
      videoModal.classList.remove("visible");
      renderTopicQuiz(
        activeLesson,
        activeLessonMeta.subtopic,
        renderExercise,
        activeLessonMeta,
      );
    };
  });
  document.getElementById("understood-no").addEventListener("click", () => {
    modal.classList.remove("visible");
    space
      .querySelector(".lesson-copy")
      .insertAdjacentHTML(
        "beforeend",
        '<p class="review-note">That is okay. Read the lesson once more, then try the questions when you feel ready.</p>',
      );
  });
  const savedLesson = getLessonResume();
  if (
    savedLesson &&
    syllabus.topics[savedLesson.subject]?.[savedLesson.topic]?.[
      savedLesson.subtopic
    ]
  ) {
    renderLesson(savedLesson.subject, savedLesson.topic, savedLesson.subtopic);
  } else renderTopics();
}

function renderTopicQuiz(lesson, subtopic, onRetry, onPassed, metadata = {}) {
  clearInterval(lessonTimerId);
  lessonTimerId = null;
  const space = document.getElementById("learning-space");
  const quizQuestions = getFiveQuizQuestions(
    lesson,
    subtopic,
    undefined,
    metadata,
  );
  let index = 0,
    score = 0;
  const showQuestion = () => {
    const [question, answers, correct] = quizQuestions[index];
    space.innerHTML = `<article class="lesson-card topic-quiz"><p class="eyebrow">Topic check · Question ${index + 1} of 5</p><h2>${question}</h2><div class="answers">${answers.map((answer, answerIndex) => `<button data-answer="${answerIndex}">${answer}</button>`).join("")}</div><div id="correct-emoji" class="correct-emoji" aria-live="polite" aria-hidden="true"></div><p id="topic-feedback" class="feedback-text"></p></article>`;
    space.querySelectorAll("[data-answer]").forEach((button) =>
      button.addEventListener("click", () => {
        const selected = Number(button.dataset.answer);
        space
          .querySelectorAll("[data-answer]")
          .forEach((item) => (item.disabled = true));
        if (selected === correct) {
          score++;
          const emoji = document.getElementById("correct-emoji");
          emoji.textContent = "🎉";
          emoji.setAttribute("aria-hidden", "false");
          document.getElementById("topic-feedback").textContent =
            "Correct! Great learning.";
        } else {
          const emoji = document.getElementById("correct-emoji");
          emoji.textContent = "❌";
          emoji.setAttribute("aria-hidden", "false");
          document.getElementById("topic-feedback").textContent =
            `Not quite. The correct answer is ${answers[correct]}.`;
        }
        setTimeout(() => {
          index++;
          index < quizQuestions.length ? showQuestion() : finishQuiz();
        }, 1100);
      }),
    );
  };
  const finishQuiz = () => {
    if (metadata.subject)
      saveLessonCheckResult(score, quizQuestions.length, {
        ...metadata,
        syllabus:
          new URLSearchParams(window.location.search).get("syllabus") || "ges",
      });
    if (score === quizQuestions.length) {
      space.innerHTML = `<article class="lesson-card"><p class="eyebrow">Topic check complete</p><h2>You scored ${score} out of 5</h2><p>Excellent work—you can move to the next lesson.</p><button class="btn" id="choose-another-topic">Next lesson</button></article>`;
      document
        .getElementById("choose-another-topic")
        .addEventListener("click", onPassed || (() => setupLearningSpace()));
      return;
    }

    space.innerHTML = `<article class="lesson-card"><p class="eyebrow">Topic check complete</p><h2>You scored ${score} out of 5</h2><p>Review the lesson and examples, then try the five questions again.</p><button class="soft-btn" id="choose-another-topic">Go back to lesson</button></article>`;
    document
      .getElementById("choose-another-topic")
      .addEventListener("click", onRetry || (() => setupLearningSpace()));
  };
  showQuestion();
}

// Dashboard shell interactions keep the existing quiz logic intact while
// supporting the new sidebar and top navigation experience.

const classLevels = {
  basic1: "early",
  basic2: "early",
  basic3: "middle",
  basic4: "middle",
  basic5: "upper",
  basic6: "upper",
  jhs1: "jhs",
  jhs2: "jhs",
  jhs3: "jhs",
  shs1: "shs",
  shs2: "shs",
  shs3: "shs",
};

const classLabels = {
  basic1: "Basic 1",
  basic2: "Basic 2",
  basic3: "Basic 3",
  basic4: "Basic 4",
  basic5: "Basic 5",
  basic6: "Basic 6",
  jhs1: "JHS 1",
  jhs2: "JHS 2",
  jhs3: "JHS 3",
  shs1: "SHS 1",
  shs2: "SHS 2",
  shs3: "SHS 3",
};

const subjects = {
  maths: {
    displayName: "Mathematics",
    early: [
      { question: "What is 1 + 1?", answers: ["1", "2", "3", "4"], correct: 1 },
      {
        question: "How many sides does a triangle have?",
        answers: ["2", "3", "4", "5"],
        correct: 1,
      },
      {
        question: "What is the number name for 254?",
        answers: [
          "Two five four",
          "Two hundred and five four",
          "Two hundred and fifty four",
          "Two hundred fifty four",
        ],
        correct: 2,
      },
      {
        question: "What is the place value of the number 7 in 376?",
        answers: ["Once", "Tense", "Hundreds", "Thousand"],
        correct: 1,
      },
      {
        question: "What is the number name for Six Hnndred and Forty Six?",
        answers: ["640", "604", "646", "6,046"],
        correct: 2,
      },
      {
        question:
          "If Abena has 10 pencils and she gives 5 pencils to Dean. How many pencils does she have?",
        answers: ["20", "10", "4", "5"],
        correct: 3,
      },
      {
        question: "Skip count forward by 10s. 10,20,30,40,........",
        answers: ["60", "70", "50", "40"],
        correct: 2,
      },
      {
        question: "What is the number name for 25?",
        answers: [
          "Twenty Five",
          "Twenty and five",
          "Two hundred and five",
          "Two five",
        ],
        correct: 0,
      },
      {
        question: "What is the value of 7 in 172?",
        answers: ["Ones", "Tense", "Hundreds", "Thousands"],
        correct: 1,
      },
      {
        question: "Expand 456",
        answers: ["400 + 50 + 6", "40 + 5 + 6", "400 + 5 + 6", "400 + 60 + 5"],
        correct: 0,
      },
      {
        question: "Compare 56......65",
        answers: [">", "<", "=", "none"],
        correct: 1,
      },
      {
        question: "How is 245 written in place values?",
        answers: [
          "2 ones, 4 tens, 5 hundreds ",
          "2 hundreds, 4 tens, 5 ones",
          "2 tens, 5 hundreds, 4 ones",
          "5 thousdands",
        ],
        correct: 1,
      },
      {
        question: "What is 20 + 30?",
        answers: ["53", "23", "50", "60"],
        correct: 2,
      },
      {
        question: "what is the correct answer for 35 + 25.",
        answers: ["23", "37", "45", "60"],
        correct: 3,
      },
      {
        question: "Where is 150 on the number line?",
        answers: [
          "between 0 and 100",
          "between 100 and 200",
          "between 200 and 300",
          "between 300 and 400",
        ],
        correct: 1,
      },
      {
        question: "Which is greater? 78 or 87?",
        answers: ["78", "34", "87", "80"],
        correct: 2,
      },
      {
        question: "Which is smaller? 120 or 102",
        answers: ["102", "122", "123", "120"],
        correct: 0,
      },
      {
        question: "What is the number 600 + 40 + 2?",
        answers: ["602", "632", "642", "652"],
        correct: 2,
      },
      {
        question: "Arrange in Ascending order",
        answers: [
          "300, 200, 150, 100",
          "100, 150, 200, 300",
          "150, 100, 200, 300",
          "400, 150, 200, 300",
        ],
        correct: 1,
      },
      {
        question: "Find the missing value.20 - 12 = .........",
        answers: ["2", "3", "4", "5"],
        correct: 0,
      },
      {
        question: "Find the missing value. 8 + ...... = 24",
        answers: ["13", "22", "15", "16"],
        correct: 3,
      },
      {
        question: "Fill in the space with = or ≠. 12 + 10 ..........23",
        answers: ["=", "<", "≠", ">"],
        correct: 2,
      },
      {
        question: "what is the correct answer for 35 + 25.",
        answers: ["23", "37", "45", "60"],
        correct: 3,
      },
      {
        question: "Where is 150 on the number line?",
        answers: [
          "between 0 and 100",
          "between 100 and 200",
          "between 200 and 300",
          "between 300 and 400",
        ],
        correct: 1,
      },
      {
        question: "Which is greater? 78 or 87?",
        answers: ["78", "34", "87", "80"],
        correct: 2,
      },
      {
        question: "Which is smaller? 120 or 102",
        answers: ["102", "122", "123", "120"],
        correct: 0,
      },
      {
        question: "What is the number 600 + 40 + 2?",
        answers: ["602", "632", "642", "652"],
        correct: 2,
      },
      {
        question: "Which is smaller? 120 or 102",
        answers: ["102", "122", "123", "120"],
        correct: 0,
      },
      {
        question: "What is the number 600 + 40 + 2?",
        answers: ["602", "632", "642", "652"],
        correct: 2,
      },
      {
        question: "Arrange in Ascending order",
        answers: [
          "300, 200, 150, 100",
          "100, 150, 200, 300",
          "150, 100, 200, 300",
          "400, 150, 200, 300",
        ],
        correct: 1,
      },
      {
        question: "Find the missing value.20 - 12 = .........",
        answers: ["2", "3", "4", "5"],
        correct: 0,
      },
      {
        question: "Find the missing value. 8 + ...... = 24",
        answers: ["13", "22", "15", "16"],
        correct: 3,
      },
      {
        question: "What is the number name for Six Hnndred and Forty Six?",
        answers: ["640", "604", "646", "6,046"],
        correct: 2,
      },
      {
        question:
          "If Abena has 10 pencils and she gives 5 pencils to Dean. How many pencils does she have?",
        answers: ["20", "10", "4", "5"],
        correct: 3,
      },
      {
        question: "Skip count forward by 10s. 10,20,30,40,........",
        answers: ["60", "70", "50", "40"],
        correct: 2,
      },
      {
        question: "What is the number name for 35?",
        answers: [
          "Thirty Five",
          "Twenty and five",
          "Two hundred and five",
          "Three five",
        ],
        correct: 0,
      },
      {
        question: "What is the value of 7 in 172?",
        answers: ["Ones", "Tense", "Hundreds", "Thousands"],
        correct: 1,
      },
      {
        question: "Expand 456",
        answers: ["400 + 50 + 6", "40 + 5 + 6", "400 + 5 + 6", "400 + 60 + 5"],
        correct: 0,
      },
      {
        question: "Compare 56......65",
        answers: [">", "<", "=", "none"],
        correct: 1,
      },
    ],
    middle: [
      {
        question: "What is 12 + 7?",
        answers: ["17", "19", "20", "21"],
        correct: 0,
      },
      {
        question: "What is 5 - 3?",
        answers: ["10", "2", "15", "18"],
        correct: 1,
      },
      {
        question: "What is 134 + 7?",
        answers: ["17", "19", "20", "141"],
        correct: 3,
      },
      {
        question: "What is 6 x 4?",
        answers: ["24", "12", "15", "18"],
        correct: 0,
      },
      {
        question: "What is the value of 3 in 3546?",
        answers: ["Ones", "Tens", "Hundreds", "Thousand"],
        correct: 3,
      },
    ],
    upper: [
      {
        question: "What is 24 + 18?",
        answers: ["32", "40", "42", "44"],
        correct: 2,
      },
      {
        question: "What is 8 x 6?",
        answers: ["42", "46", "48", "50"],
        correct: 2,
      },
    ],
    jhs: [
      {
        question: "Solve: 3x + 4 = 19",
        answers: ["3", "5", "7", "9"],
        correct: 2,
      },
      {
        question: "What is 15% of 200?",
        answers: ["20", "25", "30", "35"],
        correct: 1,
      },
    ],
  },
  science: {
    displayName: "Science",
    early: [
      {
        question: "Plants need sunlight to make food.",
        answers: ["True", "False"],
        correct: 0,
      },
      {
        question: "What do we breathe in?",
        answers: ["Oxygen", "Carbon dioxide", "Smoke", "Water"],
        correct: 0,
      },
      {
        question: "Plants have different parts just like the human body",
        answers: ["True", "None", "False", "All of the above"],
        correct: 0,
      },
      {
        question: "Which of the following is not part of a plant?",
        answers: ["Root", "Trunk", "Flower", "Stem"],
        correct: 1,
      },
      {
        question: "All the following are parts of animals except....",
        answers: ["Stem", "Head", "Limbs", "Trunk"],
        correct: 0,
      },
      {
        question: "... are physical substances that are used for making things",
        answers: ["Metals", "Materials", "Matter", "Heat"],
        correct: 1,
      },
      {
        question: "Flowers also have different sizes and shape",
        answers: ["True", "None", "False", "All of the above"],
        correct: 0,
      },
      {
        question: "Which part of a pant holds the plant firmly to the ground",
        answers: ["Stem", "Leaves", "Flowers", "Root"],
        correct: 3,
      },
      {
        question:
          "The part of the plant that holds the leaves above the soli is called",
        answers: ["Root", "Fruit", "Flowers", "Stem"],
        correct: 3,
      },
      {
        question: "Which of the following materials is weak",
        answers: ["Metal", "Stone", "Paper", "Concrete"],
        correct: 2,
      },
      {
        question: "Which of the following materials is flexible",
        answers: ["Rubber", "Stone", "Concrete", "Glass"],
        correct: 0,
      },
      {
        question: "What do we breathe in?",
        answers: ["Oxygen", "Carbon dioxide", "Smoke", "Water"],
        correct: 0,
      },
      {
        question: "Plants have different parts just like the human body",
        answers: ["True", "None", "False", "All of the above"],
        correct: 0,
      },
      {
        question: "Which of the following is not part of a plant?",
        answers: ["Root", "Trunk", "Flower", "Stem"],
        correct: 1,
      },
      {
        question: "All the following are parts of animals except....",
        answers: ["Stem", "Head", "Limbs", "Trunk"],
        correct: 0,
      },
      {
        question: "... are physical substances that are used for making things",
        answers: ["Metals", "Materials", "Matter", "Heat"],
        correct: 1,
      },
      {
        question: "Flowers also have different sizes and shape",
        answers: ["True", "None", "False", "All of the above"],
        correct: 0,
      },
      {
        question: "What do we breathe in?",
        answers: ["Oxygen", "Carbon dioxide", "Smoke", "Water"],
        correct: 0,
      },
      {
        question: "Plants have different parts just like the human body",
        answers: ["True", "None", "False", "All of the above"],
        correct: 0,
      },
      {
        question: "Which of the following is not part of a plant?",
        answers: ["Root", "Trunk", "Flower", "Stem"],
        correct: 1,
      },
      {
        question: "All the following are parts of animals except....",
        answers: ["Stem", "Head", "Limbs", "Trunk"],
        correct: 0,
      },
      {
        question: "Which of the following materials is water proof",
        answers: ["Cotton", "Rubber", "Wood", "Concrete"],
        correct: 1,
      },
      {
        question: "Solve: 3x + 4 = 19",
        answers: ["3", "5", "7", "9"],
        correct: 2,
      },
    ],
    middle: [
      {
        question: "What gas do plants use to make food?",
        answers: ["Oxygen", "Nitrogen", "Carbon dioxide", "Helium"],
        correct: 2,
      },
      {
        question: "Which part of the body helps us think?",
        answers: ["Lungs", "Brain", "Heart", "Stomach"],
        correct: 1,
      },
    ],
    upper: [
      {
        question: "What is the boiling point of water at sea level?",
        answers: ["90°C", "100°C", "110°C", "120°C"],
        correct: 1,
      },
      {
        question: "Which planet is known as the Red Planet?",
        answers: ["Mercury", "Venus", "Mars", "Jupiter"],
        correct: 2,
      },
    ],
    jhs: [
      {
        question: "What is the chemical symbol for water?",
        answers: ["O2", "H2O", "CO2", "NaCl"],
        correct: 1,
      },
      {
        question: "Which organ pumps blood around the body?",
        answers: ["Lungs", "Kidney", "Heart", "Liver"],
        correct: 2,
      },
    ],
  },
  owop: {
    displayName: "Our World Our People",
    early: [
      {
        question: "Ghana is in Africa.",
        answers: ["True", "False"],
        correct: 0,
      },
      {
        question: "Which is a natural resource?",
        answers: ["Water", "Book", "Chair", "Pen"],
        correct: 0,
      },
      {
        question:
          "The ________ is used to communicate to players during games.",
        answers: ["bell", "whistle", "drum"],
        correct: 1,
      },
      {
        question: "The thermometer is a communication tool.",
        answers: ["True", "False", "None"],
        correct: 1,
      },
      {
        question: "What tool consists of different keys?",
        answers: ["Keyboard", "Monitor", "Mouse"],
        correct: 0,
      },
      {
        question: "The computer has ________ parts.",
        answers: ["three", "two", "four"],
        correct: 2,
      },
      {
        question:
          "All the parts of the computer connect together for the computer to work.",
        answers: ["True", "False", "None"],
        correct: 0,
      },
      {
        question: "Sheep are reared for their ________.",
        answers: ["meat", "milk", "litter"],
        correct: 0,
      },
      {
        question: "Grains are ________-giving food to many people in Ghana.",
        answers: ["sugar", "energy", "bitter"],
        correct: 1,
      },
      {
        question: "Which of the following is not a vegetable?",
        answers: ["Pineapple", "Pepper", "Tomato"],
        correct: 0,
      },
      {
        question: "The ability to do work is called ________.",
        answers: ["energy", "source", "renewable"],
        correct: 0,
      },
      {
        question: "The energy from the sun is called ________ energy.",
        answers: ["polar", "solar", "wind"],
        correct: 1,
      },
      {
        question: "Who has authority at home?",
        answers: ["Teacher", "Father", "Child"],
        correct: 1,
      },
      {
        question: "Who has power to arrest all the bad citizens?",
        answers: ["Imam", "Police", "Pastor"],
        correct: 1,
      },
      {
        question: "We use national ________ to represent Ghana everywhere.",
        answers: ["assets", "symbols", "service"],
        correct: 1,
      },
      {
        question: "Being a responsible citizen requires you to be ________.",
        answers: ["polite", "strict", "hard"],
        correct: 0,
      },
      {
        question: "People who come from Ghana are called ________.",
        answers: ["Ghanaians", "foreigners", "Gold Coast"],
        correct: 0,
      },
      {
        question: "Okomfo Anokye was born in ________.",
        answers: ["Ejisu", "Awukugua", "Madina"],
        correct: 1,
      },
      {
        question: "Okomfo Anokye's parents were ________.",
        answers: ["bankers", "teachers", "farmers"],
        correct: 2,
      },
      {
        question: "The name Mohammed means ________.",
        answers: ["praised one", "trusted one", "chosen one"],
        correct: 0,
      },
      {
        question: "Mohammed was born in ________.",
        answers: ["Bethlehem", "Madina", "Mecca"],
        correct: 2,
      },
      {
        question: "Jesus Christ is the leader of ________.",
        answers: ["Islam", "Traditionalists", "Christianity"],
        correct: 2,
      },
    ],
    middle: [
      {
        question: "What is the capital city of Ghana?",
        answers: ["Kumasi", "Accra", "Tamale", "Cape Coast"],
        correct: 1,
      },
      {
        question: "Which of these is a good civic habit?",
        answers: [
          "Littering",
          "Helping your community",
          "Breaking rules",
          "Ignoring elders",
        ],
        correct: 1,
      },
    ],
    upper: [
      {
        question: "Which continent is Ghana found in?",
        answers: ["Asia", "Europe", "Africa", "Australia"],
        correct: 2,
      },
      {
        question: "What do people use a map for?",
        answers: ["To cook", "To find places", "To play music", "To sleep"],
        correct: 1,
      },
    ],
    jhs: [
      {
        question: "Why is it important to protect the environment?",
        answers: [
          "To keep it clean and safe",
          "To waste more",
          "To make noise",
          "To destroy trees",
        ],
        correct: 0,
      },
      {
        question: "What is one major job of a government?",
        answers: [
          "To make laws",
          "To bake bread",
          "To sell shoes",
          "To sleep all day",
        ],
        correct: 0,
      },
    ],
  },
  history: {
    displayName: "History",
    early: [
      {
        question: "A family tree shows your family.",
        answers: ["True", "False"],
        correct: 0,
      },
      {
        question: "What is a timeline used for?",
        answers: [
          "To tell time",
          "To show events in order",
          "To count money",
          "To draw",
        ],
        correct: 1,
      },
      {
        question: ".......... is a smaller group within the ethnic group",
        answers: ["Tribe", "Tribe", "Trick"],
        correct: 0,
      },
      {
        question: "How many administrative region do we have",
        answers: ["20", "14", "16"],
        correct: 2,
      },
      {
        question: "There are .......... main ethnic group in Ghana.",
        answers: ["5", "7", "9"],
        correct: 0,
      },
      {
        question:
          "The first ethnic group to first settle in Ghana are the...........",
        answers: ["Guan", "Akan", "Mole Dagbani"],
        correct: 0,
      },
      {
        question: "Ethnic group is made up of different tribe.",
        answers: ["True", "False"],
        correct: 0,
      },
      {
        question:
          "................. is a group of practise with common culture and history",
        answers: ["Tribe", "Ethnic", "Nationalisation"],
        correct: 1,
      },
      {
        question: "All ethnic group have their own ......",
        answers: ["Facial looks", "Culture", "Legs"],
        correct: 1,
      },
      {
        question: "Which people speak Ewe?",
        answers: ["Akans", "Guans", "Ewes"],
        correct: 2,
      },
      {
        question:
          "A group of people who speak the same language with a common history and culture is known as ............",
        answers: ["Character", "Ethnic", "Special"],
        correct: 1,
      },
      {
        question: "Which people speak Ewe?",
        answers: ["Akans", "Guans", "Ewes"],
        correct: 2,
      },
      {
        question: "Ghana has ........ regions.",
        answers: ["Ten", "Twelve", "Sixteen"],
        correct: 2,
      },
      {
        question: "All ethnic group have their own ......",
        answers: ["Facial looks", "Culture", "Legs"],
        correct: 1,
      },
      {
        question: "Which ethnic group came from Ile-Ife in Nigeria",
        answers: ["Gonja", "Ga-Adangbe", "Ewes"],
        correct: 1,
      },
      {
        question: "The Ga Adangbe speak .......?",
        answers: ["Ga", "Ewe", "Gonja"],
        correct: 0,
      },
      {
        question: "The popular food of the Ga Adangbe is",
        answers: ["Kenkey", "Tuo-zaafi", "Rice"],
        correct: 0,
      },
      {
        question: "The popular food of the Ewe is",
        answers: ["Kenkey", "Akple", "Rice"],
        correct: 1,
      },
      {
        question: "The popular food of the Akans is",
        answers: ["Kenkey", "Tuo-zaafi", "Fufu"],
        correct: 2,
      },
      {
        question: "The akans migrated from Ancient ......... Empire .",
        answers: ["Nigeria", "Ghana", "Togo"],
        correct: 1,
      },
      {
        question: "What the main festival celebrated by the Ewes",
        answers: ["Hogbetsotso", "Adowa", "Homowo"],
        correct: 0,
      },
      {
        question: "Whats the traditional cloth of the Ewes?",
        answers: ["Kente", "T-shirt", "Smock"],
        correct: 0,
      },
      {
        question:
          "A group of people who speak the same language with common history and culture is known as ....... group.",
        answers: ["character", "ethnic", "special"],
        correct: 1,
      },
      {
        question: "Which people speak Ewe?",
        answers: ["Akans", "Guans", "Ewes"],
        correct: 2,
      },
      {
        question: "One common food among the Akans is",
        answers: ["fufuo.", "akple", "tuo zaafi."],
        correct: 0,
      },
      {
        question: "Ghana has ........... regions.",
        answers: ["ten", "twelve", "sixteen"],
        correct: 2,
      },
      {
        question: "Which ethnic group came from Ile Ife in Nigeria?",
        answers: ["Gonja", "Ga-Dangbe", "Ewe"],
        correct: 1,
      },
      {
        question: "Which ethnic group comes from the forest regions of Ghana?",
        answers: ["Akan", "Gonja", "Ewe"],
        correct: 0,
      },
      {
        question:
          "Two characteristics of an ethnic group are their history and ......",
        answers: ["looks.", "voice.", "language"],
        correct: 2,
      },
      {
        question: "Every ethnic group has common",
        answers: ["characteristics", "face.", "problems."],
        correct: 0,
      },
      {
        question: "The Akans migrated from Ancient ............. Empire.",
        answers: ["Nigeria", "Ghana", "Togo"],
        correct: 1,
      },
      {
        question: "All ethnic groups have their own ......",
        answers: ["facial looks.", "culture.", "legs."],
        correct: 1,
      },
    ],
    middle: [
      {
        question: "Who was the first President of Ghana?",
        answers: [
          "Kwame Nkrumah",
          "Jerry Rawlings",
          "John Mahama",
          "Kofi Annan",
        ],
        correct: 0,
      },
      {
        question: "What is an important national symbol?",
        answers: ["Flag", "Table", "Plate", "Radio"],
        correct: 0,
      },
    ],
    upper: [
      {
        question: "What does history teach us?",
        answers: [
          "Past events and lessons",
          "Only songs",
          "Only games",
          "Only jokes",
        ],
        correct: 0,
      },
      {
        question: "Why do we learn about our ancestors?",
        answers: [
          "To remember and respect them",
          "To forget them",
          "To ignore them",
          "To fight them",
        ],
        correct: 0,
      },
    ],
    jhs: [
      {
        question: "Which event changed Ghana's history greatly?",
        answers: [
          "The independence movement",
          "A football match",
          "A school holiday",
          "Rainfall",
        ],
        correct: 0,
      },
      {
        question: "What can a historical source be?",
        answers: [
          "A book or object from the past",
          "A toy",
          "A snack",
          "A shoe",
        ],
        correct: 0,
      },
    ],
  },
  english: {
    displayName: "English",
    early: [
      {
        question: "Choose the correct word: I ___ happy.",
        answers: ["am", "is", "are", "was"],
        correct: 0,
      },
      {
        question: "What is the plural of 'book'?",
        answers: ["books", "bookes", "booksies", "book"],
        correct: 0,
      },
      {
        question: ".......... you are a student ?",
        answers: ["Is", "Do", "Does", "Are"],
        correct: 3,
      },
      {
        question: ".......... You help the poor ?",
        answers: ["Is", "Do", "Does", "Are"],
        correct: 1,
      },
      {
        question: ".......... Kofi play with you?",
        answers: ["Is", "Do", "Does", "Are"],
        correct: 2,
      },
      {
        question: ".......... barked all night.",
        answers: ["The monkeys", "Birds", "My dog", "That man"],
        correct: 2,
      },
      {
        question: ".......... Has hurt his foot .",
        answers: ["The monkeys", "Birds", "My dog", "That man"],
        correct: 3,
      },
      {
        question: ".......... fly in the sky.",
        answers: ["The monkeys", "Birds", "My dog", "That man"],
        correct: 1,
      },
      {
        question: "This is my country Gh__na",
        answers: ["m", "k", "a", "o"],
        correct: 2,
      },
      {
        question: "Arise .......... youth for your country.",
        answers: ["Ghana", "Country", "Nation", "Her"],
        correct: 0,
      },
      {
        question: "Let's us unite to .......... her",
        answers: ["Ghana", "Country", "Nation", "Uphold"],
        correct: 3,
      },
      {
        question: "The teacher ..........",
        answers: [
          "Play with the ball",
          "Helps mother in the kitchen",
          "Teaches us",
          "Looks after the garden",
        ],
        correct: 2,
      },
      {
        question: "The gardener ..........",
        answers: [
          "Play with the ball",
          "Helps mother in the kitchen",
          "Teaches us",
          "Looks after the garden",
        ],
        correct: 3,
      },
      {
        question: "My sister ..........",
        answers: [
          "Play with the ball",
          "Helps mother in the kitchen",
          "Teaches us",
          "Looks after the garden",
        ],
        correct: 1,
      },
      {
        question: "There is so .......... coffee in the pot.",
        answers: ["Many", "Much"],
        correct: 1,
      },
      {
        question: "Why is there so .......... Noice?",
        answers: ["Many", "Much"],
        correct: 1,
      },
      {
        question: "Ants are very ..........",
        answers: ["Hardworking", "Lazy", "Hunger", "Music"],
        correct: 0,
      },
      {
        question: "The only thing Grasshopper did was to play..........",
        answers: ["Hardworking", "Lazy", "Hunger", "Music"],
        correct: 3,
      },
      {
        question: "The lion lived in the ..........",
        answers: ["Hardworking", "Forget", "Hunger", "Music"],
        correct: 2,
      },
      {
        question: "The .......... jumped back into the hole.",
        answers: ["Tortoise", "Lion", "Mouse", "Mummy"],
        correct: 2,
      },
      {
        question: "There were .......... important rules for baby antelope",
        answers: ["3", "5", "4", "8"],
        correct: 0,
      },
      {
        question: "Who shouted for help from the whole?",
        answers: ["Lion", "Tortoise", "Mouse", "Mummy"],
        correct: 0,
      },
    ],
    middle: [
      {
        question: "Which word is a verb?",
        answers: ["Run", "Blue", "Happy", "Table"],
        correct: 0,
      },
      {
        question: "What is the opposite of 'hot'?",
        answers: ["Wet", "Cold", "Tall", "Fast"],
        correct: 1,
      },
    ],
    upper: [
      {
        question: "Choose the correct sentence.",
        answers: [
          "She go to school.",
          "She goes to school.",
          "She going to school.",
          "She gone to school.",
        ],
        correct: 1,
      },
      {
        question: "Which word means 'very big'?",
        answers: ["Small", "Tiny", "Huge", "Thin"],
        correct: 2,
      },
    ],
    jhs: [
      {
        question: "What is the past tense of 'eat'?",
        answers: ["eated", "ate", "eaten", "eats"],
        correct: 1,
      },
      {
        question: "Which is a complete sentence?",
        answers: [
          "Running quickly.",
          "The bright sun.",
          "The dog barked loudly.",
          "Very happy.",
        ],
        correct: 2,
      },
    ],
  },
  rme: {
    displayName: "Religious and Moral Education",
    early: [
      {
        question: "Honesty means telling the truth.",
        answers: ["True", "False"],
        correct: 0,
      },
      {
        question: "What should you do when someone is sad?",
        answers: [
          "Ignore them",
          "Laugh at them",
          "Help and listen",
          "Push them",
        ],
        correct: 2,
      },
      {
        question: "The child is likely to be harmed by ________ people.",
        answers: ["good", "bad", "kind"],
        correct: 1,
      },
      {
        question:
          "All adults must ensure that children are free from ________.",
        answers: ["danger", "school", "church"],
        correct: 0,
      },
      {
        question:
          "One of the roles of the community is to provide a place for ________.",
        answers: ["fighting", "worship", "killing"],
        correct: 1,
      },
      {
        question:
          "The teacher ________ children when they do bad things in the community.",
        answers: ["rewards", "disciplines", "sacks"],
        correct: 1,
      },
      {
        question: "Our parents are to teach us how to ________.",
        answers: ["insult", "steal", "pray"],
        correct: 2,
      },
      {
        question: "Our ________ should pay our school fees.",
        answers: ["father", "friends", "siblings"],
        correct: 0,
      },
      {
        question: "Okomfo Anokye's real name was ________.",
        answers: ["Agyei Frimpong", "Osei Tutu", "Egya Ahor"],
        correct: 0,
      },
      {
        question: "Which of these people visited Baby Jesus?",
        answers: ["Wise men", "Angels", "Shepherds"],
        correct: 2,
      },
      {
        question: "Jesus Christ is the Leader of ________.",
        answers: ["Christianity", "Islam", "Budhists"],
        correct: 0,
      },
      {
        question: "Jesus was put in a ________.",
        answers: ["pail", "bucket", "manger"],
        correct: 2,
      },
      {
        question: "Which group of people celebrate the Hogbetsotso Festival?",
        answers: ["Asantes", "Gas", "Anlos"],
        correct: 2,
      },
      {
        question: "Which group of people celebrate the Damba Festival?",
        answers: ["Dagomba", "Akans", "Gas"],
        correct: 0,
      },
      {
        question: "The Odwira Festival is celebrated by the ________ people.",
        answers: ["Dagombas", "Fantes", "Akuapims"],
        correct: 2,
      },
      {
        question: "Homowo is celebrated by the ________.",
        answers: ["Akans", "Gas", "Ewes"],
        correct: 1,
      },
      {
        question: "Which of these is a religious practice?",
        answers: ["Stealing", "Praying", "Sleeping"],
        correct: 1,
      },
      {
        question: "Songs promote our ________ for God.",
        answers: ["love", "hate", "anger"],
        correct: 0,
      },
      {
        question: "The Lord's prayer is a Christian ________.",
        answers: ["dance", "song", "recitation"],
        correct: 2,
      },
      {
        question: "All religions believe in ________.",
        answers: ["stone", "human", "God"],
        correct: 2,
      },
      {
        question: "Christians worship in ________.",
        answers: ["church", "mosque", "school"],
        correct: 0,
      },
      {
        question: "Traditionalists pour ________.",
        answers: ["libation", "cibation", "citation"],
        correct: 0,
      },
      {
        question: "Attributes are special ________ given to God.",
        answers: ["ideas", "names", "bond"],
        correct: 1,
      },
      {
        question: "God is ________.",
        answers: ["wicked", "bad", "kind"],
        correct: 2,
      },
      {
        question: "God is loving, so we should ________ our neighbours.",
        answers: ["hate", "love", "slap"],
        correct: 1,
      },
      {
        question: "Traditionalists call God ________.",
        answers: ["Allah", "Mawu", "Supreme being"],
        correct: 2,
      },
      {
        question: "The Akan traditionalists call God the creator, ________.",
        answers: ["Mawu", "Oboadeɛ", "Allah"],
        correct: 1,
      },
      {
        question: "God is ________.",
        answers: ["one", "three", "two"],
        correct: 0,
      },
      {
        question: "A ________ is a place where a group of people live.",
        answers: ["community", "home", "school"],
        correct: 0,
      },
      {
        question: "Our parents must know our friends.",
        answers: ["True", "False", "None"],
        correct: 0,
      },
      {
        question: "Our families should provide security for us.",
        answers: ["True", "False", "None"],
        correct: 0,
      },
      {
        question:
          "Children are praised by their parents when they perform their Duties.",
        answers: ["True", "False", "None"],
        correct: 0,
      },
      {
        question:
          "The ________ is used to communicate to players during games.",
        answers: ["bell", "whistle", "drum"],
        correct: 1,
      },
      {
        question: "The thermometer is a communication tool.",
        answers: ["True", "False", "None"],
        correct: 1,
      },
      {
        question: "What tool consists of different keys?",
        answers: ["Keyboard", "Monitor", "Mouse"],
        correct: 0,
      },
      {
        question: "The computer has ________ parts.",
        answers: ["three", "two", "four"],
        correct: 2,
      },
      {
        question:
          "All the parts of the computer connect together for the computer to work.",
        answers: ["True", "False", "None"],
        correct: 0,
      },
      {
        question: "Sheep are reared for their ________.",
        answers: ["meat", "milk", "litter"],
        correct: 0,
      },
      {
        question: "Grains are ________-giving food to many people in Ghana.",
        answers: ["sugar", "energy", "bitter"],
        correct: 1,
      },
      {
        question: "Which of the following is not a vegetable?",
        answers: ["Pineapple", "Pepper", "Tomato"],
        correct: 0,
      },
      {
        question: "The ability to do work is called ________.",
        answers: ["energy", "source", "renewable"],
        correct: 0,
      },
      {
        question: "The energy from the sun is called ________ energy.",
        answers: ["polar", "solar", "wind"],
        correct: 1,
      },
      {
        question: "Who has authority at home?",
        answers: ["Teacher", "Father", "Child"],
        correct: 1,
      },
      {
        question: "Who has power to arrest all the bad citizens?",
        answers: ["Imam", "Police", "Pastor"],
        correct: 1,
      },
      {
        question: "We use national ________ to represent Ghana everywhere.",
        answers: ["assets", "symbols", "service"],
        correct: 1,
      },
      {
        question: "Being a responsible citizen requires you to be ________.",
        answers: ["polite", "strict", "hard"],
        correct: 0,
      },
      {
        question: "People who come from Ghana are called ________.",
        answers: ["Ghanaians", "foreigners", "Gold Coast"],
        correct: 0,
      },
      {
        question: "Okomfo Anokye was born in ________.",
        answers: ["Ejisu", "Awukugua", "Madina"],
        correct: 1,
      },
      {
        question: "Okomfo Anokye's parents were ________.",
        answers: ["bankers", "teachers", "farmers"],
        correct: 2,
      },
      {
        question: "The name Mohammed means ________.",
        answers: ["praised one", "trusted one", "chosen one"],
        correct: 0,
      },
      {
        question: "Mohammed was born in ________.",
        answers: ["Bethlehem", "Madina", "Mecca"],
        correct: 2,
      },
      {
        question: "Jesus Christ is the leader of ________.",
        answers: ["Islam", "Traditionalists", "Christianity"],
        correct: 2,
      },
    ],
    middle: [
      {
        question: "Respect means showing good manners.",
        answers: ["True", "False"],
        correct: 0,
      },
      {
        question: "Which is a good moral value?",
        answers: ["Greed", "Kindness", "Laziness", "Cruelty"],
        correct: 1,
      },
    ],
    upper: [
      {
        question: "What should you do when you make a mistake?",
        answers: ["Hide it", "Apologize", "Blame others", "Run away"],
        correct: 1,
      },
      {
        question: "Why should we help others?",
        answers: [
          "To be selfish",
          "To show love and care",
          "To cause trouble",
          "To ignore them",
        ],
        correct: 1,
      },
    ],
    jhs: [
      {
        question: "Which value helps people live together peacefully?",
        answers: ["Conflict", "Justice", "Hatred", "Rudeness"],
        correct: 1,
      },
      {
        question: "Why is forgiveness important?",
        answers: [
          "It creates peace",
          "It causes harm",
          "It creates fear",
          "It creates anger",
        ],
        correct: 0,
      },
    ],
  },
  creative: {
    displayName: "Creative Arts",
    early: [
      {
        question: "A pencil is used for drawing.",
        answers: ["True", "False"],
        correct: 0,
      },
      {
        question: "Which color is a primary color?",
        answers: ["Green", "Purple", "Red", "Orange"],
        correct: 2,
      },
      {
        question:
          "A ________ is an overflow of water that runs over land that is always dry.",
        answers: ["flood", "drought", "doubt"],
        correct: 0,
      },
      {
        question: "Road safety means safe when you are ________.",
        answers: ["sleeping", "walking", "bathing"],
        correct: 1,
      },
      {
        question:
          "A special event where different art works are displayed is called ________.",
        answers: ["art", "exhibition", "gallery"],
        correct: 1,
      },
      {
        question: "The elephant is ________ than the bird.",
        answers: ["smaller", "bigger", "shorter"],
        correct: 1,
      },
      {
        question: "The bird has ________.",
        answers: ["feathers", "hairs", "clothes"],
        correct: 0,
      },
      {
        question: "The Adowa Dance is performed by ________ of all ages.",
        answers: ["men", "women", "both men and women"],
        correct: 2,
      },
      {
        question:
          "The dance mostly performed by the southern Ewes in Ghana is called ________.",
        answers: ["Agbadza", "Borborbor", "Damba"],
        correct: 0,
      },
      {
        question: "Which dance is found among the Lobi and Dagomba people?",
        answers: ["Bawa", "Adowa", "Bamaya"],
        correct: 2,
      },
      {
        question: "Which tribe in Ghana do the Bamaya Dance?",
        answers: ["Northern", "Southern", "Volta"],
        correct: 0,
      },
      {
        question: "What are also signs of authority?",
        answers: ["Values", "Symbols", "People"],
        correct: 1,
      },
      {
        question: "What is a way of creating artworks by shaping materials?",
        answers: ["Modelling", "Carving", "Weaving"],
        correct: 0,
      },
      {
        question: "________ is a form of drawing.",
        answers: ["Modelling", "Doodling", "Painting"],
        correct: 1,
      },
      {
        question:
          "What is a visual art form in which lines and shapes are used to create an object?",
        answers: ["Scribbling", "Drawing", "Painting"],
        correct: 1,
      },
      {
        question: "We draw to express ________.",
        answers: ["skills", "emotions", "ideas"],
        correct: 2,
      },
      {
        question:
          "What do you need to practise and to develop your creative skills?",
        answers: ["Scribbling", "Painting", "Drawing"],
        correct: 2,
      },
      {
        question:
          "A small metallic musical instrument used for time lines is called ________.",
        answers: ["scale", "castanet", "flute"],
        correct: 1,
      },
      {
        question:
          'The "Attenteban" instrument is also known as ________ flute.',
        answers: ["stone", "stick", "bamboo"],
        correct: 2,
      },
      {
        question: "A ________ is a place for displaying or selling artworks.",
        answers: ["frontage", "genre", "gallery"],
        correct: 2,
      },
      {
        question:
          "Rivers, animals and plants are examples of ________ environment.",
        answers: ["man-made", "natural", "wild"],
        correct: 1,
      },
      {
        question:
          "Which animal does the Akans imitate in creating the Adowa Dance?",
        answers: ["Elephant", "Bird", "Antelope"],
        correct: 2,
      },
      {
        question: "The Gonja people lived in the grassland of ________.",
        answers: ["Ghana", "Mali", "Sudan"],
        correct: 0,
      },
      {
        question: "The Gonja called their kings ________.",
        answers: ["Lagbonwura", "None", "Nana"],
        correct: 0,
      },
      {
        question: "The Fante people settled in the ________ Region.",
        answers: ["Volta", "Central", "Eastern"],
        correct: 1,
      },
      {
        question: "The Dagomba people were ruled by ________.",
        answers: ["Okomfo Anokye", "Ofori Atta", "Ya Na"],
        correct: 2,
      },
      {
        question: "One example of artworks are /is ......",
        answers: ["Drawings", "Culture", "History"],
        correct: 0,
      },
      {
        question:
          ".............................is the production of artistic display.",
        answers: ["Culture", "History", "Artwork"],
        correct: 2,
      },
      {
        question:
          "............................is another example of an Artwork.",
        answers: ["Photographs", "Culture", "History"],
        correct: 0,
      },
      {
        question:
          "..........................is the way of life of groups of people .",
        answers: ["Artwork", "Culture", "History"],
        correct: 1,
      },
      {
        question:
          "History is the study of important events that took place in the past.",
        answers: ["True", "False"],
        correct: 0,
      },
      {
        question: "Which ethnic group speaks Twi and fante",
        answers: ["Akan", "Ewe", "Dagombas"],
        correct: 0,
      },
      {
        question:
          "The behaviour of people tells us more about the person's culture.",
        answers: ["True", "False"],
        correct: 0,
      },
      {
        question: "The food eaten by the Akan include....",
        answers: ["Fufu", "Rice", "Banku"],
        correct: 0,
      },
      {
        question: "What traditional cloth/dress do the akans wear ?",
        answers: ["Kente", "Suite", "None"],
        correct: 0,
      },
      {
        question:
          "History tells us important this that had happened in the past.",
        answers: ["True", "False", "None"],
        correct: 0,
      },
      {
        question:
          "Tribes found in the Akan ethnic group are .............................................................",
        answers: [
          "Asante, fante, bono",
          "Walewale, Yendi, Bimbila",
          "Anlo, Asogli, peki",
        ],
        correct: 0,
      },
      {
        question:
          "The Mole Dagbani are the ..............largest ethnic group in Ghana.",
        answers: ["First", "Second", "Third"],
        correct: 1,
      },
      {
        question: "The most important food to the Ewes is ................",
        answers: ["Akple", "Waakye", "Fufu"],
        correct: 0,
      },
      {
        question: "Akple is made of ..........................",
        answers: ["Corn", "Beans", "Cassava dough"],
        correct: 0,
      },
      {
        question:
          "Some important chiefs of the mole dagbani are the Ya-na , the Nayiri and the",
        answers: ["Bimbilla Naa", "Mole dagbani", "Gambaga"],
        correct: 0,
      },
      {
        question:
          "Languages the Mole Dagbani speak are Dagbani, Mampruli and ...........",
        answers: ["Bimbilla Naa", "Nanugli", "Gambaga"],
        correct: 1,
      },
      {
        question: "The mole Dagbani are mostly found in which region of ghana?",
        answers: ["Eastern Region", "Northern Region", "Greater Accra Region"],
        correct: 1,
      },
      {
        question: "One main food of the mole dagbani is................",
        answers: ["Fufu", "Tuo Zaafi", "Banku"],
        correct: 1,
      },
      {
        question: "The Ewe ethnic group is found in which region?",
        answers: ["Northern Region", "Western Region", "Volta Region"],
        correct: 2,
      },
      {
        question: "The traditional food of the Nzema people is ......",
        answers: ["Akyeke", "Shia", "Ningo"],
        correct: 0,
      },
      {
        question: "What is an artwork?",
        answers: [
          "A type of food",
          "A creative expression of ideas",
          "A farming tool",
          "A school subject only",
        ],
        correct: 1,
      },
      {
        question: "Which of the following is an example of artwork?",
        answers: ["Basket", "Painting", "Table", "Spoon"],
        correct: 1,
      },
      {
        question: "Art is used to express:",
        answers: [
          "Only anger",
          "Ideas and feelings",
          "Only happiness",
          "Nothing",
        ],
        correct: 1,
      },
      {
        question: "History is the study of:",
        answers: [
          "Future events",
          "Past events",
          "Present events",
          "Stories only",
        ],
        correct: 1,
      },
      {
        question: "Why do we study history?",
        answers: [
          "To forget the past",
          "To understand the past",
          "To waste time",
          "To play games",
        ],
        correct: 1,
      },
      {
        question: "Which of the following is a historical source?",
        answers: ["Mobile phone", "Book", "Television remote", "Shoe"],
        correct: 1,
      },
      {
        question: "The Akans are found mainly in:",
        answers: [
          "Northern Ghana",
          "Southern Ghana",
          "Eastern Ghana only",
          "Western Ghana only",
        ],
        correct: 1,
      },
      {
        question: "Which of these is an Akan historical site?",
        answers: [
          "Larabanga Mosque",
          "Cape Coast Castle",
          "Mole Park",
          "Tamale Market",
        ],
        correct: 1,
      },
      {
        question: "Cape Coast Castle was used for:.............",
        answers: ["Farming", "Trading slaves", "Fishing", "Schooling"],
        correct: 1,
      },
      {
        question: "Fufu is the staple food of the",
        answers: ["Ewe.", "Asante.", "Dagomba."],
        correct: 1,
      },
      {
        question: "Asesewa and Dodowa are towns in",
        answers: ["Asante.", "Krobo.", "Eweland."],
        correct: 1,
      },
      {
        question: "One of these places is noted for pot making.",
        answers: ["Accra", "Takoradi", "Pankrono"],
        correct: 2,
      },
      {
        question: "Chains, rings, earrings are called",
        answers: ["Fabrics.", "Jewellery.", "Posters."],
        correct: 1,
      },
      {
        question: "One famous painter in Ghana is",
        answers: ["Oswald Boateng.", "Ibrahim Mahama.", "Theodosia Okoh."],
        correct: 1,
      },
      {
        question: "Example of domestic animal is",
        answers: ["lion.", "antelope.", "chicken."],
        correct: 2,
      },
      {
        question: "Straw can be used to make",
        answers: ["baskets.", "rubber.", "television."],
        correct: 0,
      },
      {
        question: "All these are principles of design except",
        answers: ["Rhythm", "Proportion", "Sound"],
        correct: 2,
      },
      {
        question: "What are some objects found in the natural environment.",
        answers: ["Cats", "Cars", "Buildings"],
        correct: 0,
      },
      {
        question: "What are some objects found in the artificial environment.",
        answers: ["Cats", "Cars", "Buildings"],
        correct: 1,
      },
      {
        question: "One element of design is lines.",
        answers: ["True", "False", "None"],
        correct: 0,
      },
    ],
    middle: [
      {
        question: "A brush is used for painting.",
        answers: ["True", "False"],
        correct: 0,
      },
      {
        question: "What can you make with clay?",
        answers: ["A toy", "A house", "A shoe", "A pencil"],
        correct: 0,
      },
    ],
    upper: [
      {
        question: "What is a collage?",
        answers: [
          "A type of music",
          "Art made by pasting pieces together",
          "A kind of dance",
          "A sport",
        ],
        correct: 1,
      },
      {
        question: "Which tool is used for cutting paper?",
        answers: ["Brush", "Scissors", "Pencil", "Hammer"],
        correct: 1,
      },
    ],
    jhs: [
      {
        question: "What is rhythm in music?",
        answers: [
          "The beat of music",
          "A type of paint",
          "A drawing tool",
          "A story",
        ],
        correct: 0,
      },
      {
        question: "What is the main purpose of a poster?",
        answers: [
          "To decorate a wall and share information",
          "To eat",
          "To sleep",
          "To build houses",
        ],
        correct: 0,
      },
    ],
  },
  "core-maths": {
    displayName: "Core Mathematics",
    shs: [
      {
        question: "Solve for x: 2x + 5 = 15",
        answers: ["5", "6", "7", "8"],
        correct: 2,
      },
      {
        question: "What is 25% of 80?",
        answers: ["10", "15", "20", "25"],
        correct: 2,
      },
    ],
  },
  "elective-maths": {
    displayName: "Elective Mathematics",
    shs: [
      {
        question: "If f(x) = 2x + 3, what is f(4)?",
        answers: ["7", "8", "9", "11"],
        correct: 2,
      },
      {
        question: "What is the value of sin 90°?",
        answers: ["0", "1/2", "1", "√3/2"],
        correct: 2,
      },
    ],
  },
  "english-language": {
    displayName: "English Language",
    shs: [
      {
        question: "Choose the correct sentence: She ___ to school every day.",
        answers: ["go", "goes", "going", "gone"],
        correct: 1,
      },
      {
        question: "Which word is a conjunction?",
        answers: ["and", "quickly", "beautiful", "house"],
        correct: 0,
      },
    ],
  },
  "integrated-science": {
    displayName: "Integrated Science",
    shs: [
      {
        question: "What is the SI unit of force?",
        answers: ["Watt", "Newton", "Joule", "Ampere"],
        correct: 1,
      },
      {
        question: "Which gas is most abundant in the atmosphere?",
        answers: ["Oxygen", "Carbon dioxide", "Nitrogen", "Hydrogen"],
        correct: 2,
      },
    ],
  },
  "social-studies": {
    displayName: "Social Studies",
    shs: [
      {
        question: "What is the capital city of Ghana?",
        answers: ["Kumasi", "Accra", "Tamale", "Cape Coast"],
        correct: 1,
      },
      {
        question: "Which institution makes laws in Ghana?",
        answers: [
          "The Executive",
          "The Judiciary",
          "The Legislature",
          "The Police",
        ],
        correct: 2,
      },
    ],
  },
  economics: {
    displayName: "Economics",
    shs: [
      {
        question: "What is scarcity in economics?",
        answers: [
          "Unlimited resources",
          "Limited resources",
          "No trade",
          "No taxes",
        ],
        correct: 1,
      },
      {
        question: "What does demand mean?",
        answers: [
          "The price of goods",
          "The supply of goods",
          "The willingness to buy a product",
          "The cost of production",
        ],
        correct: 2,
      },
    ],
  },
  government: {
    displayName: "Government",
    shs: [
      {
        question: "Which arm of government interprets laws?",
        answers: ["Executive", "Legislature", "Judiciary", "Police"],
        correct: 2,
      },
      {
        question: "A constitution is a set of ________.",
        answers: ["Laws", "Books", "Schools", "Trees"],
        correct: 0,
      },
    ],
  },
  ict: {
    displayName: "ICT",
    shs: [
      {
        question: "What does ICT stand for?",
        answers: [
          "Information and Communication Technology",
          "Internet and Computer Tools",
          "Internal Computer Training",
          "Important Computer Technology",
        ],
        correct: 0,
      },
      {
        question: "Which device is used to input data into a computer?",
        answers: ["Monitor", "Keyboard", "Speaker", "Printer"],
        correct: 1,
      },
    ],
  },
};

let currentQuestionIndex = 0;
let score = 0;
let mistakes = 0;
let quizQuestions = [];
let mode = "practice";
let answeredQuestions = [];
let timerId = null;
let timeLeft = 15;
let quizTimerSeconds = 15;
let quizStarted = false;

const shsCourseCatalog = {
  "general-arts": [
    { key: "maths", label: "Core Mathematics" },
    { key: "english", label: "English Language" },
    { key: "owop", label: "Social Studies" },
    { key: "economics", label: "Economics" },
    { key: "government", label: "Government" },
    { key: "ict", label: "ICT" },
  ],
  "general-science": [
    { key: "maths", label: "Core Mathematics" },
    { key: "english", label: "English Language" },
    { key: "science", label: "Integrated Science" },
    { key: "owop", label: "Social Studies" },
    { key: "ict", label: "ICT" },
  ],
  business: [
    { key: "maths", label: "Core Mathematics" },
    { key: "english", label: "English Language" },
    { key: "economics", label: "Economics" },
    { key: "owop", label: "Business Management" },
    { key: "ict", label: "ICT" },
  ],
  "home-economics": [
    { key: "maths", label: "Core Mathematics" },
    { key: "english", label: "English Language" },
    { key: "science", label: "Food and Nutrition" },
    { key: "owop", label: "Management in Living" },
    { key: "ict", label: "ICT" },
  ],
  "visual-arts": [
    { key: "maths", label: "Core Mathematics" },
    { key: "english", label: "English Language" },
    { key: "creative", label: "General Knowledge in Art" },
    { key: "creative", label: "Graphic Design" },
    { key: "ict", label: "ICT" },
  ],
};

const subjectCatalog = {
  basic: [
    { key: "maths", label: "Mathematics" },
    { key: "science", label: "Science" },
    { key: "owop", label: "Our World Our People" },
    { key: "history", label: "History" },
    { key: "english", label: "English" },
    { key: "rme", label: "Religious & Moral Education" },
    { key: "creative", label: "Creative Arts" },
  ],
  jhs: [
    { key: "maths", label: "Mathematics" },
    { key: "science", label: "Science" },
    { key: "owop", label: "Our World Our People" },
    { key: "history", label: "History" },
    { key: "english", label: "English" },
    { key: "rme", label: "Religious & Moral Education" },
    { key: "creative", label: "Creative Arts" },
  ],
  shs: [
    { key: "maths", label: "Core Mathematics" },
    { key: "maths", label: "Elective Mathematics" },
    { key: "english", label: "English Language" },
    { key: "science", label: "Integrated Science" },
    { key: "owop", label: "Social Studies" },
    { key: "economics", label: "Economics" },
    { key: "government", label: "Government" },
    { key: "ict", label: "ICT" },
  ],
};

function getSubjectKey() {
  const params = new URLSearchParams(window.location.search);
  return params.get("subject")?.toLowerCase();
}

function getClassKey() {
  const params = new URLSearchParams(window.location.search);
  return params.get("class")?.toLowerCase() || "basic1";
}

function getDepartmentKey() {
  const params = new URLSearchParams(window.location.search);
  return params.get("department")?.toLowerCase() || "";
}

function getCourseKey() {
  const params = new URLSearchParams(window.location.search);
  return params.get("course")?.toLowerCase() || "general-arts";
}

function getSyllabusDepartment(syllabusKey) {
  if (syllabusKey === "jhs") return "jhs";
  if (syllabusKey.startsWith("shs-")) return "shs";
  return "basic";
}

function getDepartmentFromClass(classKey) {
  if (classKey.startsWith("shs")) return "shs";
  if (classKey.startsWith("jhs")) return "jhs";
  return "basic";
}

function normalizeDepartmentKey(value, fallback = "basic") {
  const department = String(value || "").trim().toLowerCase();
  if (department === "basic" || department.includes("basic")) return "basic";
  if (department === "jhs" || department.includes("junior")) return "jhs";
  if (department === "shs" || department.includes("senior")) return "shs";
  return fallback;
}

function getSubjectCatalogForClass(classKey, course = getCourseKey()) {
  const department = getDepartmentFromClass(classKey);
  if (department === "shs") {
    return shsCourseCatalog[course] || shsCourseCatalog["general-arts"];
  }
  return subjectCatalog[department] || subjectCatalog.basic;
}

function shuffleArray(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildShuffledQuestion(question) {
  const answerItems = question.answers.map((answer, index) => ({
    answer,
    index,
  }));
  const shuffledItems = shuffleArray(answerItems);
  const correctAnswer = question.answers[question.correct];
  const correctIndex = shuffledItems.findIndex(
    (item) => item.answer === correctAnswer,
  );

  return {
    ...question,
    answers: shuffledItems.map((item) => item.answer),
    correct: correctIndex,
  };
}

function buildQuizQuestionSet(baseQuestions, total = 20) {
  if (!Array.isArray(baseQuestions) || baseQuestions.length === 0) return [];

  const questions = [];
  while (questions.length < total) {
    questions.push(...shuffleArray(baseQuestions).map(buildShuffledQuestion));
  }
  return questions.slice(0, total);
}

function renderSubjectLinks(selectedClass, container) {
  const subjectsForClass = getSubjectCatalogForClass(selectedClass);
  container.innerHTML = "";

  const intro = document.createElement("p");
  intro.className = "select";
  intro.textContent = `${classLabels[selectedClass] || "Your class"} has ${subjectsForClass.length} subject options ready for you.`;
  container.appendChild(intro);

  subjectsForClass.forEach((subject) => {
    const item = document.createElement("p");
    item.className = "select";

    const link = document.createElement("a");
    const courseParam = selectedClass.startsWith("shs")
      ? `&course=${getCourseKey()}`
      : "";
    link.href = `quiz.html?subject=${subject.key}&class=${selectedClass}${courseParam}`;
    link.className = "p btns subject-link";
    link.textContent = subject.label;

    item.appendChild(link);
    container.appendChild(item);
  });
}

function setupSubjectLinks() {
  const classSelect = document.getElementById("class-select");
  const subjectLinksContainer = document.getElementById("subject-links");
  const departmentMessage = document.getElementById("department-message");

  if (!classSelect || !subjectLinksContainer) {
    return;
  }

  const selectedClass = getClassKey();
  classSelect.value = selectedClass;

  if (departmentMessage) {
    const department = getDepartmentFromClass(classSelect.value);
    departmentMessage.textContent =
      department === "shs"
        ? "Senior High students can choose from SHS subjects such as Core Mathematics and Economics."
        : "Choose a subject for your class and start a fresh quiz session.";
  }

  renderSubjectLinks(selectedClass, subjectLinksContainer);

  classSelect.addEventListener("change", () => {
    const activeClass = classSelect.value;
    renderSubjectLinks(activeClass, subjectLinksContainer);

    if (departmentMessage) {
      const department = getDepartmentFromClass(activeClass);
      departmentMessage.textContent =
        department === "shs"
          ? "Senior High students can choose from SHS subjects such as Core Mathematics and Economics."
          : "Choose a subject for your class and start a fresh quiz session.";
    }
  });
}

function updateDepartmentVisual(selectedDepartment) {
  const visualContainer = document.getElementById("department-visual");
  if (!visualContainer) return;

  const visuals = {
    basic: {
      title: "Basic learners grow through joyful practice.",
      image:
        "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=900&q=80",
    },
    jhs: {
      title: "JHS learners build confidence with guided revision.",
      image:
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80",
    },
    shs: {
      title: "SHS students prepare for bigger academic goals.",
      image:
        "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80",
    },
  };

  const selected = visuals[selectedDepartment] || visuals.basic;
  visualContainer.innerHTML = `
    <img src="${selected.image}" alt="${selected.title}" />
    <p class="select">${selected.title}</p>
  `;
}

function setupDepartmentPage() {
  const departmentSelect = document.getElementById("department-select");
  const classSelect = document.getElementById("class-select");
  const courseSelect = document.getElementById("course-select");
  const courseLabel = document.getElementById("course-label");
  const continueBtn = document.getElementById("continue-btn");
  const departmentMessage = document.getElementById("department-message");

  if (!departmentSelect || !classSelect || !continueBtn) {
    return;
  }

  const optionsByDepartment = {
    basic: ["basic1", "basic2", "basic3", "basic4", "basic5", "basic6"],
    jhs: ["jhs1", "jhs2", "jhs3"],
    shs: ["shs1", "shs2", "shs3"],
  };

  function updateCourseVisibility() {
    if (courseSelect && courseLabel) {
      const showCourse = departmentSelect.value === "shs";
      courseSelect.style.display = showCourse ? "inline-block" : "none";
      courseLabel.style.display = showCourse ? "inline-block" : "none";
    }
  }

  function updateClassOptions() {
    const selectedDepartment = optionsByDepartment[departmentSelect.value]
      ? departmentSelect.value
      : "basic";
    departmentSelect.value = selectedDepartment;
    classSelect.innerHTML = "";

    optionsByDepartment[selectedDepartment].forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = classLabels[value] || value;
      classSelect.appendChild(option);
    });

    updateCourseVisibility();

    if (departmentMessage) {
      departmentMessage.textContent =
        selectedDepartment === "shs"
          ? "Senior High students can pick their course first, then choose the subjects they study."
          : selectedDepartment === "jhs"
            ? "Junior High students can move to the subject page for JHS questions."
            : "Basic students can move to the subject page for basic-level questions.";
    }

    updateDepartmentVisual(selectedDepartment);
  }

  const accountDepartment = normalizeDepartmentKey(
    getStudentSession()?.department,
    "",
  );
  const initialDepartment =
    accountDepartment || normalizeDepartmentKey(getDepartmentKey(), "basic");
  const initialClass = getClassKey();
  const initialCourse = getCourseKey();
  departmentSelect.value = initialDepartment;
  updateClassOptions();
  classSelect.value = optionsByDepartment[initialDepartment].includes(
    initialClass,
  )
    ? initialClass
    : optionsByDepartment[initialDepartment][0];
  updateDepartmentVisual(initialDepartment);
  if (courseSelect) {
    courseSelect.value = initialCourse;
  }

  departmentSelect.addEventListener("change", updateClassOptions);
  continueBtn.addEventListener("click", (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    params.set("class", classSelect.value);
    params.set("department", departmentSelect.value);
    let syllabus = "ges";
    if (departmentSelect.value === "jhs") syllabus = "jhs";
    if (departmentSelect.value === "shs" && courseSelect) {
      params.set("course", courseSelect.value);
      syllabus = `shs-${courseSelect.value}`;
    }
    params.set("syllabus", syllabus);
    const student = getStudentSession();
    if (student) {
      localStorage.setItem(
        STUDENT_SESSION_KEY,
        JSON.stringify({
          ...student,
          department: departmentSelect.value,
          className: classSelect.value,
        }),
      );
    }
    window.location.href = `learning.html?${params.toString()}`;
  });
}

function setupQuizPage() {
  const quizSetup = document.getElementById("quiz-setup");
  const startBtn = document.getElementById("start-quiz-btn");
  const timerSelect = document.getElementById("timer-select");
  const setupClassLabel = document.getElementById("setup-class-label");
  const setupSubjectLabel = document.getElementById("setup-subject-label");
  const activeArea = document.getElementById("quiz-active-area");
  const departmentSelect = document.getElementById("quiz-department-select");
  const classSelect = document.getElementById("quiz-class-select");
  const subjectSelect = document.getElementById("quiz-subject-select");
  const courseSelect = document.getElementById("quiz-course-select");
  const courseLabel = document.getElementById("quiz-course-label");
  const accountDepartment = normalizeDepartmentKey(
    getStudentSession()?.department,
    "",
  );

  if (!quizSetup || !startBtn || !timerSelect) {
    return;
  }

  const classesByDepartment = {
    basic: ["basic1", "basic2", "basic3", "basic4", "basic5", "basic6"],
    jhs: ["jhs1", "jhs2", "jhs3"],
    shs: ["shs1", "shs2", "shs3"],
  };

  const updateSubjects = (useRequestedSubject = false) => {
    const options = getSubjectCatalogForClass(
      classSelect.value,
      courseSelect?.value,
    );
    const currentSubject = subjectSelect.value;
    subjectSelect.innerHTML = options
      .map(
        (subject) => `<option value="${subject.key}">${subject.label}</option>`,
      )
      .join("");
    const requestedSubject = getSubjectKey();
    if (options.some((subject) => subject.key === currentSubject)) {
      subjectSelect.value = currentSubject;
    } else if (
      useRequestedSubject &&
      options.some((subject) => subject.key === requestedSubject)
    ) {
      subjectSelect.value = requestedSubject;
    }
    const selected = subjects[subjectSelect.value];
    if (setupClassLabel)
      setupClassLabel.textContent =
        classLabels[classSelect.value] || "Your class";
    if (setupSubjectLabel)
      setupSubjectLabel.textContent = selected
        ? `${selected.displayName} is ready. Now choose a timer.`
        : "Choose a subject first.";
  };

  const updateCourseVisibility = () => {
    const isShs = departmentSelect.value === "shs";
    if (courseSelect) courseSelect.hidden = !isShs;
    if (courseLabel) courseLabel.hidden = !isShs;
    if (courseSelect && isShs && !courseSelect.value)
      courseSelect.value = getCourseKey();
  };

  const updateClasses = () => {
    const options =
      classesByDepartment[departmentSelect.value] || classesByDepartment.basic;
    classSelect.innerHTML = options
      .map(
        (classKey) =>
          `<option value="${classKey}">${classLabels[classKey]}</option>`,
      )
      .join("");
    const requestedClass = getClassKey();
    if (options.includes(requestedClass)) classSelect.value = requestedClass;
    updateCourseVisibility();
    updateSubjects(true);
  };

  if (departmentSelect && classSelect && subjectSelect) {
    const requestedDepartment = accountDepartment || getDepartmentKey();
    departmentSelect.value = classesByDepartment[requestedDepartment]
      ? requestedDepartment
      : getDepartmentFromClass(getClassKey());
    updateClasses();
    departmentSelect.addEventListener("change", updateClasses);
    classSelect.addEventListener("change", () => updateSubjects(false));
    courseSelect?.addEventListener("change", () => {
      updateSubjects(false);
    });
    subjectSelect.addEventListener("change", () => updateSubjects(false));
  }

  startBtn.addEventListener("click", () => {
    if (departmentSelect && classSelect && subjectSelect) {
      const params = new URLSearchParams({
        department: departmentSelect.value,
        class: classSelect.value,
        subject: subjectSelect.value,
      });
      if (departmentSelect.value === "shs")
        params.set("course", courseSelect?.value || "general-arts");
      window.history.replaceState({}, "", `quiz.html?${params.toString()}`);
      const student = getStudentSession();
      if (student) {
        localStorage.setItem(
          STUDENT_SESSION_KEY,
          JSON.stringify({
            ...student,
            department: departmentSelect.value,
            className: classSelect.value,
          }),
        );
      }
    }
    quizTimerSeconds = Number(timerSelect.value) || 15;
    quizStarted = true;
    if (activeArea) {
      activeArea.style.display = "flex";
    }
    quizSetup.style.display = "none";
    setupQuiz();
  });
}

function setupQuiz() {
  const subjectKey = getSubjectKey();
  const classKey = getClassKey();
  const subjectData = subjects[subjectKey];
  const params = new URLSearchParams(window.location.search);
  mode = params.get("mode") || "practice";

  const questionEl = document.getElementById("questions");
  const answersEl = document.getElementById("answers");
  const scoreEl = document.getElementById("score");
  const feedbackEl = document.getElementById("feedback");
  const explanationEl = document.getElementById("explanation");
  const nextBtn = document.getElementById("nextbtn");
  const subjectTitle = document.getElementById("subject-title");
  const modeBadge = document.getElementById("mode-badge");
  const timerEl = document.getElementById("timer");
  const timerSelect = document.getElementById("timer-select");

  if (
    !questionEl ||
    !answersEl ||
    !scoreEl ||
    !feedbackEl ||
    !nextBtn ||
    !subjectTitle
  ) {
    return;
  }

  if (!subjectData) {
    questionEl.textContent = "Subject not found.";
    answersEl.innerHTML = `<p>Please go back and choose a valid subject.</p><p><a href=\"-index.html\" class=\"btn\">Choose subject</a></p>`;
    scoreEl.textContent = "";
    nextBtn.style.display = "none";
    return;
  }

  const levelKey = classLevels[classKey] || "early";
  const baseQuestions = subjectData[levelKey] || subjectData.early;
  quizQuestions = buildQuizQuestionSet(baseQuestions, 20);
  currentQuestionIndex = 0;
  score = 0;
  mistakes = 0;
  answeredQuestions = [];
  subjectTitle.textContent = `${subjectData.displayName} • ${classLabels[classKey] || "Class"}`;
  updateScoreDisplay();
  feedbackEl.textContent = "";
  if (explanationEl) {
    explanationEl.textContent = "Explanations are shown here";
  }
  showDiagramForQuestion(quizQuestions[0]);
  if (timerEl) {
    timerEl.textContent = `Time left: ${quizTimerSeconds}s`;
  }
  if (timerSelect) {
    timerSelect.value = String(quizTimerSeconds);
  }
  if (modeBadge) {
    modeBadge.textContent =
      mode === "exam"
        ? "Exam Mode • no hints after wrong answers"
        : "Practice Mode • explanations are shown";
  }
  nextBtn.textContent = "Next Question";
  nextBtn.disabled = true;
  nextBtn.style.display = "inline-block";

  clearInterval(timerId);
  loadQuestion();
}

function updateScoreDisplay() {
  const scoreEl = document.getElementById("score");
  if (scoreEl) {
    scoreEl.textContent = `Score: ${score} / ${quizQuestions.length} • Mistakes: ${mistakes}`;
  }
}

function getExplanationForCurrentQuestion(current) {
  if (current.explanation) {
    return current.explanation;
  }
  const correctAnswer = current.answers[current.correct];
  return `The correct answer is "${correctAnswer}". ${current.question} is answered correctly when you choose ${correctAnswer} because it matches the idea being tested. Review the lesson note again and remember the reason behind it.`;
}

function startTimer() {
  const timerEl = document.getElementById("timer");
  timeLeft = quizTimerSeconds;
  if (timerEl) {
    timerEl.textContent = `Time left: ${timeLeft}s`;
  }

  clearInterval(timerId);
  timerId = setInterval(() => {
    timeLeft -= 1;
    if (timerEl) {
      timerEl.textContent = `Time left: ${timeLeft}s`;
    }

    if (timeLeft <= 0) {
      clearInterval(timerId);
      handleTimeout();
    }
  }, 1000);
}

function handleTimeout() {
  const answersEl = document.getElementById("answers");
  const feedbackEl = document.getElementById("feedback");
  const explanationEl = document.getElementById("explanation");
  const nextBtn = document.getElementById("nextbtn");
  const current = quizQuestions[currentQuestionIndex];

  if (!current) return;

  Array.from(answersEl.children).forEach((btn) => {
    btn.disabled = true;
  });

  mistakes += 1;
  feedbackEl.textContent = "⏰ Time is up! You did not answer in time.";
  explanationEl.textContent = `Explanation: ${getExplanationForCurrentQuestion(current)}`;
  updateScoreDisplay();
  nextBtn.disabled = false;
}

function loadQuestion() {
  const questionEl = document.getElementById("questions");
  const answersEl = document.getElementById("answers");
  const progressEl = document.getElementById("progress");
  const nextBtn = document.getElementById("nextbtn");

  const current = quizQuestions[currentQuestionIndex];
  questionEl.textContent = current.question;
  answersEl.innerHTML = "";

  current.answers.forEach((answer, index) => {
    const btn = document.createElement("button");
    btn.textContent = answer;
    btn.className = "answer-btn";
    btn.addEventListener("click", () => selectAnswer(btn, index));
    answersEl.appendChild(btn);
  });

  progressEl.textContent = `Question ${currentQuestionIndex + 1} of ${quizQuestions.length}`;
  nextBtn.disabled = true;
  showDiagramForQuestion(current);
  startTimer();
}

function selectAnswer(button, selectedIndex) {
  const answersEl = document.getElementById("answers");
  const feedbackEl = document.getElementById("feedback");
  const explanationEl = document.getElementById("explanation");
  const scoreEl = document.getElementById("score");
  const nextBtn = document.getElementById("nextbtn");

  clearInterval(timerId);

  const current = quizQuestions[currentQuestionIndex];
  const correctIndex = current.correct;
  const isCorrect = selectedIndex === correctIndex;

  if (isCorrect) {
    score++;
    playFeedbackSound("correct");
    button.style.background = "#4CAF50";
    feedbackEl.textContent = "😉 Correct!";
    explanationEl.textContent = "";
  } else {
    mistakes += 1;
    playFeedbackSound("wrong");
    button.style.background = "#E74C3C";
    const correctButton = answersEl.children[correctIndex];
    if (correctButton) correctButton.style.background = "#4CAF50";
    feedbackEl.textContent =
      "😡 Wrong. The correct answer is highlighted in green.";
    explanationEl.textContent = `Explanation: ${getExplanationForCurrentQuestion(current)}`;
  }

  Array.from(answersEl.children).forEach((btn) => {
    btn.disabled = true;
  });

  updateScoreDisplay();
  nextBtn.disabled = false;
}

function nextQuestion() {
  const nextBtn = document.getElementById("nextbtn");
  const feedbackEl = document.getElementById("feedback");
  const questionEl = document.getElementById("questions");
  const answersEl = document.getElementById("answers");

  if (currentQuestionIndex + 1 < quizQuestions.length) {
    currentQuestionIndex++;
    feedbackEl.textContent = "";
    if (document.getElementById("explanation")) {
      document.getElementById("explanation").textContent =
        "Explanations are shown here";
    }
    loadQuestion();
  } else {
    const summary = `Score: ${score} / ${quizQuestions.length} • Mistakes: ${mistakes}`;
    questionEl.textContent = summary;
    answersEl.innerHTML = "";
    feedbackEl.textContent = "";
    const explanationEl = document.getElementById("explanation");
    if (explanationEl) {
      explanationEl.textContent = "";
    }
    const completedSubject =
      subjects[getSubjectKey()]?.displayName || "this quiz";
    saveQuizResult(score, quizQuestions.length, completedSubject);
    renderReviewForm(completedSubject);
    const progressEl = document.getElementById("progress");
    if (progressEl) {
      progressEl.textContent = "Quiz complete";
    }
    const timerEl = document.getElementById("timer");
    if (timerEl) {
      timerEl.textContent = "";
    }
    const modeBadge = document.getElementById("mode-badge");
    if (modeBadge) {
      modeBadge.textContent = "";
    }
    const diagramArea = document.getElementById("diagram-area");
    if (diagramArea) {
      diagramArea.innerHTML = "";
    }
    nextBtn.textContent = "Choose another subject";
    nextBtn.disabled = false;
    nextBtn.removeEventListener("click", nextQuestion);
    nextBtn.addEventListener(
      "click",
      () => (window.location.href = "-index.html"),
    );
  }
}

function renderReviewForm(subjectLabel) {
  const reviewSection = document.getElementById("review-section");
  if (!reviewSection) return;

  const label = (subjectLabel || "this subject").toString();
  reviewSection.innerHTML = `
    <div class="review-card">
      <h3>Leave a review</h3>
      <p>Tell us how ${label} felt for you. Your feedback helps future learners choose their path with confidence.</p>
      <div class="review-stars" aria-label="Rating">
        ${[1, 2, 3, 4, 5].map((value) => `<button type="button" class="review-star" data-value="${value}">★</button>`).join("")}
      </div>
      <form class="review-form" id="review-form">
        <input id="review-name" type="text" placeholder="Your name" required />
        <textarea id="review-text" placeholder="Share what helped you most" required></textarea>
        <button type="submit" class="small-btn">Submit review</button>
      </form>
      <p id="review-feedback" class="feedback-text">Your opinion matters to the Y_Cohde community.</p>
    </div>
  `;

  let selectedRating = 5;
  const currentStudent = getStudentSession();
  const nameInput = reviewSection.querySelector("#review-name");
  if (currentStudent?.name && nameInput) nameInput.value = currentStudent.name;
  reviewSection.querySelectorAll(".review-star").forEach((button) => {
    button.addEventListener("click", () => {
      selectedRating = Number(button.dataset.value);
      reviewSection.querySelectorAll(".review-star").forEach((star) => {
        star.classList.toggle(
          "active",
          Number(star.dataset.value) <= selectedRating,
        );
      });
    });
  });

  const form = reviewSection.querySelector("#review-form");
  const feedback = reviewSection.querySelector("#review-feedback");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = reviewSection.querySelector("#review-text").value.trim();
    const studentName =
      reviewSection.querySelector("#review-name").value.trim() || "A student";
    if (!text) return;

    const reviews = JSON.parse(localStorage.getItem("ycohde-reviews") || "[]");
    reviews.push({
      rating: selectedRating,
      text,
      subject: label,
      studentName,
      createdAt: new Date().toLocaleString(),
    });
    localStorage.setItem("ycohde-reviews", JSON.stringify(reviews));

    if (feedback) {
      feedback.textContent =
        "Thanks for your review. Your feedback has been saved.";
    }
    form.reset();
    renderPublicReviews();
  });
}

function renderPublicReviews() {
  const reviewList = document.getElementById("public-reviews-list");
  if (!reviewList) return;

  const reviews = JSON.parse(localStorage.getItem("ycohde-reviews") || "[]")
    .slice(-6)
    .reverse();

  if (!reviews.length) {
    reviewList.innerHTML =
      '<p class="empty-state">No reviews yet. Complete a quiz and be the first to leave one.</p>';
    return;
  }

  reviewList.innerHTML = reviews
    .map(
      (review) => `
    <article class="review-post">
      <strong>${review.studentName}</strong>
      <div class="stars">${"★".repeat(review.rating)}</div>
      <p>${review.text}</p>
      <small>${review.subject} • ${review.createdAt}</small>
    </article>
  `,
    )
    .join("");
}

function escapeCommunityText(value) {
  const element = document.createElement("div");
  element.textContent = value || "";
  return element.innerHTML;
}

function setupCommunityPage() {
  const communityList = document.getElementById("community-list");
  if (!communityList) return;

  const staffPostsSection = document.createElement("section");
  staffPostsSection.className = "staff-posts-section page-panel";
  staffPostsSection.innerHTML =
    '<div class="panel-header"><p class="eyebrow">Staff updates</p><h2>Posts from your school team</h2></div><div class="staff-post-list"></div>';
  communityList
    .closest(".page-panel")
    ?.insertAdjacentElement("beforebegin", staffPostsSection);
  const staffPostList = staffPostsSection.querySelector(".staff-post-list");
  let staffPosts = [];
  try {
    staffPosts = JSON.parse(localStorage.getItem(STAFF_POSTS_KEY) || "[]");
  } catch {
    /* empty */
  }
  staffPostList.innerHTML = staffPosts.length
    ? staffPosts
        .map((post) => {
          const isAdministrator = post.role === "administrator";
          const roleLabel = isAdministrator ? "Administrator" : "Teacher";
          const photo = post.profilePicture || "picture in coat.jpeg";
          return `<article class="staff-post"><img class="staff-post-avatar" src="${escapeCommunityText(photo)}" alt="Profile picture of ${escapeCommunityText(post.author || roleLabel)}" onerror="this.src='picture in coat.jpeg'"><div class="staff-post-content"><div class="staff-post-heading"><div><h3>${escapeCommunityText(post.author || roleLabel)}</h3><p>${roleLabel} · ${escapeCommunityText(post.school || "Y_Cohde Academy")}</p></div><small>${new Date(post.createdAt).toLocaleDateString()}</small></div><p>${escapeCommunityText(post.text || "Shared a new learning update.")}</p></div></article>`;
        })
        .join("")
    : '<p class="empty-state">No teacher or administrator posts yet.</p>';

  const communityHighlights = [
    {
      name: "Ama K.",
      className: "Basic 5",
      rating: 5,
      text: "The topic lessons make revision easy to follow.",
      photo: "https://i.pravatar.cc/120?img=47",
    },
    {
      name: "Kwame A.",
      className: "JHS 2",
      rating: 5,
      text: "I like choosing my class and timer before each quiz.",
      photo: "https://i.pravatar.cc/120?img=12",
    },
    {
      name: "Esi B.",
      className: "SHS 1",
      rating: 4,
      text: "The short questions help me check what I have learned.",
      photo: "https://i.pravatar.cc/120?img=32",
    },
  ];
  const savedReviews = JSON.parse(
    localStorage.getItem("ycohde-reviews") || "[]",
  )
    .slice(-6)
    .reverse()
    .map((review, index) => ({
      name: review.studentName || "Y_Cohde student",
      className: review.subject || "Learner",
      rating: Number(review.rating) || 5,
      text: review.text || "Shared a learning review.",
      photo: `https://i.pravatar.cc/120?img=${20 + index}`,
    }));
  const students = [...savedReviews, ...communityHighlights];
  communityList.innerHTML = students
    .map(
      (student) => `<article class="community-card">
    <img class="community-avatar" src="${student.photo}" alt="Profile picture of ${escapeCommunityText(student.name)}" />
    <div class="community-card-content"><div class="community-name-row"><div><h3>${escapeCommunityText(student.name)}</h3><p>${escapeCommunityText(student.className)}</p></div><span class="community-rating" aria-label="${student.rating} out of 5 stars">${"★".repeat(student.rating)}${"☆".repeat(5 - student.rating)}</span></div><p class="community-review">“${escapeCommunityText(student.text)}”</p></div>
  </article>`,
    )
    .join("");
}

function setupEngagementFeatures() {
  const newsletterForm = document.getElementById("newsletter-form");
  const newsletterStatus = document.getElementById("newsletter-status");
  const shareBtn = document.getElementById("share-btn");
  const recommendBtn = document.getElementById("recommend-btn");
  const shareFeedback = document.getElementById("share-feedback");
  const reminderBtn = document.getElementById("reminder-btn");
  const reminderStatus = document.getElementById("reminder-status");
  const reminderSelect = document.getElementById("reminder-select");

  if (newsletterForm && newsletterStatus) {
    newsletterForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const emailInput = document.getElementById("newsletter-email");
      if (emailInput && emailInput.value.trim()) {
        const email = emailInput.value.trim().toLowerCase();
        const subscribers = JSON.parse(
          localStorage.getItem(PUSH_SUBSCRIBERS_KEY) || "[]",
        );
        if (!subscribers.includes(email)) subscribers.push(email);
        localStorage.setItem(PUSH_SUBSCRIBERS_KEY, JSON.stringify(subscribers));
        newsletterStatus.textContent = `Thanks! ${email} will receive website updates on this device.`;
        if ("Notification" in window && Notification.permission === "default")
          Notification.requestPermission();
        emailInput.value = "";
      }
    });
  }

  if (shareBtn && shareFeedback) {
    shareBtn.addEventListener("click", async () => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: "Y_Cohde Study Page",
            text: "Check out this learning platform for students.",
            url: window.location.href,
          });
          shareFeedback.textContent = "Thanks for sharing Y_Cohde with others.";
        } catch (error) {
          shareFeedback.textContent =
            "Sharing was cancelled, but the idea is still great.";
        }
      } else {
        shareFeedback.textContent =
          "Copy the page link to share it with a friend.";
      }
    });
  }

  if (recommendBtn && shareFeedback) {
    recommendBtn.addEventListener("click", () => {
      shareFeedback.textContent =
        "Recommended! Keep learning and invite a friend to join the next quiz.";
    });
  }

  if (reminderBtn && reminderStatus && reminderSelect) {
    reminderBtn.addEventListener("click", () => {
      const minutes = reminderSelect.value;
      reminderStatus.textContent = `Reminder set for ${minutes} minutes from now. Return to your study plan soon.`;
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Y_Cohde reminder", {
          body: `Time to continue studying for ${minutes} minutes.`,
        });
      } else if (
        "Notification" in window &&
        Notification.permission !== "denied"
      ) {
        Notification.requestPermission().then(() => {
          if (Notification.permission === "granted") {
            new Notification("Y_Cohde reminder", {
              body: `Time to continue studying for ${minutes} minutes.`,
            });
          }
        });
      }
    });
  }
}

function showDiagramForQuestion(current) {
  const diagramArea = document.getElementById("diagram-area");
  if (!diagramArea) return;

  const text = (current.question || "").toLowerCase();
  if (
    text.includes("diagram") ||
    text.includes("sketch") ||
    text.includes("shape") ||
    text.includes("draw")
  ) {
    diagramArea.innerHTML = `<img src="" alt="Study diagram" />`;
  } else {
    diagramArea.innerHTML =
      "Sketch-style questions will appear here when the topic needs a visual prompt.";
  }
}

function setupMobileMenu() {
  const menuToggles = Array.from(document.querySelectorAll(".menu-toggle"));
  const siteNav = document.getElementById("site-nav");
  const sidebar = document.querySelector(".sidebar");

  if (!siteNav || !sidebar || menuToggles.length === 0) {
    return;
  }

  const closeMenu = () => {
    sidebar.classList.remove("open");
    document.body.classList.remove("menu-open");
    menuToggles.forEach((toggle) => {
      toggle.classList.remove("active");
      toggle.setAttribute("aria-expanded", "false");
    });
  };

  menuToggles.forEach((menuToggle) => {
    menuToggle.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen = sidebar.classList.toggle("open");
      document.body.classList.toggle("menu-open", isOpen);
      menuToggles.forEach((toggle) => {
        toggle.classList.toggle("active", isOpen);
        toggle.setAttribute("aria-expanded", String(isOpen));
      });
    });
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 900) {
        closeMenu();
      }
    });
  });

  document.addEventListener("click", (event) => {
    if (
      !sidebar.contains(event.target) &&
      !menuToggles.some((toggle) => toggle.contains(event.target))
    ) {
      closeMenu();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) {
      closeMenu();
    }
  });
}

function setupSimpleHamburgerMenu() {
  const button = document.querySelector(".simple-menu-toggle");
  const navigation = document.getElementById("simple-nav");
  if (!button || !navigation) return;
  button.addEventListener("click", () => {
    const open = navigation.classList.toggle("open");
    button.setAttribute("aria-expanded", String(open));
  });
  navigation.querySelectorAll("a").forEach((link) =>
    link.addEventListener("click", () => {
      navigation.classList.remove("open");
      button.setAttribute("aria-expanded", "false");
    }),
  );
}

function getContentSyllabusKey(department, className) {
  if (department === "basic") return "ges";
  if (department === "jhs") return "jhs";
  return `shs-${className || "general-arts"}`;
}

function populateContentPicker(
  departmentSelect,
  classSelect,
  subjectSelect,
  topicSelect,
  subtopicSelect,
) {
  const departmentOptions = [
    { key: "basic", label: "Basic" },
    { key: "jhs", label: "JHS" },
    { key: "shs", label: "SHS" },
  ];
  const shsCourses = [
    { key: "general-arts", label: "General Arts" },
    { key: "general-science", label: "General Science" },
    { key: "business", label: "Business" },
    { key: "home-economics", label: "Home Economics" },
    { key: "visual-arts", label: "Visual Arts" },
  ];
  const classOptions = {
    basic: ["Basic 1", "Basic 2", "Basic 3", "Basic 4", "Basic 5", "Basic 6"],
    jhs: ["JHS 1", "JHS 2", "JHS 3"],
  };
  departmentSelect.innerHTML = departmentOptions
    .map(({ key, label }) => `<option value="${key}">${label}</option>`)
    .join("");
  const refreshClasses = () => {
    const department = departmentSelect.value;
    const choices =
      department === "shs"
        ? shsCourses.map((item) => item.label)
        : classOptions[department];
    classSelect.innerHTML = choices
      .map(
        (item) =>
          `<option value="${department === "shs" ? shsCourses.find((course) => course.label === item).key : item}">${item}</option>`,
      )
      .join("");
    refreshSubjects();
  };
  const getTopics = () =>
    learningCatalog[
      getContentSyllabusKey(departmentSelect.value, classSelect.value)
    ]?.topics || learningCatalog.ges.topics;
  const refreshTopics = () => {
    const topics = getTopics();
    subjectSelect.innerHTML = Object.keys(topics)
      .map((subject) => `<option value="${subject}">${subject}</option>`)
      .join("");
    const subject = subjectSelect.value;
    topicSelect.innerHTML = Object.keys(topics[subject])
      .map((topic) => `<option value="${topic}">${topic}</option>`)
      .join("");
    refreshSubtopics();
  };
  const refreshSubtopics = () => {
    const topics = getTopics();
    const subject = subjectSelect.value;
    const topic = topicSelect.value;
    subtopicSelect.innerHTML = Object.keys(topics[subject][topic])
      .map((subtopic) => `<option value="${subtopic}">${subtopic}</option>`)
      .join("");
  };
  const refreshSubjects = () => refreshTopics();
  departmentSelect.addEventListener("change", refreshClasses);
  classSelect.addEventListener("change", refreshSubjects);
  subjectSelect.addEventListener("change", refreshTopics);
  topicSelect.addEventListener("change", refreshSubtopics);
  refreshClasses();
}

function setupContentStudio({ administrator = false } = {}) {
  const form = document.getElementById("content-studio-form");
  if (!form) return;
  // CURRICULUM EDIT: both administrators and teachers can request new names.
  // Teachers' changes remain in the approval queue until an administrator publishes them.
  const addRenameField = (id, label, afterId) => {
    if (document.getElementById(id)) return;
    const field = document.createElement("label");
    field.innerHTML = `${label}<input id="${id}" required>`;
    document
      .getElementById(afterId)
      .closest("label")
      .insertAdjacentElement("afterend", field);
  };
  addRenameField("content-subject-name", "New subject name", "content-subject");
  addRenameField("content-topic-name", "New main topic name", "content-topic");
  addRenameField(
    "content-subtopic-name",
    "New subtopic name",
    "content-subtopic",
  );
  const department = document.getElementById("content-department");
  const classSelect = document.getElementById("content-class");
  const subject = document.getElementById("content-subject");
  const topic = document.getElementById("content-topic");
  const subtopic = document.getElementById("content-subtopic");
  const lesson = document.getElementById("content-lesson");
  const video = document.getElementById("content-video");
  const imageUpload = document.getElementById("content-image-upload");
  const videoUpload = document.getElementById("content-video-upload");
  const examples = document.getElementById("content-examples");
  const questions = document.getElementById("content-questions");
  const subjectName = document.getElementById("content-subject-name");
  const topicName = document.getElementById("content-topic-name");
  const subtopicName = document.getElementById("content-subtopic-name");
  const status = document.getElementById("content-status");
  populateContentPicker(department, classSelect, subject, topic, subtopic);
  const load = () => {
    const syllabusKey = getContentSyllabusKey(
      department.value,
      classSelect.value,
    );
    const activeLesson =
      learningCatalog[syllabusKey].topics[subject.value][topic.value][
        subtopic.value
      ];
    const existing = getLessonOverride(
      syllabusKey,
      subject.value,
      topic.value,
      subtopic.value,
    );
    lesson.value = existing.lesson || activeLesson.lesson;
    video.value = existing.videoUrl || "";
    examples.value = JSON.stringify(
      existing.examples ||
        getLessonExtras(
          syllabusKey,
          subject.value,
          topic.value,
          subtopic.value,
          activeLesson,
        ).examples,
      null,
      2,
    );
    // PANEL QUESTION EDIT: this preview uses the selected department/class,
    // so staff edit the same level-appropriate questions students will see.
    questions.value = JSON.stringify(
      existing.questions ||
        getFiveQuizQuestions(activeLesson, subtopic.value, undefined, {
          department: department.value,
          className: classSelect.value,
          subject: subject.value,
        }),
      null,
      2,
    );
    subjectName.value = subject.value;
    topicName.value = topic.value;
    subtopicName.value = subtopic.value;
  };
  [department, classSelect, subject, topic, subtopic].forEach((select) =>
    select.addEventListener("change", load),
  );
  load();
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    let parsedExamples;
    let parsedQuestions;
    try {
      parsedExamples = JSON.parse(examples.value);
      if (!Array.isArray(parsedExamples)) throw new Error();
    } catch {
      status.textContent =
        "Examples must be a valid JSON list. Keep the same format shown in the field.";
      return;
    }
    try {
      parsedQuestions = JSON.parse(questions.value);
      if (
        !Array.isArray(parsedQuestions) ||
        parsedQuestions.length !== 5 ||
        !parsedQuestions.every(
          (item) =>
            Array.isArray(item) && item.length === 3 && Array.isArray(item[1]),
        )
      )
        throw new Error();
    } catch {
      status.textContent =
        "Questions must be exactly five JSON entries: [question, [answers], correctAnswerIndex].";
      return;
    }
    const originalTopic = topic.value;
    const originalSubtopic = subtopic.value;
    const originalSubject = subject.value;
    const newSubject = subjectName.value.trim();
    const newTopic = topicName.value.trim();
    const newSubtopic = subtopicName.value.trim();
    if (!newSubject || !newTopic || !newSubtopic) {
      status.textContent = "Subject, topic and subtopic names cannot be empty.";
      return;
    }
    const syllabusKey = getContentSyllabusKey(
      department.value,
      classSelect.value,
    );
    const structure = {
      syllabusKey,
      originalSubject,
      originalTopic,
      originalSubtopic,
      subject: newSubject,
      topic: newTopic,
      subtopic: newSubtopic,
    };
    const imageFile = imageUpload?.files?.[0];
    const videoFile = videoUpload?.files?.[0];
    const acceptedImages = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    const acceptedVideos = ["video/mp4", "video/webm", "video/ogg"];
    if (
      imageFile &&
      (!acceptedImages.includes(imageFile.type) ||
        imageFile.size > MAX_IMAGE_UPLOAD_BYTES)
    ) {
      status.textContent =
        "Choose a JPG, PNG, WebP or GIF picture up to 10 MB.";
      return;
    }
    if (
      videoFile &&
      (!acceptedVideos.includes(videoFile.type) ||
        videoFile.size > MAX_VIDEO_UPLOAD_BYTES)
    ) {
      status.textContent = "Choose an MP4, WebM or Ogg video up to 100 MB.";
      return;
    }
    status.textContent = "Saving uploaded media…";
    let imageMediaId = "",
      videoMediaId = "";
    try {
      [imageMediaId, videoMediaId] = await Promise.all([
        saveLessonMedia(imageFile),
        saveLessonMedia(videoFile),
      ]);
    } catch {
      status.textContent =
        "The media could not be saved in this browser. Try a smaller file or check available storage.";
      return;
    }
    const existingMedia = getLessonOverride(
      syllabusKey,
      originalSubject,
      originalTopic,
      originalSubtopic,
    );
    const change = {
      lesson: lesson.value.trim(),
      videoUrl: video.value.trim(),
      examples: parsedExamples,
      questions: parsedQuestions,
      updatedAt: new Date().toISOString(),
      updatedBy: getStudentSession()?.name || "Contributor",
    };
    // Leaving a file field empty preserves the media already attached to this lesson.
    if (imageMediaId || existingMedia.imageMediaId)
      change.imageMediaId = imageMediaId || existingMedia.imageMediaId;
    if (videoMediaId || existingMedia.videoMediaId)
      change.videoMediaId = videoMediaId || existingMedia.videoMediaId;
    if (!administrator) {
      const pending =
        JSON.parse(localStorage.getItem(PENDING_CONTENT_KEY)) || [];
      pending.push({
        key: getCatalogLessonKey(
          syllabusKey,
          newSubject,
          newTopic,
          newSubtopic,
        ),
        change,
        structure,
        teacher: getStudentSession()?.name || "Teacher",
        author: getStudentSession()?.name || "Teacher",
        role: getStudentSession()?.role || "teacher",
        school: getStudentSession()?.school || "Y_Cohde Academy",
        profilePicture: getStudentSession()?.profilePicture || "",
        text: `A new ${subject.value} lesson update is ready for students.`,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem(PENDING_CONTENT_KEY, JSON.stringify(pending));
      addSiteNotification(
        `Teacher submission from ${getStudentSession()?.name || "a teacher"} is waiting for approval.`,
        "administrator",
      );
      addSiteNotification(
        `A teacher has posted a new ${subject.value} lesson update.`,
        "students",
      );
      status.textContent =
        "Sent to the administrator for review. It will not appear to students until approved.";
      showFeatureRequestPopup("teacher-lesson-submitted");
      return;
    }
    if (!applyCatalogStructureChange(structure)) {
      status.textContent =
        "That subject, topic or subtopic name already exists.";
      return;
    }
    const all = getContentOverrides();
    delete all[
      getCatalogLessonKey(
        syllabusKey,
        originalSubject,
        originalTopic,
        originalSubtopic,
      )
    ];
    all[getCatalogLessonKey(syllabusKey, newSubject, newTopic, newSubtopic)] =
      change;
    localStorage.setItem(CONTENT_OVERRIDES_KEY, JSON.stringify(all));
    addSiteNotification(
      `A ${subject.value} lesson has been updated.`,
      "students",
    );
    const administratorSession = getStudentSession();
    addStaffPost({
      author: administratorSession?.name || "Administrator",
      role: administratorSession?.role || "administrator",
      school: administratorSession?.school || "Y_Cohde Academy",
      profilePicture: administratorSession?.profilePicture || "",
      text: `A ${subject.value} lesson has been updated for students.`,
    });
    status.textContent = "Saved and published for students in this browser.";
    showFeatureRequestPopup("administrator-lesson-published");
  });
  if (!administrator) {
    const user = getStudentSession();
    try {
      const teachers =
        JSON.parse(localStorage.getItem(CONTRIBUTING_TEACHERS_KEY)) || [];
      if (!teachers.some((teacher) => teacher.email === user.email)) {
        teachers.push({
          name: user.name,
          email: user.email,
          joinedAt: new Date().toISOString(),
        });
        localStorage.setItem(
          CONTRIBUTING_TEACHERS_KEY,
          JSON.stringify(teachers),
        );
      }
    } catch {
      /* content studio still works */
    }
  }
}

function renderPerformanceReport() {
  const container = document.getElementById("performance-report");
  if (!container) return;
  let quizHistory = [],
    lessonChecks = [];
  try {
    quizHistory = JSON.parse(localStorage.getItem(QUIZ_HISTORY_KEY)) || [];
  } catch {
    /* empty */
  }
  try {
    lessonChecks =
      JSON.parse(localStorage.getItem(LESSON_CHECK_HISTORY_KEY)) || [];
  } catch {
    /* empty */
  }
  const results = [...quizHistory, ...lessonChecks].filter(
    (item) => item.total && item.studentName,
  );
  const grouped = results.reduce((all, item) => {
    const key = `${item.studentEmail || item.studentName}|${item.subject}`;
    const record = all[key] || {
      name: item.studentName,
      subject: item.subject,
      scores: [],
      department: item.department || "",
    };
    record.scores.push((item.score / item.total) * 100);
    all[key] = record;
    return all;
  }, {});
  const needingSupport = Object.values(grouped)
    .map((item) => ({
      ...item,
      average: Math.round(
        item.scores.reduce((sum, score) => sum + score, 0) / item.scores.length,
      ),
    }))
    .filter((item) => item.average < 60)
    .sort((a, b) => a.average - b.average);
  container.innerHTML = needingSupport.length
    ? needingSupport
        .map(
          (item) =>
            `<article class="contributor-card"><strong>${item.name} · ${item.subject}</strong><span>${item.department || "Department not recorded"}</span><small>Average: ${item.average}% across ${item.scores.length} assessment${item.scores.length === 1 ? "" : "s"}. Consider a follow-up lesson.</small></article>`,
        )
        .join("")
    : '<p class="empty-state">No students are currently below 60%. Results appear here after students complete a lesson check or quiz in this browser.</p>';
}

function setupAdministratorPanel() {
  const teacherList = document.getElementById("contributing-teachers");
  if (!teacherList) return;
  setupContentStudio({ administrator: true });
  renderPerformanceReport();
  let teachers = [];
  try {
    teachers =
      JSON.parse(localStorage.getItem(CONTRIBUTING_TEACHERS_KEY)) || [];
  } catch {
    /* empty */
  }
  teacherList.innerHTML = teachers.length
    ? teachers
        .map(
          (teacher) =>
            `<article class="contributor-card"><strong>${teacher.name}</strong><span>${teacher.email}</span><small>Joined ${new Date(teacher.joinedAt).toLocaleDateString()}</small></article>`,
        )
        .join("")
    : '<p class="empty-state">No teachers have contributed yet.</p>';
  const pendingList = document.getElementById("pending-content");
  if (!pendingList) return;
  let pending = [];
  try {
    pending = JSON.parse(localStorage.getItem(PENDING_CONTENT_KEY)) || [];
  } catch {
    /* empty */
  }
  const renderPending = () => {
    pendingList.innerHTML = pending.length
      ? pending
          .map(
            (item, index) =>
              `<article class="contributor-card"><strong>${item.teacher}: ${item.key}</strong><span>Submitted ${new Date(item.createdAt).toLocaleString()}</span><button class="small-btn" data-approve="${index}">Approve and publish</button></article>`,
          )
          .join("")
      : '<p class="empty-state">No teacher edits are waiting for approval.</p>';
    pendingList.querySelectorAll("[data-approve]").forEach((button) =>
      button.addEventListener("click", () => {
        const index = Number(button.dataset.approve);
        const item = pending[index];
        if (item.structure && !applyCatalogStructureChange(item.structure)) {
          window.alert(
            "This rename cannot be approved because that subject, topic or subtopic name now exists.",
          );
          return;
        }
        const overrides = getContentOverrides();
        overrides[item.key] = item.change;
        localStorage.setItem(CONTENT_OVERRIDES_KEY, JSON.stringify(overrides));
        addStaffPost({
          author: item.author || item.teacher || "Teacher",
          role: item.role || "teacher",
          school: item.school || "Y_Cohde Academy",
          profilePicture: item.profilePicture || "",
          text: item.text || `A new lesson update is available: ${item.key}.`,
          createdAt: item.createdAt,
        });
        addSiteNotification(
          `A new lesson update is available: ${item.key}.`,
          "students",
        );
        pending.splice(index, 1);
        localStorage.setItem(PENDING_CONTENT_KEY, JSON.stringify(pending));
        renderPending();
        showFeatureRequestPopup("administrator-edit-approved");
      }),
    );
  };
  renderPending();
}

function runWhenPageIsReady(callback) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback, { once: true });
  } else {
    callback();
  }
}

if (document.getElementById("administrator-panel")) {
  runWhenPageIsReady(() => {
    if (!requireRole("administrator")) return;
    setupMobileMenu();
    setupStudentSession();
    setupAdministratorPanel();
  });
} else if (document.getElementById("teacher-studio")) {
  runWhenPageIsReady(() => {
    if (!requireRole("teacher")) return;
    setupMobileMenu();
    setupStudentSession();
    setupContentStudio();
    renderPerformanceReport();
  });
} else if (document.getElementById("department-select")) {
  runWhenPageIsReady(() => {
    if (!requireStudentLogin()) return;
    setupMobileMenu();
    setupDepartmentPage();
    setupStudentSession();
    setupSimpleHamburgerMenu();
  });
} else if (
  document.getElementById("quiz-setup") &&
  document.getElementById("quiz-active-area")
) {
  runWhenPageIsReady(() => {
    if (!requireStudentLogin()) return;
    setupMobileMenu();
    setupQuizPage();
    setupStudentSession();
    setupSimpleHamburgerMenu();
    setupEngagementFeatures();
    renderPublicReviews();
    document.getElementById("nextbtn")?.addEventListener("click", nextQuestion);
  });
} else {
  runWhenPageIsReady(() => {
    if (!requireStudentLogin()) return;
    setupMobileMenu();
    setupLearningExplorer();
    setupLearningSpace();
    setupStudentSession();
    setupSimpleHamburgerMenu();
    setupStudentDashboard();
    setupCommunityPage();
    setupSubjectLinks();
    setupEngagementFeatures();
    renderPublicReviews();
  });
}
