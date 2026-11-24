"use client";

import Link from "next/link";
import { useQueryState, parseAsStringLiteral } from "nuqs";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  FolderOpen,
  Percent,
  RefreshCw,
  ServerCrash,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { AdminStats, StatsMetric, StatsRangeDays } from "@/contracts/stats";
import { STATS_RANGE_DAYS } from "@/contracts/stats";
import { useSession } from "@/components/auth/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { useAdminStats } from "@/features/stats/queries";
import { getApiErrorMessage } from "@/lib/api/errors";
import { formatJalaliDate, formatNumber, toPersianDigits } from "@/lib/format";
import { PageContainer } from "../page-container";
import { PageHeader } from "../page-header";
import { FunnelChart } from "./funnel-chart";
import { LeadTrendChart } from "./lead-trend-chart";
import { TodayTasksWidget } from "./today-tasks-widget";
import { UtmSourcesChart } from "./utm-sources-chart";

const RANGE_PARSER = parseAsStringLiteral(
  STATS_RANGE_DAYS.map(String) as ["7", "30", "90"],
).withDefault("30");

const RANGE_HINT: Record<StatsRangeDays, string> = {
  7: "نسبت به ۷ روز قبل",
  30: "نسبت به ۳۰ روز قبل",
  90: "نسبت به ۹۰ روز قبل",
};

const RANGE_LEAD_LABEL: Record<StatsRangeDays, string> = {
  7: "لیدهای جدید این هفته",
  30: "لیدهای جدید ۳۰ روز",
  90: "لیدهای جدید ۹۰ روز",
};

type CardDef = {
  id: string;
  label: string;
  metric: StatsMetric;
  hint: string;
  icon: LucideIcon;
  format: "number" | "percent";
};

function formatMetricValue(value: number, format: "number" | "percent"): string {
  if (format === "percent") return `${formatNumber(value)}٪`;
  return formatNumber(value);
}

function MetricCard({ def }: { def: CardDef }) {
  const Icon = def.icon;
  const change = def.metric.changePercent;
  const direction =
    change === null || change === 0 ? null : change > 0 ? "up" : "down";
  const TrendIcon = direction === "down" ? ArrowDownLeft : ArrowUpRight;

  return (
    <Card>
      <CardHeader>
        <CardDescription className="flex items-center justify-between gap-2">
          <span>{def.label}</span>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4" aria-hidden />
          </span>
        </CardDescription>
        <CardTitle className="text-2xl font-bold tabular-nums">
          {formatMetricValue(def.metric.value, def.format)}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {direction && change !== null ? (
          <Badge variant="secondary" className="tabular-nums">
            <TrendIcon aria-hidden />
            <span className="sr-only">
              {direction === "up" ? "افزایش" : "کاهش"}
            </span>
            {formatNumber(Math.abs(change))}٪
          </Badge>
        ) : null}
        <span>{def.hint}</span>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <PageContainer aria-busy="true" aria-label="در حال بارگذاری داشبورد">
      <Skeleton className="h-16 w-full max-w-md" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-28" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-80 lg:col-span-2" />
        <Skeleton className="h-80" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-56" />
        <Skeleton className="h-56" />
      </div>
    </PageContainer>
  );
}

function RangeFilter({
  value,
  onChange,
}: {
  value: StatsRangeDays;
  onChange: (next: StatsRangeDays) => void;
}) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      value={String(value)}
      onValueChange={(next) => {
        if (next === "7" || next === "30" || next === "90") {
          onChange(Number(next) as StatsRangeDays);
        }
      }}
      aria-label="بازه زمانی آمار"
      className="justify-start"
    >
      {STATS_RANGE_DAYS.map((days) => (
        <ToggleGroupItem key={days} value={String(days)} className="px-3">
          {toPersianDigits(days)} روز
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

function ActionItemsCard({
  items,
}: {
  items: AdminStats["actionItems"];
}) {
  return (
    <Card className="flex h-72 flex-col overflow-hidden">
      <CardHeader className="shrink-0">
        <CardTitle>نیازمند اقدام</CardTitle>
        <CardDescription>
          سرنخ‌های بدون پیگیری بیش از ۲ روز و رزروهای امروز
        </CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col pe-2">
        <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto pe-2">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              موردی برای پیگیری فوری نیست.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {items.map((item) => (
                <li key={`${item.kind}-${item.id}`}>
                  <Link
                    href={item.href}
                    className="flex items-start justify-between gap-3 rounded-lg border border-transparent p-2 transition-colors hover:border-border hover:bg-muted/40"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    {item.at ? (
                      <time className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {formatJalaliDate(item.at, "MM/dd HH:mm")}
                      </time>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TodayScheduleCard({
  items,
  isConsultant,
}: {
  items: AdminStats["todaySchedule"];
  isConsultant: boolean;
}) {
  return (
    <Card className="flex h-72 flex-col overflow-hidden">
      <CardHeader className="shrink-0">
        <CardTitle>
          {isConsultant ? "برنامه امروز من" : "رزروهای امروز"}
        </CardTitle>
        <CardDescription>به وقت تهران</CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col pe-2">
        <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto pe-2">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              رزروی برای امروز ثبت نشده است.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.consultationType === "online" ? "آنلاین" : "حضوری"}
                    </p>
                  </div>
                  <time className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {formatJalaliDate(item.startsAt, "HH:mm")}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function AdminDashboardBody({
  stats,
  rangeDays,
  onRangeChange,
  isConsultant,
}: {
  stats: AdminStats;
  rangeDays: StatsRangeDays;
  onRangeChange: (next: StatsRangeDays) => void;
  isConsultant: boolean;
}) {
  const { user } = useSession();
  const cards: CardDef[] = [
    {
      id: "newLeads",
      label: RANGE_LEAD_LABEL[rangeDays],
      metric: stats.cards.newLeads,
      hint: RANGE_HINT[rangeDays],
      icon: Users,
      format: "number",
    },
    {
      id: "todayBookings",
      label: isConsultant ? "رزروهای امروز من" : "رزروهای امروز",
      metric: stats.cards.todayBookings,
      hint: "نسبت به دیروز",
      icon: CalendarClock,
      format: "number",
    },
    {
      id: "conversionRate",
      label: "نرخ تبدیل",
      metric: stats.cards.conversionRate,
      hint: RANGE_HINT[rangeDays],
      icon: Percent,
      format: "percent",
    },
    {
      id: "activeCases",
      label: isConsultant ? "پرونده‌های فعال من" : "پرونده‌های فعال",
      metric: stats.cards.activeCases,
      hint: "نسبت به شروع بازه",
      icon: FolderOpen,
      format: "number",
    },
  ];

  const isEmpty =
    stats.cards.newLeads.value === 0 &&
    stats.cards.todayBookings.value === 0 &&
    stats.leadTrend.every((point) => point.count === 0) &&
    stats.actionItems.length === 0 &&
    stats.todaySchedule.length === 0;

  return (
    <PageContainer>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title={user ? `سلام ${user.name}` : "داشبورد مدیریت"}
          description={
            isConsultant
              ? "خلاصه فعالیت‌های اختصاص‌یافته به شما."
              : "خلاصه‌ای از لیدها، پرونده‌ها و رزروهای موسسه."
          }
        />
        <RangeFilter value={rangeDays} onChange={onRangeChange} />
      </div>

      {isEmpty ? (
        <Empty className="border bg-card py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users aria-hidden />
            </EmptyMedia>
            <EmptyTitle>هنوز داده‌ای برای نمایش نیست</EmptyTitle>
            <EmptyDescription>
              با ثبت سرنخ از فرم‌های عمومی یا رزرو مشاوره، آمار اینجا به‌روز
              می‌شود.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <section
            aria-label="آمار کلیدی"
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            {cards.map((card) => (
              <MetricCard key={card.id} def={card} />
            ))}
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <LeadTrendChart
              points={stats.leadTrend}
              rangeDays={rangeDays}
            />
            <UtmSourcesChart points={stats.utmSources} />
          </div>

          <div className="grid items-stretch gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <FunnelChart stages={stats.funnel} />
            </div>
            <TodayTasksWidget />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ActionItemsCard items={stats.actionItems} />
            <TodayScheduleCard
              items={stats.todaySchedule}
              isConsultant={isConsultant}
            />
          </div>
        </>
      )}
    </PageContainer>
  );
}

/** Staff dashboard backed by `GET /admin/stats` */
export function AdminDashboard() {
  const { user } = useSession();
  const [rangeParam, setRangeParam] = useQueryState("rangeDays", RANGE_PARSER);
  const rangeDays = Number(rangeParam) as StatsRangeDays;

  const query = useAdminStats(rangeDays, { enabled: Boolean(user) });

  if (!user) return <DashboardSkeleton />;

  if (query.isPending && !query.data) return <DashboardSkeleton />;

  if (query.isError) {
    return (
      <PageContainer>
        <PageHeader
          title={`سلام ${user.name}`}
          description="داشبورد مدیریت"
        />
        <Empty className="border bg-card py-12" role="alert">
          <EmptyHeader>
            <EmptyMedia
              variant="icon"
              className="bg-destructive/10 text-destructive"
            >
              <ServerCrash aria-hidden />
            </EmptyMedia>
            <EmptyTitle>دریافت آمار انجام نشد</EmptyTitle>
            <EmptyDescription>
              {getApiErrorMessage(query.error)}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              type="button"
              variant="outline"
              onClick={() => void query.refetch()}
            >
              <RefreshCw data-icon="inline-start" aria-hidden />
              تلاش دوباره
            </Button>
          </EmptyContent>
        </Empty>
      </PageContainer>
    );
  }

  if (!query.data) return <DashboardSkeleton />;

  return (
    <AdminDashboardBody
      stats={query.data}
      rangeDays={rangeDays}
      onRangeChange={(next) => {
        void setRangeParam(String(next) as "7" | "30" | "90");
      }}
      isConsultant={user.role === "consultant"}
    />
  );
}
