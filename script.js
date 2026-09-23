let practiceQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let nextQuestionId = 1;

const setupBox = document.getElementById("setup-box");
const quizBox = document.getElementById("quiz-box");
const resultBox = document.getElementById("result");
const questionCountSelect = document.getElementById("question-count");
const difficultySelect = document.getElementById("difficulty");
const startButton = document.getElementById("start-btn");
const nextButton = document.getElementById("next-btn");
const restartButton = document.getElementById("restart-btn");
const questionNumberElement = document.getElementById("question-number");
const scoreDisplay = document.getElementById("score-display");
const questionElement = document.getElementById("question");
const answersElement = document.getElementById("answers");
const feedbackElement = document.getElementById("feedback");
const progressElement = document.getElementById("progress");
const finalScoreElement = document.getElementById("score");

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function uniqueChoices(correct, extras) {
  const answers = [String(correct)];

  extras.forEach(value => {
    const text = String(value);
    if (!answers.includes(text)) {
      answers.push(text);
    }
  });

  while (answers.length < 4) {
    const filler = String(Number(correct) + randomInt(-12, 12) || randomInt(1, 50));
    if (!answers.includes(filler)) {
      answers.push(filler);
    }
  }

  return shuffle(answers.slice(0, 4));
}

function makeQuestion(level, question, correct, answers) {
  return {
    id: nextQuestionId++,
    level,
    question,
    correct: String(correct),
    answers: shuffle([...answers])
  };
}

function createEasyQuestion() {
  const type = randomInt(1, 3);

  if (type === 1) {
    const a = randomInt(1, 20);
    const b = randomInt(1, 20);
    const correct = a + b;
    return makeQuestion(
      "easy",
      `What is ${a} + ${b}?`,
      correct,
      uniqueChoices(correct, [correct + 1, correct - 1, a + b + 2, Math.abs(a - b)])
    );
  }

  if (type === 2) {
    const a = randomInt(8, 30);
    const b = randomInt(1, a);
    const correct = a - b;
    return makeQuestion(
      "easy",
      `What is ${a} - ${b}?`,
      correct,
      uniqueChoices(correct, [correct + 2, correct - 2, a + b, b])
    );
  }

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const index = randomInt(0, 6);
  const correct = days[(index + 1) % 7];
  const wrong = days.filter(day => day !== correct);
  return makeQuestion(
    "easy",
    `Which day comes after ${days[index]}?`,
    correct,
    shuffle([correct, ...shuffle(wrong).slice(0, 3)])
  );
}

function createMediumQuestion() {
  const type = randomInt(1, 4);

  if (type === 1) {
    const a = randomInt(4, 12);
    const b = randomInt(4, 12);
    const correct = a * b;
    return makeQuestion(
      "medium",
      `What is ${a} × ${b}?`,
      correct,
      uniqueChoices(correct, [correct + a, correct - b, a + b, (a + 1) * b])
    );
  }

  if (type === 2) {
    const b = randomInt(2, 12);
    const correct = randomInt(2, 12);
    const a = b * correct;
    return makeQuestion(
      "medium",
      `What is ${a} ÷ ${b}?`,
      correct,
      uniqueChoices(correct, [correct + 1, correct - 1, b, a - b])
    );
  }

  if (type === 3) {
    const facts = [
      ["Which language is used to style web pages?", "CSS", ["HTML", "Python", "SQL"]],
      ["What does HTML stand for?", "Hyper Text Markup Language", [
        "High Text Machine Language",
        "Hyperlink Text Management Language",
        "Home Tool Markup Language"
      ]],
      ["Which planet is known as the Red Planet?", "Mars", ["Earth", "Jupiter", "Venus"]],
      ["Which tag creates a link in HTML?", "<a>", ["<link>", "<href>", "<p>"]]
    ];
    const fact = facts[randomInt(0, facts.length - 1)];
    return makeQuestion("medium", fact[0], fact[1], [fact[1], ...fact[2]]);
  }

  const a = randomInt(10, 40);
  const b = randomInt(10, 40);
  const c = randomInt(2, 9);
  const correct = a + b * c;
  return makeQuestion(
    "medium",
    `What is ${a} + ${b} × ${c}?`,
    correct,
    uniqueChoices(correct, [(a + b) * c, a * b + c, a + b + c])
  );
}

function createHardQuestion() {
  const type = randomInt(1, 4);

  if (type === 1) {
    const n = randomInt(2, 8);
    const correct = 2 ** n;
    return makeQuestion(
      "hard",
      `What is 2^${n}?`,
      correct,
      uniqueChoices(correct, [n * 2, 2 * n + 2, 2 ** (n - 1), n ** 2])
    );
  }

  if (type === 2) {
    const a = randomInt(20, 90);
    const b = randomInt(3, 9);
    const correct = a % b;
    return makeQuestion(
      "hard",
      `What is ${a} % ${b}?`,
      correct,
      uniqueChoices(correct, [(a + 1) % b, a % (b + 1), b, a - b])
    );
  }

  if (type === 3) {
    const facts = [
      ["Which data structure uses FIFO?", "Queue", ["Stack", "Tree", "Graph"]],
      ["What is the time complexity of binary search?", "O(log n)", ["O(1)", "O(n)", "O(n²)"]],
      ["Which protocol is used for secure web communication?", "HTTPS", ["HTTP", "FTP", "SMTP"]],
      ["Which keyword creates a constant in JavaScript?", "const", ["var", "let", "constant"]]
    ];
    const fact = facts[randomInt(0, facts.length - 1)];
    return makeQuestion("hard", fact[0], fact[1], [fact[1], ...fact[2]]);
  }

  const a = randomInt(5, 15);
  const b = randomInt(5, 15);
  const c = randomInt(2, 8);
  const correct = (a + b) * c;
  return makeQuestion(
    "hard",
    `What is (${a} + ${b}) × ${c}?`,
    correct,
    uniqueChoices(correct, [a + b * c, a * b * c, a + b + c])
  );
}

function createQuestion(level) {
  if (level === "easy") return createEasyQuestion();
  if (level === "medium") return createMediumQuestion();
  if (level === "hard") return createHardQuestion();

  const mixed = ["easy", "medium", "hard"];
  return createQuestion(mixed[randomInt(0, 2)]);
}

function createPracticeSet(count, level) {
  const questions = [];
  const seen = new Set();

  while (questions.length < count) {
    const question = createQuestion(level);
    const key = question.question;

    if (!seen.has(key)) {
      seen.add(key);
      questions.push(question);
    }
  }

  return questions;
}

function updateProgress(answeredCurrent) {
  const completed = currentQuestionIndex + (answeredCurrent ? 1 : 0);
  progressElement.style.width =
    `${(completed / practiceQuestions.length) * 100}%`;
}

function startPractice() {
  const selectedCount = Number(questionCountSelect.value);
  const selectedLevel = difficultySelect.value;

  practiceQuestions = createPracticeSet(selectedCount, selectedLevel);
  currentQuestionIndex = 0;
  score = 0;

  setupBox.style.display = "none";
  quizBox.style.display = "block";
  resultBox.style.display = "none";
  scoreDisplay.textContent = "Score: 0";

  loadQuestion();
}

function loadQuestion() {
  const currentQuestion = practiceQuestions[currentQuestionIndex];

  questionElement.textContent = currentQuestion.question;
  questionNumberElement.textContent =
    `Question ${currentQuestionIndex + 1} of ${practiceQuestions.length}`;

  updateProgress(false);
  answersElement.innerHTML = "";
  feedbackElement.textContent = "";
  nextButton.style.display = "none";
  nextButton.textContent =
    currentQuestionIndex === practiceQuestions.length - 1 ? "See results" : "Next";

  currentQuestion.answers.forEach(answer => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = answer;
    button.classList.add("answer-btn");
    button.addEventListener("click", () => selectAnswer(button, answer));
    answersElement.appendChild(button);
  });
}

function selectAnswer(selectedButton, selectedAnswer) {
  const currentQuestion = practiceQuestions[currentQuestionIndex];
  const answerButtons = document.querySelectorAll(".answer-btn");

  answerButtons.forEach(button => {
    button.disabled = true;
    if (button.textContent === currentQuestion.correct) {
      button.classList.add("correct");
    }
  });

  if (selectedAnswer === currentQuestion.correct) {
    score++;
    feedbackElement.textContent = "Correct!";
    feedbackElement.style.color = "#16a34a";
  } else {
    selectedButton.classList.add("wrong");
    feedbackElement.textContent = `Wrong! Correct answer: ${currentQuestion.correct}`;
    feedbackElement.style.color = "#dc2626";
  }

  scoreDisplay.textContent = `Score: ${score}`;
  updateProgress(true);
  nextButton.style.display = "block";
}

function showResult() {
  quizBox.style.display = "none";
  resultBox.style.display = "block";
  finalScoreElement.textContent =
    `You scored ${score} out of ${practiceQuestions.length}!`;
}

nextButton.addEventListener("click", () => {
  currentQuestionIndex++;
  if (currentQuestionIndex < practiceQuestions.length) {
    loadQuestion();
  } else {
    showResult();
  }
});

restartButton.addEventListener("click", () => {
  resultBox.style.display = "none";
  setupBox.style.display = "block";
});

startButton.addEventListener("click", startPractice);