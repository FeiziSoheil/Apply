import { Check, Minus } from "lucide-react";
import type { PricingComparisonRow, PricingPlan } from "@/types";
import { cn } from "@/lib/utils";

type PricingComparisonProps = {
  plans: PricingPlan[];
  rows: PricingComparisonRow[];
};

function CellValue({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return <span className="text-sm text-foreground">{value}</span>;
  }
  if (value) {
    return (
      <span className="inline-flex items-center gap-1 text-sm text-primary">
        <Check className="size-4" aria-hidden />
        <span className="sr-only">دارد</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-muted-foreground">
      <Minus className="size-4" aria-hidden />
      <span className="sr-only">ندارد</span>
    </span>
  );
}

export function PricingComparison({ plans, rows }: PricingComparisonProps) {
  const planById = {
    basic: plans.find((p) => p.id === "basic"),
    full: plans.find((p) => p.id === "full"),
    premium: plans.find((p) => p.id === "premium"),
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full min-w-[40rem] border-collapse text-start">
        <caption className="sr-only">مقایسه بسته‌های خدمت</caption>
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th scope="col" className="px-4 py-3 text-sm font-semibold">
              ویژگی
            </th>
            {(["basic", "full", "premium"] as const).map((id) => (
              <th
                key={id}
                scope="col"
                className={cn(
                  "px-4 py-3 text-sm font-semibold",
                  planById[id]?.highlighted && "text-primary",
                )}
              >
                {planById[id]?.name ?? id}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-border last:border-b-0">
              <th
                scope="row"
                className="px-4 py-3 text-sm font-medium text-foreground"
              >
                {row.feature}
              </th>
              <td className="px-4 py-3">
                <CellValue value={row.basic} />
              </td>
              <td className="px-4 py-3">
                <CellValue value={row.full} />
              </td>
              <td className="px-4 py-3">
                <CellValue value={row.premium} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
