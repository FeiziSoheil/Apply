import type { Metadata } from "next";
import { AdminResourcePage } from "@/components/admin/admin-resource-page";
import { CasesManager } from "@/components/admin/cases/cases-manager";
import { createPageMetadata } from "@/lib/seo";

export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "پرونده‌ها",
  description: "مراحل پرونده، چک‌لیست و مدارک دانشجویان.",
  path: "/admin/cases",
  noIndex: true,
});

export default function AdminCasesPage() {
  return (
    <AdminResourcePage permission="case:read" areaLabel="پرونده‌ها">
      <CasesManager />
    </AdminResourcePage>
  );
}
