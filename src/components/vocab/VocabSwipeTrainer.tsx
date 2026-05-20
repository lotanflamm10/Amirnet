"use client";

import { useState, useEffect, useLayoutEffect, useCallback, useRef } from "react";
import Link from "next/link";
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
import { filterByCardType, CARD_TYPE_LABELS_HE, CARD_TYPE_LABELS_EN } from "@/lib/vocab/vocab-card-type";
import type { CardType } from "@/lib/vocab/vocab-card-type";
import { getDailyVocabPool } from "@/lib/vocab/daily-vocab";
import { useLang } from "@/contexts/LanguageContext";
import type { Translations } from "@/lib/i18n/translations";

type HistoryEntry = { action: "known" | "missed"; item: VocabItem; prevState: VocabReviewState };
import SwipeCard from "./SwipeCard";
import vocabRaw from "@/data/seed/vocab.normalized.json";

const vocabData = vocabRaw as unknown as VocabItem[];
// Daily flow exposes exactly DAILY_VOCAB_LIMIT cards. Filtered sessions
// (missed / starred / weak / etc.) are allowed up to BROWSE_SESSION_SIZE.
const BROWSE_SESSION_SIZE = 20;

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

  // Default daily flow: no status / cardType / difficulty filter → return the
  // canonical 10-card daily pool, ordered by due-first then study priority.
  const isDefaultDaily =
    status === null && cardType === "all" && difficulty === "all";

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
  } else if (isDefaultDaily) {
    // Daily mode: delegate ordering + capping to the central helper.
    return spreadSimilarWords(getDailyVocabPool(allItems));
  } else {
    // Status === null but a non-default difficulty/cardType was chosen.
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

  return spreadSimilarWords(pool.slice(0, BROWSE_SESSION_SIZE));
}

const DIFFICULTY_VALUES: { value: Difficulty; color: string }[] = [
  { value: "all",    color: "var(--teal)"   },
  { value: "easy",   color: "var(--success)" },
  { value: "medium", color: "var(--warn)"   },
  { value: "hard",   color: "var(--danger)" },
];

const STATUS_VALUES: StatusFilter[] = [null, "missed", "due", "new", "starred", "weak", "mastered"];

function difficultyLabel(value: Difficulty, t: Translations): string {
  switch (value) {
    case "all":    return t.vocab.diffAll;
    case "easy":   return t.vocab.diffEasy;
    case "medium": return t.vocab.diffMedium;
    case "hard":   return t.vocab.diffHard;
  }
}

function statusLabel(value: StatusFilter, t: Translations): string {
  switch (value) {
    case null:       return t.vocab.statusDefault;
    case "missed":   return t.vocab.statusMissed;
    case "due":      return t.vocab.statusDue;
    case "new":      return t.vocab.statusNew;
    case "starred":  return t.vocab.statusStarred;
    case "weak":     return t.vocab.statusWeak;
    case "mastered": return t.vocab.statusMastered;
  }
}

export default function VocabSwipeTrainer() {
  const { t } = useLang();
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
  // `retrySource` is the ephemeral pool used by the "Practice missed words
  // from this session" flow — when non-null, the trainer keeps reusing only
  // these items instead of drawing a fresh daily pool.
  const [retrySource, setRetrySource] = useState<VocabItem[] | null>(null);
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

  function resetSessionState(items: VocabItem[]) {
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
    } else {
      setCurrentState(null);
    }
  }

  const startSession = useCallback((overrideStatus?: StatusFilter) => {
    const s = overrideStatus !== undefined ? overrideStatus : status;
    setRetrySource(null);
    resetSessionState(buildPool(difficulty, s, cardType));
  }, [difficulty, status, cardType]);

  /**
   * Re-run a focused round using ONLY the words the user missed in the
   * current session. This is intentionally scoped to the current 10-card
   * round — it does NOT pull from the global missed/weak/unknown pools.
   */
  const startSessionMissedRetry = useCallback(() => {
    if (sessionMissedItems.length === 0) return;
    const items = [...sessionMissedItems];
    setRetrySource(items);
    resetSessionState(spreadSimilarWords(items));
  }, [sessionMissedItems]);

  useLayoutEffect(() => {
    startSession();
  }, [startSession]);

  const currentItem = sessionItems[currentIndex] ?? null;

  function advanceTo(nextIndex: number) {
    if (nextIndex < 0) return;
    if (nextIndex >= sessionItems.length) {
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
    ? currentIndex / sessionItems.length
    : 0;
  const totalCards = sessionItems.length;

  // ── Session done ──
  if (sessionDone || (sessionItems.length === 0 && currentIndex === 0 && (status !== null || cardType !== "all"))) {
    const total = knew + missed;
    const accuracy = total > 0 ? Math.round((knew / total) * 100) : 0;
    let message = t.vocab.sessionMessageDefault;
    if (accuracy >= 90) message = t.vocab.sessionMessageExcellent;
    else if (accuracy >= 70) message = t.vocab.sessionMessageGood;
    else if (accuracy >= 50) message = t.vocab.sessionMessageOk;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <FilterBar difficulty={difficulty} status={status} cardType={cardType} onDifficulty={setDifficulty} onStatus={setStatus} onCardType={setCardType} t={t} />

        <div className="animate-fade-up" style={{ display: "flex", flexDirection: "column", gap: "14px", alignItems: "center" }}>
          {sessionItems.length === 0 ? (
            <div className="card" style={{ padding: "2rem", textAlign: "center", width: "100%", maxWidth: "400px" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🔍</div>
              <p style={{ fontSize: "1rem", color: "var(--ink-soft)", marginBottom: "0.5rem" }}>{t.vocab.emptyFilterTitle}</p>
              <p style={{ fontSize: "0.82rem", color: "var(--ink-muted)", marginBottom: "1rem" }}>{t.vocab.emptyFilterSubtitle}</p>
              <button className="btn btn-ghost btn-sm" onClick={() => { setCardType("all"); setStatus(null); }}>{t.vocab.clearFilter}</button>
            </div>
          ) : (
            <div className="card" style={{ padding: "28px 20px", maxWidth: "420px", width: "100%", textAlign: "center" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "6px" }}>{accuracy >= 70 ? "🎉" : "💪"}</div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 800, marginBottom: "6px" }}>
                {t.vocab.sessionDoneTitle}
              </h2>
              <p style={{ color: "var(--ink-soft)", marginBottom: "16px", fontSize: "0.88rem" }}>{message}</p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "8px", marginBottom: "16px" }}>
                {[
                  { label: t.vocab.statKnew,     value: knew, color: "var(--teal)" },
                  { label: t.vocab.statMissed,   value: missed, color: "var(--danger)" },
                  { label: t.vocab.statAccuracy, value: `${accuracy}%`, color: accuracy >= 70 ? "var(--success)" : "var(--warn)" },
                  { label: t.vocab.statMastered, value: newlyMastered, color: "var(--success)" },
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
                  textAlign: "center",
                }}>
                  <p style={{
                    fontSize: "0.85rem", fontWeight: 700, color: "var(--danger)",
                    marginBottom: "4px", textAlign: "center",
                  }}>
                    {t.vocab.sessionMissedSummary.replace("{n}", String(sessionMissedItems.length))}
                  </p>
                  <p style={{ fontSize: "0.72rem", color: "var(--ink-muted)", margin: "0 0 8px" }}>
                    {t.vocab.missedThisRound}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center" }}>
                    {sessionMissedItems.map((v) => (
                      <span key={v.id} style={{
                        padding: "3px 10px", borderRadius: "99px",
                        background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                        fontSize: "0.78rem", color: "var(--ink)",
                      }}>
                        {v.word}
                        <span style={{ color: "var(--ink-muted)", marginInlineStart: "4px", marginInlineEnd: "4px", direction: "rtl" }}>
                          {v.hebrewTranslation}
                        </span>
                      </span>
                    ))}
                  </div>
                  <button
                    className="btn btn-sm btn-block"
                    onClick={startSessionMissedRetry}
                    style={{
                      marginTop: "10px",
                      background: "var(--danger)", color: "#fff", border: "none",
                    }}
                  >
                    {t.vocab.practiceMissedCta}
                  </button>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <button className="btn btn-primary btn-block" onClick={() => startSession()}>
                  {t.vocab.newRound}
                </button>
                <Link href="/vocab/unknown" className="btn btn-ghost btn-block" style={{ textAlign: "center" }}>
                  {t.vocab.unknownBankCta}
                </Link>
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
        <FilterBar difficulty={difficulty} status={status} cardType={cardType} onDifficulty={setDifficulty} onStatus={setStatus} onCardType={setCardType} t={t} />
        <div style={{ textAlign: "center", padding: "48px", color: "var(--ink-muted)" }}>{t.vocab.loading}</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <FilterBar difficulty={difficulty} status={status} cardType={cardType} onDifficulty={setDifficulty} onStatus={setStatus} onCardType={setCardType} t={t} />

      {retrySource !== null && (
        <div
          style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            padding: "0.5rem 0.875rem", borderRadius: 999,
            background: "var(--danger-sub)", border: "1px solid var(--danger)",
            color: "var(--danger)", fontSize: "0.78rem", fontWeight: 700,
            alignSelf: "flex-start",
          }}
          aria-label={t.vocab.retryRoundLabel}
        >
          ↻ {t.vocab.retryRoundLabel}
        </div>
      )}

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
        {t.vocab.keyboardHint}
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
  difficulty, status, cardType, onDifficulty, onStatus, onCardType, t,
}: {
  difficulty: Difficulty;
  status: StatusFilter;
  cardType: CardType;
  onDifficulty: (d: Difficulty) => void;
  onStatus: (s: StatusFilter) => void;
  onCardType: (t: CardType) => void;
  t: Translations;
}) {
  const { lang } = useLang();
  const cardTypeLabels = lang === "he" ? CARD_TYPE_LABELS_HE : CARD_TYPE_LABELS_EN;
  const diffColors: Record<Difficulty, string> = {
    all: "var(--teal)", easy: "var(--success)", medium: "var(--warn)", hard: "var(--danger)",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
        {DIFFICULTY_VALUES.map(({ value }) => {
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
              {difficultyLabel(value, t)}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "2px" }}>
        {STATUS_VALUES.map((value) => {
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
              {statusLabel(value, t)}
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
              {cardTypeLabels[type]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
