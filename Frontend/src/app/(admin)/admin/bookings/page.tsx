import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingsManager } from "@/components/admin/bookings/bookings-manager";
import { DataTableSkeleton } from "@/components/admin/data-table/data-table-skeleton";
import { RequirePermission } from "@/components/admin/require-permission";
import { PageContainer } from "@/components/panel/page-container";
import { createPageMetadata } from "@/lib/seo";

export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "مدیریت رزروها",
  description: "فهرست، تقویم و جزئیات نوبت‌های مشاوره.",
  path: "/admin/bookings",
  noIndex: true,
});

export default function AdminBookingsPage() {
  return (
    <RequirePermission permission="booking:read" areaLabel="رزروها">
      <Suspense
        fallback={
          <PageContainer>
            <DataTableSkeleton />
          </PageContainer>
        }
      >
        <BookingsManager />
      </Suspense>
    </RequirePermission>
  );
}
