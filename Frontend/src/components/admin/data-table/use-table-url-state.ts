"use client";

import { useCallback, useMemo } from "react";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
  type Nullable,
  type UseQueryStatesKeysMap,
  type Values,
} from "nuqs";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  SORT_ORDERS,
  type SortOrder,
} from "@/contracts/common";

/** Page sizes offered by the pagination footer */
export const TABLE_PAGE_SIZES = [10, 20, 50, 100] as const;

/**
 * URL params every admin table shares (`?page=2&pageSize=50&q=…&sort=…&order=desc`).
 * Defaults are omitted from the URL (`clearOnDefault`).
 */
export const tableBaseParsers = {
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(DEFAULT_PAGE_SIZE),
  q: parseAsString.withDefault(""),
  sort: parseAsString,
  order: parseAsStringLiteral(SORT_ORDERS).withDefault("asc"),
};

export type TableUrlParams = {
  page: number;
  pageSize: number;
  q: string;
  sort: string | null;
  order: SortOrder;
};

/** What `<DataTable>` needs from the URL state (independent of the filters) */
export type TableController = {
  params: TableUrlParams;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSearch: (q: string) => void;
  setSort: (sort: string | null, order: SortOrder) => void;
  /** `true` when a search term or any filter is set */
  hasActiveFilters: boolean;
  /** Changes whenever the result set changes (used to clear row selection) */
  resetKey: string;
  clearFilters: () => void;
};

export type TableUrlState<F extends UseQueryStatesKeysMap> = TableController & {
  /** Resource-specific filters (`?continent=europe&costBand=low`) */
  filters: Values<F>;
  setFilters: (patch: Partial<Nullable<Values<F>>>) => void;
};

function isFilterActive(value: unknown, defaultValue: unknown): boolean {
  if (value === null || value === undefined || value === "") return false;
  if (Array.isArray(value)) return value.length > 0;
  return value !== defaultValue;
}

/**
 * URL-backed state of a server-side table (nuqs). The URL is the single source
 * of truth, so a table view is shareable, refresh-safe and back-button friendly.
 *
 * Pass the resource-specific filter parsers; they live next to `page`, `q`,
 * `sort` … in the same query string. Changing search / filters / page size /
 * sorting always returns to page 1.
 *
 * Wrap the component using it in `<Suspense>` (nuqs reads `useSearchParams`).
 */
export function useTableUrlState<F extends UseQueryStatesKeysMap>(
  filterParsers: F,
): TableUrlState<F> {
  const parsers = useMemo(
    () => ({ ...tableBaseParsers, ...filterParsers }),
    [filterParsers],
  );
  const [rawState, setState] = useQueryStates(parsers, {
    history: "replace",
    clearOnDefault: true,
  });
  // TypeScript cannot resolve `Values<base & F>` for a generic `F`; the shape
  // is known: base params are always present, filters are keyed by `F`.
  const state = rawState as unknown as Values<typeof tableBaseParsers> &
    Values<F>;

  const filterKeys = useMemo(
    () => Object.keys(filterParsers) as Array<keyof F & string>,
    [filterParsers],
  );

  const params = useMemo<TableUrlParams>(
    () => ({
      page: Math.max(1, state.page),
      pageSize: Math.min(Math.max(1, state.pageSize), MAX_PAGE_SIZE),
      q: state.q,
      sort: state.sort,
      order: state.order,
    }),
    [state.page, state.pageSize, state.q, state.sort, state.order],
  );

  const filters = useMemo(() => {
    const entries = filterKeys.map((key) => [key, state[key]] as const);
    return Object.fromEntries(entries) as Values<F>;
  }, [filterKeys, state]);

  const hasActiveFilters = useMemo(
    () =>
      params.q !== "" ||
      filterKeys.some((key) =>
        isFilterActive(state[key], filterParsers[key]?.defaultValue),
      ),
    [filterKeys, filterParsers, params.q, state],
  );

  const resetKey = useMemo(
    () => JSON.stringify([params.q, filters]),
    [params.q, filters],
  );

  const patch = useCallback(
    (values: Record<string, unknown>, push = false) => {
      void setState(values as Parameters<typeof setState>[0], {
        history: push ? "push" : "replace",
      });
    },
    [setState],
  );

  const setPage = useCallback(
    (page: number) => patch({ page: Math.max(1, page) }, true),
    [patch],
  );
  const setPageSize = useCallback(
    (pageSize: number) => patch({ pageSize, page: 1 }),
    [patch],
  );
  const setSearch = useCallback(
    (q: string) => patch({ q: q.trim() === "" ? null : q, page: 1 }),
    [patch],
  );
  const setSort = useCallback(
    (sort: string | null, order: SortOrder) =>
      patch({ sort, order: sort ? order : null, page: 1 }),
    [patch],
  );
  const setFilters = useCallback(
    (values: Partial<Nullable<Values<F>>>) => patch({ ...values, page: 1 }),
    [patch],
  );
  const clearFilters = useCallback(() => {
    const cleared: Record<string, null> = { q: null, page: null };
    for (const key of filterKeys) cleared[key] = null;
    patch(cleared);
  }, [filterKeys, patch]);

  return {
    params,
    filters,
    setPage,
    setPageSize,
    setSearch,
    setSort,
    setFilters,
    clearFilters,
    hasActiveFilters,
    resetKey,
  };
}
