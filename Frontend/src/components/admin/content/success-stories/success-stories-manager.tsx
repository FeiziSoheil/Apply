"use client";

import { useMemo } from "react";
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
import { SelectFilter } from "@/components/admin/data-table/filters";
import { useTableUrlState } from "@/components/admin/data-table/use-table-url-state";
import {
  PUBLICATION_STATUS_MAP,
  StatusBadge,
  type StatusMap,
} from "@/components/admin/status-badge";
import { PageContainer } from "@/components/panel/page-container";
import { PageHeader } from "@/components/panel/page-header";
import { Can } from "@/components/rbac/can";
import { Button } from "@/components/ui/button";
import type { SuccessStory } from "@/contracts/content";
import {
  useDeleteSuccessStory,
  useReorderSuccessStories,
} from "@/features/content/mutations";
import { useCountries, useSuccessStories } from "@/features/content/queries";
import { formatNumber, toPersianDigits } from "@/lib/format";
import {
  successStoryFilterParsers,
  toSuccessStoryListQuery,
} from "./success-stories-table-params";

const LIST_HREF = "/admin/content/success-stories";

const CONSENT_STATUS_MAP: StatusMap = {
  missing: { label: "بدون رضایت انتشار", tone: "warning" },
};

const ANONYMOUS_STATUS_MAP: StatusMap = {
  anonymous: { label: "ناشناس", tone: "neutral" },
};

const deleteSuccessMessage = (story: SuccessStory) =>
  `داستان «${story.studentName}» حذف شد.`;

/**
 * `/admin/content/success-stories` — search, status tabs, country filter,
 * drag & drop order, create / edit / delete.
 */
export function SuccessStoriesManager() {
  const router = useRouter();
  const table = useTableUrlState(successStoryFilterParsers);
  const { filters, setFilters } = table;
  const query = useSuccessStories(toSuccessStoryListQuery(table.params, filters));
  const countriesQuery = useCountries({
    pageSize: 100,
    sort: "nameFa",
    order: "asc",
  });
  const reorder = useReorderSuccessStories();
  const deleteFlow = useDeleteFlow<SuccessStory>({
    mutation: useDeleteSuccessStory(),
    successMessage: deleteSuccessMessage,
  });

  // The API filters stories by the stored country name
  const countryOptions = useMemo(
    () =>
      (countriesQuery.data?.items ?? []).map((country) => ({
        value: country.nameFa,
        label: country.nameFa,
      })),
    [countriesQuery.data?.items],
  );

  const data = query.data;
  const guard = useReorderGuard(table.hasActiveFilters, data?.pagination.total);
  const openCreate = () => router.push(`${LIST_HREF}/new`);
  const createButton = (
    <Can permission="content:write">
      <Button type="button" onClick={openCreate}>
        <Plus data-icon="inline-start" aria-hidden />
        افزودن داستان موفقیت
      </Button>
    </Can>
  );

  return (
    <PageContainer>
      <PageHeader
        title="داستان‌های موفقیت"
        description="مدیریت داستان دانشجویان، رضایت انتشار و ترتیب نمایش در سایت."
        actions={createButton}
      />

      <PublicationStatusTabs
        value={filters.status}
        onChange={(status) => setFilters({ status })}
      />

      <ContentListToolbar
        controller={table}
        searchPlaceholder="جستجوی نام، دانشگاه، رشته یا نقل‌قول…"
        isFetching={query.isFetching && !query.isPending}
        filters={
          <SelectFilter
            label="کشور"
            value={filters.country}
            options={countryOptions}
            onChange={(country) => setFilters({ country })}
          />
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
          label="فهرست داستان‌های موفقیت"
          onSave={reorder.mutateAsync}
          isSaving={reorder.isPending}
          disabled={guard.disabled}
          toolbar={
            data ? (
              <span className="text-sm text-muted-foreground">
                {formatNumber(data.pagination.total)} داستان
              </span>
            ) : null
          }
          emptyState={
            <ContentListEmpty
              title="هنوز داستانی ثبت نشده است"
              description="اولین داستان موفقیت را اضافه کنید."
              hasActiveFilters={table.hasActiveFilters}
              onClearFilters={table.clearFilters}
              action={createButton}
            />
          }
          renderItem={(story, { dragHandle, isDragging }) => (
            <ContentListRow
              dragHandle={dragHandle}
              isDragging={isDragging}
              title={story.studentName}
              subtitle={`${story.country} · ${story.university} · ${story.field} · ${toPersianDigits(story.year)}`}
              badges={
                <>
                  <StatusBadge
                    status={story.status}
                    map={PUBLICATION_STATUS_MAP}
                  />
                  {story.isAnonymous ? (
                    <StatusBadge
                      status="anonymous"
                      map={ANONYMOUS_STATUS_MAP}
                    />
                  ) : null}
                  {story.publicationConsent ? null : (
                    <StatusBadge status="missing" map={CONSENT_STATUS_MAP} />
                  )}
                </>
              }
              onEdit={() => router.push(`${LIST_HREF}/${story.id}/edit`)}
              onDelete={() => deleteFlow.request(story)}
            />
          )}
        />
      )}

      <DeleteEntityDialogs
        flow={deleteFlow}
        title="حذف داستان موفقیت"
        confirmLabel="حذف داستان"
        describe={(story) =>
          `داستان «${story.studentName}» برای همیشه حذف می‌شود.`
        }
      />
    </PageContainer>
  );
}
