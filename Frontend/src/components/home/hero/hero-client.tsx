"use client";

import { useState } from "react";
import type { DottedGlobeData } from "@/lib/globe/dotted-globe";
import { BoardingPassForm } from "./boarding-pass-form";
import {
  CardFloatingBadges,
  GlobeFloatingBadge,
} from "./floating-badges";
import { GlobeVisual } from "./globe-visual";
import type { HeroCountryOption } from "./types";

type HeroClientProps = {
  countries: HeroCountryOption[];
  globe: DottedGlobeData;
};

export function HeroClient({ countries, globe }: HeroClientProps) {
  const [selectedCountry, setSelectedCountry] = useState("");

  return (
    <div className="relative min-w-0 lg:col-span-7">
      {/*
        Fixed-height visual stage on desktop.
        Globe at end (~440px), card at start (380px) — overlap from shared column width.
      */}
      <div className="relative mx-auto w-full max-w-[380px] lg:mx-0 lg:h-[540px] lg:max-w-none">
        <div className="pointer-events-none absolute -end-2 -top-8 z-0 size-52 opacity-30 sm:size-60 lg:pointer-events-auto lg:end-0 lg:top-1/2 lg:size-[440px] lg:-translate-y-1/2 lg:opacity-100">
          <GlobeVisual data={globe} selectedSlug={selectedCountry || null} />
        </div>

        <GlobeFloatingBadge />

        <div className="relative z-20 w-full lg:absolute lg:start-0 lg:top-1/2 lg:w-[380px] lg:-translate-y-1/2">
          <BoardingPassForm
            countries={countries}
            selectedCountry={selectedCountry}
            onCountryChange={setSelectedCountry}
          />
          <CardFloatingBadges />
        </div>
      </div>
    </div>
  );
}
