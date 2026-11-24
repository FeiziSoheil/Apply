"use client";

import type { z } from "zod";
import type {
  activityCreateSchema,
  activityUpdateSchema,
  leadAssigneeUpdateSchema,
  leadConvertSchema,
  leadCreateSchema,
  leadFromAssessmentSchema,
  leadMergeSchema,
  leadQuickContactSchema,
  leadStageUpdateSchema,
  leadStatusUpdateSchema,
  leadUpdateSchema,
  newsletterSubscribeSchema,
} from "@/contracts/leads";
import {
  useApiMutation,
  type ApiMutationOptions,
} from "@/lib/api/use-api-mutation";
import { caseKeys } from "@/features/students/keys";
import { leadsApi } from "./api";
import { leadKeys } from "./keys";

type AssessmentReceipt = Awaited<ReturnType<typeof leadsApi.createFromAssessment>>;
type LeadReceipt = Awaited<ReturnType<typeof leadsApi.createQuickContact>>;
type Lead = Awaited<ReturnType<typeof leadsApi.create>>;
type StudentCase = Awaited<ReturnType<typeof leadsApi.convertToCase>>;
type Activity = Awaited<ReturnType<typeof leadsApi.createActivity>>;

/* ----- Public intake (assessment, callback / contact, newsletter) ----- */

export function useCreateAssessmentLead(
  options?: ApiMutationOptions<
    AssessmentReceipt,
    z.input<typeof leadFromAssessmentSchema>
  >,
) {
  return useApiMutation({
    mutationFn: (body: z.input<typeof leadFromAssessmentSchema>) =>
      leadsApi.createFromAssessment(body),
    invalidates: () => [leadKeys.lists()],
    options,
  });
}

export function useCreateQuickContactLead(
  options?: ApiMutationOptions<
    LeadReceipt,
    z.input<typeof leadQuickContactSchema>
  >,
) {
  return useApiMutation({
    mutationFn: (body: z.input<typeof leadQuickContactSchema>) =>
      leadsApi.createQuickContact(body),
    invalidates: () => [leadKeys.lists()],
    options,
  });
}

export function useSubscribeNewsletter(
  options?: ApiMutationOptions<void, z.input<typeof newsletterSubscribeSchema>>,
) {
  return useApiMutation({
    mutationFn: (body: z.input<typeof newsletterSubscribeSchema>) =>
      leadsApi.subscribeNewsletter(body),
    options,
  });
}

/* ----- Staff ----- */

export function useCreateLead(
  options?: ApiMutationOptions<Lead, z.input<typeof leadCreateSchema>>,
) {
  return useApiMutation({
    mutationFn: (body: z.input<typeof leadCreateSchema>) => leadsApi.create(body),
    invalidates: () => [leadKeys.lists()],
    options,
  });
}

type UpdateLeadVariables = {
  id: string;
  body: z.input<typeof leadUpdateSchema>;
  version?: number;
};

export function useUpdateLead(options?: ApiMutationOptions<Lead, UpdateLeadVariables>) {
  return useApiMutation({
    mutationFn: ({ id, body, version }: UpdateLeadVariables) =>
      leadsApi.update(id, body, { version }),
    invalidates: (_data, { id }) => [leadKeys.detail(id), leadKeys.lists()],
    options,
  });
}

export function useDeleteLead(options?: ApiMutationOptions<void, string>) {
  return useApiMutation({
    mutationFn: (id: string) => leadsApi.remove(id),
    invalidates: () => [leadKeys.all],
    options,
  });
}

type UpdateLeadStageVariables = {
  id: string;
  body: z.input<typeof leadStageUpdateSchema>;
  version: number;
};

/** Optimistic-friendly stage move; sends `If-Match` with `version` */
export function useUpdateLeadStage(
  options?: ApiMutationOptions<Lead, UpdateLeadStageVariables>,
) {
  return useApiMutation({
    mutationFn: ({ id, body, version }: UpdateLeadStageVariables) =>
      leadsApi.updateStage(id, body, { version }),
    invalidates: (_data, { id }) => [
      leadKeys.detail(id),
      leadKeys.lists(),
      leadKeys.leadActivities(id),
    ],
    options,
  });
}

type UpdateLeadStatusVariables = {
  id: string;
  body: z.input<typeof leadStatusUpdateSchema>;
  version?: number;
};

/** @deprecated Prefer useUpdateLeadStage */
export function useUpdateLeadStatus(
  options?: ApiMutationOptions<Lead, UpdateLeadStatusVariables>,
) {
  return useApiMutation({
    mutationFn: ({ id, body, version }: UpdateLeadStatusVariables) =>
      leadsApi.updateStatus(id, body, { version }),
    invalidates: (_data, { id }) => [
      leadKeys.detail(id),
      leadKeys.lists(),
      leadKeys.leadActivities(id),
    ],
    options,
  });
}

type AssignLeadVariables = {
  id: string;
  body: z.input<typeof leadAssigneeUpdateSchema>;
  version?: number;
};

export function useAssignLead(options?: ApiMutationOptions<Lead, AssignLeadVariables>) {
  return useApiMutation({
    mutationFn: ({ id, body, version }: AssignLeadVariables) =>
      leadsApi.assign(id, body, { version }),
    invalidates: (_data, { id }) => [leadKeys.detail(id), leadKeys.lists()],
    options,
  });
}


type ConvertLeadVariables = {
  id: string;
  body: z.input<typeof leadConvertSchema>;
};

/** Creates a student case, so case caches are invalidated too */
export function useConvertLeadToCase(
  options?: ApiMutationOptions<StudentCase, ConvertLeadVariables>,
) {
  return useApiMutation({
    mutationFn: ({ id, body }: ConvertLeadVariables) =>
      leadsApi.convertToCase(id, body),
    invalidates: (_data, { id }) => [
      leadKeys.detail(id),
      leadKeys.lists(),
      leadKeys.leadActivities(id),
      caseKeys.all,
    ],
    options,
  });
}

type CreateActivityVariables = {
  id: string;
  body: z.input<typeof activityCreateSchema>;
};

export function useCreateLeadActivity(
  options?: ApiMutationOptions<Activity, CreateActivityVariables>,
) {
  return useApiMutation({
    mutationFn: ({ id, body }: CreateActivityVariables) =>
      leadsApi.createActivity(id, body),
    invalidates: (_data, { id }) => [
      leadKeys.leadActivities(id),
      leadKeys.detail(id),
      leadKeys.lists(),
    ],
    options,
  });
}

type UpdateActivityVariables = {
  activityId: string;
  leadId: string;
  body: z.input<typeof activityUpdateSchema>;
};

export function useUpdateLeadActivity(
  options?: ApiMutationOptions<Activity, UpdateActivityVariables>,
) {
  return useApiMutation({
    mutationFn: ({ activityId, body }: UpdateActivityVariables) =>
      leadsApi.updateActivity(activityId, body),
    invalidates: (_data, { leadId }) => [leadKeys.leadActivities(leadId)],
    options,
  });
}

type DeleteActivityVariables = {
  activityId: string;
  leadId: string;
};

export function useDeleteLeadActivity(
  options?: ApiMutationOptions<void, DeleteActivityVariables>,
) {
  return useApiMutation({
    mutationFn: ({ activityId }: DeleteActivityVariables) =>
      leadsApi.deleteActivity(activityId),
    invalidates: (_data, { leadId }) => [leadKeys.leadActivities(leadId)],
    options,
  });
}

type MergeLeadVariables = {
  id: string;
  body: z.input<typeof leadMergeSchema>;
};

export function useMergeLead(
  options?: ApiMutationOptions<Lead, MergeLeadVariables>,
) {
  return useApiMutation({
    mutationFn: ({ id, body }: MergeLeadVariables) => leadsApi.merge(id, body),
    invalidates: () => [leadKeys.all],
    options,
  });
}
