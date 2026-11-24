import type { Metadata } from "next";
import { Suspense } from "react";
import { DataTableSkeleton } from "@/components/admin/data-table/data-table-skeleton";
import { UniversitiesManager } from "@/components/admin/content/universities/universities-manager";
import { RequirePermission } from "@/components/admin/require-permission";
import { PageContainer } from "@/components/panel/page-container";
import { createPageMetadata } from "@/lib/seo";

export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "مدیریت دانشگاه‌ها",
  description: "فهرست، ایجاد، ویرایش و حذف دانشگاه‌ها.",
  path: "/admin/content/universities",
  noIndex: true,
});

export default function AdminUniversitiesPage() {
  return (
    <RequirePermission permission="content:read" areaLabel="دانشگاه‌ها">
      <Suspense
        fallback={
          <PageContainer>
            <DataTableSkeleton />
          </PageContainer>
        }
      >
        <UniversitiesManager />
      </Suspense>
    </RequirePermission>
  );
}
