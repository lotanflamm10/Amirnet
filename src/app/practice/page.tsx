"use client";

import Link from "next/link";
import { useState } from "react";
import questionsRaw from "@/data/seed/questions.json";
import hardAddon from "@/data/seed/hard_questions_addon.json";
import expandedAddon from "@/data/seed/questions_expanded.json";
import skillBoostersRaw from "@/data/seed/skill_booster_questions.json";

type QData = Record<string, unknown[]>;

const SKILL_BOOSTERS = [
  { id: "vocabularyInContext", label: "אוצר מילים בהקשר", labelEn: "Vocabulary in Context", desc: "זהה מילים אקדמיות מתוך הקשר המשפט.", icon: "📚", color: "var(--teal)" },
  { id: "synonymRecognition",  label: "זיהוי נרדפות",      labelEn: "Synonym Recognition",   desc: "זהה את המילה הקרובה ביותר במשמעות.",                icon: "🔁", color: "var(--success)" },
  { id: "antonymRecognition",  label: "זיהוי הפכים",       labelEn: "Antonym Recognition",   desc: "חזק את היכולת לזהות מילים מנוגדות.",               icon: "⇄",  color: "var(--warn)" },
  { id: "connectorPractice",   label: "מילות קישור",        labelEn: "Connectors Practice",   desc: "תרגל מילות חיבור לוגיות: although, however, moreover.", icon: "🔗", color: "var(--teal)" },
  { id: "restatementMini",     label: "ניסוח מחדש מהיר",   labelEn: "Restatement Mini",      desc: "תרגול קצר של ניסוח מחדש לפני שאלות מלאות.",        icon: "✍️", color: "var(--success)" },
  { id: "sentenceLogic",       label: "היגיון משפטי",       labelEn: "Sentence Logic",        desc: "זהה את ההשלמה ההגיונית של המשפט.",                 icon: "🧠", color: "var(--teal)" },
  { id: "distractorTrap",      label: "מלכודות ניסוח",      labelEn: "Distractor Traps",      desc: "תרגל זיהוי תשובות מפתות שגויות.",                  icon: "⚠️", color: "var(--danger)" },
  { id: "academicPhrase",      label: "ביטויים אקדמיים",    labelEn: "Academic Phrases",      desc: "למד ביטויים אקדמיים נפוצים: according to, plays a role in.", icon: "🎓", color: "var(--warn)" },
];

const MODES = [
  // ── קטגוריות עיקריות (3 סוגי שאלות רגילים לפי מבנה אמירנט) ──
  { id: "sentenceCompletion", label: "השלמת משפטים",  labelEn: "Sentence Completion",    desc: "בחר את המילה המתאימה להשלמת המשפט.",               dataKey: "sentenceCompletion", icon: "✏️", isPilot: false, featured: false },
  { id: "restatements",       label: "ניסוח מחדש",     labelEn: "Restatements",            desc: "בחר את האפשרות השומרת על המשמעות המקורית.",        dataKey: "paraphrasing",       icon: "🔄", isPilot: false, featured: false },
  { id: "reading",            label: "הבנת הנקרא",     labelEn: "Reading Comprehension",   desc: "קרא קטעים וענה על שאלות הבנה.",                   dataKey: "reading",            icon: "📖", isPilot: false, featured: false },
  { id: "mixed",              label: "תרגול מעורב",    labelEn: "Mixed Practice",          desc: "אימון חכם: שאלות מותאמות מכל הקטגוריות, בלי חזרות.", dataKey: null,             icon: "⚡", isPilot: false, featured: true  },
  // ── פרקים ניסיוניים (5 סוגים לפי מדריך אמירנט) ──
  { id: "lectureQuestions",   label: "הרצאה / שיחה",   labelEn: "Lecture / Conversation",  desc: "שאלות על רעיון מרכזי, הסקה ופרטים מהרצאה קצרה.",  dataKey: "lectureQuestions",   icon: "🎙️", isPilot: true, featured: false },
  { id: "textCompletion",     label: "השלמת קטע שמע",  labelEn: "Audio Completion",        desc: "השלם פסקה קצרה לאחר האזנה, תוך שימוש בהקשר.",     dataKey: "textCompletion",     icon: "🎧", isPilot: true, featured: false },
  { id: "grammar",            label: "דקדוק בהקשר",    labelEn: "Grammar in Context",      desc: "בחר את האפשרות הדקדוקית הנכונה בהקשר המשפט.",     dataKey: "grammar",            icon: "🔤", isPilot: true, featured: false },
  { id: "wordFormation",      label: "יצירת מילה",     labelEn: "Word Formation",          desc: "צור את הצורה הנכונה של המילה (שם עצם, שם תואר, פועל…).", dataKey: "wordFormation", icon: "🔧", isPilot: true, featured: false },
  { id: "writingTask",        label: "מטלת כתיבה",     labelEn: "Writing Task",            desc: "כתיבת פסקת דעה באנגלית — 90 עד 120 מילים.",       dataKey: "writingTask",        icon: "✍️", isPilot: true, featured: false },
];

const DIFFICULTIES = [
  { id: "adaptive", label: "אדפטיבי", labelEn: "Adaptive", color: "var(--teal)",    desc: "מתאים לרמתך אוטומטית" },
  { id: "easy",     label: "קל",      labelEn: "Easy",      color: "var(--success)", desc: "שאלות בסיסיות" },
  { id: "medium",   label: "בינוני",  labelEn: "Medium",    color: "var(--warn)",    desc: "רמת מבחן אמיתית" },
  { id: "hard",     label: "קשה",     labelEn: "Hard",      color: "var(--danger)",  desc: "מאתגר ומורכב" },
];

function getCount(dataKey: string | null): number {
  const sources = [questionsRaw, hardAddon, expandedAddon] as unknown as QData[];
  const count = (key: string) => sources.reduce((sum, src) => sum + ((src as QData)[key]?.length ?? 0), 0);
  if (!dataKey) {
    const mixedKeys = ["sentenceCompletion", "paraphrasing", "wordFormation", "textCompletion"];
    return mixedKeys.reduce((sum, k) => sum + count(k), 0);
  }
  return count(dataKey);
}

function getBoosterCount(id: string): number {
  return ((skillBoostersRaw as unknown as QData)[id]?.length ?? 0);
}

const featuredMode  = MODES.find(m => m.featured)!;
const standardModes = MODES.filter(m => !m.isPilot && !m.featured);
const pilotModes    = MODES.filter(m => m.isPilot);

export default function PracticePage() {
  const [difficulty, setDifficulty] = useState("adaptive");
  const [showBoosters, setShowBoosters] = useState(true);
  const activeDiff = DIFFICULTIES.find(d => d.id === difficulty)!;

  return (
    <div className="animate-fade-up" style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      {/* Header */}
      <div>
        <h1 className="page-title">תרגול</h1>
        <p className="page-subtitle">בחר רמת קושי ואז קטגוריה להתחלת סשן של 20 שאלות</p>
      </div>

      {/* Difficulty selector */}
      <div className="card" style={{ padding: "1.25rem" }}>
        <p style={{ margin: "0 0 0.75rem", fontSize: "0.72rem", fontWeight: 700, color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          רמת קושי
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
          {DIFFICULTIES.map((d) => {
            const active = difficulty === d.id;
            return (
              <button key={d.id} onClick={() => setDifficulty(d.id)}
                style={{
                  padding: "0.625rem 0.5rem",
                  borderRadius: 10,
                  border: `1.5px solid ${active ? d.color : "var(--line)"}`,
                  background: active ? `color-mix(in srgb, ${d.color} 10%, var(--raised))` : "var(--raised)",
                  color: active ? d.color : "var(--ink-muted)",
                  fontWeight: active ? 700 : 500,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                  transition: "all 0.15s",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "0.1rem",
                }}
              >
                <span style={{ fontWeight: 700 }}>{d.label}</span>
                <span style={{ fontSize: "0.68rem", opacity: 0.8 }}>{d.labelEn}</span>
              </button>
            );
          })}
        </div>
        {difficulty !== "adaptive" && (
          <p style={{ margin: "0.625rem 0 0", fontSize: "0.78rem", color: activeDiff.color, display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <span>●</span> {activeDiff.desc} — כל הסשנים יתחילו ברמה זו
          </p>
        )}
      </div>

      {/* Featured: Mixed Practice hero card */}
      <Link href={`/practice/${featuredMode.id}?difficulty=${difficulty}`}
        className="card card-hover"
        style={{
          padding: "1.5rem", display: "flex", flexDirection: "row",
          alignItems: "center", gap: "1.25rem", textDecoration: "none",
          border: "2px solid var(--teal)", background: "var(--teal-sub)",
        }}
      >
        <div style={{
          width: 52, height: 52, borderRadius: 14, flexShrink: 0,
          background: "var(--teal)", display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: "1.5rem",
        }}>
          {featuredMode.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <span style={{ fontWeight: 800, color: "var(--teal)", fontSize: "1.05rem" }}>{featuredMode.label}</span>
            <span className="badge badge-teal">מומלץ</span>
          </div>
          <p style={{ margin: 0, color: "var(--ink-soft)", fontSize: "0.85rem", lineHeight: 1.5 }}>{featuredMode.desc}</p>
        </div>
        <span style={{ color: "var(--teal)", fontWeight: 700, fontSize: "1rem", flexShrink: 0 }}>התחל →</span>
      </Link>

      {/* Standard modes */}
      <div>
        <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
          קטגוריות עיקריות
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "0.75rem" }}>
          {standardModes.map(({ id, label, labelEn, desc, dataKey, icon }) => (
            <ModeCard key={id} id={id} label={label} labelEn={labelEn} desc={desc}
              count={getCount(dataKey)} icon={icon} difficulty={difficulty} isPilot={false} />
          ))}
        </div>
      </div>

      {/* Skill Boosters section */}
      <div className="card" style={{ padding: "1.25rem" }}>
        <button
          onClick={() => setShowBoosters(s => !s)}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "var(--font-body)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <span style={{ fontSize: "1.2rem" }}>⚡</span>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--ink)" }}>חיזוק מיומנויות</div>
              <div style={{ fontSize: "0.72rem", color: "var(--ink-muted)" }}>Skill Boosters · תרגול תומך</div>
            </div>
            <span className="badge badge-teal" style={{ marginRight: "0.25rem" }}>חדש</span>
          </div>
          <span style={{ color: "var(--ink-muted)", fontSize: "1rem", transition: "transform 0.2s", transform: showBoosters ? "rotate(180deg)" : "none" }}>▾</span>
        </button>

        {showBoosters && (
          <div style={{ marginTop: "1rem" }}>
            <p style={{ margin: "0 0 0.875rem", fontSize: "0.82rem", color: "var(--ink-soft)", lineHeight: 1.6 }}>
              תרגול מיומנויות ספציפיות שיעזרו לך בשאלות AMIRNET — אוצר מילים, קישורים לוגיים, ניסוח מחדש, ומלכודות ניסוח נפוצות.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "0.625rem" }}>
              {SKILL_BOOSTERS.map(({ id, label, labelEn, desc, icon, color }) => (
                <Link key={id} href={`/practice/${id}?difficulty=${difficulty}`}
                  className="card card-hover"
                  style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem", textDecoration: "none" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                      background: `color-mix(in srgb, ${color} 12%, var(--raised))`,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem",
                    }}>
                      {icon}
                    </div>
                    <span style={{ fontSize: "0.7rem", color: "var(--ink-muted)" }}>{getBoosterCount(id)} שאלות</span>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: "var(--ink)", fontSize: "0.88rem" }}>{label}</div>
                    <div style={{ fontSize: "0.68rem", color: "var(--ink-muted)" }}>{labelEn}</div>
                  </div>
                  <p style={{ margin: 0, color: "var(--ink-soft)", fontSize: "0.78rem", lineHeight: 1.5, flex: 1 }}>{desc}</p>
                  <span style={{ fontSize: "0.78rem", color, fontWeight: 600 }}>תרגל →</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pilot modes */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.375rem" }}>
          <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
            פרקים ניסיוניים — 5 סוגים
          </p>
          <span className="badge badge-warn">ניסיוני</span>
        </div>
        <p style={{ margin: "0 0 0.75rem", fontSize: "0.78rem", color: "var(--ink-muted)", lineHeight: 1.5 }}>
          פרקים אלו לא נספרים לציון הסופי. שגיאות לא פוגעות בציון — תשובות נכונות עשויות להוסיף בונוס.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "0.75rem" }}>
          {pilotModes.map(({ id, label, labelEn, desc, dataKey, icon }) => (
            <ModeCard key={id} id={id} label={label} labelEn={labelEn} desc={desc}
              count={getCount(dataKey)} icon={icon} difficulty={difficulty} isPilot />
          ))}
        </div>
      </div>
    </div>
  );
}

function ModeCard({ id, label, labelEn, desc, count, icon, difficulty, isPilot }: {
  id: string; label: string; labelEn: string; desc: string;
  count: number; icon: string; difficulty: string; isPilot: boolean;
}) {
  return (
    <Link href={`/practice/${id}?difficulty=${difficulty}`}
      className="card card-hover"
      style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem", textDecoration: "none" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: isPilot ? "var(--warn-sub)" : "var(--teal-sub)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem",
        }}>
          {icon}
        </div>
        {isPilot && <span className="badge badge-warn">פיילוט</span>}
      </div>

      <div>
        <div style={{ fontWeight: 700, color: "var(--ink)", fontSize: "0.95rem", lineHeight: 1.3 }}>{label}</div>
        <div style={{ color: "var(--ink-muted)", fontSize: "0.72rem", marginTop: "0.125rem" }}>{labelEn}</div>
      </div>

      <p style={{ margin: 0, color: "var(--ink-soft)", fontSize: "0.82rem", lineHeight: 1.55, flex: 1 }}>{desc}</p>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.75rem", color: "var(--ink-muted)" }}>{count} שאלות</span>
        <span style={{ fontSize: "0.8rem", color: "var(--teal)", fontWeight: 600 }}>התחל →</span>
      </div>
    </Link>
  );
}
