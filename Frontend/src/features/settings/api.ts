import type { z } from "zod";
import {
  instituteContactSchema,
  instituteInfoSchema,
  instituteLicensesSchema,
  instituteSeoSchema,
  instituteSettingsSchema,
  instituteSocialSchema,
  licenseBadgeSchema,
  smsTemplateSchema,
  smsTemplatesReplaceSchema,
} from "@/contracts/settings";
import {
  apiGet,
  apiPut,
  type RequestOptions,
} from "@/lib/api/client";
import { validateRequest } from "@/lib/api/validate";
import { z as zod } from "zod";

const licensesSchema = zod.array(licenseBadgeSchema);
const smsListSchema = zod.array(smsTemplateSchema);

export const settingsApi = {
  getInstitute(options?: RequestOptions) {
    return apiGet("/settings/institute", instituteSettingsSchema, options);
  },

  updateInfo(
    body: z.input<typeof instituteInfoSchema>,
    options?: RequestOptions,
  ) {
    return apiPut(
      "/settings/institute/info",
      instituteInfoSchema,
      validateRequest(instituteInfoSchema, body),
      options,
    );
  },

  updateContact(
    body: z.input<typeof instituteContactSchema>,
    options?: RequestOptions,
  ) {
    return apiPut(
      "/settings/institute/contact",
      instituteContactSchema,
      validateRequest(instituteContactSchema, body),
      options,
    );
  },

  updateSocial(
    body: z.input<typeof instituteSocialSchema>,
    options?: RequestOptions,
  ) {
    return apiPut(
      "/settings/institute/social",
      instituteSocialSchema,
      validateRequest(instituteSocialSchema, body),
      options,
    );
  },

  updateLicenses(
    body: z.input<typeof instituteLicensesSchema>,
    options?: RequestOptions,
  ) {
    return apiPut(
      "/settings/institute/licenses",
      licensesSchema,
      validateRequest(instituteLicensesSchema, body),
      options,
    );
  },

  updateSeo(
    body: z.input<typeof instituteSeoSchema>,
    options?: RequestOptions,
  ) {
    return apiPut(
      "/settings/institute/seo",
      instituteSeoSchema,
      validateRequest(instituteSeoSchema, body),
      options,
    );
  },

  updateSmsTemplates(
    body: z.input<typeof smsTemplatesReplaceSchema>,
    options?: RequestOptions,
  ) {
    return apiPut(
      "/settings/institute/sms-templates",
      smsListSchema,
      validateRequest(smsTemplatesReplaceSchema, body),
      options,
    );
  },
};
