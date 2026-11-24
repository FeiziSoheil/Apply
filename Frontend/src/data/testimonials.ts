import type { Testimonial } from "@/types";

/** Mock testimonials for home / about — import only from services */
export const testimonials: Testimonial[] = [
  {
    id: "test-1",
    name: "مینا احمدی",
    role: "دانشجوی ارشد در آلمان",
    quote:
      "پاسخ‌گویی سریع و واقع‌بینانه بود؛ هیچ وعده غیرواقعی‌ای نشنیدم و همین باعث اعتمادم شد.",
    rating: 5,
    avatar: "/images/testimonials/avatar-01.svg",
  },
  {
    id: "test-2",
    name: "کامران یوسفی",
    role: "دانشجوی کارشناسی در کانادا",
    quote:
      "پرونده ویزایم دو بار اصلاح شد تا کامل شود؛ در نهایت بدون ریجکت قبول شدم.",
    rating: 5,
    avatar: "/images/testimonials/avatar-02.svg",
  },
  {
    id: "test-3",
    name: "هانیه موسوی",
    role: "دانشجوی پزشکی مجارستان",
    quote:
      "آمادگی آزمون ورودی پزشکی منظم بود و در روز مصاحبه استرس کمتری داشتم.",
    rating: 4,
    avatar: "/images/testimonials/avatar-03.svg",
  },
  {
    id: "test-4",
    name: "آرمان جعفری",
    role: "دانشجوی کارشناسی ارشد هلند",
    quote:
      "از انتخاب برنامه انگلیسی‌زبان تا Orientation Year همه‌چیز شفاف توضیح داده شد.",
    rating: 5,
    avatar: "/images/testimonials/avatar-04.svg",
  },
];
