import type { StatusMap } from "@/components/admin/status-badge";
import type {
  BookingChangeAction,
  BookingStatus,
  ConsultationType,
} from "@/contracts/bookings";

export const BOOKING_STATUS_MAP: StatusMap<BookingStatus> = {
  pending: { label: "در انتظار", tone: "warning" },
  confirmed: { label: "تأییدشده", tone: "info" },
  completed: { label: "انجام‌شده", tone: "success" },
  cancelled: { label: "لغوشده", tone: "neutral" },
  no_show: { label: "عدم حضور", tone: "danger" },
};

export const BOOKING_STATUS_FILTER_OPTIONS = (
  Object.keys(BOOKING_STATUS_MAP) as BookingStatus[]
).map((value) => ({
  value,
  label: BOOKING_STATUS_MAP[value].label,
}));

/** Statuses staff can set via `PATCH /bookings/{id}/status` */
export const BOOKING_STATUS_SET_OPTIONS = (
  ["confirmed", "completed", "cancelled", "no_show"] as const satisfies readonly BookingStatus[]
).map((value) => ({
  value,
  label: BOOKING_STATUS_MAP[value].label,
}));

export const CONSULTATION_TYPE_LABELS: Record<ConsultationType, string> = {
  in_person: "حضوری",
  online: "آنلاین",
};

export const CONSULTATION_TYPE_OPTIONS = (
  Object.keys(CONSULTATION_TYPE_LABELS) as ConsultationType[]
).map((value) => ({
  value,
  label: CONSULTATION_TYPE_LABELS[value],
}));

export const BOOKING_CHANGE_LABELS: Record<BookingChangeAction, string> = {
  created: "ایجاد",
  status_changed: "تغییر وضعیت",
  rescheduled: "جابه‌جایی زمان",
  reassigned: "تغییر مشاور",
  notes_updated: "به‌روزرسانی یادداشت",
  cancelled: "لغو",
  reminder_sent: "ارسال یادآوری",
};

/** Tailwind background tokens for calendar blocks by status */
export const BOOKING_STATUS_BLOCK_CLASS: Record<BookingStatus, string> = {
  pending: "bg-warning/25 text-warning-foreground border-warning/40",
  confirmed: "bg-info/20 text-info border-info/40",
  completed: "bg-success/20 text-success border-success/40",
  cancelled: "bg-muted text-muted-foreground border-border",
  no_show: "bg-destructive/15 text-destructive border-destructive/30",
};

export const WEEKDAY_LABELS = [
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
  "شنبه",
] as const;
