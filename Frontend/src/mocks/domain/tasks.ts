import type { Activity } from "@/contracts/leads";
import type {
  Notification,
  Task,
  TaskCounts,
  TaskDueFilter,
  TaskSnooze,
  TaskSnoozePreset,
} from "@/contracts/crm";
import type { MockDb } from "../db";
import {
  deliverNotification,
  emitDomainEvent,
  type DomainNotificationInput,
} from "../domain-events";
import type { MockUser } from "../types";
import { apiError } from "../errors";
import { newId, nowIso } from "../utils";
import { bumpVersion } from "./crm";

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

export function assertTaskAccess(user: MockUser, task: Task): void {
  if (user.role === "consultant" && task.assigneeId !== user.id) {
    throw apiError.forbidden();
  }
}

export function scopeTaskAssigneeId(
  user: MockUser,
  requested?: string,
): string | undefined {
  if (user.role === "consultant") return user.id;
  return requested;
}

function startOfUtcDay(ms = Date.now()): number {
  const d = new Date(ms);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

export function taskDueBounds(nowMs = Date.now()): {
  now: number;
  startOfDay: number;
  endOfDay: number;
  endOfWeek: number;
} {
  const startOfDay = startOfUtcDay(nowMs);
  return {
    now: nowMs,
    startOfDay,
    endOfDay: startOfDay + DAY_MS,
    endOfWeek: startOfDay + 7 * DAY_MS,
  };
}

export function matchesDueFilter(
  task: Task,
  due: TaskDueFilter,
  bounds = taskDueBounds(),
  dueFrom?: string,
  dueTo?: string,
): boolean {
  const dueMs = new Date(task.dueAt).getTime();
  switch (due) {
    case "overdue":
      return task.status === "open" && dueMs < bounds.now;
    case "today":
      return (
        task.status === "open" &&
        dueMs >= bounds.startOfDay &&
        dueMs < bounds.endOfDay
      );
    case "week":
      return (
        task.status === "open" &&
        dueMs >= bounds.startOfDay &&
        dueMs < bounds.endOfWeek
      );
    case "upcoming":
      return task.status === "open" && dueMs >= bounds.endOfWeek;
    case "custom": {
      if (dueFrom && dueMs < new Date(dueFrom).getTime()) return false;
      if (dueTo && dueMs > new Date(dueTo).getTime()) return false;
      return true;
    }
    default:
      return true;
  }
}

export function computeTaskCounts(
  tasks: readonly Task[],
  nowMs = Date.now(),
): TaskCounts {
  const bounds = taskDueBounds(nowMs);
  let today = 0;
  let overdue = 0;
  let week = 0;
  let upcoming = 0;
  let done = 0;
  for (const task of tasks) {
    if (task.status === "done") {
      done += 1;
      continue;
    }
    if (task.status !== "open") continue;
    if (matchesDueFilter(task, "overdue", bounds)) overdue += 1;
    if (matchesDueFilter(task, "today", bounds)) today += 1;
    if (matchesDueFilter(task, "week", bounds)) week += 1;
    if (matchesDueFilter(task, "upcoming", bounds)) upcoming += 1;
  }
  return { today, overdue, week, upcoming, done };
}

export function resolveSnoozeUntil(
  input: TaskSnooze,
  nowMs = Date.now(),
): string {
  if (input.until) return input.until;
  const preset = input.preset as TaskSnoozePreset;
  const startTomorrow = startOfUtcDay(nowMs) + DAY_MS + 9 * HOUR_MS;
  switch (preset) {
    case "1h":
      return new Date(nowMs + HOUR_MS).toISOString();
    case "3h":
      return new Date(nowMs + 3 * HOUR_MS).toISOString();
    case "tomorrow":
      return new Date(startTomorrow).toISOString();
    case "next_week":
      return new Date(startOfUtcDay(nowMs) + 7 * DAY_MS + 9 * HOUR_MS).toISOString();
    default:
      throw apiError.validation({ preset: ["گزینه تعویق نامعتبر است"] });
  }
}

function activityBase(
  entityType: "lead" | "case",
  entityId: string,
  actorId: string,
  now: string,
) {
  return {
    id: newId(),
    entityType,
    entityId,
    leadId: entityType === "lead" ? entityId : undefined,
    actorId,
    authorId: actorId,
    createdAt: now,
  };
}

/** Build a task-related Activity (does not persist — use `emitTaskSideEffects`). */
export function buildTaskActivity(input: {
  task: Task;
  actorId: string;
  type: "task_created" | "task_done";
  now?: string;
}): Activity | null {
  const { task, actorId, type } = input;
  if (task.relatedType !== "lead" && task.relatedType !== "case") return null;
  if (!task.relatedId) return null;
  const now = input.now ?? nowIso();
  return {
    ...activityBase(task.relatedType, task.relatedId, actorId, now),
    type,
    taskId: task.id,
    body: task.title,
  };
}

/**
 * Persist task activity only (no audit). Prefer `emitTaskSideEffects` when
 * the mutation also needs AuditLog / Notification.
 */
export function writeTaskActivity(
  db: MockDb,
  input: {
    task: Task;
    actorId: string;
    type: "task_created" | "task_done";
    now?: string;
  },
): Activity | null {
  const activity = buildTaskActivity(input);
  if (!activity) return null;
  db.activities.insert(activity);
  if (input.task.relatedType === "lead" && input.task.relatedId) {
    const now = input.now ?? nowIso();
    db.leads.update(input.task.relatedId, {
      lastActivityAt: now,
      updatedAt: now,
    });
  }
  return activity;
}

export function emitTaskSideEffects(
  db: MockDb,
  input: {
    actorId: string;
    action: "create" | "update" | "delete";
    task: Task;
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
    activityType?: "task_created" | "task_done";
    notifications?: readonly DomainNotificationInput[];
    now?: string;
  },
): void {
  const activity = input.activityType
    ? buildTaskActivity({
        task: input.task,
        actorId: input.actorId,
        type: input.activityType,
        now: input.now,
      })
    : null;
  emitDomainEvent(db, {
    actorId: input.actorId,
    action: input.action,
    entityType: "task",
    entityId: input.task.id,
    diff:
      input.before || input.after
        ? { before: input.before ?? null, after: input.after ?? null }
        : null,
    activity,
    notifications: input.notifications,
    now: input.now,
  });
}

export function clearLeadFollowUpIfMatched(
  db: MockDb,
  task: Task,
  now: string,
): void {
  if (task.relatedType !== "lead" || !task.relatedId) return;
  const lead = db.leads.get(task.relatedId);
  if (!lead?.nextFollowUpAt) return;
  const followMs = new Date(lead.nextFollowUpAt).getTime();
  const dueMs = new Date(task.dueAt).getTime();
  if (Math.abs(followMs - dueMs) > 60_000) return;
  db.leads.update(lead.id, {
    nextFollowUpAt: null,
    updatedAt: now,
    version: bumpVersion(lead.version),
  });
}

function taskReminderLink(taskId: string): string {
  return `/admin/tasks?highlight=${taskId}`;
}

function hasTaskDueNotification(
  notifications: readonly Notification[],
  task: Task,
): boolean {
  const link = taskReminderLink(task.id);
  const legacy = `/admin/tasks/${task.id}`;
  return notifications.some(
    (n) =>
      n.userId === task.assigneeId &&
      n.type === "task_due" &&
      (n.link === link || n.link === legacy),
  );
}

/** Create at most one task_due notification per open task when remindAt/dueAt reached. */
export function processTaskReminders(
  db: MockDb,
  nowMs = Date.now(),
): number {
  const notifications = db.notifications.all();
  let created = 0;
  for (const task of db.tasks.all()) {
    if (task.status !== "open") continue;
    const triggerAt = task.remindAt ?? task.dueAt;
    if (new Date(triggerAt).getTime() > nowMs) continue;
    if (hasTaskDueNotification(notifications, task)) continue;
    const n = deliverNotification(db, {
      userId: task.assigneeId,
      type: "task_due",
      title: "یادآوری کار",
      body: task.title,
      link: taskReminderLink(task.id),
    });
    if (n) created += 1;
  }
  return created;
}

/** @deprecated Prefer `emitTaskSideEffects`. */
export function auditTaskMutation(
  db: MockDb,
  input: {
    actorId: string;
    action: "create" | "update" | "delete";
    task: Task;
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
  },
): void {
  emitTaskSideEffects(db, input);
}
