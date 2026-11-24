import type { Metadata } from "next";
import { Suspense } from "react";
import { ConsultantFormPage } from "@/components/admin/content/consultants/consultants-form-page";
import { DataTableSkeleton } from "@/components/admin/data-table/data-table-skeleton";
import { RequirePermission } from "@/components/admin/require-permission";
import { PageContainer } from "@/components/panel/page-container";
import { createPageMetadata } from "@/lib/seo";

export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "افزودن مشاور",
  description: "ایجاد مشاور جدید.",
  path: "/admin/content/consultants/new",
  noIndex: true,
});

export default function AdminCreateConsultantPage() {
  return (
    <RequirePermission permission="content:write" areaLabel="افزودن مشاور">
      <Suspense
        fallback={
          <PageContainer>
            <DataTableSkeleton />
          </PageContainer>
        }
      >
        <ConsultantFormPage mode="create" />
      </Suspense>
    </RequirePermission>
  );
}
