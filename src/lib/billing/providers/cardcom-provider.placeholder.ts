import type { BillingProviderInterface } from "../types";
import type { SubscriptionStatus } from "@/types/billing";

/**
 * CardcomProvider placeholder — activate with PAYMENTS_MODE=cardcom
 */
export class CardcomProvider implements BillingProviderInterface {
  async createCheckoutSession(
    _planId: string,
    _userId: string,
  ): Promise<{ url: string }> {
    throw new Error(
      "Not implemented — activate with PAYMENTS_MODE=cardcom",
    );
  }

  async createCustomerPortalSession(
    _userId: string,
  ): Promise<{ url: string }> {
    throw new Error(
      "Not implemented — activate with PAYMENTS_MODE=cardcom",
    );
  }

  async handleWebhook(_payload: unknown, _signature: string): Promise<void> {
    throw new Error(
      "Not implemented — activate with PAYMENTS_MODE=cardcom",
    );
  }

  async getSubscriptionStatus(_userId: string): Promise<SubscriptionStatus> {
    throw new Error(
      "Not implemented — activate with PAYMENTS_MODE=cardcom",
    );
  }

  async cancelSubscription(_userId: string): Promise<void> {
    throw new Error(
      "Not implemented — activate with PAYMENTS_MODE=cardcom",
    );
  }

  async refundPurchase(_purchaseId: string): Promise<void> {
    throw new Error(
      "Not implemented — activate with PAYMENTS_MODE=cardcom",
    );
  }

  async grantCredits(
    _userId: string,
    _amount: number,
    _reason: string,
  ): Promise<void> {
    throw new Error(
      "Not implemented — activate with PAYMENTS_MODE=cardcom",
    );
  }

  async consumeCredits(_userId: string, _amount: number): Promise<boolean> {
    throw new Error(
      "Not implemented — activate with PAYMENTS_MODE=cardcom",
    );
  }
}
