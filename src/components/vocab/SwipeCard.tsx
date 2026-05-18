"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { VocabItem } from "@/types/vocab";
import type { VocabReviewState } from "@/lib/vocab/spaced-repetition";
import { getProgressLabel } from "@/lib/vocab/spaced-repetition";

interface SwipeCardProps {
  item: VocabItem;
  reviewState: VocabReviewState;
  onKnown: () => void;
  onMissed: () => void;
  onStar: () => void;
  onBack: () => void;
  canGoBack: boolean;
  isStarred: boolean;
}

const SWIPE_THRESHOLD = 80;
const TAP_MAX_DELTA = 10;

function ProgressBadge({ score }: { score: number }) {
  const label = getProgressLabel(score);
  const colors: Record<string, string> = {
    New: "var(--ink-muted)",
    Learning: "var(--warn)",
    Strong: "var(--teal)",
    Mastered: "var(--success)",
  };
  return (
    <span style={{
      fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px",
      borderRadius: "99px", background: colors[label] + "22",
      color: colors[label], border: `1px solid ${colors[label]}44`,
      letterSpacing: "0.04em",
    }}>
      {label}
    </span>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    easy:   { bg: "rgba(34,197,94,0.13)",  color: "var(--success)" },
    medium: { bg: "rgba(245,158,11,0.13)", color: "var(--warn)" },
    hard:   { bg: "rgba(239,68,68,0.13)",  color: "var(--danger)" },
  };
  const s = styles[difficulty] ?? styles.medium;
  return (
    <span style={{
      fontSize: "0.7rem", fontWeight: 600, padding: "2px 8px",
      borderRadius: "99px", background: s.bg, color: s.color, textTransform: "capitalize",
    }}>
      {difficulty}
    </span>
  );
}

export default function SwipeCard({ item, reviewState, onKnown, onMissed, onStar, onBack, canGoBack, isStarred }: SwipeCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [flyDir, setFlyDir] = useState<"left" | "right" | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const startXRef = useRef(0);
  const dragXRef = useRef(0);
  const draggingRef = useRef(false);

  // Speak the current word using the Web Speech API
  const speak = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(item.word);
    utt.lang = "en-US";
    utt.rate = 0.85;
    utt.onstart = () => setIsSpeaking(true);
    utt.onend = () => setIsSpeaking(false);
    utt.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utt);
  }, [item.word]);

  // Reset when item changes
  useEffect(() => {
    setIsFlipped(false);
    setDragX(0);
    dragXRef.current = 0;
    setFlyDir(null);
    setIsSpeaking(false);
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [item.id]);

  // Space bar to flip
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === "Space") {
        e.preventDefault();
        setIsFlipped((p) => !p);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    draggingRef.current = true;
    startXRef.current = e.clientX;
    dragXRef.current = 0;
    setIsDragging(true);
    setDragX(0);
    // No setPointerCapture — it redirects click events and breaks tap-to-flip
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const delta = e.clientX - startXRef.current;
    dragXRef.current = delta;
    setDragX(delta);
  };

  const onPointerUp = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setIsDragging(false);

    const delta = dragXRef.current;

    if (delta > SWIPE_THRESHOLD) {
      setFlyDir("right");
      setTimeout(() => { setDragX(0); dragXRef.current = 0; setFlyDir(null); onKnown(); }, 380);
    } else if (delta < -SWIPE_THRESHOLD) {
      setFlyDir("left");
      setTimeout(() => { setDragX(0); dragXRef.current = 0; setFlyDir(null); onMissed(); }, 380);
    } else {
      setDragX(0);
      dragXRef.current = 0;
      // Small movement = tap → flip the card
      if (Math.abs(delta) < TAP_MAX_DELTA) {
        setIsFlipped((p) => !p);
      }
    }
  }, [onKnown, onMissed]);

  const rotation = isDragging ? dragX / 18 : 0;

  let translateX = dragX;
  let opacity = 1;
  if (flyDir === "right") { translateX = 600; opacity = 0; }
  else if (flyDir === "left") { translateX = -600; opacity = 0; }

  let tintBg = "transparent";
  if (isDragging && dragX > 30) tintBg = "rgba(13,203,177,0.08)";
  if (isDragging && dragX < -30) tintBg = "rgba(239,68,68,0.08)";

  const cardStyle: React.CSSProperties = {
    transform: `translateX(${translateX}px) rotate(${rotation}deg)`,
    transition: flyDir !== null
      ? "transform 0.38s cubic-bezier(0.4,0,1,1), opacity 0.38s ease"
      : isDragging ? "none" : "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
    opacity,
    cursor: isDragging ? "grabbing" : "grab",
    userSelect: "none",
    touchAction: "pan-y",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Stack illusion */}
      <div style={{ position: "relative" }}>
        <div style={{
          position: "absolute", inset: 0, top: "8px", left: "6px", right: "-6px",
          borderRadius: "18px", background: "var(--raised)", border: "1px solid var(--line)", opacity: 0.5,
        }} />
        <div style={{
          position: "absolute", inset: 0, top: "4px", left: "3px", right: "-3px",
          borderRadius: "18px", background: "var(--surface)", border: "1px solid var(--line)", opacity: 0.75,
        }} />

        {/* Main swipeable card */}
        <div
          style={{ position: "relative", zIndex: 1, ...cardStyle }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {/* Drag indicators */}
          {isDragging && dragX > 30 && (
            <div style={{
              position: "absolute", top: "16px", left: "16px", zIndex: 10,
              padding: "6px 14px", borderRadius: "8px", background: "var(--teal)", color: "#fff",
              fontWeight: 700, fontSize: "0.85rem", opacity: Math.min(1, (dragX - 30) / 50),
            }}>✓ ידעתי</div>
          )}
          {isDragging && dragX < -30 && (
            <div style={{
              position: "absolute", top: "16px", right: "16px", zIndex: 10,
              padding: "6px 14px", borderRadius: "8px", background: "var(--danger)", color: "#fff",
              fontWeight: 700, fontSize: "0.85rem", opacity: Math.min(1, (-dragX - 30) / 50),
            }}>↩ שוב</div>
          )}

          {/* 3D flip scene */}
          <div className="swipe-card-scene" style={{ height: "420px" }}>
            <div className={`swipe-card-inner${isFlipped ? " flipped" : ""}`} style={{ background: tintBg, borderRadius: "18px" }}>

              {/* ── FRONT ── */}
              <div className="swipe-card-face" style={{
                background: "var(--surface)", border: "1px solid var(--line)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.12)",
                display: "flex", flexDirection: "column", padding: "20px",
              }}>
                {/* Top row: badges + star */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    <DifficultyBadge difficulty={item.difficulty} />
                    {item.partOfSpeech && (
                      <span dir="ltr" style={{ fontSize: "0.7rem", padding: "2px 8px", borderRadius: "99px", background: "var(--raised)", color: "var(--ink-soft)", border: "1px solid var(--line)" }}>
                        {item.partOfSpeech}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <ProgressBadge score={reviewState.masteryScore} />
                    <button
                      onClick={(e) => { e.stopPropagation(); onStar(); }}
                      aria-label={isStarred ? "הסר כוכב" : "הוסף כוכב"}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", color: isStarred ? "var(--warn)" : "var(--ink-muted)", padding: "2px", lineHeight: 1 }}
                    >
                      {isStarred ? "★" : "☆"}
                    </button>
                  </div>
                </div>

                {/* Word — centered, always LTR (English vocabulary word) */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                  <span dir="ltr" style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(2rem, 6vw, 2.75rem)",
                    fontWeight: 800, color: "var(--ink)",
                    textAlign: "center", lineHeight: 1.1, letterSpacing: "-0.01em",
                  }}>
                    {item.word}
                  </span>
                  {item.category && (
                    <span dir="ltr" style={{ fontSize: "0.72rem", color: "var(--ink-muted)", textTransform: "capitalize", letterSpacing: "0.03em" }}>
                      {item.category}
                    </span>
                  )}
                </div>

                {/* Bottom: hint + audio */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
                  <span dir="ltr" style={{ fontSize: "0.78rem", color: "var(--ink-muted)", fontStyle: "italic" }}>
                    Tap to reveal
                  </span>
                  <button
                    onClick={speak}
                    aria-label={isSpeaking ? "מנגן הגייה" : "השמע הגייה"}
                    aria-pressed={isSpeaking}
                    style={{
                      background: isSpeaking ? "var(--teal-sub)" : "none",
                      border: "none", cursor: "pointer", fontSize: "1.1rem",
                      color: isSpeaking ? "var(--teal)" : "var(--ink-muted)",
                      padding: "4px", borderRadius: "6px", transition: "all 0.15s",
                    }}
                  >
                    🔊
                  </button>
                </div>
              </div>

              {/* ── BACK ── */}
              <div className="swipe-card-back" style={{
                background: "var(--surface)", border: "1px solid var(--line)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.12)",
                display: "flex", flexDirection: "column", padding: "20px", overflowY: "auto",
              }}>
                {/* Hebrew — large and centered */}
                <div style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  gap: "12px",
                  minHeight: 0,
                }}>
                  <span style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "clamp(2.25rem, 8vw, 3rem)",
                    fontWeight: 800,
                    color: "var(--teal)",
                    lineHeight: 1.2,
                    direction: "rtl",
                  }}>
                    {item.hebrewTranslation}
                  </span>

                  {item.englishDefinition && (
                    <p dir="ltr" style={{
                      fontSize: "0.88rem", color: "var(--ink-soft)", lineHeight: 1.5,
                      margin: 0, maxWidth: "90%", textAlign: "center",
                    }}>
                      {item.englishDefinition}
                    </p>
                  )}
                </div>

                {/* Bottom: example + tags */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingTop: "12px", borderTop: "1px solid var(--line)" }}>
                  {item.exampleSentence && (
                    <p dir="ltr" style={{
                      fontSize: "0.82rem", color: "var(--ink-muted)", fontStyle: "italic",
                      borderLeft: "2px solid var(--teal)", paddingLeft: "10px",
                      margin: 0, lineHeight: 1.5, textAlign: "left",
                    }}>
                      {item.exampleSentence}
                    </p>
                  )}

                  {(item.synonyms.length > 0 || item.antonyms.length > 0) && (
                    <div dir="ltr" style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                      {item.synonyms.slice(0, 3).map((s) => (
                        <span key={s} dir="ltr" style={{ fontSize: "0.7rem", padding: "2px 7px", borderRadius: "99px", background: "rgba(13,203,177,0.12)", color: "var(--teal)", border: "1px solid rgba(13,203,177,0.3)" }}>
                          ≈ {s}
                        </span>
                      ))}
                      {item.antonyms.slice(0, 2).map((a) => (
                        <span key={a} dir="ltr" style={{ fontSize: "0.7rem", padding: "2px 7px", borderRadius: "99px", background: "rgba(239,68,68,0.1)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.25)" }}>
                          ≠ {a}
                        </span>
                      ))}
                    </div>
                  )}

                  {item.commonTrap && (
                    <div dir="ltr" style={{ padding: "7px 10px", borderRadius: "8px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", fontSize: "0.76rem", color: "var(--warn)", lineHeight: 1.4, textAlign: "left" }}>
                      <span style={{ fontWeight: 700 }}>Trap: </span>{item.commonTrap}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "8px", justifyContent: "center", alignItems: "center" }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={onBack}
          disabled={!canGoBack}
          aria-label="חזור לכרטיס הקודם (Z)"
          style={{
            flexShrink: 0, color: "var(--ink-muted)",
            opacity: canGoBack ? 1 : 0.3,
            cursor: canGoBack ? "pointer" : "default",
            transition: "opacity 0.2s",
          }}
        >
          ← חזור
        </button>
        <button className="btn btn-ghost" onClick={onMissed} style={{ flex: 1, maxWidth: "120px", color: "var(--danger)", borderColor: "var(--danger)" }}>
          ↩ לא ידעתי
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => setIsFlipped((p) => !p)} style={{ flexShrink: 0 }}>
          הפוך ⟳
        </button>
        <button className="btn btn-primary" onClick={onKnown} style={{ flex: 1, maxWidth: "120px" }}>
          ידעתי ✓
        </button>
      </div>
    </div>
  );
}
