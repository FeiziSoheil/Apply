import {
  auditFields,
  idSchema,
  isoDateSchema,
  isoDateTimeSchema,
  listQuerySchema,
  queryBooleanSchema,
  slugSchema,
  versionSchema,
} from "./common";
import { degreeLevelSchema } from "./content";
import { z } from "./zod";

/* -------------------------------------------------------------------------- */
/*  Case stages                                                               */
/* -------------------------------------------------------------------------- */

/** Ordered stages of a student file */
export const CASE_STAGES = [
  "consultation",
  "documents",
  "application",
  "offer",
  "visa",
  "departure",
] as const;
export const caseStageSchema = z.enum(CASE_STAGES).openapi("CaseStage");
export type CaseStage = z.infer<typeof caseStageSchema>;

export const STAGE_STATUSES = [
  "not_started",
  "in_progress",
  "completed",
  "blocked",
] as const;
export const stageStatusSchema = z.enum(STAGE_STATUSES).openapi("StageStatus");
export type StageStatus = z.infer<typeof stageStatusSchema>;

export const caseStageStateSchema = z
  .object({
    stage: caseStageSchema,
    status: stageStatusSchema,
    startedAt: isoDateTimeSchema.nullable(),
    completedAt: isoDateTimeSchema.nullable(),
    note: z.string().max(1000).nullable(),
  })
  .openapi("CaseStageState");
export type CaseStageState = z.infer<typeof caseStageStateSchema>;

export const CASE_STATUSES = ["active", "on_hold", "closed"] as const;
export const caseStatusSchema = z.enum(CASE_STATUSES).openapi("CaseStatus");
export type CaseStatus = z.infer<typeof caseStatusSchema>;

export const caseStageHistoryEntrySchema = z
  .object({
    stageKey: z.string().min(1).max(60),
    enteredAt: isoDateTimeSchema,
    exitedAt: isoDateTimeSchema.nullable(),
    actorId: idSchema.nullable(),
    note: z.string().max(1000).nullable(),
  })
  .openapi("CaseStageHistoryEntry");
export type CaseStageHistoryEntry = z.infer<typeof caseStageHistoryEntrySchema>;

export const studentCaseSchema = z
  .object({
    id: idSchema,
    code: z.string().openapi({ example: "CS-1405-0042" }),
    status: caseStatusSchema,
    studentId: idSchema.describe("کاربر با نقش student (= studentUserId)"),
    studentName: z.string().min(1).max(80),
    /** Assigned consultant — CRM `assignedTo` */
    consultantId: idSchema.nullable(),
    /** Resolved on read for list/detail UI */
    assigneeName: z.string().min(1).max(80).nullable().optional(),
    leadId: idSchema.nullable(),
    /** Country slug (CRM `countrySlug`) */
    targetCountry: slugSchema,
    targetDegree: degreeLevelSchema,
    programIds: z.array(idSchema).describe("برنامه‌های مدنظر / اپلای‌شده"),
    /** Current stage key — fixed CASE_STAGES or CaseTemplate stage key */
    currentStage: caseStageSchema,
    stageKey: z
      .string()
      .min(1)
      .max(60)
      .optional()
      .describe("کلید مرحله قالب؛ در نبود با currentStage برابر است"),
    stages: z
      .array(caseStageStateSchema)
      .describe("همیشه شامل همه مراحل به ترتیب CASE_STAGES"),
    stageHistory: z.array(caseStageHistoryEntrySchema).default([]),
    templateId: idSchema.nullable().optional(),
    /** Checklist progress 0–100 (derived on read) */
    progressPercent: z.number().int().min(0).max(100).optional(),
    /** Required docs without approved file */
    incompleteDocsCount: z.number().int().min(0).optional(),
    /** Uploaded/pending docs awaiting staff review */
    pendingReviewDocsCount: z.number().int().min(0).optional(),
    /** Nearest open checklist dueDate (YYYY-MM-DD) */
    nearestDeadline: isoDateSchema.nullable().optional(),
    lastActivityAt: isoDateTimeSchema.nullable().optional(),
    version: versionSchema,
    ...auditFields,
  })
  .openapi("StudentCase");
export type StudentCase = z.infer<typeof studentCaseSchema>;

export const studentCaseCreateSchema = z
  .object({
    studentId: idSchema.optional(),
    leadId: idSchema.optional(),
    consultantId: idSchema.optional(),
    targetCountry: slugSchema,
    targetDegree: degreeLevelSchema,
    programIds: z.array(idSchema).max(20).default([]),
  })
  .refine((data) => Boolean(data.studentId) || Boolean(data.leadId), {
    path: ["studentId"],
    message: "شناسه دانشجو یا سرنخ الزامی است",
  })
  .openapi("StudentCaseCreate");
export type StudentCaseCreate = z.infer<typeof studentCaseCreateSchema>;

export const studentCaseUpdateSchema = z
  .object({
    status: caseStatusSchema,
    consultantId: idSchema.nullable(),
    targetCountry: slugSchema,
    targetDegree: degreeLevelSchema,
    programIds: z.array(idSchema).max(20),
  })
  .partial()
  .openapi("StudentCaseUpdate");
export type StudentCaseUpdate = z.infer<typeof studentCaseUpdateSchema>;

export const stageUpdateSchema = z
  .object({
    status: stageStatusSchema,
    note: z.string().trim().max(1000).optional(),
  })
  .openapi("StageUpdate");
export type StageUpdate = z.infer<typeof stageUpdateSchema>;

export const stageParamsSchema = z.object({
  id: idSchema,
  stage: caseStageSchema,
});

/** Advance case to the next template / pipeline stage */
export const advanceCaseStageSchema = z
  .object({
    toStageKey: z.string().trim().min(1).max(60).optional(),
    note: z.string().trim().max(1000).optional(),
    /**
     * Admin-only: skip incomplete required documents / checklist.
     * Requires `overrideReason` when true.
     */
    overrideIncomplete: z.boolean().optional(),
    overrideReason: z.string().trim().min(3).max(1000).optional(),
  })
  .refine((data) => !data.overrideIncomplete || Boolean(data.overrideReason), {
    path: ["overrideReason"],
    message: "دلیل نادیده گرفتن الزامات مرحله را وارد کنید",
  })
  .openapi("AdvanceCaseStage");
export type AdvanceCaseStage = z.infer<typeof advanceCaseStageSchema>;

export const CASE_SORT_FIELDS = [
  "createdAt",
  "updatedAt",
  "currentStage",
  "progressPercent",
  "nearestDeadline",
  "lastActivityAt",
] as const;
export const studentCaseListQuerySchema = listQuerySchema(CASE_SORT_FIELDS, {
  status: caseStatusSchema.optional(),
  stage: caseStageSchema.optional(),
  consultantId: idSchema.optional(),
  studentId: idSchema.optional(),
  country: slugSchema.optional(),
  /** مدارک در انتظار بررسی */
  docsPendingReview: queryBooleanSchema.optional(),
  /** ددلاین چک‌لیست در N روز آینده (معمولاً ۷) */
  deadlineWithinDays: z.coerce.number().int().min(1).max(90).optional(),
  /** بدون فعالیت در تایم‌لاین پرونده */
  noActivity: queryBooleanSchema.optional(),
});
export type StudentCaseListQuery = z.infer<typeof studentCaseListQuerySchema>;

/* -------------------------------------------------------------------------- */
/*  Documents                                                                 */
/* -------------------------------------------------------------------------- */

export const DOCUMENT_TYPES = [
  "passport",
  "national_id",
  "photo",
  "transcript",
  "degree_certificate",
  "language_certificate",
  "cv",
  "motivation_letter",
  "recommendation_letter",
  "bank_statement",
  "admission_letter",
  "visa",
  "other",
] as const;
export const documentTypeSchema = z
  .enum(DOCUMENT_TYPES)
  .openapi("DocumentType");
export type DocumentType = z.infer<typeof documentTypeSchema>;

export const DOCUMENT_STATUSES = [
  "not_uploaded",
  "pending",
  "uploaded",
  "approved",
  "rejected",
] as const;
export const documentStatusSchema = z
  .enum(DOCUMENT_STATUSES)
  .openapi("DocumentStatus");
export type DocumentStatus = z.infer<typeof documentStatusSchema>;

/** Previous file versions of a document (history after re-upload) */
export const documentFileVersionSchema = z
  .object({
    version: z.number().int().min(1),
    fileId: idSchema,
    fileUrl: z.string().url().nullable().optional(),
    fileName: z.string().nullable(),
    fileSize: z.number().int().min(0).nullable(),
    mimeType: z.string().nullable(),
    uploadedBy: idSchema.nullable(),
    uploadedAt: isoDateTimeSchema,
    status: documentStatusSchema,
  })
  .openapi("DocumentFileVersion");
export type DocumentFileVersion = z.infer<typeof documentFileVersionSchema>;

export const documentSchema = z
  .object({
    id: idSchema,
    caseId: idSchema,
    type: documentTypeSchema,
    title: z.string().min(1).max(120),
    status: documentStatusSchema,
    /** Outside stage-template checklist (staff custom doc) */
    custom: z.boolean().optional().default(false),
    checklistItemId: idSchema.nullable().optional(),
    rejectionReason: z
      .string()
      .max(500)
      .nullable()
      .describe("فقط زمانی که status = rejected (= rejectReason)"),
    rejectReason: z
      .string()
      .max(500)
      .nullable()
      .optional()
      .describe("Alias of rejectionReason"),
    fileId: idSchema.nullable(),
    fileUrl: z.string().url().nullable().optional(),
    fileName: z.string().nullable().optional(),
    fileSize: z.number().int().min(0).nullable().optional(),
    mimeType: z.string().nullable().optional(),
    uploadedBy: idSchema.nullable().optional(),
    reviewedBy: idSchema.nullable(),
    reviewedAt: isoDateTimeSchema.nullable(),
    versions: z.array(documentFileVersionSchema).default([]),
    version: versionSchema,
    ...auditFields,
  })
  .openapi("Document");
export type StudentDocument = z.infer<typeof documentSchema>;

export const documentCreateSchema = z
  .object({
    type: documentTypeSchema,
    title: z.string().trim().min(1).max(120).optional(),
    fileId: idSchema.describe("شناسه فایل آپلودشده از POST /files"),
    checklistItemId: idSchema
      .optional()
      .describe("در صورت ارسال، آیتم چک‌لیست به این سند متصل می‌شود"),
    /** مدرک خارج از قالب مرحله */
    custom: z.boolean().optional(),
  })
  .openapi("DocumentCreate");
export type DocumentCreate = z.infer<typeof documentCreateSchema>;

export const documentReviewSchema = z
  .object({
    status: z.enum(["approved", "rejected"]),
    rejectionReason: z.string().trim().min(3).max(500).optional(),
  })
  .refine((data) => data.status !== "rejected" || Boolean(data.rejectionReason), {
    path: ["rejectionReason"],
    message: "دلیل رد مدرک را وارد کنید",
  })
  .openapi("DocumentReview");
export type DocumentReview = z.infer<typeof documentReviewSchema>;

/** Admin: unlock an approved document so it can be replaced / re-reviewed */
export const documentRevertSchema = z
  .object({
    reason: z.string().trim().min(3).max(500),
  })
  .openapi("DocumentRevert");
export type DocumentRevert = z.infer<typeof documentRevertSchema>;

export const documentListQuerySchema = listQuerySchema(["createdAt", "status"], {
  type: documentTypeSchema.optional(),
  status: documentStatusSchema.optional(),
});
export type DocumentListQuery = z.infer<typeof documentListQuerySchema>;

/* -------------------------------------------------------------------------- */
/*  Checklist                                                                 */
/* -------------------------------------------------------------------------- */

export const checklistItemSchema = z
  .object({
    id: idSchema,
    caseId: idSchema,
    stage: caseStageSchema,
    title: z.string().min(1).max(160),
    description: z.string().max(500).nullable(),
    documentType: documentTypeSchema.nullable(),
    required: z.boolean(),
    done: z.boolean(),
    documentId: idSchema.nullable(),
    dueDate: isoDateSchema.nullable(),
    ...auditFields,
  })
  .openapi("ChecklistItem");
export type ChecklistItem = z.infer<typeof checklistItemSchema>;

export const checklistSchema = z
  .object({
    caseId: idSchema,
    items: z.array(checklistItemSchema),
    totalCount: z.number().int().min(0),
    doneCount: z.number().int().min(0),
  })
  .openapi("Checklist");
export type Checklist = z.infer<typeof checklistSchema>;

export const checklistItemCreateSchema = z
  .object({
    stage: caseStageSchema,
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().max(500).optional(),
    documentType: documentTypeSchema.optional(),
    required: z.boolean().default(true),
    dueDate: isoDateSchema.optional(),
  })
  .openapi("ChecklistItemCreate");
export type ChecklistItemCreate = z.infer<typeof checklistItemCreateSchema>;

export const checklistItemUpdateSchema = checklistItemCreateSchema
  .partial()
  .extend({ done: z.boolean().optional() })
  .openapi("ChecklistItemUpdate");
export type ChecklistItemUpdate = z.infer<typeof checklistItemUpdateSchema>;

export const checklistItemParamsSchema = z.object({
  id: idSchema,
  itemId: idSchema,
});
