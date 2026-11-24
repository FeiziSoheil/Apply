import type { Metadata } from "next";
import { Suspense } from "react";
import { RequirePermission } from "@/components/admin/require-permission";
import { CrmSettingsPanel } from "@/components/admin/settings/crm/crm-settings-panel";
import { PageContainer } from "@/components/panel/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { createPageMetadata } from "@/lib/seo";

export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "تنظیمات CRM",
  description:
    "پایپ‌لاین، دلایل ریزش، تگ‌ها، قوانین تخصیص، قالب پیام و پرونده، هزینه کمپین و پیش‌فرض‌ها.",
  path: "/admin/settings/crm",
  noIndex: true,
});

export default function AdminCrmSettingsPage() {
  return (
    <RequirePermission
      permission="crm-settings:manage"
      areaLabel="تنظیمات CRM"
    >
      <Suspense
        fallback={
          <PageContainer>
            <Skeleton className="h-64 w-full" />
          </PageContainer>
        }
      >
        <CrmSettingsPanel />
      </Suspense>
    </RequirePermission>
  );
}
