import Image from "next/image";
import Link from "next/link";
import type { Consultant } from "@/types";
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

type ConsultantCardProps = {
  consultant: Consultant;
  countryNames: Map<string, string>;
};

export function ConsultantCard({
  consultant,
  countryNames,
}: ConsultantCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="mb-2 flex items-center gap-3">
          <div className="relative size-16 overflow-hidden rounded-full bg-muted">
            <Image
              src={consultant.photo}
              alt={`پرتره ${consultant.name}`}
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
          <div>
            <CardTitle className="text-base">{consultant.name}</CardTitle>
            <CardDescription>{consultant.role}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">{consultant.bio}</p>
        <div>
          <p className="mb-1.5 text-xs font-medium text-foreground">کشورها</p>
          <div className="flex flex-wrap gap-1.5">
            {consultant.countries.map((slug) => (
              <Badge key={slug} variant="secondary">
                {countryNames.get(slug) ?? slug}
              </Badge>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          زبان‌ها: {consultant.languages.join("، ")}
        </p>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/booking?consultant=${consultant.id}`}>
            رزرو با این مشاور
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
