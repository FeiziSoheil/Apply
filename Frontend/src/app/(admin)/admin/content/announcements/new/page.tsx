import type { Metadata } from "next";
import { Suspense } from "react";
import { AnnouncementFormPage } from "@/components/admin/content/announcements/announcement-form-page";
import { DataTableSkeleton } from "@/components/admin/data-table/data-table-skeleton";
import { RequirePermission } from "@/components/admin/require-permission";
import { PageContainer } from "@/components/panel/page-container";
import { createPageMetadata } from "@/lib/seo";

export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "افزودن اعلان",
  description: "ایجاد اعلان جدید برای پنل دانشجو.",
  path: "/admin/content/announcements/new",
  noIndex: true,
});

export default function AdminCreateAnnouncementPage() {
  return (
    <RequirePermission permission="content:write" areaLabel="افزودن اعلان">
      <Suspense
        fallback={
          <PageContainer>
            <DataTableSkeleton />
          </PageContainer>
        }
      >
        <AnnouncementFormPage mode="create" />
      </Suspense>
    </RequirePermission>
  );
}
