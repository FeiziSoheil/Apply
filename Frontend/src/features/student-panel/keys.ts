import type { TicketListQuery } from "@/contracts/tickets";

export const studentPanelKeys = {
  all: ["student-panel"] as const,
  caseLink: () => [...studentPanelKeys.all, "case-link"] as const,
  case: () => [...studentPanelKeys.all, "case"] as const,
  documents: () => [...studentPanelKeys.all, "documents"] as const,
  document: (id: string) => [...studentPanelKeys.documents(), id] as const,
  tasks: () => [...studentPanelKeys.all, "tasks"] as const,
  announcements: () => [...studentPanelKeys.all, "announcements"] as const,
  profile: () => [...studentPanelKeys.all, "profile"] as const,
  tickets: (filters?: Partial<TicketListQuery>) =>
    [...studentPanelKeys.all, "tickets", filters ?? {}] as const,
  ticket: (id: string) =>
    [...studentPanelKeys.all, "ticket", id] as const,
  paymentSummary: () => [...studentPanelKeys.all, "payment-summary"] as const,
  installments: () => [...studentPanelKeys.all, "installments"] as const,
  paymentAccount: () => [...studentPanelKeys.all, "payment-account"] as const,
  payment: (id: string) => [...studentPanelKeys.all, "payment", id] as const,
  invoices: () => [...studentPanelKeys.all, "invoices"] as const,
  invoice: (id: string) => [...studentPanelKeys.all, "invoice", id] as const,
  shortlist: () => [...studentPanelKeys.all, "shortlist"] as const,
  shortlistCompare: () =>
    [...studentPanelKeys.all, "shortlist-compare"] as const,
  privacyRequests: () =>
    [...studentPanelKeys.all, "privacy-requests"] as const,
  adminPrivacyRequests: (filters?: Record<string, unknown>) =>
    [...studentPanelKeys.all, "admin-privacy-requests", filters ?? {}] as const,
  exportData: () => [...studentPanelKeys.all, "export-data"] as const,
};
