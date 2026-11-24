/** Shared SEO metadata for entity pages */
export type SeoMeta = {
  metaTitle?: string;
  metaDescription?: string;
  /** Uploaded file id (not an external URL) */
  ogImageId?: string;
  noindex?: boolean;
};

/** Degree levels offered by programs */
export type DegreeLevel =
  | "bachelor"
  | "master"
  | "phd"
  | "language"
  | "foundation";

/** Generic FAQ entry (standalone or nested) */
export type Faq = {
  id: string;
  question: string;
  answer: string;
  category?: string;
};

/** @deprecated Prefer Faq — kept for existing imports */
export type FaqItem = Faq;

/** Pagination request params */
export type PaginationParams = {
  page?: number;
  pageSize?: number;
};

/** Paginated list response */
export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type {
  ContentSection,
  RichContent,
  SectionIcon,
} from "@/contracts/richcontent";
