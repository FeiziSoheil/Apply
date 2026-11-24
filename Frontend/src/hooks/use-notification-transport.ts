"use client";

/**
 * Transport hook for staff notifications.
 *
 * Current implementation: HTTP polling via TanStack Query (30s + window focus).
 * To migrate to SSE/WebSocket later, replace the internals of this module while
 * keeping the same return shape used by the bell, toast, and list pages.
 */
import {
  useNotificationFeed,
  useUnreadNotificationCount,
} from "@/features/notifications/queries";

export function useNotificationTransport(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const feedQuery = useNotificationFeed(8, { enabled });
  const unreadQuery = useUnreadNotificationCount({ enabled });

  return {
    items: feedQuery.data?.items ?? [],
    unreadCount: unreadQuery.data?.count ?? 0,
    isLoading: feedQuery.isPending || unreadQuery.isPending,
    isError: feedQuery.isError || unreadQuery.isError,
    error: feedQuery.error ?? unreadQuery.error,
    refetch: async () => {
      await Promise.all([feedQuery.refetch(), unreadQuery.refetch()]);
    },
  };
}
