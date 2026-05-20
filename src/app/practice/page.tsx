"use client";

import Link from "next/link";
import { useState } from "react";
import questionsRaw from "@/data/seed/questions.json";
import hardAddon from "@/data/seed/hard_questions_addon.json";
import expandedAddon from "@/data/seed/questions_expanded.json";
import skillBoostersRaw from "@/data/seed/skill_booster_questions.json";
import { useLang } from "@/contexts/LanguageContext";

type QData = Record<string, unknown[]>;

interface LocalizedCopy {
  label: string;
  desc: string;
}

interface BoosterEntry {
  id: string;
  he: LocalizedCopy;
  en: LocalizedCopy;
  icon: string;
  color: string;
}

interface ModeEntry {
  id: string;
  he: LocalizedCopy;
  en: LocalizedCopy;
  dataKey: string | null;
  icon: string;
  isPilot: boolean;
  featured: boolean;
}

interface DifficultyEntry {
  id: "adaptive" | "easy" | "medium" | "hard";
  he: { label: string };
  en: { label: string };
  color: string;
}

const SKILL_BOOSTERS: BoosterEntry[] = [
  { id: "vocabularyInContext", he: { label: "אוצר מילים בהקשר", desc: "זהה מילים אקדמיות מתוך הקשר המשפט." },          en: { label: "Vocabulary in Context", desc: "Identify academic words from the surrounding sentence." },     icon: "📚", color: "var(--teal)" },
  { id: "synonymRecognition",  he: { label: "זיהוי נרדפות",      desc: "זהה את המילה הקרובה ביותר במשמעות." },           en: { label: "Synonym Recognition",   desc: "Pick the word closest in meaning." },                          icon: "🔁", color: "var(--success)" },
  { id: "antonymRecognition",  he: { label: "זיהוי הפכים",       desc: "חזק את היכולת לזהות מילים מנוגדות." },           en: { label: "Antonym Recognition",   desc: "Strengthen recognition of opposites." },                       icon: "⇄",  color: "var(--warn)" },
  { id: "connectorPractice",   he: { label: "מילות קישור",        desc: "תרגל מילות חיבור לוגיות: although, however, moreover." }, en: { label: "Connectors Practice", desc: "Drill logical connectors: although, however, moreover." }, icon: "🔗", color: "var(--teal)" },
  { id: "restatementMini",     he: { label: "ניסוח מחדש מהיר",   desc: "תרגול קצר של ניסוח מחדש לפני שאלות מלאות." },   en: { label: "Restatement Mini",      desc: "Short paraphrasing reps before full questions." },             icon: "✍️", color: "var(--success)" },
  { id: "sentenceLogic",       he: { label: "היגיון משפטי",       desc: "זהה את ההשלמה ההגיונית של המשפט." },             en: { label: "Sentence Logic",        desc: "Spot the logically consistent completion." },                  icon: "🧠", color: "var(--teal)" },
  { id: "distractorTrap",      he: { label: "מלכודות ניסוח",      desc: "תרגל זיהוי תשובות מפתות שגויות." },             en: { label: "Distractor Traps",      desc: "Train your eye for tempting-but-wrong answers." },             icon: "⚠️", color: "var(--danger)" },
  { id: "academicPhrase",      he: { label: "ביטויים אקדמיים",    desc: "למד ביטויים אקדמיים נפוצים: according to, plays a role in." }, en: { label: "Academic Phrases", desc: "Learn common academic phrases: according to, plays a role in." }, icon: "🎓", color: "var(--warn)" },
];

const MODES: ModeEntry[] = [
  { id: "sentenceCompletion", he: { label: "השלמת משפטים",  desc: "בחר את המילה המתאימה להשלמת המשפט." },               en: { label: "Sentence Completion",   desc: "Pick the word that best completes the sentence." },     dataKey: "sentenceCompletion", icon: "✏️", isPilot: false, featured: false },
  { id: "restatements",       he: { label: "ניסוח מחדש",     desc: "בחר את האפשרות השומרת על המשמעות המקורית." },        en: { label: "Restatements",          desc: "Pick the option that preserves the original meaning." }, dataKey: "paraphrasing",       icon: "🔄", isPilot: false, featured: false },
  { id: "reading",            he: { label: "הבנת הנקרא",     desc: "קרא קטעים וענה על שאלות הבנה." },                   en: { label: "Reading Comprehension", desc: "Read full passages and answer comprehension questions." }, dataKey: "reading",            icon: "📖", isPilot: false, featured: false },
  { id: "mixed",              he: { label: "תרגול מעורב",    desc: "אימון חכם: שאלות מותאמות מכל הקטגוריות, בלי חזרות." }, en: { label: "Mixed Practice",      desc: "Smart practice that adapts across categories, no repeats." }, dataKey: null,             icon: "⚡", isPilot: false, featured: true  },
  { id: "lectureQuestions",   he: { label: "הרצאה / שיחה",   desc: "שאלות על רעיון מרכזי, הסקה ופרטים מהרצאה קצרה." },  en: { label: "Lecture / Conversation", desc: "Main-idea, inference and detail questions on a short lecture." }, dataKey: "lectureQuestions", icon: "🎙️", isPilot: true, featured: false },
  { id: "textCompletion",     he: { label: "השלמת קטע שמע",  desc: "השלם פסקה קצרה לאחר האזנה, תוך שימוש בהקשר." },     en: { label: "Audio Completion",      desc: "Complete a short paragraph after listening, using context." },     dataKey: "textCompletion",     icon: "🎧", isPilot: true, featured: false },
  { id: "grammar",            he: { label: "דקדוק בהקשר",    desc: "בחר את האפשרות הדקדוקית הנכונה בהקשר המשפט." },     en: { label: "Grammar in Context",    desc: "Pick the grammatically correct option in context." },              dataKey: "grammar",            icon: "🔤", isPilot: true, featured: false },
  { id: "wordFormation",      he: { label: "יצירת מילה",     desc: "צור את הצורה הנכונה של המילה (שם עצם, שם תואר, פועל…)." }, en: { label: "Word Formation", desc: "Form the correct word part-of-speech (noun, adjective, verb…)." }, dataKey: "wordFormation", icon: "🔧", isPilot: true, featured: false },
  { id: "writingTask",        he: { label: "מטלת כתיבה",     desc: "כתיבת פסקת דעה באנגלית — 90 עד 120 מילים." },       en: { label: "Writing Task",          desc: "Write an English opinion paragraph — 90 to 120 words." },         dataKey: "writingTask",        icon: "✍️", isPilot: true, featured: false },
];

const DIFFICULTIES: DifficultyEntry[] = [
  { id: "adaptive", he: { label: "אדפטיבי" }, en: { label: "Adaptive" }, color: "var(--teal)"    },
  { id: "easy",     he: { label: "קל" },      en: { label: "Easy" },     color: "var(--success)" },
  { id: "medium",   he: { label: "בינוני" },  en: { label: "Medium" },   color: "var(--warn)"    },
  { id: "hard",     he: { label: "קשה" },     en: { label: "Hard" },     color: "var(--danger)"  },
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
  const [difficulty, setDifficulty] = useState<DifficultyEntry["id"]>("adaptive");
  const [showBoosters, setShowBoosters] = useState(true);
  const { lang, t } = useLang();
  const isHe = lang === "he";
  const pickCopy = <H, E>(entry: { he: H; en: E }): H | E =>
    isHe ? entry.he : entry.en;
  const activeDiff = DIFFICULTIES.find(d => d.id === difficulty)!;
  const activeDiffDesc =
    difficulty === "adaptive" ? t.practice.difficultyAdaptiveDesc
      : difficulty === "easy" ? t.practice.difficultyEasyDesc
      : difficulty === "medium" ? t.practice.difficultyMediumDesc
      : t.practice.difficultyHardDesc;

  return (
    <div className="animate-fade-up" style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      {/* Header */}
      <div>
        <h1 className="page-title">{t.practice.title}</h1>
        <p className="page-subtitle">{t.practice.subtitle}</p>
      </div>

      {/* Difficulty selector */}
      <div className="card" style={{ padding: "1.25rem" }}>
        <p style={{ margin: "0 0 0.75rem", fontSize: "0.72rem", fontWeight: 700, color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {t.practice.difficulty}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
          {DIFFICULTIES.map((d) => {
            const active = difficulty === d.id;
            const primary = pickCopy(d).label;
            const sub = isHe ? d.en.label : d.he.label;
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
                <span style={{ fontWeight: 700 }}>{primary}</span>
                <span style={{ fontSize: "0.68rem", opacity: 0.8 }}>{sub}</span>
              </button>
            );
          })}
        </div>
        {difficulty !== "adaptive" && (
          <p style={{ margin: "0.625rem 0 0", fontSize: "0.78rem", color: activeDiff.color, display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <span>●</span> {activeDiffDesc} — {t.practice.difficultyLockNotice}
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
            <span style={{ fontWeight: 800, color: "var(--teal)", fontSize: "1.05rem" }}>{pickCopy(featuredMode).label}</span>
            <span className="badge badge-teal">{t.practice.badgeRecommended}</span>
          </div>
          <p style={{ margin: 0, color: "var(--ink-soft)", fontSize: "0.85rem", lineHeight: 1.5 }}>{pickCopy(featuredMode).desc}</p>
        </div>
        <span style={{ color: "var(--teal)", fontWeight: 700, fontSize: "1rem", flexShrink: 0 }}>{t.practice.start} →</span>
      </Link>

      {/* Standard modes */}
      <div>
        <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
          {t.practice.sectionMainCategories}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "0.75rem" }}>
          {standardModes.map((mode) => {
            const copy = pickCopy(mode);
            const sub = isHe ? mode.en.label : mode.he.label;
            return (
              <ModeCard
                key={mode.id}
                id={mode.id}
                label={copy.label}
                sub={sub}
                desc={copy.desc}
                count={getCount(mode.dataKey)}
                icon={mode.icon}
                difficulty={difficulty}
                isPilot={false}
                tStart={t.practice.start}
                tQuestionsUnit={t.practice.questionsUnit}
                tPilotBadge={t.practice.badgePilot}
              />
            );
          })}
        </div>
      </div>

      {/* Skill Boosters section */}
      <div className="card" style={{ padding: "1.25rem" }}>
        <button
          type="button"
          onClick={() => setShowBoosters(s => !s)}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "var(--font-body)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <span style={{ fontSize: "1.2rem" }}>⚡</span>
            <div style={{ textAlign: isHe ? "right" : "left" }}>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--ink)" }}>{t.practice.sectionSkillBoosters}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--ink-muted)" }}>
                {t.practice.sectionSkillBoostersSubtitle}
              </div>
            </div>
            <span className="badge badge-teal" style={{ marginInlineStart: "0.25rem" }}>{t.practice.badgeNew}</span>
          </div>
          <span style={{ color: "var(--ink-muted)", fontSize: "1rem", transition: "transform 0.2s", transform: showBoosters ? "rotate(180deg)" : "none" }}>▾</span>
        </button>

        {showBoosters && (
          <div style={{ marginTop: "1rem" }}>
            <p style={{ margin: "0 0 0.875rem", fontSize: "0.82rem", color: "var(--ink-soft)", lineHeight: 1.6 }}>
              {t.practice.sectionSkillBoostersIntro}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "0.625rem" }}>
              {SKILL_BOOSTERS.map((booster) => {
                const copy = pickCopy(booster);
                const sub = isHe ? booster.en.label : booster.he.label;
                return (
                  <Link key={booster.id} href={`/practice/${booster.id}?difficulty=${difficulty}`}
                    className="card card-hover"
                    style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem", textDecoration: "none" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                        background: `color-mix(in srgb, ${booster.color} 12%, var(--raised))`,
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem",
                      }}>
                        {booster.icon}
                      </div>
                      <span style={{ fontSize: "0.7rem", color: "var(--ink-muted)" }}>
                        {getBoosterCount(booster.id)} {t.practice.questionsUnit}
                      </span>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: "var(--ink)", fontSize: "0.88rem" }}>{copy.label}</div>
                      <div style={{ fontSize: "0.68rem", color: "var(--ink-muted)" }}>{sub}</div>
                    </div>
                    <p style={{ margin: 0, color: "var(--ink-soft)", fontSize: "0.78rem", lineHeight: 1.5, flex: 1 }}>{copy.desc}</p>
                    <span style={{ fontSize: "0.78rem", color: booster.color, fontWeight: 600 }}>{t.practice.practiceVerb} →</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Pilot modes */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.375rem" }}>
          <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
            {t.practice.sectionPilot}
          </p>
          <span className="badge badge-warn">{t.practice.pilotSubtitle}</span>
        </div>
        <p style={{ margin: "0 0 0.75rem", fontSize: "0.78rem", color: "var(--ink-muted)", lineHeight: 1.5 }}>
          {t.practice.pilotInfo}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "0.75rem" }}>
          {pilotModes.map((mode) => {
            const copy = pickCopy(mode);
            const sub = isHe ? mode.en.label : mode.he.label;
            return (
              <ModeCard
                key={mode.id}
                id={mode.id}
                label={copy.label}
                sub={sub}
                desc={copy.desc}
                count={getCount(mode.dataKey)}
                icon={mode.icon}
                difficulty={difficulty}
                isPilot
                tStart={t.practice.start}
                tQuestionsUnit={t.practice.questionsUnit}
                tPilotBadge={t.practice.badgePilot}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ModeCard({
  id,
  label,
  sub,
  desc,
  count,
  icon,
  difficulty,
  isPilot,
  tStart,
  tQuestionsUnit,
  tPilotBadge,
}: {
  id: string;
  label: string;
  sub: string;
  desc: string;
  count: number;
  icon: string;
  difficulty: string;
  isPilot: boolean;
  tStart: string;
  tQuestionsUnit: string;
  tPilotBadge: string;
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
        {isPilot && <span className="badge badge-warn">{tPilotBadge}</span>}
      </div>

      <div>
        <div style={{ fontWeight: 700, color: "var(--ink)", fontSize: "0.95rem", lineHeight: 1.3 }}>{label}</div>
        <div style={{ color: "var(--ink-muted)", fontSize: "0.72rem", marginTop: "0.125rem" }}>{sub}</div>
      </div>

      <p style={{ margin: 0, color: "var(--ink-soft)", fontSize: "0.82rem", lineHeight: 1.55, flex: 1 }}>{desc}</p>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.75rem", color: "var(--ink-muted)" }}>{count} {tQuestionsUnit}</span>
        <span style={{ fontSize: "0.8rem", color: "var(--teal)", fontWeight: 600 }}>{tStart} →</span>
      </div>
    </Link>
  );
}
