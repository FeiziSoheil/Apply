"use client";

import { Award, Check, Plane } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { toPersianDigits } from "@/lib/format";

/**
 * Allowed badge slots (lg+ only) — never over form fields/button.
 * A — outside card, top-end corner, ~12px edge overlap
 * B — on globe, bottom-end, clear of card
 * C — below card, ≥20px under submit, bottom-start
 * All z-10 (card is z-20).
 */
const BADGES = [
  {
    id: "a-munich",
    text: "پذیرش دانشگاه مونیخ",
    Icon: Check,
    /** Anchored to card wrapper: top-end, 12px onto card */
    slot: "card-a" as const,
    floatClass: "hero-float-a",
  },
  {
    id: "b-canada",
    text: "ویزای کانادا تأیید شد",
    Icon: Plane,
    slot: "globe-b" as const,
    floatClass: "hero-float-b",
  },
  {
    id: "c-scholarship",
    text: `بورسیه ${toPersianDigits(50)}٪ دریافت شد`,
    Icon: Award,
    slot: "card-c" as const,
    floatClass: "hero-float-c",
  },
] as const;

function BadgePill({
  text,
  Icon,
  floatClass,
  reduceMotion,
}: {
  text: string;
  Icon: typeof Check;
  floatClass: string;
  reduceMotion: boolean | null;
}) {
  return (
    <span
      className={`inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-full border border-border/60 bg-card/75 px-3 text-xs font-medium text-foreground shadow-sm backdrop-blur-md ${
        reduceMotion ? "" : floatClass
      }`}
    >
      <Icon className="size-3.5 shrink-0 text-primary" aria-hidden />
      {text}
    </span>
  );
}

/** Badges A + C — render inside the boarding-pass relative wrapper */
export function CardFloatingBadges() {
  const reduceMotion = useReducedMotion();
  const a = BADGES[0];
  const c = BADGES[2];

  return (
    <ul
      className="pointer-events-none absolute inset-0 z-10 hidden lg:block"
      aria-hidden
    >
      {/* A: top-end of card — start at 12px before end edge so only 12px overlaps */}
      <li className="absolute start-[calc(100%-12px)] top-3">
        <BadgePill
          text={a.text}
          Icon={a.Icon}
          floatClass={a.floatClass}
          reduceMotion={reduceMotion}
        />
      </li>
      {/* C: ≥20px below card (under submit) */}
      <li className="absolute start-3 top-full mt-5">
        <BadgePill
          text={c.text}
          Icon={c.Icon}
          floatClass={c.floatClass}
          reduceMotion={reduceMotion}
        />
      </li>
    </ul>
  );
}

/** Badge B — render on the visual stage near globe bottom-end */
export function GlobeFloatingBadge() {
  const reduceMotion = useReducedMotion();
  const b = BADGES[1];

  return (
    <div
      className="pointer-events-none absolute end-4 bottom-8 z-10 hidden lg:block"
      aria-hidden
    >
      <BadgePill
        text={b.text}
        Icon={b.Icon}
        floatClass={b.floatClass}
        reduceMotion={reduceMotion}
      />
    </div>
  );
}

/** @deprecated use CardFloatingBadges + GlobeFloatingBadge */
export function FloatingBadges() {
  return null;
}
