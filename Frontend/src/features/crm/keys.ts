import type {
  SavedViewListFilters,
  TaskCountsFilters,
  TaskListFilters,
} from "./api";

export const crmKeys = {
  all: ["crm"] as const,
  stages: () => [...crmKeys.all, "pipeline-stages"] as const,
  tags: () => [...crmKeys.all, "tags"] as const,
  lostReasons: () => [...crmKeys.all, "lost-reasons"] as const,
  messageTemplates: () => [...crmKeys.all, "message-templates"] as const,
  caseTemplates: () => [...crmKeys.all, "case-templates"] as const,
  tasks: (filters?: TaskListFilters) =>
    [...crmKeys.all, "tasks", filters ?? {}] as const,
  tasksAll: () => [...crmKeys.all, "tasks"] as const,
  taskCounts: (filters?: TaskCountsFilters) =>
    [...crmKeys.all, "task-counts", filters ?? {}] as const,
  savedViews: (filters?: SavedViewListFilters) =>
    [...crmKeys.all, "saved-views", filters ?? {}] as const,
};
