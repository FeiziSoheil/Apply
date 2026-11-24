"use client";

import {
  keepPreviousData,
  queryOptions,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import type { ApiQueryOptions } from "@/lib/api/query-client";
import {
  studentsApi,
  type CaseActivityListFilters,
  type CaseListFilters,
  type DocumentListFilters,
} from "./api";
import { caseKeys, checklistKeys, documentKeys } from "./keys";

export { caseKeys, checklistKeys, documentKeys } from "./keys";

type CasePage = Awaited<ReturnType<typeof studentsApi.listCases>>;
type StudentCase = Awaited<ReturnType<typeof studentsApi.getCase>>;
type MyCases = Awaited<ReturnType<typeof studentsApi.listMyCases>>;
type DocumentPage = Awaited<ReturnType<typeof studentsApi.listDocuments>>;
type StudentDocument = Awaited<ReturnType<typeof studentsApi.getDocument>>;
type Checklist = Awaited<ReturnType<typeof studentsApi.getChecklist>>;
type ActivityPage = Awaited<ReturnType<typeof studentsApi.listActivities>>;

export const studentQueries = {
  cases: (filters?: CaseListFilters) =>
    queryOptions({
      queryKey: caseKeys.list(filters),
      queryFn: ({ signal }) => studentsApi.listCases(filters, { signal }),
    }),
  myCases: () =>
    queryOptions({
      queryKey: caseKeys.mine(),
      queryFn: ({ signal }) => studentsApi.listMyCases({ signal }),
    }),
  case: (id: string) =>
    queryOptions({
      queryKey: caseKeys.detail(id),
      queryFn: ({ signal }) => studentsApi.getCase(id, { signal }),
    }),
  documents: (caseId: string, filters?: DocumentListFilters) =>
    queryOptions({
      queryKey: documentKeys.list(caseId, filters),
      queryFn: ({ signal }) =>
        studentsApi.listDocuments(caseId, filters, { signal }),
    }),
  document: (id: string) =>
    queryOptions({
      queryKey: documentKeys.detail(id),
      queryFn: ({ signal }) => studentsApi.getDocument(id, { signal }),
    }),
  checklist: (caseId: string) =>
    queryOptions({
      queryKey: checklistKeys.detail(caseId),
      queryFn: ({ signal }) => studentsApi.getChecklist(caseId, { signal }),
    }),
};

export function useCases(
  filters?: CaseListFilters,
  options?: ApiQueryOptions<CasePage>,
) {
  return useQuery({
    ...studentQueries.cases(filters),
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useMyCases(options?: ApiQueryOptions<MyCases>) {
  return useQuery({ ...studentQueries.myCases(), ...options });
}

export function useCase(id: string, options?: ApiQueryOptions<StudentCase>) {
  return useQuery({
    ...studentQueries.case(id),
    enabled: Boolean(id),
    ...options,
  });
}

export function useCaseActivities(
  id: string,
  filters?: CaseActivityListFilters,
  options?: ApiQueryOptions<ActivityPage>,
) {
  return useQuery({
    queryKey: [...caseKeys.detail(id), "activities", filters ?? {}] as const,
    queryFn: ({ signal }) =>
      studentsApi.listActivities(id, filters, { signal }),
    enabled: Boolean(id),
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useCaseActivitiesInfinite(
  id: string,
  filters?: Omit<CaseActivityListFilters, "page" | "pageSize">,
) {
  return useInfiniteQuery({
    queryKey: [
      ...caseKeys.detail(id),
      "activities",
      "infinite",
      filters ?? {},
    ] as const,
    queryFn: ({ pageParam, signal }) =>
      studentsApi.listActivities(
        id,
        {
          ...filters,
          page: pageParam,
          pageSize: 30,
          sort: "createdAt",
          order: "desc",
        },
        { signal },
      ),
    initialPageParam: 1,
    getNextPageParam: (last) => {
      const { page, totalPages } = last.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    enabled: Boolean(id),
  });
}

export function useCaseDocuments(
  caseId: string,
  filters?: DocumentListFilters,
  options?: ApiQueryOptions<DocumentPage>,
) {
  return useQuery({
    ...studentQueries.documents(caseId, filters),
    enabled: Boolean(caseId),
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useDocument(
  id: string,
  options?: ApiQueryOptions<StudentDocument>,
) {
  return useQuery({
    ...studentQueries.document(id),
    enabled: Boolean(id),
    ...options,
  });
}

export function useCaseChecklist(
  caseId: string,
  options?: ApiQueryOptions<Checklist>,
) {
  return useQuery({
    ...studentQueries.checklist(caseId),
    enabled: Boolean(caseId),
    ...options,
  });
}
