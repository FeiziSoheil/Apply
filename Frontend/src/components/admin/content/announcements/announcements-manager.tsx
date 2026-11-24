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
import type { PublicationStatus } from "@/contracts/content";
import type { Announcement } from "@/contracts/student-panel";
import { useDeleteAnnouncement } from "@/features/announcements/mutations";
import { useAnnouncements } from "@/features/announcements/queries";
import { getApiErrorMessage, isApiError } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { ANNOUNCEMENT_STATUS_OPTIONS } from "@/lib/validations/announcement";
import { announcementColumns } from "./announcement-columns";
import {
  announcementFilterParsers,
  toAnnouncementListQuery,
} from "./announcement-table-params";

const STATUS_TABS = [
  { value: "all", label: "همه" },
  ...ANNOUNCEMENT_STATUS_OPTIONS,
] as const;

/**
 * `/admin/content/announcements` — list, status tabs, search, delete.
 */
export function AnnouncementsManager() {
  const router = useRouter();
  const table = useTableUrlState(announcementFilterParsers);
  const { params, filters, setFilters } = table;
  const query = useAnnouncements(toAnnouncementListQuery(params, filters));
  const deleteAnnouncement = useDeleteAnnouncement();

  const [deleting, setDeleting] = useState<Announcement | null>(null);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const [bulkDeleteIds, setBulkDeleteIds] = useState<string[] | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [clearSelection, setClearSelection] = useState<(() => void) | null>(
    null,
  );

  const openCreate = useCallback(() => {
    router.push("/admin/content/announcements/new");
  }, [router]);

  const openEdit = useCallback(
    (item: Announcement) => {
      router.push(`/admin/content/announcements/${item.id}/edit`);
    },
    [router],
  );

  function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    deleteAnnouncement.mutate(target.id, {
      onSuccess: () => {
        toast.success(`اعلان «${target.title}» حذف شد.`);
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
      bulkDeleteIds.map((id) => deleteAnnouncement.mutateAsync(id)),
    );
    setIsBulkDeleting(false);

    const failed = results.filter(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );
    const deletedCount = results.length - failed.length;
    if (deletedCount > 0) {
      toast.success(`${formatNumber(deletedCount)} اعلان حذف شد.`);
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
        title="اعلان‌های پنل دانشجو"
        description="اعلان‌های ساده برای همه دانشجویان یا بر اساس کشور مقصد پرونده."
        actions={
          <Can permission="content:write">
            <Button type="button" onClick={openCreate}>
              <Plus data-icon="inline-start" aria-hidden />
              افزودن اعلان
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
        caption="فهرست اعلان‌ها"
        columns={announcementColumns}
        data={data?.items}
        pagination={data?.pagination}
        getRowId={(item) => item.id}
        controller={table}
        isLoading={query.isPending}
        isFetching={query.isFetching}
        error={query.error}
        onRetry={() => void query.refetch()}
        searchPlaceholder="جستجوی عنوان یا متن…"
        selectable
        filters={
          <SelectFilter
            label="وضعیت"
            value={filters.status}
            options={ANNOUNCEMENT_STATUS_OPTIONS.map((tab) => ({
              value: tab.value,
              label: tab.label,
            }))}
            onChange={(status) =>
              setFilters({
                status: status as PublicationStatus | null,
              })
            }
          />
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
          title: "هنوز اعلانی ثبت نشده است",
          description: "اولین اعلان پنل دانشجو را اضافه کنید.",
          action: (
            <Can permission="content:write">
              <Button type="button" onClick={openCreate}>
                <Plus data-icon="inline-start" aria-hidden />
                افزودن اعلان
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
        title="حذف اعلان"
        description={
          deleting
            ? `اعلان «${deleting.title}» برای همیشه حذف می‌شود.`
            : undefined
        }
        confirmLabel="حذف اعلان"
        isPending={deleteAnnouncement.isPending}
        onConfirm={confirmDelete}
      />

      <ConfirmDialog
        open={bulkDeleteIds !== null}
        onOpenChange={(open) => {
          if (!open) setBulkDeleteIds(null);
        }}
        tone="destructive"
        title="حذف گروهی اعلان‌ها"
        description={
          bulkDeleteIds
            ? `${formatNumber(bulkDeleteIds.length)} اعلان انتخاب‌شده حذف می‌شوند.`
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
        description={conflictMessage ?? "این اعلان قابل حذف نیست."}
        confirmLabel="متوجه شدم"
        cancelLabel="بستن"
        onConfirm={() => setConflictMessage(null)}
      />
    </PageContainer>
  );
}
