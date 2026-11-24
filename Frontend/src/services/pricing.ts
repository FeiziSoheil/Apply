import {
  pricingComparison,
  pricingGuarantees,
  pricingHowCalculated,
  pricingNeverCharge,
  pricingPlans,
} from "@/data/pricing";
import { mockDelay } from "@/lib/mock-delay";
import type { PricingComparisonRow, PricingPlan } from "@/types";

export async function getPricingPlans(): Promise<PricingPlan[]> {
  "use cache";
  await mockDelay();
  return pricingPlans;
}

export async function getPricingComparison(): Promise<PricingComparisonRow[]> {
  "use cache";
  await mockDelay();
  return pricingComparison;
}

export async function getPricingContent() {
  "use cache";
  await mockDelay();
  return {
    plans: pricingPlans,
    comparison: pricingComparison,
    howCalculated: pricingHowCalculated,
    neverCharge: pricingNeverCharge,
    guarantees: pricingGuarantees,
  };
}
