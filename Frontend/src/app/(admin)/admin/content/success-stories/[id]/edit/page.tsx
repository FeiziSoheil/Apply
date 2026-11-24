import type { Metadata } from "next";
import { Suspense } from "react";
import { SuccessStoryFormPage } from "@/components/admin/content/success-stories/success-stories-form-page";
import { DataTableSkeleton } from "@/components/admin/data-table/data-table-skeleton";
import { RequirePermission } from "@/components/admin/require-permission";
import { PageContainer } from "@/components/panel/page-container";
import { createPageMetadata } from "@/lib/seo";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "ویرایش داستان موفقیت",
  description: "ویرایش داستان موفقیت.",
  path: "/admin/content/success-stories",
  noIndex: true,
});

export default async function AdminEditSuccessStoryPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <RequirePermission permission="content:write" areaLabel="ویرایش داستان موفقیت">
      <Suspense
        fallback={
          <PageContainer>
            <DataTableSkeleton />
          </PageContainer>
        }
      >
        <SuccessStoryFormPage mode="edit" storyId={id} />
      </Suspense>
    </RequirePermission>
  );
}
