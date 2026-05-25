"use client";

import Link from "next/link";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import vocabData from "@/data/seed/vocab.normalized.json";
import type { VocabItem } from "@/types/vocab";
import { withCustomItems } from "@/lib/vocab/custom-vocab-store";
import { useLang } from "@/contexts/LanguageContext";
import {
  loadChatCoachStore,
  saveChatCoachStore,
  applyHit,
  applyMiss,
} from "@/lib/vocab/chat-coach/progress-store";
import {
  selectBatch,
  getChatCoachStats,
  BATCH_SIZE,
  type ChatCoachMode,
} from "@/lib/vocab/chat-coach/select-batch";
import { gradeVocabAnswer, type GradeResult } from "@/lib/vocab/chat-coach/grade-answer";
import { getChatEnrichment } from "@/lib/vocab/chat-coach/enrichment";
import { addUnknownWord, markKnown as markKnownInUnknownStore, normalizeWordKey } from "@/lib/vocab/unknown-words-store";
import { MessagesSquare, CheckCircle2, HelpCircle, Flame, Target, ChevronDown } from "@/components/icons/NavIcons";

type Phase = "pickMode" | "start" | "answer" | "result";

interface GradedRow {
  item: VocabItem;
  userAnswer: string;
  result: GradeResult;
}

const MODES: ChatCoachMode[] = ["new10", "weak", "mixed", "activeWeak", "allFailed"];

// Same placeholder-stripping idea as src/lib/vocab/card-sections.ts.
const FORBIDDEN_LITERAL = new Set([
  "undefined", "null", "TODO", "todo", "Anchor", "עוגן", "anchor", "(תרגום לא זמין)",
]);
function cleanText(raw: string | null | undefined): string | undefined {
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  if (FORBIDDEN_LITERAL.has(trimmed)) return undefined;
  return trimmed;
}

function modeLabel(mode: ChatCoachMode, t: ReturnType<typeof useLang>["t"]): string {
  switch (mode) {
    case "new10":      return t.chatCoach.modeNew10;
    case "weak":       return t.chatCoach.modeWeak;
    case "mixed":      return t.chatCoach.modeMixed;
    case "activeWeak": return t.chatCoach.modeActiveWeak;
    case "allFailed":  return t.chatCoach.modeAllFailed;
  }
}

export default function ChatCoachPage() {
  const { t, lang } = useLang();
  const isHe = lang === "he";

  // All items (memoized — withCustomItems just appends user-added cards).
  const allItems = useMemo<VocabItem[]>(
    () => withCustomItems(vocabData as VocabItem[]),
    [],
  );

  const [phase, setPhase] = useState<Phase>("pickMode");
  const [mode, setMode] = useState<ChatCoachMode>("new10");
  const [batch, setBatch] = useState<VocabItem[]>([]);
  const [answerText, setAnswerText] = useState("");
  const [graded, setGraded] = useState<GradedRow[]>([]);
  const [stats, setStats] = useState({ knownCount: 0, weakCount: 0, everFailedCount: 0 });
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useLayoutEffect(() => {
    setStats(getChatCoachStats());
  }, [phase]);

  function handlePickMode(next: ChatCoachMode) {
    setMode(next);
    const picked = selectBatch(allItems, next);
    setBatch(picked);
    setAnswerText("");
    setGraded([]);
    setExpandedRow(null);
    setPhase(picked.length === 0 ? "pickMode" : "start");
  }

  function handleStartRound() {
    setPhase("answer");
    // Focus the textarea on next paint.
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  function handleCheckAnswers() {
    // One line per word. Trim trailing blank lines but preserve in-batch empties.
    const lines = answerText.replace(/\r\n?/g, "\n").split("\n");
    const rows: GradedRow[] = batch.map((item, idx) => {
      const raw = (lines[idx] ?? "").replace(/^\s*\d+[\.\)]\s*/u, "");
      const result = gradeVocabAnswer(item, raw);
      return { item, userAnswer: raw, result };
    });

    const store = loadChatCoachStore();
    const now = new Date().toISOString();
    for (const row of rows) {
      if (row.result.correct) {
        const { knownTransition } = applyHit(store, row.item.id, now);
        if (knownTransition) {
          markKnownInUnknownStore(normalizeWordKey(row.item.word));
        }
      } else {
        applyMiss(store, row.item.id, now);
        // Bridge to /vocab/unknown so the cross-system archive stays coherent.
        addUnknownWord({
          word: row.item.word,
          translation: row.result.expectedAnswer,
          source: "chat",
          status: "unknown",
        });
      }
    }
    saveChatCoachStore(store);

    setGraded(rows);
    setStats(getChatCoachStats());
    setPhase("result");
  }

  function handleRetryWeak() {
    const wrongs = graded.filter((g) => !g.result.correct).map((g) => g.item);
    if (wrongs.length === 0) { setPhase("pickMode"); return; }
    setBatch(wrongs);
    setAnswerText("");
    setGraded([]);
    setExpandedRow(null);
    setPhase("start");
  }

  function handleSkipReview() {
    setPhase("pickMode");
  }

  return (
    <div className="page-container animate-fade-up" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div>
        <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <MessagesSquare size={22} color="currentColor" strokeWidth={2} />
          {t.chatCoach.pageTitle}
        </h1>
        <p className="page-subtitle">{t.chatCoach.pageSubtitle}</p>
      </div>

      {/* Header stats — tiny pills, NOT a chart. */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <StatPill label={t.chatCoach.statKnown} value={stats.knownCount} accent="var(--success)" />
        <StatPill label={t.chatCoach.statWeak} value={stats.weakCount} accent="var(--warn)" />
        <StatPill label={t.chatCoach.statEverFailed} value={stats.everFailedCount} accent="var(--ink-soft)" />
      </div>

      {/* Mode chips */}
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
        {MODES.map((m) => {
          const active = mode === m && phase !== "pickMode";
          return (
            <button
              key={m}
              type="button"
              onClick={() => handlePickMode(m)}
              className="btn btn-sm"
              style={{
                border: active ? "1.5px solid var(--teal)" : "1.5px solid var(--line)",
                background: active ? "var(--teal-sub)" : "transparent",
                color: active ? "var(--teal)" : "var(--ink-soft)",
                fontWeight: 700,
              }}
            >
              {modeLabel(m, t)}
            </button>
          );
        })}
      </div>

      {phase === "pickMode" && (
        <EmptyOrIdle t={t} />
      )}

      {phase === "start" && (
        <StartPanel
          mode={mode}
          batchCount={batch.length}
          t={t}
          onStart={handleStartRound}
        />
      )}

      {phase === "answer" && (
        <AnswerPanel
          batch={batch}
          value={answerText}
          onChange={setAnswerText}
          textareaRef={textareaRef}
          onCheck={handleCheckAnswers}
          t={t}
          isHe={isHe}
        />
      )}

      {phase === "result" && (
        <ResultPanel
          graded={graded}
          stats={stats}
          expandedRow={expandedRow}
          onToggleExpand={(id) => setExpandedRow((cur) => (cur === id ? null : id))}
          onRetryWeak={handleRetryWeak}
          onSkipReview={handleSkipReview}
          t={t}
          isHe={isHe}
        />
      )}

      <p style={{ fontSize: "0.7rem", color: "var(--ink-muted)", textAlign: "center", marginTop: "0.5rem" }}>
        <Link href="/vocab" style={{ color: "var(--ink-muted)" }}>← {isHe ? "חזרה למאמן המילים" : "Back to vocab hub"}</Link>
      </p>
    </div>
  );
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

function StatPill({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "0.4rem",
      padding: "0.3rem 0.7rem", borderRadius: 999,
      background: "var(--raised)", border: "1px solid var(--line)",
      fontSize: "0.78rem", color: "var(--ink-soft)",
    }}>
      <span style={{ fontWeight: 800, color: accent, fontVariantNumeric: "tabular-nums" }}>{value}</span>
      <span>{label}</span>
    </span>
  );
}

function EmptyOrIdle({ t }: { t: ReturnType<typeof useLang>["t"] }) {
  return (
    <div className="card" style={{ padding: "1.5rem", textAlign: "center", color: "var(--ink-soft)", fontSize: "0.9rem", lineHeight: 1.6 }}>
      <MessagesSquare size={28} color="var(--ink-muted)" strokeWidth={2} style={{ marginBottom: "0.5rem" }} />
      <div style={{ color: "var(--ink)", fontWeight: 700, marginBottom: "0.25rem" }}>
        {t.chatCoach.emptyTitle}
      </div>
      <div>{t.chatCoach.emptyBody}</div>
    </div>
  );
}

function StartPanel({
  mode,
  batchCount,
  t,
  onStart,
}: {
  mode: ChatCoachMode;
  batchCount: number;
  t: ReturnType<typeof useLang>["t"];
  onStart: () => void;
}) {
  return (
    <div className="card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.1rem", margin: 0, color: "var(--ink)" }}>
        {t.chatCoach.startTitle}
      </h2>
      <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--ink-soft)", lineHeight: 1.55 }}>
        {t.chatCoach.startBody}
      </p>
      <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--ink-muted)" }}>
        {modeLabel(mode, t)} · {batchCount}/{BATCH_SIZE}
      </p>
      <button className="btn btn-primary btn-sm" onClick={onStart} style={{ alignSelf: "flex-start", marginTop: "0.25rem" }}>
        {t.chatCoach.startCta}
      </button>
    </div>
  );
}

function AnswerPanel({
  batch,
  value,
  onChange,
  textareaRef,
  onCheck,
  t,
  isHe,
}: {
  batch: VocabItem[];
  value: string;
  onChange: (v: string) => void;
  textareaRef: React.MutableRefObject<HTMLTextAreaElement | null>;
  onCheck: () => void;
  t: ReturnType<typeof useLang>["t"];
  isHe: boolean;
}) {
  return (
    <div className="card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>
        <span style={{ fontWeight: 700, color: "var(--ink)" }}>{t.chatCoach.batchPromptTitle}</span>
        <span style={{ marginInlineStart: "0.4rem" }}>{t.chatCoach.batchPromptHint}</span>
      </div>

      {/* Numbered word list — English words wrapped in <bdi> so they read LTR
          inside Hebrew flow. Use a 2-col grid on wider screens. */}
      <ol style={{
        listStyle: "none", padding: 0, margin: 0,
        display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
        gap: "0.5rem",
      }}>
        {batch.map((item, idx) => (
          <li key={item.id} style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            padding: "0.4rem 0.65rem", borderRadius: 8,
            background: "var(--raised)", border: "1px solid var(--line)",
            fontSize: "0.92rem",
          }}>
            <span style={{
              fontFamily: "var(--font-display)", fontWeight: 800,
              color: "var(--ink-muted)", minWidth: "1.5rem", textAlign: "center",
              fontVariantNumeric: "tabular-nums",
            }}>{idx + 1}.</span>
            <bdi style={{ fontWeight: 700, color: "var(--ink)" }}>{item.word}</bdi>
          </li>
        ))}
      </ol>

      <label htmlFor="chat-coach-answers" style={{ display: "none" }}>
        {isHe ? "תשובות" : "Answers"}
      </label>
      <textarea
        id="chat-coach-answers"
        ref={textareaRef}
        rows={10}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        dir="rtl"
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        placeholder={t.chatCoach.placeholderLines}
        style={{
          width: "100%",
          minHeight: "12rem",
          padding: "0.75rem 0.9rem",
          borderRadius: 8,
          border: "1px solid var(--line)",
          background: "var(--surface)",
          color: "var(--ink)",
          fontSize: "1rem", // ≥16px so iOS doesn't zoom on focus
          lineHeight: 1.7,
          fontFamily: "var(--font-body)",
          resize: "vertical",
        }}
      />

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button className="btn btn-primary btn-sm" onClick={onCheck}>
          {t.chatCoach.checkAnswers}
        </button>
      </div>
    </div>
  );
}

function recommendNextAction(
  graded: GradedRow[],
  stats: { weakCount: number; everFailedCount: number },
): keyof Pick<
  ReturnType<typeof useLang>["t"]["chatCoach"],
  "actionReviewWeakNow" | "actionTakeNew10" | "actionCritical" | "actionStopHere"
> {
  if (graded.length === 0) return "actionTakeNew10";
  const wrongs = graded.filter((g) => !g.result.correct).length;
  const correct = graded.length - wrongs;
  if (stats.weakCount >= 25) return "actionCritical";
  if (correct === graded.length) return "actionStopHere";
  if (correct < graded.length * 0.7) return "actionReviewWeakNow";
  return "actionTakeNew10";
}

function ResultPanel({
  graded,
  stats,
  expandedRow,
  onToggleExpand,
  onRetryWeak,
  onSkipReview,
  t,
  isHe,
}: {
  graded: GradedRow[];
  stats: { knownCount: number; weakCount: number; everFailedCount: number };
  expandedRow: string | null;
  onToggleExpand: (id: string) => void;
  onRetryWeak: () => void;
  onSkipReview: () => void;
  t: ReturnType<typeof useLang>["t"];
  isHe: boolean;
}) {
  const correctRows = graded.filter((g) => g.result.correct);
  const weakRows = graded.filter((g) => !g.result.correct);
  const confusionRows = weakRows.filter((g) => g.result.mistakeType === "confusion");
  const action = recommendNextAction(graded, stats);
  const hasWeak = weakRows.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Score */}
      <div className="card" style={{
        padding: "1rem 1.25rem",
        display: "flex", alignItems: "center", gap: "0.6rem",
        borderColor: correctRows.length === graded.length ? "var(--success)" : "var(--line)",
      }}>
        <Target size={20} color="var(--teal)" strokeWidth={2} />
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.1rem", color: "var(--ink)" }}>
          {t.chatCoach.scoreLine
            .replace("{n}", String(correctRows.length))
            .replace("{total}", String(graded.length))}
        </span>
      </div>

      {/* Knew section */}
      {correctRows.length > 0 && (
        <section className="card" style={{ padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <header style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--success)" }}>
            <CheckCircle2 size={16} color="currentColor" strokeWidth={2} />
            <span style={{ fontWeight: 800, fontSize: "0.92rem" }}>{t.chatCoach.sectionKnew}</span>
            <span style={{ color: "var(--ink-muted)", fontWeight: 600, fontSize: "0.82rem" }}>({correctRows.length})</span>
          </header>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            {correctRows.map((g, i) => (
              <li key={`k-${g.item.id}-${i}`} style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", fontSize: "0.88rem", color: "var(--ink-soft)" }}>
                <bdi style={{ fontWeight: 700, color: "var(--ink)" }}>{g.item.word}</bdi>
                <span dir="rtl" style={{ color: "var(--success)" }}>{g.result.expectedAnswer}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Weak section */}
      {weakRows.length > 0 && (
        <section className="card" style={{ padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          <header style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--warn)" }}>
            <Flame size={16} color="currentColor" strokeWidth={2} />
            <span style={{ fontWeight: 800, fontSize: "0.92rem" }}>{t.chatCoach.sectionWeak}</span>
            <span style={{ color: "var(--ink-muted)", fontWeight: 600, fontSize: "0.82rem" }}>({weakRows.length})</span>
          </header>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {weakRows.map((g, i) => (
              <WeakRow
                key={`w-${g.item.id}-${i}`}
                row={g}
                expanded={expandedRow === g.item.id}
                onToggle={() => onToggleExpand(g.item.id)}
                t={t}
                isHe={isHe}
              />
            ))}
          </ul>
        </section>
      )}

      {/* Confusions section */}
      {confusionRows.length > 0 && (
        <section className="card" style={{ padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem", borderColor: "var(--warn)" }}>
          <header style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--warn)" }}>
            <HelpCircle size={16} color="currentColor" strokeWidth={2} />
            <span style={{ fontWeight: 800, fontSize: "0.92rem" }}>{t.chatCoach.sectionConfusions}</span>
            <span style={{ color: "var(--ink-muted)", fontWeight: 600, fontSize: "0.82rem" }}>({confusionRows.length})</span>
          </header>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            {confusionRows.map((g, i) => (
              <li key={`c-${g.item.id}-${i}`} style={{ fontSize: "0.85rem", color: "var(--ink-soft)", lineHeight: 1.55 }}>
                <bdi style={{ fontWeight: 700, color: "var(--ink)" }}>{g.item.word}</bdi>
                <span style={{ marginInlineStart: "0.4rem", color: "var(--ink-muted)" }}>—</span>
                <span dir="auto" style={{ marginInlineStart: "0.4rem" }}>{g.result.reason}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Next-action CTA */}
      <div className="card" style={{
        padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.6rem",
        borderColor: "var(--teal)", background: "var(--teal-faint)",
      }}>
        <span style={{ fontWeight: 800, fontSize: "0.82rem", color: "var(--teal)" }}>{t.chatCoach.nextActionTitle}</span>
        <p style={{ margin: 0, color: "var(--ink)", fontSize: "0.92rem" }}>
          {t.chatCoach[action]}
        </p>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {hasWeak && (
            <button className="btn btn-primary btn-sm" onClick={onRetryWeak}>
              {t.chatCoach.retryWeak}
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={onSkipReview}>
            {t.chatCoach.skipReview}
          </button>
        </div>
      </div>
    </div>
  );
}

function WeakRow({
  row,
  expanded,
  onToggle,
  t,
  isHe,
}: {
  row: GradedRow;
  expanded: boolean;
  onToggle: () => void;
  t: ReturnType<typeof useLang>["t"];
  isHe: boolean;
}) {
  const enrich = getChatEnrichment(row.item.id);
  const memoryAnchor = cleanText(enrich?.memoryAnchor) ?? cleanText(row.item.exampleSentence);
  const commonPhrase = cleanText(enrich?.commonPhrase);
  const chipLabel = chipForConfidence(row.result.confidence, t);
  const chipColor = chipColorFor(row.result.confidence);

  return (
    <li style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem",
          width: "100%",
          background: "var(--raised)", border: "1px solid var(--line)",
          borderRadius: 8, padding: "0.55rem 0.75rem",
          textAlign: "start", cursor: "pointer", color: "var(--ink)",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0, flex: 1 }}>
          <bdi style={{ fontWeight: 700 }}>{row.item.word}</bdi>
          <span style={{
            fontSize: "0.7rem", fontWeight: 700, padding: "0.1rem 0.5rem", borderRadius: 999,
            background: `color-mix(in srgb, ${chipColor} 18%, transparent)`, color: chipColor,
            whiteSpace: "nowrap",
          }}>
            {chipLabel}
          </span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--ink-muted)", fontSize: "0.78rem" }}>
          <span>{t.chatCoach.expandRow}</span>
          <ChevronDown size={14} color="currentColor" strokeWidth={2} style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
        </span>
      </button>

      {expanded && (
        <div style={{
          padding: "0.65rem 0.85rem",
          borderInlineStart: "3px solid var(--teal)",
          background: "var(--surface)",
          borderRadius: 6,
          display: "flex", flexDirection: "column", gap: "0.35rem",
          fontSize: "0.85rem", color: "var(--ink-soft)", lineHeight: 1.6,
        }}>
          <Row label={t.chatCoach.correctAnswerLabel} accent="var(--success)">
            <span dir="rtl" style={{ fontWeight: 700, color: "var(--ink)" }}>{row.result.expectedAnswer}</span>
          </Row>
          <Row label={isHe ? "הסבר" : "Reason"}>
            <span dir="auto">{row.result.reason}</span>
          </Row>
          {memoryAnchor && (
            <Row label={t.chatCoach.memoryAnchorLabel}>
              <span dir="auto">{memoryAnchor}</span>
            </Row>
          )}
          {commonPhrase && (
            <Row label={t.chatCoach.commonPhraseLabel}>
              <bdi style={{ fontFamily: "var(--font-display)" }}>{commonPhrase}</bdi>
            </Row>
          )}
        </div>
      )}
    </li>
  );
}

function Row({ label, accent, children }: { label: string; accent?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: "0.5rem", alignItems: "baseline" }}>
      <span style={{
        fontSize: "0.7rem", fontWeight: 700, color: accent ?? "var(--ink-muted)",
        textTransform: "uppercase", letterSpacing: "0.04em", flexShrink: 0,
      }}>
        {label}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>{children}</span>
    </div>
  );
}

function chipForConfidence(c: GradeResult["confidence"], t: ReturnType<typeof useLang>["t"]): string {
  switch (c) {
    case "exact":   return t.chatCoach.chipExact;
    case "alias":   return t.chatCoach.chipAlias;
    case "partial": return t.chatCoach.chipPartial;
    case "wrong":   return t.chatCoach.chipWrong;
    case "blank":   return t.chatCoach.chipBlank;
  }
}

function chipColorFor(c: GradeResult["confidence"]): string {
  switch (c) {
    case "exact":
    case "alias":   return "var(--success)";
    case "partial": return "var(--warn)";
    case "wrong":   return "var(--danger)";
    case "blank":   return "var(--ink-muted)";
  }
}
