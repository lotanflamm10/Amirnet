"use client";
import Link from "next/link";
import { useLayoutEffect, useState } from "react";
import { getVocabStats } from "@/lib/vocab/vocab-store";
import { withCustomItems } from "@/lib/vocab/custom-vocab-store";
import { DAILY_VOCAB_LIMIT } from "@/lib/vocab/daily-vocab";
import vocabData from "@/data/seed/vocab.normalized.json";
import type { VocabItem } from "@/types/vocab";
import { useLang } from "@/contexts/LanguageContext";
import { formatNumber } from "@/lib/ui/format-number";

interface NavCard {
  href: string;
  icon: string;
  he: { label: string; desc: string };
  en: { label: string; desc: string };
  color: string;
}

const VOCAB_NAV: NavCard[] = [
  { href: "/vocab/swipe",   icon: "🎴", he: { label: "כרטיסיות החלקה",   desc: "תרגל עם כרטיסיות חכמות וחזרה מרווחת" }, en: { label: "Swipe Cards",          desc: "Practice with smart spaced-repetition cards" }, color: "var(--teal)" },
  { href: "/vocab/unknown", icon: "❓", he: { label: "לא יודע",           desc: "מילים שסימנת בקריאה — לתרגול מהיר" },     en: { label: "Words I Don't Know",   desc: "Words you flagged while reading — quick review" }, color: "var(--info)" },
  { href: "/vocab/missed",  icon: "🔁", he: { label: "לא ידעתי",          desc: "כל המילים שפספסת — ממוינות לפי תדירות" }, en: { label: "Missed Words",         desc: "All words you missed, sorted by frequency" },     color: "var(--danger)" },
  { href: "/vocab/starred", icon: "⭐", he: { label: "מסומנים",            desc: "מילים שסימנת לחזרה מיוחדת" },             en: { label: "Starred",              desc: "Words you starred for focused review" },          color: "var(--warn)" },
  { href: "/vocab/custom",  icon: "✏️", he: { label: "מילים שלי",          desc: "הוסף מילים משלך ותרגל אותן בכרטיסיות" }, en: { label: "My Words",             desc: "Add your own words and study them as cards" },     color: "var(--success)" },
  { href: "/vocab/list",    icon: "☰", he: { label: "רשימה מלאה",         desc: "עיון וחיפוש בכל המילים" },                en: { label: "Full List",            desc: "Browse and search the entire dictionary" },        color: "var(--ink-soft)" },
];

const VOCAB_BOOSTERS: NavCard[] = [
  { href: "/practice/vocabularyInContext", icon: "📚", he: { label: "מילים בהקשר",  desc: "זהה מילים אקדמיות מתוך הקשר המשפט" }, en: { label: "Vocabulary in Context", desc: "Identify academic words from sentence context" }, color: "var(--teal)" },
  { href: "/practice/synonymRecognition",  icon: "🔁", he: { label: "זיהוי נרדפות", desc: "מצא את המילה הקרובה ביותר במשמעות" }, en: { label: "Synonym Recognition",   desc: "Find the closest word in meaning" },               color: "var(--success)" },
  { href: "/practice/antonymRecognition",  icon: "⇄",  he: { label: "זיהוי הפכים",  desc: "חזק זיהוי מילים מנוגדות" },           en: { label: "Antonym Recognition",   desc: "Strengthen recognition of opposites" },            color: "var(--warn)" },
];

export default function VocabPage() {
  const [stats, setStats] = useState<{ dueCount: number; mastered: number; total: number; starred: number } | null>(null);
  const { lang, t } = useLang();
  const isHe = lang === "he";

  useLayoutEffect(() => {
    const all = withCustomItems(vocabData as VocabItem[]);
    const s = getVocabStats(all);
    setStats({ dueCount: s.dueCount, mastered: s.mastered, total: s.total, starred: s.starredCount });
  }, []);

  const masteredPct = stats ? Math.round((stats.mastered / stats.total) * 100) : 0;

  const statLabels = isHe
    ? { due: "ממתינות", mastered: "שלטו", starred: "מסומנים", total: "התקדמות כוללת", masteredPct: "% שלטו", masteredOf: (m: number, t: number) => `${m} מתוך ${t} מילים הושלטו` }
    : { due: "Pending", mastered: "Mastered", starred: "Starred", total: "Overall progress", masteredPct: "% mastered", masteredOf: (m: number, t: number) => `${m} of ${t} words mastered` };

  return (
    <div className="animate-fade-up" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h1 className="page-title">{t.vocab.trainerTitle}</h1>
        <p className="page-subtitle">{t.vocab.trainerSubtitle}</p>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "0.75rem" }}>
          {[
            { label: statLabels.due,      value: formatNumber(stats.dueCount, lang), color: stats.dueCount > 0 ? "var(--teal)" : "var(--success)", emoji: stats.dueCount > 0 ? "📅" : "✓" },
            { label: statLabels.mastered, value: formatNumber(stats.mastered, lang), color: "var(--success)",                                       emoji: "🏆" },
            { label: statLabels.starred,  value: formatNumber(stats.starred, lang),  color: "var(--warn)",                                          emoji: "⭐" },
          ].map(({ label, value, color, emoji }) => (
            <div key={label} className="stat-card animate-pop-in" style={{ textAlign: "center", alignItems: "center" }}>
              <div style={{ fontSize: "1.25rem", marginBottom: "0.125rem" }}>{emoji}</div>
              <div className="stat-value" style={{ color, fontSize: "1.75rem", whiteSpace: "nowrap" }}>{value}</div>
              <p className="stat-label" style={{ textTransform: "none", letterSpacing: 0, color: "var(--ink-muted)" }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Mastery bar */}
      {stats && (
        <div className="card" style={{ padding: "1rem 1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.82rem" }}>
            <span style={{ color: "var(--ink-soft)", fontWeight: 600 }}>{statLabels.total}</span>
            <span style={{ color: "var(--success)", fontWeight: 700 }}>{masteredPct}{statLabels.masteredPct}</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill success" style={{ width: `${masteredPct}%` }} />
          </div>
          <p style={{ fontSize: "0.72rem", color: "var(--ink-muted)", marginTop: "0.375rem" }}>
            {statLabels.masteredOf(stats.mastered, stats.total)}
          </p>
        </div>
      )}

      {/* CTA — daily task is always DAILY_VOCAB_LIMIT cards.
          The total pending count is shown in the stats grid above. */}
      {stats && stats.dueCount > 0 && (
        <Link href="/vocab/swipe" className="btn btn-primary btn-lg btn-block" style={{ textAlign: "center" }}>
          {isHe
            ? `${DAILY_VOCAB_LIMIT} ${t.vocab.todaysWords} →`
            : `Today's ${DAILY_VOCAB_LIMIT} words →`}
        </Link>
      )}

      {/* Add card CTA */}
      <Link
        href="/vocab/custom?tab=card"
        className="btn btn-ghost btn-lg btn-block"
        style={{ textAlign: "center", borderStyle: "dashed" }}
      >
        {t.vocab.addCard}
      </Link>

      {/* Navigation grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem" }}>
        {VOCAB_NAV.map((card) => {
          const copy = isHe ? card.he : card.en;
          const sub = isHe ? card.en.label : card.he.label;
          return (
            <Link key={card.href} href={card.href} className="card card-hover"
              style={{ padding: "1.1rem", textDecoration: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{
                  width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                  background: `color-mix(in srgb, ${card.color} 12%, var(--raised))`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem",
                }}>{card.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, color: "var(--ink)", fontSize: "0.875rem", lineHeight: 1.2 }}>{copy.label}</div>
                  <div style={{ fontSize: "0.68rem", color: "var(--ink-muted)" }}>{sub}</div>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--ink-muted)", lineHeight: 1.4 }}>{copy.desc}</p>
            </Link>
          );
        })}
      </div>

      {/* Vocab skill boosters */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 700, color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {t.vocab.skillBoostersHeading}
          </p>
          <span className="badge badge-teal">{t.vocab.skillBoosters}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.625rem" }}>
          {VOCAB_BOOSTERS.map((card) => {
            const copy = isHe ? card.he : card.en;
            const sub = isHe ? card.en.label : card.he.label;
            return (
              <Link key={card.href} href={card.href} className="card card-hover"
                style={{ padding: "1rem", textDecoration: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}
              >
                <span style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: `color-mix(in srgb, ${card.color} 12%, var(--raised))`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem",
                }}>{card.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, color: "var(--ink)", fontSize: "0.82rem", lineHeight: 1.2 }}>{copy.label}</div>
                  <div style={{ fontSize: "0.66rem", color: "var(--ink-muted)" }}>{sub}</div>
                </div>
                <p style={{ margin: 0, fontSize: "0.74rem", color: "var(--ink-muted)", lineHeight: 1.4, flex: 1 }}>{copy.desc}</p>
                <span style={{ fontSize: "0.74rem", color: card.color, fontWeight: 600 }}>
                  {isHe ? "תרגל →" : "Practice →"}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
