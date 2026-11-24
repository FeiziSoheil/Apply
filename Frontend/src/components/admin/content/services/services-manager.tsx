"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import {
  ContentListEmpty,
  ContentListError,
  ContentListRow,
  ContentListToolbar,
  PublicationStatusTabs,
  useReorderGuard,
} from "@/components/admin/content/content-list-parts";
import { ReorderableListPanel } from "@/components/admin/content/reorderable-list-panel";
import {
  DeleteEntityDialogs,
  useDeleteFlow,
} from "@/components/admin/content/use-delete-flow";
import { useTableUrlState } from "@/components/admin/data-table/use-table-url-state";
import { PUBLICATION_STATUS_MAP, StatusBadge } from "@/components/admin/status-badge";
import { PageContainer } from "@/components/panel/page-container";
import { PageHeader } from "@/components/panel/page-header";
import { Can } from "@/components/rbac/can";
import { Button } from "@/components/ui/button";
import type { Service } from "@/contracts/content";
import {
  useDeleteService,
  useReorderServices,
} from "@/features/content/mutations";
import { useServices } from "@/features/content/queries";
import { formatNumber } from "@/lib/format";
import { ServiceIcon } from "@/lib/icons";
import {
  serviceFilterParsers,
  toServiceListQuery,
} from "./services-table-params";

const LIST_HREF = "/admin/content/services";

const deleteSuccessMessage = (service: Service) =>
  `خدمت «${service.title}» حذف شد.`;

/**
 * `/admin/content/services` — search, status tabs, drag & drop order,
 * create / edit / delete.
 */
export function ServicesManager() {
  const router = useRouter();
  const table = useTableUrlState(serviceFilterParsers);
  const { filters, setFilters } = table;
  const query = useServices(toServiceListQuery(table.params, filters));
  const reorder = useReorderServices();
  const deleteFlow = useDeleteFlow<Service>({
    mutation: useDeleteService(),
    successMessage: deleteSuccessMessage,
  });

  const data = query.data;
  const guard = useReorderGuard(table.hasActiveFilters, data?.pagination.total);
  const openCreate = () => router.push(`${LIST_HREF}/new`);
  const createButton = (
    <Can permission="content:write">
      <Button type="button" onClick={openCreate}>
        <Plus data-icon="inline-start" aria-hidden />
        افزودن خدمت
      </Button>
    </Can>
  );

  return (
    <PageContainer>
      <PageHeader
        title="خدمات"
        description="مدیریت خدمات موسسه و ترتیب نمایش آن‌ها در سایت."
        actions={createButton}
      />

      <PublicationStatusTabs
        value={filters.status}
        onChange={(status) => setFilters({ status })}
      />

      <ContentListToolbar
        controller={table}
        searchPlaceholder="جستجوی عنوان یا توضیح خدمت…"
        isFetching={query.isFetching && !query.isPending}
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
          label="فهرست خدمات"
          onSave={reorder.mutateAsync}
          isSaving={reorder.isPending}
          disabled={guard.disabled}
          toolbar={
            data ? (
              <span className="text-sm text-muted-foreground">
                {formatNumber(data.pagination.total)} خدمت
              </span>
            ) : null
          }
          emptyState={
            <ContentListEmpty
              title="هنوز خدمتی ثبت نشده است"
              description="اولین خدمت را اضافه کنید."
              hasActiveFilters={table.hasActiveFilters}
              onClearFilters={table.clearFilters}
              action={createButton}
            />
          }
          renderItem={(service, { dragHandle, isDragging }) => (
            <ContentListRow
              dragHandle={dragHandle}
              isDragging={isDragging}
              leading={
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <ServiceIcon name={service.icon} className="size-4" aria-hidden />
                </span>
              }
              title={service.title}
              subtitle={service.shortDescription}
              badges={
                <StatusBadge
                  status={service.status}
                  map={PUBLICATION_STATUS_MAP}
                />
              }
              onEdit={() => router.push(`${LIST_HREF}/${service.id}/edit`)}
              onDelete={() => deleteFlow.request(service)}
            />
          )}
        />
      )}

      <DeleteEntityDialogs
        flow={deleteFlow}
        title="حذف خدمت"
        confirmLabel="حذف خدمت"
        describe={(service) =>
          `خدمت «${service.title}» برای همیشه حذف می‌شود.`
        }
      />
    </PageContainer>
  );
}
