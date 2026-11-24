import type { ContentSection, Faq, SeoMeta } from "./common";

export type Service = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  /** Lucide icon name key used by UI */
  icon: string;
  steps: string[];
  requiredDocuments: string[];
  /** Approximate process duration (Persian text, digits already Persian) */
  duration: string;
  faqs: Faq[];
  relatedServiceSlugs: string[];
  /** Optional approximate fee in IRR (integer rials); the UI shows it in toman (÷10) */
  price?: number;
  order?: number;
  sections: ContentSection[];
  seo: SeoMeta;
};
