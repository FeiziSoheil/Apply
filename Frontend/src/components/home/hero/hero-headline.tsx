"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, CalendarDays, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";

const ROTATING_WORDS = [
  "آلمان",
  "کانادا",
  "ایتالیا",
  "مجارستان",
  "استرالیا",
] as const;

/** Longest label — keeps underline/layout width stable while words rotate */
const LONGEST_WORD = "استرالیا";

const ROTATE_MS = 2500;

const TRUST_AVATARS = [
  { initials: "سم", className: "bg-primary text-primary-foreground" },
  { initials: "عر", className: "bg-accent text-accent-foreground" },
  { initials: "نک", className: "bg-secondary text-secondary-foreground" },
  { initials: "پح", className: "bg-muted text-foreground" },
] as const;

function HandDrawnUnderline({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 120 10"
      className={className}
      fill="none"
      preserveAspectRatio="none"
    >
      <path
        d="M2 7 C 30 2, 55 9, 80 5 S 110 3, 118 6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        className="text-primary/70"
      />
    </svg>
  );
}

export function HeroHeadline() {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  const currentWord = ROTATING_WORDS[index] ?? ROTATING_WORDS[0];
  const studentCount = formatNumber(3200);

  return (
    <div className="relative z-10 flex flex-col items-start gap-5">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/80 px-3 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm sm:text-sm">
        <Users className="size-3.5 text-primary" aria-hidden />
        <span>+{studentCount} دانشجوی اعزام‌شده</span>
      </span>

      <div className="relative w-full max-w-xl">
        <h1 id="home-hero-heading" className="text-balance">
          <span className="sr-only">
            تحصیل در آلمان، کانادا، ایتالیا، مجارستان و استرالیا را از امروز
            شروع کنید
          </span>
          <span
            aria-hidden
            className="block text-2xl font-bold sm:text-3xl md:text-4xl lg:text-[2.75rem] lg:leading-[1.35]"
          >
            تحصیل در{" "}
            <span
              className="relative inline-block align-bottom text-primary"
              style={{ minWidth: "4.5ch" }}
            >
              {/* Reserve width of longest word so the rest of the line does not jump */}
              <span className="invisible whitespace-nowrap" aria-hidden>
                {LONGEST_WORD}
              </span>
              <span className="absolute inset-x-0 top-0 whitespace-nowrap">
                {reduceMotion ? (
                  <span>آلمان</span>
                ) : (
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={currentWord}
                      className="inline-block"
                      initial={{ y: "80%", opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: "-80%", opacity: 0 }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                    >
                      {currentWord}
                    </motion.span>
                  </AnimatePresence>
                )}
              </span>
              <HandDrawnUnderline className="absolute inset-x-0 -bottom-2 h-2.5 w-full" />
            </span>{" "}
            را از امروز شروع کنید
          </span>
        </h1>
      </div>

      <p className="max-w-md text-sm text-muted-foreground sm:text-base">
        ارزیابی رایگان تا پذیرش و ویزا — مسیر تحصیل خارج را شفاف طی کنید.
      </p>

      <div className="flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href="/assessment">
            ارزیابی رایگان
            <ArrowLeft data-icon="inline-end" className="size-4" aria-hidden />
          </Link>
        </Button>
        <Button
          asChild
          variant="ghost"
          size="lg"
          className="border border-border/60"
        >
          <Link href="/booking">
            <CalendarDays data-icon="inline-start" className="size-4" aria-hidden />
            رزرو مشاوره
          </Link>
        </Button>
      </div>

      <div className="flex flex-nowrap items-center gap-3 pt-1">
        <ul className="flex shrink-0 ps-1" aria-hidden>
          {TRUST_AVATARS.map((avatar, i) => (
            <li
              key={avatar.initials}
              className={`relative -ms-2 flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-medium ring-2 ring-background first:ms-0 ${avatar.className}`}
              style={{ zIndex: TRUST_AVATARS.length - i }}
            >
              {avatar.initials}
            </li>
          ))}
        </ul>
        <div className="flex min-w-0 flex-col justify-center gap-0.5 leading-snug">
          <p className="flex gap-0.5 text-accent" aria-label="۵ از ۵ ستاره">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} aria-hidden>
                ★
              </span>
            ))}
          </p>
          <p className="text-sm text-foreground">
            بیش از {studentCount} نفر به ما اعتماد کردند
          </p>
        </div>
      </div>
    </div>
  );
}
