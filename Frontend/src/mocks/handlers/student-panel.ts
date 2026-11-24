import type {
  AnnouncementCreate,
  AnnouncementListQuery,
  AnnouncementUpdate,
  SelectCase,
  ShortlistPut,
  StudentMobileChangeRequest,
  StudentMobileChangeVerify,
  StudentProfileUpdate,
} from "@/contracts/student-panel";
import type {
  FinanceReportQuery,
  FinanceTransactionListQuery,
  InstallmentCancel,
  InstallmentUpdate,
  MockGatewayResolve,
  PaymentPlanCreate,
  PaymentVerifyStaff,
  StudentInstallmentPay,
} from "@/contracts/payments";
import type {
  TicketCreate,
  TicketListQuery,
  TicketMessageCreate,
  TicketRating,
} from "@/contracts/tickets";
import {
  OTP_EXPIRES_IN_SECONDS,
  OTP_RESEND_AFTER_SECONDS,
  DEMO_ACCOUNTS,
} from "../config";
import type { Notification } from "@/contracts/crm";
import { defineRoute, type RouteImplementations } from "../contract";
import { getDb, type MockDb } from "../db";
import {
  assertStudentOwnsTicket,
  buildStudentTasks,
  emptyEducation,
  findMyDocumentView,
  listDocumentViewsForCase,
  requireStudentCase,
  studentNotFound,
  toAnnouncementView,
  toCaseLinkOption,
  toStudentCaseView,
  toStudentProfile,
  toTicketMessageView,
  uploadStudentDocument,
} from "../domain/student-panel";
import {
  addTicketMessage,
  assertStudentCanReopen,
  enrichTicketView,
  markTicketMessagesRead,
  readIdempotencyKey,
  resolveTicketAssignee,
  resolveTicketAttachments,
  ticketSlaDueAt,
  withIdempotency,
} from "../domain/tickets";
import type {
  ShortlistConsultationRequest,
  ShortlistMerge,
  StudentDocumentUpload,
} from "@/contracts/student-panel";
import type {
  PrivacyRequestCreate,
  PrivacyRequestListQuery,
  PrivacyRequestProcess,
} from "@/contracts/privacy";
import {
  buildInvoiceItems,
  computeTotals,
  invoiceNumber,
  withEffectiveStatus,
} from "../domain/payments";
import {
  buildFinanceReport,
  buildFinanceTransactions,
  financeReportToCsv,
  installmentCaseId,
  processInstallmentReminders,
  withPayIdempotency,
} from "../domain/payment-finance";
import { emitDomainEvent } from "../domain-events";
import { INSTITUTE_SETTINGS_ID } from "../seed/settings";
import { requireUser } from "../domain/users";
import { apiError } from "../errors";
import { otpStore } from "../session";
import {
  compact,
  created,
  matchesQuery,
  newId,
  noContent,
  nowIso,
  ok,
  pageResult,
  resolveSort,
  sortItems,
} from "../utils";
import type { MockUser } from "../types";

type IdParams = { params: { id: string } };

const MOCK_OTP = DEMO_ACCOUNTS.student.otp;

function getShortlist(userId: string) {
  const db = getDb();
  const existing = db.shortlists.get(userId);
  if (existing) return existing;
  return db.shortlists.insert({
    id: userId,
    items: [],
    updatedAt: nowIso(),
  });
}

function presentShortlist(userId: string) {
  const row = getShortlist(userId);
  return { items: row.items, updatedAt: row.updatedAt };
}

function studentInstallments(userId: string) {
  const db = getDb();
  return db.installments
    .all()
    .filter((item) => {
      if (item.invoiceId) {
        const invoice = db.invoices.get(item.invoiceId);
        return invoice?.studentId === userId;
      }
      if (item.paymentPlanId) {
        const plan = db.paymentPlans.get(item.paymentPlanId);
        if (!plan) return false;
        const linked = db.cases.get(plan.caseId);
        return linked?.studentId === userId;
      }
      return false;
    })
    .map((item) => withEffectiveStatus({ ...item, title: item.title || "قسط" }));
}

function staffCaseIds(user: MockUser): Set<string> | null {
  if (user.role === "admin") return null;
  if (user.role !== "consultant") return new Set();
  return new Set(
    getDb()
      .cases.filter((entry) => entry.consultantId === user.id)
      .map((entry) => entry.id),
  );
}

function emitPaymentCaseEvent(input: {
  actorId: string | null;
  action: "create" | "update" | "export";
  caseId: string;
  entityType: string;
  entityId: string;
  body: string;
  diff?: { before: Record<string, unknown>; after: Record<string, unknown> };
  notifications?: {
    userId: string;
    type: "installment_due" | "ticket_reply";
    title: string;
    body: string;
    link: string;
  }[];
}) {
  const now = nowIso();
  emitDomainEvent(getDb(), {
    actorId: input.actorId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    diff: input.diff,
    activity: {
      id: newId(),
      entityType: "case",
      entityId: input.caseId,
      actorId: input.actorId,
      type: "system",
      body: input.body,
      createdAt: now,
    },
    notifications: input.notifications,
    now,
  });
}

export const studentPanelHandlers: RouteImplementations = {
  /* ----- Profile ----- */

  getMyProfile: defineRoute(({ user }) => {
    const current = requireUser(user);
    const db = getDb();
    const fresh = db.users.get(current.id) ?? current;
    return ok(toStudentProfile(fresh, db));
  }),

  updateMyProfile: defineRoute<{ body: StudentProfileUpdate }>(
    ({ user, body }) => {
      const current = requireUser(user);
      if (current.role !== "student") throw apiError.forbidden();
      const db = getDb();
      const fresh = db.users.get(current.id) ?? current;
      if (body.version !== undefined) {
        const currentVersion = fresh.version ?? 1;
        if (body.version !== currentVersion) {
          throw apiError.conflict(
            "اطلاعات پروفایل توسط شخص دیگری تغییر یافته است؛ لطفاً صفحه را تازه‌سازی کنید",
          );
        }
      }
      if (body.email) {
        const taken = db.users.find(
          (entry) => entry.id !== current.id && entry.email === body.email,
        );
        if (taken) {
          throw apiError.conflict("این ایمیل قبلاً استفاده شده است", {
            email: ["این ایمیل قبلاً استفاده شده است"],
          });
        }
      }
      const education = {
        ...(fresh.education ?? emptyEducation()),
        ...(body.education ?? {}),
      };
      const nextVersion = (fresh.version ?? 1) + 1;
      const updated = db.users.update(current.id, {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.email !== undefined
          ? { email: body.email ?? undefined }
          : {}),
        ...(body.city !== undefined ? { city: body.city } : {}),
        ...(body.birthDate !== undefined ? { birthDate: body.birthDate } : {}),
        ...(body.onboardingCompleted !== undefined
          ? { onboardingCompleted: body.onboardingCompleted }
          : {}),
        education,
        version: nextVersion,
        updatedAt: nowIso(),
      });
      return ok(toStudentProfile(updated, db));
    },
  ),

  requestMyMobileChange: defineRoute<{ body: StudentMobileChangeRequest }>(
    ({ user, body }) => {
      const current = requireUser(user);
      if (current.role !== "student") throw apiError.forbidden();
      if (body.mobile === current.mobile) {
        throw apiError.invalidField("mobile", "شماره جدید باید متفاوت باشد");
      }
      const db = getDb();
      if (db.users.find((entry) => entry.mobile === body.mobile)) {
        throw apiError.conflict("این شماره قبلاً ثبت شده است", {
          mobile: ["این شماره قبلاً ثبت شده است"],
        });
      }
      const { otps } = otpStore();
      otps.set(`mobile-change:${current.id}:${body.mobile}`, {
        code: MOCK_OTP,
        expiresAt: Date.now() + OTP_EXPIRES_IN_SECONDS * 1000,
        attempts: 0,
      });
      return ok(
        {
          expiresInSeconds: OTP_EXPIRES_IN_SECONDS,
          resendAfterSeconds: OTP_RESEND_AFTER_SECONDS,
        },
        { headers: { "x-mock-otp": MOCK_OTP } },
      );
    },
  ),

  verifyMyMobileChange: defineRoute<{ body: StudentMobileChangeVerify }>(
    ({ user, body }) => {
      const current = requireUser(user);
      if (current.role !== "student") throw apiError.forbidden();
      const key = `mobile-change:${current.id}:${body.mobile}`;
      const { otps } = otpStore();
      const pending = otps.get(key);
      if (!pending || pending.expiresAt <= Date.now() || body.code !== pending.code) {
        throw apiError.invalidField("code", "کد تأیید نامعتبر یا منقضی است");
      }
      otps.delete(key);
      const updated = getDb().users.update(current.id, {
        mobile: body.mobile,
        updatedAt: nowIso(),
      });
      return ok(toStudentProfile(updated, getDb()));
    },
  ),

  getMyCaseLink: defineRoute(({ user }) => {
    const current = requireUser(user);
    if (current.role !== "student") throw apiError.forbidden();
    const db = getDb();
    const mine = db.cases.filter((entry) => entry.studentId === current.id);
    if (mine.length === 0) {
      return ok({
        status: "none" as const,
        message: "پرونده‌ای پیدا نشد",
        cases: [],
        activeCaseId: null,
      });
    }
    if (mine.length === 1) {
      return ok({
        status: "linked" as const,
        cases: [toCaseLinkOption(mine[0])],
        activeCaseId: mine[0].id,
      });
    }
    return ok({
      status: "select" as const,
      message: "چند پرونده مرتبط پیدا شد؛ یکی را انتخاب کنید",
      cases: mine.map(toCaseLinkOption),
      activeCaseId: current.activeCaseId ?? null,
    });
  }),

  selectMyCase: defineRoute<{ body: SelectCase }>(({ user, body }) => {
    const current = requireUser(user);
    if (current.role !== "student") throw apiError.forbidden();
    const db = getDb();
    const linked = db.cases.get(body.caseId);
    if (!linked || linked.studentId !== current.id) studentNotFound("پرونده");
    db.users.update(current.id, {
      activeCaseId: linked.id,
      updatedAt: nowIso(),
    });
    return ok({
      status: "linked" as const,
      cases: [toCaseLinkOption(linked)],
      activeCaseId: linked.id,
    });
  }),

  getMyCaseView: defineRoute(({ user }) => {
    const current = requireUser(user);
    const db = getDb();
    const studentCase = requireStudentCase(db, current);
    return ok(toStudentCaseView(db, studentCase));
  }),

  listMyDocumentViews: defineRoute(({ user, origin }) => {
    const current = requireUser(user);
    const db = getDb();
    const studentCase = requireStudentCase(db, current);
    return ok(listDocumentViewsForCase(db, studentCase, origin));
  }),

  getMyDocumentView: defineRoute<IdParams>(({ user, params, origin }) => {
    const current = requireUser(user);
    const db = getDb();
    return ok(findMyDocumentView(db, current, params.id, origin));
  }),

  uploadMyDocument: defineRoute<{ body: StudentDocumentUpload }>(
    ({ user, body, origin }) => {
      const current = requireUser(user);
      const db = getDb();
      return ok(
        uploadStudentDocument(
          db,
          current,
          {
            fileId: body.fileId,
            documentId: body.documentId,
            checklistItemId: body.checklistItemId,
          },
          origin,
        ),
      );
    },
  ),

  listMyStudentTasks: defineRoute(({ user }) => {
    const current = requireUser(user);
    const db = getDb();
    const studentCase = requireStudentCase(db, current);
    return ok(buildStudentTasks(db, current, studentCase));
  }),

  /* ----- Tickets ----- */

  listMyTickets: defineRoute<{ query: TicketListQuery }>(({ user, query }) => {
    const current = requireUser(user);
    const db = getDb();
    const filtered = db.tickets
      .all()
      .filter((ticket) => ticket.createdBy === current.id)
      .filter((ticket) => !query.status || ticket.status === query.status)
      .filter((ticket) => !query.category || ticket.category === query.category)
      .filter((ticket) => !query.priority || ticket.priority === query.priority)
      .filter((ticket) => !query.caseId || ticket.caseId === query.caseId)
      .filter((ticket) =>
        matchesQuery(query.q, [ticket.subject, ticket.code]),
      );
    const { sort, order } = resolveSort(query, {
      sort: "lastMessageAt",
      order: "desc",
    });
    return pageResult(
      sortItems(
        filtered.map((ticket) => enrichTicketView(db, ticket, current)),
        sort,
        order,
        {
          lastMessageAt: (ticket) => ticket.lastMessageAt,
          createdAt: (ticket) => ticket.createdAt,
          priority: (ticket) => ticket.priority,
          slaDueAt: (ticket) => ticket.slaDueAt,
        },
      ),
      query,
    );
  }),

  createMyTicket: defineRoute<{ body: TicketCreate }>(({ user, body }) => {
    const current = requireUser(user);
    const db = getDb();
    const requestedCaseId = body.relatedCaseId ?? body.caseId ?? null;
    if (requestedCaseId) {
      requireStudentCase(db, current, requestedCaseId);
    }
    const { caseId, assignedTo } = resolveTicketAssignee(
      db,
      current.id,
      requestedCaseId,
    );
    const now = nowIso();
    const ticket = db.tickets.insert({
      id: newId(),
      code: `TK-${10_001 + db.tickets.count()}`,
      subject: body.subject,
      category: body.category,
      priority: body.priority,
      status: "waiting_staff",
      createdBy: current.id,
      createdByName: current.name,
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
    const { ticket: withMessage } = addTicketMessage(db, ticket, current, {
      body: body.body,
      attachments: resolveTicketAttachments(db, body.attachmentIds),
      internal: false,
    });
    return created(enrichTicketView(db, withMessage, current));
  }),

  getMyTicket: defineRoute<IdParams>(({ user, params }) => {
    const current = requireUser(user);
    const db = getDb();
    const ticket = assertStudentOwnsTicket(current, db.tickets.get(params.id));
    markTicketMessagesRead(db, ticket, current);
    const messages = db.ticketMessages
      .filter(
        (message) => message.ticketId === ticket.id && !message.internal,
      )
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map(toTicketMessageView);
    const fresh = db.tickets.get(ticket.id) ?? ticket;
    return ok({
      ticket: enrichTicketView(db, fresh, current),
      messages,
    });
  }),

  createMyTicketMessage: defineRoute<
    IdParams & { body: Omit<TicketMessageCreate, "internal"> }
  >(({ user, params, body, request }) => {
    const current = requireUser(user);
    const db = getDb();
    const ticket = assertStudentOwnsTicket(current, db.tickets.get(params.id));
    if (ticket.status === "closed") {
      throw apiError.conflict("تیکت بسته شده است");
    }
    return withIdempotency(
      `student-msg:${ticket.id}:${current.id}`,
      readIdempotencyKey(request),
      () => {
        const { message } = addTicketMessage(db, ticket, current, {
          body: body.body,
          attachments: resolveTicketAttachments(db, body.attachmentIds ?? []),
          internal: false,
        });
        return created(toTicketMessageView(message));
      },
    );
  }),

  closeMyTicket: defineRoute<IdParams>(({ user, params }) => {
    const current = requireUser(user);
    const db = getDb();
    const ticket = assertStudentOwnsTicket(current, db.tickets.get(params.id));
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
        current,
      ),
    );
  }),

  reopenMyTicket: defineRoute<IdParams>(({ user, params }) => {
    const current = requireUser(user);
    const db = getDb();
    const ticket = assertStudentOwnsTicket(current, db.tickets.get(params.id));
    assertStudentCanReopen(ticket);
    return ok(
      enrichTicketView(
        db,
        db.tickets.update(ticket.id, {
          status: "waiting_staff",
          closedAt: null,
          updatedAt: nowIso(),
        }),
        current,
      ),
    );
  }),

  rateMyTicket: defineRoute<IdParams & { body: TicketRating }>(
    ({ user, params, body }) => {
      const current = requireUser(user);
      const db = getDb();
      const ticket = assertStudentOwnsTicket(current, db.tickets.get(params.id));
      if (ticket.status !== "closed") {
        throw apiError.conflict("فقط تیکت بسته‌شده قابل امتیازدهی است");
      }
      if (ticket.rating !== null) {
        throw apiError.conflict("قبلاً امتیاز ثبت شده است");
      }
      return ok(
        enrichTicketView(
          db,
          db.tickets.update(ticket.id, {
            rating: body.rating,
            ratingComment: body.ratingComment ?? null,
            updatedAt: nowIso(),
          }),
          current,
        ),
      );
    },
  ),

  /* ----- Payments ----- */

  getMyPaymentSummary: defineRoute(({ user }) => {
    const current = requireUser(user);
    const rows = studentInstallments(current.id);
    const active = rows.filter((item) => item.status !== "cancelled");
    const open = active.filter((item) => item.status !== "paid");
    const paid = active.filter((item) => item.status === "paid");
    const overdue = open.filter((item) => item.status === "overdue");
    const next = [...open].sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
    const totalContract = active.reduce((sum, item) => sum + item.amount, 0);
    const totalPaid = paid.reduce((sum, item) => sum + item.amount, 0);
    return ok({
      totalContract,
      totalPaid,
      totalDue: Math.max(0, totalContract - totalPaid),
      overdueCount: overdue.length,
      nextDueDate: next?.dueDate ?? null,
      nextDueAmount: next?.amount ?? null,
      nextDueTitle: next?.title ?? null,
    });
  }),

  listMyInstallments: defineRoute(({ user }) =>
    ok(studentInstallments(requireUser(user).id)),
  ),

  payMyInstallment: defineRoute<IdParams & { body: StudentInstallmentPay }>(
    ({ user, params, body, origin, request }) => {
      const current = requireUser(user);
      const idemKey = readIdempotencyKey(request);
      return withPayIdempotency(
        `pay:${current.id}:${params.id}`,
        idemKey,
        () => {
          const db = getDb();
          const installment = db.installments.get(params.id);
          if (!installment) studentNotFound("قسط");
          const owned = studentInstallments(current.id).some(
            (item) => item.id === installment.id,
          );
          if (!owned) studentNotFound("قسط");
          if (
            installment.status === "paid" ||
            installment.status === "cancelled" ||
            installment.status === "awaiting_verification"
          ) {
            throw apiError.conflict("این قسط قابل پرداخت نیست");
          }

          const inFlight = db.paymentAttempts
            .all()
            .find(
              (attempt) =>
                attempt.installmentId === installment.id &&
                attempt.status === "initiated",
            );
          if (inFlight) {
            throw apiError.conflict(
              "پرداخت این قسط در حال انجام است؛ منتظر نتیجه بمانید",
            );
          }

          const caseId = installmentCaseId(db, installment);
          if (!caseId) studentNotFound("قسط");

          const now = nowIso();
          // Amount always from installment — never from client body
          const amount = installment.amount;

          if (body.method === "gateway") {
            const attempt = db.paymentAttempts.insert({
              id: newId(),
              installmentId: installment.id,
              caseId,
              studentId: current.id,
              method: "gateway",
              status: "initiated",
              gatewayRef: `GW-${newId().replaceAll("-", "").slice(0, 12)}`,
              receiptFileId: null,
              amount,
              createdAt: now,
              updatedAt: now,
            });
            const gatewayUrl = new URL(`/mock-gateway/${attempt.id}`, origin);
            if (body.callbackUrl) {
              gatewayUrl.searchParams.set("callback", body.callbackUrl);
            }
            return created({
              paymentId: attempt.id,
              status: attempt.status,
              gatewayUrl: gatewayUrl.toString(),
            });
          }

          if (body.method === "card_to_card") {
            const file = db.files.get(body.receiptFileId!);
            if (!file) {
              throw apiError.invalidField(
                "receiptFileId",
                "فایل رسید پیدا نشد",
              );
            }
            if (file.ownerId && file.ownerId !== current.id) {
              studentNotFound("فایل");
            }
            const attempt = db.paymentAttempts.insert({
              id: newId(),
              installmentId: installment.id,
              caseId,
              studentId: current.id,
              method: "card_to_card",
              status: "awaiting_verification",
              gatewayRef: null,
              receiptFileId: file.id,
              amount,
              createdAt: now,
              updatedAt: now,
            });
            db.installments.update(installment.id, {
              status: "awaiting_verification",
              updatedAt: now,
            });
            emitPaymentCaseEvent({
              actorId: current.id,
              action: "create",
              caseId,
              entityType: "payment_attempt",
              entityId: attempt.id,
              body: `رسید کارت‌به‌کارت برای «${installment.title || "قسط"}» ارسال شد`,
            });
            return created({
              paymentId: attempt.id,
              status: attempt.status,
              gatewayUrl: null,
            });
          }

          throw apiError.conflict("روش پرداخت نقدی فقط توسط کارکنان ثبت می‌شود");
        },
      );
    },
  ),

  getMyPaymentAccount: defineRoute(({ user }) => {
    requireUser(user);
    const settings =
      getDb().instituteSettings.get(INSTITUTE_SETTINGS_ID) ??
      getDb().instituteSettings.all()[0];
    const account = settings?.paymentAccount;
    if (!account) {
      throw apiError.notFound("حساب کارت‌به‌کارت");
    }
    return ok(account);
  }),

  getMyPayment: defineRoute<IdParams>(({ user, params }) => {
    const current = requireUser(user);
    const attempt = getDb().paymentAttempts.get(params.id);
    if (!attempt || attempt.studentId !== current.id) studentNotFound("پرداخت");
    return ok(attempt);
  }),

  listMyInvoices: defineRoute(({ user }) => {
    const current = requireUser(user);
    const db = getDb();
    const invoices = db.invoices
      .filter((invoice) => invoice.studentId === current.id)
      .map((invoice) => ({
        ...invoice,
        installments: db.installments
          .filter((item) => item.invoiceId === invoice.id)
          .map((item) =>
            withEffectiveStatus({ ...item, title: item.title || "قسط" }),
          ),
      }));
    return ok(invoices);
  }),

  getMyInvoice: defineRoute<IdParams>(({ user, params }) => {
    const current = requireUser(user);
    const db = getDb();
    const invoice = db.invoices.get(params.id);
    if (!invoice || invoice.studentId !== current.id) studentNotFound("فاکتور");
    return ok({
      ...invoice,
      installments: db.installments
        .filter((item) => item.invoiceId === invoice.id)
        .map((item) =>
          withEffectiveStatus({ ...item, title: item.title || "قسط" }),
        ),
    });
  }),

  resolveMockGateway: defineRoute<IdParams & { body: MockGatewayResolve }>(
    ({ user, params, body }) => {
      const db = getDb();
      const attempt = db.paymentAttempts.get(params.id);
      if (!attempt) studentNotFound("پرداخت");
      if (user && attempt.studentId !== user.id) studentNotFound("پرداخت");
      if (attempt.status !== "initiated") {
        return ok(attempt);
      }
      const now = nowIso();
      if (body.outcome === "success") {
        const installment = db.installments.get(attempt.installmentId);
        db.installments.update(attempt.installmentId, {
          status: "paid",
          paidAt: now,
          paymentMethod: "gateway",
          paymentRef: attempt.gatewayRef,
          updatedAt: now,
        });
        const updated = db.paymentAttempts.update(attempt.id, {
          status: "succeeded",
          updatedAt: now,
        });
        emitPaymentCaseEvent({
          actorId: user?.id ?? attempt.studentId,
          action: "update",
          caseId: attempt.caseId,
          entityType: "payment_attempt",
          entityId: attempt.id,
          body: `پرداخت آنلاین «${installment?.title || "قسط"}» موفق بود`,
        });
        return ok(updated);
      }
      if (body.outcome === "fail") {
        return ok(
          db.paymentAttempts.update(attempt.id, {
            status: "failed",
            updatedAt: now,
          }),
        );
      }
      return ok(
        db.paymentAttempts.update(attempt.id, {
          status: "cancelled",
          updatedAt: now,
        }),
      );
    },
  ),

  /* ----- Shortlist ----- */

  getMyShortlist: defineRoute(({ user }) =>
    ok(presentShortlist(requireUser(user).id)),
  ),

  putMyShortlistItem: defineRoute<{ body: ShortlistPut }>(({ user, body }) => {
    const current = requireUser(user);
    const db = getDb();
    const row = getShortlist(current.id);
    const duplicate = row.items.find(
      (item) =>
        (body.programId && item.programId === body.programId) ||
        (body.universityId && item.universityId === body.universityId) ||
        (body.countrySlug && item.countrySlug === body.countrySlug),
    );
    if (duplicate) return ok(presentShortlist(current.id));
    if (body.programId && !db.programs.get(body.programId)) {
      throw apiError.invalidField("programId", "برنامه پیدا نشد");
    }
    if (body.universityId && !db.universities.get(body.universityId)) {
      throw apiError.invalidField("universityId", "دانشگاه پیدا نشد");
    }
    const items = [
      ...row.items,
      {
        id: newId(),
        programId: body.programId ?? null,
        universityId: body.universityId ?? null,
        countrySlug: body.countrySlug ?? null,
        addedAt: nowIso(),
      },
    ].slice(0, 50);
    db.shortlists.update(current.id, { items, updatedAt: nowIso() });
    return ok(presentShortlist(current.id));
  }),

  deleteMyShortlistItem: defineRoute<{ body: ShortlistPut }>(
    ({ user, body }) => {
      const current = requireUser(user);
      const row = getShortlist(current.id);
      const items = row.items.filter(
        (item) =>
          !(body.programId && item.programId === body.programId) &&
          !(body.universityId && item.universityId === body.universityId) &&
          !(body.countrySlug && item.countrySlug === body.countrySlug),
      );
      getDb().shortlists.update(current.id, { items, updatedAt: nowIso() });
      return ok(presentShortlist(current.id));
    },
  ),

  mergeMyShortlist: defineRoute<{ body: ShortlistMerge }>(({ user, body }) => {
    const current = requireUser(user);
    const db = getDb();
    const row = getShortlist(current.id);
    const existing = [...row.items];
    for (const item of body.items) {
      const duplicate = existing.find(
        (x) =>
          (item.programId && x.programId === item.programId) ||
          (item.universityId && x.universityId === item.universityId) ||
          (item.countrySlug && x.countrySlug === item.countrySlug),
      );
      if (!duplicate) {
        existing.push({
          id: newId(),
          programId: item.programId ?? null,
          universityId: item.universityId ?? null,
          countrySlug: item.countrySlug ?? null,
          addedAt: nowIso(),
        });
      }
    }
    const items = existing.slice(0, 50);
    db.shortlists.update(current.id, { items, updatedAt: nowIso() });
    return ok(presentShortlist(current.id));
  }),

  requestShortlistConsultation: defineRoute<{
    body: ShortlistConsultationRequest;
  }>(({ user, body }) => {
    const current = requireUser(user);
    const db = getDb();
    const programNames = body.programIds
      .map((id) => db.programs.get(id)?.nameFa)
      .filter(Boolean);
    const now = nowIso();
    const studentCase = db.cases.find((c) => c.studentId === current.id);
    const caseId = current.activeCaseId ?? studentCase?.id ?? null;
    const ticket = db.tickets.insert({
      id: newId(),
      code: `TK-${10_001 + db.tickets.count()}`,
      subject: "مشاوره برنامه‌های انتخابی",
      category: "apply",
      priority: "normal",
      status: "waiting_staff",
      createdBy: current.id,
      createdByName: current.name,
      assignedTo: studentCase?.consultantId ?? null,
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
    addTicketMessage(db, ticket, current, {
      body: `سلام، من مایل به دریافت مشاوره درباره این برنامه‌ها هستم:\n${programNames.map((name) => `• ${name}`).join("\n")}${body.note ? `\n\nتوضیحات: ${body.note}` : ""}`,
      attachments: [],
      internal: false,
    });
    return created({
      ticketId: ticket.id,
      message: "درخواست مشاوره شما با موفقیت ثبت شد و تیکت جدید ایجاد گردید.",
    });
  }),

  compareMyShortlist: defineRoute(({ user }) => {
    const current = requireUser(user);
    const db = getDb();
    const row = getShortlist(current.id);
    const items = row.items.map((item) => {
      if (item.programId) {
        const program = db.programs.get(item.programId);
        const university = program
          ? db.universities.find((uni) => uni.slug === program.universitySlug)
          : null;
        const country = program
          ? db.countries.find((c) => c.slug === program.countrySlug)
          : null;
        return {
          programId: item.programId,
          universityId: university?.id ?? null,
          title: program?.nameFa ?? "برنامه",
          universityName: university?.nameFa ?? null,
          countryName: country?.nameFa ?? null,
          countrySlug: program?.countrySlug ?? null,
          degreeLevel: program?.degreeLevel ?? null,
          tuition: program?.tuition ?? null,
          currency: program?.currency ?? null,
          duration: program?.duration ?? "۲ سال",
          durationMonths: 24,
          deadline: program?.deadline ?? null,
          languageRequirement: program?.languageRequirement ?? null,
          minGpa: program?.minGpa ?? null,
          hasScholarship: program?.hasScholarship ?? false,
        };
      }
      if (item.universityId) {
        const university = db.universities.get(item.universityId);
        const country = university
          ? db.countries.find((c) => c.slug === university.countrySlug)
          : null;
        return {
          programId: null,
          universityId: item.universityId,
          title: university?.nameFa ?? "دانشگاه",
          universityName: university?.nameFa ?? null,
          countryName: country?.nameFa ?? null,
          countrySlug: university?.countrySlug ?? null,
          degreeLevel: null,
          tuition: university?.tuitionPerYear ?? null,
          currency: university?.currency ?? null,
          duration: null,
          durationMonths: null,
          deadline: null,
          languageRequirement: null,
          minGpa: null,
          hasScholarship: null,
        };
      }
      const country = item.countrySlug
        ? db.countries.find((c) => c.slug === item.countrySlug)
        : null;
      return {
        programId: null,
        universityId: null,
        title: country?.nameFa ?? "کشور",
        universityName: null,
        countryName: country?.nameFa ?? null,
        countrySlug: item.countrySlug ?? null,
        degreeLevel: null,
        tuition: null,
        currency: country?.currency ?? null,
        duration: null,
        durationMonths: null,
        deadline: null,
        languageRequirement: null,
        minGpa: null,
        hasScholarship: null,
      };
    });
    return ok({ items });
  }),

  /* ----- Announcements ----- */

  listMyAnnouncements: defineRoute(({ user }) => {
    const current = requireUser(user);
    const db = getDb();
    const studentCase = db.cases.find(
      (entry) => entry.studentId === current.id,
    );
    const country = studentCase?.targetCountry;
    const views = db.announcements
      .all()
      .filter((row) => row.status === "published" && row.publishedAt)
      .filter(
        (row) =>
          row.audience.allStudents ||
          (country ? row.audience.countrySlugs.includes(country) : false),
      )
      .map(toAnnouncementView)
      .filter((row): row is NonNullable<typeof row> => row !== null)
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    return ok(views);
  }),

  listAnnouncements: defineRoute<{ query: AnnouncementListQuery }>(
    ({ query }) => {
      const db = getDb();
      const filtered = db.announcements
        .all()
        .filter((row) => !query.status || row.status === query.status)
        .filter(
          (row) =>
            !query.country ||
            row.audience.allStudents ||
            row.audience.countrySlugs.includes(query.country),
        )
        .filter((row) => matchesQuery(query.q, [row.title, row.body]));
      const { sort, order } = resolveSort(query, {
        sort: "publishedAt",
        order: "desc",
      });
      return pageResult(
        sortItems(filtered, sort, order, {
          publishedAt: (row) => row.publishedAt,
          createdAt: (row) => row.createdAt,
          updatedAt: (row) => row.updatedAt,
        }),
        query,
      );
    },
  ),

  createAnnouncement: defineRoute<{ body: AnnouncementCreate }>(
    ({ body }) => {
      const now = nowIso();
      const publishedAt =
        body.status === "published"
          ? (body.publishedAt ?? now)
          : (body.publishedAt ?? null);
      return created(
        getDb().announcements.insert({
          id: newId(),
          title: body.title,
          body: body.body,
          audience: body.audience,
          status: body.status,
          publishedAt,
          createdAt: now,
          updatedAt: now,
        }),
      );
    },
  ),

  getAnnouncement: defineRoute<IdParams>(({ params }) => {
    const row = getDb().announcements.get(params.id);
    if (!row) throw apiError.notFound("اعلان");
    return ok(row);
  }),

  updateAnnouncement: defineRoute<IdParams & { body: AnnouncementUpdate }>(
    ({ params, body }) => {
      const db = getDb();
      const row = db.announcements.get(params.id);
      if (!row) throw apiError.notFound("اعلان");
      const patch = compact(body);
      let publishedAt = row.publishedAt;
      if (body.status === "published" && !publishedAt) {
        publishedAt = body.publishedAt ?? nowIso();
      }
      if (body.publishedAt !== undefined) publishedAt = body.publishedAt ?? null;
      return ok(
        db.announcements.update(row.id, {
          ...patch,
          publishedAt,
          updatedAt: nowIso(),
        }),
      );
    },
  ),

  deleteAnnouncement: defineRoute<IdParams>(({ params }) => {
    if (!getDb().announcements.remove(params.id)) {
      throw apiError.notFound("اعلان");
    }
    return noContent();
  }),

  /* ----- Staff finance ----- */

  createCasePaymentPlan: defineRoute<
    IdParams & { body: PaymentPlanCreate }
  >(({ user, params, body }) => {
    const actor = requireUser(user);
    const db = getDb();
    const linked = db.cases.get(params.id);
    if (!linked) throw apiError.notFound("پرونده");
    const now = nowIso();
    const plan = db.paymentPlans.insert({
      id: newId(),
      caseId: linked.id,
      total: body.total,
      createdAt: now,
      updatedAt: now,
    });
    const installments = body.installments.map((item, index) =>
      db.installments.insert({
        id: newId(),
        invoiceId: null,
        paymentPlanId: plan.id,
        sequence: index + 1,
        title: item.title ?? `قسط ${index + 1}`,
        amount: item.amount,
        dueDate: item.dueDate,
        status: "pending",
        paidAt: null,
        paymentMethod: null,
        paymentRef: null,
        createdAt: now,
        updatedAt: now,
      }),
    );

    if (body.invoiceTitle) {
      const items = buildInvoiceItems([
        {
          title: body.invoiceTitle,
          quantity: 1,
          unitAmount: body.total,
        },
      ]);
      const totals = computeTotals(items, 0, 0);
      const invoice = db.invoices.insert({
        id: newId(),
        number: invoiceNumber(100 + db.invoices.count()),
        caseId: linked.id,
        studentId: linked.studentId,
        title: body.invoiceTitle,
        description: null,
        currency: "IRR",
        items,
        subtotal: totals.subtotal,
        discount: 0,
        tax: 0,
        total: totals.total,
        paidAmount: 0,
        status: "pending",
        issuedAt: now,
        dueDate: installments.at(-1)?.dueDate ?? null,
        paidAt: null,
        createdAt: now,
        updatedAt: now,
      });
      for (const installment of installments) {
        db.installments.update(installment.id, { invoiceId: invoice.id });
      }
    }

    emitPaymentCaseEvent({
      actorId: actor.id,
      action: "create",
      caseId: linked.id,
      entityType: "payment_plan",
      entityId: plan.id,
      body: `برنامه پرداخت با ${installments.length} قسط ثبت شد`,
      diff: {
        before: {},
        after: { total: body.total, count: installments.length },
      },
    });

    return created({
      ...plan,
      installments: installments.map((item) =>
        withEffectiveStatus({ ...item, title: item.title || "قسط" }),
      ),
    });
  }),

  updateInstallment: defineRoute<IdParams & { body: InstallmentUpdate }>(
    ({ user, params, body }) => {
      const actor = requireUser(user);
      const db = getDb();
      const installment = db.installments.get(params.id);
      if (!installment) throw apiError.notFound("قسط");
      if (installment.status === "paid") {
        throw apiError.conflict("قسط پرداخت‌شده قابل ویرایش نیست");
      }
      const caseId = installmentCaseId(db, installment);
      const updated = withEffectiveStatus(
        db.installments.update(installment.id, {
          ...compact(body),
          updatedAt: nowIso(),
        }),
      );
      if (caseId) {
        emitPaymentCaseEvent({
          actorId: actor.id,
          action: "update",
          caseId,
          entityType: "installment",
          entityId: installment.id,
          body: `قسط «${updated.title}» ویرایش شد`,
          diff: {
            before: {
              amount: installment.amount,
              dueDate: installment.dueDate,
              status: installment.status,
            },
            after: {
              amount: updated.amount,
              dueDate: updated.dueDate,
              status: updated.status,
            },
          },
        });
      }
      return ok(updated);
    },
  ),

  cancelInstallment: defineRoute<IdParams & { body: InstallmentCancel }>(
    ({ user, params, body }) => {
      const actor = requireUser(user);
      const db = getDb();
      const installment = db.installments.get(params.id);
      if (!installment) throw apiError.notFound("قسط");
      if (installment.status === "paid") {
        throw apiError.conflict("قسط پرداخت‌شده قابل لغو نیست");
      }
      if (installment.status === "cancelled") {
        throw apiError.conflict("این قسط قبلاً لغو شده است");
      }
      const caseId = installmentCaseId(db, installment);
      const updated = withEffectiveStatus(
        db.installments.update(installment.id, {
          status: "cancelled",
          updatedAt: nowIso(),
        }),
      );
      if (caseId) {
        emitPaymentCaseEvent({
          actorId: actor.id,
          action: "update",
          caseId,
          entityType: "installment",
          entityId: installment.id,
          body: `قسط «${updated.title}» لغو شد: ${body.reason}`,
          diff: {
            before: { status: installment.status },
            after: { status: "cancelled", reason: body.reason },
          },
        });
      }
      return ok(updated);
    },
  ),

  verifyPaymentAttempt: defineRoute<
    IdParams & { body: PaymentVerifyStaff }
  >(({ user, params, body }) => {
    const actor = requireUser(user);
    const db = getDb();
    const attempt = db.paymentAttempts.get(params.id);
    if (!attempt) throw apiError.notFound("پرداخت");
    if (attempt.status !== "awaiting_verification") {
      throw apiError.conflict("این پرداخت در انتظار تأیید نیست");
    }
    const now = nowIso();
    const installment = db.installments.get(attempt.installmentId);

    if (body.decision === "approve") {
      db.installments.update(attempt.installmentId, {
        status: "paid",
        paidAt: now,
        paymentMethod:
          attempt.method === "gateway" ? "gateway" : attempt.method,
        paymentRef: attempt.gatewayRef,
        updatedAt: now,
      });
      const updated = db.paymentAttempts.update(attempt.id, {
        status: "succeeded",
        updatedAt: now,
      });
      emitPaymentCaseEvent({
        actorId: actor.id,
        action: "update",
        caseId: attempt.caseId,
        entityType: "payment_attempt",
        entityId: attempt.id,
        body: `پرداخت «${installment?.title || "قسط"}» تأیید شد`,
        notifications: [
          {
            userId: attempt.studentId,
            type: "ticket_reply",
            title: "پرداخت تأیید شد",
            body: `پرداخت «${installment?.title || "قسط"}» تأیید و ثبت شد.`,
            link: "/panel/payments",
          },
        ],
      });
      return ok(updated);
    }

    db.installments.update(attempt.installmentId, {
      status: "pending",
      updatedAt: now,
    });
    const updated = db.paymentAttempts.update(attempt.id, {
      status: "failed",
      updatedAt: now,
    });
    const reason = body.note?.trim() || "بدون توضیح";
    const ticket = db.tickets
      .all()
      .find(
        (row) =>
          row.createdBy === attempt.studentId &&
          row.status !== "closed" &&
          row.category === "payment",
      );
    if (ticket) {
      addTicketMessage(db, ticket, actor, {
        body: `رسید کارت‌به‌کارت رد شد: ${reason}`,
        attachments: [],
        internal: false,
      });
    }
    emitPaymentCaseEvent({
      actorId: actor.id,
      action: "update",
      caseId: attempt.caseId,
      entityType: "payment_attempt",
      entityId: attempt.id,
      body: `پرداخت «${installment?.title || "قسط"}» رد شد: ${reason}`,
      notifications: [
        {
          userId: attempt.studentId,
          type: "ticket_reply",
          title: "رسید پرداخت رد شد",
          body: reason,
          link: "/panel/payments",
        },
      ],
    });
    return ok(updated);
  }),

  getFinanceSummary: defineRoute(({ user }) => {
    const current = requireUser(user);
    const db = getDb();
    const allowed = staffCaseIds(current);
    const invoices = db.invoices
      .all()
      .filter((invoice) => !allowed || allowed.has(invoice.caseId));
    const installments = db.installments
      .all()
      .map((item) => withEffectiveStatus(item))
      .filter((item) => {
        if (!allowed) return true;
        const caseId = installmentCaseId(db, item);
        return caseId != null && allowed.has(caseId);
      });
    return ok({
      totalInvoiced: invoices
        .filter((invoice) => invoice.status !== "cancelled")
        .reduce((sum, invoice) => sum + invoice.total, 0),
      totalPaid: installments
        .filter((item) => item.status === "paid")
        .reduce((sum, item) => sum + item.amount, 0),
      totalOverdue: installments
        .filter((item) => item.status === "overdue")
        .reduce((sum, item) => sum + item.amount, 0),
      awaitingVerificationCount: installments.filter(
        (item) => item.status === "awaiting_verification",
      ).length,
      openInstallmentCount: installments.filter(
        (item) => item.status !== "paid" && item.status !== "cancelled",
      ).length,
    });
  }),

  listFinanceTransactions: defineRoute<{
    query: FinanceTransactionListQuery;
  }>(({ user, query }) => {
    const current = requireUser(user);
    const db = getDb();
    const allowed = staffCaseIds(current);
    const filtered = buildFinanceTransactions(db)
      .filter((row) => !allowed || allowed.has(row.caseId))
      .filter((row) => !query.caseId || row.caseId === query.caseId)
      .filter((row) => !query.studentId || row.studentId === query.studentId)
      .filter((row) => !query.method || row.method === query.method)
      .filter((row) => !query.status || row.status === query.status)
      .filter((row) => {
        if (query.awaitingVerification) {
          return row.status === "awaiting_verification";
        }
        return true;
      })
      .filter((row) => {
        const day = row.occurredAt.slice(0, 10);
        if (query.from && day < query.from) return false;
        if (query.to && day > query.to) return false;
        return true;
      })
      .filter((row) =>
        matchesQuery(query.q, [
          row.ref,
          row.status,
          row.code,
          row.studentName,
          row.installmentTitle,
        ]),
      );
    const { sort, order } = resolveSort(query, {
      sort: "occurredAt",
      order: "desc",
    });
    return pageResult(
      sortItems(filtered, sort, order, {
        occurredAt: (row) => row.occurredAt,
        amount: (row) => row.amount,
      }),
      query,
    );
  }),

  getFinanceReport: defineRoute<{ query: FinanceReportQuery }>(
    ({ user, query }) => {
      const current = requireUser(user);
      const allowed = staffCaseIds(current);
      return ok(
        buildFinanceReport(getDb(), query.from, query.to, allowed),
      );
    },
  ),

  exportFinanceReportCsv: defineRoute<{ query: FinanceReportQuery }>(
    ({ user, query }) => {
      const current = requireUser(user);
      const allowed = staffCaseIds(current);
      const report = buildFinanceReport(
        getDb(),
        query.from,
        query.to,
        allowed,
      );
      emitDomainEvent(getDb(), {
        actorId: current.id,
        action: "export",
        entityType: "finance_report",
        entityId: null,
        diff: { before: null, after: { from: query.from, to: query.to } },
      });
      return ok({
        csv: financeReportToCsv(report),
        filename: `finance-${query.from}-${query.to}.csv`,
      });
    },
  ),

  processInstallmentReminders: defineRoute(({ user }) => {
    requireUser(user);
    const createdCount = processInstallmentReminders(getDb());
    return ok({ created: createdCount });
  }),

  /* ----- Privacy & Data Requests ----- */

  listMyPrivacyRequests: defineRoute(({ user }) => {
    const current = requireUser(user);
    const db = getDb();
    const rows = db.privacyRequests
      .filter((r) => r.userId === current.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return ok(rows);
  }),

  createMyPrivacyRequest: defineRoute<{ body: PrivacyRequestCreate }>(
    ({ user, body }) => {
      const current = requireUser(user);
      const db = getDb();
      const now = nowIso();
      const createdRequest = db.privacyRequests.insert({
        id: newId(),
        userId: current.id,
        userName: current.name,
        userMobile: current.mobile ?? "09000000000",
        type: body.type,
        status: "pending",
        reason: body.reason ?? null,
        createdAt: now,
        processedAt: null,
        processedBy: null,
        adminNote: null,
      });
      emitDomainEvent(db, {
        actorId: current.id,
        action: "create",
        entityType: "privacy_request",
        entityId: createdRequest.id,
        diff: { before: null, after: { type: body.type, status: "pending" } },
      });
      return created(createdRequest);
    },
  ),

  getMyExportData: defineRoute(({ user }) => {
    const current = requireUser(user);
    const db = getDb();
    const studentCase = db.cases.find((c) => c.studentId === current.id);
    const docs = studentCase
      ? db.documents.filter((d) => d.caseId === studentCase.id)
      : [];
    const invoices = db.invoices.filter((i) => i.studentId === current.id);
    const installments = studentInstallments(current.id);
    const tickets = db.tickets.filter((t) => t.createdBy === current.id);
    const bookings = db.bookings.filter((b) => b.userId === current.id);
    const data = {
      user: {
        id: current.id,
        name: current.name,
        mobile: current.mobile,
        email: current.email,
        role: current.role,
      },
      case: studentCase ?? null,
      documents: docs,
      invoices,
      installments,
      tickets,
      bookings,
    };
    return ok({
      exportedAt: nowIso(),
      profile: toStudentProfile(current, db),
      data,
    });
  }),

  listPrivacyRequests: defineRoute<{ query: PrivacyRequestListQuery }>(
    ({ user, query }) => {
      requireUser(user);
      const db = getDb();
      let rows = db.privacyRequests.all();
      if (query.type) rows = rows.filter((r) => r.type === query.type);
      if (query.status) rows = rows.filter((r) => r.status === query.status);
      rows = rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return pageResult(rows, { page: query.page ?? 1, pageSize: query.pageSize ?? 20 });
    },
  ),

  processPrivacyRequest: defineRoute<IdParams & { body: PrivacyRequestProcess }>(
    ({ user, params, body }) => {
      const admin = requireUser(user);
      const db = getDb();
      const req = db.privacyRequests.get(params.id);
      if (!req) studentNotFound("درخواست حریم خصوصی");
      const now = nowIso();
      const status = body.decision === "approve" ? "completed" : "rejected";
      const updated = db.privacyRequests.update(req.id, {
        status,
        processedAt: now,
        processedBy: admin.name,
        adminNote: body.adminNote ?? null,
      });
      emitDomainEvent(db, {
        actorId: admin.id,
        action: "update",
        entityType: "privacy_request",
        entityId: req.id,
        diff: {
          before: { status: req.status },
          after: { status, adminNote: body.adminNote ?? null },
        },
      });
      return ok(updated);
    },
  ),
};

export function processAppointmentReminders(db: MockDb): number {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const in24h = now + dayMs;
  let createdCount = 0;
  for (const booking of db.bookings.all()) {
    if (booking.status !== "confirmed" && booking.status !== "pending") continue;
    if (!booking.userId) continue;
    const startMs = new Date(booking.startsAt).getTime();
    if (startMs > now && startMs <= in24h) {
      const exists = db.notifications.find(
        (n: Notification) =>
          n.userId === booking.userId &&
          n.type === "appointment_reminder" &&
          n.link.includes(booking.id),
      );
      if (!exists) {
        db.notifications.insert({
          id: newId(),
          userId: booking.userId,
          type: "appointment_reminder",
          title: "یادآوری جلسه مشاوره",
          body: `جلسه مشاوره شما با کد ${booking.code} در ۲۴ ساعت آینده برگزار خواهد شد.`,
          link: `/panel/appointments?id=${booking.id}`,
          readAt: null,
          createdAt: nowIso(),
        });
        createdCount++;
      }
    }
  }
  return createdCount;
}
