"use client";

import type { PlanId, EntitlementKey } from "@/lib/billing/types";
import type { UserEntitlement } from "@/types/billing";
import { userKey, safeGetItem, safeSetItem, getCurrentUserId } from "@/lib/storage/user-storage";

/**
 * Tester accounts that always resolve to the "pro" plan so friends can
 * exercise every gated feature (unlimited simulations, full analytics,
 * vocab import) without going through the mock pricing flow on each
 * device they log in from. Add usernames here, not passwords; the
 * entitlement only kicks in for actively logged-in sessions.
 */
const TESTER_USER_IDS = new Set<string>(["daniel"]);

const LEGACY_KEY = "amirnet-entitlement-v1";
const k = () => userKey(LEGACY_KEY);

const ENTITLEMENTS: Record<PlanId, Record<EntitlementKey, boolean>> = {
  guest: {
    canAccessPractice: true,
    canAccessSimulation: false,
    canAccessFullAnalytics: false,
    canUseSwipeVocab: true,
    canUseSmartReview: false,
    canConsumeCredit: false,
    vocabImportEnabled: false,
    adminAccess: false,
  },
  free: {
    canAccessPractice: true,
    canAccessSimulation: true,
    canAccessFullAnalytics: false,
    canUseSwipeVocab: true,
    canUseSmartReview: true,
    canConsumeCredit: false,
    vocabImportEnabled: false,
    adminAccess: false,
  },
  pro: {
    canAccessPractice: true,
    canAccessSimulation: true,
    canAccessFullAnalytics: true,
    canUseSwipeVocab: true,
    canUseSmartReview: true,
    canConsumeCredit: true,
    vocabImportEnabled: true,
    adminAccess: false,
  },
  "pro-3month": {
    canAccessPractice: true,
    canAccessSimulation: true,
    canAccessFullAnalytics: true,
    canUseSwipeVocab: true,
    canUseSmartReview: true,
    canConsumeCredit: true,
    vocabImportEnabled: true,
    adminAccess: false,
  },
  "sim-pack": {
    canAccessPractice: true,
    canAccessSimulation: true,
    canAccessFullAnalytics: false,
    canUseSwipeVocab: true,
    canUseSmartReview: true,
    canConsumeCredit: false,
    vocabImportEnabled: false,
    adminAccess: false,
  },
  lifetime: {
    canAccessPractice: true,
    canAccessSimulation: true,
    canAccessFullAnalytics: true,
    canUseSwipeVocab: true,
    canUseSmartReview: true,
    canConsumeCredit: true,
    vocabImportEnabled: true,
    adminAccess: false,
  },
  admin: {
    canAccessPractice: true,
    canAccessSimulation: true,
    canAccessFullAnalytics: true,
    canUseSwipeVocab: true,
    canUseSmartReview: true,
    canConsumeCredit: true,
    vocabImportEnabled: true,
    adminAccess: true,
  },
};

export function isDevMode(): boolean {
  return (
    typeof window !== "undefined" && process.env.NODE_ENV !== "production"
  );
}

const PLAN_IDS: PlanId[] = ["guest", "free", "pro", "pro-3month", "sim-pack", "lifetime", "admin"];

function isValidPlanId(value: string): value is PlanId {
  return PLAN_IDS.includes(value as PlanId);
}

export function getCurrentPlan(): PlanId {
  if (typeof window === "undefined") return "guest";
  // Tester allowlist short-circuits the stored plan AND the prod-default
  // "guest" so testers always see Pro behaviour regardless of which device
  // they log in from. This is intentionally device-independent: testers
  // shouldn't have to re-activate Pro from /pricing on every device.
  const uid = getCurrentUserId();
  if (uid && TESTER_USER_IDS.has(uid)) return "pro";
  const stored = safeGetItem(k());
  if (stored && isValidPlanId(stored)) return stored;
  return process.env.NODE_ENV !== "production" ? "pro" : "guest";
}

export function setMockPlan(plan: PlanId): void {
  safeSetItem(k(), plan);
}

export function can(key: EntitlementKey): boolean {
  const plan = getCurrentPlan();
  return ENTITLEMENTS[plan][key] ?? false;
}

function publicPlanFromInternal(plan: PlanId): "free" | "pro" | "unlimited" {
  switch (plan) {
    case "guest":
    case "free":
    case "sim-pack":
      return "free";
    case "pro":
    case "pro-3month":
      return "pro";
    case "lifetime":
    case "admin":
      return "unlimited";
  }
}

export function getUserEntitlement(): UserEntitlement {
  const plan = getCurrentPlan();
  const ent = ENTITLEMENTS[plan];
  return {
    userId: "local",
    plan: publicPlanFromInternal(plan),
    status: "active",
    expiresAt: null,
    simulationsRemaining: ent.canAccessSimulation ? null : 0,
    vocabImportEnabled: ent.vocabImportEnabled,
    adminAccess: ent.adminAccess,
  };
}
