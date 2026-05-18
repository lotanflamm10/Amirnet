import type { UserEntitlement, SubscriptionPlan, PurchaseRecord } from "@/types/billing";

export const PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    description: "Great for getting started.",
    priceMonthlyUSD: 0,
    priceYearlyUSD: 0,
    features: ["Unlimited practice questions", "2 simulations/month", "Basic vocab (100 words)", "Progress tracking"],
    isPopular: false,
    isFree: true,
  },
  {
    id: "pro",
    name: "Pro",
    description: "Everything you need to prepare seriously.",
    priceMonthlyUSD: 9,
    priceYearlyUSD: 79,
    features: ["Everything in Free", "Unlimited simulations", "Full vocab deck (900+ words)", "Smart review queue", "Weakness analysis"],
    isPopular: true,
    isFree: false,
  },
  {
    id: "unlimited",
    name: "Unlimited",
    description: "One-time payment, lifetime access.",
    priceMonthlyUSD: null,
    priceYearlyUSD: null,
    features: ["Everything in Pro", "Lifetime access", "Future content updates", "Admin access"],
    isPopular: false,
    isFree: false,
  },
];

export function getMockEntitlement(userId: string): UserEntitlement {
  const isDev = process.env.NODE_ENV !== "production";
  return {
    userId,
    plan: isDev ? "unlimited" : "free",
    status: "active",
    expiresAt: null,
    simulationsRemaining: isDev ? null : 2,
    vocabImportEnabled: isDev,
    adminAccess: isDev,
  };
}

export function recordMockPurchase(userId: string, productId: string, amountUSD: number): PurchaseRecord {
  return {
    id: `mock_${Date.now()}`,
    userId,
    productId,
    amountUSD,
    provider: "mock",
    externalId: null,
    status: "completed",
    purchasedAt: new Date().toISOString(),
  };
}
