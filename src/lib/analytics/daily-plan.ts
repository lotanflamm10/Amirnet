import type { UserProgress } from "@/types/progress";
import { calculateMasteryScore } from "./mastery-engine";

export interface DailyPlanItem {
  type: "questions" | "vocab" | "review" | "booster";
  mode?: string;
  count: number;
  label: string;
  priority: "high" | "medium" | "low";
  reason: string;
  href: string;
  icon: string;
  color: string;
}

const CATEGORY_TO_MODE: Record<string, string> = {
  sentenceCompletion: "sentenceCompletion", restatements: "restatements",
  grammar: "grammar", wordFormation: "wordFormation", reading: "reading",
  lectureQuestions: "lectureQuestions", textCompletion: "textCompletion",
};
const CATEGORY_LABELS: Record<string, string> = {
  sentenceCompletion: "השלמת משפטים", restatements: "ניסוח מחדש", grammar: "דקדוק בהקשר",
  wordFormation: "צורות מילים", reading: "הבנת הנקרא", lectureQuestions: "שאלות הרצאה",
  textCompletion: "השלמת טקסט",
};
const CATEGORY_ICONS: Record<string, string> = {
  sentenceCompletion: "✏️", restatements: "🔄", grammar: "📝",
  wordFormation: "🔤", reading: "📚", lectureQuestions: "🎧", textCompletion: "📄",
};

// Maps weak category → recommended skill booster mode + label
const CATEGORY_TO_BOOSTER: Record<string, { mode: string; label: string; icon: string }> = {
  sentenceCompletion: { mode: "vocabularyInContext", label: "אוצר מילים בהקשר",   icon: "📚" },
  restatements:       { mode: "restatementMini",    label: "ניסוח מחדש מהיר",   icon: "✍️" },
  grammar:            { mode: "connectorPractice",   label: "מילות קישור",        icon: "🔗" },
  wordFormation:      { mode: "synonymRecognition",  label: "זיהוי נרדפות",       icon: "🔁" },
  reading:            { mode: "academicPhrase",      label: "ביטויים אקדמיים",    icon: "🎓" },
  textCompletion:     { mode: "sentenceLogic",       label: "היגיון משפטי",       icon: "🧠" },
  lectureQuestions:   { mode: "connectorPractice",   label: "מילות קישור",        icon: "🔗" },
};

export function generateDailyPlan(progress: UserProgress, vocabDueCount: number = 0): DailyPlanItem[] {
  const items: DailyPlanItem[] = [];
  const goal = progress.dailyGoal?.targetQuestions ?? 20;
  let questionsAllocated = 0;

  // Vocab if needed
  if (vocabDueCount > 0 || (progress.vocabProgress?.totalSeen ?? 0) < 50) {
    items.push({
      type: "vocab", count: Math.min(20, Math.max(10, vocabDueCount)),
      label: "מילים לחזרה", priority: vocabDueCount > 5 ? "high" : "medium",
      reason: vocabDueCount > 0 ? `${vocabDueCount} מילים ממתינות` : "חזק את אוצר המילים",
      href: "/vocab/swipe", icon: "📖", color: "var(--success)",
    });
  }

  // Weak categories
  const weakCats = [...(progress.categoryProgress ?? [])]
    .filter(c => c.totalAnswered >= 3 && calculateMasteryScore(c) < 65)
    .sort((a, b) => calculateMasteryScore(a) - calculateMasteryScore(b));

  for (let i = 0; i < Math.min(2, weakCats.length); i++) {
    const cat = weakCats[i];
    const mode = CATEGORY_TO_MODE[cat.category];
    if (!mode) continue;
    const count = Math.min(10, Math.max(6, Math.floor((goal - questionsAllocated) * (i === 0 ? 0.4 : 0.3))));
    items.push({
      type: "questions", mode, count,
      label: CATEGORY_LABELS[cat.category] ?? cat.category,
      priority: i === 0 ? "high" : "medium",
      reason: `דיוק ${cat.accuracyPercent}% — זקוק לשיפור`,
      href: `/practice/${mode}`, icon: CATEGORY_ICONS[cat.category] ?? "📌",
      color: i === 0 ? "var(--danger)" : "var(--warn)",
    });
    questionsAllocated += count;
  }

  // Adaptive skill booster: recommend based on weakest category
  if (weakCats.length > 0) {
    const topWeak = weakCats[0];
    const booster = CATEGORY_TO_BOOSTER[topWeak.category];
    if (booster && !items.some(i => i.mode === booster.mode)) {
      items.push({
        type: "booster", mode: booster.mode, count: 10,
        label: booster.label,
        priority: "medium",
        reason: `חיזוק מיומנות — נחלש ב${CATEGORY_LABELS[topWeak.category] ?? topWeak.category}`,
        href: `/practice/${booster.mode}`, icon: booster.icon, color: "var(--teal)",
      });
    }
  }

  // Fallback: mixed
  if (questionsAllocated < goal || items.filter(i => i.type === "questions").length === 0) {
    const remaining = Math.max(goal - questionsAllocated, items.length === 0 ? goal : 0);
    if (remaining > 0) {
      items.push({
        type: "questions", mode: "mixed", count: Math.min(remaining, 15),
        label: "תרגול מעורב", priority: items.filter(i => i.type === "questions").length === 0 ? "high" : "low",
        reason: items.filter(i => i.type === "questions").length === 0 ? "תרגול מאוזן לתחילה" : "שמור על רמה גבוהה",
        href: "/practice/mixed", icon: "⚡", color: "var(--teal)",
      });
    }
  }

  return items;
}
