export interface Plan {
  id: string;
  name: string;
  priceILS: number | null;
  priceMonthlyUSD: number | null;
  features: string[];
  isFree?: boolean;
  isPopular?: boolean;
  isOneTime?: boolean;
  comingSoon?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "חינמי / Free",
    priceILS: 0,
    priceMonthlyUSD: 0,
    features: [
      "שאלות אימון ללא הגבלה / Unlimited practice questions",
      "2 הדמיות בחודש / 2 simulations per month",
      "מאגר בסיסי 100 מילים / Basic vocab (100 words)",
      "מעקב התקדמות / Progress tracking",
    ],
    isFree: true,
    isPopular: false,
  },
  {
    id: "pro-monthly",
    name: "פרו חודשי / Pro Monthly",
    priceILS: 49,
    priceMonthlyUSD: 13,
    features: [
      "כל מה שב-Free / Everything in Free",
      "הדמיות ללא הגבלה / Unlimited simulations",
      "מאגר מלא 900+ מילים / Full vocab deck (900+ words)",
      "תור חזרה חכם / Smart review queue",
      "ניתוח נקודות חולשה / Weakness analysis",
      "ייצוא ויבוא התקדמות / Progress export & import",
    ],
    isPopular: true,
  },
  {
    id: "pro-3month",
    name: "פרו 3 חודשים / Pro 3 Months",
    priceILS: 119,
    priceMonthlyUSD: 11,
    features: [
      "כל מה שב-Pro / Everything in Pro",
      "חיסכון של ~19% / ~19% savings",
      "הדמיות ללא הגבלה / Unlimited simulations",
      "מאגר מלא 900+ מילים / Full vocab deck",
      "תור חזרה חכם / Smart review queue",
    ],
  },
  {
    id: "sim-pack",
    name: "חבילת הדמיות / Simulation Pack",
    priceILS: 29,
    priceMonthlyUSD: 8,
    features: [
      "3 הדמיות / 3 simulations",
      "תשלום חד-פעמי / One-time payment",
      "תוקף 60 יום / Valid 60 days",
    ],
    isOneTime: true,
  },
  {
    id: "credits",
    name: "קרדיטים / Credits",
    priceILS: null,
    priceMonthlyUSD: null,
    features: [
      "בקרוב / Coming soon",
      "קרדיטים לשימוש גמיש / Flexible-use credits",
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
