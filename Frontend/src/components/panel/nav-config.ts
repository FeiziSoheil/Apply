import {
  Award,
  Bell,
  BookOpenText,
  CalendarClock,
  CheckSquare,
  FileText,
  FolderOpen,
  Globe2,
  GraduationCap,
  HelpCircle,
  Landmark,
  LayoutDashboard,
  LifeBuoy,
  Megaphone,
  MessagesSquare,
  Newspaper,
  Plus,
  ScrollText,
  Settings,
  Shield,
  Briefcase,
  UserCircle,
  UserCog,
  UserPlus,
  Users,
  Wallet,
  CreditCard,
  type LucideIcon,
} from "lucide-react";
import { AREA_LABELS } from "@/lib/auth/role-labels";
import type { AuthArea } from "@/lib/auth/routes";
import type { PermissionGated } from "@/lib/rbac/nav";
import type { Permission } from "@/lib/rbac/permissions";

/**
 * Single source of truth of the signed-in areas' navigation. The sidebar, the
 * mobile sheet, the command palette (Ctrl/Cmd+K), the breadcrumb and the
 * placeholder pages are all generated from `NAV_CONFIG`.
 *
 * Each entry names the permission(s) it needs; entries the user lacks are
 * hidden (see `useVisibleGroups` → `filterByPermission`). Pages that are not
 * built yet are served by the `[...slug]` placeholder route, which also
 * enforces the same permission (a direct URL cannot bypass the hidden entry)
 * and shows example sensitive actions behind `<Can>` (`actions`).
 */

/** A sensitive action shown (disabled demo) on the section's placeholder page */
export type SectionAction = {
  id: string;
  label: string;
  permission: Permission;
  /** Visual weight: destructive actions are red */
  tone?: "default" | "destructive";
};

/** Primary button of the section's `PageHeader` (demo: announces "coming soon") */
export type HeaderAction = {
  label: string;
  icon?: LucideIcon;
  /** Hidden for users lacking it; omitted = always shown */
  permission?: Permission;
};

export type NavItem = PermissionGated & {
  /**
   * URL path below the area root (`"leads"`, `"content/countries"`);
   * `null` = the area's dashboard
   */
  slug: string | null;
  label: string;
  /** What the section will offer — shown in its `PageHeader` */
  description: string;
  icon: LucideIcon;
  headerAction?: HeaderAction;
  actions?: readonly SectionAction[];
  /**
   * Nested sections under this item (e.g. blog categories). Kept for routing,
   * breadcrumbs and placeholders — not shown in the sidebar or command palette.
   */
  children?: readonly NavItem[];
};

export type NavGroup = {
  id: string;
  /** Group heading; omitted for the leading, unlabeled group */
  label?: string;
  /** Parent menu icon when the group is rendered as a collapsible menu */
  icon?: LucideIcon;
  /**
   * Path segment shared by all items of the group (`"content"`). The path
   * itself redirects to the group's first item and is a breadcrumb step.
   */
  basePath?: string;
  /** Routed and permission-checked like the rest, but not listed in menus */
  hidden?: boolean;
  items: readonly NavItem[];
};

const ADMIN_NAV: readonly NavGroup[] = [
  {
    id: "overview",
    items: [
      {
        slug: null,
        label: "داشبورد",
        description: "نمای کلی فعالیت‌ها، آمار و آخرین رویدادها.",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    id: "operations",
    label: "عملیات",
    icon: Briefcase,
    items: [
      {
        slug: "leads",
        label: "لیدها",
        description:
          "فهرست و پیگیری سرنخ‌های فروش؛ مشاور فقط لیدهای اختصاص‌یافته به خودش را می‌بیند.",
        icon: Users,
        permissions: ["lead:read"],
        headerAction: {
          label: "ثبت لید جدید",
          icon: Plus,
          permission: "lead:write",
        },
        actions: [
          { id: "assign", label: "تخصیص به مشاور", permission: "lead:assign" },
          { id: "status", label: "تغییر وضعیت لید", permission: "lead:write" },
          {
            id: "delete",
            label: "حذف لید",
            permission: "lead:delete",
            tone: "destructive",
          },
        ],
      },
      {
        slug: "cases",
        label: "پرونده‌ها",
        description:
          "مراحل پرونده، چک‌لیست و مدارک؛ مشاور فقط پرونده‌های اختصاص‌یافته را می‌بیند.",
        icon: FolderOpen,
        permissions: ["case:read"],
        actions: [
          {
            id: "stage",
            label: "تغییر مرحله پرونده",
            permission: "case:write",
          },
          {
            id: "review",
            label: "تأیید یا رد مدرک",
            permission: "case:review",
          },
        ],
      },
      {
        slug: "bookings",
        label: "رزروها",
        description:
          "فهرست و تقویم نوبت‌های مشاوره؛ مشاور فقط رزروهای خودش را می‌بیند.",
        icon: CalendarClock,
        permissions: ["booking:read"],
        actions: [
          {
            id: "status",
            label: "تغییر وضعیت رزرو",
            permission: "booking:manage",
          },
          {
            id: "create",
            label: "ایجاد دستی رزرو",
            permission: "booking:write",
          },
        ],
      },
      {
        slug: "tasks",
        label: "کارهای من",
        description:
          "فهرست، تقویم و یادآور کارها؛ مشاور فقط کارهای خودش را می‌بیند.",
        icon: CheckSquare,
        permissions: ["task:read"],
        headerAction: {
          label: "کار جدید",
          icon: Plus,
          permission: "task:write",
        },
        actions: [
          {
            id: "complete",
            label: "تکمیل کار",
            permission: "task:write",
          },
          {
            id: "reassign",
            label: "تغییر مسئول",
            permission: "task:write",
          },
        ],
      },
      {
        slug: "reports",
        label: "گزارش‌ها",
        description:
          "قیف پایپ‌لاین، منابع و عملکرد؛ مشاور فقط آمار خودش را می‌بیند.",
        icon: ScrollText,
        permissions: ["report:read"],
      },
    ],
  },
  {
    id: "content",
    label: "محتوا",
    icon: Newspaper,
    basePath: "content",
    items: [
      {
        slug: "content/countries",
        label: "کشورها",
        description: "مدیریت صفحه کشورها و اطلاعات مقصدهای تحصیلی.",
        icon: Globe2,
        permissions: ["content:read"],
        headerAction: {
          label: "افزودن کشور",
          icon: Plus,
          permission: "content:write",
        },
        actions: [
          { id: "create", label: "ایجاد کشور", permission: "content:write" },
          {
            id: "delete",
            label: "حذف کشور",
            permission: "content:delete",
            tone: "destructive",
          },
        ],
      },
      {
        slug: "content/universities",
        label: "دانشگاه‌ها",
        description: "فهرست دانشگاه‌ها، رتبه‌ها و شرایط پذیرش.",
        icon: Landmark,
        permissions: ["content:read"],
        headerAction: {
          label: "افزودن دانشگاه",
          icon: Plus,
          permission: "content:write",
        },
        actions: [
          { id: "create", label: "ایجاد دانشگاه", permission: "content:write" },
          {
            id: "delete",
            label: "حذف دانشگاه",
            permission: "content:delete",
            tone: "destructive",
          },
        ],
      },
      {
        slug: "content/programs",
        label: "برنامه‌ها",
        description: "برنامه‌های تحصیلی، هزینه‌ها و مهلت‌های اقدام.",
        icon: GraduationCap,
        permissions: ["content:read"],
        headerAction: {
          label: "افزودن برنامه",
          icon: Plus,
          permission: "content:write",
        },
        actions: [
          { id: "create", label: "ایجاد برنامه", permission: "content:write" },
          {
            id: "delete",
            label: "حذف برنامه",
            permission: "content:delete",
            tone: "destructive",
          },
        ],
      },
      {
        slug: "content/blog",
        label: "وبلاگ",
        description: "مقاله‌های وبلاگ، دسته‌ها، برچسب‌ها و انتشار.",
        icon: BookOpenText,
        permissions: ["content:read"],
        headerAction: {
          label: "نوشتن مقاله",
          icon: Plus,
          permission: "content:write",
        },
        actions: [
          { id: "create", label: "ایجاد مقاله", permission: "content:write" },
          {
            id: "delete",
            label: "حذف مقاله",
            permission: "content:delete",
            tone: "destructive",
          },
        ],
        children: [
          {
            slug: "content/blog/categories",
            label: "دسته‌های وبلاگ",
            description: "دسته‌بندی مقالات وبلاگ.",
            icon: FolderOpen,
            permissions: ["content:read"],
            headerAction: {
              label: "افزودن دسته",
              icon: Plus,
              permission: "content:write",
            },
            actions: [
              {
                id: "create",
                label: "ایجاد دسته",
                permission: "content:write",
              },
              {
                id: "delete",
                label: "حذف دسته",
                permission: "content:delete",
                tone: "destructive",
              },
            ],
          },
        ],
      },
      {
        slug: "content/news",
        label: "اخبار",
        description: "اخبار، وبینارها، نمایشگاه‌ها و اطلاعیه‌ها.",
        icon: Newspaper,
        permissions: ["content:read"],
        headerAction: {
          label: "افزودن خبر",
          icon: Plus,
          permission: "content:write",
        },
        actions: [
          { id: "create", label: "ایجاد خبر", permission: "content:write" },
          {
            id: "delete",
            label: "حذف خبر",
            permission: "content:delete",
            tone: "destructive",
          },
        ],
      },
      {
        slug: "content/announcements",
        label: "اعلان‌های پنل",
        description: "اعلان‌های ساده برای دانشجویان (همه یا بر اساس کشور).",
        icon: Megaphone,
        permissions: ["content:read"],
        headerAction: {
          label: "افزودن اعلان",
          icon: Plus,
          permission: "content:write",
        },
        actions: [
          { id: "create", label: "ایجاد اعلان", permission: "content:write" },
          {
            id: "delete",
            label: "حذف اعلان",
            permission: "content:delete",
            tone: "destructive",
          },
        ],
      },
      {
        slug: "content/services",
        label: "خدمات",
        description: "خدمات موسسه، بسته‌ها و توضیحات هر خدمت.",
        icon: Briefcase,
        permissions: ["content:read"],
        headerAction: {
          label: "افزودن خدمت",
          icon: Plus,
          permission: "content:write",
        },
        actions: [
          { id: "create", label: "ایجاد خدمت", permission: "content:write" },
          {
            id: "delete",
            label: "حذف خدمت",
            permission: "content:delete",
            tone: "destructive",
          },
        ],
      },
      {
        slug: "content/consultants",
        label: "مشاوران",
        description: "مشاوران موسسه، کشورهای تحت پوشش و نمایش در صفحه تیم.",
        icon: UserCog,
        permissions: ["content:read"],
        headerAction: {
          label: "افزودن مشاور",
          icon: Plus,
          permission: "content:write",
        },
        actions: [
          { id: "create", label: "ایجاد مشاور", permission: "content:write" },
          {
            id: "delete",
            label: "حذف مشاور",
            permission: "content:delete",
            tone: "destructive",
          },
        ],
      },
      {
        slug: "content/success-stories",
        label: "داستان‌های موفقیت",
        description: "داستان دانشجویان، رضایت انتشار و ترتیب نمایش.",
        icon: Award,
        permissions: ["content:read"],
        headerAction: {
          label: "افزودن داستان موفقیت",
          icon: Plus,
          permission: "content:write",
        },
        actions: [
          { id: "create", label: "ایجاد داستان موفقیت", permission: "content:write" },
          {
            id: "delete",
            label: "حذف داستان موفقیت",
            permission: "content:delete",
            tone: "destructive",
          },
        ],
      },
      {
        slug: "content/faqs",
        label: "پرسش‌های متداول",
        description: "پرسش و پاسخ‌های عمومی و ترتیب نمایش در سایت.",
        icon: HelpCircle,
        permissions: ["content:read"],
        headerAction: {
          label: "افزودن پرسش",
          icon: Plus,
          permission: "content:write",
        },
        actions: [
          { id: "create", label: "ایجاد پرسش", permission: "content:write" },
          {
            id: "delete",
            label: "حذف پرسش",
            permission: "content:delete",
            tone: "destructive",
          },
        ],
      },
    ],
  },
  {
    id: "support",
    label: "پشتیبانی و مالی",
    icon: LifeBuoy,
    items: [
      {
        slug: "tickets",
        label: "تیکت‌ها",
        description: "پاسخ به درخواست‌های پشتیبانی دانشجویان.",
        icon: LifeBuoy,
        permissions: ["ticket:read"],
        actions: [
          {
            id: "assign",
            label: "تخصیص یا تغییر وضعیت تیکت",
            permission: "ticket:manage",
          },
        ],
      },
      {
        slug: "finance",
        label: "مالی",
        description: "فاکتورها، اقساط و وضعیت پرداخت‌ها.",
        icon: Wallet,
        permissions: ["payment:read"],
        headerAction: {
          label: "صدور فاکتور",
          icon: Plus,
          permission: "payment:manage",
        },
        actions: [
          {
            id: "invoice",
            label: "صدور فاکتور",
            permission: "payment:manage",
          },
          {
            id: "mark-paid",
            label: "ثبت دستی پرداخت قسط",
            permission: "payment:manage",
          },
        ],
      },
    ],
  },
  {
    id: "system",
    label: "سیستم",
    icon: Settings,
    items: [
      {
        slug: "users",
        label: "کاربران",
        description: "مدیریت حساب مدیران و مشاوران؛ دعوت، نقش و وضعیت.",
        icon: UserCog,
        permissions: ["user:manage"],
        headerAction: {
          label: "دعوت کاربر",
          icon: UserPlus,
          permission: "user:manage",
        },
        actions: [
          { id: "invite", label: "دعوت کاربر", permission: "user:manage" },
          {
            id: "deactivate",
            label: "غیرفعال کردن کاربر",
            permission: "user:manage",
            tone: "destructive",
          },
        ],
      },
      {
        slug: "requests",
        label: "درخواست‌های کاربران",
        description: "پردازش و تعیین تکلیف درخواست‌های حریم خصوصی و حذف حساب.",
        icon: Shield,
        permissions: ["user:manage"],
      },
      {
        slug: "settings/institute",
        label: "تنظیمات موسسه",
        description:
          "اطلاعات موسسه، تماس، شبکه‌های اجتماعی، مجوزها، SEO و قالب پیامک.",
        icon: Settings,
        permissions: ["user:manage"],
      },
      {
        slug: "settings/crm",
        label: "تنظیمات CRM",
        description:
          "پایپ‌لاین، دلایل ریزش، تگ‌ها، قوانین تخصیص، قالب پیام و پرونده، هزینه کمپین و پیش‌فرض‌ها.",
        icon: Settings,
        permissions: ["crm-settings:manage"],
      },
      {
        slug: "settings/availability",
        label: "ساعات کاری",
        description:
          "برنامه هفتگی مشاوران، مدت جلسه، مرخصی و تعطیلات سراسری.",
        icon: CalendarClock,
        permissions: ["user:manage"],
      },
      {
        slug: "settings/audit",
        label: "گزارش حسابرسی",
        description:
          "لاگ تغییرات سیستم با فیلتر، جزئیات اختلاف و خروجی CSV.",
        icon: ScrollText,
        permissions: ["audit:read"],
      },
    ],
  },
  {
    id: "account",
    label: "حساب کاربری",
    icon: UserCircle,
    items: [
      {
        slug: "notifications",
        label: "اعلان‌ها",
        description: "فهرست اعلان‌ها، فیلتر و علامت‌گذاری خوانده‌شده.",
        icon: Bell,
      },
      {
        slug: "profile",
        label: "پروفایل من",
        description: "نام، رمز عبور، نشست‌ها و ترجیحات اعلان.",
        icon: UserCircle,
      },
    ],
  },
];

const PANEL_NAV: readonly NavGroup[] = [
  {
    id: "overview",
    items: [
      {
        slug: null,
        label: "خانه",
        description: "قدم بعدی، کارها، پیشرفت و مشاور شما.",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    id: "case",
    label: "پرونده",
    icon: FolderOpen,
    items: [
      {
        slug: "case",
        label: "پرونده من",
        description: "مرحله فعلی پرونده و تاریخچه.",
        icon: BookOpenText,
        permissions: ["student:read"],
      },
      {
        slug: "documents",
        label: "مدارک",
        description: "بارگذاری و پیگیری بررسی مدارک.",
        icon: FileText,
        permissions: ["document:upload"],
        headerAction: {
          label: "بارگذاری مدرک",
          icon: Plus,
          permission: "document:upload",
        },
        actions: [
          {
            id: "upload",
            label: "بارگذاری مدرک",
            permission: "document:upload",
          },
        ],
      },
    ],
  },
  {
    id: "support",
    label: "پشتیبانی و پرداخت",
    icon: MessagesSquare,
    items: [
      {
        slug: "tickets",
        label: "پیام‌ها",
        description: "ارتباط با مشاور و پشتیبانی.",
        icon: MessagesSquare,
        permissions: ["ticket:read"],
        headerAction: {
          label: "ثبت تیکت جدید",
          icon: Plus,
          permission: "ticket:write",
        },
        actions: [
          { id: "new", label: "ثبت تیکت جدید", permission: "ticket:write" },
        ],
      },
      {
        slug: "payments",
        label: "پرداخت‌ها",
        description: "فاکتورها و اقساط شما.",
        icon: CreditCard,
        permissions: ["payment:read"],
        actions: [
          { id: "pay", label: "پرداخت قسط", permission: "payment:write" },
        ],
      },
      {
        slug: "bookings",
        label: "رزروها",
        description: "جلسات مشاوره رزرو‌شده.",
        icon: CalendarClock,
        permissions: ["booking:read"],
      },
    ],
  },
  {
    id: "account",
    label: "حساب کاربری",
    icon: UserCircle,
    items: [
      {
        slug: "shortlist",
        label: "علاقه‌مندی‌ها",
        description: "برنامه‌ها و دانشگاه‌های ذخیره‌شده.",
        icon: Award,
        permissions: ["student:read"],
      },
      {
        slug: "profile",
        label: "پروفایل",
        description: "اطلاعات حساب کاربری و تنظیمات شخصی شما.",
        icon: UserCircle,
      },
      {
        slug: "help",
        label: "راهنما",
        description: "راهنمای کوتاه کار با پنل دانشجو.",
        icon: HelpCircle,
      },
    ],
  },
];

export const NAV_CONFIG: Record<AuthArea, readonly NavGroup[]> = {
  admin: ADMIN_NAV,
  panel: PANEL_NAV,
};

export const AREA_BASE_PATH: Record<AuthArea, string> = {
  admin: "/admin",
  panel: "/panel",
};

/** Where the user menu's «پروفایل» entry leads */
export const PROFILE_SLUG = "profile";

export function navHref(area: AuthArea, item: NavItem): string {
  return item.slug
    ? `${AREA_BASE_PATH[area]}/${item.slug}`
    : AREA_BASE_PATH[area];
}

export function profileHref(area: AuthArea): string {
  return `${AREA_BASE_PATH[area]}/${PROFILE_SLUG}`;
}

/** Parent + nested children (depth-first) for lookup / static params */
export function flattenNavItems(items: readonly NavItem[]): NavItem[] {
  return items.flatMap((item) => [
    item,
    ...(item.children ? flattenNavItems(item.children) : []),
  ]);
}

function allItems(area: AuthArea): NavItem[] {
  return NAV_CONFIG[area].flatMap((group) => flattenNavItems(group.items));
}

/** Path segments of every routed section (for `generateStaticParams`) */
export function sectionSlugs(area: AuthArea): string[][] {
  return allItems(area).flatMap((item) =>
    item.slug ? [item.slug.split("/")] : [],
  );
}

/** `slug` is the path below the area root, e.g. `"content/countries"` */
export function findSection(area: AuthArea, slug: string): NavItem | undefined {
  return allItems(area).find((item) => item.slug === slug);
}

/** The group whose landing path is `slug` (e.g. `"content"`) */
export function findGroupByBasePath(
  area: AuthArea,
  slug: string,
): NavGroup | undefined {
  return NAV_CONFIG[area].find((group) => group.basePath === slug);
}

export type PanelCrumb = {
  label: string;
  /** Omitted for the current page */
  href?: string;
};

/**
 * Breadcrumb trail of `pathname`, derived from `NAV_CONFIG`:
 * area root → (group) → section. Unknown paths end with a generic step.
 */
export function buildBreadcrumbs(
  area: AuthArea,
  pathname: string,
): PanelCrumb[] {
  const base = AREA_BASE_PATH[area];
  const root: PanelCrumb = { label: AREA_LABELS[area], href: base };
  const path = pathname.replace(/\/+$/, "") || "/";

  if (path === base) return [root, { label: "داشبورد" }];
  if (!path.startsWith(`${base}/`)) return [root];

  const slug = path.slice(base.length + 1);

  const groupLanding = findGroupByBasePath(area, slug);
  if (groupLanding?.label) return [root, { label: groupLanding.label }];

  for (const group of NAV_CONFIG[area]) {
    for (const item of group.items) {
      const trail: PanelCrumb[] = [root];
      if (group.basePath && group.label) {
        trail.push({
          label: group.label,
          href: `${base}/${group.basePath}`,
        });
      }

      if (item.slug === slug) {
        trail.push({ label: item.label });
        return trail;
      }

      const child = item.children?.find((entry) => entry.slug === slug);
      if (child && item.slug) {
        trail.push({ label: item.label, href: `${base}/${item.slug}` });
        trail.push({ label: child.label });
        return trail;
      }
    }
  }

  return [root, { label: "صفحه پیدا نشد" }];
}
