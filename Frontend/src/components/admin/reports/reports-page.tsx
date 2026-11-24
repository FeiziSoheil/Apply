"use client";

import { useMemo } from "react";
import { useSession } from "@/components/auth/auth-provider";
import { PageContainer } from "@/components/panel/page-container";
import { PageHeader } from "@/components/panel/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useConsultantsReport,
  useFunnelReport,
  useSourcesReport,
  useTicketsReport,
} from "@/features/reports/queries";
import { formatNumber } from "@/lib/format";
import { LEAD_SOURCE_LABELS } from "@/components/admin/leads/lead-labels";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function formatRate(rate: number): string {
  return `${formatNumber(Math.round(rate * 1000) / 10)}٪`;
}

function formatDurationMs(ms: number | null): string {
  if (ms === null) return "—";
  const hours = ms / 3_600_000;
  if (hours < 1) {
    return `${formatNumber(Math.round(ms / 60_000))} دقیقه`;
  }
  return `${formatNumber(Math.round(hours * 10) / 10)} ساعت`;
}

function defaultRange() {
  const to = new Date();
  const from = new Date(to.getTime() - 90 * 86_400_000);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function ReportsPage() {
  const { user } = useSession();
  const range = useMemo(() => defaultRange(), []);
  const funnel = useFunnelReport(range);
  const sources = useSourcesReport(range);
  const consultants = useConsultantsReport(range, {
    enabled: user?.role === "admin",
  });
  const tickets = useTicketsReport(range);

  return (
    <PageContainer>
      <PageHeader
        title="گزارش‌های CRM"
        description="قیف پایپ‌لاین، منابع، تیکت‌ها و عملکرد مشاوران در ۹۰ روز گذشته."
      />

      <Tabs defaultValue="crm" className="gap-4">
        <TabsList>
          <TabsTrigger value="crm">قیف و منابع</TabsTrigger>
          <TabsTrigger value="tickets">تیکت‌ها</TabsTrigger>
        </TabsList>

        <TabsContent value="crm" className="mt-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>قیف فروش</CardTitle>
            <CardDescription>
              نرخ تبدیل کلی:{" "}
              {funnel.data
                ? formatRate(funnel.data.conversionRate)
                : "—"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {funnel.isPending ? (
              <p className="text-muted-foreground text-sm">در حال بارگذاری…</p>
            ) : funnel.isError ? (
              <p className="text-destructive text-sm">خطا در دریافت قیف</p>
            ) : (
              (funnel.data?.stages ?? []).map((stage) => (
                <div
                  key={stage.stageId}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="truncate">{stage.title}</span>
                  <Badge variant="secondary" className="tabular-nums">
                    {formatNumber(stage.count)}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>منابع سرنخ</CardTitle>
            <CardDescription>تعداد و نرخ برد بر اساس منبع</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {sources.isPending ? (
              <p className="text-muted-foreground text-sm">در حال بارگذاری…</p>
            ) : sources.isError ? (
              <p className="text-destructive text-sm">خطا در دریافت منابع</p>
            ) : (sources.data?.rows.length ?? 0) === 0 ? (
              <p className="text-muted-foreground text-sm">داده‌ای نیست</p>
            ) : (
              (sources.data?.rows ?? []).map((row) => (
                <div
                  key={row.source}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="truncate">
                    {LEAD_SOURCE_LABELS[
                      row.source as keyof typeof LEAD_SOURCE_LABELS
                    ] ?? row.source}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {formatNumber(row.count)} ·{" "}
                    {formatRate(row.conversionRate)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {user?.role === "admin" ? (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>عملکرد مشاوران</CardTitle>
              <CardDescription>
                تخصیص، برد، ریزش و کارهای باز هر مشاور
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {consultants.isPending ? (
                <p className="text-muted-foreground text-sm">در حال بارگذاری…</p>
              ) : consultants.isError ? (
                <p className="text-destructive text-sm">خطا در دریافت مشاوران</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-start">
                      <th className="py-2 pe-3 font-medium">مشاور</th>
                      <th className="py-2 pe-3 font-medium">تخصیص</th>
                      <th className="py-2 pe-3 font-medium">برد</th>
                      <th className="py-2 pe-3 font-medium">ریزش</th>
                      <th className="py-2 pe-3 font-medium">کار باز</th>
                      <th className="py-2 font-medium">نرخ تبدیل</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(consultants.data?.rows ?? []).map((row) => (
                      <tr key={row.consultantId} className="border-b last:border-0">
                        <td className="py-2 pe-3">{row.name}</td>
                        <td className="py-2 pe-3 tabular-nums">
                          {formatNumber(row.leadsAssigned)}
                        </td>
                        <td className="py-2 pe-3 tabular-nums">
                          {formatNumber(row.leadsWon)}
                        </td>
                        <td className="py-2 pe-3 tabular-nums">
                          {formatNumber(row.leadsLost)}
                        </td>
                        <td className="py-2 pe-3 tabular-nums">
                          {formatNumber(row.openTasks)}
                        </td>
                        <td className="py-2 tabular-nums">
                          {formatRate(row.conversionRate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>
        </TabsContent>

        <TabsContent value="tickets" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>آمار تیکت‌ها</CardTitle>
              <CardDescription>
                میانگین زمان اولین پاسخ کارکنان و میانگین امتیاز دانشجویان
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tickets.isPending ? (
                <p className="text-muted-foreground text-sm">در حال بارگذاری…</p>
              ) : tickets.isError ? (
                <p className="text-destructive text-sm">خطا در دریافت آمار تیکت</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-lg border p-4">
                    <p className="text-xs text-muted-foreground">کل تیکت‌ها</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums">
                      {formatNumber(tickets.data?.totalTickets ?? 0)}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs text-muted-foreground">باز / بسته</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums">
                      {formatNumber(tickets.data?.openTickets ?? 0)} /{" "}
                      {formatNumber(tickets.data?.closedTickets ?? 0)}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs text-muted-foreground">
                      میانگین اولین پاسخ
                    </p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums">
                      {formatDurationMs(tickets.data?.avgFirstResponseMs ?? null)}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs text-muted-foreground">
                      میانگین امتیاز
                    </p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums">
                      {tickets.data?.avgRating != null
                        ? formatNumber(
                            Math.round(tickets.data.avgRating * 10) / 10,
                          )
                        : "—"}
                      {tickets.data?.ratedCount
                        ? ` (${formatNumber(tickets.data.ratedCount)})`
                        : null}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
