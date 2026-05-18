"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Play, Pause, Eye, EyeOff } from "lucide-react";
import type { Question, QuestionCategory } from "@/types/questions";

const CATEGORY_TO_BOOSTER: Partial<Record<QuestionCategory, string>> = {
  sentenceCompletion:  "vocabularyInContext",
  restatements:        "restatementMini",
  grammar:             "connectorPractice",
  wordFormation:       "synonymRecognition",
  reading:             "academicPhrase",
  lectureQuestions:    "connectorPractice",
  textCompletion:      "sentenceLogic",
  vocabulary:          "vocabularyInContext",
  mixed:               "distractorTrap",
  vocabularyInContext: "synonymRecognition",
  synonymRecognition:  "antonymRecognition",
  antonymRecognition:  "synonymRecognition",
  connectorPractice:   "sentenceLogic",
  restatementMini:     "sentenceLogic",
  sentenceLogic:       "distractorTrap",
  distractorTrap:      "sentenceLogic",
  academicPhrase:      "vocabularyInContext",
};

const CHOICE_LABELS = ["A", "B", "C", "D", "E", "F"];

const CORRECT_MESSAGES = [
  "נכון! מצוין 🌟", "כל הכבוד! ✓", "מצוין! ✓", "נכון! המשך כך 💪",
];
function randomCorrect() { return CORRECT_MESSAGES[Math.floor(Math.random() * CORRECT_MESSAGES.length)]; }

interface Props {
  question: Question;
  onSubmit: (choiceIndex: number) => void;
  disabled: boolean;
  chosenIndex?: number;
  showFeedback?: boolean;
  /** "simulation": clicking a choice immediately records it; no submit button shown */
  variant?: "practice" | "simulation";
}

export default function QuestionCard({ question, onSubmit, disabled, chosenIndex, showFeedback = true, variant = "practice" }: Props) {
  const [selected, setSelected]         = useState<number | null>(chosenIndex ?? null);
  const [submitted, setSubmitted]       = useState(disabled);
  const [ttsPlaying, setTtsPlaying]     = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [correctMsg] = useState(randomCorrect);
  const uttRef = useRef<SpeechSynthesisUtterance | null>(null);

  const isLecture = question.category === "lectureQuestions";

  useEffect(() => {
    setSelected(null);
    setSubmitted(false);
    setTtsPlaying(false);
    setShowTranscript(false);
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  }, [question.id]);

  useEffect(() => {
    return () => { if (typeof window !== "undefined") window.speechSynthesis?.cancel(); };
  }, []);

  useEffect(() => { setSubmitted(disabled); }, [disabled]);

  function handlePlayPause() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    if (ttsPlaying) { synth.cancel(); setTtsPlaying(false); return; }

    const text = question.passage?.body ?? "";
    if (!text) return;

    synth.cancel();

    const doSpeak = () => {
      const voices = synth.getVoices();
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = "en-US"; utt.rate = 0.88; utt.pitch = 1;
      // Prefer a local English voice for better quality
      const enVoice = voices.find((v) => v.lang.startsWith("en-") && v.localService)
                   ?? voices.find((v) => v.lang.startsWith("en"));
      if (enVoice) utt.voice = enVoice;
      utt.onend  = () => setTtsPlaying(false);
      utt.onerror = () => setTtsPlaying(false);
      uttRef.current = utt;
      synth.speak(utt);
      setTtsPlaying(true);
    };

    // Chrome drops speak() if called immediately after cancel() — 100ms delay fixes it.
    // Also wait for voices to load if they haven't yet.
    if (synth.getVoices().length > 0) {
      setTimeout(doSpeak, 100);
    } else {
      synth.addEventListener("voiceschanged", () => setTimeout(doSpeak, 100), { once: true });
    }
  }

  function handleSelect(idx: number) {
    if (submitted) return;
    setSelected(idx);
    if (variant === "simulation") {
      // In simulation mode, selecting a choice immediately records the answer
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
      setTtsPlaying(false);
      setSubmitted(true);
      onSubmit(idx);
    }
  }

  function handleSubmit() {
    if (selected === null || submitted) return;
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setTtsPlaying(false);
    setSubmitted(true);
    onSubmit(selected);
  }

  function getChoiceClass(idx: number): string {
    const base = "choice-row";
    if (!submitted) return selected === idx ? `${base} selected` : base;
    if (!showFeedback) return selected === idx ? `${base} selected` : base;
    if (idx === question.answer) return `${base} correct`;
    if (idx === selected && selected !== question.answer) return `${base} wrong`;
    return base;
  }

  const isCorrect = submitted && selected === question.answer;
  const ttsSupported = typeof window !== "undefined" && "speechSynthesis" in window;
  const recommendedBooster = CATEGORY_TO_BOOSTER[question.category];

  return (
    <div className="animate-slide-right" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

      {/* ── Lecture player ── */}
      {isLecture && question.passage && (
        <div className="card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1rem" }}>🎧</span>
            <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {question.passage.title}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button onClick={handlePlayPause} disabled={!ttsSupported}
              style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                padding: "0.6rem 1.25rem", borderRadius: 999, border: "none",
                cursor: ttsSupported ? "pointer" : "not-allowed",
                background: ttsPlaying ? "var(--danger)" : "var(--teal)",
                color: "#fff", fontWeight: 700, fontSize: "0.875rem",
                fontFamily: "var(--font-body)", transition: "background 0.2s",
                boxShadow: ttsPlaying ? "var(--shadow-danger)" : "var(--shadow-teal)",
              }}
            >
              {ttsPlaying ? <Pause size={16} /> : <Play size={16} />}
              {ttsPlaying ? "עצור" : "נגן הרצאה"}
            </button>

            {ttsPlaying && (
              <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                {[0, 1, 2, 3].map(i => (
                  <div key={i} style={{
                    width: 3, height: 4 + i * 4, borderRadius: 2, background: "var(--teal)",
                    animation: `pulse-bar 0.8s ease-in-out ${i * 0.15}s infinite alternate`,
                  }} />
                ))}
              </div>
            )}
            {!ttsSupported && (
              <span style={{ fontSize: "0.75rem", color: "var(--danger)" }}>Audio not supported</span>
            )}
          </div>

          <button onClick={() => setShowTranscript(s => !s)}
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.35rem",
              background: "none", border: "1px solid var(--line)", borderRadius: 8,
              padding: "0.3rem 0.75rem", cursor: "pointer", fontSize: "0.78rem",
              color: "var(--ink-muted)", fontFamily: "var(--font-body)", alignSelf: "flex-start",
              transition: "all 0.15s",
            }}
          >
            {showTranscript ? <EyeOff size={13} /> : <Eye size={13} />}
            {showTranscript ? "הסתר תמליל" : "הצג תמליל (לתרגול בלבד)"}
          </button>

          {showTranscript && (
            <div style={{
              background: "var(--raised)", border: "1px dashed var(--warn)", borderRadius: 10,
              padding: "0.875rem 1rem", fontSize: "0.875rem", lineHeight: 1.75, color: "var(--ink-soft)",
            }}>
              <p style={{ margin: "0 0 0.35rem", fontSize: "0.68rem", fontWeight: 700, color: "var(--warn)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                📖 Transcript — לא גלוי במבחן
              </p>
              <p className="ltr-content" style={{ margin: 0 }}>{question.passage.body}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Reading / text-completion passage ── */}
      {!isLecture && question.passage && (
        <div className="ltr-content" style={{
          background: "var(--raised)", border: "1.5px solid var(--line)",
          borderLeft: "4px solid var(--teal)",
          borderRadius: 12, padding: "1.125rem 1.25rem",
          color: "var(--ink-soft)", fontSize: "0.9rem", lineHeight: 1.85,
        }}>
          {question.passage.title && (
            <p style={{ fontWeight: 700, color: "var(--ink-muted)", marginBottom: "0.625rem", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {question.passage.title}
            </p>
          )}
          <p style={{ margin: 0, color: "var(--ink-soft)" }}>
            {question.passage.body.split("___").map((part, i, arr) =>
              i < arr.length - 1 ? (
                <span key={i}>
                  {part}
                  <span style={{
                    display: "inline-block", minWidth: "4rem",
                    borderBottom: "2.5px solid var(--teal)", marginInline: "0.2rem",
                    color: "var(--teal)", fontWeight: 700, textAlign: "center",
                  }}>{"___"}</span>
                </span>
              ) : <span key={i}>{part}</span>
            )}
          </p>
          {question.passage.source && (
            <footer style={{ marginTop: "0.625rem", fontSize: "0.75rem", color: "var(--ink-muted)" }}>
              — {question.passage.source}
            </footer>
          )}
        </div>
      )}

      {/* ── Question text ── */}
      <div dir="ltr" className="card ltr-content card-flat" style={{
        padding: "1.25rem 1.5rem",
        background: "var(--raised)",
        fontSize: "1.05rem", fontWeight: 600, lineHeight: 1.65,
        color: "var(--ink)", fontFamily: "var(--font-display)",
        border: "1px solid var(--line)",
        textAlign: "left",
      }}>
        {question.text}
      </div>

      {/* ── Choices ── */}
      <div dir="ltr" className="ltr-content" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {question.choices.map((choice, idx) => {
          const isAnswerIdx  = submitted && idx === question.answer;
          const isWrongIdx   = submitted && idx === selected && selected !== question.answer;
          return (
            <button key={idx}
              className={getChoiceClass(idx)}
              onClick={() => handleSelect(idx)}
              disabled={submitted}
              aria-pressed={selected === idx}
            >
              <span style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0, fontWeight: 700, fontSize: "0.8rem",
                transition: "all 0.2s",
                background: isAnswerIdx ? "var(--success)" : isWrongIdx ? "var(--danger)" : selected === idx ? "var(--teal)" : "var(--line)",
                color: isAnswerIdx || isWrongIdx || selected === idx ? "#fff" : "var(--ink-soft)",
              }}>
                {CHOICE_LABELS[idx]}
              </span>
              <span dir="ltr" style={{ flex: 1, fontSize: "0.925rem", textAlign: "left" }}>{choice}</span>
              {showFeedback && submitted && isAnswerIdx && (
                <span style={{ color: "var(--success)", fontWeight: 700, fontSize: "1.1rem" }}>✓</span>
              )}
              {showFeedback && submitted && isWrongIdx && (
                <span style={{ color: "var(--danger)", fontWeight: 700, fontSize: "1.1rem" }}>✗</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Submit — hidden in simulation (choice click = auto-submit) ── */}
      {!submitted && variant !== "simulation" && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button className="btn btn-primary"
            onClick={handleSubmit}
            disabled={selected === null}
            style={{ minWidth: 140 }}
          >
            שלח תשובה
          </button>
        </div>
      )}

      {/* ── Feedback ── */}
      {submitted && showFeedback && (
        <div className="animate-fade-up card" style={{
          padding: "1.125rem 1.25rem",
          borderColor: isCorrect ? "var(--success)" : "var(--danger)",
          background: isCorrect ? "var(--success-sub)" : "var(--danger-sub)",
          display: "flex", flexDirection: "column", gap: "0.75rem",
        }}>
          {/* Result header */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.1rem" }}>{isCorrect ? "✓" : "✗"}</span>
            <p style={{ fontWeight: 700, color: isCorrect ? "var(--success)" : "var(--danger)", margin: 0, fontSize: "0.95rem" }}>
              {isCorrect ? correctMsg : "לא נכון"}
            </p>
            {question.isSkillBooster && (
              <span style={{ fontSize: "0.68rem", padding: "0.1rem 0.45rem", borderRadius: 999, background: "var(--teal-sub)", color: "var(--teal)", fontWeight: 700, marginRight: "auto" }}>
                חיזוק מיומנות
              </span>
            )}
          </div>

          {/* English explanation */}
          {question.explanation && (
            <p className="ltr-content" style={{ margin: 0, color: "var(--ink-soft)", fontSize: "0.875rem", lineHeight: 1.65, paddingLeft: "1.625rem" }}>
              {question.explanation}
            </p>
          )}

          {/* Wrong reasons */}
          {!isCorrect && question.wrongReasons && question.wrongReasons.length > 0 && (
            <ul className="ltr-content" style={{ margin: 0, paddingLeft: "1.9rem", paddingRight: 0, color: "var(--ink-muted)", fontSize: "0.85rem", lineHeight: 1.65 }}>
              {question.wrongReasons.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          )}

          {/* Hebrew explanation (skill boosters) */}
          {question.hebrewExplanation && (
            <div style={{
              borderTop: "1px solid var(--line)", paddingTop: "0.625rem",
              display: "flex", flexDirection: "column", gap: "0.25rem",
            }}>
              <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                הסבר בעברית
              </span>
              <p style={{ margin: 0, color: "var(--ink-soft)", fontSize: "0.85rem", lineHeight: 1.7, direction: "rtl" }}>
                {question.hebrewExplanation}
              </p>
            </div>
          )}

          {/* Vocabulary words */}
          {question.vocabularyWords && question.vocabularyWords.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", alignItems: "center" }}>
              <span style={{ fontSize: "0.7rem", color: "var(--ink-muted)", fontWeight: 600 }}>מילים מפתח:</span>
              {question.vocabularyWords.map((w) => (
                <span key={w} style={{
                  fontSize: "0.75rem", padding: "0.15rem 0.5rem", borderRadius: 999,
                  background: "var(--teal-sub)", color: "var(--teal)", fontWeight: 700,
                  fontFamily: "var(--font-display)",
                }}>
                  {w}
                </span>
              ))}
            </div>
          )}

          {/* Practice similar questions button (shown when wrong) */}
          {!isCorrect && recommendedBooster && (
            <div style={{ borderTop: "1px solid var(--line)", paddingTop: "0.625rem" }}>
              <Link
                href={`/practice/${recommendedBooster}`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.35rem",
                  fontSize: "0.78rem", fontWeight: 600, color: "var(--teal)",
                  background: "var(--teal-sub)", border: "1px solid var(--teal)",
                  borderRadius: 8, padding: "0.35rem 0.75rem", textDecoration: "none",
                  transition: "opacity 0.15s",
                }}
              >
                ⚡ תרגל שאלות דומות →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
