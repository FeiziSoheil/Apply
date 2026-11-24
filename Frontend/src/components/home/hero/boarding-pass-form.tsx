"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Plane } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DEGREE_LEVELS, DEGREE_LEVEL_LABELS } from "@/lib/degree-levels";
import { INSTITUTE } from "@/lib/constants";
import { toPersianDigits } from "@/lib/format";
import { toNormalizedMobile } from "@/lib/validations/common";
import {
  heroAssessmentSchema,
  type HeroAssessmentValues,
} from "@/lib/validations/hero-assessment";
import { getCountryIata, type HeroCountryOption } from "./types";

type BoardingPassFormProps = {
  countries: HeroCountryOption[];
  selectedCountry: string;
  onCountryChange: (slug: string) => void;
};

function BarcodeSvg() {
  const bars = [
    1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0,
    1, 0, 0, 1, 1, 0, 1,
  ];
  return (
    <svg
      viewBox="0 0 80 36"
      className="h-9 w-full text-foreground"
      aria-hidden
    >
      {bars.map((on, i) =>
        on ? (
          <rect
            key={i}
            x={i * 2.4}
            y={0}
            width={1.6}
            height={36}
            fill="currentColor"
          />
        ) : null,
      )}
    </svg>
  );
}

export function BoardingPassForm({
  countries,
  selectedCountry,
  onCountryChange,
}: BoardingPassFormProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const form = useForm<HeroAssessmentValues>({
    resolver: zodResolver(heroAssessmentSchema),
    defaultValues: {
      degreeLevel: undefined,
      country: selectedCountry || "",
      phone: "",
    },
  });

  const iata = selectedCountry ? getCountryIata(selectedCountry) : "— — —";

  function onSubmit(values: HeroAssessmentValues) {
    const params = new URLSearchParams({
      degreeLevel: values.degreeLevel,
      country: values.country,
      phone: toNormalizedMobile(values.phone),
    });
    router.push(`/assessment?${params.toString()}`);
  }

  return (
    <div className="hero-boarding-pass group relative z-20 w-full rotate-0">
      {/* Fake ticket stack */}
      <div
        className="absolute inset-0 -z-10 rounded-xl border border-border/70 bg-card/60 transition-transform duration-300 ease-out -rotate-[3deg] group-hover:-rotate-[5deg] motion-reduce:rotate-0 motion-reduce:transition-none"
        aria-hidden
      />
      <div
        className="absolute inset-0 -z-10 rounded-xl border border-border/70 bg-card/60 transition-transform duration-300 ease-out rotate-[2deg] group-hover:rotate-[4deg] motion-reduce:rotate-0 motion-reduce:transition-none"
        aria-hidden
      />

      <div className="relative flex overflow-hidden rounded-xl border border-border/70 bg-card shadow-lg shadow-primary/10">
        {/* Main ticket */}
        <div className="hero-boarding-main relative min-w-0 flex-1 p-4 sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-2 border-b border-dashed border-border pb-3">
            <div>
              <p className="text-sm font-bold text-primary">{INSTITUTE.name}</p>
              <p className="text-xs text-muted-foreground">کارت ارزیابی</p>
            </div>
            <p
              className="font-mono text-[0.65rem] tracking-widest text-muted-foreground"
              dir="ltr"
            >
              APL-2026-0001
            </p>
          </div>

          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="text-center">
              <p
                className="font-mono text-lg font-bold tracking-widest text-foreground"
                dir="ltr"
              >
                IR
              </p>
              <p className="text-[0.65rem] text-muted-foreground">ایران (IR)</p>
            </div>

            <div className="relative mx-2 flex min-w-0 flex-1 items-center">
              <div
                className="h-px w-full border-t border-dashed border-muted-foreground/50"
                aria-hidden
              />
              {/* IR (start/right) → destination (end/left): plane faces end */}
              <Plane
                className={`absolute start-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 -scale-x-100 text-primary ${
                  reduceMotion ? "" : "hero-plane-bob"
                }`}
                aria-hidden
              />
            </div>

            <div className="min-w-[3.25rem] text-center">
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={iata}
                  className="font-mono text-lg font-bold tracking-widest text-primary"
                  dir="ltr"
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  {iata}
                </motion.p>
              </AnimatePresence>
              <p className="text-[0.65rem] text-muted-foreground">مقصد شما</p>
            </div>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-3"
              noValidate
            >
              <FormField
                control={form.control}
                name="degreeLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>مقطع تحصیلی</FormLabel>
                    <Select
                      dir="rtl"
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger
                          className="w-full bg-background"
                          aria-label="مقطع تحصیلی"
                        >
                          <SelectValue placeholder="انتخاب مقطع" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DEGREE_LEVELS.map((level) => (
                          <SelectItem key={level} value={level}>
                            {DEGREE_LEVEL_LABELS[level]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>کشور مقصد</FormLabel>
                    <Select
                      dir="rtl"
                      onValueChange={(value) => {
                        field.onChange(value);
                        onCountryChange(value);
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger
                          className="w-full bg-background"
                          aria-label="کشور مقصد"
                        >
                          <SelectValue placeholder="انتخاب کشور" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.slug} value={country.slug}>
                            <span className="inline-flex items-center gap-2">
                              {country.flagEmoji ? (
                                <span aria-hidden>{country.flagEmoji}</span>
                              ) : null}
                              {country.nameFa}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>شماره موبایل</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                        dir="ltr"
                        className="bg-background text-start"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="mt-1 w-full" size="lg">
                دریافت کارت پرواز من
              </Button>
            </form>
          </Form>
        </div>

        {/* Stub — lg+ only */}
        <div
          className="hero-boarding-stub relative hidden w-[5.5rem] shrink-0 flex-col items-center justify-between border-s border-dashed border-border bg-muted/40 px-2 py-6 lg:flex"
          aria-hidden
        >
          <p
            className="rotate-180 text-[0.6rem] font-medium tracking-widest text-muted-foreground"
            style={{ writingMode: "vertical-rl" }}
          >
            BOARDING PASS
          </p>
          <div className="w-full px-0.5">
            <BarcodeSvg />
          </div>
          <div className="space-y-1.5 text-center font-mono text-[0.65rem] tracking-wide text-muted-foreground">
            <p>
              <span className="block text-[0.55rem] font-sans tracking-normal">
                گیت
              </span>
              {toPersianDigits(1)}
            </p>
            <p>
              <span className="block text-[0.55rem] font-sans tracking-normal">
                صندلی
              </span>
              A{toPersianDigits(1)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
