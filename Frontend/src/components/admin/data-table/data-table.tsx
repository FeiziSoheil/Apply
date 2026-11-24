"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type Cell,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { SearchX, ServerCrash, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Pagination } from "@/contracts/common";
import { getApiErrorMessage } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";
import { ACTIONS_COLUMN_ID, SELECT_COLUMN_ID, getColumnLabel } from "./types";
import type { TableController } from "./use-table-url-state";

export type BulkActionsContext = {
  selectedIds: string[];
  clearSelection: () => void;
};

export type DataTableProps<TData> = {
  /** Data columns. Selection and row-actions columns are added by the table. */
  columns: ColumnDef<TData, unknown>[];
  data: TData[] | undefined;
  getRowId: (row: TData) => string;
  pagination: Pagination | undefined;
  /** URL state from `useTableUrlState` */
  controller: TableController;

  /** `useQuery().isPending` — no data yet */
  isLoading: boolean;
  /** `useQuery().isFetching` — refetching (placeholder data stays visible) */
  isFetching: boolean;
  /** `useQuery().error` */
  error: unknown;
  onRetry: () => void;

  /** Accessible table name (caption), e.g. «فهرست کشورها» */
  caption: string;
  searchPlaceholder?: string;
  /** Filter controls rendered in the toolbar */
  filters?: ReactNode;
  /** Adds a checkbox column + the bulk action bar */
  selectable?: boolean;
  /** Buttons shown while rows are selected (gate them with `<Can>`) */
  bulkActions?: (context: BulkActionsContext) => ReactNode;
  /** Per-row actions (edit / delete …): last column, and the card footer on mobile */
  rowActions?: (row: TData) => ReactNode;
  /** Empty state of an unfiltered list, e.g. «هنوز کشوری ثبت نشده» + create button */
  emptyState?: { title: string; description?: string; action?: ReactNode };
  /**
   * Persist column visibility in `localStorage` under this key (user preference).
   * Omit to keep visibility only for the current session.
   */
  columnVisibilityKey?: string;
  className?: string;
};

function readStoredVisibility(key: string | undefined): VisibilityState {
  if (!key || typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return parsed as VisibilityState;
  } catch {
    return {};
  }
}

const SKELETON_ROWS = 6;

function resolveSorting(controller: TableController): SortingState {
  const { sort, order } = controller.params;
  return sort ? [{ id: sort, desc: order === "desc" }] : [];
}

/**
 * Server-side data table (TanStack Table + shadcn Table).
 *
 * Pagination, sorting, search and filters are all URL state
 * (`useTableUrlState`); the table only renders what the server returned and
 * reports user intent back through the controller. Below `md` rows become
 * cards (same column definitions).
 */
export function DataTable<TData>({
  columns,
  data,
  getRowId,
  pagination,
  controller,
  isLoading,
  isFetching,
  error,
  onRetry,
  caption,
  searchPlaceholder = "جستجو…",
  filters,
  selectable = false,
  bulkActions,
  rowActions,
  emptyState,
  columnVisibilityKey,
  className,
}: DataTableProps<TData>) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    () => readStoredVisibility(columnVisibilityKey),
  );

  useEffect(() => {
    if (!columnVisibilityKey) return;
    try {
      window.localStorage.setItem(
        columnVisibilityKey,
        JSON.stringify(columnVisibility),
      );
    } catch {
      // ignore quota / private mode
    }
  }, [columnVisibility, columnVisibilityKey]);

  // New result set (search / filter changed): selection no longer applies
  const [selectionKey, setSelectionKey] = useState(controller.resetKey);
  if (selectionKey !== controller.resetKey) {
    setSelectionKey(controller.resetKey);
    setRowSelection({});
  }

  const allColumns = useMemo<ColumnDef<TData, unknown>[]>(() => {
    const selectColumn: ColumnDef<TData, unknown> = {
      id: SELECT_COLUMN_ID,
      enableSorting: false,
      enableHiding: false,
      meta: { className: "w-10", mobile: "hidden" },
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected()
              ? true
              : table.getIsSomePageRowsSelected()
                ? "indeterminate"
                : false
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(value === true)}
          aria-label="انتخاب همه ردیف‌های این صفحه"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(value === true)}
          aria-label="انتخاب ردیف"
        />
      ),
    };
    const actionsColumn: ColumnDef<TData, unknown> | null = rowActions
      ? {
          id: ACTIONS_COLUMN_ID,
          enableSorting: false,
          enableHiding: false,
          meta: { label: "عملیات", className: "w-12 text-end", mobile: "hidden" },
          header: () => <span className="sr-only">عملیات</span>,
          cell: ({ row }) => (
            <div className="flex items-center justify-end gap-1">
              {rowActions(row.original)}
            </div>
          ),
        }
      : null;
    return [
      ...(selectable ? [selectColumn] : []),
      // Sorting is server-side: only columns the API can sort stay sortable
      ...columns.map((column) => ({
        enableSorting: false,
        ...column,
      })),
      ...(actionsColumn ? [actionsColumn] : []),
    ];
  }, [columns, rowActions, selectable]);

  const sorting = resolveSorting(controller);

  // TanStack Table returns non-memoizable functions by design
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable<TData>({
    data: data ?? [],
    columns: allColumns,
    getRowId,
    state: { sorting, rowSelection, columnVisibility },
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    enableMultiSort: false,
    sortDescFirst: false,
    enableRowSelection: selectable,
    pageCount: pagination?.totalPages ?? -1,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      const first = next[0];
      controller.setSort(first?.id ?? null, first?.desc ? "desc" : "asc");
    },
    getCoreRowModel: getCoreRowModel(),
  });

  const rows = table.getRowModel().rows;
  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);
  const visibleColumnCount = table.getVisibleLeafColumns().length;
  const showSkeleton = isLoading;
  const showError = !showSkeleton && Boolean(error);
  const showEmpty = !showSkeleton && !showError && rows.length === 0;
  const showRows = !showSkeleton && !showError && rows.length > 0;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <DataTableToolbar
        table={table}
        controller={controller}
        searchPlaceholder={searchPlaceholder}
        filters={filters}
        isFetching={isFetching && !isLoading}
      />

      {selectable && bulkActions && selectedIds.length > 0 ? (
        <div
          role="region"
          aria-label="عملیات گروهی"
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2"
        >
          <p className="text-sm font-medium" aria-live="polite">
            {formatNumber(selectedIds.length)} مورد انتخاب شده
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {bulkActions({
              selectedIds,
              clearSelection: () => setRowSelection({}),
            })}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setRowSelection({})}
            >
              لغو انتخاب
            </Button>
          </div>
        </div>
      ) : null}

      {showError ? (
        <Empty className="border bg-card py-12" role="alert">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="bg-destructive/10 text-destructive">
              <ServerCrash aria-hidden />
            </EmptyMedia>
            <EmptyTitle>دریافت اطلاعات انجام نشد</EmptyTitle>
            <EmptyDescription>{getApiErrorMessage(error)}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button type="button" variant="outline" onClick={onRetry}>
              <RefreshCw data-icon="inline-start" aria-hidden />
              تلاش دوباره
            </Button>
          </EmptyContent>
        </Empty>
      ) : null}

      {showEmpty ? (
        <Empty className="border bg-card py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchX aria-hidden />
            </EmptyMedia>
            <EmptyTitle>
              {controller.hasActiveFilters
                ? "نتیجه‌ای با این فیلترها پیدا نشد"
                : (emptyState?.title ?? "موردی ثبت نشده است")}
            </EmptyTitle>
            <EmptyDescription>
              {controller.hasActiveFilters
                ? "عبارت جستجو یا فیلترها را تغییر دهید."
                : emptyState?.description}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            {controller.hasActiveFilters ? (
              <Button type="button" variant="outline" onClick={controller.clearFilters}>
                حذف فیلترها
              </Button>
            ) : (
              emptyState?.action
            )}
          </EmptyContent>
        </Empty>
      ) : null}

      {showSkeleton || showRows ? (
        <>
          {/* Desktop / tablet: table */}
          <div
            className={cn(
              "hidden rounded-lg border bg-card md:block",
              isFetching && !isLoading && "opacity-70 transition-opacity",
            )}
            aria-busy={isFetching}
          >
            <Table>
              <caption className="sr-only">{caption}</caption>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        scope="col"
                        className={header.column.columnDef.meta?.className}
                        aria-sort={
                          header.column.getIsSorted() === "asc"
                            ? "ascending"
                            : header.column.getIsSorted() === "desc"
                              ? "descending"
                              : undefined
                        }
                      >
                        {header.isPlaceholder
                          ? null
                          : typeof header.column.columnDef.header === "string"
                            ? (
                                <DataTableColumnHeader
                                  column={header.column}
                                  title={header.column.columnDef.header}
                                />
                              )
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {showSkeleton
                  ? Array.from({ length: SKELETON_ROWS }, (_, index) => (
                      <TableRow key={index}>
                        <TableCell colSpan={visibleColumnCount}>
                          <Skeleton className="h-6 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  : rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() ? "selected" : undefined}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className={cell.column.columnDef.meta?.className}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile: cards */}
          <ul
            className={cn(
              "flex flex-col gap-3 md:hidden",
              isFetching && !isLoading && "opacity-70 transition-opacity",
            )}
            aria-label={caption}
            aria-busy={isFetching}
          >
            {showSkeleton
              ? Array.from({ length: 4 }, (_, index) => (
                  <li key={index}>
                    <Skeleton className="h-28 w-full rounded-xl" />
                  </li>
                ))
              : rows.map((row) => {
                  const cells = row.getVisibleCells();
                  const titleCell =
                    cells.find((cell) => cell.column.columnDef.meta?.mobile === "title") ??
                    cells.find((cell) => !isSpecialColumn(cell));
                  const detailCells = cells.filter(
                    (cell) =>
                      cell !== titleCell &&
                      !isSpecialColumn(cell) &&
                      cell.column.columnDef.meta?.mobile !== "hidden",
                  );
                  const selectCell = cells.find(
                    (cell) => cell.column.id === SELECT_COLUMN_ID,
                  );
                  return (
                    <li key={row.id}>
                      <Card
                        size="sm"
                        data-state={row.getIsSelected() ? "selected" : undefined}
                        className="data-[state=selected]:ring-primary/50"
                      >
                        <CardContent className="flex flex-col gap-3">
                          <div className="flex items-start gap-3">
                            {selectCell ? (
                              <div className="pt-0.5">
                                {flexRender(
                                  selectCell.column.columnDef.cell,
                                  selectCell.getContext(),
                                )}
                              </div>
                            ) : null}
                            <div className="min-w-0 flex-1 font-medium">
                              {titleCell
                                ? flexRender(
                                    titleCell.column.columnDef.cell,
                                    titleCell.getContext(),
                                  )
                                : null}
                            </div>
                            {rowActions ? (
                              <div className="flex shrink-0 items-center gap-1">
                                {rowActions(row.original)}
                              </div>
                            ) : null}
                          </div>
                          {detailCells.length > 0 ? (
                            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                              {detailCells.map((cell) => (
                                <div key={cell.id} className="flex min-w-0 flex-col gap-0.5">
                                  <dt className="text-xs text-muted-foreground">
                                    {getColumnLabel(cell.column)}
                                  </dt>
                                  <dd className="min-w-0">
                                    {flexRender(
                                      cell.column.columnDef.cell,
                                      cell.getContext(),
                                    )}
                                  </dd>
                                </div>
                              ))}
                            </dl>
                          ) : null}
                        </CardContent>
                      </Card>
                    </li>
                  );
                })}
          </ul>
        </>
      ) : null}

      <DataTablePagination
        pagination={pagination}
        controller={controller}
        selectedCount={selectedIds.length}
        disabled={isLoading}
      />
    </div>
  );
}

function isSpecialColumn<TData>(cell: Cell<TData, unknown>): boolean {
  return (
    cell.column.id === SELECT_COLUMN_ID || cell.column.id === ACTIONS_COLUMN_ID
  );
}
