"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import type { CostCalculatorCountry, DegreeLevel, LifestyleLevel } from "@/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LIFESTYLE_LABELS_FA,
} from "@/lib/constants";
import { calculateStudyCost } from "@/lib/cost-calculator";
import { DEGREE_LEVEL_LABELS, DEGREE_LEVELS } from "@/lib/degree-levels";
import { formatNumber, formatPrice } from "@/lib/format";

const LIFESTYLES: LifestyleLevel[] = ["economic", "medium", "comfortable"];
const DURATIONS = [1, 1.5, 2, 3, 4] as const;

type CostCalculatorProps = {
  countries: CostCalculatorCountry[];
};

type CostBarProps = {
  label: string;
  amount: number;
  max: number;
  currencyLabel: string;
  toman: number;
};

function CostBar({ label, amount, max, currencyLabel, toman }: CostBarProps) {
  const width = max > 0 ? Math.max((amount / max) * 100, 4) : 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">
          {formatNumber(amount)} {currencyLabel}
          <span className="mx-1 text-border">|</span>
          {formatPrice(toman)}
        </span>
      </div>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-muted"
        role="presentation"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

export function CostCalculator({ countries }: CostCalculatorProps) {
  const countryId = useId();
  const degreeId = useId();
  const durationId = useId();
  const lifestyleId = useId();

  const [countrySlug, setCountrySlug] = useState(countries[0]?.slug ?? "");
  const [degreeLevel, setDegreeLevel] = useState<DegreeLevel>("master");
  const [durationYears, setDurationYears] = useState(2);
  const [lifestyle, setLifestyle] = useState<LifestyleLevel>("medium");

  const country = useMemo(
    () => countries.find((c) => c.slug === countrySlug) ?? countries[0],
    [countries, countrySlug],
  );

  const result = useMemo(() => {
    if (!country) return null;
    return calculateStudyCost(country, {
      degreeLevel,
      durationYears,
      lifestyle,
    });
  }, [country, degreeLevel, durationYears, lifestyle]);

  if (!country || !result) {
    return (
      <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        داده هزینه برای کشورها در دسترس نیست.
      </p>
    );
  }

  const maxForeign = Math.max(
    result.foreign.tuition,
    result.foreign.living,
    result.foreign.insurance,
    result.foreign.visa,
    1,
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
      <fieldset className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5">
        <legend className="px-1 text-sm font-semibold text-foreground">
          پارامترهای برآورد
        </legend>

        <div className="flex flex-col gap-2">
          <Label htmlFor={countryId}>کشور</Label>
          <Select
            dir="rtl"
            value={countrySlug}
            onValueChange={(value) => {
              if (value) setCountrySlug(value);
            }}
          >
            <SelectTrigger id={countryId} className="w-full">
              <SelectValue placeholder="انتخاب کشور" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((c) => (
                <SelectItem key={c.slug} value={c.slug}>
                  {c.flagEmoji ? `${c.flagEmoji} ` : ""}
                  {c.nameFa}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={degreeId}>مقطع تحصیلی</Label>
          <Select
            dir="rtl"
            value={degreeLevel}
            onValueChange={(value) => {
              if (value) setDegreeLevel(value as DegreeLevel);
            }}
          >
            <SelectTrigger id={degreeId} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEGREE_LEVELS.map((level) => (
                <SelectItem key={level} value={level}>
                  {DEGREE_LEVEL_LABELS[level]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={durationId}>مدت تحصیل (سال)</Label>
          <Select
            dir="rtl"
            value={String(durationYears)}
            onValueChange={(value) => {
              if (value) setDurationYears(Number(value));
            }}
          >
            <SelectTrigger id={durationId} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DURATIONS.map((years) => (
                <SelectItem key={years} value={String(years)}>
                  {formatNumber(years)} سال
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={lifestyleId}>سبک زندگی</Label>
          <Select
            dir="rtl"
            value={lifestyle}
            onValueChange={(value) => {
              if (value) setLifestyle(value as LifestyleLevel);
            }}
          >
            <SelectTrigger id={lifestyleId} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LIFESTYLES.map((level) => (
                <SelectItem key={level} value={level}>
                  {LIFESTYLE_LABELS_FA[level]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </fieldset>

      <div className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-primary px-5 py-6 text-primary-foreground">
            <p className="text-sm text-primary-foreground/80">جمع کل تقریبی</p>
            <p className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              {formatPrice(result.toman.total)}
            </p>
            <p className="mt-1 text-sm text-primary-foreground/85">
              {formatNumber(result.foreign.total)} {result.currencyLabelFa}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/40 px-5 py-6">
            <p className="text-sm text-muted-foreground">مقصد</p>
            <p className="mt-2 text-xl font-semibold text-foreground">
              {country.flagEmoji ? `${country.flagEmoji} ` : ""}
              {country.nameFa}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {DEGREE_LEVEL_LABELS[degreeLevel]} · {formatNumber(durationYears)}{" "}
              سال · {LIFESTYLE_LABELS_FA[lifestyle]}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground">
            جزئیات هزینه
          </h3>
          <CostBar
            label="شهریه"
            amount={result.foreign.tuition}
            max={maxForeign}
            currencyLabel={result.currencyLabelFa}
            toman={result.toman.tuition}
          />
          <CostBar
            label="هزینه زندگی"
            amount={result.foreign.living}
            max={maxForeign}
            currencyLabel={result.currencyLabelFa}
            toman={result.toman.living}
          />
          <CostBar
            label="بیمه"
            amount={result.foreign.insurance}
            max={maxForeign}
            currencyLabel={result.currencyLabelFa}
            toman={result.toman.insurance}
          />
          <CostBar
            label="ویزا"
            amount={result.foreign.visa}
            max={maxForeign}
            currencyLabel={result.currencyLabelFa}
            toman={result.toman.visa}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/assessment">دریافت برنامه دقیق</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/booking">رزرو مشاوره</Link>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <Link href="/tools/deadline-countdown">شمارش معکوس ددلاین</Link>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          مبالغ تقریبی‌اند و بر اساس نرخ تبدیل ثابت در تنظیمات سایت محاسبه
          می‌شوند. برای برنامه دقیق مالی با مشاور صحبت کنید.
        </p>
      </div>
    </div>
  );
}
