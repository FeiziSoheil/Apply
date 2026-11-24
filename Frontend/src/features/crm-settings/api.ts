import type { z } from "zod";
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
} from "@/contracts/crm-settings";
import { caseTemplateSchema } from "@/contracts/crm";
import {
  apiGet,
  apiPost,
  apiPut,
  type RequestOptions,
} from "@/lib/api/client";
import { validateRequest } from "@/lib/api/validate";

type VersionOptions = RequestOptions & { version: number };

function withIfMatch(options: VersionOptions): RequestOptions {
  const { version, headers, ...rest } = options;
  return {
    ...rest,
    headers: {
      ...headers,
      "If-Match": String(version),
    },
  };
}

export const crmSettingsApi = {
  getPipeline(options?: RequestOptions) {
    return apiGet("/crm-settings/pipeline", pipelineSettingsSchema, options);
  },
  replacePipeline(
    body: z.input<typeof pipelineSettingsReplaceSchema>,
    options: VersionOptions,
  ) {
    return apiPut(
      "/crm-settings/pipeline",
      pipelineSettingsSchema,
      validateRequest(pipelineSettingsReplaceSchema, body),
      withIfMatch(options),
    );
  },
  resetPipeline(options: VersionOptions) {
    return apiPost(
      "/crm-settings/pipeline/reset",
      pipelineSettingsSchema,
      {},
      withIfMatch(options),
    );
  },

  getLostReasons(options?: RequestOptions) {
    return apiGet(
      "/crm-settings/lost-reasons",
      lostReasonsSettingsSchema,
      options,
    );
  },
  replaceLostReasons(
    body: z.input<typeof lostReasonsSettingsReplaceSchema>,
    options: VersionOptions,
  ) {
    return apiPut(
      "/crm-settings/lost-reasons",
      lostReasonsSettingsSchema,
      validateRequest(lostReasonsSettingsReplaceSchema, body),
      withIfMatch(options),
    );
  },
  resetLostReasons(options: VersionOptions) {
    return apiPost(
      "/crm-settings/lost-reasons/reset",
      lostReasonsSettingsSchema,
      {},
      withIfMatch(options),
    );
  },

  getTags(options?: RequestOptions) {
    return apiGet("/crm-settings/tags", tagsSettingsSchema, options);
  },
  replaceTags(
    body: z.input<typeof tagsSettingsReplaceSchema>,
    options: VersionOptions,
  ) {
    return apiPut(
      "/crm-settings/tags",
      tagsSettingsSchema,
      validateRequest(tagsSettingsReplaceSchema, body),
      withIfMatch(options),
    );
  },
  resetTags(options: VersionOptions) {
    return apiPost(
      "/crm-settings/tags/reset",
      tagsSettingsSchema,
      {},
      withIfMatch(options),
    );
  },
  mergeTags(body: z.input<typeof tagMergeSchema>, options?: RequestOptions) {
    return apiPost(
      "/tags/merge",
      tagWithUsageSchema,
      validateRequest(tagMergeSchema, body),
      options,
    );
  },

  getAssignmentRules(options?: RequestOptions) {
    return apiGet(
      "/crm-settings/assignment-rules",
      assignmentRulesSettingsSchema,
      options,
    );
  },
  replaceAssignmentRules(
    body: z.input<typeof assignmentRulesSettingsReplaceSchema>,
    options: VersionOptions,
  ) {
    return apiPut(
      "/crm-settings/assignment-rules",
      assignmentRulesSettingsSchema,
      validateRequest(assignmentRulesSettingsReplaceSchema, body),
      withIfMatch(options),
    );
  },
  resetAssignmentRules(options: VersionOptions) {
    return apiPost(
      "/crm-settings/assignment-rules/reset",
      assignmentRulesSettingsSchema,
      {},
      withIfMatch(options),
    );
  },
  simulateAssignment(
    body: z.input<typeof assignmentSimulateInputSchema>,
    options?: RequestOptions,
  ) {
    return apiPost(
      "/assignment-rules/simulate",
      assignmentSimulateResultSchema,
      validateRequest(assignmentSimulateInputSchema, body),
      options,
    );
  },

  getMessageTemplates(options?: RequestOptions) {
    return apiGet(
      "/crm-settings/message-templates",
      messageTemplatesSettingsSchema,
      options,
    );
  },
  replaceMessageTemplates(
    body: z.input<typeof messageTemplatesSettingsReplaceSchema>,
    options: VersionOptions,
  ) {
    return apiPut(
      "/crm-settings/message-templates",
      messageTemplatesSettingsSchema,
      validateRequest(messageTemplatesSettingsReplaceSchema, body),
      withIfMatch(options),
    );
  },
  resetMessageTemplates(options: VersionOptions) {
    return apiPost(
      "/crm-settings/message-templates/reset",
      messageTemplatesSettingsSchema,
      {},
      withIfMatch(options),
    );
  },

  getCaseTemplates(options?: RequestOptions) {
    return apiGet(
      "/crm-settings/case-templates",
      caseTemplatesSettingsSchema,
      options,
    );
  },
  replaceCaseTemplates(
    body: z.input<typeof caseTemplatesSettingsReplaceSchema>,
    options: VersionOptions,
  ) {
    return apiPut(
      "/crm-settings/case-templates",
      caseTemplatesSettingsSchema,
      validateRequest(caseTemplatesSettingsReplaceSchema, body),
      withIfMatch(options),
    );
  },
  resetCaseTemplates(options: VersionOptions) {
    return apiPost(
      "/crm-settings/case-templates/reset",
      caseTemplatesSettingsSchema,
      {},
      withIfMatch(options),
    );
  },
  copyCaseTemplate(
    body: z.input<typeof caseTemplateCopySchema>,
    options?: RequestOptions,
  ) {
    return apiPost(
      "/case-templates/copy",
      caseTemplateSchema,
      validateRequest(caseTemplateCopySchema, body),
      options,
    );
  },

  getCampaignCosts(options?: RequestOptions) {
    return apiGet(
      "/crm-settings/campaign-costs",
      campaignCostsSettingsSchema,
      options,
    );
  },
  replaceCampaignCosts(
    body: z.input<typeof campaignCostsSettingsReplaceSchema>,
    options: VersionOptions,
  ) {
    return apiPut(
      "/crm-settings/campaign-costs",
      campaignCostsSettingsSchema,
      validateRequest(campaignCostsSettingsReplaceSchema, body),
      withIfMatch(options),
    );
  },
  resetCampaignCosts(options: VersionOptions) {
    return apiPost(
      "/crm-settings/campaign-costs/reset",
      campaignCostsSettingsSchema,
      {},
      withIfMatch(options),
    );
  },

  getDefaults(options?: RequestOptions) {
    return apiGet(
      "/crm-settings/defaults",
      crmDefaultsSettingsSchema,
      options,
    );
  },
  replaceDefaults(
    body: z.input<typeof crmDefaultsSettingsReplaceSchema>,
    options: VersionOptions,
  ) {
    return apiPut(
      "/crm-settings/defaults",
      crmDefaultsSettingsSchema,
      validateRequest(crmDefaultsSettingsReplaceSchema, body),
      withIfMatch(options),
    );
  },
  resetDefaults(options: VersionOptions) {
    return apiPost(
      "/crm-settings/defaults/reset",
      crmDefaultsSettingsSchema,
      {},
      withIfMatch(options),
    );
  },
};
