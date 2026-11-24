"use client";

import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query";
import {
  notificationsApi,
  type NotificationListFilters,
} from "./api";
import { notificationKeys } from "./keys";

export { notificationKeys } from "./keys";

type QueryOpts = { enabled?: boolean };

const POLL_MS = 30_000;

/**
 * Abstraction over the notification transport.
 * Today: TanStack Query polling (+ refetchOnWindowFocus).
 * Later: swap the `queryFn` / invalidate path for SSE or WebSocket without
 * touching bell / toast / page consumers.
 */
export const notificationQueries = {
  list: (filters?: NotificationListFilters) =>
    queryOptions({
      queryKey: notificationKeys.list(filters),
      queryFn: ({ signal }) => notificationsApi.list(filters, { signal }),
      placeholderData: keepPreviousData,
    }),
  feed: (limit = 8) =>
    queryOptions({
      queryKey: notificationKeys.feed(limit),
      queryFn: ({ signal }) =>
        notificationsApi.list(
          { page: 1, pageSize: limit, sort: "createdAt", order: "desc" },
          { signal },
        ),
      refetchInterval: POLL_MS,
      refetchOnWindowFocus: true,
      staleTime: 5_000,
    }),
  unreadCount: () =>
    queryOptions({
      queryKey: notificationKeys.unreadCount(),
      queryFn: ({ signal }) => notificationsApi.unreadCount({ signal }),
      refetchInterval: POLL_MS,
      refetchOnWindowFocus: true,
      staleTime: 5_000,
    }),
  preferences: () =>
    queryOptions({
      queryKey: notificationKeys.preferences(),
      queryFn: ({ signal }) => notificationsApi.getPreferences({ signal }),
      staleTime: 60_000,
    }),
};

export function useNotificationFeed(limit = 8, options?: QueryOpts) {
  return useQuery({ ...notificationQueries.feed(limit), ...options });
}

export function useUnreadNotificationCount(options?: QueryOpts) {
  return useQuery({ ...notificationQueries.unreadCount(), ...options });
}

export function useNotifications(
  filters?: NotificationListFilters,
  options?: QueryOpts,
) {
  return useQuery({ ...notificationQueries.list(filters), ...options });
}

export function useNotificationPreferences(options?: QueryOpts) {
  return useQuery({ ...notificationQueries.preferences(), ...options });
}
