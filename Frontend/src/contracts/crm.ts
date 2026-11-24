import {
  auditFields,
  idSchema,
  isoDateTimeSchema,
  listQuerySchema,
  queryBooleanSchema,
  rialsSchema,
  slugSchema,
  versionSchema,
} from "./common";
import { z } from "./zod";

/* -------------------------------------------------------------------------- */
/*  Pipeline                                                                  */
/* -------------------------------------------------------------------------- */

export const PIPELINE_STAGE_KINDS = ["new", "open", "won", "lost"] as const;
export const pipelineStageKindSchema = z
  .enum(PIPELINE_STAGE_KINDS)
  .openapi("PipelineStageKind");
export type PipelineStageKind = z.infer<typeof pipelineStageKindSchema>;

/** Design-token color keys used by stage chips (not raw hex) */
export const PIPELINE_STAGE_COLORS = [
  "slate",
  "blue",
  "cyan",
  "violet",
  "amber",
  "emerald",
  "rose",
] as const;
export const pipelineStageColorSchema = z
  .enum(PIPELINE_STAGE_COLORS)
  .openapi("PipelineStageColor");
export type PipelineStageColor = z.infer<typeof pipelineStageColorSchema>;

const stageKeySchema = z
  .string()
  .min(1)
  .max(60)
  .regex(/^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/, "کلید مرحله باید snake_case باشد")
  .openapi({ example: "first_contact" });

export const pipelineStageSchema = z
  .object({
    id: idSchema,
    key: stageKeySchema.describe("یکتا در کل پایپ‌لاین"),
    title: z.string().min(1).max(80).describe("عنوان فارسی"),
    order: z.number().int().min(0),
    color: pipelineStageColorSchema,
    kind: pipelineStageKindSchema,
    wipLimit: z
      .number()
      .int()
      .min(1)
      .nullable()
      .describe("سقف WIP اختیاری؛ null = بدون سقف"),
    ...auditFields,
  })
  .openapi("PipelineStage");
export type PipelineStage = z.infer<typeof pipelineStageSchema>;

export const pipelineStageCreateSchema = z
  .object({
    key: stageKeySchema,
    title: z.string().trim().min(1).max(80),
    order: z.number().int().min(0).optional(),
    color: pipelineStageColorSchema.default("slate"),
    kind: pipelineStageKindSchema,
    wipLimit: z.number().int().min(1).nullable().optional(),
  })
  .openapi("PipelineStageCreate");
export type PipelineStageCreate = z.infer<typeof pipelineStageCreateSchema>;

export const pipelineStageUpdateSchema = pipelineStageCreateSchema
  .partial()
  .openapi("PipelineStageUpdate");
export type PipelineStageUpdate = z.infer<typeof pipelineStageUpdateSchema>;

export const pipelineStageReorderSchema = z
  .object({
    items: z
      .array(z.object({ id: idSchema, order: z.number().int().min(0) }))
      .min(1),
  })
  .openapi("PipelineStageReorder");
export type PipelineStageReorder = z.infer<typeof pipelineStageReorderSchema>;

/* -------------------------------------------------------------------------- */
/*  Lost reasons & tags                                                       */
/* -------------------------------------------------------------------------- */

export const lostReasonSchema = z
  .object({
    id: idSchema,
    title: z.string().min(1).max(120),
    active: z.boolean(),
    ...auditFields,
  })
  .openapi("LostReason");
export type LostReason = z.infer<typeof lostReasonSchema>;

export const lostReasonCreateSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    active: z.boolean().default(true),
  })
  .openapi("LostReasonCreate");
export type LostReasonCreate = z.infer<typeof lostReasonCreateSchema>;

export const lostReasonUpdateSchema = lostReasonCreateSchema
  .partial()
  .openapi("LostReasonUpdate");
export type LostReasonUpdate = z.infer<typeof lostReasonUpdateSchema>;

export const tagSchema = z
  .object({
    id: idSchema,
    title: z.string().min(1).max(60),
    color: pipelineStageColorSchema,
    ...auditFields,
  })
  .openapi("Tag");
export type Tag = z.infer<typeof tagSchema>;

export const tagCreateSchema = z
  .object({
    title: z.string().trim().min(1).max(60),
    color: pipelineStageColorSchema.default("slate"),
  })
  .openapi("TagCreate");
export type TagCreate = z.infer<typeof tagCreateSchema>;

export const tagUpdateSchema = tagCreateSchema.partial().openapi("TagUpdate");
export type TagUpdate = z.infer<typeof tagUpdateSchema>;

/* -------------------------------------------------------------------------- */
/*  Tasks                                                                     */
/* -------------------------------------------------------------------------- */

export const TASK_STATUSES = ["open", "done", "cancelled"] as const;
export const taskStatusSchema = z.enum(TASK_STATUSES).openapi("TaskStatus");
export type TaskStatus = z.infer<typeof taskStatusSchema>;

export const TASK_PRIORITIES = ["low", "normal", "high"] as const;
export const taskPrioritySchema = z.enum(TASK_PRIORITIES).openapi("TaskPriority");
export type TaskPriority = z.infer<typeof taskPrioritySchema>;

export const TASK_RELATED_TYPES = ["lead", "case", "booking", "none"] as const;
export const taskRelatedTypeSchema = z
  .enum(TASK_RELATED_TYPES)
  .openapi("TaskRelatedType");
export type TaskRelatedType = z.infer<typeof taskRelatedTypeSchema>;

export const TASK_DUE_FILTERS = [
  "overdue",
  "today",
  "week",
  "upcoming",
  "custom",
] as const;
export const taskDueFilterSchema = z.enum(TASK_DUE_FILTERS).openapi("TaskDueFilter");
export type TaskDueFilter = z.infer<typeof taskDueFilterSchema>;

export const TASK_SNOOZE_PRESETS = [
  "1h",
  "3h",
  "tomorrow",
  "next_week",
] as const;
export const taskSnoozePresetSchema = z
  .enum(TASK_SNOOZE_PRESETS)
  .openapi("TaskSnoozePreset");
export type TaskSnoozePreset = z.infer<typeof taskSnoozePresetSchema>;

export const taskSchema = z
  .object({
    id: idSchema,
    title: z.string().min(1).max(160),
    description: z.string().max(2000).nullable(),
    dueAt: isoDateTimeSchema,
    remindAt: isoDateTimeSchema.nullable(),
    status: taskStatusSchema,
    priority: taskPrioritySchema,
    assigneeId: idSchema,
    relatedType: taskRelatedTypeSchema,
    relatedId: idSchema.nullable(),
    completedAt: isoDateTimeSchema.nullable(),
    createdBy: idSchema,
    version: versionSchema,
    ...auditFields,
  })
  .openapi("Task");
export type Task = z.infer<typeof taskSchema>;

export const taskCreateSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().max(2000).optional(),
    dueAt: isoDateTimeSchema,
    remindAt: isoDateTimeSchema.optional(),
    priority: taskPrioritySchema.default("normal"),
    assigneeId: idSchema,
    relatedType: taskRelatedTypeSchema.default("none"),
    relatedId: idSchema.optional(),
  })
  .refine(
    (data) => data.relatedType === "none" || Boolean(data.relatedId),
    { path: ["relatedId"], message: "شناسه مرتبط برای این نوع الزامی است" },
  )
  .openapi("TaskCreate");
export type TaskCreate = z.infer<typeof taskCreateSchema>;

export const taskUpdateSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().max(2000).nullable(),
    dueAt: isoDateTimeSchema,
    remindAt: isoDateTimeSchema.nullable(),
    priority: taskPrioritySchema,
    assigneeId: idSchema,
    relatedType: taskRelatedTypeSchema,
    relatedId: idSchema.nullable(),
    status: taskStatusSchema,
  })
  .partial()
  .openapi("TaskUpdate");
export type TaskUpdate = z.infer<typeof taskUpdateSchema>;

export const taskBulkCompleteSchema = z
  .object({
    ids: z.array(idSchema).min(1).max(100),
  })
  .openapi("TaskBulkComplete");
export type TaskBulkComplete = z.infer<typeof taskBulkCompleteSchema>;

export const taskSnoozeSchema = z
  .object({
    preset: taskSnoozePresetSchema.optional(),
    until: isoDateTimeSchema.optional(),
  })
  .refine((data) => Boolean(data.preset) || Boolean(data.until), {
    message: "یکی از preset یا until الزامی است",
    path: ["preset"],
  })
  .openapi("TaskSnooze");
export type TaskSnooze = z.infer<typeof taskSnoozeSchema>;

export const taskCountsSchema = z
  .object({
    today: z.number().int().min(0),
    overdue: z.number().int().min(0),
    week: z.number().int().min(0),
    upcoming: z.number().int().min(0),
    done: z.number().int().min(0),
  })
  .openapi("TaskCounts");
export type TaskCounts = z.infer<typeof taskCountsSchema>;

export const taskCountsQuerySchema = z
  .object({
    assigneeId: idSchema.optional(),
  })
  .openapi("TaskCountsQuery");
export type TaskCountsQuery = z.infer<typeof taskCountsQuerySchema>;

export const taskProcessRemindersResultSchema = z
  .object({
    created: z.number().int().min(0),
  })
  .openapi("TaskProcessRemindersResult");
export type TaskProcessRemindersResult = z.infer<
  typeof taskProcessRemindersResultSchema
>;

export const TASK_SORT_FIELDS = ["dueAt", "createdAt", "priority", "status"] as const;
export const taskListQuerySchema = listQuerySchema(TASK_SORT_FIELDS, {
  assigneeId: idSchema.optional(),
  status: taskStatusSchema.optional(),
  due: taskDueFilterSchema.optional(),
  relatedType: taskRelatedTypeSchema.optional(),
  relatedId: idSchema.optional(),
  dueFrom: isoDateTimeSchema.optional(),
  dueTo: isoDateTimeSchema.optional(),
  priority: taskPrioritySchema.optional(),
});
export type TaskListQuery = z.infer<typeof taskListQuerySchema>;

/* -------------------------------------------------------------------------- */
/*  Assignment rules                                                          */
/* -------------------------------------------------------------------------- */

export const ASSIGNMENT_STRATEGIES = [
  "fixed",
  "round_robin",
  "least_loaded",
] as const;
export const assignmentStrategySchema = z
  .enum(ASSIGNMENT_STRATEGIES)
  .openapi("AssignmentStrategy");
export type AssignmentStrategy = z.infer<typeof assignmentStrategySchema>;

export const assignmentConditionSchema = z
  .discriminatedUnion("type", [
    z.object({
      type: z.literal("target_country"),
      countrySlug: slugSchema,
    }),
    z.object({
      type: z.literal("source"),
      source: z.string().min(1).max(40),
    }),
    z.object({
      type: z.literal("utm_campaign"),
      campaign: z.string().min(1).max(100),
    }),
    z.object({ type: z.literal("always") }),
  ])
  .openapi("AssignmentCondition");
export type AssignmentCondition = z.infer<typeof assignmentConditionSchema>;

export const assignmentRuleSchema = z
  .object({
    id: idSchema,
    order: z.number().int().min(0),
    active: z.boolean(),
    conditions: z
      .array(assignmentConditionSchema)
      .min(1)
      .describe("همه شرط‌ها با AND؛ `always` یعنی بدون شرط"),
    strategy: assignmentStrategySchema,
    consultantIds: z
      .array(idSchema)
      .min(1)
      .describe("برای fixed فقط اولین شناسه استفاده می‌شود"),
    ...auditFields,
  })
  .openapi("AssignmentRule");
export type AssignmentRule = z.infer<typeof assignmentRuleSchema>;

export const assignmentRuleCreateSchema = z
  .object({
    order: z.number().int().min(0).optional(),
    active: z.boolean().default(true),
    conditions: z.array(assignmentConditionSchema).min(1),
    strategy: assignmentStrategySchema,
    consultantIds: z.array(idSchema).min(1),
  })
  .openapi("AssignmentRuleCreate");
export type AssignmentRuleCreate = z.infer<typeof assignmentRuleCreateSchema>;

export const assignmentRuleUpdateSchema = assignmentRuleCreateSchema
  .partial()
  .openapi("AssignmentRuleUpdate");
export type AssignmentRuleUpdate = z.infer<typeof assignmentRuleUpdateSchema>;

/* -------------------------------------------------------------------------- */
/*  Message templates                                                         */
/* -------------------------------------------------------------------------- */

export const MESSAGE_CHANNELS = ["sms", "whatsapp", "email", "ticket"] as const;
export const messageChannelSchema = z
  .enum(MESSAGE_CHANNELS)
  .openapi("MessageChannel");
export type MessageChannel = z.infer<typeof messageChannelSchema>;

export const TEMPLATE_VARIABLES = [
  "name",
  "consultant",
  "date",
  "time",
  "country",
  "ticket_code",
  "subject",
] as const;
export const templateVariableSchema = z
  .enum(TEMPLATE_VARIABLES)
  .openapi("TemplateVariable");
export type TemplateVariable = z.infer<typeof templateVariableSchema>;

export const messageTemplateSchema = z
  .object({
    id: idSchema,
    channel: messageChannelSchema,
    title: z.string().min(1).max(120),
    body: z
      .string()
      .min(1)
      .max(2000)
      .describe(
        "متغیرها: {name} {consultant} {date} {time} {country} {ticket_code} {subject}",
      ),
    active: z.boolean(),
    ...auditFields,
  })
  .openapi("MessageTemplate");
export type MessageTemplate = z.infer<typeof messageTemplateSchema>;

export const messageTemplateCreateSchema = z
  .object({
    channel: messageChannelSchema,
    title: z.string().trim().min(1).max(120),
    body: z.string().trim().min(1).max(2000),
    active: z.boolean().default(true),
  })
  .openapi("MessageTemplateCreate");
export type MessageTemplateCreate = z.infer<typeof messageTemplateCreateSchema>;

export const messageTemplateUpdateSchema = messageTemplateCreateSchema
  .partial()
  .openapi("MessageTemplateUpdate");
export type MessageTemplateUpdate = z.infer<typeof messageTemplateUpdateSchema>;

export const renderTemplateInputSchema = z
  .object({
    templateId: idSchema.optional(),
    body: z.string().min(1).max(2000).optional(),
    variables: z.record(templateVariableSchema, z.string().max(200)),
  })
  .refine((data) => Boolean(data.templateId) || Boolean(data.body), {
    path: ["body"],
    message: "شناسه قالب یا متن بدنه الزامی است",
  })
  .openapi("RenderTemplateInput");
export type RenderTemplateInput = z.infer<typeof renderTemplateInputSchema>;

export const renderTemplateResultSchema = z
  .object({
    body: z.string(),
    missingVariables: z.array(templateVariableSchema),
  })
  .openapi("RenderTemplateResult");
export type RenderTemplateResult = z.infer<typeof renderTemplateResultSchema>;

/**
 * Replace `{var}` placeholders. Unknown vars are left intact and listed in
 * `missingVariables` when not provided in `variables`.
 */
export function renderTemplate(
  body: string,
  variables: Partial<Record<TemplateVariable, string>>,
): RenderTemplateResult {
  const used = new Set<TemplateVariable>();
  const missingVariables: TemplateVariable[] = [];
  const rendered = body.replace(/\{([a-z_]+)\}/g, (match, key: string) => {
    if (!(TEMPLATE_VARIABLES as readonly string[]).includes(key)) return match;
    const variable = key as TemplateVariable;
    used.add(variable);
    const value = variables[variable];
    if (value === undefined || value === "") {
      if (!missingVariables.includes(variable)) missingVariables.push(variable);
      return match;
    }
    return value;
  });
  for (const variable of TEMPLATE_VARIABLES) {
    if (used.has(variable)) continue;
  }
  return { body: rendered, missingVariables };
}

export function extractTemplateVariables(body: string): TemplateVariable[] {
  const found = new Set<TemplateVariable>();
  for (const match of body.matchAll(/\{([a-z_]+)\}/g)) {
    const key = match[1];
    if ((TEMPLATE_VARIABLES as readonly string[]).includes(key)) {
      found.add(key as TemplateVariable);
    }
  }
  return [...found];
}

/* -------------------------------------------------------------------------- */
/*  Saved views                                                               */
/* -------------------------------------------------------------------------- */

export const SAVED_VIEW_RESOURCES = ["leads", "cases", "tasks"] as const;
export const savedViewResourceSchema = z
  .enum(SAVED_VIEW_RESOURCES)
  .openapi("SavedViewResource");
export type SavedViewResource = z.infer<typeof savedViewResourceSchema>;

export const savedViewSchema = z
  .object({
    id: idSchema,
    ownerId: idSchema,
    resource: savedViewResourceSchema,
    title: z.string().min(1).max(80),
    filters: z
      .record(z.string(), z.unknown())
      .describe("فیلترهای اعتبارسنجی‌شدهٔ همان منبع"),
    sort: z.string().max(40).nullable(),
    columns: z.array(z.string().max(40)).nullable(),
    shared: z.boolean(),
    ...auditFields,
  })
  .openapi("SavedView");
export type SavedView = z.infer<typeof savedViewSchema>;

export const savedViewCreateSchema = z
  .object({
    resource: savedViewResourceSchema,
    title: z.string().trim().min(1).max(80),
    filters: z.record(z.string(), z.unknown()).default({}),
    sort: z.string().max(40).optional(),
    columns: z.array(z.string().max(40)).optional(),
    shared: z.boolean().default(false),
  })
  .openapi("SavedViewCreate");
export type SavedViewCreate = z.infer<typeof savedViewCreateSchema>;

export const savedViewUpdateSchema = savedViewCreateSchema
  .omit({ resource: true })
  .partial()
  .openapi("SavedViewUpdate");
export type SavedViewUpdate = z.infer<typeof savedViewUpdateSchema>;

export const savedViewListQuerySchema = listQuerySchema(["createdAt", "title"], {
  resource: savedViewResourceSchema.optional(),
  shared: queryBooleanSchema.optional(),
});
export type SavedViewListQuery = z.infer<typeof savedViewListQuerySchema>;

/* -------------------------------------------------------------------------- */
/*  Notifications                                                             */
/* -------------------------------------------------------------------------- */

export const NOTIFICATION_TYPES = [
  "lead_assigned",
  "lead_new",
  "task_due",
  "task_assigned",
  "booking_new",
  "document_uploaded",
  "document_approved",
  "document_rejected",
  "ticket_new",
  "mention",
  /** Student panel */
  "stage_changed",
  "installment_due",
  "ticket_reply",
  "appointment_reminder",
  "announcement",
] as const;
export const notificationTypeSchema = z
  .enum(NOTIFICATION_TYPES)
  .openapi("NotificationType");
export type NotificationType = z.infer<typeof notificationTypeSchema>;

export const notificationSchema = z
  .object({
    id: idSchema,
    userId: idSchema,
    type: notificationTypeSchema,
    title: z.string().min(1).max(160),
    body: z.string().min(1).max(500),
    link: z.string().min(1).max(300),
    readAt: isoDateTimeSchema.nullable(),
    createdAt: isoDateTimeSchema,
  })
  .openapi("Notification");
export type Notification = z.infer<typeof notificationSchema>;

export const notificationListQuerySchema = listQuerySchema(["createdAt"], {
  unread: queryBooleanSchema.optional(),
  type: notificationTypeSchema.optional(),
});
export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>;

export const unreadCountSchema = z
  .object({ count: z.number().int().min(0) })
  .openapi("UnreadNotificationCount");
export type UnreadNotificationCount = z.infer<typeof unreadCountSchema>;

export const notificationBulkReadSchema = z
  .object({
    ids: z
      .array(idSchema)
      .min(1)
      .max(100)
      .describe("شناسه‌های اعلان برای علامت‌گذاری خوانده‌شده"),
  })
  .openapi("NotificationBulkRead");
export type NotificationBulkRead = z.infer<typeof notificationBulkReadSchema>;

/** Per-type channel preferences (SMS is UI+persist only; no real SMS send). */
export const notificationTypePreferenceSchema = z
  .object({
    type: notificationTypeSchema,
    inApp: z.boolean().default(true),
    sms: z.boolean().default(false),
  })
  .openapi("NotificationTypePreference");
export type NotificationTypePreference = z.infer<
  typeof notificationTypePreferenceSchema
>;

export const notificationPreferencesSchema = z
  .object({
    userId: idSchema,
    preferences: z.array(notificationTypePreferenceSchema),
    updatedAt: isoDateTimeSchema,
  })
  .openapi("NotificationPreferences");
export type NotificationPreferences = z.infer<
  typeof notificationPreferencesSchema
>;

export const notificationPreferencesUpdateSchema = z
  .object({
    preferences: z.array(notificationTypePreferenceSchema).min(1),
  })
  .openapi("NotificationPreferencesUpdate");
export type NotificationPreferencesUpdate = z.infer<
  typeof notificationPreferencesUpdateSchema
>;

/* -------------------------------------------------------------------------- */
/*  Audit log                                                                 */
/* -------------------------------------------------------------------------- */

export const AUDIT_ACTIONS = [
  "create",
  "update",
  "delete",
  "assign",
  "stage_change",
  "import",
  "export",
  "merge",
  "login",
  "permission_change",
] as const;
export const auditActionSchema = z.enum(AUDIT_ACTIONS).openapi("AuditAction");
export type AuditAction = z.infer<typeof auditActionSchema>;

/**
 * Fields stripped from AuditLog.diff before/after maps.
 * Mock + real backends MUST never persist these keys in audit diffs.
 * Location of runtime blacklist: `src/mocks/domain-events.ts` (`AUDIT_SENSITIVE_FIELDS`).
 */
export const AUDIT_SENSITIVE_FIELDS = [
  "password",
  "token",
  "otp",
  "accessToken",
  "refreshToken",
  "temporaryPassword",
  "content",
  "documentContent",
  "fileContent",
  "rawHtml",
  "html",
  /** نام اصلی فایل دانشجو هرگز در Audit ذخیره نشود — فقط fileId */
  "fileName",
  "originalFileName",
  "originalName",
] as const;
export type AuditSensitiveField = (typeof AUDIT_SENSITIVE_FIELDS)[number];

export const auditDiffSchema = z
  .object({
    before: z.record(z.string(), z.unknown()).nullable(),
    after: z.record(z.string(), z.unknown()).nullable(),
  })
  .openapi("AuditDiff");
export type AuditDiff = z.infer<typeof auditDiffSchema>;

export const auditLogSchema = z
  .object({
    id: idSchema,
    actorId: idSchema.nullable().describe("null = سیستم"),
    action: auditActionSchema,
    entityType: z.string().min(1).max(40),
    entityId: idSchema.nullable(),
    diff: auditDiffSchema.nullable(),
    ip: z.string().max(64).nullable(),
    createdAt: isoDateTimeSchema,
  })
  .openapi("AuditLog");
export type AuditLog = z.infer<typeof auditLogSchema>;

export const auditLogListQuerySchema = listQuerySchema(["createdAt"], {
  actorId: idSchema.optional(),
  entityType: z.string().max(40).optional(),
  entityId: idSchema.optional(),
  action: auditActionSchema.optional(),
  from: isoDateTimeSchema.optional(),
  to: isoDateTimeSchema.optional(),
});
export type AuditLogListQuery = z.infer<typeof auditLogListQuerySchema>;

/* -------------------------------------------------------------------------- */
/*  Reports                                                                   */
/* -------------------------------------------------------------------------- */

export const reportRangeQuerySchema = z
  .object({
    from: isoDateTimeSchema,
    to: isoDateTimeSchema,
    consultantId: idSchema.optional().describe("فقط admin؛ مشاور همیشه خودش"),
  })
  .openapi("ReportRangeQuery");
export type ReportRangeQuery = z.infer<typeof reportRangeQuerySchema>;

export const funnelReportSchema = z
  .object({
    from: isoDateTimeSchema,
    to: isoDateTimeSchema,
    stages: z.array(
      z.object({
        stageId: idSchema,
        key: z.string(),
        title: z.string(),
        kind: pipelineStageKindSchema,
        count: z.number().int().min(0),
        valueRials: rialsSchema,
      }),
    ),
    conversionRate: z.number().min(0).max(1),
  })
  .openapi("FunnelReport");
export type FunnelReport = z.infer<typeof funnelReportSchema>;

export const consultantsReportSchema = z
  .object({
    from: isoDateTimeSchema,
    to: isoDateTimeSchema,
    rows: z.array(
      z.object({
        consultantId: idSchema,
        name: z.string(),
        leadsAssigned: z.number().int().min(0),
        leadsWon: z.number().int().min(0),
        leadsLost: z.number().int().min(0),
        openTasks: z.number().int().min(0),
        conversionRate: z.number().min(0).max(1),
      }),
    ),
  })
  .openapi("ConsultantsReport");
export type ConsultantsReport = z.infer<typeof consultantsReportSchema>;

export const sourcesReportSchema = z
  .object({
    from: isoDateTimeSchema,
    to: isoDateTimeSchema,
    rows: z.array(
      z.object({
        source: z.string(),
        count: z.number().int().min(0),
        won: z.number().int().min(0),
        lost: z.number().int().min(0),
        conversionRate: z.number().min(0).max(1),
      }),
    ),
  })
  .openapi("SourcesReport");
export type SourcesReport = z.infer<typeof sourcesReportSchema>;

export const TIMESERIES_METRICS = [
  "leads_created",
  "leads_won",
  "leads_lost",
  "tasks_done",
  "bookings_created",
] as const;
export const timeseriesMetricSchema = z
  .enum(TIMESERIES_METRICS)
  .openapi("TimeseriesMetric");
export type TimeseriesMetric = z.infer<typeof timeseriesMetricSchema>;

export const TIMESERIES_GRANULARITIES = ["day", "week", "month"] as const;
export const timeseriesGranularitySchema = z
  .enum(TIMESERIES_GRANULARITIES)
  .openapi("TimeseriesGranularity");
export type TimeseriesGranularity = z.infer<typeof timeseriesGranularitySchema>;

export const timeseriesReportQuerySchema = reportRangeQuerySchema
  .extend({
    metric: timeseriesMetricSchema,
    granularity: timeseriesGranularitySchema.default("day"),
  })
  .openapi("TimeseriesReportQuery");
export type TimeseriesReportQuery = z.infer<typeof timeseriesReportQuerySchema>;

export const timeseriesReportSchema = z
  .object({
    metric: timeseriesMetricSchema,
    granularity: timeseriesGranularitySchema,
    from: isoDateTimeSchema,
    to: isoDateTimeSchema,
    points: z.array(
      z.object({
        bucketStart: isoDateTimeSchema,
        value: z.number().int().min(0),
      }),
    ),
  })
  .openapi("TimeseriesReport");
export type TimeseriesReport = z.infer<typeof timeseriesReportSchema>;

/** C8 — آمار تیکت‌ها (میانگین زمان اولین پاسخ + میانگین امتیاز) */
export const ticketsReportSchema = z
  .object({
    from: isoDateTimeSchema,
    to: isoDateTimeSchema,
    totalTickets: z.number().int().min(0),
    closedTickets: z.number().int().min(0),
    openTickets: z.number().int().min(0),
    /** میانگین میلی‌ثانیه از ایجاد تا اولین پاسخ کارکنان؛ null اگر نمونه‌ای نباشد */
    avgFirstResponseMs: z.number().min(0).nullable(),
    /** میانگین امتیاز ۱–۵؛ null اگر امتیازی نباشد */
    avgRating: z.number().min(1).max(5).nullable(),
    ratedCount: z.number().int().min(0),
  })
  .openapi("TicketsReport");
export type TicketsReport = z.infer<typeof ticketsReportSchema>;

/* -------------------------------------------------------------------------- */
/*  Case templates (CRM extension of student cases)                           */
/* -------------------------------------------------------------------------- */

export const caseTemplateRequiredDocumentSchema = z
  .object({
    key: z
      .string()
      .min(1)
      .max(60)
      .regex(/^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/),
    title: z.string().min(1).max(120),
    required: z.boolean(),
  })
  .openapi("CaseTemplateRequiredDocument");

export const caseTemplateDefaultTaskSchema = z
  .object({
    title: z.string().min(1).max(160),
    dueOffsetDays: z.number().int().min(0).max(365),
  })
  .openapi("CaseTemplateDefaultTask");

export const caseTemplateStageSchema = z
  .object({
    key: z
      .string()
      .min(1)
      .max(60)
      .regex(/^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/),
    title: z.string().min(1).max(80),
    order: z.number().int().min(0),
    requiredDocuments: z.array(caseTemplateRequiredDocumentSchema),
    defaultTasks: z.array(caseTemplateDefaultTaskSchema),
  })
  .openapi("CaseTemplateStage");

export const caseTemplateSchema = z
  .object({
    id: idSchema,
    countrySlug: slugSchema
      .nullable()
      .describe("null = قالب عمومی برای همه کشورها"),
    title: z.string().min(1).max(120),
    stages: z.array(caseTemplateStageSchema).min(1),
    ...auditFields,
  })
  .openapi("CaseTemplate");
export type CaseTemplate = z.infer<typeof caseTemplateSchema>;

export const caseTemplateCreateSchema = z
  .object({
    countrySlug: slugSchema.nullable().optional(),
    title: z.string().trim().min(1).max(120),
    stages: z.array(caseTemplateStageSchema).min(1),
  })
  .openapi("CaseTemplateCreate");
export type CaseTemplateCreate = z.infer<typeof caseTemplateCreateSchema>;

export const caseTemplateUpdateSchema = caseTemplateCreateSchema
  .partial()
  .openapi("CaseTemplateUpdate");
export type CaseTemplateUpdate = z.infer<typeof caseTemplateUpdateSchema>;
