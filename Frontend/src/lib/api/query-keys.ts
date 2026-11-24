import type { QueryKey } from "@tanstack/react-query";

/**
 * Generic query-key factory. Every domain builds its keys from this so the
 * hierarchy is uniform: `[...scope]` → `[...scope, "list", filters]` →
 * `[...scope, "detail", id]`. Invalidate a whole domain with `keys.all`.
 */
export function createEntityKeys<TFilters extends object = Record<string, never>>(
  scope: readonly [string, ...string[]],
) {
  return {
    all: scope as QueryKey,
    lists: (): QueryKey => [...scope, "list"],
    list: (filters?: TFilters): QueryKey => [...scope, "list", filters ?? {}],
    details: (): QueryKey => [...scope, "detail"],
    detail: (id: string): QueryKey => [...scope, "detail", id],
    slug: (slug: string): QueryKey => [...scope, "slug", slug],
  };
}
