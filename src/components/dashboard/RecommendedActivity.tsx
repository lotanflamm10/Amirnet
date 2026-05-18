"use client";
import Link from "next/link";
import { useLayoutEffect, useState } from "react";
import { loadProgress, getWeakCategories } from "@/lib/progress/local-progress-store";
import { getVocabStats } from "@/lib/vocab/vocab-store";
import { withCustomItems } from "@/lib/vocab/custom-vocab-store";
import vocabData from "@/data/seed/vocab.normalized.json";
import type { VocabItem } from "@/types/vocab";

export function RecommendedActivity() {
  const [rec, setRec] = useState<{ icon: string; title: string; sub: string; href: string; cta: string } | null>(null);

  useLayoutEffect(() => {
    const p = loadProgress();
    const dueCount = getVocabStats(withCustomItems(vocabData as VocabItem[])).dueCount;
    const weakCats = getWeakCategories();

    if (p.vocabProgress.totalSeen === 0) {
      setRec({ icon: "📖", title: "התחל מאמן מילים", sub: "900+ מילים לאמירנט מחכות לך — התחל עם כרטיסיות החלקה", href: "/vocab/swipe", cta: "התחל עכשיו →" });
    } else if (dueCount > 0) {
      setRec({ icon: "📅", title: `${dueCount} מילים לחזרה היום`, sub: "שמור על הרצף שלך עם חזרה מרווחת חכמה", href: "/vocab/swipe", cta: `חזור על ${dueCount} מילים →` });
    } else if (weakCats.length > 0) {
      const cat = weakCats[0];
      setRec({ icon: "🎯", title: `תרגל: ${cat}`, sub: "נמצא כנקודה לשיפור — המשך לעבוד על זה", href: `/practice/${cat}`, cta: "תרגל עכשיו →" });
    } else if (p.simulationHistory.length === 0) {
      setRec({ icon: "▶", title: "נסה הדמיה ראשונה", sub: "מדוד את רמתך עם הדמיית אמירנט מלאה — זה חינם", href: "/simulation", cta: "התחל הדמיה →" });
    } else {
      setRec({ icon: "⚡", title: "אתגר מהיר", sub: "תרגול מהיר עם ניקוד וסטריקים — לשפר תחת לחץ", href: "/challenge", cta: "קח אתגר →" });
    }
  }, []);

  if (!rec) return null;

  return (
    <div className="card animate-fade-up" style={{
      padding: "1.5rem",
      background: "linear-gradient(135deg, var(--teal-faint) 0%, var(--surface) 60%)",
      borderColor: "var(--teal)",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background accent */}
      <div style={{
        position: "absolute", top: -20, right: -20,
        width: 120, height: 120, borderRadius: "50%",
        background: "var(--teal-sub)",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, flexShrink: 0,
            background: "var(--teal-sub)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.5rem",
          }}>
            {rec.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", color: "var(--teal)", textTransform: "uppercase", marginBottom: "0.25rem" }}>
              פעילות מומלצת
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", fontWeight: 800, color: "var(--ink)", margin: "0 0 0.3rem", lineHeight: 1.3 }}>
              {rec.title}
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", margin: "0 0 1rem", lineHeight: 1.5 }}>
              {rec.sub}
            </p>
            <Link href={rec.href} className="btn btn-primary btn-sm">{rec.cta}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
