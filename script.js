// ==========================================
// AI PRACTICE QUIZ
// ==========================================

let practiceQuestions = [];

let currentQuestionIndex = 0;

let score = 0;

let answered = false;


// ==========================================
// HTML ELEMENTS
// ==========================================

const setupBox =
    document.getElementById("setup-box");

const quizBox =
    document.getElementById("quiz-box");

const resultBox =
    document.getElementById("result");

const questionCountInput =
    document.getElementById("question-count");

const difficultySelect =
    document.getElementById("difficulty");

const startButton =
    document.getElementById("start-btn");

const questionNumber =
    document.getElementById("question-number");

const questionText =
    document.getElementById("question");

const answersContainer =
    document.getElementById("answers");

const feedback =
    document.getElementById("feedback");

const nextButton =
    document.getElementById("next-btn");

const scoreDisplay =
    document.getElementById("score-display");

const progressBar =
    document.getElementById("progress");

const finalScore =
    document.getElementById("score");

const restartButton =
    document.getElementById("restart-btn");


// ==========================================
// SHUFFLE ARRAY
// ==========================================

function shuffle(array) {

    const copy = [...array];

    for (
        let i = copy.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() * (i + 1)
            );

        [
            copy[i],
            copy[j]
        ] = [
            copy[j],
            copy[i]
        ];
    }

    return copy;
}


// ==========================================
// GENERATE QUIZ USING GEMINI
// ==========================================

async function generateGeminiQuiz(
    count,
    difficulty
) {

    const response = await fetch(
        "/api/generate-quiz",
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({
                count: count,
                difficulty: difficulty
            })
        }
    );


    const data =
        await response.json();


    if (!response.ok) {

        throw new Error(
            data.details ||
            data.error ||
            "Failed to generate quiz."
        );
    }


    if (
        !data.questions ||
        !Array.isArray(data.questions)
    ) {

        throw new Error(
            "Invalid quiz received from Gemini."
        );
    }


    // Validate questions

    data.questions.forEach(
        (question) => {

            if (!question.question) {

                throw new Error(
                    "Question text is missing."
                );
            }


            if (
                !Array.isArray(
                    question.options
                ) ||
                question.options.length !== 4
            ) {

                throw new Error(
                    "Every question must have exactly 4 options."
                );
            }


            if (!question.correct) {

                throw new Error(
                    "Correct answer is missing."
                );
            }


            if (!question.solution) {

                throw new Error(
                    "Solution is missing."
                );
            }


            if (
                !question.options.includes(
                    question.correct
                )
            ) {

                throw new Error(
                    "Correct answer does not match the options."
                );
            }

        }
    );


    return data.questions;
}


// ==========================================
// LOADING STATE
// ==========================================

function setLoadingState(
    isLoading
) {

    if (isLoading) {

        startButton.disabled = true;

        startButton.textContent =
            "Generating Quiz...";

    } else {

        startButton.disabled = false;

        startButton.textContent =
            "Start Practice";
    }
}


// ==========================================
// START PRACTICE
// ==========================================

async function startPractice() {

    const selectedCount =
        Number(
            questionCountInput.value
        );


    let selectedDifficulty =
        difficultySelect.value;


    // --------------------------------------
    // VALIDATE QUESTION COUNT
    // --------------------------------------

    if (
        !Number.isInteger(
            selectedCount
        ) ||
        selectedCount < 1 ||
        selectedCount > 20
    ) {

        alert(
            "Please enter a number between 1 and 20."
        );

        return;
    }


    // --------------------------------------
    // GENERATE QUIZ
    // --------------------------------------

    try {

        setLoadingState(true);


        // Gemini backend expects:
        // easy / medium / hard / mixed

        if (
            selectedDifficulty === "all"
        ) {

            selectedDifficulty = "mixed";

        }


        practiceQuestions =
            await generateGeminiQuiz(
                selectedCount,
                selectedDifficulty
            );


        currentQuestionIndex = 0;

        score = 0;

        answered = false;


        // ----------------------------------
        // SWITCH SCREEN
        // ----------------------------------

        setupBox.style.display =
            "none";

        quizBox.style.display =
            "block";

        resultBox.style.display =
            "none";


        loadQuestion();

    }

    catch (error) {

        console.error(error);


        alert(
            "Unable to generate quiz.\n\n" +
            error.message
        );

    }

    finally {

        setLoadingState(false);

    }
}


// ==========================================
// LOAD QUESTION
// ==========================================

function loadQuestion() {

    const currentQuestion =
        practiceQuestions[
            currentQuestionIndex
        ];


    if (!currentQuestion) {

        showResult();

        return;
    }


    answered = false;


    // --------------------------------------
    // QUESTION NUMBER
    // --------------------------------------

    questionNumber.textContent =
        `Question ${
            currentQuestionIndex + 1
        } of ${
            practiceQuestions.length
        }`;


    // --------------------------------------
    // SCORE
    // --------------------------------------

    scoreDisplay.textContent =
        `Score: ${score}`;


    // --------------------------------------
    // PROGRESS
    // --------------------------------------

    const progress =
        (
            (currentQuestionIndex + 1) /
            practiceQuestions.length
        ) * 100;


    progressBar.style.width =
        `${progress}%`;


    // --------------------------------------
    // QUESTION
    // --------------------------------------

    questionText.textContent =
        currentQuestion.question;


    // --------------------------------------
    // CLEAR OLD ANSWERS
    // --------------------------------------

    answersContainer.innerHTML = "";

    feedback.textContent = "";


    nextButton.style.display =
        "none";


    // --------------------------------------
    // SHUFFLE OPTIONS
    // --------------------------------------

    const shuffledOptions =
        shuffle(
            currentQuestion.options
        );


    // --------------------------------------
    // CREATE ANSWER BUTTONS
    // --------------------------------------

    shuffledOptions.forEach(
        (option) => {

            const button =
                document.createElement(
                    "button"
                );


            button.className =
                "answer-btn";


            button.textContent =
                option;


            button.type =
                "button";


            button.addEventListener(
                "click",
                () => {

                    selectAnswer(
                        button,
                        option
                    );

                }
            );


            answersContainer.appendChild(
                button
            );

        }
    );
}


// ==========================================
// SELECT ANSWER
// ==========================================

function selectAnswer(
    selectedButton,
    selectedOption
) {

    // Prevent multiple clicks

    if (answered) {

        return;
    }


    answered = true;


    const currentQuestion =
        practiceQuestions[
            currentQuestionIndex
        ];


    const allButtons =
        answersContainer.querySelectorAll(
            ".answer-btn"
        );


    // Disable all answers

    allButtons.forEach(
        (button) => {

            button.disabled = true;

        }
    );


    // --------------------------------------
    // CHECK ANSWER
    // --------------------------------------

    const isCorrect =
        selectedOption ===
        currentQuestion.correct;


    if (isCorrect) {

        score++;


        selectedButton.classList.add(
            "correct"
        );


        feedback.textContent =
            "Correct! 🎉";

    } else {

        selectedButton.classList.add(
            "wrong"
        );


        feedback.textContent =
            "Wrong answer.";


        // Highlight correct answer

        allButtons.forEach(
            (button) => {

                if (
                    button.textContent ===
                    currentQuestion.correct
                ) {

                    button.classList.add(
                        "correct"
                    );

                }

            }
        );

    }


    // --------------------------------------
    // SHOW SOLUTION
    // --------------------------------------

    const solutionBox =
        document.createElement(
            "div"
        );


    solutionBox.className =
        "solution-box";


    solutionBox.innerHTML = `
        <strong>
            ${
                isCorrect
                    ? "Correct! 🎉"
                    : "Correct answer: " +
                      currentQuestion.correct
            }
        </strong>

        <p>
            <strong>Solution:</strong>
            ${currentQuestion.solution}
        </p>
    `;


    answersContainer.appendChild(
        solutionBox
    );


    // --------------------------------------
    // SHOW NEXT BUTTON
    // --------------------------------------

    nextButton.style.display =
        "block";


    nextButton.textContent =
        currentQuestionIndex ===
        practiceQuestions.length - 1
            ? "See Results"
            : "Next";


    scoreDisplay.textContent =
        `Score: ${score}`;
}


// ==========================================
// NEXT QUESTION
// ==========================================

function nextQuestion() {

    currentQuestionIndex++;

    loadQuestion();
}


// ==========================================
// SHOW RESULT
// ==========================================

function showResult() {

    quizBox.style.display =
        "none";

    resultBox.style.display =
        "block";


    finalScore.textContent =
        `Your Score: ${score} / ${practiceQuestions.length}`;

}


// ==========================================
// RESTART QUIZ
// ==========================================

function restartQuiz() {

    currentQuestionIndex = 0;

    score = 0;

    answered = false;


    resultBox.style.display =
        "none";

    setupBox.style.display =
        "block";

}


// ==========================================
// EVENT LISTENERS
// ==========================================

startButton.addEventListener(
    "click",
    startPractice
);


nextButton.addEventListener(
    "click",
    nextQuestion
);


restartButton.addEventListener(
    "click",
    restartQuiz
);