"use client";

import type { Column, RowData } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DataTableColumnHeaderProps<TData extends RowData, TValue> = {
  column: Column<TData, TValue>;
  title: string;
  className?: string;
};

/** Column title; a sortable column becomes a button cycling asc → desc → none */
export function DataTableColumnHeader<TData extends RowData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <span className={className}>{title}</span>;
  }

  const sorted = column.getIsSorted();
  const Icon =
    sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ChevronsUpDown;
  const description =
    sorted === "asc"
      ? "مرتب‌شده صعودی"
      : sorted === "desc"
        ? "مرتب‌شده نزولی"
        : "بدون مرتب‌سازی";

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn("-ms-2 h-8 px-2 font-medium", className)}
      onClick={column.getToggleSortingHandler()}
      aria-label={`مرتب‌سازی بر اساس ${title} (${description})`}
    >
      {title}
      <Icon
        data-icon="inline-end"
        className={cn(!sorted && "text-muted-foreground")}
        aria-hidden
      />
    </Button>
  );
}
