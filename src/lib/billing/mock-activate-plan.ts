"use client";

import type { PlanId } from "@/lib/billing/types";
import { setMockPlan } from "@/lib/entitlements";
import {
  safeGetItem,
  safeRemoveItem,
  safeSetItem,
  userKey,
} from "@/lib/storage/user-storage";

const ACTIVE_CARD_LEGACY_KEY = "amirnet-active-pricing-card-v1";
const PLAN_ACTIVATED_AT_LEGACY_KEY = "amirnet-plan-activated-at-v1";

const cardKey = () => userKey(ACTIVE_CARD_LEGACY_KEY);
const activatedAtKey = () => userKey(PLAN_ACTIVATED_AT_LEGACY_KEY);

export type PricingCardId = "free" | "pro-monthly" | "pro-3month" | "sim-pack";

export const CARD_TO_PLAN_ID: Record<PricingCardId, PlanId> = {
  "free": "free",
  "pro-monthly": "pro",
  "pro-3month": "pro-3month",
  "sim-pack": "sim-pack",
};

export function activatePlanFromCard(cardId: PricingCardId): PlanId {
  const planId = CARD_TO_PLAN_ID[cardId];
  setMockPlan(planId);
  safeSetItem(cardKey(), cardId);
  safeSetItem(activatedAtKey(), new Date().toISOString());
  return planId;
}

export function activatePlan(planId: PlanId): void {
  setMockPlan(planId);
  safeRemoveItem(cardKey());
  safeSetItem(activatedAtKey(), new Date().toISOString());
}

export function getActiveCardId(): PricingCardId | null {
  const stored = safeGetItem(cardKey());
  if (!stored) return null;
  return stored in CARD_TO_PLAN_ID ? (stored as PricingCardId) : null;
}

export function getPlanActivatedAt(): string | null {
  return safeGetItem(activatedAtKey());
}
