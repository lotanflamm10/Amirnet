"use client";
import { useState } from "react";
import { PLANS } from "@/lib/billing/plans";
import { setMockPlan, isDevMode } from "@/lib/entitlements";
import type { PlanId } from "@/lib/billing/types";

const PLAN_TO_ID: Record<string, PlanId> = {
  "free": "free",
  "pro-monthly": "pro",
  "pro-3month": "pro",
  "sim-pack": "pro",
};

export default function PricingPage() {
  const [activated, setActivated] = useState<string | null>(null);
  const devMode = isDevMode();

  function handleActivate(planId: string) {
    const mappedId = PLAN_TO_ID[planId] ?? "pro";
    setMockPlan(mappedId);
    setActivated(planId);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 800, color: "var(--ink)", margin: "0 0 0.5rem" }}>
          תמחור / Pricing
        </h1>
        <p style={{ fontSize: "0.9rem", color: "var(--ink-muted)", margin: 0 }}>
          התחל חינם. שדרג כשתהיה מוכן.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className="card"
            style={{
              padding: "1.5rem",
              border: plan.isPopular ? "2px solid var(--teal)" : undefined,
              position: "relative",
            }}
          >
            {plan.isPopular && (
              <span style={{
                position: "absolute", top: "-0.6rem", left: "50%", transform: "translateX(-50%)",
                background: "var(--teal)", color: "var(--surface)", fontSize: "0.7rem",
                fontWeight: 700, padding: "0.15rem 0.75rem", borderRadius: "999px",
                whiteSpace: "nowrap",
              }}>
                הכי פופולרי / Most Popular
              </span>
            )}

            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--ink)", margin: "0 0 0.5rem", fontSize: "1rem" }}>
              {plan.name}
            </h2>

            {plan.comingSoon ? (
              <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--ink-muted)", margin: "0 0 1rem" }}>בקרוב</p>
            ) : plan.priceILS === 0 ? (
              <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--teal)", margin: "0 0 1rem" }}>חינם / Free</p>
            ) : (
              <div style={{ margin: "0 0 1rem" }}>
                <span style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 800, color: "var(--teal)" }}>
                  ₪{plan.priceILS}
                </span>
                <span style={{ fontSize: "0.8rem", color: "var(--ink-muted)" }}>
                  {plan.isOneTime ? " חד-פעמי" : " / חודש"}
                </span>
              </div>
            )}

            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.25rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {plan.features.map((f) => (
                <li key={f} style={{ fontSize: "0.82rem", color: "var(--ink-soft)", display: "flex", gap: "0.5rem" }}>
                  <span style={{ color: "var(--success)", flexShrink: 0 }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>

            {!plan.comingSoon && (
              <button
                className={plan.isPopular ? "btn btn-primary btn-sm" : "btn btn-ghost btn-sm"}
                style={{ width: "100%" }}
                onClick={() => devMode && handleActivate(plan.id)}
                disabled={!devMode}
              >
                {activated === plan.id
                  ? "✓ מופעל (Mock)"
                  : devMode
                  ? "הפעל (Mock)"
                  : "בקרוב / Coming Soon"}
              </button>
            )}
          </div>
        ))}
      </div>

      {devMode && (
        <div style={{ background: "var(--surface-raised)", borderRadius: "var(--radius)", padding: "0.75rem 1rem", border: "1px solid var(--warn)", fontSize: "0.8rem", color: "var(--warn)" }}>
          DEV MODE: לחיצה על תוכנית מדמה אקטיבציה מקומית בלבד. תשלום אמיתי אינו מופעל.
        </div>
      )}

      <p style={{ fontSize: "0.72rem", color: "var(--ink-muted)", textAlign: "center" }}>
        כלי הכנה עצמאי לאמי&quot;רנט. אינו קשור ל-NITE. ציונים והדמיות אינם רשמיים.
      </p>
    </div>
  );
}
