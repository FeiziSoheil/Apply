import type { QueryKey } from "@tanstack/react-query";

export const availabilityKeys = {
  all: ["availability"] as const,
  lists: (): QueryKey => [...availabilityKeys.all, "list"],
  detail: (consultantId: string): QueryKey => [
    ...availabilityKeys.all,
    "detail",
    consultantId,
  ],
  holidays: (): QueryKey => [...availabilityKeys.all, "holidays"],
} as const;
