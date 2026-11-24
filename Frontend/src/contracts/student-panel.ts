import {
  auditFields,
  idSchema,
  isoDateSchema,
  isoDateTimeSchema,
  listQuerySchema,
  mobileSchema,
  personNameSchema,
  emailSchema,
  rialsSchema,
  slugSchema,
} from "./common";
import { degreeLevelSchema, publicationStatusSchema } from "./content";
import { assessmentProfileSchema } from "./leads";
import { documentTypeSchema } from "./students";
import { z } from "./zod";

/* -------------------------------------------------------------------------- */
/*  OTP → case linking                                                        */
/* -------------------------------------------------------------------------- */

export const CASE_LINK_STATUSES = ["linked", "select", "none"] as const;
export const caseLinkStatusSchema = z
  .enum(CASE_LINK_STATUSES)
  .openapi("CaseLinkStatus");
export type CaseLinkStatus = z.infer<typeof caseLinkStatusSchema>;

export const caseLinkOptionSchema = z
  .object({
    id: idSchema,
    code: z.string(),
    studentName: z.string(),
    currentStageTitle: z.string(),
    targetCountry: slugSchema,
    targetDegree: degreeLevelSchema,
  })
  .openapi("CaseLinkOption");
export type CaseLinkOption = z.infer<typeof caseLinkOptionSchema>;

/**
 * Result of matching the OTP mobile to leads/cases.
 * `none` → UI shows «پرونده‌ای پیدا نشد» + CTA consultation.
 * `select` → student picks among `cases`.
 * `linked` → single case already attached (or just linked).
 */
export const caseLinkResultSchema = z
  .object({
    status: caseLinkStatusSchema,
    message: z.string().max(300).optional(),
    cases: z.array(caseLinkOptionSchema).default([]),
    activeCaseId: idSchema.nullable().optional(),
  })
  .openapi("CaseLinkResult");
export type CaseLinkResult = z.infer<typeof caseLinkResultSchema>;

export const selectCaseSchema = z
  .object({ caseId: idSchema })
  .openapi("SelectCase");
export type SelectCase = z.infer<typeof selectCaseSchema>;

/* -------------------------------------------------------------------------- */
/*  Student profile                                                           */
/* -------------------------------------------------------------------------- */

export const studentEducationSchema = z
  .object({
    highestDegree: degreeLevelSchema.nullable(),
    fieldOfStudy: z.string().max(120).nullable(),
    gpa: z.number().min(0).max(20).nullable(),
    universityName: z.string().max(160).nullable(),
  })
  .openapi("StudentEducation");
export type StudentEducation = z.infer<typeof studentEducationSchema>;

export const studentProfileSchema = z
  .object({
    id: idSchema,
    name: personNameSchema,
    mobile: mobileSchema,
    email: emailSchema.nullable(),
    city: z.string().max(80).nullable(),
    birthDate: isoDateSchema.nullable(),
    education: studentEducationSchema,
    activeCaseId: idSchema.nullable(),
    version: z.number().int().default(1),
    assessment: assessmentProfileSchema.nullable().optional(),
    onboardingCompleted: z.boolean().default(false).optional(),
    updatedAt: isoDateTimeSchema,
  })
  .openapi("StudentProfile");
export type StudentProfile = z.infer<typeof studentProfileSchema>;

export const studentProfileUpdateSchema = z
  .object({
    name: personNameSchema.optional(),
    email: emailSchema.nullable().optional(),
    city: z.string().trim().max(80).nullable().optional(),
    birthDate: isoDateSchema.nullable().optional(),
    education: studentEducationSchema.partial().optional(),
    onboardingCompleted: z.boolean().optional(),
    version: z.number().int().optional(),
  })
  .openapi("StudentProfileUpdate");
export type StudentProfileUpdate = z.infer<typeof studentProfileUpdateSchema>;

/** Start mobile change — sends OTP to the *new* number */
export const studentMobileChangeRequestSchema = z
  .object({ mobile: mobileSchema })
  .openapi("StudentMobileChangeRequest");
export type StudentMobileChangeRequest = z.infer<
  typeof studentMobileChangeRequestSchema
>;

export const studentMobileChangeVerifySchema = z
  .object({
    mobile: mobileSchema,
    code: z
      .string({ required_error: "کد تأیید را وارد کنید" })
      .regex(/^\d{6}$/, "کد تأیید باید ۶ رقم باشد"),
  })
  .openapi("StudentMobileChangeVerify");
export type StudentMobileChangeVerify = z.infer<
  typeof studentMobileChangeVerifySchema
>;

/* -------------------------------------------------------------------------- */
/*  StudentCaseView (never staff StudentCase)                                 */
/* -------------------------------------------------------------------------- */

export const STUDENT_STAGE_UI_STATUSES = [
  "done",
  "current",
  "upcoming",
] as const;
export const studentStageUiStatusSchema = z
  .enum(STUDENT_STAGE_UI_STATUSES)
  .openapi("StudentStageUiStatus");
export type StudentStageUiStatus = z.infer<typeof studentStageUiStatusSchema>;

export const studentCaseStageViewSchema = z
  .object({
    key: z.string().min(1).max(60),
    title: z.string().min(1).max(80),
    status: studentStageUiStatusSchema,
  })
  .openapi("StudentCaseStageView");
export type StudentCaseStageView = z.infer<typeof studentCaseStageViewSchema>;

export const studentAdvisorViewSchema = z
  .object({
    name: z.string().min(1).max(80),
    photoFileId: idSchema.nullable(),
    photoUrl: z.string().url().nullable().optional(),
    publicPhone: z.string().max(30).nullable(),
    publicEmail: emailSchema.nullable(),
  })
  .openapi("StudentAdvisorView");
export type StudentAdvisorView = z.infer<typeof studentAdvisorViewSchema>;

/** تاریخچهٔ مرحله — فقط تاریخ ورود؛ بدون actor / یادداشت داخلی */
export const studentStageHistoryViewSchema = z
  .object({
    stageKey: z.string().min(1).max(60),
    stageTitle: z.string().min(1).max(80),
    enteredAt: isoDateTimeSchema,
  })
  .openapi("StudentStageHistoryView");
export type StudentStageHistoryView = z.infer<
  typeof studentStageHistoryViewSchema
>;

/** خلاصهٔ مقصد/برنامه از CMS — بدون فیلدهای داخلی کارکنان */
export const studentTargetProgramViewSchema = z
  .object({
    countrySlug: slugSchema,
    countryName: z.string().max(80).nullable(),
    degree: degreeLevelSchema,
    programTitle: z.string().max(160).nullable(),
    universityName: z.string().max(120).nullable(),
    languageRequirement: z.string().max(120).nullable(),
    minGpa: z.number().min(0).max(4).nullable(),
    duration: z.string().max(60).nullable(),
  })
  .openapi("StudentTargetProgramView");
export type StudentTargetProgramView = z.infer<
  typeof studentTargetProgramViewSchema
>;

/** به‌روزرسانی قابل‌نمایش برای دانشجو (مثلاً تأیید مدرک) */
export const studentCaseUpdateViewSchema = z
  .object({
    id: z.string().min(1).max(80),
    title: z.string().min(1).max(200),
    occurredAt: isoDateTimeSchema,
  })
  .openapi("StudentCaseUpdateView");
export type StudentCaseUpdateView = z.infer<typeof studentCaseUpdateViewSchema>;

export const studentCaseViewSchema = z
  .object({
    id: idSchema,
    code: z.string(),
    currentStageKey: z.string(),
    currentStageTitle: z.string(),
    stages: z.array(studentCaseStageViewSchema),
    progressPercent: z.number().int().min(0).max(100),
    advisor: studentAdvisorViewSchema.nullable(),
    deadlines: z.array(
      z.object({
        title: z.string(),
        dueDate: isoDateSchema,
      }),
    ),
    nextStepHint: z
      .string()
      .max(300)
      .describe("متن کمکی «قدم بعدی» به زبان ساده"),
    lastUpdated: isoDateTimeSchema,
    targetCountry: slugSchema,
    targetDegree: degreeLevelSchema,
    stageHistory: z.array(studentStageHistoryViewSchema).default([]),
    targetProgram: studentTargetProgramViewSchema.nullable(),
    recentUpdates: z.array(studentCaseUpdateViewSchema).default([]),
  })
  .openapi("StudentCaseView");
export type StudentCaseView = z.infer<typeof studentCaseViewSchema>;

/* -------------------------------------------------------------------------- */
/*  DocumentView                                                              */
/* -------------------------------------------------------------------------- */

export const DOCUMENT_VIEW_STATUSES = [
  "not_uploaded",
  "pending",
  "uploaded",
  "approved",
  "rejected",
] as const;
export const documentViewStatusSchema = z
  .enum(DOCUMENT_VIEW_STATUSES)
  .openapi("DocumentViewStatus");

/** Grouping for student checklist UI */
export const DOCUMENT_STAGE_GROUPS = ["current", "upcoming", "other"] as const;
export const documentStageGroupSchema = z
  .enum(DOCUMENT_STAGE_GROUPS)
  .openapi("DocumentStageGroup");
export type DocumentStageGroup = z.infer<typeof documentStageGroupSchema>;

export const documentFileRefSchema = z
  .object({
    fileId: idSchema,
    downloadUrl: z.string().url(),
    /** انقضای لینک امضاشدهٔ mock */
    expiresAt: isoDateTimeSchema.nullable(),
    /** نام نمایشی امن (نه نام اصلی فایل دانشجو) */
    fileName: z.string(),
    fileSize: z.number().int().min(0).nullable(),
    mimeType: z.string().nullable(),
  })
  .openapi("DocumentFileRef");

export const documentVersionViewSchema = z
  .object({
    version: z.number().int().min(1),
    uploadedAt: isoDateTimeSchema,
    status: documentViewStatusSchema,
    file: documentFileRefSchema.nullable(),
  })
  .openapi("DocumentVersionView");

export const documentViewSchema = z
  .object({
    id: idSchema,
    type: documentTypeSchema,
    title: z.string(),
    required: z.boolean(),
    status: documentViewStatusSchema,
    /** فقط وقتی status = rejected */
    rejectionReason: z.string().max(500).nullable(),
    file: documentFileRefSchema.nullable(),
    versions: z.array(documentVersionViewSchema),
    prepGuide: z
      .string()
      .max(800)
      .describe("راهنمای کوتاه آماده‌سازی برای این نوع مدرک"),
    prepFormats: z
      .array(z.string())
      .describe("پسوند/نوع مجاز، مثلاً JPG, PNG, PDF"),
    prepMaxSizeBytes: z.number().int().min(1),
    prepSampleHint: z
      .string()
      .max(300)
      .nullable()
      .describe("نمونه یا نکتهٔ کوتاه آماده‌سازی"),
    stageKey: z.string().min(1).max(60),
    stageTitle: z.string().min(1).max(80),
    stageGroup: documentStageGroupSchema,
    checklistItemId: idSchema.nullable(),
    reviewedAt: isoDateTimeSchema.nullable(),
    /** مدرک تأییدشده قفل است */
    locked: z.boolean(),
    canReplace: z.boolean(),
    updatedAt: isoDateTimeSchema,
  })
  .openapi("DocumentView");
export type DocumentView = z.infer<typeof documentViewSchema>;

export const documentUploadSettingsSchema = z
  .object({
    maxUploadBytes: z.number().int().min(1),
    allowedMimeTypes: z.array(z.string().min(1)).min(1),
    reviewEtaMessage: z
      .string()
      .min(1)
      .max(300)
      .describe("پیام اطمینان پس از آپلود، از تنظیمات"),
  })
  .openapi("DocumentUploadSettings");
export type DocumentUploadSettings = z.infer<typeof documentUploadSettingsSchema>;

export const documentViewsPayloadSchema = z
  .object({
    items: z.array(documentViewSchema),
    progress: z.object({
      approvedRequired: z.number().int().min(0),
      totalRequired: z.number().int().min(0),
    }),
    settings: documentUploadSettingsSchema,
  })
  .openapi("DocumentViewsPayload");
export type DocumentViewsPayload = z.infer<typeof documentViewsPayloadSchema>;

/** دانشجو: آپلود/جایگزینی فایل برای مدرک یا آیتم چک‌لیست */
export const studentDocumentUploadSchema = z
  .object({
    fileId: idSchema.describe("شناسه فایل از POST /files"),
    documentId: idSchema.optional(),
    checklistItemId: idSchema.optional(),
  })
  .refine((data) => Boolean(data.documentId) || Boolean(data.checklistItemId), {
    message: "شناسه مدرک یا آیتم چک‌لیست الزامی است",
    path: ["documentId"],
  })
  .openapi("StudentDocumentUpload");
export type StudentDocumentUpload = z.infer<typeof studentDocumentUploadSchema>;

/* -------------------------------------------------------------------------- */
/*  StudentTaskView («کارهای شما» — derived, not staff Task)                   */
/* -------------------------------------------------------------------------- */

export const STUDENT_TASK_KINDS = [
  "upload_document",
  "pay_installment",
  "fill_form",
  "attend_session",
] as const;
export const studentTaskKindSchema = z
  .enum(STUDENT_TASK_KINDS)
  .openapi("StudentTaskKind");
export type StudentTaskKind = z.infer<typeof studentTaskKindSchema>;

export const STUDENT_TASK_STATUSES = [
  "todo",
  "done",
  "overdue",
] as const;
export const studentTaskStatusSchema = z
  .enum(STUDENT_TASK_STATUSES)
  .openapi("StudentTaskStatus");

export const studentTaskViewSchema = z
  .object({
    id: z.string().min(1).max(80),
    kind: studentTaskKindSchema,
    title: z.string().min(1).max(160),
    description: z.string().max(400).nullable(),
    status: studentTaskStatusSchema,
    dueDate: isoDateSchema.nullable(),
    actionHref: z.string().max(300).nullable(),
    relatedId: idSchema.nullable(),
  })
  .openapi("StudentTaskView");
export type StudentTaskView = z.infer<typeof studentTaskViewSchema>;

/* -------------------------------------------------------------------------- */
/*  Announcements                                                             */
/* -------------------------------------------------------------------------- */

export const announcementAudienceSchema = z
  .object({
    /** همه دانشجویان؛ در غیر این صورت فقط کشورهای زیر */
    allStudents: z.boolean(),
    countrySlugs: z.array(slugSchema).default([]),
  })
  .openapi("AnnouncementAudience");

export const announcementSchema = z
  .object({
    id: idSchema,
    title: z.string().min(1).max(160),
    body: z.string().min(1).max(4000).describe("متن ساده؛ بدون HTML"),
    audience: announcementAudienceSchema,
    status: publicationStatusSchema,
    publishedAt: isoDateTimeSchema.nullable(),
    ...auditFields,
  })
  .openapi("Announcement");
export type Announcement = z.infer<typeof announcementSchema>;

export const announcementCreateSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    body: z.string().trim().min(1).max(4000),
    audience: announcementAudienceSchema,
    status: publicationStatusSchema.default("draft"),
    publishedAt: isoDateTimeSchema.optional(),
  })
  .openapi("AnnouncementCreate");
export type AnnouncementCreate = z.infer<typeof announcementCreateSchema>;

export const announcementUpdateSchema = announcementCreateSchema
  .partial()
  .openapi("AnnouncementUpdate");
export type AnnouncementUpdate = z.infer<typeof announcementUpdateSchema>;

export const announcementListQuerySchema = listQuerySchema(
  ["publishedAt", "createdAt", "updatedAt"],
  {
    status: publicationStatusSchema.optional(),
    country: slugSchema.optional(),
  },
);
export type AnnouncementListQuery = z.infer<typeof announcementListQuerySchema>;

/** Student-facing projection — no draft / internal fields */
export const announcementViewSchema = z
  .object({
    id: idSchema,
    title: z.string(),
    body: z.string(),
    publishedAt: isoDateTimeSchema,
  })
  .openapi("AnnouncementView");
export type AnnouncementView = z.infer<typeof announcementViewSchema>;

/* -------------------------------------------------------------------------- */
/*  Shortlist                                                                 */
/* -------------------------------------------------------------------------- */

export const shortlistItemSchema = z
  .object({
    id: idSchema,
    programId: idSchema.nullable().optional(),
    universityId: idSchema.nullable().optional(),
    countrySlug: slugSchema.nullable().optional(),
    addedAt: isoDateTimeSchema,
  })
  .refine(
    (item) =>
      Boolean(item.programId) ||
      Boolean(item.universityId) ||
      Boolean(item.countrySlug),
    {
      message: "programId، universityId یا countrySlug الزامی است",
    },
  )
  .openapi("ShortlistItem");
export type ShortlistItem = z.infer<typeof shortlistItemSchema>;

export const shortlistSchema = z
  .object({
    items: z.array(shortlistItemSchema).max(50),
    updatedAt: isoDateTimeSchema,
  })
  .openapi("Shortlist");
export type Shortlist = z.infer<typeof shortlistSchema>;

export const shortlistPutSchema = z
  .object({
    programId: idSchema.optional(),
    universityId: idSchema.optional(),
    countrySlug: slugSchema.optional(),
  })
  .refine(
    (data) =>
      Boolean(data.programId) ||
      Boolean(data.universityId) ||
      Boolean(data.countrySlug),
    {
      message: "programId، universityId یا countrySlug الزامی است",
    },
  )
  .openapi("ShortlistPut");
export type ShortlistPut = z.infer<typeof shortlistPutSchema>;

export const shortlistMergeSchema = z
  .object({
    items: z.array(shortlistPutSchema).max(50),
  })
  .openapi("ShortlistMerge");
export type ShortlistMerge = z.infer<typeof shortlistMergeSchema>;

export const shortlistConsultationRequestSchema = z
  .object({
    programIds: z.array(idSchema).min(1).max(10),
    note: z.string().trim().max(1000).optional(),
  })
  .openapi("ShortlistConsultationRequest");
export type ShortlistConsultationRequest = z.infer<
  typeof shortlistConsultationRequestSchema
>;

export const shortlistCompareItemSchema = z
  .object({
    programId: idSchema.nullable(),
    universityId: idSchema.nullable(),
    title: z.string(),
    universityName: z.string().nullable(),
    countryName: z.string().nullable().optional(),
    countrySlug: slugSchema.nullable(),
    degreeLevel: degreeLevelSchema.nullable(),
    tuition: z.number().nullable(),
    currency: z.string().nullable(),
    duration: z.string().nullable().optional(),
    durationMonths: z.number().int().nullable().optional(),
    deadline: isoDateSchema.nullable().optional(),
    languageRequirement: z.string().nullable().optional(),
    minGpa: z.number().nullable().optional(),
    hasScholarship: z.boolean().nullable().optional(),
  })
  .openapi("ShortlistCompareItem");
export type ShortlistCompareItem = z.infer<typeof shortlistCompareItemSchema>;

export const shortlistCompareSchema = z
  .object({
    items: z.array(shortlistCompareItemSchema),
  })
  .openapi("ShortlistCompare");
export type ShortlistCompare = z.infer<typeof shortlistCompareSchema>;

/* -------------------------------------------------------------------------- */
/*  Student payment summary (Rial amounts)                                    */
/* -------------------------------------------------------------------------- */

export const studentPaymentSummarySchema = z
  .object({
    /** مجموع قرارداد / برنامه پرداخت (ریال) */
    totalContract: rialsSchema,
    totalPaid: rialsSchema,
    /** باقی‌مانده = totalContract − totalPaid (ریال) */
    totalDue: rialsSchema,
    overdueCount: z.number().int().min(0),
    nextDueDate: isoDateSchema.nullable(),
    nextDueAmount: rialsSchema.nullable(),
    nextDueTitle: z.string().max(120).nullable().optional(),
  })
  .openapi("StudentPaymentSummary");
export type StudentPaymentSummary = z.infer<typeof studentPaymentSummarySchema>;
