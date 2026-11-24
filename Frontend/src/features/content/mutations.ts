"use client";

import type { QueryKey } from "@tanstack/react-query";
import {
  useApiMutation,
  type ApiMutationOptions,
} from "@/lib/api/use-api-mutation";
import type { ReorderBody, ReorderResult } from "@/contracts/content";
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
  type ReorderableResourceApi,
  type ResourceApi,
} from "./api";
import { contentKeys } from "./keys";

type UpdateVariables<TUpdate> = { id: string; body: TUpdate };

/**
 * `create` / `update` / `remove` hooks of one content resource. Each
 * invalidates the whole resource scope (lists, details and slug lookups).
 */
function createResourceMutations<TItem, TFilters, TCreate, TUpdate>(
  scope: QueryKey,
  api: ResourceApi<TItem, TFilters, TCreate, TUpdate>,
) {
  function useCreate(options?: ApiMutationOptions<TItem, TCreate>) {
    return useApiMutation<TItem, TCreate>({
      mutationFn: (body) => api.create(body),
      invalidates: () => [scope],
      options,
    });
  }

  function useUpdate(
    options?: ApiMutationOptions<TItem, UpdateVariables<TUpdate>>,
  ) {
    return useApiMutation<TItem, UpdateVariables<TUpdate>>({
      mutationFn: ({ id, body }) => api.update(id, body),
      invalidates: () => [scope],
      options,
    });
  }

  function useDelete(options?: ApiMutationOptions<void, string>) {
    return useApiMutation<void, string>({
      mutationFn: (id) => api.remove(id),
      invalidates: () => [scope],
      options,
    });
  }

  return { useCreate, useUpdate, useDelete };
}

function createReorderMutation<TItem, TFilters, TCreate, TUpdate>(
  scope: QueryKey,
  api: ReorderableResourceApi<TItem, TFilters, TCreate, TUpdate>,
) {
  return function useReorder(
    options?: ApiMutationOptions<ReorderResult, ReorderBody>,
  ) {
    return useApiMutation<ReorderResult, ReorderBody>({
      mutationFn: (body) => api.reorder(body),
      invalidates: () => [scope],
      options,
    });
  };
}

const countries = createResourceMutations(contentKeys.countries.all, countriesApi);
export const useCreateCountry = countries.useCreate;
export const useUpdateCountry = countries.useUpdate;
export const useDeleteCountry = countries.useDelete;

const universitiesBase = createResourceMutations(
  contentKeys.universities.all,
  universitiesApi,
);
export const useCreateUniversity = universitiesBase.useCreate;
export const useDeleteUniversity = universitiesBase.useDelete;

/** University slug/country changes cascade to programs in the mock API */
export function useUpdateUniversity(
  options?: ApiMutationOptions<
    Awaited<ReturnType<typeof universitiesApi.update>>,
    { id: string; body: Parameters<typeof universitiesApi.update>[1] }
  >,
) {
  return useApiMutation({
    mutationFn: ({ id, body }) => universitiesApi.update(id, body),
    invalidates: () => [contentKeys.universities.all, contentKeys.programs.all],
    options,
  });
}

/** Program writes also refresh university `programsCount` */
function useCreateProgramMutation(
  options?: ApiMutationOptions<
    Awaited<ReturnType<typeof programsApi.create>>,
    Parameters<typeof programsApi.create>[0]
  >,
) {
  return useApiMutation({
    mutationFn: (body) => programsApi.create(body),
    invalidates: () => [contentKeys.programs.all, contentKeys.universities.all],
    options,
  });
}

function useUpdateProgramMutation(
  options?: ApiMutationOptions<
    Awaited<ReturnType<typeof programsApi.update>>,
    { id: string; body: Parameters<typeof programsApi.update>[1] }
  >,
) {
  return useApiMutation({
    mutationFn: ({ id, body }) => programsApi.update(id, body),
    invalidates: () => [contentKeys.programs.all, contentKeys.universities.all],
    options,
  });
}

function useDeleteProgramMutation(
  options?: ApiMutationOptions<void, string>,
) {
  return useApiMutation({
    mutationFn: (id) => programsApi.remove(id),
    invalidates: () => [contentKeys.programs.all, contentKeys.universities.all],
    options,
  });
}

export const useCreateProgram = useCreateProgramMutation;
export const useUpdateProgram = useUpdateProgramMutation;
export const useDeleteProgram = useDeleteProgramMutation;

const services = createResourceMutations(contentKeys.services.all, servicesApi);
export const useCreateService = services.useCreate;
export const useUpdateService = services.useUpdate;
export const useDeleteService = services.useDelete;
export const useReorderServices = createReorderMutation(
  contentKeys.services.all,
  servicesApi,
);

const consultants = createResourceMutations(contentKeys.consultants.all, consultantsApi);
export const useCreateConsultant = consultants.useCreate;
export const useUpdateConsultant = consultants.useUpdate;
export const useDeleteConsultant = consultants.useDelete;
export const useReorderConsultants = createReorderMutation(
  contentKeys.consultants.all,
  consultantsApi,
);

const successStories = createResourceMutations(contentKeys.successStories.all, successStoriesApi);
export const useCreateSuccessStory = successStories.useCreate;
export const useUpdateSuccessStory = successStories.useUpdate;
export const useDeleteSuccessStory = successStories.useDelete;
export const useReorderSuccessStories = createReorderMutation(
  contentKeys.successStories.all,
  successStoriesApi,
);

const blogCategories = createResourceMutations(
  contentKeys.blogCategories.all,
  blogCategoriesApi,
);
export const useCreateBlogCategory = blogCategories.useCreate;
export const useUpdateBlogCategory = blogCategories.useUpdate;
export const useDeleteBlogCategory = blogCategories.useDelete;

const blogPosts = createResourceMutations(contentKeys.blogPosts.all, blogPostsApi);
export const useCreateBlogPost = blogPosts.useCreate;
export const useUpdateBlogPost = blogPosts.useUpdate;
export const useDeleteBlogPost = blogPosts.useDelete;

const news = createResourceMutations(contentKeys.news.all, newsApi);
export const useCreateNewsItem = news.useCreate;
export const useUpdateNewsItem = news.useUpdate;
export const useDeleteNewsItem = news.useDelete;

const faqs = createResourceMutations(contentKeys.faqs.all, faqsApi);
export const useCreateFaq = faqs.useCreate;
export const useUpdateFaq = faqs.useUpdate;
export const useDeleteFaq = faqs.useDelete;
export const useReorderFaqs = createReorderMutation(contentKeys.faqs.all, faqsApi);
