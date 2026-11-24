import { createEntityKeys } from "@/lib/api/query-keys";
import type {
  BlogCategoryListQuery,
  BlogPostListQuery,
  ConsultantListQuery,
  CountryListQuery,
  FaqListQuery,
  NewsListQuery,
  ProgramListQuery,
  ServiceListQuery,
  SuccessStoryListQuery,
  UniversityListQuery,
} from "@/contracts/content";

/** Every list filter is optional (server applies defaults) */
type Filters<T> = Partial<T>;

export const contentKeys = {
  all: ["content"] as const,
  countries: createEntityKeys<Filters<CountryListQuery>>(["content", "countries"]),
  universities: createEntityKeys<Filters<UniversityListQuery>>(["content", "universities"]),
  programs: createEntityKeys<Filters<ProgramListQuery>>(["content", "programs"]),
  services: createEntityKeys<Filters<ServiceListQuery>>(["content", "services"]),
  consultants: createEntityKeys<Filters<ConsultantListQuery>>(["content", "consultants"]),
  successStories: createEntityKeys<Filters<SuccessStoryListQuery>>(["content", "success-stories"]),
  blogCategories: createEntityKeys<Filters<BlogCategoryListQuery>>([
    "content",
    "blog-categories",
  ]),
  blogPosts: createEntityKeys<Filters<BlogPostListQuery>>(["content", "blog-posts"]),
  news: createEntityKeys<Filters<NewsListQuery>>(["content", "news"]),
  faqs: createEntityKeys<Filters<FaqListQuery>>(["content", "faqs"]),
} as const;
