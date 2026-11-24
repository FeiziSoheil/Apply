"use client";

import { useState, useTransition } from "react";
import { AlarmClock, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Can } from "@/components/rbac/can";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Task } from "@/contracts/crm";
import {
  useCompleteTask,
  useDeleteTask,
  useSnoozeTask,
} from "@/features/crm/mutations";
import { ApiError, getApiErrorMessage } from "@/lib/api";
import { formatJalaliDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SNOOZE_OPTIONS, TASK_PRIORITY_LABELS } from "./task-labels";
import { TaskRelatedLink } from "./task-related-link";

export type TaskRowProps = {
  task: Task;
  assigneeName?: string | null;
  relatedLabel?: string | null;
  selected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  onEdit?: (task: Task) => void;
  highlight?: boolean;
  compact?: boolean;
};

export function TaskRow({
  task,
  assigneeName,
  relatedLabel,
  selected,
  onSelectedChange,
  onEdit,
  highlight,
  compact,
}: TaskRowProps) {
  const completeTask = useCompleteTask();
  const snoozeTask = useSnoozeTask();
  const deleteTask = useDeleteTask();
  const [optimisticDone, setOptimisticDone] = useState(task.status === "done");
  const [nowMs] = useState(() => Date.now());
  const [, startTransition] = useTransition();

  const overdue =
    task.status === "open" && new Date(task.dueAt).getTime() < nowMs;
  const done = optimisticDone || task.status === "done";

  function handleComplete(checked: boolean) {
    if (!checked || done) return;
    setOptimisticDone(true);
    startTransition(() => {
      completeTask.mutate(
        {
          id: task.id,
          leadId: task.relatedType === "lead" ? task.relatedId ?? undefined : undefined,
          caseId: task.relatedType === "case" ? task.relatedId ?? undefined : undefined,
        },
        {
          onSuccess: () => toast.success("کار تکمیل شد"),
          onError: (error) => {
            setOptimisticDone(false);
            toast.error(getApiErrorMessage(error));
          },
        },
      );
    });
  }

  return (
    <li
      data-task-id={task.id}
      className={cn(
        "flex items-start gap-3 rounded-lg border bg-card px-3 py-2.5",
        overdue && !done && "border-destructive/40 bg-destructive/5",
        highlight && "ring-2 ring-primary/40",
        done && "opacity-70",
        compact && "py-2",
      )}
    >
      {onSelectedChange ? (
        <Checkbox
          checked={selected}
          onCheckedChange={(value) => onSelectedChange(value === true)}
          aria-label={`انتخاب ${task.title}`}
          className="mt-1"
        />
      ) : null}

      <Can permission="task:write" fallback={<span className="mt-1 size-4" />}>
        <Checkbox
          checked={done}
          disabled={done || completeTask.isPending}
          onCheckedChange={(value) => handleComplete(value === true)}
          aria-label={done ? "تکمیل‌شده" : `تکمیل ${task.title}`}
          className="mt-1"
        />
      </Can>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={cn(
              "text-sm font-medium",
              done && "text-muted-foreground line-through",
            )}
          >
            {task.title}
          </p>
          <Badge
            variant={task.priority === "high" ? "destructive" : "outline"}
            className="text-[0.65rem]"
          >
            {TASK_PRIORITY_LABELS[task.priority]}
          </Badge>
          {overdue && !done ? (
            <Badge variant="destructive" className="text-[0.65rem]">
              سررسید گذشته
            </Badge>
          ) : null}
        </div>
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <time dateTime={task.dueAt} className="tabular-nums">
            {formatJalaliDate(task.dueAt, "EEEE d MMM · HH:mm")}
          </time>
          {assigneeName ? <span>{assigneeName}</span> : null}
          <TaskRelatedLink
            task={task}
            label={relatedLabel}
            className="text-primary hover:underline"
          />
        </div>
      </div>

      <Can permission="task:write">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label="عملیات کار"
            >
              <MoreHorizontal aria-hidden className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-40">
            {onEdit ? (
              <DropdownMenuItem onSelect={() => onEdit(task)}>
                <Pencil aria-hidden className="size-3.5" />
                ویرایش
              </DropdownMenuItem>
            ) : null}
            {!done ? (
              <>
                <DropdownMenuLabel className="flex items-center gap-1.5 text-xs font-normal">
                  <AlarmClock aria-hidden className="size-3.5" />
                  تعویق
                </DropdownMenuLabel>
                {SNOOZE_OPTIONS.map((option) => (
                  <DropdownMenuItem
                    key={option.preset}
                    onSelect={() => {
                      snoozeTask.mutate(
                        {
                          id: task.id,
                          version: task.version,
                          body: { preset: option.preset },
                          leadId:
                            task.relatedType === "lead"
                              ? task.relatedId ?? undefined
                              : undefined,
                          caseId:
                            task.relatedType === "case"
                              ? task.relatedId ?? undefined
                              : undefined,
                        },
                        {
                          onSuccess: () => toast.success("کار به تعویق افتاد"),
                          onError: (error) => {
                            if (
                              error instanceof ApiError &&
                              error.isVersionMismatch
                            ) {
                              toast.error("نسخه تغییر کرده؛ صفحه را تازه کنید");
                              return;
                            }
                            toast.error(getApiErrorMessage(error));
                          },
                        },
                      );
                    }}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </>
            ) : null}
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => {
                deleteTask.mutate(
                  {
                    id: task.id,
                    leadId:
                      task.relatedType === "lead"
                        ? task.relatedId ?? undefined
                        : undefined,
                    caseId:
                      task.relatedType === "case"
                        ? task.relatedId ?? undefined
                        : undefined,
                  },
                  {
                    onSuccess: () => toast.success("کار حذف شد"),
                    onError: (error) =>
                      toast.error(getApiErrorMessage(error)),
                  },
                );
              }}
            >
              <Trash2 aria-hidden className="size-3.5" />
              حذف
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Can>
    </li>
  );
}
