import type { Metadata } from "next";
import { Suspense } from "react";
import { RequirePermission } from "@/components/admin/require-permission";
import { InstituteSettingsPanel } from "@/components/admin/settings/institute-settings";
import { PageContainer } from "@/components/panel/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { createPageMetadata } from "@/lib/seo";

export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "تنظیمات موسسه",
  description: "اطلاعات موسسه، تماس، شبکه‌ها، مجوزها، SEO و قالب پیامک.",
  path: "/admin/settings/institute",
  noIndex: true,
});

export default function AdminInstituteSettingsPage() {
  return (
    <RequirePermission permission="user:manage" areaLabel="تنظیمات موسسه">
      <Suspense
        fallback={
          <PageContainer>
            <Skeleton className="h-64 w-full" />
          </PageContainer>
        }
      >
        <InstituteSettingsPanel />
      </Suspense>
    </RequirePermission>
  );
}
