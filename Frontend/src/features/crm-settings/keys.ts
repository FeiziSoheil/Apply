export const crmSettingsKeys = {
  all: ["crm-settings"] as const,
  pipeline: () => [...crmSettingsKeys.all, "pipeline"] as const,
  lostReasons: () => [...crmSettingsKeys.all, "lost-reasons"] as const,
  tags: () => [...crmSettingsKeys.all, "tags"] as const,
  assignmentRules: () => [...crmSettingsKeys.all, "assignment-rules"] as const,
  messageTemplates: () =>
    [...crmSettingsKeys.all, "message-templates"] as const,
  caseTemplates: () => [...crmSettingsKeys.all, "case-templates"] as const,
  campaignCosts: () => [...crmSettingsKeys.all, "campaign-costs"] as const,
  defaults: () => [...crmSettingsKeys.all, "defaults"] as const,
};
