import type { ContentSection } from "@/types";
import {
  assignSectionIds,
  buildSectionInputs,
  sampleAccordion,
  sampleCallout,
  sampleCta,
  sampleEntityRef,
  sampleSteps,
  sampleTable,
  sampleVideo,
  headingNode,
  bulletList,
} from "@/lib/richcontent/builders";

/** Stable deterministic ids for static mock data (not UUIDs — seed remaps). */
function sectionId(slug: string, anchor: string, index: number): string {
  return `${slug}-section-${anchor}-${index}`;
}

type CountryCopy = {
  benefits: string[];
  requirements: string[];
  costs?: string;
  visa: string;
  work: string;
  postStudy: string;
  /** Extra rich nodes injected into a named section for variety */
  enrich?: Partial<Record<string, import("@/contracts/richcontent").RichNode[]>>;
};

function buildCountrySections(slug: string, copy: CountryCopy): ContentSection[] {
  const inputs = buildSectionInputs("country", {
    benefits: copy.benefits,
    costs: copy.costs ?? "جزئیات هزینه‌ها در جدول ساختاریافتهٔ صفحه آمده است؛ مبالغ تقریبی‌اند و بسته به شهر تغییر می‌کنند.",
    requirements: copy.requirements,
    visa: copy.visa,
    work: copy.work,
    "post-study": copy.postStudy,
  });
  const sections = assignSectionIds(inputs, (anchor, index) => sectionId(slug, anchor, index));
  if (copy.enrich) {
    for (const [anchor, nodes] of Object.entries(copy.enrich)) {
      const section = sections.find((s) => s.anchor === anchor);
      if (section && nodes?.length) {
        section.content = {
          type: "doc",
          content: [...(section.content.content ?? []), ...nodes],
        };
      }
    }
  }
  return sections;
}

export const sections_germany: ContentSection[] = buildCountrySections("germany", {
  benefits: ["شهریه بسیار پایین یا رایگان در دانشگاه‌های دولتی","بازار کار قوی پس از فارغ‌التحصیلی","اجازه کار دانشجویی شفاف و منظم","اقامت ۱۸ ماهه برای جستجوی کار"],
  requirements: ["مدرک تحصیلی معادل‌سازی‌شده","مدرک زبان آلمانی یا انگلیسی (بسته به رشته)","تمکن مالی حدود ۱۱٬۲۰۸ یورو در سال","بیمه درمانی معتبر"],
  visa: "ویزای تحصیلی آلمان معمولاً پس از دریافت پذیرش و اثبات تمکن مالی (حساب مسدود) صادر می‌شود. زمان بررسی اغلب ۶ تا ۱۲ هفته است.",
  work: "دانشجویان تمام‌وقت مجاز به ۱۲۰ روز کامل یا ۲۴۰ نیم‌روز کار در سال هستند.",
  postStudy: "پس از فارغ‌التحصیلی می‌توانید تا ۱۸ ماه برای یافتن کار مرتبط اقامت بگیرید.",
  enrich: {
    costs: [
      headingNode(3, "نمونه تفکیک هزینه"),
      sampleTable(),
      sampleCallout(
        "info",
        "مبالغ تقریبی‌اند و برای برنامه‌ریزی اولیه مناسب‌اند.",
      ),
      { type: "horizontalRule" },
      {
        type: "blockquote",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "هزینه زندگی شهر به شهر متفاوت است؛ همیشه منبع رسمی را چک کنید.",
              },
            ],
          },
        ],
      },
    ],
    visa: [
      sampleSteps([
        {
          title: "پذیرش",
          description: "نامه پذیرش و مدارک دانشگاه را آماده کنید.",
        },
        {
          title: "تمکن مالی",
          description: "حساب مسدود یا اثبات تمکن را تکمیل کنید.",
        },
        {
          title: "وقت سفارت",
          description: "وقت را رزرو و پرونده را تحویل دهید.",
        },
      ]),
      sampleCta("شروع ارزیابی رایگان", "assessment"),
      sampleCta("رزرو مشاوره", "booking"),
      sampleVideo("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
      sampleAccordion([
        {
          question: "حساب مسدود چیست؟",
          answer: "سپرکنتو برای اثبات تمکن مالی ویزای تحصیلی آلمان.",
        },
      ]),
      sampleEntityRef("blog-post", "blog-1"),
    ],
  },
});

export const sections_canada: ContentSection[] = buildCountrySections("canada", {
  benefits: ["مسیر روشن اقامت پس از تحصیل (PGWP)","کیفیت بالای دانشگاه‌ها و زندگی","جامعه چندفرهنگی و پذیرنده","فرصت کار حین تحصیل تا ۲۰ ساعت در هفته"],
  requirements: ["پذیرش از مؤسسه دارای DLI","تمکن مالی کافی برای شهریه و زندگی","مدرک زبان IELTS یا معادل","معاینه پزشکی در صورت نیاز"],
  visa: "مجوز تحصیل (Study Permit) پس از پذیرش از مؤسسه DLI و اثبات تمکن مالی صادر می‌شود. پردازش آنلاین رایج است.",
  work: "با مجوز تحصیل معتبر می‌توانید تا ۲۰ ساعت در هفته در طول ترم و تمام‌وقت در تعطیلات کار کنید.",
  postStudy: "مجوز کار پس از فارغ‌التحصیلی (PGWP) بسته به طول دوره تا سه سال قابل دریافت است.",
  enrich: {
    work: [sampleAccordion([{ question: "چند ساعت می‌توان کار کرد؟", answer: "معمولاً تا ۲۰ ساعت در هفته هنگام ترم." }, { question: "آیا کار تمام‌وقت در تعطیلات مجاز است؟", answer: "در بسیاری از موارد بله، با مجوز تحصیل معتبر." }])],
    "post-study": [
      sampleVideo("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
      sampleEntityRef("service", "svc-1"),
      /* valid UUID with no matching entity → public renderer skips silently */
      sampleEntityRef(
        "university",
        "00000000-0000-4000-8000-00000000dead",
      ),
    ],
  },
});

export const sections_italy: ContentSection[] = buildCountrySections("italy", {
  benefits: ["بورسیه منطقه‌ای DSU برای دانشجویان واجد شرایط","شهریه مناسب دانشگاه‌های دولتی","برنامه‌های انگلیسی‌زبان در مقاطع مختلف","زندگی فرهنگی غنی و موقعیت مرکزی در اروپا"],
  requirements: ["دیپلم و ریزنمرات ترجمه‌شده","مدرک زبان (ایتالیایی یا انگلیسی)","تمکن مالی و بیمه درمانی","پیش‌ثبت‌نام از طریق دانشگاه یا Universitaly"],
  visa: "ویزای تحصیلی نوع D از سفارت ایتالیا پس از پذیرش و پیش‌ثبت‌نام دانشگاهی درخواست می‌شود.",
  work: "دانشجویان معمولاً تا ۲۰ ساعت در هفته اجازه کار دارند؛ شرایط دقیق به مجوز اقامت بستگی دارد.",
  postStudy: "پس از فارغ‌التحصیلی امکان تمدید اقامت برای جستجوی کار یا ادامه تحصیل وجود دارد.",
  enrich: {
    benefits: [sampleCallout("success", "بورسیه منطقه‌ای می‌تواند بخش زیادی از هزینه را پوشش دهد.")],
  },
});

export const sections_turkey: ContentSection[] = buildCountrySections("turkey", {
  benefits: ["نزدیکی جغرافیایی و هزینه سفر پایین","شهریه و زندگی مقرون‌به‌صرفه","دوره‌های انگلیسی در دانشگاه‌های برتر","فرآیند پذیرش نسبتاً ساده‌تر"],
  requirements: ["دیپلم و ریزنمرات","آزمون زبان یا دوره آمادگی","تمکن مالی متناسب با شهریه","بیمه درمانی دانشجویی"],
  visa: "ویزای دانشجویی ترکیه پس از پذیرش دانشگاه و ثبت‌نام اولیه از طریق کنسولگری یا سیستم آنلاین پیگیری می‌شود.",
  work: "کار دانشجویی با مجوز رسمی امکان‌پذیر است؛ در مقطع کارشناسی محدودیت‌های بیشتری اعمال می‌شود.",
  postStudy: "پس از تحصیل می‌توان برای اجازه کار یا ادامه تحصیل اقدام کرد؛ اقامت خودکار تضمین نیست.",
  enrich: {
    requirements: [sampleCallout("warning", "مدارک باید رسمی و ترجمه‌شده باشند.")],
  },
});

export const sections_hungary: ContentSection[] = buildCountrySections("hungary", {
  benefits: ["برنامه‌های پزشکی و دندان‌پزشکی انگلیسی‌زبان","بورسیه Stipendium Hungaricum","هزینه زندگی مناسب‌تر نسبت به اروپای غربی","موقعیت مرکزی برای سفر در شنگن"],
  requirements: ["مدارک تحصیلی ترجمه‌شده","مدرک زبان انگلیسی","تمکن مالی و بیمه","مصاحبه یا آزمون ورودی برای برخی رشته‌ها"],
  visa: "ویزای تحصیلی شنگن بلندمدت (نوع D) پس از پذیرش و اثبات تمکن مالی از سفارت مجارستان دریافت می‌شود.",
  work: "دانشجویان معمولاً تا ۲۴ ساعت در هفته اجازه کار دارند.",
  postStudy: "امکان درخواست اجازه اقامت برای جستجوی کار پس از فارغ‌التحصیلی وجود دارد.",
  enrich: {
    visa: [sampleCta("رزرو مشاوره", "booking")],
  },
});

export const sections_malaysia: ContentSection[] = buildCountrySections("malaysia", {
  benefits: ["هزینه تحصیل و زندگی پایین","پردیس‌های بین‌المللی دانشگاه‌های معتبر","محیط انگلیسی‌زبان در بسیاری از دانشگاه‌ها","فرآیند پذیرش نسبتاً سریع"],
  requirements: ["مدارک تحصیلی و ترجمه انگلیسی","مدرک زبان یا آزمون داخلی دانشگاه","گواهی سلامت","تمکن مالی"],
  visa: "ویزای دانشجویی (Student Pass) معمولاً از طریق دانشگاه و اداره مهاجرت مالزی پس از پذیرش صادر می‌شود.",
  work: "کار پاره‌وقت در تعطیلات با مجوز امکان‌پذیر است؛ شرایط دقیق را دانشگاه اعلام می‌کند.",
  postStudy: "اقامت پس از تحصیل محدود است؛ بسیاری برای کار یا ادامه تحصیل در کشور دیگر برنامه‌ریزی می‌کنند.",
  enrich: {
    work: [sampleCta("مشاهده خدمات ویزا", "link", "/services/visa-support")],
  },
});

export const sections_australia: ContentSection[] = buildCountrySections("australia", {
  benefits: ["دانشگاه‌های تراز اول جهانی","فرصت کار پس از تحصیل (ویزای ۴۸۵)","کیفیت بالای زندگی و امنیت","بازار کار متنوع برای فارغ‌التحصیلان"],
  requirements: ["پذیرش از مؤسسه معتبر CRICOS","IELTS یا معادل","بیمه OSHC","تمکن مالی و مدارک هویتی"],
  visa: "ویزای دانشجویی ساب‌کلاس ۵۰۰ پس از پذیرش، بیمه OSHC و اثبات تمکن مالی درخواست می‌شود.",
  work: "معمولاً تا ۴۸ ساعت در هر دو هفته در طول ترم و تمام‌وقت در تعطیلات مجاز هستید.",
  postStudy: "ویزای موقت فارغ‌التحصیلان (مثلاً ۴۸۵) بسته به مقطع و محل تحصیل قابل دریافت است.",
  enrich: {
    costs: [bulletList(["اجاره خوابگاه دانشجویی", "بیمه اجباری", "هزینه ترم"])],
  },
});

export const sections_netherlands: ContentSection[] = buildCountrySections("netherlands", {
  benefits: ["تعداد بالای دوره‌های انگلیسی‌زبان","ویزای یک‌ساله Orientation Year پس از تحصیل","محیط نوآورانه و بین‌المللی","موقعیت عالی برای کار در اروپا"],
  requirements: ["مدارک تحصیلی و انگیزه‌نامه قوی","مدرک زبان انگلیسی","تمکن مالی مطابق اعلام IND","بیمه درمانی هلند"],
  visa: "اجازه اقامت دانشجویی معمولاً از طریق اسپانسرشیپ دانشگاه (MVV/VVR) پیگیری می‌شود.",
  work: "با مجوز کار می‌توانید پاره‌وقت کار کنید؛ سقف ساعت معمولاً ۱۶ ساعت در هفته در طول ترم است.",
  postStudy: "ویزای جستجوی کار یک‌ساله (Orientation Year) برای فارغ‌التحصیلان در دسترس است.",
  enrich: {
    "post-study": [sampleCallout("danger", "قوانین اقامت ممکن است سالانه تغییر کند؛ قبل از تصمیم‌گیری به‌روز بررسی کنید.")],
  },
});

export const countrySectionsBySlug: Record<string, ContentSection[]> = {
  "germany": sections_germany,
  "canada": sections_canada,
  "italy": sections_italy,
  "turkey": sections_turkey,
  "hungary": sections_hungary,
  "malaysia": sections_malaysia,
  "australia": sections_australia,
  "netherlands": sections_netherlands,
};
