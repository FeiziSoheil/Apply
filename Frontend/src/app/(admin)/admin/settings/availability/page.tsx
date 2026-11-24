import type { Metadata } from "next";
import { Suspense } from "react";
import { RequirePermission } from "@/components/admin/require-permission";
import { AvailabilitySettings } from "@/components/admin/settings/availability-settings";
import { PageContainer } from "@/components/panel/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { createPageMetadata } from "@/lib/seo";

export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "ساعات کاری",
  description: "تنظیم برنامه هفتگی مشاوران، مرخصی و تعطیلات سراسری.",
  path: "/admin/settings/availability",
  noIndex: true,
});

export default function AdminAvailabilitySettingsPage() {
  return (
    <RequirePermission permission="user:manage" areaLabel="ساعات کاری">
      <Suspense
        fallback={
          <PageContainer>
            <Skeleton className="h-64 w-full" />
          </PageContainer>
        }
      >
        <AvailabilitySettings />
      </Suspense>
    </RequirePermission>
  );
}
