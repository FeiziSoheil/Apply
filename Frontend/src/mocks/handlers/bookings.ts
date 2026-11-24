import type {
  Booking,
  BookingCancel,
  BookingChange,
  BookingChangeAction,
  BookingCreate,
  BookingListQuery,
  BookingPatch,
  BookingStaffCreate,
  BookingStatusUpdate,
  SlotsQuery,
} from "@/contracts/bookings";
import type { Lead } from "@/contracts/leads";
import { defineRoute, type RouteImplementations } from "../contract";
import { getDb, type MockDb } from "../db";
import {
  dailyBookingCount,
  generateSlots,
  isBookable,
  isSlotBooked,
  slotEnd,
  toTehranDate,
} from "../domain/slots";
import { requireUser } from "../domain/users";
import { apiError } from "../errors";
import type { MockUser } from "../types";
import {
  created,
  newId,
  nowIso,
  ok,
  pageResult,
  resolveSort,
  sortItems,
  matchesQuery,
} from "../utils";

type IdParams = { params: { id: string } };

function bookingCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `BK-${code}`;
}

function canSeeBooking(user: MockUser, booking: Booking): boolean {
  if (user.role === "admin") return true;
  if (user.role === "consultant") return booking.consultantId === user.id;
  return booking.userId === user.id;
}

function findBooking(db: MockDb, id: string): Booking {
  const booking = db.bookings.get(id);
  if (!booking) throw apiError.notFound("رزرو");
  return booking;
}

function recordChange(
  db: MockDb,
  input: {
    bookingId: string;
    actor: MockUser | null;
    action: BookingChangeAction;
    detail: string | null;
  },
): BookingChange {
  return db.bookingChanges.insert({
    id: newId(),
    bookingId: input.bookingId,
    at: nowIso(),
    byUserId: input.actor?.id ?? null,
    byName: input.actor?.name ?? "سامانه",
    action: input.action,
    detail: input.detail,
  });
}

function availabilityOf(db: MockDb, consultantId: string) {
  return (
    db.availabilities.find((item) => item.consultantId === consultantId) ?? null
  );
}

function durationFor(db: MockDb, consultantId: string): number {
  return availabilityOf(db, consultantId)?.slotDurationMinutes ?? 60;
}

function assertSlotFree(
  db: MockDb,
  consultantId: string,
  startsAt: string,
  endsAt: string,
  excludeBookingId?: string,
): void {
  const bookings = db.bookings
    .all()
    .filter((booking) => booking.id !== excludeBookingId);
  if (isSlotBooked(bookings, consultantId, startsAt, endsAt)) {
    throw apiError.conflict(
      "این زمان با نوبت دیگری از همین مشاور تداخل دارد؛ زمان دیگری انتخاب کنید",
      { startsAt: ["تداخل زمانی با رزرو دیگر"] },
    );
  }
  const date = toTehranDate(new Date(startsAt));
  const availability = availabilityOf(db, consultantId);
  const max = availability?.maxDailyBookings ?? 8;
  const count = dailyBookingCount(bookings, consultantId, date);
  if (count >= max) {
    throw apiError.conflict(
      "ظرفیت روزانه این مشاور تکمیل شده است؛ روز یا مشاور دیگری انتخاب کنید",
      { startsAt: ["سقف رزرو روزانه پر شده است"] },
    );
  }
}

function resolveOrCreateLead(
  db: MockDb,
  body: { name: string; mobile: string; notes?: string | null },
  consultantId: string,
  leadId?: string,
): string {
  if (leadId) {
    if (!db.leads.has(leadId)) throw apiError.invalidField("leadId", "سرنخ پیدا نشد");
    return leadId;
  }
  const now = nowIso();
  const existingLead = db.leads.find(
    (lead) =>
      lead.mobile === body.mobile &&
      !lead.archived &&
      lead.stageKind !== "won" &&
      lead.stageKind !== "lost",
  );
  if (existingLead) {
    db.leads.update(existingLead.id, { updatedAt: now, lastActivityAt: now });
    return existingLead.id;
  }
  const stage =
    db.pipelineStages.find((entry) => entry.key === "consultation_done") ??
    db.pipelineStages.find((entry) => entry.kind === "open") ??
    db.pipelineStages.all()[0];
  if (!stage) throw apiError.internal("پایپ‌لاین سرنخ پیکربندی نشده است");
  const lead: Lead = {
    id: newId(),
    source: "booking",
    stageId: stage.id,
    stageKind: stage.kind,
    lostReasonId: null,
    name: body.name,
    mobile: body.mobile,
    email: null,
    preferredContact: "phone",
    contactPreference: "phone",
    message: body.notes ?? null,
    interestDegree: null,
    interestCountry: null,
    targetCountries: [],
    tagIds: [],
    assessment: null,
    utm: null,
    assignedTo: consultantId,
    nextFollowUpAt: null,
    lastActivityAt: now,
    priority: "normal",
    value: null,
    convertedCaseId: null,
    importId: null,
    archived: false,
    version: 1,
    createdAt: now,
    updatedAt: now,
  };
  return db.leads.insert(lead).id;
}

function applyListQuery(items: Booking[], query: BookingListQuery): Booking[] {
  const from = query.from ? new Date(query.from).getTime() : null;
  const to = query.to ? new Date(query.to).getTime() : null;
  const filtered = items
    .filter((booking) => !query.status || booking.status === query.status)
    .filter((booking) => !query.consultantId || booking.consultantId === query.consultantId)
    .filter(
      (booking) =>
        !query.consultationType || booking.consultationType === query.consultationType,
    )
    .filter((booking) => from === null || new Date(booking.startsAt).getTime() >= from)
    .filter((booking) => to === null || new Date(booking.startsAt).getTime() <= to)
    .filter((booking) => matchesQuery(query.q, [booking.name, booking.mobile, booking.code]));
  const { sort, order } = resolveSort(query, { sort: "startsAt", order: "desc" });
  return sortItems(filtered, sort, order, {
    startsAt: (booking) => booking.startsAt,
    createdAt: (booking) => booking.createdAt,
  });
}

const CANCELLABLE: ReadonlySet<Booking["status"]> = new Set(["pending", "confirmed"]);

/** Target status → allowed current statuses */
const NEXT_STATUS: Readonly<
  Record<BookingStatusUpdate["status"], ReadonlySet<Booking["status"]>>
> = {
  pending: new Set(),
  confirmed: new Set(["pending"]),
  completed: new Set(["confirmed"]),
  no_show: new Set(["confirmed"]),
  cancelled: new Set(["pending", "confirmed"]),
};

function createBookingRecord(
  db: MockDb,
  input: {
    body: BookingCreate | BookingStaffCreate;
    user: MockUser | null;
    status: Booking["status"];
    internalNotes: string | null;
    leadId?: string;
  },
): Booking {
  const { body, user } = input;
  const startsAt = new Date(body.startsAt).toISOString();

  if (body.consultantId && !db.consultants.has(body.consultantId)) {
    throw apiError.invalidField("consultantId", "مشاور انتخاب‌شده وجود ندارد");
  }

  const bookings = db.bookings.all();
  const consultantId =
    body.consultantId ??
    db.consultants
      .all()
      .find((consultant) => {
        const duration = durationFor(db, consultant.id);
        const ends = slotEnd(startsAt, duration);
        return (
          consultant.active &&
          !isSlotBooked(bookings, consultant.id, startsAt, ends)
        );
      })?.id;

  if (!consultantId) {
    throw apiError.conflict("مشاور آزادی برای این زمان پیدا نشد", {
      startsAt: ["این اسلات پر شده است"],
    });
  }

  const duration = durationFor(db, consultantId);
  const endsAt = slotEnd(startsAt, duration);

  if (!isBookable(startsAt) && user?.role !== "admin" && user?.role !== "consultant") {
    throw apiError.invalidField("startsAt", "این زمان گذشته یا بسیار نزدیک است");
  }

  assertSlotFree(db, consultantId, startsAt, endsAt);

  // Validate against generated grid
  const date = toTehranDate(new Date(startsAt));
  const grid = generateSlots({
    date,
    consultants: db.consultants.all(),
    bookings: db.bookings.all(),
    availabilities: db.availabilities.all(),
    holidays: db.holidays.all(),
    consultantId,
    consultationType: body.consultationType,
    now: user?.role === "admin" || user?.role === "consultant" ? 0 : undefined,
  });
  const onGrid = grid.some((slot) => slot.startsAt === startsAt);
  if (!onGrid) {
    throw apiError.invalidField(
      "startsAt",
      "زمان انتخاب‌شده یکی از اسلات‌های مشاوره نیست",
    );
  }

  const now = nowIso();
  const leadId = resolveOrCreateLead(
    db,
    { name: body.name, mobile: body.mobile, notes: body.notes },
    consultantId,
    input.leadId,
  );

  const booking = db.bookings.insert({
    id: newId(),
    code: bookingCode(),
    status: input.status,
    consultationType: body.consultationType,
    consultantId,
    startsAt,
    endsAt,
    name: body.name,
    mobile: body.mobile,
    notes: body.notes ?? null,
    internalNotes: input.internalNotes,
    userId: user?.role === "student" ? user.id : null,
    leadId,
    cancelledBy: null,
    cancellationReason: null,
    cancelledAt: null,
    createdAt: now,
    updatedAt: now,
  });

  recordChange(db, {
    bookingId: booking.id,
    actor: user,
    action: "created",
    detail: `ثبت رزرو ${booking.code}`,
  });

  return booking;
}

export const bookingHandlers: RouteImplementations = {
  listBookingSlots: defineRoute<{ query: SlotsQuery }>(({ query }) => {
    const db = getDb();
    return ok(
      generateSlots({
        date: query.date,
        consultants: db.consultants.all(),
        bookings: db.bookings.all(),
        availabilities: db.availabilities.all(),
        holidays: db.holidays.all(),
        consultationType: query.consultationType,
        consultantId: query.consultantId,
      }),
    );
  }),

  createBooking: defineRoute<{ body: BookingCreate }>(({ user, body }) => {
    const booking = createBookingRecord(getDb(), {
      body,
      user,
      status: "pending",
      internalNotes: null,
    });
    return created({
      id: booking.id,
      code: booking.code,
      status: booking.status,
      consultationType: booking.consultationType,
      consultantId: booking.consultantId,
      startsAt: booking.startsAt,
      endsAt: booking.endsAt,
    });
  }),

  createStaffBooking: defineRoute<{ body: BookingStaffCreate }>(
    ({ user, body }) => {
      const staff = requireUser(user);
      const { status, internalNotes, leadId, ...rest } = body;
      const booking = createBookingRecord(getDb(), {
        body: rest,
        user: staff,
        status: status ?? "confirmed",
        internalNotes: internalNotes ?? null,
        leadId,
      });
      return created(booking);
    },
  ),

  listBookings: defineRoute<{ query: BookingListQuery }>(({ user, query }) => {
    const staff = requireUser(user);
    const visible = getDb()
      .bookings.all()
      .filter((booking) => canSeeBooking(staff, booking));
    return pageResult(applyListQuery(visible, query), query);
  }),

  listMyBookings: defineRoute<{ query: BookingListQuery }>(({ user, query }) => {
    const me = requireUser(user);
    const own = getDb().bookings.filter((booking) => booking.userId === me.id);
    return pageResult(applyListQuery(own, query), query);
  }),

  getBooking: defineRoute<IdParams>(({ user, params }) => {
    const booking = findBooking(getDb(), params.id);
    if (!canSeeBooking(requireUser(user), booking)) throw apiError.forbidden();
    return ok(booking);
  }),

  cancelBooking: defineRoute<IdParams & { body: BookingCancel }>(({ user, params, body }) => {
    const actor = requireUser(user);
    const db = getDb();
    const booking = findBooking(db, params.id);
    if (!canSeeBooking(actor, booking)) throw apiError.forbidden();
    if (!CANCELLABLE.has(booking.status)) {
      throw apiError.conflict("فقط رزروهای در انتظار یا تأییدشده قابل لغو هستند");
    }
    if (new Date(booking.startsAt).getTime() <= Date.now()) {
      throw apiError.conflict("رزرو شروع شده و دیگر قابل لغو نیست");
    }
    const windowHours = 24;
    const hoursRemaining =
      (new Date(booking.startsAt).getTime() - Date.now()) / (1000 * 60 * 60);
    if (actor.role === "student" && hoursRemaining < windowHours) {
      throw apiError.conflict(
        `لغو رزرو فقط تا ${windowHours} ساعت قبل از شروع جلسه امکان‌پذیر است`,
      );
    }
    const now = nowIso();
    const updated = db.bookings.update(booking.id, {
      status: "cancelled",
      cancelledBy: actor.role === "student" ? "customer" : "staff",
      cancellationReason: body.reason ?? null,
      cancelledAt: now,
      updatedAt: now,
    });
    recordChange(db, {
      bookingId: booking.id,
      actor,
      action: "cancelled",
      detail: body.reason ?? "لغو رزرو",
    });
    return ok(updated);
  }),

  updateBookingStatus: defineRoute<IdParams & { body: BookingStatusUpdate }>(
    ({ user, params, body }) => {
      const staff = requireUser(user);
      const db = getDb();
      const booking = findBooking(db, params.id);
      if (!canSeeBooking(staff, booking)) throw apiError.forbidden();
      if (!NEXT_STATUS[body.status].has(booking.status)) {
        throw apiError.conflict("این تغییر وضعیت برای رزرو مجاز نیست");
      }
      const now = nowIso();
      const patch: Partial<Booking> = {
        status: body.status,
        updatedAt: now,
      };
      if (body.status === "cancelled") {
        patch.cancelledBy = "staff";
        patch.cancelledAt = now;
        patch.cancellationReason = patch.cancellationReason ?? null;
      }
      const updated = db.bookings.update(booking.id, patch);
      recordChange(db, {
        bookingId: booking.id,
        actor: staff,
        action: body.status === "cancelled" ? "cancelled" : "status_changed",
        detail: `وضعیت: ${booking.status} ← ${body.status}`,
      });
      return ok(updated);
    },
  ),

  patchBooking: defineRoute<IdParams & { body: BookingPatch }>(
    ({ user, params, body }) => {
      const staff = requireUser(user);
      const db = getDb();
      const booking = findBooking(db, params.id);
      if (!canSeeBooking(staff, booking)) throw apiError.forbidden();

      if (body.consultantId !== undefined && staff.role !== "admin") {
        throw apiError.forbidden("فقط مدیر می‌تواند مشاور رزرو را تغییر دهد");
      }
      if (body.consultantId && !db.consultants.has(body.consultantId)) {
        throw apiError.invalidField("consultantId", "مشاور انتخاب‌شده وجود ندارد");
      }

      const nextConsultantId = body.consultantId ?? booking.consultantId;
      if (!nextConsultantId) {
        throw apiError.invalidField("consultantId", "مشاور الزامی است");
      }

      const startsAt = body.startsAt
        ? new Date(body.startsAt).toISOString()
        : booking.startsAt;
      const duration = durationFor(db, nextConsultantId);
      const endsAt = slotEnd(startsAt, duration);

      if (
        staff.role === "student" &&
        body.startsAt &&
        body.startsAt !== booking.startsAt
      ) {
        const windowHours = 24;
        const hoursRemaining =
          (new Date(booking.startsAt).getTime() - Date.now()) / (1000 * 60 * 60);
        if (hoursRemaining < windowHours) {
          throw apiError.conflict(
            `تغییر زمان رزرو فقط تا ${windowHours} ساعت قبل از شروع جلسه امکان‌پذیر است`,
          );
        }
      }

      if (body.startsAt || body.consultantId) {
        assertSlotFree(db, nextConsultantId, startsAt, endsAt, booking.id);
      }

      const now = nowIso();
      const updated = db.bookings.update(booking.id, {
        ...(body.consultationType !== undefined
          ? { consultationType: body.consultationType }
          : {}),
        ...(body.internalNotes !== undefined
          ? { internalNotes: body.internalNotes }
          : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
        consultantId: nextConsultantId,
        startsAt,
        endsAt,
        updatedAt: now,
      });

      if (body.startsAt && body.startsAt !== booking.startsAt) {
        recordChange(db, {
          bookingId: booking.id,
          actor: staff,
          action: "rescheduled",
          detail: `جابه‌جایی به ${startsAt}`,
        });
      }
      if (body.consultantId && body.consultantId !== booking.consultantId) {
        recordChange(db, {
          bookingId: booking.id,
          actor: staff,
          action: "reassigned",
          detail: `مشاور جدید: ${nextConsultantId}`,
        });
      }
      if (body.internalNotes !== undefined || body.notes !== undefined) {
        recordChange(db, {
          bookingId: booking.id,
          actor: staff,
          action: "notes_updated",
          detail: "به‌روزرسانی یادداشت",
        });
      }

      return ok(updated);
    },
  ),

  listBookingHistory: defineRoute<IdParams>(({ user, params }) => {
    const staff = requireUser(user);
    const booking = findBooking(getDb(), params.id);
    if (!canSeeBooking(staff, booking)) throw apiError.forbidden();
    const items = getDb()
      .bookingChanges.filter((change) => change.bookingId === booking.id)
      .sort((a, b) => b.at.localeCompare(a.at));
    return ok(items);
  }),

  sendBookingReminder: defineRoute<IdParams>(({ user, params }) => {
    const staff = requireUser(user);
    const db = getDb();
    const booking = findBooking(db, params.id);
    if (!canSeeBooking(staff, booking)) throw apiError.forbidden();
    if (booking.status === "cancelled" || booking.status === "completed") {
      throw apiError.conflict("برای این وضعیت ارسال یادآوری مجاز نیست");
    }
    recordChange(db, {
      bookingId: booking.id,
      actor: staff,
      action: "reminder_sent",
      detail: "یادآوری ثبت شد (ارسال واقعی پیکربندی نشده)",
    });
    return ok(db.bookings.update(booking.id, { updatedAt: nowIso() }));
  }),
};
