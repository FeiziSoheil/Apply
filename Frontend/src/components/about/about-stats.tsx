import type { AboutStat } from "@/types";
import { formatNumber } from "@/lib/format";

type AboutStatsProps = {
  stats: AboutStat[];
};

export function AboutStats({ stats }: AboutStatsProps) {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
      {stats.map((stat) => (
        <li
          key={stat.id}
          className="flex flex-col items-center gap-1 rounded-2xl bg-primary px-3 py-6 text-center text-primary-foreground"
        >
          <p className="text-2xl font-bold sm:text-3xl">
            {formatNumber(stat.value)}
            {stat.suffix ?? ""}
          </p>
          <p className="text-sm text-primary-foreground/80">{stat.label}</p>
        </li>
      ))}
    </ul>
  );
}
