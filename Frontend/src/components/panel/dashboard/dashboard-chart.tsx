"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { DashboardChartData } from "@/data/panel-dashboard";
import { formatNumber } from "@/lib/format";

const SERIES_COLORS = ["var(--chart-1)", "var(--chart-2)"] as const;

/**
 * Bar / area chart card built on shadcn `Chart` (Recharts). Recharts draws in
 * LTR, so the X axis is reversed and the Y axis sits at the end edge to read
 * naturally in RTL. Colors come from the `--chart-*` design tokens.
 */
export function DashboardChart({ chart }: { chart: DashboardChartData }) {
  const config: ChartConfig = Object.fromEntries(
    chart.series.map((series, index) => [
      series.key,
      {
        label: series.label,
        color: SERIES_COLORS[index % SERIES_COLORS.length],
      },
    ]),
  );

  const axes = (
    <>
      <CartesianGrid vertical={false} />
      <XAxis
        dataKey="label"
        reversed
        tickLine={false}
        axisLine={false}
        tickMargin={8}
      />
      <YAxis
        orientation="right"
        tickLine={false}
        axisLine={false}
        width={36}
        tickFormatter={(value: number) => formatNumber(value)}
      />
      <ChartTooltip content={<ChartTooltipContent />} />
      <ChartLegend content={<ChartLegendContent />} />
    </>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{chart.title}</CardTitle>
        <CardDescription>{chart.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={config}
          className="aspect-auto h-64 w-full"
          role="img"
          aria-label={chart.title}
        >
          {chart.variant === "area" ? (
            <AreaChart data={[...chart.data]} accessibilityLayer>
              {axes}
              {chart.series.map((series) => (
                <Area
                  key={series.key}
                  dataKey={series.key}
                  type="monotone"
                  stroke={`var(--color-${series.key})`}
                  fill={`var(--color-${series.key})`}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          ) : (
            <BarChart data={[...chart.data]} accessibilityLayer>
              {axes}
              {chart.series.map((series) => (
                <Bar
                  key={series.key}
                  dataKey={series.key}
                  fill={`var(--color-${series.key})`}
                  radius={4}
                />
              ))}
            </BarChart>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
