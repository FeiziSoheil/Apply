import Image from "next/image";
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
import { CONTINENT_LABELS, COST_BAND_LABELS } from "@/lib/continents";
import { formatMoney } from "@/lib/currency";
import { FavoriteButton } from "@/components/shortlist/favorite-button";
import type { Country } from "@/types";

type CountryCardProps = {
  country: Country;
};

export function CountryCard({ country }: CountryCardProps) {
  return (
    <Card className="h-full overflow-hidden py-0">
      <div className="relative aspect-[16/10] w-full bg-muted">
        <Image
          src={country.heroImage}
          alt={`تصویر نمای ${country.nameFa}`}
          fill
          quality={100}
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute start-3 top-3 z-10">
          <FavoriteButton
            target={{
              countrySlug: country.slug,
              title: country.nameFa,
            }}
            className="bg-background/90 shadow-sm"
          />
        </div>
      </div>
      <CardHeader className="pt-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl" aria-hidden>
            {country.flagEmoji ?? "🌍"}
          </span>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg">{country.nameFa}</CardTitle>
            <p className="text-xs text-muted-foreground">{country.nameEn}</p>
          </div>
        </div>
        <CardDescription className="line-clamp-2">
          {country.summary}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            {CONTINENT_LABELS[country.continent]}
          </Badge>
          <Badge variant="outline">
            هزینه {COST_BAND_LABELS[country.costBand]}
          </Badge>
        </div>
        <dl className="flex flex-col gap-1 text-sm">
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-muted-foreground">شهریه تقریبی</dt>
            <dd className="font-medium text-foreground">
              {country.tuitionRange}
            </dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-muted-foreground">هزینه زندگی ماهانه</dt>
            <dd className="font-medium text-foreground">
              حدود {formatMoney(country.costOfLiving, country.currency)}
            </dd>
          </div>
        </dl>
      </CardContent>
      <CardFooter className="pb-4">
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href={`/countries/${country.slug}`}>مشاهده جزئیات</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
