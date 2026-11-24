"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { FunnelStage } from "@/contracts/stats";
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
  count: { label: "سرنخ", color: "var(--chart-3)" },
} satisfies ChartConfig;

export function FunnelChart({ stages }: { stages: readonly FunnelStage[] }) {
  const data = stages.map((stage) => ({
    label: stage.label,
    count: stage.count,
  }));
  const total = data.reduce((sum, row) => sum + row.count, 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>قیف فروش</CardTitle>
        <CardDescription>
          وضعیت سرنخ‌های ایجادشده در بازه انتخابی
        </CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="flex h-72 items-center justify-center text-sm text-muted-foreground">
            سرنخی در این بازه برای قیف وجود ندارد.
          </p>
        ) : (
          <ChartContainer
            config={config}
            className="aspect-auto h-72 w-full"
            role="img"
            aria-label="قیف فروش"
          >
            <BarChart data={data} accessibilityLayer layout="vertical">
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="label"
                type="category"
                width={120}
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
              <Bar dataKey="count" fill="var(--color-count)" radius={4} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
