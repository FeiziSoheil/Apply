"use client";

import type { QueryKey } from "@tanstack/react-query";
import type { z } from "zod";
import type {
  savedViewCreateSchema,
  savedViewUpdateSchema,
  taskBulkCompleteSchema,
  taskCreateSchema,
  taskSnoozeSchema,
  taskUpdateSchema,
} from "@/contracts/crm";
import {
  useApiMutation,
  type ApiMutationOptions,
} from "@/lib/api/use-api-mutation";
import { leadKeys } from "@/features/leads/keys";
import { caseKeys } from "@/features/students/keys";
import { crmApi } from "./api";
import { crmKeys } from "./keys";

type SavedView = Awaited<ReturnType<typeof crmApi.createSavedView>>;
type Task = Awaited<ReturnType<typeof crmApi.createTask>>;

function relatedInvalidations(related?: {
  relatedType?: string;
  relatedId?: string | null;
  leadId?: string;
  caseId?: string;
}): QueryKey[] {
  const keys: QueryKey[] = [crmKeys.tasksAll(), crmKeys.taskCounts()];
  const leadId =
    related?.leadId ??
    (related?.relatedType === "lead" ? related.relatedId : undefined);
  const caseId =
    related?.caseId ??
    (related?.relatedType === "case" ? related.relatedId : undefined);
  if (leadId) {
    keys.push(leadKeys.leadActivities(leadId), leadKeys.detail(leadId));
  }
  if (caseId) {
    keys.push([...caseKeys.detail(caseId), "activities"], caseKeys.detail(caseId));
  }
  return keys;
}

export function useCreateSavedView(
  options?: ApiMutationOptions<SavedView, z.input<typeof savedViewCreateSchema>>,
) {
  return useApiMutation({
    mutationFn: (body) => crmApi.createSavedView(body),
    invalidates: () => [crmKeys.savedViews()],
    options,
  });
}

type UpdateSavedViewVars = {
  id: string;
  body: z.input<typeof savedViewUpdateSchema>;
};

export function useUpdateSavedView(
  options?: ApiMutationOptions<SavedView, UpdateSavedViewVars>,
) {
  return useApiMutation({
    mutationFn: ({ id, body }: UpdateSavedViewVars) =>
      crmApi.updateSavedView(id, body),
    invalidates: () => [crmKeys.savedViews()],
    options,
  });
}

export function useDeleteSavedView(
  options?: ApiMutationOptions<void, string>,
) {
  return useApiMutation({
    mutationFn: (id: string) => crmApi.deleteSavedView(id),
    invalidates: () => [crmKeys.savedViews()],
    options,
  });
}

export function useCreateTask(
  options?: ApiMutationOptions<Task, z.input<typeof taskCreateSchema>>,
) {
  return useApiMutation({
    mutationFn: (body) => crmApi.createTask(body),
    invalidates: (_data, body) => relatedInvalidations(body),
    options,
  });
}

type UpdateTaskVars = {
  id: string;
  body: z.input<typeof taskUpdateSchema>;
  version: number;
  leadId?: string;
  caseId?: string;
};

export function useUpdateTask(
  options?: ApiMutationOptions<Task, UpdateTaskVars>,
) {
  return useApiMutation({
    mutationFn: ({ id, body, version }: UpdateTaskVars) =>
      crmApi.updateTask(id, body, { version }),
    invalidates: (_data, vars) => relatedInvalidations(vars),
    options,
  });
}

type CompleteTaskVars = {
  id: string;
  leadId?: string;
  caseId?: string;
};

export function useCompleteTask(
  options?: ApiMutationOptions<Task, CompleteTaskVars>,
) {
  return useApiMutation({
    mutationFn: ({ id }: CompleteTaskVars) => crmApi.completeTask(id),
    invalidates: (_data, vars) => relatedInvalidations(vars),
    options,
  });
}

export function useBulkCompleteTasks(
  options?: ApiMutationOptions<
    Task[],
    z.input<typeof taskBulkCompleteSchema>
  >,
) {
  return useApiMutation({
    mutationFn: (body) => crmApi.bulkCompleteTasks(body),
    invalidates: () => [crmKeys.tasksAll(), crmKeys.taskCounts()],
    options,
  });
}

type SnoozeTaskVars = {
  id: string;
  body: z.input<typeof taskSnoozeSchema>;
  version: number;
  leadId?: string;
  caseId?: string;
};

export function useSnoozeTask(
  options?: ApiMutationOptions<Task, SnoozeTaskVars>,
) {
  return useApiMutation({
    mutationFn: ({ id, body, version }: SnoozeTaskVars) =>
      crmApi.snoozeTask(id, body, { version }),
    invalidates: (_data, vars) => relatedInvalidations(vars),
    options,
  });
}

export function useDeleteTask(
  options?: ApiMutationOptions<
    void,
    { id: string; leadId?: string; caseId?: string }
  >,
) {
  return useApiMutation({
    mutationFn: ({ id }) => crmApi.deleteTask(id),
    invalidates: (_data, vars) => relatedInvalidations(vars),
    options,
  });
}

export function useProcessTaskReminders(
  options?: ApiMutationOptions<
    Awaited<ReturnType<typeof crmApi.processTaskReminders>>,
    void
  >,
) {
  return useApiMutation({
    mutationFn: () => crmApi.processTaskReminders(),
    invalidates: () => [],
    options,
  });
}
