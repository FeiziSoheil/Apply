"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Can } from "@/components/rbac/can";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Task, TaskRelatedType } from "@/contracts/crm";
import { useCreateTask } from "@/features/crm/mutations";
import { getApiErrorMessage } from "@/lib/api";
import { TaskFormDialog } from "./task-form-dialog";
import { TaskRow } from "./task-row";

type TaskSectionProps = {
  tasks: readonly Task[];
  relatedType: Extract<TaskRelatedType, "lead" | "case">;
  relatedId: string;
  defaultAssigneeId: string | null;
  currentUserId: string;
  title?: string;
  /** Link to filtered tasks page */
  allHref?: string;
  compact?: boolean;
};

export function TaskSection({
  tasks,
  relatedType,
  relatedId,
  defaultAssigneeId,
  currentUserId,
  title = "کارهای باز",
  allHref,
  compact,
}: TaskSectionProps) {
  const createTask = useCreateTask();
  const [quickTitle, setQuickTitle] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const openTasks = tasks.filter((task) => task.status === "open");
  const assigneeId = defaultAssigneeId ?? currentUserId;

  return (
    <section className="bg-card space-y-3 rounded-xl border p-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        <Can permission="task:write">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus data-icon="inline-start" aria-hidden className="size-3.5" />
            کار جدید
          </Button>
        </Can>
      </div>

      {openTasks.length === 0 ? (
        <p className="text-muted-foreground text-xs">همه کارها انجام شد ✨</p>
      ) : (
        <ul className="space-y-2">
          {openTasks.slice(0, compact ? 6 : 20).map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              compact
              onEdit={(item) => {
                setEditing(item);
                setFormOpen(true);
              }}
            />
          ))}
        </ul>
      )}

      <Can permission="task:write">
        <div className="flex gap-2">
          <Input
            value={quickTitle}
            onChange={(event) => setQuickTitle(event.target.value)}
            placeholder="عنوان کار جدید"
            className="h-8"
            aria-label="عنوان کار سریع"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                document.getElementById(`task-quick-add-${relatedId}`)?.click();
              }
            }}
          />
          <Button
            id={`task-quick-add-${relatedId}`}
            type="button"
            size="sm"
            disabled={!quickTitle.trim() || createTask.isPending}
            onClick={() => {
              createTask.mutate(
                {
                  title: quickTitle.trim(),
                  dueAt: new Date(Date.now() + 86_400_000).toISOString(),
                  assigneeId,
                  relatedType,
                  relatedId,
                  priority: "normal",
                },
                {
                  onSuccess: () => {
                    toast.success("کار ساخته شد");
                    setQuickTitle("");
                  },
                  onError: (error) => toast.error(getApiErrorMessage(error)),
                },
              );
            }}
          >
            <Plus aria-hidden className="size-3.5" />
          </Button>
        </div>
      </Can>

      {allHref ? (
        <Link href={allHref} className="text-primary text-sm hover:underline">
          همه کارها
        </Link>
      ) : null}

      <TaskFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        task={editing}
        defaults={{
          assigneeId,
          relatedType,
          relatedId,
        }}
      />
    </section>
  );
}
