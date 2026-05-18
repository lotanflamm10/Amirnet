"use client";
import Link from "next/link";
import { useLayoutEffect, useState } from "react";
import { getCurrentPlan, setMockPlan, can, isDevMode } from "@/lib/entitlements";
import { exportProgress, importProgress, resetProgress, loadProgress } from "@/lib/progress/local-progress-store";
import type { PlanId } from "@/lib/billing/types";
import { useTheme, PRESET_COLORS, DEFAULT_PRIMARY } from "@/contexts/ThemeContext";

const PLAN_LABELS: Record<PlanId, string> = {
  guest: "אורח / Guest",
  free: "חינמי / Free",
  pro: "פרו / Pro",
  lifetime: "לכל החיים / Lifetime",
  admin: "מנהל / Admin",
};

export default function AccountPage() {
  const [plan, setPlan] = useState<PlanId>("free");
  const [devMode, setDevMode] = useState(false);
  const [stats, setStats] = useState<{ total: number; correct: number; streak: number } | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const { settings, toggle, setPrimary, resetPrimary } = useTheme();
  const [displayPrimary, setDisplayPrimary] = useState(DEFAULT_PRIMARY);

  useLayoutEffect(() => {
    setPlan(getCurrentPlan());
    setDevMode(isDevMode());
    const p = loadProgress();
    setStats({ total: p.totalQuestionsAnswered, correct: p.totalCorrect, streak: p.streak });
  }, []);

  // When primary is default, read the actual computed --teal so the picker matches the rendered color
  useLayoutEffect(() => {
    if (settings.primary !== DEFAULT_PRIMARY) {
      setDisplayPrimary(settings.primary);
    } else {
      const computed = getComputedStyle(document.documentElement).getPropertyValue("--teal").trim();
      // computed may be hex or empty; fall back to DEFAULT_PRIMARY
      setDisplayPrimary(computed.startsWith("#") && computed.length === 7 ? computed : DEFAULT_PRIMARY);
    }
  }, [settings.primary, settings.mode]);

  function handleExport() {
    const data = exportProgress();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `amirnet-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = importProgress(reader.result as string);
      setImportStatus(result ? "✓ יובא בהצלחה" : "✗ שגיאה בייבוא");
      if (result) {
        const p = loadProgress();
        setStats({ total: p.totalQuestionsAnswered, correct: p.totalCorrect, streak: p.streak });
      }
    };
    reader.readAsText(file);
  }

  function handleReset() {
    if (!window.confirm("בטוח שרצית לאפס את כל ההתקדמות? פעולה זו אינה הפיכה.")) return;
    resetProgress();
    setStats({ total: 0, correct: 0, streak: 0 });
  }

  function handlePlanChange(newPlan: PlanId) {
    setMockPlan(newPlan);
    setPlan(newPlan);
  }

  const acc = stats && stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: "480px" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, color: "var(--ink)", margin: 0 }}>
        חשבון / Account
      </h1>

      {/* User card */}
      <div className="card" style={{ padding: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
          <div style={{
            width: "48px", height: "48px", borderRadius: "50%",
            background: "var(--teal-sub)", border: "2px solid var(--teal)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.2rem", fontWeight: 800, color: "var(--teal)",
            fontFamily: "var(--font-display)",
          }}>G</div>
          <div>
            <p style={{ fontWeight: 700, color: "var(--ink)", margin: 0 }}>משתמש אורח</p>
            <p style={{ fontSize: "0.8rem", color: "var(--ink-muted)", margin: 0 }}>
              {PLAN_LABELS[plan]} · ללא כניסה
            </p>
          </div>
        </div>

        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", marginBottom: "1rem" }}>
            {[
              { label: "שאלות", value: stats.total },
              { label: "דיוק", value: acc !== null ? `${acc}%` : "—" },
              { label: "רצף", value: `${stats.streak}d` },
            ].map(({ label, value }) => (
              <div key={label} style={{ textAlign: "center", padding: "0.5rem", background: "var(--surface-raised)", borderRadius: "var(--radius)" }}>
                <p style={{ fontSize: "0.68rem", color: "var(--ink-muted)", margin: "0 0 0.15rem", textTransform: "uppercase" }}>{label}</p>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.1rem", color: "var(--teal)", margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>
        )}

        <Link href="/pricing" className="btn btn-ghost btn-sm" style={{ display: "block", textAlign: "center" }}>
          שדרג תוכנית / Upgrade Plan →
        </Link>
      </div>

      {/* Entitlements */}
      <div className="card" style={{ padding: "1.25rem" }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--ink)", margin: "0 0 0.75rem" }}>
          הרשאות / Entitlements
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {([
            ["תרגול / Practice", can("canAccessPractice")],
            ["הדמיות / Simulation", can("canAccessSimulation")],
            ["חזרה מרווחת / Smart Review", can("canUseSmartReview")],
            ["ניתוח מלא / Full Analytics", can("canAccessFullAnalytics")],
            ["ייבוא מילים / Vocab Import", can("vocabImportEnabled")],
          ] as [string, boolean][]).map(([label, allowed]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
              <span style={{ color: "var(--ink-soft)" }}>{label}</span>
              <span style={{ fontWeight: 700, color: allowed ? "var(--success)" : "var(--danger)" }}>
                {allowed ? "✓" : "✗"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Appearance */}
      <div className="card" style={{ padding: "1.25rem" }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--ink)", margin: "0 0 0.75rem" }}>
          מראה / Appearance
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {/* Light/Dark toggle */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.875rem", color: "var(--ink-soft)" }}>
              {settings.mode === "dark" ? "🌙 מצב כהה / Dark" : "☀️ מצב בהיר / Light"}
            </span>
            <button className="btn btn-ghost btn-sm" onClick={toggle}>
              החלף
            </button>
          </div>

          {/* Primary color */}
          <div>
            <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--ink-muted)", margin: "0 0 0.5rem" }}>
              צבע ראשי / Primary Color
            </p>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
              {PRESET_COLORS.map(({ label, value }) => {
                const isActive = value === DEFAULT_PRIMARY
                  ? settings.primary === DEFAULT_PRIMARY
                  : settings.primary === value;
                return (
                  <button
                    key={value}
                    title={label}
                    onClick={() => setPrimary(value)}
                    style={{
                      width: 28, height: 28, borderRadius: "50%", border: "2.5px solid",
                      borderColor: isActive ? "var(--ink)" : "transparent",
                      background: value,
                      cursor: "pointer",
                      flexShrink: 0,
                      boxShadow: isActive ? "0 0 0 1px var(--line)" : "none",
                    }}
                  />
                );
              })}
              <input
                type="color"
                value={displayPrimary}
                onChange={(e) => setPrimary(e.target.value)}
                title="צבע מותאם אישית"
                style={{ width: 28, height: 28, borderRadius: "50%", border: "1.5px solid var(--line)", cursor: "pointer", padding: 0, background: "none" }}
              />
              {settings.primary !== DEFAULT_PRIMARY && (
                <button className="btn btn-ghost btn-xs" onClick={resetPrimary}>
                  איפוס
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress export/import/reset */}
      <div className="card" style={{ padding: "1.25rem" }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--ink)", margin: "0 0 0.75rem" }}>
          ניהול נתונים / Data
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <button className="btn btn-ghost btn-sm" onClick={handleExport}>
            ייצא התקדמות / Export Progress
          </button>
          <label className="btn btn-ghost btn-sm" style={{ cursor: "pointer", textAlign: "center" }}>
            יבא התקדמות / Import Progress
            <input type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} />
          </label>
          {importStatus && (
            <p style={{ fontSize: "0.8rem", color: importStatus.startsWith("✓") ? "var(--success)" : "var(--danger)", margin: 0 }}>
              {importStatus}
            </p>
          )}
          <button
            className="btn btn-sm"
            style={{ background: "var(--danger)", color: "#fff", border: "none" }}
            onClick={handleReset}
          >
            אפס התקדמות / Reset All Data
          </button>
        </div>
      </div>

      {/* Dev mode plan switcher */}
      {devMode && (
        <div className="card" style={{ padding: "1.25rem", border: "1.5px solid var(--warn)" }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--warn)", margin: "0 0 0.5rem", fontSize: "0.85rem" }}>
            DEV: Mock Plan Switcher
          </h3>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {(["guest", "free", "pro", "lifetime", "admin"] as PlanId[]).map((p) => (
              <button
                key={p}
                className="btn btn-sm"
                style={{
                  border: "1.5px solid",
                  borderColor: plan === p ? "var(--teal)" : "var(--line)",
                  background: plan === p ? "var(--teal-sub)" : "transparent",
                  color: plan === p ? "var(--teal)" : "var(--ink-muted)",
                }}
                onClick={() => handlePlanChange(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      <p style={{ fontSize: "0.72rem", color: "var(--ink-muted)", textAlign: "center" }}>
        כל הנתונים שמורים מקומית. לא נשלח מידע לשרת.
      </p>
    </div>
  );
}
