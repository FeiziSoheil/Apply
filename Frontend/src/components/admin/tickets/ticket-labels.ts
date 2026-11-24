import type { StatusMap } from "@/components/admin/status-badge";
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type TicketCategory,
  type TicketPriority,
  type TicketStatus,
} from "@/contracts/tickets";

export const TICKET_STATUS_MAP: StatusMap<TicketStatus> = {
  open: { label: "باز", tone: "info" },
  waiting_staff: { label: "منتظر پشتیبانی", tone: "warning" },
  waiting_student: { label: "منتظر دانشجو", tone: "success" },
  closed: { label: "بسته", tone: "neutral" },
};

export const TICKET_PRIORITY_MAP: StatusMap<TicketPriority> = {
  low: { label: "کم", tone: "neutral" },
  normal: { label: "عادی", tone: "primary" },
  high: { label: "بالا", tone: "warning" },
  urgent: { label: "فوری", tone: "danger" },
};

export const TICKET_CATEGORY_LABELS: Record<TicketCategory, string> = {
  documents: "مدارک",
  payment: "پرداخت",
  visa: "ویزا",
  apply: "اپلای",
  technical: "فنی",
  other: "سایر",
};

export const TICKET_STATUS_FILTER_OPTIONS = TICKET_STATUSES.map((value) => ({
  value,
  label: TICKET_STATUS_MAP[value].label,
}));

export const TICKET_PRIORITY_FILTER_OPTIONS = TICKET_PRIORITIES.map((value) => ({
  value,
  label: TICKET_PRIORITY_MAP[value].label,
}));

export const TICKET_CATEGORY_FILTER_OPTIONS = TICKET_CATEGORIES.map((value) => ({
  value,
  label: TICKET_CATEGORY_LABELS[value],
}));
