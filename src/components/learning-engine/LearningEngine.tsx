"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { learningTips } from "@/data/seed/learningTips";
import { LearningTipCard } from "./LearningTipCard";
import { useLang } from "@/contexts/LanguageContext";

const LS_COMPLETED = "amirnet-learning-completed";
const LS_BOOKMARKED = "amirnet-learning-bookmarked";
const LS_LAST_IDX = "amirnet-learning-last-idx";

function loadSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveSet(key: string, set: Set<string>) {
  try {
    localStorage.setItem(key, JSON.stringify([...set]));
  } catch {}
}

function onTipViewed(_tipId: string) {}
function onTipCompleted(_tipId: string) {}
function onTipBookmarked(_tipId: string) {}

const tips = learningTips;

export function LearningEngine() {
  const { t } = useLang();
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [expandedExamples, setExpandedExamples] = useState<Set<string>>(new Set());
  const [currentIdx, setCurrentIdx] = useState(0);

  const cardRefs = useRef<Map<number, HTMLElement>>(new Map());
  const feedRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    setCompleted(loadSet(LS_COMPLETED));
    setBookmarked(loadSet(LS_BOOKMARKED));
    try {
      const idx = Number(localStorage.getItem(LS_LAST_IDX) ?? "0");
      if (idx > 0 && idx < tips.length) setCurrentIdx(idx);
    } catch {}
  }, []);

  // Restore scroll position after mount
  useEffect(() => {
    const stored = Number(localStorage.getItem(LS_LAST_IDX) ?? "0");
    if (stored > 0) {
      setTimeout(() => {
        const el = cardRefs.current.get(stored);
        if (el) el.scrollIntoView({ behavior: "auto", block: "start" });
      }, 100);
    }
  }, []);

  // IntersectionObserver
  useEffect(() => {
    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute("data-tip-idx"));
            if (!isNaN(idx)) {
              setCurrentIdx(idx);
              onTipViewed(tips[idx]?.id ?? "");
              try { localStorage.setItem(LS_LAST_IDX, String(idx)); } catch {}
            }
          }
        }
      },
      { root: feedRef.current, threshold: 0.55 }
    );
    cardRefs.current.forEach((el) => observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  const setCardRef = useCallback((index: number) => (el: HTMLElement | null) => {
    if (el) {
      el.setAttribute("data-tip-idx", String(index));
      cardRefs.current.set(index, el);
      observerRef.current?.observe(el);
    } else {
      cardRefs.current.delete(index);
    }
  }, []);

  const scrollToCard = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(idx, tips.length - 1));
    const el = cardRefs.current.get(clamped);
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }, []);

  // Keyboard
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowDown" || e.key === " ") { e.preventDefault(); scrollToCard(currentIdx + 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); scrollToCard(currentIdx - 1); }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentIdx, scrollToCard]);

  function handleComplete(tipId: string) {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(tipId)) next.delete(tipId);
      else { next.add(tipId); onTipCompleted(tipId); }
      saveSet(LS_COMPLETED, next);
      return next;
    });
  }

  function handleBookmark(tipId: string) {
    setBookmarked((prev) => {
      const next = new Set(prev);
      if (next.has(tipId)) next.delete(tipId);
      else { next.add(tipId); onTipBookmarked(tipId); }
      saveSet(LS_BOOKMARKED, next);
      return next;
    });
  }

  function handleToggleExample(tipId: string) {
    setExpandedExamples((prev) => {
      const next = new Set(prev);
      if (next.has(tipId)) next.delete(tipId);
      else next.add(tipId);
      return next;
    });
  }

  return (
    <div
      style={{
        position: "relative",
        // Full height minus mobile bottom tab bar; desktop: full height (sidebar is beside)
        height: "calc(100dvh - 58px)",
        overflow: "hidden",
      }}
    >
      {/* Pure scroll-snap feed */}
      <div
        ref={feedRef}
        role="feed"
        aria-label={t.learningEngine.tipsAria}
        style={{
          height: "100%",
          overflowY: "scroll",
          scrollSnapType: "y mandatory",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {tips.map((tip, index) => (
          <LearningTipCard
            key={tip.id}
            tip={tip}
            index={index}
            total={tips.length}
            isCompleted={completed.has(tip.id)}
            isBookmarked={bookmarked.has(tip.id)}
            isExampleExpanded={expandedExamples.has(tip.id)}
            onComplete={() => handleComplete(tip.id)}
            onBookmark={() => handleBookmark(tip.id)}
            onToggleExample={() => handleToggleExample(tip.id)}
            onNext={() => scrollToCard(index + 1)}
            onPrev={() => scrollToCard(index - 1)}
            cardRef={setCardRef(index)}
          />
        ))}
      </div>

      {/* Vertical progress dots */}
      {tips.length <= 50 && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            right: "0.5rem",
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            flexDirection: "column",
            gap: "5px",
            zIndex: 10,
            pointerEvents: "auto",
          }}
        >
          {tips.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToCard(i)}
              aria-label={t.learningEngine.tipAria.replace("{n}", String(i + 1))}
              style={{
                width: i === currentIdx ? 7 : 4,
                height: i === currentIdx ? 7 : 4,
                borderRadius: "50%",
                background: i === currentIdx ? "var(--teal)" : "var(--line)",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "all 0.2s ease",
                flexShrink: 0,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
