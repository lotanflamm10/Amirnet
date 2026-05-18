"use client";
import { useEffect, useState } from "react";

interface Props {
  totalSeconds: number;
  onExpire: () => void;
}

function fmt(s: number) {
  const m = Math.floor(s / 60), sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function SimulationTimer({ totalSeconds, onExpire }: Props) {
  const [remaining, setRemaining] = useState(totalSeconds);

  useEffect(() => {
    setRemaining(totalSeconds);
  }, [totalSeconds]);

  useEffect(() => {
    if (remaining <= 0) { onExpire(); return; }
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining, onExpire]);

  const pct = remaining / totalSeconds;
  const isWarn = pct < 0.25;
  const isDanger = remaining <= 30;

  const color = isDanger ? "var(--danger)" : isWarn ? "var(--warn)" : "var(--teal)";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: "1.1rem",
          color,
          minWidth: "4ch",
          textAlign: "right",
        }}
        className={isDanger ? "animate-pulse-timer" : ""}
      >
        {fmt(remaining)}
      </span>
      <div className="progress-track" style={{ width: 80, flexShrink: 0 }}>
        <div
          className={`progress-fill${isWarn ? " warn" : ""}${isDanger ? " danger" : ""}`}
          style={{ width: `${Math.max(0, pct * 100)}%` }}
        />
      </div>
    </div>
  );
}
