import type { BillingProviderInterface } from "./types";
import type { SubscriptionStatus } from "@/types/billing";

/**
 * MockProvider — implements BillingProviderInterface for local development.
 * No real network calls, no API keys required.
 */
export class MockProvider implements BillingProviderInterface {
  async createCheckoutSession(
    _planId: string,
    _userId: string,
  ): Promise<{ url: string }> {
    return { url: "/pricing?mock=success" };
  }

  async createCustomerPortalSession(
    _userId: string,
  ): Promise<{ url: string }> {
    return { url: "/account?mock=portal" };
  }

  async handleWebhook(_payload: unknown, _signature: string): Promise<void> {
    // No-op in mock mode
  }

  async getSubscriptionStatus(_userId: string): Promise<SubscriptionStatus> {
    return "active";
  }

  async cancelSubscription(_userId: string): Promise<void> {
    // No-op in mock mode
  }

  async refundPurchase(_purchaseId: string): Promise<void> {
    // No-op in mock mode
  }

  async grantCredits(
    _userId: string,
    _amount: number,
    _reason: string,
  ): Promise<void> {
    // No-op in mock mode — credits managed client-side via credits.ts
  }

  async consumeCredits(_userId: string, _amount: number): Promise<boolean> {
    return true;
  }
}
