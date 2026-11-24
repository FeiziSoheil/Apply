import type { QueryKey } from "@tanstack/react-query";
import type {
  FinanceTransactionListFilters,
  InstallmentListFilters,
  InvoiceListFilters,
} from "./api";

export const paymentKeys = {
  all: ["payments"] as const,
  invoices: () => [...paymentKeys.all, "invoices"] as const,
  invoiceLists: () => [...paymentKeys.invoices(), "list"] as const,
  invoiceList: (filters?: InvoiceListFilters) =>
    [...paymentKeys.invoiceLists(), filters ?? {}] as const,
  invoiceDetail: (id: string) =>
    [...paymentKeys.invoices(), "detail", id] as const,
  installments: () => [...paymentKeys.all, "installments"] as const,
  installmentLists: () => [...paymentKeys.installments(), "list"] as const,
  installmentList: (filters?: InstallmentListFilters) =>
    [...paymentKeys.installmentLists(), filters ?? {}] as const,
  financeSummary: (): QueryKey => ["payments", "finance-summary"],
  financeTransactions: (filters?: FinanceTransactionListFilters): QueryKey => [
    "payments",
    "finance-transactions",
    filters ?? {},
  ],
  financeReport: (query: { from: string; to: string }): QueryKey => [
    "payments",
    "finance-report",
    query,
  ],
};
