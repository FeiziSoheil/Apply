import type { ReactNode } from "react";
import { Suspense } from "react";
import { DataTableSkeleton } from "@/components/admin/data-table/data-table-skeleton";
import { RequirePermission } from "@/components/admin/require-permission";
import { PageContainer } from "@/components/panel/page-container";
import type { Permission } from "@/lib/rbac/permissions";

type AdminResourcePageProps = {
  permission: Permission;
  areaLabel: string;
  children: ReactNode;
  /** Override the default DataTable skeleton fallback */
  fallback?: ReactNode;
};

/**
 * Shared shell for admin list/manager routes: permission gate + Suspense.
 * Keeps page.tsx files thin and consistent across domains.
 */
export function AdminResourcePage({
  permission,
  areaLabel,
  children,
  fallback,
}: AdminResourcePageProps) {
  return (
    <RequirePermission permission={permission} areaLabel={areaLabel}>
      <Suspense
        fallback={
          fallback ?? (
            <PageContainer>
              <DataTableSkeleton />
            </PageContainer>
          )
        }
      >
        {children}
      </Suspense>
    </RequirePermission>
  );
}
