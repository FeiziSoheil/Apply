import { z } from "zod";
import { fileAssetSchema } from "@/contracts/common";
import {
  activityCreateSchema,
  activityListQuerySchema,
  activitySchema,
} from "@/contracts/leads";
import {
  advanceCaseStageSchema,
  checklistItemCreateSchema,
  checklistItemSchema,
  checklistItemUpdateSchema,
  checklistSchema,
  documentCreateSchema,
  documentListQuerySchema,
  documentRevertSchema,
  documentReviewSchema,
  documentSchema,
  stageUpdateSchema,
  studentCaseCreateSchema,
  studentCaseListQuerySchema,
  studentCaseSchema,
  studentCaseUpdateSchema,
  type CaseStage,
} from "@/contracts/students";
import {
  UPLOAD_TIMEOUT_MS,
  apiDelete,
  apiGet,
  apiGetPage,
  apiPatch,
  apiPost,
  apiPut,
  segment,
  type RequestOptions,
} from "@/lib/api/client";
import type { ListFilters } from "@/lib/api/types";
import { validateRequest } from "@/lib/api/validate";

export type CaseListFilters = ListFilters<typeof studentCaseListQuerySchema>;
export type DocumentListFilters = ListFilters<typeof documentListQuerySchema>;
export type CaseActivityListFilters = ListFilters<typeof activityListQuerySchema>;

const casePath = (id: string) => `/cases/${segment(id)}`;
const documentPath = (id: string) => `/documents/${segment(id)}`;
const checklistItemPath = (caseId: string, itemId: string) =>
  `${casePath(caseId)}/checklist/items/${segment(itemId)}`;

export const studentsApi = {
  /* ----- Files ----- */

  /** Upload first, then reference `FileAsset.id` in a document / ticket message */
  uploadFile(file: File, options?: RequestOptions) {
    const body = new FormData();
    body.append("file", file);
    return apiPost("/files", fileAssetSchema, body, {
      timeoutMs: UPLOAD_TIMEOUT_MS,
      ...options,
    });
  },

  /* ----- Cases ----- */

  listCases(filters?: CaseListFilters, options?: RequestOptions) {
    return apiGetPage("/cases", studentCaseSchema, { ...options, query: filters });
  },

  listMyCases(options?: RequestOptions) {
    return apiGet("/me/cases", z.array(studentCaseSchema), options);
  },

  getCase(id: string, options?: RequestOptions) {
    return apiGet(casePath(id), studentCaseSchema, options);
  },

  createCase(body: z.input<typeof studentCaseCreateSchema>, options?: RequestOptions) {
    return apiPost("/cases", studentCaseSchema, validateRequest(studentCaseCreateSchema, body), options);
  },

  updateCase(
    id: string,
    body: z.input<typeof studentCaseUpdateSchema>,
    options?: RequestOptions & { version?: number },
  ) {
    const { version, ...rest } = options ?? {};
    return apiPatch(
      casePath(id),
      studentCaseSchema,
      validateRequest(studentCaseUpdateSchema, body),
      {
        ...rest,
        headers: {
          ...rest.headers,
          ...(version !== undefined ? { "If-Match": String(version) } : {}),
        },
      },
    );
  },

  updateCaseStage(
    id: string,
    stage: CaseStage,
    body: z.input<typeof stageUpdateSchema>,
    options?: RequestOptions & { version?: number },
  ) {
    const { version, ...rest } = options ?? {};
    return apiPut(
      `${casePath(id)}/stages/${segment(stage)}`,
      studentCaseSchema,
      validateRequest(stageUpdateSchema, body),
      {
        ...rest,
        headers: {
          ...rest.headers,
          ...(version !== undefined ? { "If-Match": String(version) } : {}),
        },
      },
    );
  },

  advanceCaseStage(
    id: string,
    body: z.input<typeof advanceCaseStageSchema>,
    options?: RequestOptions & { version?: number },
  ) {
    const { version, ...rest } = options ?? {};
    return apiPost(
      `${casePath(id)}/advance-stage`,
      studentCaseSchema,
      validateRequest(advanceCaseStageSchema, body),
      {
        ...rest,
        headers: {
          ...rest.headers,
          ...(version !== undefined ? { "If-Match": String(version) } : {}),
        },
      },
    );
  },

  /* ----- Activities ----- */

  listActivities(
    caseId: string,
    filters?: CaseActivityListFilters,
    options?: RequestOptions,
  ) {
    return apiGetPage(`${casePath(caseId)}/activities`, activitySchema, {
      ...options,
      query: filters,
    });
  },

  createActivity(
    caseId: string,
    body: z.input<typeof activityCreateSchema>,
    options?: RequestOptions,
  ) {
    return apiPost(
      `${casePath(caseId)}/activities`,
      activitySchema,
      validateRequest(activityCreateSchema, body),
      options,
    );
  },

  /* ----- Documents ----- */

  listDocuments(
    caseId: string,
    filters?: DocumentListFilters,
    options?: RequestOptions,
  ) {
    return apiGetPage(`${casePath(caseId)}/documents`, documentSchema, {
      ...options,
      query: filters,
    });
  },

  createDocument(
    caseId: string,
    body: z.input<typeof documentCreateSchema>,
    options?: RequestOptions,
  ) {
    return apiPost(
      `${casePath(caseId)}/documents`,
      documentSchema,
      validateRequest(documentCreateSchema, body),
      options,
    );
  },

  getDocument(id: string, options?: RequestOptions) {
    return apiGet(documentPath(id), documentSchema, options);
  },

  deleteDocument(id: string, options?: RequestOptions) {
    return apiDelete(documentPath(id), options);
  },

  /** Staff: approve or reject a pending document */
  reviewDocument(
    id: string,
    body: z.input<typeof documentReviewSchema>,
    options?: RequestOptions & { version?: number },
  ) {
    const { version, ...rest } = options ?? {};
    return apiPost(
      `${documentPath(id)}/review`,
      documentSchema,
      validateRequest(documentReviewSchema, body),
      {
        ...rest,
        headers: {
          ...rest.headers,
          ...(version !== undefined ? { "If-Match": String(version) } : {}),
        },
      },
    );
  },

  revertDocument(
    id: string,
    body: z.input<typeof documentRevertSchema>,
    options?: RequestOptions & { version?: number },
  ) {
    const { version, ...rest } = options ?? {};
    return apiPost(
      `${documentPath(id)}/revert`,
      documentSchema,
      validateRequest(documentRevertSchema, body),
      {
        ...rest,
        headers: {
          ...rest.headers,
          ...(version !== undefined ? { "If-Match": String(version) } : {}),
        },
      },
    );
  },

  /* ----- Checklist ----- */

  getChecklist(caseId: string, options?: RequestOptions) {
    return apiGet(`${casePath(caseId)}/checklist`, checklistSchema, options);
  },

  createChecklistItem(
    caseId: string,
    body: z.input<typeof checklistItemCreateSchema>,
    options?: RequestOptions,
  ) {
    return apiPost(
      `${casePath(caseId)}/checklist/items`,
      checklistItemSchema,
      validateRequest(checklistItemCreateSchema, body),
      options,
    );
  },

  /** Students may only toggle `done` */
  updateChecklistItem(
    caseId: string,
    itemId: string,
    body: z.input<typeof checklistItemUpdateSchema>,
    options?: RequestOptions,
  ) {
    return apiPatch(
      checklistItemPath(caseId, itemId),
      checklistItemSchema,
      validateRequest(checklistItemUpdateSchema, body),
      options,
    );
  },

  deleteChecklistItem(caseId: string, itemId: string, options?: RequestOptions) {
    return apiDelete(checklistItemPath(caseId, itemId), options);
  },
};
