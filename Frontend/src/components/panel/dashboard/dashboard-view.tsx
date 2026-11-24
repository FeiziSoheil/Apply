"use client";

import { useSession } from "@/components/auth/auth-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { DASHBOARD_DATA } from "@/data/panel-dashboard";
import { AREA_ROLES, type AuthArea } from "@/lib/auth/routes";
import { filterByPermission } from "@/lib/rbac/nav";
import { PageContainer } from "../page-container";
import { PageHeader } from "../page-header";
import { ActivityList } from "./activity-list";
import { AdminDashboard } from "./admin-dashboard";
import { DashboardChart } from "./dashboard-chart";
import { StatCard } from "./stat-card";

const PANEL_COPY = {
  title: "داشبورد دانشجو",
  description: "وضعیت پرونده، مدارک، پیام‌ها و پرداخت‌های شما در یک نگاه.",
} as const;

function DashboardSkeleton() {
  return (
    <PageContainer aria-busy="true" aria-label="در حال بارگذاری داشبورد">
      <Skeleton className="h-16 w-full max-w-md" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-28" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-80 lg:col-span-2" />
        <Skeleton className="h-80" />
      </div>
    </PageContainer>
  );
}

/**
 * `/admin` uses live `GET /admin/stats`. `/panel` stays on the static student
 * mock until a student stats endpoint exists.
 */
export function DashboardView({ area }: { area: AuthArea }) {
  const { user } = useSession();

  if (!user) return <DashboardSkeleton />;
  if (!AREA_ROLES[area].includes(user.role)) return null;

  if (area === "admin") {
    return <AdminDashboard />;
  }

  const data = DASHBOARD_DATA[user.role];
  const stats = filterByPermission(data.stats, user);

  return (
    <PageContainer>
      <PageHeader
        title={`سلام ${user.name}`}
        description={`${PANEL_COPY.title} — ${PANEL_COPY.description}`}
      />

      <section
        aria-label="آمار کلیدی"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {stats.map((stat) => (
          <StatCard key={stat.id} stat={stat} />
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardChart chart={data.chart} />
        </div>
        <ActivityList items={data.activity} />
      </div>
    </PageContainer>
  );
}
