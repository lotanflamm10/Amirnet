export type BillingMode = "mock" | "stripe" | "paddle";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "none";

export type BillingProvider = "stripe" | "paddle" | "mock";

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  priceMonthlyUSD: number | null;
  priceYearlyUSD: number | null;
  features: string[];
  isPopular: boolean;
  isFree: boolean;
}

export interface UserEntitlement {
  userId: string;
  plan: "free" | "pro" | "unlimited";
  status: SubscriptionStatus;
  expiresAt: string | null;
  simulationsRemaining: number | null;
  vocabImportEnabled: boolean;
  adminAccess: boolean;
}

export interface CreditLedgerEntry {
  id: string;
  userId: string;
  delta: number;
  reason: string;
  occurredAt: string;
}

export interface ProductCatalogItem {
  id: string;
  name: string;
  description: string;
  priceUSD: number;
  credits: number | null;
  type: "subscription" | "one_time" | "credit_pack";
}

export interface PurchaseRecord {
  id: string;
  userId: string;
  productId: string;
  amountUSD: number;
  provider: BillingProvider;
  externalId: string | null;
  status: "pending" | "completed" | "failed" | "refunded";
  purchasedAt: string;
}
