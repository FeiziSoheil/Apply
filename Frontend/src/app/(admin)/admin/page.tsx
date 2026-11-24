import type { Metadata } from "next";
import { DashboardView } from "@/components/panel/dashboard/dashboard-view";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "داشبورد مدیریت",
  description: "خلاصه فعالیت‌های موسسه برای مدیران و مشاوران.",
  path: "/admin",
  noIndex: true,
});

export default function AdminPage() {
  return <DashboardView area="admin" />;
}
