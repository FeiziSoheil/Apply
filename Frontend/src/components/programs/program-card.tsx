import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DEGREE_LEVEL_LABELS } from "@/lib/degree-levels";
import { formatJalaliDate } from "@/lib/format";
import { formatTuition } from "@/lib/format-tuition";
import { FavoriteButton } from "@/components/shortlist/favorite-button";
import type { ProgramListItem } from "@/services/programs";

type ProgramCardProps = {
  program: ProgramListItem;
};

export function ProgramCard({ program }: ProgramCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">
            {program.nameFa}
          </CardTitle>
          <div className="flex items-center gap-1">
            {program.hasScholarship ? (
              <Badge variant="secondary">بورسیه</Badge>
            ) : null}
            <FavoriteButton
              target={{
                programId: program.id,
                countrySlug: program.countrySlug,
                title: program.nameFa,
              }}
            />
          </div>
        </div>
        <CardDescription>
          {program.universityNameFa} · {program.countryNameFa}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
        <p>
          <span className="text-foreground">
            {DEGREE_LEVEL_LABELS[program.degreeLevel]}
          </span>
          {" · "}
          {program.field}
        </p>
        <dl className="flex flex-col gap-1">
          <div className="flex flex-wrap justify-between gap-2">
            <dt>شهریه سالانه</dt>
            <dd className="font-medium text-foreground">
              {formatTuition(program.tuition, program.currency)}
            </dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt>مهلت درخواست</dt>
            <dd className="font-medium text-foreground">
              {formatJalaliDate(program.deadline)}
            </dd>
          </div>
        </dl>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href={`/programs/${program.slug}`}>جزئیات برنامه</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
