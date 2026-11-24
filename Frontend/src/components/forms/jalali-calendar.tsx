"use client";

import * as React from "react";
import {
  addMonths,
  addYears,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  eachMonthOfInterval,
  eachYearOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getMonth,
  getYear,
  setMonth,
  setYear,
  startOfMonth,
  startOfWeek,
} from "date-fns-jalali";
import { faIR } from "date-fns-jalali/locale";
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
  type DayPickerProps,
  type Locale,
} from "react-day-picker";
import { cn } from "cn";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from "lucide-react";
import { toPersianDigits } from "@/lib/format";

/** Saturday-start week (Iran) */
const WEEK_STARTS_ON = 6 as const;

const jalaliDateLib = {
  addMonths,
  addYears,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  eachMonthOfInterval,
  eachYearOfInterval,
  endOfMonth,
  getMonth,
  getYear,
  setMonth,
  setYear,
  startOfMonth,
  format,
  startOfWeek: (
    date: Date,
    options?: { weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6 },
  ) => startOfWeek(date, { ...options, weekStartsOn: WEEK_STARTS_ON }),
  endOfWeek: (
    date: Date,
    options?: { weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6 },
  ) => endOfWeek(date, { ...options, weekStartsOn: WEEK_STARTS_ON }),
};

function isFriday(date: Date): boolean {
  return date.getDay() === 5;
}

type JalaliCalendarProps = DayPickerProps & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
  disablePast?: boolean;
  disableFridays?: boolean;
};

function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  ...props
}: React.ComponentProps<typeof DayButton> & { locale?: Partial<Locale> }) {
  const defaultClassNames = getDefaultClassNames();
  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "relative isolate z-10 flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 border-0 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-[3px] group-data-[focused=true]/day:ring-ring/50 data-[range-end=true]:rounded-(--cell-radius) data-[range-end=true]:rounded-e-(--cell-radius) data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-muted data-[range-middle=true]:text-foreground data-[range-start=true]:rounded-(--cell-radius) data-[range-start=true]:rounded-s-(--cell-radius) data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground dark:hover:text-foreground [&>span]:text-xs [&>span]:opacity-70",
        defaultClassNames.day,
        className,
      )}
      {...props}
    />
  );
}

/**
 * Jalali calendar built on DayPicker + date-fns-jalali DateLib overrides.
 * Disables past days and Fridays by default (Iranian weekend).
 */
export function JalaliCalendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  disablePast = true,
  disableFridays = true,
  disabled,
  formatters,
  components,
  ...props
}: JalaliCalendarProps) {
  const defaultClassNames = getDefaultClassNames();
  const todayStartMs = React.useSyncExternalStore(
    () => () => {},
    () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today.getTime();
    },
    () => null as number | null,
  );

  const disabledMatcher = React.useCallback(
    (date: Date) => {
      if (disablePast && todayStartMs !== null) {
        const compare = new Date(date);
        compare.setHours(0, 0, 0, 0);
        if (compare.getTime() < todayStartMs) return true;
      }
      if (disableFridays && isFriday(date)) return true;
      if (typeof disabled === "function") return disabled(date);
      if (disabled instanceof Date) {
        return date.toDateString() === disabled.toDateString();
      }
      if (Array.isArray(disabled)) {
        return disabled.some((d) =>
          d instanceof Date ? d.toDateString() === date.toDateString() : false,
        );
      }
      return false;
    },
    [disablePast, disableFridays, disabled, todayStartMs],
  );

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "group/calendar bg-background p-2 [--cell-radius:var(--radius-md)] [--cell-size:--spacing(7)]",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className,
      )}
      captionLayout={captionLayout}
      locale={faIR}
      dir="rtl"
      weekStartsOn={WEEK_STARTS_ON}
      dateLib={jalaliDateLib}
      disabled={disabledMatcher}
      formatters={{
        formatCaption: (date) =>
          toPersianDigits(format(date, "MMMM yyyy", { locale: faIR })),
        formatWeekdayName: (date) => format(date, "EEEEEE", { locale: faIR }),
        formatDay: (date) => toPersianDigits(format(date, "d")),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "relative flex flex-col gap-4 md:flex-row",
          defaultClassNames.months,
        ),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
          defaultClassNames.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) p-0 select-none aria-disabled:opacity-50",
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) p-0 select-none aria-disabled:opacity-50",
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          "flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)",
          defaultClassNames.month_caption,
        ),
        caption_label: cn(
          "font-medium select-none text-sm",
          defaultClassNames.caption_label,
        ),
        month_grid: cn("w-full border-collapse", defaultClassNames.month_grid),
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "flex-1 rounded-(--cell-radius) text-[0.8rem] font-normal text-muted-foreground select-none",
          defaultClassNames.weekday,
        ),
        week: cn("mt-2 flex w-full", defaultClassNames.week),
        day: cn(
          "group/day relative aspect-square h-full w-full rounded-(--cell-radius) p-0 text-center select-none",
          defaultClassNames.day,
        ),
        today: cn(
          "rounded-(--cell-radius) bg-muted text-foreground",
          defaultClassNames.today,
        ),
        outside: cn(
          "text-muted-foreground aria-selected:text-muted-foreground",
          defaultClassNames.outside,
        ),
        disabled: cn(
          "text-muted-foreground opacity-50",
          defaultClassNames.disabled,
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Chevron: ({ className, orientation, ...chevronProps }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon
                className={cn("rtl:rotate-180 size-4", className)}
                {...chevronProps}
              />
            );
          }
          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("rtl:rotate-180 size-4", className)}
                {...chevronProps}
              />
            );
          }
          return (
            <ChevronDownIcon
              className={cn("size-4", className)}
              {...chevronProps}
            />
          );
        },
        DayButton: (dayProps) => (
          <CalendarDayButton locale={faIR} {...dayProps} />
        ),
        ...components,
      }}
      {...props}
    />
  );
}
