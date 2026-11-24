export type PricingPlanId = "basic" | "full" | "premium";

export type PricingPlan = {
  id: PricingPlanId;
  name: string;
  tagline: string;
  priceFrom: number;
  priceNote: string;
  highlighted?: boolean;
  features: string[];
};

export type PricingComparisonRow = {
  id: string;
  feature: string;
  basic: boolean | string;
  full: boolean | string;
  premium: boolean | string;
};
