import {
  Bell,
  CalendarPlus,
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  FileMinus2,
  FileUp,
  GitBranch,
  Megaphone,
  MessageSquarePlus,
  MessageSquareReply,
  UserPlus,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import {
  NOTIFICATION_TYPES,
  type NotificationType,
} from "@/contracts/crm";

export type NotificationTypeMeta = {
  type: NotificationType;
  label: string;
  Icon: LucideIcon;
};

const META: Record<NotificationType, Omit<NotificationTypeMeta, "type">> = {
  lead_assigned: { label: "تخصیص سرنخ", Icon: UserPlus },
  lead_new: { label: "سرنخ جدید", Icon: Users },
  task_due: { label: "سررسید کار", Icon: ClipboardList },
  task_assigned: { label: "تخصیص کار", Icon: CheckCircle2 },
  booking_new: { label: "رزرو جدید", Icon: CalendarPlus },
  document_uploaded: { label: "بارگذاری مدرک", Icon: FileUp },
  document_approved: { label: "تأیید مدرک", Icon: FileCheck2 },
  document_rejected: { label: "رد مدرک", Icon: FileMinus2 },
  ticket_new: { label: "تیکت جدید", Icon: MessageSquarePlus },
  mention: { label: "اشاره", Icon: Bell },
  stage_changed: { label: "تغییر مرحله پرونده", Icon: GitBranch },
  installment_due: { label: "سررسید قسط", Icon: Wallet },
  ticket_reply: { label: "پاسخ تیکت", Icon: MessageSquareReply },
  appointment_reminder: { label: "یادآوری جلسه", Icon: CalendarPlus },
  announcement: { label: "اعلان موسسه", Icon: Megaphone },
};

export const NOTIFICATION_TYPE_META: readonly NotificationTypeMeta[] =
  NOTIFICATION_TYPES.map((type) => ({
    type,
    ...META[type],
  }));

export function getNotificationTypeMeta(
  type: NotificationType,
): NotificationTypeMeta {
  return { type, ...META[type] };
}
