import { z } from "zod";
import {
  MAX_SECTIONS,
  SECTION_ICON_KEYS,
  emptyRichContentDoc,
  type SectionIcon,
} from "@/contracts/richcontent";
import { SLUG_PATTERN } from "@/lib/slug";

/**
 * Admin form schema for `sections[]` — mirrors `contentSectionInputSchema`
 * with Persian messages. RichContent is kept shallow here so react-hook-form
 * generics stay finite; the API contract re-validates the full doc on write.
 */

/** TipTap doc root without recursive node typing (RHF-friendly). */
export type FormRichDoc = {
  type: "doc";
  content?: unknown[];
};

export type ContentSectionFormValues = {
  title: string;
  anchor: string;
  icon?: SectionIcon;
  visible: boolean;
  content: FormRichDoc;
};

function isRichDoc(value: unknown): value is FormRichDoc {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    (value as { type: unknown }).type === "doc"
  );
}

export const contentSectionFormSchema = z.object({
  title: z
    .string({ required_error: "عنوان بخش را وارد کنید" })
    .trim()
    .min(1, "عنوان بخش را وارد کنید")
    .max(120, "عنوان بخش نباید بیشتر از ۱۲۰ کاراکتر باشد"),
  anchor: z
    .string({ required_error: "انکر بخش را وارد کنید" })
    .trim()
    .min(1, "انکر بخش را وارد کنید")
    .max(80, "انکر نباید بیشتر از ۸۰ کاراکتر باشد")
    .regex(
      SLUG_PATTERN,
      "انکر باید ASCII kebab-case باشد (حروف کوچک، عدد و خط تیره)",
    ),
  icon: z.enum(SECTION_ICON_KEYS).optional(),
  visible: z.boolean(),
  content: z.custom<FormRichDoc>(isRichDoc, {
    message: "محتوای بخش معتبر نیست",
  }),
});

export const contentSectionsFormSchema = z
  .array(contentSectionFormSchema)
  .max(MAX_SECTIONS, `حداکثر ${MAX_SECTIONS} بخش مجاز است`)
  .superRefine((sections, ctx) => {
    const seen = new Set<string>();
    sections.forEach((section, index) => {
      if (seen.has(section.anchor)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "انکر بخش‌ها باید یکتا باشد",
          path: [index, "anchor"],
        });
      }
      seen.add(section.anchor);
    });
  });

/** Empty custom section for «بخش خالی سفارشی». */
export function emptyCustomSection(anchor = "section"): ContentSectionFormValues {
  return {
    title: "بخش جدید",
    anchor,
    visible: true,
    content: emptyRichContentDoc() as FormRichDoc,
  };
}

/** Ensure `base` is unique among `existing` (optionally skipping one index). */
export function uniqueSectionAnchor(
  base: string,
  existing: readonly string[],
  excludeIndex?: number,
): string {
  const root = base.trim() || "section";
  let candidate = root;
  let n = 2;
  while (
    existing.some(
      (anchor, index) =>
        anchor === candidate &&
        (excludeIndex === undefined || index !== excludeIndex),
    )
  ) {
    candidate = `${root}-${n}`;
    n += 1;
  }
  return candidate.slice(0, 80);
}
