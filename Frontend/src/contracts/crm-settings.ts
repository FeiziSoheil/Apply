import {
  idSchema,
  isoDateTimeSchema,
  rialsSchema,
  slugSchema,
  versionSchema,
} from "./common";
import {
  assignmentConditionSchema,
  assignmentRuleSchema,
  assignmentStrategySchema,
  caseTemplateSchema,
  caseTemplateStageSchema,
  lostReasonSchema,
  messageChannelSchema,
  messageTemplateSchema,
  PIPELINE_STAGE_COLORS,
  pipelineStageColorSchema,
  pipelineStageKindSchema,
  pipelineStageSchema,
  tagSchema,
  TEMPLATE_VARIABLES,
} from "./crm";
import { leadSourceSchema } from "./leads";
import { z } from "./zod";

/* -------------------------------------------------------------------------- */
/*  Tabs & versioned envelopes                                                */
/* -------------------------------------------------------------------------- */

export const CRM_SETTINGS_TABS = [
  "pipeline",
  "lostReasons",
  "tags",
  "assignmentRules",
  "messageTemplates",
  "caseTemplates",
  "campaignCosts",
  "defaults",
] as const;
export const crmSettingsTabSchema = z
  .enum(CRM_SETTINGS_TABS)
  .openapi("CrmSettingsTab");
export type CrmSettingsTab = z.infer<typeof crmSettingsTabSchema>;

const stageKeySchema = z
  .string()
  .min(1)
  .max(60)
  .regex(/^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/, "کلید مرحله باید snake_case باشد");

/* -------------------------------------------------------------------------- */
/*  Pipeline settings                                                         */
/* -------------------------------------------------------------------------- */

export const pipelineStageDraftSchema = z
  .object({
    id: idSchema.optional().describe("حذف برای مرحله جدید"),
    key: stageKeySchema,
    title: z.string().trim().min(1).max(80),
    order: z.number().int().min(0),
    color: pipelineStageColorSchema.default("slate"),
    kind: pipelineStageKindSchema,
    wipLimit: z.number().int().min(1).nullable().optional(),
  })
  .openapi("PipelineStageDraft");
export type PipelineStageDraft = z.infer<typeof pipelineStageDraftSchema>;

export const pipelineSettingsSchema = z
  .object({
    version: versionSchema,
    updatedAt: isoDateTimeSchema,
    stages: z.array(pipelineStageSchema),
  })
  .openapi("PipelineSettings");
export type PipelineSettings = z.infer<typeof pipelineSettingsSchema>;

export const pipelineSettingsReplaceSchema = z
  .object({
    stages: z.array(pipelineStageDraftSchema).min(4),
    /**
     * نگاشت مرحلهٔ حذف‌شده → مرحلهٔ مقصد برای انتقال لیدها.
     * برای هر مرحلهٔ موجود که در لیست جدید نیست الزامی است اگر لید داشته باشد.
     */
    migrateLeads: z
      .record(z.string().uuid(), z.string().uuid())
      .default({})
      .describe("stageId حذف‌شده → stageId مقصد"),
  })
  .openapi("PipelineSettingsReplace");
export type PipelineSettingsReplace = z.infer<
  typeof pipelineSettingsReplaceSchema
>;

/* -------------------------------------------------------------------------- */
/*  Lost reasons                                                              */
/* -------------------------------------------------------------------------- */

export const lostReasonDraftSchema = z
  .object({
    id: idSchema.optional(),
    title: z.string().trim().min(1).max(120),
    active: z.boolean().default(true),
  })
  .openapi("LostReasonDraft");
export type LostReasonDraft = z.infer<typeof lostReasonDraftSchema>;

export const lostReasonsSettingsSchema = z
  .object({
    version: versionSchema,
    updatedAt: isoDateTimeSchema,
    items: z.array(lostReasonSchema),
  })
  .openapi("LostReasonsSettings");
export type LostReasonsSettings = z.infer<typeof lostReasonsSettingsSchema>;

export const lostReasonsSettingsReplaceSchema = z
  .object({
    items: z.array(lostReasonDraftSchema).min(1),
  })
  .openapi("LostReasonsSettingsReplace");
export type LostReasonsSettingsReplace = z.infer<
  typeof lostReasonsSettingsReplaceSchema
>;

/* -------------------------------------------------------------------------- */
/*  Tags                                                                      */
/* -------------------------------------------------------------------------- */

export const tagWithUsageSchema = tagSchema
  .extend({
    usageCount: z.number().int().min(0).describe("تعداد لیدهای دارای این تگ"),
  })
  .openapi("TagWithUsage");
export type TagWithUsage = z.infer<typeof tagWithUsageSchema>;

export const tagDraftSchema = z
  .object({
    id: idSchema.optional(),
    title: z.string().trim().min(1).max(60),
    color: pipelineStageColorSchema.default("slate"),
  })
  .openapi("TagDraft");
export type TagDraft = z.infer<typeof tagDraftSchema>;

export const tagsSettingsSchema = z
  .object({
    version: versionSchema,
    updatedAt: isoDateTimeSchema,
    items: z.array(tagWithUsageSchema),
  })
  .openapi("TagsSettings");
export type TagsSettings = z.infer<typeof tagsSettingsSchema>;

export const tagsSettingsReplaceSchema = z
  .object({
    items: z.array(tagDraftSchema).min(0),
  })
  .openapi("TagsSettingsReplace");
export type TagsSettingsReplace = z.infer<typeof tagsSettingsReplaceSchema>;

export const tagMergeSchema = z
  .object({
    sourceId: idSchema.describe("تگ مبدأ (حذف می‌شود)"),
    targetId: idSchema.describe("تگ مقصد"),
  })
  .refine((data) => data.sourceId !== data.targetId, {
    message: "تگ مبدأ و مقصد نباید یکسان باشند",
    path: ["targetId"],
  })
  .openapi("TagMerge");
export type TagMerge = z.infer<typeof tagMergeSchema>;

/* -------------------------------------------------------------------------- */
/*  Assignment rules                                                          */
/* -------------------------------------------------------------------------- */

export const assignmentRuleDraftSchema = z
  .object({
    id: idSchema.optional(),
    order: z.number().int().min(0),
    active: z.boolean().default(true),
    conditions: z.array(assignmentConditionSchema).min(1),
    strategy: assignmentStrategySchema,
    consultantIds: z.array(idSchema).min(1),
  })
  .openapi("AssignmentRuleDraft");
export type AssignmentRuleDraft = z.infer<typeof assignmentRuleDraftSchema>;

export const assignmentRulesSettingsSchema = z
  .object({
    version: versionSchema,
    updatedAt: isoDateTimeSchema,
    items: z.array(assignmentRuleSchema),
    hasDefaultRule: z
      .boolean()
      .describe("آیا قانون فعال بدون شرط (always) وجود دارد"),
  })
  .openapi("AssignmentRulesSettings");
export type AssignmentRulesSettings = z.infer<
  typeof assignmentRulesSettingsSchema
>;

export const assignmentRulesSettingsReplaceSchema = z
  .object({
    items: z.array(assignmentRuleDraftSchema).min(0),
  })
  .openapi("AssignmentRulesSettingsReplace");
export type AssignmentRulesSettingsReplace = z.infer<
  typeof assignmentRulesSettingsReplaceSchema
>;

export const assignmentSimulateInputSchema = z
  .object({
    targetCountry: slugSchema.optional(),
    source: leadSourceSchema.optional(),
    utmCampaign: z.string().trim().min(1).max(100).optional(),
  })
  .openapi("AssignmentSimulateInput");
export type AssignmentSimulateInput = z.infer<
  typeof assignmentSimulateInputSchema
>;

export const assignmentSimulateResultSchema = z
  .object({
    matched: z.boolean(),
    ruleId: idSchema.nullable(),
    ruleOrder: z.number().int().min(0).nullable(),
    strategy: assignmentStrategySchema.nullable(),
    consultantId: idSchema.nullable(),
    consultantName: z.string().nullable(),
    usedDefaultAssignee: z
      .boolean()
      .describe("اگر قانونی منطبق نشد و مسئول پیش‌فرض اعمال شد"),
  })
  .openapi("AssignmentSimulateResult");
export type AssignmentSimulateResult = z.infer<
  typeof assignmentSimulateResultSchema
>;

/* -------------------------------------------------------------------------- */
/*  Message templates                                                         */
/* -------------------------------------------------------------------------- */

const messageBodySchema = z
  .string()
  .trim()
  .min(1)
  .max(2000)
  .superRefine((body, ctx) => {
    const unknown = findUnknownTemplateVariables(body);
    if (unknown.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `متغیر ناشناخته: ${unknown.map((v) => `{${v}}`).join("، ")}`,
      });
    }
  });

export const messageTemplateDraftSchema = z
  .object({
    id: idSchema.optional(),
    channel: messageChannelSchema,
    title: z.string().trim().min(1).max(120),
    body: messageBodySchema,
    active: z.boolean().default(true),
  })
  .openapi("MessageTemplateDraft");
export type MessageTemplateDraft = z.infer<typeof messageTemplateDraftSchema>;

export const messageTemplatesSettingsSchema = z
  .object({
    version: versionSchema,
    updatedAt: isoDateTimeSchema,
    items: z.array(messageTemplateSchema),
  })
  .openapi("MessageTemplatesSettings");
export type MessageTemplatesSettings = z.infer<
  typeof messageTemplatesSettingsSchema
>;

export const messageTemplatesSettingsReplaceSchema = z
  .object({
    items: z.array(messageTemplateDraftSchema).min(0),
  })
  .openapi("MessageTemplatesSettingsReplace");
export type MessageTemplatesSettingsReplace = z.infer<
  typeof messageTemplatesSettingsReplaceSchema
>;

/** متغیرهای `{…}` که در whitelist قالب نیستند */
export function findUnknownTemplateVariables(body: string): string[] {
  const unknown: string[] = [];
  for (const match of body.matchAll(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g)) {
    const key = match[1];
    if (
      !(TEMPLATE_VARIABLES as readonly string[]).includes(key) &&
      !unknown.includes(key)
    ) {
      unknown.push(key);
    }
  }
  return unknown;
}

/** طول بخش پیامک فارسی (UCS-2): ۷۰ نویسه در هر بخش */
export const SMS_SEGMENT_LENGTH_FA = 70;

export function countSmsSegments(body: string): {
  length: number;
  segments: number;
} {
  const length = [...body].length;
  return {
    length,
    segments: length === 0 ? 0 : Math.ceil(length / SMS_SEGMENT_LENGTH_FA),
  };
}

/* -------------------------------------------------------------------------- */
/*  Case templates                                                            */
/* -------------------------------------------------------------------------- */

export const caseTemplateDraftSchema = z
  .object({
    id: idSchema.optional(),
    countrySlug: slugSchema.nullable().optional(),
    title: z.string().trim().min(1).max(120),
    stages: z.array(caseTemplateStageSchema).min(1),
  })
  .openapi("CaseTemplateDraft");
export type CaseTemplateDraft = z.infer<typeof caseTemplateDraftSchema>;

export const caseTemplatesSettingsSchema = z
  .object({
    version: versionSchema,
    updatedAt: isoDateTimeSchema,
    items: z.array(caseTemplateSchema),
  })
  .openapi("CaseTemplatesSettings");
export type CaseTemplatesSettings = z.infer<typeof caseTemplatesSettingsSchema>;

export const caseTemplatesSettingsReplaceSchema = z
  .object({
    items: z.array(caseTemplateDraftSchema).min(1),
  })
  .openapi("CaseTemplatesSettingsReplace");
export type CaseTemplatesSettingsReplace = z.infer<
  typeof caseTemplatesSettingsReplaceSchema
>;

export const caseTemplateCopySchema = z
  .object({
    sourceId: idSchema,
    countrySlug: slugSchema.nullable().describe("null = قالب عمومی"),
    title: z.string().trim().min(1).max(120).optional(),
  })
  .openapi("CaseTemplateCopy");
export type CaseTemplateCopy = z.infer<typeof caseTemplateCopySchema>;

/* -------------------------------------------------------------------------- */
/*  Campaign costs                                                            */
/* -------------------------------------------------------------------------- */

export const campaignCostSchema = z
  .object({
    id: idSchema,
    /** ماه میلادی UTC به صورت YYYY-MM */
    yearMonth: z
      .string()
      .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "فرمت ماه باید YYYY-MM باشد"),
    source: z.string().trim().min(1).max(40),
    campaign: z.string().trim().min(1).max(100).nullable(),
    costRials: rialsSchema,
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .openapi("CampaignCost");
export type CampaignCost = z.infer<typeof campaignCostSchema>;

export const campaignCostDraftSchema = z
  .object({
    id: idSchema.optional(),
    yearMonth: z
      .string()
      .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "فرمت ماه باید YYYY-MM باشد"),
    source: z.string().trim().min(1).max(40),
    campaign: z.string().trim().min(1).max(100).nullable(),
    costRials: rialsSchema,
  })
  .openapi("CampaignCostDraft");
export type CampaignCostDraft = z.infer<typeof campaignCostDraftSchema>;

export const campaignCostsSettingsSchema = z
  .object({
    version: versionSchema,
    updatedAt: isoDateTimeSchema,
    items: z.array(campaignCostSchema),
  })
  .openapi("CampaignCostsSettings");
export type CampaignCostsSettings = z.infer<typeof campaignCostsSettingsSchema>;

export const campaignCostsSettingsReplaceSchema = z
  .object({
    items: z.array(campaignCostDraftSchema).min(0),
  })
  .openapi("CampaignCostsSettingsReplace");
export type CampaignCostsSettingsReplace = z.infer<
  typeof campaignCostsSettingsReplaceSchema
>;

/* -------------------------------------------------------------------------- */
/*  Defaults                                                                  */
/* -------------------------------------------------------------------------- */

export const businessHoursDaySchema = z
  .object({
    weekday: z
      .number()
      .int()
      .min(0)
      .max(6)
      .describe("۰ = یکشنبه … ۶ = شنبه (ISO weekday سبک)"),
    start: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "ساعت شروع HH:mm"),
    end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "ساعت پایان HH:mm"),
  })
  .refine((day) => day.start < day.end, {
    message: "ساعت پایان باید بعد از شروع باشد",
    path: ["end"],
  })
  .openapi("BusinessHoursDay");
export type BusinessHoursDay = z.infer<typeof businessHoursDaySchema>;

export const crmBusinessHoursSchema = z
  .object({
    timezone: z.string().min(1).max(64).default("Asia/Tehran"),
    days: z.array(businessHoursDaySchema).min(1).max(7),
  })
  .openapi("CrmBusinessHours");
export type CrmBusinessHours = z.infer<typeof crmBusinessHoursSchema>;

export const crmDefaultsDataSchema = z
  .object({
    initialStageId: idSchema.describe("مرحله اولیه لید جدید"),
    defaultAssigneeId: idSchema
      .nullable()
      .describe("مسئول پیش‌فرض وقتی هیچ قانونی منطبق نیست"),
    businessHours: crmBusinessHoursSchema,
    noActivityDays: z
      .number()
      .int()
      .min(1)
      .max(365)
      .describe("آستانه بدون فعالیت (روز) برای لیست و داشبورد"),
  })
  .openapi("CrmDefaultsData");
export type CrmDefaultsData = z.infer<typeof crmDefaultsDataSchema>;

export const crmDefaultsSettingsSchema = z
  .object({
    version: versionSchema,
    updatedAt: isoDateTimeSchema,
    data: crmDefaultsDataSchema,
  })
  .openapi("CrmDefaultsSettings");
export type CrmDefaultsSettings = z.infer<typeof crmDefaultsSettingsSchema>;

export const crmDefaultsSettingsReplaceSchema = crmDefaultsDataSchema.openapi(
  "CrmDefaultsSettingsReplace",
);
export type CrmDefaultsSettingsReplace = z.infer<
  typeof crmDefaultsSettingsReplaceSchema
>;

/** رنگ‌های مجاز مرحله — برای UI */
export const PIPELINE_COLOR_OPTIONS = PIPELINE_STAGE_COLORS;
