"use client";

import { useMemo } from "react";
import { useSession } from "@/components/auth/auth-provider";
import { DataTable } from "@/components/admin/data-table/data-table";
import { SelectFilter } from "@/components/admin/data-table/filters";
import { useTableUrlState } from "@/components/admin/data-table/use-table-url-state";
import { PageContainer } from "@/components/panel/page-container";
import { PageHeader } from "@/components/panel/page-header";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { SavedView } from "@/contracts/crm";
import type { CaseStage, CaseStatus } from "@/contracts/students";
import { useCountries } from "@/features/content/queries";
import { useCases } from "@/features/students/queries";
import { useStaffUsers } from "@/features/users/queries";
import { caseColumns } from "./case-columns";
import {
  CASE_STAGE_FILTER_OPTIONS,
  CASE_STATUS_FILTER_OPTIONS,
} from "./case-labels";
import { CasesSavedViews } from "./cases-saved-views";
import {
  SYSTEM_CASE_VIEWS,
  caseFilterParsers,
  toCaseListQuery,
  type CaseFilters,
} from "./cases-table-params";

export function CasesManager() {
  const { user } = useSession();
  const table = useTableUrlState(caseFilterParsers);
  const { params, filters, setFilters } = table;
  const query = useCases(toCaseListQuery(params, filters));

  const countriesQuery = useCountries({
    page: 1,
    pageSize: 100,
    sort: "nameFa",
    order: "asc",
  });
  const consultantsQuery = useStaffUsers({
    page: 1,
    pageSize: 100,
    role: "consultant",
    status: "active",
  });

  const countryOptions = useMemo(
    () =>
      (countriesQuery.data?.items ?? []).map((country) => ({
        value: country.slug,
        label: country.nameFa,
      })),
    [countriesQuery.data?.items],
  );

  const consultantOptions = useMemo(
    () =>
      (consultantsQuery.data?.items ?? []).map((consultant) => ({
        value: consultant.id,
        label: consultant.name,
      })),
    [consultantsQuery.data?.items],
  );

  function clearViewFilters() {
    setFilters({
      status: null,
      stage: null,
      country: null,
      consultantId: null,
      docsPendingReview: null,
      deadlineWithinDays: null,
      noActivity: null,
      viewId: null,
    });
  }

  function applySystemView(id: string) {
    const view = SYSTEM_CASE_VIEWS.find((entry) => entry.id === id);
    if (!view) return;
    setFilters({
      status: null,
      stage: null,
      country: null,
      consultantId: null,
      docsPendingReview: null,
      deadlineWithinDays: null,
      noActivity: null,
      viewId: id,
      ...view.patch,
    } as Partial<CaseFilters> & { viewId: string });
  }

  function applySavedView(view: SavedView) {
    const f = view.filters;
    setFilters({
      status: (typeof f.status === "string" ? f.status : null) as CaseStatus | null,
      stage: (typeof f.stage === "string" ? f.stage : null) as CaseStage | null,
      country: typeof f.country === "string" ? f.country : null,
      consultantId: typeof f.consultantId === "string" ? f.consultantId : null,
      docsPendingReview:
        typeof f.docsPendingReview === "boolean" ? f.docsPendingReview : null,
      deadlineWithinDays:
        typeof f.deadlineWithinDays === "number" ? f.deadlineWithinDays : null,
      noActivity: typeof f.noActivity === "boolean" ? f.noActivity : null,
      viewId: view.id,
    });
  }

  return (
    <PageContainer>
      <PageHeader
        title="پرونده‌ها"
        description="مراحل پرونده، چک‌لیست و مدارک؛ مشاور فقط پرونده‌های اختصاص‌یافته را می‌بیند."
      />

      <CasesSavedViews
        currentUserId={user?.id ?? ""}
        activeViewId={filters.viewId}
        filters={filters}
        sort={params.sort}
        onApplySystem={applySystemView}
        onApplySaved={applySavedView}
        onClearView={clearViewFilters}
      />

      <DataTable
        caption="فهرست پرونده‌ها"
        columns={caseColumns}
        data={query.data?.items}
        pagination={query.data?.pagination}
        getRowId={(item) => item.id}
        controller={table}
        isLoading={query.isPending}
        isFetching={query.isFetching}
        error={query.error}
        onRetry={() => void query.refetch()}
        searchPlaceholder="جستجوی کد یا نام دانشجو…"
        emptyState={{
          title: "پرونده‌ای یافت نشد",
          description: "با تبدیل لید برنده یا ثبت پرونده جدید شروع کنید.",
        }}
        filters={
          <>
            <SelectFilter
              label="وضعیت"
              value={filters.status}
              options={CASE_STATUS_FILTER_OPTIONS}
              onChange={(status) =>
                setFilters({ status: status as CaseStatus | null, viewId: null })
              }
            />
            <SelectFilter
              label="مرحله"
              value={filters.stage}
              options={CASE_STAGE_FILTER_OPTIONS}
              onChange={(stage) =>
                setFilters({ stage: stage as CaseStage | null, viewId: null })
              }
            />
            <SelectFilter
              label="کشور"
              value={filters.country}
              options={countryOptions}
              onChange={(country) => setFilters({ country, viewId: null })}
            />
            {user?.role === "admin" ? (
              <SelectFilter
                label="مسئول"
                value={filters.consultantId}
                options={consultantOptions}
                onChange={(consultantId) =>
                  setFilters({ consultantId, viewId: null })
                }
              />
            ) : null}
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={Boolean(filters.docsPendingReview)}
                onCheckedChange={(checked) =>
                  setFilters({
                    docsPendingReview: checked || null,
                    viewId: null,
                  })
                }
              />
              <Label className="font-normal">مدارک در انتظار بررسی</Label>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={filters.deadlineWithinDays === 7}
                onCheckedChange={(checked) =>
                  setFilters({
                    deadlineWithinDays: checked ? 7 : null,
                    viewId: null,
                  })
                }
              />
              <Label className="font-normal">ددلاین ۷ روز آینده</Label>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={Boolean(filters.noActivity)}
                onCheckedChange={(checked) =>
                  setFilters({ noActivity: checked || null, viewId: null })
                }
              />
              <Label className="font-normal">بدون فعالیت</Label>
            </label>
          </>
        }
      />
    </PageContainer>
  );
}
