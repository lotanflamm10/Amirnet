import type { BillingProviderInterface } from "../types";
import type { SubscriptionStatus } from "@/types/billing";

/**
 * StripeProvider placeholder — activate with PAYMENTS_MODE=stripe
 */
export class StripeProvider implements BillingProviderInterface {
  async createCheckoutSession(
    _planId: string,
    _userId: string,
  ): Promise<{ url: string }> {
    throw new Error(
      "Not implemented — activate with PAYMENTS_MODE=stripe",
    );
  }

  async createCustomerPortalSession(
    _userId: string,
  ): Promise<{ url: string }> {
    throw new Error(
      "Not implemented — activate with PAYMENTS_MODE=stripe",
    );
  }

  async handleWebhook(_payload: unknown, _signature: string): Promise<void> {
    throw new Error(
      "Not implemented — activate with PAYMENTS_MODE=stripe",
    );
  }

  async getSubscriptionStatus(_userId: string): Promise<SubscriptionStatus> {
    throw new Error(
      "Not implemented — activate with PAYMENTS_MODE=stripe",
    );
  }

  async cancelSubscription(_userId: string): Promise<void> {
    throw new Error(
      "Not implemented — activate with PAYMENTS_MODE=stripe",
    );
  }

  async refundPurchase(_purchaseId: string): Promise<void> {
    throw new Error(
      "Not implemented — activate with PAYMENTS_MODE=stripe",
    );
  }

  async grantCredits(
    _userId: string,
    _amount: number,
    _reason: string,
  ): Promise<void> {
    throw new Error(
      "Not implemented — activate with PAYMENTS_MODE=stripe",
    );
  }

  async consumeCredits(_userId: string, _amount: number): Promise<boolean> {
    throw new Error(
      "Not implemented — activate with PAYMENTS_MODE=stripe",
    );
  }
}
