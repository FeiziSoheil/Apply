import type { Metadata } from "next";
import { Suspense } from "react";
import { BlogFormPage } from "@/components/admin/content/blog/blog-form-page";
import { DataTableSkeleton } from "@/components/admin/data-table/data-table-skeleton";
import { RequirePermission } from "@/components/admin/require-permission";
import { PageContainer } from "@/components/panel/page-container";
import { createPageMetadata } from "@/lib/seo";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "ویرایش مقاله",
  description: "ویرایش مقالهٔ وبلاگ.",
  path: "/admin/content/blog",
  noIndex: true,
});

export default async function AdminEditBlogPostPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <RequirePermission permission="content:write" areaLabel="ویرایش مقاله">
      <Suspense
        fallback={
          <PageContainer>
            <DataTableSkeleton />
          </PageContainer>
        }
      >
        <BlogFormPage mode="edit" postId={id} />
      </Suspense>
    </RequirePermission>
  );
}
