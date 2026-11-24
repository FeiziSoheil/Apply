"use client";

import type { ReactNode } from "react";
import { FilterX, Pencil, SearchX, ServerCrash, Trash2 } from "lucide-react";
import { SearchInput } from "@/components/admin/data-table/data-table-toolbar";
import type { TableController } from "@/components/admin/data-table/use-table-url-state";
import { Can } from "@/components/rbac/can";
import { useCan } from "@/components/rbac/use-can";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PublicationStatus } from "@/contracts/content";
import { getApiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * Reorderable lists load everything in one page so the saved `order` covers
 * the whole set (the API caps `pageSize` at 100).
 */
export const REORDER_LIST_PAGE_SIZE = 100;

/**
 * Edit payloads must not carry `order` (the form builds `order: 0`): the
 * position is changed only by drag & drop, never by saving the form.
 */
export function withoutOrder<T extends { order?: number }>(
  body: T,
): Omit<T, "order"> {
  const { order, ...rest } = body;
  void order;
  return rest;
}

/* -------------------------------------------------------------------------- */
/*  Toolbar                                                                   */
/* -------------------------------------------------------------------------- */

type ContentListToolbarProps = {
  controller: Pick<
    TableController,
    "params" | "setSearch" | "hasActiveFilters" | "clearFilters"
  >;
  searchPlaceholder: string;
  /** Filter controls (`SelectFilter`, …) */
  filters?: ReactNode;
  isFetching?: boolean;
};

/** Search (nuqs `q`) + filters + «حذف فیلترها» above a reorderable list */
export function ContentListToolbar({
  controller,
  searchPlaceholder,
  filters,
  isFetching = false,
}: ContentListToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchInput
        value={controller.params.q}
        onSearch={controller.setSearch}
        placeholder={searchPlaceholder}
      />
      {filters}
      {controller.hasActiveFilters ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={controller.clearFilters}
        >
          <FilterX data-icon="inline-start" aria-hidden />
          حذف فیلترها
        </Button>
      ) : null}
      {isFetching ? (
        <Spinner
          aria-label="در حال به‌روزرسانی"
          className="text-muted-foreground"
        />
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Status tabs                                                               */
/* -------------------------------------------------------------------------- */

const STATUS_TABS = [
  { value: "all", label: "همه" },
  { value: "draft", label: "پیش‌نویس" },
  { value: "published", label: "منتشرشده" },
  { value: "scheduled", label: "زمان‌بندی‌شده" },
] as const;

type PublicationStatusTabsProps = {
  value: PublicationStatus | null;
  onChange: (status: PublicationStatus | null) => void;
};

/** «همه / پیش‌نویس / منتشرشده / زمان‌بندی‌شده» tabs bound to a status filter */
export function PublicationStatusTabs({
  value,
  onChange,
}: PublicationStatusTabsProps) {
  return (
    <Tabs
      value={value ?? "all"}
      onValueChange={(next) =>
        onChange(next === "all" ? null : (next as PublicationStatus))
      }
    >
      <TabsList variant="line">
        {STATUS_TABS.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

/* -------------------------------------------------------------------------- */
/*  Reorder guard                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Dragging is only meaningful on the full, unfiltered list: a filtered or
 * paginated subset would overwrite `order` with partial indexes.
 */
export function useReorderGuard(
  hasActiveFilters: boolean,
  total: number | undefined,
): { disabled: boolean; message: string | null } {
  const canWrite = useCan("content:write");
  if (!canWrite) return { disabled: true, message: null };
  if (hasActiveFilters) {
    return {
      disabled: true,
      message: "برای تغییر ترتیب، جستجو و فیلترها را پاک کنید.",
    };
  }
  if (total !== undefined && total > REORDER_LIST_PAGE_SIZE) {
    return {
      disabled: true,
      message: `تغییر ترتیب فقط برای حداکثر ${REORDER_LIST_PAGE_SIZE} مورد پشتیبانی می‌شود.`,
    };
  }
  return { disabled: false, message: null };
}

/* -------------------------------------------------------------------------- */
/*  Row                                                                       */
/* -------------------------------------------------------------------------- */

type ContentListRowProps = {
  /** `dragHandle` from `ReorderableListPanel` render props */
  dragHandle: ReactNode;
  isDragging?: boolean;
  /** Icon / avatar before the title */
  leading?: ReactNode;
  title: string;
  subtitle?: ReactNode;
  badges?: ReactNode;
  onEdit: () => void;
  onDelete: () => void;
  /** Extra buttons before edit / delete (wrapped in `<Can>` by the caller) */
  extraActions?: ReactNode;
  className?: string;
};

/** Row of a reorderable list: handle, title, badges and edit / delete actions */
export function ContentListRow({
  dragHandle,
  isDragging = false,
  leading,
  title,
  subtitle,
  badges,
  onEdit,
  onDelete,
  extraActions,
  className,
}: ContentListRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-card p-3",
        isDragging && "border-primary",
        className,
      )}
    >
      {dragHandle}
      {leading}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-medium">{title}</span>
          {badges}
        </div>
        {subtitle ? (
          <div className="truncate text-xs text-muted-foreground">
            {subtitle}
          </div>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {extraActions}
        <Can permission="content:write">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`ویرایش ${title}`}
            title="ویرایش"
            onClick={onEdit}
          >
            <Pencil aria-hidden />
          </Button>
        </Can>
        <Can permission="content:delete">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-destructive hover:text-destructive"
            aria-label={`حذف ${title}`}
            title="حذف"
            onClick={onDelete}
          >
            <Trash2 aria-hidden />
          </Button>
        </Can>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Empty / error states                                                      */
/* -------------------------------------------------------------------------- */

type ContentListEmptyProps = {
  /** Shown when nothing is created yet, e.g. «هنوز خدمتی ثبت نشده است» */
  title: string;
  description: string;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  /** Create button (wrapped in `<Can>` by the caller) */
  action?: ReactNode;
};

export function ContentListEmpty({
  title,
  description,
  hasActiveFilters,
  onClearFilters,
  action,
}: ContentListEmptyProps) {
  return (
    <Empty className="border bg-card py-12">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchX aria-hidden />
        </EmptyMedia>
        <EmptyTitle>
          {hasActiveFilters ? "نتیجه‌ای یافت نشد" : title}
        </EmptyTitle>
        <EmptyDescription>
          {hasActiveFilters
            ? "جستجو یا فیلترها را تغییر دهید."
            : description}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {hasActiveFilters ? (
          <Button type="button" variant="outline" onClick={onClearFilters}>
            <FilterX data-icon="inline-start" aria-hidden />
            حذف فیلترها
          </Button>
        ) : (
          action
        )}
      </EmptyContent>
    </Empty>
  );
}

export function ContentListError({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry: () => void;
}) {
  return (
    <Empty className="border bg-card py-12" role="alert">
      <EmptyHeader>
        <EmptyMedia
          variant="icon"
          className="bg-destructive/10 text-destructive"
        >
          <ServerCrash aria-hidden />
        </EmptyMedia>
        <EmptyTitle>دریافت اطلاعات انجام نشد</EmptyTitle>
        <EmptyDescription>{getApiErrorMessage(error)}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button type="button" variant="outline" onClick={onRetry}>
          تلاش دوباره
        </Button>
      </EmptyContent>
    </Empty>
  );
}
