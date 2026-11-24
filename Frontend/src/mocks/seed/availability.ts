import type {
  ConsultantAvailability,
  GlobalHoliday,
} from "@/contracts/availability";
import type { Consultant } from "@/contracts/content";
import { defaultWeeklySchedule } from "@/contracts/availability";
import { DAY_MS, toIsoDate, uuidFromKey } from "../utils";
import { iso, type SeedClock } from "./helpers";

/** Iranian public holidays (sample Gregorian dates for the seed year) */
const SAMPLE_HOLIDAYS: readonly { date: string; name: string }[] = [
  { date: "2026-03-20", name: "نوروز" },
  { date: "2026-03-21", name: "نوروز" },
  { date: "2026-03-22", name: "نوروز" },
  { date: "2026-03-23", name: "نوروز" },
  { date: "2026-04-01", name: "روز جمهوری اسلامی" },
  { date: "2026-04-02", name: "روز طبیعت" },
  { date: "2026-06-04", name: "رحلت امام خمینی" },
  { date: "2026-06-05", name: "قیام ۱۵ خرداد" },
];

export function buildAvailabilitySeed(input: {
  clock: SeedClock;
  consultants: readonly Consultant[];
}): {
  availabilities: ConsultantAvailability[];
  holidays: GlobalHoliday[];
} {
  const { clock, consultants } = input;
  const createdAt = iso(clock.now - 30 * 86_400_000);

  const holidays: GlobalHoliday[] = SAMPLE_HOLIDAYS.map((holiday, index) => ({
    id: uuidFromKey(`holiday:${holiday.date}:${index}`),
    date: holiday.date,
    name: holiday.name,
  }));

  const availabilities: ConsultantAvailability[] = consultants.map(
    (consultant, index) => {
      const leaves: ConsultantAvailability["leaves"] = [];
      // First consultant has a short leave in the near future (seed clock)
      if (index === 0) {
        leaves.push({
          id: uuidFromKey(`leave:${consultant.id}:0`),
          from: toIsoDate(new Date(clock.now + 20 * DAY_MS)),
          to: toIsoDate(new Date(clock.now + 22 * DAY_MS)),
          reason: "مرخصی شخصی",
        });
      }

      return {
        id: consultant.id,
        consultantId: consultant.id,
        weekly: defaultWeeklySchedule(),
        slotDurationMinutes: 60,
        gapMinutes: index === 1 ? 15 : 0,
        maxDailyBookings: 8,
        leaves,
        specialDays: [],
        createdAt,
        updatedAt: createdAt,
      };
    },
  );

  return { availabilities, holidays };
}
