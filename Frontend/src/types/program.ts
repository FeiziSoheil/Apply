import type { DegreeLevel } from "./common";

export type ProgramSort = "relevant" | "cheapest" | "nearest_deadline";

export type LanguageRequirementType =
  | "ielts"
  | "toefl"
  | "testdaf"
  | "none"
  | "other";

export type Program = {
  id: string;
  slug: string;
  nameFa: string;
  universitySlug: string;
  countrySlug: string;
  degreeLevel: DegreeLevel;
  field: string;
  /** Human-readable duration, e.g. "۲ سال" */
  duration: string;
  /** Annual tuition in `currency` */
  tuition: number;
  /** ISO 4217 currency of `tuition` (default EUR) */
  currency: string;
  /** e.g. "IELTS 6.5" or "TOEFL 90" */
  languageRequirement: string;
  minGpa: number;
  intakes: string[];
  deadline: string;
  hasScholarship: boolean;
};
