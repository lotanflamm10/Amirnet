"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { learningTips } from "@/data/seed/learningTips";
import { LearningTipCard } from "./LearningTipCard";
import { useLang } from "@/contexts/LanguageContext";

import { userKey, safeGetItem, safeSetItem } from "@/lib/storage/user-storage";

const LEGACY_COMPLETED = "amirnet-learning-completed";
const LEGACY_BOOKMARKED = "amirnet-learning-bookmarked";
const LEGACY_LAST_IDX = "amirnet-learning-last-idx";
const completedK = () => userKey(LEGACY_COMPLETED);
const bookmarkedK = () => userKey(LEGACY_BOOKMARKED);
const lastIdxK = () => userKey(LEGACY_LAST_IDX);

function loadSet(key: string): Set<string> {
  const raw = safeGetItem(key);
  if (!raw) return new Set();
  try {
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveSet(key: string, set: Set<string>) {
  safeSetItem(key, JSON.stringify([...set]));
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
    setCompleted(loadSet(completedK()));
    setBookmarked(loadSet(bookmarkedK()));
    const idx = Number(safeGetItem(lastIdxK()) ?? "0");
    if (idx > 0 && idx < tips.length) setCurrentIdx(idx);
  }, []);

  // Restore scroll position after mount
  useEffect(() => {
    const stored = Number(safeGetItem(lastIdxK()) ?? "0");
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
              safeSetItem(lastIdxK(), String(idx));
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
      saveSet(completedK(), next);
      return next;
    });
  }

  function handleBookmark(tipId: string) {
    setBookmarked((prev) => {
      const next = new Set(prev);
      if (next.has(tipId)) next.delete(tipId);
      else { next.add(tipId); onTipBookmarked(tipId); }
      saveSet(bookmarkedK(), next);
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
        // Account for the fixed mobile bottom tab bar + iPhone home indicator
        // safe-area inset + a small breathing margin so the last card's
        // action button is never hidden behind the nav.
        height:
          "calc(100dvh - var(--mobile-tabbar-height, 56px) - env(safe-area-inset-bottom, 0px) - 12px)",
        overflow: "hidden",
        maxWidth: "100%",
        minWidth: 0,
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
