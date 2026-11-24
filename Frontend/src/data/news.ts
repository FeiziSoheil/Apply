import type { NewsItem } from "@/types";
import { paragraphDoc } from "@/contracts/richcontent";

/** Mock news — import only from services */
export const newsItems: NewsItem[] = [
  {
    id: "news-1",
    slug: "germany-winter-intake-reminder",
    title: "یادآوری مهلت پذیرش ترم زمستان آلمان",
    excerpt:
      "بسیاری از دانشگاه‌های دولتی آلمان ددلاین ترم زمستان را تا اواسط تیر اعلام کرده‌اند.",
    content: paragraphDoc("جزئیات این خبر به‌زودی تکمیل می‌شود. برای اطلاعات بیشتر با مشاوران ما در ارتباط باشید."),
    publishedAt: "2026-03-01",
    coverImage: "/images/news/news-01.svg",
    eventType: "deadline",
  },
  {
    id: "news-2",
    slug: "canada-study-permit-update",
    title: "به‌روزرسانی شرایط Study Permit کانادا",
    excerpt:
      "تغییرات جزئی در مدارک تمکن مالی و نامه پذیرش؛ پیش از ارسال پرونده چک‌لیست را مرور کنید.",
    content: paragraphDoc("جزئیات این خبر به‌زودی تکمیل می‌شود. برای اطلاعات بیشتر با مشاوران ما در ارتباط باشید."),
    publishedAt: "2026-02-18",
    coverImage: "/images/news/news-02.svg",
    eventType: "visa",
  },
  {
    id: "news-3",
    slug: "italy-dsu-calendar",
    title: "تقویم تقریبی ثبت‌نام بورسیه DSU منتشر شد",
    excerpt:
      "مناطق مختلف ایتالیا زمان‌بندی جداگانه دارند؛ دانشجویان فعلی و تازه‌وارد باید جداگانه اقدام کنند.",
    content: paragraphDoc("جزئیات این خبر به‌زودی تکمیل می‌شود. برای اطلاعات بیشتر با مشاوران ما در ارتباط باشید."),
    publishedAt: "2026-02-05",
    coverImage: "/images/news/news-03.svg",
    eventType: "deadline",
  },
  {
    id: "news-4",
    slug: "hungary-stipendium-opens",
    title: "آغاز ثبت‌نام Stipendium Hungaricum",
    excerpt:
      "بورسیه دولتی مجارستان برای سال تحصیلی آینده باز شده است؛ ظرفیت رشته‌ها محدود است.",
    content: paragraphDoc("جزئیات این خبر به‌زودی تکمیل می‌شود. برای اطلاعات بیشتر با مشاوران ما در ارتباط باشید."),
    publishedAt: "2026-01-20",
    coverImage: "/images/news/news-04.svg",
    eventType: "deadline",
  },
  {
    id: "news-5",
    slug: "workshop-sop-writing",
    title: "کارگاه رایگان نگارش انگیزه‌نامه",
    excerpt:
      "شنبه آینده کارگاه آنلاین SOP برگزار می‌شود؛ ظرفیت محدود و نیاز به ثبت‌نام قبلی دارد.",
    content: paragraphDoc("جزئیات این خبر به‌زودی تکمیل می‌شود. برای اطلاعات بیشتر با مشاوران ما در ارتباط باشید."),
    publishedAt: "2026-01-10",
    coverImage: "/images/news/news-05.svg",
    eventType: "webinar",
    eventDate: "2026-01-17",
    registrationUrl: "https://example.com/register/sop-workshop",
  },
  {
    id: "news-6",
    slug: "tehran-education-fair",
    title: "حضور اِپلای در نمایشگاه بین‌المللی آموزش تهران",
    excerpt:
      "مشاوران ما در غرفه اِپلای پاسخگوی سوالات پذیرش، ویزا و بورسیه هستند. ورود برای عموم رایگان است.",
    content: paragraphDoc("جزئیات این خبر به‌زودی تکمیل می‌شود. برای اطلاعات بیشتر با مشاوران ما در ارتباط باشید."),
    publishedAt: "2025-12-15",
    coverImage: "/images/news/news-01.svg",
    eventType: "exhibition",
    eventDate: "2025-12-20",
  },
  {
    id: "news-7",
    slug: "australia-visa-rule-change",
    title: "تغییر جزئی در شرایط ویزای دانشجویی استرالیا",
    excerpt:
      "الزامات تمکن مالی و بیمه OSHC به‌روزرسانی شده؛ قبل از ارسال درخواست، چک‌لیست رسمی را مرور کنید.",
    content: paragraphDoc("جزئیات این خبر به‌زودی تکمیل می‌شود. برای اطلاعات بیشتر با مشاوران ما در ارتباط باشید."),
    publishedAt: "2025-12-01",
    coverImage: "/images/news/news-02.svg",
    eventType: "visa",
  },
  {
    id: "news-8",
    slug: "netherlands-orientation-year-webinar",
    title: "وبینار ویزای جستجوی کار هلند (Orientation Year)",
    excerpt:
      "در این وبینار مسیر اقامت پس از فارغ‌التحصیلی در هلند و شرایط Orientation Year بررسی می‌شود.",
    content: paragraphDoc("جزئیات این خبر به‌زودی تکمیل می‌شود. برای اطلاعات بیشتر با مشاوران ما در ارتباط باشید."),
    publishedAt: "2025-11-20",
    coverImage: "/images/news/news-03.svg",
    eventType: "webinar",
  },
];
