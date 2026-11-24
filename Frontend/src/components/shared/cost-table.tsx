import type { CostBreakdownItem } from "@/types";
import { cn } from "@/lib/utils";

type CostTableProps = {
  items: CostBreakdownItem[];
  caption?: string;
  className?: string;
};

export function CostTable({
  items,
  caption = "برآورد هزینه‌ها",
  className,
}: CostTableProps) {
  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        "overflow-x-auto rounded-xl border border-border",
        className,
      )}
    >
      <table className="w-full min-w-[20rem] text-start text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-muted/60">
          <tr>
            <th
              scope="col"
              className="px-4 py-3 text-start font-medium text-foreground"
            >
              مورد
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-start font-medium text-foreground"
            >
              مبلغ تقریبی
            </th>
            <th
              scope="col"
              className="hidden px-4 py-3 text-start font-medium text-foreground sm:table-cell"
            >
              توضیح
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              className="border-t border-border odd:bg-card even:bg-muted/20"
            >
              <th
                scope="row"
                className="px-4 py-3 font-medium text-foreground"
              >
                {item.label}
              </th>
              <td className="px-4 py-3 text-foreground">{item.amount}</td>
              <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                {item.note ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
