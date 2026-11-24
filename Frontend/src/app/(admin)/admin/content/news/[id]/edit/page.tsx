import type { Metadata } from "next";
import { Suspense } from "react";
import { NewsFormPage } from "@/components/admin/content/news/news-form-page";
import { DataTableSkeleton } from "@/components/admin/data-table/data-table-skeleton";
import { RequirePermission } from "@/components/admin/require-permission";
import { PageContainer } from "@/components/panel/page-container";
import { createPageMetadata } from "@/lib/seo";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "ویرایش خبر",
  description: "ویرایش خبر.",
  path: "/admin/content/news",
  noIndex: true,
});

export default async function AdminEditNewsPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <RequirePermission permission="content:write" areaLabel="ویرایش خبر">
      <Suspense
        fallback={
          <PageContainer>
            <DataTableSkeleton />
          </PageContainer>
        }
      >
        <NewsFormPage mode="edit" newsId={id} />
      </Suspense>
    </RequirePermission>
  );
}
