import type { Metadata } from "next";
import { Suspense } from "react";
import { NewsFormPage } from "@/components/admin/content/news/news-form-page";
import { DataTableSkeleton } from "@/components/admin/data-table/data-table-skeleton";
import { RequirePermission } from "@/components/admin/require-permission";
import { PageContainer } from "@/components/panel/page-container";
import { createPageMetadata } from "@/lib/seo";

export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "افزودن خبر",
  description: "ایجاد خبر جدید.",
  path: "/admin/content/news/new",
  noIndex: true,
});

export default function AdminCreateNewsPage() {
  return (
    <RequirePermission permission="content:write" areaLabel="افزودن خبر">
      <Suspense
        fallback={
          <PageContainer>
            <DataTableSkeleton />
          </PageContainer>
        }
      >
        <NewsFormPage mode="create" />
      </Suspense>
    </RequirePermission>
  );
}
