import {
  idParamSchema,
  paginatedEnvelope,
  successEnvelope,
} from "../common";
import {
  assignmentRuleCreateSchema,
  assignmentRuleSchema,
  assignmentRuleUpdateSchema,
  auditLogListQuerySchema,
  auditLogSchema,
  caseTemplateCreateSchema,
  caseTemplateSchema,
  caseTemplateUpdateSchema,
  consultantsReportSchema,
  funnelReportSchema,
  lostReasonCreateSchema,
  lostReasonSchema,
  lostReasonUpdateSchema,
  messageTemplateCreateSchema,
  messageTemplateSchema,
  messageTemplateUpdateSchema,
  notificationBulkReadSchema,
  notificationListQuerySchema,
  notificationPreferencesSchema,
  notificationPreferencesUpdateSchema,
  notificationSchema,
  pipelineStageCreateSchema,
  pipelineStageReorderSchema,
  pipelineStageSchema,
  pipelineStageUpdateSchema,
  renderTemplateInputSchema,
  renderTemplateResultSchema,
  reportRangeQuerySchema,
  savedViewCreateSchema,
  savedViewListQuerySchema,
  savedViewSchema,
  savedViewUpdateSchema,
  sourcesReportSchema,
  tagCreateSchema,
  tagSchema,
  tagUpdateSchema,
  taskBulkCompleteSchema,
  taskCountsQuerySchema,
  taskCountsSchema,
  taskCreateSchema,
  taskListQuerySchema,
  taskProcessRemindersResultSchema,
  taskSchema,
  taskSnoozeSchema,
  taskUpdateSchema,
  timeseriesReportQuerySchema,
  timeseriesReportSchema,
  ticketsReportSchema,
  unreadCountSchema,
} from "../crm";
import {
  assignmentRulesSettingsReplaceSchema,
  assignmentRulesSettingsSchema,
  assignmentSimulateInputSchema,
  assignmentSimulateResultSchema,
  campaignCostsSettingsReplaceSchema,
  campaignCostsSettingsSchema,
  caseTemplateCopySchema,
  caseTemplatesSettingsReplaceSchema,
  caseTemplatesSettingsSchema,
  crmDefaultsSettingsReplaceSchema,
  crmDefaultsSettingsSchema,
  lostReasonsSettingsReplaceSchema,
  lostReasonsSettingsSchema,
  messageTemplatesSettingsReplaceSchema,
  messageTemplatesSettingsSchema,
  pipelineSettingsReplaceSchema,
  pipelineSettingsSchema,
  tagMergeSchema,
  tagsSettingsReplaceSchema,
  tagsSettingsSchema,
  tagWithUsageSchema,
} from "../crm-settings";
import { STAFF_ROLES } from "../auth";
import { requires, type RouteRegistrar } from "./helpers";
import { z } from "../zod";

const CRM_SETTINGS_IF_MATCH =
  "هدر `If-Match` با مقدار `version` فعلی الزامی است؛ عدم تطابق → `409` با `error.reason=version_mismatch`.";

export function registerCrmRoutes(r: RouteRegistrar): void {
  /* ----- Versioned CRM settings (admin tabs) ----- */

  r.route({
    method: "get",
    path: "/crm-settings/pipeline",
    tag: "CRM Settings",
    operationId: "getPipelineSettings",
    summary: "تنظیمات پایپ‌لاین (نسخه‌دار)",
    access: requires("crm-settings:manage"),
    success: {
      status: 200,
      description: "مراحل + نسخه",
      schema: successEnvelope("PipelineSettingsResponse", pipelineSettingsSchema),
    },
  });

  r.route({
    method: "put",
    path: "/crm-settings/pipeline",
    tag: "CRM Settings",
    operationId: "replacePipelineSettings",
    summary: "ذخیره یکجای پایپ‌لاین",
    description: `${CRM_SETTINGS_IF_MATCH} حداقل یک مرحله از هر kind؛ حذف مرحله دارای لید فقط با migrateLeads.`,
    access: requires("crm-settings:manage"),
    body: { schema: pipelineSettingsReplaceSchema },
    success: {
      status: 200,
      description: "ذخیره شد",
      schema: successEnvelope("PipelineSettingsPutResponse", pipelineSettingsSchema),
    },
    conflict: true,
  });

  r.route({
    method: "post",
    path: "/crm-settings/pipeline/reset",
    tag: "CRM Settings",
    operationId: "resetPipelineSettings",
    summary: "بازگشت پایپ‌لاین به پیش‌فرض seed",
    description: CRM_SETTINGS_IF_MATCH,
    access: requires("crm-settings:manage"),
    success: {
      status: 200,
      description: "بازنشانی شد",
      schema: successEnvelope(
        "PipelineSettingsResetResponse",
        pipelineSettingsSchema,
      ),
    },
    conflict: true,
  });

  r.route({
    method: "get",
    path: "/crm-settings/lost-reasons",
    tag: "CRM Settings",
    operationId: "getLostReasonsSettings",
    summary: "تنظیمات دلایل ریزش",
    access: requires("crm-settings:manage"),
    success: {
      status: 200,
      description: "دلایل + نسخه",
      schema: successEnvelope(
        "LostReasonsSettingsResponse",
        lostReasonsSettingsSchema,
      ),
    },
  });

  r.route({
    method: "put",
    path: "/crm-settings/lost-reasons",
    tag: "CRM Settings",
    operationId: "replaceLostReasonsSettings",
    summary: "ذخیره دلایل ریزش",
    description: CRM_SETTINGS_IF_MATCH,
    access: requires("crm-settings:manage"),
    body: { schema: lostReasonsSettingsReplaceSchema },
    success: {
      status: 200,
      description: "ذخیره شد",
      schema: successEnvelope(
        "LostReasonsSettingsPutResponse",
        lostReasonsSettingsSchema,
      ),
    },
    conflict: true,
  });

  r.route({
    method: "post",
    path: "/crm-settings/lost-reasons/reset",
    tag: "CRM Settings",
    operationId: "resetLostReasonsSettings",
    summary: "بازگشت دلایل ریزش به پیش‌فرض",
    description: CRM_SETTINGS_IF_MATCH,
    access: requires("crm-settings:manage"),
    success: {
      status: 200,
      description: "بازنشانی شد",
      schema: successEnvelope(
        "LostReasonsSettingsResetResponse",
        lostReasonsSettingsSchema,
      ),
    },
    conflict: true,
  });

  r.route({
    method: "get",
    path: "/crm-settings/tags",
    tag: "CRM Settings",
    operationId: "getTagsSettings",
    summary: "تنظیمات تگ‌ها (با شمارش استفاده)",
    access: requires("crm-settings:manage"),
    success: {
      status: 200,
      description: "تگ‌ها + نسخه",
      schema: successEnvelope("TagsSettingsResponse", tagsSettingsSchema),
    },
  });

  r.route({
    method: "put",
    path: "/crm-settings/tags",
    tag: "CRM Settings",
    operationId: "replaceTagsSettings",
    summary: "ذخیره تگ‌ها",
    description: CRM_SETTINGS_IF_MATCH,
    access: requires("crm-settings:manage"),
    body: { schema: tagsSettingsReplaceSchema },
    success: {
      status: 200,
      description: "ذخیره شد",
      schema: successEnvelope("TagsSettingsPutResponse", tagsSettingsSchema),
    },
    conflict: true,
  });

  r.route({
    method: "post",
    path: "/crm-settings/tags/reset",
    tag: "CRM Settings",
    operationId: "resetTagsSettings",
    summary: "بازگشت تگ‌ها به پیش‌فرض",
    description: CRM_SETTINGS_IF_MATCH,
    access: requires("crm-settings:manage"),
    success: {
      status: 200,
      description: "بازنشانی شد",
      schema: successEnvelope("TagsSettingsResetResponse", tagsSettingsSchema),
    },
    conflict: true,
  });

  r.route({
    method: "post",
    path: "/tags/merge",
    tag: "CRM Settings",
    operationId: "mergeTags",
    summary: "ادغام دو تگ",
    description:
      "لیدهای تگ مبدأ به مقصد منتقل و تگ مبدأ حذف می‌شود. نسخه تنظیمات تگ افزایش می‌یابد.",
    access: requires("crm-settings:manage"),
    body: { schema: tagMergeSchema },
    success: {
      status: 200,
      description: "ادغام شد",
      schema: successEnvelope("TagMergeResponse", tagWithUsageSchema),
    },
    conflict: true,
  });

  r.route({
    method: "get",
    path: "/crm-settings/assignment-rules",
    tag: "CRM Settings",
    operationId: "getAssignmentRulesSettings",
    summary: "تنظیمات قوانین تخصیص",
    access: requires("crm-settings:manage"),
    success: {
      status: 200,
      description: "قوانین + نسخه",
      schema: successEnvelope(
        "AssignmentRulesSettingsResponse",
        assignmentRulesSettingsSchema,
      ),
    },
  });

  r.route({
    method: "put",
    path: "/crm-settings/assignment-rules",
    tag: "CRM Settings",
    operationId: "replaceAssignmentRulesSettings",
    summary: "ذخیره قوانین تخصیص",
    description: CRM_SETTINGS_IF_MATCH,
    access: requires("crm-settings:manage"),
    body: { schema: assignmentRulesSettingsReplaceSchema },
    success: {
      status: 200,
      description: "ذخیره شد",
      schema: successEnvelope(
        "AssignmentRulesSettingsPutResponse",
        assignmentRulesSettingsSchema,
      ),
    },
    conflict: true,
  });

  r.route({
    method: "post",
    path: "/crm-settings/assignment-rules/reset",
    tag: "CRM Settings",
    operationId: "resetAssignmentRulesSettings",
    summary: "بازگشت قوانین تخصیص به پیش‌فرض",
    description: CRM_SETTINGS_IF_MATCH,
    access: requires("crm-settings:manage"),
    success: {
      status: 200,
      description: "بازنشانی شد",
      schema: successEnvelope(
        "AssignmentRulesSettingsResetResponse",
        assignmentRulesSettingsSchema,
      ),
    },
    conflict: true,
  });

  r.route({
    method: "post",
    path: "/assignment-rules/simulate",
    tag: "CRM Settings",
    operationId: "simulateAssignmentRule",
    summary: "شبیه‌ساز قانون تخصیص",
    access: requires("crm-settings:manage"),
    body: { schema: assignmentSimulateInputSchema },
    success: {
      status: 200,
      description: "نتیجه شبیه‌سازی",
      schema: successEnvelope(
        "AssignmentSimulateResultResponse",
        assignmentSimulateResultSchema,
      ),
    },
  });

  r.route({
    method: "get",
    path: "/crm-settings/message-templates",
    tag: "CRM Settings",
    operationId: "getMessageTemplatesSettings",
    summary: "تنظیمات قالب پیام",
    access: requires("crm-settings:manage"),
    success: {
      status: 200,
      description: "قالب‌ها + نسخه",
      schema: successEnvelope(
        "MessageTemplatesSettingsResponse",
        messageTemplatesSettingsSchema,
      ),
    },
  });

  r.route({
    method: "put",
    path: "/crm-settings/message-templates",
    tag: "CRM Settings",
    operationId: "replaceMessageTemplatesSettings",
    summary: "ذخیره قالب‌های پیام",
    description: `${CRM_SETTINGS_IF_MATCH} متغیرهای ناشناخته رد می‌شوند.`,
    access: requires("crm-settings:manage"),
    body: { schema: messageTemplatesSettingsReplaceSchema },
    success: {
      status: 200,
      description: "ذخیره شد",
      schema: successEnvelope(
        "MessageTemplatesSettingsPutResponse",
        messageTemplatesSettingsSchema,
      ),
    },
    conflict: true,
  });

  r.route({
    method: "post",
    path: "/crm-settings/message-templates/reset",
    tag: "CRM Settings",
    operationId: "resetMessageTemplatesSettings",
    summary: "بازگشت قالب پیام به پیش‌فرض",
    description: CRM_SETTINGS_IF_MATCH,
    access: requires("crm-settings:manage"),
    success: {
      status: 200,
      description: "بازنشانی شد",
      schema: successEnvelope(
        "MessageTemplatesSettingsResetResponse",
        messageTemplatesSettingsSchema,
      ),
    },
    conflict: true,
  });

  r.route({
    method: "get",
    path: "/crm-settings/case-templates",
    tag: "CRM Settings",
    operationId: "getCaseTemplatesSettings",
    summary: "تنظیمات قالب پرونده",
    access: requires("crm-settings:manage"),
    success: {
      status: 200,
      description: "قالب‌ها + نسخه",
      schema: successEnvelope(
        "CaseTemplatesSettingsResponse",
        caseTemplatesSettingsSchema,
      ),
    },
  });

  r.route({
    method: "put",
    path: "/crm-settings/case-templates",
    tag: "CRM Settings",
    operationId: "replaceCaseTemplatesSettings",
    summary: "ذخیره قالب‌های پرونده",
    description: `${CRM_SETTINGS_IF_MATCH} حذف قالبی که پرونده فعال دارد → 409.`,
    access: requires("crm-settings:manage"),
    body: { schema: caseTemplatesSettingsReplaceSchema },
    success: {
      status: 200,
      description: "ذخیره شد",
      schema: successEnvelope(
        "CaseTemplatesSettingsPutResponse",
        caseTemplatesSettingsSchema,
      ),
    },
    conflict: true,
  });

  r.route({
    method: "post",
    path: "/crm-settings/case-templates/reset",
    tag: "CRM Settings",
    operationId: "resetCaseTemplatesSettings",
    summary: "بازگشت قالب پرونده به پیش‌فرض",
    description: CRM_SETTINGS_IF_MATCH,
    access: requires("crm-settings:manage"),
    success: {
      status: 200,
      description: "بازنشانی شد",
      schema: successEnvelope(
        "CaseTemplatesSettingsResetResponse",
        caseTemplatesSettingsSchema,
      ),
    },
    conflict: true,
  });

  r.route({
    method: "post",
    path: "/case-templates/copy",
    tag: "CRM Settings",
    operationId: "copyCaseTemplate",
    summary: "کپی قالب پرونده از کشور دیگر",
    access: requires("crm-settings:manage"),
    body: { schema: caseTemplateCopySchema },
    success: {
      status: 201,
      description: "کپی ایجاد شد",
      schema: successEnvelope("CaseTemplateCopyResponse", caseTemplateSchema),
    },
    conflict: true,
  });

  r.route({
    method: "get",
    path: "/crm-settings/campaign-costs",
    tag: "CRM Settings",
    operationId: "getCampaignCostsSettings",
    summary: "هزینه ماهانه کمپین‌ها",
    access: requires("crm-settings:manage"),
    success: {
      status: 200,
      description: "هزینه‌ها + نسخه",
      schema: successEnvelope(
        "CampaignCostsSettingsResponse",
        campaignCostsSettingsSchema,
      ),
    },
  });

  r.route({
    method: "put",
    path: "/crm-settings/campaign-costs",
    tag: "CRM Settings",
    operationId: "replaceCampaignCostsSettings",
    summary: "ذخیره هزینه کمپین‌ها",
    description: CRM_SETTINGS_IF_MATCH,
    access: requires("crm-settings:manage"),
    body: { schema: campaignCostsSettingsReplaceSchema },
    success: {
      status: 200,
      description: "ذخیره شد",
      schema: successEnvelope(
        "CampaignCostsSettingsPutResponse",
        campaignCostsSettingsSchema,
      ),
    },
    conflict: true,
  });

  r.route({
    method: "post",
    path: "/crm-settings/campaign-costs/reset",
    tag: "CRM Settings",
    operationId: "resetCampaignCostsSettings",
    summary: "پاک‌سازی هزینه کمپین‌ها (پیش‌فرض خالی)",
    description: CRM_SETTINGS_IF_MATCH,
    access: requires("crm-settings:manage"),
    success: {
      status: 200,
      description: "بازنشانی شد",
      schema: successEnvelope(
        "CampaignCostsSettingsResetResponse",
        campaignCostsSettingsSchema,
      ),
    },
    conflict: true,
  });

  r.route({
    method: "get",
    path: "/crm-settings/defaults",
    tag: "CRM Settings",
    operationId: "getCrmDefaultsSettings",
    summary: "پیش‌فرض‌های CRM",
    access: requires("crm-settings:manage"),
    success: {
      status: 200,
      description: "پیش‌فرض‌ها + نسخه",
      schema: successEnvelope(
        "CrmDefaultsSettingsResponse",
        crmDefaultsSettingsSchema,
      ),
    },
  });

  r.route({
    method: "put",
    path: "/crm-settings/defaults",
    tag: "CRM Settings",
    operationId: "replaceCrmDefaultsSettings",
    summary: "ذخیره پیش‌فرض‌های CRM",
    description: CRM_SETTINGS_IF_MATCH,
    access: requires("crm-settings:manage"),
    body: { schema: crmDefaultsSettingsReplaceSchema },
    success: {
      status: 200,
      description: "ذخیره شد",
      schema: successEnvelope(
        "CrmDefaultsSettingsPutResponse",
        crmDefaultsSettingsSchema,
      ),
    },
    conflict: true,
  });

  r.route({
    method: "post",
    path: "/crm-settings/defaults/reset",
    tag: "CRM Settings",
    operationId: "resetCrmDefaultsSettings",
    summary: "بازگشت پیش‌فرض‌های CRM به seed",
    description: CRM_SETTINGS_IF_MATCH,
    access: requires("crm-settings:manage"),
    success: {
      status: 200,
      description: "بازنشانی شد",
      schema: successEnvelope(
        "CrmDefaultsSettingsResetResponse",
        crmDefaultsSettingsSchema,
      ),
    },
    conflict: true,
  });

  /* ----- Pipeline stages ----- */

  const stageResponse = successEnvelope("PipelineStageResponse", pipelineStageSchema);

  r.route({
    method: "get",
    path: "/pipeline/stages",
    tag: "CRM Settings",
    operationId: "listPipelineStages",
    summary: "فهرست مراحل پایپ‌لاین",
    access: requires("lead:read", STAFF_ROLES),
    success: {
      status: 200,
      description: "مراحل به ترتیب order",
      schema: successEnvelope(
        "PipelineStagesResponse",
        z.array(pipelineStageSchema),
      ),
    },
  });

  r.route({
    method: "post",
    path: "/pipeline/stages",
    tag: "CRM Settings",
    operationId: "createPipelineStage",
    summary: "افزودن مرحله پایپ‌لاین",
    access: requires("crm-settings:manage"),
    body: { schema: pipelineStageCreateSchema },
    success: { status: 201, description: "مرحله ایجاد شد", schema: stageResponse },
    conflict: true,
  });

  r.route({
    method: "patch",
    path: "/pipeline/stages/{id}",
    tag: "CRM Settings",
    operationId: "updatePipelineStage",
    summary: "ویرایش مرحله پایپ‌لاین",
    description:
      "حداقل یک مرحله از هر kind باید بماند؛ در غیر این صورت `409 CONFLICT`.",
    access: requires("crm-settings:manage"),
    params: idParamSchema,
    body: { schema: pipelineStageUpdateSchema },
    success: { status: 200, description: "مرحله ویرایش شد", schema: stageResponse },
    conflict: true,
  });

  r.route({
    method: "delete",
    path: "/pipeline/stages/{id}",
    tag: "CRM Settings",
    operationId: "deletePipelineStage",
    summary: "حذف مرحله پایپ‌لاین",
    description:
      "اگر سرنخ‌هایی در این مرحله باشند یا آخرین مرحلهٔ یک kind باشد → `409`.",
    access: requires("crm-settings:manage"),
    params: idParamSchema,
    success: { status: 204, description: "مرحله حذف شد" },
    conflict: true,
  });

  r.route({
    method: "post",
    path: "/pipeline/stages/reorder",
    tag: "CRM Settings",
    operationId: "reorderPipelineStages",
    summary: "مرتب‌سازی مجدد مراحل",
    access: requires("crm-settings:manage"),
    body: { schema: pipelineStageReorderSchema },
    success: {
      status: 200,
      description: "مرتب شد",
      schema: successEnvelope(
        "PipelineStagesReorderedResponse",
        z.array(pipelineStageSchema),
      ),
    },
  });

  /* ----- Lost reasons ----- */

  const lostResponse = successEnvelope("LostReasonResponse", lostReasonSchema);

  r.route({
    method: "get",
    path: "/lost-reasons",
    tag: "CRM Settings",
    operationId: "listLostReasons",
    summary: "فهرست دلایل ریزش",
    access: requires("lead:read", STAFF_ROLES),
    success: {
      status: 200,
      description: "دلایل ریزش",
      schema: successEnvelope("LostReasonsResponse", z.array(lostReasonSchema)),
    },
  });

  r.route({
    method: "post",
    path: "/lost-reasons",
    tag: "CRM Settings",
    operationId: "createLostReason",
    summary: "افزودن دلیل ریزش",
    access: requires("crm-settings:manage"),
    body: { schema: lostReasonCreateSchema },
    success: { status: 201, description: "ایجاد شد", schema: lostResponse },
  });

  r.route({
    method: "patch",
    path: "/lost-reasons/{id}",
    tag: "CRM Settings",
    operationId: "updateLostReason",
    summary: "ویرایش دلیل ریزش",
    access: requires("crm-settings:manage"),
    params: idParamSchema,
    body: { schema: lostReasonUpdateSchema },
    success: { status: 200, description: "ویرایش شد", schema: lostResponse },
  });

  r.route({
    method: "delete",
    path: "/lost-reasons/{id}",
    tag: "CRM Settings",
    operationId: "deleteLostReason",
    summary: "حذف دلیل ریزش",
    access: requires("crm-settings:manage"),
    params: idParamSchema,
    success: { status: 204, description: "حذف شد" },
    conflict: true,
  });

  /* ----- Tags ----- */

  const tagResponse = successEnvelope("TagResponse", tagSchema);

  r.route({
    method: "get",
    path: "/tags",
    tag: "CRM Settings",
    operationId: "listTags",
    summary: "فهرست برچسب‌ها",
    access: requires("lead:read", STAFF_ROLES),
    success: {
      status: 200,
      description: "برچسب‌ها",
      schema: successEnvelope("TagsResponse", z.array(tagSchema)),
    },
  });

  r.route({
    method: "post",
    path: "/tags",
    tag: "CRM Settings",
    operationId: "createTag",
    summary: "افزودن برچسب",
    access: requires("crm-settings:manage"),
    body: { schema: tagCreateSchema },
    success: { status: 201, description: "ایجاد شد", schema: tagResponse },
    conflict: true,
  });

  r.route({
    method: "patch",
    path: "/tags/{id}",
    tag: "CRM Settings",
    operationId: "updateTag",
    summary: "ویرایش برچسب",
    access: requires("crm-settings:manage"),
    params: idParamSchema,
    body: { schema: tagUpdateSchema },
    success: { status: 200, description: "ویرایش شد", schema: tagResponse },
  });

  r.route({
    method: "delete",
    path: "/tags/{id}",
    tag: "CRM Settings",
    operationId: "deleteTag",
    summary: "حذف برچسب",
    access: requires("crm-settings:manage"),
    params: idParamSchema,
    success: { status: 204, description: "حذف شد" },
  });

  /* ----- Assignment rules ----- */

  const ruleResponse = successEnvelope(
    "AssignmentRuleResponse",
    assignmentRuleSchema,
  );

  r.route({
    method: "get",
    path: "/assignment-rules",
    tag: "CRM Settings",
    operationId: "listAssignmentRules",
    summary: "قوانین تخصیص خودکار",
    access: requires("crm-settings:manage"),
    success: {
      status: 200,
      description: "قوانین به ترتیب order",
      schema: successEnvelope(
        "AssignmentRulesResponse",
        z.array(assignmentRuleSchema),
      ),
    },
  });

  r.route({
    method: "post",
    path: "/assignment-rules",
    tag: "CRM Settings",
    operationId: "createAssignmentRule",
    summary: "افزودن قانون تخصیص",
    access: requires("crm-settings:manage"),
    body: { schema: assignmentRuleCreateSchema },
    success: { status: 201, description: "ایجاد شد", schema: ruleResponse },
  });

  r.route({
    method: "patch",
    path: "/assignment-rules/{id}",
    tag: "CRM Settings",
    operationId: "updateAssignmentRule",
    summary: "ویرایش قانون تخصیص",
    access: requires("crm-settings:manage"),
    params: idParamSchema,
    body: { schema: assignmentRuleUpdateSchema },
    success: { status: 200, description: "ویرایش شد", schema: ruleResponse },
  });

  r.route({
    method: "delete",
    path: "/assignment-rules/{id}",
    tag: "CRM Settings",
    operationId: "deleteAssignmentRule",
    summary: "حذف قانون تخصیص",
    access: requires("crm-settings:manage"),
    params: idParamSchema,
    success: { status: 204, description: "حذف شد" },
  });

  /* ----- Message templates ----- */

  const tplResponse = successEnvelope(
    "MessageTemplateResponse",
    messageTemplateSchema,
  );

  r.route({
    method: "get",
    path: "/message-templates",
    tag: "CRM Settings",
    operationId: "listMessageTemplates",
    summary: "قالب‌های پیام",
    access: requires("lead:write", STAFF_ROLES),
    success: {
      status: 200,
      description: "قالب‌ها",
      schema: successEnvelope(
        "MessageTemplatesResponse",
        z.array(messageTemplateSchema),
      ),
    },
  });

  r.route({
    method: "post",
    path: "/message-templates",
    tag: "CRM Settings",
    operationId: "createMessageTemplate",
    summary: "افزودن قالب پیام",
    access: requires("crm-settings:manage"),
    body: { schema: messageTemplateCreateSchema },
    success: { status: 201, description: "ایجاد شد", schema: tplResponse },
  });

  r.route({
    method: "patch",
    path: "/message-templates/{id}",
    tag: "CRM Settings",
    operationId: "updateMessageTemplate",
    summary: "ویرایش قالب پیام",
    access: requires("crm-settings:manage"),
    params: idParamSchema,
    body: { schema: messageTemplateUpdateSchema },
    success: { status: 200, description: "ویرایش شد", schema: tplResponse },
  });

  r.route({
    method: "delete",
    path: "/message-templates/{id}",
    tag: "CRM Settings",
    operationId: "deleteMessageTemplate",
    summary: "حذف قالب پیام",
    access: requires("crm-settings:manage"),
    params: idParamSchema,
    success: { status: 204, description: "حذف شد" },
  });

  r.route({
    method: "post",
    path: "/message-templates/render",
    tag: "CRM Settings",
    operationId: "renderMessageTemplate",
    summary: "رندر قالب با متغیرها",
    access: requires("lead:write", STAFF_ROLES),
    body: { schema: renderTemplateInputSchema },
    success: {
      status: 200,
      description: "متن رندرشده",
      schema: successEnvelope(
        "RenderTemplateResultResponse",
        renderTemplateResultSchema,
      ),
    },
  });

  /* ----- Case templates ----- */

  const caseTplResponse = successEnvelope(
    "CaseTemplateResponse",
    caseTemplateSchema,
  );

  r.route({
    method: "get",
    path: "/case-templates",
    tag: "CRM Settings",
    operationId: "listCaseTemplates",
    summary: "قالب‌های پرونده",
    access: requires("case:read", STAFF_ROLES),
    success: {
      status: 200,
      description: "قالب‌ها",
      schema: successEnvelope(
        "CaseTemplatesResponse",
        z.array(caseTemplateSchema),
      ),
    },
  });

  r.route({
    method: "post",
    path: "/case-templates",
    tag: "CRM Settings",
    operationId: "createCaseTemplate",
    summary: "افزودن قالب پرونده",
    access: requires("crm-settings:manage"),
    body: { schema: caseTemplateCreateSchema },
    success: { status: 201, description: "ایجاد شد", schema: caseTplResponse },
  });

  r.route({
    method: "patch",
    path: "/case-templates/{id}",
    tag: "CRM Settings",
    operationId: "updateCaseTemplate",
    summary: "ویرایش قالب پرونده",
    access: requires("crm-settings:manage"),
    params: idParamSchema,
    body: { schema: caseTemplateUpdateSchema },
    success: { status: 200, description: "ویرایش شد", schema: caseTplResponse },
  });

  r.route({
    method: "delete",
    path: "/case-templates/{id}",
    tag: "CRM Settings",
    operationId: "deleteCaseTemplate",
    summary: "حذف قالب پرونده",
    access: requires("crm-settings:manage"),
    params: idParamSchema,
    success: { status: 204, description: "حذف شد" },
    conflict: true,
  });

  /* ----- Tasks ----- */

  const taskResponse = successEnvelope("TaskResponse", taskSchema);
  const TASK_SCOPE =
    "مشاور فقط کارهای assignee خودش را می‌بیند و تغییر می‌دهد؛ admin همه را می‌بیند.";
  const TASK_IF_MATCH =
    "هدر `If-Match` با مقدار `version` فعلی الزامی است؛ عدم تطابق → `409` با `error.reason=version_mismatch`.";

  r.route({
    method: "get",
    path: "/tasks",
    tag: "Tasks",
    operationId: "listTasks",
    summary: "فهرست کارها",
    description: TASK_SCOPE,
    access: requires("task:read", STAFF_ROLES),
    query: taskListQuerySchema,
    success: {
      status: 200,
      description: "فهرست صفحه‌بندی‌شده",
      schema: paginatedEnvelope("TasksPage", taskSchema),
    },
  });

  r.route({
    method: "get",
    path: "/tasks/counts",
    tag: "Tasks",
    operationId: "getTaskCounts",
    summary: "شمارش تب‌های کارها",
    description: `${TASK_SCOPE} شمارش‌ها برای تب‌های امروز / سررسیدگذشته / این هفته / بعدی / تکمیل‌شده.`,
    access: requires("task:read", STAFF_ROLES),
    query: taskCountsQuerySchema,
    success: {
      status: 200,
      description: "شمارش‌ها",
      schema: successEnvelope("TaskCountsResponse", taskCountsSchema),
    },
  });

  r.route({
    method: "post",
    path: "/tasks",
    tag: "Tasks",
    operationId: "createTask",
    summary: "ایجاد کار",
    description:
      "در صورت ارتباط با lead|case یک Activity و AuditLog ثبت می‌شود؛ تخصیص به دیگری اعلان task_assigned می‌سازد.",
    access: requires("task:write", STAFF_ROLES),
    body: { schema: taskCreateSchema },
    success: { status: 201, description: "ایجاد شد", schema: taskResponse },
  });

  r.route({
    method: "get",
    path: "/tasks/{id}",
    tag: "Tasks",
    operationId: "getTask",
    summary: "دریافت کار",
    description: TASK_SCOPE,
    access: requires("task:read", STAFF_ROLES),
    params: idParamSchema,
    success: { status: 200, description: "کار", schema: taskResponse },
  });

  r.route({
    method: "patch",
    path: "/tasks/{id}",
    tag: "Tasks",
    operationId: "updateTask",
    summary: "ویرایش کار",
    description: `${TASK_SCOPE} ${TASK_IF_MATCH}`,
    access: requires("task:write", STAFF_ROLES),
    params: idParamSchema,
    body: { schema: taskUpdateSchema },
    success: { status: 200, description: "ویرایش شد", schema: taskResponse },
    conflict: true,
  });

  r.route({
    method: "delete",
    path: "/tasks/{id}",
    tag: "Tasks",
    operationId: "deleteTask",
    summary: "حذف کار",
    description: TASK_SCOPE,
    access: requires("task:write", STAFF_ROLES),
    params: idParamSchema,
    success: { status: 204, description: "حذف شد" },
  });

  r.route({
    method: "post",
    path: "/tasks/{id}/complete",
    tag: "Tasks",
    operationId: "completeTask",
    summary: "تکمیل کار",
    description:
      `${TASK_SCOPE} Activity روی موجودیت مرتبط + AuditLog. اگر کار پیگیری لید باشد، nextFollowUpAt پاک می‌شود.`,
    access: requires("task:write", STAFF_ROLES),
    params: idParamSchema,
    success: { status: 200, description: "تکمیل شد", schema: taskResponse },
    conflict: true,
  });

  r.route({
    method: "post",
    path: "/tasks/bulk-complete",
    tag: "Tasks",
    operationId: "bulkCompleteTasks",
    summary: "تکمیل دسته‌ای کارها",
    description: TASK_SCOPE,
    access: requires("task:write", STAFF_ROLES),
    body: { schema: taskBulkCompleteSchema },
    success: {
      status: 200,
      description: "کارهای تکمیل‌شده",
      schema: successEnvelope("TasksBulkCompleteResponse", z.array(taskSchema)),
    },
    conflict: true,
  });

  r.route({
    method: "post",
    path: "/tasks/{id}/snooze",
    tag: "Tasks",
    operationId: "snoozeTask",
    summary: "به تعویق انداختن کار",
    description: `${TASK_SCOPE} dueAt (و در صورت وجود remindAt) را جابه‌جا می‌کند. ${TASK_IF_MATCH}`,
    access: requires("task:write", STAFF_ROLES),
    params: idParamSchema,
    body: { schema: taskSnoozeSchema },
    success: { status: 200, description: "تعویق شد", schema: taskResponse },
    conflict: true,
  });

  r.route({
    method: "post",
    path: "/tasks/process-reminders",
    tag: "Tasks",
    operationId: "processTaskReminders",
    summary: "پردازش یادآور کارها (mock)",
    description:
      "فقط برای mock/local: برای کارهای باز که remindAt یا dueAt رسیده و هنوز اعلان task_due ندارند، یک Notification می‌سازد. بک‌اند واقعی باید job زمان‌بندی‌شده داشته باشد.",
    access: requires("task:write", STAFF_ROLES),
    success: {
      status: 200,
      description: "تعداد اعلان‌های ساخته‌شده",
      schema: successEnvelope(
        "TaskProcessRemindersResponse",
        taskProcessRemindersResultSchema,
      ),
    },
  });

  /* ----- Saved views ----- */

  const viewResponse = successEnvelope("SavedViewResponse", savedViewSchema);

  r.route({
    method: "get",
    path: "/saved-views",
    tag: "CRM",
    operationId: "listSavedViews",
    summary: "نماهای ذخیره‌شده",
    access: requires("lead:read", STAFF_ROLES),
    query: savedViewListQuerySchema,
    success: {
      status: 200,
      description: "نماها (مالک + shared)",
      schema: paginatedEnvelope("SavedViewsPage", savedViewSchema),
    },
  });

  r.route({
    method: "post",
    path: "/saved-views",
    tag: "CRM",
    operationId: "createSavedView",
    summary: "ذخیره نما",
    access: requires("lead:read", STAFF_ROLES),
    body: { schema: savedViewCreateSchema },
    success: { status: 201, description: "ایجاد شد", schema: viewResponse },
  });

  r.route({
    method: "patch",
    path: "/saved-views/{id}",
    tag: "CRM",
    operationId: "updateSavedView",
    summary: "ویرایش نما",
    access: requires("lead:read", STAFF_ROLES),
    params: idParamSchema,
    body: { schema: savedViewUpdateSchema },
    success: { status: 200, description: "ویرایش شد", schema: viewResponse },
  });

  r.route({
    method: "delete",
    path: "/saved-views/{id}",
    tag: "CRM",
    operationId: "deleteSavedView",
    summary: "حذف نما",
    access: requires("lead:read", STAFF_ROLES),
    params: idParamSchema,
    success: { status: 204, description: "حذف شد" },
  });

  /* ----- Notifications ----- */

  r.route({
    method: "get",
    path: "/me/notifications",
    tag: "Notifications",
    operationId: "listMyNotifications",
    summary: "اعلان‌های من",
    access: requires("lead:read", STAFF_ROLES),
    query: notificationListQuerySchema,
    success: {
      status: 200,
      description: "اعلان‌ها",
      schema: paginatedEnvelope("NotificationsPage", notificationSchema),
    },
  });

  r.route({
    method: "get",
    path: "/me/notifications/unread-count",
    tag: "Notifications",
    operationId: "getUnreadNotificationCount",
    summary: "تعداد اعلان خوانده‌نشده",
    access: requires("lead:read", STAFF_ROLES),
    success: {
      status: 200,
      description: "تعداد",
      schema: successEnvelope(
        "UnreadNotificationCountResponse",
        unreadCountSchema,
      ),
    },
  });

  r.route({
    method: "post",
    path: "/me/notifications/{id}/read",
    tag: "Notifications",
    operationId: "markNotificationRead",
    summary: "علامت‌گذاری اعلان به‌عنوان خوانده‌شده",
    access: requires("lead:read", STAFF_ROLES),
    params: idParamSchema,
    success: {
      status: 200,
      description: "خوانده شد",
      schema: successEnvelope("NotificationResponse", notificationSchema),
    },
  });

  r.route({
    method: "post",
    path: "/me/notifications/read-all",
    tag: "Notifications",
    operationId: "markAllNotificationsRead",
    summary: "خواندن همه اعلان‌ها",
    access: requires("lead:read", STAFF_ROLES),
    success: { status: 204, description: "همه خوانده شدند" },
  });

  r.route({
    method: "post",
    path: "/me/notifications/bulk-read",
    tag: "Notifications",
    operationId: "bulkMarkNotificationsRead",
    summary: "علامت‌گذاری چند اعلان به‌عنوان خوانده‌شده",
    access: requires("lead:read", STAFF_ROLES),
    body: { schema: notificationBulkReadSchema },
    success: {
      status: 200,
      description: "اعلان‌های به‌روزشده",
      schema: successEnvelope(
        "NotificationsBulkReadResponse",
        z.array(notificationSchema),
      ),
    },
  });

  r.route({
    method: "get",
    path: "/me/notification-preferences",
    tag: "Notifications",
    operationId: "getMyNotificationPreferences",
    summary: "ترجیحات اعلان کاربر جاری",
    description:
      "کانال in-app و SMS برای هر نوع اعلان. SMS فقط ذخیره می‌شود و ارسال واقعی ندارد.",
    access: requires("lead:read", STAFF_ROLES),
    success: {
      status: 200,
      description: "ترجیحات",
      schema: successEnvelope(
        "NotificationPreferencesResponse",
        notificationPreferencesSchema,
      ),
    },
  });

  r.route({
    method: "put",
    path: "/me/notification-preferences",
    tag: "Notifications",
    operationId: "updateMyNotificationPreferences",
    summary: "به‌روزرسانی ترجیحات اعلان",
    access: requires("lead:read", STAFF_ROLES),
    body: { schema: notificationPreferencesUpdateSchema },
    success: {
      status: 200,
      description: "ترجیحات ذخیره‌شده",
      schema: successEnvelope(
        "NotificationPreferencesUpdateResponse",
        notificationPreferencesSchema,
      ),
    },
  });

  /* ----- Audit ----- */

  r.route({
    method: "get",
    path: "/audit-logs",
    tag: "Audit",
    operationId: "listAuditLogs",
    summary: "گزارش حسابرسی",
    description:
      "لاگ‌ها فقط‌خواندنی‌اند؛ endpoint عمومی برای ایجاد/حذف وجود ندارد. فیلدهای حساس (password، token، OTP، محتوای کامل مدرک، …) در diff هرگز ذخیره نمی‌شوند — بنگرید `AUDIT_SENSITIVE_FIELDS` در قرارداد.",
    access: requires("audit:read"),
    query: auditLogListQuerySchema,
    success: {
      status: 200,
      description: "لاگ‌ها",
      schema: paginatedEnvelope("AuditLogsPage", auditLogSchema),
    },
  });

  r.route({
    method: "get",
    path: "/audit-logs/export",
    tag: "Audit",
    operationId: "exportAuditLogs",
    summary: "خروجی CSV گزارش حسابرسی",
    description:
      "همان فیلترهای فهرست. حداکثر ۵۰٬۰۰۰ سطر. UTF-8 با BOM. خودِ export یک AuditLog با action=export می‌نویسد.",
    access: requires("audit:read"),
    query: auditLogListQuerySchema,
    success: {
      status: 200,
      description: "محتوای CSV به‌صورت رشته (UTF-8 با BOM) داخل envelope",
      schema: successEnvelope(
        "AuditLogExportCsvResponse",
        z.string().describe("متن CSV با BOM"),
      ),
    },
  });

  /* ----- Reports ----- */

  r.route({
    method: "get",
    path: "/reports/funnel",
    tag: "Reports",
    operationId: "getFunnelReport",
    summary: "گزارش قیف فروش",
    description: "فیلتر مشاور فقط برای admin؛ مشاور همیشه داده خودش را می‌بیند.",
    access: requires("report:read", STAFF_ROLES),
    query: reportRangeQuerySchema,
    success: {
      status: 200,
      description: "قیف",
      schema: successEnvelope("FunnelReportResponse", funnelReportSchema),
    },
  });

  r.route({
    method: "get",
    path: "/reports/consultants",
    tag: "Reports",
    operationId: "getConsultantsReport",
    summary: "گزارش عملکرد مشاوران",
    access: requires("report:read", STAFF_ROLES),
    query: reportRangeQuerySchema,
    success: {
      status: 200,
      description: "مشاوران",
      schema: successEnvelope(
        "ConsultantsReportResponse",
        consultantsReportSchema,
      ),
    },
  });

  r.route({
    method: "get",
    path: "/reports/sources",
    tag: "Reports",
    operationId: "getSourcesReport",
    summary: "گزارش منابع سرنخ",
    access: requires("report:read", STAFF_ROLES),
    query: reportRangeQuerySchema,
    success: {
      status: 200,
      description: "منابع",
      schema: successEnvelope("SourcesReportResponse", sourcesReportSchema),
    },
  });

  r.route({
    method: "get",
    path: "/reports/timeseries",
    tag: "Reports",
    operationId: "getTimeseriesReport",
    summary: "سری زمانی متریک CRM",
    access: requires("report:read", STAFF_ROLES),
    query: timeseriesReportQuerySchema,
    success: {
      status: 200,
      description: "سری زمانی",
      schema: successEnvelope(
        "TimeseriesReportResponse",
        timeseriesReportSchema,
      ),
    },
  });

  r.route({
    method: "get",
    path: "/reports/tickets",
    tag: "Reports",
    operationId: "getTicketsReport",
    summary: "گزارش تیکت‌ها (میانگین اولین پاسخ و امتیاز)",
    description:
      "فیلتر مشاور فقط برای admin؛ مشاور فقط تیکت‌های ارجاع‌شده یا پروندهٔ خودش را می‌بیند.",
    access: requires("report:read", STAFF_ROLES),
    query: reportRangeQuerySchema,
    success: {
      status: 200,
      description: "آمار تیکت",
      schema: successEnvelope("TicketsReportResponse", ticketsReportSchema),
    },
  });
}
