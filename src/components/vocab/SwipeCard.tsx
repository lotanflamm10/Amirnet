"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { VocabItem } from "@/types/vocab";
import type { VocabReviewState } from "@/lib/vocab/spaced-repetition";
import { getProgressLabel } from "@/lib/vocab/spaced-repetition";
import { useLang } from "@/contexts/LanguageContext";
import { getCardSections, partitionExamples, type CardExample } from "@/lib/vocab/card-sections";

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
 *
 * VELOCITY_TRIGGER_PX_PER_MS: a fast horizontal flick commits the swipe
 *   even if the displacement is below the threshold. Helps quick flicks
 *   feel responsive on mobile.
 */
const DEAD_ZONE_PX = 8;
const HORIZONTAL_BIAS = 1.0;
const TAP_MAX_DELTA = 8;
const SWIPE_THRESHOLD_MIN = 50;
const SWIPE_THRESHOLD_RATIO = 0.22;
const VELOCITY_TRIGGER_PX_PER_MS = 0.5;
const VELOCITY_MIN_DISPLACEMENT_PX = 32;

function ProgressBadge({ score, label, dir }: { score: number; label: string; dir: "rtl" | "ltr" }) {
  const englishKey = getProgressLabel(score);
  const colors: Record<string, string> = {
    New: "var(--ink-muted)",
    Learning: "var(--warn)",
    Strong: "var(--teal)",
    Mastered: "var(--success)",
  };
  const color = colors[englishKey];
  return (
    <span
      dir={dir}
      style={{
        display: "inline-flex", alignItems: "center", lineHeight: 1,
        fontSize: "0.7rem", fontWeight: 700, padding: "3px 8px",
        borderRadius: "99px", background: color + "22",
        color, border: `1px solid ${color}44`,
        letterSpacing: dir === "ltr" ? "0.04em" : "0",
        whiteSpace: "nowrap",
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
  const { t, lang } = useLang();
  // Hebrew/English label for the mastery badge. Always derived from the
  // English getProgressLabel() output (which is the stable canonical key)
  // and translated via the i18n table — so "חדש" appears in HE mode
  // instead of the raw "New".
  const progressKey = getProgressLabel(reviewState.masteryScore);
  const progressLabel = (
    progressKey === "New"      ? t.vocab.new
    : progressKey === "Learning" ? t.vocab.learning
    : progressKey === "Strong"   ? t.vocab.strong
    :                              t.vocab.mastered
  );
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [flyDir, setFlyDir] = useState<"left" | "right" | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  // Local expand state for the "עוד דוגמאות" / "More examples" panel on
  // the back face. A real <button> drives this (instead of <details>/
  // <summary>) so that the gesture handler's `closest("button")` guard
  // skips taps on it — otherwise tapping the toggle also flipped the card.
  const [showMore, setShowMore] = useState(false);

  /** Container ref used to compute a responsive swipe threshold from card width. */
  const cardElRef = useRef<HTMLDivElement | null>(null);

  // Hold the latest callback references so the gesture effect can read them
  // without re-attaching its native event listeners on every render.
  const onKnownRef = useRef(onKnown);
  const onMissedRef = useRef(onMissed);
  useEffect(() => { onKnownRef.current = onKnown; }, [onKnown]);
  useEffect(() => { onMissedRef.current = onMissed; }, [onMissed]);

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
    setFlyDir(null);
    setIsSpeaking(false);
    setShowMore(false);
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

  /**
   * Gesture handling — native touch + mouse listeners.
   *
   * Why native (not React's onPointerDown/Move/Up):
   *   React's synthetic touchmove listener is registered as passive on most
   *   targets, so we can't call preventDefault() from it. On iOS Safari
   *   that's fatal: as soon as the gesture has any vertical drift, the
   *   browser commits to its own scroll and fires pointercancel — the
   *   card never gets to swipe. By attaching a native touchmove listener
   *   with { passive: false }, we can call preventDefault() the moment
   *   horizontal intent is confirmed, locking the gesture to JS.
   *
   *   For vertical drags we simply never call preventDefault, so the page
   *   scrolls naturally — touch-action: pan-y on the card surface keeps
   *   the browser primed for that.
   *
   * Mouse path uses document-level mousemove/mouseup so the drag still
   * resolves even if the cursor leaves the card mid-drag — the desktop
   * analogue of pointer capture.
   */
  useEffect(() => {
    const el = cardElRef.current;
    if (!el) return;

    // Mutable gesture state held in closure (avoids React state re-renders
    // during the gesture path itself).
    let started = false;                                  // gesture started on the card (not a button)
    let active = false;                                   // gesture still owned by JS (not released to scroll)
    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let dx = 0;
    let direction: "none" | "horizontal" | "vertical" = "none";

    // Suppress the synthetic mouse events that fire after every touch
    // sequence on mobile. Without this guard a pure tap (which doesn't
    // trigger preventDefault on touchmove) would be handled BOTH by the
    // touch path AND by the mouse path — calling setIsFlipped twice and
    // visibly cancelling the flip. The window has to be long enough to
    // cover the 0–500ms tap-click delay some iOS versions still apply.
    let touchActive = false;
    let touchCleanupTimer: ReturnType<typeof setTimeout> | null = null;
    const armTouchActive = () => {
      touchActive = true;
      if (touchCleanupTimer) clearTimeout(touchCleanupTimer);
    };
    const releaseTouchActive = () => {
      if (touchCleanupTimer) clearTimeout(touchCleanupTimer);
      touchCleanupTimer = setTimeout(() => {
        touchActive = false;
        touchCleanupTimer = null;
      }, 700);
    };

    const reset = () => {
      started = false;
      active = false;
      direction = "none";
      dx = 0;
    };

    const beginGesture = (cx: number, cy: number, target: EventTarget | null): boolean => {
      // Don't hijack taps on the action buttons / star / audio.
      const targetEl = target as HTMLElement | null;
      if (targetEl && typeof targetEl.closest === "function" && targetEl.closest("button")) {
        return false;
      }
      started = true;
      active = true;
      startX = cx;
      startY = cy;
      startTime = performance.now();
      dx = 0;
      direction = "none";
      setDragX(0);
      return true;
    };

    /** Returns true when caller should preventDefault on the underlying event. */
    const updateGesture = (cx: number, cy: number): boolean => {
      if (!active) return false;
      const nx = cx - startX;
      const ny = cy - startY;

      if (direction === "none") {
        // Still inside the dead zone — wait before classifying so a tiny
        // jitter doesn't accidentally lock to a direction.
        if (Math.hypot(nx, ny) < DEAD_ZONE_PX) return false;
        if (Math.abs(nx) > Math.abs(ny) * HORIZONTAL_BIAS) {
          // Horizontal lock — JS now owns the gesture. From this point on
          // we preventDefault so iOS will not steal it as a scroll.
          direction = "horizontal";
          setIsDragging(true);
        } else {
          // Vertical / ambiguous — release the gesture so the browser can
          // scroll naturally. We never preventDefault on vertical moves.
          direction = "vertical";
          active = false;
          return false;
        }
      }

      if (direction === "horizontal") {
        dx = nx;
        setDragX(nx);
        return true;
      }
      return false;
    };

    const endGesture = (cancelled: boolean) => {
      if (!started) {
        reset();
        return;
      }

      // Browser cancelled the touch (iOS Safari scroll commit, OS gesture,
      // popup, etc). Don't fire known/missed, don't flip — just settle.
      if (cancelled) {
        setDragX(0);
        setIsDragging(false);
        setFlyDir(null);
        reset();
        return;
      }

      // Vertical lock — page scrolled naturally, nothing to do on the card.
      if (direction === "vertical") {
        reset();
        return;
      }

      // No movement past the dead zone → treat as a tap and flip the card.
      if (direction === "none") {
        if (Math.abs(dx) < TAP_MAX_DELTA) {
          setIsFlipped((p) => !p);
        }
        reset();
        return;
      }

      // Horizontal release — commit known/missed if past threshold or fast
      // enough; otherwise snap back.
      const cardWidth = el.offsetWidth || 300;
      const threshold = Math.max(SWIPE_THRESHOLD_MIN, cardWidth * SWIPE_THRESHOLD_RATIO);
      const elapsedMs = Math.max(1, performance.now() - startTime);
      const velocity = dx / elapsedMs; // signed: px / ms
      const fastFlick =
        Math.abs(velocity) >= VELOCITY_TRIGGER_PX_PER_MS &&
        Math.abs(dx) >= VELOCITY_MIN_DISPLACEMENT_PX;

      if (dx > threshold || (fastFlick && dx > 0)) {
        setFlyDir("right");
        setTimeout(() => {
          setDragX(0); setFlyDir(null); onKnownRef.current();
        }, 380);
      } else if (dx < -threshold || (fastFlick && dx < 0)) {
        setFlyDir("left");
        setTimeout(() => {
          setDragX(0); setFlyDir(null); onMissedRef.current();
        }, 380);
      } else {
        // Snap back. CSS transition on transform animates the card home.
        setDragX(0);
        // Tap that briefly crossed the dead zone but barely moved — still
        // count as a tap so a slightly-shaky finger can flip the card.
        if (Math.abs(dx) < TAP_MAX_DELTA) {
          setIsFlipped((p) => !p);
        }
      }
      setIsDragging(false);
      reset();
    };

    // ── Touch handlers ───────────────────────────────────────────
    const onTouchStart = (e: TouchEvent) => {
      armTouchActive();
      if (e.touches.length !== 1) {
        // Multi-touch (pinch etc) — abandon any in-progress gesture cleanly.
        if (started) endGesture(true);
        return;
      }
      const tt = e.touches[0];
      beginGesture(tt.clientX, tt.clientY, e.target);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!active || e.touches.length !== 1) return;
      const tt = e.touches[0];
      if (updateGesture(tt.clientX, tt.clientY)) {
        // Horizontal lock confirmed — keep iOS from claiming the gesture
        // as a vertical scroll. preventDefault works here because this
        // listener was registered with { passive: false }.
        e.preventDefault();
      }
    };

    const onTouchEnd = () => {
      endGesture(false);
      releaseTouchActive();
    };

    const onTouchCancel = () => {
      endGesture(true);
      releaseTouchActive();
    };

    // ── Mouse handlers (desktop) ─────────────────────────────────
    // Listening on document during a drag is the desktop analogue of
    // pointer capture: the gesture keeps resolving even if the cursor
    // leaves the card mid-drag.
    const onDocMouseMove = (e: MouseEvent) => {
      if (!started) return;
      if (!active) {
        // Vertical lock or released — stop listening, no transform.
        cleanupMouseListeners();
        return;
      }
      updateGesture(e.clientX, e.clientY);
    };

    const onDocMouseUp = (e: MouseEvent) => {
      cleanupMouseListeners();
      if (started) {
        // Sync dx one last time for the upstroke position.
        if (active) updateGesture(e.clientX, e.clientY);
        endGesture(false);
      }
    };

    const cleanupMouseListeners = () => {
      document.removeEventListener("mousemove", onDocMouseMove);
      document.removeEventListener("mouseup", onDocMouseUp);
    };

    const onMouseDown = (e: MouseEvent) => {
      // Ignore synthetic mouse events fired by the OS after a touch
      // sequence — they would re-trigger the gesture and double-toggle
      // the flip (visibly cancelling a tap). Real desktop mousedowns
      // happen with touchActive=false.
      if (touchActive) return;
      if (e.button !== 0) return; // only primary button
      if (beginGesture(e.clientX, e.clientY, e.target)) {
        document.addEventListener("mousemove", onDocMouseMove);
        document.addEventListener("mouseup", onDocMouseUp);
      }
    };

    // ── Wire up listeners ─────────────────────────────────────────
    // touchmove MUST be non-passive so preventDefault can lock iOS away
    // from native scroll the instant we detect horizontal intent.
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove",  onTouchMove,  { passive: false });
    el.addEventListener("touchend",   onTouchEnd,   { passive: true });
    el.addEventListener("touchcancel", onTouchCancel, { passive: true });
    el.addEventListener("mousedown",  onMouseDown);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchCancel);
      el.removeEventListener("mousedown", onMouseDown);
      cleanupMouseListeners();
      if (touchCleanupTimer) clearTimeout(touchCleanupTimer);
    };
  }, []);

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

        {/* Main swipeable card. Pointer/touch handling lives in the
            useEffect above — native listeners are required so we can
            preventDefault on touchmove the moment horizontal intent is
            confirmed (React's synthetic touchmove is passive). */}
        <div
          ref={cardElRef}
          style={{ position: "relative", zIndex: 1, ...cardStyle }}
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
                display: "flex", flexDirection: "column", padding: "18px",
              }}>
                {/* Top row: badges + status pill + star. alignItems: center
                    so the small badges and the larger star icon share a
                    visual baseline ("New" / "חדש" no longer hangs higher
                    than the star). */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                    <DifficultyBadge difficulty={item.difficulty} />
                    {item.partOfSpeech && (
                      <span dir="ltr" style={{
                        display: "inline-flex", alignItems: "center", lineHeight: 1,
                        fontSize: "0.7rem", padding: "3px 8px", borderRadius: "99px",
                        background: "var(--raised)", color: "var(--ink-soft)",
                        border: "1px solid var(--line)", whiteSpace: "nowrap",
                      }}>
                        {item.partOfSpeech}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <ProgressBadge
                      score={reviewState.masteryScore}
                      label={progressLabel}
                      dir={lang === "he" ? "rtl" : "ltr"}
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); onStar(); }}
                      aria-label={isStarred ? t.vocab.removeStar : t.vocab.addStar}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        fontSize: "1.1rem", color: isStarred ? "var(--warn)" : "var(--ink-muted)",
                        padding: "2px 4px", lineHeight: 1, display: "inline-flex", alignItems: "center",
                      }}
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
                display: "flex", flexDirection: "column", padding: "18px",
                overflowY: "auto", gap: "10px",
                // The back face is a scroll container (overflow-y: auto), so
                // iOS would otherwise interpret horizontal gestures here as
                // browser-handled. Explicit pan-y keeps vertical content
                // scroll while letting JS pointer events own horizontal
                // swipes — same axis-lock rules as the outer card.
                touchAction: "pan-y",
              }}>
                {(() => {
                  const sections = getCardSections(item);
                  const { inline: inlineExamples, extra: extraExamples } = partitionExamples(sections.examples);
                  const hasMoreExamples = extraExamples.length > 0;
                  return (
                    <>
                      {/* Hebrew translation — visually centered and the primary
                          focus of the back face. English word stays as a smaller
                          confirmation label above it. */}
                      <div style={{ textAlign: "center", paddingTop: "4px", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                        <div dir="ltr" style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "clamp(1.05rem, 4.2vw, 1.35rem)",
                          fontWeight: 700,
                          color: "var(--ink-soft)",
                          lineHeight: 1.15,
                          letterSpacing: "-0.005em",
                          overflowWrap: "anywhere",
                        }}>
                          {item.word}
                        </div>
                        <div dir="rtl" style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "clamp(1.75rem, 7vw, 2.4rem)",
                          fontWeight: 800,
                          color: "var(--teal)",
                          lineHeight: 1.2,
                          overflowWrap: "anywhere",
                          textAlign: "center",
                          maxWidth: "100%",
                        }}>
                          {item.hebrewTranslation}
                        </div>
                        {sections.pronunciation && (
                          <div dir="rtl" style={{
                            fontSize: "0.76rem",
                            color: "var(--ink-muted)",
                            letterSpacing: "0.02em",
                          }}>
                            {sections.pronunciation}
                          </div>
                        )}
                      </div>

                      {/* Divider */}
                      <div style={{ height: 1, background: "var(--line)" }} />

                      {/* Memory tip — single short block. Smaller than the
                          Hebrew translation so the translation stays the focus. */}
                      {sections.memoryTip && (
                        <div dir="rtl" style={{
                          fontSize: "0.85rem",
                          color: "var(--ink-soft)",
                          lineHeight: 1.5,
                          padding: "8px 10px",
                          background: "rgba(13,203,177,0.06)",
                          border: "1px solid rgba(13,203,177,0.18)",
                          borderRadius: 8,
                          overflowWrap: "break-word",
                          textAlign: "right",
                        }}>
                          <span style={{ fontWeight: 700, color: "var(--teal)" }}>💡 {t.vocab.memoryTip}: </span>
                          {sections.memoryTip}
                        </div>
                      )}

                      {/* Examples section — shows the inline subset under an
                          "Examples" header. The "More examples" toggle only
                          appears when real examples were stashed behind it,
                          NEVER for a recall question or memory tip. */}
                      {inlineExamples.length > 0 && (
                        <div dir={lang === "he" ? "rtl" : "ltr"} style={{
                          padding: "8px 10px",
                          borderInlineStart: "3px solid var(--teal)",
                          background: "var(--raised)",
                          borderRadius: 6,
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                        }}>
                          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--ink-muted)", letterSpacing: "0.02em", textAlign: "start" }}>
                            📝 {t.vocab.examplesHeading}
                          </span>
                          {inlineExamples.map((ex, i) => (
                            <ExampleRow key={`inline-${i}`} ex={ex} />
                          ))}
                        </div>
                      )}

                      {/* Recall question — ALWAYS its own section, never hidden
                          behind "More examples". A recall prompt is not an example. */}
                      {sections.recallQuestion && (
                        <div dir="rtl" style={{
                          padding: "8px 10px",
                          borderInlineStart: "3px solid var(--warn)",
                          background: "rgba(245,158,11,0.06)",
                          borderRadius: 6,
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                          textAlign: "right",
                        }}>
                          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--warn)", letterSpacing: "0.02em" }}>
                            ❓ {t.vocab.recallHeading}
                          </span>
                          <p dir="auto" style={{
                            fontSize: "0.82rem",
                            color: "var(--ink-soft)",
                            margin: 0,
                            lineHeight: 1.45,
                          }}>
                            {sections.recallQuestion}
                          </p>
                        </div>
                      )}

                      {/* Confusion warning — its own small note, never inside
                          the More-examples toggle. */}
                      {sections.confusion && (
                        <div dir="rtl" style={{
                          padding: "6px 10px",
                          borderRadius: 6,
                          background: "rgba(245,158,11,0.08)",
                          border: "1px solid rgba(245,158,11,0.25)",
                          fontSize: "0.76rem",
                          color: "var(--warn)",
                          lineHeight: 1.45,
                          textAlign: "right",
                          overflowWrap: "break-word",
                        }}>
                          <span dir="auto">{sections.confusion}</span>
                        </div>
                      )}

                      {/* Collocations — kept as their own pill row. Not folded
                          into "More examples" because they aren't examples. */}
                      {sections.collocations.length > 0 && (
                        <div dir="ltr" style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "4px",
                        }}>
                          {sections.collocations.slice(0, 4).map((c) => (
                            <span key={c} dir="ltr" style={{
                              fontSize: "0.72rem",
                              padding: "2px 8px",
                              borderRadius: 99,
                              background: "var(--raised)",
                              color: "var(--ink-soft)",
                              border: "1px solid var(--line)",
                              whiteSpace: "nowrap",
                            }}>
                              {c}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* "More examples" toggle — only appears when there are
                          REAL example sentences stashed behind it. stopPropagation
                          + onPointerDown/onTouchStart keep the card flip and
                          swipe gestures unaffected. */}
                      {hasMoreExamples && (
                        <div style={{ marginTop: "2px" }}>
                          <button
                            type="button"
                            aria-expanded={showMore}
                            aria-controls="vocab-card-more"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowMore((p) => !p);
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                            style={{
                              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                              width: "100%", minHeight: 44,
                              padding: "10px 14px",
                              borderRadius: 10,
                              border: "1px solid color-mix(in srgb, var(--teal) 35%, transparent)",
                              background: "color-mix(in srgb, var(--teal) 8%, var(--surface))",
                              color: "var(--teal)",
                              fontWeight: 700, fontSize: "0.82rem",
                              fontFamily: "var(--font-body)",
                              cursor: "pointer",
                              direction: lang === "he" ? "rtl" : "ltr",
                              WebkitTapHighlightColor: "transparent",
                            }}
                          >
                            <span>{showMore ? t.vocab.hideExamples : t.vocab.moreExamples}</span>
                            <span aria-hidden="true" style={{
                              display: "inline-block", transition: "transform 0.18s ease",
                              transform: showMore ? "rotate(180deg)" : "none", fontSize: "0.7rem",
                            }}>▾</span>
                          </button>
                          {showMore && (
                            <div
                              id="vocab-card-more"
                              style={{ display: "flex", flexDirection: "column", gap: "7px", paddingTop: "8px" }}
                            >
                              {extraExamples.map((ex, i) => (
                                <div key={`extra-${i}`} dir={lang === "he" ? "rtl" : "ltr"} style={{
                                  padding: "6px 10px",
                                  borderInlineStart: "2px solid var(--line)",
                                  background: "var(--raised)",
                                  borderRadius: 6,
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "2px",
                                }}>
                                  <ExampleRow ex={ex} />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/*
       * Action buttons.
       * Spatial mapping must match the keyboard shortcuts: the RIGHT arrow
       * key triggers "knew" (onKnown), so the "knew" button must sit on the
       * visual RIGHT of the row in both HE (RTL) and EN (LTR). We force
       * `dir="rtl"` on the row so the HTML order [back, knew, flip, didntKnow]
       * always renders right-to-left as: back · knew · flip · didntKnow.
       * This is a JSX reorder + a row-level dir override — no handler,
       * shortcut, swipe-gesture, SRS, or storage change.
       */}
      <div dir="rtl" style={{ display: "flex", gap: "8px", justifyContent: "center", alignItems: "center" }}>
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
        <button className="btn btn-primary" onClick={onKnown} style={{ flex: 1, maxWidth: "120px" }}>
          {t.vocab.knew}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => setIsFlipped((p) => !p)} style={{ flexShrink: 0 }}>
          {t.vocab.flipCard}
        </button>
        <button className="btn btn-ghost" onClick={onMissed} style={{ flex: 1, maxWidth: "120px", color: "var(--danger)", borderColor: "var(--danger)" }}>
          {t.vocab.didntKnow}
        </button>
      </div>
    </div>
  );
}

/**
 * Renders one example block — English sentence in LTR italic + optional
 * Hebrew gloss below it (RTL). When the entry has only Hebrew (a context
 * sentence), renders just the Hebrew line.
 */
function ExampleRow({ ex }: { ex: CardExample }) {
  return (
    <>
      {ex.en && (
        <p dir="ltr" style={{
          fontSize: "0.85rem",
          color: "var(--ink)",
          fontStyle: "italic",
          margin: 0,
          lineHeight: 1.4,
          textAlign: "left",
        }}>
          {ex.en}
        </p>
      )}
      {ex.he && (
        <p dir="rtl" style={{
          fontSize: "0.78rem",
          color: "var(--ink-soft)",
          margin: 0,
          lineHeight: 1.45,
          textAlign: "right",
        }}>
          {ex.he}
        </p>
      )}
    </>
  );
}
