"use client";

import type { PlanId, EntitlementKey } from "@/lib/billing/types";
import type { UserEntitlement } from "@/types/billing";
import { userKey, safeGetItem, safeSetItem } from "@/lib/storage/user-storage";

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

const PLAN_IDS: PlanId[] = ["guest", "free", "pro", "lifetime", "admin"];

function isValidPlanId(value: string): value is PlanId {
  return PLAN_IDS.includes(value as PlanId);
}

export function getCurrentPlan(): PlanId {
  if (typeof window === "undefined") return "guest";
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

export function getUserEntitlement(): UserEntitlement {
  const plan = getCurrentPlan();
  const ent = ENTITLEMENTS[plan];
  return {
    userId: "local",
    plan: plan === "lifetime" || plan === "admin" ? "unlimited" : plan === "guest" ? "free" : plan as "free" | "pro" | "unlimited",
    status: "active",
    expiresAt: null,
    simulationsRemaining: ent.canAccessSimulation ? null : 0,
    vocabImportEnabled: ent.vocabImportEnabled,
    adminAccess: ent.adminAccess,
  };
}
