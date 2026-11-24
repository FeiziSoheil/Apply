import type { Booking } from "@/contracts/bookings";
import type { PipelineStageKind } from "@/contracts/crm";
import type { Activity, Lead } from "@/contracts/leads";
import type { StudentCase } from "@/contracts/students";
import type {
  AdminStats,
  StatsActionItem,
  StatsMetric,
  StatsRangeDays,
  StatsScheduleItem,
} from "@/contracts/stats";
import { PIPELINE_STAGE_KINDS } from "@/contracts/crm";
import { DAY_MS } from "../utils";
import { toTehranDate, tehranInstant } from "./slots";
import type { MockUser } from "../types";

const STALE_FOLLOW_UP_MS = 2 * DAY_MS;
const ACTION_ITEM_LIMIT = 12;
const NO_UTM = "بدون UTM";

const STAGE_KIND_LABELS: Record<PipelineStageKind, string> = {
  new: "جدید",
  open: "در جریان",
  won: "تبدیل‌شده",
  lost: "ریزش",
};

const ACTIVE_BOOKING: ReadonlySet<Booking["status"]> = new Set([
  "pending",
  "confirmed",
  "completed",
  "no_show",
]);

export type StatsSources = {
  leads: readonly Lead[];
  activities: readonly Activity[];
  bookings: readonly Booking[];
  cases: readonly StudentCase[];
};

/** Scope collections to the caller's ownership */
export function scopeStatsSources(
  user: MockUser,
  sources: StatsSources,
): StatsSources {
  if (user.role === "admin") return sources;
  if (user.role !== "consultant") {
    return { leads: [], activities: [], bookings: [], cases: [] };
  }
  const leadIds = new Set(
    sources.leads
      .filter((lead) => lead.assignedTo === user.id)
      .map((lead) => lead.id),
  );
  return {
    leads: sources.leads.filter((lead) => lead.assignedTo === user.id),
    activities: sources.activities.filter((activity) => {
      const leadId = activity.entityId ?? activity.leadId;
      return Boolean(leadId && leadIds.has(leadId));
    }),
    bookings: sources.bookings.filter(
      (booking) => booking.consultantId === user.id,
    ),
    cases: sources.cases.filter((entry) => entry.consultantId === user.id),
  };
}

function startOfTehranDayMs(isoDate: string): number {
  return tehranInstant(isoDate, 0, 0);
}

function addDays(isoDate: string, days: number): string {
  const base = startOfTehranDayMs(isoDate);
  return toTehranDate(base + days * DAY_MS);
}

function enumeratingDays(fromInclusive: string, toInclusive: string): string[] {
  const days: string[] = [];
  let cursor = fromInclusive;
  while (cursor <= toInclusive) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return days;
}

function changePercent(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function metric(value: number, previousValue: number): StatsMetric {
  return {
    value,
    previousValue,
    changePercent: changePercent(value, previousValue),
  };
}

function lastActivityAt(
  leadId: string,
  byLead: Map<string, string>,
): string | null {
  return byLead.get(leadId) ?? null;
}

function buildLastActivityMap(
  activities: readonly Activity[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const activity of activities) {
    const leadId = activity.entityId ?? activity.leadId;
    if (!leadId) continue;
    const prev = map.get(leadId);
    if (!prev || activity.createdAt > prev) {
      map.set(leadId, activity.createdAt);
    }
  }
  return map;
}

function isInHalfOpenRange(
  iso: string,
  fromMs: number,
  toMsExclusive: number,
): boolean {
  const ms = new Date(iso).getTime();
  return ms >= fromMs && ms < toMsExclusive;
}

function countLeadsCreated(
  leads: readonly Lead[],
  fromMs: number,
  toMsExclusive: number,
): number {
  return leads.filter((lead) =>
    isInHalfOpenRange(lead.createdAt, fromMs, toMsExclusive),
  ).length;
}

function conversionRate(
  leads: readonly Lead[],
  fromMs: number,
  toMsExclusive: number,
): number {
  const cohort = leads.filter((lead) =>
    isInHalfOpenRange(lead.createdAt, fromMs, toMsExclusive),
  );
  if (cohort.length === 0) return 0;
  const won = cohort.filter((lead) => lead.stageKind === "won").length;
  return Math.round((won / cohort.length) * 1000) / 10;
}

function bookingsOnDay(
  bookings: readonly Booking[],
  day: string,
): Booking[] {
  return bookings
    .filter(
      (booking) =>
        ACTIVE_BOOKING.has(booking.status) &&
        toTehranDate(new Date(booking.startsAt)) === day,
    )
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

function activeCasesAt(
  cases: readonly StudentCase[],
  atMs: number,
): number {
  return cases.filter((entry) => {
    if (new Date(entry.createdAt).getTime() > atMs) return false;
    if (entry.status === "active") return true;
    // Became inactive after `atMs` → treat as still active at that instant
    return new Date(entry.updatedAt).getTime() > atMs;
  }).length;
}

function toScheduleItem(booking: Booking): StatsScheduleItem {
  return {
    id: booking.id,
    startsAt: booking.startsAt,
    endsAt: booking.endsAt,
    name: booking.name,
    status: booking.status,
    consultationType: booking.consultationType,
  };
}

/**
 * Aggregate dashboard stats from the in-memory mock collections.
 * All calendar boundaries use Tehran local days.
 */
export function computeAdminStats(
  sources: StatsSources,
  rangeDays: StatsRangeDays,
  nowMs: number = Date.now(),
): AdminStats {
  const { leads, activities, bookings, cases } = sources;
  const today = toTehranDate(nowMs);
  const yesterday = addDays(today, -1);
  const rangeStart = addDays(today, -(rangeDays - 1));
  const prevRangeStart = addDays(rangeStart, -rangeDays);

  const todayStartMs = startOfTehranDayMs(today);
  const tomorrowStartMs = todayStartMs + DAY_MS;
  const rangeStartMs = startOfTehranDayMs(rangeStart);
  const prevRangeStartMs = startOfTehranDayMs(prevRangeStart);

  const newLeads = countLeadsCreated(leads, rangeStartMs, tomorrowStartMs);
  const prevNewLeads = countLeadsCreated(
    leads,
    prevRangeStartMs,
    rangeStartMs,
  );

  const todayList = bookingsOnDay(bookings, today);
  const yesterdayList = bookingsOnDay(bookings, yesterday);

  const conversion = conversionRate(leads, rangeStartMs, tomorrowStartMs);
  const prevConversion = conversionRate(leads, prevRangeStartMs, rangeStartMs);

  const activeNow = cases.filter((entry) => entry.status === "active").length;
  const activePrev = activeCasesAt(cases, rangeStartMs - 1);

  const lastActivity = buildLastActivityMap(activities);
  const leadTrend = enumeratingDays(rangeStart, today).map((date) => {
    const dayStart = startOfTehranDayMs(date);
    const dayEnd = dayStart + DAY_MS;
    return {
      date,
      count: countLeadsCreated(leads, dayStart, dayEnd),
    };
  });

  const utmCounts = new Map<string, number>();
  for (const lead of leads) {
    if (!isInHalfOpenRange(lead.createdAt, rangeStartMs, tomorrowStartMs)) {
      continue;
    }
    const source = lead.utm?.source?.trim() || NO_UTM;
    utmCounts.set(source, (utmCounts.get(source) ?? 0) + 1);
  }
  const utmSources = [...utmCounts.entries()]
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count || a.source.localeCompare(b.source));

  const funnelCounts = new Map<PipelineStageKind, number>(
    PIPELINE_STAGE_KINDS.map((kind) => [kind, 0]),
  );
  for (const lead of leads) {
    if (!isInHalfOpenRange(lead.createdAt, rangeStartMs, tomorrowStartMs)) {
      continue;
    }
    if (lead.archived) continue;
    funnelCounts.set(lead.stageKind, (funnelCounts.get(lead.stageKind) ?? 0) + 1);
  }
  const funnel = PIPELINE_STAGE_KINDS.map((stageKind) => ({
    stageKind,
    label: STAGE_KIND_LABELS[stageKind],
    count: funnelCounts.get(stageKind) ?? 0,
  }));

  const staleCutoff = nowMs - STALE_FOLLOW_UP_MS;
  const staleLeads = leads
    .filter(
      (lead) =>
        !lead.archived &&
        lead.stageKind !== "won" &&
        lead.stageKind !== "lost",
    )
    .map((lead) => {
      const last =
        lastActivityAt(lead.id, lastActivity) ?? lead.lastActivityAt ?? lead.createdAt;
      return { lead, last };
    })
    .filter(({ last }) => new Date(last).getTime() < staleCutoff)
    .sort((a, b) => a.last.localeCompare(b.last));

  const actionItems: StatsActionItem[] = [];
  for (const { lead, last } of staleLeads) {
    if (actionItems.length >= ACTION_ITEM_LIMIT) break;
    actionItems.push({
      id: lead.id,
      kind: "stale_lead",
      title: lead.name,
      description: `بدون پیگیری از ${STAGE_KIND_LABELS[lead.stageKind]}`,
      href: `/admin/leads?q=${encodeURIComponent(lead.mobile)}`,
      at: last,
    });
  }
  for (const booking of todayList) {
    if (actionItems.length >= ACTION_ITEM_LIMIT) break;
    actionItems.push({
      id: booking.id,
      kind: "today_booking",
      title: booking.name,
      description:
        booking.consultationType === "online"
          ? "رزرو آنلاین امروز"
          : "رزرو حضوری امروز",
      href: `/admin/bookings?q=${encodeURIComponent(booking.code)}`,
      at: booking.startsAt,
    });
  }

  return {
    rangeDays,
    generatedAt: new Date(nowMs).toISOString(),
    cards: {
      newLeads: metric(newLeads, prevNewLeads),
      todayBookings: metric(todayList.length, yesterdayList.length),
      conversionRate: metric(conversion, prevConversion),
      activeCases: metric(activeNow, activePrev),
    },
    leadTrend,
    utmSources,
    funnel,
    actionItems,
    todaySchedule: todayList.map(toScheduleItem),
  };
}
