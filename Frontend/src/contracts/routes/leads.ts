import {
  idParamSchema,
  paginatedEnvelope,
  successEnvelope,
} from "../common";
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
  leadExportQuerySchema,
  leadExportResultSchema,
  leadFromAssessmentSchema,
  leadImportBodySchema,
  leadImportQuerySchema,
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
} from "../leads";
import { studentCaseSchema } from "../students";
import { PUBLIC, requires, type RouteRegistrar } from "./helpers";
import { z } from "../zod";

const TAG = "Leads";
const CONSULTANT_SCOPE =
  "نقش consultant فقط سرنخ‌های اختصاص‌یافته به خودش را می‌بیند؛ admin همه را.";
const IF_MATCH =
  "هدر `If-Match` با مقدار `version` فعلی الزامی است؛ عدم تطابق → `409` با `error.reason=version_mismatch`.";

export function registerLeadRoutes(r: RouteRegistrar): void {
  const leadResponse = successEnvelope("LeadResponse", leadSchema);

  /* ----- Public intake ----- */

  r.route({
    method: "post",
    path: "/leads/assessment",
    tag: TAG,
    operationId: "createLeadFromAssessment",
    summary: "ثبت سرنخ از فرم ارزیابی",
    description:
      "ثبت فرم ارزیابی چندمرحله‌ای و دریافت پیشنهاد برنامه‌ها. منبع سرنخ `assessment` است. قوانین تخصیص خودکار اعمال می‌شود.",
    access: PUBLIC,
    body: { schema: leadFromAssessmentSchema },
    success: {
      status: 201,
      description: "سرنخ ثبت شد",
      schema: successEnvelope("AssessmentReceiptResponse", assessmentReceiptSchema),
    },
  });

  r.route({
    method: "post",
    path: "/leads/quick-contact",
    tag: TAG,
    operationId: "createLeadQuickContact",
    summary: "ثبت سرنخ از فرم سریع (درخواست تماس / تماس با ما / ارزیابی صفحه اصلی)",
    description:
      "فیلد honeypot `website` باید خالی باشد؛ در غیر این صورت درخواست بی‌صدا نادیده گرفته می‌شود و پاسخ موفق برمی‌گردد. قوانین تخصیص خودکار اعمال می‌شود.",
    access: PUBLIC,
    body: { schema: leadQuickContactSchema },
    success: {
      status: 201,
      description: "سرنخ ثبت شد",
      schema: successEnvelope("LeadReceiptResponse", leadReceiptSchema),
    },
  });

  r.route({
    method: "post",
    path: "/newsletter/subscriptions",
    tag: TAG,
    operationId: "subscribeNewsletter",
    summary: "عضویت در خبرنامه",
    access: PUBLIC,
    body: { schema: newsletterSubscribeSchema },
    success: { status: 204, description: "عضویت ثبت شد (تکراری هم موفق است)" },
  });

  /* ----- Import / export ----- */

  r.route({
    method: "post",
    path: "/leads/import",
    tag: TAG,
    operationId: "importLeads",
    summary: "ورود دسته‌ای سرنخ‌ها (پس از نگاشت ستون‌ها)",
    description:
      "کلاینت فایل CSV/XLSX را با SheetJS می‌خواند و سطرهای نگاشت‌شده را می‌فرستد. " +
      "`dryRun=true` فقط پیش‌نمایش؛ `dryRun=false` ثبت با تگ «ورودی‌شده از فایل»، `source=import` و `importId`. " +
      "حداکثر ۵٬۰۰۰ سطر. رفتار تکراری: reject | update | create.",
    access: requires("lead:import"),
    query: leadImportQuerySchema,
    body: { schema: leadImportBodySchema },
    success: {
      status: 200,
      description: "گزارش ورود",
      schema: successEnvelope("LeadImportReportResponse", leadImportReportSchema),
    },
  });

  r.route({
    method: "post",
    path: "/leads/imports/{importId}/revert",
    tag: TAG,
    operationId: "revertLeadImport",
    summary: "بازگردانی ورودی فایل",
    description:
      "فقط admin. لیدهایی با همان `importId` که فعالیت غیرسیستمی ندارند حذف می‌شوند.",
    access: requires("lead:import"),
    params: z.object({ importId: z.string().uuid() }).openapi("LeadImportIdParam"),
    success: {
      status: 200,
      description: "گزارش بازگردانی",
      schema: successEnvelope(
        "LeadImportRevertReportResponse",
        leadImportRevertReportSchema,
      ),
    },
  });

  r.route({
    method: "get",
    path: "/leads/export",
    tag: TAG,
    operationId: "exportLeads",
    summary: "خروجی CSV / XLSX سرنخ‌ها",
    description:
      "همان فیلترهای فهرست + `columns` و `format`. حداکثر ۵۰٬۰۰۰ سطر؛ بیش از آن → ۴۰۰. " +
      "CSV با UTF-8 BOM و محافظت CSV Injection. مشاور فقط سرنخ‌های خودش.",
    access: requires("lead:export"),
    query: leadExportQuerySchema,
    success: {
      status: 200,
      description: "فایل خروجی داخل envelope",
      schema: successEnvelope("LeadExportResultResponse", leadExportResultSchema),
    },
  });

  /* ----- Staff CRUD ----- */

  r.route({
    method: "get",
    path: "/leads",
    tag: TAG,
    operationId: "listLeads",
    summary: "فهرست سرنخ‌ها",
    description: CONSULTANT_SCOPE,
    access: requires("lead:read"),
    query: leadListQuerySchema,
    success: {
      status: 200,
      description: "فهرست صفحه‌بندی‌شده سرنخ‌ها",
      schema: paginatedEnvelope("LeadsPage", leadSchema),
    },
  });

  r.route({
    method: "post",
    path: "/leads",
    tag: TAG,
    operationId: "createLead",
    summary: "ثبت دستی سرنخ",
    description: "اگر assignedTo نباشد، قوانین تخصیص اعمال می‌شود.",
    access: requires("lead:write"),
    body: { schema: leadCreateSchema },
    success: { status: 201, description: "سرنخ ایجاد شد", schema: leadResponse },
    conflict: true,
  });

  r.route({
    method: "get",
    path: "/leads/{id}",
    tag: TAG,
    operationId: "getLead",
    summary: "دریافت سرنخ",
    description: CONSULTANT_SCOPE,
    access: requires("lead:read"),
    params: idParamSchema,
    success: { status: 200, description: "سرنخ", schema: leadResponse },
  });

  r.route({
    method: "patch",
    path: "/leads/{id}",
    tag: TAG,
    operationId: "updateLead",
    summary: "ویرایش اطلاعات سرنخ",
    description: IF_MATCH,
    access: requires("lead:write"),
    params: idParamSchema,
    body: { schema: leadUpdateSchema },
    success: { status: 200, description: "سرنخ ویرایش شد", schema: leadResponse },
    conflict: true,
  });

  r.route({
    method: "delete",
    path: "/leads/{id}",
    tag: TAG,
    operationId: "deleteLead",
    summary: "حذف سرنخ",
    access: requires("lead:delete"),
    params: idParamSchema,
    success: { status: 204, description: "سرنخ حذف شد" },
    conflict: true,
  });

  /* ----- Pipeline ----- */

  r.route({
    method: "patch",
    path: "/leads/{id}/stage",
    tag: TAG,
    operationId: "updateLeadStage",
    summary: "تغییر مرحله سرنخ در پایپ‌لاین",
    description: `${IF_MATCH} فعالیت \`stage_change\` ثبت می‌شود. برای kind=lost فیلد \`lostReasonId\` الزامی است.`,
    access: requires("lead:write"),
    params: idParamSchema,
    body: { schema: leadStageUpdateSchema },
    success: { status: 200, description: "مرحله تغییر کرد", schema: leadResponse },
    conflict: true,
  });

  r.route({
    method: "patch",
    path: "/leads/{id}/status",
    tag: TAG,
    operationId: "updateLeadStatus",
    summary: "تغییر وضعیت سرنخ (سازگاری با وضعیت ثابت قدیمی)",
    description:
      "Deprecated: وضعیت ثابت به stage نگاشت می‌شود. ترجیحاً از `PATCH /leads/{id}/stage` استفاده کنید.",
    access: requires("lead:write"),
    params: idParamSchema,
    body: { schema: leadStatusUpdateSchema },
    success: { status: 200, description: "وضعیت تغییر کرد", schema: leadResponse },
    conflict: true,
  });

  r.route({
    method: "put",
    path: "/leads/{id}/assignee",
    tag: TAG,
    operationId: "assignLead",
    summary: "اختصاص سرنخ به مشاور",
    description: `${IF_MATCH} \`assigneeId: null\` اختصاص را برمی‌دارد.`,
    access: requires("lead:assign"),
    params: idParamSchema,
    body: { schema: leadAssigneeUpdateSchema },
    success: { status: 200, description: "اختصاص انجام شد", schema: leadResponse },
    conflict: true,
  });

  r.route({
    method: "post",
    path: "/leads/{id}/convert",
    tag: TAG,
    operationId: "convertLeadToCase",
    summary: "تبدیل سرنخ به پرونده دانشجو",
    description:
      "پرونده از قالب کشور ساخته می‌شود؛ سرنخ به مرحله kind=won می‌رود.",
    access: requires("lead:write"),
    params: idParamSchema,
    body: { schema: leadConvertSchema },
    success: {
      status: 201,
      description: "پرونده ایجاد شد",
      schema: successEnvelope("StudentCaseResponse", studentCaseSchema),
    },
    conflict: true,
  });

  r.route({
    method: "get",
    path: "/leads/{id}/duplicates",
    tag: TAG,
    operationId: "listLeadDuplicates",
    summary: "یافتن سرنخ‌های تکراری",
    description: "تطبیق موبایل نرمال‌شده یا ایمیل یکسان.",
    access: requires("lead:read"),
    params: idParamSchema,
    success: {
      status: 200,
      description: "تکراری‌ها",
      schema: successEnvelope("LeadDuplicatesResponse", leadDuplicatesSchema),
    },
  });

  r.route({
    method: "post",
    path: "/leads/{id}/merge",
    tag: TAG,
    operationId: "mergeLead",
    summary: "ادغام سرنخ با مقصد",
    description:
      "فعالیت‌ها، کارها، رزروها و تگ‌ها به مقصد منتقل و مبدأ بایگانی می‌شود.",
    access: requires("lead:merge"),
    params: idParamSchema,
    body: { schema: leadMergeSchema },
    success: {
      status: 200,
      description: "ادغام شد؛ سرنخ مقصد برگردانده می‌شود",
      schema: leadResponse,
    },
    conflict: true,
  });

  /* ----- Activities ----- */

  r.route({
    method: "get",
    path: "/leads/{id}/activities",
    tag: TAG,
    operationId: "listLeadActivities",
    summary: "فهرست فعالیت‌های سرنخ",
    description: "جدیدترین فعالیت‌ها ابتدا (`order=desc` پیش‌فرض توصیه می‌شود).",
    access: requires("lead:read"),
    params: idParamSchema,
    query: activityListQuerySchema,
    success: {
      status: 200,
      description: "فهرست فعالیت‌ها",
      schema: paginatedEnvelope("ActivitiesPage", activitySchema),
    },
  });

  r.route({
    method: "post",
    path: "/leads/{id}/activities",
    tag: TAG,
    operationId: "createLeadActivity",
    summary: "ثبت فعالیت (یادداشت / تماس / پیام)",
    access: requires("lead:write"),
    params: idParamSchema,
    body: { schema: activityCreateSchema },
    success: {
      status: 201,
      description: "فعالیت ثبت شد",
      schema: successEnvelope("ActivityResponse", activitySchema),
    },
  });

  r.route({
    method: "patch",
    path: "/activities/{id}",
    tag: TAG,
    operationId: "updateActivity",
    summary: "ویرایش یادداشت",
    description: "فقط note؛ نویسنده یا admin.",
    access: requires("lead:write"),
    params: idParamSchema,
    body: { schema: activityUpdateSchema },
    success: {
      status: 200,
      description: "ویرایش شد",
      schema: successEnvelope("ActivityResponse", activitySchema),
    },
    conflict: true,
  });

  r.route({
    method: "delete",
    path: "/activities/{id}",
    tag: TAG,
    operationId: "deleteActivity",
    summary: "حذف فعالیت",
    description: "فقط admin.",
    access: requires("lead:delete"),
    params: idParamSchema,
    success: { status: 204, description: "حذف شد" },
  });
}
