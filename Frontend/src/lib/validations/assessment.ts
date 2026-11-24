import { z } from "zod";
import { DEGREE_LEVEL_LABELS } from "@/lib/degree-levels";
import {
  gpaSchema,
  mobileSchema,
  nameSchema,
  optionalEmailSchema,
} from "./common";

const DEGREE_VALUES = [
  "bachelor",
  "master",
  "phd",
  "language",
  "foundation",
] as const;

export const LANGUAGE_STATUSES = [
  "none",
  "ielts",
  "toefl",
  "duolingo",
  "other",
] as const;

export type LanguageStatus = (typeof LANGUAGE_STATUSES)[number];

export const LANGUAGE_STATUS_LABELS: Record<LanguageStatus, string> = {
  none: "بدون مدرک زبان",
  ielts: "آیلتس (IELTS)",
  toefl: "تافل (TOEFL)",
  duolingo: "دولینگو (Duolingo)",
  other: "سایر",
};

export const START_TIMES = [
  "nearest",
  "six_months",
  "one_year",
  "undecided",
] as const;

export type StartTime = (typeof START_TIMES)[number];

export const START_TIME_LABELS: Record<StartTime, string> = {
  nearest: "نزدیک‌ترین ترم",
  six_months: "تا ۶ ماه آینده",
  one_year: "تا ۱ سال آینده",
  undecided: "هنوز مشخص نیست",
};

export const CONTACT_PREFERENCES = ["phone", "whatsapp", "email"] as const;

export type ContactPreference = (typeof CONTACT_PREFERENCES)[number];

export const CONTACT_PREFERENCE_LABELS: Record<ContactPreference, string> = {
  phone: "تماس تلفنی",
  whatsapp: "واتساپ",
  email: "ایمیل",
};

const degreeEnum = z.enum(DEGREE_VALUES, {
  required_error: "مقطع تحصیلی را انتخاب کنید",
  invalid_type_error: "مقطع تحصیلی را انتخاب کنید",
});

export const assessmentStep1Schema = z.object({
  currentDegree: degreeEnum,
  targetDegree: degreeEnum,
  fieldOfStudy: z
    .string({ required_error: "رشته تحصیلی را وارد کنید" })
    .trim()
    .min(2, "رشته تحصیلی را وارد کنید")
    .max(100, "رشته تحصیلی نباید بیشتر از ۱۰۰ حرف باشد"),
  gpa: gpaSchema,
});

export const assessmentStep2BaseSchema = z.object({
  languageStatus: z.enum(LANGUAGE_STATUSES, {
    required_error: "وضعیت زبان را انتخاب کنید",
    invalid_type_error: "وضعیت زبان را انتخاب کنید",
  }),
  languageScore: z.coerce.number().optional(),
  languageOther: z.string().trim().optional(),
});

export const assessmentStep2Schema = assessmentStep2BaseSchema.superRefine(
  (data, ctx) => {
    if (data.languageStatus === "none") return;

    if (data.languageStatus === "other") {
      if (!data.languageOther || data.languageOther.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["languageOther"],
          message: "نام مدرک یا سطح زبان را وارد کنید",
        });
      }
      return;
    }

    if (data.languageScore === undefined || Number.isNaN(data.languageScore)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["languageScore"],
        message: "نمره زبان را وارد کنید",
      });
      return;
    }

    const score = data.languageScore;
    if (data.languageStatus === "ielts" && (score < 0 || score > 9)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["languageScore"],
        message: "نمره آیلتس باید بین ۰ تا ۹ باشد",
      });
    }
    if (data.languageStatus === "toefl" && (score < 0 || score > 120)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["languageScore"],
        message: "نمره تافل باید بین ۰ تا ۱۲۰ باشد",
      });
    }
    if (data.languageStatus === "duolingo" && (score < 10 || score > 160)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["languageScore"],
        message: "نمره دولینگو باید بین ۱۰ تا ۱۶۰ باشد",
      });
    }
  },
);

export const assessmentStep3Schema = z.object({
  targetCountries: z
    .array(z.string())
    .min(1, "حداقل یک کشور مقصد را انتخاب کنید")
    .max(5, "حداکثر پنج کشور می‌توانید انتخاب کنید"),
  annualBudget: z.coerce
    .number({
      required_error: "بودجه سالانه را مشخص کنید",
      invalid_type_error: "بودجه سالانه را مشخص کنید",
    })
    .min(0, "بودجه نمی‌تواند منفی باشد")
    .max(100_000, "بودجه بیش از حد مجاز است"),
  /** ISO 4217 code of `annualBudget` (the form always sends it; default EUR) */
  currency: z.string().regex(/^[A-Z]{3}$/, "کد ارز نامعتبر است"),
  startTime: z.enum(START_TIMES, {
    required_error: "زمان شروع تحصیل را انتخاب کنید",
    invalid_type_error: "زمان شروع تحصیل را انتخاب کنید",
  }),
  needsScholarship: z.boolean({
    required_error: "نیاز به بورسیه را مشخص کنید",
  }),
});

export const assessmentStep4Schema = z.object({
  name: nameSchema,
  mobile: mobileSchema,
  email: optionalEmailSchema,
  contactPreference: z.enum(CONTACT_PREFERENCES, {
    required_error: "ترجیح تماس را انتخاب کنید",
    invalid_type_error: "ترجیح تماس را انتخاب کنید",
  }),
  agreeToTerms: z.boolean().refine((value) => value === true, {
    message: "پذیرش قوانین برای ادامه الزامی است",
  }),
});

export const assessmentFormSchema = assessmentStep1Schema
  .merge(assessmentStep2BaseSchema)
  .merge(assessmentStep3Schema)
  .merge(assessmentStep4Schema)
  .superRefine((data, ctx) => {
    const step2 = assessmentStep2Schema.safeParse(data);
    if (!step2.success) {
      for (const issue of step2.error.issues) {
        ctx.addIssue(issue);
      }
    }
  });

export type AssessmentFormValues = z.infer<typeof assessmentFormSchema>;

export const ASSESSMENT_STEP_FIELDS: Record<
  1 | 2 | 3 | 4,
  readonly (keyof AssessmentFormValues)[]
> = {
  1: ["currentDegree", "targetDegree", "fieldOfStudy", "gpa"],
  2: ["languageStatus", "languageScore", "languageOther"],
  3: ["targetCountries", "annualBudget", "currency", "startTime", "needsScholarship"],
  4: ["name", "mobile", "email", "contactPreference", "agreeToTerms"],
};

export const ASSESSMENT_STEP_SCHEMAS = {
  1: assessmentStep1Schema,
  2: assessmentStep2Schema,
  3: assessmentStep3Schema,
  4: assessmentStep4Schema,
} as const;

export { DEGREE_LEVEL_LABELS };
