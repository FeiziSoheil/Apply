"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { UtmSourcePoint } from "@/contracts/stats";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatNumber } from "@/lib/format";

const config = {
  count: { label: "سرنخ", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function UtmSourcesChart({
  points,
}: {
  points: readonly UtmSourcePoint[];
}) {
  const data = points.map((point) => ({
    label: point.source,
    count: point.count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>منابع جذب (UTM)</CardTitle>
        <CardDescription>توزیع utm.source در بازه انتخابی</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            منبعی در این بازه ثبت نشده است.
          </p>
        ) : (
          <ChartContainer
            config={config}
            className="aspect-auto h-64 w-full"
            role="img"
            aria-label="منابع جذب"
          >
            <BarChart data={data} accessibilityLayer layout="vertical">
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="label"
                type="category"
                width={88}
                tickLine={false}
                axisLine={false}
                orientation="right"
              />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                tickFormatter={(value: number) => formatNumber(value)}
                reversed
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="count"
                fill="var(--color-count)"
                radius={4}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
