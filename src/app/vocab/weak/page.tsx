import type { Metadata } from "next";
import { VocabList } from "@/components/vocab/VocabList";

export const metadata: Metadata = { title: "Weak Words | AMIRNET" };

export default function VocabWeakPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, color: "var(--ink)", margin: "0 0 0.25rem" }}>
          מילים חלשות / Weak Words
        </h1>
        <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", margin: 0 }}>
          מילים שפספסת לעיתים קרובות — תרגל אותן שוב
        </p>
      </div>
      <VocabList initialFilter="weak" />
    </div>
  );
}
