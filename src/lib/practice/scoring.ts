import type { PracticeResult } from "@/types/questions";
import type { QuestionCategory } from "@/types/questions";
import { accuracyToScore } from "@/lib/scoring/score";

export type { ScoreBand, BandColor } from "@/lib/scoring/score";
export { getScoreBand } from "@/lib/scoring/score";

export function estimateScore(correct: number, total: number, _category: QuestionCategory): number {
  if (total === 0) return 50;
  return accuracyToScore(correct / total);
}

export function calculateSessionAccuracy(results: PracticeResult[]): number {
  if (results.length === 0) return 0;
  const correct = results.filter((r) => r.correct).length;
  return Math.round((correct / results.length) * 100);
}

/** Format seconds to "M:SS" display. e.g. 154 → "2:34" */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
