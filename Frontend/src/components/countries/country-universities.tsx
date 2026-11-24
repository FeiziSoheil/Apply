import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatMoney } from "@/lib/currency";
import { formatNumber } from "@/lib/format";
import type { University } from "@/types";

type CountryUniversitiesProps = {
  universities: University[];
  countryNameFa: string;
};

export function CountryUniversities({
  universities,
  countryNameFa,
}: CountryUniversitiesProps) {
  if (universities.length === 0) {
    return (
      <p className="text-muted-foreground">
        هنوز دانشگاهی برای {countryNameFa} ثبت نشده است.
      </p>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {universities.map((uni) => (
        <li key={uni.id}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base leading-snug">
                {uni.nameFa}
              </CardTitle>
              <CardDescription>
                {uni.city} · رتبه جهانی تقریبی{" "}
                {formatNumber(uni.ranking)}
              </CardDescription>
              <p className="pt-1 text-sm text-muted-foreground">
                شهریه تقریبی:{" "}
                <span className="font-medium text-foreground">
                  {formatMoney(uni.tuitionPerYear, uni.currency)} در سال
                </span>
              </p>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {uni.summary}
              </p>
            </CardHeader>
            <CardFooter>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href={`/universities/${uni.slug}`}>مشاهده دانشگاه</Link>
              </Button>
            </CardFooter>
          </Card>
        </li>
      ))}
    </ul>
  );
}
