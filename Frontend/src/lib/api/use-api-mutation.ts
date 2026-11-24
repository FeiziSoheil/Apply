"use client";

import {
  useMutation,
  useQueryClient,
  type QueryClient,
  type QueryKey,
  type UseMutationOptions,
  type UseMutationResult,
} from "@tanstack/react-query";
import type { ApiError } from "./errors";

export type ApiMutationOptions<TData, TVariables> = Omit<
  UseMutationOptions<TData, ApiError, TVariables>,
  "mutationFn"
>;

type UseApiMutationConfig<TData, TVariables> = {
  mutationFn: (variables: TVariables) => Promise<TData>;
  /** Query keys (prefixes) to invalidate after the mutation succeeds */
  invalidates?: (
    data: TData,
    variables: TVariables,
    queryClient: QueryClient,
  ) => readonly QueryKey[];
  options?: ApiMutationOptions<TData, TVariables>;
};

/**
 * `useMutation` with typed `ApiError` and declarative cache invalidation.
 * Invalidation runs before the caller's own `onSuccess`, which therefore
 * always sees fresh data.
 */
export function useApiMutation<TData, TVariables = void>({
  mutationFn,
  invalidates,
  options,
}: UseApiMutationConfig<TData, TVariables>): UseMutationResult<
  TData,
  ApiError,
  TVariables
> {
  const queryClient = useQueryClient();
  const userOnSuccess = options?.onSuccess;

  return useMutation<TData, ApiError, TVariables>({
    ...options,
    mutationFn,
    onSuccess: async (...args) => {
      const [data, variables] = args;
      if (invalidates) {
        await Promise.all(
          invalidates(data, variables, queryClient).map((queryKey) =>
            queryClient.invalidateQueries({ queryKey }),
          ),
        );
      }
      return userOnSuccess?.(...args);
    },
  });
}
