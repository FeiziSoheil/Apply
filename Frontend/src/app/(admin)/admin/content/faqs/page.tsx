import type { Metadata } from "next";
import { Suspense } from "react";
import { FaqsManager } from "@/components/admin/content/faqs/faqs-manager";
import { DataTableSkeleton } from "@/components/admin/data-table/data-table-skeleton";
import { RequirePermission } from "@/components/admin/require-permission";
import { PageContainer } from "@/components/panel/page-container";
import { createPageMetadata } from "@/lib/seo";

export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "مدیریت پرسش‌های متداول",
  description: "فهرست، ترتیب، ایجاد، ویرایش و حذف پرسش‌های متداول.",
  path: "/admin/content/faqs",
  noIndex: true,
});

export default function AdminFaqPage() {
  return (
    <RequirePermission permission="content:read" areaLabel="پرسش‌های متداول">
      <Suspense
        fallback={
          <PageContainer>
            <DataTableSkeleton />
          </PageContainer>
        }
      >
        <FaqsManager />
      </Suspense>
    </RequirePermission>
  );
}
