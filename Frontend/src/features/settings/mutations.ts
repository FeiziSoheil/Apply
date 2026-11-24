"use client";

import type { z } from "zod";
import type {
  instituteContactSchema,
  instituteInfoSchema,
  instituteLicensesSchema,
  instituteSeoSchema,
  instituteSocialSchema,
  smsTemplatesReplaceSchema,
} from "@/contracts/settings";
import {
  useApiMutation,
  type ApiMutationOptions,
} from "@/lib/api/use-api-mutation";
import { settingsApi } from "./api";
import { settingsKeys } from "./keys";

type Info = Awaited<ReturnType<typeof settingsApi.updateInfo>>;
type Contact = Awaited<ReturnType<typeof settingsApi.updateContact>>;
type Social = Awaited<ReturnType<typeof settingsApi.updateSocial>>;
type Licenses = Awaited<ReturnType<typeof settingsApi.updateLicenses>>;
type Seo = Awaited<ReturnType<typeof settingsApi.updateSeo>>;
type Sms = Awaited<ReturnType<typeof settingsApi.updateSmsTemplates>>;

const invalidateInstitute = () => [settingsKeys.institute()];

export function useUpdateInstituteInfo(
  options?: ApiMutationOptions<Info, z.input<typeof instituteInfoSchema>>,
) {
  return useApiMutation({
    mutationFn: (body) => settingsApi.updateInfo(body),
    invalidates: invalidateInstitute,
    options,
  });
}

export function useUpdateInstituteContact(
  options?: ApiMutationOptions<Contact, z.input<typeof instituteContactSchema>>,
) {
  return useApiMutation({
    mutationFn: (body) => settingsApi.updateContact(body),
    invalidates: invalidateInstitute,
    options,
  });
}

export function useUpdateInstituteSocial(
  options?: ApiMutationOptions<Social, z.input<typeof instituteSocialSchema>>,
) {
  return useApiMutation({
    mutationFn: (body) => settingsApi.updateSocial(body),
    invalidates: invalidateInstitute,
    options,
  });
}

export function useUpdateInstituteLicenses(
  options?: ApiMutationOptions<
    Licenses,
    z.input<typeof instituteLicensesSchema>
  >,
) {
  return useApiMutation({
    mutationFn: (body) => settingsApi.updateLicenses(body),
    invalidates: invalidateInstitute,
    options,
  });
}

export function useUpdateInstituteSeo(
  options?: ApiMutationOptions<Seo, z.input<typeof instituteSeoSchema>>,
) {
  return useApiMutation({
    mutationFn: (body) => settingsApi.updateSeo(body),
    invalidates: invalidateInstitute,
    options,
  });
}

export function useUpdateInstituteSmsTemplates(
  options?: ApiMutationOptions<
    Sms,
    z.input<typeof smsTemplatesReplaceSchema>
  >,
) {
  return useApiMutation({
    mutationFn: (body) => settingsApi.updateSmsTemplates(body),
    invalidates: invalidateInstitute,
    options,
  });
}
