import type { Metadata } from "next";
import { Suspense } from "react";
import { ProgramsManager } from "@/components/admin/content/programs/programs-manager";
import { DataTableSkeleton } from "@/components/admin/data-table/data-table-skeleton";
import { RequirePermission } from "@/components/admin/require-permission";
import { PageContainer } from "@/components/panel/page-container";
import { createPageMetadata } from "@/lib/seo";

export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "مدیریت برنامه‌ها",
  description: "فهرست، ایجاد، ویرایش و حذف برنامه‌های تحصیلی.",
  path: "/admin/content/programs",
  noIndex: true,
});

export default function AdminProgramsPage() {
  return (
    <RequirePermission permission="content:read" areaLabel="برنامه‌ها">
      <Suspense
        fallback={
          <PageContainer>
            <DataTableSkeleton />
          </PageContainer>
        }
      >
        <ProgramsManager />
      </Suspense>
    </RequirePermission>
  );
}
