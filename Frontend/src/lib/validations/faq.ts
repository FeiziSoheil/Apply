import type { DefaultValues } from "react-hook-form";
import { z } from "zod";
import type { Faq, FaqCreate } from "@/contracts/content";

export const FAQ_CATEGORY_OPTIONS = [
  { value: "عمومی", label: "عمومی" },
  { value: "پذیرش", label: "پذیرش" },
  { value: "ویزا", label: "ویزا" },
  { value: "تعرفه", label: "تعرفه" },
  { value: "زبان", label: "زبان" },
  { value: "مدارک", label: "مدارک" },
] as const;

export const faqFormSchema = z.object({
  question: z
    .string({ required_error: "پرسش را وارد کنید" })
    .trim()
    .min(3, "پرسش باید حداقل ۳ حرف باشد")
    .max(300, "پرسش نباید بیشتر از ۳۰۰ کاراکتر باشد"),
  answer: z
    .string({ required_error: "پاسخ را وارد کنید" })
    .trim()
    .min(1, "پاسخ را وارد کنید")
    .max(5000, "پاسخ نباید بیشتر از ۵۰۰۰ کاراکتر باشد"),
  category: z
    .string()
    .trim()
    .max(80, "دسته نباید بیشتر از ۸۰ کاراکتر باشد")
    .optional(),
});

export type FaqFormValues = z.infer<typeof faqFormSchema>;

export const FAQ_FORM_DEFAULTS: DefaultValues<FaqFormValues> = {
  question: "",
  answer: "",
  category: "",
};

export function faqToFormValues(faq: Faq): FaqFormValues {
  return {
    question: faq.question,
    answer: faq.answer,
    category: faq.category ?? "",
  };
}

export function toFaqPayload(values: FaqFormValues): FaqCreate {
  const category = values.category?.trim();
  return {
    question: values.question.trim(),
    answer: values.answer.trim(),
    category: category || undefined,
    order: 0,
  };
}
