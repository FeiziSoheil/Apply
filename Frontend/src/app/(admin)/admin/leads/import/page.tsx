import type { Metadata } from "next";
import { AdminResourcePage } from "@/components/admin/admin-resource-page";
import { LeadImportWizard } from "@/components/admin/leads/lead-import-wizard";
import { createPageMetadata } from "@/lib/seo";

export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "ورود لید از فایل",
  description: "ورود دسته‌ای سرنخ‌ها از CSV یا Excel.",
  path: "/admin/leads/import",
  noIndex: true,
});

export default function AdminLeadsImportPage() {
  return (
    <AdminResourcePage permission="lead:import" areaLabel="ورود لید">
      <LeadImportWizard />
    </AdminResourcePage>
  );
}
