"use client";
import { useLayoutEffect, useState } from "react";
import { PLANS } from "@/lib/billing/plans";
import { isDevMode } from "@/lib/entitlements";
import {
  activatePlanFromCard,
  CARD_TO_PLAN_ID,
  getActiveCardId,
  type PricingCardId,
} from "@/lib/billing/mock-activate-plan";
import {
  getRemainingSimulations,
  getSimulationQuota,
} from "@/lib/billing/simulation-quota";
import { useLang } from "@/contexts/LanguageContext";

const CARD_IDS = new Set<string>(["free", "pro-monthly", "pro-3month", "sim-pack"]);

export default function PricingPage() {
  const [activeCard, setActiveCard] = useState<PricingCardId | null>(null);
  const [devMode, setDevMode] = useState(false);
  const [quotaForActive, setQuotaForActive] = useState<{ remaining: number; limit: number } | null>(null);
  const { t } = useLang();

  function refreshQuota(cardId: PricingCardId | null) {
    if (!cardId) { setQuotaForActive(null); return; }
    const plan = CARD_TO_PLAN_ID[cardId];
    const { limit } = getSimulationQuota(plan);
    if (limit === null) { setQuotaForActive(null); return; }
    const remaining = getRemainingSimulations(plan) ?? 0;
    setQuotaForActive({ remaining, limit });
  }

  useLayoutEffect(() => {
    const card = getActiveCardId();
    setActiveCard(card);
    setDevMode(isDevMode());
    refreshQuota(card);
  }, []);

  function handleActivate(cardId: PricingCardId) {
    activatePlanFromCard(cardId);
    setActiveCard(cardId);
    refreshQuota(cardId);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 800, color: "var(--ink)", margin: "0 0 0.5rem" }}>
          {t.pricing.title}
        </h1>
        <p style={{ fontSize: "0.9rem", color: "var(--ink-muted)", margin: 0 }}>
          {t.pricing.subtitle}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        {PLANS.map((plan) => {
          const isCard = CARD_IDS.has(plan.id);
          const isActive = isCard && activeCard === plan.id;
          return (
            <div
              key={plan.id}
              className="card"
              style={{
                padding: "1.5rem",
                border: isActive
                  ? "2px solid var(--success)"
                  : plan.isPopular
                  ? "2px solid var(--teal)"
                  : undefined,
                position: "relative",
              }}
            >
              {plan.isPopular && !isActive && (
                <span style={{
                  position: "absolute", top: "-0.6rem", left: "50%", transform: "translateX(-50%)",
                  background: "var(--teal)", color: "var(--surface)", fontSize: "0.7rem",
                  fontWeight: 700, padding: "0.15rem 0.75rem", borderRadius: "999px",
                  whiteSpace: "nowrap",
                }}>
                  {t.pricing.mostPopular}
                </span>
              )}
              {isActive && (
                <span style={{
                  position: "absolute", top: "-0.6rem", left: "50%", transform: "translateX(-50%)",
                  background: "var(--success)", color: "var(--surface)", fontSize: "0.7rem",
                  fontWeight: 700, padding: "0.15rem 0.75rem", borderRadius: "999px",
                  whiteSpace: "nowrap",
                }}>
                  {t.pricing.activeBadge}
                </span>
              )}

              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--ink)", margin: "0 0 0.5rem", fontSize: "1rem" }}>
                {t.pricing[plan.nameKey]}
              </h2>

              {plan.comingSoon ? (
                <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--ink-muted)", margin: "0 0 1rem" }}>
                  {t.pricing.comingSoon}
                </p>
              ) : plan.priceILS === 0 ? (
                <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--teal)", margin: "0 0 1rem" }}>
                  {t.pricing.free}
                </p>
              ) : (
                <div style={{ margin: "0 0 1rem" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 800, color: "var(--teal)" }}>
                    ₪{plan.priceILS}
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "var(--ink-muted)" }}>
                    {" "}{plan.isOneTime ? t.pricing.oneTime : t.pricing.perMonth}
                  </span>
                </div>
              )}

              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.25rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {plan.featureKeys.map((fKey) => (
                  <li key={fKey} style={{ fontSize: "0.82rem", color: "var(--ink-soft)", display: "flex", gap: "0.5rem" }}>
                    <span style={{ color: "var(--success)", flexShrink: 0 }}>✓</span>
                    {t.pricing[fKey]}
                  </li>
                ))}
              </ul>

              {!plan.comingSoon && isCard && (
                <button
                  className={isActive ? "btn btn-sm" : plan.isPopular ? "btn btn-primary btn-sm" : "btn btn-ghost btn-sm"}
                  style={{
                    width: "100%",
                    ...(isActive ? {
                      background: "var(--success)",
                      color: "var(--surface)",
                      border: "none",
                      cursor: "default",
                    } : {}),
                  }}
                  onClick={() => !isActive && handleActivate(plan.id as PricingCardId)}
                  disabled={isActive}
                >
                  {isActive ? t.pricing.activeBadge : t.pricing.activate}
                </button>
              )}
              {isActive && quotaForActive && (plan.id === "free" || plan.id === "sim-pack") && (
                <p style={{
                  marginTop: "0.6rem", marginBottom: 0,
                  fontSize: "0.78rem", color: "var(--ink-soft)", textAlign: "center",
                }}>
                  {t.simulation.quotaPricingShort
                    .replace("{n}", String(quotaForActive.remaining))
                    .replace("{limit}", String(quotaForActive.limit))}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {devMode && (
        <div style={{
          background: "var(--surface-raised)", borderRadius: "var(--radius)",
          padding: "0.75rem 1rem", border: "1px solid var(--warn)",
          fontSize: "0.8rem", color: "var(--warn)",
        }}>
          {t.pricing.devMode}
        </div>
      )}

      <p style={{ fontSize: "0.72rem", color: "var(--ink-muted)", textAlign: "center" }}>
        {t.pricing.disclaimer}
      </p>
    </div>
  );
}
