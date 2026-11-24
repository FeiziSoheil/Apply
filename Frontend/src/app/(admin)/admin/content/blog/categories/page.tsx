import type { Metadata } from "next";
import { Suspense } from "react";
import { BlogCategoriesManager } from "@/components/admin/content/blog-categories/blog-categories-manager";
import { DataTableSkeleton } from "@/components/admin/data-table/data-table-skeleton";
import { RequirePermission } from "@/components/admin/require-permission";
import { PageContainer } from "@/components/panel/page-container";
import { createPageMetadata } from "@/lib/seo";

export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "دسته‌های وبلاگ",
  description: "مدیریت دسته‌بندی مقالات وبلاگ.",
  path: "/admin/content/blog/categories",
  noIndex: true,
});

export default function AdminBlogCategoriesPage() {
  return (
    <RequirePermission permission="content:read" areaLabel="دسته‌های وبلاگ">
      <Suspense
        fallback={
          <PageContainer>
            <DataTableSkeleton />
          </PageContainer>
        }
      >
        <BlogCategoriesManager />
      </Suspense>
    </RequirePermission>
  );
}
