import type { Metadata } from "next";
import { Suspense } from "react";
import { SuccessStoryFormPage } from "@/components/admin/content/success-stories/success-stories-form-page";
import { DataTableSkeleton } from "@/components/admin/data-table/data-table-skeleton";
import { RequirePermission } from "@/components/admin/require-permission";
import { PageContainer } from "@/components/panel/page-container";
import { createPageMetadata } from "@/lib/seo";

export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "افزودن داستان موفقیت",
  description: "ایجاد داستان موفقیت جدید.",
  path: "/admin/content/success-stories/new",
  noIndex: true,
});

export default function AdminCreateSuccessStoryPage() {
  return (
    <RequirePermission permission="content:write" areaLabel="افزودن داستان موفقیت">
      <Suspense
        fallback={
          <PageContainer>
            <DataTableSkeleton />
          </PageContainer>
        }
      >
        <SuccessStoryFormPage mode="create" />
      </Suspense>
    </RequirePermission>
  );
}
