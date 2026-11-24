import type { Metadata } from "next";
import { Suspense } from "react";
import { ServiceFormPage } from "@/components/admin/content/services/services-form-page";
import { DataTableSkeleton } from "@/components/admin/data-table/data-table-skeleton";
import { RequirePermission } from "@/components/admin/require-permission";
import { PageContainer } from "@/components/panel/page-container";
import { createPageMetadata } from "@/lib/seo";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "ویرایش خدمت",
  description: "ویرایش خدمت.",
  path: "/admin/content/services",
  noIndex: true,
});

export default async function AdminEditServicePage({ params }: PageProps) {
  const { id } = await params;
  return (
    <RequirePermission permission="content:write" areaLabel="ویرایش خدمت">
      <Suspense
        fallback={
          <PageContainer>
            <DataTableSkeleton />
          </PageContainer>
        }
      >
        <ServiceFormPage mode="edit" serviceId={id} />
      </Suspense>
    </RequirePermission>
  );
}
