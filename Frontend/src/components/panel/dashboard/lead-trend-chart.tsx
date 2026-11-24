"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { LeadTrendPoint, StatsRangeDays } from "@/contracts/stats";
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
import { formatJalaliDate, formatNumber, toPersianDigits } from "@/lib/format";

const config = {
  count: { label: "لید جدید", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function LeadTrendChart({
  points,
  rangeDays,
}: {
  points: readonly LeadTrendPoint[];
  rangeDays: StatsRangeDays;
}) {
  const data = points.map((point) => ({
    label: formatJalaliDate(point.date, rangeDays > 30 ? "MM/dd" : "d MMM"),
    count: point.count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          روند لید — {toPersianDigits(rangeDays)} روز
        </CardTitle>
        <CardDescription>تعداد سرنخ ثبت‌شده در هر روز</CardDescription>
      </CardHeader>
      <CardContent>
        {data.every((row) => row.count === 0) ? (
          <p className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            در این بازه سرنخی ثبت نشده است.
          </p>
        ) : (
          <ChartContainer
            config={config}
            className="aspect-auto h-64 w-full"
            role="img"
            aria-label="روند لید"
          >
            <AreaChart data={data} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                reversed
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <YAxis
                orientation="right"
                tickLine={false}
                axisLine={false}
                width={36}
                allowDecimals={false}
                tickFormatter={(value: number) => formatNumber(value)}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                dataKey="count"
                type="monotone"
                stroke="var(--color-count)"
                fill="var(--color-count)"
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
