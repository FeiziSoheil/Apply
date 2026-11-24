import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export type SummaryRow = {
  label: string;
  value: ReactNode;
};

type StickySummaryProps = {
  title?: string;
  rows: SummaryRow[];
  cta?: {
    label: string;
    href: string;
  };
  className?: string;
};

/** Desktop sticky sidebar / mobile stacked summary card */
export function StickySummary({
  title = "خلاصه سریع",
  rows,
  cta,
  className,
}: StickySummaryProps) {
  return (
    <aside
      className={cn(
        "rounded-xl border border-border bg-card p-5 shadow-sm lg:sticky lg:top-24",
        className,
      )}
    >
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <Separator className="my-4" />
      <dl className="flex flex-col gap-4">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col gap-1">
            <dt className="text-xs text-muted-foreground">{row.label}</dt>
            <dd className="text-sm font-medium text-foreground">{row.value}</dd>
          </div>
        ))}
      </dl>
      {cta ? (
        <Button asChild className="mt-6 w-full" size="lg">
          <Link href={cta.href}>{cta.label}</Link>
        </Button>
      ) : null}
    </aside>
  );
}
