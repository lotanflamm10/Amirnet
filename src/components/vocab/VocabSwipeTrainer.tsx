"use client";

import { useState, useEffect, useLayoutEffect, useCallback, useRef } from "react";
import type { VocabItem } from "@/types/vocab";
import {
  getOrCreateState,
  markKnown,
  markMissed,
  restoreState,
  toggleStar,
  getDueItems,
  getStarredItems,
  getWeakItems,
  getMissedItems,
  loadVocabStates,
} from "@/lib/vocab/vocab-store";
import type { VocabReviewState } from "@/lib/vocab/spaced-repetition";
import { recordVocabSession } from "@/lib/progress/local-progress-store";
import { withCustomItems } from "@/lib/vocab/custom-vocab-store";
import { filterByCardType, CARD_TYPE_LABELS } from "@/lib/vocab/vocab-card-type";
import type { CardType } from "@/lib/vocab/vocab-card-type";

type HistoryEntry = { action: "known" | "missed"; item: VocabItem; prevState: VocabReviewState };
import SwipeCard from "./SwipeCard";
import vocabRaw from "@/data/seed/vocab.normalized.json";

const vocabData = vocabRaw as unknown as VocabItem[];
const SESSION_SIZE = 20;

type Difficulty = "all" | "easy" | "medium" | "hard";
type StatusFilter = "due" | "starred" | "weak" | "new" | "mastered" | "missed" | null;
const CARD_TYPE_OPTIONS: CardType[] = ["all", "nouns", "verbs", "adjectives", "expressions", "connectors", "phrasalVerbs", "unclassified"];

// Returns the shared stem (first N cleaned chars) of a word for similarity check
function wordStem(word: string): string {
  return word.toLowerCase().replace(/[^a-z]/g, "").slice(0, 7);
}

// Spreads words with the same root stem so they never appear back-to-back.
// e.g. "appropriate" → "appropriately" → "appropriateness" get separated.
function spreadSimilarWords(items: VocabItem[]): VocabItem[] {
  if (items.length <= 1) return items;
  const result: VocabItem[] = [];
  const remaining = [...items];
  while (remaining.length > 0) {
    const lastStem = result.length > 0 ? wordStem(result[result.length - 1].word) : "";
    const safeIdx = remaining.findIndex((v) => wordStem(v.word) !== lastStem);
    const pick = safeIdx === -1 ? 0 : safeIdx;
    result.push(remaining.splice(pick, 1)[0]);
  }
  return result;
}

function buildPool(difficulty: Difficulty, status: StatusFilter, cardType: CardType): VocabItem[] {
  const states = loadVocabStates();
  const allItems = withCustomItems(vocabData);

  let pool = difficulty === "all"
    ? [...allItems]
    : allItems.filter((v) => v.difficulty === difficulty);

  pool = filterByCardType(pool, cardType);

  // Apply status filter to the already difficulty+cardType-filtered pool so that
  // e.g. "Due + connectors" returns due connector cards, not a global due pre-filter.
  if (status === "due") {
    pool = getDueItems(pool, pool.length);
  } else if (status === "starred") {
    pool = getStarredItems(pool);
  } else if (status === "weak") {
    pool = getWeakItems(pool);
  } else if (status === "missed") {
    pool = getMissedItems(pool);
  } else if (status === "new") {
    pool = pool.filter((v) => !states[v.id] || states[v.id].masteryScore === 0);
  } else if (status === "mastered") {
    pool = pool.filter((v) => states[v.id]?.masteryScore === 5);
  } else {
    // Sort by studyPriority desc (most AMIRNET-relevant first), then by next review date
    pool.sort((a, b) => {
      const pa = a.studyPriority ?? 5;
      const pb = b.studyPriority ?? 5;
      if (pb !== pa) return pb - pa;
      const na = states[a.id]?.nextReviewAt ? new Date(states[a.id].nextReviewAt!).getTime() : 0;
      const nb = states[b.id]?.nextReviewAt ? new Date(states[b.id].nextReviewAt!).getTime() : 0;
      return na - nb;
    });
  }

  // Shuffle non-sorted pools to add variety, then spread similar-root words
  if (status !== null) {
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
  }

  return spreadSimilarWords(pool.slice(0, SESSION_SIZE));
}

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string; color: string }[] = [
  { value: "all",    label: "הכל / All",    color: "var(--teal)" },
  { value: "easy",   label: "קל / Easy",    color: "var(--success)" },
  { value: "medium", label: "בינוני / Med", color: "var(--warn)" },
  { value: "hard",   label: "קשה / Hard",   color: "var(--danger)" },
];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: null,       label: "ברירת מחדל" },
  { value: "missed",   label: "לא ידעתי ✗" },
  { value: "due",      label: "לחזרה" },
  { value: "new",      label: "חדשות" },
  { value: "starred",  label: "מסומנים ★" },
  { value: "weak",     label: "חלשים" },
  { value: "mastered", label: "שולטים" },
];

export default function VocabSwipeTrainer() {
  const [difficulty, setDifficulty] = useState<Difficulty>("all");
  const [status, setStatus] = useState<StatusFilter>(null);
  const [cardType, setCardType] = useState<CardType>("all");
  const [sessionItems, setSessionItems] = useState<VocabItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [knew, setKnew] = useState(0);
  const [missed, setMissed] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);
  const [currentState, setCurrentState] = useState<VocabReviewState | null>(null);
  const [isStarred, setIsStarred] = useState(false);
  const [newlyMastered, setNewlyMastered] = useState(0);
  const [sessionMissedItems, setSessionMissedItems] = useState<VocabItem[]>([]);
  const [actionHistory, setActionHistory] = useState<HistoryEntry[]>([]);
  const sessionRecordedRef = useRef(false);

  // Record vocab session progress when a session finishes
  useEffect(() => {
    if (!sessionDone || sessionRecordedRef.current) return;
    const total = knew + missed;
    if (total > 0) {
      sessionRecordedRef.current = true;
      recordVocabSession(total, knew);
    }
  }, [sessionDone, knew, missed]);

  const startSession = useCallback((overrideStatus?: StatusFilter) => {
    const s = overrideStatus !== undefined ? overrideStatus : status;
    const items = buildPool(difficulty, s, cardType);
    setSessionItems(items);
    setCurrentIndex(0);
    setKnew(0);
    setMissed(0);
    setSessionDone(false);
    setNewlyMastered(0);
    setSessionMissedItems([]);
    setActionHistory([]);
    sessionRecordedRef.current = false;
    if (items.length > 0) {
      const st = getOrCreateState(items[0].id);
      setCurrentState(st);
      setIsStarred(st.starred);
    }
  }, [difficulty, status, cardType]);

  useLayoutEffect(() => {
    startSession();
  }, [startSession]);

  const currentItem = sessionItems[currentIndex] ?? null;

  function advanceTo(nextIndex: number) {
    if (nextIndex < 0) return;
    if (nextIndex >= sessionItems.length || nextIndex >= SESSION_SIZE) {
      setSessionDone(true);
      return;
    }
    setCurrentIndex(nextIndex);
    const s = getOrCreateState(sessionItems[nextIndex].id);
    setCurrentState(s);
    setIsStarred(s.starred);
  }

  const handleKnown = useCallback(() => {
    if (!currentItem) return;
    const prevState = getOrCreateState(currentItem.id);
    markKnown(currentItem.id);
    const newState = getOrCreateState(currentItem.id);
    if (prevState.masteryScore < 5 && newState.masteryScore === 5) {
      setNewlyMastered((p) => p + 1);
    }
    setActionHistory((h) => [...h, { action: "known", item: currentItem, prevState }]);
    setKnew((p) => p + 1);
    advanceTo(currentIndex + 1);
  }, [currentItem, currentIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMissed = useCallback(() => {
    if (!currentItem) return;
    const prevState = getOrCreateState(currentItem.id);
    markMissed(currentItem.id);
    setActionHistory((h) => [...h, { action: "missed", item: currentItem, prevState }]);
    setMissed((p) => p + 1);
    setSessionMissedItems((prev) =>
      prev.find((v) => v.id === currentItem.id) ? prev : [...prev, currentItem]
    );
    advanceTo(currentIndex + 1);
  }, [currentItem, currentIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBack = useCallback(() => {
    if (actionHistory.length === 0 || currentIndex === 0) return;
    const last = actionHistory[actionHistory.length - 1];
    setActionHistory((h) => h.slice(0, -1));
    restoreState(last.item.id, last.prevState);
    if (last.action === "known") setKnew((p) => Math.max(0, p - 1));
    else setMissed((p) => Math.max(0, p - 1));
    advanceTo(currentIndex - 1);
  }, [actionHistory, currentIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStar = useCallback(() => {
    if (!currentItem) return;
    toggleStar(currentItem.id);
    setIsStarred((p) => !p);
  }, [currentItem]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (sessionDone) return;
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === "ArrowRight") { e.preventDefault(); handleKnown(); }
      if (e.code === "ArrowLeft")  { e.preventDefault(); handleMissed(); }
      if (e.code === "KeyS")       { e.preventDefault(); handleStar(); }
      if (e.code === "KeyZ")       { e.preventDefault(); handleBack(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sessionDone, handleKnown, handleMissed, handleStar, handleBack]);

  const progress = sessionItems.length > 0
    ? currentIndex / Math.min(sessionItems.length, SESSION_SIZE)
    : 0;
  const totalCards = Math.min(sessionItems.length, SESSION_SIZE);

  // ── Session done ──
  if (sessionDone || (sessionItems.length === 0 && currentIndex === 0 && (status !== null || cardType !== "all"))) {
    const total = knew + missed;
    const accuracy = total > 0 ? Math.round((knew / total) * 100) : 0;
    let message = "Keep going — you're building momentum!";
    if (accuracy >= 90) message = "מצוין! אתה מתפתח בקצב מהיר! 🔥";
    else if (accuracy >= 70) message = "עבודה טובה! המשך להתקדם!";
    else if (accuracy >= 50) message = "נסיון טוב — תרגל את המילים הקשות!";

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <FilterBar difficulty={difficulty} status={status} cardType={cardType} onDifficulty={setDifficulty} onStatus={setStatus} onCardType={setCardType} />

        <div className="animate-fade-up" style={{ display: "flex", flexDirection: "column", gap: "14px", alignItems: "center" }}>
          {sessionItems.length === 0 ? (
            <div className="card" style={{ padding: "2rem", textAlign: "center", width: "100%", maxWidth: "400px" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🔍</div>
              <p style={{ fontSize: "1rem", color: "var(--ink-soft)", marginBottom: "0.5rem" }}>אין מילים בסינון זה</p>
              <p style={{ fontSize: "0.82rem", color: "var(--ink-muted)", marginBottom: "1rem" }}>נסה לשנות את הקטגוריה, הרמה או הסטטוס</p>
              <button className="btn btn-ghost btn-sm" onClick={() => { setCardType("all"); setStatus(null); }}>נקה סינון</button>
            </div>
          ) : (
            <div className="card" style={{ padding: "28px 20px", maxWidth: "420px", width: "100%", textAlign: "center" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "6px" }}>{accuracy >= 70 ? "🎉" : "💪"}</div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 800, marginBottom: "6px" }}>
                סיום סבב!
              </h2>
              <p style={{ color: "var(--ink-soft)", marginBottom: "16px", fontSize: "0.88rem" }}>{message}</p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "8px", marginBottom: "16px" }}>
                {[
                  { label: "ידעתי", value: knew, color: "var(--teal)" },
                  { label: "לא ידעתי", value: missed, color: "var(--danger)" },
                  { label: "דיוק", value: `${accuracy}%`, color: accuracy >= 70 ? "var(--success)" : "var(--warn)" },
                  { label: "שלטתי", value: newlyMastered, color: "var(--success)" },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: "var(--raised)", borderRadius: "8px", padding: "10px 4px", border: "1px solid var(--line)" }}>
                    <div style={{ fontSize: "1.2rem", fontWeight: 800, color }}>{value}</div>
                    <div style={{ fontSize: "0.65rem", color: "var(--ink-muted)", marginTop: "2px" }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Missed words from this session */}
              {sessionMissedItems.length > 0 && (
                <div style={{
                  background: "rgba(239,68,68,0.06)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: "10px",
                  padding: "12px",
                  marginBottom: "14px",
                  textAlign: "right",
                }}>
                  <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--danger)", marginBottom: "8px", textAlign: "center" }}>
                    מילים שלא ידעת בסבב זה ({sessionMissedItems.length})
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center" }}>
                    {sessionMissedItems.map((v) => (
                      <span key={v.id} style={{
                        padding: "3px 10px", borderRadius: "99px",
                        background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                        fontSize: "0.78rem", color: "var(--ink)",
                      }}>
                        {v.word}
                        <span style={{ color: "var(--ink-muted)", marginRight: "4px", marginLeft: "4px", direction: "rtl" }}>
                          {v.hebrewTranslation}
                        </span>
                      </span>
                    ))}
                  </div>
                  <button
                    className="btn btn-sm"
                    onClick={() => {
                      setStatus("missed");
                      startSession("missed");
                    }}
                    style={{
                      marginTop: "10px", width: "100%",
                      background: "var(--danger)", color: "#fff", border: "none",
                    }}
                  >
                    תרגל את המילים שלא ידעת →
                  </button>
                </div>
              )}

              <div style={{ display: "flex", gap: "8px" }}>
                <button className="btn btn-primary" onClick={() => startSession()} style={{ flex: 1 }}>
                  סבב חדש →
                </button>
                <a href="/vocab/missed" className="btn btn-ghost" style={{ flex: 1 }}>
                  כל הלא ידועות
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!currentItem || !currentState) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <FilterBar difficulty={difficulty} status={status} cardType={cardType} onDifficulty={setDifficulty} onStatus={setStatus} onCardType={setCardType} />
        <div style={{ textAlign: "center", padding: "48px", color: "var(--ink-muted)" }}>טוען...</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <FilterBar difficulty={difficulty} status={status} cardType={cardType} onDifficulty={setDifficulty} onStatus={setStatus} onCardType={setCardType} />

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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

function FilterBar({
  difficulty, status, cardType, onDifficulty, onStatus, onCardType,
}: {
  difficulty: Difficulty;
  status: StatusFilter;
  cardType: CardType;
  onDifficulty: (d: Difficulty) => void;
  onStatus: (s: StatusFilter) => void;
  onCardType: (t: CardType) => void;
}) {
  const diffColors: Record<Difficulty, string> = {
    all: "var(--teal)", easy: "var(--success)", medium: "var(--warn)", hard: "var(--danger)",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
        {DIFFICULTY_OPTIONS.map(({ value, label }) => {
          const active = difficulty === value;
          const color = diffColors[value];
          return (
            <button key={value} onClick={() => onDifficulty(value)} style={{
              padding: "0.45rem 0.25rem", borderRadius: "10px",
              fontSize: "0.75rem", fontWeight: 700, cursor: "pointer",
              border: "1.5px solid", borderColor: active ? color : "var(--line)",
              background: active ? color + "22" : "transparent",
              color: active ? color : "var(--ink-muted)",
              transition: "all 0.15s", fontFamily: "var(--font-body)",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {label}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "2px" }}>
        {STATUS_OPTIONS.map(({ value, label }) => {
          const active = status === value;
          const isMissed = value === "missed";
          return (
            <button key={String(value)} onClick={() => onStatus(value)} style={{
              padding: "3px 10px", borderRadius: "99px",
              fontSize: "0.72rem", fontWeight: 600, cursor: "pointer",
              border: "1.5px solid",
              borderColor: active ? (isMissed ? "var(--danger)" : "var(--teal)") : "var(--line)",
              background: active ? (isMissed ? "rgba(239,68,68,0.12)" : "var(--teal-sub)") : "transparent",
              color: active ? (isMissed ? "var(--danger)" : "var(--teal)") : "var(--ink-muted)",
              whiteSpace: "nowrap", flexShrink: 0,
              fontFamily: "var(--font-body)", transition: "all 0.15s",
            }}>
              {label}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "2px" }}>
        {CARD_TYPE_OPTIONS.map((type) => {
          const active = cardType === type;
          return (
            <button key={type} onClick={() => onCardType(type)} style={{
              padding: "3px 10px", borderRadius: "99px",
              fontSize: "0.72rem", fontWeight: 600, cursor: "pointer",
              border: "1.5px solid",
              borderColor: active ? "var(--info)" : "var(--line)",
              background: active ? "rgba(96,165,250,0.12)" : "transparent",
              color: active ? "var(--info)" : "var(--ink-muted)",
              whiteSpace: "nowrap", flexShrink: 0,
              fontFamily: "var(--font-body)", transition: "all 0.15s",
            }}>
              {CARD_TYPE_LABELS[type]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
