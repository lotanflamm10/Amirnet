import type { QuestionCategory } from "@/types/questions";

/**
 * Per-question time budgets for challenge mode, aligned with the real
 * Amirnet pacing in `simulation-config.json`. Challenge is intentionally
 * "snappier" than simulation but never below 75% of the simulation
 * per-question budget.
 *
 * Source: simulation-config.json
 *   sentenceCompletion: 240s / 4Q = 60s/Q  → challenge 60s (100%)
 *   restatements:       360s / 3Q = 120s/Q → challenge 90s  (75%)
 *   reading:            single Q in challenge — challenge 90s
 *                       (whole-passage reading is out of scope here)
 *   grammar:            240s / 4Q = 60s/Q  → challenge 60s (100%)
 *   wordFormation:      180s / 4Q = 45s/Q  → challenge 60s (above sim)
 *   textCompletion:     240s / 4Q = 60s/Q  → challenge 60s (100%)
 *   lectureQuestions:   420s / 5Q = 84s/Q  → challenge 75s  (89%)
 *   skill boosters:     —                  → challenge 45s
 */
export const CHALLENGE_PER_QUESTION_SECONDS: Record<string, number> = {
  sentenceCompletion: 60,
  restatements: 90,
  reading: 90,
  grammar: 60,
  wordFormation: 60,
  textCompletion: 60,
  lectureQuestions: 75,
  // Skill boosters — short, vocabulary-heavy items
  vocabularyInContext: 45,
  synonymRecognition: 45,
  antonymRecognition: 45,
  connectorPractice: 45,
  restatementMini: 45,
  sentenceLogic: 45,
  distractorTrap: 45,
  academicPhrase: 45,
  // Pilot-only category — keep generous for the writing prompt
  writingTask: 300,
  vocabulary: 30,
  mixed: 60,
};

export const CHALLENGE_DEFAULT_SECONDS = 60;

/**
 * Minimum read window (seconds) after answering before the challenge will
 * auto-advance to the next question. The user can hit "Next" sooner; this
 * is just the fallback for users who don't interact.
 */
export const CHALLENGE_MIN_READ_SECONDS = 15;

export function getChallengePerQuestionSeconds(category: QuestionCategory | string | undefined): number {
  if (!category) return CHALLENGE_DEFAULT_SECONDS;
  return CHALLENGE_PER_QUESTION_SECONDS[category] ?? CHALLENGE_DEFAULT_SECONDS;
}
