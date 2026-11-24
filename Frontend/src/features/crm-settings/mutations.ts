"use client";

import type { QueryKey } from "@tanstack/react-query";
import type { z } from "zod";
import type {
  assignmentRulesSettingsReplaceSchema,
  assignmentSimulateInputSchema,
  campaignCostsSettingsReplaceSchema,
  caseTemplateCopySchema,
  caseTemplatesSettingsReplaceSchema,
  crmDefaultsSettingsReplaceSchema,
  lostReasonsSettingsReplaceSchema,
  messageTemplatesSettingsReplaceSchema,
  pipelineSettingsReplaceSchema,
  tagMergeSchema,
  tagsSettingsReplaceSchema,
} from "@/contracts/crm-settings";
import { crmKeys } from "@/features/crm/keys";
import { leadKeys } from "@/features/leads/keys";
import { caseKeys } from "@/features/students/keys";
import {
  useApiMutation,
  type ApiMutationOptions,
} from "@/lib/api/use-api-mutation";
import { crmSettingsApi } from "./api";
import { crmSettingsKeys } from "./keys";

type VersionVars<T> = { body: T; version: number };

function settingsInvalidations(extra: QueryKey[] = []): QueryKey[] {
  return [
    crmSettingsKeys.all,
    crmKeys.stages(),
    crmKeys.tags(),
    crmKeys.lostReasons(),
    crmKeys.messageTemplates(),
    crmKeys.caseTemplates(),
    leadKeys.all,
    caseKeys.all,
    ...extra,
  ];
}

export function useReplacePipelineSettings(
  options?: ApiMutationOptions<
    Awaited<ReturnType<typeof crmSettingsApi.replacePipeline>>,
    VersionVars<z.input<typeof pipelineSettingsReplaceSchema>>
  >,
) {
  return useApiMutation({
    mutationFn: ({ body, version }) =>
      crmSettingsApi.replacePipeline(body, { version }),
    invalidates: () => settingsInvalidations([crmSettingsKeys.pipeline()]),
    options,
  });
}

export function useResetPipelineSettings(
  options?: ApiMutationOptions<
    Awaited<ReturnType<typeof crmSettingsApi.resetPipeline>>,
    number
  >,
) {
  return useApiMutation({
    mutationFn: (version) => crmSettingsApi.resetPipeline({ version }),
    invalidates: () => settingsInvalidations([crmSettingsKeys.pipeline()]),
    options,
  });
}

export function useReplaceLostReasonsSettings(
  options?: ApiMutationOptions<
    Awaited<ReturnType<typeof crmSettingsApi.replaceLostReasons>>,
    VersionVars<z.input<typeof lostReasonsSettingsReplaceSchema>>
  >,
) {
  return useApiMutation({
    mutationFn: ({ body, version }) =>
      crmSettingsApi.replaceLostReasons(body, { version }),
    invalidates: () => settingsInvalidations([crmSettingsKeys.lostReasons()]),
    options,
  });
}

export function useResetLostReasonsSettings(
  options?: ApiMutationOptions<
    Awaited<ReturnType<typeof crmSettingsApi.resetLostReasons>>,
    number
  >,
) {
  return useApiMutation({
    mutationFn: (version) => crmSettingsApi.resetLostReasons({ version }),
    invalidates: () => settingsInvalidations([crmSettingsKeys.lostReasons()]),
    options,
  });
}

export function useReplaceTagsSettings(
  options?: ApiMutationOptions<
    Awaited<ReturnType<typeof crmSettingsApi.replaceTags>>,
    VersionVars<z.input<typeof tagsSettingsReplaceSchema>>
  >,
) {
  return useApiMutation({
    mutationFn: ({ body, version }) =>
      crmSettingsApi.replaceTags(body, { version }),
    invalidates: () => settingsInvalidations([crmSettingsKeys.tags()]),
    options,
  });
}

export function useResetTagsSettings(
  options?: ApiMutationOptions<
    Awaited<ReturnType<typeof crmSettingsApi.resetTags>>,
    number
  >,
) {
  return useApiMutation({
    mutationFn: (version) => crmSettingsApi.resetTags({ version }),
    invalidates: () => settingsInvalidations([crmSettingsKeys.tags()]),
    options,
  });
}

export function useMergeTags(
  options?: ApiMutationOptions<
    Awaited<ReturnType<typeof crmSettingsApi.mergeTags>>,
    z.input<typeof tagMergeSchema>
  >,
) {
  return useApiMutation({
    mutationFn: (body) => crmSettingsApi.mergeTags(body),
    invalidates: () => settingsInvalidations([crmSettingsKeys.tags()]),
    options,
  });
}

export function useReplaceAssignmentRulesSettings(
  options?: ApiMutationOptions<
    Awaited<ReturnType<typeof crmSettingsApi.replaceAssignmentRules>>,
    VersionVars<z.input<typeof assignmentRulesSettingsReplaceSchema>>
  >,
) {
  return useApiMutation({
    mutationFn: ({ body, version }) =>
      crmSettingsApi.replaceAssignmentRules(body, { version }),
    invalidates: () =>
      settingsInvalidations([crmSettingsKeys.assignmentRules()]),
    options,
  });
}

export function useResetAssignmentRulesSettings(
  options?: ApiMutationOptions<
    Awaited<ReturnType<typeof crmSettingsApi.resetAssignmentRules>>,
    number
  >,
) {
  return useApiMutation({
    mutationFn: (version) =>
      crmSettingsApi.resetAssignmentRules({ version }),
    invalidates: () =>
      settingsInvalidations([crmSettingsKeys.assignmentRules()]),
    options,
  });
}

export function useSimulateAssignmentRule(
  options?: ApiMutationOptions<
    Awaited<ReturnType<typeof crmSettingsApi.simulateAssignment>>,
    z.input<typeof assignmentSimulateInputSchema>
  >,
) {
  return useApiMutation({
    mutationFn: (body) => crmSettingsApi.simulateAssignment(body),
    options,
  });
}

export function useReplaceMessageTemplatesSettings(
  options?: ApiMutationOptions<
    Awaited<ReturnType<typeof crmSettingsApi.replaceMessageTemplates>>,
    VersionVars<z.input<typeof messageTemplatesSettingsReplaceSchema>>
  >,
) {
  return useApiMutation({
    mutationFn: ({ body, version }) =>
      crmSettingsApi.replaceMessageTemplates(body, { version }),
    invalidates: () =>
      settingsInvalidations([crmSettingsKeys.messageTemplates()]),
    options,
  });
}

export function useResetMessageTemplatesSettings(
  options?: ApiMutationOptions<
    Awaited<ReturnType<typeof crmSettingsApi.resetMessageTemplates>>,
    number
  >,
) {
  return useApiMutation({
    mutationFn: (version) =>
      crmSettingsApi.resetMessageTemplates({ version }),
    invalidates: () =>
      settingsInvalidations([crmSettingsKeys.messageTemplates()]),
    options,
  });
}

export function useReplaceCaseTemplatesSettings(
  options?: ApiMutationOptions<
    Awaited<ReturnType<typeof crmSettingsApi.replaceCaseTemplates>>,
    VersionVars<z.input<typeof caseTemplatesSettingsReplaceSchema>>
  >,
) {
  return useApiMutation({
    mutationFn: ({ body, version }) =>
      crmSettingsApi.replaceCaseTemplates(body, { version }),
    invalidates: () =>
      settingsInvalidations([crmSettingsKeys.caseTemplates()]),
    options,
  });
}

export function useResetCaseTemplatesSettings(
  options?: ApiMutationOptions<
    Awaited<ReturnType<typeof crmSettingsApi.resetCaseTemplates>>,
    number
  >,
) {
  return useApiMutation({
    mutationFn: (version) =>
      crmSettingsApi.resetCaseTemplates({ version }),
    invalidates: () =>
      settingsInvalidations([crmSettingsKeys.caseTemplates()]),
    options,
  });
}

export function useCopyCaseTemplate(
  options?: ApiMutationOptions<
    Awaited<ReturnType<typeof crmSettingsApi.copyCaseTemplate>>,
    z.input<typeof caseTemplateCopySchema>
  >,
) {
  return useApiMutation({
    mutationFn: (body) => crmSettingsApi.copyCaseTemplate(body),
    invalidates: () =>
      settingsInvalidations([crmSettingsKeys.caseTemplates()]),
    options,
  });
}

export function useReplaceCampaignCostsSettings(
  options?: ApiMutationOptions<
    Awaited<ReturnType<typeof crmSettingsApi.replaceCampaignCosts>>,
    VersionVars<z.input<typeof campaignCostsSettingsReplaceSchema>>
  >,
) {
  return useApiMutation({
    mutationFn: ({ body, version }) =>
      crmSettingsApi.replaceCampaignCosts(body, { version }),
    invalidates: () =>
      settingsInvalidations([crmSettingsKeys.campaignCosts()]),
    options,
  });
}

export function useResetCampaignCostsSettings(
  options?: ApiMutationOptions<
    Awaited<ReturnType<typeof crmSettingsApi.resetCampaignCosts>>,
    number
  >,
) {
  return useApiMutation({
    mutationFn: (version) =>
      crmSettingsApi.resetCampaignCosts({ version }),
    invalidates: () =>
      settingsInvalidations([crmSettingsKeys.campaignCosts()]),
    options,
  });
}

export function useReplaceCrmDefaultsSettings(
  options?: ApiMutationOptions<
    Awaited<ReturnType<typeof crmSettingsApi.replaceDefaults>>,
    VersionVars<z.input<typeof crmDefaultsSettingsReplaceSchema>>
  >,
) {
  return useApiMutation({
    mutationFn: ({ body, version }) =>
      crmSettingsApi.replaceDefaults(body, { version }),
    invalidates: () => settingsInvalidations([crmSettingsKeys.defaults()]),
    options,
  });
}

export function useResetCrmDefaultsSettings(
  options?: ApiMutationOptions<
    Awaited<ReturnType<typeof crmSettingsApi.resetDefaults>>,
    number
  >,
) {
  return useApiMutation({
    mutationFn: (version) => crmSettingsApi.resetDefaults({ version }),
    invalidates: () => settingsInvalidations([crmSettingsKeys.defaults()]),
    options,
  });
}
