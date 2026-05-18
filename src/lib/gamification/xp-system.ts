export const XP_REWARDS = {
  correctEasy: 5, correctMedium: 8, correctHard: 12,
  dailyPlanComplete: 50, simulationComplete: 100,
  vocabReview: 3, vocabMaster: 10, diagnosticComplete: 75,
  streakBonus: 15, reviewSession: 20,
};

export interface LevelDef { level: number; name: string; minXp: number; maxXp: number; }
export const LEVELS: LevelDef[] = [
  { level: 1, name: "מתחיל", minXp: 0, maxXp: 99 },
  { level: 2, name: "לומד", minXp: 100, maxXp: 299 },
  { level: 3, name: "מתקדם", minXp: 300, maxXp: 599 },
  { level: 4, name: "מיומן", minXp: 600, maxXp: 999 },
  { level: 5, name: "מומחה", minXp: 1000, maxXp: 1799 },
  { level: 6, name: "אמן", minXp: 1800, maxXp: 2999 },
  { level: 7, name: "מאסטר", minXp: 3000, maxXp: 4999 },
  { level: 8, name: "אלוף", minXp: 5000, maxXp: 99999 },
];

export interface Achievement { id: string; label: string; description: string; icon: string; xpReward: number; }
export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_diagnostic", label: "מאובחן", description: "השלמת את הבדיקה הראשונית", icon: "🔬", xpReward: 75 },
  { id: "streak_3", label: "רצף 3 ימים", description: "3 ימים ברצף", icon: "🔥", xpReward: 30 },
  { id: "streak_7", label: "שבוע מלא", description: "7 ימים ברצף", icon: "🏅", xpReward: 75 },
  { id: "questions_100", label: "100 שאלות", description: "ענית על 100 שאלות", icon: "💯", xpReward: 50 },
  { id: "questions_500", label: "500 שאלות", description: "ענית על 500 שאלות", icon: "🌟", xpReward: 150 },
  { id: "vocab_100", label: "100 מילים", description: "למדת 100 מילים", icon: "📚", xpReward: 50 },
  { id: "simulation_done", label: "סימולציה ראשונה", description: "סיימת סימולציה מלאה", icon: "🎮", xpReward: 100 },
  { id: "first_day", label: "יום ראשון", description: "התחלת את המסע", icon: "🚀", xpReward: 20 },
  { id: "restatement_master", label: "מאסטר ניסוח מחדש", description: "80%+ דיוק בניסוח מחדש", icon: "✍️", xpReward: 75 },
  { id: "grammar_master", label: "מאסטר דקדוק", description: "80%+ דיוק בדקדוק", icon: "📝", xpReward: 75 },
];

export function getLevelFromXp(xp: number): LevelDef {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXp) return LEVELS[i];
  }
  return LEVELS[0];
}

export function getXpProgress(xp: number): { current: number; needed: number; pct: number } {
  const lev = getLevelFromXp(xp);
  const current = xp - lev.minXp;
  const needed = lev.maxXp - lev.minXp + 1;
  return { current, needed, pct: Math.min(100, Math.round((current / needed) * 100)) };
}

export function calculateXpGain(correct: boolean, difficulty: string, streak: number): number {
  if (!correct) return 0;
  const base = difficulty === "hard" ? XP_REWARDS.correctHard : difficulty === "medium" ? XP_REWARDS.correctMedium : XP_REWARDS.correctEasy;
  const combo = streak >= 10 ? 2 : streak >= 5 ? 1.5 : streak >= 3 ? 1.2 : 1;
  return Math.round(base * combo);
}
