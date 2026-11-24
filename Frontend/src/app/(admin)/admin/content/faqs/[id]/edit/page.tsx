import type { Metadata } from "next";
import { Suspense } from "react";
import { FaqFormPage } from "@/components/admin/content/faqs/faqs-form-page";
import { DataTableSkeleton } from "@/components/admin/data-table/data-table-skeleton";
import { RequirePermission } from "@/components/admin/require-permission";
import { PageContainer } from "@/components/panel/page-container";
import { createPageMetadata } from "@/lib/seo";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "ویرایش پرسش",
  description: "ویرایش پرسش متداول.",
  path: "/admin/content/faqs",
  noIndex: true,
});

export default async function AdminEditFaqPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <RequirePermission permission="content:write" areaLabel="ویرایش پرسش">
      <Suspense
        fallback={
          <PageContainer>
            <DataTableSkeleton />
          </PageContainer>
        }
      >
        <FaqFormPage mode="edit" faqId={id} />
      </Suspense>
    </RequirePermission>
  );
}
