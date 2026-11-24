import type { Consultant } from "@/types";

/** Mock consultants — import only from services */
export const consultants: Consultant[] = [
  {
    id: "cons-1",
    name: "سارا احمدی",
    role: "مشاور ارشد پذیرش اروپا",
    countries: ["germany", "netherlands", "hungary"],
    bio: "بیش از ده سال تجربه در پرونده‌های آلمان و هلند؛ تخصص در مهندسی و علوم کامپیوتر.",
    photo: "/images/consultants/consultant-01.svg",
    languages: ["فارسی", "انگلیسی", "آلمانی"],
  },
  {
    id: "cons-2",
    name: "علی رضایی",
    role: "کارشناس ویزا و تمکن مالی",
    countries: ["canada", "australia"],
    bio: "تخصص در Study Permit کانادا و ویزای ۵۰۰ استرالیا با تمرکز بر کاهش ریسک ریجکت.",
    photo: "/images/consultants/consultant-02.svg",
    languages: ["فارسی", "انگلیسی"],
  },
  {
    id: "cons-3",
    name: "مریم کریمی",
    role: "مشاور ایتالیا و بورسیه",
    countries: ["italy", "hungary"],
    bio: "راهنمای بورسیه DSU و Stipendium؛ همراهی صدها پرونده موفق در جنوب و مرکز اروپا.",
    photo: "/images/consultants/consultant-03.svg",
    languages: ["فارسی", "ایتالیایی", "انگلیسی"],
  },
  {
    id: "cons-4",
    name: "حسین محمدی",
    role: "مشاور ترکیه و مالزی",
    countries: ["turkey", "malaysia"],
    bio: "آشنا با دانشگاه‌های دولتی ترکیه و پردیس‌های بین‌المللی مالزی؛ مناسب بودجه محدود.",
    photo: "/images/consultants/consultant-04.svg",
    languages: ["فارسی", "ترکی", "انگلیسی"],
  },
  {
    id: "cons-5",
    name: "نرگس حسینی",
    role: "مدرس آمادگی زبان",
    countries: ["germany", "canada", "australia", "netherlands"],
    bio: "مدرس IELTS و TestDaF با برنامه‌های فشرده هماهنگ با ددلاین اپلای.",
    photo: "/images/consultants/consultant-05.svg",
    languages: ["فارسی", "انگلیسی", "آلمانی"],
  },
  {
    id: "cons-6",
    name: "رضا نوری",
    role: "مشاور پزشکی و علوم سلامت",
    countries: ["hungary", "italy", "turkey"],
    bio: "تمرکز بر رشته‌های پزشکی، دندان‌پزشکی و پیراپزشکی در اروپا و ترکیه.",
    photo: "/images/consultants/consultant-06.svg",
    languages: ["فارسی", "انگلیسی"],
  },
];

/** @deprecated Prefer consultants — alias for older imports */
export const teamMembers = consultants;
