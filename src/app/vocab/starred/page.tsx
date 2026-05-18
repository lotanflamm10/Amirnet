import type { Metadata } from "next";
import { VocabList } from "@/components/vocab/VocabList";

export const metadata: Metadata = { title: "Starred Vocab | AMIRNET" };

export default function VocabStarredPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, color: "var(--ink)", margin: "0 0 0.25rem" }}>
          מסומנים ★ / Starred
        </h1>
        <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", margin: 0 }}>
          מילים שסימנת לחזרה מיוחדת
        </p>
      </div>
      <VocabList initialFilter="starred" />
    </div>
  );
}
