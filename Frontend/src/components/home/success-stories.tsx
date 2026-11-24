"use client";

import Link from "next/link";
import type { SuccessStory } from "@/types";
import { Section } from "@/components/shared/section";
import { FadeIn } from "@/components/home/fade-in";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { toPersianDigits } from "@/lib/format";
import { Quote } from "lucide-react";

type SuccessStoriesProps = {
  stories: SuccessStory[];
};

export function SuccessStoriesSection({ stories }: SuccessStoriesProps) {
  return (
    <Section title="داستان‌های موفقیت"
      subtitle="از زبان دانشجویانی که مسیر اعزام را با ما طی کردند"
      className="bg-muted/40"
      headerAction={
        <Button asChild variant="outline" size="sm">
          <Link href="/success-stories">مشاهده همه</Link>
        </Button>
      }
    >
      <FadeIn>
        <Carousel opts={{ align: "start" }} className="w-full">
          <CarouselContent>
            {stories.map((story) => (
              <CarouselItem
                key={story.id}
                className="basis-[90%] sm:basis-1/2 lg:basis-1/3"
              >
                <Card className="h-full">
                  <CardHeader>
                    <Quote
                      className="mb-2 size-5 text-primary/60"
                      aria-hidden
                    />
                    <CardTitle className="text-base">
                      {story.studentName}
                    </CardTitle>
                    <CardDescription>
                      {story.university} · {story.country} ·{" "}
                      {toPersianDigits(story.year)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      «{story.quote}»
                    </p>
                    <p className="mt-3 text-xs font-medium text-foreground">
                      {story.field}
                    </p>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="mt-4 flex justify-center gap-2">
            <CarouselPrevious className="static translate-y-0" />
            <CarouselNext className="static translate-y-0" />
          </div>
        </Carousel>
      </FadeIn>
    </Section>
  );
}
