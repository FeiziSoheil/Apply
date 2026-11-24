import Link from "next/link";
import type { PricingPlan } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type PricingPlansProps = {
  plans: PricingPlan[];
};

export function PricingPlans({ plans }: PricingPlansProps) {
  return (
    <ul className="grid gap-4 lg:grid-cols-3">
      {plans.map((plan) => (
        <li key={plan.id}>
          <Card
            className={cn(
              "h-full",
              plan.highlighted && "border-primary shadow-sm",
            )}
          >
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>{plan.name}</CardTitle>
                {plan.highlighted ? (
                  <Badge>پیشنهادی</Badge>
                ) : null}
              </div>
              <CardDescription>{plan.tagline}</CardDescription>
              <p className="pt-2 text-2xl font-bold text-foreground">
                {formatPrice(plan.priceFrom)}
              </p>
              <p className="text-xs text-muted-foreground">{plan.priceNote}</p>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-2.5">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-primary"
                      aria-hidden
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                asChild
                className="w-full"
                variant={plan.highlighted ? "default" : "outline"}
              >
                <Link href="/booking">درخواست این بسته</Link>
              </Button>
            </CardFooter>
          </Card>
        </li>
      ))}
    </ul>
  );
}
