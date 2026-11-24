"use client";

import Link from "next/link";
import Image from "next/image";
import type { Consultant, Country } from "@/types";
import { Section } from "@/components/shared/section";
import { FadeIn } from "@/components/home/fade-in";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ConsultantsSectionProps = {
  consultants: Consultant[];
  countries: Country[];
};

export function ConsultantsSection({
  consultants,
  countries,
}: ConsultantsSectionProps) {
  const nameBySlug = new Map(countries.map((c) => [c.slug, c.nameFa]));

  return (
    <Section title="مشاوران ما"
      subtitle="تیمی از متخصصان پذیرش و ویزا برای همراهی شما"
      headerAction={
        <Button asChild variant="outline" size="sm">
          <Link href="/team">تیم کامل</Link>
        </Button>
      }
    >
      <FadeIn>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {consultants.map((consultant) => (
            <li key={consultant.id}>
              <Card className="h-full">
                <CardHeader>
                  <div className="mb-3 flex items-center gap-3">
                    <div className="relative size-14 overflow-hidden rounded-full bg-muted">
                      <Image
                        src={consultant.photo}
                        alt={`پرتره ${consultant.name}`}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {consultant.name}
                      </CardTitle>
                      <CardDescription>{consultant.role}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <p className="line-clamp-3 text-sm text-muted-foreground">
                    {consultant.bio}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {consultant.countries.map((slug) => (
                      <Badge key={slug} variant="secondary">
                        {nameBySlug.get(slug) ?? slug}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <p className="text-xs text-muted-foreground">
                    زبان‌ها: {consultant.languages.join("، ")}
                  </p>
                </CardFooter>
              </Card>
            </li>
          ))}
        </ul>
      </FadeIn>
    </Section>
  );
}
