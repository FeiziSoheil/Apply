import type { ContentSection, Faq, SeoMeta } from "./common";

/** Geographic region for country filters */
export type Continent =
  | "europe"
  | "north-america"
  | "asia"
  | "oceania";

/** Relative living-cost band (derived from monthly costOfLiving) */
export type CostBand = "low" | "medium" | "high";

/** Single row in the country / destination cost table */
export type CostBreakdownItem = {
  id: string;
  label: string;
  /** Display amount with currency (Persian digits preferred in mock data) */
  amount: string;
  note?: string;
};

export type Country = {
  id: string;
  slug: string;
  nameFa: string;
  nameEn: string;
  continent: Continent;
  costBand: CostBand;
  /** Flag emoji (preferred for nav) or path under /images */
  flagEmoji?: string;
  flagPath?: string;
  heroImage: string;
  summary: string;
  /** Key advantages shown in cards / quick lists */
  benefits: string[];
  /** Primary study / instruction languages */
  language: string;
  /** Typical visa processing duration (Persian copy) */
  visaDuration: string;
  /** Approximate monthly living cost in `currency` */
  costOfLiving: number;
  /** Annual tuition range display string in `currency`, e.g. "۰–۳٬۰۰۰ یورو در سال" */
  tuitionRange: string;
  /** ISO 4217 currency of `costOfLiving` and `tuitionRange` (default EUR) */
  currency: string;
  /** Tuition, living, insurance, visa rows */
  costBreakdown: CostBreakdownItem[];
  requirements: string[];
  popularFields: string[];
  faqs: Faq[];
  sections: ContentSection[];
  seo: SeoMeta;
};
