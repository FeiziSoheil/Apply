import {
  auditFields,
  emailSchema,
  idSchema,
  isoDateTimeSchema,
  listQuerySchema,
  mobileSchema,
  personNameSchema,
  queryBooleanSchema,
  rialsSchema,
  slugSchema,
  versionSchema,
  currencyCodeSchema,
} from "./common";
import { pipelineStageKindSchema } from "./crm";
import { degreeLevelSchema } from "./content";
import { z } from "./zod";

/* -------------------------------------------------------------------------- */
/*  Enums                                                                     */
/* -------------------------------------------------------------------------- */

export const LEAD_SOURCES = [
  "assessment",
  "hero_assessment",
  "callback",
  "contact",
  "newsletter",
  "booking",
  "manual",
  "import",
] as const;
export const leadSourceSchema = z.enum(LEAD_SOURCES).openapi("LeadSource");
export type LeadSource = z.infer<typeof leadSourceSchema>;

/**
 * @deprecated Fixed statuses replaced by configurable PipelineStage.
 * Kept only for OpenAPI backward-compat docs; runtime uses `stageId` + `stageKind`.
 */
export const LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "consultation_scheduled",
  "proposal_sent",
  "won",
  "lost",
] as const;
export const leadStatusSchema = z.enum(LEAD_STATUSES).openapi("LeadStatus");
export type LeadStatus = z.infer<typeof leadStatusSchema>;

export const LANGUAGE_STATUSES = [
  "none",
  "ielts",
  "toefl",
  "duolingo",
  "other",
] as const;
export const languageStatusSchema = z
  .enum(LANGUAGE_STATUSES)
  .openapi("LanguageStatus");
export type LanguageStatus = z.infer<typeof languageStatusSchema>;

export const START_TIMES = [
  "nearest",
  "six_months",
  "one_year",
  "undecided",
] as const;
export const startTimeSchema = z.enum(START_TIMES).openapi("StartTime");
export type StartTime = z.infer<typeof startTimeSchema>;

export const CONTACT_PREFERENCES = ["phone", "whatsapp", "email"] as const;
export const contactPreferenceSchema = z
  .enum(CONTACT_PREFERENCES)
  .openapi("ContactPreference");
export type ContactPreference = z.infer<typeof contactPreferenceSchema>;

/** Alias used in CRM docs / UI copy */
export const preferredContactSchema = contactPreferenceSchema;
export type PreferredContact = ContactPreference;

export const LEAD_PRIORITIES = ["low", "normal", "high"] as const;
export const leadPrioritySchema = z.enum(LEAD_PRIORITIES).openapi("LeadPriority");
export type LeadPriority = z.infer<typeof leadPrioritySchema>;

/* -------------------------------------------------------------------------- */
/*  UTM & assessment profile                                                  */
/* -------------------------------------------------------------------------- */

export const utmSchema = z
  .object({
    source: z.string().max(100).optional(),
    medium: z.string().max(100).optional(),
    campaign: z.string().max(100).optional(),
    term: z.string().max(100).optional(),
    content: z.string().max(100).optional(),
  })
  .openapi("Utm");
export type Utm = z.infer<typeof utmSchema>;

const gpaSchema = z
  .number({ invalid_type_error: "معدل باید عدد باشد" })
  .min(0, "معدل نمی‌تواند کمتر از ۰ باشد")
  .max(20, "معدل نمی‌تواند بیشتر از ۲۰ باشد");

/** Study-profile part of the assessment form (no contact data) */
export const assessmentProfileSchema = z
  .object({
    currentDegree: degreeLevelSchema,
    targetDegree: degreeLevelSchema,
    fieldOfStudy: z
      .string()
      .trim()
      .min(2, "رشته تحصیلی را وارد کنید")
      .max(100, "رشته تحصیلی نباید بیشتر از ۱۰۰ حرف باشد"),
    gpa: gpaSchema.describe("معدل در مقیاس ۰ تا ۲۰ ایران"),
    languageStatus: languageStatusSchema,
    languageScore: z.number().optional(),
    languageOther: z.string().trim().max(100).optional(),
    targetCountries: z
      .array(slugSchema)
      .min(1, "حداقل یک کشور مقصد را انتخاب کنید")
      .max(5, "حداکثر پنج کشور می‌توانید انتخاب کنید")
      .describe("اسلاگ کشورهای مقصد"),
    annualBudget: z
      .number()
      .min(0, "بودجه نمی‌تواند منفی باشد")
      .max(100_000, "بودجه بیش از حد مجاز است")
      .describe("بودجه سالانه به ارز `currency`"),
    currency: currencyCodeSchema.describe(
      "ارز `annualBudget` (ISO 4217، پیش‌فرض EUR)",
    ),
    startTime: startTimeSchema,
    needsScholarship: z.boolean(),
  })
  .openapi("AssessmentProfile");
export type AssessmentProfile = z.infer<typeof assessmentProfileSchema>;

type LanguageRefinable = Pick<
  AssessmentProfile,
  "languageStatus" | "languageScore" | "languageOther"
>;

/** Cross-field language rules (mirrors the frontend assessment form) */
function refineLanguage(data: LanguageRefinable, ctx: z.RefinementCtx): void {
  const { languageStatus, languageScore, languageOther } = data;
  if (languageStatus === "none") return;

  if (languageStatus === "other") {
    if (!languageOther || languageOther.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["languageOther"],
        message: "نام مدرک یا سطح زبان را وارد کنید",
      });
    }
    return;
  }

  if (languageScore === undefined || Number.isNaN(languageScore)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["languageScore"],
      message: "نمره زبان را وارد کنید",
    });
    return;
  }

  const ranges = {
    ielts: { min: 0, max: 9, message: "نمره آیلتس باید بین ۰ تا ۹ باشد" },
    toefl: { min: 0, max: 120, message: "نمره تافل باید بین ۰ تا ۱۲۰ باشد" },
    duolingo: {
      min: 10,
      max: 160,
      message: "نمره دولینگو باید بین ۱۰ تا ۱۶۰ باشد",
    },
  } as const;
  const range = ranges[languageStatus];
  if (languageScore < range.min || languageScore > range.max) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["languageScore"],
      message: range.message,
    });
  }
}

/* -------------------------------------------------------------------------- */
/*  Lead entity                                                               */
/* -------------------------------------------------------------------------- */

export const leadSchema = z
  .object({
    id: idSchema,
    source: leadSourceSchema,
    /** Reference to PipelineStage.id */
    stageId: idSchema,
    /** Derived from the referenced stage — for dashboards / public forms */
    stageKind: pipelineStageKindSchema,
    lostReasonId: idSchema.nullable().describe("اجباری وقتی stageKind = lost"),
    name: z.string().min(1).max(80),
    mobile: mobileSchema,
    email: emailSchema.nullable(),
    /** Preferred contact channel (alias of historical contactPreference) */
    preferredContact: contactPreferenceSchema.nullable(),
    /** @deprecated Use preferredContact — kept during UI migration */
    contactPreference: contactPreferenceSchema.nullable(),
    message: z.string().max(2000).nullable(),
    interestDegree: degreeLevelSchema
      .nullable()
      .describe("علاقه‌مندی اولیه (فرم سریع صفحه اصلی)"),
    interestCountry: slugSchema.nullable(),
    targetCountries: z.array(slugSchema).max(5).default([]),
    tagIds: z.array(idSchema).default([]),
    assessment: assessmentProfileSchema
      .nullable()
      .describe("فقط برای منبع assessment"),
    utm: utmSchema.nullable(),
    assignedTo: idSchema.nullable().describe("شناسه مشاور (Consultant.id)"),
    nextFollowUpAt: isoDateTimeSchema.nullable(),
    lastActivityAt: isoDateTimeSchema,
    priority: leadPrioritySchema,
    value: rialsSchema.nullable().describe("ارزش تقریبی قرارداد به ریال"),
    convertedCaseId: idSchema.nullable(),
    /** شناسه دستهٔ ورود فایل؛ برای بازگردانی ورودی */
    importId: idSchema.nullable().default(null),
    archived: z.boolean().default(false).describe("پس از ادغام مبدأ بایگانی می‌شود"),
    version: versionSchema,
    ...auditFields,
  })
  .openapi("Lead");
export type Lead = z.infer<typeof leadSchema>;

/** Short response returned to the public after creating a lead */
export const leadReceiptSchema = z
  .object({ id: idSchema, createdAt: isoDateTimeSchema })
  .openapi("LeadReceipt");
export type LeadReceipt = z.infer<typeof leadReceiptSchema>;

/* -------------------------------------------------------------------------- */
/*  Public lead creation                                                      */
/* -------------------------------------------------------------------------- */

/** Honeypot — real users leave it empty; non-empty submissions are dropped */
const honeypotSchema = z
  .string()
  .max(0, "ارسال نامعتبر است")
  .optional()
  .describe("ضد اسپم؛ باید خالی باشد");

export const leadFromAssessmentSchema = assessmentProfileSchema
  .extend({
    name: personNameSchema,
    mobile: mobileSchema,
    email: emailSchema.optional(),
    contactPreference: contactPreferenceSchema,
    preferredContact: contactPreferenceSchema.optional(),
    agreeToTerms: z.literal(true, {
      errorMap: () => ({ message: "پذیرش قوانین برای ادامه الزامی است" }),
    }),
    utm: utmSchema.optional(),
  })
  .superRefine(refineLanguage)
  .openapi("LeadFromAssessmentCreate");
export type LeadFromAssessmentCreate = z.infer<typeof leadFromAssessmentSchema>;

export const QUICK_CONTACT_SOURCES = [
  "callback",
  "contact",
  "hero_assessment",
] as const;

/** Callback dialog, contact form and the hero quick-assessment widget */
export const leadQuickContactSchema = z
  .object({
    source: z.enum(QUICK_CONTACT_SOURCES).default("callback"),
    name: personNameSchema.optional(),
    mobile: mobileSchema,
    email: emailSchema.optional(),
    message: z
      .string()
      .trim()
      .min(10, "پیام باید حداقل ۱۰ حرف باشد")
      .max(2000, "پیام نباید بیشتر از ۲۰۰۰ حرف باشد")
      .optional(),
    degreeLevel: degreeLevelSchema.optional(),
    country: slugSchema.optional().describe("اسلاگ کشور مقصد"),
    utm: utmSchema.optional(),
    website: honeypotSchema,
  })
  .refine((data) => data.source === "hero_assessment" || Boolean(data.name), {
    path: ["name"],
    message: "نام را وارد کنید",
  })
  .openapi("LeadQuickContactCreate");
export type LeadQuickContactCreate = z.infer<typeof leadQuickContactSchema>;

export const newsletterSubscribeSchema = z
  .object({
    mobile: mobileSchema.optional(),
    email: emailSchema.optional(),
    utm: utmSchema.optional(),
  })
  .refine((data) => Boolean(data.mobile) || Boolean(data.email), {
    path: ["mobile"],
    message: "موبایل یا ایمیل را وارد کنید",
  })
  .openapi("NewsletterSubscribe");
export type NewsletterSubscribe = z.infer<typeof newsletterSubscribeSchema>;

/** Manual lead entry by staff */
export const leadCreateSchema = z
  .object({
    name: personNameSchema,
    mobile: mobileSchema,
    email: emailSchema.optional(),
    message: z.string().trim().max(2000).optional(),
    assignedTo: idSchema.optional(),
    preferredContact: contactPreferenceSchema.optional(),
    targetCountries: z.array(slugSchema).max(5).optional(),
    tagIds: z.array(idSchema).optional(),
    priority: leadPrioritySchema.optional(),
    value: rialsSchema.optional(),
    nextFollowUpAt: isoDateTimeSchema.optional(),
  })
  .openapi("LeadCreate");
export type LeadCreate = z.infer<typeof leadCreateSchema>;

/* -------------------------------------------------------------------------- */
/*  Staff operations                                                          */
/* -------------------------------------------------------------------------- */

export const leadUpdateSchema = z
  .object({
    name: personNameSchema,
    email: emailSchema.nullable(),
    message: z.string().trim().max(2000).nullable(),
    preferredContact: contactPreferenceSchema.nullable(),
    contactPreference: contactPreferenceSchema.nullable(),
    targetCountries: z.array(slugSchema).max(5),
    tagIds: z.array(idSchema),
    priority: leadPrioritySchema,
    value: rialsSchema.nullable(),
    nextFollowUpAt: isoDateTimeSchema.nullable(),
  })
  .partial()
  .openapi("LeadUpdate");
export type LeadUpdate = z.infer<typeof leadUpdateSchema>;

/** Move lead to a pipeline stage (replaces fixed status update) */
export const leadStageUpdateSchema = z
  .object({
    stageId: idSchema,
    lostReasonId: idSchema.optional(),
    note: z.string().trim().max(1000).optional(),
  })
  .openapi("LeadStageUpdate");
export type LeadStageUpdate = z.infer<typeof leadStageUpdateSchema>;

/**
 * @deprecated Use leadStageUpdateSchema. Kept for OpenAPI / gradual UI migrate.
 * Maps legacy fixed statuses onto stage keys of the default seed pipeline.
 */
export const leadStatusUpdateSchema = z
  .object({
    status: leadStatusSchema,
    lostReason: z.string().trim().min(3).max(500).optional(),
    lostReasonId: idSchema.optional(),
    note: z.string().trim().max(1000).optional(),
  })
  .refine(
    (data) => data.status !== "lost" || Boolean(data.lostReasonId || data.lostReason),
    {
      path: ["lostReasonId"],
      message: "دلیل از دست رفتن سرنخ را وارد کنید",
    },
  )
  .openapi("LeadStatusUpdate");
export type LeadStatusUpdate = z.infer<typeof leadStatusUpdateSchema>;

export const leadAssigneeUpdateSchema = z
  .object({ assigneeId: idSchema.nullable() })
  .openapi("LeadAssigneeUpdate");
export type LeadAssigneeUpdate = z.infer<typeof leadAssigneeUpdateSchema>;

export const LEAD_SORT_FIELDS = [
  "createdAt",
  "updatedAt",
  "lastActivityAt",
  "nextFollowUpAt",
  "priority",
  "stageId",
] as const;
/** Query string may send one id or repeated `stageIds=` keys */
const queryIdListSchema = z
  .union([idSchema, z.array(idSchema)])
  .optional()
  .transform((value) => {
    if (value === undefined) return undefined;
    return Array.isArray(value) ? value : [value];
  });

export const leadListQuerySchema = listQuerySchema(LEAD_SORT_FIELDS, {
  stageId: idSchema.optional(),
  /** Multi-select stages (repeated query param) */
  stageIds: queryIdListSchema,
  stageKind: pipelineStageKindSchema.optional(),
  /** @deprecated Prefer stageId / stageKind */
  status: leadStatusSchema.optional(),
  source: leadSourceSchema.optional(),
  assignedTo: idSchema.optional(),
  unassigned: queryBooleanSchema.optional(),
  country: slugSchema.optional(),
  tagId: idSchema.optional(),
  priority: leadPrioritySchema.optional(),
  archived: queryBooleanSchema.optional(),
  createdFrom: isoDateTimeSchema.optional(),
  createdTo: isoDateTimeSchema.optional(),
  /** بدون فعالیت بیش از N روز (بر اساس lastActivityAt) */
  inactiveDays: z.coerce.number().int().min(1).max(365).optional(),
  /** پیگیری بعدی گذشته */
  overdueFollowUp: queryBooleanSchema.optional(),
  utmCampaign: z.string().trim().max(100).optional(),
  /** exact mobile match for duplicate detection */
  mobile: mobileSchema.optional(),
});
export type LeadListQuery = z.infer<typeof leadListQuerySchema>;

export const leadMergeSchema = z
  .object({
    targetId: idSchema.describe("لید مقصد؛ مبدأ بایگانی می‌شود"),
  })
  .openapi("LeadMerge");
export type LeadMerge = z.infer<typeof leadMergeSchema>;

export const leadDuplicatesSchema = z
  .object({
    leads: z.array(leadSchema),
  })
  .openapi("LeadDuplicates");
export type LeadDuplicates = z.infer<typeof leadDuplicatesSchema>;

/* -------------------------------------------------------------------------- */
/*  Import / export                                                           */
/* -------------------------------------------------------------------------- */

export const MAX_LEAD_IMPORT_ROWS = 5_000;
export const MAX_LEAD_IMPORT_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_LEAD_EXPORT_ROWS = 50_000;

/** تگ سیستمی که هنگام ورود از فایل به لیدها زده می‌شود */
export const LEAD_IMPORT_TAG_TITLE = "ورودی‌شده از فایل";

export const LEAD_IMPORT_DUPLICATE_BEHAVIORS = [
  "reject",
  "update",
  "create",
] as const;
export const leadImportDuplicateBehaviorSchema = z
  .enum(LEAD_IMPORT_DUPLICATE_BEHAVIORS)
  .openapi("LeadImportDuplicateBehavior");
export type LeadImportDuplicateBehavior = z.infer<
  typeof leadImportDuplicateBehaviorSchema
>;

export const leadImportRowErrorSchema = z
  .object({
    row: z.number().int().min(1),
    fields: z.record(z.string(), z.array(z.string())),
  })
  .openapi("LeadImportRowError");
export type LeadImportRowError = z.infer<typeof leadImportRowErrorSchema>;

/**
 * یک سطر از فایل پس از نگاشت ستون‌ها (کلاینت با SheetJS پارس می‌کند).
 * شماره `row` همان شماره سطر فایل است (۱ = هدر).
 */
export const leadImportRowInputSchema = z
  .object({
    row: z.number().int().min(2),
    name: z.string().trim().max(80).optional(),
    mobile: z.string().trim().max(32).optional(),
    email: z.string().trim().max(120).optional(),
    country: z.string().trim().max(100).optional().describe("اسلاگ یا نام کشور"),
    source: z.string().trim().max(40).optional(),
    notes: z.string().trim().max(2000).optional(),
    priority: z.string().trim().max(20).optional(),
  })
  .openapi("LeadImportRowInput");
export type LeadImportRowInput = z.infer<typeof leadImportRowInputSchema>;

export const leadImportBodySchema = z
  .object({
    dryRun: z.boolean().default(true),
    duplicateBehavior: leadImportDuplicateBehaviorSchema.default("reject"),
    /** مرحله پیش‌فرض؛ در نبود → مرحله kind=new */
    stageId: idSchema.optional(),
    /**
     * مسئول پیش‌فرض.
     * `undefined` → قوانین تخصیص؛ `null` → بدون مسئول.
     */
    assignedTo: idSchema.nullable().optional(),
    rows: z
      .array(leadImportRowInputSchema)
      .min(1, "حداقل یک سطر لازم است")
      .max(
        MAX_LEAD_IMPORT_ROWS,
        `حداکثر ${MAX_LEAD_IMPORT_ROWS.toLocaleString("fa-IR")} سطر مجاز است`,
      ),
  })
  .openapi("LeadImportBody");
export type LeadImportBody = z.infer<typeof leadImportBodySchema>;

export const leadImportReportSchema = z
  .object({
    importId: idSchema,
    dryRun: z.boolean(),
    totalRows: z.number().int().min(0),
    validRows: z.number().int().min(0),
    /** @deprecated معادل createdRows + updatedRows */
    importedRows: z.number().int().min(0),
    createdRows: z.number().int().min(0),
    updatedRows: z.number().int().min(0),
    rejectedRows: z.number().int().min(0),
    duplicateRows: z.number().int().min(0),
    errors: z.array(leadImportRowErrorSchema),
  })
  .openapi("LeadImportReport");
export type LeadImportReport = z.infer<typeof leadImportReportSchema>;

/** @deprecated Prefer body.dryRun — kept for query-string callers */
export const leadImportQuerySchema = z
  .object({
    dryRun: z
      .enum(["true", "false"])
      .optional()
      .transform((value) => (value === undefined ? undefined : value === "true")),
  })
  .openapi("LeadImportQuery");
export type LeadImportQuery = z.infer<typeof leadImportQuerySchema>;

export const leadImportRevertReportSchema = z
  .object({
    importId: idSchema,
    deletedCount: z.number().int().min(0),
    skippedCount: z.number().int().min(0),
  })
  .openapi("LeadImportRevertReport");
export type LeadImportRevertReport = z.infer<typeof leadImportRevertReportSchema>;

export const LEAD_EXPORT_FORMATS = ["csv", "xlsx"] as const;
export const leadExportFormatSchema = z
  .enum(LEAD_EXPORT_FORMATS)
  .openapi("LeadExportFormat");
export type LeadExportFormat = z.infer<typeof leadExportFormatSchema>;

export const leadExportQuerySchema = leadListQuerySchema
  .omit({ page: true, pageSize: true })
  .extend({
    /** ستون‌ها با کاما؛ پیش‌فرض مجموعهٔ استاندارد */
    columns: z.string().trim().max(500).optional(),
    format: leadExportFormatSchema.default("csv"),
  })
  .openapi("LeadExportQuery");
export type LeadExportQuery = z.infer<typeof leadExportQuerySchema>;

export const leadExportResultSchema = z
  .object({
    format: leadExportFormatSchema,
    /** CSV: متن با BOM؛ XLSX: base64 */
    content: z.string(),
    filename: z.string(),
    rowCount: z.number().int().min(0),
  })
  .openapi("LeadExportResult");
export type LeadExportResult = z.infer<typeof leadExportResultSchema>;

/* -------------------------------------------------------------------------- */
/*  Activities                                                                */
/* -------------------------------------------------------------------------- */

export const ACTIVITY_ENTITY_TYPES = ["lead", "case"] as const;
export const activityEntityTypeSchema = z
  .enum(ACTIVITY_ENTITY_TYPES)
  .openapi("ActivityEntityType");
export type ActivityEntityType = z.infer<typeof activityEntityTypeSchema>;

export const ACTIVITY_TYPES = [
  "note",
  "call",
  "sms",
  "whatsapp",
  "email",
  "meeting",
  "stage_change",
  "assignment",
  "task_created",
  "task_done",
  "booking_event",
  "document_event",
  "field_change",
  "system",
] as const;
export const activityTypeSchema = z
  .enum(ACTIVITY_TYPES)
  .openapi("ActivityType");
export type ActivityType = z.infer<typeof activityTypeSchema>;

export const CALL_DIRECTIONS = ["inbound", "outbound"] as const;
export const callDirectionSchema = z.enum(CALL_DIRECTIONS).openapi("CallDirection");
export type CallDirection = z.infer<typeof callDirectionSchema>;

export const CALL_OUTCOMES = [
  "answered",
  "no_answer",
  "busy",
  "wrong_number",
  "callback_requested",
] as const;
export const callOutcomeSchema = z.enum(CALL_OUTCOMES).openapi("CallOutcome");
export type CallOutcome = z.infer<typeof callOutcomeSchema>;

const activityBase = {
  id: idSchema,
  entityType: activityEntityTypeSchema,
  entityId: idSchema,
  /** @deprecated Prefer entityType+entityId; kept for list filters during migrate */
  leadId: idSchema.optional(),
  actorId: idSchema.nullable().describe("null = رویداد سیستمی"),
  /** @deprecated Prefer actorId */
  authorId: idSchema.nullable().optional(),
  createdAt: isoDateTimeSchema,
  body: z.string().max(2000).nullable().optional(),
};

export const noteActivitySchema = z
  .object({
    ...activityBase,
    type: z.literal("note"),
    body: z.string().min(1).max(2000),
    pinned: z.boolean().default(false),
  })
  .openapi("NoteActivity");

export const callActivitySchema = z
  .object({
    ...activityBase,
    type: z.literal("call"),
    direction: callDirectionSchema.default("outbound"),
    outcome: callOutcomeSchema,
    durationSeconds: z.number().int().min(0).nullable(),
    body: z.string().max(2000).nullable(),
  })
  .openapi("CallActivity");

export const smsActivitySchema = z
  .object({
    ...activityBase,
    type: z.literal("sms"),
    body: z.string().min(1).max(2000),
  })
  .openapi("SmsActivity");

export const whatsappActivitySchema = z
  .object({
    ...activityBase,
    type: z.literal("whatsapp"),
    body: z.string().min(1).max(2000),
  })
  .openapi("WhatsappActivity");

export const emailActivitySchema = z
  .object({
    ...activityBase,
    type: z.literal("email"),
    subject: z.string().max(200).nullable(),
    body: z.string().min(1).max(5000),
  })
  .openapi("EmailActivity");

export const meetingActivitySchema = z
  .object({
    ...activityBase,
    type: z.literal("meeting"),
    startsAt: isoDateTimeSchema.nullable(),
    body: z.string().max(2000).nullable(),
  })
  .openapi("MeetingActivity");

export const stageChangeActivitySchema = z
  .object({
    ...activityBase,
    type: z.literal("stage_change"),
    fromStageId: idSchema,
    toStageId: idSchema,
    lostReasonId: idSchema.nullable(),
    body: z.string().max(1000).nullable(),
  })
  .openapi("StageChangeActivity");

export const assignmentActivitySchema = z
  .object({
    ...activityBase,
    type: z.literal("assignment"),
    fromAssigneeId: idSchema.nullable(),
    toAssigneeId: idSchema.nullable(),
    body: z.string().max(1000).nullable(),
  })
  .openapi("AssignmentActivity");

export const taskCreatedActivitySchema = z
  .object({
    ...activityBase,
    type: z.literal("task_created"),
    taskId: idSchema,
    body: z.string().max(1000).nullable(),
  })
  .openapi("TaskCreatedActivity");

export const taskDoneActivitySchema = z
  .object({
    ...activityBase,
    type: z.literal("task_done"),
    taskId: idSchema,
    body: z.string().max(1000).nullable(),
  })
  .openapi("TaskDoneActivity");

export const bookingEventActivitySchema = z
  .object({
    ...activityBase,
    type: z.literal("booking_event"),
    bookingId: idSchema,
    event: z.string().max(40),
    body: z.string().max(1000).nullable(),
  })
  .openapi("BookingEventActivity");

export const documentEventActivitySchema = z
  .object({
    ...activityBase,
    type: z.literal("document_event"),
    documentId: idSchema,
    event: z.string().max(40),
    body: z.string().max(1000).nullable(),
  })
  .openapi("DocumentEventActivity");

export const fieldChangeActivitySchema = z
  .object({
    ...activityBase,
    type: z.literal("field_change"),
    diff: z.object({
      before: z.record(z.string(), z.unknown()),
      after: z.record(z.string(), z.unknown()),
    }),
    body: z.string().max(1000).nullable(),
  })
  .openapi("FieldChangeActivity");

export const systemActivitySchema = z
  .object({
    ...activityBase,
    type: z.literal("system"),
    body: z.string().max(2000).nullable(),
  })
  .openapi("SystemActivity");

export const activitySchema = z
  .discriminatedUnion("type", [
    noteActivitySchema,
    callActivitySchema,
    smsActivitySchema,
    whatsappActivitySchema,
    emailActivitySchema,
    meetingActivitySchema,
    stageChangeActivitySchema,
    assignmentActivitySchema,
    taskCreatedActivitySchema,
    taskDoneActivitySchema,
    bookingEventActivitySchema,
    documentEventActivitySchema,
    fieldChangeActivitySchema,
    systemActivitySchema,
  ])
  .openapi("Activity");
export type Activity = z.infer<typeof activitySchema>;

/** Staff can create notes / calls / messages; stage/assignment are system-generated */
export const activityCreateSchema = z
  .discriminatedUnion("type", [
    z.object({
      type: z.literal("note"),
      body: z.string().trim().min(1, "متن یادداشت را وارد کنید").max(2000),
      pinned: z.boolean().optional(),
    }),
    z.object({
      type: z.literal("call"),
      direction: callDirectionSchema.optional(),
      outcome: callOutcomeSchema,
      durationSeconds: z.number().int().min(0).max(86_400).optional(),
      body: z.string().trim().max(2000).optional(),
    }),
    z.object({
      type: z.literal("sms"),
      body: z.string().trim().min(1).max(2000),
    }),
    z.object({
      type: z.literal("whatsapp"),
      body: z.string().trim().min(1).max(2000),
    }),
    z.object({
      type: z.literal("email"),
      subject: z.string().trim().max(200).optional(),
      body: z.string().trim().min(1).max(5000),
    }),
    z.object({
      type: z.literal("meeting"),
      startsAt: isoDateTimeSchema.optional(),
      body: z.string().trim().max(2000).optional(),
    }),
  ])
  .openapi("ActivityCreate");
export type ActivityCreate = z.infer<typeof activityCreateSchema>;

export const activityUpdateSchema = z
  .object({
    body: z.string().trim().min(1).max(2000).optional(),
    pinned: z.boolean().optional(),
  })
  .openapi("ActivityUpdate");
export type ActivityUpdate = z.infer<typeof activityUpdateSchema>;

export const activityListQuerySchema = listQuerySchema(["createdAt"], {
  type: activityTypeSchema.optional(),
});
export type ActivityListQuery = z.infer<typeof activityListQuerySchema>;

/* -------------------------------------------------------------------------- */
/*  Assessment result & conversion                                            */
/* -------------------------------------------------------------------------- */

export const assessmentRecommendationSchema = z
  .object({
    programId: idSchema,
    score: z.number().min(0).max(100).describe("درصد تطابق"),
    reasons: z.array(z.string()),
  })
  .openapi("AssessmentRecommendation");
export type AssessmentRecommendation = z.infer<
  typeof assessmentRecommendationSchema
>;

/** Response of the assessment submission: lead receipt + top matches */
export const assessmentReceiptSchema = leadReceiptSchema
  .extend({ recommendations: z.array(assessmentRecommendationSchema).max(10) })
  .openapi("AssessmentReceipt");
export type AssessmentReceipt = z.infer<typeof assessmentReceiptSchema>;

/** Convert a qualified lead into a student case (creates the student user) */
export const leadConvertSchema = z
  .object({
    targetCountry: slugSchema,
    targetDegree: degreeLevelSchema,
    programIds: z.array(idSchema).max(20).default([]),
    consultantId: idSchema.optional(),
  })
  .openapi("LeadConvert");
export type LeadConvert = z.infer<typeof leadConvertSchema>;
