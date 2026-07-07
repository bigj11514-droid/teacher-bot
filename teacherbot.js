console.log("Teacher Bot loaded");

const subjects = {
  maths: {
    displayName: "Mathematics",
    questions: [
      {
        question: "What is 5 + 3?",
        answers: ["6", "7", "8", "9"],
        correct: 2
      },
      {
        question: "What is 7 x 2?",
        answers: ["12", "14", "16", "10"],
        correct: 1
      },
      {
        question: "Which shape has 4 equal sides?",
        answers: ["Triangle", "Circle", "Square", "Rectangle"],
        correct: 2
      }
    ]
  },
  science: {
    displayName: "Science",
    questions: [
      {
        question: "What do plants need to make food?",
        answers: ["Water, sunlight and air", "Shoes and pencils", "Salt and sugar", "Paper and ink"],
        correct: 0
      },
      {
        question: "What is the chemical name for water?",
        answers: ["CO2", "H2O", "O2", "NaCl"],
        correct: 1
      },
      {
        question: "Which organ pumps blood around the body?",
        answers: ["Lung", "Brain", "Heart", "Stomach"],
        correct: 2
      }
    ]
  },
  owop: {
    displayName: "Our World Our People",
    questions: [
      {
        question: "On which continent is Ghana located?",
        answers: ["Asia", "Africa", "Europe", "South America"],
        correct: 1
      },
      {
        question: "Which of these is a natural resource?",
        answers: ["Water", "Car", "Computer", "Book"],
        correct: 0
      },
      {
        question: "Which planet do we live on?",
        answers: ["Mars", "Earth", "Venus", "Jupiter"],
        correct: 1
      }
    ]
  },
  history: {
    displayName: "History",
    questions: [
      {
        question: "Who was the first President of Ghana?",
        answers: ["Kwame Nkrumah", "Jerry Rawlings", "John Mahama", "Kofi Annan"],
        correct: 0
      },
      {
        question: "A timeline is used to show what?",
        answers: ["Shapes and colors", "Events in order", "Math problems", "Weather forecasts"],
        correct: 1
      },
      {
        question: "What is an important national symbol?",
        answers: ["Flag", "Table", "Shoe", "Plate"],
        correct: 0
      }
    ]
  },
  english: {
    displayName: "English",
    questions: [
      {
        question: "Choose the correct plural form of 'child'.",
        answers: ["Childs", "Children", "Childes", "Child"],
        correct: 1
      },
      {
        question: "Which word is a verb?",
        answers: ["Run", "Blue", "Happy", "Dog"],
        correct: 0
      },
      {
        question: "What is the opposite of 'hot'?",
        answers: ["Wet", "Cold", "Tall", "Fast"],
        correct: 1
      }
    ]
  },
  rme: {
    displayName: "Religious and Moral Education",
    questions: [
      {
        question: "Which value means always telling the truth?",
        answers: ["Kindness", "Honesty", "Greed", "Laziness"],
        correct: 1
      },
      {
        question: "What should you do when someone is sad?",
        answers: ["Ignore them", "Laugh", "Help and listen", "Push them"],
        correct: 2
      },
      {
        question: "Which is a good way to treat others?",
        answers: ["Poorly", "Rudely", "Respectfully", "Carelessly"],
        correct: 2
      }
    ]
  },
  creative: {
    displayName: "Creative Arts",
    questions: [
      {
        question: "Which is a primary colour?",
        answers: ["Green", "Purple", "Red", "Pink"],
        correct: 2
      },
      {
        question: "What do you need to draw with?",
        answers: ["Knife", "Pencil", "Spoon", "Phone"],
        correct: 1
      },
      {
        question: "Which item is used for painting?",
        answers: ["Brush", "Fork", "Ruler", "Scissors"],
        correct: 0
      }
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

function setupQuiz() {
  const subjectKey = getSubjectKey();
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

  quizQuestions = subjectData.questions;
  currentQuestionIndex = 0;
  score = 0;
  subjectTitle.textContent = subjectData.displayName;
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

  Array.from(answersEl.children).forEach(btn => {
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
    setupQuiz();
    document.getElementById("nextbtn").addEventListener("click", nextQuestion);
  });
}

console.log("Quiz script ready");
