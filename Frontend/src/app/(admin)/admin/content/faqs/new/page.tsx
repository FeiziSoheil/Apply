import type { Metadata } from "next";
import { Suspense } from "react";
import { FaqFormPage } from "@/components/admin/content/faqs/faqs-form-page";
import { DataTableSkeleton } from "@/components/admin/data-table/data-table-skeleton";
import { RequirePermission } from "@/components/admin/require-permission";
import { PageContainer } from "@/components/panel/page-container";
import { createPageMetadata } from "@/lib/seo";

export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "افزودن پرسش",
  description: "ایجاد پرسش متداول جدید.",
  path: "/admin/content/faqs/new",
  noIndex: true,
});

export default function AdminCreateFaqPage() {
  return (
    <RequirePermission permission="content:write" areaLabel="افزودن پرسش">
      <Suspense
        fallback={
          <PageContainer>
            <DataTableSkeleton />
          </PageContainer>
        }
      >
        <FaqFormPage mode="create" />
      </Suspense>
    </RequirePermission>
  );
}
