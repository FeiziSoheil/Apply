"use client";

import { useEffect, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { MockProvider } from "@/mocks/mock-provider";
import { getQueryClient } from "./query-client";
import { onSessionCleared } from "./session";

type QueryProviderProps = {
  children: React.ReactNode;
  /** Show the TanStack Query devtools (development builds only) */
  devtools?: boolean;
};

/**
 * Provides the shared `QueryClient`.
 *
 * Use it only around client islands that need TanStack Query — the panel
 * layout and the public forms. Public Server Component pages do not use it.
 * When `NEXT_PUBLIC_API_MOCKING=enabled` it also waits for the MSW worker
 * (`MockProvider`) so those islands never hit a missing backend.
 * The browser client is a singleton, so nested/multiple providers share cache.
 */
export function QueryProvider({ children, devtools = false }: QueryProviderProps) {
  const [queryClient] = useState(getQueryClient);

  // A cleared session (401) must not leave another user's data in the cache
  useEffect(
    () => onSessionCleared(() => queryClient.clear()),
    [queryClient],
  );

  return (
    <MockProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        {devtools ? (
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
        ) : null}
      </QueryClientProvider>
    </MockProvider>
  );
}
