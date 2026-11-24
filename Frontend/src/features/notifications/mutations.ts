"use client";

import type { z } from "zod";
import type {
  notificationBulkReadSchema,
  notificationPreferencesUpdateSchema,
} from "@/contracts/crm";
import {
  useApiMutation,
  type ApiMutationOptions,
} from "@/lib/api/use-api-mutation";
import { notificationsApi } from "./api";
import { notificationKeys } from "./keys";

type Notification = Awaited<ReturnType<typeof notificationsApi.markRead>>;
type Preferences = Awaited<
  ReturnType<typeof notificationsApi.updatePreferences>
>;

export function useMarkNotificationRead(
  options?: ApiMutationOptions<Notification, string>,
) {
  return useApiMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    invalidates: () => [notificationKeys.all],
    options,
  });
}

export function useMarkAllNotificationsRead(
  options?: ApiMutationOptions<void, void>,
) {
  return useApiMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    invalidates: () => [notificationKeys.all],
    options,
  });
}

export function useBulkMarkNotificationsRead(
  options?: ApiMutationOptions<
    Notification[],
    z.input<typeof notificationBulkReadSchema>
  >,
) {
  return useApiMutation({
    mutationFn: (body) => notificationsApi.bulkMarkRead(body),
    invalidates: () => [notificationKeys.all],
    options,
  });
}

export function useUpdateNotificationPreferences(
  options?: ApiMutationOptions<
    Preferences,
    z.input<typeof notificationPreferencesUpdateSchema>
  >,
) {
  return useApiMutation({
    mutationFn: (body) => notificationsApi.updatePreferences(body),
    invalidates: () => [notificationKeys.preferences()],
    options,
  });
}
