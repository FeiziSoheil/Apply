import type { DegreeLevel, PaginationParams } from "./common";
import type { Continent, CostBand } from "./country";
import type { LanguageRequirementType, ProgramSort } from "./program";

export type CountryFilters = {
  search?: string;
  continent?: Continent;
  costBand?: CostBand;
};

export type UniversityFilters = PaginationParams & {
  country?: string;
  search?: string;
  minTuition?: number;
  maxTuition?: number;
};

export type ProgramFilters = PaginationParams & {
  country?: string;
  university?: string;
  degreeLevel?: DegreeLevel;
  field?: string;
  /** Free-text match against languageRequirement */
  language?: string;
  /** Structured language exam type filter */
  languageType?: LanguageRequirementType;
  hasScholarship?: boolean;
  minTuition?: number;
  maxTuition?: number;
  /** Intake / admission timing label (exact match in intakes[]) */
  intake?: string;
  search?: string;
  sort?: ProgramSort;
};

export type BlogPostParams = PaginationParams & {
  category?: string;
  tag?: string;
  search?: string;
};
