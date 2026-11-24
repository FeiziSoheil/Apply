"use client";

import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query";
import type { PrivacyRequestListQuery } from "@/contracts/privacy";
import { isApiError } from "@/lib/api/errors";
import { studentPanelApi, type MyTicketListFilters } from "./api";
import { studentPanelKeys } from "./keys";

export { studentPanelKeys } from "./keys";

type QueryOpts = { enabled?: boolean };

export const studentPanelQueries = {
  caseLink: () =>
    queryOptions({
      queryKey: studentPanelKeys.caseLink(),
      queryFn: ({ signal }) => studentPanelApi.getCaseLink({ signal }),
      staleTime: 30_000,
    }),
  case: () =>
    queryOptions({
      queryKey: studentPanelKeys.case(),
      queryFn: ({ signal }) => studentPanelApi.getCase({ signal }),
      staleTime: 15_000,
      retry: (count, error) => {
        if (isApiError(error) && error.isNotFound) return false;
        return count < 2;
      },
    }),
  documents: () =>
    queryOptions({
      queryKey: studentPanelKeys.documents(),
      queryFn: ({ signal }) => studentPanelApi.listDocuments({ signal }),
    }),
  tasks: () =>
    queryOptions({
      queryKey: studentPanelKeys.tasks(),
      queryFn: ({ signal }) => studentPanelApi.listTasks({ signal }),
    }),
  announcements: () =>
    queryOptions({
      queryKey: studentPanelKeys.announcements(),
      queryFn: ({ signal }) => studentPanelApi.listAnnouncements({ signal }),
    }),
  profile: () =>
    queryOptions({
      queryKey: studentPanelKeys.profile(),
      queryFn: ({ signal }) => studentPanelApi.getProfile({ signal }),
    }),
  tickets: (filters?: MyTicketListFilters) =>
    queryOptions({
      queryKey: studentPanelKeys.tickets(filters),
      queryFn: ({ signal }) =>
        studentPanelApi.listTickets(filters, { signal }),
    }),
  ticket: (id: string) =>
    queryOptions({
      queryKey: studentPanelKeys.ticket(id),
      queryFn: ({ signal }) => studentPanelApi.getTicket(id, { signal }),
      refetchInterval: 10_000,
      retry: (count, error) => {
        if (isApiError(error) && error.isNotFound) return false;
        return count < 2;
      },
    }),
  paymentSummary: () =>
    queryOptions({
      queryKey: studentPanelKeys.paymentSummary(),
      queryFn: ({ signal }) => studentPanelApi.getPaymentSummary({ signal }),
    }),
  installments: () =>
    queryOptions({
      queryKey: studentPanelKeys.installments(),
      queryFn: ({ signal }) => studentPanelApi.listInstallments({ signal }),
    }),
  paymentAccount: () =>
    queryOptions({
      queryKey: studentPanelKeys.paymentAccount(),
      queryFn: ({ signal }) => studentPanelApi.getPaymentAccount({ signal }),
    }),
  payment: (id: string) =>
    queryOptions({
      queryKey: studentPanelKeys.payment(id),
      queryFn: ({ signal }) => studentPanelApi.getPayment(id, { signal }),
    }),
  invoices: () =>
    queryOptions({
      queryKey: studentPanelKeys.invoices(),
      queryFn: ({ signal }) => studentPanelApi.listInvoices({ signal }),
    }),
  invoice: (id: string) =>
    queryOptions({
      queryKey: studentPanelKeys.invoice(id),
      queryFn: ({ signal }) => studentPanelApi.getInvoice(id, { signal }),
    }),
  shortlist: () =>
    queryOptions({
      queryKey: studentPanelKeys.shortlist(),
      queryFn: ({ signal }) => studentPanelApi.getShortlist({ signal }),
    }),
  shortlistCompare: () =>
    queryOptions({
      queryKey: studentPanelKeys.shortlistCompare(),
      queryFn: ({ signal }) => studentPanelApi.compareShortlist({ signal }),
    }),
  privacyRequests: () =>
    queryOptions({
      queryKey: studentPanelKeys.privacyRequests(),
      queryFn: ({ signal }) =>
        studentPanelApi.listMyPrivacyRequests({ signal }),
    }),
  adminPrivacyRequests: (filters?: Partial<PrivacyRequestListQuery>) =>
    queryOptions({
      queryKey: studentPanelKeys.adminPrivacyRequests(filters),
      queryFn: ({ signal }) =>
        studentPanelApi.listAdminPrivacyRequests(filters, { signal }),
      placeholderData: keepPreviousData,
    }),
  exportData: () =>
    queryOptions({
      queryKey: studentPanelKeys.exportData(),
      queryFn: ({ signal }) => studentPanelApi.getMyExportData({ signal }),
    }),
};

export function useMyCaseLink(options?: QueryOpts) {
  return useQuery({ ...studentPanelQueries.caseLink(), ...options });
}

export function useMyCase(options?: QueryOpts) {
  return useQuery({ ...studentPanelQueries.case(), ...options });
}

export function useMyDocuments(options?: QueryOpts) {
  return useQuery({ ...studentPanelQueries.documents(), ...options });
}

export function useMyStudentTasks(options?: QueryOpts) {
  return useQuery({ ...studentPanelQueries.tasks(), ...options });
}

export function useMyAnnouncements(options?: QueryOpts) {
  return useQuery({ ...studentPanelQueries.announcements(), ...options });
}

export function useMyStudentProfile(options?: QueryOpts) {
  return useQuery({ ...studentPanelQueries.profile(), ...options });
}

export function useMyTickets(
  filters?: MyTicketListFilters,
  options?: QueryOpts,
) {
  return useQuery({ ...studentPanelQueries.tickets(filters), ...options });
}

export function useMyTicket(id: string, options?: QueryOpts) {
  return useQuery({
    ...studentPanelQueries.ticket(id),
    enabled: Boolean(id) && (options?.enabled ?? true),
    ...options,
  });
}

export function useMyPaymentSummary(options?: QueryOpts) {
  return useQuery({ ...studentPanelQueries.paymentSummary(), ...options });
}

export function useMyInstallments(options?: QueryOpts) {
  return useQuery({ ...studentPanelQueries.installments(), ...options });
}

export function useMyPaymentAccount(options?: QueryOpts) {
  return useQuery({ ...studentPanelQueries.paymentAccount(), ...options });
}

export function useMyPayment(id: string, options?: QueryOpts) {
  return useQuery({
    ...studentPanelQueries.payment(id),
    enabled: Boolean(id) && (options?.enabled ?? true),
    ...options,
  });
}

export function useMyInvoices(options?: QueryOpts) {
  return useQuery({ ...studentPanelQueries.invoices(), ...options });
}

export function useMyInvoice(id: string, options?: QueryOpts) {
  return useQuery({
    ...studentPanelQueries.invoice(id),
    enabled: Boolean(id) && (options?.enabled ?? true),
    ...options,
  });
}

export function useMyShortlist(options?: QueryOpts) {
  return useQuery({ ...studentPanelQueries.shortlist(), ...options });
}

export function useMyShortlistCompare(options?: QueryOpts) {
  return useQuery({ ...studentPanelQueries.shortlistCompare(), ...options });
}

export function useMyPrivacyRequests(options?: QueryOpts) {
  return useQuery({ ...studentPanelQueries.privacyRequests(), ...options });
}

export function useAdminPrivacyRequests(
  filters?: Partial<PrivacyRequestListQuery>,
  options?: QueryOpts,
) {
  return useQuery({
    ...studentPanelQueries.adminPrivacyRequests(filters),
    ...options,
  });
}

export function useMyExportData(options?: QueryOpts) {
  return useQuery({ ...studentPanelQueries.exportData(), ...options });
}
