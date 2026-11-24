import type { Metadata } from "next";
import { Suspense } from "react";
import { UniversityFormPage } from "@/components/admin/content/universities/university-form-page";
import { DataTableSkeleton } from "@/components/admin/data-table/data-table-skeleton";
import { RequirePermission } from "@/components/admin/require-permission";
import { PageContainer } from "@/components/panel/page-container";
import { createPageMetadata } from "@/lib/seo";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "ویرایش دانشگاه",
  description: "ویرایش اطلاعات دانشگاه.",
  path: "/admin/content/universities",
  noIndex: true,
});

export default async function AdminEditUniversityPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <RequirePermission permission="content:write" areaLabel="ویرایش دانشگاه">
      <Suspense
        fallback={
          <PageContainer>
            <DataTableSkeleton />
          </PageContainer>
        }
      >
        <UniversityFormPage mode="edit" universityId={id} />
      </Suspense>
    </RequirePermission>
  );
}
