"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  ContentListEmpty,
  ContentListError,
  ContentListRow,
  ContentListToolbar,
  REORDER_LIST_PAGE_SIZE,
  useReorderGuard,
} from "@/components/admin/content/content-list-parts";
import { ReorderableListPanel } from "@/components/admin/content/reorderable-list-panel";
import {
  DeleteEntityDialogs,
  useDeleteFlow,
} from "@/components/admin/content/use-delete-flow";
import { SelectFilter } from "@/components/admin/data-table/filters";
import { useTableUrlState } from "@/components/admin/data-table/use-table-url-state";
import { StatusBadge, type StatusMap } from "@/components/admin/status-badge";
import { PageContainer } from "@/components/panel/page-container";
import { PageHeader } from "@/components/panel/page-header";
import { Can } from "@/components/rbac/can";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Consultant } from "@/contracts/content";
import {
  useDeleteConsultant,
  useReorderConsultants,
  useUpdateConsultant,
} from "@/features/content/mutations";
import { useConsultants, useCountries } from "@/features/content/queries";
import { getApiErrorMessage } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import {
  consultantFilterParsers,
  toConsultantListQuery,
} from "./consultants-table-params";

const LIST_HREF = "/admin/content/consultants";

const ACTIVE_OPTIONS = [
  { value: "true", label: "فعال" },
  { value: "false", label: "غیرفعال" },
] as const;

const TEAM_STATUS_MAP: StatusMap = {
  team: { label: "نمایش در تیم", tone: "info" },
};

const deleteSuccessMessage = (consultant: Consultant) =>
  `مشاور «${consultant.name}» حذف شد.`;

/**
 * `/admin/content/consultants` — search, country / language / active filters,
 * drag & drop order. A consultant with dependents cannot be deleted (409);
 * the conflict dialog offers soft deactivation instead.
 */
export function ConsultantsManager() {
  const router = useRouter();
  const table = useTableUrlState(consultantFilterParsers);
  const { filters, setFilters } = table;
  const query = useConsultants(toConsultantListQuery(table.params, filters));
  // Unfiltered list: source of the language filter options
  const allQuery = useConsultants({
    page: 1,
    pageSize: REORDER_LIST_PAGE_SIZE,
    sort: "order",
    order: "asc",
  });
  const countriesQuery = useCountries({
    pageSize: 100,
    sort: "nameFa",
    order: "asc",
  });
  const reorder = useReorderConsultants();
  const updateConsultant = useUpdateConsultant();
  const deleteFlow = useDeleteFlow<Consultant>({
    mutation: useDeleteConsultant(),
    successMessage: deleteSuccessMessage,
  });

  const countryOptions = useMemo(
    () =>
      (countriesQuery.data?.items ?? []).map((country) => ({
        value: country.slug,
        label: country.nameFa,
      })),
    [countriesQuery.data?.items],
  );
  const countryNames = useMemo(
    () => new Map(countryOptions.map((option) => [option.value, option.label])),
    [countryOptions],
  );
  const languageOptions = useMemo(() => {
    const languages = new Set<string>();
    for (const consultant of allQuery.data?.items ?? []) {
      for (const language of consultant.languages) languages.add(language);
    }
    return [...languages].map((language) => ({
      value: language,
      label: language,
    }));
  }, [allQuery.data?.items]);

  const data = query.data;
  const guard = useReorderGuard(table.hasActiveFilters, data?.pagination.total);
  const openCreate = () => router.push(`${LIST_HREF}/new`);
  const createButton = (
    <Can permission="content:write">
      <Button type="button" onClick={openCreate}>
        <Plus data-icon="inline-start" aria-hidden />
        افزودن مشاور
      </Button>
    </Can>
  );

  async function deactivate(consultant: Consultant) {
    try {
      await updateConsultant.mutateAsync({
        id: consultant.id,
        body: { active: false, showOnTeamPage: false },
      });
      toast.success(`مشاور «${consultant.name}» غیرفعال شد.`);
      deleteFlow.closeConflict();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="مشاوران"
        description="مدیریت مشاوران، کشورهای تحت پوشش و ترتیب نمایش در صفحه تیم."
        actions={createButton}
      />

      <ContentListToolbar
        controller={table}
        searchPlaceholder="جستجوی نام، سمت یا بیوگرافی…"
        isFetching={query.isFetching && !query.isPending}
        filters={
          <>
            <SelectFilter
              label="کشور"
              value={filters.country}
              options={countryOptions}
              onChange={(country) => setFilters({ country })}
            />
            <SelectFilter
              label="زبان"
              value={filters.language}
              options={languageOptions}
              onChange={(language) => setFilters({ language })}
            />
            <SelectFilter
              label="وضعیت"
              value={filters.active === null ? null : String(filters.active)}
              options={ACTIVE_OPTIONS}
              onChange={(active) =>
                setFilters({ active: active === null ? null : active === "true" })
              }
            />
          </>
        }
      />

      {guard.message ? (
        <p className="text-xs text-muted-foreground">{guard.message}</p>
      ) : null}

      {query.error && !data ? (
        <ContentListError
          error={query.error}
          onRetry={() => void query.refetch()}
        />
      ) : (
        <ReorderableListPanel
          items={data?.items}
          label="فهرست مشاوران"
          onSave={reorder.mutateAsync}
          isSaving={reorder.isPending}
          disabled={guard.disabled}
          toolbar={
            data ? (
              <span className="text-sm text-muted-foreground">
                {formatNumber(data.pagination.total)} مشاور
              </span>
            ) : null
          }
          emptyState={
            <ContentListEmpty
              title="هنوز مشاوری ثبت نشده است"
              description="اولین مشاور را اضافه کنید."
              hasActiveFilters={table.hasActiveFilters}
              onClearFilters={table.clearFilters}
              action={createButton}
            />
          }
          renderItem={(consultant, { dragHandle, isDragging }) => (
            <ContentListRow
              dragHandle={dragHandle}
              isDragging={isDragging}
              leading={
                <Avatar size="lg">
                  <AvatarImage src={consultant.photo} alt="" />
                  <AvatarFallback>{consultant.name.slice(0, 1)}</AvatarFallback>
                </Avatar>
              }
              title={consultant.name}
              subtitle={[
                consultant.role,
                consultant.countries
                  .map((slug) => countryNames.get(slug) ?? slug)
                  .join("، "),
              ]
                .filter(Boolean)
                .join(" · ")}
              badges={
                <>
                  <StatusBadge
                    status={consultant.active ? "active" : "inactive"}
                  />
                  {consultant.showOnTeamPage ? (
                    <StatusBadge status="team" map={TEAM_STATUS_MAP} />
                  ) : null}
                </>
              }
              onEdit={() => router.push(`${LIST_HREF}/${consultant.id}/edit`)}
              onDelete={() => deleteFlow.request(consultant)}
            />
          )}
        />
      )}

      <DeleteEntityDialogs
        flow={deleteFlow}
        title="حذف مشاور"
        confirmLabel="حذف مشاور"
        describe={(consultant) =>
          `مشاور «${consultant.name}» برای همیشه حذف می‌شود.`
        }
        conflictAction={{
          label: "غیرفعال‌سازی",
          isPending: updateConsultant.isPending,
          onConfirm: deactivate,
        }}
      />
    </PageContainer>
  );
}
