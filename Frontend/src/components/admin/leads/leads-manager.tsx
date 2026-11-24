"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Columns3,
  Download,
  Eye,
  LayoutGrid,
  List,
  Plus,
  Tag,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/components/auth/auth-provider";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { DataTable } from "@/components/admin/data-table/data-table";
import {
  ComboboxFilter,
  DateRangeFilter,
  MultiSelectFilter,
  SelectFilter,
} from "@/components/admin/data-table/filters";
import { RowActionsMenu } from "@/components/admin/data-table/row-actions-menu";
import { useTableUrlState } from "@/components/admin/data-table/use-table-url-state";
import { PageContainer } from "@/components/panel/page-container";
import { PageHeader } from "@/components/panel/page-header";
import { Can } from "@/components/rbac/can";
import { useCan } from "@/components/rbac/use-can";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SavedView } from "@/contracts/crm";
import type { Lead, LeadPriority, LeadSource } from "@/contracts/leads";
import { useCountries } from "@/features/content/queries";
import {
  useMessageTemplates,
  usePipelineStages,
  useTags,
} from "@/features/crm/queries";
import { useDeleteLead } from "@/features/leads/mutations";
import { useLeads } from "@/features/leads/queries";
import { useStaffUsers } from "@/features/users/queries";
import { useIsMobile } from "@/hooks/use-mobile";
import { getApiErrorMessage } from "@/lib/api";
import { CreateLeadDialog } from "./create-lead-dialog";
import { createLeadColumns } from "./lead-columns";
import { LeadBulkDialogs } from "./lead-bulk-dialogs";
import { LeadExportDialog } from "./lead-export-dialog";
import {
  LEAD_PRIORITY_FILTER_OPTIONS,
  LEAD_SOURCE_FILTER_OPTIONS,
} from "./lead-labels";
import { LeadsKanban } from "./leads-kanban";
import { LeadsSavedViews } from "./leads-saved-views";
import {
  leadFilterParsers,
  SYSTEM_LEAD_VIEWS,
  toLeadListQuery,
  type LeadFilters,
  type LeadViewMode,
} from "./leads-table-params";

const UNASSIGNED_VALUE = "__unassigned__";
const COLUMN_VISIBILITY_KEY = "admin.leads.columnVisibility";

const INACTIVE_DAY_OPTIONS = [
  { value: "3", label: "۳ روز" },
  { value: "7", label: "۷ روز" },
  { value: "14", label: "۱۴ روز" },
  { value: "30", label: "۳۰ روز" },
] as const;

/** Clears list filters while preserving table/kanban mode and open lead drawer */
function emptyLeadFilters(): Partial<LeadFilters> {
  return {
    stageIds: [],
    source: null,
    assignedTo: null,
    unassigned: null,
    country: null,
    tagId: null,
    priority: null,
    utmCampaign: null,
    createdFrom: null,
    createdTo: null,
    inactiveDays: null,
    overdueFollowUp: null,
    viewId: null,
  };
}

function filtersFromSavedView(view: SavedView): Partial<LeadFilters> {
  const raw = view.filters;
  const asString = (key: string): string | null => {
    const value = raw[key];
    return typeof value === "string" ? value : null;
  };
  const asBool = (key: string): boolean | null => {
    const value = raw[key];
    return typeof value === "boolean" ? value : null;
  };
  const asInt = (key: string): number | null => {
    const value = raw[key];
    return typeof value === "number" ? value : null;
  };
  const stageIds = raw.stageIds;
  return {
    stageIds: Array.isArray(stageIds)
      ? stageIds.filter((item): item is string => typeof item === "string")
      : [],
    source: asString("source") as LeadSource | null,
    assignedTo: asString("assignedTo"),
    unassigned: asBool("unassigned"),
    country: asString("country"),
    tagId: asString("tagId"),
    priority: asString("priority") as LeadPriority | null,
    utmCampaign: asString("utmCampaign"),
    createdFrom: asString("createdFrom"),
    createdTo: asString("createdTo"),
    inactiveDays: asInt("inactiveDays"),
    overdueFollowUp: asBool("overdueFollowUp"),
    viewId: view.id,
  };
}

export function LeadsManager() {
  const { user } = useSession();
  const router = useRouter();
  const isMobile = useIsMobile();
  const table = useTableUrlState(leadFilterParsers);
  const { params, filters, setFilters, setSort } = table;
  const listQuery = toLeadListQuery(params, filters);
  const query = useLeads(listQuery, {
    enabled: filters.view === "table",
  });

  const stagesQuery = usePipelineStages();
  const tagsQuery = useTags();
  const templatesQuery = useMessageTemplates();
  const countriesQuery = useCountries({
    page: 1,
    pageSize: 100,
    sort: "nameFa",
    order: "asc",
  });
  const canExport = useCan("lead:export");
  const canImport = useCan("lead:import");
  const consultantsQuery = useStaffUsers({
    page: 1,
    pageSize: 100,
    role: "consultant",
    status: "active",
  });

  const stages = useMemo(
    () =>
      [...(stagesQuery.data ?? [])].sort((a, b) => a.order - b.order),
    [stagesQuery.data],
  );
  const tags = useMemo(() => tagsQuery.data ?? [], [tagsQuery.data]);
  const templates = useMemo(
    () => templatesQuery.data ?? [],
    [templatesQuery.data],
  );

  const consultants = useMemo(
    () =>
      (consultantsQuery.data?.items ?? []).map((item) => ({
        value: item.id,
        label: item.name,
      })),
    [consultantsQuery.data?.items],
  );

  const consultantName = useCallback(
    (id: string | null) => {
      if (!id) return "بدون مسئول";
      return consultants.find((item) => item.value === id)?.label ?? "—";
    },
    [consultants],
  );

  const countryName = useCallback(
    (slug: string) => {
      const country = countriesQuery.data?.items.find(
        (item) => item.slug === slug,
      );
      return country?.nameFa ?? slug;
    },
    [countriesQuery.data?.items],
  );

  const stagesById = useMemo(
    () => new Map(stages.map((stage) => [stage.id, stage])),
    [stages],
  );
  const tagsById = useMemo(
    () => new Map(tags.map((tag) => [tag.id, tag])),
    [tags],
  );

  const tagTitles = useCallback(
    (ids: readonly string[]) =>
      ids.map((id) => tagsById.get(id)?.title ?? "تگ"),
    [tagsById],
  );

  const openLead = useCallback(
    (lead: Lead | string) => {
      const id = typeof lead === "string" ? lead : lead.id;
      router.push(`/admin/leads/${id}`);
    },
    [router],
  );

  const columns = useMemo(
    () =>
      createLeadColumns({
        stagesById,
        tagsById,
        consultantName,
        countryName,
        onOpenLead: openLead,
      }),
    [consultantName, countryName, openLead, stagesById, tagsById],
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);
  const deleteLead = useDeleteLead();
  const [clearSelection, setClearSelection] = useState<(() => void) | null>(
    null,
  );
  const [bulkAssign, setBulkAssign] = useState<string[] | null>(null);
  const [bulkStage, setBulkStage] = useState<string[] | null>(null);
  const [bulkTags, setBulkTags] = useState<{
    ids: string[];
    mode: "add" | "remove";
  } | null>(null);
  const [bulkPriority, setBulkPriority] = useState<string[] | null>(null);
  const [bulkMessage, setBulkMessage] = useState<string[] | null>(null);
  const [bulkDelete, setBulkDelete] = useState<string[] | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const assigneeFilterValue = filters.unassigned
    ? UNASSIGNED_VALUE
    : (filters.assignedTo ?? null);

  const applySystemView = useCallback(
    (id: string) => {
      const view = SYSTEM_LEAD_VIEWS.find((item) => item.id === id);
      if (!view) return;
      const base = emptyLeadFilters();
      if (id === "mine" && user) {
        setFilters({
          ...base,
          assignedTo: user.id,
          unassigned: null,
          viewId: id,
        });
        return;
      }
      setFilters({
        ...base,
        ...view.patch,
        viewId: id,
      });
    },
    [setFilters, user],
  );

  const applySavedView = useCallback(
    (view: SavedView) => {
      setFilters({
        ...emptyLeadFilters(),
        ...filtersFromSavedView(view),
      });
      if (view.sort) {
        setSort(view.sort, "desc");
      }
    },
    [setFilters, setSort],
  );

  const clearView = useCallback(() => {
    setFilters({ ...emptyLeadFilters(), viewId: null });
  }, [setFilters]);

  const kanbanBaseQuery = useMemo(() => {
    const {
      page: pageIgnored,
      pageSize: pageSizeIgnored,
      stageId: stageIdIgnored,
      stageIds: stageIdsIgnored,
      ...rest
    } = listQuery;
    void pageIgnored;
    void pageSizeIgnored;
    void stageIdIgnored;
    void stageIdsIgnored;
    return rest;
  }, [listQuery]);

  const createButton = (
    <Can permission="lead:write">
      <Button type="button" onClick={() => setCreateOpen(true)}>
        <Plus data-icon="inline-start" aria-hidden />
        لید جدید
      </Button>
    </Can>
  );

  return (
    <PageContainer>
      <PageHeader
        title="لیدها"
        description="فهرست و پیگیری سرنخ‌های فروش؛ مشاور فقط لیدهای اختصاص‌یافته به خودش را می‌بیند."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canImport ? (
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/leads/import">
                  <Upload data-icon="inline-start" aria-hidden />
                  ورود از فایل
                </Link>
              </Button>
            ) : null}
            {canExport ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setExportOpen(true)}
              >
                <Download data-icon="inline-start" aria-hidden />
                خروجی
              </Button>
            ) : null}
            {createButton}
          </div>
        }
      />

      <div className="mb-4 flex flex-col gap-3">
        <LeadsSavedViews
          currentUserId={user?.id ?? ""}
          activeViewId={filters.viewId}
          filters={filters}
          sort={params.sort}
          order={params.order}
          onApplySystem={applySystemView}
          onApplySaved={applySavedView}
          onClearView={clearView}
        />

        <Tabs
          value={filters.view}
          onValueChange={(value) =>
            setFilters({ view: value as LeadViewMode })
          }
        >
          <TabsList>
            <TabsTrigger value="table">
              <List data-icon="inline-start" aria-hidden />
              جدول
            </TabsTrigger>
            <TabsTrigger value="kanban">
              <LayoutGrid data-icon="inline-start" aria-hidden />
              کانبان
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filters.view === "kanban" ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <MultiSelectFilter
              label="مرحله"
              value={filters.stageIds}
              options={stages.map((stage) => ({
                value: stage.id,
                label: stage.title,
              }))}
              onChange={(stageIds) => setFilters({ stageIds })}
            />
            <SelectFilter
              label="منبع"
              value={filters.source}
              options={LEAD_SOURCE_FILTER_OPTIONS}
              onChange={(source) =>
                setFilters({ source: source as LeadSource | null })
              }
            />
            {user?.role === "admin" ? (
              <ComboboxFilter
                label="مسئول"
                value={assigneeFilterValue}
                options={[
                  { value: UNASSIGNED_VALUE, label: "بدون مسئول" },
                  ...consultants,
                ]}
                onChange={(value) => {
                  if (value === UNASSIGNED_VALUE) {
                    setFilters({ unassigned: true, assignedTo: null });
                    return;
                  }
                  setFilters({ assignedTo: value, unassigned: null });
                }}
              />
            ) : null}
            <SelectFilter
              label="اولویت"
              value={filters.priority}
              options={LEAD_PRIORITY_FILTER_OPTIONS}
              onChange={(priority) =>
                setFilters({ priority: priority as LeadPriority | null })
              }
            />
          </div>
          {stagesQuery.isPending ? (
            <p className="text-muted-foreground py-12 text-center text-sm">
              در حال بارگذاری کانبان…
            </p>
          ) : stages.length === 0 ? (
            <p className="text-muted-foreground py-12 text-center text-sm">
              مرحله‌ای تعریف نشده است.
            </p>
          ) : (
            <LeadsKanban
              baseQuery={kanbanBaseQuery}
              stages={
                filters.stageIds.length > 0
                  ? stages.filter((stage) =>
                      filters.stageIds.includes(stage.id),
                    )
                  : stages
              }
              consultantName={consultantName}
              countryName={countryName}
              tagTitles={tagTitles}
              onOpenLead={openLead}
              isMobile={isMobile}
            />
          )}
        </div>
      ) : (
        <DataTable
          caption="فهرست لیدها"
          columns={columns}
          data={query.data?.items}
          pagination={query.data?.pagination}
          getRowId={(lead) => lead.id}
          controller={table}
          isLoading={query.isPending}
          isFetching={query.isFetching}
          error={query.error}
          onRetry={() => void query.refetch()}
          searchPlaceholder="جستجوی نام، موبایل یا ایمیل…"
          selectable
          columnVisibilityKey={COLUMN_VISIBILITY_KEY}
          emptyState={{
            title: "لیدی ثبت نشده است",
            description: "با ثبت دستی یا از طریق فرم‌های سایت شروع کنید.",
            action: createButton,
          }}
          filters={
            <>
              <MultiSelectFilter
                label="مرحله"
                value={filters.stageIds}
                options={stages.map((stage) => ({
                  value: stage.id,
                  label: stage.title,
                }))}
                onChange={(stageIds) => setFilters({ stageIds })}
              />
              {user?.role === "admin" ? (
                <ComboboxFilter
                  label="مسئول"
                  value={assigneeFilterValue}
                  options={[
                    { value: UNASSIGNED_VALUE, label: "بدون مسئول" },
                    ...consultants,
                  ]}
                  onChange={(value) => {
                    if (value === UNASSIGNED_VALUE) {
                      setFilters({ unassigned: true, assignedTo: null });
                      return;
                    }
                    setFilters({ assignedTo: value, unassigned: null });
                  }}
                />
              ) : null}
              <SelectFilter
                label="منبع"
                value={filters.source}
                options={LEAD_SOURCE_FILTER_OPTIONS}
                onChange={(source) =>
                  setFilters({ source: source as LeadSource | null })
                }
              />
              <ComboboxFilter
                label="کشور"
                value={filters.country}
                options={(countriesQuery.data?.items ?? []).map((item) => ({
                  value: item.slug,
                  label: item.nameFa,
                }))}
                isLoading={countriesQuery.isPending}
                onChange={(country) => setFilters({ country })}
              />
              <SelectFilter
                label="تگ"
                value={filters.tagId}
                options={tags.map((tag) => ({
                  value: tag.id,
                  label: tag.title,
                }))}
                onChange={(tagId) => setFilters({ tagId })}
              />
              <SelectFilter
                label="اولویت"
                value={filters.priority}
                options={LEAD_PRIORITY_FILTER_OPTIONS}
                onChange={(priority) =>
                  setFilters({ priority: priority as LeadPriority | null })
                }
              />
              <Input
                className="h-8 w-36 text-sm"
                placeholder="utm campaign"
                dir="ltr"
                value={filters.utmCampaign ?? ""}
                onChange={(event) =>
                  setFilters({
                    utmCampaign: event.target.value.trim() || null,
                  })
                }
                aria-label="فیلتر کمپین utm"
              />
              <DateRangeFilter
                label="بازه ایجاد"
                value={{
                  from: filters.createdFrom,
                  to: filters.createdTo,
                }}
                onChange={({ from, to }) =>
                  setFilters({ createdFrom: from, createdTo: to })
                }
              />
              <SelectFilter
                label="بدون فعالیت"
                value={
                  filters.inactiveDays !== null
                    ? String(filters.inactiveDays)
                    : null
                }
                options={[...INACTIVE_DAY_OPTIONS]}
                onChange={(value) =>
                  setFilters({
                    inactiveDays: value ? Number(value) : null,
                  })
                }
              />
              <SelectFilter
                label="پیگیری گذشته"
                value={
                  filters.overdueFollowUp === true
                    ? "yes"
                    : filters.overdueFollowUp === false
                      ? "no"
                      : null
                }
                options={[{ value: "yes", label: "فقط گذشته" }]}
                onChange={(value) =>
                  setFilters({
                    overdueFollowUp: value === "yes" ? true : null,
                  })
                }
              />
            </>
          }
          bulkActions={({ selectedIds, clearSelection: clear }) => (
            <>
              <Can permission="lead:assign">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setClearSelection(() => clear);
                    setBulkAssign(selectedIds);
                  }}
                >
                  <UserRound data-icon="inline-start" aria-hidden />
                  تخصیص
                </Button>
              </Can>
              <Can permission="lead:write">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setClearSelection(() => clear);
                    setBulkStage(selectedIds);
                  }}
                >
                  <Columns3 data-icon="inline-start" aria-hidden />
                  مرحله
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setClearSelection(() => clear);
                    setBulkTags({ ids: selectedIds, mode: "add" });
                  }}
                >
                  <Tag data-icon="inline-start" aria-hidden />
                  افزودن تگ
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setClearSelection(() => clear);
                    setBulkTags({ ids: selectedIds, mode: "remove" });
                  }}
                >
                  حذف تگ
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setClearSelection(() => clear);
                    setBulkPriority(selectedIds);
                  }}
                >
                  اولویت
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setClearSelection(() => clear);
                    setBulkMessage(selectedIds);
                  }}
                >
                  ارسال پیام
                </Button>
              </Can>
              {canExport ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setClearSelection(() => clear);
                    setExportOpen(true);
                  }}
                >
                  <Download data-icon="inline-start" aria-hidden />
                  خروجی
                </Button>
              ) : null}
              <Can permission="lead:delete">
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setClearSelection(() => clear);
                    setBulkDelete(selectedIds);
                  }}
                >
                  <Trash2 data-icon="inline-start" aria-hidden />
                  حذف
                </Button>
              </Can>
            </>
          )}
          rowActions={(lead) => (
            <RowActionsMenu label={`عملیات ${lead.name}`}>
              <DropdownMenuItem onSelect={() => openLead(lead)}>
                <Eye aria-hidden />
                جزئیات
              </DropdownMenuItem>
              <Can permission="lead:delete">
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setDeleteTarget(lead)}
                >
                  <Trash2 aria-hidden />
                  حذف
                </DropdownMenuItem>
              </Can>
            </RowActionsMenu>
          )}
        />
      )}

      <CreateLeadDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        consultantName={consultantName}
        onOpenLead={(id) => router.push(`/admin/leads/${id}`)}
      />

      <LeadBulkDialogs
        stages={stages}
        tags={tags}
        templates={templates}
        consultants={consultants}
        assignIds={bulkAssign}
        stageIds={bulkStage}
        tagIds={bulkTags?.ids ?? null}
        tagMode={bulkTags?.mode ?? null}
        priorityIds={bulkPriority}
        messageIds={bulkMessage}
        deleteIds={bulkDelete}
        onCloseAssign={() => setBulkAssign(null)}
        onCloseStage={() => setBulkStage(null)}
        onCloseTags={() => setBulkTags(null)}
        onClosePriority={() => setBulkPriority(null)}
        onCloseMessage={() => setBulkMessage(null)}
        onCloseDelete={() => setBulkDelete(null)}
        onDone={() => {
          clearSelection?.();
          void query.refetch();
        }}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="حذف لید"
        description={
          deleteTarget
            ? `آیا از حذف «${deleteTarget.name}» مطمئن هستید؟ این عمل قابل بازگشت نیست.`
            : undefined
        }
        confirmLabel="حذف"
        tone="destructive"
        isPending={deleteLead.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteLead.mutate(deleteTarget.id, {
            onSuccess: () => {
              toast.success("لید حذف شد");
              setDeleteTarget(null);
            },
            onError: (error) => toast.error(getApiErrorMessage(error)),
          });
        }}
      />

      <LeadExportDialog
        open={exportOpen}
        onOpenChange={(open) => {
          setExportOpen(open);
          if (!open && clearSelection) {
            clearSelection();
            setClearSelection(null);
          }
        }}
        filters={listQuery}
      />
    </PageContainer>
  );
}
