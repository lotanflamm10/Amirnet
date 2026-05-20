"use client";

import { useState, useRef, useEffect } from "react";
import type { Question } from "@/types/questions";
import { useLang } from "@/contexts/LanguageContext";
import type { Translations } from "@/lib/i18n/translations";

interface Props {
  question: Question;
  onTextChange?: (text: string) => void;
  initialText?: string;
  disabled?: boolean;
}

function rubricLabel(key: string, t: Translations): string {
  switch (key) {
    case "content_and_organization": return t.writingTask.rubricContentOrg;
    case "vocabulary":               return t.writingTask.rubricVocabulary;
    case "grammar_accuracy":         return t.writingTask.rubricGrammar;
    case "coherence":                return t.writingTask.rubricCoherence;
    case "task_relevance":           return t.writingTask.rubricTaskRelevance;
    default: return key;
  }
}

const TEMPLATE = `I believe that ... because ...
First, ...
In addition, ...
For example, ...
For these reasons, I think that ...`;

export function WritingTaskCard({ question, onTextChange, initialText = "", disabled = false }: Props) {
  const [text, setText]                 = useState(initialText);
  const [showTemplate, setShowTemplate] = useState(false);
  const textareaRef                     = useRef<HTMLTextAreaElement>(null);
  const { t } = useLang();

  const minWords = question.wordLimitMin ?? 90;
  const maxWords = question.wordLimitMax ?? 120;

  const wordCount = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  const tooShort  = wordCount < minWords;
  const tooLong   = wordCount > maxWords;
  const inRange   = !tooShort && !tooLong;

  const progressPercent = Math.min(100, Math.round((wordCount / maxWords) * 100));
  const barColor = inRange ? "var(--success)" : tooLong ? "var(--danger)" : "var(--teal)";

  useEffect(() => {
    onTextChange?.(text);
  }, [text, onTextChange]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    if (!disabled) setText(e.target.value);
  }

  function insertTemplate() {
    if (disabled) return;
    setText(TEMPLATE);
    setShowTemplate(false);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }

  const prompt = question.writingPrompt ?? question.text;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Prompt */}
      <div className="card" style={{
        padding: "1.25rem 1.5rem",
        background: "var(--raised)",
        border: "1.5px solid var(--teal)",
        borderRadius: 12,
      }}>
        <p style={{ margin: "0 0 0.5rem", fontSize: "0.7rem", fontWeight: 700, color: "var(--teal)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
          {t.writingTask.topicHeading}
        </p>
        <p className="ltr-content" style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "var(--ink)", lineHeight: 1.65, fontFamily: "var(--font-display)" }}>
          {prompt}
        </p>
      </div>

      {/* Instructions */}
      <div style={{
        padding: "0.75rem 1rem", borderRadius: 10,
        background: "var(--raised)", border: "1px solid var(--line)",
        fontSize: "0.8rem", color: "var(--ink-muted)", lineHeight: 1.6,
      }}>
        <strong style={{ color: "var(--ink-soft)" }}>{t.writingTask.instructionsTitle}</strong>{" "}
        {t.writingTask.instructionsBody
          .replace("{min}", String(minWords))
          .replace("{max}", String(maxWords))}
      </div>

      {/* Rubric */}
      {question.rubric && question.rubric.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.68rem", color: "var(--ink-muted)", fontWeight: 600 }}>{t.writingTask.rubricLabel}</span>
          {question.rubric.map((r) => (
            <span key={r} style={{
              fontSize: "0.68rem", padding: "0.15rem 0.5rem", borderRadius: 999,
              background: "var(--teal-sub)", color: "var(--teal)", fontWeight: 600,
            }}>
              {rubricLabel(r, t)}
            </span>
          ))}
        </div>
      )}

      {/* Template helper */}
      {!disabled && (
        <div>
          <button
            onClick={() => setShowTemplate(s => !s)}
            style={{
              background: "none", border: "1px solid var(--line)", borderRadius: 8,
              padding: "0.3rem 0.75rem", cursor: "pointer", fontSize: "0.78rem",
              color: "var(--ink-muted)", fontFamily: "var(--font-body)", transition: "all 0.15s",
            }}
          >
            {showTemplate ? t.writingTask.templateToggleHide : t.writingTask.templateToggleShow}
          </button>
          {showTemplate && (
            <div style={{
              marginTop: "0.5rem", padding: "0.75rem 1rem",
              background: "var(--raised)", border: "1px dashed var(--warn)", borderRadius: 10,
            }}>
              <p style={{ margin: "0 0 0.5rem", fontSize: "0.7rem", fontWeight: 700, color: "var(--warn)", textTransform: "uppercase" }}>
                {t.writingTask.templateHeading}
              </p>
              <pre className="ltr-content" style={{
                margin: 0, fontSize: "0.82rem", color: "var(--ink-soft)",
                lineHeight: 1.7, whiteSpace: "pre-wrap", fontFamily: "var(--font-body)",
              }}>{TEMPLATE}</pre>
              <button
                onClick={insertTemplate}
                style={{
                  marginTop: "0.5rem", background: "var(--teal)", color: "#fff",
                  border: "none", borderRadius: 8, padding: "0.3rem 0.75rem",
                  cursor: "pointer", fontSize: "0.78rem", fontFamily: "var(--font-body)",
                }}
              >
                {t.writingTask.templateInsert}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Textarea */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          disabled={disabled}
          placeholder={t.writingTask.placeholderTextarea}
          className="ltr-content"
          style={{
            width: "100%", minHeight: 180, padding: "0.875rem 1rem",
            borderRadius: 12, border: `1.5px solid ${inRange ? "var(--success)" : tooLong ? "var(--danger)" : "var(--line)"}`,
            background: "var(--surface)", color: "var(--ink)",
            fontFamily: "var(--font-display)", fontSize: "0.925rem", lineHeight: 1.75,
            resize: "vertical", outline: "none", transition: "border-color 0.2s",
            boxSizing: "border-box", direction: "ltr",
            opacity: disabled ? 0.7 : 1,
          }}
        />

        {/* Word count bar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          <div style={{
            height: 6, borderRadius: 3, background: "var(--line)", overflow: "hidden",
          }}>
            <div style={{
              height: "100%", width: `${progressPercent}%`,
              background: barColor, borderRadius: 3,
              transition: "width 0.2s, background 0.2s",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{
              fontSize: "0.82rem", fontWeight: 700,
              color: inRange ? "var(--success)" : tooLong ? "var(--danger)" : "var(--ink-muted)",
            }}>
              {wordCount} {t.writingTask.wordsLabel}
              {inRange && " ✓"}
              {tooShort && wordCount > 0 && ` — ${t.writingTask.wordsMoreNeeded.replace("{n}", String(minWords - wordCount))}`}
              {tooLong && ` — ${t.writingTask.wordsOver.replace("{n}", String(wordCount - maxWords))}`}
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--ink-muted)" }}>
              {t.writingTask.wordsRange
                .replace("{min}", String(minWords))
                .replace("{max}", String(maxWords))}
            </span>
          </div>
        </div>
      </div>

      {/* Disabled overlay message */}
      {disabled && text.trim() === "" && (
        <div style={{
          padding: "0.75rem 1rem", borderRadius: 10,
          background: "var(--raised)", border: "1px solid var(--line)",
          fontSize: "0.82rem", color: "var(--ink-muted)", textAlign: "center",
        }}>
          {t.writingTask.timeoutMessage}
        </div>
      )}
    </div>
  );
}
