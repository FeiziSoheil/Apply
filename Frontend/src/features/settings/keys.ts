import type { QueryKey } from "@tanstack/react-query";

export const settingsKeys = {
  all: ["settings"] as QueryKey,
  institute: (): QueryKey => ["settings", "institute"],
} as const;
