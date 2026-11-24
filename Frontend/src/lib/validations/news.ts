import type { DefaultValues } from "react-hook-form";
import { z } from "zod";
import {
  NEWS_EVENT_TYPES,
  PUBLICATION_STATUSES,
  type NewsItem,
  type NewsItemCreate,
} from "@/contracts/content";
import { emptyRichContentDoc } from "@/contracts/richcontent";
import { SLUG_PATTERN } from "@/lib/slug";
import type { FormRichDoc } from "@/lib/validations/content-section";

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

function isRichDoc(value: unknown): value is FormRichDoc {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    (value as { type: unknown }).type === "doc"
  );
}

export const NEWS_EVENT_TYPE_OPTIONS = [
  { value: "webinar", label: "وبینار" },
  { value: "exhibition", label: "نمایشگاه" },
  { value: "visa", label: "تغییر مقررات ویزا" },
  { value: "deadline", label: "ددلاین" },
  { value: "general", label: "اطلاعیه" },
] as const;

export const newsFormSchema = z
  .object({
    title: requiredText("عنوان", 200),
    slug: z
      .string({ required_error: "اسلاگ را وارد کنید" })
      .trim()
      .min(1, "اسلاگ را وارد کنید")
      .max(120, "اسلاگ نباید بیشتر از ۱۲۰ کاراکتر باشد")
      .regex(
        SLUG_PATTERN,
        "اسلاگ فقط شامل حروف کوچک انگلیسی، عدد و خط تیره است",
      ),
    excerpt: requiredText("خلاصه", 1000),
    content: z.custom<FormRichDoc>(isRichDoc, {
      message: "محتوای خبر معتبر نیست",
    }),
    eventType: z.enum(NEWS_EVENT_TYPES, {
      errorMap: () => ({ message: "نوع خبر را انتخاب کنید" }),
    }),
    eventDate: z
      .string()
      .trim()
      .optional()
      .refine(
        (value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value),
        "تاریخ رویداد باید به‌صورت YYYY-MM-DD باشد",
      ),
    registrationUrl: z
      .string()
      .trim()
      .optional()
      .refine(
        (value) => !value || /^https?:\/\//i.test(value),
        "لینک ثبت‌نام باید با http یا https شروع شود",
      )
      .refine(
        (value) => !value || value.length <= 500,
        "لینک ثبت‌نام نباید بیشتر از ۵۰۰ کاراکتر باشد",
      ),
    coverImage: optionalText("تصویر شاخص", 500),
    coverImageAlt: optionalText("متن جایگزین تصویر", 200),
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
    if (values.coverImage.trim() && !values.coverImageAlt.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["coverImageAlt"],
        message: "برای تصویر شاخص متن جایگزین وارد کنید",
      });
    }
  });

export type NewsFormValues = z.infer<typeof newsFormSchema>;

export const NEWS_FORM_DEFAULTS: DefaultValues<NewsFormValues> = {
  title: "",
  slug: "",
  excerpt: "",
  content: emptyRichContentDoc() as FormRichDoc,
  eventType: "general",
  eventDate: "",
  registrationUrl: "",
  coverImage: "",
  coverImageAlt: "",
  status: "draft",
  scheduledAt: "",
  seo: {
    metaTitle: "",
    metaDescription: "",
    ogImageId: "",
    noindex: false,
  },
};

export function newsItemToFormValues(item: NewsItem): NewsFormValues {
  return {
    title: item.title,
    slug: item.slug,
    excerpt: item.excerpt,
    content: item.content as FormRichDoc,
    eventType: item.eventType,
    eventDate: item.eventDate ?? "",
    registrationUrl: item.registrationUrl ?? "",
    coverImage: item.coverImage ?? "",
    coverImageAlt: item.coverImageAlt ?? "",
    status: item.status,
    scheduledAt: item.scheduledAt ?? "",
    seo: {
      metaTitle: item.seo?.metaTitle ?? "",
      metaDescription: item.seo?.metaDescription ?? "",
      ogImageId: item.seo?.ogImageId ?? "",
      noindex: Boolean(item.seo?.noindex),
    },
  };
}

export function toNewsItemPayload(values: NewsFormValues): NewsItemCreate {
  const content = values.content as NewsItemCreate["content"];
  const coverImage = values.coverImage.trim();
  const coverImageAlt = values.coverImageAlt.trim();
  const eventDate = values.eventDate?.trim() ?? "";
  const registrationUrl = values.registrationUrl?.trim() ?? "";
  const metaTitle = values.seo.metaTitle.trim();
  const metaDescription = values.seo.metaDescription.trim();
  const ogImageId = values.seo.ogImageId.trim();

  return {
    title: values.title.trim(),
    slug: values.slug.trim(),
    excerpt: values.excerpt.trim(),
    content,
    eventType: values.eventType,
    eventDate: eventDate || undefined,
    registrationUrl: registrationUrl || undefined,
    coverImage: coverImage || undefined,
    coverImageAlt: coverImageAlt || undefined,
    status: values.status,
    scheduledAt:
      values.status === "scheduled" && values.scheduledAt?.trim()
        ? values.scheduledAt.trim()
        : undefined,
    seo: {
      metaTitle: metaTitle || undefined,
      metaDescription: metaDescription || undefined,
      ogImageId: ogImageId || undefined,
      noindex: values.seo.noindex || undefined,
    },
  };
}
