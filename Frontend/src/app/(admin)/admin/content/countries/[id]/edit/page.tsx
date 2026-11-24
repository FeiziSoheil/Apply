import type { Metadata } from "next";
import { Suspense } from "react";
import { CountryFormPage } from "@/components/admin/content/countries/country-form-page";
import { DataTableSkeleton } from "@/components/admin/data-table/data-table-skeleton";
import { RequirePermission } from "@/components/admin/require-permission";
import { PageContainer } from "@/components/panel/page-container";
import { createPageMetadata } from "@/lib/seo";

type PageProps = {
  params: Promise<{ id: string }>;
};

/** Dynamic edit URL + client pathname hooks in the panel shell */
export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "ویرایش کشور",
  description: "ویرایش اطلاعات کشور مقصد.",
  path: "/admin/content/countries",
  noIndex: true,
});

export default async function AdminEditCountryPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <RequirePermission permission="content:write" areaLabel="ویرایش کشور">
      <Suspense
        fallback={
          <PageContainer>
            <DataTableSkeleton />
          </PageContainer>
        }
      >
        <CountryFormPage mode="edit" countryId={id} />
      </Suspense>
    </RequirePermission>
  );
}
