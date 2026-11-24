import type { BlogPost } from "@/types";
import {
  doc,
  headingNode,
  markdownishToDoc,
  sampleAccordion,
  sampleCallout,
  sampleCta,
  sampleEntityRef,
  sampleSteps,
  sampleTable,
  sampleVideo,
  textParagraph,
} from "@/lib/richcontent/builders";

/** Showcase article covering every RichContent block type (manual QA). */
const showcaseBlocks = doc(
  headingNode(2, "نمونه بلوک‌های محتوا"),
  headingNode(3, "زیرعنوان نمونه"),
  headingNode(4, "زیرعنوان کوچک"),
  textParagraph("پاراگراف عادی با متن فارسی برای رندر عمومی."),
  {
    type: "blockquote" as const,
    content: [textParagraph("نقل‌قول نمونه برای تست بلوک blockquote.")],
  },
  {
    type: "bulletList" as const,
    content: [
      {
        type: "listItem" as const,
        content: [textParagraph("آیتم فهرست نامرتب یک")],
      },
      {
        type: "listItem" as const,
        content: [textParagraph("آیتم فهرست نامرتب دو")],
      },
    ],
  },
  {
    type: "orderedList" as const,
    content: [
      {
        type: "listItem" as const,
        content: [textParagraph("گام اول فهرست مرتب")],
      },
      {
        type: "listItem" as const,
        content: [textParagraph("گام دوم فهرست مرتب")],
      },
    ],
  },
  { type: "horizontalRule" as const },
  sampleCallout("info", "این مقاله برای تست رندر عمومی همهٔ نودهای RichContent است."),
  sampleTable(),
  {
    type: "image" as const,
    attrs: {
      fileId: "seed-richcontent-image",
      alt: "تصویر نمونه مقاله",
      caption: "نمونه تصویر با fileId محلی",
    },
  },
  sampleAccordion([
    {
      question: "آیا می‌توان چند کشور را همزمان بررسی کرد؟",
      answer: "بله؛ معمولاً دو یا سه گزینه واقع‌بینانه کافی است.",
    },
  ]),
  sampleSteps([
    {
      title: "بودجه را مشخص کنید",
      description: "شهریه و هزینه زندگی را جداگانه برآورد کنید.",
    },
    {
      title: "زبان تحصیل",
      description: "انگلیسی یا زبان محلی را بر اساس هدف شغلی انتخاب کنید.",
    },
  ]),
  sampleCta("شروع ارزیابی رایگان", "assessment"),
  sampleCta("رزرو مشاوره", "booking"),
  sampleCta("لینک خارجی امن", "link", "https://example.com/apply"),
  sampleVideo("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
  sampleEntityRef("country", "country-germany"),
  sampleEntityRef(
    "university",
    "00000000-0000-4000-8000-00000000dead",
  ),
  textParagraph("پایان نمونهٔ بلوک‌ها."),
);

/** Mock blog posts — import only from services */
export const blogPosts: BlogPost[] = [
  {
    id: "blog-1",
    slug: "how-to-choose-country",
    title: "چگونه کشور مناسب تحصیل را انتخاب کنیم؟",
    excerpt:
      "بودجه، زبان، اقامت پس از تحصیل و علاقه شغلی را کنار هم بگذارید تا مقصد درست پیدا شود.",
    content: {
      type: "doc",
      content: [
        ...(markdownishToDoc(`## چرا انتخاب کشور مهم است؟

انتخاب کشور فقط به «اعتبار دانشگاه» محدود نیست. هزینه زندگی، قوانین کار دانشجویی و مسیر اقامت پس از فارغ‌التحصیلی نقش تعیین‌کننده دارند.

## سه سؤال کلیدی

1. بودجه سالانه شما چقدر است؟
2. آیا می‌خواهید به زبان انگلیسی درس بخوانید؟
3. هدف نهایی کار و اقامت است یا فقط مدرک؟

با پاسخ شفاف به این سؤال‌ها، لیست کشورها به دو یا سه گزینه واقع‌بینانه می‌رسد.`)
          .content ?? []),
        ...(showcaseBlocks.content ?? []),
      ],
    },
    category: "راهنمای انتخاب",
    tags: ["انتخاب کشور", "برنامه‌ریزی", "بودجه"],
    author: "سارا احمدی",
    publishedAt: "2025-09-01",
    readingTime: 6,
    coverImage: "/images/covers/blog-01.svg",
  },
  {
    id: "blog-2",
    slug: "scholarship-tips",
    title: "راهنمای دریافت بورسیه تحصیلی",
    excerpt:
      "از بورسیه‌های دولتی تا کمک‌هزینه دانشگاهی؛ چطور پرونده‌تان را رقابتی کنید.",
    content: markdownishToDoc(`## انواع بورسیه

بورسیه‌ها معمولاً دولتی، دانشگاهی یا خصوصی‌اند. مهلت‌ها اغلب ماه‌ها قبل از شروع ترم بسته می‌شوند.

## نکات عملی

- معدل و سوابق پژوهشی را برجسته کنید
- انگیزه‌نامه را برای هر بورسیه شخصی‌سازی کنید
- توصیه‌نامه‌ها را زود درخواست کنید`),
    category: "بورسیه",
    tags: ["بورسیه", "SOP", "کمک‌هزینه"],
    author: "مریم کریمی",
    publishedAt: "2025-10-01",
    readingTime: 8,
    coverImage: "/images/covers/blog-02.svg",
    featured: true,
  },
  {
    id: "blog-3",
    slug: "germany-blocked-account",
    title: "حساب مسدود آلمان چیست و چطور باز کنیم؟",
    excerpt:
      "تمکن مالی ویزای تحصیلی آلمان معمولاً با حساب مسدود (Sperrkonto) اثبات می‌شود.",
    content: markdownishToDoc(`## مبلغ مورد نیاز

مبلغ سالانه توسط سفارت اعلام می‌شود و باید قبل از درخواست ویزا در حساب مسدود واریز گردد.

## مراحل کلی

انتخاب ارائه‌دهنده معتبر، افتتاح حساب، واریز و دریافت تأییدیه برای پرونده ویزا.`),
    category: "آلمان",
    tags: ["آلمان", "ویزا", "تمکن مالی"],
    author: "علی رضایی",
    publishedAt: "2025-08-12",
    readingTime: 5,
    coverImage: "/images/covers/blog-03.svg",
  },
  {
    id: "blog-4",
    slug: "canada-pgwp-guide",
    title: "مجوز کار پس از تحصیل در کانادا (PGWP)",
    excerpt:
      "طول دوره تحصیل روی مدت PGWP اثر دارد؛ قبل از اپلای برنامه را هوشمندانه انتخاب کنید.",
    content: markdownishToDoc(`## PGWP چیست؟

مجوز کار موقت برای فارغ‌التحصیلان مؤسسات واجد شرایط که مسیر اسکیل‌ورکر را هموار می‌کند.

## نکته مهم

برنامه باید در مؤسسه دارای DLI و واجد شرایط PGWP باشد.`),
    category: "کانادا",
    tags: ["کانادا", "PGWP", "اقامت"],
    author: "علی رضایی",
    publishedAt: "2025-07-20",
    readingTime: 7,
    coverImage: "/images/covers/blog-04.svg",
  },
  {
    id: "blog-5",
    slug: "italy-dsu-scholarship",
    title: "بورسیه DSU ایتالیا به زبان ساده",
    excerpt:
      "کمک‌هزینه منطقه‌ای که می‌تواند شهریه، خوابگاه و بخشی از هزینه زندگی را پوشش دهد.",
    content: markdownishToDoc(`## چه کسانی واجد شرایط‌اند؟

معمولاً بر اساس درآمد خانواده و وضعیت مالی ارزیابی می‌شوید. مدارک مالی باید دقیق و ترجمه‌شده باشند.

## زمان اقدام

ثبت‌نام بورسیه اغلب همزمان یا کمی بعد از ثبت‌نام دانشگاه است؛ تقویم منطقه را چک کنید.`),
    category: "ایتالیا",
    tags: ["ایتالیا", "DSU", "بورسیه"],
    author: "مریم کریمی",
    publishedAt: "2025-06-05",
    readingTime: 6,
    coverImage: "/images/covers/blog-05.svg",
  },
  {
    id: "blog-6",
    slug: "ielts-study-plan",
    title: "برنامه ۸ هفته‌ای آمادگی IELTS",
    excerpt:
      "اگر سطح متوسط دارید، با برنامه منظم می‌توانید به نمره ۶٫۵ یا ۷ برسید.",
    content: markdownishToDoc(`## هفته‌های اول

تمرکز روی واژگان آکادمیک و گرامر پایه Writing.

## هفته‌های پایانی

آزمون آزمایشی کامل، تحلیل خطا و مدیریت زمان Listening و Reading.`),
    category: "زبان",
    tags: ["IELTS", "زبان", "آمادگی"],
    author: "نرگس حسینی",
    publishedAt: "2025-05-18",
    readingTime: 9,
    coverImage: "/images/covers/blog-06.svg",
  },
  {
    id: "blog-7",
    slug: "hungary-medical-admission",
    title: "پذیرش پزشکی در مجارستان",
    excerpt:
      "آزمون ورودی، مدارک لازم و هزینه تقریبی تحصیل پزشکی به زبان انگلیسی.",
    content: markdownishToDoc(`## آزمون ورودی

معمولاً زیست، شیمی و گاهی فیزیک یا مصاحبه انگلیسی دارد.

## هزینه

شهریه پزشکی بالاتر از رشته‌های دیگر است؛ هزینه زندگی بوداپست و شهرهای کوچک‌تر متفاوت است.`),
    category: "مجارستان",
    tags: ["پزشکی", "مجارستان", "آزمون ورودی"],
    author: "رضا نوری",
    publishedAt: "2025-04-10",
    readingTime: 7,
    coverImage: "/images/covers/blog-07.svg",
  },
  {
    id: "blog-8",
    slug: "malaysia-cost-of-living",
    title: "هزینه زندگی دانشجویی در مالزی",
    excerpt:
      "خوابگاه، غذا و حمل‌ونقل در کوالالامپور چقدر آب می‌خورد؟",
    content: markdownishToDoc(`## میانگین ماهانه

با سبک زندگی دانشجویی متوسط، حدود ۴۰۰ تا ۷۰۰ دلار در ماه رایج است.

## صرفه‌جویی

غذای محلی، حمل‌ونقل عمومی و خوابگاه دانشگاه هزینه را کاهش می‌دهد.`),
    category: "مالزی",
    tags: ["مالزی", "هزینه زندگی"],
    author: "حسین محمدی",
    publishedAt: "2025-03-22",
    readingTime: 4,
    coverImage: "/images/covers/blog-08.svg",
  },
  {
    id: "blog-9",
    slug: "australia-student-visa-500",
    title: "ویزای دانشجویی استرالیا (ساب‌کلاس ۵۰۰)",
    excerpt:
      "پذیرش CRICOS، بیمه OSHC و تمکن مالی سه ستون اصلی پرونده هستند.",
    content: markdownishToDoc(`## مدارک کلیدی

نامه پذیرش، بیمه درمانی، گردش حساب و انگیزه واقعی تحصیل.

## کار دانشجویی

سقف ساعت کار در طول ترم را جدی بگیرید تا وضعیت ویزا به خطر نیفتد.`),
    category: "استرالیا",
    tags: ["استرالیا", "ویزا", "۵۰۰"],
    author: "علی رضایی",
    publishedAt: "2025-02-14",
    readingTime: 6,
    coverImage: "/images/covers/blog-09.svg",
  },
  {
    id: "blog-10",
    slug: "netherlands-english-programs",
    title: "چرا هلند برای برنامه‌های انگلیسی محبوب است؟",
    excerpt:
      "تنوع رشته، کیفیت آموزش و ویزای جستجوی کار یک‌ساله پس از فارغ‌التحصیلی.",
    content: markdownishToDoc(`## نقطه قوت

هلند یکی از بالاترین تعداد دوره‌های انگلیسی‌زبان اروپا را دارد.

## توجه به شهریه

شهریه دانشجویان غیراروپایی بالاتر است؛ بورسیه‌های محدود را زود پیگیری کنید.`),
    category: "هلند",
    tags: ["هلند", "برنامه انگلیسی", "Orientation Year"],
    author: "سارا احمدی",
    publishedAt: "2025-01-28",
    readingTime: 5,
    coverImage: "/images/covers/blog-10.svg",
  },
];
