"use client";
import { useState } from "react";
import type { SimMode } from "@/lib/simulation/simulation-config";
import { SimulationRunner } from "@/components/simulation/SimulationRunner";

const MODES: { id: SimMode; label: string; labelEn: string; desc: string; time: string; sections: number; recommended?: boolean; experimental?: boolean }[] = [
  { id: "standard",    label: "אמירנט סטנדרטי",       labelEn: "Standard AMIRNET",       desc: "6 פרקים עיקריים — השלמת משפטים, קריאה, ניסוח מחדש. ~39 דקות, 23 שאלות. הדמיה הנאמנה ביותר למבחן האמיתי.", time: "39 דק׳", sections: 6, recommended: true },
  { id: "withWriting", label: "אמירנט עם כתיבה (7)",   labelEn: "AMIRNET + Writing Task", desc: "7 פרקים — 6 פרקים עיקריים + מטלת כתיבה ניסיונית (90–120 מילים). ~51 דקות.", time: "51 דק׳", sections: 7, experimental: true },
  { id: "withPilot",  label: "אמירנט+ פיילוט (8)",    labelEn: "AMIRNET+ with Pilot",    desc: "8 פרקים — 6 עיקריים + 2 פיילוט ניסיוני (הרצאה, שמע, דקדוק, יצירת מילה). ~49 דקות.", time: "49 דק׳", sections: 8, experimental: true },
  { id: "quick",       label: "תרגול מהיר",             labelEn: "Quick Practice",          desc: "פרקים 1, 3, 6 בלבד — השלמת משפטים וקריאה. ~20 דקות. מושלם לחימום יומי.",             time: "20 דק׳", sections: 3 },
  { id: "pilotOnly",  label: "פרקים ניסיוניים בלבד",  labelEn: "Experimental Only",       desc: "2 פרקי פיילוט בלבד, ~15 דקות. אימון ממוקד לסעיפים הניסיוניים.",                       time: "15 דק׳", sections: 2 },
];

export default function SimulationPage() {
  const [activeMode, setActiveMode] = useState<SimMode | null>(null);

  if (activeMode) {
    return (
      <div className="exam-container" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <button className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start" }}
          onClick={() => setActiveMode(null)}>
          ← חזרה
        </button>
        <SimulationRunner mode={activeMode} />
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-up" style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      <div>
        <h1 className="page-title">הדמיית אמירנט</h1>
        <p className="page-subtitle">בחר מצב הדמיה — כל הדמיה מדמה תנאי מבחן אמיתיים</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "0.875rem" }}>
        {MODES.map(({ id, label, labelEn, desc, time, sections, recommended, experimental }) => (
          <button key={id} onClick={() => setActiveMode(id)}
            className="card card-hover"
            dir="rtl"
            style={{
              padding: "1.5rem", textAlign: "right", cursor: "pointer",
              border: recommended ? "1.5px solid var(--teal)" : "1px solid var(--line)",
              background: recommended ? "linear-gradient(135deg, var(--teal-faint), var(--surface))" : "var(--surface)",
              position: "relative",
            }}
          >
            <div style={{ position: "absolute", top: "1rem", left: "1rem", display: "flex", gap: "0.35rem" }}>
              {recommended  && <span className="badge badge-teal">מומלץ</span>}
              {experimental && <span className="badge badge-warn">ניסיוני</span>}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
              <div>
                <div dir="rtl" style={{ fontWeight: 700, fontSize: "1rem", color: "var(--ink)", lineHeight: 1.3 }}>{label}</div>
                <div dir="ltr" style={{ fontSize: "0.72rem", color: "var(--ink-muted)", marginTop: "0.125rem" }}>{labelEn}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem" }}>
                <span dir="rtl" style={{ fontSize: "0.78rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: 6, background: "var(--teal-sub)", color: "var(--teal)", unicodeBidi: "embed" }}>
                  ⏱ {time}
                </span>
                <span dir="rtl" style={{ fontSize: "0.68rem", color: "var(--ink-muted)" }}>{sections} פרקים</span>
              </div>
            </div>

            <p dir="rtl" style={{ margin: "0 0 1rem", fontSize: "0.83rem", color: "var(--ink-soft)", lineHeight: 1.55, textAlign: "right", unicodeBidi: "embed" }}>{desc}</p>

            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <span style={{ fontSize: "0.82rem", color: "var(--teal)", fontWeight: 600 }}>התחל הדמיה →</span>
            </div>
          </button>
        ))}
      </div>

      <div dir="rtl" style={{ padding: "0.875rem 1rem", borderRadius: 10, background: "var(--raised)", border: "1px solid var(--line)", fontSize: "0.78rem", color: "var(--ink-muted)", lineHeight: 1.6 }}>
        ⓘ כלי הכנה עצמאי לאמירנט. לא קשור לנית. ציונים, הדמיות ותחזיות הם לא רשמיים.
      </div>
    </div>
  );
}
