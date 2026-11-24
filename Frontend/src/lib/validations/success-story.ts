import type { DefaultValues } from "react-hook-form";
import { z } from "zod";
import {
  PUBLICATION_STATUSES,
  type SuccessStory,
  type SuccessStoryCreate,
} from "@/contracts/content";
import { SLUG_PATTERN } from "@/lib/slug";

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
    .max(max, `${label} نباید بیشتر از ${max} کاراکتر باشد`);
}

export const successStoryFormSchema = z
  .object({
    studentName: z
      .string({ required_error: "نام دانشجو را وارد کنید" })
      .trim()
      .min(3, "نام باید حداقل ۳ حرف باشد")
      .max(80, "نام نباید بیشتر از ۸۰ کاراکتر باشد"),
    isAnonymous: z.boolean(),
    slug: z
      .string()
      .trim()
      .max(120, "اسلاگ نباید بیشتر از ۱۲۰ کاراکتر باشد")
      .refine(
        (value) => !value || SLUG_PATTERN.test(value),
        "اسلاگ فقط شامل حروف کوچک انگلیسی، عدد و خط تیره است",
      ),
    country: requiredText("کشور", 80),
    university: requiredText("دانشگاه", 160),
    field: requiredText("رشته", 120),
    year: z
      .number({
        required_error: "سال را وارد کنید",
        invalid_type_error: "سال باید عدد باشد",
      })
      .int("سال باید عدد صحیح باشد")
      .min(1990, "سال معتبر نیست")
      .max(2100, "سال معتبر نیست"),
    quote: requiredText("نقل‌قول", 500),
    body: optionalText("متن کامل", 10000),
    videoUrl: optionalText("لینک ویدیو", 500),
    photo: optionalText("تصویر", 500),
    publicationConsent: z.boolean(),
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
    seo: z.object({
      metaTitle: optionalText("عنوان متا", 70),
      metaDescription: optionalText("توضیحات متا", 160),
      ogImageId: optionalText("شناسه تصویر Open Graph", 36),
      noindex: z.boolean().optional(),
    }),
  })
  .superRefine((values, ctx) => {
    if (
      (values.status === "published" || values.status === "scheduled") &&
      !values.publicationConsent
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["publicationConsent"],
        message: "برای انتشار، رضایت انتشار الزامی است",
      });
    }
  });

export type SuccessStoryFormValues = z.infer<typeof successStoryFormSchema>;

export const SUCCESS_STORY_FORM_DEFAULTS: DefaultValues<SuccessStoryFormValues> =
  {
    studentName: "",
    isAnonymous: false,
    slug: "",
    country: "",
    university: "",
    field: "",
    year: new Date().getFullYear(),
    quote: "",
    body: "",
    videoUrl: "",
    photo: "",
    publicationConsent: false,
    status: "draft",
    scheduledAt: "",
    seo: {
      metaTitle: "",
      metaDescription: "",
      ogImageId: "",
      noindex: false,
    },
  };

export function successStoryToFormValues(
  story: SuccessStory,
): SuccessStoryFormValues {
  return {
    studentName: story.studentName,
    isAnonymous: story.isAnonymous,
    slug: story.slug ?? "",
    country: story.country,
    university: story.university,
    field: story.field,
    year: story.year,
    quote: story.quote,
    body: story.body ?? "",
    videoUrl: story.videoUrl ?? "",
    photo: story.photo ?? "",
    publicationConsent: story.publicationConsent,
    status: story.status,
    scheduledAt: story.scheduledAt ?? "",
    seo: {
      metaTitle: story.seo?.metaTitle ?? "",
      metaDescription: story.seo?.metaDescription ?? "",
      ogImageId: story.seo?.ogImageId ?? "",
      noindex: Boolean(story.seo?.noindex),
    },
  };
}

function orUndefined(value: string | undefined): string | undefined {
  return value ? value : undefined;
}

export function toSuccessStoryPayload(
  values: SuccessStoryFormValues,
): SuccessStoryCreate {
  return {
    studentName: values.studentName.trim(),
    isAnonymous: values.isAnonymous,
    slug: orUndefined(values.slug.trim()),
    country: values.country.trim(),
    university: values.university.trim(),
    field: values.field.trim(),
    year: values.year,
    quote: values.quote.trim(),
    body: orUndefined(values.body),
    videoUrl: orUndefined(values.videoUrl),
    photo: orUndefined(values.photo),
    publicationConsent: values.publicationConsent,
    status: values.status,
    scheduledAt:
      values.status === "scheduled" && values.scheduledAt?.trim()
        ? values.scheduledAt.trim()
        : undefined,
    order: 0,
    seo: {
      metaTitle: orUndefined(values.seo.metaTitle),
      metaDescription: orUndefined(values.seo.metaDescription),
      ogImageId: orUndefined(values.seo.ogImageId),
      noindex: values.seo.noindex || undefined,
    },
  };
}
