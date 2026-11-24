import type { RichContent, SeoMeta } from "./common";

export type NewsEventType =
  | "webinar"
  | "exhibition"
  | "visa"
  | "deadline"
  | "general";

export type NewsItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: RichContent;
  publishedAt?: string;
  coverImage?: string;
  coverImageAlt?: string;
  eventType: NewsEventType;
  eventDate?: string;
  registrationUrl?: string;
  seo?: SeoMeta;
};
