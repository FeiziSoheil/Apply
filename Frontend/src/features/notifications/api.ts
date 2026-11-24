import {
  notificationBulkReadSchema,
  notificationListQuerySchema,
  notificationPreferencesSchema,
  notificationPreferencesUpdateSchema,
  notificationSchema,
  unreadCountSchema,
} from "@/contracts/crm";
import { z } from "@/contracts/zod";
import {
  apiGet,
  apiGetPage,
  apiPost,
  apiPostVoid,
  apiPut,
  segment,
  type RequestOptions,
} from "@/lib/api/client";
import type { ListFilters } from "@/lib/api/types";
import { validateRequest } from "@/lib/api/validate";

const notificationsArray = z.array(notificationSchema);

export type NotificationListFilters = ListFilters<
  typeof notificationListQuerySchema
>;

export const notificationsApi = {
  list(filters?: NotificationListFilters, options?: RequestOptions) {
    return apiGetPage("/me/notifications", notificationSchema, {
      ...options,
      query: filters,
    });
  },

  unreadCount(options?: RequestOptions) {
    return apiGet("/me/notifications/unread-count", unreadCountSchema, options);
  },

  markRead(id: string, options?: RequestOptions) {
    return apiPost(
      `/me/notifications/${segment(id)}/read`,
      notificationSchema,
      {},
      options,
    );
  },

  markAllRead(options?: RequestOptions) {
    return apiPostVoid("/me/notifications/read-all", {}, options);
  },

  bulkMarkRead(
    body: z.input<typeof notificationBulkReadSchema>,
    options?: RequestOptions,
  ) {
    return apiPost(
      "/me/notifications/bulk-read",
      notificationsArray,
      validateRequest(notificationBulkReadSchema, body),
      options,
    );
  },

  getPreferences(options?: RequestOptions) {
    return apiGet(
      "/me/notification-preferences",
      notificationPreferencesSchema,
      options,
    );
  },

  updatePreferences(
    body: z.input<typeof notificationPreferencesUpdateSchema>,
    options?: RequestOptions,
  ) {
    return apiPut(
      "/me/notification-preferences",
      notificationPreferencesSchema,
      validateRequest(notificationPreferencesUpdateSchema, body),
      options,
    );
  },
};
