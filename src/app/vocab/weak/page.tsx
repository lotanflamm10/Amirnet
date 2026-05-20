"use client";
import { VocabList } from "@/components/vocab/VocabList";
import { useLang } from "@/contexts/LanguageContext";

export default function VocabWeakPage() {
  const { t } = useLang();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, color: "var(--ink)", margin: "0 0 0.25rem" }}>
          {t.vocab.weakPageTitle}
        </h1>
        <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", margin: 0 }}>
          {t.vocab.weakPageSubtitle}
        </p>
      </div>
      <VocabList initialFilter="weak" />
    </div>
  );
}
