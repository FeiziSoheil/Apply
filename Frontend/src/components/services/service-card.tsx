import Link from "next/link";
import type { Service } from "@/types";
import { ServiceIcon } from "@/lib/icons";
import { formatRialsAsToman } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ServiceCardProps = {
  service: Service;
};

export function ServiceCard({ service }: ServiceCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ServiceIcon name={service.icon} className="size-5" aria-hidden />
        </div>
        <CardTitle>
          <Link
            href={`/services/${service.slug}`}
            className="hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {service.title}
          </Link>
        </CardTitle>
        <CardDescription>{service.shortDescription}</CardDescription>
      </CardHeader>
      {service.price !== undefined ? (
        <CardContent>
          <p className="text-sm text-muted-foreground">
            از{" "}
            <span className="font-medium text-foreground">
              {formatRialsAsToman(service.price)}
            </span>
          </p>
        </CardContent>
      ) : null}
      <CardFooter>
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href={`/services/${service.slug}`}>جزئیات خدمت</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
