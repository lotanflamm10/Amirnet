"use client";
import Link from "next/link";
import { useLayoutEffect, useState } from "react";
import { getCurrentPlan, setMockPlan, can, isDevMode } from "@/lib/entitlements";
import { exportProgress, importProgress, resetProgress, loadProgress } from "@/lib/progress/local-progress-store";
import type { PlanId } from "@/lib/billing/types";
import { useTheme, PRESET_COLORS, DEFAULT_PRIMARY } from "@/contexts/ThemeContext";
import { Moon, Sun, Monitor } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import type { Translations } from "@/lib/i18n/translations";

function planLabel(plan: PlanId, t: Translations): string {
  switch (plan) {
    case "guest":    return t.account.planLabelGuest;
    case "free":     return t.account.planLabelFree;
    case "pro":      return t.account.planLabelPro;
    case "lifetime": return t.account.planLabelLifetime;
    case "admin":    return t.account.planLabelAdmin;
  }
}

export default function AccountPage() {
  const [plan, setPlan] = useState<PlanId>("free");
  const [devMode, setDevMode] = useState(false);
  const [stats, setStats] = useState<{ total: number; correct: number; streak: number } | null>(null);
  const [importStatus, setImportStatus] = useState<"success" | "error" | null>(null);
  const { settings, toggle, setPrimary, resetPrimary } = useTheme();
  const [displayPrimary, setDisplayPrimary] = useState(DEFAULT_PRIMARY);
  const { t } = useLang();

  useLayoutEffect(() => {
    setPlan(getCurrentPlan());
    setDevMode(isDevMode());
    const p = loadProgress();
    setStats({ total: p.totalQuestionsAnswered, correct: p.totalCorrect, streak: p.streak });
  }, []);

  useLayoutEffect(() => {
    if (settings.primary !== DEFAULT_PRIMARY) {
      setDisplayPrimary(settings.primary);
    } else {
      const computed = getComputedStyle(document.documentElement).getPropertyValue("--teal").trim();
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
      setImportStatus(result ? "success" : "error");
      if (result) {
        const p = loadProgress();
        setStats({ total: p.totalQuestionsAnswered, correct: p.totalCorrect, streak: p.streak });
      }
    };
    reader.readAsText(file);
  }

  function handleReset() {
    if (!window.confirm(t.account.resetConfirm)) return;
    resetProgress();
    setStats({ total: 0, correct: 0, streak: 0 });
  }

  function handlePlanChange(newPlan: PlanId) {
    setMockPlan(newPlan);
    setPlan(newPlan);
  }

  const acc = stats && stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : null;

  const appearanceModeLabel =
    settings.mode === "dark" ? t.account.appearanceModeDark
      : settings.mode === "light" ? t.account.appearanceModeLight
      : t.account.appearanceModeSystem;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: "480px" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, color: "var(--ink)", margin: 0 }}>
        {t.account.pageTitle}
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
            <p style={{ fontWeight: 700, color: "var(--ink)", margin: 0 }}>{t.account.guestName}</p>
            <p style={{ fontSize: "0.8rem", color: "var(--ink-muted)", margin: 0 }}>
              {planLabel(plan, t)} · {t.account.guestSub}
            </p>
          </div>
        </div>

        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", marginBottom: "1rem" }}>
            {[
              { label: t.account.statsQuestions, value: stats.total },
              { label: t.account.statsAccuracy,   value: acc !== null ? `${acc}%` : "—" },
              { label: t.account.statsStreak,     value: `${stats.streak}${t.account.statsStreakSuffix}` },
            ].map(({ label, value }) => (
              <div key={label} style={{ textAlign: "center", padding: "0.5rem", background: "var(--surface-raised)", borderRadius: "var(--radius)" }}>
                <p style={{ fontSize: "0.68rem", color: "var(--ink-muted)", margin: "0 0 0.15rem", textTransform: "uppercase" }}>{label}</p>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.1rem", color: "var(--teal)", margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>
        )}

        <Link href="/pricing" className="btn btn-ghost btn-sm" style={{ display: "block", textAlign: "center" }}>
          {t.account.upgradePlan}
        </Link>
      </div>

      {/* Entitlements */}
      <div className="card" style={{ padding: "1.25rem" }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--ink)", margin: "0 0 0.75rem" }}>
          {t.account.entitlements}
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {([
            [t.account.entPractice,    can("canAccessPractice")],
            [t.account.entSimulation,  can("canAccessSimulation")],
            [t.account.entSmartReview, can("canUseSmartReview")],
            [t.account.entAnalytics,   can("canAccessFullAnalytics")],
            [t.account.entVocabImport, can("vocabImportEnabled")],
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
          {t.account.appearance}
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {/* Theme mode toggle */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.875rem", color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: "0.375rem" }}>
              {settings.mode === "dark"
                ? <Moon size={15} strokeWidth={2} />
                : settings.mode === "light"
                ? <Sun size={15} strokeWidth={2} />
                : <Monitor size={15} strokeWidth={2} />}
              {appearanceModeLabel}
            </span>
            <button className="btn btn-ghost btn-sm" onClick={toggle}>
              {t.account.appearanceSwitch}
            </button>
          </div>

          {/* Primary color */}
          <div>
            <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--ink-muted)", margin: "0 0 0.5rem" }}>
              {t.account.appearancePrimaryColor}
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
                title={t.account.appearanceCustomColor}
                style={{ width: 28, height: 28, borderRadius: "50%", border: "1.5px solid var(--line)", cursor: "pointer", padding: 0, background: "none" }}
              />
              {settings.primary !== DEFAULT_PRIMARY && (
                <button className="btn btn-ghost btn-xs" onClick={resetPrimary}>
                  {t.account.appearanceReset}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress export/import/reset */}
      <div className="card" style={{ padding: "1.25rem" }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--ink)", margin: "0 0 0.75rem" }}>
          {t.account.dataTitle}
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <button className="btn btn-ghost btn-sm" onClick={handleExport}>
            {t.account.exportProgress}
          </button>
          <label className="btn btn-ghost btn-sm" style={{ cursor: "pointer", textAlign: "center" }}>
            {t.account.importProgress}
            <input type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} />
          </label>
          {importStatus && (
            <p style={{
              fontSize: "0.8rem",
              color: importStatus === "success" ? "var(--success)" : "var(--danger)",
              margin: 0,
            }}>
              {importStatus === "success" ? t.account.importSuccess : t.account.importError}
            </p>
          )}
          <button
            className="btn btn-sm"
            style={{ background: "var(--danger)", color: "#fff", border: "none" }}
            onClick={handleReset}
          >
            {t.account.resetAll}
          </button>
        </div>
      </div>

      {/* Dev mode plan switcher */}
      {devMode && (
        <div className="card" style={{ padding: "1.25rem", border: "1.5px solid var(--warn)" }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--warn)", margin: "0 0 0.5rem", fontSize: "0.85rem" }}>
            {t.account.devModeSwitcher}
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
        {t.account.dataDisclaimer}
      </p>
    </div>
  );
}
