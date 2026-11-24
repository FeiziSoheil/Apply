/**
 * Shared ticket domain helpers for staff + student handlers.
 */
import type {
  Ticket,
  TicketAttachment,
  TicketMessage,
  TicketView,
} from "@/contracts/tickets";
import { STUDENT_TICKET_REOPEN_DAYS } from "@/contracts/tickets";
import type { MockDb } from "../db";
import { emitDomainEvent } from "../domain-events";
import { apiError } from "../errors";
import type { MockUser } from "../types";
import { newId, nowIso, type ApiResult } from "../utils";
import { isStaff } from "./users";

const SLA_HOURS = 24;
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

type IdempotencyEntry = {
  expiresAt: number;
  result: ApiResult;
};

const idempotencyCache = new Map<string, IdempotencyEntry>();

export function ticketSlaDueAt(from = Date.now()): string {
  return new Date(from + SLA_HOURS * 3_600_000).toISOString();
}

export function resolveTicketAttachments(
  db: MockDb,
  ids: readonly string[],
): TicketAttachment[] {
  return ids.map((fileId) => {
    const file = db.files.get(fileId);
    if (!file) {
      throw apiError.invalidField("attachmentIds", "یکی از فایل‌های پیوست پیدا نشد");
    }
    return {
      fileId: file.id,
      url: file.url,
      name: file.name,
      size: file.size,
      mimeType: file.mimeType,
    };
  });
}

/** Auto-assign: case consultant, else student's active/first case consultant, else null. */
export function resolveTicketAssignee(
  db: MockDb,
  studentId: string,
  caseId: string | null | undefined,
): { caseId: string | null; assignedTo: string | null } {
  if (caseId) {
    const linked = db.cases.get(caseId);
    if (!linked) throw apiError.invalidField("caseId", "پرونده پیدا نشد");
    if (linked.studentId !== studentId) {
      throw apiError.notFound("پرونده");
    }
    return { caseId: linked.id, assignedTo: linked.consultantId };
  }
  const student = db.users.get(studentId);
  const preferred =
    (student?.activeCaseId
      ? db.cases.get(student.activeCaseId)
      : undefined) ??
    db.cases.filter((entry) => entry.studentId === studentId)[0];
  if (!preferred) return { caseId: null, assignedTo: null };
  return { caseId: preferred.id, assignedTo: preferred.consultantId };
}

function lastNonInternalMessage(
  db: MockDb,
  ticketId: string,
): TicketMessage | undefined {
  return db.ticketMessages
    .filter((message) => message.ticketId === ticketId && !message.internal)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

function unreadForViewer(
  db: MockDb,
  ticketId: string,
  viewer: MockUser,
): number {
  const viewerIsStaff = isStaff(viewer);
  return db.ticketMessages.filter((message) => {
    if (message.ticketId !== ticketId) return false;
    if (message.internal && !viewerIsStaff) return false;
    if (message.readAt) return false;
    if (message.authorId === viewer.id) return false;
    if (viewerIsStaff) return message.authorType === "student";
    return message.authorType === "staff" || message.authorType === "system";
  }).length;
}

export function enrichTicketView(
  db: MockDb,
  ticket: Ticket,
  viewer: MockUser | null,
): TicketView {
  const last = lastNonInternalMessage(db, ticket.id);
  const preview = last
    ? last.body.length > 120
      ? `${last.body.slice(0, 117)}…`
      : last.body
    : null;
  return {
    ...ticket,
    relatedCaseId: ticket.relatedCaseId ?? ticket.caseId,
    lastMessagePreview: preview,
    unreadCount: viewer ? unreadForViewer(db, ticket.id, viewer) : 0,
  };
}

export function markTicketMessagesRead(
  db: MockDb,
  ticket: Ticket,
  viewer: MockUser,
): void {
  const now = nowIso();
  const viewerIsStaff = isStaff(viewer);
  for (const message of db.ticketMessages.filter(
    (item) => item.ticketId === ticket.id && !item.readAt,
  )) {
    if (message.authorId === viewer.id) continue;
    if (!viewerIsStaff && message.internal) continue;
    const shouldMark = viewerIsStaff
      ? message.authorType === "student"
      : message.authorType === "staff" || message.authorType === "system";
    if (shouldMark) {
      db.ticketMessages.update(message.id, { readAt: now });
    }
  }
}

export function assertStudentCanReopen(ticket: Ticket): void {
  if (ticket.status !== "closed") {
    throw apiError.conflict("فقط تیکت بسته قابل بازگشایی است");
  }
  if (!ticket.closedAt) {
    throw apiError.conflict("تاریخ بستن تیکت نامعتبر است");
  }
  const deadline =
    new Date(ticket.closedAt).getTime() +
    STUDENT_TICKET_REOPEN_DAYS * 86_400_000;
  if (Date.now() > deadline) {
    throw apiError.conflict(
      `بازگشایی فقط تا ${STUDENT_TICKET_REOPEN_DAYS} روز پس از بستن امکان‌پذیر است`,
    );
  }
}

function authorTypeOf(user: MockUser): "student" | "staff" {
  return user.role === "student" ? "student" : "staff";
}

export type AddTicketMessageInput = {
  body: string;
  attachments: TicketAttachment[];
  internal: boolean;
};

export function addTicketMessage(
  db: MockDb,
  ticket: Ticket,
  author: MockUser,
  input: AddTicketMessageInput,
): { message: TicketMessage; ticket: Ticket } {
  const now = nowIso();
  const message = db.ticketMessages.insert({
    id: newId(),
    ticketId: ticket.id,
    authorId: author.id,
    authorName: author.name,
    authorRole: author.role,
    authorType: authorTypeOf(author),
    body: input.body,
    attachments: input.attachments,
    attachmentIds: input.attachments.map((item) => item.fileId),
    internal: input.internal,
    readAt: null,
    createdAt: now,
  });
  const status = input.internal
    ? ticket.status
    : isStaff(author)
      ? "waiting_student"
      : "waiting_staff";
  const firstResponseAt =
    ticket.firstResponseAt ??
    (isStaff(author) && !input.internal ? now : ticket.firstResponseAt);
  const updated = db.tickets.update(ticket.id, {
    messageCount: ticket.messageCount + 1,
    lastMessageAt: now,
    status,
    firstResponseAt,
    closedAt: status === "closed" ? ticket.closedAt : null,
    updatedAt: now,
  });

  if (!input.internal) {
    notifyTicketMessage(db, updated, author, message);
  }

  return { message, ticket: updated };
}

function notifyTicketMessage(
  db: MockDb,
  ticket: Ticket,
  author: MockUser,
  message: TicketMessage,
): void {
  const preview =
    message.body.length > 80
      ? `${message.body.slice(0, 77)}…`
      : message.body;

  if (isStaff(author)) {
    emitDomainEvent(db, {
      actorId: author.id,
      action: "update",
      entityType: "ticket",
      entityId: ticket.id,
      notifications: [
        {
          userId: ticket.createdBy,
          type: "ticket_reply",
          title: "پاسخ جدید به پیام شما",
          body: preview,
          link: `/panel/messages/${ticket.id}`,
        },
      ],
    });
    return;
  }

  const staffTargets = new Set<string>();
  if (ticket.assignedTo) staffTargets.add(ticket.assignedTo);
  if (ticket.caseId) {
    const linked = db.cases.get(ticket.caseId);
    if (linked?.consultantId) staffTargets.add(linked.consultantId);
  }
  if (staffTargets.size === 0) {
    for (const user of db.users.all()) {
      if (user.role === "admin" && user.status === "active") {
        staffTargets.add(user.id);
      }
    }
  }

  const isNewTicket = ticket.messageCount <= 1;
  emitDomainEvent(db, {
    actorId: author.id,
    action: isNewTicket ? "create" : "update",
    entityType: "ticket",
    entityId: ticket.id,
    notifications: [...staffTargets].map((userId) => ({
      userId,
      type: isNewTicket ? ("ticket_new" as const) : ("ticket_reply" as const),
      title: isNewTicket ? "تیکت جدید" : "پیام جدید دانشجو",
      body: `${ticket.code}: ${preview}`,
      link: `/admin/tickets/${ticket.id}`,
    })),
  });
}

export function readIdempotencyKey(request: Request): string | null {
  const key = request.headers.get("Idempotency-Key")?.trim();
  return key && key.length > 0 ? key.slice(0, 128) : null;
}

export function withIdempotency(
  scope: string,
  key: string | null,
  run: () => ApiResult,
): ApiResult {
  if (!key) return run();
  const cacheKey = `${scope}:${key}`;
  const cached = idempotencyCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.result;
  }
  const result = run();
  idempotencyCache.set(cacheKey, {
    expiresAt: Date.now() + IDEMPOTENCY_TTL_MS,
    result,
  });
  return result;
}

/** Test helper */
export function clearTicketIdempotencyCache(): void {
  idempotencyCache.clear();
}
