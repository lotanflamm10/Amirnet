import type { Metadata } from "next";
import { MissedWordsList } from "@/components/vocab/MissedWordsList";

export const metadata: Metadata = { title: "מילים שלא ידעתי | AMIRNET" };

export default function VocabMissedPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, color: "var(--ink)", margin: "0 0 0.25rem" }}>
          לא ידעתי / Missed Words
        </h1>
        <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", margin: 0 }}>
          כל המילים שסימנת &quot;לא ידעתי&quot; — ממוינות לפי תדירות פספוסים
        </p>
      </div>
      <MissedWordsList />
    </div>
  );
}
