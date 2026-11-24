import type { Metadata } from "next";
import { Suspense } from "react";
import { BlogManager } from "@/components/admin/content/blog/blog-manager";
import { DataTableSkeleton } from "@/components/admin/data-table/data-table-skeleton";
import { RequirePermission } from "@/components/admin/require-permission";
import { PageContainer } from "@/components/panel/page-container";
import { createPageMetadata } from "@/lib/seo";

export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "مدیریت وبلاگ",
  description: "فهرست، ایجاد، ویرایش و حذف مقالات وبلاگ.",
  path: "/admin/content/blog",
  noIndex: true,
});

export default function AdminBlogPage() {
  return (
    <RequirePermission permission="content:read" areaLabel="وبلاگ">
      <Suspense
        fallback={
          <PageContainer>
            <DataTableSkeleton />
          </PageContainer>
        }
      >
        <BlogManager />
      </Suspense>
    </RequirePermission>
  );
}
