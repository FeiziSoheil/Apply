"use client";

import Link from "next/link";
import { MessagesSquare, Plus } from "lucide-react";
import { PageContainer } from "@/components/panel/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMyTickets } from "@/features/student-panel/queries";
import { formatRelativeFa } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CaseLinkGate } from "../case-link-gate";
import {
  StudentPanelEmpty,
  StudentPanelError,
  StudentPanelSkeleton,
} from "../panel-query-state";
import { STUDENT_TICKET_STATUS_FA } from "./ticket-status-fa";

function MessagesContent() {
  const ticketsQuery = useMyTickets({
    page: 1,
    pageSize: 50,
    sort: "lastMessageAt",
    order: "desc",
  });

  if (ticketsQuery.isLoading) return <StudentPanelSkeleton />;
  if (ticketsQuery.isError) {
    return (
      <StudentPanelError
        error={ticketsQuery.error}
        onRetry={() => void ticketsQuery.refetch()}
      />
    );
  }

  const items = ticketsQuery.data?.items ?? [];

  return (
    <PageContainer className="gap-5 pb-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-bold">پیام‌ها</h1>
          <p className="text-sm text-muted-foreground">
            گفتگو با مشاور و پشتیبانی
          </p>
        </div>
        <Button asChild className="min-h-11">
          <Link href="/panel/messages/new">
            <Plus data-icon="inline-start" aria-hidden />
            پیام جدید
          </Link>
        </Button>
      </header>

      {items.length === 0 ? (
        <StudentPanelEmpty
          icon={MessagesSquare}
          title="هنوز پیامی ندارید"
          description="اگر سؤالی دارید، یک گفتگو باز کنید تا مشاور پاسخ دهد."
        >
          <Button asChild className="min-h-11">
            <Link href="/panel/messages/new">شروع گفتگو</Link>
          </Button>
        </StudentPanelEmpty>
      ) : (
        <ul className="flex flex-col gap-2" role="list">
          {items.map((ticket) => {
            const unread = ticket.unreadCount ?? 0;
            return (
              <li key={ticket.id}>
                <Link
                  href={`/panel/messages/${ticket.id}`}
                  className={cn(
                    "flex items-start gap-3 rounded-2xl border bg-card p-4 transition-colors",
                    "hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    unread > 0 && "border-primary/30 bg-primary/5",
                  )}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate font-medium">{ticket.subject}</p>
                      <time
                        className="shrink-0 text-xs text-muted-foreground tabular-nums"
                        dateTime={ticket.lastMessageAt}
                      >
                        {formatRelativeFa(ticket.lastMessageAt)}
                      </time>
                    </div>
                    {ticket.lastMessagePreview ? (
                      <p className="line-clamp-1 text-sm text-muted-foreground">
                        {ticket.lastMessagePreview}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <Badge variant="secondary">
                        {STUDENT_TICKET_STATUS_FA[ticket.status] ??
                          ticket.status}
                      </Badge>
                      {unread > 0 ? (
                        <Badge className="tabular-nums">
                          {unread} خوانده‌نشده
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </PageContainer>
  );
}

export function StudentMessagesView() {
  return (
    <CaseLinkGate requireCase={false}>
      <MessagesContent />
    </CaseLinkGate>
  );
}
