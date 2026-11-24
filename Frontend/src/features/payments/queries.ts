"use client";

import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query";
import type { ApiError } from "@/lib/api/errors";
import type { ApiQueryOptions } from "@/lib/api/query-client";
import {
  paymentsApi,
  type FinanceTransactionListFilters,
  type InstallmentListFilters,
  type InvoiceListFilters,
} from "./api";
import { paymentKeys } from "./keys";

export { paymentKeys } from "./keys";

type InvoicePage = Awaited<ReturnType<typeof paymentsApi.listInvoices>>;
type Invoice = Awaited<ReturnType<typeof paymentsApi.getInvoice>>;
type InstallmentPage = Awaited<ReturnType<typeof paymentsApi.listInstallments>>;
type FinanceSummary = Awaited<ReturnType<typeof paymentsApi.getFinanceSummary>>;
type FinanceTransactionPage = Awaited<
  ReturnType<typeof paymentsApi.listFinanceTransactions>
>;
type FinanceReport = Awaited<ReturnType<typeof paymentsApi.getFinanceReport>>;

export const paymentQueries = {
  invoices: (filters?: InvoiceListFilters) =>
    queryOptions({
      queryKey: paymentKeys.invoiceList(filters),
      queryFn: ({ signal }) => paymentsApi.listInvoices(filters, { signal }),
    }),
  invoice: (id: string) =>
    queryOptions({
      queryKey: paymentKeys.invoiceDetail(id),
      queryFn: ({ signal }) => paymentsApi.getInvoice(id, { signal }),
    }),
  installments: (filters?: InstallmentListFilters) =>
    queryOptions({
      queryKey: paymentKeys.installmentList(filters),
      queryFn: ({ signal }) =>
        paymentsApi.listInstallments(filters, { signal }),
    }),
  financeSummary: () =>
    queryOptions({
      queryKey: paymentKeys.financeSummary(),
      queryFn: ({ signal }) => paymentsApi.getFinanceSummary({ signal }),
    }),
  financeTransactions: (filters?: FinanceTransactionListFilters) =>
    queryOptions({
      queryKey: paymentKeys.financeTransactions(filters),
      queryFn: ({ signal }) =>
        paymentsApi.listFinanceTransactions(filters, { signal }),
    }),
  financeReport: (query: { from: string; to: string }) =>
    queryOptions({
      queryKey: paymentKeys.financeReport(query),
      queryFn: ({ signal }) => paymentsApi.getFinanceReport(query, { signal }),
    }),
};

export function useInvoices(
  filters?: InvoiceListFilters,
  options?: ApiQueryOptions<InvoicePage>,
) {
  return useQuery<InvoicePage, ApiError>({
    queryKey: paymentKeys.invoiceList(filters),
    queryFn: ({ signal }) => paymentsApi.listInvoices(filters, { signal }),
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useInvoice(id: string, options?: ApiQueryOptions<Invoice>) {
  return useQuery<Invoice, ApiError>({
    queryKey: paymentKeys.invoiceDetail(id),
    queryFn: ({ signal }) => paymentsApi.getInvoice(id, { signal }),
    enabled: Boolean(id),
    ...options,
  });
}

export function useInstallments(
  filters?: InstallmentListFilters,
  options?: ApiQueryOptions<InstallmentPage>,
) {
  return useQuery<InstallmentPage, ApiError>({
    queryKey: paymentKeys.installmentList(filters),
    queryFn: ({ signal }) =>
      paymentsApi.listInstallments(filters, { signal }),
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useFinanceSummary(options?: ApiQueryOptions<FinanceSummary>) {
  return useQuery({
    ...paymentQueries.financeSummary(),
    ...options,
  });
}

export function useFinanceTransactions(
  filters?: FinanceTransactionListFilters,
  options?: ApiQueryOptions<FinanceTransactionPage>,
) {
  return useQuery<FinanceTransactionPage, ApiError>({
    queryKey: paymentKeys.financeTransactions(filters),
    queryFn: ({ signal }) =>
      paymentsApi.listFinanceTransactions(filters, { signal }),
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useFinanceReport(
  query: { from: string; to: string },
  options?: ApiQueryOptions<FinanceReport>,
) {
  return useQuery({
    ...paymentQueries.financeReport(query),
    enabled: Boolean(query.from && query.to),
    ...options,
  });
}
