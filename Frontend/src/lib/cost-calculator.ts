import {
  CURRENCY_LABELS_FA,
  DEGREE_TUITION_MULTIPLIERS,
  FX_RATES,
  LIFESTYLE_MULTIPLIERS,
  type FxCurrency,
} from "@/lib/constants";
import type {
  CostBreakdownAmounts,
  CostCalculatorCountry,
  CostCalculatorInput,
  CostCalculatorResult,
  CurrencyCode,
} from "@/types";

/**
 * Per-country numeric defaults used with getCountries living costs. All
 * amounts are in the country's own `currency` (see `src/data/countries.ts`).
 */
export const COUNTRY_COST_PROFILES: Record<
  string,
  {
    tuitionAnnualAvg: number;
    insuranceMonthly: number;
    visaFee: number;
  }
> = {
  germany: {
    tuitionAnnualAvg: 1_500,
    insuranceMonthly: 125,
    visaFee: 75,
  },
  canada: {
    tuitionAnnualAvg: 25_000,
    insuranceMonthly: 70,
    visaFee: 150,
  },
  italy: {
    tuitionAnnualAvg: 2_000,
    insuranceMonthly: 30,
    visaFee: 50,
  },
  turkey: {
    tuitionAnnualAvg: 132_000,
    insuranceMonthly: 1_300,
    visaFee: 2_000,
  },
  hungary: {
    tuitionAnnualAvg: 3_200_000,
    insuranceMonthly: 18_000,
    visaFee: 24_000,
  },
  malaysia: {
    tuitionAnnualAvg: 31_500,
    insuranceMonthly: 135,
    visaFee: 225,
  },
  australia: {
    tuitionAnnualAvg: 30_000,
    insuranceMonthly: 55,
    visaFee: 650,
  },
  netherlands: {
    tuitionAnnualAvg: 12_000,
    insuranceMonthly: 120,
    visaFee: 210,
  },
};

export function isFxCurrency(code: string): code is FxCurrency {
  return code in FX_RATES;
}

export function toToman(amount: number, currency: CurrencyCode): number {
  if (!isFxCurrency(currency)) return 0;
  return Math.round(amount * FX_RATES[currency]);
}

function scaleBreakdown(
  foreign: CostBreakdownAmounts,
  currency: CurrencyCode,
): CostBreakdownAmounts {
  return {
    tuition: toToman(foreign.tuition, currency),
    living: toToman(foreign.living, currency),
    insurance: toToman(foreign.insurance, currency),
    visa: toToman(foreign.visa, currency),
    total: toToman(foreign.total, currency),
  };
}

export function calculateStudyCost(
  country: CostCalculatorCountry,
  input: Pick<
    CostCalculatorInput,
    "degreeLevel" | "durationYears" | "lifestyle"
  >,
): CostCalculatorResult {
  const years = Math.max(input.durationYears, 0.5);
  const tuitionMultiplier =
    DEGREE_TUITION_MULTIPLIERS[input.degreeLevel] ?? 1;
  const livingMultiplier = LIFESTYLE_MULTIPLIERS[input.lifestyle] ?? 1;

  const tuition =
    country.tuitionAnnualAvg * tuitionMultiplier * years;
  const living =
    country.livingMonthly * livingMultiplier * 12 * years;
  const insurance = country.insuranceMonthly * 12 * years;
  const visa = country.visaFee;

  const foreign: CostBreakdownAmounts = {
    tuition: Math.round(tuition),
    living: Math.round(living),
    insurance: Math.round(insurance),
    visa: Math.round(visa),
    total: Math.round(tuition + living + insurance + visa),
  };

  return {
    foreign,
    toman: scaleBreakdown(foreign, country.currencyCode),
    currencyCode: country.currencyCode,
    currencyLabelFa: CURRENCY_LABELS_FA[country.currencyCode],
  };
}
