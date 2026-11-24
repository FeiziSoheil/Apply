import type { Metadata } from "next";
import { Suspense } from "react";
import { ConsultantFormPage } from "@/components/admin/content/consultants/consultants-form-page";
import { DataTableSkeleton } from "@/components/admin/data-table/data-table-skeleton";
import { RequirePermission } from "@/components/admin/require-permission";
import { PageContainer } from "@/components/panel/page-container";
import { createPageMetadata } from "@/lib/seo";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "ویرایش مشاور",
  description: "ویرایش مشاور.",
  path: "/admin/content/consultants",
  noIndex: true,
});

export default async function AdminEditConsultantPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <RequirePermission permission="content:write" areaLabel="ویرایش مشاور">
      <Suspense
        fallback={
          <PageContainer>
            <DataTableSkeleton />
          </PageContainer>
        }
      >
        <ConsultantFormPage mode="edit" consultantId={id} />
      </Suspense>
    </RequirePermission>
  );
}
