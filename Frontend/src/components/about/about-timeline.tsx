import type { AboutTimelineItem } from "@/types";
import { toPersianDigits } from "@/lib/format";

type AboutTimelineProps = {
  items: AboutTimelineItem[];
};

export function AboutTimeline({ items }: AboutTimelineProps) {
  return (
    <ol className="relative flex flex-col gap-8 border-s border-border ps-6">
      {items.map((item) => (
        <li key={item.id} className="relative">
          <span
            aria-hidden
            className="absolute -start-[1.85rem] top-1 size-3 rounded-full bg-primary ring-4 ring-background"
          />
          <time className="text-sm font-medium text-primary">
            {toPersianDigits(item.year)}
          </time>
          <h3 className="mt-1 text-base font-semibold text-foreground">
            {item.title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {item.description}
          </p>
        </li>
      ))}
    </ol>
  );
}
