import { z } from "zod";

const PERSIAN_ARABIC_DIGIT_MAP: Record<string, string> = {
  "۰": "0",
  "۱": "1",
  "۲": "2",
  "۳": "3",
  "۴": "4",
  "۵": "5",
  "۶": "6",
  "۷": "7",
  "۸": "8",
  "۹": "9",
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
};

/** Normalize Persian/Arabic-Indic digits to English digits */
export function normalizeDigits(value: string): string {
  return value.replace(
    /[۰-۹٠-٩]/g,
    (digit) => PERSIAN_ARABIC_DIGIT_MAP[digit] ?? digit,
  );
}

const IRANIAN_MOBILE_REGEX = /^09\d{9}$/;

export const nameSchema = z
  .string({ required_error: "نام را وارد کنید" })
  .trim()
  .min(3, "نام باید حداقل ۳ حرف باشد")
  .max(80, "نام نباید بیشتر از ۸۰ حرف باشد");

/** Iranian mobile — validates after normalizing Persian/Arabic digits */
export const mobileSchema = z
  .string({ required_error: "شماره موبایل را وارد کنید" })
  .trim()
  .refine((value) => IRANIAN_MOBILE_REGEX.test(normalizeDigits(value)), {
    message: "شماره موبایل معتبر وارد کنید (مثال: ۰۹۱۲۳۴۵۶۷۸۹)",
  });

/** Optional email for forms — empty string allowed */
export const optionalEmailSchema = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || z.string().email().safeParse(value).success,
    { message: "ایمیل معتبر وارد کنید" },
  );

export const emailSchema = z
  .string({ required_error: "ایمیل را وارد کنید" })
  .trim()
  .email("ایمیل معتبر وارد کنید")
  .max(120, "ایمیل نباید بیشتر از ۱۲۰ کاراکتر باشد");

export const gpaSchema = z.coerce
  .number({
    required_error: "معدل را وارد کنید",
    invalid_type_error: "معدل باید عدد باشد",
  })
  .min(0, "معدل نمی‌تواند کمتر از ۰ باشد")
  .max(20, "معدل نمی‌تواند بیشتر از ۲۰ باشد");

export const messageSchema = z
  .string({ required_error: "پیام را وارد کنید" })
  .trim()
  .min(10, "پیام باید حداقل ۱۰ حرف باشد")
  .max(2000, "پیام نباید بیشتر از ۲۰۰۰ حرف باشد");

/** Honeypot: must stay empty (bots fill it) */
export const honeypotSchema = z
  .string()
  .max(0, "ارسال نامعتبر است");

/** Normalize mobile before sending to the service layer */
export function toNormalizedMobile(value: string): string {
  return normalizeDigits(value.trim());
}

export function toOptionalEmail(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}
