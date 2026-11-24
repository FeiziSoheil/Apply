"use client";

import {
  keepPreviousData,
  queryOptions,
  useQuery,
  type QueryKey,
} from "@tanstack/react-query";
import type { Paginated } from "@/lib/api/client";
import type { ApiQueryOptions } from "@/lib/api/query-client";
import {
  blogCategoriesApi,
  blogPostsApi,
  consultantsApi,
  countriesApi,
  faqsApi,
  newsApi,
  programsApi,
  servicesApi,
  successStoriesApi,
  universitiesApi,
  type ResourceApi,
  type SluggedResourceApi,
} from "./api";
import { contentKeys } from "./keys";

export { contentKeys } from "./keys";

/* -------------------------------------------------------------------------- */
/*  Generic factories                                                         */
/* -------------------------------------------------------------------------- */

type EntityKeys<TFilters> = {
  list: (filters?: TFilters) => QueryKey;
  detail: (id: string) => QueryKey;
  slug: (slug: string) => QueryKey;
};

function createResourceQueries<TItem, TFilters, TCreate, TUpdate>(
  keys: EntityKeys<TFilters>,
  api: ResourceApi<TItem, TFilters, TCreate, TUpdate>,
) {
  const listOptions = (filters?: TFilters) =>
    queryOptions({
      queryKey: keys.list(filters),
      queryFn: ({ signal }): Promise<Paginated<TItem>> =>
        api.list(filters, { signal }),
    });

  const detailOptions = (id: string) =>
    queryOptions({
      queryKey: keys.detail(id),
      queryFn: ({ signal }) => api.get(id, { signal }),
    });

  function useList(
    filters?: TFilters,
    options?: ApiQueryOptions<Paginated<TItem>>,
  ) {
    return useQuery({
      ...listOptions(filters),
      placeholderData: keepPreviousData,
      ...options,
    });
  }

  function useDetail(id: string, options?: ApiQueryOptions<TItem>) {
    return useQuery({
      ...detailOptions(id),
      enabled: Boolean(id),
      ...options,
    });
  }

  return { listOptions, detailOptions, useList, useDetail };
}

function createSluggedResourceQueries<TItem, TFilters, TCreate, TUpdate>(
  keys: EntityKeys<TFilters>,
  api: SluggedResourceApi<TItem, TFilters, TCreate, TUpdate>,
) {
  const base = createResourceQueries(keys, api);

  const slugOptions = (slug: string) =>
    queryOptions({
      queryKey: keys.slug(slug),
      queryFn: ({ signal }) => api.getBySlug(slug, { signal }),
    });

  function useBySlug(slug: string, options?: ApiQueryOptions<TItem>) {
    return useQuery({
      ...slugOptions(slug),
      enabled: Boolean(slug),
      ...options,
    });
  }

  return { ...base, slugOptions, useBySlug };
}

/* -------------------------------------------------------------------------- */
/*  Resources                                                                 */
/* -------------------------------------------------------------------------- */

export const countryQueries = createSluggedResourceQueries(contentKeys.countries, countriesApi);
export const useCountries = countryQueries.useList;
export const useCountry = countryQueries.useDetail;
export const useCountryBySlug = countryQueries.useBySlug;

export const universityQueries = createSluggedResourceQueries(contentKeys.universities, universitiesApi);
export const useUniversities = universityQueries.useList;
export const useUniversity = universityQueries.useDetail;
export const useUniversityBySlug = universityQueries.useBySlug;

export const programQueries = createSluggedResourceQueries(contentKeys.programs, programsApi);
export const usePrograms = programQueries.useList;
export const useProgram = programQueries.useDetail;
export const useProgramBySlug = programQueries.useBySlug;

export const serviceQueries = createSluggedResourceQueries(contentKeys.services, servicesApi);
export const useServices = serviceQueries.useList;
export const useService = serviceQueries.useDetail;
export const useServiceBySlug = serviceQueries.useBySlug;

export const consultantQueries = createResourceQueries(contentKeys.consultants, consultantsApi);
export const useConsultants = consultantQueries.useList;
export const useConsultant = consultantQueries.useDetail;

export const successStoryQueries = createSluggedResourceQueries(contentKeys.successStories, successStoriesApi);
export const useSuccessStories = successStoryQueries.useList;
export const useSuccessStory = successStoryQueries.useDetail;
export const useSuccessStoryBySlug = successStoryQueries.useBySlug;

export const blogCategoryQueries = createSluggedResourceQueries(
  contentKeys.blogCategories,
  blogCategoriesApi,
);
export const useBlogCategories = blogCategoryQueries.useList;
export const useBlogCategory = blogCategoryQueries.useDetail;
export const useBlogCategoryBySlug = blogCategoryQueries.useBySlug;

export const blogPostQueries = createSluggedResourceQueries(contentKeys.blogPosts, blogPostsApi);
export const useBlogPosts = blogPostQueries.useList;
export const useBlogPost = blogPostQueries.useDetail;
export const useBlogPostBySlug = blogPostQueries.useBySlug;

export const newsQueries = createSluggedResourceQueries(contentKeys.news, newsApi);
export const useNewsItems = newsQueries.useList;
export const useNewsItem = newsQueries.useDetail;
export const useNewsItemBySlug = newsQueries.useBySlug;

export const faqQueries = createResourceQueries(contentKeys.faqs, faqsApi);
export const useFaqs = faqQueries.useList;
export const useFaq = faqQueries.useDetail;
