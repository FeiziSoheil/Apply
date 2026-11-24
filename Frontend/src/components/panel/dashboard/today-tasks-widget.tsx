"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckSquare, Sparkles } from "lucide-react";
import { useSession } from "@/components/auth/auth-provider";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTasks } from "@/features/crm/queries";
import { formatJalaliDate, toPersianDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

export function TodayTasksWidget() {
  const { user } = useSession();
  const [nowMs] = useState(() => Date.now());
  const query = useTasks(
    {
      page: 1,
      pageSize: 8,
      due: "today",
      status: "open",
      sort: "dueAt",
      order: "asc",
      assigneeId: user?.role === "consultant" ? user.id : undefined,
    },
    { enabled: Boolean(user) },
  );

  const overdueQuery = useTasks(
    {
      page: 1,
      pageSize: 1,
      due: "overdue",
      status: "open",
      assigneeId: user?.role === "consultant" ? user.id : undefined,
    },
    { enabled: Boolean(user) },
  );

  const items = query.data?.items ?? [];
  const overdueTotal = overdueQuery.data?.pagination.total ?? 0;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle>کارهای امروز من</CardTitle>
            <CardDescription>
              {overdueTotal > 0
                ? `${toPersianDigits(overdueTotal)} کار سررسیدگذشته هم دارید`
                : "سررسید امروز"}
            </CardDescription>
          </div>
          <Link
            href="/admin/tasks?tab=today"
            className="text-primary text-xs hover:underline"
          >
            همه کارها
          </Link>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col">
        {query.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-muted-foreground flex flex-1 items-center gap-2 text-sm">
            <Sparkles aria-hidden className="size-4" />
            همه کارهای امروز انجام شد
          </div>
        ) : (
          <ul className="thin-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
            {items.map((task) => {
              const overdue = new Date(task.dueAt).getTime() < nowMs;
              return (
                <li key={task.id}>
                  <Link
                    href={`/admin/tasks?highlight=${task.id}&tab=${overdue ? "overdue" : "today"}`}
                    className="hover:bg-muted/50 flex items-start justify-between gap-2 rounded-md px-1 py-1.5"
                  >
                    <div className="min-w-0 flex items-start gap-2">
                      <CheckSquare
                        aria-hidden
                        className={cn(
                          "mt-0.5 size-3.5 shrink-0",
                          overdue ? "text-destructive" : "text-muted-foreground",
                        )}
                      />
                      <span className="truncate text-sm">{task.title}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {overdue ? (
                        <Badge variant="destructive" className="text-[0.65rem]">
                          گذشته
                        </Badge>
                      ) : null}
                      <time className="text-muted-foreground text-xs tabular-nums">
                        {formatJalaliDate(task.dueAt, "HH:mm")}
                      </time>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
