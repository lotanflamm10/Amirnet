import type { Metadata } from "next";
import { VocabList } from "@/components/vocab/VocabList";

export const metadata: Metadata = { title: "Vocab List | AMIRNET" };

export default function VocabListPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, color: "var(--ink)", margin: "0 0 0.25rem" }}>
          רשימת מילים / Vocab List
        </h1>
        <p style={{ fontSize: "0.78rem", color: "var(--ink-muted)", margin: 0 }}>
          מאגר מילים עצמאי לא רשמי. אינו קשור לרשימה הרשמית של NITE.
        </p>
      </div>
      <VocabList initialFilter="all" />
    </div>
  );
}
