"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { VocabItem } from "@/types/vocab";
import type { VocabReviewState } from "@/lib/vocab/spaced-repetition";
import { getProgressLabel } from "@/lib/vocab/spaced-repetition";
import { useLang } from "@/contexts/LanguageContext";
import { getMemoryEnrichment } from "@/lib/vocab/memory-hint";

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

/**
 * Gesture tuning constants.
 *
 * DEAD_ZONE_PX: how far the pointer must move from its start position
 *   before we even decide whether it's a horizontal swipe or a vertical
 *   scroll. Below this the card stays put and no transform is applied.
 *
 * HORIZONTAL_BIAS: the gesture commits to "horizontal" only when
 *   |dx| > |dy| * HORIZONTAL_BIAS. A value > 1 means the user can swipe
 *   slightly diagonally (up-and-to-the-right etc.) and we still treat it
 *   as horizontal — but a near-vertical drag is correctly classified as
 *   "vertical" and we yield to the page scroll.
 *
 * TAP_MAX_DELTA: total pointer travel below which we treat the gesture as
 *   a tap (and flip the card) rather than any kind of drag.
 *
 * SWIPE_THRESHOLD_MIN / _RATIO: the swipe threshold is responsive — we
 *   require at least min(card_width * RATIO, MIN) of horizontal travel
 *   before triggering known/unknown. Keeps the gesture predictable across
 *   320px phones and tablet/desktop widths.
 */
const DEAD_ZONE_PX = 10;
const HORIZONTAL_BIAS = 1.25;
const TAP_MAX_DELTA = 10;
const SWIPE_THRESHOLD_MIN = 60;
const SWIPE_THRESHOLD_RATIO = 0.25;

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
  const { t } = useLang();
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [flyDir, setFlyDir] = useState<"left" | "right" | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const dragXRef = useRef(0);
  const draggingRef = useRef(false);
  /**
   * Gesture direction lock. Starts at "none" while the pointer is inside
   * the dead zone. Once the user moves past the dead zone we commit to
   * "horizontal" (and start translating the card) or "vertical" (and
   * release the gesture entirely so the page scrolls naturally).
   */
  const directionRef = useRef<"none" | "horizontal" | "vertical">("none");
  /** Container ref used to compute a responsive swipe threshold from card width. */
  const cardElRef = useRef<HTMLDivElement | null>(null);

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
    startYRef.current = e.clientY;
    dragXRef.current = 0;
    directionRef.current = "none";
    // NOTE: do NOT set isDragging(true) yet — wait until we've committed to
    // a horizontal lock, otherwise even a vertical scroll would tint the
    // card and apply a phantom rotation.
    setDragX(0);
    // setPointerCapture is deferred until horizontal lock — capturing too
    // early would prevent vertical scrolling from yielding to the browser.
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;

    const dx = e.clientX - startXRef.current;
    const dy = e.clientY - startYRef.current;

    if (directionRef.current === "none") {
      // Still inside the dead zone — wait before classifying.
      if (Math.hypot(dx, dy) < DEAD_ZONE_PX) return;

      const adx = Math.abs(dx);
      const ady = Math.abs(dy);

      if (adx > ady * HORIZONTAL_BIAS) {
        // Horizontal lock — start dragging the card. Capture the pointer
        // so a fast swipe that drifts off the card still resolves here.
        directionRef.current = "horizontal";
        setIsDragging(true);
        try {
          (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
        } catch {
          /* ignore — older browsers */
        }
      } else {
        // Vertical / ambiguous — release the gesture entirely so the page
        // can scroll natively. We won't transform the card and won't fire
        // known/unknown.
        directionRef.current = "vertical";
        draggingRef.current = false;
        return;
      }
    }

    if (directionRef.current === "horizontal") {
      dragXRef.current = dx;
      setDragX(dx);
    }
    // directionRef.current === "vertical" is handled above by releasing
    // draggingRef and short-circuiting on the next move.
  };

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    // If we never even entered the dead zone, treat it as a possible tap.
    if (!draggingRef.current && directionRef.current === "none") {
      const dx = e.clientX - startXRef.current;
      const dy = e.clientY - startYRef.current;
      if (Math.hypot(dx, dy) < TAP_MAX_DELTA) {
        setIsFlipped((p) => !p);
      }
      directionRef.current = "none";
      return;
    }

    // Vertical lock — page scrolled naturally, nothing to do on the card.
    if (directionRef.current === "vertical") {
      directionRef.current = "none";
      return;
    }

    // Horizontal release.
    draggingRef.current = false;
    setIsDragging(false);
    try {
      (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }

    const delta = dragXRef.current;
    // Responsive threshold: 25% of card width, floor at 60px.
    const cardWidth = cardElRef.current?.offsetWidth ?? 300;
    const threshold = Math.max(SWIPE_THRESHOLD_MIN, cardWidth * SWIPE_THRESHOLD_RATIO);

    if (delta > threshold) {
      setFlyDir("right");
      setTimeout(() => {
        setDragX(0); dragXRef.current = 0; setFlyDir(null); onKnown();
      }, 380);
    } else if (delta < -threshold) {
      setFlyDir("left");
      setTimeout(() => {
        setDragX(0); dragXRef.current = 0; setFlyDir(null); onMissed();
      }, 380);
    } else {
      setDragX(0);
      dragXRef.current = 0;
      if (Math.abs(delta) < TAP_MAX_DELTA) {
        // Card moved less than a few pixels — interpret as tap → flip.
        setIsFlipped((p) => !p);
      }
    }
    directionRef.current = "none";
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
          ref={cardElRef}
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
            }}>{t.vocab.swipeKnown}</div>
          )}
          {isDragging && dragX < -30 && (
            <div style={{
              position: "absolute", top: "16px", right: "16px", zIndex: 10,
              padding: "6px 14px", borderRadius: "8px", background: "var(--danger)", color: "#fff",
              fontWeight: 700, fontSize: "0.85rem", opacity: Math.min(1, (-dragX - 30) / 50),
            }}>{t.vocab.swipeReview}</div>
          )}

          {/* 3D flip scene */}
          <div className="swipe-card-scene" style={{ height: "clamp(420px, 62vh, 520px)" }}>
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
                      aria-label={isStarred ? t.vocab.removeStar : t.vocab.addStar}
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
                  <span style={{ fontSize: "0.78rem", color: "var(--ink-muted)", fontStyle: "italic" }}>
                    {t.vocab.tapToReveal}
                  </span>
                  <button
                    onClick={speak}
                    aria-label={isSpeaking ? t.vocab.playingAudio : t.vocab.playAudio}
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
                {/* Hebrew — large and centered + pronunciation */}
                <div style={{
                  flex: "0 0 auto",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  gap: "6px",
                  minHeight: 0,
                  paddingTop: "0.25rem",
                }}>
                  <span dir="rtl" style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "clamp(1.6rem, 6.5vw, 2.4rem)",
                    fontWeight: 800,
                    color: "var(--teal)",
                    lineHeight: 1.2,
                    direction: "rtl",
                    overflowWrap: "anywhere",
                  }}>
                    {item.hebrewTranslation}
                  </span>

                  {(() => {
                    const enrich = getMemoryEnrichment(item);
                    return enrich.pronunciation ? (
                      <span dir="rtl" style={{
                        fontSize: "0.82rem",
                        color: "var(--ink-muted)",
                        fontFamily: "var(--font-body)",
                        letterSpacing: "0.02em",
                      }}>
                        {enrich.pronunciation}
                      </span>
                    ) : null;
                  })()}

                  {item.englishDefinition && (
                    <p dir="ltr" style={{
                      fontSize: "0.82rem", color: "var(--ink-soft)", lineHeight: 1.45,
                      margin: 0, maxWidth: "92%", textAlign: "center",
                    }}>
                      {item.englishDefinition}
                    </p>
                  )}
                </div>

                {/* Bottom: memory hint + Hebrew context + example + tags */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingTop: "10px", borderTop: "1px solid var(--line)", minWidth: 0 }}>
                  {(() => {
                    const enrich = getMemoryEnrichment(item);
                    return (
                      <>
                        {enrich.memoryHint && (
                          <div dir="rtl" style={{
                            fontSize: "0.78rem",
                            color: "var(--ink-soft)",
                            lineHeight: 1.5,
                            padding: "8px 10px",
                            background: "rgba(13,203,177,0.06)",
                            border: "1px solid rgba(13,203,177,0.18)",
                            borderRadius: 8,
                            overflowWrap: "break-word",
                            textAlign: "right",
                          }}>
                            <span style={{ fontWeight: 700, color: "var(--teal)" }}>
                              💡 שיטה לזכור:
                            </span>{" "}
                            {enrich.memoryHint}
                          </div>
                        )}
                        {enrich.contextSentence && (
                          <p dir="rtl" style={{
                            fontSize: "0.78rem",
                            color: "var(--ink-muted)",
                            margin: 0,
                            lineHeight: 1.5,
                            textAlign: "right",
                            fontStyle: "italic",
                          }}>
                            {enrich.contextSentence}
                          </p>
                        )}
                      </>
                    );
                  })()}

                  {item.exampleSentence && (
                    <p dir="ltr" style={{
                      fontSize: "0.78rem", color: "var(--ink-muted)", fontStyle: "italic",
                      borderInlineStart: "2px solid var(--teal)", paddingInlineStart: "10px",
                      margin: 0, lineHeight: 1.45, textAlign: "left",
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
                      <span style={{ fontWeight: 700 }}>{t.vocab.trap}: </span>{item.commonTrap}
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
          aria-label={t.vocab.goBackCard}
          style={{
            flexShrink: 0, color: "var(--ink-muted)",
            opacity: canGoBack ? 1 : 0.3,
            cursor: canGoBack ? "pointer" : "default",
            transition: "opacity 0.2s",
          }}
        >
          {t.vocab.back}
        </button>
        <button className="btn btn-ghost" onClick={onMissed} style={{ flex: 1, maxWidth: "120px", color: "var(--danger)", borderColor: "var(--danger)" }}>
          {t.vocab.didntKnow}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => setIsFlipped((p) => !p)} style={{ flexShrink: 0 }}>
          {t.vocab.flipCard}
        </button>
        <button className="btn btn-primary" onClick={onKnown} style={{ flex: 1, maxWidth: "120px" }}>
          {t.vocab.knew}
        </button>
      </div>
    </div>
  );
}
