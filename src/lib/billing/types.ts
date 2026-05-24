"use client";

export type BillingMode = "mock" | "stripe" | "cardcom" | "payplus" | "grow";
export type PlanId =
  | "guest"
  | "free"
  | "pro"
  | "pro-3month"
  | "sim-pack"
  | "lifetime"
  | "admin";
export type EntitlementKey =
  | "canAccessPractice"
  | "canAccessSimulation"
  | "canAccessFullAnalytics"
  | "canUseSwipeVocab"
  | "canUseSmartReview"
  | "canConsumeCredit"
  | "vocabImportEnabled"
  | "adminAccess";

export interface BillingProviderInterface {
  createCheckoutSession(planId: string, userId: string): Promise<{ url: string }>;
  createCustomerPortalSession(userId: string): Promise<{ url: string }>;
  handleWebhook(payload: unknown, signature: string): Promise<void>;
  getSubscriptionStatus(userId: string): Promise<import("@/types/billing").SubscriptionStatus>;
  cancelSubscription(userId: string): Promise<void>;
  refundPurchase(purchaseId: string): Promise<void>;
  grantCredits(userId: string, amount: number, reason: string): Promise<void>;
  consumeCredits(userId: string, amount: number): Promise<boolean>;
}

// Re-export existing billing types from @/types/billing
export type {
  UserEntitlement,
  SubscriptionPlan,
  SubscriptionStatus,
  PurchaseRecord,
  BillingProvider,
} from "@/types/billing";
