"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
} from "framer-motion";
import {
  DEFAULT_FLIGHT_CYCLE,
  quadraticArcPath,
  type DottedGlobeData,
  type GlobePin,
} from "@/lib/globe/dotted-globe";

type GlobeVisualProps = {
  data: DottedGlobeData;
  selectedSlug: string | null;
  className?: string;
  muted?: boolean;
};

function pinBySlug(pins: GlobePin[], slug: string): GlobePin | undefined {
  return pins.find((p) => p.slug === slug);
}

export function GlobeVisual({
  data,
  selectedSlug,
  className = "",
  muted = false,
}: GlobeVisualProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [cycleIndex, setCycleIndex] = useState(0);
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [focusedSlug, setFocusedSlug] = useState<string | null>(null);

  const origin = useMemo(() => pinBySlug(data.pins, "iran"), [data.pins]);

  const activeSlug = useMemo(() => {
    if (muted) return null;
    if (selectedSlug && selectedSlug !== "iran") return selectedSlug;
    if (reduceMotion) return DEFAULT_FLIGHT_CYCLE[0] ?? null;
    return DEFAULT_FLIGHT_CYCLE[cycleIndex] ?? null;
  }, [muted, selectedSlug, reduceMotion, cycleIndex]);

  useEffect(() => {
    if (muted || reduceMotion || selectedSlug) return;
    const id = window.setInterval(() => {
      setCycleIndex((i) => (i + 1) % DEFAULT_FLIGHT_CYCLE.length);
    }, 4200);
    return () => window.clearInterval(id);
  }, [muted, reduceMotion, selectedSlug]);

  const destination = activeSlug ? pinBySlug(data.pins, activeSlug) : undefined;

  const arcPath =
    origin && destination
      ? quadraticArcPath(origin.x, origin.y, destination.x, destination.y)
      : "";

  const chipSlug =
    hoveredSlug ?? focusedSlug ?? (selectedSlug && selectedSlug !== "iran"
      ? selectedSlug
      : null);

  return (
    <div
      className={`hero-globe-surface relative aspect-square size-full overflow-visible rounded-full ${
        muted ? "opacity-25" : ""
      } ${className}`}
      aria-hidden={muted || undefined}
    >
      <div className="hero-globe-glow pointer-events-none absolute inset-0 rounded-full" />
      <div className="pointer-events-none absolute inset-0 rounded-full border border-primary/25" />

      <svg
        viewBox={`0 0 ${data.size} ${data.size}`}
        className="absolute inset-0 size-full overflow-visible"
        role={muted ? "presentation" : "img"}
        aria-label={muted ? undefined : "نقشه جهان با مسیر پرواز تحصیلی"}
      >
        <circle
          cx={data.size / 2}
          cy={data.size / 2}
          r={data.size / 2 - 1}
          className="fill-none stroke-primary/15"
          strokeWidth={1}
        />
        <path
          d={data.dotsPath}
          fill="none"
          className="stroke-primary/45"
          strokeWidth={2.5}
          strokeLinecap="round"
        />

        {!muted && arcPath ? (
          <g key={activeSlug ?? "arc"}>
            <motion.path
              d={arcPath}
              fill="none"
              className="stroke-accent"
              strokeWidth={2}
              strokeLinecap="round"
              initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.85 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 1.15, ease: "easeInOut" }
              }
            />
            {!reduceMotion ? <PlaneOnPath path={arcPath} /> : null}
          </g>
        ) : null}
      </svg>

      {!muted
        ? data.pins.map((pin) => {
            const isActive = activeSlug === pin.slug;
            const showChip =
              chipSlug === pin.slug || (isActive && Boolean(selectedSlug));
            const left = `${(pin.x / data.size) * 100}%`;
            const top = `${(pin.y / data.size) * 100}%`;
            const isLink = !pin.isOrigin && pin.slug !== "iran";

            const marker = (
              <>
                {pin.isOrigin && !reduceMotion ? (
                  <span
                    className="hero-pulse-ring absolute inset-[-4px] rounded-full bg-accent/35"
                    aria-hidden
                  />
                ) : null}
                <span
                  className={`relative block size-2 rounded-full ring-2 ring-background ${
                    pin.isOrigin
                      ? "bg-accent"
                      : isActive
                        ? "scale-125 bg-primary"
                        : "bg-primary/80"
                  }`}
                />
                {showChip ? (
                  <span className="pointer-events-none absolute start-full top-1/2 z-10 ms-1.5 flex -translate-y-1/2 items-center gap-1 whitespace-nowrap rounded-full border border-border/60 bg-card/95 px-2 py-0.5 text-[0.65rem] font-medium text-foreground shadow-sm backdrop-blur-sm">
                    <span aria-hidden>{pin.flagEmoji}</span>
                    {pin.nameFa}
                  </span>
                ) : null}
              </>
            );

            const pinClass =
              "absolute z-[1] flex size-2 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring";

            if (!isLink) {
              return (
                <span
                  key={pin.slug}
                  className={pinClass}
                  style={{ left, top }}
                  aria-label={pin.nameFa}
                >
                  {marker}
                </span>
              );
            }

            return (
              <Link
                key={pin.slug}
                href={`/countries/${pin.slug}`}
                className={pinClass}
                style={{ left, top }}
                aria-label={`تحصیل در ${pin.nameFa}`}
                onMouseEnter={() => setHoveredSlug(pin.slug)}
                onMouseLeave={() => setHoveredSlug(null)}
                onFocus={() => setFocusedSlug(pin.slug)}
                onBlur={() => setFocusedSlug(null)}
              >
                {marker}
              </Link>
            );
          })
        : null}
    </div>
  );
}

function PlaneOnPath({ path }: { path: string }) {
  const pathRef = useRef<SVGPathElement>(null);
  const progress = useMotionValue(0);
  const [pose, setPose] = useState({ x: 0, y: 0, angle: 0 });

  useEffect(() => {
    progress.set(0);
    const controls = animate(progress, 1, {
      duration: 1.15,
      ease: "easeInOut",
    });
    return () => controls.stop();
  }, [path, progress]);

  useMotionValueEvent(progress, "change", (value) => {
    const el = pathRef.current;
    if (!el) return;
    const length = el.getTotalLength();
    const point = el.getPointAtLength(value * length);
    const ahead = el.getPointAtLength(Math.min(length, value * length + 2));
    const angle =
      (Math.atan2(ahead.y - point.y, ahead.x - point.x) * 180) / Math.PI;
    setPose({ x: point.x, y: point.y, angle });
  });

  return (
    <>
      <path ref={pathRef} d={path} fill="none" stroke="none" aria-hidden />
      <g
        transform={`translate(${pose.x} ${pose.y}) rotate(${pose.angle})`}
        className="text-accent"
      >
        <path
          d="M -7 0 L 6 -3.5 L 6 3.5 Z"
          fill="currentColor"
          stroke="none"
        />
      </g>
    </>
  );
}
