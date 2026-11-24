import type { TicketCategory, TicketStatus } from "@/contracts/tickets";

/** برچسب‌های دوستانه برای دانشجو */
export const STUDENT_TICKET_STATUS_FA: Record<TicketStatus, string> = {
  open: "باز",
  waiting_staff: "منتظر پاسخ ما",
  waiting_student: "منتظر پاسخ شما",
  closed: "بسته",
};

export const STUDENT_TICKET_CATEGORY_FA: Record<TicketCategory, string> = {
  documents: "مدارک",
  payment: "پرداخت",
  visa: "ویزا",
  apply: "اپلای",
  technical: "فنی / سایت",
  other: "سایر",
};
