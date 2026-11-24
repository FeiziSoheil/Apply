"use client";

import type { z } from "zod";
import type {
  selectCaseSchema,
  shortlistConsultationRequestSchema,
  shortlistMergeSchema,
  shortlistPutSchema,
  studentDocumentUploadSchema,
  studentMobileChangeRequestSchema,
  studentMobileChangeVerifySchema,
  studentProfileUpdateSchema,
} from "@/contracts/student-panel";
import type {
  privacyRequestCreateSchema,
  privacyRequestProcessSchema,
} from "@/contracts/privacy";
import type { studentInstallmentPaySchema } from "@/contracts/payments";
import type {
  ticketCreateSchema,
  ticketMessageCreateSchema,
  ticketRatingSchema,
} from "@/contracts/tickets";
import {
  useApiMutation,
  type ApiMutationOptions,
} from "@/lib/api/use-api-mutation";
import { studentPanelApi } from "./api";
import { studentPanelKeys } from "./keys";

type CaseLink = Awaited<ReturnType<typeof studentPanelApi.selectCase>>;
type Profile = Awaited<ReturnType<typeof studentPanelApi.updateProfile>>;
type Ticket = Awaited<ReturnType<typeof studentPanelApi.createTicket>>;
type TicketMessage = Awaited<
  ReturnType<typeof studentPanelApi.createTicketMessage>
>;
type DocumentView = Awaited<ReturnType<typeof studentPanelApi.uploadDocument>>;

type StudentMessageBody = z.input<
  typeof ticketMessageCreateSchema
> extends infer T
  ? Omit<T, "internal">
  : never;

function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useSelectMyCase(
  options?: ApiMutationOptions<CaseLink, z.input<typeof selectCaseSchema>>,
) {
  return useApiMutation({
    mutationFn: (body) => studentPanelApi.selectCase(body),
    invalidates: () => [
      studentPanelKeys.caseLink(),
      studentPanelKeys.case(),
      studentPanelKeys.documents(),
      studentPanelKeys.tasks(),
      studentPanelKeys.announcements(),
    ],
    options,
  });
}

export function useUpdateMyProfile(
  options?: ApiMutationOptions<
    Profile,
    z.input<typeof studentProfileUpdateSchema>
  >,
) {
  return useApiMutation({
    mutationFn: (body) => studentPanelApi.updateProfile(body),
    invalidates: () => [studentPanelKeys.profile()],
    options,
  });
}

export function useCreateMyTicket(
  options?: ApiMutationOptions<Ticket, z.input<typeof ticketCreateSchema>>,
) {
  return useApiMutation({
    mutationFn: (body) =>
      studentPanelApi.createTicket(body, {
        headers: { "Idempotency-Key": newIdempotencyKey() },
      }),
    invalidates: () => [studentPanelKeys.tickets()],
    options,
  });
}

type CreateMyTicketMessageVariables = {
  id: string;
  body: StudentMessageBody;
};

export function useCreateMyTicketMessage(
  options?: ApiMutationOptions<TicketMessage, CreateMyTicketMessageVariables>,
) {
  return useApiMutation({
    mutationFn: ({ id, body }) =>
      studentPanelApi.createTicketMessage(id, body, {
        headers: { "Idempotency-Key": newIdempotencyKey() },
      }),
    invalidates: (_data, { id }) => [
      studentPanelKeys.ticket(id),
      studentPanelKeys.tickets(),
    ],
    options,
  });
}

export function useCloseMyTicket(options?: ApiMutationOptions<Ticket, string>) {
  return useApiMutation({
    mutationFn: (id) => studentPanelApi.closeTicket(id),
    invalidates: (_data, id) => [
      studentPanelKeys.ticket(id),
      studentPanelKeys.tickets(),
    ],
    options,
  });
}

export function useReopenMyTicket(options?: ApiMutationOptions<Ticket, string>) {
  return useApiMutation({
    mutationFn: (id) => studentPanelApi.reopenTicket(id),
    invalidates: (_data, id) => [
      studentPanelKeys.ticket(id),
      studentPanelKeys.tickets(),
    ],
    options,
  });
}

type RateMyTicketVariables = {
  id: string;
  body: z.input<typeof ticketRatingSchema>;
};

export function useRateMyTicket(
  options?: ApiMutationOptions<Ticket, RateMyTicketVariables>,
) {
  return useApiMutation({
    mutationFn: ({ id, body }) => studentPanelApi.rateTicket(id, body),
    invalidates: (_data, { id }) => [
      studentPanelKeys.ticket(id),
      studentPanelKeys.tickets(),
    ],
    options,
  });
}

export function useUploadMyDocument(
  options?: ApiMutationOptions<
    DocumentView,
    z.input<typeof studentDocumentUploadSchema>
  >,
) {
  return useApiMutation({
    mutationFn: (body) => studentPanelApi.uploadDocument(body),
    invalidates: () => [
      studentPanelKeys.documents(),
      studentPanelKeys.tasks(),
      studentPanelKeys.case(),
    ],
    options,
  });
}

type PayMyInstallmentVariables = {
  id: string;
  body: z.input<typeof studentInstallmentPaySchema>;
};

type PayResult = Awaited<ReturnType<typeof studentPanelApi.payInstallment>>;

export function usePayMyInstallment(
  options?: ApiMutationOptions<PayResult, PayMyInstallmentVariables>,
) {
  return useApiMutation({
    mutationFn: ({ id, body }: PayMyInstallmentVariables) =>
      studentPanelApi.payInstallment(id, body, {
        headers: { "Idempotency-Key": newIdempotencyKey() },
      }),
    invalidates: () => [
      studentPanelKeys.paymentSummary(),
      studentPanelKeys.installments(),
      studentPanelKeys.invoices(),
    ],
    options,
  });
}

export function usePutMyShortlist(
  options?: ApiMutationOptions<
    Awaited<ReturnType<typeof studentPanelApi.putShortlist>>,
    z.input<typeof shortlistPutSchema>
  >,
) {
  return useApiMutation({
    mutationFn: (body) => studentPanelApi.putShortlist(body),
    invalidates: () => [
      studentPanelKeys.shortlist(),
      studentPanelKeys.shortlistCompare(),
    ],
    options,
  });
}

export function useMergeMyShortlist(
  options?: ApiMutationOptions<
    Awaited<ReturnType<typeof studentPanelApi.mergeShortlist>>,
    z.input<typeof shortlistMergeSchema>
  >,
) {
  return useApiMutation({
    mutationFn: (body) => studentPanelApi.mergeShortlist(body),
    invalidates: () => [
      studentPanelKeys.shortlist(),
      studentPanelKeys.shortlistCompare(),
    ],
    options,
  });
}

export function useConsultMyShortlist(
  options?: ApiMutationOptions<
    Awaited<ReturnType<typeof studentPanelApi.consultShortlist>>,
    z.input<typeof shortlistConsultationRequestSchema>
  >,
) {
  return useApiMutation({
    mutationFn: (body) => studentPanelApi.consultShortlist(body),
    invalidates: () => [studentPanelKeys.tickets()],
    options,
  });
}

export function useRequestMobileChange(
  options?: ApiMutationOptions<
    Awaited<ReturnType<typeof studentPanelApi.requestMobileChange>>,
    z.input<typeof studentMobileChangeRequestSchema>
  >,
) {
  return useApiMutation({
    mutationFn: (body) => studentPanelApi.requestMobileChange(body),
    options,
  });
}

export function useVerifyMobileChange(
  options?: ApiMutationOptions<
    Awaited<ReturnType<typeof studentPanelApi.verifyMobileChange>>,
    z.input<typeof studentMobileChangeVerifySchema>
  >,
) {
  return useApiMutation({
    mutationFn: (body) => studentPanelApi.verifyMobileChange(body),
    invalidates: () => [studentPanelKeys.profile()],
    options,
  });
}

export function useCreatePrivacyRequest(
  options?: ApiMutationOptions<
    Awaited<ReturnType<typeof studentPanelApi.createPrivacyRequest>>,
    z.input<typeof privacyRequestCreateSchema>
  >,
) {
  return useApiMutation({
    mutationFn: (body) => studentPanelApi.createPrivacyRequest(body),
    invalidates: () => [studentPanelKeys.privacyRequests()],
    options,
  });
}

export function useProcessAdminPrivacyRequest(
  options?: ApiMutationOptions<
    Awaited<ReturnType<typeof studentPanelApi.processAdminPrivacyRequest>>,
    { id: string; body: z.input<typeof privacyRequestProcessSchema> }
  >,
) {
  return useApiMutation({
    mutationFn: ({ id, body }) =>
      studentPanelApi.processAdminPrivacyRequest(id, body),
    invalidates: () => [studentPanelKeys.adminPrivacyRequests()],
    options,
  });
}

