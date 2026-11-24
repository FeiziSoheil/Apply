import type { Service } from "@/types";
import { serviceSectionsBySlug } from "./service-sections";

/** Mock services — import only from services layer */
export const services: Service[] = [
  {
    id: "svc-1",
    slug: "admission-consulting",
    title: "اپلای دانشگاه",
    shortDescription:
      "انتخاب کشور، دانشگاه و رشته متناسب با معدل، بودجه و اهداف شغلی شما.",
    icon: "graduation-cap",
    order: 0,
    sections: serviceSectionsBySlug["admission-consulting"]!,
    steps: [
      "جلسه ارزیابی رایگان و بررسی سوابق تحصیلی",
      "پیشنهاد لیست دانشگاه و برنامه واقع‌بینانه",
      "آماده‌سازی مدارک، انگیزه‌نامه و توصیه‌نامه",
      "ثبت درخواست و پیگیری تا دریافت پذیرش",
    ],
    requiredDocuments: [
      "کارنامه و مدرک تحصیلی ترجمه‌شده",
      "پاسپورت معتبر",
      "رزومه تحصیلی و شغلی",
      "مدرک زبان (در صورت وجود)",
      "انگیزه‌نامه و توصیه‌نامه (در صورت نیاز دانشگاه)",
    ],
    duration: "حدود ۲ تا ۵ ماه",
    relatedServiceSlugs: [
      "language-prep",
      "document-translation",
      "scholarship-guidance",
    ],
    faqs: [
      {
        id: "svc1-f1",
        question: "چند دانشگاه پیشنهاد می‌شود؟",
        answer:
          "معمولاً ۳ تا ۶ گزینه در سه سطح امن، واقع‌بینانه و جاه‌طلبانه ارائه می‌شود.",
      },
      {
        id: "svc1-f2",
        question: "آیا تضمین پذیرش دارید؟",
        answer:
          "پذیرش نهایی در اختیار دانشگاه است؛ ما با انتخاب درست و کیفیت مدارک شانس را افزایش می‌دهیم.",
      },
      {
        id: "svc1-f3",
        question: "آیا برای چند کشور هم‌زمان اپلای می‌کنید؟",
        answer:
          "بله؛ در صورت تمایل می‌توان استراتژی چندکشوری با اولویت‌بندی بودجه و شانس پذیرش طراحی کرد.",
      },
    ],
    price: 450000000,
    seo: {
      metaTitle: "اپلای دانشگاه",
      metaDescription: "مشاوره و انجام اپلای دانشگاه‌های خارج از کشور؛ انتخاب رشته و مقصد تا دریافت پذیرش.",
    },
  },
  {
    id: "svc-2",
    slug: "visa-support",
    title: "ویزای تحصیلی",
    shortDescription:
      "آماده‌سازی پرونده ویزای تحصیلی، تمکن مالی و همراهی تا دریافت ویزا.",
    icon: "passport",
    order: 1,
    sections: serviceSectionsBySlug["visa-support"]!,
    steps: [
      "بررسی نوع ویزا و چک‌لیست مدارک",
      "تنظیم نامه تمکن و ترجمه رسمی",
      "رزرو وقت سفارت / ارسال آنلاین",
      "آمادگی مصاحبه و پیگیری نتیجه",
    ],
    requiredDocuments: [
      "نامه پذیرش دانشگاه",
      "پاسپورت و عکس پرسنلی",
      "مدارک تمکن مالی و گردش حساب",
      "بیمه مسافرتی (در صورت نیاز)",
      "فرم‌های تکمیل‌شده سفارت",
    ],
    duration: "حدود ۱ تا ۴ ماه",
    relatedServiceSlugs: [
      "admission-consulting",
      "document-translation",
      "accommodation",
    ],
    faqs: [
      {
        id: "svc2-f1",
        question: "زمان دریافت ویزا چقدر است؟",
        answer:
          "بسته به کشور از چند هفته تا چند ماه متغیر است؛ زمان‌بندی تقریبی در جلسه اول اعلام می‌شود.",
      },
      {
        id: "svc2-f2",
        question: "اگر ویزا رد شود چه می‌کنید؟",
        answer:
          "دلیل ریجکت را بررسی می‌کنیم و در صورت امکان مسیر اصلاح پرونده یا کشور جایگزین پیشنهاد می‌دهیم.",
      },
    ],
    price: 280000000,
    seo: {
      metaTitle: "ویزای تحصیلی",
      metaDescription: "آماده‌سازی پرونده ویزای تحصیلی، تمکن مالی، مصاحبه سفارت و پیگیری تا دریافت ویزا.",
    },
  },
  {
    id: "svc-3",
    slug: "language-prep",
    title: "آمادگی مدرک زبان",
    shortDescription:
      "برنامه‌ریزی IELTS، TOEFL، TestDaF یا دوره‌های آمادگی دانشگاهی.",
    icon: "languages",
    order: 2,
    sections: serviceSectionsBySlug["language-prep"]!,
    steps: [
      "تعیین سطح و هدف نمره",
      "طراحی برنامه مطالعه شخصی",
      "کلاس‌های مهارت‌محور و آزمون آزمایشی",
      "هماهنگی با ددلاین اپلای",
    ],
    requiredDocuments: [
      "نمونه کارنامه یا مدرک زبان قبلی (در صورت وجود)",
      "لیست دانشگاه‌های هدف و حداقل نمره",
      "زمان‌بندی تقریبی اپلای",
    ],
    duration: "حدود ۲ تا ۶ ماه",
    relatedServiceSlugs: [
      "admission-consulting",
      "scholarship-guidance",
      "visa-support",
    ],
    faqs: [
      {
        id: "svc3-f1",
        question: "چند ماه برای IELTS نیاز است؟",
        answer:
          "بسته به سطح فعلی معمولاً ۲ تا ۶ ماه برنامه‌ریزی می‌شود.",
      },
      {
        id: "svc3-f2",
        question: "کلاس‌ها آنلاین است یا حضوری؟",
        answer:
          "هر دو گزینه فراهم است؛ پس از تعیین سطح، قالب مناسب با برنامه شما پیشنهاد می‌شود.",
      },
    ],
    price: 180000000,
    seo: {
      metaTitle: "آمادگی مدرک زبان",
      metaDescription: "آمادگی IELTS، TOEFL و سایر آزمون‌های زبان برای پذیرش دانشگاه‌های خارج از کشور.",
    },
  },
  {
    id: "svc-4",
    slug: "document-translation",
    title: "ترجمه رسمی و اپوستیل",
    shortDescription:
      "ترجمه رسمی مدارک، آپوستیل و تأییدات لازم برای اپلای و ویزا.",
    icon: "file-text",
    order: 3,
    sections: serviceSectionsBySlug["document-translation"]!,
    steps: [
      "بررسی مدارک مورد نیاز کشور مقصد",
      "ترجمه رسمی و تأییدات لازم",
      "پیگیری آپوستیل یا تأیید وزارت",
      "تحویل بسته کامل برای اپلای",
    ],
    requiredDocuments: [
      "اصل مدارک تحصیلی و هویتی",
      "کپی برابر اصل در صورت نیاز",
      "لیست دانشگاه یا سفارت مقصد",
      "اطلاعات دقیق نام و تاریخ برای تطبیق ترجمه",
    ],
    duration: "حدود ۵ تا ۱۵ روز کاری",
    relatedServiceSlugs: [
      "admission-consulting",
      "visa-support",
      "scholarship-guidance",
    ],
    faqs: [
      {
        id: "svc5-f1",
        question: "ترجمه چقدر طول می‌کشد؟",
        answer: "معمولاً ۵ تا ۱۵ روز کاری بسته به حجم و نوع تأییدات.",
      },
      {
        id: "svc5-f2",
        question: "آپوستیل برای همه کشورها لازم است؟",
        answer:
          "خیر؛ بسته به کشور مقصد ممکن است آپوستیل، تأیید وزارت یا مسیر دیگری لازم باشد.",
      },
    ],
    price: 120000000,
    seo: {
      metaTitle: "ترجمه رسمی و اپوستیل",
      metaDescription: "ترجمه رسمی مدارک تحصیلی، آپوستیل و تأییدات لازم برای اپلای دانشگاه و ویزای تحصیلی.",
    },
  },
  {
    id: "svc-5",
    slug: "scholarship-guidance",
    title: "بورسیه",
    shortDescription:
      "شناسایی بورسیه‌های دولتی و دانشگاهی و آماده‌سازی پرونده رقابتی.",
    icon: "award",
    order: 4,
    sections: serviceSectionsBySlug["scholarship-guidance"]!,
    steps: [
      "تحلیل واجد شرایط بودن",
      "لیست بورسیه‌های مرتبط با کشور و رشته",
      "نگارش SOP و توصیه‌نامه‌های قوی",
      "پیگیری مهلت‌ها و ارسال پرونده",
    ],
    requiredDocuments: [
      "کارنامه و مدرک تحصیلی",
      "رزومه پژوهشی یا شغلی",
      "مدرک زبان",
      "نمونه مقالات یا پروژه‌ها (در صورت وجود)",
      "انگیزه‌نامه اولیه",
    ],
    duration: "حدود ۱ تا ۳ ماه",
    relatedServiceSlugs: [
      "admission-consulting",
      "language-prep",
      "document-translation",
    ],
    faqs: [
      {
        id: "svc4-f1",
        question: "شانس بورسیه کامل چقدر است؟",
        answer:
          "بورسیه‌های کامل رقابتی‌اند؛ با معدل، پژوهش و انگیزه‌نامه قوی شانس افزایش می‌یابد.",
      },
      {
        id: "svc4-f2",
        question: "آیا بورسیه جزئی هم پوشش داده می‌شود؟",
        answer:
          "بله؛ کمک‌هزینه شهریه، خوابگاه یا هزینه زندگی نیز در فهرست بررسی قرار می‌گیرد.",
      },
    ],
    price: 220000000,
    seo: {
      metaTitle: "بورسیه تحصیلی",
      metaDescription: "راهنمای بورسیه‌های دولتی و دانشگاهی؛ شناسایی فرصت‌ها و آماده‌سازی پرونده رقابتی.",
    },
  },
  {
    id: "svc-6",
    slug: "accommodation",
    title: "اسکان",
    shortDescription:
      "معرفی خوابگاه و اجاره، رزرو اولیه و راهنمای استقرار در شهر مقصد.",
    icon: "home",
    order: 5,
    sections: serviceSectionsBySlug["accommodation"]!,
    steps: [
      "تعیین بودجه و ترجیحات محل سکونت",
      "معرفی گزینه‌های خوابگاه و اجاره",
      "کمک به رزرو و بررسی قرارداد",
      "چک‌لیست ورود و پشتیبانی اولیه",
    ],
    requiredDocuments: [
      "نامه پذیرش یا ثبت‌نام دانشگاه",
      "پاسپورت و ویزا (در صورت صدور)",
      "بودجه تقریبی ماهانه",
      "تاریخ تقریبی ورود",
    ],
    duration: "حدود ۲ تا ۶ هفته",
    relatedServiceSlugs: [
      "visa-support",
      "admission-consulting",
      "document-translation",
    ],
    faqs: [
      {
        id: "svc6-f1",
        question: "آیا مسکن تضمین می‌کنید؟",
        answer:
          "ما گزینه‌ها را معرفی و در رزرو کمک می‌کنیم؛ قرارداد نهایی با مالک یا خوابگاه است.",
      },
      {
        id: "svc6-f2",
        question: "خوابگاه بهتر است یا اجاره؟",
        answer:
          "بستگی به بودجه، شهر و ترجیح حریم خصوصی دارد؛ در جلسه اول مزایا و معایب هر گزینه را مقایسه می‌کنیم.",
      },
    ],
    price: 150000000,
    seo: {
      metaTitle: "اسکان دانشجویی",
      metaDescription: "راهنمای اسکان دانشجویی در خارج؛ خوابگاه، اجاره و استقرار اولیه در شهر مقصد.",
    },
  },
];
