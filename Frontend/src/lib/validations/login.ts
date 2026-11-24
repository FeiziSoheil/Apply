import { z } from "zod";
import { emailSchema, mobileSchema, normalizeDigits } from "./common";

export const OTP_LENGTH = 6;

/** Student login, step 1: mobile number */
export const loginPhoneSchema = z.object({
  mobile: mobileSchema,
});

export type LoginPhoneFormValues = z.infer<typeof loginPhoneSchema>;

/** Student login, step 2: one-time code (Persian/Arabic digits are accepted) */
export const loginOtpSchema = z.object({
  code: z
    .string({ required_error: "کد تأیید را وارد کنید" })
    .refine((value) => /^\d{6}$/.test(normalizeDigits(value)), {
      message: "کد تأیید باید ۶ رقم باشد",
    }),
});

export type LoginOtpFormValues = z.infer<typeof loginOtpSchema>;

/** Staff login (admin, consultant) — same limits as the contract's `staffLoginSchema` */
export const staffLoginFormSchema = z.object({
  email: emailSchema,
  password: z
    .string({ required_error: "رمز عبور را وارد کنید" })
    .min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد")
    .max(128, "رمز عبور نباید بیشتر از ۱۲۸ کاراکتر باشد"),
});

export type StaffLoginFormValues = z.infer<typeof staffLoginFormSchema>;

/** «فراموشی رمز عبور» (UI only until the backend has the endpoint) */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
