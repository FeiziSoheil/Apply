import type { Metadata } from "next";
import { Suspense } from "react";
import { ProgramFormPage } from "@/components/admin/content/programs/program-form-page";
import { DataTableSkeleton } from "@/components/admin/data-table/data-table-skeleton";
import { RequirePermission } from "@/components/admin/require-permission";
import { PageContainer } from "@/components/panel/page-container";
import { createPageMetadata } from "@/lib/seo";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "ویرایش برنامه",
  description: "ویرایش برنامه تحصیلی.",
  path: "/admin/content/programs",
  noIndex: true,
});

export default async function AdminEditProgramPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <RequirePermission permission="content:write" areaLabel="ویرایش برنامه">
      <Suspense
        fallback={
          <PageContainer>
            <DataTableSkeleton />
          </PageContainer>
        }
      >
        <ProgramFormPage mode="edit" programId={id} />
      </Suspense>
    </RequirePermission>
  );
}
