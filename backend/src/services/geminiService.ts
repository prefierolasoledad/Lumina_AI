import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

/**
 * Build a strict structured prompt from the assignment config.
 */
function buildPrompt(config: any) {
  const { title, subject, difficulty, questionRows, additionalInfo, timeLimit } = config;

  const questionSpec = questionRows
    .map((r: any) => `- ${r.count} ${r.type} question(s), ${r.marks} mark(s) each`)
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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Transient errors worth retrying: overloaded (503), rate-limited (429),
// internal (500), or connection blips. Bad requests / auth errors are NOT retried.
function isRetryableError(err: any): boolean {
  const msg = String(err?.message || err || '').toLowerCase();
  return (
    msg.includes('503') ||
    msg.includes('service unavailable') ||
    msg.includes('overloaded') ||
    msg.includes('high demand') ||
    msg.includes('429') ||
    msg.includes('rate limit') ||
    msg.includes('quota') ||
    msg.includes('500') ||
    msg.includes('internal error') ||
    msg.includes('fetch failed') ||
    msg.includes('econnreset') ||
    msg.includes('etimedout')
  );
}

/**
 * Generate content with up to 3 bounded retries + exponential backoff on the
 * SAME model (no model switching). If all 3 attempts hit transient errors,
 * throws a clear high-demand message for the frontend to surface.
 */
async function generateWithResilience(
  genAI: GoogleGenerativeAI,
  parts: any[],
  generationConfig: any = { responseMimeType: 'application/json' }
): Promise<string> {
  const modelName = process.env.GEMINI_MODEL || 'gemini-flash-latest';
  const MAX_ATTEMPTS = 3;

  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig,
  });

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const result = await model.generateContent(parts);
      const text = result.response.text();
      if (!text) throw new Error('Gemini API returned an empty response.');
      return text;
    } catch (err: any) {
      if (!isRetryableError(err)) {
        // Non-transient (bad request, auth, etc.) — fail fast, no point retrying.
        throw err;
      }
      console.warn(
        `[Gemini] ${modelName} transient error (attempt ${attempt}/${MAX_ATTEMPTS}): ${err.message}`
      );
      if (attempt < MAX_ATTEMPTS) {
        await sleep(1000 * Math.pow(2, attempt - 1)); // 1s, 2s
      }
    }
  }

  // All 3 attempts exhausted on transient errors — surface a clear warning.
  throw new Error(
    "This request can't be fulfilled right now — the system is experiencing high demand. Please try again in a few moments."
  );
}

/**
 * Generate free-form text (Markdown) from a prompt, reusing the same resilient
 * retry/high-demand handling. Used by the AI Teacher's Toolkit tools.
 */
export async function generateText(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.replace(/^["']|["']$/g, '') : '';
  if (!apiKey) {
    throw new Error('API Key is missing in environment variables.');
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  // Empty generationConfig → default text/plain (Markdown) response.
  return generateWithResilience(genAI, [{ text: prompt }], {});
}

/**
 * Call Gemini API and parse the structured JSON response.
 */
export async function generateQuestionPaper(config: any) {
  const prompt = buildPrompt(config);
  const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.replace(/^["']|["']$/g, '') : '';

  if (!apiKey) {
    throw new Error('API Key is missing in environment variables.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const parts: any[] = [{ text: prompt }];
  const readFilePaths: string[] = [];

  if (config.files && config.files.length > 0) {
    for (const file of config.files) {
      if (fs.existsSync(file.path)) {
        const data = fs.readFileSync(file.path).toString("base64");
        parts.push({
          inlineData: {
            data,
            mimeType: file.mimetype
          }
        });
        readFilePaths.push(file.path);
      }
    }
  }

  // Generate with retries/fallback. Files are NOT deleted before this succeeds,
  // so a queue retry can still read the reference materials.
  const content = await generateWithResilience(genAI, parts);

  // Clean up uploaded files only after a successful generation.
  for (const filePath of readFilePaths) {
    fs.unlink(filePath, (err) => {
      if (err) console.error('Failed to delete temp file:', filePath);
    });
  }

  if (!content) {
    throw new Error('Gemini API returned an empty response.');
  }

  // Strip markdown code fences if wrapped in ```json ... ```
  const cleaned = content
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`Gemini API returned invalid JSON: ${cleaned.substring(0, 200)}`);
  }

  if (!parsed.sections || !Array.isArray(parsed.sections)) {
    throw new Error('Gemini API response missing sections array');
  }

  return parsed;
}
