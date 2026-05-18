"use client";
import { useEffect, useState } from "react";

interface Props {
  sectionNumber: number;
  sectionLabel: string;
  timeLimitSeconds: number;
  onContinue: () => void;
}

export function SectionTransition({ sectionNumber, sectionLabel, timeLimitSeconds, onContinue }: Props) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown <= 0) { onContinue(); return; }
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown, onContinue]);

  const mins = Math.round(timeLimitSeconds / 60);

  return (
    <div className="animate-fade-up" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1.5rem", padding: "3rem 1rem", textAlign: "center" }}>
      <div style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", color: "var(--teal)", textTransform: "uppercase" }}>
        סעיף {sectionNumber} / Section {sectionNumber}
      </div>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 800, color: "var(--ink)", margin: 0 }}>
        {sectionLabel}
      </h2>
      <p style={{ color: "var(--ink-soft)", fontSize: "0.95rem" }}>
        {mins} minutes · Starting in {countdown}…
      </p>
      <button className="btn btn-primary btn-lg" onClick={onContinue}>
        Start now →
      </button>
    </div>
  );
}
