"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { DataTable } from "@/components/admin/data-table/data-table";
import { SelectFilter } from "@/components/admin/data-table/filters";
import { RowActionsMenu } from "@/components/admin/data-table/row-actions-menu";
import { useTableUrlState } from "@/components/admin/data-table/use-table-url-state";
import { PageContainer } from "@/components/panel/page-container";
import { PageHeader } from "@/components/panel/page-header";
import { Can } from "@/components/rbac/can";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { NewsItem, PublicationStatus } from "@/contracts/content";
import { useDeleteNewsItem } from "@/features/content/mutations";
import { useNewsItems } from "@/features/content/queries";
import { getApiErrorMessage, isApiError } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { NEWS_EVENT_TYPE_OPTIONS } from "@/lib/validations/news";
import { newsColumns } from "./news-columns";
import { newsFilterParsers, toNewsListQuery } from "./news-table-params";

const STATUS_TABS = [
  { value: "all", label: "همه" },
  { value: "draft", label: "پیش‌نویس" },
  { value: "published", label: "منتشرشده" },
  { value: "scheduled", label: "زمان‌بندی‌شده" },
] as const;

/**
 * `/admin/content/news` — list, status tabs, filters, delete.
 */
export function NewsManager() {
  const router = useRouter();
  const table = useTableUrlState(newsFilterParsers);
  const { params, filters, setFilters } = table;
  const query = useNewsItems(toNewsListQuery(params, filters));
  const deleteNews = useDeleteNewsItem();

  const [deleting, setDeleting] = useState<NewsItem | null>(null);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const [bulkDeleteIds, setBulkDeleteIds] = useState<string[] | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [clearSelection, setClearSelection] = useState<(() => void) | null>(
    null,
  );

  const openCreate = useCallback(() => {
    router.push("/admin/content/news/new");
  }, [router]);

  const openEdit = useCallback(
    (item: NewsItem) => {
      router.push(`/admin/content/news/${item.id}/edit`);
    },
    [router],
  );

  function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    deleteNews.mutate(target.id, {
      onSuccess: () => {
        toast.success(`خبر «${target.title}» حذف شد.`);
        setDeleting(null);
      },
      onError: (error) => {
        setDeleting(null);
        if (isApiError(error) && error.isConflict) {
          setConflictMessage(error.message);
          return;
        }
        toast.error(getApiErrorMessage(error));
      },
    });
  }

  async function confirmBulkDelete() {
    if (!bulkDeleteIds) return;
    setIsBulkDeleting(true);
    const results = await Promise.allSettled(
      bulkDeleteIds.map((id) => deleteNews.mutateAsync(id)),
    );
    setIsBulkDeleting(false);

    const failed = results.filter(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );
    const deletedCount = results.length - failed.length;
    if (deletedCount > 0) {
      toast.success(`${formatNumber(deletedCount)} خبر حذف شد.`);
    }
    if (failed.length > 0) {
      const first = failed[0]?.reason;
      if (isApiError(first) && first.isConflict) {
        setConflictMessage(first.message);
      } else {
        toast.error(
          `${formatNumber(failed.length)} مورد حذف نشد: ${getApiErrorMessage(first)}`,
        );
      }
    }
    clearSelection?.();
    setBulkDeleteIds(null);
  }

  const statusTab = filters.status ?? "all";
  const data = query.data;

  return (
    <PageContainer>
      <PageHeader
        title="اخبار"
        description="مدیریت اخبار، وبینارها و اطلاعیه‌ها."
        actions={
          <Can permission="content:write">
            <Button type="button" onClick={openCreate}>
              <Plus data-icon="inline-start" aria-hidden />
              افزودن خبر
            </Button>
          </Can>
        }
      />

      <Tabs
        value={statusTab}
        onValueChange={(value) =>
          setFilters({
            status: value === "all" ? null : (value as PublicationStatus),
          })
        }
        className="mb-4"
      >
        <TabsList variant="line">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <DataTable
        caption="فهرست اخبار"
        columns={newsColumns}
        data={data?.items}
        pagination={data?.pagination}
        getRowId={(item) => item.id}
        controller={table}
        isLoading={query.isPending}
        isFetching={query.isFetching}
        error={query.error}
        onRetry={() => void query.refetch()}
        searchPlaceholder="جستجوی عنوان یا خلاصه…"
        selectable
        filters={
          <>
            <SelectFilter
              label="نوع"
              value={filters.eventType}
              options={NEWS_EVENT_TYPE_OPTIONS}
              onChange={(eventType) =>
                setFilters({
                  eventType: eventType as NewsItem["eventType"] | null,
                })
              }
            />
            <SelectFilter
              label="وضعیت"
              value={filters.status}
              options={STATUS_TABS.filter((tab) => tab.value !== "all")}
              onChange={(status) =>
                setFilters({
                  status: status as PublicationStatus | null,
                })
              }
            />
          </>
        }
        bulkActions={({ selectedIds, clearSelection: clear }) => (
          <Can permission="content:delete">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                setClearSelection(() => clear);
                setBulkDeleteIds(selectedIds);
              }}
            >
              <Trash2 data-icon="inline-start" aria-hidden />
              حذف انتخاب‌شده‌ها
            </Button>
          </Can>
        )}
        rowActions={(item) => (
          <Can permission={["content:write", "content:delete"]} mode="any">
            <RowActionsMenu label={`عملیات ${item.title}`}>
              <Can permission="content:write">
                <DropdownMenuItem onSelect={() => openEdit(item)}>
                  <Pencil aria-hidden />
                  ویرایش
                </DropdownMenuItem>
              </Can>
              <Can permission="content:delete">
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setDeleting(item)}
                >
                  <Trash2 aria-hidden />
                  حذف
                </DropdownMenuItem>
              </Can>
            </RowActionsMenu>
          </Can>
        )}
        emptyState={{
          title: "هنوز خبری ثبت نشده است",
          description: "اولین خبر را اضافه کنید.",
          action: (
            <Can permission="content:write">
              <Button type="button" onClick={openCreate}>
                <Plus data-icon="inline-start" aria-hidden />
                افزودن خبر
              </Button>
            </Can>
          ),
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        tone="destructive"
        title="حذف خبر"
        description={
          deleting
            ? `خبر «${deleting.title}» برای همیشه حذف می‌شود.`
            : undefined
        }
        confirmLabel="حذف خبر"
        isPending={deleteNews.isPending}
        onConfirm={confirmDelete}
      />

      <ConfirmDialog
        open={bulkDeleteIds !== null}
        onOpenChange={(open) => {
          if (!open) setBulkDeleteIds(null);
        }}
        tone="destructive"
        title="حذف گروهی اخبار"
        description={
          bulkDeleteIds
            ? `${formatNumber(bulkDeleteIds.length)} خبر انتخاب‌شده حذف می‌شوند.`
            : undefined
        }
        confirmLabel="حذف همه"
        isPending={isBulkDeleting}
        onConfirm={confirmBulkDelete}
      />

      <ConfirmDialog
        open={conflictMessage !== null}
        onOpenChange={(open) => {
          if (!open) setConflictMessage(null);
        }}
        tone="default"
        title="حذف امکان‌پذیر نیست"
        description={conflictMessage ?? "این خبر قابل حذف نیست."}
        confirmLabel="متوجه شدم"
        cancelLabel="بستن"
        onConfirm={() => setConflictMessage(null)}
      />
    </PageContainer>
  );
}
