import type { PassageBundle } from "./reading-passages";

/**
 * Minimum requirements a passage must satisfy to be eligible for a
 * full AMIRAM-style simulation.
 *
 * These intentionally mirror the spec in PROJECT_CONTEXT.md §8.5:
 *   - One central topic developed across multiple paragraphs
 *   - At least 3 paragraphs
 *   - Exactly 5 questions covering main idea, detail, inference,
 *     vocabulary-in-context and author purpose / paragraph structure
 *   - Substantial body (not a 2-sentence stub)
 */
export const SIMULATION_MIN_PARAGRAPHS = 3;
export const SIMULATION_MIN_QUESTIONS = 5;
export const SIMULATION_MIN_BODY_WORDS = 180;

/** Practice passages can be shorter — 1–2 paragraphs is allowed. */
export const PRACTICE_MIN_QUESTIONS = 3;
export const PRACTICE_MAX_QUESTIONS = 5;
export const PRACTICE_MIN_BODY_WORDS = 60;

export interface ValidationResult {
  ok: boolean;
  reasons: string[];
  paragraphCount: number;
  wordCount: number;
  questionCount: number;
}

function countParagraphs(body: string): number {
  return body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean).length;
}

function countWords(body: string): number {
  return body.trim().split(/\s+/).filter(Boolean).length;
}

/** Strict validator used to filter the simulation pool. */
export function validateForSimulation(bundle: PassageBundle): ValidationResult {
  const body = bundle.passage.body ?? "";
  const paragraphCount = countParagraphs(body);
  const wordCount = countWords(body);
  const questionCount = bundle.questions.length;
  const reasons: string[] = [];

  if (paragraphCount < SIMULATION_MIN_PARAGRAPHS) {
    reasons.push(`needs ≥${SIMULATION_MIN_PARAGRAPHS} paragraphs (has ${paragraphCount})`);
  }
  if (questionCount < SIMULATION_MIN_QUESTIONS) {
    reasons.push(`needs ≥${SIMULATION_MIN_QUESTIONS} questions (has ${questionCount})`);
  }
  if (wordCount < SIMULATION_MIN_BODY_WORDS) {
    reasons.push(`body too short for exam quality (${wordCount} words, need ≥${SIMULATION_MIN_BODY_WORDS})`);
  }

  return { ok: reasons.length === 0, reasons, paragraphCount, wordCount, questionCount };
}

/** Looser validator used for practice-mode passages. */
export function validateForPractice(bundle: PassageBundle): ValidationResult {
  const body = bundle.passage.body ?? "";
  const paragraphCount = countParagraphs(body);
  const wordCount = countWords(body);
  const questionCount = bundle.questions.length;
  const reasons: string[] = [];

  if (questionCount < PRACTICE_MIN_QUESTIONS) {
    reasons.push(`needs ≥${PRACTICE_MIN_QUESTIONS} questions (has ${questionCount})`);
  }
  if (wordCount < PRACTICE_MIN_BODY_WORDS) {
    reasons.push(`body too short (${wordCount} words, need ≥${PRACTICE_MIN_BODY_WORDS})`);
  }

  return { ok: reasons.length === 0, reasons, paragraphCount, wordCount, questionCount };
}
