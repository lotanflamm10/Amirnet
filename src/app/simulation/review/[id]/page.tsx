"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { loadProgress } from "@/lib/progress/local-progress-store";
import type { SimulationHistory } from "@/types/progress";
import { SimulationHistoryReview } from "@/components/simulation/SimulationHistoryReview";
import { useLang } from "@/contexts/LanguageContext";

interface Params {
  id: string;
}

export default function SimulationReviewByIdPage({ params }: { params: Promise<Params> }) {
  const { id } = use(params);
  const [record, setRecord] = useState<SimulationHistory | null | undefined>(undefined);
  const { lang } = useLang();
  const isHe = lang === "he";

  useEffect(() => {
    const p = loadProgress();
    const found = p.simulationHistory.find((h) => h.id === id) ?? null;
    setRecord(found);
  }, [id]);

  if (record === undefined) {
    return (
      <div className="page-container" style={{ padding: "2rem", color: "var(--ink-muted)", textAlign: "center" }}>
        {isHe ? "טוען…" : "Loading…"}
      </div>
    );
  }

  if (record === null) {
    return (
      <div className="page-container" style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center", padding: "2rem" }}>
        <p style={{ color: "var(--ink-muted)", margin: 0 }}>
          {isHe ? "הדמיה זו לא נמצאה." : "This simulation could not be found."}
        </p>
        <Link href="/simulation" className="btn btn-ghost btn-sm">
          {isHe ? "חזור" : "Back to simulations"}
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ display: "flex", flexDirection: "column", gap: "1rem", paddingBottom: "2rem" }}>
      <SimulationHistoryReview record={record} />
    </div>
  );
}
