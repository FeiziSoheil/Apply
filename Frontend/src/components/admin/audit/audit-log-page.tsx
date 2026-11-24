"use client";

import { useMemo, useState } from "react";
import { Download, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/admin/data-table/data-table";
import {
  DateRangeFilter,
  SelectFilter,
} from "@/components/admin/data-table/filters";
import { RowActionsMenu } from "@/components/admin/data-table/row-actions-menu";
import { useTableUrlState } from "@/components/admin/data-table/use-table-url-state";
import { AdminSideDrawer } from "@/components/admin/admin-side-drawer";
import { PageContainer } from "@/components/panel/page-container";
import { PageHeader } from "@/components/panel/page-header";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import type { AuditAction, AuditLog } from "@/contracts/crm";
import { auditApi } from "@/features/audit/api";
import { useAuditLogs } from "@/features/audit/queries";
import { useStaffUsers } from "@/features/users/queries";
import { getApiErrorMessage } from "@/lib/api";
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ACTION_OPTIONS,
  AUDIT_ENTITY_TYPE_LABELS,
} from "@/lib/crm/audit-labels";
import { formatJalaliDate } from "@/lib/format";
import { AuditDiffView } from "./audit-diff-view";
import { createAuditColumns } from "./audit-columns";
import {
  auditFilterParsers,
  toAuditListQuery,
} from "./audit-table-params";

const ENTITY_TYPE_OPTIONS = Object.entries(AUDIT_ENTITY_TYPE_LABELS).map(
  ([value, label]) => ({ value, label }),
);

/**
 * `/admin/settings/audit` — read-only audit log list with filters and CSV export.
 */
export function AuditLogPage() {
  const table = useTableUrlState(auditFilterParsers);
  const { params, filters, setFilters } = table;
  const [selected, setSelected] = useState<AuditLog | null>(null);
  const [exporting, setExporting] = useState(false);

  const listFilters = useMemo(
    () => toAuditListQuery(params, filters),
    [params, filters],
  );

  const staffQuery = useStaffUsers({
    page: 1,
    pageSize: 100,
    sort: "name",
    order: "asc",
  });
  const listQuery = useAuditLogs(listFilters);

  const usersById = useMemo(() => {
    const map = new Map<string, string>();
    for (const user of staffQuery.data?.items ?? []) {
      map.set(user.id, user.name);
    }
    return map;
  }, [staffQuery.data?.items]);

  const columns = useMemo(
    () => createAuditColumns(usersById),
    [usersById],
  );

  const actorOptions = useMemo(
    () =>
      (staffQuery.data?.items ?? []).map((user) => ({
        value: user.id,
        label: user.name,
      })),
    [staffQuery.data?.items],
  );

  async function handleExport() {
    setExporting(true);
    try {
      const csv = await auditApi.exportCsv({
        ...listFilters,
        page: 1,
        pageSize: 100,
      });
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `audit-logs-${Date.now()}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("خروجی CSV آماده شد");
      void listQuery.refetch();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setExporting(false);
    }
  }

  const data = listQuery.data;

  return (
    <PageContainer>
      <PageHeader
        title="گزارش حسابرسی"
        description="لاگ‌های تغییر سیستم؛ فقط‌خواندنی. فیلدهای حساس در اختلاف‌ها ذخیره نمی‌شوند."
        actions={
          <Button
            type="button"
            variant="outline"
            disabled={exporting}
            onClick={() => void handleExport()}
          >
            {exporting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Download data-icon="inline-start" />
            )}
            خروجی CSV
          </Button>
        }
      />

      <DataTable
        caption="گزارش حسابرسی"
        columns={columns}
        data={data?.items}
        pagination={data?.pagination}
        getRowId={(log) => log.id}
        controller={table}
        isLoading={listQuery.isPending}
        isFetching={listQuery.isFetching}
        error={listQuery.error}
        onRetry={() => void listQuery.refetch()}
        searchPlaceholder="جستجوی شناسه لاگ یا موجودیت…"
        columnVisibilityKey="admin-audit-columns"
        filters={
          <>
            <SelectFilter
              label="کاربر"
              value={filters.actorId}
              options={actorOptions}
              onChange={(actorId) => setFilters({ actorId })}
            />
            <SelectFilter
              label="عملیات"
              value={filters.action}
              options={AUDIT_ACTION_OPTIONS}
              onChange={(action) =>
                setFilters({ action: action as AuditAction | null })
              }
            />
            <SelectFilter
              label="موجودیت"
              value={filters.entityType}
              options={ENTITY_TYPE_OPTIONS}
              onChange={(entityType) => setFilters({ entityType })}
            />
            <DateRangeFilter
              label="بازه تاریخ"
              value={{ from: filters.from, to: filters.to }}
              onChange={({ from, to }) => setFilters({ from, to })}
            />
          </>
        }
        rowActions={(log) => (
          <RowActionsMenu label="عملیات لاگ">
            <DropdownMenuItem onSelect={() => setSelected(log)}>
              <Eye aria-hidden />
              جزئیات
            </DropdownMenuItem>
          </RowActionsMenu>
        )}
        emptyState={{
          title: "هنوز لاگی ثبت نشده است",
          description: "تغییرات سیستم اینجا نمایش داده می‌شوند.",
        }}
      />

      <AdminSideDrawer
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        title="جزئیات حسابرسی"
        description={
          selected
            ? formatJalaliDate(selected.createdAt, "d MMMM yyyy — HH:mm:ss")
            : undefined
        }
      >
        {selected ? (
          <div className="flex flex-col gap-4 px-4 pb-6">
            <dl className="grid gap-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">عملیات</dt>
                <dd>{AUDIT_ACTION_LABELS[selected.action]}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">موجودیت</dt>
                <dd>
                  {AUDIT_ENTITY_TYPE_LABELS[selected.entityType] ??
                    selected.entityType}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">شناسه</dt>
                <dd className="font-mono text-xs" dir="ltr">
                  {selected.entityId ?? "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">کاربر</dt>
                <dd>
                  {selected.actorId
                    ? (usersById.get(selected.actorId) ?? selected.actorId)
                    : "سیستم"}
                </dd>
              </div>
            </dl>
            <div>
              <h3 className="mb-2 text-sm font-medium">اختلاف قبل / بعد</h3>
              <AuditDiffView diff={selected.diff} />
            </div>
          </div>
        ) : null}
      </AdminSideDrawer>
    </PageContainer>
  );
}
