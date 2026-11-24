"use client";

import type { z } from "zod";
import type {
  ticketCreateSchema,
  ticketMessageCreateSchema,
  ticketUpdateSchema,
} from "@/contracts/tickets";
import {
  useApiMutation,
  type ApiMutationOptions,
} from "@/lib/api/use-api-mutation";
import { ticketsApi } from "./api";
import { ticketKeys } from "./keys";

type Ticket = Awaited<ReturnType<typeof ticketsApi.create>>;
type TicketMessage = Awaited<ReturnType<typeof ticketsApi.createMessage>>;

export function useCreateTicket(
  options?: ApiMutationOptions<Ticket, z.input<typeof ticketCreateSchema>>,
) {
  return useApiMutation({
    mutationFn: (body: z.input<typeof ticketCreateSchema>) => ticketsApi.create(body),
    invalidates: () => [ticketKeys.lists()],
    options,
  });
}

type UpdateTicketVariables = {
  id: string;
  body: z.input<typeof ticketUpdateSchema>;
};

export function useUpdateTicket(options?: ApiMutationOptions<Ticket, UpdateTicketVariables>) {
  return useApiMutation({
    mutationFn: ({ id, body }: UpdateTicketVariables) => ticketsApi.update(id, body),
    invalidates: (_data, { id }) => [ticketKeys.detail(id), ticketKeys.lists()],
    options,
  });
}

type CreateTicketMessageVariables = {
  id: string;
  body: z.input<typeof ticketMessageCreateSchema>;
};

function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** A new message changes ticket status / counters, so the ticket refreshes too */
export function useCreateTicketMessage(
  options?: ApiMutationOptions<TicketMessage, CreateTicketMessageVariables>,
) {
  return useApiMutation({
    mutationFn: ({ id, body }: CreateTicketMessageVariables) =>
      ticketsApi.createMessage(id, body, {
        headers: { "Idempotency-Key": newIdempotencyKey() },
      }),
    invalidates: (_data, { id }) => [
      ticketKeys.ticketMessages(id),
      ticketKeys.detail(id),
      ticketKeys.lists(),
    ],
    options,
  });
}

export function useCloseTicket(options?: ApiMutationOptions<Ticket, string>) {
  return useApiMutation({
    mutationFn: (id: string) => ticketsApi.close(id),
    invalidates: (_data, id) => [ticketKeys.detail(id), ticketKeys.lists()],
    options,
  });
}

export function useReopenTicket(options?: ApiMutationOptions<Ticket, string>) {
  return useApiMutation({
    mutationFn: (id: string) => ticketsApi.reopen(id),
    invalidates: (_data, id) => [ticketKeys.detail(id), ticketKeys.lists()],
    options,
  });
}
