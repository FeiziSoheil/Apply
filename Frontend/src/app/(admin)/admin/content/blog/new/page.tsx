import type { Metadata } from "next";
import { Suspense } from "react";
import { BlogFormPage } from "@/components/admin/content/blog/blog-form-page";
import { DataTableSkeleton } from "@/components/admin/data-table/data-table-skeleton";
import { RequirePermission } from "@/components/admin/require-permission";
import { PageContainer } from "@/components/panel/page-container";
import { createPageMetadata } from "@/lib/seo";

export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "نوشتن مقاله",
  description: "ایجاد مقالهٔ جدید وبلاگ.",
  path: "/admin/content/blog/new",
  noIndex: true,
});

export default function AdminCreateBlogPostPage() {
  return (
    <RequirePermission permission="content:write" areaLabel="نوشتن مقاله">
      <Suspense
        fallback={
          <PageContainer>
            <DataTableSkeleton />
          </PageContainer>
        }
      >
        <BlogFormPage mode="create" />
      </Suspense>
    </RequirePermission>
  );
}
