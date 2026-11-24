import type { ContentSection } from "@/types";
import {
  assignSectionIds,
  buildSectionInputs,
} from "@/lib/richcontent/builders";

function sectionId(slug: string, anchor: string, index: number): string {
  return `${slug}-section-${anchor}-${index}`;
}

export function serviceSections(
  slug: string,
  overview: string,
  benefits: string[],
): ContentSection[] {
  const inputs = buildSectionInputs("service", {
    overview,
    benefits,
  });
  return assignSectionIds(inputs, (anchor, index) => sectionId(slug, anchor, index));
}

export const svcSections_admission_consulting = serviceSections(
  "admission-consulting",
  "مسیر اپلای دانشگاه را از ارزیابی پروفایل تا دریافت نامه پذیرش همراهی می‌کنیم. مشاوران ما بر اساس معدل، زبان، بودجه و هدف شغلی، لیست واقع‌بینانه‌ای از دانشگاه‌ها پیشنهاد می‌دهند و مدارک درخواست را تا ثبت نهایی آماده می‌کنند.",
  ["انتخاب هدفمند دانشگاه در سه سطح امن، واقع‌بینانه و جاه‌طلبانه","نگارش و بازبینی انگیزه‌نامه، رزومه و توصیه‌نامه","هماهنگی ددلاین‌ها و پیگیری وضعیت درخواست","هم‌راستا کردن اپلای با برنامه زبان و ویزا"],
);

export const svcSections_visa_support = serviceSections(
  "visa-support",
  "پس از دریافت پذیرش، پرونده ویزای تحصیلی را بر اساس الزامات سفارت کشور مقصد آماده می‌کنیم. از چک‌لیست مدارک و تمکن مالی تا رزرو وقت و آمادگی مصاحبه، کنار شما هستیم تا ریسک نقص پرونده کاهش یابد.",
  ["چک‌لیست اختصاصی مدارک بر اساس کشور مقصد","راهنمایی تمکن مالی و منبع وجوه","آمادگی مصاحبه و مرور سناریوهای رایج","پیگیری وضعیت پرونده تا اعلام نتیجه"],
);

export const svcSections_language_prep = serviceSections(
  "language-prep",
  "برای رسیدن به نمره مورد نیاز دانشگاه، سطح فعلی شما را می‌سنجیم و برنامه مطالعه شخصی طراحی می‌کنیم. کلاس‌ها مهارت‌محورند و با ددلاین اپلای هماهنگ می‌شوند تا مدرک زبان به‌موقع آماده شود.",
  ["تعیین سطح دقیق و هدف نمره متناسب با دانشگاه","برنامه مطالعه شخصی با آزمون آزمایشی","هماهنگی زمان‌بندی با ددلاین اپلای","پشتیبانی برای انتخاب مرکز آزمون و ثبت‌نام"],
);

export const svcSections_document_translation = serviceSections(
  "document-translation",
  "مدارک تحصیلی و هویتی را مطابق الزامات کشور مقصد ترجمه رسمی می‌کنیم و مسیر تأیید، آپوستیل یا معادل‌سازی را شفاف می‌کنیم تا بسته مدارک برای اپلای و ویزا کامل باشد.",
  ["ترجمه رسمی توسط مترجم مورد تأیید","پیگیری آپوستیل و تأییدات وزارتی","چک‌لیست مدارک بر اساس کشور و دانشگاه","تحویل بسته مرتب و آماده ارسال"],
);

export const svcSections_scholarship_guidance = serviceSections(
  "scholarship-guidance",
  "بورسیه‌های متناسب با رشته، معدل و کشور هدف را شناسایی می‌کنیم و پرونده رقابتی شامل انگیزه‌نامه، توصیه‌نامه و مدارک پژوهشی را آماده می‌کنیم تا شانس دریافت کمک‌هزینه افزایش یابد.",
  ["لیست بورسیه‌های مرتبط با پروفایل شما","تقویت SOP و توصیه‌نامه‌ها برای رقابت","پیگیری مهلت‌ها و الزامات هر بورسیه","هماهنگی با مسیر اپلای اصلی"],
);

export const svcSections_accommodation = serviceSections(
  "accommodation",
  "پیش از سفر، گزینه‌های خوابگاه دانشگاهی و اجاره خصوصی را بر اساس بودجه و شهر مقصد معرفی می‌کنیم و در رزرو اولیه کمک می‌کنیم تا استقرار شما بدون استرس آغاز شود.",
  ["مقایسه خوابگاه و اجاره بر اساس بودجه","راهنمایی قرارداد و هزینه‌های جانبی","هماهنگی زمان ورود با ترم تحصیلی","پشتیبانی در هفته‌های اول استقرار"],
);

export const serviceSectionsBySlug: Record<string, ContentSection[]> = {
  "admission-consulting": svcSections_admission_consulting,
  "visa-support": svcSections_visa_support,
  "language-prep": svcSections_language_prep,
  "document-translation": svcSections_document_translation,
  "scholarship-guidance": svcSections_scholarship_guidance,
  "accommodation": svcSections_accommodation,
};
