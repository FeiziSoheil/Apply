import type { DefaultValues } from "react-hook-form";
import { z } from "zod";
import {
  DEGREE_LEVELS,
  LANGUAGE_REQUIREMENT_TYPES,
  PUBLICATION_STATUSES,
  type Program,
  type ProgramCreate,
} from "@/contracts/content";
import {
  formatLanguageRequirement,
  parseLanguageRequirement,
} from "@/lib/language-requirements";
import { SLUG_PATTERN } from "@/lib/slug";
import {
  contentSectionsFormSchema,
  type ContentSectionFormValues,
} from "@/lib/validations/content-section";

/**
 * Admin form of a program (`/admin/content/programs`).
 * Language type + score map onto the contract `languageRequirement` string.
 */

function requiredText(label: string, max: number) {
  return z
    .string({ required_error: `${label} را وارد کنید` })
    .trim()
    .min(1, `${label} را وارد کنید`)
    .max(max, `${label} نباید بیشتر از ${max} کاراکتر باشد`);
}

function optionalText(label: string, max: number) {
  return z
    .string()
    .trim()
    .max(max, `${label} نباید بیشتر از ${max} کاراکتر باشد`)
    .optional();
}

export const programFormSchema = z
  .object({
    nameFa: requiredText("نام برنامه", 160),
    slug: z
      .string({ required_error: "اسلاگ را وارد کنید" })
      .trim()
      .min(1, "اسلاگ را وارد کنید")
      .max(120, "اسلاگ نباید بیشتر از ۱۲۰ کاراکتر باشد")
      .regex(
        SLUG_PATTERN,
        "اسلاگ فقط شامل حروف کوچک انگلیسی، عدد و خط تیره است",
      ),
    universitySlug: requiredText("دانشگاه", 120).regex(
      SLUG_PATTERN,
      "اسلاگ دانشگاه معتبر نیست",
    ),
    /** Filled from the selected university; read-only in the UI */
    countrySlug: requiredText("کشور", 120).regex(
      SLUG_PATTERN,
      "اسلاگ کشور معتبر نیست",
    ),
    degreeLevel: z.enum(DEGREE_LEVELS, {
      errorMap: () => ({ message: "مقطع را انتخاب کنید" }),
    }),
    field: requiredText("رشته", 120),
    duration: requiredText("مدت دوره", 60),
    tuition: z
      .number({
        required_error: "شهریه را وارد کنید",
        invalid_type_error: "شهریه باید عدد باشد",
      })
      .min(0, "شهریه نمی‌تواند منفی باشد"),
    currency: z
      .string({ required_error: "ارز را وارد کنید" })
      .trim()
      .regex(/^[A-Z]{3}$/, "کد ارز باید سه حرف بزرگ انگلیسی باشد (مثال: EUR)"),
    languageType: z.enum(LANGUAGE_REQUIREMENT_TYPES, {
      errorMap: () => ({ message: "نوع مدرک زبان را انتخاب کنید" }),
    }),
    languageMinScore: z
      .number({ invalid_type_error: "نمره باید عدد باشد" })
      .min(0, "نمره نمی‌تواند منفی باشد")
      .max(120, "نمره بیش از حد بزرگ است")
      .optional(),
    languageOther: optionalText("توضیح مدرک زبان", 120),
    minGpa: z
      .number({
        required_error: "حداقل معدل را وارد کنید",
        invalid_type_error: "معدل باید عدد باشد",
      })
      .min(0, "معدل نمی‌تواند منفی باشد")
      .max(4, "معدل در مقیاس ۴ است"),
    intakes: z
      .array(z.string().trim().min(1, "intake نمی‌تواند خالی باشد"))
      .min(1, "حداقل یک intake وارد کنید")
      .max(8, "بیش از ۸ intake مجاز نیست"),
    deadline: z
      .string({ required_error: "ددلاین را وارد کنید" })
      .trim()
      .min(1, "ددلاین را وارد کنید")
      .regex(/^\d{4}-\d{2}-\d{2}$/, "تاریخ باید به صورت YYYY-MM-DD باشد"),
    hasScholarship: z.boolean(),
    status: z.enum(PUBLICATION_STATUSES, {
      errorMap: () => ({ message: "وضعیت انتشار را انتخاب کنید" }),
    }),
    scheduledAt: z
      .string()
      .trim()
      .optional()
      .refine(
        (value) => !value || !Number.isNaN(Date.parse(value)),
        "زمان انتشار معتبر نیست",
      ),
    sections: contentSectionsFormSchema.optional(),
    seo: z.object({
      metaTitle: optionalText("عنوان متا", 70),
      metaDescription: optionalText("توضیحات متا", 160),
      ogImageId: optionalText("شناسه تصویر Open Graph", 36),
      noindex: z.boolean().optional(),
    }),
  })
  .superRefine((values, ctx) => {
    if (
      values.languageType !== "none" &&
      values.languageType !== "other" &&
      values.languageMinScore === undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["languageMinScore"],
        message: "حداقل نمره را وارد کنید",
      });
    }
    if (
      values.languageType === "other" &&
      !values.languageOther?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["languageOther"],
        message: "توضیح مدرک زبان را وارد کنید",
      });
    }
  });

export type ProgramFormValues = z.infer<typeof programFormSchema>;

export const PROGRAM_FORM_DEFAULTS: DefaultValues<ProgramFormValues> = {
  nameFa: "",
  slug: "",
  universitySlug: "",
  countrySlug: "",
  field: "",
  duration: "",
  currency: "EUR",
  languageType: "ielts",
  languageOther: "",
  intakes: [],
  deadline: "",
  hasScholarship: false,
  status: "draft",
  scheduledAt: "",
  sections: undefined,
  seo: { metaTitle: "", metaDescription: "", ogImageId: "", noindex: false },
};

export function programToFormValues(program: Program): ProgramFormValues {
  const language = parseLanguageRequirement(program.languageRequirement);
  return {
    nameFa: program.nameFa,
    slug: program.slug,
    universitySlug: program.universitySlug,
    countrySlug: program.countrySlug,
    degreeLevel: program.degreeLevel,
    field: program.field,
    duration: program.duration,
    tuition: program.tuition,
    currency: program.currency,
    languageType: language.type,
    languageMinScore: language.minScore,
    languageOther:
      language.type === "other" ? program.languageRequirement : "",
    minGpa: program.minGpa,
    intakes: [...program.intakes],
    deadline: program.deadline,
    hasScholarship: program.hasScholarship,
    status: program.status ?? "published",
    scheduledAt: program.scheduledAt ?? "",
    sections: program.sections?.map(
      ({ title, anchor, icon, visible, content }) => ({
        title,
        anchor,
        icon,
        visible,
        content: content as ContentSectionFormValues["content"],
      }),
    ),
    seo: {
      metaTitle: program.seo?.metaTitle ?? "",
      metaDescription: program.seo?.metaDescription ?? "",
      ogImageId: program.seo?.ogImageId ?? "",
      noindex: program.seo?.noindex ?? false,
    },
  };
}

function orUndefined(value: string | undefined): string | undefined {
  return value ? value : undefined;
}

export function toProgramPayload(values: ProgramFormValues): ProgramCreate {
  return {
    nameFa: values.nameFa,
    slug: values.slug,
    universitySlug: values.universitySlug,
    countrySlug: values.countrySlug,
    degreeLevel: values.degreeLevel,
    field: values.field,
    duration: values.duration,
    tuition: values.tuition,
    currency: values.currency,
    languageRequirement: formatLanguageRequirement(
      values.languageType,
      values.languageMinScore,
      values.languageOther,
    ),
    minGpa: values.minGpa,
    intakes: values.intakes,
    deadline: values.deadline,
    hasScholarship: values.hasScholarship,
    status: values.status,
    scheduledAt:
      values.status === "scheduled"
        ? orUndefined(values.scheduledAt)
        : undefined,
    sections: values.sections?.map(
      ({ title, anchor, icon, visible, content }) => ({
        title,
        anchor,
        icon,
        visible,
        content: content as NonNullable<
          ProgramCreate["sections"]
        >[number]["content"],
      }),
    ),
    seo: {
      metaTitle: orUndefined(values.seo.metaTitle),
      metaDescription: orUndefined(values.seo.metaDescription),
      ogImageId: orUndefined(values.seo.ogImageId),
      noindex: values.seo.noindex || undefined,
    },
  };
}
