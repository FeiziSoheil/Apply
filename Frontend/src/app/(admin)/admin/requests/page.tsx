import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminRequestsManager } from "@/components/admin/requests/admin-requests-manager";
import { DataTableSkeleton } from "@/components/admin/data-table/data-table-skeleton";
import { RequirePermission } from "@/components/admin/require-permission";
import { PageContainer } from "@/components/panel/page-container";
import { createPageMetadata } from "@/lib/seo";

export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "درخواست‌های کاربران",
  description: "مدیریت و پردازش درخواست‌های حریم خصوصی و حذف حساب.",
  path: "/admin/requests",
  noIndex: true,
});

export default function AdminRequestsPage() {
  return (
    <RequirePermission permission="user:manage" areaLabel="درخواست‌های کاربران">
      <Suspense
        fallback={
          <PageContainer>
            <DataTableSkeleton />
          </PageContainer>
        }
      >
        <AdminRequestsManager />
      </Suspense>
    </RequirePermission>
  );
}
