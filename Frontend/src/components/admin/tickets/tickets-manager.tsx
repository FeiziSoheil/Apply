"use client";

import Link from "next/link";
import { useSession } from "@/components/auth/auth-provider";
import { DataTable } from "@/components/admin/data-table/data-table";
import { SelectFilter } from "@/components/admin/data-table/filters";
import { useTableUrlState } from "@/components/admin/data-table/use-table-url-state";
import { PageContainer } from "@/components/panel/page-container";
import { PageHeader } from "@/components/panel/page-header";
import { Can } from "@/components/rbac/can";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TicketCategory, TicketStatus } from "@/contracts/tickets";
import { useTickets } from "@/features/tickets/queries";
import { ticketColumns } from "./ticket-columns";
import {
  TICKET_CATEGORY_FILTER_OPTIONS,
  TICKET_STATUS_FILTER_OPTIONS,
} from "./ticket-labels";
import {
  TICKET_INBOX_TABS,
  ticketFilterParsers,
  toTicketListQuery,
  type TicketInboxTab,
} from "./tickets-table-params";

const TAB_LABELS: Record<TicketInboxTab, string> = {
  me: "من",
  unassigned: "بدون مسئول",
  all: "همه",
};

export function TicketsManager() {
  const { user } = useSession();
  const table = useTableUrlState(ticketFilterParsers);
  const { params, filters, setFilters } = table;
  const query = useTickets(
    toTicketListQuery(params, filters, user?.id ?? null),
  );

  return (
    <PageContainer>
      <PageHeader
        title="صندوق تیکت"
        description="پاسخ به درخواست‌های پشتیبانی دانشجویان."
      />

      <Tabs
        value={filters.tab ?? "all"}
        onValueChange={(value) =>
          setFilters({ tab: value as TicketInboxTab })
        }
        className="mb-2"
      >
        <TabsList>
          {TICKET_INBOX_TABS.map((tab) => (
            <TabsTrigger key={tab} value={tab}>
              {TAB_LABELS[tab]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <DataTable
        caption="فهرست تیکت‌ها"
        columns={ticketColumns}
        data={query.data?.items}
        pagination={query.data?.pagination}
        getRowId={(ticket) => ticket.id}
        controller={table}
        isLoading={query.isPending}
        isFetching={query.isFetching}
        error={query.error}
        onRetry={() => void query.refetch()}
        searchPlaceholder="جستجوی کد، موضوع یا دانشجو…"
        emptyState={{
          title: "تیکتی وجود ندارد",
          description: "هنوز درخواستی در این فیلتر ثبت نشده است.",
        }}
        filters={
          <>
            <SelectFilter
              label="وضعیت"
              value={filters.status}
              options={TICKET_STATUS_FILTER_OPTIONS}
              onChange={(status) =>
                setFilters({ status: status as TicketStatus | null })
              }
            />
            <SelectFilter
              label="دسته"
              value={filters.category}
              options={TICKET_CATEGORY_FILTER_OPTIONS}
              onChange={(category) =>
                setFilters({ category: category as TicketCategory | null })
              }
            />
            <div className="flex items-center gap-2">
              <Switch
                id="ticket-unanswered"
                checked={Boolean(filters.unanswered)}
                onCheckedChange={(checked) =>
                  setFilters({ unanswered: checked || null })
                }
              />
              <Label htmlFor="ticket-unanswered" className="text-sm">
                بدون پاسخ
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="ticket-sla"
                checked={Boolean(filters.slaOverdue)}
                onCheckedChange={(checked) =>
                  setFilters({ slaOverdue: checked || null })
                }
              />
              <Label htmlFor="ticket-sla" className="text-sm">
                SLA گذشته
              </Label>
            </div>
          </>
        }
        rowActions={(ticket) => (
          <Can permission="ticket:read">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/admin/tickets/${ticket.id}`}>باز کردن</Link>
            </Button>
          </Can>
        )}
      />
    </PageContainer>
  );
}
