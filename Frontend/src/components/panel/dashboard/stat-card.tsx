import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardStat } from "@/data/panel-dashboard";

/** One KPI tile of the dashboard */
export function StatCard({ stat }: { stat: DashboardStat }) {
  const Icon = stat.icon;
  const TrendIcon = stat.trend?.direction === "down" ? ArrowDownLeft : ArrowUpRight;

  return (
    <Card>
      <CardHeader>
        <CardDescription className="flex items-center justify-between gap-2">
          <span>{stat.label}</span>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4" aria-hidden />
          </span>
        </CardDescription>
        <CardTitle className="text-2xl font-bold tabular-nums">
          {stat.value}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {stat.trend ? (
          <Badge variant="secondary" className="tabular-nums">
            <TrendIcon aria-hidden />
            <span className="sr-only">
              {stat.trend.direction === "up" ? "افزایش" : "کاهش"}
            </span>
            {stat.trend.label}
          </Badge>
        ) : null}
        <span>{stat.hint}</span>
      </CardContent>
    </Card>
  );
}
