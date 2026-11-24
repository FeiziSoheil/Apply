import type { ContentSection } from "@/types";
import {
  assignSectionIds,
  buildSectionInputs,
  sampleCallout,
} from "@/lib/richcontent/builders";

function sectionId(slug: string, anchor: string, index: number): string {
  return `${slug}-section-${anchor}-${index}`;
}

export function universitySections(
  slug: string,
  description: string,
  facilities?: string,
  studentLife?: string,
): ContentSection[] {
  const inputs = buildSectionInputs("university", {
    intro: description,
    facilities:
      facilities ??
      "کتابخانه، آزمایشگاه‌ها، مراکز نوآوری و خدمات پشتیبانی دانشجویی از امکانات اصلی پردیس هستند.",
    "student-life":
      studentLife ??
      "انجمن‌های دانشجویی، رویدادهای فرهنگی و امکان کار پاره‌وقت فضای زنده‌ای برای دانشجویان بین‌المللی می‌سازد.",
  });
  return assignSectionIds(inputs, (anchor, index) => sectionId(slug, anchor, index));
}

export const uniSections_tu_munich = (() => {
  const sections = universitySections(
    "tu-munich",
    "یکی از برترین دانشگاه‌های فنی اروپا با تمرکز بر مهندسی، علوم طبیعی و فناوری.",
    "آزمایشگاه‌های پیشرفته مهندسی، مرکز کار آفرینی و کتابخانه دیجیتال گسترده.",
  );
  const intro = sections.find((s) => s.anchor === "intro");
  if (intro) {
    intro.content = {
      type: "doc",
      content: [
        ...(intro.content.content ?? []),
        sampleCallout("info", "رتبه و شهریه در کارت دانشگاه به‌صورت ساختاریافته نمایش داده می‌شود."),
      ],
    };
  }
  return sections;
})();

export const uniSections_heidelberg = universitySections(
  "heidelberg",
  "قدیمی‌ترین دانشگاه آلمان با شهرت جهانی در علوم انسانی، پزشکی و علوم پایه.",
  undefined,
  "شهر دانشگاهی تاریخی با فضای پژوهشی قوی و انجمن‌های بین‌المللی فعال.",
);

export const uniSections_university_of_toronto = universitySections("university-of-toronto", "دانشگاه پیشرو کانادا در تحقیقات، با تنوع بالای رشته‌ها و پردیس شهری پویا.");

export const uniSections_ubc = universitySections("ubc", "دانشگاه تحقیقاتی تراز اول در ساحل غربی کانادا با محیط بین‌المللی.");

export const uniSections_bocconi = universitySections("bocconi", "دانشگاه تخصصی اقتصاد، مدیریت و حقوق با اعتبار بالا در اروپا.");

export const uniSections_sapienza = universitySections("sapienza", "یکی از بزرگ‌ترین دانشگاه‌های اروپا با شهریه دولتی و رشته‌های متنوع.");

export const uniSections_bogazici_university = universitySections("bogazici-university", "از معتبرترین دانشگاه‌های دولتی ترکیه با آموزش عمدتاً به زبان انگلیسی.");

export const uniSections_metu = universitySections("metu", "دانشگاه فنی برجسته ترکیه با تمرکز بر مهندسی و علوم پایه به زبان انگلیسی.");

export const uniSections_elte = universitySections("elte", "قدیمی‌ترین دانشگاه مجارستان با برنامه‌های انگلیسی در علوم و علوم انسانی.");

export const uniSections_university_of_debrecen = universitySections("university-of-debrecen", "دانشگاه محبوب برای رشته‌های پزشکی و مهندسی به زبان انگلیسی.");

export const uniSections_university_of_malaya = universitySections("university-of-malaya", "برترین دانشگاه مالزی با رتبه‌بندی جهانی قوی و محیط چندفرهنگی.");

export const uniSections_utm = universitySections("utm", "دانشگاه فنی پیشرو مالزی با تمرکز بر مهندسی و فناوری.");

export const uniSections_university_of_melbourne = universitySections("university-of-melbourne", "از برترین دانشگاه‌های جهان با استانداردهای پژوهشی بسیار بالا.");

export const uniSections_unsw = universitySections("unsw", "دانشگاه تحقیقاتی برجسته استرالیا با ارتباط قوی با صنعت و نوآوری.");

export const uniSections_delft = universitySections("delft", "یکی از بهترین دانشگاه‌های فنی جهان در مهندسی عمران، معماری و فناوری.");

export const uniSections_amsterdam = universitySections("amsterdam", "دانشگاه جامع هلند با برنامه‌های انگلیسی گسترده در علوم اجتماعی و انسانی.");

export const universitySectionsBySlug: Record<string, ContentSection[]> = {
  "tu-munich": uniSections_tu_munich,
  "heidelberg": uniSections_heidelberg,
  "university-of-toronto": uniSections_university_of_toronto,
  "ubc": uniSections_ubc,
  "bocconi": uniSections_bocconi,
  "sapienza": uniSections_sapienza,
  "bogazici-university": uniSections_bogazici_university,
  "metu": uniSections_metu,
  "elte": uniSections_elte,
  "university-of-debrecen": uniSections_university_of_debrecen,
  "university-of-malaya": uniSections_university_of_malaya,
  "utm": uniSections_utm,
  "university-of-melbourne": uniSections_university_of_melbourne,
  "unsw": uniSections_unsw,
  "delft": uniSections_delft,
  "amsterdam": uniSections_amsterdam,
};
