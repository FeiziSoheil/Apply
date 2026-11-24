"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, FileEdit, Pencil, Plus, Send, Trash2 } from "lucide-react";
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
import type {
  DegreeLevel,
  Program,
  PublicationStatus,
} from "@/contracts/content";
import {
  useCreateProgram,
  useDeleteProgram,
  useUpdateProgram,
} from "@/features/content/mutations";
import {
  useCountries,
  usePrograms,
  useUniversities,
} from "@/features/content/queries";
import { getApiErrorMessage } from "@/lib/api";
import { DEGREE_LEVEL_LABELS, DEGREE_LEVELS } from "@/lib/degree-levels";
import { formatNumber } from "@/lib/format";
import { toProgramPayload, programToFormValues } from "@/lib/validations/program";
import { programColumns } from "./program-columns";
import {
  programFilterParsers,
  toProgramListQuery,
} from "./program-table-params";

const STATUS_FILTER_OPTIONS = [
  { value: "draft", label: "پیش‌نویس" },
  { value: "published", label: "منتشرشده" },
  { value: "scheduled", label: "زمان‌بندی‌شده" },
] as const;

const SCHOLARSHIP_FILTER_OPTIONS = [
  { value: "true", label: "دارای بورسیه" },
  { value: "false", label: "بدون بورسیه" },
] as const;

const DEGREE_FILTER_OPTIONS = DEGREE_LEVELS.map((level) => ({
  value: level,
  label: DEGREE_LEVEL_LABELS[level],
}));

/**
 * `/admin/content/programs` — list, filters, bulk publish/draft/delete/copy.
 */
export function ProgramsManager() {
  const router = useRouter();
  const table = useTableUrlState(programFilterParsers);
  const { params, filters, setFilters } = table;

  const query = usePrograms(toProgramListQuery(params, filters));
  const countriesQuery = useCountries({
    pageSize: 100,
    sort: "nameFa",
    order: "asc",
  });
  const universitiesQuery = useUniversities({
    pageSize: 100,
    sort: "nameFa",
    order: "asc",
    country: filters.country || undefined,
  });

  const deleteProgram = useDeleteProgram();
  const updateProgram = useUpdateProgram();
  const createProgram = useCreateProgram();

  const countryOptions = useMemo(
    () =>
      (countriesQuery.data?.items ?? []).map((country) => ({
        value: country.slug,
        label: country.nameFa,
      })),
    [countriesQuery.data?.items],
  );

  const universityOptions = useMemo(
    () =>
      (universitiesQuery.data?.items ?? []).map((university) => ({
        value: university.slug,
        label: university.nameFa,
      })),
    [universitiesQuery.data?.items],
  );

  const fieldsQuery = usePrograms({ pageSize: 100, sort: "nameFa", order: "asc" });
  const fieldOptions = useMemo(() => {
    const unique = new Set(
      (fieldsQuery.data?.items ?? []).map((program) => program.field),
    );
    return [...unique]
      .sort((a, b) => a.localeCompare(b, "fa"))
      .map((field) => ({ value: field, label: field }));
  }, [fieldsQuery.data?.items]);

  const [deleting, setDeleting] = useState<Program | null>(null);
  const [bulkDeleteIds, setBulkDeleteIds] = useState<string[] | null>(null);
  const [isBulkWorking, setIsBulkWorking] = useState(false);
  const [clearSelection, setClearSelection] = useState<(() => void) | null>(
    null,
  );

  const openCreate = useCallback(() => {
    router.push("/admin/content/programs/new");
  }, [router]);

  const openEdit = useCallback(
    (program: Program) => {
      router.push(`/admin/content/programs/${program.id}/edit`);
    },
    [router],
  );

  function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    deleteProgram.mutate(target.id, {
      onSuccess: () => {
        toast.success(`برنامه «${target.nameFa}» حذف شد.`);
        setDeleting(null);
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error));
      },
    });
  }

  async function runBulkStatus(
    ids: string[],
    status: PublicationStatus,
    label: string,
  ) {
    setIsBulkWorking(true);
    const results = await Promise.allSettled(
      ids.map((id) => updateProgram.mutateAsync({ id, body: { status } })),
    );
    setIsBulkWorking(false);
    const failed = results.filter((r) => r.status === "rejected").length;
    const ok = results.length - failed;
    if (ok > 0) toast.success(`${formatNumber(ok)} برنامه ${label}.`);
    if (failed > 0) {
      toast.error(`${formatNumber(failed)} مورد به‌روز نشد.`);
    }
    clearSelection?.();
  }

  async function confirmBulkDelete() {
    if (!bulkDeleteIds) return;
    setIsBulkWorking(true);
    const results = await Promise.allSettled(
      bulkDeleteIds.map((id) => deleteProgram.mutateAsync(id)),
    );
    setIsBulkWorking(false);
    const failed = results.filter((r) => r.status === "rejected").length;
    const ok = results.length - failed;
    if (ok > 0) toast.success(`${formatNumber(ok)} برنامه حذف شد.`);
    if (failed > 0) {
      toast.error(
        `${formatNumber(failed)} مورد حذف نشد: ${getApiErrorMessage(
          (results.find((r) => r.status === "rejected") as PromiseRejectedResult)
            ?.reason,
        )}`,
      );
    }
    clearSelection?.();
    setBulkDeleteIds(null);
  }

  async function copyProgram(program: Program) {
    const values = programToFormValues(program);
    const payload = toProgramPayload({
      ...values,
      nameFa: `${values.nameFa} (کپی)`,
      slug: `${values.slug}-copy-${Date.now().toString(36).slice(-4)}`,
      status: "draft",
      scheduledAt: "",
    });
    try {
      const created = await createProgram.mutateAsync(payload);
      toast.success("کپی برنامه به‌صورت پیش‌نویس ایجاد شد.");
      router.push(`/admin/content/programs/${created.id}/edit`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function bulkCopy(ids: string[]) {
    const items = query.data?.items ?? [];
    const targets = items.filter((item) => ids.includes(item.id));
    if (targets.length === 0) {
      toast.error("برنامه انتخاب‌شده در صفحهٔ فعلی نیست.");
      return;
    }
    setIsBulkWorking(true);
    let ok = 0;
    for (const program of targets) {
      try {
        const values = programToFormValues(program);
        await createProgram.mutateAsync(
          toProgramPayload({
            ...values,
            nameFa: `${values.nameFa} (کپی)`,
            slug: `${values.slug}-copy-${Date.now().toString(36).slice(-4)}`,
            status: "draft",
            scheduledAt: "",
          }),
        );
        ok += 1;
      } catch {
        /* counted below */
      }
    }
    setIsBulkWorking(false);
    if (ok > 0) toast.success(`${formatNumber(ok)} کپی به‌صورت پیش‌نویس ایجاد شد.`);
    if (ok < targets.length) {
      toast.error(`${formatNumber(targets.length - ok)} کپی ناموفق بود.`);
    }
    clearSelection?.();
  }

  const data = query.data;

  return (
    <PageContainer>
      <PageHeader
        title="برنامه‌های تحصیلی"
        description="مدیریت برنامه‌ها، شهریه، شرایط زبان و ددلاین‌ها."
        actions={
          <Can permission="content:write">
            <Button type="button" onClick={openCreate}>
              <Plus data-icon="inline-start" aria-hidden />
              افزودن برنامه
            </Button>
          </Can>
        }
      />

      <DataTable
        caption="فهرست برنامه‌ها"
        columns={programColumns}
        data={data?.items}
        pagination={data?.pagination}
        getRowId={(program) => program.id}
        controller={table}
        isLoading={query.isPending}
        isFetching={query.isFetching}
        error={query.error}
        onRetry={() => void query.refetch()}
        searchPlaceholder="جستجوی نام، اسلاگ یا رشته…"
        selectable
        filters={
          <>
            <ComboboxFilter
              label="کشور"
              value={filters.country}
              options={countryOptions}
              isLoading={countriesQuery.isPending}
              onChange={(country) =>
                setFilters({
                  country,
                  university: null,
                })
              }
            />
            <ComboboxFilter
              label="دانشگاه"
              value={filters.university}
              options={universityOptions}
              isLoading={universitiesQuery.isPending}
              onChange={(university) => setFilters({ university })}
            />
            <SelectFilter
              label="مقطع"
              value={filters.degreeLevel}
              options={DEGREE_FILTER_OPTIONS}
              onChange={(degreeLevel) =>
                setFilters({
                  degreeLevel: degreeLevel as DegreeLevel | null,
                })
              }
            />
            <ComboboxFilter
              label="رشته"
              value={filters.field}
              options={fieldOptions}
              isLoading={fieldsQuery.isPending}
              onChange={(field) => setFilters({ field })}
            />
            <SelectFilter
              label="بورسیه"
              value={
                filters.hasScholarship === null
                  ? null
                  : filters.hasScholarship
                    ? "true"
                    : "false"
              }
              options={SCHOLARSHIP_FILTER_OPTIONS}
              onChange={(value) =>
                setFilters({
                  hasScholarship:
                    value === null ? null : value === "true",
                })
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
          <>
            <Can permission="content:write">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isBulkWorking}
                onClick={() => {
                  setClearSelection(() => clear);
                  void runBulkStatus(selectedIds, "published", "منتشر شد");
                }}
              >
                <Send data-icon="inline-start" aria-hidden />
                انتشار
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isBulkWorking}
                onClick={() => {
                  setClearSelection(() => clear);
                  void runBulkStatus(selectedIds, "draft", "پیش‌نویس شد");
                }}
              >
                <FileEdit data-icon="inline-start" aria-hidden />
                پیش‌نویس
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isBulkWorking}
                onClick={() => {
                  setClearSelection(() => clear);
                  void bulkCopy(selectedIds);
                }}
              >
                <Copy data-icon="inline-start" aria-hidden />
                کپی برنامه
              </Button>
            </Can>
            <Can permission="content:delete">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={isBulkWorking}
                onClick={() => {
                  setClearSelection(() => clear);
                  setBulkDeleteIds(selectedIds);
                }}
              >
                <Trash2 data-icon="inline-start" aria-hidden />
                حذف
              </Button>
            </Can>
          </>
        )}
        rowActions={(program) => (
          <Can permission={["content:write", "content:delete"]} mode="any">
            <RowActionsMenu label={`عملیات ${program.nameFa}`}>
              <Can permission="content:write">
                <DropdownMenuItem onSelect={() => openEdit(program)}>
                  <Pencil aria-hidden />
                  ویرایش
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => void copyProgram(program)}>
                  <Copy aria-hidden />
                  کپی
                </DropdownMenuItem>
              </Can>
              <Can permission="content:delete">
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setDeleting(program)}
                >
                  <Trash2 aria-hidden />
                  حذف
                </DropdownMenuItem>
              </Can>
            </RowActionsMenu>
          </Can>
        )}
        emptyState={{
          title: "هنوز برنامه‌ای ثبت نشده است",
          description: "اولین برنامه تحصیلی را اضافه کنید.",
          action: (
            <Can permission="content:write">
              <Button type="button" onClick={openCreate}>
                <Plus data-icon="inline-start" aria-hidden />
                افزودن برنامه
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
        title="حذف برنامه"
        description={
          deleting
            ? `برنامه «${deleting.nameFa}» برای همیشه حذف می‌شود.`
            : undefined
        }
        confirmLabel="حذف برنامه"
        isPending={deleteProgram.isPending}
        onConfirm={confirmDelete}
      />

      <ConfirmDialog
        open={bulkDeleteIds !== null}
        onOpenChange={(open) => {
          if (!open) setBulkDeleteIds(null);
        }}
        tone="destructive"
        title="حذف گروهی برنامه‌ها"
        description={
          bulkDeleteIds
            ? `${formatNumber(bulkDeleteIds.length)} برنامه انتخاب‌شده حذف می‌شوند.`
            : undefined
        }
        confirmLabel="حذف همه"
        isPending={isBulkWorking}
        onConfirm={confirmBulkDelete}
      />
    </PageContainer>
  );
}
