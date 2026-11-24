"use client";

import { useId, useState } from "react";
import { format as formatIso, parseISO, set, startOfDay } from "date-fns";
import { CalendarDays, X } from "lucide-react";
import { JalaliCalendar } from "@/components/forms/jalali-calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatJalaliDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type DateTimeJalaliPickerProps = {
  /**
   * `datetime` → ISO 8601 UTC string (`2026-10-18T20:25:00.000Z`)
   * `date`     → `YYYY-MM-DD`
   * `null` / `""` = empty
   */
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  /** `datetime` (default) shows a time field next to the calendar */
  mode?: "date" | "datetime";
  placeholder?: string;
  /** Allow clearing (default `true`) */
  clearable?: boolean;
  disabled?: boolean;
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  className?: string;
};

function parse(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  const date = parseISO(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/**
 * Jalali date (+ time) picker. The calendar and display are Jalali with
 * Persian digits; the value stays an ISO string, as the contracts expect.
 */
export function DateTimeJalaliPicker({
  value,
  onChange,
  mode = "datetime",
  placeholder = "انتخاب تاریخ",
  clearable = true,
  disabled,
  id,
  className,
  ...aria
}: DateTimeJalaliPickerProps) {
  const [open, setOpen] = useState(false);
  const timeId = useId();
  const date = parse(value);
  const withTime = mode === "datetime";

  const timeValue = date ? formatIso(date, "HH:mm") : "09:00";

  function emit(next: Date) {
    onChange(withTime ? next.toISOString() : formatIso(next, "yyyy-MM-dd"));
  }

  function onSelectDay(day: Date | undefined) {
    if (!day) return;
    if (!withTime) return emit(startOfDay(day));
    const [hours, minutes] = timeValue.split(":").map(Number);
    emit(set(day, { hours, minutes, seconds: 0, milliseconds: 0 }));
    // keep the popover open so the time can be adjusted
  }

  function onChangeTime(next: string) {
    const [hours, minutes] = next.split(":").map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return;
    emit(set(date ?? new Date(), { hours, minutes, seconds: 0, milliseconds: 0 }));
  }

  const label = date
    ? formatJalaliDate(date, withTime ? "yyyy/MM/dd - HH:mm" : "yyyy/MM/dd")
    : placeholder;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "flex-1 justify-start font-normal tabular-nums",
              !date && "text-muted-foreground",
            )}
            {...aria}
          >
            <CalendarDays data-icon="inline-start" aria-hidden />
            {label}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto gap-0 p-0">
          <JalaliCalendar
            mode="single"
            selected={date}
            defaultMonth={date}
            onSelect={onSelectDay}
            disablePast={false}
            disableFridays={false}
          />
          {withTime ? (
            <div className="flex items-center gap-2 border-t p-3">
              <label htmlFor={timeId} className="text-sm text-muted-foreground">
                ساعت
              </label>
              <Input
                id={timeId}
                type="time"
                dir="ltr"
                value={timeValue}
                onChange={(event) => onChangeTime(event.target.value)}
                className="w-32 text-start"
              />
              <Button
                type="button"
                size="sm"
                className="ms-auto"
                onClick={() => setOpen(false)}
              >
                تأیید
              </Button>
            </div>
          ) : null}
        </PopoverContent>
      </Popover>
      {clearable && date ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          onClick={() => onChange(null)}
          aria-label="پاک کردن تاریخ"
        >
          <X aria-hidden />
        </Button>
      ) : null}
    </div>
  );
}

