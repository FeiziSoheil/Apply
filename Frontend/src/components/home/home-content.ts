import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  ClipboardCheck,
  Compass,
  Handshake,
  Headphones,
  MessageCircle,
  Plane,
  School,
  ShieldCheck,
  Stamp,
  Users,
} from "lucide-react";

export type ProcessStep = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

/** RTL visual order: مشاوره ← … ← پرواز (first item is first step) */
export const PROCESS_STEPS: readonly ProcessStep[] = [
  {
    id: "consult",
    title: "مشاوره",
    description: "بررسی هدف، بودجه و رزومه تحصیلی",
    icon: MessageCircle,
  },
  {
    id: "university",
    title: "انتخاب دانشگاه",
    description: "لیست واقع‌بینانه بر اساس پروفایل شما",
    icon: School,
  },
  {
    id: "apply",
    title: "اپلای",
    description: "آماده‌سازی مدارک و ارسال درخواست",
    icon: ClipboardCheck,
  },
  {
    id: "admission",
    title: "پذیرش",
    description: "پیگیری تا دریافت نامه پذیرش",
    icon: BadgeCheck,
  },
  {
    id: "visa",
    title: "ویزا",
    description: "پرونده ویزا و مصاحبه سفارت",
    icon: Stamp,
  },
  {
    id: "flight",
    title: "پرواز",
    description: "آمادگی پیش از سفر و اسکان",
    icon: Plane,
  },
] as const;

export type Advantage = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

export const WHY_US_ADVANTAGES: readonly Advantage[] = [
  {
    id: "expertise",
    title: "تخصص چندکشوری",
    description:
      "مشاوران متخصص برای اروپا، کانادا، استرالیا و مقاصد مقرون‌به‌صرفه",
    icon: Compass,
  },
  {
    id: "transparent",
    title: "مسیر شفاف",
    description: "مراحل، زمان‌بندی و هزینه‌ها از ابتدا مشخص می‌شود",
    icon: ShieldCheck,
  },
  {
    id: "support",
    title: "پشتیبانی پیوسته",
    description: "همراهی از ارزیابی اولیه تا استقرار در مقصد",
    icon: Headphones,
  },
  {
    id: "network",
    title: "شبکه دانشگاهی",
    description: "آشنایی با صدها برنامه و دانشگاه همکار در جهان",
    icon: Users,
  },
  {
    id: "honest",
    title: "مشاوره صادقانه",
    description: "پیشنهاد واقع‌بینانه؛ بدون وعده پذیرش تضمینی",
    icon: Handshake,
  },
  {
    id: "quality",
    title: "کیفیت مدارک",
    description: "بازبینی انگیزه‌نامه، رزومه و پرونده ویزا توسط متخصص",
    icon: BadgeCheck,
  },
] as const;
