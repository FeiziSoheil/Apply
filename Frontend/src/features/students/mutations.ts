"use client";

import type { z } from "zod";
import type {
  advanceCaseStageSchema,
  checklistItemCreateSchema,
  checklistItemUpdateSchema,
  documentCreateSchema,
  documentRevertSchema,
  documentReviewSchema,
  stageUpdateSchema,
  studentCaseCreateSchema,
  studentCaseUpdateSchema,
  CaseStage,
} from "@/contracts/students";
import type { activityCreateSchema } from "@/contracts/leads";
import {
  useApiMutation,
  type ApiMutationOptions,
} from "@/lib/api/use-api-mutation";
import { studentsApi } from "./api";
import { caseKeys, checklistKeys, documentKeys } from "./keys";

type FileAsset = Awaited<ReturnType<typeof studentsApi.uploadFile>>;
type StudentCase = Awaited<ReturnType<typeof studentsApi.getCase>>;
type StudentDocument = Awaited<ReturnType<typeof studentsApi.getDocument>>;
type ChecklistItem = Awaited<ReturnType<typeof studentsApi.updateChecklistItem>>;
type Activity = Awaited<ReturnType<typeof studentsApi.createActivity>>;

/* ----- Files ----- */

export function useUploadFile(options?: ApiMutationOptions<FileAsset, File>) {
  return useApiMutation({
    mutationFn: (file: File) => studentsApi.uploadFile(file),
    options,
  });
}

/* ----- Cases ----- */

export function useCreateCase(
  options?: ApiMutationOptions<StudentCase, z.input<typeof studentCaseCreateSchema>>,
) {
  return useApiMutation({
    mutationFn: (body: z.input<typeof studentCaseCreateSchema>) =>
      studentsApi.createCase(body),
    invalidates: () => [caseKeys.all],
    options,
  });
}

type UpdateCaseVariables = {
  id: string;
  body: z.input<typeof studentCaseUpdateSchema>;
  version: number;
};

export function useUpdateCase(options?: ApiMutationOptions<StudentCase, UpdateCaseVariables>) {
  return useApiMutation({
    mutationFn: ({ id, body, version }: UpdateCaseVariables) =>
      studentsApi.updateCase(id, body, { version }),
    invalidates: () => [caseKeys.all],
    options,
  });
}

type UpdateCaseStageVariables = {
  id: string;
  stage: CaseStage;
  body: z.input<typeof stageUpdateSchema>;
  version?: number;
};

export function useUpdateCaseStage(
  options?: ApiMutationOptions<StudentCase, UpdateCaseStageVariables>,
) {
  return useApiMutation({
    mutationFn: ({ id, stage, body, version }: UpdateCaseStageVariables) =>
      studentsApi.updateCaseStage(id, stage, body, { version }),
    invalidates: () => [caseKeys.all],
    options,
  });
}

type AdvanceCaseStageVariables = {
  id: string;
  body: z.input<typeof advanceCaseStageSchema>;
  version: number;
};

export function useAdvanceCaseStage(
  options?: ApiMutationOptions<StudentCase, AdvanceCaseStageVariables>,
) {
  return useApiMutation({
    mutationFn: ({ id, body, version }: AdvanceCaseStageVariables) =>
      studentsApi.advanceCaseStage(id, body, { version }),
    invalidates: (_data, { id }) => [caseKeys.all, caseKeys.detail(id), checklistKeys.detail(id)],
    options,
  });
}

type CreateCaseActivityVariables = {
  caseId: string;
  body: z.input<typeof activityCreateSchema>;
};

export function useCreateCaseActivity(
  options?: ApiMutationOptions<Activity, CreateCaseActivityVariables>,
) {
  return useApiMutation({
    mutationFn: ({ caseId, body }: CreateCaseActivityVariables) =>
      studentsApi.createActivity(caseId, body),
    invalidates: (_data, { caseId }) => [
      caseKeys.detail(caseId),
      [...caseKeys.detail(caseId), "activities"] as const,
    ],
    options,
  });
}

/* ----- Documents ----- */

type CreateDocumentVariables = {
  caseId: string;
  body: z.input<typeof documentCreateSchema>;
};

export function useCreateDocument(
  options?: ApiMutationOptions<StudentDocument, CreateDocumentVariables>,
) {
  return useApiMutation({
    mutationFn: ({ caseId, body }: CreateDocumentVariables) =>
      studentsApi.createDocument(caseId, body),
    invalidates: (_data, { caseId }) => [
      documentKeys.byCase(caseId),
      checklistKeys.detail(caseId),
      caseKeys.detail(caseId),
    ],
    options,
  });
}

type DeleteDocumentVariables = { id: string; caseId: string };

export function useDeleteDocument(
  options?: ApiMutationOptions<void, DeleteDocumentVariables>,
) {
  return useApiMutation({
    mutationFn: ({ id }: DeleteDocumentVariables) => studentsApi.deleteDocument(id),
    invalidates: (_data, { id, caseId }) => [
      documentKeys.byCase(caseId),
      documentKeys.detail(id),
      checklistKeys.detail(caseId),
      caseKeys.detail(caseId),
    ],
    options,
  });
}

type ReviewDocumentVariables = {
  id: string;
  caseId: string;
  body: z.input<typeof documentReviewSchema>;
  version: number;
};

export function useReviewDocument(
  options?: ApiMutationOptions<StudentDocument, ReviewDocumentVariables>,
) {
  return useApiMutation({
    mutationFn: ({ id, body, version }: ReviewDocumentVariables) =>
      studentsApi.reviewDocument(id, body, { version }),
    invalidates: (_data, { id, caseId }) => [
      documentKeys.byCase(caseId),
      documentKeys.detail(id),
      checklistKeys.detail(caseId),
      caseKeys.detail(caseId),
      [...caseKeys.detail(caseId), "activities"] as const,
    ],
    options,
  });
}

type RevertDocumentVariables = {
  id: string;
  caseId: string;
  body: z.input<typeof documentRevertSchema>;
  version: number;
};

export function useRevertDocument(
  options?: ApiMutationOptions<StudentDocument, RevertDocumentVariables>,
) {
  return useApiMutation({
    mutationFn: ({ id, body, version }: RevertDocumentVariables) =>
      studentsApi.revertDocument(id, body, { version }),
    invalidates: (_data, { id, caseId }) => [
      documentKeys.byCase(caseId),
      documentKeys.detail(id),
      checklistKeys.detail(caseId),
      caseKeys.detail(caseId),
    ],
    options,
  });
}

/* ----- Checklist ----- */

type CreateChecklistItemVariables = {
  caseId: string;
  body: z.input<typeof checklistItemCreateSchema>;
};

export function useCreateChecklistItem(
  options?: ApiMutationOptions<ChecklistItem, CreateChecklistItemVariables>,
) {
  return useApiMutation({
    mutationFn: ({ caseId, body }: CreateChecklistItemVariables) =>
      studentsApi.createChecklistItem(caseId, body),
    invalidates: (_data, { caseId }) => [
      checklistKeys.detail(caseId),
      caseKeys.detail(caseId),
    ],
    options,
  });
}

type UpdateChecklistItemVariables = {
  caseId: string;
  itemId: string;
  body: z.input<typeof checklistItemUpdateSchema>;
};

export function useUpdateChecklistItem(
  options?: ApiMutationOptions<ChecklistItem, UpdateChecklistItemVariables>,
) {
  return useApiMutation({
    mutationFn: ({ caseId, itemId, body }: UpdateChecklistItemVariables) =>
      studentsApi.updateChecklistItem(caseId, itemId, body),
    invalidates: (_data, { caseId }) => [
      checklistKeys.detail(caseId),
      caseKeys.detail(caseId),
    ],
    options,
  });
}

type DeleteChecklistItemVariables = { caseId: string; itemId: string };

export function useDeleteChecklistItem(
  options?: ApiMutationOptions<void, DeleteChecklistItemVariables>,
) {
  return useApiMutation({
    mutationFn: ({ caseId, itemId }: DeleteChecklistItemVariables) =>
      studentsApi.deleteChecklistItem(caseId, itemId),
    invalidates: (_data, { caseId }) => [
      checklistKeys.detail(caseId),
      caseKeys.detail(caseId),
    ],
    options,
  });
}
