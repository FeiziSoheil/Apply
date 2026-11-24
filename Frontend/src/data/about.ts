import type {
  AboutGalleryImage,
  AboutLicense,
  AboutStat,
  AboutTimelineItem,
  AboutValue,
} from "@/types";

export const aboutStory = {
  title: "داستان شکل‌گیری اِپلای",
  paragraphs: [
    "اِپلای از یک دغدغه ساده شروع شد: دانشجویان ایرانی مسیر تحصیل خارج را اغلب با اطلاعات پراکنده، وعده‌های مبهم و هزینه‌های غیرشفاف طی می‌کردند. ما خواستیم مسیری بسازیم که در آن انتخاب کشور و دانشگاه بر پایه واقعیت پروفایل باشد، نه هیجان لحظه‌ای.",
    "امروز تیمی از مشاوران پذیرش، کارشناسان ویزا و مدرسان زبان کنار هم کار می‌کنند تا از ارزیابی اولیه تا استقرار در مقصد، مراحل مشخص، قابل پیگیری و صادقانه پیش برود. موفقیت برای ما یعنی پرونده‌ای که دانشجو دلیل هر تصمیم را می‌فهمد.",
  ],
} as const;

export const aboutMission = {
  title: "ماموریت ما",
  description:
    "کمک به دانشجویان برای ساختن مسیر تحصیلی واقع‌بینانه، شفاف و قابل اجرا — با تمرکز بر کیفیت مدارک، زمان‌بندی درست و همراهی انسانی در تصمیم‌های مهم.",
} as const;

export const aboutValues: AboutValue[] = [
  {
    id: "honesty",
    title: "صداقت",
    description:
      "اگر شانس پذیرش پایین باشد، صریح می‌گوییم؛ وعده تضمینی نمی‌دهیم.",
  },
  {
    id: "clarity",
    title: "شفافیت",
    description:
      "مراحل، زمان‌بندی تقریبی و محدوده خدمت قبل از شروع همکاری روشن است.",
  },
  {
    id: "care",
    title: "همراهی",
    description:
      "هر پرونده یک مسیر شخصی است؛ پیگیری منظم جایگزین پاسخ‌های کلیشه‌ای می‌شود.",
  },
  {
    id: "quality",
    title: "کیفیت",
    description:
      "انگیزه‌نامه، رزومه و پرونده ویزا با دقت بازبینی می‌شوند تا ریسک خطا کم شود.",
  },
];

export const aboutStats: AboutStat[] = [
  { id: "students", label: "دانشجوی اعزام‌شده", value: 3200, suffix: "+" },
  { id: "countries", label: "کشور مقصد", value: 12, suffix: "+" },
  { id: "universities", label: "دانشگاه همکار", value: 180, suffix: "+" },
  { id: "years", label: "سال تجربه", value: 14 },
];

export const aboutTimeline: AboutTimelineItem[] = [
  {
    id: "y2012",
    year: 2012,
    title: "شروع به‌عنوان مشاوره تخصصی اروپا",
    description:
      "تمرکز اولیه روی آلمان و برنامه‌های مهندسی؛ اولین پرونده‌های پذیرش ارشد ثبت شد.",
  },
  {
    id: "y2016",
    year: 2016,
    title: "گسترش به کانادا و استرالیا",
    description:
      "تیم ویزا شکل گرفت و مسیر Study Permit و ویزای دانشجویی استرالیا به خدمات اضافه شد.",
  },
  {
    id: "y2019",
    year: 2019,
    title: "راه‌اندازی واحد آمادگی زبان",
    description:
      "برنامه‌های فشرده IELTS و TestDaF هماهنگ با ددلاین اپلای طراحی شد.",
  },
  {
    id: "y2022",
    year: 2022,
    title: "مقاصد مقرون‌به‌صرفه",
    description:
      "ایتالیا، مجارستان، ترکیه و مالزی برای دانشجویان با بودجه محدود جدی‌تر پوشش داده شد.",
  },
  {
    id: "y2025",
    year: 2025,
    title: "پلتفرم شفاف پیگیری پرونده",
    description:
      "مسیر ارزیابی، رزرو مشاوره و پیگیری مراحل در وب‌سایت یکپارچه شد تا دانشجو همیشه بداند کجای راه است.",
  },
];

export const aboutLicenses: AboutLicense[] = [
  {
    id: "enamad",
    title: "نماد اعتماد الکترونیکی",
    description: "نمایش نماد به‌صورت نمونه؛ لینک واقعی پس از اتصال دامنه فعال می‌شود.",
  },
  {
    id: "msrt",
    title: "مجوز فعالیت مشاوره تحصیلی",
    description: "جایگاه مجوز رسمی — متن و تصویر نهایی پس از تأیید نهاد مربوطه جایگزین می‌شود.",
  },
  {
    id: "contract",
    title: "قرارداد شفاف خدمت",
    description: "هر همکاری با قرارداد مکتوب شامل محدوده کار، تعرفه و شرایط انصراف آغاز می‌شود.",
  },
];

export const aboutGallery: AboutGalleryImage[] = [
  {
    id: "office-1",
    src: "/images/office/office-01.svg",
    alt: "فضای پذیرش دفتر",
    caption: "فضای پذیرش",
  },
  {
    id: "office-2",
    src: "/images/office/office-02.svg",
    alt: "اتاق مشاوره",
    caption: "اتاق مشاوره",
  },
  {
    id: "office-3",
    src: "/images/office/office-03.svg",
    alt: "جلسه تیمی مشاوران",
    caption: "جلسه تیمی",
  },
  {
    id: "office-4",
    src: "/images/office/office-04.svg",
    alt: "میز کار مشترک",
    caption: "فضای کار مشترک",
  },
];
