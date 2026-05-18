// Completely separate from score-estimator.ts. Never import score-estimator here.
import type { SectionResult } from "./score-estimator";

export function calculatePilotBonus(pilotResults: SectionResult[]): number {
  const pilotOnly = pilotResults.filter((r) => r.isPilot);
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
