"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import {
  ContentListEmpty,
  ContentListError,
  ContentListRow,
  ContentListToolbar,
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Faq } from "@/contracts/content";
import { useDeleteFaq, useReorderFaqs } from "@/features/content/mutations";
import { useFaqs } from "@/features/content/queries";
import { formatNumber } from "@/lib/format";
import { FAQ_CATEGORY_OPTIONS } from "@/lib/validations/faq";
import { faqFilterParsers, toFaqListQuery } from "./faqs-table-params";

const LIST_HREF = "/admin/content/faqs";

const UNCATEGORIZED_MAP: StatusMap = {
  none: { label: "بدون دسته", tone: "neutral" },
};

const deleteSuccessMessage = (faq: Faq) => `پرسش «${faq.question}» حذف شد.`;

/**
 * `/admin/content/faqs` — search, category filter, drag & drop order with a
 * live accordion preview of the saved Q&A order.
 */
export function FaqsManager() {
  const router = useRouter();
  const table = useTableUrlState(faqFilterParsers);
  const { filters, setFilters } = table;
  const query = useFaqs(toFaqListQuery(table.params, filters));
  const reorder = useReorderFaqs();
  const deleteFlow = useDeleteFlow<Faq>({
    mutation: useDeleteFaq(),
    successMessage: deleteSuccessMessage,
  });

  const data = query.data;
  const guard = useReorderGuard(table.hasActiveFilters, data?.pagination.total);
  const openCreate = () => router.push(`${LIST_HREF}/new`);
  const createButton = (
    <Can permission="content:write">
      <Button type="button" onClick={openCreate}>
        <Plus data-icon="inline-start" aria-hidden />
        افزودن پرسش
      </Button>
    </Can>
  );

  return (
    <PageContainer>
      <PageHeader
        title="پرسش‌های متداول"
        description="مدیریت پرسش و پاسخ‌های عمومی و ترتیب نمایش آن‌ها در سایت."
        actions={createButton}
      />

      <ContentListToolbar
        controller={table}
        searchPlaceholder="جستجوی پرسش یا پاسخ…"
        isFetching={query.isFetching && !query.isPending}
        filters={
          <SelectFilter
            label="دسته"
            value={filters.category}
            options={FAQ_CATEGORY_OPTIONS}
            onChange={(category) => setFilters({ category })}
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
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <ReorderableListPanel
            items={data?.items}
            label="فهرست پرسش‌های متداول"
            onSave={reorder.mutateAsync}
            isSaving={reorder.isPending}
            disabled={guard.disabled}
            toolbar={
              data ? (
                <span className="text-sm text-muted-foreground">
                  {formatNumber(data.pagination.total)} پرسش
                </span>
              ) : null
            }
            emptyState={
              <ContentListEmpty
                title="هنوز پرسشی ثبت نشده است"
                description="اولین پرسش متداول را اضافه کنید."
                hasActiveFilters={table.hasActiveFilters}
                onClearFilters={table.clearFilters}
                action={createButton}
              />
            }
            renderItem={(faq, { dragHandle, isDragging }) => (
              <ContentListRow
                dragHandle={dragHandle}
                isDragging={isDragging}
                title={faq.question}
                badges={
                  faq.category ? (
                    <Badge variant="secondary">{faq.category}</Badge>
                  ) : (
                    <StatusBadge status="none" map={UNCATEGORIZED_MAP} />
                  )
                }
                onEdit={() => router.push(`${LIST_HREF}/${faq.id}/edit`)}
                onDelete={() => deleteFlow.request(faq)}
              />
            )}
          />

          {data && data.items.length > 0 ? (
            <section
              aria-label="پیش‌نمایش پرسش‌های متداول"
              className="flex flex-col gap-3 rounded-lg border bg-card p-4"
            >
              <h2 className="text-sm font-medium">
                پیش‌نمایش (ترتیب ذخیره‌شده)
              </h2>
              <Accordion type="single" collapsible>
                {data.items.map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent className="whitespace-pre-line text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ) : null}
        </div>
      )}

      <DeleteEntityDialogs
        flow={deleteFlow}
        title="حذف پرسش"
        confirmLabel="حذف پرسش"
        describe={(faq) => `پرسش «${faq.question}» برای همیشه حذف می‌شود.`}
      />
    </PageContainer>
  );
}
