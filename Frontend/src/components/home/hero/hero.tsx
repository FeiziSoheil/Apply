import { Container } from "@/components/shared/container";
import { Section } from "@/components/shared/section";
import { buildDottedGlobe } from "@/lib/globe/dotted-globe";
import { HeroClient } from "./hero-client";
import { HeroHeadline } from "./hero-headline";
import { GlobeVisual } from "./globe-visual";
import type { HeroCountryOption } from "./types";

type HomeHeroProps = {
  countries: HeroCountryOption[];
};

function HeroWave() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-10 leading-none"
      aria-hidden
    >
      <svg
        viewBox="0 0 1440 80"
        className="block h-12 w-full text-background sm:h-14 md:h-16"
        preserveAspectRatio="none"
      >
        <path
          fill="currentColor"
          d="M0,48 C240,80 480,0 720,32 C960,64 1200,80 1440,40 L1440,80 L0,80 Z"
        />
      </svg>
    </div>
  );
}

export function HomeHero({ countries }: HomeHeroProps) {
  const globe = buildDottedGlobe();

  return (
    <Section
      contained={false}
      padding="none"
      className="relative overflow-x-clip overflow-y-visible py-16 lg:py-24"
      aria-labelledby="home-hero-heading"
    >
      {/* Mesh background — full-bleed only */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0 bg-linear-to-bl from-primary/10 via-secondary/40 to-background" />
        <div className="hero-blob hero-blob-a absolute -end-[10%] -top-[15%] size-[min(70vw,28rem)] rounded-full bg-primary/20 blur-3xl" />
        <div className="hero-blob hero-blob-b absolute -start-[8%] top-[35%] size-[min(60vw,24rem)] rounded-full bg-accent/15 blur-3xl" />
        <div className="hero-blob hero-blob-c absolute bottom-[10%] end-[20%] size-[min(50vw,18rem)] rounded-full bg-primary/10 blur-3xl" />
        <div className="hero-dot-grid absolute inset-0 opacity-40" />
      </div>

      <Container className="relative z-20 overflow-x-clip">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          <div className="relative min-w-0 lg:col-span-5">
            {/* Mobile: faint globe behind headline */}
            <div
              className="pointer-events-none absolute start-1/2 top-0 z-0 size-64 -translate-x-1/2 opacity-100 lg:hidden"
              aria-hidden
            >
              <GlobeVisual data={globe} selectedSlug={null} muted />
            </div>
            <div className="relative z-10">
              <HeroHeadline />
            </div>
          </div>
          <HeroClient countries={countries} globe={globe} />
        </div>
      </Container>

      <HeroWave />
    </Section>
  );
}
