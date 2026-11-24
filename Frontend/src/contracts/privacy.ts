import {
  idSchema,
  isoDateTimeSchema,
  listQuerySchema,
  mobileSchema,
  personNameSchema,
} from "./common";
import { z } from "./zod";

export const PRIVACY_REQUEST_TYPES = [
  "data_export",
  "account_deletion",
] as const;
export const privacyRequestTypeSchema = z
  .enum(PRIVACY_REQUEST_TYPES)
  .openapi("PrivacyRequestType");
export type PrivacyRequestType = z.infer<typeof privacyRequestTypeSchema>;

export const PRIVACY_REQUEST_STATUSES = [
  "pending",
  "completed",
  "rejected",
] as const;
export const privacyRequestStatusSchema = z
  .enum(PRIVACY_REQUEST_STATUSES)
  .openapi("PrivacyRequestStatus");
export type PrivacyRequestStatus = z.infer<typeof privacyRequestStatusSchema>;

export const privacyRequestSchema = z
  .object({
    id: idSchema,
    userId: idSchema,
    userName: personNameSchema,
    userMobile: mobileSchema,
    type: privacyRequestTypeSchema,
    status: privacyRequestStatusSchema,
    reason: z.string().max(1000).nullable(),
    createdAt: isoDateTimeSchema,
    processedAt: isoDateTimeSchema.nullable(),
    processedBy: z.string().max(120).nullable(),
    adminNote: z.string().max(1000).nullable(),
  })
  .openapi("PrivacyRequest");
export type PrivacyRequest = z.infer<typeof privacyRequestSchema>;

export const privacyRequestCreateSchema = z
  .object({
    type: privacyRequestTypeSchema,
    reason: z.string().trim().max(1000).optional(),
  })
  .openapi("PrivacyRequestCreate");
export type PrivacyRequestCreate = z.infer<typeof privacyRequestCreateSchema>;

export const privacyRequestProcessSchema = z
  .object({
    decision: z.enum(["approve", "reject"]),
    adminNote: z.string().trim().max(1000).optional(),
  })
  .openapi("PrivacyRequestProcess");
export type PrivacyRequestProcess = z.infer<typeof privacyRequestProcessSchema>;

export const privacyRequestListQuerySchema = listQuerySchema(
  ["createdAt", "processedAt"],
  {
    type: privacyRequestTypeSchema.optional(),
    status: privacyRequestStatusSchema.optional(),
  },
);
export type PrivacyRequestListQuery = z.infer<
  typeof privacyRequestListQuerySchema
>;
