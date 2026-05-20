"use client";
import { VocabList } from "@/components/vocab/VocabList";
import { useLang } from "@/contexts/LanguageContext";

export default function VocabListPage() {
  const { t } = useLang();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, color: "var(--ink)", margin: "0 0 0.25rem" }}>
          {t.vocab.trainerTitle}
        </h1>
        <p style={{ fontSize: "0.78rem", color: "var(--ink-muted)", margin: 0 }}>
          {t.vocab.vocabDisclaimer}
        </p>
      </div>
      <VocabList initialFilter="all" />
    </div>
  );
}
