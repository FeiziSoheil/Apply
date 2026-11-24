import type { Metadata } from "next";
import { Suspense } from "react";
import { ProgramFormPage } from "@/components/admin/content/programs/program-form-page";
import { DataTableSkeleton } from "@/components/admin/data-table/data-table-skeleton";
import { RequirePermission } from "@/components/admin/require-permission";
import { PageContainer } from "@/components/panel/page-container";
import { createPageMetadata } from "@/lib/seo";

export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "افزودن برنامه",
  description: "ایجاد برنامه تحصیلی جدید.",
  path: "/admin/content/programs/new",
  noIndex: true,
});

export default function AdminCreateProgramPage() {
  return (
    <RequirePermission permission="content:write" areaLabel="افزودن برنامه">
      <Suspense
        fallback={
          <PageContainer>
            <DataTableSkeleton />
          </PageContainer>
        }
      >
        <ProgramFormPage mode="create" />
      </Suspense>
    </RequirePermission>
  );
}
