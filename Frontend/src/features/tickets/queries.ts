"use client";

import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query";
import type { ApiQueryOptions } from "@/lib/api/query-client";
import {
  ticketsApi,
  type MessageListFilters,
  type TicketListFilters,
} from "./api";
import { ticketKeys } from "./keys";

export { ticketKeys } from "./keys";

type TicketPage = Awaited<ReturnType<typeof ticketsApi.list>>;
type Ticket = Awaited<ReturnType<typeof ticketsApi.get>>;
type MessagePage = Awaited<ReturnType<typeof ticketsApi.listMessages>>;

export const ticketQueries = {
  list: (filters?: TicketListFilters) =>
    queryOptions({
      queryKey: ticketKeys.list(filters),
      queryFn: ({ signal }) => ticketsApi.list(filters, { signal }),
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: ticketKeys.detail(id),
      queryFn: ({ signal }) => ticketsApi.get(id, { signal }),
    }),
  messages: (id: string, filters?: MessageListFilters) =>
    queryOptions({
      queryKey: ticketKeys.messages(id, filters),
      queryFn: ({ signal }) => ticketsApi.listMessages(id, filters, { signal }),
    }),
};

export function useTickets(
  filters?: TicketListFilters,
  options?: ApiQueryOptions<TicketPage>,
) {
  return useQuery({
    ...ticketQueries.list(filters),
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useTicket(id: string, options?: ApiQueryOptions<Ticket>) {
  return useQuery({
    ...ticketQueries.detail(id),
    enabled: Boolean(id),
    ...options,
  });
}

export function useTicketMessages(
  id: string,
  filters?: MessageListFilters,
  options?: ApiQueryOptions<MessagePage>,
) {
  return useQuery({
    ...ticketQueries.messages(id, filters),
    enabled: Boolean(id),
    placeholderData: keepPreviousData,
    ...options,
  });
}
