import type { Metadata } from "next";
import { AdminResourcePage } from "@/components/admin/admin-resource-page";
import { LeadsManager } from "@/components/admin/leads/leads-manager";
import { createPageMetadata } from "@/lib/seo";

export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "لیدها",
  description: "فهرست و پیگیری سرنخ‌های فروش.",
  path: "/admin/leads",
  noIndex: true,
});

export default function AdminLeadsPage() {
  return (
    <AdminResourcePage permission="lead:read" areaLabel="لیدها">
      <LeadsManager />
    </AdminResourcePage>
  );
}
