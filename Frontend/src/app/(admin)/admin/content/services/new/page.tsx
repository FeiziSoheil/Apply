import type { Metadata } from "next";
import { Suspense } from "react";
import { ServiceFormPage } from "@/components/admin/content/services/services-form-page";
import { DataTableSkeleton } from "@/components/admin/data-table/data-table-skeleton";
import { RequirePermission } from "@/components/admin/require-permission";
import { PageContainer } from "@/components/panel/page-container";
import { createPageMetadata } from "@/lib/seo";

export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "افزودن خدمت",
  description: "ایجاد خدمت جدید.",
  path: "/admin/content/services/new",
  noIndex: true,
});

export default function AdminCreateServicePage() {
  return (
    <RequirePermission permission="content:write" areaLabel="افزودن خدمت">
      <Suspense
        fallback={
          <PageContainer>
            <DataTableSkeleton />
          </PageContainer>
        }
      >
        <ServiceFormPage mode="create" />
      </Suspense>
    </RequirePermission>
  );
}
