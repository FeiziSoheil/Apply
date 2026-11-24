import type { Metadata } from "next";
import { Suspense } from "react";
import { UniversityFormPage } from "@/components/admin/content/universities/university-form-page";
import { DataTableSkeleton } from "@/components/admin/data-table/data-table-skeleton";
import { RequirePermission } from "@/components/admin/require-permission";
import { PageContainer } from "@/components/panel/page-container";
import { createPageMetadata } from "@/lib/seo";

export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "افزودن دانشگاه",
  description: "ایجاد دانشگاه جدید.",
  path: "/admin/content/universities/new",
  noIndex: true,
});

export default function AdminCreateUniversityPage() {
  return (
    <RequirePermission permission="content:write" areaLabel="افزودن دانشگاه">
      <Suspense
        fallback={
          <PageContainer>
            <DataTableSkeleton />
          </PageContainer>
        }
      >
        <UniversityFormPage mode="create" />
      </Suspense>
    </RequirePermission>
  );
}
