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
import type { Country, PublicationStatus } from "@/contracts/content";
import { useDeleteCountry } from "@/features/content/mutations";
import { useCountries } from "@/features/content/queries";
import { getApiErrorMessage, isApiError } from "@/lib/api";
import { CONTINENT_OPTIONS, COST_BAND_OPTIONS } from "@/lib/continents";
import { formatNumber } from "@/lib/format";
import { countryColumns } from "./country-columns";
import {
  countryFilterParsers,
  toCountryListQuery,
} from "./country-table-params";

const STATUS_FILTER_OPTIONS = [
  { value: "draft", label: "پیش‌نویس" },
  { value: "published", label: "منتشرشده" },
  { value: "scheduled", label: "زمان‌بندی‌شده" },
] as const;

/**
 * `/admin/content/countries` — list, search, filter, delete.
 * Create / edit open full-page forms (`/new`, `/[id]/edit`) via the CMS kit.
 */
export function CountriesManager() {
  const router = useRouter();
  const table = useTableUrlState(countryFilterParsers);
  const { params, filters, setFilters } = table;

  const query = useCountries(toCountryListQuery(params, filters));
  const deleteCountry = useDeleteCountry();

  const [deleting, setDeleting] = useState<Country | null>(null);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const [bulkDeleteIds, setBulkDeleteIds] = useState<string[] | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [clearSelection, setClearSelection] = useState<(() => void) | null>(
    null,
  );

  const openCreate = useCallback(() => {
    router.push("/admin/content/countries/new");
  }, [router]);

  const openEdit = useCallback(
    (country: Country) => {
      router.push(`/admin/content/countries/${country.id}/edit`);
    },
    [router],
  );

  function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    deleteCountry.mutate(target.id, {
      onSuccess: () => {
        toast.success(`کشور «${target.nameFa}» حذف شد.`);
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
      bulkDeleteIds.map((id) => deleteCountry.mutateAsync(id)),
    );
    setIsBulkDeleting(false);

    const failed = results.filter(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );
    const deletedCount = results.length - failed.length;
    if (deletedCount > 0) {
      toast.success(`${formatNumber(deletedCount)} کشور حذف شد.`);
    }
    if (failed.length > 0) {
      toast.error(
        `${formatNumber(failed.length)} مورد حذف نشد: ${getApiErrorMessage(failed[0]?.reason)}`,
      );
    }
    clearSelection?.();
    setBulkDeleteIds(null);
  }

  const data = query.data;

  return (
    <PageContainer>
      <PageHeader
        title="کشورها"
        description="مدیریت صفحه کشورها و اطلاعات مقصدهای تحصیلی."
        actions={
          <Can permission="content:write">
            <Button type="button" onClick={openCreate}>
              <Plus data-icon="inline-start" aria-hidden />
              افزودن کشور
            </Button>
          </Can>
        }
      />

      <DataTable
        caption="فهرست کشورها"
        columns={countryColumns}
        data={data?.items}
        pagination={data?.pagination}
        getRowId={(country) => country.id}
        controller={table}
        isLoading={query.isPending}
        isFetching={query.isFetching}
        error={query.error}
        onRetry={() => void query.refetch()}
        searchPlaceholder="جستجوی نام، اسلاگ یا زبان…"
        selectable
        filters={
          <>
            <SelectFilter
              label="قاره"
              value={filters.continent}
              options={CONTINENT_OPTIONS}
              onChange={(continent) =>
                setFilters({
                  continent: continent as Country["continent"] | null,
                })
              }
            />
            <SelectFilter
              label="سطح هزینه"
              value={filters.costBand}
              options={COST_BAND_OPTIONS}
              onChange={(costBand) =>
                setFilters({ costBand: costBand as Country["costBand"] | null })
              }
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
        rowActions={(country) => (
          <Can permission={["content:write", "content:delete"]} mode="any">
            <RowActionsMenu label={`عملیات ${country.nameFa}`}>
              <Can permission="content:write">
                <DropdownMenuItem onSelect={() => openEdit(country)}>
                  <Pencil aria-hidden />
                  ویرایش
                </DropdownMenuItem>
              </Can>
              <Can permission="content:delete">
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setDeleting(country)}
                >
                  <Trash2 aria-hidden />
                  حذف
                </DropdownMenuItem>
              </Can>
            </RowActionsMenu>
          </Can>
        )}
        emptyState={{
          title: "هنوز کشوری ثبت نشده است",
          description: "اولین کشور مقصد را اضافه کنید.",
          action: (
            <Can permission="content:write">
              <Button type="button" onClick={openCreate}>
                <Plus data-icon="inline-start" aria-hidden />
                افزودن کشور
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
        title="حذف کشور"
        description={
          deleting
            ? `کشور «${deleting.nameFa}» برای همیشه حذف می‌شود. این کار قابل بازگشت نیست.`
            : undefined
        }
        confirmLabel="حذف کشور"
        isPending={deleteCountry.isPending}
        onConfirm={confirmDelete}
      />

      <ConfirmDialog
        open={bulkDeleteIds !== null}
        onOpenChange={(open) => {
          if (!open) setBulkDeleteIds(null);
        }}
        tone="destructive"
        title="حذف گروهی کشورها"
        description={
          bulkDeleteIds
            ? `${formatNumber(bulkDeleteIds.length)} کشور انتخاب‌شده حذف می‌شوند. کشورهایی که به دانشگاه یا برنامه وابسته‌اند حذف نخواهند شد.`
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
          "این کشور به دانشگاه یا برنامه تحصیلی وابسته است و قابل حذف نیست."
        }
        confirmLabel="متوجه شدم"
        cancelLabel="بستن"
        onConfirm={() => setConflictMessage(null)}
      />
    </PageContainer>
  );
}
