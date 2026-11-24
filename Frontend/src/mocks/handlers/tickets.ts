import {
  TICKET_PRIORITIES,
  type Ticket,
  type TicketCreate,
  type TicketListQuery,
  type TicketMessageCreate,
  type MessageListQuery,
  type TicketUpdate,
} from "@/contracts/tickets";
import { defineRoute, type RouteImplementations } from "../contract";
import { getDb, type MockDb } from "../db";
import {
  addTicketMessage,
  enrichTicketView,
  markTicketMessagesRead,
  readIdempotencyKey,
  resolveTicketAssignee,
  resolveTicketAttachments,
  ticketSlaDueAt,
  withIdempotency,
} from "../domain/tickets";
import { isStaff, requireUser } from "../domain/users";
import { apiError } from "../errors";
import type { MockUser } from "../types";
import {
  compact,
  created,
  matchesQuery,
  newId,
  nowIso,
  ok,
  pageResult,
  resolveSort,
  sortItems,
} from "../utils";

type IdParams = { params: { id: string } };

function findTicket(db: MockDb, id: string): Ticket {
  const ticket = db.tickets.get(id);
  if (!ticket) throw apiError.notFound("تیکت");
  return ticket;
}

/** student: own tickets · consultant: assigned or on own cases · admin: all */
function canSeeTicket(db: MockDb, user: MockUser, ticket: Ticket): boolean {
  if (user.role === "admin") return true;
  if (user.role === "student") return ticket.createdBy === user.id;
  if (ticket.assignedTo === user.id) return true;
  if (!ticket.caseId) return false;
  return db.cases.get(ticket.caseId)?.consultantId === user.id;
}

function assertTicketAccess(db: MockDb, user: MockUser, ticket: Ticket): void {
  if (user.role === "student") {
    if (!canSeeTicket(db, user, ticket)) throw apiError.notFound("تیکت");
    return;
  }
  if (!canSeeTicket(db, user, ticket)) throw apiError.forbidden();
}

const PRIORITY_RANK = new Map<string, number>(
  TICKET_PRIORITIES.map((priority, index) => [priority, index]),
);

export const ticketHandlers: RouteImplementations = {
  listTickets: defineRoute<{ query: TicketListQuery }>(({ user, query }) => {
    const actor = requireUser(user);
    const db = getDb();
    const now = Date.now();
    const filtered = db.tickets
      .all()
      .filter((ticket) => canSeeTicket(db, actor, ticket))
      .filter((ticket) => !query.status || ticket.status === query.status)
      .filter((ticket) => !query.category || ticket.category === query.category)
      .filter((ticket) => !query.priority || ticket.priority === query.priority)
      .filter((ticket) => !query.assignedTo || ticket.assignedTo === query.assignedTo)
      .filter((ticket) => !query.caseId || ticket.caseId === query.caseId)
      .filter((ticket) => {
        if (!query.unassigned) return true;
        return ticket.assignedTo === null;
      })
      .filter((ticket) => {
        if (!query.unanswered) return true;
        return ticket.status === "waiting_staff" || ticket.status === "open";
      })
      .filter((ticket) => {
        if (!query.slaOverdue) return true;
        return (
          ticket.slaDueAt !== null &&
          ticket.status !== "closed" &&
          new Date(ticket.slaDueAt).getTime() < now
        );
      })
      .filter((ticket) =>
        matchesQuery(query.q, [ticket.subject, ticket.code, ticket.createdByName]),
      );
    const { sort, order } = resolveSort(query, {
      sort: "lastMessageAt",
      order: "desc",
    });
    return pageResult(
      sortItems(
        filtered.map((ticket) => enrichTicketView(db, ticket, actor)),
        sort,
        order,
        {
          lastMessageAt: (ticket) => ticket.lastMessageAt,
          createdAt: (ticket) => ticket.createdAt,
          priority: (ticket) => PRIORITY_RANK.get(ticket.priority),
          slaDueAt: (ticket) => ticket.slaDueAt,
        },
      ),
      query,
    );
  }),

  createTicket: defineRoute<{ body: TicketCreate }>(({ user, body }) => {
    const actor = requireUser(user);
    const db = getDb();
    const requestedCaseId = body.relatedCaseId ?? body.caseId ?? null;
    let caseId: string | null = requestedCaseId;
    let assignedTo: string | null = null;

    if (actor.role === "student") {
      const resolved = resolveTicketAssignee(db, actor.id, requestedCaseId);
      caseId = resolved.caseId;
      assignedTo = resolved.assignedTo;
    } else if (requestedCaseId) {
      const linked = db.cases.get(requestedCaseId);
      if (!linked) throw apiError.invalidField("caseId", "پرونده پیدا نشد");
      caseId = linked.id;
      assignedTo = linked.consultantId;
    }

    const attachments = resolveTicketAttachments(db, body.attachmentIds);
    const now = nowIso();
    const sequence = 10_001 + db.tickets.count();
    const ticket = db.tickets.insert({
      id: newId(),
      code: `TK-${sequence}`,
      subject: body.subject,
      category: body.category,
      priority: body.priority,
      status: isStaff(actor) ? "waiting_student" : "waiting_staff",
      createdBy: actor.id,
      createdByName: actor.name,
      assignedTo,
      caseId,
      relatedCaseId: caseId,
      messageCount: 0,
      lastMessageAt: now,
      closedAt: null,
      firstResponseAt: null,
      slaDueAt: ticketSlaDueAt(),
      rating: null,
      ratingComment: null,
      createdAt: now,
      updatedAt: now,
    });
    const { ticket: withMessage } = addTicketMessage(db, ticket, actor, {
      body: body.body,
      attachments,
      internal: false,
    });
    return created(enrichTicketView(db, withMessage, actor));
  }),

  getTicket: defineRoute<IdParams>(({ user, params }) => {
    const db = getDb();
    const actor = requireUser(user);
    const ticket = findTicket(db, params.id);
    assertTicketAccess(db, actor, ticket);
    markTicketMessagesRead(db, ticket, actor);
    return ok(enrichTicketView(db, findTicket(db, params.id), actor));
  }),

  updateTicket: defineRoute<IdParams & { body: TicketUpdate }>(
    ({ user, params, body }) => {
      const db = getDb();
      const actor = requireUser(user);
      const ticket = findTicket(db, params.id);
      assertTicketAccess(db, actor, ticket);
      if (body.assignedTo) {
        const assignee = db.users.get(body.assignedTo);
        if (!assignee || !isStaff(assignee)) {
          throw apiError.invalidField("assignedTo", "کاربر کارمند پیدا نشد");
        }
      }
      const now = nowIso();
      const patch = compact(body);
      return ok(
        enrichTicketView(
          db,
          db.tickets.update(ticket.id, {
            ...patch,
            closedAt:
              patch.status === "closed"
                ? now
                : patch.status
                  ? null
                  : ticket.closedAt,
            updatedAt: now,
          }),
          actor,
        ),
      );
    },
  ),

  listTicketMessages: defineRoute<IdParams & { query: MessageListQuery }>(
    ({ user, params, query }) => {
      const db = getDb();
      const actor = requireUser(user);
      const ticket = findTicket(db, params.id);
      assertTicketAccess(db, actor, ticket);
      markTicketMessagesRead(db, ticket, actor);
      const items = db.ticketMessages
        .filter((message) => message.ticketId === ticket.id)
        .filter((message) => isStaff(actor) || !message.internal)
        .filter((message) => matchesQuery(query.q, [message.body]));
      const { sort, order } = resolveSort(query, {
        sort: "createdAt",
        order: "asc",
      });
      return pageResult(
        sortItems(items, sort, order, {
          createdAt: (message) => message.createdAt,
        }),
        query,
      );
    },
  ),

  createTicketMessage: defineRoute<IdParams & { body: TicketMessageCreate }>(
    ({ user, params, body, request }) => {
      const db = getDb();
      const actor = requireUser(user);
      const ticket = findTicket(db, params.id);
      assertTicketAccess(db, actor, ticket);
      if (ticket.status === "closed") {
        throw apiError.conflict("تیکت بسته شده است؛ ابتدا آن را بازگشایی کنید");
      }
      if (body.internal && !isStaff(actor)) {
        throw apiError.forbidden(
          "فقط کارمندان می‌توانند یادداشت داخلی ثبت کنند",
        );
      }

      const idempotencyKey = readIdempotencyKey(request);
      const result = withIdempotency(
        `staff-msg:${ticket.id}:${actor.id}`,
        idempotencyKey,
        () => {
          const { message } = addTicketMessage(db, ticket, actor, {
            body: body.body,
            attachments: resolveTicketAttachments(db, body.attachmentIds),
            internal: body.internal,
          });
          return created(message);
        },
      );
      return result;
    },
  ),

  closeTicket: defineRoute<IdParams>(({ user, params }) => {
    const db = getDb();
    const actor = requireUser(user);
    const ticket = findTicket(db, params.id);
    assertTicketAccess(db, actor, ticket);
    if (ticket.status === "closed") {
      throw apiError.conflict("تیکت از قبل بسته شده است");
    }
    const now = nowIso();
    return ok(
      enrichTicketView(
        db,
        db.tickets.update(ticket.id, {
          status: "closed",
          closedAt: now,
          updatedAt: now,
        }),
        actor,
      ),
    );
  }),

  reopenTicket: defineRoute<IdParams>(({ user, params }) => {
    const db = getDb();
    const actor = requireUser(user);
    const ticket = findTicket(db, params.id);
    assertTicketAccess(db, actor, ticket);
    if (ticket.status !== "closed") {
      throw apiError.conflict("فقط تیکت بسته قابل بازگشایی است");
    }
    return ok(
      enrichTicketView(
        db,
        db.tickets.update(ticket.id, {
          status: "waiting_staff",
          closedAt: null,
          updatedAt: nowIso(),
        }),
        actor,
      ),
    );
  }),
};
