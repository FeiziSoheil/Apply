"use client";

import {
  useQuery,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type { Announcement } from "@/contracts/student-panel";
import type { Paginated } from "@/lib/api/client";
import {
  announcementsApi,
  type AnnouncementListFilters,
} from "./api";
import { announcementKeys } from "./keys";

export function useAnnouncements(
  filters?: AnnouncementListFilters,
  options?: Omit<
    UseQueryOptions<Paginated<Announcement>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: announcementKeys.list(filters ?? {}),
    queryFn: () => announcementsApi.list(filters),
    ...options,
  });
}

export function useAnnouncement(
  id: string,
  options?: Omit<UseQueryOptions<Announcement>, "queryKey" | "queryFn"> & {
    enabled?: boolean;
  },
) {
  return useQuery({
    queryKey: announcementKeys.detail(id),
    queryFn: () => announcementsApi.get(id),
    enabled: Boolean(id) && (options?.enabled ?? true),
    ...options,
  });
}
