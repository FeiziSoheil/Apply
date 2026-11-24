"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { DataTable } from "@/components/admin/data-table/data-table";
import {
  ComboboxFilter,
  SelectFilter,
} from "@/components/admin/data-table/filters";
import { RowActionsMenu } from "@/components/admin/data-table/row-actions-menu";
import { useTableUrlState } from "@/components/admin/data-table/use-table-url-state";
import { PageContainer } from "@/components/panel/page-container";
import { PageHeader } from "@/components/panel/page-header";
import { Can } from "@/components/rbac/can";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import type { PublicationStatus, University } from "@/contracts/content";
import { useDeleteUniversity } from "@/features/content/mutations";
import { useCountries, useUniversities } from "@/features/content/queries";
import { getApiErrorMessage, isApiError } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { universityColumns } from "./university-columns";
import {
  universityFilterParsers,
  toUniversityListQuery,
} from "./university-table-params";

const STATUS_FILTER_OPTIONS = [
  { value: "draft", label: "پیش‌نویس" },
  { value: "published", label: "منتشرشده" },
  { value: "scheduled", label: "زمان‌بندی‌شده" },
] as const;

/**
 * `/admin/content/universities` — list, search, filter, delete.
 */
export function UniversitiesManager() {
  const router = useRouter();
  const table = useTableUrlState(universityFilterParsers);
  const { params, filters, setFilters } = table;

  const query = useUniversities(toUniversityListQuery(params, filters));
  const countriesQuery = useCountries({
    pageSize: 100,
    sort: "nameFa",
    order: "asc",
  });
  const deleteUniversity = useDeleteUniversity();

  const countryOptions = useMemo(
    () =>
      (countriesQuery.data?.items ?? []).map((country) => ({
        value: country.slug,
        label: country.nameFa,
      })),
    [countriesQuery.data?.items],
  );

  const [deleting, setDeleting] = useState<University | null>(null);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const [bulkDeleteIds, setBulkDeleteIds] = useState<string[] | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [clearSelection, setClearSelection] = useState<(() => void) | null>(
    null,
  );

  const openCreate = useCallback(() => {
    router.push("/admin/content/universities/new");
  }, [router]);

  const openEdit = useCallback(
    (university: University) => {
      router.push(`/admin/content/universities/${university.id}/edit`);
    },
    [router],
  );

  function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    deleteUniversity.mutate(target.id, {
      onSuccess: () => {
        toast.success(`دانشگاه «${target.nameFa}» حذف شد.`);
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
      bulkDeleteIds.map((id) => deleteUniversity.mutateAsync(id)),
    );
    setIsBulkDeleting(false);

    const failed = results.filter(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );
    const deletedCount = results.length - failed.length;
    if (deletedCount > 0) {
      toast.success(`${formatNumber(deletedCount)} دانشگاه حذف شد.`);
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

  const data = query.data;

  return (
    <PageContainer>
      <PageHeader
        title="دانشگاه‌ها"
        description="مدیریت دانشگاه‌ها، رتبه‌ها و شرایط پذیرش."
        actions={
          <Can permission="content:write">
            <Button type="button" onClick={openCreate}>
              <Plus data-icon="inline-start" aria-hidden />
              افزودن دانشگاه
            </Button>
          </Can>
        }
      />

      <DataTable
        caption="فهرست دانشگاه‌ها"
        columns={universityColumns}
        data={data?.items}
        pagination={data?.pagination}
        getRowId={(university) => university.id}
        controller={table}
        isLoading={query.isPending}
        isFetching={query.isFetching}
        error={query.error}
        onRetry={() => void query.refetch()}
        searchPlaceholder="جستجوی نام، اسلاگ یا شهر…"
        selectable
        filters={
          <>
            <ComboboxFilter
              label="کشور"
              value={filters.country}
              options={countryOptions}
              isLoading={countriesQuery.isPending}
              onChange={(country) => setFilters({ country })}
            />
            <SelectFilter
              label="وضعیت انتشار"
              value={filters.status}
              options={STATUS_FILTER_OPTIONS}
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
        rowActions={(university) => (
          <Can permission={["content:write", "content:delete"]} mode="any">
            <RowActionsMenu label={`عملیات ${university.nameFa}`}>
              <Can permission="content:write">
                <DropdownMenuItem onSelect={() => openEdit(university)}>
                  <Pencil aria-hidden />
                  ویرایش
                </DropdownMenuItem>
              </Can>
              <Can permission="content:delete">
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setDeleting(university)}
                >
                  <Trash2 aria-hidden />
                  حذف
                </DropdownMenuItem>
              </Can>
            </RowActionsMenu>
          </Can>
        )}
        emptyState={{
          title: "هنوز دانشگاهی ثبت نشده است",
          description: "اولین دانشگاه را اضافه کنید.",
          action: (
            <Can permission="content:write">
              <Button type="button" onClick={openCreate}>
                <Plus data-icon="inline-start" aria-hidden />
                افزودن دانشگاه
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
        title="حذف دانشگاه"
        description={
          deleting
            ? `دانشگاه «${deleting.nameFa}» برای همیشه حذف می‌شود. این کار قابل بازگشت نیست.`
            : undefined
        }
        confirmLabel="حذف دانشگاه"
        isPending={deleteUniversity.isPending}
        onConfirm={confirmDelete}
      />

      <ConfirmDialog
        open={bulkDeleteIds !== null}
        onOpenChange={(open) => {
          if (!open) setBulkDeleteIds(null);
        }}
        tone="destructive"
        title="حذف گروهی دانشگاه‌ها"
        description={
          bulkDeleteIds
            ? `${formatNumber(bulkDeleteIds.length)} دانشگاه انتخاب‌شده حذف می‌شوند. دانشگاه‌هایی که برنامه دارند حذف نخواهند شد.`
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
        description={
          conflictMessage ??
          "این دانشگاه برنامه تحصیلی دارد و قابل حذف نیست."
        }
        confirmLabel="متوجه شدم"
        cancelLabel="بستن"
        onConfirm={() => setConflictMessage(null)}
      />
    </PageContainer>
  );
}
