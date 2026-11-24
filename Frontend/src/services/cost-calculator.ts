import { countries } from "@/data/countries";
import { COUNTRY_COST_PROFILES, isFxCurrency } from "@/lib/cost-calculator";
import { mockDelay } from "@/lib/mock-delay";
import type { CostCalculatorCountry } from "@/types";

/**
 * Countries ready for the client cost calculator.
 * Living cost comes from country data; tuition/insurance/visa from profiles.
 */
export async function getCostCalculatorCountries(): Promise<
  CostCalculatorCountry[]
> {
  "use cache";
  await mockDelay();

  const result: CostCalculatorCountry[] = [];

  for (const country of countries) {
    const profile = COUNTRY_COST_PROFILES[country.slug];
    // Profiles are expressed in the country's own currency; skip unknown ones
    if (!profile || !isFxCurrency(country.currency)) continue;

    result.push({
      slug: country.slug,
      nameFa: country.nameFa,
      flagEmoji: country.flagEmoji,
      currencyCode: country.currency,
      tuitionAnnualAvg: profile.tuitionAnnualAvg,
      livingMonthly: country.costOfLiving,
      insuranceMonthly: profile.insuranceMonthly,
      visaFee: profile.visaFee,
    });
  }

  return result;
}
