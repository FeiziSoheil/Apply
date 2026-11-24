import { z } from "zod";
import { TICKET_CATEGORIES } from "@/contracts/tickets";

export const studentTicketCreateFormSchema = z.object({
  category: z.enum(TICKET_CATEGORIES, {
    required_error: "دسته‌بندی را انتخاب کنید",
  }),
  subject: z
    .string()
    .trim()
    .min(3, "موضوع را وارد کنید")
    .max(160, "موضوع نباید بیشتر از ۱۶۰ حرف باشد"),
  body: z
    .string()
    .trim()
    .min(5, "متن پیام را وارد کنید")
    .max(5000, "پیام نباید بیشتر از ۵۰۰۰ حرف باشد"),
  relatedCaseId: z.string().uuid().nullable().optional(),
});

export type StudentTicketCreateFormValues = z.infer<
  typeof studentTicketCreateFormSchema
>;

export const studentTicketReplySchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "متن پیام را وارد کنید")
    .max(5000, "پیام نباید بیشتر از ۵۰۰۰ حرف باشد"),
});

export type StudentTicketReplyValues = z.infer<typeof studentTicketReplySchema>;

export const studentTicketRatingFormSchema = z.object({
  rating: z
    .number({ required_error: "امتیاز را انتخاب کنید" })
    .int()
    .min(1, "حداقل ۱")
    .max(5, "حداکثر ۵"),
  ratingComment: z.string().trim().max(500).optional(),
});

export type StudentTicketRatingFormValues = z.infer<
  typeof studentTicketRatingFormSchema
>;
