console.log("Teacher Bot loaded");

// Student sign-in for this static site. This stores only the display name in
// the browser; a real password system needs a server-side authentication API.
const STUDENT_SESSION_KEY = "ycohdeStudentSession";

function getStudentSession() {
  try {
    return JSON.parse(localStorage.getItem(STUDENT_SESSION_KEY));
  } catch {
    return null;
  }
}

function requireStudentLogin() {
  if (!getStudentSession()) {
    window.location.replace("login.html");
    return false;
  }
  return true;
}

function setupStudentSession() {
  const student = getStudentSession();
  if (!student) return;

  document.querySelectorAll(".profile-pill").forEach((profile) => {
    const initials = student.name.split(/\s+/).filter(Boolean).slice(0, 2)
      .map((part) => part[0]).join("").toUpperCase();
    const nameElement = profile.querySelector("strong");
    const initialsElement = profile.querySelector("span");
    if (nameElement) nameElement.textContent = student.name;
    if (initialsElement) initialsElement.textContent = initials || "ST";
  });

  document.querySelectorAll(".header-actions").forEach((actions) => {
    if (actions.querySelector(".logout-btn")) return;
    const logoutButton = document.createElement("button");
    logoutButton.type = "button";
    logoutButton.className = "logout-btn";
    logoutButton.textContent = "Log out";
    logoutButton.addEventListener("click", () => {
      localStorage.removeItem(STUDENT_SESSION_KEY);
      window.location.replace("login.html");
    });
    actions.append(logoutButton);
  });
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
  shs3: "shs"
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
  shs3: "SHS 3"
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
      { question: "Compare 56......65", answers: [">", "<", "=", "none"], correct: 1 }
    ],
    middle: [
      { question: "What is 12 + 7?", answers: ["17", "19", "20", "21"], correct: 0 },
      { question: "What is 5 - 3?", answers: ["10", "2", "15", "18"], correct: 1 },
      { question: "What is 134 + 7?", answers: ["17", "19", "20", "141"], correct: 3 },
      { question: "What is 6 x 4?", answers: ["24", "12", "15", "18"], correct: 0 },
      { question: "What is the value of 3 in 3546?", answers: ["Ones", "Tens", "Hundreds", "Thousand"], correct: 3 },
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
      { question: "Solve: 3x + 4 = 19", answers: ["3", "5", "7", "9"], correct: 2 }
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
      { question: "Which is a natural resource?", answers: ["Water", "Book", "Chair", "Pen"], correct: 0 },
      { question: "The ________ is used to communicate to players during games.", answers: ["bell", "whistle", "drum"], correct: 1 },
      { question: "The thermometer is a communication tool.", answers: ["True", "False", "None"], correct: 1 },
      { question: "What tool consists of different keys?", answers: ["Keyboard", "Monitor", "Mouse"], correct: 0 },
      { question: "The computer has ________ parts.", answers: ["three", "two", "four"], correct: 2 },
      { question: "All the parts of the computer connect together for the computer to work.", answers: ["True", "False", "None"], correct: 0 },
      { question: "Sheep are reared for their ________.", answers: ["meat", "milk", "litter"], correct: 0 },
      { question: "Grains are ________-giving food to many people in Ghana.", answers: ["sugar", "energy", "bitter"], correct: 1 },
      { question: "Which of the following is not a vegetable?", answers: ["Pineapple", "Pepper", "Tomato"], correct: 0 },
      { question: "The ability to do work is called ________.", answers: ["energy", "source", "renewable"], correct: 0 },
      { question: "The energy from the sun is called ________ energy.", answers: ["polar", "solar", "wind"], correct: 1 },
      { question: "Who has authority at home?", answers: ["Teacher", "Father", "Child"], correct: 1 },
      { question: "Who has power to arrest all the bad citizens?", answers: ["Imam", "Police", "Pastor"], correct: 1 },
      { question: "We use national ________ to represent Ghana everywhere.", answers: ["assets", "symbols", "service"], correct: 1 },
      { question: "Being a responsible citizen requires you to be ________.", answers: ["polite", "strict", "hard"], correct: 0 },
      { question: "People who come from Ghana are called ________.", answers: ["Ghanaians", "foreigners", "Gold Coast"], correct: 0 },
      { question: "Okomfo Anokye was born in ________.", answers: ["Ejisu", "Awukugua", "Madina"], correct: 1 },
      { question: "Okomfo Anokye's parents were ________.", answers: ["bankers", "teachers", "farmers"], correct: 2 },
      { question: "The name Mohammed means ________.", answers: ["praised one", "trusted one", "chosen one"], correct: 0 },
      { question: "Mohammed was born in ________.", answers: ["Bethlehem", "Madina", "Mecca"], correct: 2 },
      { question: "Jesus Christ is the leader of ________.", answers: ["Islam", "Traditionalists", "Christianity"], correct: 2 }
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
      { question: "What is a timeline used for?", answers: ["To tell time", "To show events in order", "To count money", "To draw"], correct: 1 },
      { question: ".......... is a smaller group within the ethnic group", answers: ["Tribe", "Tribe", "Trick"], correct: 0 },
      { question: "How many administrative region do we have", answers: ["20", "14", "16"], correct: 2 },
      { question: "There are .......... main ethnic group in Ghana.", answers: ["5", "7", "9"], correct: 0 },
      { question: "The first ethnic group to first settle in Ghana are the...........", answers: ["Guan", "Akan", "Mole Dagbani"], correct: 0 },
      { question: "Ethnic group is made up of different tribe.", answers: ["True", "False"], correct: 0 },
      { question: "................. is a group of practise with common culture and history", answers: ["Tribe", "Ethnic", "Nationalisation"], correct: 1 },
      { question: "All ethnic group have their own ......", answers: ["Facial looks", "Culture", "Legs"], correct: 1 },
      { question: "Which people speak Ewe?", answers: ["Akans", "Guans", "Ewes"], correct: 2 },
      { question: "A group of people who speak the same language with a common history and culture is known as ............", answers: ["Character", "Ethnic", "Special"], correct: 1 },
      { question: "Which people speak Ewe?", answers: ["Akans", "Guans", "Ewes"], correct: 2 },
      { question: "Ghana has ........ regions.", answers: ["Ten", "Twelve", "Sixteen"], correct: 2 },
      { question: "All ethnic group have their own ......", answers: ["Facial looks", "Culture", "Legs"], correct: 1 },
      { question: "Which ethnic group came from Ile-Ife in Nigeria", answers: ["Gonja", "Ga-Adangbe", "Ewes"], correct: 1 },
      { question: "The Ga Adangbe speak .......?", answers: ["Ga", "Ewe", "Gonja"], correct: 0 },
      { question: "The popular food of the Ga Adangbe is", answers: ["Kenkey", "Tuo-zaafi", "Rice"], correct: 0 },
      { question: "The popular food of the Ewe is", answers: ["Kenkey", "Akple", "Rice"], correct: 1 },
      { question: "The popular food of the Akans is", answers: ["Kenkey", "Tuo-zaafi", "Fufu"], correct: 2 },
      { question: "The akans migrated from Ancient ......... Empire .", answers: ["Nigeria", "Ghana", "Togo"], correct: 1 },
      { question: "What the main festival celebrated by the Ewes", answers: ["Hogbetsotso", "Adowa", "Homowo"], correct: 0 },
      { question: "Whats the traditional cloth of the Ewes?", answers: ["Kente", "T-shirt", "Smock"], correct: 0 },
      { question: "A group of people who speak the same language with common history and culture is known as ....... group.", answers: ["character", "ethnic", "special"], correct: 1 },
      { question: "Which people speak Ewe?", answers: ["Akans", "Guans", "Ewes"], correct: 2 },
      { question: "One common food among the Akans is", answers: ["fufuo.", "akple", "tuo zaafi."], correct: 0 },
      { question: "Ghana has ........... regions.", answers: ["ten", "twelve", "sixteen"], correct: 2 },
      { question: "Which ethnic group came from Ile Ife in Nigeria?", answers: ["Gonja", "Ga-Dangbe", "Ewe"], correct: 1 },
      { question: "Which ethnic group comes from the forest regions of Ghana?", answers: ["Akan", "Gonja", "Ewe"], correct: 0 },
      { question: "Two characteristics of an ethnic group are their history and ......", answers: ["looks.", "voice.", "language"], correct: 2 },
      { question: "Every ethnic group has common", answers: ["characteristics", "face.", "problems."], correct: 0 },
      { question: "The Akans migrated from Ancient ............. Empire.", answers: ["Nigeria", "Ghana", "Togo"], correct: 1 },
      { question: "All ethnic groups have their own ......", answers: ["facial looks.", "culture.", "legs."], correct: 1 }
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
      { question: "What is the plural of 'book'?", answers: ["books", "bookes", "booksies", "book"], correct: 0 },
  { question: ".......... you are a student ?", answers: ["Is", "Do", "Does", "Are"], correct: 3 },
  { question: ".......... You help the poor ?", answers: ["Is", "Do", "Does", "Are"], correct: 1 },
  { question: ".......... Kofi play with you?", answers: ["Is", "Do", "Does", "Are"], correct: 2 },
  { question: ".......... barked all night.", answers: ["The monkeys", "Birds", "My dog", "That man"], correct: 2 },
  { question: ".......... Has hurt his foot .", answers: ["The monkeys", "Birds", "My dog", "That man"], correct: 3 },
  { question: ".......... fly in the sky.", answers: ["The monkeys", "Birds", "My dog", "That man"], correct: 1 },
  { question: "This is my country Gh__na", answers: ["m", "k", "a", "o"], correct: 2 },
  { question: "Arise .......... youth for your country.", answers: ["Ghana", "Country", "Nation", "Her"], correct: 0 },
  { question: "Let's us unite to .......... her", answers: ["Ghana", "Country", "Nation", "Uphold"], correct: 3 },
  { question: "The teacher ..........", answers: ["Play with the ball", "Helps mother in the kitchen", "Teaches us", "Looks after the garden"], correct: 2 },
  { question: "The gardener ..........", answers: ["Play with the ball", "Helps mother in the kitchen", "Teaches us", "Looks after the garden"], correct: 3 },
  { question: "My sister ..........", answers: ["Play with the ball", "Helps mother in the kitchen", "Teaches us", "Looks after the garden"], correct: 1 },
  { question: "There is so .......... coffee in the pot.", answers: ["Many", "Much"], correct: 1 },
  { question: "Why is there so .......... Noice?", answers: ["Many", "Much"], correct: 1 },
  { question: "Ants are very ..........", answers: ["Hardworking", "Lazy", "Hunger", "Music"], correct: 0 },
  { question: "The only thing Grasshopper did was to play..........", answers: ["Hardworking", "Lazy", "Hunger", "Music"], correct: 3 },
  { question: "The lion lived in the ..........", answers: ["Hardworking", "Forget", "Hunger", "Music"], correct: 2 },
  { question: "The .......... jumped back into the hole.", answers: ["Tortoise", "Lion", "Mouse", "Mummy"], correct: 2 },
  { question: "There were .......... important rules for baby antelope", answers: ["3", "5", "4", "8"], correct: 0 },
  { question: "Who shouted for help from the whole?", answers: ["Lion", "Tortoise", "Mouse", "Mummy"], correct: 0 }
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
      { question: "What should you do when someone is sad?", answers: ["Ignore them", "Laugh at them", "Help and listen", "Push them"], correct: 2 },
  { question: "The child is likely to be harmed by ________ people.", answers: ["good", "bad", "kind"], correct: 1 },
  { question: "All adults must ensure that children are free from ________.", answers: ["danger", "school", "church"], correct: 0 },
  { question: "One of the roles of the community is to provide a place for ________.", answers: ["fighting", "worship", "killing"], correct: 1 },
  { question: "The teacher ________ children when they do bad things in the community.", answers: ["rewards", "disciplines", "sacks"], correct: 1 },
  { question: "Our parents are to teach us how to ________.", answers: ["insult", "steal", "pray"], correct: 2 },
  { question: "Our ________ should pay our school fees.", answers: ["father", "friends", "siblings"], correct: 0 },
  { question: "Okomfo Anokye's real name was ________.", answers: ["Agyei Frimpong", "Osei Tutu", "Egya Ahor"], correct: 0 },
  { question: "Which of these people visited Baby Jesus?", answers: ["Wise men", "Angels", "Shepherds"], correct: 2 },
  { question: "Jesus Christ is the Leader of ________.", answers: ["Christianity", "Islam", "Budhists"], correct: 0 },
  { question: "Jesus was put in a ________.", answers: ["pail", "bucket", "manger"], correct: 2 },
  { question: "Which group of people celebrate the Hogbetsotso Festival?", answers: ["Asantes", "Gas", "Anlos"], correct: 2 },
  { question: "Which group of people celebrate the Damba Festival?", answers: ["Dagomba", "Akans", "Gas"], correct: 0 },
  { question: "The Odwira Festival is celebrated by the ________ people.", answers: ["Dagombas", "Fantes", "Akuapims"], correct: 2 },
  { question: "Homowo is celebrated by the ________.", answers: ["Akans", "Gas", "Ewes"], correct: 1 },
  { question: "Which of these is a religious practice?", answers: ["Stealing", "Praying", "Sleeping"], correct: 1 },
  { question: "Songs promote our ________ for God.", answers: ["love", "hate", "anger"], correct: 0 },
  { question: "The Lord's prayer is a Christian ________.", answers: ["dance", "song", "recitation"], correct: 2 },
  { question: "All religions believe in ________.", answers: ["stone", "human", "God"], correct: 2 },
  { question: "Christians worship in ________.", answers: ["church", "mosque", "school"], correct: 0 },
  { question: "Traditionalists pour ________.", answers: ["libation", "cibation", "citation"], correct: 0 },
  { question: "Attributes are special ________ given to God.", answers: ["ideas", "names", "bond"], correct: 1 },
  { question: "God is ________.", answers: ["wicked", "bad", "kind"], correct: 2 },
  { question: "God is loving, so we should ________ our neighbours.", answers: ["hate", "love", "slap"], correct: 1 },
  { question: "Traditionalists call God ________.", answers: ["Allah", "Mawu", "Supreme being"], correct: 2 },
  { question: "The Akan traditionalists call God the creator, ________.", answers: ["Mawu", "Oboadeɛ", "Allah"], correct: 1 },
  { question: "God is ________.", answers: ["one", "three", "two"], correct: 0 },
  { question: "A ________ is a place where a group of people live.", answers: ["community", "home", "school"], correct: 0 },
  { question: "Our parents must know our friends.", answers: ["True", "False", "None"], correct: 0 },
  { question: "Our families should provide security for us.", answers: ["True", "False", "None"], correct: 0 },
  { question: "Children are praised by their parents when they perform their Duties.", answers: ["True", "False", "None"], correct: 0 },
  { question: "The ________ is used to communicate to players during games.", answers: ["bell", "whistle", "drum"], correct: 1 },
  { question: "The thermometer is a communication tool.", answers: ["True", "False", "None"], correct: 1 },
  { question: "What tool consists of different keys?", answers: ["Keyboard", "Monitor", "Mouse"], correct: 0 },
  { question: "The computer has ________ parts.", answers: ["three", "two", "four"], correct: 2 },
  { question: "All the parts of the computer connect together for the computer to work.", answers: ["True", "False", "None"], correct: 0 },
  { question: "Sheep are reared for their ________.", answers: ["meat", "milk", "litter"], correct: 0 },
  { question: "Grains are ________-giving food to many people in Ghana.", answers: ["sugar", "energy", "bitter"], correct: 1 },
  { question: "Which of the following is not a vegetable?", answers: ["Pineapple", "Pepper", "Tomato"], correct: 0 },
  { question: "The ability to do work is called ________.", answers: ["energy", "source", "renewable"], correct: 0 },
  { question: "The energy from the sun is called ________ energy.", answers: ["polar", "solar", "wind"], correct: 1 },
  { question: "Who has authority at home?", answers: ["Teacher", "Father", "Child"], correct: 1 },
  { question: "Who has power to arrest all the bad citizens?", answers: ["Imam", "Police", "Pastor"], correct: 1 },
  { question: "We use national ________ to represent Ghana everywhere.", answers: ["assets", "symbols", "service"], correct: 1 },
  { question: "Being a responsible citizen requires you to be ________.", answers: ["polite", "strict", "hard"], correct: 0 },
  { question: "People who come from Ghana are called ________.", answers: ["Ghanaians", "foreigners", "Gold Coast"], correct: 0 },
  { question: "Okomfo Anokye was born in ________.", answers: ["Ejisu", "Awukugua", "Madina"], correct: 1 },
  { question: "Okomfo Anokye's parents were ________.", answers: ["bankers", "teachers", "farmers"], correct: 2 },
  { question: "The name Mohammed means ________.", answers: ["praised one", "trusted one", "chosen one"], correct: 0 },
  { question: "Mohammed was born in ________.", answers: ["Bethlehem", "Madina", "Mecca"], correct: 2 },
  { question: "Jesus Christ is the leader of ________.", answers: ["Islam", "Traditionalists", "Christianity"], correct: 2 }
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
      { question: "Which color is a primary color?", answers: ["Green", "Purple", "Red", "Orange"], correct: 2 },
      { question: "A ________ is an overflow of water that runs over land that is always dry.", answers: ["flood", "drought", "doubt"], correct: 0 },
      { question: "Road safety means safe when you are ________.", answers: ["sleeping", "walking", "bathing"], correct: 1 },
      { question: "A special event where different art works are displayed is called ________.", answers: ["art", "exhibition", "gallery"], correct: 1 },
      { question: "The elephant is ________ than the bird.", answers: ["smaller", "bigger", "shorter"], correct: 1 },
      { question: "The bird has ________.", answers: ["feathers", "hairs", "clothes"], correct: 0 },
      { question: "The Adowa Dance is performed by ________ of all ages.", answers: ["men", "women", "both men and women"], correct: 2 },
      { question: "The dance mostly performed by the southern Ewes in Ghana is called ________.", answers: ["Agbadza", "Borborbor", "Damba"], correct: 0 },
      { question: "Which dance is found among the Lobi and Dagomba people?", answers: ["Bawa", "Adowa", "Bamaya"], correct: 2 },
      { question: "Which tribe in Ghana do the Bamaya Dance?", answers: ["Northern", "Southern", "Volta"], correct: 0 },
      { question: "What are also signs of authority?", answers: ["Values", "Symbols", "People"], correct: 1 },
      { question: "What is a way of creating artworks by shaping materials?", answers: ["Modelling", "Carving", "Weaving"], correct: 0 },
      { question: "________ is a form of drawing.", answers: ["Modelling", "Doodling", "Painting"], correct: 1 },
      { question: "What is a visual art form in which lines and shapes are used to create an object?", answers: ["Scribbling", "Drawing", "Painting"], correct: 1 },
      { question: "We draw to express ________.", answers: ["skills", "emotions", "ideas"], correct: 2 },
      { question: "What do you need to practise and to develop your creative skills?", answers: ["Scribbling", "Painting", "Drawing"], correct: 2 },
      { question: "A small metallic musical instrument used for time lines is called ________.", answers: ["scale", "castanet", "flute"], correct: 1 },
      { question: "The \"Attenteban\" instrument is also known as ________ flute.", answers: ["stone", "stick", "bamboo"], correct: 2 },
      { question: "A ________ is a place for displaying or selling artworks.", answers: ["frontage", "genre", "gallery"], correct: 2 },
      { question: "Rivers, animals and plants are examples of ________ environment.", answers: ["man-made", "natural", "wild"], correct: 1 },
      { question: "Which animal does the Akans imitate in creating the Adowa Dance?", answers: ["Elephant", "Bird", "Antelope"], correct: 2 },
      { question: "The Gonja people lived in the grassland of ________.", answers: ["Ghana", "Mali", "Sudan"], correct: 0 },
      { question: "The Gonja called their kings ________.", answers: ["Lagbonwura", "None", "Nana"], correct: 0 },
      { question: "The Fante people settled in the ________ Region.", answers: ["Volta", "Central", "Eastern"], correct: 1 },
      { question: "The Dagomba people were ruled by ________.", answers: ["Okomfo Anokye", "Ofori Atta", "Ya Na"], correct: 2 },
      { question: "One example of artworks are /is ......", answers: ["Drawings", "Culture", "History"], correct: 0 },
      { question: ".............................is the production of artistic display.", answers: ["Culture", "History", "Artwork"], correct: 2 },
      { question: "............................is another example of an Artwork.", answers: ["Photographs", "Culture", "History"], correct: 0 },
      { question: "..........................is the way of life of groups of people .", answers: ["Artwork", "Culture", "History"], correct: 1 },
      { question: "History is the study of important events that took place in the past.", answers: ["True", "False"], correct: 0 },
      { question: "Which ethnic group speaks Twi and fante", answers: ["Akan", "Ewe", "Dagombas"], correct: 0 },
      { question: "The behaviour of people tells us more about the person's culture.", answers: ["True", "False"], correct: 0 },
      { question: "The food eaten by the Akan include....", answers: ["Fufu", "Rice", "Banku"], correct: 0 },
      { question: "What traditional cloth/dress do the akans wear ?", answers: ["Kente", "Suite", "None"], correct: 0 },
      { question: "History tells us important this that had happened in the past.", answers: ["True", "False", "None"], correct: 0 },
      { question: "Tribes found in the Akan ethnic group are .............................................................", answers: ["Asante, fante, bono", "Walewale, Yendi, Bimbila", "Anlo, Asogli, peki"], correct: 0 },
      { question: "The Mole Dagbani are the ..............largest ethnic group in Ghana.", answers: ["First", "Second", "Third"], correct: 1 },
      { question: "The most important food to the Ewes is ................", answers: ["Akple", "Waakye", "Fufu"], correct: 0 },
      { question: "Akple is made of ..........................", answers: ["Corn", "Beans", "Cassava dough"], correct: 0 },
      { question: "Some important chiefs of the mole dagbani are the Ya-na , the Nayiri and the", answers: ["Bimbilla Naa", "Mole dagbani", "Gambaga"], correct: 0 },
      { question: "Languages the Mole Dagbani speak are Dagbani, Mampruli and ...........", answers: ["Bimbilla Naa", "Nanugli", "Gambaga"], correct: 1 },
      { question: "The mole Dagbani are mostly found in which region of ghana?", answers: ["Eastern Region", "Northern Region", "Greater Accra Region"], correct: 1 },
      { question: "One main food of the mole dagbani is................", answers: ["Fufu", "Tuo Zaafi", "Banku"], correct: 1 },
      { question: "The Ewe ethnic group is found in which region?", answers: ["Northern Region", "Western Region", "Volta Region"], correct: 2 },
      { question: "The traditional food of the Nzema people is ......", answers: ["Akyeke", "Shia", "Ningo"], correct: 0 },
      { question: "What is an artwork?", answers: ["A type of food", "A creative expression of ideas", "A farming tool", "A school subject only"], correct: 1 },
      { question: "Which of the following is an example of artwork?", answers: ["Basket", "Painting", "Table", "Spoon"], correct: 1 },
      { question: "Art is used to express:", answers: ["Only anger", "Ideas and feelings", "Only happiness", "Nothing"], correct: 1 },
      { question: "History is the study of:", answers: ["Future events", "Past events", "Present events", "Stories only"], correct: 1 },
      { question: "Why do we study history?", answers: ["To forget the past", "To understand the past", "To waste time", "To play games"], correct: 1 },
      { question: "Which of the following is a historical source?", answers: ["Mobile phone", "Book", "Television remote", "Shoe"], correct: 1 },
      { question: "The Akans are found mainly in:", answers: ["Northern Ghana", "Southern Ghana", "Eastern Ghana only", "Western Ghana only"], correct: 1 },
      { question: "Which of these is an Akan historical site?", answers: ["Larabanga Mosque", "Cape Coast Castle", "Mole Park", "Tamale Market"], correct: 1 },
      { question: "Cape Coast Castle was used for:.............", answers: ["Farming", "Trading slaves", "Fishing", "Schooling"], correct: 1 },
      { question: "Fufu is the staple food of the", answers: ["Ewe.", "Asante.", "Dagomba."], correct: 1 },
      { question: "Asesewa and Dodowa are towns in", answers: ["Asante.", "Krobo.", "Eweland."], correct: 1 },
      { question: "One of these places is noted for pot making.", answers: ["Accra", "Takoradi", "Pankrono"], correct: 2 },
      { question: "Chains, rings, earrings are called", answers: ["Fabrics.", "Jewellery.", "Posters."], correct: 1 },
      { question: "One famous painter in Ghana is", answers: ["Oswald Boateng.", "Ibrahim Mahama.", "Theodosia Okoh."], correct: 1 },
      { question: "Example of domestic animal is", answers: ["lion.", "antelope.", "chicken."], correct: 2 },
      { question: "Straw can be used to make", answers: ["baskets.", "rubber.", "television."], correct: 0 },
      { question: "All these are principles of design except", answers: ["Rhythm", "Proportion", "Sound"], correct: 2 },
      { question: "What are some objects found in the natural environment.", answers: ["Cats", "Cars", "Buildings"], correct: 0 },
      { question: "What are some objects found in the artificial environment.", answers: ["Cats", "Cars", "Buildings"], correct: 1 },
      { question: "One element of design is lines.", answers: ["True", "False", "None"], correct: 0 }
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
  },
  "core-maths": {
    displayName: "Core Mathematics",
    shs: [
      { question: "Solve for x: 2x + 5 = 15", answers: ["5", "6", "7", "8"], correct: 2 },
      { question: "What is 25% of 80?", answers: ["10", "15", "20", "25"], correct: 2 }
    ]
  },
  "elective-maths": {
    displayName: "Elective Mathematics",
    shs: [
      { question: "If f(x) = 2x + 3, what is f(4)?", answers: ["7", "8", "9", "11"], correct: 2 },
      { question: "What is the value of sin 90°?", answers: ["0", "1/2", "1", "√3/2"], correct: 2 }
    ]
  },
  "english-language": {
    displayName: "English Language",
    shs: [
      { question: "Choose the correct sentence: She ___ to school every day.", answers: ["go", "goes", "going", "gone"], correct: 1 },
      { question: "Which word is a conjunction?", answers: ["and", "quickly", "beautiful", "house"], correct: 0 }
    ]
  },
  "integrated-science": {
    displayName: "Integrated Science",
    shs: [
      { question: "What is the SI unit of force?", answers: ["Watt", "Newton", "Joule", "Ampere"], correct: 1 },
      { question: "Which gas is most abundant in the atmosphere?", answers: ["Oxygen", "Carbon dioxide", "Nitrogen", "Hydrogen"], correct: 2 }
    ]
  },
  "social-studies": {
    displayName: "Social Studies",
    shs: [
      { question: "What is the capital city of Ghana?", answers: ["Kumasi", "Accra", "Tamale", "Cape Coast"], correct: 1 },
      { question: "Which institution makes laws in Ghana?", answers: ["The Executive", "The Judiciary", "The Legislature", "The Police"], correct: 2 }
    ]
  },
  economics: {
    displayName: "Economics",
    shs: [
      { question: "What is scarcity in economics?", answers: ["Unlimited resources", "Limited resources", "No trade", "No taxes"], correct: 1 },
      { question: "What does demand mean?", answers: ["The price of goods", "The supply of goods", "The willingness to buy a product", "The cost of production"], correct: 2 }
    ]
  },
  government: {
    displayName: "Government",
    shs: [
      { question: "Which arm of government interprets laws?", answers: ["Executive", "Legislature", "Judiciary", "Police"], correct: 2 },
      { question: "A constitution is a set of ________.", answers: ["Laws", "Books", "Schools", "Trees"], correct: 0 }
    ]
  },
  ict: {
    displayName: "ICT",
    shs: [
      { question: "What does ICT stand for?", answers: ["Information and Communication Technology", "Internet and Computer Tools", "Internal Computer Training", "Important Computer Technology"], correct: 0 },
      { question: "Which device is used to input data into a computer?", answers: ["Monitor", "Keyboard", "Speaker", "Printer"], correct: 1 }
    ]
  }
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
    { key: "core-maths", label: "Core Mathematics" },
    { key: "english-language", label: "English Language" },
    { key: "social-studies", label: "Social Studies" },
    { key: "economics", label: "Economics" },
    { key: "government", label: "Government" },
    { key: "ict", label: "ICT" }
  ],
  "general-science": [
    { key: "core-maths", label: "Core Mathematics" },
    { key: "english-language", label: "English Language" },
    { key: "integrated-science", label: "Integrated Science" },
    { key: "social-studies", label: "Social Studies" },
    { key: "ict", label: "ICT" }
  ],
  business: [
    { key: "core-maths", label: "Core Mathematics" },
    { key: "english-language", label: "English Language" },
    { key: "economics", label: "Economics" },
    { key: "social-studies", label: "Social Studies" },
    { key: "ict", label: "ICT" }
  ],
  "home-economics": [
    { key: "core-maths", label: "Core Mathematics" },
    { key: "english-language", label: "English Language" },
    { key: "social-studies", label: "Social Studies" },
    { key: "economics", label: "Economics" },
    { key: "ict", label: "ICT" }
  ],
  "visual-arts": [
    { key: "core-maths", label: "Core Mathematics" },
    { key: "english-language", label: "English Language" },
    { key: "social-studies", label: "Social Studies" },
    { key: "ict", label: "ICT" },
    { key: "government", label: "Government" }
  ]
};

const subjectCatalog = {
  basic: [
    { key: "maths", label: "Mathematics" },
    { key: "science", label: "Science" },
    { key: "owop", label: "Our World Our People" },
    { key: "history", label: "History" },
    { key: "english", label: "English" },
    { key: "rme", label: "Religious & Moral Education" },
    { key: "creative", label: "Creative Arts" }
  ],
  jhs: [
    { key: "maths", label: "Mathematics" },
    { key: "science", label: "Science" },
    { key: "owop", label: "Our World Our People" },
    { key: "history", label: "History" },
    { key: "english", label: "English" },
    { key: "rme", label: "Religious & Moral Education" },
    { key: "creative", label: "Creative Arts" }
  ],
  shs: [
    { key: "core-maths", label: "Core Mathematics" },
    { key: "elective-maths", label: "Elective Mathematics" },
    { key: "english-language", label: "English Language" },
    { key: "integrated-science", label: "Integrated Science" },
    { key: "social-studies", label: "Social Studies" },
    { key: "economics", label: "Economics" },
    { key: "government", label: "Government" },
    { key: "ict", label: "ICT" }
  ]
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

function getDepartmentFromClass(classKey) {
  if (classKey.startsWith("shs")) return "shs";
  if (classKey.startsWith("jhs")) return "jhs";
  return "basic";
}

function getSubjectCatalogForClass(classKey) {
  const department = getDepartmentFromClass(classKey);
  if (department === "shs") {
    return shsCourseCatalog[getCourseKey()] || shsCourseCatalog["general-arts"];
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
  const answerItems = question.answers.map((answer, index) => ({ answer, index }));
  const shuffledItems = shuffleArray(answerItems);
  const correctAnswer = question.answers[question.correct];
  const correctIndex = shuffledItems.findIndex((item) => item.answer === correctAnswer);

  return {
    ...question,
    answers: shuffledItems.map((item) => item.answer),
    correct: correctIndex
  };
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
    const courseParam = selectedClass.startsWith("shs") ? `&course=${getCourseKey()}` : "";
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
    departmentMessage.textContent = department === "shs"
      ? "Senior High students can choose from SHS subjects such as Core Mathematics and Economics."
      : "Choose a subject for your class and start a fresh quiz session.";
  }

  renderSubjectLinks(selectedClass, subjectLinksContainer);

  classSelect.addEventListener("change", () => {
    const activeClass = classSelect.value;
    renderSubjectLinks(activeClass, subjectLinksContainer);

    if (departmentMessage) {
      const department = getDepartmentFromClass(activeClass);
      departmentMessage.textContent = department === "shs"
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
      image: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=900&q=80"
    },
    jhs: {
      title: "JHS learners build confidence with guided revision.",
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80"
    },
    shs: {
      title: "SHS students prepare for bigger academic goals.",
      image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80"
    }
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
    shs: ["shs1", "shs2", "shs3"]
  };

  function updateCourseVisibility() {
    if (courseSelect && courseLabel) {
      const showCourse = departmentSelect.value === "shs";
      courseSelect.style.display = showCourse ? "inline-block" : "none";
      courseLabel.style.display = showCourse ? "inline-block" : "none";
    }
  }

  function updateClassOptions() {
    const selectedDepartment = departmentSelect.value;
    classSelect.innerHTML = "";

    optionsByDepartment[selectedDepartment].forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = classLabels[value] || value;
      classSelect.appendChild(option);
    });

    updateCourseVisibility();

    if (departmentMessage) {
      departmentMessage.textContent = selectedDepartment === "shs"
        ? "Senior High students can pick their course first, then choose the subjects they study."
        : selectedDepartment === "jhs"
          ? "Junior High students can move to the subject page for JHS questions."
          : "Basic students can move to the subject page for basic-level questions.";
    }

    updateDepartmentVisual(selectedDepartment);
  }

  const initialDepartment = getDepartmentKey() || "basic";
  const initialClass = getClassKey();
  const initialCourse = getCourseKey();
  departmentSelect.value = initialDepartment;
  updateClassOptions();
  classSelect.value = optionsByDepartment[initialDepartment].includes(initialClass) ? initialClass : optionsByDepartment[initialDepartment][0];
  updateDepartmentVisual(initialDepartment);
  if (courseSelect) {
    courseSelect.value = initialCourse;
  }

  departmentSelect.addEventListener("change", updateClassOptions);
  continueBtn.addEventListener("click", () => {
    const params = new URLSearchParams();
    params.set("class", classSelect.value);
    params.set("department", departmentSelect.value);
    if (departmentSelect.value === "shs" && courseSelect) {
      params.set("course", courseSelect.value);
    }
    window.location.href = `-index.html?${params.toString()}`;
  });
}

function setupQuizPage() {
  const quizSetup = document.getElementById("quiz-setup");
  const startBtn = document.getElementById("start-quiz-btn");
  const timerSelect = document.getElementById("timer-select");
  const setupClassLabel = document.getElementById("setup-class-label");
  const setupSubjectLabel = document.getElementById("setup-subject-label");
  const activeArea = document.getElementById("quiz-active-area");

  if (!quizSetup || !startBtn || !timerSelect) {
    return;
  }

  const subjectKey = getSubjectKey();
  const classKey = getClassKey();
  const subjectData = subjects[subjectKey];
  const className = classLabels[classKey] || "Your class";

  if (setupClassLabel) {
    setupClassLabel.textContent = className;
  }

  if (setupSubjectLabel) {
    setupSubjectLabel.textContent = subjectData ? `${subjectData.displayName} is ready for you.` : "Choose a subject first.";
  }

  startBtn.addEventListener("click", () => {
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
  const baseQuestions = subjectData[levelKey] || subjectData.early;
  quizQuestions = shuffleArray(baseQuestions).map(buildShuffledQuestion);
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
    modeBadge.textContent = mode === "exam" ? "Exam Mode • no hints after wrong answers" : "Practice Mode • explanations are shown";
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
    button.style.background = "#4CAF50";
    feedbackEl.textContent = "😉 Correct!";
    explanationEl.textContent = "";
  } else {
    mistakes += 1;
    button.style.background = "#E74C3C";
    const correctButton = answersEl.children[correctIndex];
    if (correctButton) correctButton.style.background = "#4CAF50";
    feedbackEl.textContent = "😡 Wrong. The correct answer is highlighted in green.";
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
      document.getElementById("explanation").textContent = "Explanations are shown here";
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
    const reviewSection = document.getElementById("review-section");
    if (reviewSection) {
      reviewSection.innerHTML = "";
    }
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
    nextBtn.addEventListener("click", () => window.location.href = "-index.html");
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
  reviewSection.querySelectorAll(".review-star").forEach((button) => {
    button.addEventListener("click", () => {
      selectedRating = Number(button.dataset.value);
      reviewSection.querySelectorAll(".review-star").forEach((star) => {
        star.classList.toggle("active", Number(star.dataset.value) <= selectedRating);
      });
    });
  });

  const form = reviewSection.querySelector("#review-form");
  const feedback = reviewSection.querySelector("#review-feedback");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = reviewSection.querySelector("#review-text").value.trim();
    const studentName = reviewSection.querySelector("#review-name").value.trim() || "A student";
    if (!text) return;

    const reviews = JSON.parse(localStorage.getItem("ycohde-reviews") || "[]");
    reviews.push({
      rating: selectedRating,
      text,
      subject: label,
      studentName,
      createdAt: new Date().toLocaleString()
    });
    localStorage.setItem("ycohde-reviews", JSON.stringify(reviews));

    if (feedback) {
      feedback.textContent = "Thanks for your review. Your feedback has been saved.";
    }
    form.reset();
    renderPublicReviews();
  });
}

function renderPublicReviews() {
  const reviewList = document.getElementById("public-reviews-list");
  if (!reviewList) return;

  const reviews = JSON.parse(localStorage.getItem("ycohde-reviews") || "[]").slice(-6).reverse();

  if (!reviews.length) {
    reviewList.innerHTML = '<p class="empty-state">No reviews yet. Complete a quiz and be the first to leave one.</p>';
    return;
  }

  reviewList.innerHTML = reviews.map((review) => `
    <article class="review-post">
      <strong>${review.studentName}</strong>
      <div class="stars">${"★".repeat(review.rating)}</div>
      <p>${review.text}</p>
      <small>${review.subject} • ${review.createdAt}</small>
    </article>
  `).join("");
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
        newsletterStatus.textContent = `Thanks! ${emailInput.value.trim()} has joined the reminder list.`;
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
            url: window.location.href
          });
          shareFeedback.textContent = "Thanks for sharing Y_Cohde with others.";
        } catch (error) {
          shareFeedback.textContent = "Sharing was cancelled, but the idea is still great.";
        }
      } else {
        shareFeedback.textContent = "Copy the page link to share it with a friend.";
      }
    });
  }

  if (recommendBtn && shareFeedback) {
    recommendBtn.addEventListener("click", () => {
      shareFeedback.textContent = "Recommended! Keep learning and invite a friend to join the next quiz.";
    });
  }

  if (reminderBtn && reminderStatus && reminderSelect) {
    reminderBtn.addEventListener("click", () => {
      const minutes = reminderSelect.value;
      reminderStatus.textContent = `Reminder set for ${minutes} minutes from now. Return to your study plan soon.`;
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Y_Cohde reminder", {
          body: `Time to continue studying for ${minutes} minutes.`
        });
      } else if ("Notification" in window && Notification.permission !== "denied") {
        Notification.requestPermission().then(() => {
          if (Notification.permission === "granted") {
            new Notification("Y_Cohde reminder", {
              body: `Time to continue studying for ${minutes} minutes.`
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
  if (text.includes("diagram") || text.includes("sketch") || text.includes("shape") || text.includes("draw")) {
    diagramArea.innerHTML = `<img src="" alt="Study diagram" />`;
  } else {
    diagramArea.innerHTML = "Sketch-style questions will appear here when the topic needs a visual prompt.";
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
    if (!sidebar.contains(event.target) && !menuToggles.some((toggle) => toggle.contains(event.target))) {
      closeMenu();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) {
      closeMenu();
    }
  });
}

if (document.getElementById("department-select")) {
  document.addEventListener("DOMContentLoaded", () => {
    if (!requireStudentLogin()) return;
    setupStudentSession();
    setupMobileMenu();
    setupDepartmentPage();
  });
} else if (document.getElementById("quiz-setup") && document.getElementById("quiz-active-area")) {
  document.addEventListener("DOMContentLoaded", () => {
    if (!requireStudentLogin()) return;
    setupStudentSession();
    setupMobileMenu();
    setupQuizPage();
    setupEngagementFeatures();
    renderPublicReviews();
    document.getElementById("nextbtn")?.addEventListener("click", nextQuestion);
  });
} else {
  document.addEventListener("DOMContentLoaded", () => {
    if (!requireStudentLogin()) return;
    setupStudentSession();
    setupMobileMenu();
    setupSubjectLinks();
    setupEngagementFeatures();
    renderPublicReviews();
  });
}
