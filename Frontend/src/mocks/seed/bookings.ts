import type { Booking } from "@/contracts/bookings";
import type { Consultant } from "@/contracts/content";
import type { Lead } from "@/contracts/leads";
import type { StudentCase } from "@/contracts/students";
import type { MockUser } from "../types";
import {
  isSlotBooked,
  isWorkingDay,
  slotEnd,
  slotStartsForDate,
  toTehranDate,
} from "../domain/slots";
import { toIsoDate, uuidFromKey, DAY_MS } from "../utils";
import {
  chance,
  faker,
  iso,
  persianMobile,
  persianName,
  pick,
  weighted,
  type SeedClock,
} from "./helpers";

export const BOOKING_COUNT = 64;

export function buildBookingSeed(input: {
  clock: SeedClock;
  consultants: readonly Consultant[];
  students: readonly MockUser[];
  cases: readonly StudentCase[];
  leads: readonly Lead[];
}): Booking[] {
  const { clock, consultants, students, leads } = input;
  const bookings: Booking[] = [];
  const openLeads = leads.filter((lead) => lead.stageKind !== "won");

  for (let index = 0; index < BOOKING_COUNT; index += 1) {
    const future = index >= BOOKING_COUNT / 2;
    // Find a free grid slot on a working day
    let startsAt = "";
    let consultantId = "";
    for (let attempt = 0; attempt < 60 && !startsAt; attempt += 1) {
      const dayOffset = future
        ? faker.number.int({ min: 1, max: 14 })
        : -faker.number.int({ min: 1, max: 40 });
      const date = toIsoDate(new Date(clock.now + dayOffset * DAY_MS));
      if (!isWorkingDay(date)) continue;
      const starts = slotStartsForDate(date);
      const candidateStart = pick(starts);
      const candidateConsultant = pick(consultants).id;
      if (!isSlotBooked(bookings, candidateConsultant, candidateStart)) {
        startsAt = candidateStart;
        consultantId = candidateConsultant;
      }
    }
    if (!startsAt) continue;

    const status = future
      ? weighted<Booking["status"]>([
          { value: "pending", weight: 4 },
          { value: "confirmed", weight: 5 },
          { value: "cancelled", weight: 1 },
        ])
      : weighted<Booking["status"]>([
          { value: "completed", weight: 6 },
          { value: "no_show", weight: 1.5 },
          { value: "cancelled", weight: 2.5 },
        ]);

    const asStudent = chance(0.45) ? pick(students) : null;
    const asLead = !asStudent && chance(0.5) ? pick(openLeads) : null;
    const startMs = new Date(startsAt).getTime();
    const createdMs = Math.min(
      startMs - faker.number.int({ min: 1, max: 14 }) * DAY_MS,
      clock.now - 3_600_000,
    );
    const cancelled = status === "cancelled";
    const cancelledMs = cancelled
      ? Math.min(createdMs + faker.number.int({ min: 2, max: 72 }) * 3_600_000, clock.now - 60_000)
      : null;

    bookings.push({
      id: uuidFromKey(`booking:${index}`),
      code: `BK-${faker.string.alphanumeric({ length: 6, casing: "upper" })}`,
      status,
      consultationType: pick(["in_person", "online"] as const),
      consultantId,
      startsAt,
      endsAt: slotEnd(startsAt),
      name: asStudent?.name ?? asLead?.name ?? persianName(),
      mobile: asStudent?.mobile ?? asLead?.mobile ?? persianMobile(),
      notes: chance(0.35) ? "ترجیح می‌دهم درباره بورسیه هم صحبت کنیم." : null,
      internalNotes: chance(0.2) ? "پیگیری بورسیه پس از جلسه" : null,
      userId: asStudent?.id ?? null,
      leadId: asLead?.id ?? null,
      cancelledBy: cancelled ? pick(["customer", "staff"] as const) : null,
      cancellationReason: cancelled ? "تغییر برنامه کاری" : null,
      cancelledAt: cancelledMs === null ? null : iso(cancelledMs),
      createdAt: iso(createdMs),
      updatedAt: iso(cancelledMs ?? Math.min(createdMs + 3_600_000, clock.now)),
    });
  }

  // Guarantee a few Tehran-local "today" bookings for the admin dashboard
  const today = toTehranDate(clock.now);
  const todayStarts = slotStartsForDate(today);
  let todayAdded = 0;
  for (let i = 0; i < todayStarts.length && todayAdded < 4; i += 1) {
    const startsAt = todayStarts[i];
    const consultantId = consultants[todayAdded % consultants.length]?.id;
    if (!consultantId || !startsAt) continue;
    if (isSlotBooked(bookings, consultantId, startsAt)) continue;
    const asLead = openLeads[todayAdded] ?? null;
    const createdMs = Math.min(
      new Date(startsAt).getTime() - DAY_MS,
      clock.now - 3_600_000,
    );
    bookings.push({
      id: uuidFromKey(`booking:today:${todayAdded}`),
      code: `BK-TODAY${todayAdded + 1}`,
      status: todayAdded === 0 ? "pending" : "confirmed",
      consultationType: todayAdded % 2 === 0 ? "online" : "in_person",
      consultantId,
      startsAt,
      endsAt: slotEnd(startsAt),
      name: asLead?.name ?? persianName(),
      mobile: asLead?.mobile ?? persianMobile(),
      notes: null,
      internalNotes: null,
      userId: null,
      leadId: asLead?.id ?? null,
      cancelledBy: null,
      cancellationReason: null,
      cancelledAt: null,
      createdAt: iso(createdMs),
      updatedAt: iso(createdMs),
    });
    todayAdded += 1;
  }

  const demoStudent = students[0];
  if (demoStudent) {
    const consultant = consultants[0];
    const nearStartsAt = new Date(clock.now + 4 * 3_600_000).toISOString();
    bookings.push({
      id: uuidFromKey("booking:demo:upcoming-near"),
      code: "BK-DEMO1",
      status: "confirmed",
      consultationType: "online",
      consultantId: consultant?.id ?? "consultant-1",
      startsAt: nearStartsAt,
      endsAt: new Date(new Date(nearStartsAt).getTime() + 45 * 60_000).toISOString(),
      name: demoStudent.name,
      mobile: demoStudent.mobile ?? "09120000001",
      notes: "جلسه آنلاین بررسی مدارک و وضعیت ویزا",
      internalNotes: null,
      userId: demoStudent.id,
      leadId: null,
      cancelledBy: null,
      cancellationReason: null,
      cancelledAt: null,
      createdAt: iso(clock.now - DAY_MS),
      updatedAt: iso(clock.now - DAY_MS),
    });

    const pastStartsAt = new Date(clock.now - 3 * DAY_MS).toISOString();
    bookings.push({
      id: uuidFromKey("booking:demo:past-1"),
      code: "BK-DEMO2",
      status: "completed",
      consultationType: "in_person",
      consultantId: consultant?.id ?? "consultant-1",
      startsAt: pastStartsAt,
      endsAt: new Date(new Date(pastStartsAt).getTime() + 45 * 60_000).toISOString(),
      name: demoStudent.name,
      mobile: demoStudent.mobile ?? "09120000001",
      notes: "جلسه مشاوره حضوری اولیه",
      internalNotes: "فرم ارزیابی تکمیل شد",
      userId: demoStudent.id,
      leadId: null,
      cancelledBy: null,
      cancellationReason: null,
      cancelledAt: null,
      createdAt: iso(clock.now - 5 * DAY_MS),
      updatedAt: iso(clock.now - 3 * DAY_MS),
    });
  }

  return bookings.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}
