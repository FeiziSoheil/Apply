"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { crmSettingsApi } from "./api";
import { crmSettingsKeys } from "./keys";

export { crmSettingsKeys } from "./keys";

type QueryOpts = { enabled?: boolean };

export const crmSettingsQueries = {
  pipeline: () =>
    queryOptions({
      queryKey: crmSettingsKeys.pipeline(),
      queryFn: ({ signal }) => crmSettingsApi.getPipeline({ signal }),
    }),
  lostReasons: () =>
    queryOptions({
      queryKey: crmSettingsKeys.lostReasons(),
      queryFn: ({ signal }) => crmSettingsApi.getLostReasons({ signal }),
    }),
  tags: () =>
    queryOptions({
      queryKey: crmSettingsKeys.tags(),
      queryFn: ({ signal }) => crmSettingsApi.getTags({ signal }),
    }),
  assignmentRules: () =>
    queryOptions({
      queryKey: crmSettingsKeys.assignmentRules(),
      queryFn: ({ signal }) => crmSettingsApi.getAssignmentRules({ signal }),
    }),
  messageTemplates: () =>
    queryOptions({
      queryKey: crmSettingsKeys.messageTemplates(),
      queryFn: ({ signal }) => crmSettingsApi.getMessageTemplates({ signal }),
    }),
  caseTemplates: () =>
    queryOptions({
      queryKey: crmSettingsKeys.caseTemplates(),
      queryFn: ({ signal }) => crmSettingsApi.getCaseTemplates({ signal }),
    }),
  campaignCosts: () =>
    queryOptions({
      queryKey: crmSettingsKeys.campaignCosts(),
      queryFn: ({ signal }) => crmSettingsApi.getCampaignCosts({ signal }),
    }),
  defaults: () =>
    queryOptions({
      queryKey: crmSettingsKeys.defaults(),
      queryFn: ({ signal }) => crmSettingsApi.getDefaults({ signal }),
    }),
};

export function usePipelineSettings(options?: QueryOpts) {
  return useQuery({ ...crmSettingsQueries.pipeline(), ...options });
}
export function useLostReasonsSettings(options?: QueryOpts) {
  return useQuery({ ...crmSettingsQueries.lostReasons(), ...options });
}
export function useTagsSettings(options?: QueryOpts) {
  return useQuery({ ...crmSettingsQueries.tags(), ...options });
}
export function useAssignmentRulesSettings(options?: QueryOpts) {
  return useQuery({ ...crmSettingsQueries.assignmentRules(), ...options });
}
export function useMessageTemplatesSettings(options?: QueryOpts) {
  return useQuery({ ...crmSettingsQueries.messageTemplates(), ...options });
}
export function useCaseTemplatesSettings(options?: QueryOpts) {
  return useQuery({ ...crmSettingsQueries.caseTemplates(), ...options });
}
export function useCampaignCostsSettings(options?: QueryOpts) {
  return useQuery({ ...crmSettingsQueries.campaignCosts(), ...options });
}
export function useCrmDefaultsSettings(options?: QueryOpts) {
  return useQuery({ ...crmSettingsQueries.defaults(), ...options });
}
