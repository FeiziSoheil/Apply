import type { Metadata } from "next";
import { Suspense } from "react";
import { NotificationsPage } from "@/components/admin/notifications/notifications-page";
import { PageContainer } from "@/components/panel/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { createPageMetadata } from "@/lib/seo";

export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "اعلان‌ها",
  description: "فهرست اعلان‌های پنل مدیریت.",
  path: "/admin/notifications",
  noIndex: true,
});

export default function AdminNotificationsRoute() {
  return (
    <Suspense
      fallback={
        <PageContainer>
          <Skeleton className="h-64 w-full" />
        </PageContainer>
      }
    >
      <NotificationsPage />
    </Suspense>
  );
}
