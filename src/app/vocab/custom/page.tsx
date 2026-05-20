"use client";

import { useState, useLayoutEffect, useEffect, useRef } from "react";
import Link from "next/link";
import type { VocabItem, VocabDifficulty } from "@/types/vocab";
import {
  parseCustomList,
  entryToVocabItem,
  loadCustomRaw,
  saveCustomRaw,
  loadStructuredCards,
  addStructuredCard,
  deleteStructuredCard,
  structuredCardToVocabItem,
} from "@/lib/vocab/custom-vocab-store";
import type { StructuredCard } from "@/lib/vocab/custom-vocab-store";
import CustomVocabSession from "@/components/vocab/CustomVocabSession";
import { useLang } from "@/contexts/LanguageContext";

const PLACEHOLDER = "apple = תפוח\nconsequently = כתוצאה מכך\nhowever = אולם, לעומת זאת\npersist = להתמיד";

const CARD_TYPE_OPTIONS = ["", "noun", "verb", "adjective", "adverb", "expression", "connector", "phrasal verb"];
const DIFFICULTY_OPTIONS: VocabDifficulty[] = ["easy", "medium", "hard"];

type Tab = "bulk" | "card" | "list";

export default function CustomVocabPage() {
  const [rawText, setRawText] = useState("");
  const [parsedItems, setParsedItems] = useState<VocabItem[]>([]);
  const [skippedCount, setSkippedCount] = useState(0);
  const [mode, setMode] = useState<"edit" | "practice">("edit");
  const [sessionKey, setSessionKey] = useState(0);
  const [tab, setTab] = useState<Tab>("bulk");
  const { t } = useLang();

  // Structured cards state
  const [structuredCards, setStructuredCards] = useState<StructuredCard[]>([]);
  const [form, setForm] = useState({
    word: "",
    translation: "",
    cardType: "",
    difficulty: "medium" as VocabDifficulty,
    exampleSentence: "",
    notes: "",
  });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [sessionItems, setSessionItems] = useState<VocabItem[]>([]);

  useEffect(() => () => { if (successTimerRef.current) clearTimeout(successTimerRef.current); }, []);

  useLayoutEffect(() => {
    const tabParam = new URLSearchParams(window.location.search).get("tab") as Tab | null;
    if (tabParam === "card" || tabParam === "list" || tabParam === "bulk") {
      setTab(tabParam);
    }

    const saved = loadCustomRaw();
    setRawText(saved);
    if (saved.trim()) {
      const { entries, skipped } = parseCustomList(saved);
      setParsedItems(entries.map(entryToVocabItem));
      setSkippedCount(skipped);
    }
    setStructuredCards(loadStructuredCards());
  }, []);

  function handleTextChange(val: string) {
    setRawText(val);
    saveCustomRaw(val);
    const { entries, skipped } = parseCustomList(val);
    setParsedItems(entries.map(entryToVocabItem));
    setSkippedCount(skipped);
  }

  function buildAllItems(): VocabItem[] {
    return [
      ...parsedItems,
      ...structuredCards.map(structuredCardToVocabItem),
    ];
  }

  function handleStart() {
    const all = buildAllItems();
    setSessionItems(all);
    setSessionKey((k) => k + 1);
    setMode("practice");
  }

  function handleRestart() {
    setSessionKey((k) => k + 1);
  }

  function handleFormSubmit() {
    if (!form.word.trim() || !form.translation.trim()) {
      setFormError(t.vocab.customWordRequired);
      return;
    }
    setFormError("");
    addStructuredCard({
      word: form.word.trim(),
      translation: form.translation.trim(),
      cardType: form.cardType || undefined,
      difficulty: form.difficulty,
      exampleSentence: form.exampleSentence.trim() || undefined,
      notes: form.notes.trim() || undefined,
    });
    const updated = loadStructuredCards();
    setStructuredCards(updated);
    setForm({ word: "", translation: "", cardType: "", difficulty: "medium", exampleSentence: "", notes: "" });
    setFormSuccess(true);
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    successTimerRef.current = setTimeout(() => setFormSuccess(false), 2000);
  }

  function handleDelete(id: string) {
    deleteStructuredCard(id);
    setStructuredCards(loadStructuredCards());
  }

  if (mode === "practice") {
    return (
      <CustomVocabSession
        key={sessionKey}
        items={sessionItems}
        onExit={() => setMode("edit")}
        onRestart={handleRestart}
      />
    );
  }

  const allCount = parsedItems.length + structuredCards.length;

  return (
    <div className="animate-fade-up" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div>
        <Link href="/vocab" style={{
          fontSize: "0.8rem", color: "var(--ink-muted)", textDecoration: "none",
          display: "inline-flex", alignItems: "center", gap: "0.25rem", marginBottom: "0.5rem",
        }}>
          {t.vocab.backToVocab}
        </Link>
        <h1 className="page-title">{t.vocab.customPageTitle}</h1>
        <p className="page-subtitle">{t.vocab.customPageSubtitle}</p>
      </div>

      {/* Tab nav */}
      <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--line)", paddingBottom: "0.5rem" }}>
        {([
          { key: "bulk" as Tab, label: t.vocab.customTabBulk },
          { key: "card" as Tab, label: t.vocab.customTabCard },
          { key: "list" as Tab, label: `${t.vocab.customTabMy} (${structuredCards.length})` },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: "0.4rem 1rem",
              borderRadius: "var(--radius-btn)",
              fontSize: "0.85rem",
              fontWeight: 600,
              border: "1.5px solid",
              borderColor: tab === key ? "var(--teal)" : "var(--line)",
              background: tab === key ? "var(--teal-sub)" : "transparent",
              color: tab === key ? "var(--teal)" : "var(--ink-muted)",
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Bulk import */}
      {tab === "bulk" && (
        <>
          <div className="card" style={{ padding: "1rem 1.25rem", background: "var(--teal-faint)", borderColor: "var(--teal)" }}>
            <p style={{ margin: "0 0 0.4rem", fontSize: "0.82rem", fontWeight: 700, color: "var(--teal)" }}>
              {t.vocab.customFormatHint}
            </p>
            <pre style={{
              margin: 0, fontSize: "0.8rem", color: "var(--ink-soft)", lineHeight: 1.7,
              fontFamily: "var(--font-mono, monospace)", direction: "ltr", textAlign: "left",
              whiteSpace: "pre-wrap",
            }}>
              {PLACEHOLDER}
            </pre>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--ink-soft)", marginBottom: "0.4rem" }}>
              {t.vocab.customBulkLineFormat}
            </label>
            <textarea
              value={rawText}
              onChange={(e) => handleTextChange(e.target.value)}
              rows={10}
              placeholder={PLACEHOLDER}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "var(--radius)",
                border: "1.5px solid var(--line)",
                background: "var(--surface-raised)",
                color: "var(--ink)",
                fontSize: "0.9rem",
                lineHeight: 1.8,
                fontFamily: "var(--font-mono, monospace)",
                resize: "vertical",
                boxSizing: "border-box",
                direction: "ltr",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center", minHeight: "1.2rem" }}>
            {parsedItems.length > 0 && (
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--success)" }}>
                {t.vocab.customReadyCount.replace("{n}", String(parsedItems.length))}
              </span>
            )}
            {skippedCount > 0 && (
              <span style={{ fontSize: "0.78rem", color: "var(--warn)" }}>
                {t.vocab.customSkippedCount.replace("{n}", String(skippedCount))}
              </span>
            )}
            {rawText.trim() && parsedItems.length === 0 && skippedCount === 0 && (
              <span style={{ fontSize: "0.78rem", color: "var(--ink-muted)" }}>
                {t.vocab.customWriteHere}
              </span>
            )}
          </div>

          {parsedItems.length > 0 && (
            <div>
              <p style={{
                fontSize: "0.72rem", fontWeight: 700, color: "var(--ink-muted)",
                textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem",
              }}>
                {t.vocab.customPreview}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {parsedItems.slice(0, 30).map((item) => (
                  <span key={item.id} style={{
                    padding: "4px 10px", borderRadius: "99px",
                    background: "var(--raised)", border: "1px solid var(--line)",
                    fontSize: "0.78rem", color: "var(--ink)",
                  }}>
                    <span dir="ltr">{item.word}</span>
                    <span style={{ color: "var(--ink-muted)", margin: "0 4px" }}>=</span>
                    {item.hebrewTranslation}
                  </span>
                ))}
                {parsedItems.length > 30 && (
                  <span style={{ padding: "4px 10px", fontSize: "0.78rem", color: "var(--ink-muted)" }}>
                    {t.vocab.customMore.replace("{n}", String(parsedItems.length - 30))}
                  </span>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Tab: Add card (structured form) */}
      {tab === "card" && (
        <div className="card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--ink)", margin: 0, fontSize: "1rem" }}>
            {t.vocab.customAddNew}
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={labelStyle}>{t.vocab.customWordLabel} *</label>
              <input
                dir="ltr"
                value={form.word}
                onChange={(e) => setForm({ ...form, word: e.target.value })}
                placeholder="e.g. perseverance"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>{t.vocab.customTranslationLabel} *</label>
              <input
                dir="rtl"
                value={form.translation}
                onChange={(e) => setForm({ ...form, translation: e.target.value })}
                placeholder={t.vocab.customTranslationPlaceholder}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={labelStyle}>{t.vocab.customTypeLabel}</label>
              <select
                value={form.cardType}
                onChange={(e) => setForm({ ...form, cardType: e.target.value })}
                style={{ ...inputStyle, direction: "ltr" }}
              >
                {CARD_TYPE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt || t.vocab.customTypePickPlaceholder}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{t.vocab.customDifficultyLabel}</label>
              <select
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value as VocabDifficulty })}
                style={{ ...inputStyle, direction: "ltr" }}
              >
                {DIFFICULTY_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>{t.vocab.customExampleLabel}</label>
            <input
              dir="ltr"
              value={form.exampleSentence}
              onChange={(e) => setForm({ ...form, exampleSentence: e.target.value })}
              placeholder="Her perseverance paid off in the end."
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>{t.vocab.customNotesLabel}</label>
            <input
              dir="rtl"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder={t.vocab.customNotesPlaceholder}
              style={inputStyle}
            />
          </div>

          {formError && (
            <p style={{ fontSize: "0.8rem", color: "var(--danger)", margin: 0 }}>{formError}</p>
          )}
          {formSuccess && (
            <p style={{ fontSize: "0.8rem", color: "var(--success)", margin: 0 }}>{t.vocab.customCardAdded}</p>
          )}

          <button className="btn btn-primary" onClick={handleFormSubmit}>
            {t.vocab.customAddCardCta}
          </button>
        </div>
      )}

      {/* Tab: My cards list */}
      {tab === "list" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {structuredCards.length === 0 ? (
            <div className="card" style={{ padding: "2rem", textAlign: "center" }}>
              <p style={{ color: "var(--ink-soft)", marginBottom: "0.75rem" }}>{t.vocab.customNoCardsYet}</p>
              <button className="btn btn-ghost btn-sm" onClick={() => setTab("card")}>{t.vocab.customAddFirstCard}</button>
            </div>
          ) : (
            structuredCards.map((card) => (
              <div key={card.id} className="card" style={{ padding: "0.75rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem" }}>
                <div>
                  <span style={{ fontWeight: 700, color: "var(--ink)", fontSize: "0.95rem", direction: "ltr", display: "block" }}>{card.word}</span>
                  <span style={{ fontSize: "0.85rem", color: "var(--teal)", direction: "rtl", display: "block" }}>{card.translation}</span>
                  {card.cardType && <span style={{ fontSize: "0.7rem", color: "var(--ink-muted)" }}>{card.cardType} · {card.difficulty}</span>}
                </div>
                <button
                  onClick={() => handleDelete(card.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)", fontSize: "1rem", flexShrink: 0, padding: "0.25rem" }}
                  title={t.vocab.customDeleteCard}
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Start practice button */}
      <div style={{ display: "flex", gap: "0.75rem", paddingTop: "0.25rem" }}>
        <button
          className="btn btn-primary btn-lg"
          onClick={handleStart}
          disabled={allCount === 0}
          style={{ flex: 1 }}
        >
          {t.vocab.customStartPractice}
          {allCount > 0 && ` (${t.vocab.customWordsCount.replace("{n}", String(allCount))})`} →
        </button>
        {rawText.trim() && (
          <button
            className="btn btn-ghost btn-lg"
            onClick={() => handleTextChange("")}
            style={{ flexShrink: 0 }}
          >
            {t.vocab.customClearImport}
          </button>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.55rem 0.875rem",
  borderRadius: "var(--radius-sm)",
  border: "1.5px solid var(--line)",
  background: "var(--surface-raised)",
  color: "var(--ink)",
  fontSize: "0.875rem",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.75rem",
  fontWeight: 600,
  color: "var(--ink-muted)",
  marginBottom: "0.3rem",
};
