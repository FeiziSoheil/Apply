import type { Metadata } from "next";
import { Suspense } from "react";
import { SuccessStoriesManager } from "@/components/admin/content/success-stories/success-stories-manager";
import { DataTableSkeleton } from "@/components/admin/data-table/data-table-skeleton";
import { RequirePermission } from "@/components/admin/require-permission";
import { PageContainer } from "@/components/panel/page-container";
import { createPageMetadata } from "@/lib/seo";

export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "مدیریت داستان‌های موفقیت",
  description: "فهرست، ترتیب، ایجاد، ویرایش و حذف داستان‌های موفقیت.",
  path: "/admin/content/success-stories",
  noIndex: true,
});

export default function AdminSuccessStoryPage() {
  return (
    <RequirePermission permission="content:read" areaLabel="داستان‌های موفقیت">
      <Suspense
        fallback={
          <PageContainer>
            <DataTableSkeleton />
          </PageContainer>
        }
      >
        <SuccessStoriesManager />
      </Suspense>
    </RequirePermission>
  );
}
