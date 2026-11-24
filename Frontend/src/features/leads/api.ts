import { z } from "zod";
import {
  activityCreateSchema,
  activityListQuerySchema,
  activitySchema,
  activityUpdateSchema,
  assessmentReceiptSchema,
  leadAssigneeUpdateSchema,
  leadConvertSchema,
  leadCreateSchema,
  leadDuplicatesSchema,
  leadExportResultSchema,
  leadFromAssessmentSchema,
  leadImportBodySchema,
  leadImportReportSchema,
  leadImportRevertReportSchema,
  leadListQuerySchema,
  leadMergeSchema,
  leadQuickContactSchema,
  leadReceiptSchema,
  leadSchema,
  leadStageUpdateSchema,
  leadStatusUpdateSchema,
  leadUpdateSchema,
  newsletterSubscribeSchema,
} from "@/contracts/leads";
import { studentCaseSchema } from "@/contracts/students";
import {
  apiDelete,
  apiGet,
  apiGetPage,
  apiPatch,
  apiPost,
  apiPostVoid,
  apiPut,
  segment,
  type RequestOptions,
} from "@/lib/api/client";
import type { ListFilters } from "@/lib/api/types";
import { validateRequest } from "@/lib/api/validate";

/** Public visitors must never be bounced to the login page by a stale session */
const PUBLIC: RequestOptions = { skipAuthRedirect: true };

const leadPath = (id: string) => `/leads/${segment(id)}`;

export type LeadListFilters = ListFilters<typeof leadListQuerySchema>;
export type ActivityListFilters = ListFilters<typeof activityListQuerySchema>;

export const leadsApi = {
  /* ----- Public intake ----- */

  createFromAssessment(
    body: z.input<typeof leadFromAssessmentSchema>,
    options?: RequestOptions,
  ) {
    return apiPost(
      "/leads/assessment",
      assessmentReceiptSchema,
      validateRequest(leadFromAssessmentSchema, body),
      { ...PUBLIC, ...options },
    );
  },

  createQuickContact(
    body: z.input<typeof leadQuickContactSchema>,
    options?: RequestOptions,
  ) {
    return apiPost(
      "/leads/quick-contact",
      leadReceiptSchema,
      validateRequest(leadQuickContactSchema, body),
      { ...PUBLIC, ...options },
    );
  },

  subscribeNewsletter(
    body: z.input<typeof newsletterSubscribeSchema>,
    options?: RequestOptions,
  ) {
    return apiPostVoid(
      "/newsletter/subscriptions",
      validateRequest(newsletterSubscribeSchema, body),
      { ...PUBLIC, ...options },
    );
  },

  /* ----- Staff CRUD ----- */

  list(filters?: LeadListFilters, options?: RequestOptions) {
    return apiGetPage("/leads", leadSchema, { ...options, query: filters });
  },

  get(id: string, options?: RequestOptions) {
    return apiGet(leadPath(id), leadSchema, options);
  },

  create(body: z.input<typeof leadCreateSchema>, options?: RequestOptions) {
    return apiPost("/leads", leadSchema, validateRequest(leadCreateSchema, body), options);
  },

  update(
    id: string,
    body: z.input<typeof leadUpdateSchema>,
    options?: RequestOptions & { version?: number },
  ) {
    const { version, ...rest } = options ?? {};
    return apiPatch(
      leadPath(id),
      leadSchema,
      validateRequest(leadUpdateSchema, body),
      {
        ...rest,
        headers: {
          ...rest.headers,
          ...(version !== undefined ? { "If-Match": String(version) } : {}),
        },
      },
    );
  },

  remove(id: string, options?: RequestOptions) {
    return apiDelete(leadPath(id), options);
  },

  /* ----- Pipeline ----- */

  updateStage(
    id: string,
    body: z.input<typeof leadStageUpdateSchema>,
    options?: RequestOptions & { version?: number },
  ) {
    const { version, ...rest } = options ?? {};
    return apiPatch(
      `${leadPath(id)}/stage`,
      leadSchema,
      validateRequest(leadStageUpdateSchema, body),
      {
        ...rest,
        headers: {
          ...rest.headers,
          ...(version !== undefined ? { "If-Match": String(version) } : {}),
        },
      },
    );
  },

  updateStatus(
    id: string,
    body: z.input<typeof leadStatusUpdateSchema>,
    options?: RequestOptions & { version?: number },
  ) {
    const { version, ...rest } = options ?? {};
    return apiPatch(
      `${leadPath(id)}/status`,
      leadSchema,
      validateRequest(leadStatusUpdateSchema, body),
      {
        ...rest,
        headers: {
          ...rest.headers,
          ...(version !== undefined ? { "If-Match": String(version) } : {}),
        },
      },
    );
  },

  /** `assigneeId: null` removes the assignment */
  assign(
    id: string,
    body: z.input<typeof leadAssigneeUpdateSchema>,
    options?: RequestOptions & { version?: number },
  ) {
    const { version, ...rest } = options ?? {};
    return apiPut(
      `${leadPath(id)}/assignee`,
      leadSchema,
      validateRequest(leadAssigneeUpdateSchema, body),
      {
        ...rest,
        headers: {
          ...rest.headers,
          ...(version !== undefined ? { "If-Match": String(version) } : {}),
        },
      },
    );
  },

  importLeads(
    body: z.input<typeof leadImportBodySchema>,
    options?: RequestOptions & { dryRun?: boolean },
  ) {
    const { dryRun, ...rest } = options ?? {};
    return apiPost(
      "/leads/import",
      leadImportReportSchema,
      validateRequest(leadImportBodySchema, body),
      {
        ...rest,
        query:
          dryRun === undefined
            ? undefined
            : { dryRun: dryRun ? "true" : "false" },
      },
    );
  },

  revertImport(importId: string, options?: RequestOptions) {
    return apiPost(
      `/leads/imports/${segment(importId)}/revert`,
      leadImportRevertReportSchema,
      {},
      options,
    );
  },

  exportLeads(
    filters?: Omit<LeadListFilters, "page" | "pageSize"> & {
      columns?: string;
      format?: "csv" | "xlsx";
    },
    options?: RequestOptions,
  ) {
    return apiGet("/leads/export", leadExportResultSchema, {
      ...options,
      query: filters,
    });
  },

  /** @deprecated Prefer `exportLeads` */
  exportCsv(filters?: LeadListFilters, options?: RequestOptions) {
    const { page: _p, pageSize: _ps, ...rest } = filters ?? {};
    void _p;
    void _ps;
    return this.exportLeads({ ...rest, format: "csv" }, options).then(
      (result) => result.content,
    );
  },

  /** Convert into a student case (lead becomes `won`) */
  convertToCase(
    id: string,
    body: z.input<typeof leadConvertSchema>,
    options?: RequestOptions,
  ) {
    return apiPost(
      `${leadPath(id)}/convert`,
      studentCaseSchema,
      validateRequest(leadConvertSchema, body),
      options,
    );
  },

  /* ----- Activities ----- */

  listActivities(
    id: string,
    filters?: ActivityListFilters,
    options?: RequestOptions,
  ) {
    return apiGetPage(`${leadPath(id)}/activities`, activitySchema, {
      ...options,
      query: filters,
    });
  },

  createActivity(
    id: string,
    body: z.input<typeof activityCreateSchema>,
    options?: RequestOptions,
  ) {
    return apiPost(
      `${leadPath(id)}/activities`,
      activitySchema,
      validateRequest(activityCreateSchema, body),
      options,
    );
  },

  updateActivity(
    activityId: string,
    body: z.input<typeof activityUpdateSchema>,
    options?: RequestOptions,
  ) {
    return apiPatch(
      `/activities/${segment(activityId)}`,
      activitySchema,
      validateRequest(activityUpdateSchema, body),
      options,
    );
  },

  deleteActivity(activityId: string, options?: RequestOptions) {
    return apiDelete(`/activities/${segment(activityId)}`, options);
  },

  listDuplicates(id: string, options?: RequestOptions) {
    return apiGet(
      `${leadPath(id)}/duplicates`,
      leadDuplicatesSchema,
      options,
    );
  },

  merge(
    id: string,
    body: z.input<typeof leadMergeSchema>,
    options?: RequestOptions,
  ) {
    return apiPost(
      `${leadPath(id)}/merge`,
      leadSchema,
      validateRequest(leadMergeSchema, body),
      options,
    );
  },
};
