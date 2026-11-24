import type { StatusMap } from "@/components/admin/status-badge";
import {
  PAYMENT_STATUSES,
  type PaymentStatus,
} from "@/contracts/payments";

export const INVOICE_STATUS_MAP: StatusMap<PaymentStatus> = {
  pending: { label: "در انتظار", tone: "warning" },
  partially_paid: { label: "پرداخت ناقص", tone: "info" },
  paid: { label: "پرداخت‌شده", tone: "success" },
  overdue: { label: "سررسید گذشته", tone: "danger" },
  cancelled: { label: "لغوشده", tone: "neutral" },
  refunded: { label: "بازپرداخت", tone: "neutral" },
};

export const INVOICE_STATUS_FILTER_OPTIONS = PAYMENT_STATUSES.map((status) => ({
  value: status,
  label: INVOICE_STATUS_MAP[status].label,
}));
