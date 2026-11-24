import {
  QueryClient,
  isServer,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { isApiError, type ApiError } from "./errors";

/** Data is considered fresh for one minute; unused cache lives five minutes */
export const DEFAULT_STALE_TIME_MS = 60_000;
export const DEFAULT_GC_TIME_MS = 5 * 60_000;
export const MAX_RETRIES = 2;

/**
 * Retry policy for queries: never retry 4xx (the request is wrong or the user
 * is not allowed — retrying cannot help), cancellations or contract
 * violations; retry network errors / timeouts / 5xx a couple of times.
 */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (isApiError(error)) {
    if (error.isClientError) return false;
    if (error.code === "ABORTED" || error.code === "INVALID_RESPONSE") {
      return false;
    }
  }
  return failureCount < MAX_RETRIES;
}

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: DEFAULT_STALE_TIME_MS,
        gcTime: DEFAULT_GC_TIME_MS,
        retry: shouldRetry,
        refetchOnWindowFocus: false,
      },
      // Mutations (form submits) are not idempotent — never retry silently
      mutations: {
        retry: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/**
 * Server: always a fresh client (no cache shared between requests).
 * Browser: one singleton, shared by every `QueryProvider` island.
 */
export function getQueryClient(): QueryClient {
  if (isServer) return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  if (typeof window !== "undefined") {
    (window as unknown as { __queryClient?: QueryClient }).__queryClient =
      browserQueryClient;
  }
  return browserQueryClient;
}

/** Extra options accepted by the feature `use*` query hooks */
export type ApiQueryOptions<TData> = Omit<
  UseQueryOptions<TData, ApiError>,
  "queryKey" | "queryFn"
>;
