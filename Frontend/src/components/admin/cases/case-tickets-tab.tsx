"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useTickets } from "@/features/tickets/queries";
import { formatJalaliDate, formatRelativeFa } from "@/lib/format";

type CaseTicketsTabProps = {
  caseId: string;
};

const STATUS_FA: Record<string, string> = {
  open: "باز",
  waiting_staff: "منتظر پشتیبانی",
  waiting_student: "منتظر دانشجو",
  closed: "بسته",
};

export function CaseTicketsTab({ caseId }: CaseTicketsTabProps) {
  const ticketsQuery = useTickets({
    page: 1,
    pageSize: 50,
    caseId,
    sort: "lastMessageAt",
    order: "desc",
  });

  const tickets = ticketsQuery.data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">تیکت‌های دانشجو</h2>
        <Link
          href={`/admin/tickets?caseId=${caseId}`}
          className="text-primary text-sm hover:underline"
        >
          بخش تیکت‌ها
        </Link>
      </div>

      {ticketsQuery.isPending ? (
        <p className="text-muted-foreground text-sm">در حال بارگذاری…</p>
      ) : tickets.length === 0 ? (
        <p className="text-muted-foreground text-sm">تیکتی برای این پرونده نیست.</p>
      ) : (
        <ul className="space-y-2">
          {tickets.map((ticket) => (
            <li key={ticket.id}>
              <Link
                href={`/admin/tickets/${ticket.id}`}
                className="bg-card hover:bg-muted/40 flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 transition-colors"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{ticket.subject}</p>
                  <p className="text-muted-foreground text-xs tabular-nums" dir="ltr">
                    {ticket.code}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {STATUS_FA[ticket.status] ?? ticket.status}
                  </Badge>
                  <span className="text-muted-foreground text-xs">
                    {formatRelativeFa(ticket.updatedAt)}
                  </span>
                </div>
              </Link>
              <p className="text-muted-foreground sr-only">
                {formatJalaliDate(ticket.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
