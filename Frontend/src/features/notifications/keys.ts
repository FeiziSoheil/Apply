import type { NotificationListFilters } from "./api";

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (filters?: NotificationListFilters) =>
    [...notificationKeys.all, "list", filters ?? {}] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
  preferences: () => [...notificationKeys.all, "preferences"] as const,
  /** Latest N for the topbar popover / toast feed */
  feed: (limit = 8) => [...notificationKeys.all, "feed", limit] as const,
};
