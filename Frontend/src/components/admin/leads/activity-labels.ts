import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  Calendar,
  FileText,
  MessageCircle,
  MessageSquare,
  NotebookPen,
  Phone,
  StickyNote,
  UserRound,
  CheckSquare,
  Mail,
  BookMarked,
  Settings2,
} from "lucide-react";
import type { StatusTone } from "@/components/admin/status-badge";
import type { ActivityType, CallOutcome } from "@/contracts/leads";

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  note: "یادداشت",
  call: "تماس",
  sms: "پیامک",
  whatsapp: "واتساپ",
  email: "ایمیل",
  meeting: "جلسه",
  stage_change: "تغییر مرحله",
  assignment: "تخصیص",
  task_created: "ایجاد کار",
  task_done: "تکمیل کار",
  booking_event: "رزرو",
  document_event: "مدرک",
  field_change: "تغییر فیلد",
  system: "سیستم",
};

export const ACTIVITY_TYPE_ICONS: Record<ActivityType, LucideIcon> = {
  note: StickyNote,
  call: Phone,
  sms: MessageSquare,
  whatsapp: MessageCircle,
  email: Mail,
  meeting: Calendar,
  stage_change: ArrowLeftRight,
  assignment: UserRound,
  task_created: CheckSquare,
  task_done: CheckSquare,
  booking_event: BookMarked,
  document_event: FileText,
  field_change: NotebookPen,
  system: Settings2,
};

export const ACTIVITY_TYPE_TONES: Record<ActivityType, StatusTone> = {
  note: "neutral",
  call: "info",
  sms: "primary",
  whatsapp: "success",
  email: "info",
  meeting: "warning",
  stage_change: "primary",
  assignment: "info",
  task_created: "warning",
  task_done: "success",
  booking_event: "primary",
  document_event: "neutral",
  field_change: "neutral",
  system: "neutral",
};

export const CALL_OUTCOME_LABELS: Record<CallOutcome, string> = {
  answered: "پاسخ داد",
  no_answer: "بی‌پاسخ",
  busy: "مشغول",
  wrong_number: "شماره اشتباه",
  callback_requested: "درخواست تماس مجدد",
};

export const START_TIME_LABELS: Record<string, string> = {
  nearest: "نزدیک‌ترین فرصت",
  six_months: "تا ۶ ماه",
  one_year: "حدود یک سال",
  undecided: "هنوز مشخص نیست",
};

export const ACTIVITY_FILTER_OPTIONS = (
  Object.keys(ACTIVITY_TYPE_LABELS) as ActivityType[]
).map((value) => ({
  value,
  label: ACTIVITY_TYPE_LABELS[value],
}));
