import type { Metadata } from "next";
import { Suspense } from "react";
import { AnnouncementsManager } from "@/components/admin/content/announcements/announcements-manager";
import { DataTableSkeleton } from "@/components/admin/data-table/data-table-skeleton";
import { RequirePermission } from "@/components/admin/require-permission";
import { PageContainer } from "@/components/panel/page-container";
import { createPageMetadata } from "@/lib/seo";

export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "اعلان‌های پنل دانشجو",
  description: "فهرست، ایجاد، ویرایش و حذف اعلان‌های پنل دانشجو.",
  path: "/admin/content/announcements",
  noIndex: true,
});

export default function AdminAnnouncementsPage() {
  return (
    <RequirePermission permission="content:read" areaLabel="اعلان‌ها">
      <Suspense
        fallback={
          <PageContainer>
            <DataTableSkeleton />
          </PageContainer>
        }
      >
        <AnnouncementsManager />
      </Suspense>
    </RequirePermission>
  );
}
