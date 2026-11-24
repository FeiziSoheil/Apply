"use client";

import { useMemo } from "react";
import { addDays, format as formatIso, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Booking } from "@/contracts/bookings";
import { formatJalaliDate, toPersianDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BOOKING_STATUS_BLOCK_CLASS } from "./booking-labels";

type ConsultantOption = { id: string; name: string };

type BookingsCalendarProps = {
  weekStart: Date;
  onWeekChange: (next: Date) => void;
  /** Mobile: single day; desktop: week */
  mobile: boolean;
  dayCursor: Date;
  onDayChange: (next: Date) => void;
  bookings: readonly Booking[];
  consultants: readonly ConsultantOption[];
  onSelectBooking: (booking: Booking) => void;
  onSelectEmptySlot: (input: {
    consultantId: string;
    startsAt: string;
  }) => void;
};

const HOURS = [9, 10, 11, 12, 14, 15, 16, 17] as const;

function tehranIsoDate(date: Date): string {
  return formatIso(date, "yyyy-MM-dd");
}

function slotIso(date: string, hour: number): string {
  return new Date(`${date}T${String(hour).padStart(2, "0")}:00:00+03:30`).toISOString();
}

export function BookingsCalendar({
  weekStart,
  onWeekChange,
  mobile,
  dayCursor,
  onDayChange,
  bookings,
  consultants,
  onSelectBooking,
  onSelectEmptySlot,
}: BookingsCalendarProps) {
  const days = useMemo(() => {
    if (mobile) return [dayCursor];
    return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  }, [mobile, dayCursor, weekStart]);

  const byKey = useMemo(() => {
    const map = new Map<string, Booking>();
    for (const booking of bookings) {
      if (!booking.consultantId) continue;
      if (booking.status === "cancelled") continue;
      // Tehran hour bucket so slots with gaps still land on the calendar grid
      const tehran = new Date(
        new Date(booking.startsAt).getTime() + 3.5 * 3_600_000,
      );
      const hour = tehran.getUTCHours();
      const date = tehran.toISOString().slice(0, 10);
      const key = `${booking.consultantId}|${date}|${hour}`;
      if (!map.has(key)) map.set(key, booking);
    }
    return map;
  }, [bookings]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={mobile ? "روز قبل" : "هفته قبل"}
            onClick={() =>
              mobile
                ? onDayChange(addDays(dayCursor, -1))
                : onWeekChange(addDays(weekStart, -7))
            }
          >
            <ChevronRight aria-hidden />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={mobile ? "روز بعد" : "هفته بعد"}
            onClick={() =>
              mobile
                ? onDayChange(addDays(dayCursor, 1))
                : onWeekChange(addDays(weekStart, 7))
            }
          >
            <ChevronLeft aria-hidden />
          </Button>
        </div>
        <p className="text-sm font-medium tabular-nums">
          {mobile
            ? formatJalaliDate(dayCursor, "EEEE d MMMM yyyy")
            : `${formatJalaliDate(weekStart, "d MMMM")} تا ${formatJalaliDate(addDays(weekStart, 6), "d MMMM yyyy")}`}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            const today = new Date();
            onDayChange(today);
            onWeekChange(startOfWeek(today, { weekStartsOn: 6 }));
          }}
        >
          امروز
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="sticky start-0 bg-muted/40 p-2 text-start font-medium">
                مشاور / ساعت
              </th>
              {days.map((day) => (
                <th
                  key={tehranIsoDate(day)}
                  className="p-2 text-center font-medium tabular-nums"
                >
                  {formatJalaliDate(day, mobile ? "d MMMM" : "EEE d")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {consultants.map((consultant) =>
              HOURS.map((hour, hourIndex) => (
                <tr
                  key={`${consultant.id}-${hour}`}
                  className="border-b border-border/60"
                >
                  {hourIndex === 0 ? (
                    <th
                      rowSpan={HOURS.length}
                      className="sticky start-0 max-w-28 border-e bg-background p-2 text-start align-top text-xs font-medium"
                    >
                      {consultant.name}
                    </th>
                  ) : null}
                  {days.map((day) => {
                    const date = tehranIsoDate(day);
                    const startsAt = slotIso(date, hour);
                    const booking = byKey.get(
                      `${consultant.id}|${date}|${hour}`,
                    );
                    return (
                      <td key={`${date}-${hour}`} className="p-1 align-top">
                        {booking ? (
                          <button
                            type="button"
                            className={cn(
                              "w-full rounded-md border px-1.5 py-1 text-start text-xs transition-opacity hover:opacity-90",
                              BOOKING_STATUS_BLOCK_CLASS[booking.status],
                            )}
                            onClick={() => onSelectBooking(booking)}
                          >
                            <span className="block truncate font-medium">
                              {booking.name}
                            </span>
                            <span className="tabular-nums" dir="ltr">
                              {toPersianDigits(
                                formatJalaliDate(booking.startsAt, "HH:mm"),
                              )}
                            </span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="flex h-10 w-full items-center justify-center rounded-md text-xs text-muted-foreground hover:bg-muted/60"
                            aria-label={`ایجاد رزرو ${consultant.name} ساعت ${hour}`}
                            onClick={() =>
                              onSelectEmptySlot({
                                consultantId: consultant.id,
                                startsAt,
                              })
                            }
                          >
                            {toPersianDigits(
                              `${String(hour).padStart(2, "0")}:00`,
                            )}
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        روی بلوک رزرو برای جزئیات، و روی خانه خالی برای ایجاد دستی کلیک کنید.
      </p>
    </div>
  );
}
