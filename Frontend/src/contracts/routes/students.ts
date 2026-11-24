import { z } from "../zod";
import {
  fileAssetSchema,
  idParamSchema,
  paginatedEnvelope,
  successEnvelope,
  uploadFileBodySchema,
} from "../common";
import {
  activityCreateSchema,
  activityListQuerySchema,
  activitySchema,
} from "../leads";
import {
  advanceCaseStageSchema,
  caseStageSchema,
  checklistItemCreateSchema,
  checklistItemParamsSchema,
  checklistItemSchema,
  checklistItemUpdateSchema,
  checklistSchema,
  documentCreateSchema,
  documentListQuerySchema,
  documentRevertSchema,
  documentReviewSchema,
  documentSchema,
  stageParamsSchema,
  stageUpdateSchema,
  studentCaseCreateSchema,
  studentCaseListQuerySchema,
  studentCaseSchema,
  studentCaseUpdateSchema,
} from "../students";
import { STAFF_ROLES } from "../auth";
import { requires, type RouteRegistrar } from "./helpers";

const CASES = "Cases";
const DOCUMENTS = "Documents";
const CHECKLIST = "Checklist";
const FILES = "Files";

const OWNERSHIP =
  "دانشجو فقط پرونده خودش، consultant فقط پرونده‌های اختصاص‌یافته و admin همه را می‌بیند.";

export function registerStudentRoutes(r: RouteRegistrar): void {
  const caseResponse = successEnvelope("StudentCaseResponse", studentCaseSchema);
  const documentResponse = successEnvelope("DocumentResponse", documentSchema);

  /* ----- Files ----- */

  r.route({
    method: "post",
    path: "/files",
    tag: FILES,
    operationId: "uploadFile",
    summary: "آپلود فایل",
    description:
      "فایل را آپلود می‌کند و `FileAsset` برمی‌گرداند؛ سپس `id` آن در ساخت سند یا پیام تیکت استفاده می‌شود. حداکثر ۱۰ مگابایت؛ فرمت‌های pdf، jpg، png، webp.",
    access: requires("document:upload"),
    body: { schema: uploadFileBodySchema, contentType: "multipart/form-data" },
    success: {
      status: 201,
      description: "فایل آپلود شد",
      schema: successEnvelope("FileAssetResponse", fileAssetSchema),
    },
  });

  /* ----- Cases ----- */

  r.route({
    method: "get",
    path: "/cases",
    tag: CASES,
    operationId: "listCases",
    summary: "فهرست پرونده‌های دانشجویی",
    description: OWNERSHIP,
    access: requires("case:read", STAFF_ROLES),
    query: studentCaseListQuerySchema,
    success: {
      status: 200,
      description: "فهرست صفحه‌بندی‌شده پرونده‌ها",
      schema: paginatedEnvelope("StudentCasesPage", studentCaseSchema),
    },
  });

  r.route({
    method: "get",
    path: "/me/cases",
    tag: CASES,
    operationId: "listMyCases",
    summary: "پرونده‌های من",
    access: requires("student:read", ["student"]),
    success: {
      status: 200,
      description: "پرونده‌های دانشجوی جاری",
      schema: successEnvelope("MyCasesResponse", z.array(studentCaseSchema)),
    },
  });

  r.route({
    method: "post",
    path: "/cases",
    tag: CASES,
    operationId: "createCase",
    summary: "ایجاد پرونده",
    description:
      "همه مراحل با وضعیت `not_started` ساخته می‌شوند، چک‌لیست پیش‌فرض و وظایف قالب مرحله اول ایجاد می‌شوند.",
    access: requires("case:write", STAFF_ROLES),
    body: { schema: studentCaseCreateSchema },
    success: { status: 201, description: "پرونده ایجاد شد", schema: caseResponse },
    conflict: true,
  });

  r.route({
    method: "get",
    path: "/cases/{id}",
    tag: CASES,
    operationId: "getCase",
    summary: "دریافت پرونده",
    description: OWNERSHIP,
    access: requires("student:read"),
    params: idParamSchema,
    success: { status: 200, description: "پرونده", schema: caseResponse },
  });

  r.route({
    method: "patch",
    path: "/cases/{id}",
    tag: CASES,
    operationId: "updateCase",
    summary: "ویرایش پرونده",
    description:
      "هدر `If-Match` با `version` الزامی است؛ عدم تطابق → `409 version_mismatch`.",
    access: requires("case:write", STAFF_ROLES),
    params: idParamSchema,
    body: { schema: studentCaseUpdateSchema },
    success: { status: 200, description: "پرونده ویرایش شد", schema: caseResponse },
    conflict: true,
  });

  r.route({
    method: "put",
    path: "/cases/{id}/stages/{stage}",
    tag: CASES,
    operationId: "updateCaseStage",
    summary: "تغییر وضعیت یک مرحله پرونده",
    description:
      `\`stage\` یکی از مقادیر ${caseStageSchema.options.join("، ")} است. با \`in_progress\` شدن یک مرحله، \`currentStage\` به‌روز می‌شود.`,
    access: requires("student:stage"),
    params: stageParamsSchema,
    body: { schema: stageUpdateSchema },
    success: { status: 200, description: "مرحله به‌روز شد", schema: caseResponse },
    conflict: true,
  });

  r.route({
    method: "post",
    path: "/cases/{id}/advance-stage",
    tag: CASES,
    operationId: "advanceCaseStage",
    summary: "پیشبرد پرونده به مرحله بعد",
    description:
      "بدون `toStageKey` به مرحله بعدی قالب می‌رود. اگر مدارک الزامی تأیید نشده باشند → `409` مگر `overrideIncomplete` توسط admin با `overrideReason`. ورود به مرحله، وظایف پیش‌فرض قالب را می‌سازد. هدر `If-Match` الزامی است.",
    access: requires("case:write", STAFF_ROLES),
    params: idParamSchema,
    body: { schema: advanceCaseStageSchema },
    success: { status: 200, description: "مرحله پیش رفت", schema: caseResponse },
    conflict: true,
  });

  /* ----- Case activities ----- */

  r.route({
    method: "get",
    path: "/cases/{id}/activities",
    tag: CASES,
    operationId: "listCaseActivities",
    summary: "فهرست فعالیت‌های پرونده",
    description: "همان مدل Activity لید با `entityType=case`. کارمند با `case:read`؛ مالکیت در handler.",
    access: requires("case:read", STAFF_ROLES),
    params: idParamSchema,
    query: activityListQuerySchema,
    success: {
      status: 200,
      description: "فهرست فعالیت‌ها",
      schema: paginatedEnvelope("CaseActivitiesPage", activitySchema),
    },
  });

  r.route({
    method: "post",
    path: "/cases/{id}/activities",
    tag: CASES,
    operationId: "createCaseActivity",
    summary: "ثبت فعالیت پرونده (یادداشت / تماس / پیام)",
    access: requires("case:write", STAFF_ROLES),
    params: idParamSchema,
    body: { schema: activityCreateSchema },
    success: {
      status: 201,
      description: "فعالیت ثبت شد",
      schema: successEnvelope("CaseActivityResponse", activitySchema),
    },
  });

  /* ----- Documents ----- */

  r.route({
    method: "get",
    path: "/cases/{id}/documents",
    tag: DOCUMENTS,
    operationId: "listCaseDocuments",
    summary: "فهرست مدارک پرونده",
    access: requires("student:read"),
    params: idParamSchema,
    query: documentListQuerySchema,
    success: {
      status: 200,
      description: "فهرست مدارک",
      schema: paginatedEnvelope("DocumentsPage", documentSchema),
    },
  });

  r.route({
    method: "post",
    path: "/cases/{id}/documents",
    tag: DOCUMENTS,
    operationId: "createCaseDocument",
    summary: "ثبت مدرک جدید برای پرونده",
    description:
      "ابتدا فایل را با `POST /files` آپلود کنید. مدرک جدید `uploaded` است. جایگزینی: آپلود روی همان `checklistItemId` نسخه قبلی را در `versions` نگه می‌دارد. `custom=true` برای مدرک خارج از قالب.",
    access: requires("document:upload"),
    params: idParamSchema,
    body: { schema: documentCreateSchema },
    success: { status: 201, description: "مدرک ثبت شد", schema: documentResponse },
  });

  r.route({
    method: "get",
    path: "/documents/{id}",
    tag: DOCUMENTS,
    operationId: "getDocument",
    summary: "دریافت مدرک",
    access: requires("student:read"),
    params: idParamSchema,
    success: { status: 200, description: "مدرک", schema: documentResponse },
  });

  r.route({
    method: "delete",
    path: "/documents/{id}",
    tag: DOCUMENTS,
    operationId: "deleteDocument",
    summary: "حذف مدرک",
    description:
      "فقط admin. مدارک تأییدشده قفل‌اند مگر با `POST /documents/{id}/revert`. دانشجو فقط `uploaded`/`rejected`/`pending` خودش را می‌تواند حذف کند.",
    access: requires("document:upload"),
    params: idParamSchema,
    success: { status: 204, description: "مدرک حذف شد" },
    conflict: true,
  });

  r.route({
    method: "post",
    path: "/documents/{id}/review",
    tag: DOCUMENTS,
    operationId: "reviewDocument",
    summary: "تأیید یا رد مدرک",
    description:
      "برای رد کردن، `rejectionReason` الزامی است و اعلان + پیام برای دانشجو ساخته می‌شود. مدرک باید `pending` یا `uploaded` باشد. هدر `If-Match` الزامی است. مجوز: `case:review`.",
    access: requires("case:review"),
    params: idParamSchema,
    body: { schema: documentReviewSchema },
    success: { status: 200, description: "بررسی ثبت شد", schema: documentResponse },
    conflict: true,
  });

  r.route({
    method: "post",
    path: "/documents/{id}/revert",
    tag: DOCUMENTS,
    operationId: "revertDocument",
    summary: "بازگردانی مدرک تأییدشده (فقط admin)",
    description:
      "مدرک `approved` را به `uploaded` برمی‌گرداند تا قابل جایگزینی/حذف باشد. هدر `If-Match` الزامی است.",
    access: requires("case:write", ["admin"]),
    params: idParamSchema,
    body: { schema: documentRevertSchema },
    success: { status: 200, description: "بازگردانی شد", schema: documentResponse },
    conflict: true,
  });

  /* ----- Checklist ----- */

  r.route({
    method: "get",
    path: "/cases/{id}/checklist",
    tag: CHECKLIST,
    operationId: "getCaseChecklist",
    summary: "چک‌لیست پرونده",
    access: requires("student:read"),
    params: idParamSchema,
    success: {
      status: 200,
      description: "چک‌لیست",
      schema: successEnvelope("ChecklistResponse", checklistSchema),
    },
  });

  const itemResponse = successEnvelope("ChecklistItemResponse", checklistItemSchema);

  r.route({
    method: "post",
    path: "/cases/{id}/checklist/items",
    tag: CHECKLIST,
    operationId: "createChecklistItem",
    summary: "افزودن آیتم به چک‌لیست",
    access: requires("student:write", STAFF_ROLES),
    params: idParamSchema,
    body: { schema: checklistItemCreateSchema },
    success: { status: 201, description: "آیتم افزوده شد", schema: itemResponse },
  });

  r.route({
    method: "patch",
    path: "/cases/{id}/checklist/items/{itemId}",
    tag: CHECKLIST,
    operationId: "updateChecklistItem",
    summary: "ویرایش آیتم چک‌لیست",
    description: "دانشجو فقط می‌تواند `done` را تغییر دهد؛ سایر فیلدها فقط برای کارمندان است.",
    access: requires("student:write"),
    params: checklistItemParamsSchema,
    body: { schema: checklistItemUpdateSchema },
    success: { status: 200, description: "آیتم ویرایش شد", schema: itemResponse },
  });

  r.route({
    method: "delete",
    path: "/cases/{id}/checklist/items/{itemId}",
    tag: CHECKLIST,
    operationId: "deleteChecklistItem",
    summary: "حذف آیتم چک‌لیست",
    access: requires("student:write", STAFF_ROLES),
    params: checklistItemParamsSchema,
    success: { status: 204, description: "آیتم حذف شد" },
  });
}
