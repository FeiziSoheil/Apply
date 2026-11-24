import { z } from "zod";
import {
  instituteSeoSchema,
  instituteSocialSchema,
  SMS_TEMPLATE_KEYS,
} from "@/contracts/settings";
import { emailSchema } from "./common";

const homepageStatFormSchema = z.object({
  label: z.string().trim().min(1, "برچسب آمار را وارد کنید").max(40),
  value: z.coerce
    .number({ invalid_type_error: "مقدار آمار باید عدد باشد" })
    .int()
    .min(0)
    .max(1_000_000_000),
  suffix: z.string().trim().max(8),
});

export const instituteInfoFormSchema = z.object({
  name: z.string().trim().min(2, "نام موسسه را وارد کنید").max(80),
  nameEn: z.string().trim().min(2, "نام انگلیسی را وارد کنید").max(80),
  tagline: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(2000),
  logoFileId: z.string().uuid().nullable(),
  foundingYear: z.coerce
    .number()
    .int()
    .min(1300, "سال تأسیس نامعتبر است")
    .max(2100, "سال تأسیس نامعتبر است"),
  homepageStats: z.array(homepageStatFormSchema).min(1).max(8),
});
export type InstituteInfoFormValues = z.infer<typeof instituteInfoFormSchema>;

export const instituteContactFormSchema = z.object({
  phones: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(40),
        number: z.string().trim().min(5, "شماره تماس را وارد کنید").max(32),
        href: z.string().trim().min(1).max(64),
      }),
    )
    .min(1)
    .max(6),
  email: emailSchema,
  address: z.string().trim().min(5).max(300),
  workingHours: z.string().trim().min(3).max(200),
  coordinates: z.object({
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180),
  }),
});
export type InstituteContactFormValues = z.infer<
  typeof instituteContactFormSchema
>;

export const instituteSocialFormSchema = instituteSocialSchema;
export type InstituteSocialFormValues = z.infer<
  typeof instituteSocialFormSchema
>;

export const licenseItemFormSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1, "عنوان را وارد کنید").max(80),
  imageFileId: z.string().uuid("تصویر را آپلود کنید"),
  href: z.string().trim().max(300),
  order: z.coerce.number().int().min(0).max(999),
});

export const instituteLicensesFormSchema = z.object({
  items: z.array(licenseItemFormSchema).max(12),
});
export type InstituteLicensesFormValues = z.infer<
  typeof instituteLicensesFormSchema
>;

export const instituteSeoFormSchema = instituteSeoSchema;
export type InstituteSeoFormValues = z.infer<typeof instituteSeoFormSchema>;

export const smsTemplatesFormSchema = z.object({
  templates: z.array(
    z.object({
      key: z.enum(SMS_TEMPLATE_KEYS),
      label: z.string(),
      body: z.string().trim().min(1, "متن پیامک را وارد کنید").max(500),
      variables: z.array(z.string()),
    }),
  ),
});
export type SmsTemplatesFormValues = z.infer<typeof smsTemplatesFormSchema>;

/** Re-export for forms that need the email helper */
export { emailSchema };
