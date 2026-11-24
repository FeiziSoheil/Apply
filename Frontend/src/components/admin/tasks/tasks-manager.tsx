"use client";

import { useMemo, useState } from "react";
import { useQueryState, parseAsString, parseAsStringLiteral } from "nuqs";
import {
  CalendarDays,
  CheckCheck,
  List,
  ServerCrash,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/components/auth/auth-provider";
import { SelectFilter } from "@/components/admin/data-table/filters";
import { Can } from "@/components/rbac/can";
import { PageContainer } from "@/components/panel/page-container";
import { PageHeader } from "@/components/panel/page-header";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Task } from "@/contracts/crm";
import { useBookings } from "@/features/bookings/queries";
import {
  useBulkCompleteTasks,
} from "@/features/crm/mutations";
import { useTaskCounts, useTasks } from "@/features/crm/queries";
import { useStaffUsers } from "@/features/users/queries";
import { getApiErrorMessage } from "@/lib/api";
import { formatJalaliDate, toPersianDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TaskCalendar } from "./task-calendar";
import { TaskFormDialog } from "./task-form-dialog";
import { TASK_TAB_LABELS, type TaskTabKey } from "./task-labels";
import { TaskQuickAdd } from "./task-quick-add";
import { TaskRow } from "./task-row";
import { useTaskReminderScheduler } from "./use-task-reminder-scheduler";

const TAB_KEYS = [
  "today",
  "overdue",
  "week",
  "upcoming",
  "done",
] as const satisfies readonly TaskTabKey[];

const tabParser = parseAsStringLiteral(TAB_KEYS).withDefault("today");
const viewParser = parseAsStringLiteral(["list", "calendar"] as const).withDefault(
  "list",
);

function groupTasksByDate(tasks: readonly Task[]): Array<{
  key: string;
  label: string;
  items: Task[];
}> {
  const groups = new Map<string, Task[]>();
  for (const task of tasks) {
    const key = formatJalaliDate(task.dueAt, "yyyy-MM-dd");
    const list = groups.get(key) ?? [];
    list.push(task);
    groups.set(key, list);
  }
  return Array.from(groups.entries()).map(([key, items]) => ({
    key,
    label: formatJalaliDate(items[0]!.dueAt, "EEEE d MMMM yyyy"),
    items,
  }));
}

function tabToQuery(tab: TaskTabKey): {
  due?: "today" | "overdue" | "week" | "upcoming";
  status?: "open" | "done";
} {
  if (tab === "done") return { status: "done" };
  return { due: tab, status: "open" };
}

export function TasksManager() {
  const { user } = useSession();
  const isAdmin = user?.role === "admin";
  const [tab, setTab] = useQueryState("tab", tabParser);
  const [view, setView] = useQueryState("view", viewParser);
  const [assigneeId, setAssigneeId] = useQueryState(
    "assigneeId",
    parseAsString,
  );
  const [highlight] = useQueryState("highlight", parseAsString);
  const [relatedType] = useQueryState("relatedType", parseAsString);
  const [relatedId] = useQueryState("relatedId", parseAsString);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [formSeed, setFormSeed] = useState<{
    title?: string;
    dueAt?: string;
  }>({});

  useTaskReminderScheduler(Boolean(user));

  const effectiveAssignee =
    user?.role === "consultant" ? user.id : assigneeId || undefined;

  const listQuery = useTasks({
    page: 1,
    pageSize: 100,
    sort: "dueAt",
    order: tab === "done" ? "desc" : "asc",
    assigneeId: effectiveAssignee,
    relatedType:
      relatedType === "lead" || relatedType === "case" || relatedType === "booking"
        ? relatedType
        : undefined,
    relatedId: relatedId || undefined,
    ...tabToQuery(tab),
  });

  const calendarQuery = useTasks(
    {
      page: 1,
      pageSize: 100,
      sort: "dueAt",
      order: "asc",
      assigneeId: effectiveAssignee,
    },
    { enabled: view === "calendar" },
  );

  const countsQuery = useTaskCounts({
    assigneeId: effectiveAssignee,
  });

  const consultantsQuery = useStaffUsers(
    {
      page: 1,
      pageSize: 100,
      role: "consultant",
      status: "active",
    },
    { enabled: isAdmin },
  );

  const bookingsQuery = useBookings(
    {
      page: 1,
      pageSize: 100,
      consultantId: effectiveAssignee,
    },
    { enabled: view === "calendar" },
  );

  const bulkComplete = useBulkCompleteTasks();

  const assigneeNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of consultantsQuery.data?.items ?? []) {
      map.set(item.id, item.name);
    }
    if (user) map.set(user.id, user.name);
    return map;
  }, [consultantsQuery.data?.items, user]);

  const tasks = listQuery.data?.items;
  const groups = useMemo(
    () => groupTasksByDate(tasks ?? []),
    [tasks],
  );
  const counts = countsQuery.data;

  const emptyMessage =
    tab === "done"
      ? "هنوز کار تکمیل‌شده‌ای نیست"
      : tab === "overdue"
        ? "هیچ کار سررسیدگذشته‌ای نیست — عالی!"
        : "همه کارها انجام شد";

  function openCreate(seed?: { title?: string; dueAt?: string }) {
    setEditing(null);
    setFormSeed(seed ?? {});
    setFormOpen(true);
  }

  return (
    <PageContainer>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="کارهای من"
          description="پیگیری، یادآور و تقویم کارهای CRM."
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={view === "list" ? "secondary" : "outline"}
            size="sm"
            onClick={() => void setView("list")}
          >
            <List data-icon="inline-start" aria-hidden />
            فهرست
          </Button>
          <Button
            type="button"
            variant={view === "calendar" ? "secondary" : "outline"}
            size="sm"
            onClick={() => void setView("calendar")}
          >
            <CalendarDays data-icon="inline-start" aria-hidden />
            تقویم
          </Button>
          <Can permission="task:write">
            <Button type="button" size="sm" onClick={() => openCreate()}>
              کار جدید
            </Button>
          </Can>
        </div>
      </div>

      {user ? (
        <TaskQuickAdd
          assigneeId={effectiveAssignee ?? user.id}
          onOpenFullForm={(seed) => openCreate(seed)}
        />
      ) : null}

      {isAdmin ? (
        <div className="max-w-xs">
          <SelectFilter
            label="مشاور"
            value={assigneeId}
            onChange={(value) => void setAssigneeId(value)}
            options={(consultantsQuery.data?.items ?? []).map((item) => ({
              value: item.id,
              label: item.name,
            }))}
          />
        </div>
      ) : null}

      {view === "list" ? (
        <>
          <Tabs
            value={tab}
            onValueChange={(value) => {
              if (TAB_KEYS.includes(value as TaskTabKey)) {
                void setTab(value as TaskTabKey);
                setSelectedIds(new Set());
              }
            }}
          >
            <TabsList className="h-auto flex-wrap">
              {TAB_KEYS.map((key) => {
                const count = counts?.[key];
                return (
                  <TabsTrigger key={key} value={key} className="gap-1.5">
                    {TASK_TAB_LABELS[key]}
                    {count !== undefined ? (
                      <span
                        className={cn(
                          "rounded-md bg-muted px-1.5 text-[0.65rem] tabular-nums",
                          key === "overdue" &&
                            count > 0 &&
                            "bg-destructive/15 text-destructive",
                        )}
                      >
                        {toPersianDigits(count)}
                      </span>
                    ) : null}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>

          {selectedIds.size > 0 ? (
            <div className="bg-muted/40 flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2">
              <span className="text-sm tabular-nums">
                {toPersianDigits(selectedIds.size)} مورد انتخاب‌شده
              </span>
              <Can permission="task:write">
                <Button
                  type="button"
                  size="sm"
                  disabled={bulkComplete.isPending}
                  onClick={() => {
                    bulkComplete.mutate(
                      { ids: Array.from(selectedIds) },
                      {
                        onSuccess: () => {
                          toast.success("کارها تکمیل شدند");
                          setSelectedIds(new Set());
                        },
                        onError: (error) =>
                          toast.error(getApiErrorMessage(error)),
                      },
                    );
                  }}
                >
                  <CheckCheck data-icon="inline-start" aria-hidden />
                  تکمیل دسته‌ای
                </Button>
              </Can>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setSelectedIds(new Set())}
              >
                لغو انتخاب
              </Button>
            </div>
          ) : null}

          {listQuery.isLoading ? (
            <div className="space-y-2" aria-busy="true" aria-label="بارگذاری کارها">
              {Array.from({ length: 5 }, (_, index) => (
                <Skeleton key={index} className="h-16 w-full" />
              ))}
            </div>
          ) : listQuery.isError ? (
            <Empty className="border bg-card py-10">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ServerCrash aria-hidden />
                </EmptyMedia>
                <EmptyTitle>خطا در دریافت کارها</EmptyTitle>
                <EmptyDescription>
                  {getApiErrorMessage(listQuery.error)}
                </EmptyDescription>
              </EmptyHeader>
              <Button type="button" onClick={() => void listQuery.refetch()}>
                تلاش دوباره
              </Button>
            </Empty>
          ) : !tasks || tasks.length === 0 ? (
            <Empty className="border bg-card py-10">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Sparkles aria-hidden />
                </EmptyMedia>
                <EmptyTitle>{emptyMessage}</EmptyTitle>
                <EmptyDescription>
                  کار جدیدی اضافه کنید یا تب دیگری را ببینید.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="space-y-6">
              {groups.map((group) => (
                <section key={group.key} className="space-y-2">
                  <h2 className="text-muted-foreground text-xs font-semibold tracking-wide">
                    {group.label}
                  </h2>
                  <ul className="space-y-2">
                    {group.items.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        assigneeName={assigneeNames.get(task.assigneeId)}
                        highlight={highlight === task.id}
                        selected={selectedIds.has(task.id)}
                        onSelectedChange={(selected) => {
                          setSelectedIds((current) => {
                            const next = new Set(current);
                            if (selected) next.add(task.id);
                            else next.delete(task.id);
                            return next;
                          });
                        }}
                        onEdit={(item) => {
                          setEditing(item);
                          setFormOpen(true);
                        }}
                      />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      ) : (
        <TaskCalendar
          tasks={calendarQuery.data?.items ?? []}
          bookings={bookingsQuery.data?.items ?? []}
          onDayClick={(date) => {
            const due = new Date(date);
            due.setHours(10, 0, 0, 0);
            openCreate({ dueAt: due.toISOString() });
          }}
          onTaskClick={(task) => {
            setEditing(task);
            setFormOpen(true);
          }}
        />
      )}

      <TaskFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        task={editing}
        defaults={{
          title: formSeed.title,
          dueAt: formSeed.dueAt,
          assigneeId: effectiveAssignee ?? user?.id,
          relatedType:
            relatedType === "lead" || relatedType === "case"
              ? relatedType
              : undefined,
          relatedId: relatedId || undefined,
        }}
      />
    </PageContainer>
  );
}
