import type { z } from "zod";
import {
  caseTemplateSchema,
  lostReasonSchema,
  messageTemplateSchema,
  pipelineStageSchema,
  renderTemplateInputSchema,
  renderTemplateResultSchema,
  savedViewCreateSchema,
  savedViewListQuerySchema,
  savedViewSchema,
  savedViewUpdateSchema,
  tagSchema,
  taskBulkCompleteSchema,
  taskCountsQuerySchema,
  taskCountsSchema,
  taskCreateSchema,
  taskListQuerySchema,
  taskProcessRemindersResultSchema,
  taskSchema,
  taskSnoozeSchema,
  taskUpdateSchema,
} from "@/contracts/crm";
import {
  apiDelete,
  apiGet,
  apiGetPage,
  apiPatch,
  apiPost,
  segment,
  type RequestOptions,
} from "@/lib/api/client";
import type { ListFilters } from "@/lib/api/types";
import { validateRequest } from "@/lib/api/validate";
import { z as zod } from "@/contracts/zod";

export type SavedViewListFilters = ListFilters<typeof savedViewListQuerySchema>;
export type TaskListFilters = ListFilters<typeof taskListQuerySchema>;
export type TaskCountsFilters = z.input<typeof taskCountsQuerySchema>;

const tasksArray = zod.array(taskSchema);

const stagesArray = zod.array(pipelineStageSchema);
const tagsArray = zod.array(tagSchema);
const lostReasonsArray = zod.array(lostReasonSchema);
const templatesArray = zod.array(messageTemplateSchema);
const caseTemplatesArray = zod.array(caseTemplateSchema);

export const crmApi = {
  listPipelineStages(options?: RequestOptions) {
    return apiGet("/pipeline/stages", stagesArray, options);
  },

  listTags(options?: RequestOptions) {
    return apiGet("/tags", tagsArray, options);
  },

  listLostReasons(options?: RequestOptions) {
    return apiGet("/lost-reasons", lostReasonsArray, options);
  },

  listMessageTemplates(options?: RequestOptions) {
    return apiGet("/message-templates", templatesArray, options);
  },

  listCaseTemplates(options?: RequestOptions) {
    return apiGet("/case-templates", caseTemplatesArray, options);
  },

  renderTemplate(
    body: z.input<typeof renderTemplateInputSchema>,
    options?: RequestOptions,
  ) {
    return apiPost(
      "/message-templates/render",
      renderTemplateResultSchema,
      validateRequest(renderTemplateInputSchema, body),
      options,
    );
  },

  listTasks(filters?: TaskListFilters, options?: RequestOptions) {
    return apiGetPage("/tasks", taskSchema, { ...options, query: filters });
  },

  getTaskCounts(filters?: TaskCountsFilters, options?: RequestOptions) {
    return apiGet("/tasks/counts", taskCountsSchema, {
      ...options,
      query: filters,
    });
  },

  createTask(
    body: z.input<typeof taskCreateSchema>,
    options?: RequestOptions,
  ) {
    return apiPost(
      "/tasks",
      taskSchema,
      validateRequest(taskCreateSchema, body),
      options,
    );
  },

  updateTask(
    id: string,
    body: z.input<typeof taskUpdateSchema>,
    options?: RequestOptions & { version?: number },
  ) {
    const { version, ...rest } = options ?? {};
    return apiPatch(
      `/tasks/${segment(id)}`,
      taskSchema,
      validateRequest(taskUpdateSchema, body),
      {
        ...rest,
        headers: {
          ...rest.headers,
          ...(version !== undefined ? { "If-Match": String(version) } : {}),
        },
      },
    );
  },

  completeTask(id: string, options?: RequestOptions) {
    return apiPost(`/tasks/${segment(id)}/complete`, taskSchema, {}, options);
  },

  bulkCompleteTasks(
    body: z.input<typeof taskBulkCompleteSchema>,
    options?: RequestOptions,
  ) {
    return apiPost(
      "/tasks/bulk-complete",
      tasksArray,
      validateRequest(taskBulkCompleteSchema, body),
      options,
    );
  },

  snoozeTask(
    id: string,
    body: z.input<typeof taskSnoozeSchema>,
    options?: RequestOptions & { version?: number },
  ) {
    const { version, ...rest } = options ?? {};
    return apiPost(
      `/tasks/${segment(id)}/snooze`,
      taskSchema,
      validateRequest(taskSnoozeSchema, body),
      {
        ...rest,
        headers: {
          ...rest.headers,
          ...(version !== undefined ? { "If-Match": String(version) } : {}),
        },
      },
    );
  },

  processTaskReminders(options?: RequestOptions) {
    return apiPost(
      "/tasks/process-reminders",
      taskProcessRemindersResultSchema,
      {},
      options,
    );
  },

  deleteTask(id: string, options?: RequestOptions) {
    return apiDelete(`/tasks/${segment(id)}`, options);
  },

  listSavedViews(filters?: SavedViewListFilters, options?: RequestOptions) {
    return apiGetPage("/saved-views", savedViewSchema, {
      ...options,
      query: filters,
    });
  },

  createSavedView(
    body: z.input<typeof savedViewCreateSchema>,
    options?: RequestOptions,
  ) {
    return apiPost(
      "/saved-views",
      savedViewSchema,
      validateRequest(savedViewCreateSchema, body),
      options,
    );
  },

  updateSavedView(
    id: string,
    body: z.input<typeof savedViewUpdateSchema>,
    options?: RequestOptions,
  ) {
    return apiPatch(
      `/saved-views/${segment(id)}`,
      savedViewSchema,
      validateRequest(savedViewUpdateSchema, body),
      options,
    );
  },

  deleteSavedView(id: string, options?: RequestOptions) {
    return apiDelete(`/saved-views/${segment(id)}`, options);
  },
};
