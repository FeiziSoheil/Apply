import { z } from "zod";
import {
  emailSchema,
  mobileSchema,
  normalizeDigits,
  toOptionalEmail,
} from "./common";

export const newsletterSchema = z
  .object({
    mobile: z.string().optional(),
    email: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const mobile = data.mobile?.trim() ?? "";
    const email = data.email?.trim() ?? "";

    if (!mobile && !email) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["mobile"],
        message: "موبایل یا ایمیل را وارد کنید",
      });
      return;
    }

    if (mobile) {
      const result = mobileSchema.safeParse(mobile);
      if (!result.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["mobile"],
          message:
            result.error.errors[0]?.message ?? "شماره موبایل معتبر وارد کنید",
        });
      }
    }

    if (email) {
      const result = emailSchema.safeParse(email);
      if (!result.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["email"],
          message: result.error.errors[0]?.message ?? "ایمیل معتبر وارد کنید",
        });
      }
    }
  });

export type NewsletterFormValues = z.infer<typeof newsletterSchema>;

export type NewsletterPayload = {
  mobile?: string;
  email?: string;
};

export function toNewsletterPayload(
  values: NewsletterFormValues,
): NewsletterPayload {
  const mobile = values.mobile?.trim();
  return {
    mobile: mobile ? normalizeDigits(mobile) : undefined,
    email: values.email ? toOptionalEmail(values.email) : undefined,
  };
}
