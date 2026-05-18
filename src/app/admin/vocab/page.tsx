"use client";
import Link from "next/link";
import { useState } from "react";
import vocabData from "@/data/seed/vocab.normalized.json";
import type { VocabItem } from "@/types/vocab";

export default function VocabAdminPage() {
  const [search, setSearch] = useState("");
  const [filterReview, setFilterReview] = useState(false);

  const all = vocabData as VocabItem[];
  const filtered = all
    .filter((v) => !filterReview || v.needsReview)
    .filter((v) => !search.trim() || v.word.toLowerCase().includes(search.toLowerCase()) || v.hebrewTranslation.includes(search))
    .slice(0, 150);

  const needsReviewCount = all.filter((v) => v.needsReview).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--warn)", background: "rgba(234,179,8,0.1)", padding: "0.15rem 0.6rem", borderRadius: "999px", border: "1px solid var(--warn)" }}>
          Admin
        </span>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 800, color: "var(--ink)", margin: 0 }}>
          ניהול מילים / Vocab
        </h1>
        <Link href="/admin" className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }}>← Admin</Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.5rem" }}>
        {[
          { label: "סה״כ / Total", value: all.length, color: "var(--teal)" },
          { label: "לבדיקה / Needs Review", value: needsReviewCount, color: "var(--warn)" },
          { label: "מקור משתמש", value: all.filter((v) => v.source === "user_psychometric_vocab_file").length, color: "var(--ink-muted)" },
        ].map(({ label, value, color }) => (
          <div key={label} className="card" style={{ padding: "0.65rem", textAlign: "center" }}>
            <p style={{ fontSize: "0.65rem", color: "var(--ink-muted)", margin: "0 0 0.15rem", textTransform: "uppercase" }}>{label}</p>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.2rem", color, margin: 0 }}>{value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
        <input
          type="search" placeholder="חפש מילה..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, padding: "0.6rem 1rem", borderRadius: "var(--radius)", border: "1.5px solid var(--line)", background: "var(--surface-raised)", color: "var(--ink)", fontSize: "0.9rem" }}
        />
        <button
          onClick={() => setFilterReview(!filterReview)}
          style={{
            padding: "0.5rem 0.75rem", borderRadius: "var(--radius)", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
            border: "1.5px solid", borderColor: filterReview ? "var(--warn)" : "var(--line)",
            background: filterReview ? "rgba(234,179,8,0.1)" : "transparent",
            color: filterReview ? "var(--warn)" : "var(--ink-muted)", whiteSpace: "nowrap",
          }}
        >
          {filterReview ? "★ לבדיקה" : "הצג לבדיקה"}
        </button>
      </div>

      <p style={{ fontSize: "0.78rem", color: "var(--ink-muted)", margin: 0 }}>
        מציג {filtered.length} מתוך {all.length}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        {filtered.map((v) => (
          <div key={v.id} className="card" style={{ padding: "0.65rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "baseline" }}>
                <span style={{ fontWeight: 700, color: "var(--ink)", fontSize: "0.95rem" }}>{v.word}</span>
                <span style={{ fontSize: "0.7rem", color: "var(--ink-muted)", textTransform: "uppercase" }}>{v.partOfSpeech}</span>
                <span style={{ fontSize: "0.7rem", color: "var(--ink-muted)" }}>{v.difficulty}</span>
                {v.needsReview && (
                  <span style={{ fontSize: "0.65rem", color: "var(--warn)", background: "rgba(234,179,8,0.1)", padding: "0.1rem 0.4rem", borderRadius: "999px" }}>review</span>
                )}
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--teal)", margin: "0.1rem 0 0", direction: "rtl", textAlign: "right" }}>{v.hebrewTranslation}</p>
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--ink-muted)", textAlign: "right", flexShrink: 0 }}>
              {v.category}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
