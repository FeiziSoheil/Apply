import type { TaskPriority, TaskStatus } from "@/contracts/crm";

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "کم",
  normal: "عادی",
  high: "بالا",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  open: "باز",
  done: "تکمیل‌شده",
  cancelled: "لغوشده",
};

export const TASK_RELATED_TYPE_LABELS = {
  lead: "لید",
  case: "پرونده",
  booking: "رزرو",
  none: "بدون ارتباط",
} as const;

export const TASK_TAB_LABELS = {
  today: "امروز",
  overdue: "سررسیدگذشته",
  week: "این هفته",
  upcoming: "بعدی",
  done: "تکمیل‌شده",
} as const;

export type TaskTabKey = keyof typeof TASK_TAB_LABELS;

export const SNOOZE_OPTIONS = [
  { preset: "1h" as const, label: "۱ ساعت بعد" },
  { preset: "3h" as const, label: "۳ ساعت بعد" },
  { preset: "tomorrow" as const, label: "فردا صبح" },
  { preset: "next_week" as const, label: "هفته بعد" },
];

export const REMINDER_OFFSET_LABELS = {
  none: "بدون یادآور",
  "15m": "۱۵ دقیقه قبل",
  "1h": "۱ ساعت قبل",
  "1d": "۱ روز قبل",
  custom: "سفارشی",
} as const;
