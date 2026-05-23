"use client";
import Link from "next/link";
import { useLayoutEffect, useState } from "react";
import { getCurrentPlan, setMockPlan, can, isDevMode } from "@/lib/entitlements";
import { exportProgress, importProgress, resetProgress, loadProgress } from "@/lib/progress/local-progress-store";
import type { PlanId } from "@/lib/billing/types";
import { useTheme, PRESET_COLORS, DEFAULT_PRIMARY } from "@/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import type { Translations } from "@/lib/i18n/translations";
import { AccountSecurityCard } from "@/components/account/AccountSecurityCard";
import { Globe, Languages } from "@/components/icons/NavIcons";
import { usePracticePrefs } from "@/lib/practice/practice-prefs";

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
  const { t, lang, toggle: toggleLang } = useLang();
  const { prefs: practicePrefs, update: updatePracticePrefs } = usePracticePrefs();

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
    settings.mode === "dark" ? t.account.appearanceModeDark : t.account.appearanceModeLight;

  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: "1.25rem",
      maxWidth: "700px", width: "100%",
      // Centered on desktop, fluid on mobile (logical margins respect RTL/LTR).
      marginInline: "auto",
    }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, color: "var(--ink)", margin: 0, overflowWrap: "anywhere" }}>
        {t.account.pageTitle}
      </h1>

      {/* Auth: username + logout + change password */}
      <AccountSecurityCard />

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
              // Use a localized "{n} ימים" / "{n} days" format so the digit
              // and the Hebrew suffix render with a proper separator (no
              // more "0ימים" bidi-mangled to "סימים").
              { label: t.account.statsStreak,     value: t.account.statsStreakValueFormat.replace("{n}", String(stats.streak)) },
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
          {/* Language toggle — must be reachable on mobile because the
              Sidebar Globe button is desktop-only (>= lg). The Account page
              IS in the bottom tab bar, so this is where iPhone users find
              the switch. */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.875rem", color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <Globe size={15} strokeWidth={2} />
              {t.account.languageLabel}
            </span>
            <div role="group" aria-label={t.account.languageLabel} style={{
              display: "inline-flex", border: "1.5px solid var(--line)",
              borderRadius: 999, overflow: "hidden",
            }}>
              <button
                type="button"
                aria-pressed={lang === "he"}
                onClick={() => { if (lang !== "he") toggleLang(); }}
                style={{
                  padding: "0.35rem 0.85rem", minHeight: 36,
                  fontSize: "0.82rem", fontWeight: 700,
                  fontFamily: "var(--font-body)",
                  border: "none", cursor: "pointer",
                  background: lang === "he" ? "var(--teal)" : "transparent",
                  color: lang === "he" ? "#fff" : "var(--ink-soft)",
                }}
              >
                {t.account.languageHebrew}
              </button>
              <button
                type="button"
                aria-pressed={lang === "en"}
                onClick={() => { if (lang !== "en") toggleLang(); }}
                style={{
                  padding: "0.35rem 0.85rem", minHeight: 36,
                  fontSize: "0.82rem", fontWeight: 700,
                  fontFamily: "var(--font-body)",
                  border: "none", cursor: "pointer",
                  background: lang === "en" ? "var(--teal)" : "transparent",
                  color: lang === "en" ? "#fff" : "var(--ink-soft)",
                }}
              >
                {t.account.languageEnglish}
              </button>
            </div>
          </div>

          {/* Theme mode toggle */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.875rem", color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: "0.375rem" }}>
              {settings.mode === "dark"
                ? <Moon size={15} strokeWidth={2} />
                : <Sun size={15} strokeWidth={2} />}
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

      {/* Practice preferences */}
      <div className="card" style={{ padding: "1.25rem" }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--ink)", margin: "0 0 0.75rem" }}>
          {t.account.practiceSectionTitle}
        </h3>
        <label
          style={{
            display: "flex", alignItems: "flex-start", justifyContent: "space-between",
            gap: "0.75rem", cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", flex: 1 }}>
            <span
              style={{
                fontSize: "0.875rem", color: "var(--ink-soft)",
                display: "flex", alignItems: "center", gap: "0.375rem",
              }}
            >
              <Languages size={15} strokeWidth={2} color="var(--ink-soft)" />
              {t.account.practiceAutoGlossaryLabel}
            </span>
            <span style={{ fontSize: "0.74rem", color: "var(--ink-muted)", lineHeight: 1.5 }}>
              {t.account.practiceAutoGlossaryHint}
            </span>
          </div>
          <input
            type="checkbox"
            role="switch"
            aria-checked={practicePrefs.autoGlossaryInExplanation}
            checked={practicePrefs.autoGlossaryInExplanation}
            onChange={(e) => updatePracticePrefs({ autoGlossaryInExplanation: e.target.checked })}
            style={{
              flexShrink: 0, width: 36, height: 20, cursor: "pointer",
              accentColor: "var(--teal)",
            }}
          />
        </label>
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
