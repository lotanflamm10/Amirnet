"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Question } from "@/types/questions";
import { selectQuestions } from "@/lib/practice/question-selector";
import type { DifficultyFilter, SessionMode } from "@/lib/practice/question-selector";
import { addXp, recordAnswer as recordProgressAnswer } from "@/lib/progress/local-progress-store";
import type { QuestionCategory } from "@/types/questions";
import QuestionCard from "@/components/practice/QuestionCard";
import { Flame } from "@/components/icons/NavIcons";
import { useLang } from "@/contexts/LanguageContext";
import {
  CHALLENGE_DEFAULT_SECONDS,
  CHALLENGE_MIN_READ_SECONDS,
  getChallengePerQuestionSeconds,
} from "@/lib/practice/challenge-timing";
import {
  getRecentChallengeSummaries,
  saveChallengeSummary,
  summaryFromQuestions,
  type ChallengeSummary,
} from "@/lib/practice/challenge-history";
import { ChallengeSummaryReport } from "./ChallengeSummary";

const COMPLIMENTS_HE = ["מצוין!", "אש!", "כל הכבוד!", "ישר ולעניין!", "מעולה!", "נהדר!", "חכם!", "כך ממשיכים!", "מושלם!", "בלתי ניתן לעצירה!"];
const COMPLIMENTS_EN = ["Amazing!", "You're on fire!", "Great job!", "Nailed it!", "Excellent!", "On a roll!", "Smart!", "Keep it up!", "Perfect!", "Unstoppable!"];

type Screen = "lobby" | "playing" | "answered" | "summary";

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
  /**
   * True for categories that aren't really "challenges" (rapid-fire MCQ) —
   * clicking them in the lobby short-circuits straight to the dedicated
   * practice editor instead of toggling them into the multi-select.
   * Writing Task is the only such category today.
   */
  redirectMode?: string;
}

const CATEGORIES: ChallengeCat[] = [
  { id: "sentenceCompletion", he: "השלמת משפטים",            en: "Sentence Completion",         isPilot: false },
  { id: "restatements",       he: "ניסוח מחדש",              en: "Restatements",                isPilot: false },
  { id: "reading",            he: "הבנת הנקרא",              en: "Reading Comprehension",       isPilot: false },
  { id: "lectureQuestions",   he: "שאלות על הרצאה או שיחה",  en: "Lecture or Conversation Q",   isPilot: true },
  { id: "textCompletion",     he: "השלמת קטע שמע",           en: "Audio Cloze",                 isPilot: true },
  { id: "grammar",            he: "דקדוק בהקשר",             en: "Grammar in Context",          isPilot: true },
  { id: "wordFormation",      he: "יצירת מילה",              en: "Word Formation",              isPilot: true },
  { id: "writingTask",        he: "מטלת כתיבה",              en: "Writing Task",                isPilot: true, redirectMode: "/practice/writingTask" },
];

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

function calcGain(timeLeft: number, totalTime: number, streak: number): number {
  // Speed bonus rewards answering in the first 1/6 of the budget; old
  // behaviour rewarded the first 5s of a 30s timer (≥25s left), which is
  // equivalent.
  const fastThreshold = Math.round(totalTime * (5 / 6));
  return 10 + Math.min(streak, 5) * 2 + (timeLeft >= fastThreshold ? 5 : 0);
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
  const router = useRouter();

  // Lobby settings — multi-select; default to all 3 main categories.
  const [selectedCats, setSelectedCats] = useState<ChallengeCat["id"][]>([
    "sentenceCompletion",
    "restatements",
    "reading",
  ]);
  const [diff, setDiff] = useState<DifficultyFilter>("adaptive");
  const [count, setCount] = useState(20);
  const [recentSummaries, setRecentSummaries] = useState<ChallengeSummary[]>([]);

  // Game state
  const [screen, setScreen] = useState<Screen>("lobby");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [questionBudget, setQuestionBudget] = useState(CHALLENGE_DEFAULT_SECONDS);
  const [timeLeft, setTimeLeft] = useState(CHALLENGE_DEFAULT_SECONDS);
  const [readWindow, setReadWindow] = useState(CHALLENGE_MIN_READ_SECONDS);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [lastGain, setLastGain] = useState(0);
  const [gainKey, setGainKey] = useState(0);
  const [compliment, setCompliment] = useState("");
  const [chosenIdx, setChosenIdx] = useState<number | undefined>(undefined);
  const [results, setResults] = useState<(boolean | null)[]>([]);
  const [activeSummary, setActiveSummary] = useState<ChallengeSummary | null>(null);
  const [sessionStartedAt, setSessionStartedAt] = useState<string>("");

  const tlRef = useRef(CHALLENGE_DEFAULT_SECONDS);
  const budgetRef = useRef(CHALLENGE_DEFAULT_SECONDS);
  const answeredRef = useRef(false);
  const streakRef = useRef(0);
  const scoreRef = useRef(0);
  const maxRef = useRef(0);
  const statsRef = useRef<Record<string, CatStat>>({});
  const chosenRef = useRef<(number | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const readTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const advRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleRef = useRef<(ci: number) => void>(() => {});
  const persistedRef = useRef<string | null>(null);

  // Load recent challenge summaries for the lobby "Recent" section.
  useEffect(() => {
    setRecentSummaries(getRecentChallengeSummaries(5));
  }, []);

  function stopTimer() { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } }
  function stopReadTimer() { if (readTimerRef.current) { clearInterval(readTimerRef.current); readTimerRef.current = null; } }
  function stopAdv()   { if (advRef.current) { clearTimeout(advRef.current); advRef.current = null; } }

  const persistSummary = useCallback((qs: Question[], chosenList: (number | null)[]) => {
    const summary = summaryFromQuestions(
      sessionStartedAt || new Date().toISOString(),
      qs,
      chosenList,
      scoreRef.current,
      maxRef.current,
      diff
    );
    if (persistedRef.current !== summary.id) {
      saveChallengeSummary(summary);
      persistedRef.current = summary.id;
      setRecentSummaries(getRecentChallengeSummaries(5));
    }
    return summary;
  }, [sessionStartedAt, diff]);

  function doAdvance(capturedIdx: number, capturedQs: Question[]) {
    stopReadTimer();
    stopAdv();
    const next = capturedIdx + 1;
    if (next >= capturedQs.length) {
      const finalSummary = persistSummary(capturedQs, [...chosenRef.current]);
      setActiveSummary(finalSummary);
      setScreen("summary");
    } else {
      setIdx(next);
      setChosenIdx(undefined);
      answeredRef.current = false;
      const nextQ = capturedQs[next];
      const budget = getChallengePerQuestionSeconds(nextQ?.category);
      budgetRef.current = budget;
      tlRef.current = budget;
      setQuestionBudget(budget);
      setTimeLeft(budget);
      setReadWindow(CHALLENGE_MIN_READ_SECONDS);
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
    const budget = budgetRef.current;
    const timeSpent = budget - tlRef.current;
    recordProgressAnswer(cat as QuestionCategory, isCorrect, timeSpent);
    if (isCorrect) addXp(10);
    const ps = statsRef.current[cat] ?? { correct: 0, total: 0 };
    statsRef.current = {
      ...statsRef.current,
      [cat]: { correct: ps.correct + (isCorrect ? 1 : 0), total: ps.total + 1 },
    };

    if (ci >= 0) setChosenIdx(ci);

    // Record the user's choice (or null on timeout) per-question.
    const newChosen = [...chosenRef.current];
    newChosen[idx] = ci >= 0 ? ci : null;
    chosenRef.current = newChosen;

    setResults((prev) => {
      const next = [...prev];
      next[idx] = isCorrect;
      return next;
    });

    const compls = isHe ? COMPLIMENTS_HE : COMPLIMENTS_EN;
    if (isCorrect) {
      const gain = calcGain(tlRef.current, budget, streakRef.current);
      const ns = streakRef.current + 1;
      const nScore = scoreRef.current + gain;
      const nMax = Math.max(maxRef.current, ns);
      streakRef.current = ns; scoreRef.current = nScore; maxRef.current = nMax;
      setScore(nScore); setStreak(ns); setMaxStreak(nMax);
      setLastGain(gain); setGainKey((k) => k + 1);
      setCompliment(compls[Math.floor(Math.random() * compls.length)]);
    } else {
      streakRef.current = 0;
      setStreak(0);
      setLastGain(0);
    }

    // Show the answered/explanation screen until the user clicks Next
    // (or until the generous read window expires).
    setScreen("answered");
    setReadWindow(CHALLENGE_MIN_READ_SECONDS);
    stopReadTimer();
    readTimerRef.current = setInterval(() => {
      setReadWindow((prev) => {
        const next = Math.max(0, prev - 1);
        if (next === 0) {
          stopReadTimer();
          // Capture current values for advance; do NOT auto-advance unless
          // the user is still on the explanation screen.
          advRef.current = setTimeout(() => doAdvance(idx, questions), 50);
        }
        return next;
      });
    }, 1000);
  }, [questions, idx, isHe, persistSummary]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNext = useCallback(() => {
    if (screen !== "answered") return;
    stopReadTimer();
    stopAdv();
    doAdvance(idx, questions);
  }, [screen, idx, questions]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { handleRef.current = handleAnswer; });

  useEffect(() => {
    if (screen !== "playing") return;
    stopTimer();
    tlRef.current = budgetRef.current;
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

  useEffect(() => () => { stopTimer(); stopReadTimer(); stopAdv(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleCat(id: ChallengeCat["id"]) {
    const cat = CATEGORIES.find((c) => c.id === id);
    // Redirect-only categories don't enter the multi-select — tapping the
    // chip jumps straight to the dedicated practice page. Writing Task is
    // the canonical example: it doesn't fit the rapid-fire MCQ format and
    // already has its own full-screen editor at /practice/writingTask.
    if (cat?.redirectMode) {
      router.push(cat.redirectMode);
      return;
    }
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
    stopTimer(); stopReadTimer(); stopAdv();
    const qs = buildMultiPool(availableSelected, diff, count);
    if (!qs.length) return;
    const initialBudget = getChallengePerQuestionSeconds(qs[0]?.category);
    setQuestions(qs);
    setResults(new Array(qs.length).fill(null));
    chosenRef.current = new Array(qs.length).fill(null);
    setIdx(0);
    setQuestionBudget(initialBudget);
    setTimeLeft(initialBudget);
    setReadWindow(CHALLENGE_MIN_READ_SECONDS);
    setScore(0); setStreak(0); setMaxStreak(0);
    setLastGain(0); setGainKey(0); setChosenIdx(undefined);
    setActiveSummary(null);
    setSessionStartedAt(new Date().toISOString());
    scoreRef.current = 0; streakRef.current = 0; maxRef.current = 0;
    budgetRef.current = initialBudget;
    tlRef.current = initialBudget;
    answeredRef.current = false;
    statsRef.current = {};
    persistedRef.current = null;
    setScreen("playing");
  }

  function backToLobby() {
    stopTimer(); stopReadTimer(); stopAdv();
    setActiveSummary(null);
    setRecentSummaries(getRecentChallengeSummaries(5));
    setScreen("lobby");
  }

  const q = questions[idx];
  const timerPct = (timeLeft / Math.max(1, questionBudget)) * 100;
  const warnAt = Math.max(5, Math.round(questionBudget * 0.4));
  const dangerAt = Math.max(2, Math.round(questionBudget * 0.15));
  const timerColor = timeLeft > warnAt ? "var(--teal)" : timeLeft > dangerAt ? "var(--warn)" : "var(--danger)";

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
                  {c.redirectMode && (
                    <span style={{ fontSize: "0.65rem", opacity: 0.8 }}>
                      ↗
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
            {isHe ? "התחל אתגר" : "Start Challenge"}
          </button>

          {/* Recent challenges — last 5 summaries from this user */}
          {recentSummaries.length > 0 && (
            <div className="card" style={{ padding: "1.1rem 1.25rem" }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--ink-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.6rem" }}>
                {isHe ? "אתגרים אחרונים" : "Recent challenges"}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {recentSummaries.map((s) => {
                  const acc = s.totalQuestions > 0 ? Math.round((s.totalCorrect / s.totalQuestions) * 100) : 0;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => { setActiveSummary(s); setScreen("summary"); }}
                      style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "0.55rem 0.75rem", borderRadius: 8,
                        background: "var(--raised)", border: "1px solid var(--line)",
                        textAlign: "start", cursor: "pointer", gap: "0.5rem", minHeight: 44,
                      }}
                      aria-label={isHe ? `הצג סיכום אתגר ${new Date(s.completedAt).toLocaleString("he-IL")}` : `Show challenge summary ${new Date(s.completedAt).toLocaleString("en-US")}`}
                    >
                      <span style={{ fontSize: "0.78rem", color: "var(--ink-muted)" }}>
                        {new Date(s.completedAt).toLocaleDateString(isHe ? "he-IL" : "en-US", { day: "numeric", month: "short" })}
                      </span>
                      <span style={{ fontSize: "0.85rem", color: "var(--ink)", fontWeight: 700 }}>
                        {s.totalCorrect}/{s.totalQuestions} · {acc}%
                      </span>
                      <span style={{ fontSize: "0.78rem", color: "var(--teal)", fontWeight: 700 }}>
                        {s.totalScore} {isHe ? "נק'" : "pts"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── SUMMARY ──────────────────────────────────────────────────────────────
  if (screen === "summary" && activeSummary) {
    return <ChallengeSummaryReport summary={activeSummary} onPlayAgain={backToLobby} />;
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
          <Flame size={14} color={streak >= 3 ? "var(--warn)" : "var(--ink-muted)"} strokeWidth={2} style={{ marginInlineEnd: 6 }} />
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

      {screen === "answered" && (() => {
        const wasCorrect = chosenIdx !== undefined && chosenIdx === q.answer;
        const wasSkipped = chosenIdx === undefined;
        const isLast = idx >= questions.length - 1;
        return (
          <>
            <div style={{
              background: wasCorrect
                ? "rgba(34,197,94,0.08)"
                : "rgba(239,68,68,0.07)",
              border: `1px solid ${wasCorrect ? "var(--success)" : "var(--danger)"}`,
              borderRadius: 10, padding: "0.7rem 1rem",
              display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap",
            }}>
              <span style={{ fontSize: "1rem", color: wasCorrect ? "var(--success)" : "var(--danger)" }}>
                {wasCorrect ? "✓" : "✗"}
              </span>
              <span style={{ fontWeight: 700, color: wasCorrect ? "var(--success)" : "var(--danger)", fontSize: "0.9rem" }}>
                {wasCorrect
                  ? compliment
                  : wasSkipped
                    ? (isHe ? "נגמר הזמן" : "Time's up")
                    : (isHe ? "לא נכון" : "Incorrect")}
              </span>
              {wasCorrect && (
                <span style={{ color: "var(--teal)", fontWeight: 800, fontFamily: "var(--font-display)", fontSize: "1rem" }}>
                  +{lastGain}
                </span>
              )}
              <span style={{ color: "var(--ink-muted)", fontSize: "0.78rem", marginInlineStart: "auto" }}>
                {isHe
                  ? `קריאה ${readWindow}ש׳`
                  : `Read ${readWindow}s`}
              </span>
            </div>

            <QuestionCard
              question={q}
              onSubmit={() => {}}
              disabled={true}
              showFeedback={true}
              chosenIndex={chosenIdx}
            />

            {q.hebrewExplanation && (
              <div dir="rtl" className="card" style={{ padding: "0.75rem 1rem" }}>
                <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--ink-muted)", marginBottom: "0.3rem" }}>
                  הסבר בעברית
                </div>
                <p style={{ fontSize: "0.88rem", color: "var(--ink-soft)", margin: 0, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                  {q.hebrewExplanation}
                </p>
              </div>
            )}

            {q.wrongReasons && q.wrongReasons.length > 0 && (
              <details className="card" style={{ padding: "0.6rem 0.9rem" }}>
                <summary style={{ cursor: "pointer", fontSize: "0.8rem", fontWeight: 700, color: "var(--ink-soft)" }}>
                  {isHe ? "מדוע שאר התשובות שגויות" : "Why the other choices are wrong"}
                </summary>
                <ul style={{ margin: "0.5rem 0 0 1rem", padding: 0, fontSize: "0.84rem", color: "var(--ink-soft)", lineHeight: 1.6 }}>
                  {q.wrongReasons.map((r, i) => (
                    <li key={i} style={{ marginBottom: "0.2rem" }}>{r}</li>
                  ))}
                </ul>
              </details>
            )}

            <button
              className="btn btn-primary btn-lg"
              onClick={handleNext}
              style={{ width: "100%", minHeight: 48 }}
            >
              {isLast
                ? (isHe ? "סיים אתגר" : "Finish challenge")
                : (isHe ? "השאלה הבאה" : "Next question")}
            </button>
          </>
        );
      })()}

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
