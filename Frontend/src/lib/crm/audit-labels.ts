import {
  AUDIT_ACTIONS,
  type AuditAction,
} from "@/contracts/crm";

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  create: "ایجاد",
  update: "ویرایش",
  delete: "حذف",
  assign: "تخصیص",
  stage_change: "تغییر مرحله",
  import: "ورود داده",
  export: "خروجی",
  merge: "ادغام",
  login: "ورود",
  permission_change: "تغییر دسترسی",
};

export const AUDIT_ACTION_OPTIONS = AUDIT_ACTIONS.map((action) => ({
  value: action,
  label: AUDIT_ACTION_LABELS[action],
}));

export const AUDIT_ENTITY_TYPE_LABELS: Record<string, string> = {
  lead: "سرنخ",
  task: "کار",
  case: "پرونده",
  document: "مدرک",
  user: "کاربر",
  settings: "تنظیمات",
  audit_log: "گزارش حسابرسی",
  booking: "رزرو",
};

export function auditEntityHref(
  entityType: string,
  entityId: string | null,
): string | null {
  if (!entityId) return null;
  switch (entityType) {
    case "lead":
      return `/admin/leads/${entityId}`;
    case "case":
      return `/admin/cases/${entityId}`;
    case "task":
      return `/admin/tasks?highlight=${entityId}`;
    case "document":
      return `/admin/cases`;
    case "user":
      return `/admin/users`;
    case "privacy_request":
      return `/admin/requests`;
    case "settings":
      return `/admin/settings/institute`;
    default:
      return null;
  }
}
