import { generateText } from '../services/geminiService.js';

/**
 * Definitions for each AI Teacher's Toolkit tool: which inputs it needs and how
 * to turn them into a Gemini prompt. Keeping this server-side means the client
 * only sends the tool id + raw inputs (never a raw prompt to abuse).
 */
type ToolBuilder = (inputs: Record<string, string>) => string;

const sanitize = (v: unknown, max = 4000) =>
  (typeof v === 'string' ? v : '').toString().slice(0, max).trim();

const TOOLS: Record<string, { fields: string[]; build: ToolBuilder }> = {
  'lesson-plan': {
    fields: ['topic', 'gradeLevel', 'duration'],
    build: (i) =>
      `You are an expert teacher. Create a clear, well-structured lesson plan in Markdown.\n\n` +
      `Topic: ${sanitize(i.topic)}\n` +
      `Grade / Level: ${sanitize(i.gradeLevel) || 'general'}\n` +
      `Class duration: ${sanitize(i.duration) || '45 minutes'}\n\n` +
      `Include: learning objectives, materials needed, a timed activity breakdown, ` +
      `key discussion questions, and a short assessment/exit ticket.`,
  },
  'rubric': {
    fields: ['assignmentTitle', 'criteria', 'maxPoints'],
    build: (i) =>
      `Create a detailed grading rubric in a Markdown table for the following assignment.\n\n` +
      `Assignment: ${sanitize(i.assignmentTitle)}\n` +
      `Total points: ${sanitize(i.maxPoints) || '100'}\n` +
      `Criteria to assess (if blank, choose sensible ones): ${sanitize(i.criteria) || 'not specified'}\n\n` +
      `For each criterion give 4 performance levels (Excellent, Good, Fair, Needs Improvement) ` +
      `with point ranges and concise descriptors.`,
  },
  'concept-explainer': {
    fields: ['concept', 'audience'],
    build: (i) =>
      `Explain the following concept clearly in Markdown for the given audience.\n\n` +
      `Concept: ${sanitize(i.concept)}\n` +
      `Audience: ${sanitize(i.audience) || 'students new to the topic'}\n\n` +
      `Use a simple definition, an intuitive analogy, a worked example, and 2-3 common misconceptions.`,
  },
  'quiz-from-notes': {
    fields: ['notes', 'numQuestions'],
    build: (i) =>
      `From the study notes below, write a short quiz in Markdown.\n\n` +
      `Number of questions: ${sanitize(i.numQuestions) || '5'}\n` +
      `Notes:\n"""\n${sanitize(i.notes, 8000)}\n"""\n\n` +
      `Mix multiple-choice and short-answer questions. Provide an answer key at the end under a "## Answer Key" heading.`,
  },
};

/**
 * POST /api/toolkit/generate
 * Body: { tool: string, inputs: Record<string,string> }
 */
export async function runToolkit(req, res) {
  try {
    const { tool, inputs } = req.body || {};

    if (!tool || typeof tool !== 'string' || !TOOLS[tool]) {
      return res.status(400).json({ success: false, error: 'Unknown or missing tool' });
    }

    const def = TOOLS[tool];
    const safeInputs: Record<string, string> = {};
    for (const field of def.fields) {
      safeInputs[field] = sanitize(inputs?.[field], field === 'notes' ? 8000 : 4000);
    }

    // Require at least the primary (first) field to be filled.
    if (!safeInputs[def.fields[0]]) {
      return res.status(400).json({ success: false, error: `"${def.fields[0]}" is required` });
    }

    const prompt = def.build(safeInputs);
    const result = await generateText(prompt);

    return res.json({ success: true, data: { tool, result } });
  } catch (err: any) {
    console.error('runToolkit error:', err.message);
    // The Gemini service throws a friendly high-demand message when exhausted.
    return res.status(503).json({
      success: false,
      error: err.message || 'The AI service is temporarily unavailable. Please try again.',
    });
  }
}
