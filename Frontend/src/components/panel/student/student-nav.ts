import {
  CalendarClock,
  CreditCard,
  FileText,
  FolderOpen,
  Heart,
  HelpCircle,
  Home,
  MessagesSquare,
  MoreHorizontal,
  UserCircle,
  type LucideIcon,
} from "lucide-react";

export type StudentPrimaryNavId =
  | "home"
  | "case"
  | "documents"
  | "messages"
  | "more";

export type StudentPrimaryNavItem = {
  id: StudentPrimaryNavId;
  label: string;
  href: string | null;
  icon: LucideIcon;
  /** Match exact path only (dashboard) */
  exact?: boolean;
};

export type StudentMoreNavItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
};

/** ۵ آیتم ناوبری اصلی — موبایل پایین، دسکتاپ سایدبار */
export const STUDENT_PRIMARY_NAV: readonly StudentPrimaryNavItem[] = [
  {
    id: "home",
    label: "خانه",
    href: "/panel",
    icon: Home,
    exact: true,
  },
  {
    id: "case",
    label: "پرونده",
    href: "/panel/case",
    icon: FolderOpen,
  },
  {
    id: "documents",
    label: "مدارک",
    href: "/panel/documents",
    icon: FileText,
  },
  {
    id: "messages",
    label: "پیام‌ها",
    href: "/panel/messages",
    icon: MessagesSquare,
  },
  {
    id: "more",
    label: "بیشتر",
    href: null,
    icon: MoreHorizontal,
  },
] as const;

export const STUDENT_MORE_NAV: readonly StudentMoreNavItem[] = [
  {
    id: "payments",
    label: "پرداخت‌ها",
    href: "/panel/payments",
    icon: CreditCard,
  },
  {
    id: "bookings",
    label: "رزروها",
    href: "/panel/bookings",
    icon: CalendarClock,
  },
  {
    id: "shortlist",
    label: "علاقه‌مندی‌ها",
    href: "/panel/shortlist",
    icon: Heart,
  },
  {
    id: "profile",
    label: "پروفایل",
    href: "/panel/profile",
    icon: UserCircle,
  },
  {
    id: "help",
    label: "راهنما",
    href: "/panel/help",
    icon: HelpCircle,
  },
] as const;

export function isStudentNavActive(
  pathname: string,
  item: StudentPrimaryNavItem,
): boolean {
  if (!item.href) return false;
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/** توضیح مرحله برای صفحه پرونده (زبان ساده دانشجو) */
export const STUDENT_STAGE_HELP: Record<
  string,
  { what: string; duration: string; studentMust: string }
> = {
  consultation: {
    what: "اول با مشاور صحبت می‌کنید تا مسیر مناسبتان مشخص شود.",
    duration: "معمولاً چند روز تا دو هفته",
    studentMust: "فرم ارزیابی را پر کنید و در جلسه مشاوره شرکت کنید.",
  },
  documents: {
    what: "مدارک لازم را می‌فرستید تا بررسی و تأیید شوند.",
    duration: "معمولاً یک تا سه هفته",
    studentMust: "مدارک ناقص یا ردشده را سریع بارگذاری کنید.",
  },
  application: {
    what: "درخواست پذیرش برای دانشگاه‌های هدف ثبت می‌شود.",
    duration: "بسته به دانشگاه، چند هفته",
    studentMust: "فرم‌ها را با راهنمایی مشاور تکمیل و تأیید کنید.",
  },
  offer: {
    what: "نتیجه پذیرش می‌آید و مدارک تکمیلی درخواست می‌شود.",
    duration: "بسته به دانشگاه",
    studentMust: "نتیجه را پیگیری کنید و درخواست‌های تکمیلی را پاسخ دهید.",
  },
  visa: {
    what: "مدارک ویزا آماده و وقت سفارت هماهنگ می‌شود.",
    duration: "چند هفته تا چند ماه",
    studentMust: "مدارک ویزا و تمکن مالی را به‌موقع آماده کنید.",
  },
  departure: {
    what: "آمادگی سفر و هماهنگی‌های قبل از پرواز.",
    duration: "معمولاً چند هفته قبل از اعزام",
    studentMust: "چک‌لیست سفر را انجام دهید و با مشاور هماهنگ بمانید.",
  },
};
