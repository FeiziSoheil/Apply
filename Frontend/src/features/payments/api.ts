import { z } from "zod";
import {
  financeReportQuerySchema,
  financeReportSchema,
  financeSummarySchema,
  financeTransactionListQuerySchema,
  financeTransactionSchema,
  installmentCancelSchema,
  installmentListQuerySchema,
  installmentMarkPaidSchema,
  installmentRemindersResultSchema,
  installmentSchema,
  installmentUpdateSchema,
  invoiceCancelSchema,
  invoiceCreateSchema,
  invoiceListQuerySchema,
  invoiceSchema,
  paymentAttemptSchema,
  paymentPlanCreateSchema,
  paymentPlanSchema,
  paymentVerifyStaffSchema,
} from "@/contracts/payments";
import {
  apiGet,
  apiGetPage,
  apiPatch,
  apiPost,
  segment,
  type RequestOptions,
} from "@/lib/api/client";
import type { ListFilters } from "@/lib/api/types";
import { validateRequest } from "@/lib/api/validate";

export type InvoiceListFilters = ListFilters<typeof invoiceListQuerySchema>;
export type InstallmentListFilters = ListFilters<
  typeof installmentListQuerySchema
>;
export type FinanceTransactionListFilters = ListFilters<
  typeof financeTransactionListQuerySchema
>;

const invoicePath = (id: string) => `/invoices/${segment(id)}`;
const installmentPath = (id: string) => `/installments/${segment(id)}`;

const financeReportCsvSchema = z.object({
  csv: z.string(),
  filename: z.string(),
});

export const paymentsApi = {
  listInvoices(filters?: InvoiceListFilters, options?: RequestOptions) {
    return apiGetPage("/invoices", invoiceSchema, {
      ...options,
      query: filters,
    });
  },

  getInvoice(id: string, options?: RequestOptions) {
    return apiGet(invoicePath(id), invoiceSchema, options);
  },

  createInvoice(
    body: z.input<typeof invoiceCreateSchema>,
    options?: RequestOptions,
  ) {
    return apiPost(
      "/invoices",
      invoiceSchema,
      validateRequest(invoiceCreateSchema, body),
      options,
    );
  },

  cancelInvoice(
    id: string,
    body: z.input<typeof invoiceCancelSchema>,
    options?: RequestOptions,
  ) {
    return apiPost(
      `${invoicePath(id)}/cancel`,
      invoiceSchema,
      validateRequest(invoiceCancelSchema, body),
      options,
    );
  },

  listInstallments(
    filters?: InstallmentListFilters,
    options?: RequestOptions,
  ) {
    return apiGetPage("/installments", installmentSchema, {
      ...options,
      query: filters,
    });
  },

  markInstallmentPaid(
    id: string,
    body: z.input<typeof installmentMarkPaidSchema>,
    options?: RequestOptions,
  ) {
    return apiPost(
      `${installmentPath(id)}/mark-paid`,
      installmentSchema,
      validateRequest(installmentMarkPaidSchema, body),
      options,
    );
  },

  createPaymentPlan(
    caseId: string,
    body: z.input<typeof paymentPlanCreateSchema>,
    options?: RequestOptions,
  ) {
    return apiPost(
      `/cases/${segment(caseId)}/payment-plan`,
      paymentPlanSchema,
      validateRequest(paymentPlanCreateSchema, body),
      options,
    );
  },

  updateInstallment(
    id: string,
    body: z.input<typeof installmentUpdateSchema>,
    options?: RequestOptions,
  ) {
    return apiPatch(
      `${installmentPath(id)}`,
      installmentSchema,
      validateRequest(installmentUpdateSchema, body),
      options,
    );
  },

  cancelInstallment(
    id: string,
    body: z.input<typeof installmentCancelSchema>,
    options?: RequestOptions,
  ) {
    return apiPost(
      `${installmentPath(id)}/cancel`,
      installmentSchema,
      validateRequest(installmentCancelSchema, body),
      options,
    );
  },

  verifyPaymentAttempt(
    id: string,
    body: z.input<typeof paymentVerifyStaffSchema>,
    options?: RequestOptions,
  ) {
    return apiPost(
      `/payments/${segment(id)}/verify`,
      paymentAttemptSchema,
      validateRequest(paymentVerifyStaffSchema, body),
      options,
    );
  },

  getFinanceSummary(options?: RequestOptions) {
    return apiGet("/finance/summary", financeSummarySchema, options);
  },

  listFinanceTransactions(
    filters?: FinanceTransactionListFilters,
    options?: RequestOptions,
  ) {
    return apiGetPage("/finance/transactions", financeTransactionSchema, {
      ...options,
      query: filters,
    });
  },

  getFinanceReport(
    query: z.input<typeof financeReportQuerySchema>,
    options?: RequestOptions,
  ) {
    return apiGet("/finance/report", financeReportSchema, {
      ...options,
      query,
    });
  },

  exportFinanceReportCsv(
    query: z.input<typeof financeReportQuerySchema>,
    options?: RequestOptions,
  ) {
    return apiGet("/finance/report.csv", financeReportCsvSchema, {
      ...options,
      query,
    });
  },

  processInstallmentReminders(options?: RequestOptions) {
    return apiPost(
      "/finance/process-installment-reminders",
      installmentRemindersResultSchema,
      {},
      options,
    );
  },
};
