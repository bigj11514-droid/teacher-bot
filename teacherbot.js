console.log("Teacher Bot loaded");

const classLevels = {
  basic1: "early",
  basic2: "early",
  basic3: "middle",
  basic4: "middle",
  basic5: "upper",
  basic6: "upper",
  jhs1: "jhs",
  jhs2: "jhs",
  jhs3: "jhs"
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
  jhs3: "JHS 3"
};

const subjects = {
  maths: {
    displayName: "Mathematics",
    early: [
      { question: "What is 1 + 1?", answers: ["1", "2", "3", "4"], correct: 1 },
      { question: "How many sides does a triangle have?", answers: ["2", "3", "4", "5"], correct: 1 },
      { question: "What is the number name for 254?", answers: ["Two five four", "Two hundred and five four", "Two hundred and fifty four", "Two hundred fifty four"], correct: 2 },
      { question: "What is the place value of the number 7 in 376?", answers: ["Once", "Tense", "Hundreds", "Thousand"], correct: 1 },
      { question: "What is the number name for Six Hnndred and Forty Six?", answers: ["640", "604", "646", "6,046"], correct: 2 },
      { question: "If Abena has 10 pencils and she gives 5 pencils to Dean. How many pencils does she have?", answers: ["20", "10", "4", "5"], correct: 3 },
      { question: "Skip count forward by 10s. 10,20,30,40,........", answers: ["60", "70", "50", "40"], correct: 2 },
      { question: "What is the number name for 25?", answers: ["Twenty Five", "Twenty and five", "Two hundred and five", "Two five"], correct: 0 },
      { question: "What is the value of 7 in 172?", answers: ["Ones", "Tense", "Hundreds", "Thousands"], correct: 1 },
      { question: "Expand 456", answers: ["400 + 50 + 6", "40 + 5 + 6", "400 + 5 + 6", "400 + 60 + 5"], correct: 0 },
      { question: "Compare 56......65", answers: [">", "<", "=", "none"], correct: 1 },
      { question: "How is 245 written in place values?", answers: ["2 ones, 4 tens, 5 hundreds ", "2 hundreds, 4 tens, 5 ones", "2 tens, 5 hundreds, 4 ones", "5 thousdands"], correct: 1 },
      { question: "What is 20 + 30?", answers: ["53", "23", "50", "60"], correct: 2 },
      { question: "what is the correct answer for 35 + 25.", answers: ["23", "37", "45", "60"], correct: 3 },
      { question: "Where is 150 on the number line?", answers: ["between 0 and 100", "between 100 and 200", "between 200 and 300", "between 300 and 400"], correct: 1 },
      { question: "Which is greater? 78 or 87?", answers: ["78", "34", "87", "80"], correct: 2 },
      { question: "Which is smaller? 120 or 102", answers: ["102", "122", "123", "120"], correct: 0 },
      { question: "What is the number 600 + 40 + 2?", answers: ["602", "632", "642", "652"], correct: 2 },
      { question: "Arrange in Ascending order", answers: ["300, 200, 150, 100", "100, 150, 200, 300", "150, 100, 200, 300", "400, 150, 200, 300"], correct: 1 },
      { question: "Find the missing value.20 - 12 = .........", answers: ["2", "3", "4", "5"], correct: 0 },
      { question: "Find the missing value. 8 + ...... = 24", answers: ["13", "22", "15", "16"], correct: 3 },
      { question: "Fill in the space with = or ≠. 12 + 10 ..........23", answers: ["=", "<", "≠", ">"], correct: 2 },
      { question: "what is the correct answer for 35 + 25.", answers: ["23", "37", "45", "60"], correct: 3 },
      { question: "Where is 150 on the number line?", answers: ["between 0 and 100", "between 100 and 200", "between 200 and 300", "between 300 and 400"], correct: 1 },
      { question: "Which is greater? 78 or 87?", answers: ["78", "34", "87", "80"], correct: 2 },
      { question: "Which is smaller? 120 or 102", answers: ["102", "122", "123", "120"], correct: 0 },
      { question: "What is the number 600 + 40 + 2?", answers: ["602", "632", "642", "652"], correct: 2 },
      { question: "Which is smaller? 120 or 102", answers: ["102", "122", "123", "120"], correct: 0 },
      { question: "What is the number 600 + 40 + 2?", answers: ["602", "632", "642", "652"], correct: 2 },
      { question: "Arrange in Ascending order", answers: ["300, 200, 150, 100", "100, 150, 200, 300", "150, 100, 200, 300", "400, 150, 200, 300"], correct: 1 },
      { question: "Find the missing value.20 - 12 = .........", answers: ["2", "3", "4", "5"], correct: 0 },
      { question: "Find the missing value. 8 + ...... = 24", answers: ["13", "22", "15", "16"], correct: 3 },
      { question: "What is the number name for Six Hnndred and Forty Six?", answers: ["640", "604", "646", "6,046"], correct: 2 },
      { question: "If Abena has 10 pencils and she gives 5 pencils to Dean. How many pencils does she have?", answers: ["20", "10", "4", "5"], correct: 3 },
      { question: "Skip count forward by 10s. 10,20,30,40,........", answers: ["60", "70", "50", "40"], correct: 2 },
      { question: "What is the number name for 35?", answers: ["Thirty Five", "Twenty and five", "Two hundred and five", "Three five"], correct: 0 },
      { question: "What is the value of 7 in 172?", answers: ["Ones", "Tense", "Hundreds", "Thousands"], correct: 1 },
      { question: "Expand 456", answers: ["400 + 50 + 6", "40 + 5 + 6", "400 + 5 + 6", "400 + 60 + 5"], correct: 0 },
      { question: "Compare 56......65", answers: [">", "<", "=", "none"], correct: 1 },
    ],
    middle: [
      { question: "What is 12 + 7?", answers: ["17", "19", "20", "21"], correct: 0 },
      { question: "What is 5 - 3?", answers: ["10", "2", "15", "18"], correct: 1 }
      { question: "What is 134 + 7?", answers: ["17", "19", "20", "141"], correct: 3 },
      { question: "What is 6 x 4?", answers: ["24", "12", "15", "18"], correct: 0 }
    ],
    upper: [
      { question: "What is 24 + 18?", answers: ["32", "40", "42", "44"], correct: 2 },
      { question: "What is 8 x 6?", answers: ["42", "46", "48", "50"], correct: 2 }
    ],
    jhs: [
      { question: "Solve: 3x + 4 = 19", answers: ["3", "5", "7", "9"], correct: 2 },
      { question: "What is 15% of 200?", answers: ["20", "25", "30", "35"], correct: 1 }
    ]
  },
  science: {
    displayName: "Science",
    early: [
      { question: "Plants need sunlight to make food.", answers: ["True", "False"], correct: 0 },
      { question: "What do we breathe in?", answers: ["Oxygen", "Carbon dioxide", "Smoke", "Water"], correct: 0 },
      { question: "Plants have different parts just like the human body", answers: ["True", "None", "False", "All of the above"], correct: 0 },
      { question: "Which of the following is not part of a plant?", answers: ["Root", "Trunk", "Flower", "Stem"], correct: 1 },
      { question: "All the following are parts of animals except....", answers: ["Stem", "Head", "Limbs", "Trunk"], correct: 0 },
      { question: "... are physical substances that are used for making things", answers: ["Metals", "Materials", "Matter", "Heat"], correct: 1 },
      { question: "Flowers also have different sizes and shape", answers: ["True", "None", "False", "All of the above"], correct: 0 },
      { question: "Which part of a pant holds the plant firmly to the ground", answers: ["Stem", "Leaves", "Flowers", "Root"], correct: 3 },
      { question: "The part of the plant that holds the leaves above the soli is called", answers: ["Root", "Fruit", "Flowers", "Stem"], correct: 3 },
      { question: "Which of the following materials is weak", answers: ["Metal", "Stone", "Paper", "Concrete"], correct: 2 },
      { question: "Which of the following materials is flexible", answers: ["Rubber", "Stone", "Concrete", "Glass"], correct: 0 },
      { question: "What do we breathe in?", answers: ["Oxygen", "Carbon dioxide", "Smoke", "Water"], correct: 0 },
      { question: "Plants have different parts just like the human body", answers: ["True", "None", "False", "All of the above"], correct: 0 },
      { question: "Which of the following is not part of a plant?", answers: ["Root", "Trunk", "Flower", "Stem"], correct: 1 },
      { question: "All the following are parts of animals except....", answers: ["Stem", "Head", "Limbs", "Trunk"], correct: 0 },
      { question: "... are physical substances that are used for making things", answers: ["Metals", "Materials", "Matter", "Heat"], correct: 1 },
      { question: "Flowers also have different sizes and shape", answers: ["True", "None", "False", "All of the above"], correct: 0 },
      { question: "What do we breathe in?", answers: ["Oxygen", "Carbon dioxide", "Smoke", "Water"], correct: 0 },
      { question: "Plants have different parts just like the human body", answers: ["True", "None", "False", "All of the above"], correct: 0 },
      { question: "Which of the following is not part of a plant?", answers: ["Root", "Trunk", "Flower", "Stem"], correct: 1 },
      { question: "All the following are parts of animals except....", answers: ["Stem", "Head", "Limbs", "Trunk"], correct: 0 },
      { question: "Which of the following materials is water proof", answers: ["Cotton", "Rubber", "Wood", "Concrete"], correct: 1 },
      { question: "Solve: 3x + 4 = 19", answers: ["3", "5", "7", "9"], correct: 2 },
    ],
    middle: [
      { question: "What gas do plants use to make food?", answers: ["Oxygen", "Nitrogen", "Carbon dioxide", "Helium"], correct: 2 },
      { question: "Which part of the body helps us think?", answers: ["Lungs", "Brain", "Heart", "Stomach"], correct: 1 }
    ],
    upper: [
      { question: "What is the boiling point of water at sea level?", answers: ["90°C", "100°C", "110°C", "120°C"], correct: 1 },
      { question: "Which planet is known as the Red Planet?", answers: ["Mercury", "Venus", "Mars", "Jupiter"], correct: 2 }
    ],
    jhs: [
      { question: "What is the chemical symbol for water?", answers: ["O2", "H2O", "CO2", "NaCl"], correct: 1 },
      { question: "Which organ pumps blood around the body?", answers: ["Lungs", "Kidney", "Heart", "Liver"], correct: 2 }
    ]
  },
  owop: {
    displayName: "Our World Our People",
    early: [
      { question: "Ghana is in Africa.", answers: ["True", "False"], correct: 0 },
      { question: "Which is a natural resource?", answers: ["Water", "Book", "Chair", "Pen"], correct: 0 }
    ],
    middle: [
      { question: "What is the capital city of Ghana?", answers: ["Kumasi", "Accra", "Tamale", "Cape Coast"], correct: 1 },
      { question: "Which of these is a good civic habit?", answers: ["Littering", "Helping your community", "Breaking rules", "Ignoring elders"], correct: 1 }
    ],
    upper: [
      { question: "Which continent is Ghana found in?", answers: ["Asia", "Europe", "Africa", "Australia"], correct: 2 },
      { question: "What do people use a map for?", answers: ["To cook", "To find places", "To play music", "To sleep"], correct: 1 }
    ],
    jhs: [
      { question: "Why is it important to protect the environment?", answers: ["To keep it clean and safe", "To waste more", "To make noise", "To destroy trees"], correct: 0 },
      { question: "What is one major job of a government?", answers: ["To make laws", "To bake bread", "To sell shoes", "To sleep all day"], correct: 0 }
    ]
  },
  history: {
    displayName: "History",
    early: [
      { question: "A family tree shows your family.", answers: ["True", "False"], correct: 0 },
      { question: "What is a timeline used for?", answers: ["To tell time", "To show events in order", "To count money", "To draw"], correct: 1 }
    ],
    middle: [
      { question: "Who was the first President of Ghana?", answers: ["Kwame Nkrumah", "Jerry Rawlings", "John Mahama", "Kofi Annan"], correct: 0 },
      { question: "What is an important national symbol?", answers: ["Flag", "Table", "Plate", "Radio"], correct: 0 }
    ],
    upper: [
      { question: "What does history teach us?", answers: ["Past events and lessons", "Only songs", "Only games", "Only jokes"], correct: 0 },
      { question: "Why do we learn about our ancestors?", answers: ["To remember and respect them", "To forget them", "To ignore them", "To fight them"], correct: 0 }
    ],
    jhs: [
      { question: "Which event changed Ghana's history greatly?", answers: ["The independence movement", "A football match", "A school holiday", "Rainfall"], correct: 0 },
      { question: "What can a historical source be?", answers: ["A book or object from the past", "A toy", "A snack", "A shoe"], correct: 0 }
    ]
  },
  english: {
    displayName: "English",
    early: [
      { question: "Choose the correct word: I ___ happy.", answers: ["am", "is", "are", "was"], correct: 0 },
      { question: "What is the plural of 'book'?", answers: ["books", "bookes", "booksies", "book"], correct: 0 }
    ],
    middle: [
      { question: "Which word is a verb?", answers: ["Run", "Blue", "Happy", "Table"], correct: 0 },
      { question: "What is the opposite of 'hot'?", answers: ["Wet", "Cold", "Tall", "Fast"], correct: 1 }
    ],
    upper: [
      { question: "Choose the correct sentence.", answers: ["She go to school.", "She goes to school.", "She going to school.", "She gone to school."], correct: 1 },
      { question: "Which word means 'very big'?", answers: ["Small", "Tiny", "Huge", "Thin"], correct: 2 }
    ],
    jhs: [
      { question: "What is the past tense of 'eat'?", answers: ["eated", "ate", "eaten", "eats"], correct: 1 },
      { question: "Which is a complete sentence?", answers: ["Running quickly.", "The bright sun.", "The dog barked loudly.", "Very happy."], correct: 2 }
    ]
  },
  rme: {
    displayName: "Religious and Moral Education",
    early: [
      { question: "Honesty means telling the truth.", answers: ["True", "False"], correct: 0 },
      { question: "What should you do when someone is sad?", answers: ["Ignore them", "Laugh at them", "Help and listen", "Push them"], correct: 2 }
    ],
    middle: [
      { question: "Respect means showing good manners.", answers: ["True", "False"], correct: 0 },
      { question: "Which is a good moral value?", answers: ["Greed", "Kindness", "Laziness", "Cruelty"], correct: 1 }
    ],
    upper: [
      { question: "What should you do when you make a mistake?", answers: ["Hide it", "Apologize", "Blame others", "Run away"], correct: 1 },
      { question: "Why should we help others?", answers: ["To be selfish", "To show love and care", "To cause trouble", "To ignore them"], correct: 1 }
    ],
    jhs: [
      { question: "Which value helps people live together peacefully?", answers: ["Conflict", "Justice", "Hatred", "Rudeness"], correct: 1 },
      { question: "Why is forgiveness important?", answers: ["It creates peace", "It causes harm", "It creates fear", "It creates anger"], correct: 0 }
    ]
  },
  creative: {
    displayName: "Creative Arts",
    early: [
      { question: "A pencil is used for drawing.", answers: ["True", "False"], correct: 0 },
      { question: "Which color is a primary color?", answers: ["Green", "Purple", "Red", "Orange"], correct: 2 }
    ],
    middle: [
      { question: "A brush is used for painting.", answers: ["True", "False"], correct: 0 },
      { question: "What can you make with clay?", answers: ["A toy", "A house", "A shoe", "A pencil"], correct: 0 }
    ],
    upper: [
      { question: "What is a collage?", answers: ["A type of music", "Art made by pasting pieces together", "A kind of dance", "A sport"], correct: 1 },
      { question: "Which tool is used for cutting paper?", answers: ["Brush", "Scissors", "Pencil", "Hammer"], correct: 1 }
    ],
    jhs: [
      { question: "What is rhythm in music?", answers: ["The beat of music", "A type of paint", "A drawing tool", "A story"], correct: 0 },
      { question: "What is the main purpose of a poster?", answers: ["To decorate a wall and share information", "To eat", "To sleep", "To build houses"], correct: 0 }
    ]
  }
};

let currentQuestionIndex = 0;
let score = 0;
let quizQuestions = [];

function getSubjectKey() {
  const params = new URLSearchParams(window.location.search);
  return params.get("subject")?.toLowerCase();
}

function getClassKey() {
  const params = new URLSearchParams(window.location.search);
  return params.get("class")?.toLowerCase() || "basic1";
}

function setupSubjectLinks() {
  const classSelect = document.getElementById("class-select");
  const links = document.querySelectorAll(".subject-link");

  if (!classSelect || links.length === 0) {
    return;
  }

  const selectedClass = getClassKey();
  classSelect.value = selectedClass;

  links.forEach((link) => {
    const href = new URL(link.getAttribute("href"), window.location.href);
    href.searchParams.set("class", classSelect.value);
    link.setAttribute("href", href.pathname + href.search);
  });

  classSelect.addEventListener("change", () => {
    links.forEach((link) => {
      const href = new URL(link.getAttribute("href"), window.location.href);
      href.searchParams.set("class", classSelect.value);
      link.setAttribute("href", href.pathname + href.search);
    });
  });
}

function setupQuizPage() {
  const classSelect = document.getElementById("class-select");
  const loadBtn = document.getElementById("load-class-btn");

  if (!classSelect) {
    return;
  }

  classSelect.value = getClassKey();

  if (loadBtn) {
    loadBtn.addEventListener("click", () => {
      const params = new URLSearchParams(window.location.search);
      params.set("class", classSelect.value);
      window.location.search = params.toString();
    });
  }
}

function setupQuiz() {
  const subjectKey = getSubjectKey();
  const classKey = getClassKey();
  const subjectData = subjects[subjectKey];

  const questionEl = document.getElementById("questions");
  const answersEl = document.getElementById("answers");
  const scoreEl = document.getElementById("score");
  const feedbackEl = document.getElementById("feedback");
  const nextBtn = document.getElementById("nextbtn");
  const subjectTitle = document.getElementById("subject-title");

  if (!questionEl || !answersEl || !scoreEl || !feedbackEl || !nextBtn || !subjectTitle) {
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
  quizQuestions = subjectData[levelKey] || subjectData.early;
  currentQuestionIndex = 0;
  score = 0;
  subjectTitle.textContent = `${subjectData.displayName} • ${classLabels[classKey] || "Class"}`;
  scoreEl.textContent = `Score: ${score} / ${quizQuestions.length}`;
  feedbackEl.textContent = "";
  nextBtn.textContent = "Next Question";
  nextBtn.disabled = true;
  nextBtn.style.display = "inline-block";

  loadQuestion();
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
}

function selectAnswer(button, selectedIndex) {
  const answersEl = document.getElementById("answers");
  const feedbackEl = document.getElementById("feedback");
  const scoreEl = document.getElementById("score");
  const nextBtn = document.getElementById("nextbtn");

  const current = quizQuestions[currentQuestionIndex];
  const correctIndex = current.correct;

  if (selectedIndex === correctIndex) {
    score++;
    button.style.background = "#4CAF50";
    feedbackEl.textContent = "✅ Correct!";
  } else {
    button.style.background = "#E74C3C";
    feedbackEl.textContent = `❌ Wrong. Correct answer: ${current.answers[correctIndex]}`;
    const correctButton = answersEl.children[correctIndex];
    if (correctButton) correctButton.style.background = "#4CAF50";
  }

  Array.from(answersEl.children).forEach((btn) => {
    btn.disabled = true;
  });

  scoreEl.textContent = `Score: ${score} / ${quizQuestions.length}`;
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
    loadQuestion();
  } else {
    questionEl.textContent = "Quiz finished!";
    answersEl.innerHTML = "";
    feedbackEl.textContent = `You scored ${score} out of ${quizQuestions.length}.`;
    nextBtn.textContent = "Choose another subject";
    nextBtn.disabled = false;
    nextBtn.removeEventListener("click", nextQuestion);
    nextBtn.addEventListener("click", () => window.location.href = "-index.html");
  }
}

if (document.getElementById("questions") && document.getElementById("answers")) {
  document.addEventListener("DOMContentLoaded", () => {
    setupQuizPage();
    setupQuiz();
    document.getElementById("nextbtn").addEventListener("click", nextQuestion);
  });
} else {
  document.addEventListener("DOMContentLoaded", () => {
    setupSubjectLinks();
  });
}

console.log("Quiz script ready");
