"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { parseAsBoolean, parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { CheckCheck, Loader2 } from "lucide-react";
import { PageContainer } from "@/components/panel/page-container";
import { PageHeader } from "@/components/panel/page-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { NotificationType } from "@/contracts/crm";
import {
  useBulkMarkNotificationsRead,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from "@/features/notifications/mutations";
import { useNotifications } from "@/features/notifications/queries";
import { getApiErrorMessage } from "@/lib/api";
import {
  NOTIFICATION_TYPE_META,
  getNotificationTypeMeta,
} from "@/lib/crm/notification-types";
import { formatNumber, formatRelativeFa } from "@/lib/format";
import { cn } from "@/lib/utils";

const parsers = {
  page: parseAsInteger.withDefault(1),
  type: parseAsString,
  unread: parseAsBoolean,
};

export function NotificationsPage() {
  const [params, setParams] = useQueryStates(parsers, { history: "replace" });
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filters = useMemo(
    () => ({
      page: params.page,
      pageSize: 20,
      sort: "createdAt" as const,
      order: "desc" as const,
      type: (params.type || undefined) as NotificationType | undefined,
      unread: params.unread === null ? undefined : params.unread,
    }),
    [params.page, params.type, params.unread],
  );

  const listQuery = useNotifications(filters);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const bulkMark = useBulkMarkNotificationsRead();

  const items = listQuery.data?.items ?? [];
  const pagination = listQuery.data?.pagination;
  const allSelected =
    items.length > 0 && items.every((item) => selected.has(item.id));

  return (
    <PageContainer>
      <PageHeader
        title="اعلان‌ها"
        description="همه اعلان‌های شما با فیلتر نوع و وضعیت خواندن."
        actions={
          <Button
            type="button"
            variant="outline"
            disabled={markAll.isPending}
            onClick={() => markAll.mutate()}
          >
            {markAll.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <CheckCheck data-icon="inline-start" />
            )}
            خواندن همه
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-3">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground" htmlFor="notif-type">
              نوع
            </label>
            <Select
              value={params.type ?? "all"}
              onValueChange={(value) =>
                void setParams({
                  type: value === "all" ? null : value,
                  page: 1,
                })
              }
            >
              <SelectTrigger id="notif-type" className="w-44">
                <SelectValue placeholder="همه انواع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه انواع</SelectItem>
                {NOTIFICATION_TYPE_META.map((meta) => (
                  <SelectItem key={meta.type} value={meta.type}>
                    {meta.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label
              className="text-xs text-muted-foreground"
              htmlFor="notif-status"
            >
              وضعیت
            </label>
            <Select
              value={
                params.unread === true
                  ? "unread"
                  : params.unread === false
                    ? "read"
                    : "all"
              }
              onValueChange={(value) =>
                void setParams({
                  unread:
                    value === "unread"
                      ? true
                      : value === "read"
                        ? false
                        : null,
                  page: 1,
                })
              }
            >
              <SelectTrigger id="notif-status" className="w-40">
                <SelectValue placeholder="همه" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه</SelectItem>
                <SelectItem value="unread">خوانده‌نشده</SelectItem>
                <SelectItem value="read">خوانده‌شده</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={selected.size === 0 || bulkMark.isPending}
          onClick={() => {
            bulkMark.mutate(
              { ids: [...selected] },
              {
                onSuccess: () => setSelected(new Set()),
              },
            );
          }}
        >
          خواندن انتخاب‌شده‌ها ({formatNumber(selected.size)})
        </Button>
      </div>

      {listQuery.isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : listQuery.isError ? (
        <p className="text-sm text-destructive" role="alert">
          {getApiErrorMessage(listQuery.error)}
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
          اعلانی با این فیلترها پیدا نشد.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="flex items-center gap-3 border-b border-border bg-muted/40 px-3 py-2">
            <Checkbox
              checked={allSelected}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelected(new Set(items.map((item) => item.id)));
                } else {
                  setSelected(new Set());
                }
              }}
              aria-label="انتخاب همه در این صفحه"
            />
            <span className="text-xs text-muted-foreground">
              {formatNumber(pagination?.total ?? items.length)} اعلان
            </span>
          </div>
          <ul role="list" className="divide-y divide-border">
            {items.map((item) => {
              const meta = getNotificationTypeMeta(item.type);
              const Icon = meta.Icon;
              const unread = item.readAt === null;
              return (
                <li
                  key={item.id}
                  className={cn(
                    "flex items-start gap-3 px-3 py-3",
                    unread && "bg-accent/5",
                  )}
                >
                  <Checkbox
                    className="mt-1"
                    checked={selected.has(item.id)}
                    onCheckedChange={(checked) => {
                      setSelected((prev) => {
                        const next = new Set(prev);
                        if (checked) next.add(item.id);
                        else next.delete(item.id);
                        return next;
                      });
                    }}
                    aria-label={`انتخاب اعلان ${item.title}`}
                  />
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p
                        className={cn(
                          "text-sm",
                          unread ? "font-semibold" : "font-medium",
                        )}
                      >
                        {item.title}
                      </p>
                      <time
                        className="text-xs text-muted-foreground"
                        dateTime={item.createdAt}
                      >
                        {formatRelativeFa(item.createdAt)}
                      </time>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {item.body}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="text-xs text-muted-foreground">
                        {meta.label}
                      </span>
                      <Button
                        type="button"
                        variant="link"
                        size="xs"
                        className="h-auto p-0"
                        asChild
                      >
                        <Link
                          href={item.link}
                          onClick={() => {
                            if (unread) markRead.mutate(item.id);
                          }}
                        >
                          مشاهده
                        </Link>
                      </Button>
                      {unread ? (
                        <Button
                          type="button"
                          variant="link"
                          size="xs"
                          className="h-auto p-0"
                          onClick={() => markRead.mutate(item.id)}
                        >
                          علامت خوانده‌شده
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {pagination && pagination.totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={params.page <= 1}
            onClick={() => void setParams({ page: params.page - 1 })}
          >
            قبلی
          </Button>
          <span className="text-xs text-muted-foreground">
            صفحه {formatNumber(params.page)} از{" "}
            {formatNumber(pagination.totalPages)}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={params.page >= pagination.totalPages}
            onClick={() => void setParams({ page: params.page + 1 })}
          >
            بعدی
          </Button>
        </div>
      ) : null}
    </PageContainer>
  );
}
