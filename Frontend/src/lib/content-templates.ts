import {
  emptyRichContentDoc,
  paragraphDoc,
  type ContentSectionInput,
} from "@/contracts/richcontent";

export type ContentTemplateKind =
  | "country"
  | "university"
  | "service"
  | "program";

export type TemplateSectionMeta = {
  title: string;
  anchor: string;
  icon?: ContentSectionInput["icon"];
};

const COUNTRY_SECTIONS: readonly TemplateSectionMeta[] = [
  { title: "مزایا", anchor: "benefits", icon: "sparkles" },
  { title: "هزینه‌ها", anchor: "costs", icon: "wallet" },
  { title: "شرایط پذیرش", anchor: "requirements", icon: "clipboard-check" },
  { title: "ویزا", anchor: "visa", icon: "stamp" },
  { title: "کار حین تحصیل", anchor: "work", icon: "briefcase" },
  { title: "اقامت بعد از تحصیل", anchor: "post-study", icon: "home" },
] as const;

const UNIVERSITY_SECTIONS: readonly TemplateSectionMeta[] = [
  { title: "معرفی", anchor: "intro", icon: "building-2" },
  { title: "امکانات", anchor: "facilities", icon: "book-open" },
  { title: "زندگی دانشجویی", anchor: "student-life", icon: "users" },
] as const;

const SERVICE_SECTIONS: readonly TemplateSectionMeta[] = [
  { title: "توضیح", anchor: "overview", icon: "info" },
  { title: "مزایا", anchor: "benefits", icon: "sparkles" },
] as const;

const PROGRAM_SECTIONS: readonly TemplateSectionMeta[] = [
  { title: "معرفی رشته", anchor: "overview", icon: "graduation-cap" },
  { title: "شرایط پذیرش", anchor: "requirements", icon: "clipboard-check" },
  { title: "فرصت‌های شغلی", anchor: "career", icon: "briefcase" },
] as const;

const TEMPLATES: Record<ContentTemplateKind, readonly TemplateSectionMeta[]> = {
  country: COUNTRY_SECTIONS,
  university: UNIVERSITY_SECTIONS,
  service: SERVICE_SECTIONS,
  program: PROGRAM_SECTIONS,
};

/** Metadata of default templates for a content kind (for UI pickers). */
export function templateMetaFor(
  kind: ContentTemplateKind,
): readonly TemplateSectionMeta[] {
  return TEMPLATES[kind];
}

/** Default empty sections (Persian titles + anchors) for a content type. */
export function defaultSectionsFor(
  kind: ContentTemplateKind,
): ContentSectionInput[] {
  return TEMPLATES[kind].map((section) => ({
    title: section.title,
    anchor: section.anchor,
    icon: section.icon,
    visible: true,
    content: emptyRichContentDoc(),
  }));
}

/** Build default sections pre-filled with paragraph placeholders. */
export function seededSectionsFor(
  kind: ContentTemplateKind,
  copy: Record<string, string | string[] | undefined>,
): ContentSectionInput[] {
  return TEMPLATES[kind].map((section) => {
    const raw = copy[section.anchor];
    let content = emptyRichContentDoc();
    if (typeof raw === "string" && raw.trim()) {
      content = paragraphDoc(raw.trim());
    } else if (Array.isArray(raw) && raw.length > 0) {
      content = {
        type: "doc",
        content: [
          {
            type: "bulletList",
            content: raw.map((item) => ({
              type: "listItem" as const,
              content: [
                {
                  type: "paragraph" as const,
                  content: [{ type: "text" as const, text: item }],
                },
              ],
            })),
          },
        ],
      };
    }
    return {
      title: section.title,
      anchor: section.anchor,
      icon: section.icon,
      visible: true,
      content,
    };
  });
}
