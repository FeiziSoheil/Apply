import type {
  ConsultantAvailability,
  GlobalHoliday,
  TimeOfDay,
  AvailabilityTimeRange,
} from "@/contracts/availability";
import { defaultWeeklySchedule } from "@/contracts/availability";
import type { Booking, ConsultationType, TimeSlot } from "@/contracts/bookings";
import type { Consultant } from "@/contracts/content";
import { HOUR_MS, MINUTE_MS } from "../utils";

/** Iran abolished DST in 2022 — Tehran is a fixed UTC+03:30 */
export const TEHRAN_OFFSET_MS = 3.5 * HOUR_MS;

/** Slots starting sooner than this are no longer bookable (public form) */
const MIN_NOTICE_MS = HOUR_MS;

/** Bookings that occupy a slot */
const BLOCKING_STATUSES: ReadonlySet<Booking["status"]> = new Set([
  "pending",
  "confirmed",
  "completed",
  "no_show",
]);

function parseDate(isoDate: string): { y: number; m: number; d: number } {
  const [y, m, d] = isoDate.split("-").map(Number);
  return { y, m, d };
}

/** Tehran weekday of a `YYYY-MM-DD` date: 0 = Sunday … 5 = Friday, 6 = Saturday */
export function tehranWeekday(isoDate: string): number {
  const { y, m, d } = parseDate(isoDate);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** @deprecated Prefer availability-aware generation; kept for seed heuristics */
export function isWorkingDay(isoDate: string): boolean {
  return tehranWeekday(isoDate) !== 5;
}

/** UTC instant (ms) of `hour:minute` Tehran time on the given Tehran date */
export function tehranInstant(
  isoDate: string,
  hour: number,
  minute = 0,
): number {
  const { y, m, d } = parseDate(isoDate);
  return Date.UTC(y, m - 1, d, hour, minute) - TEHRAN_OFFSET_MS;
}

export function parseTimeOfDay(value: TimeOfDay): { hour: number; minute: number } {
  const [hour, minute] = value.split(":").map(Number);
  return { hour, minute };
}

export function timeOfDayToMinutes(value: TimeOfDay): number {
  const { hour, minute } = parseTimeOfDay(value);
  return hour * 60 + minute;
}

/** Tehran calendar date (`YYYY-MM-DD`) of a UTC instant */
export function toTehranDate(instant: Date | number): string {
  const ms = typeof instant === "number" ? instant : instant.getTime();
  return new Date(ms + TEHRAN_OFFSET_MS).toISOString().slice(0, 10);
}

export function isGlobalHoliday(
  isoDate: string,
  holidays: readonly GlobalHoliday[],
): boolean {
  return holidays.some((holiday) => holiday.date === isoDate);
}

export function isOnLeave(
  isoDate: string,
  leaves: ConsultantAvailability["leaves"],
): boolean {
  return leaves.some((leave) => leave.from <= isoDate && isoDate <= leave.to);
}

function rangesForDay(
  isoDate: string,
  availability: ConsultantAvailability,
  holidays: readonly GlobalHoliday[],
): AvailabilityTimeRange[] {
  const special = availability.specialDays.find((day) => day.date === isoDate);
  if (special) return special.ranges;

  // Default closed: Friday or global holiday (unless special day above)
  if (tehranWeekday(isoDate) === 5 || isGlobalHoliday(isoDate, holidays)) {
    return [];
  }
  if (isOnLeave(isoDate, availability.leaves)) return [];

  const schedule = availability.weekly.find(
    (day) => day.dayOfWeek === tehranWeekday(isoDate),
  );
  return schedule?.ranges ?? [];
}

/** Generate UTC start instants for one consultant on a Tehran date */
export function slotStartsForConsultant(
  isoDate: string,
  availability: ConsultantAvailability,
  holidays: readonly GlobalHoliday[],
): string[] {
  const ranges = rangesForDay(isoDate, availability, holidays);
  if (ranges.length === 0) return [];

  const duration = availability.slotDurationMinutes;
  const gap = availability.gapMinutes;
  const step = duration + gap;
  const starts: string[] = [];

  for (const range of ranges) {
    const startMin = timeOfDayToMinutes(range.start);
    const endMin = timeOfDayToMinutes(range.end);
    for (let cursor = startMin; cursor + duration <= endMin; cursor += step) {
      const hour = Math.floor(cursor / 60);
      const minute = cursor % 60;
      starts.push(new Date(tehranInstant(isoDate, hour, minute)).toISOString());
    }
  }
  return starts;
}

/**
 * Legacy grid used by older seeds when availability is missing.
 * Prefer `slotStartsForConsultant`.
 */
export function slotStartsForDate(isoDate: string): string[] {
  if (!isWorkingDay(isoDate)) return [];
  const hours = [9, 10, 11, 12, 14, 15, 16, 17];
  return hours.map((hour) => new Date(tehranInstant(isoDate, hour)).toISOString());
}

export function slotEnd(startsAt: string, durationMinutes = 60): string {
  return new Date(
    new Date(startsAt).getTime() + durationMinutes * MINUTE_MS,
  ).toISOString();
}

export function intervalsOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return (
    new Date(aStart).getTime() < new Date(bEnd).getTime() &&
    new Date(bStart).getTime() < new Date(aEnd).getTime()
  );
}

export function isSlotBooked(
  bookings: readonly Booking[],
  consultantId: string,
  startsAt: string,
  endsAt?: string,
): boolean {
  const end =
    endsAt ??
    new Date(new Date(startsAt).getTime() + 60 * MINUTE_MS).toISOString();
  return bookings.some(
    (booking) =>
      booking.consultantId === consultantId &&
      BLOCKING_STATUSES.has(booking.status) &&
      intervalsOverlap(booking.startsAt, booking.endsAt, startsAt, end),
  );
}

/** Count blocking bookings for a consultant on a Tehran calendar day */
export function dailyBookingCount(
  bookings: readonly Booking[],
  consultantId: string,
  isoDate: string,
): number {
  return bookings.filter(
    (booking) =>
      booking.consultantId === consultantId &&
      BLOCKING_STATUSES.has(booking.status) &&
      toTehranDate(new Date(booking.startsAt)) === isoDate,
  ).length;
}

export function isBookable(startsAt: string, now = Date.now()): boolean {
  return new Date(startsAt).getTime() >= now + MIN_NOTICE_MS;
}

export { defaultWeeklySchedule };

export function generateSlots(input: {
  date: string;
  consultants: readonly Consultant[];
  bookings: readonly Booking[];
  availabilities: readonly ConsultantAvailability[];
  holidays: readonly GlobalHoliday[];
  consultationType?: ConsultationType;
  consultantId?: string;
  now?: number;
}): TimeSlot[] {
  const { date, bookings, availabilities, holidays, consultantId } = input;
  const now = input.now ?? Date.now();
  const consultants = input.consultants.filter(
    (consultant) =>
      consultant.active && (!consultantId || consultant.id === consultantId),
  );

  const byConsultant = new Map(
    availabilities.map((item) => [item.consultantId, item]),
  );

  const slots: TimeSlot[] = [];
  for (const consultant of consultants) {
    const availability =
      byConsultant.get(consultant.id) ??
      ({
        id: consultant.id,
        consultantId: consultant.id,
        weekly: defaultWeeklySchedule(),
        slotDurationMinutes: 60,
        gapMinutes: 0,
        maxDailyBookings: 8,
        leaves: [],
        specialDays: [],
        createdAt: new Date(0).toISOString(),
        updatedAt: new Date(0).toISOString(),
      } satisfies ConsultantAvailability);

    const starts = slotStartsForConsultant(date, availability, holidays);
    const dayCount = dailyBookingCount(bookings, consultant.id, date);
    const underCap = dayCount < availability.maxDailyBookings;

    for (const startsAt of starts) {
      const endsAt = slotEnd(startsAt, availability.slotDurationMinutes);
      slots.push({
        startsAt,
        endsAt,
        consultantId: consultant.id,
        available:
          underCap &&
          isBookable(startsAt, now) &&
          !isSlotBooked(bookings, consultant.id, startsAt, endsAt),
      });
    }
  }
  return slots;
}
