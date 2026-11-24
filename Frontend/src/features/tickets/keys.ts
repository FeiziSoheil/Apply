import type { QueryKey } from "@tanstack/react-query";
import { createEntityKeys } from "@/lib/api/query-keys";
import type {
  MessageListQuery,
  TicketListQuery,
} from "@/contracts/tickets";

const base = createEntityKeys<Partial<TicketListQuery>>(["tickets"]);

export const ticketKeys = {
  ...base,
  messages: (ticketId: string, filters?: Partial<MessageListQuery>): QueryKey =>
    ["tickets", "messages", ticketId, filters ?? {}],
  /** All message lists of one ticket (any params) */
  ticketMessages: (ticketId: string): QueryKey => ["tickets", "messages", ticketId],
} as const;
