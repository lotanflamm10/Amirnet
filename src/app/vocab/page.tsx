"use client";
import Link from "next/link";
import { useLayoutEffect, useState } from "react";
import { getVocabStats } from "@/lib/vocab/vocab-store";
import { withCustomItems } from "@/lib/vocab/custom-vocab-store";
import vocabData from "@/data/seed/vocab.normalized.json";
import type { VocabItem } from "@/types/vocab";

const VOCAB_NAV = [
  { href: "/vocab/swipe",   icon: "🎴", label: "כרטיסיות החלקה",  labelEn: "Swipe Cards",  desc: "תרגל עם כרטיסיות חכמות וחזרה מרווחת", color: "var(--teal)" },
  { href: "/vocab/missed",  icon: "🔁", label: "לא ידעתי",         labelEn: "Missed Words",  desc: "כל המילים שפספסת — ממוינות לפי תדירות", color: "var(--danger)" },
  { href: "/vocab/starred", icon: "⭐", label: "מסומנים",           labelEn: "Starred",       desc: "מילים שסימנת לחזרה מיוחדת",            color: "var(--warn)" },
  { href: "/vocab/custom",  icon: "✏️", label: "מילים שלי",         labelEn: "My Words",      desc: "הוסף מילים משלך ותרגל אותן בכרטיסיות", color: "var(--success)" },
  { href: "/vocab/list",    icon: "☰", label: "רשימה מלאה",        labelEn: "Full List",     desc: "עיון וחיפוש בכל המילים",               color: "var(--ink-soft)" },
];

const VOCAB_BOOSTERS = [
  { href: "/practice/vocabularyInContext", icon: "📚", label: "מילים בהקשר",   labelEn: "Vocabulary in Context", desc: "זהה מילים אקדמיות מתוך הקשר המשפט", color: "var(--teal)" },
  { href: "/practice/synonymRecognition",  icon: "🔁", label: "זיהוי נרדפות",  labelEn: "Synonym Recognition",   desc: "מצא את המילה הקרובה ביותר במשמעות", color: "var(--success)" },
  { href: "/practice/antonymRecognition",  icon: "⇄",  label: "זיהוי הפכים",   labelEn: "Antonym Recognition",   desc: "חזק זיהוי מילים מנוגדות",           color: "var(--warn)" },
];

export default function VocabPage() {
  const [stats, setStats] = useState<{ dueCount: number; mastered: number; total: number; starred: number } | null>(null);

  useLayoutEffect(() => {
    const all = withCustomItems(vocabData as VocabItem[]);
    const s = getVocabStats(all);
    setStats({ dueCount: s.dueCount, mastered: s.mastered, total: s.total, starred: s.starredCount });
  }, []);

  const masteredPct = stats ? Math.round((stats.mastered / stats.total) * 100) : 0;

  return (
    <div className="animate-fade-up" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h1 className="page-title">מאמן מילים</h1>
        <p className="page-subtitle">900+ מילים אנגלית-עברית לאמירנט · מאגר עצמאי, לא רשמי</p>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "0.75rem" }}>
          {[
            { label: "לחזרה היום", value: stats.dueCount, color: stats.dueCount > 0 ? "var(--teal)" : "var(--success)", emoji: stats.dueCount > 0 ? "📅" : "✓" },
            { label: "שלטו",       value: stats.mastered,  color: "var(--success)",                                      emoji: "🏆" },
            { label: "מסומנים",    value: stats.starred,   color: "var(--warn)",                                         emoji: "⭐" },
          ].map(({ label, value, color, emoji }) => (
            <div key={label} className="stat-card animate-pop-in" style={{ textAlign: "center", alignItems: "center" }}>
              <div style={{ fontSize: "1.25rem", marginBottom: "0.125rem" }}>{emoji}</div>
              <div className="stat-value" style={{ color, fontSize: "1.75rem" }}>{value}</div>
              <p className="stat-label" style={{ textTransform: "none", letterSpacing: 0, color: "var(--ink-muted)" }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Mastery bar */}
      {stats && (
        <div className="card" style={{ padding: "1rem 1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.82rem" }}>
            <span style={{ color: "var(--ink-soft)", fontWeight: 600 }}>התקדמות כוללת</span>
            <span style={{ color: "var(--success)", fontWeight: 700 }}>{masteredPct}% שלטו</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill success" style={{ width: `${masteredPct}%` }} />
          </div>
          <p style={{ fontSize: "0.72rem", color: "var(--ink-muted)", marginTop: "0.375rem" }}>
            {stats.mastered} מתוך {stats.total} מילים הושלטו
          </p>
        </div>
      )}

      {/* CTA if due */}
      {stats && stats.dueCount > 0 && (
        <Link href="/vocab/swipe" className="btn btn-primary btn-lg btn-block" style={{ textAlign: "center" }}>
          📅 חזור על {stats.dueCount} מילים היום →
        </Link>
      )}

      {/* Add card CTA */}
      <Link
        href="/vocab/custom?tab=card"
        className="btn btn-ghost btn-lg btn-block"
        style={{ textAlign: "center", borderStyle: "dashed" }}
      >
        + הוסף כרטיס / Add Card
      </Link>

      {/* Navigation grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem" }}>
        {VOCAB_NAV.map(({ href, icon, label, labelEn, desc, color }) => (
          <Link key={href} href={href} className="card card-hover"
            style={{ padding: "1.1rem", textDecoration: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{
                width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                background: `color-mix(in srgb, ${color} 12%, var(--raised))`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem",
              }}>{icon}</span>
              <div>
                <div style={{ fontWeight: 700, color: "var(--ink)", fontSize: "0.875rem", lineHeight: 1.2 }}>{label}</div>
                <div style={{ fontSize: "0.68rem", color: "var(--ink-muted)" }}>{labelEn}</div>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--ink-muted)", lineHeight: 1.4 }}>{desc}</p>
          </Link>
        ))}
      </div>

      {/* Vocab skill boosters */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 700, color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            חיזוק מיומנויות מילים
          </p>
          <span className="badge badge-teal">Skill Boosters</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.625rem" }}>
          {VOCAB_BOOSTERS.map(({ href, icon, label, labelEn, desc, color }) => (
            <Link key={href} href={href} className="card card-hover"
              style={{ padding: "1rem", textDecoration: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}
            >
              <span style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: `color-mix(in srgb, ${color} 12%, var(--raised))`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem",
              }}>{icon}</span>
              <div>
                <div style={{ fontWeight: 700, color: "var(--ink)", fontSize: "0.82rem", lineHeight: 1.2 }}>{label}</div>
                <div style={{ fontSize: "0.66rem", color: "var(--ink-muted)" }}>{labelEn}</div>
              </div>
              <p style={{ margin: 0, fontSize: "0.74rem", color: "var(--ink-muted)", lineHeight: 1.4, flex: 1 }}>{desc}</p>
              <span style={{ fontSize: "0.74rem", color, fontWeight: 600 }}>תרגל →</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
