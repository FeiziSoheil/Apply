import type { RichContent, SeoMeta } from "./common";

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: RichContent;
  category: string;
  categoryId?: string;
  tags: string[];
  author: string;
  publishedAt?: string;
  readingTime: number;
  coverImage: string;
  coverImageAlt?: string;
  /** Highlighted on the blog index */
  featured?: boolean;
  seo?: SeoMeta;
};
