import type { Role } from "@/contracts/auth";

/**
 * Permission catalog and role → permission map (single source of truth).
 *
 * Dependency-free on purpose (type import only): it is shared by the
 * contract (`src/contracts/auth.ts` → `CurrentUser.permissions`), the mock
 * API, the proxy-side helpers, server components and the client hooks.
 *
 * Permissions are `domain:action` and COARSE-GRAINED: they answer "may this
 * role do this kind of thing at all?". WHICH records the role may touch is the
 * ownership scope (`ROLE_SCOPES`) and is enforced by the API (the mock
 * handlers in `src/mocks/domain/access.ts` & co.; the real backend later).
 */
export const PERMISSIONS = [
  // Website content (countries, universities, programs, blog, FAQ …)
  "content:read",
  "content:write",
  "content:delete",
  // Sales leads
  "lead:read",
  "lead:write",
  "lead:assign",
  "lead:delete",
  "lead:import",
  "lead:export",
  "lead:merge",
  // Student cases — portal + legacy staff ops
  "student:read",
  "student:write",
  /** Move a case to another stage (sensitive status change) */
  "student:stage",
  // CRM case ops (staff); coexists with student:* for the student portal
  "case:read",
  "case:write",
  "case:review",
  // Case documents
  "document:upload",
  "document:review",
  // CRM tasks
  "task:read",
  "task:write",
  // Consultation bookings
  "booking:read",
  "booking:write",
  /** Change the status of any booking (confirm / complete / no-show) */
  "booking:manage",
  // Support tickets
  "ticket:read",
  "ticket:write",
  /** Update / assign tickets and write internal notes */
  "ticket:manage",
  // Invoices & installments
  "payment:read",
  /** Pay an own installment */
  "payment:write",
  /** Create / cancel invoices, mark installments as paid */
  "payment:manage",
  // Reports & CRM settings & audit
  "report:read",
  "crm-settings:manage",
  "audit:read",
  // Accounts of the system (staff & students)
  "user:manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/** `lead`, `student`, … — the part before the colon */
export type PermissionDomain = Permission extends `${infer Domain}:${string}`
  ? Domain
  : never;

/** Persian label of each permission (403 pages, audits, future role editor) */
export const PERMISSION_LABELS: Record<Permission, string> = {
  "content:read": "مشاهده محتوا",
  "content:write": "ایجاد و ویرایش محتوا",
  "content:delete": "حذف محتوا",
  "lead:read": "مشاهده سرنخ‌ها",
  "lead:write": "ویرایش سرنخ‌ها",
  "lead:assign": "تخصیص سرنخ به مشاور",
  "lead:delete": "حذف سرنخ",
  "lead:import": "ورود دسته‌ای سرنخ",
  "lead:export": "خروجی CSV سرنخ",
  "lead:merge": "ادغام سرنخ‌های تکراری",
  "student:read": "مشاهده پرونده‌ها",
  "student:write": "ویرایش پرونده‌ها",
  "student:stage": "تغییر مرحله پرونده",
  "case:read": "مشاهده پرونده‌های CRM",
  "case:write": "ویرایش پرونده‌های CRM",
  "case:review": "بررسی مدارک پرونده",
  "document:upload": "بارگذاری مدرک",
  "document:review": "بررسی مدارک",
  "task:read": "مشاهده کارها",
  "task:write": "ایجاد و ویرایش کارها",
  "booking:read": "مشاهده رزروها",
  "booking:write": "ثبت و لغو رزرو",
  "booking:manage": "تغییر وضعیت رزروها",
  "ticket:read": "مشاهده تیکت‌ها",
  "ticket:write": "ثبت تیکت و پاسخ",
  "ticket:manage": "مدیریت تیکت‌ها",
  "payment:read": "مشاهده پرداخت‌ها",
  "payment:write": "پرداخت قسط",
  "payment:manage": "مدیریت فاکتورها و اقساط",
  "report:read": "مشاهده گزارش‌های CRM",
  "crm-settings:manage": "تنظیمات CRM (پایپ‌لاین، قالب، قوانین)",
  "audit:read": "مشاهده گزارش حسابرسی",
  "user:manage": "مدیریت کاربران",
};

/* -------------------------------------------------------------------------- */
/*  Role → permissions                                                        */
/* -------------------------------------------------------------------------- */

/** admin: everything */
const ADMIN_PERMISSIONS: readonly Permission[] = PERMISSIONS;

/**
 * consultant: work on OWN leads / cases / tasks; export only own leads;
 * report:read scoped to self; no import, merge, crm-settings, or audit.
 */
const CONSULTANT_PERMISSIONS: readonly Permission[] = [
  "content:read",
  "lead:read",
  "lead:write",
  "lead:export",
  "student:read",
  "student:write",
  "student:stage",
  "case:read",
  "case:write",
  "case:review",
  "document:upload",
  "document:review",
  "task:read",
  "task:write",
  "booking:read",
  "booking:write",
  "booking:manage",
  "ticket:read",
  "ticket:write",
  "ticket:manage",
  "payment:read",
  "report:read",
];

/**
 * student: own data only — own case, documents, bookings, tickets and
 * installments. Nothing administrative.
 */
const STUDENT_PERMISSIONS: readonly Permission[] = [
  "student:read",
  "student:write",
  "document:upload",
  "booking:read",
  "booking:write",
  "ticket:read",
  "ticket:write",
  "payment:read",
  "payment:write",
];

export const ROLE_PERMISSIONS: Readonly<Record<Role, readonly Permission[]>> = {
  admin: ADMIN_PERMISSIONS,
  consultant: CONSULTANT_PERMISSIONS,
  student: STUDENT_PERMISSIONS,
};

/* -------------------------------------------------------------------------- */
/*  Ownership scopes                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Which records a permission applies to, per role and domain:
 * - `all`      every record
 * - `assigned` records assigned to the user (lead.assignedTo, case.consultantId,
 *              booking.consultantId, tickets of own cases, task.assigneeId)
 * - `own`      records the user owns / created (case.studentId, booking.userId,
 *              ticket.createdBy, invoice.studentId)
 * Domains not listed for a role carry no records for that role.
 */
export type OwnershipScope = "all" | "assigned" | "own";

export const ROLE_SCOPES: Readonly<
  Record<Role, Readonly<Partial<Record<PermissionDomain, OwnershipScope>>>>
> = {
  admin: {
    content: "all",
    lead: "all",
    student: "all",
    case: "all",
    document: "all",
    task: "all",
    booking: "all",
    ticket: "all",
    payment: "all",
    report: "all",
    "crm-settings": "all",
    audit: "all",
    user: "all",
  },
  consultant: {
    content: "all",
    lead: "assigned",
    student: "assigned",
    case: "assigned",
    document: "assigned",
    task: "assigned",
    booking: "assigned",
    ticket: "assigned",
    payment: "assigned",
    report: "assigned",
  },
  student: {
    student: "own",
    document: "own",
    booking: "own",
    ticket: "own",
    payment: "own",
  },
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const PERMISSION_SET: ReadonlySet<string> = new Set(PERMISSIONS);

export function isPermission(value: string): value is Permission {
  return PERMISSION_SET.has(value);
}

export function domainOf(permission: Permission): PermissionDomain {
  return permission.slice(0, permission.indexOf(":")) as PermissionDomain;
}

/** Permissions granted to a role (this is what `GET /me` returns) */
export function permissionsForRole(role: Role): Permission[] {
  return [...ROLE_PERMISSIONS[role]];
}

export function roleHasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/** Roles holding a permission (derives `x-roles` of a guarded endpoint) */
export function rolesWithPermission(permission: Permission): Role[] {
  return (Object.keys(ROLE_PERMISSIONS) as Role[]).filter((role) =>
    roleHasPermission(role, permission),
  );
}

/** Ownership scope of a role for the domain of `permission`; `null` = no records */
export function scopeFor(role: Role, permission: Permission): OwnershipScope | null {
  return ROLE_SCOPES[role][domainOf(permission)] ?? null;
}
