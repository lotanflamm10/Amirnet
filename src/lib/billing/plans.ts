import type { Translations } from "@/lib/i18n/translations";

export interface Plan {
  id: string;
  nameKey: keyof Translations["pricing"];
  featureKeys: Array<keyof Translations["pricing"]>;
  priceILS: number | null;
  priceMonthlyUSD: number | null;
  isFree?: boolean;
  isPopular?: boolean;
  isOneTime?: boolean;
  comingSoon?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "free",
    nameKey: "planFree",
    priceILS: 0,
    priceMonthlyUSD: 0,
    featureKeys: [
      "featUnlimitedPractice",
      "feat2SimsPerMonth",
      "featBasicVocab",
      "featProgressTracking",
    ],
    isFree: true,
    isPopular: false,
  },
  {
    id: "pro-monthly",
    nameKey: "planProMonthly",
    priceILS: 49,
    priceMonthlyUSD: 13,
    featureKeys: [
      "featEverythingInFree",
      "featUnlimitedSimulations",
      "featFullVocab",
      "featSmartReviewQueue",
      "featWeaknessAnalysis",
      "featProgressExportImport",
    ],
    isPopular: true,
  },
  {
    id: "pro-3month",
    nameKey: "planPro3Month",
    priceILS: 119,
    priceMonthlyUSD: 11,
    featureKeys: [
      "featEverythingInPro",
      "feat19PercentSavings",
      "featUnlimitedSimulations",
      "featFullVocab",
      "featSmartReviewQueue",
    ],
  },
  {
    id: "sim-pack",
    nameKey: "planSimPack",
    priceILS: 29,
    priceMonthlyUSD: 8,
    featureKeys: [
      "feat3Simulations",
      "featOneTimePayment",
      "featValid60Days",
    ],
    isOneTime: true,
  },
  {
    id: "credits",
    nameKey: "planCredits",
    priceILS: null,
    priceMonthlyUSD: null,
    featureKeys: [
      "featComingSoon",
      "featFlexibleCredits",
    ],
    comingSoon: true,
  },
];

export function getBillingMode(): string {
  return (
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_PAYMENTS_MODE) ||
    "mock"
  );
}
