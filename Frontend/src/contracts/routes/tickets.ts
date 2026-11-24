import { z } from "../zod";
import { idParamSchema, paginatedEnvelope, successEnvelope } from "../common";
import {
  messageListQuerySchema,
  ticketCreateSchema,
  ticketListQuerySchema,
  ticketMessageCreateSchema,
  ticketMessageSchema,
  ticketSchema,
  ticketUpdateSchema,
} from "../tickets";
import { requires, type RouteRegistrar } from "./helpers";

const TAG = "Tickets";
const OWNERSHIP =
  "دانشجو فقط تیکت‌های خودش را می‌بیند؛ کارمندان همه را (consultant: تیکت‌های پرونده‌های خودش).";

export function registerTicketRoutes(r: RouteRegistrar): void {
  const ticketResponse = successEnvelope("TicketResponse", ticketSchema);
  const closeBody = z.object({}).strict().openapi("TicketStateChange");

  r.route({
    method: "get",
    path: "/tickets",
    tag: TAG,
    operationId: "listTickets",
    summary: "فهرست تیکت‌ها",
    description: OWNERSHIP,
    access: requires("ticket:read"),
    query: ticketListQuerySchema,
    success: {
      status: 200,
      description: "فهرست صفحه‌بندی‌شده تیکت‌ها",
      schema: paginatedEnvelope("TicketsPage", ticketSchema),
    },
  });

  r.route({
    method: "post",
    path: "/tickets",
    tag: TAG,
    operationId: "createTicket",
    summary: "ایجاد تیکت (همراه با پیام اول)",
    access: requires("ticket:write"),
    body: { schema: ticketCreateSchema },
    success: { status: 201, description: "تیکت ایجاد شد", schema: ticketResponse },
  });

  r.route({
    method: "get",
    path: "/tickets/{id}",
    tag: TAG,
    operationId: "getTicket",
    summary: "دریافت تیکت",
    description: OWNERSHIP,
    access: requires("ticket:read"),
    params: idParamSchema,
    success: { status: 200, description: "تیکت", schema: ticketResponse },
  });

  r.route({
    method: "patch",
    path: "/tickets/{id}",
    tag: TAG,
    operationId: "updateTicket",
    summary: "ویرایش تیکت (وضعیت، اولویت، ارجاع)",
    access: requires("ticket:manage"),
    params: idParamSchema,
    body: { schema: ticketUpdateSchema },
    success: { status: 200, description: "تیکت ویرایش شد", schema: ticketResponse },
  });

  r.route({
    method: "get",
    path: "/tickets/{id}/messages",
    tag: TAG,
    operationId: "listTicketMessages",
    summary: "فهرست پیام‌های تیکت",
    description: "پیام‌های `internal` فقط برای کارمندان برگردانده می‌شوند.",
    access: requires("ticket:read"),
    params: idParamSchema,
    query: messageListQuerySchema,
    success: {
      status: 200,
      description: "فهرست پیام‌ها",
      schema: paginatedEnvelope("TicketMessagesPage", ticketMessageSchema),
    },
  });

  r.route({
    method: "post",
    path: "/tickets/{id}/messages",
    tag: TAG,
    operationId: "createTicketMessage",
    summary: "ارسال پیام در تیکت",
    description:
      "پاسخ کارمند وضعیت را به `waiting_student` و پیام دانشجو آن را به `waiting_staff` برمی‌گرداند. ارسال به تیکت بسته → `CONFLICT`. پیام‌های `internal` هرگز به دانشجو برنمی‌گردند. هدر اختیاری `Idempotency-Key`.",
    access: requires("ticket:write"),
    params: idParamSchema,
    body: { schema: ticketMessageCreateSchema },
    success: {
      status: 201,
      description: "پیام ارسال شد",
      schema: successEnvelope("TicketMessageResponse", ticketMessageSchema),
    },
    conflict: true,
  });

  r.route({
    method: "post",
    path: "/tickets/{id}/close",
    tag: TAG,
    operationId: "closeTicket",
    summary: "بستن تیکت",
    access: requires("ticket:write"),
    params: idParamSchema,
    body: { schema: closeBody },
    success: { status: 200, description: "تیکت بسته شد", schema: ticketResponse },
    conflict: true,
  });

  r.route({
    method: "post",
    path: "/tickets/{id}/reopen",
    tag: TAG,
    operationId: "reopenTicket",
    summary: "بازگشایی تیکت",
    description: "کارکنان بدون محدودیت زمانی؛ دانشجو از `/me/tickets/{id}/reopen` با پنجرهٔ ۷ روزه.",
    access: requires("ticket:write"),
    params: idParamSchema,
    body: { schema: closeBody },
    success: { status: 200, description: "تیکت بازگشایی شد", schema: ticketResponse },
    conflict: true,
  });
}
