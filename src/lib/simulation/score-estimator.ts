// WARNING: pilot sections must never be included in calculateMainScore().
import { accuracyToScore } from "@/lib/scoring/score";

export type { ScoreBand, BandColor } from "@/lib/scoring/score";
export { getScoreBand } from "@/lib/scoring/score";

export interface SectionResult {
  sectionId: string;
  isPilot: boolean;
  correct: number;
  total: number;
  timeTakenSeconds: number;
  type: string;
}

const SECTION_WEIGHTS: Record<string, number> = {
  reading: 3,
  restatements: 2,
  sentenceCompletion: 1.5,
  grammar: 1,
  wordFormation: 1,
  textCompletion: 1,
  lectureQuestions: 1,
};

export function calculateMainScore(results: SectionResult[]): number {
  const mainResults = results.filter((r) => !r.isPilot);
  if (mainResults.length === 0) return 80;

  let weightedCorrect = 0;
  let weightedTotal = 0;

  for (const r of mainResults) {
    const w = SECTION_WEIGHTS[r.type] ?? 1;
    weightedCorrect += r.correct * w;
    weightedTotal += r.total * w;
  }

  const accuracy = weightedTotal > 0 ? weightedCorrect / weightedTotal : 0;
  return accuracyToScore(accuracy);
}

export function formatScoreDisplay(mainScore: number, pilotBonus: number): string {
  if (pilotBonus > 0) return `Score: ${mainScore} + ${pilotBonus} bonus (pilot) = ${mainScore + pilotBonus}`;
  return `Score: ${mainScore}`;
}
