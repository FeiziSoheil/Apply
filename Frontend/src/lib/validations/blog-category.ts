import { z } from "zod";
import type { BlogCategory, BlogCategoryCreate } from "@/contracts/content";
import { SLUG_PATTERN } from "@/lib/slug";

export const blogCategoryFormSchema = z.object({
  title: z
    .string({ required_error: "عنوان دسته را وارد کنید" })
    .trim()
    .min(1, "عنوان دسته را وارد کنید")
    .max(80, "عنوان نباید بیشتر از ۸۰ کاراکتر باشد"),
  slug: z
    .string({ required_error: "اسلاگ را وارد کنید" })
    .trim()
    .min(1, "اسلاگ را وارد کنید")
    .max(120, "اسلاگ نباید بیشتر از ۱۲۰ کاراکتر باشد")
    .regex(
      SLUG_PATTERN,
      "اسلاگ فقط شامل حروف کوچک انگلیسی، عدد و خط تیره است",
    ),
});

export type BlogCategoryFormValues = z.infer<typeof blogCategoryFormSchema>;

export function blogCategoryToFormValues(
  category: BlogCategory,
): BlogCategoryFormValues {
  return {
    title: category.title,
    slug: category.slug,
  };
}

export function toBlogCategoryPayload(
  values: BlogCategoryFormValues,
): BlogCategoryCreate {
  return {
    title: values.title.trim(),
    slug: values.slug.trim(),
  };
}
