import type { Metadata } from "next";
import { Suspense } from "react";
import { DataTableSkeleton } from "@/components/admin/data-table/data-table-skeleton";
import { CountriesManager } from "@/components/admin/content/countries/countries-manager";
import { RequirePermission } from "@/components/admin/require-permission";
import { PageContainer } from "@/components/panel/page-container";
import { createPageMetadata } from "@/lib/seo";

/**
 * Client auth gate in `(admin)/layout` (`RequireRole`) omits `{children}` until
 * the session resolves, so this segment cannot be validated for instant nav.
 */
export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "مدیریت کشورها",
  description: "فهرست، ایجاد، ویرایش و حذف کشورهای مقصد.",
  path: "/admin/content/countries",
  noIndex: true,
});

/**
 * Real page of `/admin/content/countries` — it takes precedence over the
 * `[...slug]` placeholder route. Server Component: metadata + the permission
 * gate; everything interactive lives in `CountriesManager` (client).
 * `Suspense` is required because the table state is read from the URL (nuqs).
 */
export default function AdminCountriesPage() {
  return (
    <RequirePermission permission="content:read" areaLabel="کشورها">
      <Suspense
        fallback={
          <PageContainer>
            <DataTableSkeleton />
          </PageContainer>
        }
      >
        <CountriesManager />
      </Suspense>
    </RequirePermission>
  );
}
