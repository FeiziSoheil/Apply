import type { DefaultValues } from "react-hook-form";
import { z } from "zod";
import {
  PUBLICATION_STATUSES,
  type Service,
  type ServiceCreate,
} from "@/contracts/content";
import { defaultSectionsFor } from "@/lib/content-templates";
import { SERVICE_ICON_KEYS } from "@/lib/icons";
import { SLUG_PATTERN } from "@/lib/slug";
import {
  contentSectionsFormSchema,
  type ContentSectionFormValues,
} from "@/lib/validations/content-section";

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

export const serviceFormSchema = z.object({
  title: requiredText("عنوان", 120),
  slug: z
    .string({ required_error: "اسلاگ را وارد کنید" })
    .trim()
    .min(1, "اسلاگ را وارد کنید")
    .max(120, "اسلاگ نباید بیشتر از ۱۲۰ کاراکتر باشد")
    .regex(
      SLUG_PATTERN,
      "اسلاگ فقط شامل حروف کوچک انگلیسی، عدد و خط تیره است",
    ),
  shortDescription: requiredText("توضیح کوتاه", 300),
  icon: z.enum(SERVICE_ICON_KEYS, {
    errorMap: () => ({ message: "آیکن را انتخاب کنید" }),
  }),
  duration: requiredText("مدت تقریبی", 120),
  price: z
    .number({ invalid_type_error: "مبلغ باید عدد باشد" })
    .int("مبلغ باید عدد صحیح ریال باشد")
    .min(0, "مبلغ نمی‌تواند منفی باشد")
    .optional(),
  steps: stringRowList("گام فرآیند", 30),
  requiredDocuments: stringRowList("مدرک الزامی", 50),
  relatedServiceSlugs: z
    .array(z.string().trim().min(1))
    .max(10, "حداکثر ۱۰ خدمت مرتبط مجاز است"),
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
});

export type ServiceFormValues = z.infer<typeof serviceFormSchema>;

export const SERVICE_FORM_DEFAULTS: DefaultValues<ServiceFormValues> = {
  title: "",
  slug: "",
  shortDescription: "",
  icon: "graduation-cap",
  duration: "",
  price: undefined,
  steps: [],
  requiredDocuments: [],
  relatedServiceSlugs: [],
  faqs: [],
  sections: defaultSectionsFor("service") as ContentSectionFormValues[],
  status: "draft",
  scheduledAt: "",
  seo: {
    metaTitle: "",
    metaDescription: "",
    ogImageId: "",
    noindex: false,
  },
};

export function serviceToFormValues(service: Service): ServiceFormValues {
  return {
    title: service.title,
    slug: service.slug,
    shortDescription: service.shortDescription,
    icon: (SERVICE_ICON_KEYS as readonly string[]).includes(service.icon)
      ? (service.icon as ServiceFormValues["icon"])
      : "graduation-cap",
    duration: service.duration,
    price: service.price,
    steps: service.steps.map((value) => ({ value })),
    requiredDocuments: service.requiredDocuments.map((value) => ({ value })),
    relatedServiceSlugs: service.relatedServiceSlugs,
    faqs: service.faqs.map(({ question, answer, category }) => ({
      question,
      answer,
      category: category ?? "",
    })),
    sections: service.sections.map(
      ({ title, anchor, icon, visible, content }) => ({
        title,
        anchor,
        icon,
        visible,
        content: content as ServiceFormValues["sections"][number]["content"],
      }),
    ),
    status: service.status,
    scheduledAt: service.scheduledAt ?? "",
    seo: {
      metaTitle: service.seo?.metaTitle ?? "",
      metaDescription: service.seo?.metaDescription ?? "",
      ogImageId: service.seo?.ogImageId ?? "",
      noindex: Boolean(service.seo?.noindex),
    },
  };
}

function orUndefined(value: string | undefined): string | undefined {
  return value ? value : undefined;
}

export function toServicePayload(values: ServiceFormValues): ServiceCreate {
  return {
    title: values.title.trim(),
    slug: values.slug.trim(),
    shortDescription: values.shortDescription.trim(),
    icon: values.icon,
    duration: values.duration.trim(),
    price: values.price,
    steps: values.steps.map((row) => row.value),
    requiredDocuments: values.requiredDocuments.map((row) => row.value),
    relatedServiceSlugs: values.relatedServiceSlugs,
    faqs: values.faqs.map((faq) => ({
      question: faq.question.trim(),
      answer: faq.answer.trim(),
      category: orUndefined(faq.category),
    })),
    sections: values.sections.map(
      ({ title, anchor, icon, visible, content }) => ({
        title,
        anchor,
        icon,
        visible,
        content: content as ServiceCreate["sections"][number]["content"],
      }),
    ),
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
