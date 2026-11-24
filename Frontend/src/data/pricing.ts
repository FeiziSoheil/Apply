import type { PricingComparisonRow, PricingPlan } from "@/types";

/** Mock pricing — import only from services */
export const pricingPlans: PricingPlan[] = [
  {
    id: "basic",
    name: "پایه",
    tagline: "برای شروع شفاف و انتخاب مسیر",
    priceFrom: 8_500_000,
    priceNote: "شروع از — بسته به کشور و مقطع",
    features: [
      "جلسه ارزیابی مسیر تحصیل",
      "لیست کوتاه دانشگاه‌های پیشنهادی",
      "راهنمای مدارک و زمان‌بندی",
      "پشتیبانی پیامکی تا ۳۰ روز",
    ],
  },
  {
    id: "full",
    name: "کامل",
    tagline: "از اپلای تا آماده‌سازی ویزا",
    priceFrom: 28_000_000,
    priceNote: "شروع از — محبوب‌ترین بسته",
    highlighted: true,
    features: [
      "همه موارد بسته پایه",
      "آماده‌سازی و ارسال تا ۳ اپلای",
      "بازبینی انگیزه‌نامه و رزومه",
      "چک‌لیست ویزا و تمکن مالی",
      "پیگیری پرونده تا پذیرش",
    ],
  },
  {
    id: "premium",
    name: "ویژه",
    tagline: "همراهی اختصاصی تا استقرار در مقصد",
    priceFrom: 48_000_000,
    priceNote: "شروع از — مشاور اختصاصی",
    features: [
      "همه موارد بسته کامل",
      "اپلای نامحدود در بازه قرارداد",
      "جلسات هفتگی با مشاور ارشد",
      "همراهی پرونده ویزا تا نتیجه",
      "راهنمای اسکان و چک‌لیست ورود",
    ],
  },
];

export const pricingComparison: PricingComparisonRow[] = [
  {
    id: "assessment",
    feature: "ارزیابی اولیه مسیر",
    basic: true,
    full: true,
    premium: true,
  },
  {
    id: "shortlist",
    feature: "لیست دانشگاه پیشنهادی",
    basic: "تا ۵ مورد",
    full: "تا ۱۲ مورد",
    premium: "نامحدود در بازه قرارداد",
  },
  {
    id: "applications",
    feature: "ارسال اپلای",
    basic: false,
    full: "تا ۳ پرونده",
    premium: "نامحدود",
  },
  {
    id: "sop",
    feature: "بازبینی انگیزه‌نامه",
    basic: false,
    full: true,
    premium: true,
  },
  {
    id: "visa",
    feature: "آماده‌سازی پرونده ویزا",
    basic: "راهنما",
    full: true,
    premium: true,
  },
  {
    id: "dedicated",
    feature: "مشاور اختصاصی",
    basic: false,
    full: false,
    premium: true,
  },
  {
    id: "settlement",
    feature: "راهنمای استقرار در مقصد",
    basic: false,
    full: "چک‌لیست",
    premium: true,
  },
];

export const pricingNeverCharge: readonly string[] = [
  "هزینه پنهان پس از امضای قرارداد بدون اطلاع قبلی",
  "پورسانت از دانشگاه به‌جای شفافیت با دانشجو",
  "وعده پذیرش یا ویزای تضمینی در ازای مبلغ اضافه",
  "نگه‌داشتن مدارک اصلی شما به‌عنوان وثیقه",
] as const;

export const pricingGuarantees: readonly string[] = [
  "جزئیات خدمت و محدوده کار قبل از پرداخت در قرارداد نوشته می‌شود",
  "در صورت انصراف در مهلت قانونی، شرایط استرداد طبق قرارداد اعمال می‌گردد",
  "وضعیت هر مرحله اپلای به‌صورت شفاف گزارش می‌شود",
  "هیچ تضمین پذیرش/ویزا اعلام نمی‌کنیم؛ تمرکز روی کیفیت پرونده است",
] as const;

export const pricingHowCalculated: readonly {
  id: string;
  title: string;
  description: string;
}[] = [
  {
    id: "country",
    title: "کشور و پیچیدگی پرونده",
    description:
      "مقاصدی با رقابت بالاتر یا مدارک مالی پیچیده‌تر، زمان مشاور بیشتری می‌طلبند.",
  },
  {
    id: "degree",
    title: "مقطع و تعداد اپلای",
    description:
      "کارشناسی، ارشد، دکتری و پزشکی مسیر متفاوتی دارند؛ تعداد دانشگاه‌های هدف روی تعرفه اثر دارد.",
  },
  {
    id: "scope",
    title: "دامنه خدمت",
    description:
      "فقط مشاوره، اپلای کامل، یا همراهی تا ویزا و استقرار — هر کدام بسته جداگانه‌ای است.",
  },
];
