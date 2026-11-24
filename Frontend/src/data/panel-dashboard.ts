import {
  CalendarClock,
  CheckCircle2,
  CreditCard,
  FileCheck2,
  FolderOpen,
  LifeBuoy,
  MessagesSquare,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/contracts/auth";
import type { PermissionGated } from "@/lib/rbac/nav";

/**
 * Mock data of the `/admin` and `/panel` dashboards. Shaped like what the real
 * reporting endpoints will return, so the views can switch to API data later.
 * Numbers are pre-formatted Persian strings (display only).
 */

export type DashboardStat = PermissionGated & {
  id: string;
  label: string;
  value: string;
  /** Secondary line under the value */
  hint: string;
  /** Change vs. the previous period */
  trend?: { label: string; direction: "up" | "down" };
  icon: LucideIcon;
};

export type DashboardActivity = {
  id: string;
  title: string;
  description: string;
  time: string;
  icon: LucideIcon;
};

/** One row of the chart; every key besides `label` is a numeric series */
export type ChartDatum = { label: string } & Record<string, number | string>;

export type DashboardChartData = {
  title: string;
  description: string;
  variant: "bar" | "area";
  /** Series keys in `data` with their legend labels */
  series: readonly { key: string; label: string }[];
  data: readonly ChartDatum[];
};

export type DashboardData = {
  stats: readonly DashboardStat[];
  chart: DashboardChartData;
  activity: readonly DashboardActivity[];
};

const ADMIN_DASHBOARD: DashboardData = {
  stats: [
    {
      id: "leads",
      label: "لیدهای جدید ماه",
      value: "۱۸۶",
      hint: "نسبت به ماه قبل",
      trend: { label: "۱۲٪", direction: "up" },
      icon: Users,
      permissions: ["lead:read"],
    },
    {
      id: "cases",
      label: "پرونده‌های فعال",
      value: "۱۲۴",
      hint: "۱۸ پرونده در مرحله ویزا",
      trend: { label: "۵٪", direction: "up" },
      icon: FolderOpen,
      permissions: ["student:read"],
    },
    {
      id: "bookings",
      label: "رزروهای امروز",
      value: "۸",
      hint: "۳ نوبت در انتظار تأیید",
      icon: CalendarClock,
      permissions: ["booking:read"],
    },
    {
      id: "revenue",
      label: "درآمد ماه",
      value: "۴۸۰ میلیون تومان",
      hint: "۱۶۰ میلیون تومان معوق",
      trend: { label: "۸٪", direction: "up" },
      icon: Wallet,
      permissions: ["payment:manage"],
    },
  ],
  chart: {
    title: "لیدهای شش ماه اخیر",
    description: "تعداد لیدهای ثبت‌شده و تبدیل‌شده به پرونده",
    variant: "bar",
    series: [
      { key: "leads", label: "لید جدید" },
      { key: "converted", label: "تبدیل‌شده" },
    ],
    data: [
      { label: "فروردین", leads: 128, converted: 41 },
      { label: "اردیبهشت", leads: 142, converted: 48 },
      { label: "خرداد", leads: 135, converted: 52 },
      { label: "تیر", leads: 160, converted: 57 },
      { label: "مرداد", leads: 171, converted: 63 },
      { label: "شهریور", leads: 186, converted: 71 },
    ],
  },
  activity: [
    {
      id: "1",
      title: "لید جدید از فرم ارزیابی",
      description: "مریم احمدی — تحصیل کارشناسی ارشد در آلمان",
      time: "۵ دقیقه پیش",
      icon: Users,
    },
    {
      id: "2",
      title: "تیکت جدید ثبت شد",
      description: "پرسش درباره مهلت ارسال مدارک پذیرش",
      time: "۲۰ دقیقه پیش",
      icon: LifeBuoy,
    },
    {
      id: "3",
      title: "مدرک تأیید شد",
      description: "ریزنمرات ریحانه کریمی توسط مشاور تأیید شد",
      time: "۱ ساعت پیش",
      icon: FileCheck2,
    },
    {
      id: "4",
      title: "پرداخت قسط ثبت شد",
      description: "قسط دوم پرونده ۱۰۴۲ به مبلغ ۳۰ میلیون تومان",
      time: "۳ ساعت پیش",
      icon: CreditCard,
    },
    {
      id: "5",
      title: "رزرو جدید",
      description: "مشاوره حضوری فردا ساعت ۱۰ صبح",
      time: "دیروز",
      icon: CalendarClock,
    },
  ],
};

const CONSULTANT_DASHBOARD: DashboardData = {
  stats: [
    {
      id: "leads",
      label: "لیدهای من",
      value: "۲۴",
      hint: "۶ لید نیازمند پیگیری",
      trend: { label: "۴٪", direction: "up" },
      icon: Users,
      permissions: ["lead:read"],
    },
    {
      id: "cases",
      label: "پرونده‌های من",
      value: "۲۶",
      hint: "۵ پرونده در مرحله بررسی مدارک",
      icon: FolderOpen,
      permissions: ["student:read"],
    },
    {
      id: "bookings",
      label: "رزروهای امروز من",
      value: "۳",
      hint: "نوبت بعدی ساعت ۱۱:۳۰",
      icon: CalendarClock,
      permissions: ["booking:read"],
    },
    {
      id: "tickets",
      label: "تیکت‌های باز",
      value: "۵",
      hint: "۲ تیکت بدون پاسخ",
      trend: { label: "۱ مورد", direction: "down" },
      icon: LifeBuoy,
      permissions: ["ticket:read"],
    },
  ],
  chart: {
    title: "پرونده‌های من در شش ماه اخیر",
    description: "روند پرونده‌های جدید و پرونده‌های نهایی‌شده",
    variant: "area",
    series: [
      { key: "opened", label: "پرونده جدید" },
      { key: "closed", label: "نهایی‌شده" },
    ],
    data: [
      { label: "فروردین", opened: 4, closed: 2 },
      { label: "اردیبهشت", opened: 6, closed: 3 },
      { label: "خرداد", opened: 5, closed: 4 },
      { label: "تیر", opened: 8, closed: 4 },
      { label: "مرداد", opened: 7, closed: 6 },
      { label: "شهریور", opened: 9, closed: 6 },
    ],
  },
  activity: [
    {
      id: "1",
      title: "لید جدید به شما اختصاص یافت",
      description: "علی رضایی — تحصیل در کانادا",
      time: "۱۰ دقیقه پیش",
      icon: Users,
    },
    {
      id: "2",
      title: "مدرک جدید برای بررسی",
      description: "گواهی زبان ریحانه کریمی بارگذاری شد",
      time: "۱ ساعت پیش",
      icon: FileCheck2,
    },
    {
      id: "3",
      title: "پیام جدید از دانشجو",
      description: "پرسش درباره زمان‌بندی مصاحبه ویزا",
      time: "۲ ساعت پیش",
      icon: MessagesSquare,
    },
    {
      id: "4",
      title: "مرحله پرونده تغییر کرد",
      description: "پرونده ۱۰۳۸ به مرحله «ارسال درخواست» رفت",
      time: "دیروز",
      icon: CheckCircle2,
    },
  ],
};

const STUDENT_DASHBOARD: DashboardData = {
  stats: [
    {
      id: "stage",
      label: "مرحله فعلی پرونده",
      value: "بررسی مدارک",
      hint: "مرحله ۳ از ۷",
      icon: FolderOpen,
      permissions: ["student:read"],
    },
    {
      id: "documents",
      label: "مدارک تأییدشده",
      value: "۵ از ۸",
      hint: "۲ مدرک در انتظار بررسی",
      icon: FileCheck2,
      permissions: ["document:upload"],
    },
    {
      id: "tickets",
      label: "پیام‌های خوانده‌نشده",
      value: "۱",
      hint: "پاسخ جدید از مشاور",
      icon: MessagesSquare,
      permissions: ["ticket:read"],
    },
    {
      id: "installment",
      label: "قسط بعدی",
      value: "۳۰ میلیون تومان",
      hint: "سررسید ۱۵ آبان",
      icon: CreditCard,
      permissions: ["payment:read"],
    },
  ],
  chart: {
    title: "اقساط پرداخت",
    description: "مبلغ پرداخت‌شده و باقی‌مانده هر ماه (میلیون تومان)",
    variant: "bar",
    series: [
      { key: "paid", label: "پرداخت‌شده" },
      { key: "due", label: "باقی‌مانده" },
    ],
    data: [
      { label: "مهر", paid: 30, due: 0 },
      { label: "آبان", paid: 0, due: 30 },
      { label: "آذر", paid: 0, due: 30 },
      { label: "دی", paid: 0, due: 30 },
    ],
  },
  activity: [
    {
      id: "1",
      title: "مدرک شما تأیید شد",
      description: "رونوشت مدرک زبان توسط مشاور تأیید شد",
      time: "۱۰ دقیقه پیش",
      icon: FileCheck2,
    },
    {
      id: "2",
      title: "پاسخ جدید در تیکت",
      description: "مشاور شما درباره ویزای تحصیلی پاسخ داد",
      time: "۲ ساعت پیش",
      icon: MessagesSquare,
    },
    {
      id: "3",
      title: "پرداخت قسط اول ثبت شد",
      description: "مبلغ ۳۰ میلیون تومان با موفقیت دریافت شد",
      time: "۳ روز پیش",
      icon: CreditCard,
    },
    {
      id: "4",
      title: "پرونده شما ایجاد شد",
      description: "مشاور اختصاصی شما تعیین شد",
      time: "هفته گذشته",
      icon: CheckCircle2,
    },
  ],
};

/** Dashboard summary suited to the role (own scope for consultant / student) */
export const DASHBOARD_DATA: Record<Role, DashboardData> = {
  admin: ADMIN_DASHBOARD,
  consultant: CONSULTANT_DASHBOARD,
  student: STUDENT_DASHBOARD,
};
