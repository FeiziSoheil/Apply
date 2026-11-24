import type { DefaultValues } from "react-hook-form";
import { z } from "zod";
import {
  PUBLICATION_STATUSES,
  type University,
  type UniversityCreate,
} from "@/contracts/content";
import { defaultSectionsFor } from "@/lib/content-templates";
import { SLUG_PATTERN } from "@/lib/slug";
import {
  contentSectionsFormSchema,
  type ContentSectionFormValues,
} from "@/lib/validations/content-section";

/**
 * Admin form of a university (`/admin/content/universities`).
 * Limits mirror `universityCreateSchema`; `toUniversityPayload` maps to the contract.
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

function stringRowList(label: string, maxItems: number) {
  return z
    .array(
      z.object({
        value: z
          .string()
          .trim()
          .min(1, `${label} نمی‌تواند خالی باشد`),
      }),
    )
    .max(maxItems, `${label} نباید بیشتر از ${maxItems} مورد باشد`);
}

export const universityFormSchema = z.object({
  nameFa: requiredText("نام فارسی", 120),
  nameEn: requiredText("نام انگلیسی", 120),
  slug: z
    .string({ required_error: "اسلاگ را وارد کنید" })
    .trim()
    .min(1, "اسلاگ را وارد کنید")
    .max(120, "اسلاگ نباید بیشتر از ۱۲۰ کاراکتر باشد")
    .regex(
      SLUG_PATTERN,
      "اسلاگ فقط شامل حروف کوچک انگلیسی، عدد و خط تیره است (مثال: tu-munich)",
    ),
  countrySlug: requiredText("کشور", 120).regex(
    SLUG_PATTERN,
    "اسلاگ کشور معتبر نیست",
  ),
  city: requiredText("شهر", 80),
  ranking: z
    .number({
      required_error: "رتبه را وارد کنید",
      invalid_type_error: "رتبه باید عدد باشد",
    })
    .int("رتبه باید عدد صحیح باشد")
    .min(1, "رتبه باید حداقل ۱ باشد"),
  tuitionPerYear: z
    .number({
      required_error: "شهریه را وارد کنید",
      invalid_type_error: "شهریه باید عدد باشد",
    })
    .min(0, "شهریه نمی‌تواند منفی باشد"),
  currency: z
    .string({ required_error: "ارز را وارد کنید" })
    .trim()
    .regex(/^[A-Z]{3}$/, "کد ارز باید سه حرف بزرگ انگلیسی باشد (مثال: EUR)"),
  logo: requiredText("لوگو", 500),
  heroImage: requiredText("تصویر شاخص", 500),
  summary: requiredText("خلاصه", 500),
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
  deadlines: z.array(
    z.object({
      label: requiredText("عنوان ددلاین", 120),
      date: z
        .string({ required_error: "تاریخ را وارد کنید" })
        .trim()
        .min(1, "تاریخ را وارد کنید")
        .regex(/^\d{4}-\d{2}-\d{2}$/, "تاریخ باید به صورت YYYY-MM-DD باشد"),
    }),
  ),
  requirements: stringRowList("شرایط پذیرش", 50),
  sections: contentSectionsFormSchema,
  seo: z.object({
    metaTitle: optionalText("عنوان متا", 70),
    metaDescription: optionalText("توضیحات متا", 160),
    ogImageId: optionalText("شناسه تصویر Open Graph", 36),
    noindex: z.boolean().optional(),
  }),
});

export type UniversityFormValues = z.infer<typeof universityFormSchema>;

export const UNIVERSITY_FORM_DEFAULTS: DefaultValues<UniversityFormValues> = {
  nameFa: "",
  nameEn: "",
  slug: "",
  countrySlug: "",
  city: "",
  status: "draft",
  scheduledAt: "",
  logo: "",
  heroImage: "",
  summary: "",
  currency: "EUR",
  deadlines: [],
  requirements: [],
  sections: defaultSectionsFor("university") as ContentSectionFormValues[],
  seo: { metaTitle: "", metaDescription: "", ogImageId: "", noindex: false },
};

export function universityToFormValues(
  university: University,
): UniversityFormValues {
  return {
    nameFa: university.nameFa,
    nameEn: university.nameEn,
    slug: university.slug,
    countrySlug: university.countrySlug,
    city: university.city,
    ranking: university.ranking,
    tuitionPerYear: university.tuitionPerYear,
    currency: university.currency,
    logo: university.logo,
    heroImage: university.heroImage,
    summary: university.summary,
    status: university.status,
    scheduledAt: university.scheduledAt ?? "",
    deadlines: university.deadlines.map(({ label, date }) => ({ label, date })),
    requirements: university.requirements.map((value) => ({ value })),
    sections: university.sections.map(
      ({ title, anchor, icon, visible, content }) => ({
        title,
        anchor,
        icon,
        visible,
        content: content as UniversityFormValues["sections"][number]["content"],
      }),
    ),
    seo: {
      metaTitle: university.seo?.metaTitle ?? "",
      metaDescription: university.seo?.metaDescription ?? "",
      ogImageId: university.seo?.ogImageId ?? "",
      noindex: university.seo?.noindex ?? false,
    },
  };
}

function orUndefined(value: string | undefined): string | undefined {
  return value ? value : undefined;
}

export function toUniversityPayload(
  values: UniversityFormValues,
): UniversityCreate {
  return {
    nameFa: values.nameFa,
    nameEn: values.nameEn,
    slug: values.slug,
    countrySlug: values.countrySlug,
    city: values.city,
    ranking: values.ranking,
    tuitionPerYear: values.tuitionPerYear,
    currency: values.currency,
    logo: values.logo,
    heroImage: values.heroImage,
    summary: values.summary,
    status: values.status,
    scheduledAt:
      values.status === "scheduled"
        ? orUndefined(values.scheduledAt)
        : undefined,
    deadlines: values.deadlines,
    requirements: values.requirements.map((row) => row.value),
    sections: values.sections.map(
      ({ title, anchor, icon, visible, content }) => ({
        title,
        anchor,
        icon,
        visible,
        content: content as UniversityCreate["sections"][number]["content"],
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
