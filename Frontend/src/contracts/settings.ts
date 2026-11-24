import { emailSchema, idSchema, isoDateTimeSchema } from "./common";
import { z } from "./zod";

/* -------------------------------------------------------------------------- */
/*  Institute info                                                            */
/* -------------------------------------------------------------------------- */

export const homepageStatSchema = z
  .object({
    label: z
      .string()
      .trim()
      .min(1, "برچسب آمار را وارد کنید")
      .max(40, "برچسب نباید بیشتر از ۴۰ حرف باشد"),
    value: z
      .number({ invalid_type_error: "مقدار آمار باید عدد باشد" })
      .int("مقدار آمار باید عدد صحیح باشد")
      .min(0)
      .max(1_000_000_000),
    suffix: z.string().trim().max(8).default(""),
  })
  .openapi("HomepageStat");
export type HomepageStat = z.infer<typeof homepageStatSchema>;

export const instituteInfoSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "نام موسسه را وارد کنید")
      .max(80),
    nameEn: z
      .string()
      .trim()
      .min(2, "نام انگلیسی را وارد کنید")
      .max(80),
    tagline: z.string().trim().min(1).max(160),
    description: z.string().trim().min(1).max(2000),
    logoFileId: idSchema.nullable(),
    foundingYear: z
      .number()
      .int()
      .min(1300, "سال تأسیس نامعتبر است")
      .max(2100, "سال تأسیس نامعتبر است")
      .describe("سال میلادی تأسیس"),
    homepageStats: z
      .array(homepageStatSchema)
      .min(1)
      .max(8)
      .describe("آمار نوار صفحهٔ اصلی"),
  })
  .openapi("InstituteInfo");
export type InstituteInfo = z.infer<typeof instituteInfoSchema>;

/* -------------------------------------------------------------------------- */
/*  Contact                                                                   */
/* -------------------------------------------------------------------------- */

export const contactPhoneSchema = z
  .object({
    label: z.string().trim().min(1).max(40),
    number: z
      .string()
      .trim()
      .min(5, "شماره تماس را وارد کنید")
      .max(32),
    href: z
      .string()
      .trim()
      .min(1)
      .max(64)
      .describe("مثلاً tel:+9821…"),
  })
  .openapi("ContactPhone");
export type ContactPhone = z.infer<typeof contactPhoneSchema>;

export const instituteContactSchema = z
  .object({
    phones: z.array(contactPhoneSchema).min(1).max(6),
    email: emailSchema,
    address: z.string().trim().min(5).max(300),
    workingHours: z.string().trim().min(3).max(200),
    coordinates: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }),
  })
  .openapi("InstituteContact");
export type InstituteContact = z.infer<typeof instituteContactSchema>;

/* -------------------------------------------------------------------------- */
/*  Social                                                                    */
/* -------------------------------------------------------------------------- */

const optionalUrl = (message: string) =>
  z
    .string()
    .trim()
    .refine((value) => value === "" || z.string().url().safeParse(value).success, {
      message,
    });

export const instituteSocialSchema = z
  .object({
    instagram: optionalUrl("آدرس اینستاگرام نامعتبر است"),
    telegram: optionalUrl("آدرس تلگرام نامعتبر است"),
    linkedin: optionalUrl("آدرس لینکدین نامعتبر است"),
    whatsapp: optionalUrl("آدرس واتساپ نامعتبر است").describe(
      "لینک wa.me یا مشابه",
    ),
    website: optionalUrl("آدرس وب‌سایت نامعتبر است"),
  })
  .openapi("InstituteSocial");
export type InstituteSocial = z.infer<typeof instituteSocialSchema>;

/* -------------------------------------------------------------------------- */
/*  Licenses / trust badges                                                   */
/* -------------------------------------------------------------------------- */

export const licenseBadgeSchema = z
  .object({
    id: idSchema,
    title: z.string().trim().min(1).max(80),
    imageFileId: idSchema,
    href: z.string().trim().max(300).default("#"),
    order: z.number().int().min(0).max(999),
  })
  .openapi("LicenseBadge");
export type LicenseBadge = z.infer<typeof licenseBadgeSchema>;

export const licenseBadgeInputSchema = z
  .object({
    id: idSchema.optional().describe("برای مورد جدید خالی بگذارید"),
    title: z.string().trim().min(1).max(80),
    imageFileId: idSchema,
    href: z.string().trim().max(300).default("#"),
    order: z.number().int().min(0).max(999),
  })
  .openapi("LicenseBadgeInput");
export type LicenseBadgeInput = z.infer<typeof licenseBadgeInputSchema>;

export const instituteLicensesSchema = z
  .object({
    items: z.array(licenseBadgeInputSchema).max(12),
  })
  .openapi("InstituteLicenses");
export type InstituteLicenses = z.infer<typeof instituteLicensesSchema>;

/* -------------------------------------------------------------------------- */
/*  Default SEO                                                               */
/* -------------------------------------------------------------------------- */

export const instituteSeoSchema = z
  .object({
    defaultTitle: z.string().trim().min(1).max(120),
    titleTemplate: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .describe("مثلاً ‎%s | اِپلای‎"),
    defaultDescription: z.string().trim().min(1).max(320),
    ogImageFileId: idSchema.nullable(),
  })
  .openapi("InstituteSeo");
export type InstituteSeo = z.infer<typeof instituteSeoSchema>;

/* -------------------------------------------------------------------------- */
/*  SMS templates                                                             */
/* -------------------------------------------------------------------------- */

export const SMS_TEMPLATE_KEYS = [
  "booking_confirm",
  "booking_reminder",
  "welcome",
  "password_reset",
] as const;
export const smsTemplateKeySchema = z
  .enum(SMS_TEMPLATE_KEYS)
  .openapi("SmsTemplateKey");
export type SmsTemplateKey = z.infer<typeof smsTemplateKeySchema>;

export const smsTemplateSchema = z
  .object({
    key: smsTemplateKeySchema,
    label: z.string().min(1).max(80),
    body: z
      .string()
      .trim()
      .min(1, "متن پیامک را وارد کنید")
      .max(500, "متن پیامک نباید بیشتر از ۵۰۰ کاراکتر باشد"),
    variables: z
      .array(z.string().min(1).max(40))
      .describe("متغیرهای مجاز مثل name و date — فقط خواندنی"),
  })
  .openapi("SmsTemplate");
export type SmsTemplate = z.infer<typeof smsTemplateSchema>;

export const smsTemplatesReplaceSchema = z
  .object({
    templates: z
      .array(
        z.object({
          key: smsTemplateKeySchema,
          body: z.string().trim().min(1).max(500),
        }),
      )
      .min(1)
      .max(SMS_TEMPLATE_KEYS.length),
  })
  .openapi("SmsTemplatesReplace");
export type SmsTemplatesReplace = z.infer<typeof smsTemplatesReplaceSchema>;

/* -------------------------------------------------------------------------- */
/*  Aggregate                                                                 */
/* -------------------------------------------------------------------------- */

/** حساب کارت‌به‌کارت برای پرداخت دانشجو */
export const paymentAccountSettingsSchema = z
  .object({
    cardNumber: z
      .string()
      .regex(/^\d{16}$/, "شماره کارت باید ۱۶ رقم باشد"),
    accountHolder: z.string().trim().min(2).max(80),
    bankName: z.string().trim().min(2).max(80).nullable().default(null),
  })
  .openapi("PaymentAccountSettings");
export type PaymentAccountSettings = z.infer<
  typeof paymentAccountSettingsSchema
>;

export const instituteSettingsSchema = z
  .object({
    id: idSchema,
    info: instituteInfoSchema,
    contact: instituteContactSchema,
    social: instituteSocialSchema,
    licenses: z.array(licenseBadgeSchema),
    seo: instituteSeoSchema,
    smsTemplates: z.array(smsTemplateSchema),
    paymentAccount: paymentAccountSettingsSchema.nullable().default(null),
    updatedAt: isoDateTimeSchema,
  })
  .openapi("InstituteSettings");
export type InstituteSettings = z.infer<typeof instituteSettingsSchema>;
