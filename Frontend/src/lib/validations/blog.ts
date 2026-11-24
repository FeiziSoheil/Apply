import type { DefaultValues } from "react-hook-form";
import { z } from "zod";
import {
  PUBLICATION_STATUSES,
  type BlogPost,
  type BlogPostCreate,
} from "@/contracts/content";
import { emptyRichContentDoc } from "@/contracts/richcontent";
import { estimateReadingTime } from "@/lib/richcontent";
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

export const blogFormSchema = z.object({
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
  excerpt: requiredText("خلاصه", 500),
  content: z.custom<FormRichDoc>(isRichDoc, {
    message: "محتوای مقاله معتبر نیست",
  }),
  categoryId: z.string().trim().min(1, "دسته را انتخاب کنید"),
  category: requiredText("عنوان دسته", 80),
  tags: z
    .array(z.string().trim().min(1).max(40))
    .max(20, "حداکثر ۲۰ برچسب مجاز است"),
  author: requiredText("نویسنده", 80),
  coverImage: requiredText("تصویر شاخص", 500),
  coverImageAlt: optionalText("متن جایگزین تصویر", 200),
  featured: z.boolean().optional(),
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

export type BlogFormValues = z.infer<typeof blogFormSchema>;

export const BLOG_FORM_DEFAULTS: DefaultValues<BlogFormValues> = {
  title: "",
  slug: "",
  excerpt: "",
  content: emptyRichContentDoc() as FormRichDoc,
  categoryId: "",
  category: "",
  tags: [],
  author: "",
  coverImage: "",
  coverImageAlt: "",
  featured: false,
  status: "draft",
  scheduledAt: "",
  seo: {
    metaTitle: "",
    metaDescription: "",
    ogImageId: "",
    noindex: false,
  },
};

export function blogPostToFormValues(post: BlogPost): BlogFormValues {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content as FormRichDoc,
    categoryId: post.categoryId ?? "",
    category: post.category,
    tags: [...post.tags],
    author: post.author,
    coverImage: post.coverImage,
    coverImageAlt: post.coverImageAlt ?? "",
    featured: Boolean(post.featured),
    status: post.status,
    scheduledAt: post.scheduledAt ?? "",
    seo: {
      metaTitle: post.seo?.metaTitle ?? "",
      metaDescription: post.seo?.metaDescription ?? "",
      ogImageId: post.seo?.ogImageId ?? "",
      noindex: Boolean(post.seo?.noindex),
    },
  };
}

export function toBlogPostPayload(values: BlogFormValues): BlogPostCreate {
  const content = values.content as BlogPostCreate["content"];
  const coverImageAlt = values.coverImageAlt.trim();
  const metaTitle = values.seo.metaTitle.trim();
  const metaDescription = values.seo.metaDescription.trim();
  const ogImageId = values.seo.ogImageId.trim();

  return {
    title: values.title.trim(),
    slug: values.slug.trim(),
    excerpt: values.excerpt.trim(),
    content,
    category: values.category.trim(),
    categoryId: values.categoryId.trim() || undefined,
    tags: values.tags.map((tag) => tag.trim()).filter(Boolean),
    author: values.author.trim(),
    readingTime: estimateReadingTime(content),
    coverImage: values.coverImage.trim(),
    coverImageAlt: coverImageAlt || undefined,
    featured: values.featured || undefined,
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
