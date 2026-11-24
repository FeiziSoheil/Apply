"use client";

import Link from "next/link";
import type { Task } from "@/contracts/crm";
import { TASK_RELATED_TYPE_LABELS } from "./task-labels";

type TaskRelatedLinkProps = {
  task: Pick<Task, "relatedType" | "relatedId">;
  /** Optional display name resolved by parent */
  label?: string | null;
  className?: string;
};

function hrefFor(task: Pick<Task, "relatedType" | "relatedId">): string | null {
  if (!task.relatedId || task.relatedType === "none") return null;
  switch (task.relatedType) {
    case "lead":
      return `/admin/leads/${task.relatedId}`;
    case "case":
      return `/admin/cases/${task.relatedId}`;
    case "booking":
      return `/admin/bookings`;
    default:
      return null;
  }
}

export function TaskRelatedLink({
  task,
  label,
  className,
}: TaskRelatedLinkProps) {
  const href = hrefFor(task);
  if (!href) {
    return (
      <span className={className}>
        {TASK_RELATED_TYPE_LABELS.none}
      </span>
    );
  }
  const text =
    label?.trim() ||
    `${TASK_RELATED_TYPE_LABELS[task.relatedType]}`;
  return (
    <Link href={href} className={className ?? "text-primary hover:underline"}>
      {text}
    </Link>
  );
}
