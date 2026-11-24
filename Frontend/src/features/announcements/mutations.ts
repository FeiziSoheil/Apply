"use client";

import {
  useApiMutation,
  type ApiMutationOptions,
} from "@/lib/api/use-api-mutation";
import type {
  Announcement,
  AnnouncementCreate,
  AnnouncementUpdate,
} from "@/contracts/student-panel";
import { announcementsApi } from "./api";
import { announcementKeys } from "./keys";

type UpdateVariables = { id: string; body: AnnouncementUpdate };

export function useCreateAnnouncement(
  options?: ApiMutationOptions<Announcement, AnnouncementCreate>,
) {
  return useApiMutation<Announcement, AnnouncementCreate>({
    mutationFn: (body) => announcementsApi.create(body),
    invalidates: () => [announcementKeys.all],
    options,
  });
}

export function useUpdateAnnouncement(
  options?: ApiMutationOptions<Announcement, UpdateVariables>,
) {
  return useApiMutation<Announcement, UpdateVariables>({
    mutationFn: ({ id, body }) => announcementsApi.update(id, body),
    invalidates: () => [announcementKeys.all],
    options,
  });
}

export function useDeleteAnnouncement(
  options?: ApiMutationOptions<void, string>,
) {
  return useApiMutation<void, string>({
    mutationFn: (id) => announcementsApi.remove(id),
    invalidates: () => [announcementKeys.all],
    options,
  });
}
