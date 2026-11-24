import type { DefaultValues } from "react-hook-form";
import { z } from "zod";
import {
  CONTINENTS,
  COST_BANDS,
  PUBLICATION_STATUSES,
  type Country,
  type CountryCreate,
} from "@/contracts/content";
import { defaultSectionsFor } from "@/lib/content-templates";
import { SLUG_PATTERN } from "@/lib/slug";
import {
  contentSectionsFormSchema,
  type ContentSectionFormValues,
} from "@/lib/validations/content-section";

/**
 * Admin form of a country (`/admin/content/countries`). Limits mirror
 * `countryCreateSchema` in `src/contracts/content.ts`; messages are Persian.
 * `toCountryPayload` maps the form values onto the contract body, and the API
 * client validates that body against the contract again before sending.
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

function stringList(label: string, maxItems: number) {
  return z
    .array(z.string().trim().min(1, `${label} نمی‌تواند خالی باشد`))
    .max(maxItems, `${label} نباید بیشتر از ${maxItems} مورد باشد`);
}

/** Row shape for `FieldArrayEditor` string lists (RHF needs objects, not bare strings) */
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

export const countryFormSchema = z.object({
  nameFa: requiredText("نام فارسی", 80),
  nameEn: requiredText("نام انگلیسی", 80),
  slug: z
    .string({ required_error: "اسلاگ را وارد کنید" })
    .trim()
    .min(1, "اسلاگ را وارد کنید")
    .max(120, "اسلاگ نباید بیشتر از ۱۲۰ کاراکتر باشد")
    .regex(
      SLUG_PATTERN,
      "اسلاگ فقط شامل حروف کوچک انگلیسی، عدد و خط تیره است (مثال: new-zealand)",
    ),
  continent: z.enum(CONTINENTS, {
    errorMap: () => ({ message: "قاره را انتخاب کنید" }),
  }),
  costBand: z.enum(COST_BANDS, {
    errorMap: () => ({ message: "سطح هزینه را انتخاب کنید" }),
  }),
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
  flagEmoji: optionalText("پرچم", 16),
  flagPath: optionalText("مسیر تصویر پرچم", 300),
  heroImage: requiredText("تصویر شاخص", 500),
  summary: requiredText("خلاصه", 1000),
  language: requiredText("زبان تحصیل", 120),
  visaDuration: requiredText("مدت زمان ویزا", 120),
  costOfLiving: z
    .number({
      required_error: "هزینه زندگی را وارد کنید",
      invalid_type_error: "هزینه زندگی باید عدد باشد",
    })
    .min(0, "هزینه زندگی نمی‌تواند منفی باشد"),
  tuitionRange: requiredText("بازه شهریه", 120),
  currency: z
    .string({ required_error: "ارز را وارد کنید" })
    .trim()
    .regex(/^[A-Z]{3}$/, "کد ارز باید سه حرف بزرگ انگلیسی باشد (مثال: EUR)"),
  benefits: stringList("مزایا", 20),
  requirements: stringRowList("مدارک و شرایط", 50),
  popularFields: stringRowList("رشته‌های پرطرفدار", 50),
  costBreakdown: z.array(
    z.object({
      label: requiredText("عنوان", 120),
      amount: requiredText("مبلغ", 120),
      note: optionalText("توضیح", 300),
    }),
  ),
  faqs: z.array(
    z.object({
      question: z
        .string({ required_error: "پرسش را وارد کنید" })
        .trim()
        .min(3, "پرسش باید حداقل ۳ حرف باشد")
        .max(300, "پرسش نباید بیشتر از ۳۰۰ کاراکتر باشد"),
      answer: requiredText("پاسخ", 5000),
      category: optionalText("دسته", 80),
    }),
  ),
  sections: contentSectionsFormSchema,
  seo: z.object({
    metaTitle: optionalText("عنوان متا", 70),
    metaDescription: optionalText("توضیحات متا", 160),
    ogImageId: optionalText("شناسه تصویر Open Graph", 36),
    noindex: z.boolean().optional(),
  }),
});

export type CountryFormValues = z.infer<typeof countryFormSchema>;

/** Empty form of «افزودن کشور» */
export const COUNTRY_FORM_DEFAULTS: DefaultValues<CountryFormValues> = {
  nameFa: "",
  nameEn: "",
  slug: "",
  status: "draft",
  scheduledAt: "",
  flagEmoji: "",
  flagPath: "",
  heroImage: "",
  summary: "",
  language: "",
  visaDuration: "",
  tuitionRange: "",
  currency: "EUR",
  benefits: [],
  requirements: [],
  popularFields: [],
  costBreakdown: [],
  faqs: [],
  sections: defaultSectionsFor("country") as ContentSectionFormValues[],
  seo: { metaTitle: "", metaDescription: "", ogImageId: "", noindex: false },
};

/** Entity → form values («ویرایش کشور»); server ids of nested rows are dropped */
export function countryToFormValues(country: Country): CountryFormValues {
  return {
    nameFa: country.nameFa,
    nameEn: country.nameEn,
    slug: country.slug,
    continent: country.continent,
    costBand: country.costBand,
    status: country.status,
    scheduledAt: country.scheduledAt ?? "",
    flagEmoji: country.flagEmoji ?? "",
    flagPath: country.flagPath ?? "",
    heroImage: country.heroImage,
    summary: country.summary,
    language: country.language,
    visaDuration: country.visaDuration,
    costOfLiving: country.costOfLiving,
    tuitionRange: country.tuitionRange,
    currency: country.currency,
    benefits: country.benefits,
    requirements: country.requirements.map((value) => ({ value })),
    popularFields: country.popularFields.map((value) => ({ value })),
    costBreakdown: country.costBreakdown.map(({ label, amount, note }) => ({
      label,
      amount,
      note: note ?? "",
    })),
    faqs: country.faqs.map(({ question, answer, category }) => ({
      question,
      answer,
      category: category ?? "",
    })),
    sections: country.sections.map(({ title, anchor, icon, visible, content }) => ({
      title,
      anchor,
      icon,
      visible,
      content: content as CountryFormValues["sections"][number]["content"],
    })),
    seo: {
      metaTitle: country.seo.metaTitle ?? "",
      metaDescription: country.seo.metaDescription ?? "",
      ogImageId: country.seo.ogImageId ?? "",
      noindex: country.seo.noindex ?? false,
    },
  };
}

function orUndefined(value: string | undefined): string | undefined {
  return value ? value : undefined;
}

/** Form values → contract body of `POST /countries` / `PATCH /countries/{id}` */
export function toCountryPayload(values: CountryFormValues): CountryCreate {
  return {
    ...values,
    flagEmoji: orUndefined(values.flagEmoji),
    flagPath: orUndefined(values.flagPath),
    scheduledAt:
      values.status === "scheduled"
        ? orUndefined(values.scheduledAt)
        : undefined,
    requirements: values.requirements.map((row) => row.value),
    popularFields: values.popularFields.map((row) => row.value),
    costBreakdown: values.costBreakdown.map((row) => ({
      ...row,
      note: orUndefined(row.note),
    })),
    faqs: values.faqs.map((faq) => ({
      ...faq,
      category: orUndefined(faq.category),
    })),
    sections: values.sections.map(({ title, anchor, icon, visible, content }) => ({
      title,
      anchor,
      icon,
      visible,
      content: content as CountryCreate["sections"][number]["content"],
    })),
    seo: {
      metaTitle: orUndefined(values.seo.metaTitle),
      metaDescription: orUndefined(values.seo.metaDescription),
      ogImageId: orUndefined(values.seo.ogImageId),
      noindex: values.seo.noindex || undefined,
    },
  };
}
