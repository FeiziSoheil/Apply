import type { ContentSection, SeoMeta } from "./common";

export type UniversityDeadline = {
  label: string;
  date: string;
};

export type University = {
  id: string;
  slug: string;
  nameFa: string;
  nameEn: string;
  countrySlug: string;
  city: string;
  ranking: number;
  /** Annual tuition in `currency` (approximate) */
  tuitionPerYear: number;
  /** ISO 4217 currency of `tuitionPerYear` (default EUR) */
  currency: string;
  logo: string;
  /** Campus / building hero image */
  heroImage: string;
  /** Short card blurb; long-form copy lives in `sections` */
  summary: string;
  deadlines: UniversityDeadline[];
  requirements: string[];
  sections: ContentSection[];
  programsCount: number;
  seo?: SeoMeta;
};
