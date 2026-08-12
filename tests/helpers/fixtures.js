const sidebarNav = `
  <aside class="sidebar">
    <nav class="site-nav" id="site-nav">
      <a href="index.html" class="nav-item"><span>▣</span><span>Dashboard</span></a>
      <a href="-index.html" class="nav-item"><span>◧</span><span>Courses</span></a>
    </nav>
  </aside>
  <header class="site-header">
    <div class="profile-pill"><span>ST</span><div><strong>Student</strong><small>Student</small></div></div>
    <button class="menu-toggle header-menu-toggle" type="button" aria-expanded="false">☰</button>
  </header>
`;

const simpleNav = `
  <header class="simple-site-header">
    <button class="simple-menu-toggle" type="button" aria-expanded="false">☰</button>
    <nav class="simple-nav" id="simple-nav">
      <a href="index.html">Dashboard</a>
      <a href="-index.html">Courses</a>
    </nav>
  </header>
`;

const quizPage = `
  ${sidebarNav}
  <div class="quiz-controls" id="quiz-setup">
    <h3 id="setup-class-label">Choose your department</h3>
    <p id="setup-subject-label">Select your class before setting the timer.</p>
    <select id="quiz-department-select">
      <option value="basic">Basic</option>
      <option value="jhs">JHS</option>
      <option value="shs">SHS</option>
    </select>
    <select id="quiz-class-select"></select>
    <select id="quiz-subject-select"></select>
    <select id="timer-select">
      <option value="15">15 seconds</option>
      <option value="30">30 seconds</option>
      <option value="60">1 minute</option>
    </select>
    <button id="start-quiz-btn" class="small-btn">Start quiz</button>
  </div>
  <div id="quiz-active-area" class="quiz-active-area" style="display: none">
    <div id="progress"></div>
    <div id="timer"></div>
    <h3 id="subject-title">Quiz</h3>
    <div id="diagram-area"></div>
    <div id="questions"></div>
    <div id="answers"></div>
    <div id="feedback"></div>
    <div id="explanation">Explanations are shown here</div>
    <div id="mode-badge"></div>
    <div id="score"></div>
    <div id="review-section"></div>
    <button id="nextbtn" class="btn">Next Question</button>
  </div>
`;

const departmentPage = `
  ${sidebarNav}
  <select id="department-select">
    <option value="basic">Basic</option>
    <option value="jhs">JHS</option>
    <option value="shs">SHS</option>
  </select>
  <select id="class-select"></select>
  <label id="course-label" style="display: none">Course</label>
  <select id="course-select" style="display: none">
    <option value="general-arts">General Arts</option>
    <option value="general-science">General Science</option>
    <option value="business">Business</option>
  </select>
  <button id="continue-btn" class="small-btn">Continue</button>
  <p id="department-message"></p>
  <div id="department-visual"></div>
`;

const learningPage = `
  ${sidebarNav}
  <section class="page-panel" id="learning-space"></section>
  <div class="understanding-modal" id="understanding-modal">
    <button id="understood-yes">Yes, I understand</button>
    <button id="understood-no">Not yet</button>
  </div>
`;

const dashboardPage = `
  ${sidebarNav}
  <div id="learning-explorer"></div>
  <div id="community-list"></div>
  <div id="public-reviews-list"></div>
  <button type="button" id="share-btn">Share this page</button>
  <button type="button" id="recommend-btn">Recommend to a friend</button>
  <p id="share-feedback"></p>
  <form id="newsletter-form"><input type="email" id="newsletter-email" /><button type="submit">Notify me</button></form>
  <p id="newsletter-status"></p>
  <select id="reminder-select"><option value="20">20</option><option value="45">45</option></select>
  <button type="button" id="reminder-btn">Set reminder</button>
  <p id="reminder-status"></p>
`;

const subjectLinksPage = `
  <select id="class-select">
    <option value="basic1">Basic 1</option>
    <option value="jhs2">JHS 2</option>
    <option value="shs1">SHS 1</option>
  </select>
  <div id="subject-links"></div>
  <p id="department-message"></p>
`;

module.exports = {
  sidebarNav,
  simpleNav,
  quizPage,
  departmentPage,
  learningPage,
  dashboardPage,
  subjectLinksPage
};
