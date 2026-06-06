import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * Build a strict structured prompt from the assignment config.
 */
function buildPrompt(config) {
  const { title, subject, difficulty, questionRows, additionalInfo, timeLimit } = config;

  const questionSpec = questionRows
    .map((r) => `- ${r.count} ${r.type} question(s), ${r.marks} mark(s) each`)
    .join('\n');

  return `You are an expert teacher creating a formal exam question paper.

Assignment: "${title}"
Subject: ${subject}
Overall Difficulty: ${difficulty}
Time Limit: ${timeLimit} minutes
${additionalInfo ? `Additional Instructions: ${additionalInfo}` : ''}

Question Structure Required:
${questionSpec}

Instructions:
1. Group questions into logical sections (Section A, Section B, etc.) based on question type.
2. Each section should have a clear title and a short instruction line.
3. Vary difficulty within each section — mix easy, medium, hard appropriately based on the overall difficulty setting.
4. For MCQ questions, provide 4 options labeled A, B, C, D.
5. Every question must have a difficulty tag: "easy", "medium", or "hard".
6. Do NOT include answers.
7. Make questions academically appropriate, specific, and well-worded.

IMPORTANT: Respond ONLY with valid JSON matching this exact structure, no markdown, no explanation:

{
  "sections": [
    {
      "title": "Section A",
      "instruction": "Attempt all questions. Each question carries 1 mark.",
      "questions": [
        {
          "text": "Question text here",
          "type": "mcq",
          "difficulty": "easy",
          "marks": 1,
          "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"]
        }
      ]
    }
  ],
  "totalMarks": 50,
  "totalQuestions": 17
}`;
}

/**
 * Call Gemini and parse the structured JSON response.
 */
export async function generateQuestionPaper(config) {
  const prompt = buildPrompt(config);

  const result = await model.generateContent(prompt);
  const raw = result.response.text().trim();

  // Strip markdown code fences if Gemini wraps in ```json ... ```
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`Gemini returned invalid JSON: ${cleaned.substring(0, 200)}`);
  }

  if (!parsed.sections || !Array.isArray(parsed.sections)) {
    throw new Error('Gemini response missing sections array');
  }

  return parsed;
}
