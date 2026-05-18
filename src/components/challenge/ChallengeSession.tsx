"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import type { Question } from "@/types/questions";
import { selectQuestions } from "@/lib/practice/question-selector";
import type { DifficultyFilter, SessionMode } from "@/lib/practice/question-selector";
import { addXp, recordAnswer as recordProgressAnswer } from "@/lib/progress/local-progress-store";
import type { QuestionCategory } from "@/types/questions";
import QuestionCard from "@/components/practice/QuestionCard";

const Q_TIME = 30;

const COMPLIMENTS = [
  "Amazing! 🌟", "You're on fire! 🔥", "Great job, Lotan!", "Nailed it! 💪",
  "Excellent! 🎯", "On a roll! 🔥", "Smart! 🧠", "Keep it up! 🚀",
  "Perfect! ✨", "Unstoppable! 💥",
];

type Screen = "lobby" | "playing" | "correct" | "wrong" | "summary";

// raw category keys as they appear on Question objects
const CAT_LABELS: Record<string, string> = {
  sentenceCompletion: "Sentences",
  paraphrasing:       "Restatements",
  grammar:            "Grammar",
  wordFormation:      "Word Formation",
  textCompletion:     "Text Completion",
  reading:            "Reading",
  lectureQuestions:   "Listening",
};

interface CatStat { correct: number; total: number }

const CATS: { id: SessionMode; label: string }[] = [
  { id: "mixed",              label: "All Categories" },
  { id: "sentenceCompletion", label: "Sentences" },
  { id: "restatements",       label: "Restatements" },
  { id: "grammar",            label: "Grammar" },
  { id: "wordFormation",      label: "Word Formation" },
  { id: "textCompletion",     label: "Text Completion" },
];

const DIFFS: { id: DifficultyFilter; label: string }[] = [
  { id: "adaptive", label: "Mixed" },
  { id: "easy",     label: "Easy" },
  { id: "medium",   label: "Medium" },
  { id: "hard",     label: "Hard" },
];

function calcGain(timeLeft: number, streak: number): number {
  return 10 + Math.min(streak, 5) * 2 + (timeLeft >= 25 ? 5 : 0);
}

function PillBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="btn btn-sm"
      style={{
        background: active ? "var(--teal)" : "var(--raised)",
        color: active ? "#fff" : "var(--ink-soft)",
        border: `1.5px solid ${active ? "var(--teal)" : "var(--line)"}`,
      }}
    >
      {children}
    </button>
  );
}

export default function ChallengeSession() {
  // Lobby settings
  const [catMode, setCatMode] = useState<SessionMode>("mixed");
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

  // Stable refs — carry values across timer closures without stale state
  const tlRef      = useRef(Q_TIME);
  const answeredRef = useRef(false);
  const streakRef  = useRef(0);
  const scoreRef   = useRef(0);
  const maxRef     = useRef(0);
  const statsRef   = useRef<Record<string, CatStat>>({});
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const advRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Updated every render so the timer closure always calls the latest handler
  const handleRef  = useRef<(ci: number) => void>((_ci: number) => {});

  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }
  function stopAdv() {
    if (advRef.current) { clearTimeout(advRef.current); advRef.current = null; }
  }

  // Flush game-over stats and navigate to summary or next question
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

  // Build the handler as a stable callback; store in ref so the interval closure stays fresh.
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
    const capturedQs  = questions;

    setResults(prev => {
      const next = [...prev];
      next[capturedIdx] = isCorrect;
      return next;
    });

    if (isCorrect) {
      const gain  = calcGain(tlRef.current, streakRef.current);
      const ns    = streakRef.current + 1;
      const nScore = scoreRef.current + gain;
      const nMax  = Math.max(maxRef.current, ns);
      streakRef.current = ns; scoreRef.current = nScore; maxRef.current = nMax;
      setScore(nScore); setStreak(ns); setMaxStreak(nMax);
      setLastGain(gain); setGainKey(k => k + 1);
      setCompliment(COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)]);
      setScreen("correct");
      advRef.current = setTimeout(() => doAdvance(capturedIdx, capturedQs), 1500);
    } else {
      streakRef.current = 0;
      setStreak(0);
      setScreen("wrong");
      advRef.current = setTimeout(() => doAdvance(capturedIdx, capturedQs), 2200);
    }
  }, [questions, idx]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep ref fresh every render so the interval closure always calls the latest handler
  useEffect(() => { handleRef.current = handleAnswer; });

  // Timer — runs only while screen === "playing"; restarts on each new question
  useEffect(() => {
    if (screen !== "playing") return;
    stopTimer();
    tlRef.current = Q_TIME;

    timerRef.current = setInterval(() => {
      tlRef.current = Math.max(0, tlRef.current - 1);
      setTimeLeft(tlRef.current);
      if (tlRef.current === 0) {
        stopTimer();
        handleRef.current(-1); // time's up = wrong
      }
    }, 1000);

    return () => stopTimer();
  }, [screen, idx]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => () => { stopTimer(); stopAdv(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function start() {
    stopTimer(); stopAdv();
    const qs = selectQuestions(catMode, diff, count);
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
  const timerPct   = (timeLeft / Q_TIME) * 100;
  const timerColor = timeLeft > 15 ? "var(--teal)" : timeLeft > 7 ? "var(--warn)" : "var(--danger)";

  // ── LOBBY ────────────────────────────────────────────────────────
  if (screen === "lobby") {
    return (
      <div className="animate-fade-up ltr-content" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "1rem 0 2rem" }}>
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 64, height: 64, borderRadius: 18, marginBottom: "1rem",
            background: "linear-gradient(135deg, rgba(13,203,177,0.18), rgba(13,203,177,0.06))",
            border: "1.5px solid rgba(13,203,177,0.25)",
            fontSize: "2rem",
          }}>⚡</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.85rem", fontWeight: 900, color: "var(--ink)", margin: "0 0 0.5rem" }}>
            Challenge Mode
          </h1>
          <p style={{ color: "var(--ink-muted)", fontSize: "0.88rem", margin: 0, maxWidth: 340 }}>
            Race the clock · build streaks · earn bonus points
          </p>
        </div>

        {/* Settings card — narrow centered panel */}
        <div style={{ width: "100%", maxWidth: 560, display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Category */}
          <div className="card" style={{ padding: "1.25rem 1.5rem" }}>
            <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--ink-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.875rem" }}>
              Category
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {CATS.map(c => <PillBtn key={c.id} active={catMode === c.id} onClick={() => setCatMode(c.id)}>{c.label}</PillBtn>)}
            </div>
          </div>

          {/* Difficulty + Questions — side by side */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="card" style={{ padding: "1.25rem 1.5rem" }}>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--ink-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.875rem" }}>
                Difficulty
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {DIFFS.map(d => (
                  <PillBtn key={d.id} active={diff === d.id} onClick={() => setDiff(d.id)}>
                    {d.label}
                  </PillBtn>
                ))}
              </div>
            </div>

            <div className="card" style={{ padding: "1.25rem 1.5rem" }}>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--ink-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.875rem" }}>
                Questions
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {[10, 20, 30].map(n => (
                  <PillBtn key={n} active={count === n} onClick={() => setCount(n)}>
                    {n} questions
                  </PillBtn>
                ))}
              </div>
            </div>
          </div>

          {/* Scoring note */}
          <div style={{
            background: "var(--raised)", borderRadius: 10, padding: "0.875rem 1.25rem",
            fontSize: "0.78rem", color: "var(--ink-muted)", lineHeight: 1.6,
            display: "flex", gap: "0.625rem", alignItems: "flex-start",
          }}>
            <span style={{ fontSize: "0.9rem", flexShrink: 0, marginTop: 1 }}>💡</span>
            <span>
              <strong style={{ color: "var(--ink)" }}>Scoring: </strong>
              10 pts · +2 per streak (max +10) · +5 speed bonus for answers ≤ 5s · 30s per question
            </span>
          </div>

          <button className="btn btn-primary btn-lg" onClick={start} style={{ width: "100%", fontSize: "1.05rem", marginTop: "0.25rem" }}>
            Start Challenge ⚡
          </button>
        </div>
      </div>
    );
  }

  // ── SUMMARY ──────────────────────────────────────────────────────
  if (screen === "summary") {
    const totalQ  = Object.values(catStats).reduce((s, c) => s + c.total, 0);
    const totalC  = Object.values(catStats).reduce((s, c) => s + c.correct, 0);
    const pct     = totalQ > 0 ? Math.round((totalC / totalQ) * 100) : 0;
    const weakCats = Object.entries(catStats)
      .filter(([, s]) => s.total > 0 && s.correct / s.total < 0.5)
      .map(([cat]) => CAT_LABELS[cat] ?? cat);

    return (
      <div className="animate-fade-up ltr-content" style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: 600, margin: "0 auto", width: "100%" }}>
        {/* Score hero */}
        <div className="card" style={{ padding: "2rem 1.5rem", textAlign: "center" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--ink-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Challenge Complete ⚡
          </div>
          <div style={{ fontSize: "4.5rem", fontWeight: 900, fontFamily: "var(--font-display)", color: "var(--teal)", lineHeight: 1, margin: "0.5rem 0 0.25rem" }}>
            {score}
          </div>
          <div style={{ color: "var(--ink-muted)", fontSize: "0.88rem" }}>
            points · {pct}% accuracy · {totalC}/{totalQ} correct
          </div>
          {maxStreak >= 3 && (
            <div style={{ marginTop: "0.75rem", fontSize: "1.05rem", fontWeight: 700, color: "var(--warn)" }}>
              🔥 Best streak: {maxStreak}
            </div>
          )}
          <div style={{
            marginTop: "1rem", fontSize: "0.95rem", fontWeight: 600,
            color: pct >= 80 ? "var(--success)" : pct >= 60 ? "var(--teal)" : pct >= 40 ? "var(--warn)" : "var(--danger)",
          }}>
            {pct >= 80 ? "Outstanding! AMIRNET-ready 🌟" :
             pct >= 60 ? "Solid performance! Keep pushing 💪" :
             pct >= 40 ? "Good effort! More practice needed 📚" :
             "Keep going — you'll get there 🎯"}
          </div>
        </div>

        {/* Category breakdown */}
        {Object.entries(catStats).length > 0 && (
          <div className="card" style={{ padding: "1.5rem" }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--ink)", margin: "0 0 1rem" }}>
              Breakdown
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {Object.entries(catStats).map(([cat, stat]) => {
                const p   = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
                const col = p >= 75 ? "var(--success)" : p >= 50 ? "var(--warn)" : "var(--danger)";
                return (
                  <div key={cat}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                      <span style={{ color: "var(--ink)" }}>{CAT_LABELS[cat] ?? cat}</span>
                      <span style={{ color: "var(--ink-soft)" }}>{stat.correct}/{stat.total} ({p}%)</span>
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

        {/* Focus areas */}
        {weakCats.length > 0 && (
          <div className="card" style={{ padding: "1.1rem 1.25rem", borderColor: "var(--warn)" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--warn)", marginBottom: "0.4rem" }}>💡 Focus areas</div>
            <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem", margin: 0 }}>
              Spend more time on: <strong style={{ color: "var(--ink)" }}>{weakCats.join(", ")}</strong>
            </p>
          </div>
        )}

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button className="btn btn-primary" onClick={() => setScreen("lobby")} style={{ flex: 1 }}>
            Play Again ⚡
          </button>
          <Link href="/practice" className="btn btn-ghost">Practice Mode</Link>
          <Link href="/app" className="btn btn-ghost">Dashboard</Link>
        </div>
      </div>
    );
  }

  // ── GAME (playing / correct / wrong) ─────────────────────────────
  if (!q) return null;

  return (
    <div className="ltr-content" style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 720, margin: "0 auto", width: "100%" }}>
      {/* HUD */}
      <div className="card" style={{ padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        {/* Timer bar */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
            <span style={{ color: "var(--ink-muted)" }}>Q {idx + 1} / {questions.length}</span>
            <span style={{ color: timerColor, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
              {screen === "playing" ? `${timeLeft}s` : "—"}
            </span>
          </div>
          <div className="progress-track" style={{ height: 4 }}>
            <div style={{
              height: "100%", borderRadius: 99,
              background: timerColor,
              width: screen === "playing" ? `${timerPct}%` : "0%",
              transition: "width 1s linear, background 0.3s",
            }} />
          </div>
        </div>

        {/* Score */}
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

        {/* Streak badge */}
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

      {/* Progress dots */}
      <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
        {questions.map((_, i) => {
          const res = results[i];
          const isCur = i === idx;
          return (
            <div key={i} style={{
              width: 9, height: 9, borderRadius: "50%", flexShrink: 0,
              background: isCur
                ? "var(--teal)"
                : res === true ? "var(--success)"
                : res === false ? "var(--danger)"
                : "var(--raised)",
              outline: isCur ? "2px solid var(--teal)" : "none",
              outlineOffset: 2,
              transition: "background 0.3s",
            }} />
          );
        })}
      </div>

      {/* CORRECT overlay */}
      {screen === "correct" && (
        <div className="card animate-overlay-pop" style={{
          padding: "2.5rem 2rem", textAlign: "center",
          background: "linear-gradient(135deg, rgba(34,197,94,0.08), rgba(13,203,177,0.05))",
          borderColor: "var(--success)",
          position: "relative", overflow: "hidden", minHeight: 180,
        }}>
          {["🔥", "✨", "⭐", "💫", "🌟"].map((e, i) => (
            <span key={i} style={{
              position: "absolute",
              left: `${8 + i * 19}%`,
              bottom: "15%",
              fontSize: "1.4rem",
              animation: `fire-float ${0.9 + i * 0.15}s ease-out forwards`,
              animationDelay: `${i * 0.08}s`,
              pointerEvents: "none",
              userSelect: "none",
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
              🔥 {streak} streak!
            </div>
          )}
        </div>
      )}

      {/* WRONG: small banner + question with feedback revealed */}
      {screen === "wrong" && (
        <>
          <div className="animate-wrong-entry" style={{
            background: "rgba(239,68,68,0.07)", border: "1px solid var(--danger)",
            borderRadius: 10, padding: "0.7rem 1rem",
            display: "flex", alignItems: "center", gap: "0.6rem",
          }}>
            <span style={{ fontSize: "1rem", color: "var(--danger)" }}>✗</span>
            <span style={{ fontWeight: 700, color: "var(--danger)", fontSize: "0.88rem" }}>
              {chosenIdx === undefined ? "Time's up!" : "Incorrect"}
            </span>
            <span style={{ color: "var(--ink-muted)", fontSize: "0.78rem", marginLeft: "auto" }}>
              Next in 2s…
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

      {/* PLAYING: active question */}
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
