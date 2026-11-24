import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatNumber } from "@/lib/format";
import { formatTuition } from "@/lib/format-tuition";
import { FavoriteButton } from "@/components/shortlist/favorite-button";
import type { University } from "@/types";

type UniversityCardProps = {
  university: University;
  countryNameFa?: string;
};

export function UniversityCard({
  university,
  countryNameFa,
}: UniversityCardProps) {
  return (
    <Card className="h-full overflow-hidden py-0">
      <div className="relative aspect-[16/10] w-full bg-muted">
        <Image
          src={university.heroImage}
          alt={`پردیس ${university.nameFa}`}
          fill
          quality={100}
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute start-3 top-3 z-10">
          <FavoriteButton
            target={{
              universityId: university.id,
              countrySlug: university.countrySlug,
              title: university.nameFa,
            }}
            className="bg-background/90 shadow-sm"
          />
        </div>
        <div className="absolute end-3 top-3 size-12 overflow-hidden rounded-lg bg-background/95 p-1.5 shadow-sm">
          <Image
            src={university.logo}
            alt=""
            width={48}
            height={48}
            quality={100}
            className="size-full object-contain"
            aria-hidden
          />
        </div>
      </div>
      <CardHeader className="pt-4">
        <CardTitle className="text-base leading-snug">
          {university.nameFa}
        </CardTitle>
        <CardDescription>
          {university.city}
          {countryNameFa ? ` · ${countryNameFa}` : null}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
        <p className="line-clamp-2">{university.summary}</p>
        <dl className="flex flex-col gap-1">
          <div className="flex flex-wrap justify-between gap-2">
            <dt>رتبه تقریبی</dt>
            <dd className="font-medium text-foreground">
              {formatNumber(university.ranking)}
            </dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt>شهریه سالانه</dt>
            <dd className="font-medium text-foreground">
              {formatTuition(university.tuitionPerYear, university.currency)}
            </dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt>تعداد برنامه</dt>
            <dd className="font-medium text-foreground">
              {formatNumber(university.programsCount)}
            </dd>
          </div>
        </dl>
      </CardContent>
      <CardFooter className="pb-4">
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href={`/universities/${university.slug}`}>مشاهده دانشگاه</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
