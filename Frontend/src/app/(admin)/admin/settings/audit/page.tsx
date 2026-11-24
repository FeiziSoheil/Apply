import type { Metadata } from "next";
import { Suspense } from "react";
import { AuditLogPage } from "@/components/admin/audit/audit-log-page";
import { RequirePermission } from "@/components/admin/require-permission";
import { PageContainer } from "@/components/panel/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { createPageMetadata } from "@/lib/seo";

export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "گزارش حسابرسی",
  description: "لاگ تغییرات سیستم برای مدیران.",
  path: "/admin/settings/audit",
  noIndex: true,
});

export default function AdminAuditSettingsPage() {
  return (
    <RequirePermission permission="audit:read" areaLabel="گزارش حسابرسی">
      <Suspense
        fallback={
          <PageContainer>
            <Skeleton className="h-64 w-full" />
          </PageContainer>
        }
      >
        <AuditLogPage />
      </Suspense>
    </RequirePermission>
  );
}
