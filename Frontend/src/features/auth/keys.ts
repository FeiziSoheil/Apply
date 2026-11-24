import type { QueryKey } from "@tanstack/react-query";

export const authKeys = {
  all: ["auth"] as QueryKey,
  /** Current user / session (`GET /me`) */
  me: (): QueryKey => ["auth", "me"],
} as const;
