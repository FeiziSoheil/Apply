import type { Metadata } from "next";
import { AdminResourcePage } from "@/components/admin/admin-resource-page";
import { ReportsPage } from "@/components/admin/reports/reports-page";
import { createPageMetadata } from "@/lib/seo";

export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "گزارش‌های CRM",
  description: "قیف، منابع و عملکرد مشاوران.",
  path: "/admin/reports",
  noIndex: true,
});

export default function AdminReportsRoute() {
  return (
    <AdminResourcePage permission="report:read" areaLabel="گزارش‌ها">
      <ReportsPage />
    </AdminResourcePage>
  );
}
