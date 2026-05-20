"use client";
import Link from "next/link";
import { useLayoutEffect, useState } from "react";
import { loadProgress, getWeakCategories } from "@/lib/progress/local-progress-store";
import { getVocabStats } from "@/lib/vocab/vocab-store";
import { withCustomItems } from "@/lib/vocab/custom-vocab-store";
import { DAILY_VOCAB_LIMIT } from "@/lib/vocab/daily-vocab";
import vocabData from "@/data/seed/vocab.normalized.json";
import type { VocabItem } from "@/types/vocab";
import { BookOpen, CalendarCheck, Target, Play, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import type { Translations } from "@/lib/i18n/translations";

function categoryLabel(category: string, t: Translations): string {
  const map: Record<string, string> = {
    sentenceCompletion: t.dashboard.catSentenceCompletion,
    restatements:       t.dashboard.catRestatements,
    reading:            t.dashboard.catReading,
    grammar:            t.dashboard.catGrammar,
    wordFormation:      t.dashboard.catWordFormation,
    textCompletion:     t.dashboard.catTextCompletion,
    lectureQuestions:   t.dashboard.catLectureQuestions,
    vocabulary:         t.dashboard.catVocabulary,
    mixed:              t.dashboard.catMixed,
  };
  return map[category] ?? category;
}

type Rec = { Icon: LucideIcon; title: string; sub: string; href: string; cta: string };

export function RecommendedActivity() {
  const [rec, setRec] = useState<Rec | null>(null);
  const { lang, t } = useLang();
  const isHe = lang === "he";

  useLayoutEffect(() => {
    const p = loadProgress();
    const dueCount = getVocabStats(withCustomItems(vocabData as VocabItem[])).dueCount;
    const weakCats = getWeakCategories();
    const todays = DAILY_VOCAB_LIMIT;

    if (p.vocabProgress.totalSeen === 0) {
      setRec({
        Icon: BookOpen,
        title: isHe ? "התחל מאמן מילים" : "Start the vocabulary trainer",
        sub: isHe
          ? "900+ מילים לאמירנט מחכות לך — התחל עם כרטיסיות החלקה"
          : "900+ AMIRNET words are ready — start with the swipe deck",
        href: "/vocab/swipe",
        cta: isHe ? `${todays} מילים להיום` : `Learn today's ${todays} words`,
      });
    } else if (dueCount > 0) {
      setRec({
        Icon: CalendarCheck,
        title: isHe ? `${todays} מילים להיום` : `Today's ${todays} words`,
        sub: isHe
          ? `${dueCount.toLocaleString()} ממתינות בסך הכל — תתחיל ב-${todays} ושמור על הרצף`
          : `${dueCount.toLocaleString()} pending in total — start with ${todays} and keep your streak`,
        href: "/vocab/swipe",
        cta: isHe ? `התחל ${todays} מילים` : `Start ${todays} words`,
      });
    } else if (weakCats.length > 0) {
      const cat = weakCats[0];
      const catName = categoryLabel(cat, t);
      setRec({
        Icon: Target,
        title: isHe ? `תרגל: ${catName}` : `Practice: ${catName}`,
        sub: isHe
          ? "נמצא כנקודה לשיפור — המשך לעבוד על זה"
          : "Identified as a weak spot — keep working on it",
        href: `/practice/${cat}`,
        cta: isHe ? "תרגל עכשיו" : "Practice now",
      });
    } else if (p.simulationHistory.length === 0) {
      setRec({
        Icon: Play,
        title: isHe ? "נסה הדמיה ראשונה" : "Try your first simulation",
        sub: isHe
          ? "מדוד את רמתך עם הדמיית אמירנט מלאה — זה חינם"
          : "Measure your level with a full AMIRNET simulation — it's free",
        href: "/simulation",
        cta: isHe ? "התחל הדמיה" : "Start simulation",
      });
    } else {
      setRec({
        Icon: Zap,
        title: isHe ? "אתגר מהיר" : "Quick challenge",
        sub: isHe
          ? "תרגול מהיר עם ניקוד וסטריקים — לשפר תחת לחץ"
          : "Fast-paced practice with scoring and streaks — improve under pressure",
        href: "/challenge",
        cta: isHe ? "קח אתגר" : "Take the challenge",
      });
    }
  }, [isHe, t]);

  if (!rec) return null;
  const { Icon } = rec;

  return (
    <Link
      href={rec.href}
      className="card card-clickable animate-fade-up"
      style={{
        padding: "1.5rem",
        borderColor: "var(--teal)",
        background: "var(--teal-faint)",
        display: "block",
        textDecoration: "none",
        color: "inherit",
      }}
      aria-label={rec.cta}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12, flexShrink: 0,
          background: "var(--teal-sub)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={22} color="var(--teal)" strokeWidth={2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", color: "var(--teal)", textTransform: "uppercase", marginBottom: "0.25rem" }}>
            {isHe ? "פעילות מומלצת" : "Recommended"}
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", fontWeight: 800, color: "var(--ink)", margin: "0 0 0.3rem", lineHeight: 1.3 }}>
            {rec.title}
          </h2>
          <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", margin: "0 0 1rem", lineHeight: 1.5 }}>
            {rec.sub}
          </p>
          <span className="btn btn-primary btn-sm" style={{ pointerEvents: "none" }}>{rec.cta}</span>
        </div>
      </div>
    </Link>
  );
}
