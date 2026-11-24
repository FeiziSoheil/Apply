"use client";

import { queryOptions } from "@tanstack/react-query";
import type { CurrentUser } from "@/contracts/auth";
import { isApiError } from "@/lib/api/errors";
import { getSessionAdapter } from "@/lib/api/session-adapter";
import { authApi } from "./api";
import { authKeys } from "./keys";

export { authKeys } from "./keys";

/**
 * The session as a query: the user, or `null` when nobody is signed in.
 * A 401 is an answer, not an error — it resolves to `null`.
 */
async function fetchSession(signal?: AbortSignal): Promise<CurrentUser | null> {
  const adapter = getSessionAdapter();
  // Mock transport keeps its token in memory only: without one (first visit,
  // page reload) the answer is known — skip the pointless 401 round trip and
  // drop a stale `mock_session` cookie.
  if (adapter.kind === "mock-bearer" && adapter.getAccessToken() === null) {
    adapter.clear();
    return null;
  }
  try {
    return await authApi.getCurrentUser({ signal });
  } catch (error) {
    if (isApiError(error) && error.isUnauthorized) {
      adapter.clear(); // no listeners: the provider reacts to the `null`
      return null;
    }
    throw error;
  }
}

export const authQueries = {
  me: () =>
    queryOptions({
      queryKey: authKeys.me(),
      queryFn: ({ signal }) => fetchSession(signal),
    }),
};
