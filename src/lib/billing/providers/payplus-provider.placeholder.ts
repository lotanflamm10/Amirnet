import type { BillingProviderInterface } from "../types";
import type { SubscriptionStatus } from "@/types/billing";

/**
 * PayPlusProvider placeholder — activate with PAYMENTS_MODE=payplus
 */
export class PayPlusProvider implements BillingProviderInterface {
  async createCheckoutSession(
    _planId: string,
    _userId: string,
  ): Promise<{ url: string }> {
    throw new Error(
      "Not implemented — activate with PAYMENTS_MODE=payplus",
    );
  }

  async createCustomerPortalSession(
    _userId: string,
  ): Promise<{ url: string }> {
    throw new Error(
      "Not implemented — activate with PAYMENTS_MODE=payplus",
    );
  }

  async handleWebhook(_payload: unknown, _signature: string): Promise<void> {
    throw new Error(
      "Not implemented — activate with PAYMENTS_MODE=payplus",
    );
  }

  async getSubscriptionStatus(_userId: string): Promise<SubscriptionStatus> {
    throw new Error(
      "Not implemented — activate with PAYMENTS_MODE=payplus",
    );
  }

  async cancelSubscription(_userId: string): Promise<void> {
    throw new Error(
      "Not implemented — activate with PAYMENTS_MODE=payplus",
    );
  }

  async refundPurchase(_purchaseId: string): Promise<void> {
    throw new Error(
      "Not implemented — activate with PAYMENTS_MODE=payplus",
    );
  }

  async grantCredits(
    _userId: string,
    _amount: number,
    _reason: string,
  ): Promise<void> {
    throw new Error(
      "Not implemented — activate with PAYMENTS_MODE=payplus",
    );
  }

  async consumeCredits(_userId: string, _amount: number): Promise<boolean> {
    throw new Error(
      "Not implemented — activate with PAYMENTS_MODE=payplus",
    );
  }
}
