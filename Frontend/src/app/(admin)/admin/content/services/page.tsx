import type { Metadata } from "next";
import { Suspense } from "react";
import { ServicesManager } from "@/components/admin/content/services/services-manager";
import { DataTableSkeleton } from "@/components/admin/data-table/data-table-skeleton";
import { RequirePermission } from "@/components/admin/require-permission";
import { PageContainer } from "@/components/panel/page-container";
import { createPageMetadata } from "@/lib/seo";

export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "مدیریت خدمات",
  description: "فهرست، ترتیب، ایجاد، ویرایش و حذف خدمات.",
  path: "/admin/content/services",
  noIndex: true,
});

export default function AdminServicePage() {
  return (
    <RequirePermission permission="content:read" areaLabel="خدمات">
      <Suspense
        fallback={
          <PageContainer>
            <DataTableSkeleton />
          </PageContainer>
        }
      >
        <ServicesManager />
      </Suspense>
    </RequirePermission>
  );
}
