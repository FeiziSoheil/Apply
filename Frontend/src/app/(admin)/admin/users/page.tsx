import type { Metadata } from "next";
import { Suspense } from "react";
import { RequirePermission } from "@/components/admin/require-permission";
import { UsersManager } from "@/components/admin/users/users-manager";
import { PageContainer } from "@/components/panel/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { createPageMetadata } from "@/lib/seo";

export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "کاربران",
  description: "مدیریت حساب مدیران و مشاوران.",
  path: "/admin/users",
  noIndex: true,
});

export default function AdminUsersPage() {
  return (
    <RequirePermission permission="user:manage" areaLabel="کاربران">
      <Suspense
        fallback={
          <PageContainer>
            <Skeleton className="h-64 w-full" />
          </PageContainer>
        }
      >
        <UsersManager />
      </Suspense>
    </RequirePermission>
  );
}
