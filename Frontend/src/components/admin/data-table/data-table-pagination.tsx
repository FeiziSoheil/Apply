"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Pagination } from "@/contracts/common";
import { formatNumber } from "@/lib/format";
import { TABLE_PAGE_SIZES, type TableController } from "./use-table-url-state";

type DataTablePaginationProps = {
  pagination: Pagination | undefined;
  controller: Pick<TableController, "params" | "setPage" | "setPageSize">;
  /** Number of rows currently selected (shown when > 0) */
  selectedCount: number;
  disabled?: boolean;
};

/** Server-side pagination footer: range summary, page size, first/prev/next/last */
export function DataTablePagination({
  pagination,
  controller,
  selectedCount,
  disabled,
}: DataTablePaginationProps) {
  const { params, setPage, setPageSize } = controller;
  const total = pagination?.total ?? 0;
  const totalPages = Math.max(pagination?.totalPages ?? 0, 1);
  const page = Math.min(pagination?.page ?? params.page, totalPages);
  const pageSize = pagination?.pageSize ?? params.pageSize;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground" aria-live="polite">
        {selectedCount > 0
          ? `${formatNumber(selectedCount)} مورد انتخاب شده · `
          : null}
        {total === 0
          ? "موردی یافت نشد"
          : `نمایش ${formatNumber(from)} تا ${formatNumber(to)} از ${formatNumber(total)} مورد`}
      </p>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="flex items-center gap-2">
          <span id="page-size-label" className="text-muted-foreground">
            تعداد در صفحه
          </span>
          <Select
            dir="rtl"
            value={String(pageSize)}
            onValueChange={(value) => setPageSize(Number(value))}
            disabled={disabled}
          >
            <SelectTrigger
              size="sm"
              className="w-20"
              aria-labelledby="page-size-label"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {TABLE_PAGE_SIZES.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {formatNumber(size)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <nav aria-label="صفحه‌بندی" className="flex items-center gap-1">
          <span className="me-2 tabular-nums text-muted-foreground">
            صفحه {formatNumber(page)} از {formatNumber(totalPages)}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => setPage(1)}
            disabled={disabled || page <= 1}
            aria-label="صفحه اول"
          >
            <ChevronsRight aria-hidden />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => setPage(page - 1)}
            disabled={disabled || page <= 1}
            aria-label="صفحه قبل"
          >
            <ChevronRight aria-hidden />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => setPage(page + 1)}
            disabled={disabled || page >= totalPages}
            aria-label="صفحه بعد"
          >
            <ChevronLeft aria-hidden />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => setPage(totalPages)}
            disabled={disabled || page >= totalPages}
            aria-label="صفحه آخر"
          >
            <ChevronsLeft aria-hidden />
          </Button>
        </nav>
      </div>
    </div>
  );
}
