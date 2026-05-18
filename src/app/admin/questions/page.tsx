"use client";
import Link from "next/link";
import { useState } from "react";
import questionsData from "@/data/seed/questions.json";
import type { Question } from "@/types/questions";

const CATEGORIES = ["sentenceCompletion", "paraphrasing", "reading", "grammar", "wordFormation", "lectureQuestions", "textCompletion", "writingTask"];

export default function QuestionAdminPage() {
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = questionsData as Record<string, any[]>;
  const all: Question[] = Object.entries(raw).flatMap(([cat, qs]) =>
    qs.map((q) => ({ ...q, category: cat as Question["category"], choices: q.choices ?? [], correctIndex: q.answer ?? q.correctIndex ?? 0 }))
  );
  const filtered = all
    .filter((q) => filter === "all" || q.category === filter)
    .filter((q) => !search.trim() || q.text.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--warn)", background: "rgba(234,179,8,0.1)", padding: "0.15rem 0.6rem", borderRadius: "999px", border: "1px solid var(--warn)" }}>
          Admin
        </span>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 800, color: "var(--ink)", margin: 0 }}>
          ניהול שאלות / Questions
        </h1>
        <Link href="/admin" className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }}>← Admin</Link>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {["all", ...CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{
              padding: "0.25rem 0.65rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 600,
              border: "1.5px solid", cursor: "pointer",
              borderColor: filter === cat ? "var(--teal)" : "var(--line)",
              background: filter === cat ? "var(--teal-sub)" : "transparent",
              color: filter === cat ? "var(--teal)" : "var(--ink-muted)",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <input
        type="search" placeholder="חפש שאלה..." value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ padding: "0.6rem 1rem", borderRadius: "var(--radius)", border: "1.5px solid var(--line)", background: "var(--surface-raised)", color: "var(--ink)", fontSize: "0.9rem" }}
      />

      <p style={{ fontSize: "0.78rem", color: "var(--ink-muted)", margin: 0 }}>
        {filtered.length} שאלות (מתוך {all.length})
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {filtered.map((q) => (
          <div key={q.id} className="card" style={{ padding: "0.75rem 1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
              <span style={{ fontSize: "0.72rem", color: "var(--teal)", fontWeight: 700 }}>{q.category}</span>
              <span style={{ fontSize: "0.72rem", color: "var(--ink-muted)" }}>{q.difficulty}</span>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--ink)", margin: "0 0 0.25rem" }}>{q.text.slice(0, 120)}{q.text.length > 120 ? "…" : ""}</p>
            <p style={{ fontSize: "0.75rem", color: "var(--ink-muted)", margin: 0 }}>{q.choices.length} אפשרויות · תשובה: {q.choices[q.answer]?.slice(0, 40)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
