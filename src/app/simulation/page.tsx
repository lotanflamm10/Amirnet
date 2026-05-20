"use client";
import { useState } from "react";
import type { SimMode } from "@/lib/simulation/simulation-config";
import { SimulationRunner } from "@/components/simulation/SimulationRunner";
import { useLang } from "@/contexts/LanguageContext";
import type { Translations } from "@/lib/i18n/translations";

interface ModeEntry {
  id: SimMode;
  label: (t: Translations) => string;
  desc: (t: Translations) => string;
  time: string;       // raw minutes, e.g. "39"
  sections: number;
  recommended?: boolean;
  experimental?: boolean;
}

const MODES: ModeEntry[] = [
  {
    id: "standard",
    label: (t) => t.simulation.modeStandardLabel,
    desc:  (t) => t.simulation.modeStandardDesc,
    time: "39", sections: 6, recommended: true,
  },
  {
    id: "withWriting",
    label: (t) => t.simulation.modeWritingLabel,
    desc:  (t) => t.simulation.modeWritingDesc,
    time: "51", sections: 7, experimental: true,
  },
  {
    id: "withPilot",
    label: (t) => t.simulation.modePilotLabel,
    desc:  (t) => t.simulation.modePilotDesc,
    time: "49", sections: 8, experimental: true,
  },
  {
    id: "quick",
    label: (t) => t.simulation.modeQuickLabel,
    desc:  (t) => t.simulation.modeQuickDesc,
    time: "20", sections: 3,
  },
  {
    id: "pilotOnly",
    label: (t) => t.simulation.modePilotOnlyLabel,
    desc:  (t) => t.simulation.modePilotOnlyDesc,
    time: "15", sections: 2,
  },
];

export default function SimulationPage() {
  const [activeMode, setActiveMode] = useState<SimMode | null>(null);
  const { t } = useLang();

  if (activeMode) {
    return (
      <div className="exam-container" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <button className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start" }}
          onClick={() => setActiveMode(null)}>
          {t.simulation.backToList}
        </button>
        <SimulationRunner mode={activeMode} />
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-up" style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      <div>
        <h1 className="page-title">{t.simulation.title}</h1>
        <p className="page-subtitle">{t.simulation.subtitle}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "0.875rem" }}>
        {MODES.map((mode) => {
          const label = mode.label(t);
          const desc  = mode.desc(t);
          return (
            <button key={mode.id} onClick={() => setActiveMode(mode.id)}
              className="card card-hover"
              style={{
                padding: "1.5rem", textAlign: "start", cursor: "pointer",
                border: mode.recommended ? "1.5px solid var(--teal)" : "1px solid var(--line)",
                background: mode.recommended ? "linear-gradient(135deg, var(--teal-faint), var(--surface))" : "var(--surface)",
                position: "relative",
              }}
            >
              <div style={{
                position: "absolute", top: "1rem", insetInlineEnd: "1rem",
                display: "flex", gap: "0.35rem",
              }}>
                {mode.recommended  && <span className="badge badge-teal">{t.simulation.badgeRecommended}</span>}
                {mode.experimental && <span className="badge badge-warn">{t.simulation.badgeExperimental}</span>}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem", gap: "0.75rem" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--ink)", lineHeight: 1.3 }}>{label}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem", flexShrink: 0 }}>
                  <span style={{
                    fontSize: "0.78rem", fontWeight: 700, padding: "0.2rem 0.6rem",
                    borderRadius: 6, background: "var(--teal-sub)", color: "var(--teal)",
                  }}>
                    ⏱ {mode.time} {t.simulation.unitMinutes}
                  </span>
                  <span style={{ fontSize: "0.68rem", color: "var(--ink-muted)" }}>
                    {mode.sections} {t.simulation.unitSections}
                  </span>
                </div>
              </div>

              <p style={{ margin: "0 0 1rem", fontSize: "0.83rem", color: "var(--ink-soft)", lineHeight: 1.55 }}>{desc}</p>

              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <span style={{ fontSize: "0.82rem", color: "var(--teal)", fontWeight: 600 }}>{t.simulation.startSimulation}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div style={{
        padding: "0.875rem 1rem", borderRadius: 10,
        background: "var(--raised)", border: "1px solid var(--line)",
        fontSize: "0.78rem", color: "var(--ink-muted)", lineHeight: 1.6,
      }}>
        {t.simulation.disclaimerCard}
      </div>
    </div>
  );
}
