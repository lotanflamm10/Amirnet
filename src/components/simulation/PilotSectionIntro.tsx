"use client";
interface Props { label: string; onContinue: () => void }

export function PilotSectionIntro({ label, onContinue }: Props) {
  return (
    <div className="animate-fade-up" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem", padding: "3rem 1rem", textAlign: "center" }}>
      <div style={{ padding: "1.5rem 2rem", borderRadius: 14, border: "1.5px solid rgba(245,158,11,0.4)", background: "rgba(245,158,11,0.08)", maxWidth: 480 }}>
        <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--warn)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
          🧪 Pilot Section / סעיף ניסוי
        </div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 800, color: "var(--ink)", margin: "0 0 0.75rem" }}>{label}</h2>
        <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>
          אלו סעיפי ניסוי. שגיאות <strong>לא</strong> יורידו את הציון שלך.<br />
          תשובות נכונות עשויות להוסיף עד 2 נקודות בונוס.
        </p>
        <p style={{ color: "var(--ink-muted)", fontSize: "0.8rem", marginTop: "0.5rem" }}>
          These are experimental sections. Mistakes will not lower your score. Correct answers may add up to 2 bonus points.
        </p>
      </div>
      <button className="btn btn-primary btn-lg" onClick={onContinue}>המשך / Continue →</button>
    </div>
  );
}
