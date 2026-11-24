import type { z } from "zod";
import type {
  leadFromAssessmentSchema,
  leadQuickContactSchema,
  newsletterSubscribeSchema,
} from "@/contracts/leads";
import type { AssessmentFormValues } from "@/lib/validations/assessment";
import type { CallbackFormValues } from "@/lib/validations/callback";
import type { ContactFormValues } from "@/lib/validations/contact";
import type { NewsletterFormValues } from "@/lib/validations/newsletter";
import {
  normalizeDigits,
  toNormalizedMobile,
  toOptionalEmail,
} from "@/lib/validations/common";

/** Form values → contract request bodies for the public lead endpoints */

export function toAssessmentRequest(
  values: AssessmentFormValues,
): z.input<typeof leadFromAssessmentSchema> {
  const { email, languageOther, languageScore, languageStatus, ...rest } = values;
  return {
    ...rest,
    languageStatus,
    languageScore: languageStatus === "none" ? undefined : languageScore,
    languageOther:
      languageStatus === "other" ? languageOther?.trim() || undefined : undefined,
    mobile: toNormalizedMobile(values.mobile),
    email: toOptionalEmail(email),
    agreeToTerms: true,
  };
}

export function toCallbackRequest(
  values: CallbackFormValues,
): z.input<typeof leadQuickContactSchema> {
  return {
    source: "callback",
    name: values.name,
    mobile: toNormalizedMobile(values.mobile),
    website: values.website ?? "",
  };
}

export function toContactRequest(
  values: ContactFormValues,
): z.input<typeof leadQuickContactSchema> {
  return {
    source: "contact",
    name: values.name,
    mobile: toNormalizedMobile(values.mobile),
    email: toOptionalEmail(values.email),
    message: values.message,
  };
}

export function toNewsletterRequest(
  values: NewsletterFormValues,
): z.input<typeof newsletterSubscribeSchema> {
  const mobile = values.mobile?.trim();
  return {
    mobile: mobile ? normalizeDigits(mobile) : undefined,
    email: values.email ? toOptionalEmail(values.email) : undefined,
  };
}
