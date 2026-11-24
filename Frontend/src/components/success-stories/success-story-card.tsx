"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import type { SuccessStory } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toPersianDigits } from "@/lib/format";

type SuccessStoryCardProps = {
  story: SuccessStory;
  onOpen: (story: SuccessStory) => void;
};

export function SuccessStoryCard({ story, onOpen }: SuccessStoryCardProps) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="mb-2 flex items-center gap-3">
          {story.photo ? (
            <div className="relative size-12 overflow-hidden rounded-full bg-muted">
              <Image
                src={story.photo}
                alt={`عکس ${story.studentName}`}
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
          ) : null}
          <div>
            <CardTitle className="text-base">{story.studentName}</CardTitle>
            <CardDescription>
              {story.university} · {story.country}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground">«{story.quote}»</p>
        <p className="mt-3 text-xs font-medium text-foreground">
          {story.field} · {toPersianDigits(story.year)}
        </p>
        {story.videoUrl ? (
          <p className="mt-2 inline-flex items-center gap-1 text-xs text-primary">
            <Play className="size-3.5" aria-hidden />
            دارای ویدیو
          </p>
        ) : null}
      </CardContent>
      <CardFooter>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => onOpen(story)}
        >
          جزئیات بیشتر
        </Button>
      </CardFooter>
    </Card>
  );
}
