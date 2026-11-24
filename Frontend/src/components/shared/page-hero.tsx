import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/container";
import { cn } from "@/lib/utils";

export type PageHeroCta = {
  label: string;
  href: string;
};

type PageHeroProps = {
  title: string;
  description?: string;
  /** Emoji or short prefix shown before the title */
  eyebrow?: ReactNode;
  imageSrc?: string;
  imageAlt?: string;
  primaryCta?: PageHeroCta;
  secondaryCta?: PageHeroCta;
  className?: string;
};

export function PageHero({
  title,
  description,
  eyebrow,
  imageSrc,
  imageAlt = "",
  primaryCta,
  secondaryCta,
  className,
}: PageHeroProps) {
  return (
    <Container>
      <header
        className={cn(
          "relative overflow-hidden rounded-2xl bg-primary text-primary-foreground",
          className,
        )}
      >
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            priority
            quality={100}
            className="object-cover opacity-25"
            sizes="(max-width: 768px) 100vw, 1152px"
          />
        ) : null}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-l from-primary/90 via-primary/80 to-primary/70"
        />
        <div className="relative flex flex-col gap-4 px-6 py-10 sm:px-8 sm:py-14 md:max-w-2xl">
          {eyebrow ? (
            <div className="flex items-center gap-2 text-lg text-primary-foreground/90">
              {eyebrow}
            </div>
          ) : null}
          <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="text-pretty text-base text-primary-foreground/85 sm:text-lg">
              {description}
            </p>
          ) : null}
          {primaryCta || secondaryCta ? (
            <div className="mt-2 flex flex-wrap gap-3">
              {primaryCta ? (
                <Button
                  asChild
                  size="lg"
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  <Link href={primaryCta.href}>{primaryCta.label}</Link>
                </Button>
              ) : null}
              {secondaryCta ? (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                >
                  <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>
    </Container>
  );
}
