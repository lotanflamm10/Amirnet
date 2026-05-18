"use client";

import { useState, useEffect, useCallback } from "react";
import type { VocabItem } from "@/types/vocab";
import {
  getOrCreateState,
  markKnown,
  markMissed,
  restoreState,
  toggleStar,
} from "@/lib/vocab/vocab-store";
import type { VocabReviewState } from "@/lib/vocab/spaced-repetition";
import SwipeCard from "./SwipeCard";

type HistoryEntry = { action: "known" | "missed"; item: VocabItem; prevState: VocabReviewState };

const SESSION_SIZE = 20;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Props {
  items: VocabItem[];
  onExit: () => void;
  onRestart: () => void;
}

export default function CustomVocabSession({ items, onExit, onRestart }: Props) {
  const [sessionItems] = useState<VocabItem[]>(() => shuffle(items).slice(0, SESSION_SIZE));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [knew, setKnew] = useState(0);
  const [missed, setMissed] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);
  const [currentState, setCurrentState] = useState<VocabReviewState | null>(null);
  const [isStarred, setIsStarred] = useState(false);
  const [actionHistory, setActionHistory] = useState<HistoryEntry[]>([]);
  const [sessionMissedItems, setSessionMissedItems] = useState<VocabItem[]>([]);

  useEffect(() => {
    if (sessionItems.length > 0) {
      const st = getOrCreateState(sessionItems[0].id);
      setCurrentState(st);
      setIsStarred(st.starred);
    }
  }, [sessionItems]);

  const currentItem = sessionItems[currentIndex] ?? null;

  const advanceTo = useCallback((nextIndex: number, sessionItemsRef: VocabItem[]) => {
    if (nextIndex >= sessionItemsRef.length) {
      setSessionDone(true);
      return;
    }
    setCurrentIndex(nextIndex);
    const s = getOrCreateState(sessionItemsRef[nextIndex].id);
    setCurrentState(s);
    setIsStarred(s.starred);
  }, []);

  const handleKnown = useCallback(() => {
    if (!currentItem) return;
    const prevState = getOrCreateState(currentItem.id);
    markKnown(currentItem.id);
    setActionHistory((h) => [...h, { action: "known", item: currentItem, prevState }]);
    setKnew((p) => p + 1);
    advanceTo(currentIndex + 1, sessionItems);
  }, [currentItem, currentIndex, sessionItems, advanceTo]);

  const handleMissed = useCallback(() => {
    if (!currentItem) return;
    const prevState = getOrCreateState(currentItem.id);
    markMissed(currentItem.id);
    setActionHistory((h) => [...h, { action: "missed", item: currentItem, prevState }]);
    setMissed((p) => p + 1);
    setSessionMissedItems((prev) =>
      prev.find((v) => v.id === currentItem.id) ? prev : [...prev, currentItem]
    );
    advanceTo(currentIndex + 1, sessionItems);
  }, [currentItem, currentIndex, sessionItems, advanceTo]);

  const handleBack = useCallback(() => {
    if (actionHistory.length === 0 || currentIndex === 0) return;
    const last = actionHistory[actionHistory.length - 1];
    setActionHistory((h) => h.slice(0, -1));
    restoreState(last.item.id, last.prevState);
    if (last.action === "known") setKnew((p) => Math.max(0, p - 1));
    else setMissed((p) => Math.max(0, p - 1));
    const prev = currentIndex - 1;
    setCurrentIndex(prev);
    const s = getOrCreateState(sessionItems[prev].id);
    setCurrentState(s);
    setIsStarred(s.starred);
  }, [actionHistory, currentIndex, sessionItems]);

  const handleStar = useCallback(() => {
    if (!currentItem) return;
    toggleStar(currentItem.id);
    setIsStarred((p) => !p);
  }, [currentItem]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (sessionDone) return;
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      if (e.code === "ArrowRight") { e.preventDefault(); handleKnown(); }
      if (e.code === "ArrowLeft")  { e.preventDefault(); handleMissed(); }
      if (e.code === "KeyS")       { e.preventDefault(); handleStar(); }
      if (e.code === "KeyZ")       { e.preventDefault(); handleBack(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sessionDone, handleKnown, handleMissed, handleStar, handleBack]);

  const totalCards = sessionItems.length;
  const progress = totalCards > 0 ? currentIndex / totalCards : 0;

  if (sessionItems.length === 0) {
    return (
      <div className="animate-fade-up" style={{ display: "flex", flexDirection: "column", gap: "14px", alignItems: "center" }}>
        <div className="card" style={{ padding: "2rem", maxWidth: "420px", width: "100%", textAlign: "center" }}>
          <p style={{ fontSize: "1rem", color: "var(--ink-soft)", marginBottom: "1rem" }}>אין מילים לתרגול</p>
          <button className="btn btn-ghost" onClick={onExit}>← חזרה לרשימה</button>
        </div>
      </div>
    );
  }

  if (sessionDone) {
    const total = knew + missed;
    const accuracy = total > 0 ? Math.round((knew / total) * 100) : 0;
    return (
      <div className="animate-fade-up" style={{ display: "flex", flexDirection: "column", gap: "14px", alignItems: "center" }}>
        <div className="card" style={{ padding: "28px 20px", maxWidth: "420px", width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "6px" }}>{accuracy >= 70 ? "🎉" : "💪"}</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 800, marginBottom: "6px" }}>סיום סבב!</h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px", marginBottom: "16px" }}>
            {[
              { label: "ידעתי",    value: knew,         color: "var(--teal)" },
              { label: "לא ידעתי", value: missed,       color: "var(--danger)" },
              { label: "דיוק",     value: `${accuracy}%`, color: accuracy >= 70 ? "var(--success)" : "var(--warn)" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: "var(--raised)", borderRadius: "8px", padding: "10px 4px", border: "1px solid var(--line)" }}>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color }}>{value}</div>
                <div style={{ fontSize: "0.65rem", color: "var(--ink-muted)", marginTop: "2px" }}>{label}</div>
              </div>
            ))}
          </div>

          {sessionMissedItems.length > 0 && (
            <div style={{
              background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "10px", padding: "12px", marginBottom: "14px",
            }}>
              <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--danger)", marginBottom: "8px" }}>
                לא ידעת ({sessionMissedItems.length})
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center" }}>
                {sessionMissedItems.map((v) => (
                  <span key={v.id} style={{
                    padding: "3px 10px", borderRadius: "99px",
                    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                    fontSize: "0.78rem",
                  }}>
                    <span dir="ltr">{v.word}</span>
                    <span style={{ color: "var(--ink-muted)", margin: "0 4px" }}>—</span>
                    {v.hebrewTranslation}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn btn-ghost" onClick={onExit} style={{ flex: 1 }}>← לרשימה</button>
            <button className="btn btn-primary" onClick={onRestart} style={{ flex: 1 }}>סבב חדש →</button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentItem || !currentState) {
    return <div style={{ textAlign: "center", padding: "48px", color: "var(--ink-muted)" }}>טוען...</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <button className="btn btn-ghost btn-sm" onClick={onExit} style={{ flexShrink: 0, fontSize: "0.75rem" }}>
          ← לרשימה
        </button>
        <div style={{ flex: 1 }}>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
        <span style={{ fontSize: "0.78rem", color: "var(--ink-muted)", whiteSpace: "nowrap" }}>{currentIndex}/{totalCards}</span>
        <span style={{ fontSize: "0.78rem", color: "var(--teal)", whiteSpace: "nowrap" }}>✓ {knew}</span>
        <span style={{ fontSize: "0.78rem", color: "var(--danger)", whiteSpace: "nowrap" }}>✗ {missed}</span>
      </div>

      <p style={{ fontSize: "0.68rem", color: "var(--ink-muted)", textAlign: "center", margin: 0 }}>
        ← לא ידעתי · Space הפוך · ידעתי → · S סימן · Z חזור
      </p>

      <SwipeCard
        key={currentItem.id + "-" + currentIndex}
        item={currentItem}
        reviewState={currentState}
        onKnown={handleKnown}
        onMissed={handleMissed}
        onStar={handleStar}
        onBack={handleBack}
        canGoBack={actionHistory.length > 0}
        isStarred={isStarred}
      />
    </div>
  );
}
