import type {
  AvailabilityLeaveCreate,
  AvailabilitySpecialDayCreate,
  ConsultantAvailabilityUpsert,
  GlobalHolidayCreate,
  GlobalHolidaysReplace,
} from "@/contracts/availability";
import { defineRoute, type RouteImplementations } from "../contract";
import { getDb } from "../db";
import { defaultWeeklySchedule } from "@/contracts/availability";
import { apiError } from "../errors";
import { created, newId, noContent, nowIso, ok } from "../utils";

type ConsultantParams = { params: { consultantId: string } };
type LeaveParams = { params: { consultantId: string; leaveId: string } };
type SpecialParams = {
  params: { consultantId: string; specialDayId: string };
};
type IdParams = { params: { id: string } };

function requireConsultant(consultantId: string): void {
  if (!getDb().consultants.has(consultantId)) {
    throw apiError.notFound("مشاور");
  }
}

function ensureAvailability(consultantId: string) {
  const db = getDb();
  const existing = db.availabilities.find(
    (item) => item.consultantId === consultantId,
  );
  if (existing) return existing;
  const now = nowIso();
  return db.availabilities.insert({
    id: consultantId,
    consultantId,
    weekly: defaultWeeklySchedule(),
    slotDurationMinutes: 60,
    gapMinutes: 0,
    maxDailyBookings: 8,
    leaves: [],
    specialDays: [],
    createdAt: now,
    updatedAt: now,
  });
}

export const availabilityHandlers: RouteImplementations = {
  listConsultantAvailabilities: defineRoute(() => {
    const db = getDb();
    for (const consultant of db.consultants.all()) {
      ensureAvailability(consultant.id);
    }
    return ok(
      db.availabilities
        .all()
        .sort((a, b) => a.consultantId.localeCompare(b.consultantId)),
    );
  }),

  getConsultantAvailability: defineRoute<ConsultantParams>(({ params }) => {
    requireConsultant(params.consultantId);
    return ok(ensureAvailability(params.consultantId));
  }),

  upsertConsultantAvailability: defineRoute<
    ConsultantParams & { body: ConsultantAvailabilityUpsert }
  >(({ params, body }) => {
    requireConsultant(params.consultantId);
    const current = ensureAvailability(params.consultantId);
    const now = nowIso();
    return ok(
      getDb().availabilities.update(current.id, {
        weekly: body.weekly,
        slotDurationMinutes: body.slotDurationMinutes,
        gapMinutes: body.gapMinutes,
        maxDailyBookings: body.maxDailyBookings,
        updatedAt: now,
      }),
    );
  }),

  createAvailabilityLeave: defineRoute<
    ConsultantParams & { body: AvailabilityLeaveCreate }
  >(({ params, body }) => {
    requireConsultant(params.consultantId);
    const current = ensureAvailability(params.consultantId);
    const leave = {
      id: newId(),
      from: body.from,
      to: body.to,
      reason: body.reason ?? null,
    };
    getDb().availabilities.update(current.id, {
      leaves: [...current.leaves, leave],
      updatedAt: nowIso(),
    });
    return created(leave);
  }),

  deleteAvailabilityLeave: defineRoute<LeaveParams>(({ params }) => {
    requireConsultant(params.consultantId);
    const current = ensureAvailability(params.consultantId);
    if (!current.leaves.some((leave) => leave.id === params.leaveId)) {
      throw apiError.notFound("مرخصی");
    }
    getDb().availabilities.update(current.id, {
      leaves: current.leaves.filter((leave) => leave.id !== params.leaveId),
      updatedAt: nowIso(),
    });
    return noContent();
  }),

  createAvailabilitySpecialDay: defineRoute<
    ConsultantParams & { body: AvailabilitySpecialDayCreate }
  >(({ params, body }) => {
    requireConsultant(params.consultantId);
    const current = ensureAvailability(params.consultantId);
    if (current.specialDays.some((day) => day.date === body.date)) {
      throw apiError.conflict("برای این تاریخ قبلاً روز ویژه ثبت شده است", {
        date: ["تاریخ تکراری است"],
      });
    }
    const special = {
      id: newId(),
      date: body.date,
      ranges: body.ranges,
      note: body.note ?? null,
    };
    getDb().availabilities.update(current.id, {
      specialDays: [...current.specialDays, special],
      updatedAt: nowIso(),
    });
    return created(special);
  }),

  deleteAvailabilitySpecialDay: defineRoute<SpecialParams>(({ params }) => {
    requireConsultant(params.consultantId);
    const current = ensureAvailability(params.consultantId);
    if (
      !current.specialDays.some((day) => day.id === params.specialDayId)
    ) {
      throw apiError.notFound("روز ویژه");
    }
    getDb().availabilities.update(current.id, {
      specialDays: current.specialDays.filter(
        (day) => day.id !== params.specialDayId,
      ),
      updatedAt: nowIso(),
    });
    return noContent();
  }),

  listGlobalHolidays: defineRoute(() => {
    return ok(
      getDb()
        .holidays.all()
        .sort((a, b) => a.date.localeCompare(b.date)),
    );
  }),

  replaceGlobalHolidays: defineRoute<{ body: GlobalHolidaysReplace }>(
    ({ body }) => {
      const db = getDb();
      db.holidays.clear();
      const holidays = body.holidays.map((holiday) => ({
        id: newId(),
        date: holiday.date,
        name: holiday.name,
      }));
      db.holidays.insertMany(holidays);
      return ok(holidays.sort((a, b) => a.date.localeCompare(b.date)));
    },
  ),

  createGlobalHoliday: defineRoute<{ body: GlobalHolidayCreate }>(({ body }) => {
    const db = getDb();
    if (db.holidays.find((holiday) => holiday.date === body.date)) {
      throw apiError.conflict("این تاریخ قبلاً به‌عنوان تعطیلی ثبت شده است", {
        date: ["تاریخ تکراری است"],
      });
    }
    return created(
      db.holidays.insert({
        id: newId(),
        date: body.date,
        name: body.name,
      }),
    );
  }),

  deleteGlobalHoliday: defineRoute<IdParams>(({ params }) => {
    if (!getDb().holidays.remove(params.id)) {
      throw apiError.notFound("تعطیلی");
    }
    return noContent();
  }),
};
