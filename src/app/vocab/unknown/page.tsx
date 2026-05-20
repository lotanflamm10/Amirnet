"use client";

import UnknownWordsList from "@/components/vocab/UnknownWordsList";
import { useLang } from "@/contexts/LanguageContext";

export default function UnknownWordsPage() {
  const { t } = useLang();

  return (
    <div
      className="animate-fade-up"
      style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
    >
      <div>
        <h1 className="page-title">{t.vocab.unknownTitle}</h1>
        <p className="page-subtitle">{t.vocab.unknownSubtitle}</p>
      </div>

      <UnknownWordsList />
    </div>
  );
}
