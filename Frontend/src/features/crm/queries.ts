"use client";

import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query";
import {
  crmApi,
  type SavedViewListFilters,
  type TaskCountsFilters,
  type TaskListFilters,
} from "./api";
import { crmKeys } from "./keys";

export { crmKeys } from "./keys";

type Stages = Awaited<ReturnType<typeof crmApi.listPipelineStages>>;
type Tags = Awaited<ReturnType<typeof crmApi.listTags>>;
type LostReasons = Awaited<ReturnType<typeof crmApi.listLostReasons>>;
type Templates = Awaited<ReturnType<typeof crmApi.listMessageTemplates>>;
type CaseTemplates = Awaited<ReturnType<typeof crmApi.listCaseTemplates>>;
type SavedViewsPage = Awaited<ReturnType<typeof crmApi.listSavedViews>>;
type TasksPage = Awaited<ReturnType<typeof crmApi.listTasks>>;
type TaskCounts = Awaited<ReturnType<typeof crmApi.getTaskCounts>>;

/** Narrow options to avoid TanStack Query `enabled` overload clashes with queryOptions */
type CrmQueryOptions = {
  enabled?: boolean;
};

export const crmQueries = {
  stages: () =>
    queryOptions({
      queryKey: crmKeys.stages(),
      queryFn: ({ signal }) => crmApi.listPipelineStages({ signal }),
      staleTime: 60_000,
    }),
  tags: () =>
    queryOptions({
      queryKey: crmKeys.tags(),
      queryFn: ({ signal }) => crmApi.listTags({ signal }),
      staleTime: 60_000,
    }),
  lostReasons: () =>
    queryOptions({
      queryKey: crmKeys.lostReasons(),
      queryFn: ({ signal }) => crmApi.listLostReasons({ signal }),
      staleTime: 60_000,
    }),
  messageTemplates: () =>
    queryOptions({
      queryKey: crmKeys.messageTemplates(),
      queryFn: ({ signal }) => crmApi.listMessageTemplates({ signal }),
      staleTime: 60_000,
    }),
  caseTemplates: () =>
    queryOptions({
      queryKey: crmKeys.caseTemplates(),
      queryFn: ({ signal }) => crmApi.listCaseTemplates({ signal }),
      staleTime: 60_000,
    }),
  tasks: (filters?: TaskListFilters) =>
    queryOptions({
      queryKey: crmKeys.tasks(filters),
      queryFn: ({ signal }) => crmApi.listTasks(filters, { signal }),
    }),
  taskCounts: (filters?: TaskCountsFilters) =>
    queryOptions({
      queryKey: crmKeys.taskCounts(filters),
      queryFn: ({ signal }) => crmApi.getTaskCounts(filters, { signal }),
    }),
  savedViews: (filters?: SavedViewListFilters) =>
    queryOptions({
      queryKey: crmKeys.savedViews(filters),
      queryFn: ({ signal }) => crmApi.listSavedViews(filters, { signal }),
    }),
};

export function usePipelineStages(options?: CrmQueryOptions) {
  return useQuery({ ...crmQueries.stages(), ...options });
}

export function useTags(options?: CrmQueryOptions) {
  return useQuery({ ...crmQueries.tags(), ...options });
}

export function useLostReasons(options?: CrmQueryOptions) {
  return useQuery({ ...crmQueries.lostReasons(), ...options });
}

export function useMessageTemplates(options?: CrmQueryOptions) {
  return useQuery({ ...crmQueries.messageTemplates(), ...options });
}

export function useCaseTemplates(options?: CrmQueryOptions) {
  return useQuery({ ...crmQueries.caseTemplates(), ...options });
}

export function useTasks(
  filters?: TaskListFilters,
  options?: CrmQueryOptions,
) {
  return useQuery({
    ...crmQueries.tasks(filters),
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useTaskCounts(
  filters?: TaskCountsFilters,
  options?: CrmQueryOptions,
) {
  return useQuery({
    ...crmQueries.taskCounts(filters),
    ...options,
  });
}

export function useSavedViews(
  filters?: SavedViewListFilters,
  options?: CrmQueryOptions,
) {
  return useQuery({
    ...crmQueries.savedViews(filters),
    placeholderData: keepPreviousData,
    ...options,
  });
}

export type {
  Stages,
  Tags,
  LostReasons,
  Templates,
  CaseTemplates,
  SavedViewsPage,
  TasksPage,
  TaskCounts,
};
