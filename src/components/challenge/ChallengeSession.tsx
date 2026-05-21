"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import type { Question } from "@/types/questions";
import { selectQuestions } from "@/lib/practice/question-selector";
import type { DifficultyFilter, SessionMode } from "@/lib/practice/question-selector";
import { addXp, recordAnswer as recordProgressAnswer } from "@/lib/progress/local-progress-store";
import type { QuestionCategory } from "@/types/questions";
import QuestionCard from "@/components/practice/QuestionCard";
import { useLang } from "@/contexts/LanguageContext";

const Q_TIME = 30;

const COMPLIMENTS_HE = ["מצוין! 🌟", "אש! 🔥", "כל הכבוד!", "ישר ולעניין! 💪", "מעולה! 🎯", "נהדר! 🔥", "חכם! 🧠", "כך ממשיכים! 🚀", "מושלם! ✨", "בלתי ניתן לעצירה! 💥"];
const COMPLIMENTS_EN = ["Amazing! 🌟", "You're on fire! 🔥", "Great job!", "Nailed it! 💪", "Excellent! 🎯", "On a roll! 🔥", "Smart! 🧠", "Keep it up! 🚀", "Perfect! ✨", "Unstoppable! 💥"];

type Screen = "lobby" | "playing" | "correct" | "wrong" | "summary";

interface CatStat { correct: number; total: number }

// ── Challenge category definitions ──────────────────────────────────────────
// Main = official AMIRNET sections. Pilot = experimental.
interface ChallengeCat {
  id: Exclude<SessionMode, "mixed" | "smartReview">;
  he: string;
  en: string;
  /** Pilot/experimental section (rendered separately). */
  isPilot: boolean;
  /** True if the category is not yet wired to MCQ data and should be unavailable. */
  unavailable?: boolean;
}

const CATEGORIES: ChallengeCat[] = [
  { id: "sentenceCompletion", he: "השלמת משפטים",            en: "Sentence Completion",         isPilot: false },
  { id: "restatements",       he: "ניסוח מחדש",              en: "Restatements",                isPilot: false },
  { id: "reading",            he: "הבנת הנקרא",              en: "Reading Comprehension",       isPilot: false },
  { id: "lectureQuestions",   he: "שאלות על הרצאה או שיחה",  en: "Lecture or Conversation Q",   isPilot: true },
  { id: "textCompletion",     he: "השלמת קטע שמע",           en: "Audio Cloze",                 isPilot: true },
  { id: "grammar",            he: "דקדוק בהקשר",             en: "Grammar in Context",          isPilot: true },
  { id: "wordFormation",      he: "יצירת מילה",              en: "Word Formation",              isPilot: true },
  { id: "writingTask",        he: "מטלת כתיבה",              en: "Writing Task",                isPilot: true, unavailable: true },
];

const CAT_LABEL_BY_ID: Record<string, { he: string; en: string }> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, { he: c.he, en: c.en }]),
);

const DIFFS: { id: DifficultyFilter; he: string; en: string }[] = [
  { id: "adaptive", he: "מעורב",  en: "Mixed" },
  { id: "easy",     he: "קל",     en: "Easy" },
  { id: "medium",   he: "בינוני", en: "Medium" },
  { id: "hard",     he: "קשה",    en: "Hard" },
];

/**
 * Build a mixed question pool from one or more categories. Pulls about
 * count/N from each selected category, merges, shuffles, slices to count.
 * Categories marked unavailable (writing task) are silently filtered out
 * — the caller already shows them as disabled in the UI.
 */
function buildMultiPool(
  selected: ChallengeCat["id"][],
  diff: DifficultyFilter,
  count: number,
): Question[] {
  const cats = selected.filter((id) => !CATEGORIES.find((c) => c.id === id)?.unavailable);
  if (cats.length === 0) return [];
  const perCat = Math.ceil(count / cats.length);
  const buckets = cats.map((id) => selectQuestions(id as SessionMode, diff, perCat));
  // Merge + shuffle
  const merged: Question[] = [];
  let consumed = true;
  let i = 0;
  while (consumed && merged.length < count) {
    consumed = false;
    for (const bucket of buckets) {
      if (i < bucket.length) {
        merged.push(bucket[i]);
        consumed = true;
        if (merged.length >= count) break;
      }
    }
    i++;
  }
  // Final shuffle
  for (let j = merged.length - 1; j > 0; j--) {
    const k = Math.floor(Math.random() * (j + 1));
    [merged[j], merged[k]] = [merged[k], merged[j]];
  }
  return merged.slice(0, count);
}

function calcGain(timeLeft: number, streak: number): number {
  return 10 + Math.min(streak, 5) * 2 + (timeLeft >= 25 ? 5 : 0);
}

function CategoryChip({
  active, disabled, onClick, children,
}: {
  active: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      aria-pressed={active}
      aria-disabled={disabled}
      style={{
        background: active ? "var(--teal)" : "var(--raised)",
        color: disabled ? "var(--ink-muted)" : active ? "#fff" : "var(--ink-soft)",
        border: `1.5px solid ${active ? "var(--teal)" : "var(--line)"}`,
        borderRadius: 10,
        padding: "0.5rem 0.85rem",
        fontSize: "0.86rem",
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        WebkitTapHighlightColor: "transparent",
        minHeight: 40,
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
        textAlign: "start",
        lineHeight: 1.2,
        overflowWrap: "anywhere",
      }}
    >
      <span style={{ fontSize: "0.95rem", lineHeight: 1, opacity: active ? 1 : 0.7 }}>
        {active ? "✓" : disabled ? "🚧" : "+"}
      </span>
      <span>{children}</span>
    </button>
  );
}

export default function ChallengeSession() {
  const { lang } = useLang();
  const isHe = lang === "he";

  // Lobby settings — multi-select; default to all 3 main categories.
  const [selectedCats, setSelectedCats] = useState<ChallengeCat["id"][]>([
    "sentenceCompletion",
    "restatements",
    "reading",
  ]);
  const [diff, setDiff] = useState<DifficultyFilter>("adaptive");
  const [count, setCount] = useState(20);

  // Game state
  const [screen, setScreen] = useState<Screen>("lobby");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(Q_TIME);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [lastGain, setLastGain] = useState(0);
  const [gainKey, setGainKey] = useState(0);
  const [compliment, setCompliment] = useState("");
  const [chosenIdx, setChosenIdx] = useState<number | undefined>(undefined);
  const [results, setResults] = useState<(boolean | null)[]>([]);
  const [catStats, setCatStats] = useState<Record<string, CatStat>>({});

  const tlRef = useRef(Q_TIME);
  const answeredRef = useRef(false);
  const streakRef = useRef(0);
  const scoreRef = useRef(0);
  const maxRef = useRef(0);
  const statsRef = useRef<Record<string, CatStat>>({});
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const advRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleRef = useRef<(ci: number) => void>(() => {});

  function stopTimer() { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } }
  function stopAdv()   { if (advRef.current) { clearTimeout(advRef.current); advRef.current = null; } }

  function doAdvance(capturedIdx: number, capturedQs: Question[]) {
    const next = capturedIdx + 1;
    if (next >= capturedQs.length) {
      setCatStats({ ...statsRef.current });
      setScreen("summary");
    } else {
      setIdx(next);
      setChosenIdx(undefined);
      answeredRef.current = false;
      tlRef.current = Q_TIME;
      setTimeLeft(Q_TIME);
      setScreen("playing");
    }
  }

  const handleAnswer = useCallback((ci: number) => {
    if (answeredRef.current) return;
    answeredRef.current = true;
    stopTimer();

    const q = questions[idx];
    if (!q) return;

    const isCorrect = ci >= 0 && ci === q.answer;
    const cat = q.category ?? "sentenceCompletion";
    const timeSpent = Q_TIME - tlRef.current;
    recordProgressAnswer(cat as QuestionCategory, isCorrect, timeSpent);
    if (isCorrect) addXp(10);
    const ps = statsRef.current[cat] ?? { correct: 0, total: 0 };
    statsRef.current = {
      ...statsRef.current,
      [cat]: { correct: ps.correct + (isCorrect ? 1 : 0), total: ps.total + 1 },
    };

    if (ci >= 0) setChosenIdx(ci);

    const capturedIdx = idx;
    const capturedQs = questions;
    setResults((prev) => {
      const next = [...prev];
      next[capturedIdx] = isCorrect;
      return next;
    });

    const compls = isHe ? COMPLIMENTS_HE : COMPLIMENTS_EN;
    if (isCorrect) {
      const gain = calcGain(tlRef.current, streakRef.current);
      const ns = streakRef.current + 1;
      const nScore = scoreRef.current + gain;
      const nMax = Math.max(maxRef.current, ns);
      streakRef.current = ns; scoreRef.current = nScore; maxRef.current = nMax;
      setScore(nScore); setStreak(ns); setMaxStreak(nMax);
      setLastGain(gain); setGainKey((k) => k + 1);
      setCompliment(compls[Math.floor(Math.random() * compls.length)]);
      setScreen("correct");
      advRef.current = setTimeout(() => doAdvance(capturedIdx, capturedQs), 1500);
    } else {
      streakRef.current = 0;
      setStreak(0);
      setScreen("wrong");
      advRef.current = setTimeout(() => doAdvance(capturedIdx, capturedQs), 2200);
    }
  }, [questions, idx, isHe]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { handleRef.current = handleAnswer; });

  useEffect(() => {
    if (screen !== "playing") return;
    stopTimer();
    tlRef.current = Q_TIME;
    timerRef.current = setInterval(() => {
      tlRef.current = Math.max(0, tlRef.current - 1);
      setTimeLeft(tlRef.current);
      if (tlRef.current === 0) {
        stopTimer();
        handleRef.current(-1);
      }
    }, 1000);
    return () => stopTimer();
  }, [screen, idx]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { stopTimer(); stopAdv(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleCat(id: ChallengeCat["id"]) {
    setSelectedCats((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  function selectAllMain() {
    setSelectedCats(CATEGORIES.filter((c) => !c.isPilot && !c.unavailable).map((c) => c.id));
  }

  const availableSelected = selectedCats.filter(
    (id) => !CATEGORIES.find((c) => c.id === id)?.unavailable,
  );
  const canStart = availableSelected.length > 0;

  function start() {
    if (!canStart) return;
    stopTimer(); stopAdv();
    const qs = buildMultiPool(availableSelected, diff, count);
    if (!qs.length) return;
    setQuestions(qs);
    setResults(new Array(qs.length).fill(null));
    setIdx(0); setTimeLeft(Q_TIME);
    setScore(0); setStreak(0); setMaxStreak(0);
    setLastGain(0); setGainKey(0); setChosenIdx(undefined); setCatStats({});
    scoreRef.current = 0; streakRef.current = 0; maxRef.current = 0;
    tlRef.current = Q_TIME; answeredRef.current = false; statsRef.current = {};
    setScreen("playing");
  }

  const q = questions[idx];
  const timerPct = (timeLeft / Q_TIME) * 100;
  const timerColor = timeLeft > 15 ? "var(--teal)" : timeLeft > 7 ? "var(--warn)" : "var(--danger)";

  const mainCats = useMemo(() => CATEGORIES.filter((c) => !c.isPilot), []);
  const pilotCats = useMemo(() => CATEGORIES.filter((c) => c.isPilot), []);

  // ── LOBBY ────────────────────────────────────────────────────────────────
  if (screen === "lobby") {
    return (
      <div dir={isHe ? "rtl" : "ltr"} className="animate-fade-up" style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "1rem 0 2rem", width: "100%", maxWidth: "100%", boxSizing: "border-box",
      }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 64, height: 64, borderRadius: 18, marginBottom: "1rem",
            background: "linear-gradient(135deg, rgba(13,203,177,0.18), rgba(13,203,177,0.06))",
            border: "1.5px solid rgba(13,203,177,0.25)", fontSize: "2rem",
          }}>⚡</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem, 5vw, 1.85rem)", fontWeight: 900, color: "var(--ink)", margin: "0 0 0.5rem" }}>
            {isHe ? "מצב אתגר" : "Challenge Mode"}
          </h1>
          <p style={{ color: "var(--ink-muted)", fontSize: "0.88rem", margin: 0, maxWidth: 340 }}>
            {isHe ? "מרוץ נגד השעון · רצפים · בונוסים" : "Race the clock · build streaks · earn bonus points"}
          </p>
        </div>

        <div style={{ width: "100%", maxWidth: 560, display: "flex", flexDirection: "column", gap: "1rem", minWidth: 0 }}>
          {/* Main categories */}
          <div className="card" style={{ padding: "1.1rem 1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", gap: "0.5rem", flexWrap: "wrap" }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--ink-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                {isHe ? "קטגוריות עיקריות" : "Main categories"}
              </div>
              <button
                type="button"
                onClick={selectAllMain}
                style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--teal)", background: "none", border: "none", cursor: "pointer", padding: "0.2rem 0.4rem" }}
              >
                {isHe ? "בחר הכל" : "Select all"}
              </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {mainCats.map((c) => (
                <CategoryChip
                  key={c.id}
                  active={selectedCats.includes(c.id)}
                  onClick={() => toggleCat(c.id)}
                >
                  {isHe ? c.he : c.en}
                </CategoryChip>
              ))}
            </div>
          </div>

          {/* Pilot categories */}
          <div className="card" style={{ padding: "1.1rem 1.25rem" }}>
            <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--ink-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
              {isHe ? "פרקים ניסיוניים" : "Experimental sections"}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {pilotCats.map((c) => (
                <CategoryChip
                  key={c.id}
                  active={selectedCats.includes(c.id)}
                  disabled={c.unavailable}
                  onClick={() => toggleCat(c.id)}
                >
                  {isHe ? c.he : c.en}
                  {c.unavailable && (
                    <span style={{ fontSize: "0.65rem", opacity: 0.8 }}>
                      ({isHe ? "בקרוב" : "soon"})
                    </span>
                  )}
                </CategoryChip>
              ))}
            </div>
          </div>

          {/* Difficulty + Question count side by side */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div className="card" style={{ padding: "1rem", minWidth: 0 }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--ink-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.65rem" }}>
                {isHe ? "רמה" : "Difficulty"}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                {DIFFS.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setDiff(d.id)}
                    style={{
                      background: diff === d.id ? "var(--teal)" : "var(--raised)",
                      color: diff === d.id ? "#fff" : "var(--ink-soft)",
                      border: `1.5px solid ${diff === d.id ? "var(--teal)" : "var(--line)"}`,
                      borderRadius: 8, padding: "0.45rem 0.7rem", fontWeight: 600,
                      fontSize: "0.82rem", cursor: "pointer", minHeight: 38,
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    {isHe ? d.he : d.en}
                  </button>
                ))}
              </div>
            </div>

            <div className="card" style={{ padding: "1rem", minWidth: 0 }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--ink-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.65rem" }}>
                {isHe ? "שאלות" : "Questions"}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                {[10, 20, 30].map((n) => (
                  <button
                    key={n}
                    onClick={() => setCount(n)}
                    style={{
                      background: count === n ? "var(--teal)" : "var(--raised)",
                      color: count === n ? "#fff" : "var(--ink-soft)",
                      border: `1.5px solid ${count === n ? "var(--teal)" : "var(--line)"}`,
                      borderRadius: 8, padding: "0.45rem 0.7rem", fontWeight: 600,
                      fontSize: "0.82rem", cursor: "pointer", minHeight: 38,
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    {n} {isHe ? "שאלות" : "questions"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Selection hint / unavailable warning */}
          {selectedCats.some((id) => CATEGORIES.find((c) => c.id === id)?.unavailable) && (
            <div style={{
              background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)",
              borderRadius: 10, padding: "0.6rem 0.85rem", fontSize: "0.78rem",
              color: "var(--warn)", lineHeight: 1.5,
            }}>
              {isHe
                ? "מטלת כתיבה תהיה זמינה בקרוב — היא תדולג מהאתגר."
                : "Writing Task will be available soon — it'll be skipped in the challenge."}
            </div>
          )}

          <button
            className="btn btn-primary btn-lg"
            onClick={start}
            disabled={!canStart}
            style={{
              width: "100%", fontSize: "1.05rem", marginTop: "0.25rem",
              opacity: canStart ? 1 : 0.5,
              cursor: canStart ? "pointer" : "not-allowed",
              minHeight: 48,
            }}
          >
            {isHe ? "התחל אתגר ⚡" : "Start Challenge ⚡"}
          </button>
        </div>
      </div>
    );
  }

  // ── SUMMARY ──────────────────────────────────────────────────────────────
  if (screen === "summary") {
    const totalQ = Object.values(catStats).reduce((s, c) => s + c.total, 0);
    const totalC = Object.values(catStats).reduce((s, c) => s + c.correct, 0);
    const pct = totalQ > 0 ? Math.round((totalC / totalQ) * 100) : 0;
    const weakCats = Object.entries(catStats)
      .filter(([, s]) => s.total > 0 && s.correct / s.total < 0.5)
      .map(([cat]) => (isHe ? CAT_LABEL_BY_ID[cat]?.he : CAT_LABEL_BY_ID[cat]?.en) ?? cat);

    return (
      <div dir={isHe ? "rtl" : "ltr"} className="animate-fade-up" style={{
        display: "flex", flexDirection: "column", gap: "1.25rem",
        maxWidth: 600, margin: "0 auto", width: "100%", minWidth: 0, boxSizing: "border-box",
      }}>
        <div className="card" style={{ padding: "2rem 1.25rem", textAlign: "center" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--ink-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {isHe ? "אתגר הושלם ⚡" : "Challenge Complete ⚡"}
          </div>
          <div style={{ fontSize: "clamp(3rem, 12vw, 4.5rem)", fontWeight: 900, fontFamily: "var(--font-display)", color: "var(--teal)", lineHeight: 1, margin: "0.5rem 0 0.25rem", whiteSpace: "nowrap" }}>
            {score}
          </div>
          <div style={{ color: "var(--ink-muted)", fontSize: "0.88rem" }}>
            {isHe
              ? `נקודות · ${pct}% דיוק · ${totalC}/${totalQ} נכונות`
              : `points · ${pct}% accuracy · ${totalC}/${totalQ} correct`}
          </div>
          {maxStreak >= 3 && (
            <div style={{ marginTop: "0.75rem", fontSize: "1.05rem", fontWeight: 700, color: "var(--warn)" }}>
              {isHe ? `🔥 רצף הטוב ביותר: ${maxStreak}` : `🔥 Best streak: ${maxStreak}`}
            </div>
          )}
        </div>

        {Object.entries(catStats).length > 0 && (
          <div className="card" style={{ padding: "1.25rem" }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--ink)", margin: "0 0 0.75rem" }}>
              {isHe ? "פירוט" : "Breakdown"}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {Object.entries(catStats).map(([cat, stat]) => {
                const p = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
                const col = p >= 75 ? "var(--success)" : p >= 50 ? "var(--warn)" : "var(--danger)";
                const label = (isHe ? CAT_LABEL_BY_ID[cat]?.he : CAT_LABEL_BY_ID[cat]?.en) ?? cat;
                return (
                  <div key={cat}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.25rem", gap: "0.5rem" }}>
                      <span style={{ color: "var(--ink)", overflowWrap: "anywhere" }}>{label}</span>
                      <span style={{ color: "var(--ink-soft)", whiteSpace: "nowrap" }}>{stat.correct}/{stat.total} ({p}%)</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${p}%`, background: col }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {weakCats.length > 0 && (
          <div className="card" style={{ padding: "1rem 1.1rem", borderColor: "var(--warn)" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--warn)", marginBottom: "0.4rem" }}>
              {isHe ? "💡 תחומים לחיזוק" : "💡 Focus areas"}
            </div>
            <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem", margin: 0, overflowWrap: "anywhere" }}>
              {isHe ? "השקיע יותר ב: " : "Spend more time on: "}
              <strong style={{ color: "var(--ink)" }}>{weakCats.join(", ")}</strong>
            </p>
          </div>
        )}

        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <button className="btn btn-primary" onClick={() => setScreen("lobby")} style={{ flex: 1, minWidth: 0 }}>
            {isHe ? "שחק שוב ⚡" : "Play Again ⚡"}
          </button>
          <Link href="/practice" className="btn btn-ghost">{isHe ? "מצב תרגול" : "Practice Mode"}</Link>
          <Link href="/app" className="btn btn-ghost">{isHe ? "לוח בקרה" : "Dashboard"}</Link>
        </div>
      </div>
    );
  }

  // ── GAME ─────────────────────────────────────────────────────────────────
  if (!q) return null;

  return (
    <div className="ltr-content" style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 720, margin: "0 auto", width: "100%", minWidth: 0, boxSizing: "border-box" }}>
      <div className="card" style={{ padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "1rem", minWidth: 0 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
            <span style={{ color: "var(--ink-muted)" }}>Q {idx + 1} / {questions.length}</span>
            <span style={{ color: timerColor, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
              {screen === "playing" ? `${timeLeft}s` : "—"}
            </span>
          </div>
          <div className="progress-track" style={{ height: 4 }}>
            <div style={{
              height: "100%", borderRadius: 99, background: timerColor,
              width: screen === "playing" ? `${timerPct}%` : "0%",
              transition: "width 1s linear, background 0.3s",
            }} />
          </div>
        </div>
        <div style={{ textAlign: "center", minWidth: 52 }}>
          <div
            key={gainKey}
            className={gainKey > 0 ? "animate-score-pop" : undefined}
            style={{ fontSize: "1.4rem", fontWeight: 900, color: "var(--teal)", fontFamily: "var(--font-display)", lineHeight: 1 }}
          >
            {score}
          </div>
          <div style={{ fontSize: "0.62rem", color: "var(--ink-muted)", lineHeight: 1, marginTop: 2 }}>pts</div>
        </div>
        <div
          className={streak >= 3 ? "animate-streak-glow" : undefined}
          style={{
            display: "flex", alignItems: "center", gap: "0.3rem",
            background: streak >= 3 ? "rgba(245,158,11,0.12)" : "var(--raised)",
            borderRadius: 99, padding: "0.3rem 0.7rem",
            border: `1px solid ${streak >= 3 ? "rgba(245,158,11,0.3)" : "var(--line)"}`,
          }}
        >
          <span style={{ fontSize: "0.85rem" }}>🔥</span>
          <span style={{ fontWeight: 700, fontSize: "0.9rem", color: streak >= 3 ? "var(--warn)" : "var(--ink-muted)" }}>
            {streak}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
        {questions.map((_, i) => {
          const res = results[i];
          const isCur = i === idx;
          return (
            <div key={i} style={{
              width: 9, height: 9, borderRadius: "50%", flexShrink: 0,
              background: isCur ? "var(--teal)" : res === true ? "var(--success)" : res === false ? "var(--danger)" : "var(--raised)",
              outline: isCur ? "2px solid var(--teal)" : "none", outlineOffset: 2,
              transition: "background 0.3s",
            }} />
          );
        })}
      </div>

      {screen === "correct" && (
        <div className="card animate-overlay-pop" style={{
          padding: "2.5rem 1.25rem", textAlign: "center",
          background: "linear-gradient(135deg, rgba(34,197,94,0.08), rgba(13,203,177,0.05))",
          borderColor: "var(--success)", position: "relative", overflow: "hidden", minHeight: 180,
        }}>
          {["🔥", "✨", "⭐", "💫", "🌟"].map((e, i) => (
            <span key={i} style={{
              position: "absolute", left: `${8 + i * 19}%`, bottom: "15%", fontSize: "1.4rem",
              animation: `fire-float ${0.9 + i * 0.15}s ease-out forwards`,
              animationDelay: `${i * 0.08}s`, pointerEvents: "none", userSelect: "none",
            }}>{e}</span>
          ))}
          <div style={{ fontSize: "2.5rem", lineHeight: 1 }}>✓</div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--success)", margin: "0.5rem 0 0.25rem" }}>
            {compliment}
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "var(--teal)", fontFamily: "var(--font-display)" }}>
            +{lastGain} pts
          </div>
          {streak > 1 && (
            <div style={{ marginTop: "0.4rem", fontSize: "0.88rem", color: "var(--warn)", fontWeight: 700 }}>
              {isHe ? `🔥 רצף של ${streak}!` : `🔥 ${streak} streak!`}
            </div>
          )}
        </div>
      )}

      {screen === "wrong" && (
        <>
          <div className="animate-wrong-entry" style={{
            background: "rgba(239,68,68,0.07)", border: "1px solid var(--danger)",
            borderRadius: 10, padding: "0.7rem 1rem",
            display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap",
          }}>
            <span style={{ fontSize: "1rem", color: "var(--danger)" }}>✗</span>
            <span style={{ fontWeight: 700, color: "var(--danger)", fontSize: "0.88rem" }}>
              {chosenIdx === undefined
                ? (isHe ? "נגמר הזמן!" : "Time's up!")
                : (isHe ? "לא נכון" : "Incorrect")}
            </span>
            <span style={{ color: "var(--ink-muted)", fontSize: "0.78rem", marginInlineStart: "auto" }}>
              {isHe ? "ממשיכים בעוד 2 שניות…" : "Next in 2s…"}
            </span>
          </div>
          <QuestionCard
            question={q}
            onSubmit={() => {}}
            disabled={true}
            showFeedback={true}
            chosenIndex={chosenIdx}
          />
        </>
      )}

      {screen === "playing" && (
        <div key={idx} className="animate-question-enter">
          <QuestionCard
            question={q}
            onSubmit={(ci) => handleRef.current(ci)}
            disabled={false}
            showFeedback={false}
          />
        </div>
      )}
    </div>
  );
}
