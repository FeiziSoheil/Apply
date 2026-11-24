import type { QueryKey } from "@tanstack/react-query";
import { createEntityKeys } from "@/lib/api/query-keys";
import type {
  ActivityListQuery,
  LeadListQuery,
} from "@/contracts/leads";

const base = createEntityKeys<Partial<LeadListQuery>>(["leads"]);

export const leadKeys = {
  ...base,
  activities: (leadId: string, params?: Partial<ActivityListQuery>): QueryKey =>
    ["leads", "activities", leadId, params ?? {}],
  /** All activity lists of one lead (any params) */
  leadActivities: (leadId: string): QueryKey => ["leads", "activities", leadId],
} as const;
