export const XP_REWARDS = {
  correctEasy: 5, correctMedium: 8, correctHard: 12,
  dailyPlanComplete: 50, simulationComplete: 100,
  vocabReview: 3, vocabMaster: 10, diagnosticComplete: 75,
  streakBonus: 15, reviewSession: 20,
};

/**
 * @property nameKey — looked up via `t.xp.level1` … `t.xp.level8`.
 *                     `name` remains as the canonical Hebrew label for
 *                     legacy code paths that haven't been migrated yet.
 */
export interface LevelDef { level: number; name: string; nameKey: string; minXp: number; maxXp: number; }
export const LEVELS: LevelDef[] = [
  { level: 1, name: "מתחיל", nameKey: "level1", minXp: 0,    maxXp: 99 },
  { level: 2, name: "לומד",   nameKey: "level2", minXp: 100,  maxXp: 299 },
  { level: 3, name: "מתקדם", nameKey: "level3", minXp: 300,  maxXp: 599 },
  { level: 4, name: "מיומן", nameKey: "level4", minXp: 600,  maxXp: 999 },
  { level: 5, name: "מומחה", nameKey: "level5", minXp: 1000, maxXp: 1799 },
  { level: 6, name: "אמן",    nameKey: "level6", minXp: 1800, maxXp: 2999 },
  { level: 7, name: "מאסטר", nameKey: "level7", minXp: 3000, maxXp: 4999 },
  { level: 8, name: "אלוף",   nameKey: "level8", minXp: 5000, maxXp: 99999 },
];

export interface Achievement { id: string; label: string; description: string; icon: string; xpReward: number; }
export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_diagnostic", label: "מאובחן",             description: "השלמת את הבדיקה הראשונית",    icon: "diagnostic",         xpReward: 75  },
  { id: "streak_3",         label: "רצף 3 ימים",         description: "3 ימים ברצף",                 icon: "streak_3",           xpReward: 30  },
  { id: "streak_7",         label: "שבוע מלא",           description: "7 ימים ברצף",                 icon: "streak_7",           xpReward: 75  },
  { id: "questions_100",    label: "100 שאלות",           description: "ענית על 100 שאלות",           icon: "questions_100",      xpReward: 50  },
  { id: "questions_500",    label: "500 שאלות",           description: "ענית על 500 שאלות",           icon: "questions_500",      xpReward: 150 },
  { id: "vocab_100",        label: "100 מילים",           description: "למדת 100 מילים",              icon: "vocab_100",          xpReward: 50  },
  { id: "simulation_done",  label: "סימולציה ראשונה",     description: "סיימת סימולציה מלאה",         icon: "simulation",         xpReward: 100 },
  { id: "first_day",        label: "יום ראשון",           description: "התחלת את המסע",               icon: "first_day",          xpReward: 20  },
  { id: "restatement_master", label: "מאסטר ניסוח מחדש", description: "80%+ דיוק בניסוח מחדש",      icon: "restatement_master", xpReward: 75  },
  { id: "grammar_master",   label: "מאסטר דקדוק",        description: "80%+ דיוק בדקדוק",           icon: "grammar_master",     xpReward: 75  },
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
