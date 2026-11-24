import type { z } from "zod";
import {
  messageListQuerySchema,
  ticketCreateSchema,
  ticketListQuerySchema,
  ticketMessageCreateSchema,
  ticketMessageSchema,
  ticketSchema,
  ticketUpdateSchema,
} from "@/contracts/tickets";
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

export type TicketListFilters = ListFilters<typeof ticketListQuerySchema>;
export type MessageListFilters = ListFilters<typeof messageListQuerySchema>;

const ticketPath = (id: string) => `/tickets/${segment(id)}`;

/** `close` / `reopen` take an empty JSON object */
const EMPTY_BODY = {};

export const ticketsApi = {
  list(filters?: TicketListFilters, options?: RequestOptions) {
    return apiGetPage("/tickets", ticketSchema, { ...options, query: filters });
  },

  /** Creates the ticket together with its first message */
  create(body: z.input<typeof ticketCreateSchema>, options?: RequestOptions) {
    return apiPost("/tickets", ticketSchema, validateRequest(ticketCreateSchema, body), options);
  },

  get(id: string, options?: RequestOptions) {
    return apiGet(ticketPath(id), ticketSchema, options);
  },

  /** Staff: status, priority, category, assignee */
  update(
    id: string,
    body: z.input<typeof ticketUpdateSchema>,
    options?: RequestOptions,
  ) {
    return apiPatch(ticketPath(id), ticketSchema, validateRequest(ticketUpdateSchema, body), options);
  },

  listMessages(
    id: string,
    filters?: MessageListFilters,
    options?: RequestOptions,
  ) {
    return apiGetPage(`${ticketPath(id)}/messages`, ticketMessageSchema, {
      ...options,
      query: filters,
    });
  },

  createMessage(
    id: string,
    body: z.input<typeof ticketMessageCreateSchema>,
    options?: RequestOptions,
  ) {
    return apiPost(
      `${ticketPath(id)}/messages`,
      ticketMessageSchema,
      validateRequest(ticketMessageCreateSchema, body),
      options,
    );
  },

  close(id: string, options?: RequestOptions) {
    return apiPost(`${ticketPath(id)}/close`, ticketSchema, EMPTY_BODY, options);
  },

  reopen(id: string, options?: RequestOptions) {
    return apiPost(`${ticketPath(id)}/reopen`, ticketSchema, EMPTY_BODY, options);
  },
};
