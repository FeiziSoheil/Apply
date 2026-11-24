import type { Metadata } from "next";
import { Suspense } from "react";
import { NewsManager } from "@/components/admin/content/news/news-manager";
import { DataTableSkeleton } from "@/components/admin/data-table/data-table-skeleton";
import { RequirePermission } from "@/components/admin/require-permission";
import { PageContainer } from "@/components/panel/page-container";
import { createPageMetadata } from "@/lib/seo";

export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "مدیریت اخبار",
  description: "فهرست، ایجاد، ویرایش و حذف اخبار.",
  path: "/admin/content/news",
  noIndex: true,
});

export default function AdminNewsPage() {
  return (
    <RequirePermission permission="content:read" areaLabel="اخبار">
      <Suspense
        fallback={
          <PageContainer>
            <DataTableSkeleton />
          </PageContainer>
        }
      >
        <NewsManager />
      </Suspense>
    </RequirePermission>
  );
}
