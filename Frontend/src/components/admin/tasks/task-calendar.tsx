"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  endOfMonth,
  format,
  startOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
} from "date-fns-jalali";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Task } from "@/contracts/crm";
import type { Booking } from "@/contracts/bookings";
import { formatJalaliDate, toPersianDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

type TaskCalendarProps = {
  tasks: readonly Task[];
  bookings?: readonly Booking[];
  mode?: "month" | "week";
  onDayClick: (date: Date) => void;
  onTaskClick?: (task: Task) => void;
};

function dayKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function TaskCalendar({
  tasks,
  bookings = [],
  mode = "month",
  onDayClick,
  onTaskClick,
}: TaskCalendarProps) {
  const [cursor, setCursor] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<"month" | "week">(mode);

  const range = useMemo(() => {
    if (viewMode === "week") {
      const start = startOfWeek(cursor);
      const end = endOfWeek(cursor);
      return { start, end, days: eachDayOfInterval({ start, end }) };
    }
    const monthStart = startOfMonth(cursor);
    const monthEnd = endOfMonth(cursor);
    const start = startOfWeek(monthStart);
    const end = endOfWeek(monthEnd);
    return { start, end, days: eachDayOfInterval({ start, end }) };
  }, [cursor, viewMode]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (task.status === "cancelled") continue;
      const key = format(new Date(task.dueAt), "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(task);
      map.set(key, list);
    }
    return map;
  }, [tasks]);

  const bookingsByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const booking of bookings) {
      if (booking.status === "cancelled") continue;
      const key = format(new Date(booking.startsAt), "yyyy-MM-dd");
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [bookings]);

  const today = new Date();

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label={viewMode === "week" ? "هفته قبل" : "ماه قبل"}
            onClick={() =>
              setCursor((current) =>
                viewMode === "week"
                  ? new Date(current.getTime() - 7 * 86_400_000)
                  : addMonths(current, -1),
              )
            }
          >
            <ChevronRight aria-hidden />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label={viewMode === "week" ? "هفته بعد" : "ماه بعد"}
            onClick={() =>
              setCursor((current) =>
                viewMode === "week"
                  ? new Date(current.getTime() + 7 * 86_400_000)
                  : addMonths(current, 1),
              )
            }
          >
            <ChevronLeft aria-hidden />
          </Button>
        </div>
        <p className="text-sm font-medium tabular-nums">
          {viewMode === "week"
            ? `${formatJalaliDate(range.start, "d MMM")} تا ${formatJalaliDate(range.end, "d MMM yyyy")}`
            : formatJalaliDate(cursor, "MMMM yyyy")}
        </p>
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant={viewMode === "month" ? "secondary" : "ghost"}
            onClick={() => setViewMode("month")}
          >
            ماهانه
          </Button>
          <Button
            type="button"
            size="sm"
            variant={viewMode === "week" ? "secondary" : "ghost"}
            onClick={() => setViewMode("week")}
          >
            هفتگی
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setCursor(new Date())}
          >
            امروز
          </Button>
        </div>
      </div>

      <div
        className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-border"
        role="grid"
        aria-label="تقویم کارها"
      >
        {["ش", "ی", "د", "س", "چ", "پ", "ج"].map((label) => (
          <div
            key={label}
            className="bg-muted/50 px-1 py-2 text-center text-xs font-medium"
          >
            {label}
          </div>
        ))}
        {range.days.map((day) => {
          const key = dayKey(day);
          const dayTasks = tasksByDay.get(key) ?? [];
          const bookingCount = bookingsByDay.get(key) ?? 0;
          const inMonth =
            viewMode === "week" || isSameMonth(day, cursor);
          const isToday = isSameDay(day, today);
          return (
            <button
              key={key}
              type="button"
              role="gridcell"
              className={cn(
                "bg-card flex min-h-20 flex-col gap-1 p-1.5 text-start transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                !inMonth && "opacity-40",
                isToday && "bg-primary/5",
              )}
              onClick={() => onDayClick(day)}
              aria-label={`${formatJalaliDate(day, "EEEE d MMMM")} — ${toPersianDigits(dayTasks.length)} کار`}
            >
              <span
                className={cn(
                  "size-6 rounded-full text-center text-xs leading-6 tabular-nums",
                  isToday && "bg-primary text-primary-foreground",
                )}
              >
                {toPersianDigits(format(day, "d"))}
              </span>
              <ul className="flex flex-col gap-0.5">
                {dayTasks.slice(0, 3).map((task) => (
                  <li key={task.id}>
                    <span
                      role={onTaskClick ? "button" : undefined}
                      tabIndex={onTaskClick ? 0 : undefined}
                      className={cn(
                        "block truncate rounded px-1 text-[0.65rem]",
                        task.status === "done"
                          ? "bg-muted text-muted-foreground line-through"
                          : task.priority === "high"
                            ? "bg-destructive/15 text-destructive"
                            : "bg-primary/10 text-foreground",
                      )}
                      onClick={(event) => {
                        if (!onTaskClick) return;
                        event.stopPropagation();
                        onTaskClick(task);
                      }}
                      onKeyDown={(event) => {
                        if (!onTaskClick) return;
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          event.stopPropagation();
                          onTaskClick(task);
                        }
                      }}
                    >
                      {task.title}
                    </span>
                  </li>
                ))}
                {dayTasks.length > 3 ? (
                  <li className="text-muted-foreground px-1 text-[0.65rem]">
                    +{toPersianDigits(dayTasks.length - 3)}
                  </li>
                ) : null}
                {bookingCount > 0 ? (
                  <li className="text-muted-foreground px-1 text-[0.65rem]">
                    {toPersianDigits(bookingCount)} رزرو
                  </li>
                ) : null}
              </ul>
            </button>
          );
        })}
      </div>
    </div>
  );
}
