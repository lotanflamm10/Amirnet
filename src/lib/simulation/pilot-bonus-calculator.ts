// Completely separate from score-estimator.ts. Never import score-estimator here.
import type { SectionResult } from "./score-estimator";

export function calculatePilotBonus(pilotResults: SectionResult[]): number {
  // Belt-and-braces: simulation-engine.ts already strips writingTask items
  // from correct/total (q.answer === -1), so writing sections arrive here
  // with total = 0. We also skip the writingTask section type explicitly
  // in case a future caller wires this to a different pipeline.
  const pilotOnly = pilotResults.filter((r) => r.isPilot && r.type !== "writingTask");
  if (pilotOnly.length === 0) return 0;

  const totalCorrect = pilotOnly.reduce((sum, r) => sum + r.correct, 0);
  const totalQuestions = pilotOnly.reduce((sum, r) => sum + r.total, 0);

  if (totalQuestions === 0) return 0;
  const accuracy = totalCorrect / totalQuestions;

  // 0 bonus if accuracy < 50%, 1 if 50-75%, 2 if >75%
  // Wrong answers: no penalty (min 0)
  if (accuracy >= 0.75) return 2;
  if (accuracy >= 0.5) return 1;
  return 0;
}
