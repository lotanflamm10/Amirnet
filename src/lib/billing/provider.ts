import { getBillingMode } from "./plans";
import { MockProvider } from "./mock-provider";
import type { BillingProviderInterface } from "./types";

export function getProvider(): BillingProviderInterface {
  const mode = getBillingMode();

  if (mode === "mock" || mode === undefined) {
    return new MockProvider();
  }

  throw new Error(
    `Not implemented: use PAYMENTS_MODE=mock in development. Received: "${mode}"`,
  );
}
