import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const app = express();

// --------------------------------------------------
// BASIC SETUP
// --------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const PRIMARY_MODEL =
    process.env.GEMINI_MODEL || "gemini-3.6-flash";

const FALLBACK_MODEL =
    "gemini-3.5-flash-lite";

// --------------------------------------------------
// CHECK API KEY
// --------------------------------------------------

if (!GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY is missing in .env");
    process.exit(1);
}

// --------------------------------------------------
// GEMINI CLIENT
// --------------------------------------------------

const ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY
});

// --------------------------------------------------
// MIDDLEWARE
// --------------------------------------------------

app.use(express.json());
app.use(express.static(__dirname));

// --------------------------------------------------
// DELAY FUNCTION
// --------------------------------------------------

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// --------------------------------------------------
// GEMINI REQUEST WITH RETRY
// --------------------------------------------------

async function generateWithRetry(model, prompt, maxRetries = 2) {

    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {

        try {

            console.log(
                `🤖 ${model} - Attempt ${attempt}/${maxRetries}`
            );

            const response = await ai.models.generateContent({

                model: model,

                contents: prompt,

                config: {

                    responseMimeType: "application/json",

                    responseSchema: {

                        type: "object",

                        properties: {

                            questions: {

                                type: "array",

                                items: {

                                    type: "object",

                                    properties: {

                                        question: {
                                            type: "string"
                                        },

                                        options: {

                                            type: "array",

                                            items: {
                                                type: "string"
                                            }

                                        },

                                        correct: {
                                            type: "string"
                                        },

                                        solution: {
                                            type: "string"
                                        }

                                    },

                                    required: [
                                        "question",
                                        "options",
                                        "correct",
                                        "solution"
                                    ]

                                }

                            }

                        },

                        required: [
                            "questions"
                        ]

                    }

                }

            });

            console.log(
                `✅ ${model} responded successfully`
            );

            return response;

        } catch (error) {

            lastError = error;

            console.log(
                `❌ ${model} failed`
            );

            console.log(
                `Status: ${error.status || "unknown"}`
            );

            console.log(
                `Message: ${error.message}`
            );

            // ------------------------------------------
            // ONLY RETRY TEMPORARY ERRORS
            // ------------------------------------------

            if (
                error.status !== 503 &&
                error.status !== 429 &&
                error.status !== 500
            ) {
                throw error;
            }

            // ------------------------------------------
            // WAIT BEFORE RETRY
            // ------------------------------------------

            if (attempt < maxRetries) {

                const delay =
                    attempt === 1
                        ? 3000
                        : 6000;

                console.log(
                    `⏳ Waiting ${delay / 1000} seconds...`
                );

                await sleep(delay);
            }
        }
    }

    throw lastError;
}

// --------------------------------------------------
// GENERATE QUIZ
// --------------------------------------------------

app.post("/api/generate-quiz", async (req, res) => {

    try {

        const {
            count,
            difficulty
        } = req.body;

        const questionCount = Number(count);

        // ------------------------------------------
        // VALIDATE COUNT
        // ------------------------------------------

        if (
            !Number.isInteger(questionCount) ||
            questionCount < 1 ||
            questionCount > 20
        ) {

            return res.status(400).json({

                error:
                    "Question count must be between 1 and 20."

            });

        }

        // ------------------------------------------
        // VALIDATE DIFFICULTY
        // ------------------------------------------

        const allowedDifficulties = [
            "easy",
            "medium",
            "hard",
            "mixed"
        ];

        if (!allowedDifficulties.includes(difficulty)) {

            return res.status(400).json({

                error:
                    "Invalid difficulty."

            });

        }

        // ------------------------------------------
        // DIFFICULTY
        // ------------------------------------------

        const difficultyInstruction =
            difficulty === "mixed"

                ? "Use a mixture of easy, medium, and hard questions."

                : `The difficulty level must be ${difficulty}.`;

        // ------------------------------------------
        // PROMPT
        // ------------------------------------------

        const prompt = `

You are an expert programming and computer science quiz generator.

Generate exactly ${questionCount} fresh multiple-choice questions.

Difficulty:
${difficultyInstruction}

Topics may include:

- Programming
- C
- C++
- Java
- Python
- JavaScript
- Data Structures
- Algorithms
- OOP
- DBMS
- Operating Systems
- Computer Networks
- Computer Science fundamentals

Requirements:

1. Generate exactly ${questionCount} questions.

2. Every question must have exactly 4 options.

3. There must be exactly ONE correct answer.

4. All four options must be different.

5. The correct answer must exactly match one option.

6. Do not create duplicate questions.

7. Questions should test actual understanding.

8. Avoid ambiguous questions.

9. Provide a short explanation for every answer.

10. Randomize the questions.

11. Randomize the topics.

12. Do not use markdown.

13. Return ONLY valid JSON.

Each question must contain:

question
options
correct
solution

The "correct" field must contain the exact text
of the correct option.

The "solution" field must briefly explain
why the correct answer is correct.

`;

        console.log("");
        console.log("======================================");
        console.log("🧠 GENERATING AI QUIZ");
        console.log("======================================");

        console.log(
            `Questions : ${questionCount}`
        );

        console.log(
            `Difficulty: ${difficulty}`
        );

        console.log(
            `Primary   : ${PRIMARY_MODEL}`
        );

        console.log(
            `Fallback  : ${FALLBACK_MODEL}`
        );

        console.log("======================================");

        // ------------------------------------------
        // TRY PRIMARY MODEL
        // ------------------------------------------

        let response;

        try {

            response = await generateWithRetry(
                PRIMARY_MODEL,
                prompt,
                2
            );

        } catch (primaryError) {

            console.log("");
            console.log(
                `⚠️ ${PRIMARY_MODEL} failed.`
            );

            console.log(
                `🔄 Switching to ${FALLBACK_MODEL}...`
            );

            // --------------------------------------
            // TRY FALLBACK MODEL
            // --------------------------------------

            response = await generateWithRetry(
                FALLBACK_MODEL,
                prompt,
                2
            );
        }

        // ------------------------------------------
        // READ RESPONSE
        // ------------------------------------------

        const text = response.text;

        if (!text) {

            throw new Error(
                "Gemini returned an empty response."
            );

        }

        // ------------------------------------------
        // PARSE JSON
        // ------------------------------------------

        let data;

        try {

            data = JSON.parse(text);

        } catch (error) {

            console.error(
                "❌ Gemini returned invalid JSON:"
            );

            console.error(text);

            throw new Error(
                "Gemini returned invalid JSON."
            );
        }

        // ------------------------------------------
        // VALIDATE QUESTIONS
        // ------------------------------------------

        if (
            !data.questions ||
            !Array.isArray(data.questions)
        ) {

            throw new Error(
                "Gemini response does not contain questions."
            );

        }

        // ------------------------------------------
        // CHECK QUESTION COUNT
        // ------------------------------------------

        if (
            data.questions.length !== questionCount
        ) {

            throw new Error(

                `Gemini returned ${data.questions.length} questions instead of ${questionCount}.`

            );

        }

        // ------------------------------------------
        // VALIDATE EACH QUESTION
        // ------------------------------------------

        for (
            const question
            of data.questions
        ) {

            // Question text

            if (
                !question.question ||
                typeof question.question !== "string"
            ) {

                throw new Error(
                    "Question text is missing."
                );

            }

            // Options

            if (
                !Array.isArray(question.options) ||
                question.options.length !== 4
            ) {

                throw new Error(
                    "Every question must have exactly 4 options."
                );

            }

            // Correct answer

            if (!question.correct) {

                throw new Error(
                    "Correct answer is missing."
                );

            }

            // Solution

            if (!question.solution) {

                throw new Error(
                    "Solution is missing."
                );

            }

            // Correct answer must be one of options

            if (
                !question.options.includes(
                    question.correct
                )
            ) {

                throw new Error(
                    "Correct answer does not match an option."
                );

            }

            // Check duplicate options

            const uniqueOptions =
                new Set(question.options);

            if (
                uniqueOptions.size !== 4
            ) {

                throw new Error(
                    "Duplicate options detected."
                );

            }

        }

        // ------------------------------------------
        // SUCCESS
        // ------------------------------------------

        console.log("");
        console.log(
            `🎉 Successfully generated ${questionCount} questions!`
        );

        console.log(
            "======================================"
        );

        res.json({

            questions:
                data.questions

        });

    } catch (error) {

        console.error("");
        console.error(
            "======================================"
        );

        console.error(
            "❌ QUIZ GENERATION FAILED"
        );

        console.error(
            "======================================"
        );

        console.error(
            error.message
        );

        console.error(
            "======================================"
        );

        // ------------------------------------------
        // TEMPORARY GEMINI ERROR
        // ------------------------------------------

        if (
            error.status === 503 ||
            error.status === 429 ||
            error.status === 500
        ) {

            return res.status(503).json({

                error:
                    "Gemini is temporarily unavailable.",

                details:
                    "Both Gemini models were unable to process the request. Please try again after a short wait."

            });

        }

        // ------------------------------------------
        // OTHER ERROR
        // ------------------------------------------

        return res.status(500).json({

            error:
                "Failed to generate quiz.",

            details:
                error.message ||
                "Unknown server error."

        });

    }

});

// --------------------------------------------------
// START SERVER
// --------------------------------------------------

app.listen(PORT, () => {

    console.log("");
    console.log("======================================");
    console.log("🚀 AI QUIZ SERVER STARTED");
    console.log("======================================");

    console.log(
        `🌐 http://localhost:${PORT}`
    );

    console.log(
        `🤖 Primary Model : ${PRIMARY_MODEL}`
    );

    console.log(
        `🔄 Fallback Model: ${FALLBACK_MODEL}`
    );

    console.log(
        "🔑 API Key       : Loaded"
    );

    console.log("======================================");
    console.log("");

});