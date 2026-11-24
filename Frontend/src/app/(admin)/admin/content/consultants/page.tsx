import type { Metadata } from "next";
import { Suspense } from "react";
import { ConsultantsManager } from "@/components/admin/content/consultants/consultants-manager";
import { DataTableSkeleton } from "@/components/admin/data-table/data-table-skeleton";
import { RequirePermission } from "@/components/admin/require-permission";
import { PageContainer } from "@/components/panel/page-container";
import { createPageMetadata } from "@/lib/seo";

export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "مدیریت مشاوران",
  description: "فهرست، ترتیب، ایجاد، ویرایش و حذف مشاوران.",
  path: "/admin/content/consultants",
  noIndex: true,
});

export default function AdminConsultantPage() {
  return (
    <RequirePermission permission="content:read" areaLabel="مشاوران">
      <Suspense
        fallback={
          <PageContainer>
            <DataTableSkeleton />
          </PageContainer>
        }
      >
        <ConsultantsManager />
      </Suspense>
    </RequirePermission>
  );
}
