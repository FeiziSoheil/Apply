"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import type { ProgramListItem } from "@/services/programs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatJalaliDate, formatNumber, toPersianDigits } from "@/lib/format";

type DeadlineCountdownProps = {
  programs: ProgramListItem[];
};

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
};

function computeTimeLeft(deadlineIso: string, now: number): TimeLeft {
  const target = new Date(deadlineIso).getTime();
  const diff = target - now;

  if (Number.isNaN(target) || diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds, expired: false };
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex min-w-20 flex-col items-center rounded-xl bg-muted px-3 py-4">
      <span className="text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
        {toPersianDigits(String(value).padStart(2, "0"))}
      </span>
      <span className="mt-1 text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function DeadlineCountdown({ programs }: DeadlineCountdownProps) {
  const selectId = useId();
  const upcoming = useMemo(
    () =>
      [...programs].sort(
        (a, b) =>
          new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
      ),
    [programs],
  );

  const [slug, setSlug] = useState(upcoming[0]?.slug ?? "");
  const [now, setNow] = useState(() => Date.now());

  const selected = useMemo(
    () => upcoming.find((p) => p.slug === slug) ?? upcoming[0],
    [upcoming, slug],
  );

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (!selected) {
    return (
      <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        برنامه‌ای با ددلاین ثبت‌شده یافت نشد.
      </p>
    );
  }

  const timeLeft = computeTimeLeft(selected.deadline, now);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 sm:max-w-lg">
        <Label htmlFor={selectId}>انتخاب برنامه تحصیلی</Label>
        <Select
          dir="rtl"
          value={selected.slug}
          onValueChange={(value) => {
            if (value) setSlug(value);
          }}
        >
          <SelectTrigger id={selectId} className="w-full">
            <SelectValue placeholder="برنامه را انتخاب کنید" />
          </SelectTrigger>
          <SelectContent>
            {upcoming.map((program) => (
              <SelectItem key={program.slug} value={program.slug}>
                {program.nameFa} — {program.universityNameFa}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <p className="text-sm text-muted-foreground">
          {selected.universityNameFa} · {selected.countryNameFa}
        </p>
        <h2 className="mt-2 text-xl font-semibold text-foreground sm:text-2xl">
          {selected.nameFa}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          مهلت پذیرش: {formatJalaliDate(selected.deadline, "d MMMM yyyy")}
        </p>

        {timeLeft.expired ? (
          <p
            className="mt-8 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
            role="status"
          >
            مهلت این برنامه به پایان رسیده است. برنامه‌های دیگر را بررسی کنید یا
            با مشاور صحبت کنید.
          </p>
        ) : (
          <div
            className="mt-8 flex flex-wrap justify-center gap-3 sm:justify-start"
            role="timer"
            aria-live="polite"
            aria-label="زمان باقی‌مانده تا ددلاین"
          >
            <TimeUnit value={timeLeft.days} label="روز" />
            <TimeUnit value={timeLeft.hours} label="ساعت" />
            <TimeUnit value={timeLeft.minutes} label="دقیقه" />
            <TimeUnit value={timeLeft.seconds} label="ثانیه" />
          </div>
        )}

        {!timeLeft.expired ? (
          <p className="mt-4 text-sm text-muted-foreground">
            حدود {formatNumber(timeLeft.days)} روز تا بسته شدن پذیرش باقی مانده
            است.
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link href={`/programs/${selected.slug}`}>جزئیات برنامه</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/booking">رزرو مشاوره</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/tools/cost-calculator">ماشین‌حساب هزینه</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
