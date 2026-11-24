"use client";

import type { z } from "zod";
import type {
  installmentCancelSchema,
  installmentMarkPaidSchema,
  installmentUpdateSchema,
  invoiceCancelSchema,
  invoiceCreateSchema,
  paymentPlanCreateSchema,
  paymentVerifyStaffSchema,
} from "@/contracts/payments";
import {
  useApiMutation,
  type ApiMutationOptions,
} from "@/lib/api/use-api-mutation";
import { paymentsApi } from "./api";
import { paymentKeys } from "./keys";

type Invoice = Awaited<ReturnType<typeof paymentsApi.createInvoice>>;
type Installment = Awaited<ReturnType<typeof paymentsApi.markInstallmentPaid>>;
type PaymentPlan = Awaited<ReturnType<typeof paymentsApi.createPaymentPlan>>;
type PaymentAttempt = Awaited<
  ReturnType<typeof paymentsApi.verifyPaymentAttempt>
>;
type RemindersResult = Awaited<
  ReturnType<typeof paymentsApi.processInstallmentReminders>
>;

export function useCreateInvoice(
  options?: ApiMutationOptions<Invoice, z.input<typeof invoiceCreateSchema>>,
) {
  return useApiMutation({
    mutationFn: (body: z.input<typeof invoiceCreateSchema>) =>
      paymentsApi.createInvoice(body),
    invalidates: () => [paymentKeys.all],
    options,
  });
}

type CancelInvoiceVariables = {
  id: string;
  body: z.input<typeof invoiceCancelSchema>;
};

export function useCancelInvoice(
  options?: ApiMutationOptions<Invoice, CancelInvoiceVariables>,
) {
  return useApiMutation({
    mutationFn: ({ id, body }: CancelInvoiceVariables) =>
      paymentsApi.cancelInvoice(id, body),
    invalidates: () => [paymentKeys.all],
    options,
  });
}

type MarkPaidVariables = {
  id: string;
  body: z.input<typeof installmentMarkPaidSchema>;
};

export function useMarkInstallmentPaid(
  options?: ApiMutationOptions<Installment, MarkPaidVariables>,
) {
  return useApiMutation({
    mutationFn: ({ id, body }: MarkPaidVariables) =>
      paymentsApi.markInstallmentPaid(id, body),
    invalidates: () => [paymentKeys.all],
    options,
  });
}

type CreatePaymentPlanVariables = {
  caseId: string;
  body: z.input<typeof paymentPlanCreateSchema>;
};

export function useCreatePaymentPlan(
  options?: ApiMutationOptions<PaymentPlan, CreatePaymentPlanVariables>,
) {
  return useApiMutation({
    mutationFn: ({ caseId, body }: CreatePaymentPlanVariables) =>
      paymentsApi.createPaymentPlan(caseId, body),
    invalidates: () => [paymentKeys.all],
    options,
  });
}

type UpdateInstallmentVariables = {
  id: string;
  body: z.input<typeof installmentUpdateSchema>;
};

export function useUpdateInstallment(
  options?: ApiMutationOptions<Installment, UpdateInstallmentVariables>,
) {
  return useApiMutation({
    mutationFn: ({ id, body }: UpdateInstallmentVariables) =>
      paymentsApi.updateInstallment(id, body),
    invalidates: () => [paymentKeys.all],
    options,
  });
}

type CancelInstallmentVariables = {
  id: string;
  body: z.input<typeof installmentCancelSchema>;
};

export function useCancelInstallment(
  options?: ApiMutationOptions<Installment, CancelInstallmentVariables>,
) {
  return useApiMutation({
    mutationFn: ({ id, body }: CancelInstallmentVariables) =>
      paymentsApi.cancelInstallment(id, body),
    invalidates: () => [paymentKeys.all],
    options,
  });
}

type VerifyPaymentAttemptVariables = {
  id: string;
  body: z.input<typeof paymentVerifyStaffSchema>;
};

export function useVerifyPaymentAttempt(
  options?: ApiMutationOptions<PaymentAttempt, VerifyPaymentAttemptVariables>,
) {
  return useApiMutation({
    mutationFn: ({ id, body }: VerifyPaymentAttemptVariables) =>
      paymentsApi.verifyPaymentAttempt(id, body),
    invalidates: () => [paymentKeys.all],
    options,
  });
}

export function useProcessInstallmentReminders(
  options?: ApiMutationOptions<RemindersResult, void>,
) {
  return useApiMutation({
    mutationFn: () => paymentsApi.processInstallmentReminders(),
    invalidates: () => [paymentKeys.all],
    options,
  });
}
