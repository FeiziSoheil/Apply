import { parseAsString, parseAsStringLiteral, type Values } from "nuqs";
import type { TableUrlParams } from "@/components/admin/data-table/use-table-url-state";
import {
  INVOICE_SORT_FIELDS,
  PAYMENT_STATUSES,
  type FinanceTransactionListQuery,
  type InvoiceListQuery,
  type PaymentMethod,
} from "@/contracts/payments";

export const invoiceFilterParsers = {
  status: parseAsStringLiteral(PAYMENT_STATUSES),
};

export type InvoiceFilters = Values<typeof invoiceFilterParsers>;

export function toInvoiceListQuery(
  params: TableUrlParams,
  filters: InvoiceFilters,
): InvoiceListQuery {
  const sort =
    params.sort &&
    (INVOICE_SORT_FIELDS as readonly string[]).includes(params.sort)
      ? (params.sort as InvoiceListQuery["sort"])
      : "issuedAt";

  return {
    page: params.page,
    pageSize: params.pageSize,
    q: params.q || undefined,
    sort,
    order: params.order === "asc" ? "asc" : "desc",
    status: filters.status ?? undefined,
  };
}

export const txFilterParsers = {
  method: parseAsString,
  status: parseAsString,
  from: parseAsString,
  to: parseAsString,
};

export type TxFilters = Values<typeof txFilterParsers>;

export function toFinanceTransactionListQuery(
  params: TableUrlParams,
  filters: TxFilters,
): FinanceTransactionListQuery {
  const sort =
    params.sort === "amount" || params.sort === "occurredAt"
      ? params.sort
      : "occurredAt";

  return {
    page: params.page,
    pageSize: params.pageSize,
    q: params.q || undefined,
    sort,
    order: params.order === "asc" ? "asc" : "desc",
    method: (filters.method as PaymentMethod | null) ?? undefined,
    status: filters.status ?? undefined,
    from: filters.from ?? undefined,
    to: filters.to ?? undefined,
  };
}
