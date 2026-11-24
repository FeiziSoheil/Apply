"use client";

import Image from "next/image";
import Link from "next/link";
import type { Country } from "@/types";
import { Section } from "@/components/shared/section";
import { FadeIn } from "@/components/home/fade-in";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

type PopularCountriesProps = {
  countries: Country[];
};

/** Bento spans for desktop asymmetric grid (8 tiles). */
const BENTO_SPANS = [
  "md:col-span-2 md:row-span-2",
  "md:col-span-1 md:row-span-1",
  "md:col-span-1 md:row-span-1",
  "md:col-span-1 md:row-span-1",
  "md:col-span-1 md:row-span-1",
  "md:col-span-2 md:row-span-1",
  "md:col-span-1 md:row-span-1",
  "md:col-span-1 md:row-span-1",
] as const;

export function PopularCountries({ countries }: PopularCountriesProps) {
  const featured = countries.slice(0, 8);

  return (
    <Section title="کشورهای محبوب"
      subtitle="مقاصد پرتقاضای تحصیل برای دانشجویان ایرانی"
      headerAction={
        <Button asChild variant="outline" size="sm">
          <Link href="/countries">مشاهده کشورها</Link>
        </Button>
      }
    >
      <FadeIn>
        <div className="hidden md:grid md:auto-rows-[11rem] md:grid-cols-4 md:gap-3 lg:auto-rows-[12.5rem] lg:gap-4">
          {featured.map((country, index) => (
            <CountryTile
              key={country.id}
              country={country}
              className={BENTO_SPANS[index] ?? "md:col-span-1"}
              featured={index === 0}
            />
          ))}
        </div>

        <div className="md:hidden">
          <Carousel opts={{ align: "start" }} className="w-full">
            <CarouselContent>
              {featured.map((country) => (
                <CarouselItem key={country.id} className="basis-[85%]">
                  <CountryTile
                    country={country}
                    className="aspect-[4/5]"
                    alwaysShowDetails
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="mt-4 flex justify-center gap-2">
              <CarouselPrevious className="static translate-y-0" />
              <CarouselNext className="static translate-y-0" />
            </div>
          </Carousel>
        </div>
      </FadeIn>
    </Section>
  );
}

type CountryTileProps = {
  country: Country;
  className?: string;
  featured?: boolean;
  /** On touch layouts, keep details visible without hover. */
  alwaysShowDetails?: boolean;
};

function CountryTile({
  country,
  className,
  featured = false,
  alwaysShowDetails = false,
}: CountryTileProps) {
  return (
    <Link
      href={`/countries/${country.slug}`}
      className={cn(
        "group relative block min-h-0 overflow-hidden rounded-xl bg-muted outline-none",
        "ring-offset-background transition-[box-shadow,transform] duration-300",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "hover:z-10",
        className,
      )}
    >
      <Image
        src={country.heroImage}
        alt={`نمای شهری ${country.nameFa}`}
        fill
        quality={100}
        className="object-cover transition-transform duration-500 ease-out group-hover:scale-105 group-focus-visible:scale-105"
        sizes={
          featured
            ? "(max-width: 768px) 85vw, 50vw"
            : "(max-width: 768px) 85vw, 25vw"
        }
      />

      {/* Base gradient — keeps country name readable at rest */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/25 to-transparent"
        aria-hidden
      />

      {/* Hover/focus scrim — darkens the whole tile so details stay clear */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-foreground/55 transition-opacity duration-300 ease-out",
          alwaysShowDetails
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100",
        )}
        aria-hidden
      />

      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-1.5 p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <span className="text-2xl leading-none" aria-hidden>
            {country.flagEmoji ?? "🌍"}
          </span>
          <h3
            className={cn(
              "font-heading font-semibold text-primary-foreground",
              featured ? "text-xl lg:text-2xl" : "text-base lg:text-lg",
            )}
          >
            {country.nameFa}
          </h3>
        </div>

        <div
          className={cn(
            "flex flex-col gap-1.5 overflow-hidden transition-[max-height,opacity,transform] duration-300 ease-out",
            alwaysShowDetails
              ? "max-h-40 opacity-100"
              : "max-h-0 translate-y-1 opacity-0 group-hover:max-h-40 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:max-h-40 group-focus-visible:translate-y-0 group-focus-visible:opacity-100",
          )}
        >
          <p
            className={cn(
              "text-sm text-primary-foreground/90",
              featured || alwaysShowDetails ? "line-clamp-2" : "line-clamp-1",
            )}
          >
            {country.summary}
          </p>
          <p className="text-xs font-medium text-primary-foreground/80">
            شهریه تقریبی: {country.tuitionRange}
          </p>
          <span className="mt-0.5 text-xs font-medium text-primary-foreground underline-offset-4 group-hover:underline group-focus-visible:underline">
            مشاهده جزئیات
          </span>
        </div>
      </div>
    </Link>
  );
}
