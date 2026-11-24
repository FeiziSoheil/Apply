import type { DegreeLevel } from "./common";

/** Foreign currencies used in cost estimates */
export type CurrencyCode =
  | "EUR"
  | "CAD"
  | "USD"
  | "AUD"
  | "MYR"
  | "TRY"
  | "HUF";

export type LifestyleLevel = "economic" | "medium" | "comfortable";

/** Country snapshot passed into the client cost calculator */
export type CostCalculatorCountry = {
  slug: string;
  nameFa: string;
  flagEmoji?: string;
  currencyCode: CurrencyCode;
  /** Mid-range annual tuition in foreign currency */
  tuitionAnnualAvg: number;
  /** Base monthly living cost in foreign currency */
  livingMonthly: number;
  /** Monthly health insurance in foreign currency */
  insuranceMonthly: number;
  /** One-time visa / study-permit fee in foreign currency */
  visaFee: number;
};

export type CostCalculatorInput = {
  countrySlug: string;
  degreeLevel: DegreeLevel;
  /** Study duration in years */
  durationYears: number;
  lifestyle: LifestyleLevel;
};

export type CostBreakdownAmounts = {
  tuition: number;
  living: number;
  insurance: number;
  visa: number;
  total: number;
};

export type CostCalculatorResult = {
  foreign: CostBreakdownAmounts;
  toman: CostBreakdownAmounts;
  currencyCode: CurrencyCode;
  currencyLabelFa: string;
};
