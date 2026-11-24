import {
  createSearchParamsCache,
  createSerializer,
  parseAsInteger,
  parseAsString,
} from "nuqs/server";
import type { BlogPostParams } from "@/types";

export const BLOG_PAGE_SIZE = 6;

export const blogSearchParams = {
  q: parseAsString.withDefault(""),
  category: parseAsString,
  page: parseAsInteger.withDefault(1),
};

export const blogSearchParamsCache = createSearchParamsCache(blogSearchParams);

export const serializeBlogSearchParams = createSerializer(blogSearchParams);

export type BlogSearchParams = Awaited<
  ReturnType<typeof blogSearchParamsCache.parse>
>;

export function toBlogPostParams(params: BlogSearchParams): BlogPostParams {
  return {
    search: params.q.trim() || undefined,
    category: params.category ?? undefined,
    page: params.page,
    pageSize: BLOG_PAGE_SIZE,
  };
}
