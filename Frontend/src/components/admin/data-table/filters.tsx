"use client";

import { useId, useState } from "react";
import { format as formatIso, parseISO } from "date-fns";
import { CalendarRange, Check, ListFilter, X } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { JalaliCalendar } from "@/components/forms/jalali-calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatJalaliDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export type FilterOption = {
  value: string;
  label: string;
};

const ALL_VALUE = "__all__";

/* -------------------------------------------------------------------------- */
/*  Single select                                                             */
/* -------------------------------------------------------------------------- */

type SelectFilterProps = {
  /** Accessible name and the "all" option label, e.g. «قاره» */
  label: string;
  value: string | null;
  options: readonly FilterOption[];
  onChange: (value: string | null) => void;
  className?: string;
};

/** Single-choice filter; `null` means "all" */
export function SelectFilter({
  label,
  value,
  options,
  onChange,
  className,
}: SelectFilterProps) {
  return (
    <Select
      dir="rtl"
      value={value ?? ALL_VALUE}
      onValueChange={(next) => onChange(next === ALL_VALUE ? null : next)}
    >
      <SelectTrigger
        size="sm"
        aria-label={`فیلتر ${label}`}
        className={cn("min-w-36", value && "border-primary/50", className)}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value={ALL_VALUE}>{label}: همه</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

/* -------------------------------------------------------------------------- */
/*  Multi select                                                              */
/* -------------------------------------------------------------------------- */

type MultiSelectFilterProps = {
  label: string;
  value: readonly string[];
  options: readonly FilterOption[];
  onChange: (value: string[]) => void;
  className?: string;
};

/** Multi-choice filter (popover + searchable checklist) */
export function MultiSelectFilter({
  label,
  value,
  options,
  onChange,
  className,
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);
  const selected = new Set(value);

  function toggle(optionValue: string) {
    const next = new Set(selected);
    if (next.has(optionValue)) next.delete(optionValue);
    else next.add(optionValue);
    onChange(options.map((o) => o.value).filter((v) => next.has(v)));
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={`فیلتر ${label}`}
          className={cn(selected.size > 0 && "border-primary/50", className)}
        >
          <ListFilter data-icon="inline-start" aria-hidden />
          {label}
          {selected.size > 0 ? (
            <Badge variant="secondary" className="tabular-nums">
              {formatNumber(selected.size)}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-0">
        <Command>
          <CommandInput placeholder={`جستجو در ${label}…`} />
          <CommandList>
            <CommandEmpty>موردی یافت نشد.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selected.has(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => toggle(option.value)}
                  >
                    <Check
                      aria-hidden
                      className={cn(!isSelected && "invisible")}
                    />
                    {option.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
        {selected.size > 0 ? (
          <div className="border-t p-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => onChange([])}
            >
              پاک کردن انتخاب‌ها
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

/* -------------------------------------------------------------------------- */
/*  Searchable single select (Combobox)                                       */
/* -------------------------------------------------------------------------- */

type ComboboxFilterProps = {
  label: string;
  value: string | null;
  options: readonly FilterOption[];
  onChange: (value: string | null) => void;
  /** Shown while options are loading */
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
};

/** Searchable single-choice filter; `null` means "all" */
export function ComboboxFilter({
  label,
  value,
  options,
  onChange,
  isLoading = false,
  placeholder,
  className,
}: ComboboxFilterProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          role="combobox"
          aria-expanded={open}
          aria-label={`فیلتر ${label}`}
          className={cn(
            "min-w-44 justify-between font-normal",
            value && "border-primary/50",
            className,
          )}
        >
          <span className="truncate">
            {selected
              ? selected.label
              : (placeholder ?? `${label}: همه`)}
          </span>
          <ListFilter data-icon="inline-end" aria-hidden className="opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0">
        <Command>
          <CommandInput placeholder={`جستجو در ${label}…`} />
          <CommandList>
            <CommandEmpty>
              {isLoading ? "در حال بارگذاری…" : "موردی یافت نشد."}
            </CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="__all__"
                onSelect={() => {
                  onChange(null);
                  setOpen(false);
                }}
              >
                <Check
                  aria-hidden
                  className={cn(value !== null && "invisible")}
                />
                {label}: همه
              </CommandItem>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    aria-hidden
                    className={cn(value !== option.value && "invisible")}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/* -------------------------------------------------------------------------- */
/*  Jalali date range                                                         */
/* -------------------------------------------------------------------------- */

/** Gregorian ISO dates (`YYYY-MM-DD`) — what APIs and URLs carry */
export type IsoDateRange = {
  from: string | null;
  to: string | null;
};

type DateRangeFilterProps = {
  label: string;
  value: IsoDateRange;
  onChange: (value: IsoDateRange) => void;
  className?: string;
};

function toDate(value: string | null): Date | undefined {
  return value ? parseISO(value) : undefined;
}

function toIso(value: Date | undefined): string | null {
  return value ? formatIso(value, "yyyy-MM-dd") : null;
}

/** Date-range filter using the Jalali calendar; value/URL stay Gregorian ISO */
export function DateRangeFilter({
  label,
  value,
  onChange,
  className,
}: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const active = Boolean(value.from || value.to);
  const selected: DateRange | undefined = active
    ? { from: toDate(value.from), to: toDate(value.to) }
    : undefined;

  const summary = active
    ? `${value.from ? formatJalaliDate(value.from) : "…"} تا ${value.to ? formatJalaliDate(value.to) : "…"}`
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={`فیلتر ${label}`}
          className={cn(active && "border-primary/50", className)}
        >
          <CalendarRange data-icon="inline-start" aria-hidden />
          {label}
          {summary ? (
            <span className="text-xs text-muted-foreground tabular-nums">
              {summary}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto p-0"
        aria-labelledby={titleId}
      >
        <p id={titleId} className="sr-only">
          انتخاب بازه تاریخ {label}
        </p>
        <JalaliCalendar
          mode="range"
          selected={selected}
          onSelect={(range) =>
            onChange({ from: toIso(range?.from), to: toIso(range?.to) })
          }
          disablePast={false}
          disableFridays={false}
        />
        {active ? (
          <div className="border-t p-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => onChange({ from: null, to: null })}
            >
              <X data-icon="inline-start" aria-hidden />
              پاک کردن بازه
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
