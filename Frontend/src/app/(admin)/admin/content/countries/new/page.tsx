import type { Metadata } from "next";
import { Suspense } from "react";
import { CountryFormPage } from "@/components/admin/content/countries/country-form-page";
import { DataTableSkeleton } from "@/components/admin/data-table/data-table-skeleton";
import { RequirePermission } from "@/components/admin/require-permission";
import { PageContainer } from "@/components/panel/page-container";
import { createPageMetadata } from "@/lib/seo";

/** Client pathname hooks in the panel shell */
export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "افزودن کشور",
  description: "ایجاد کشور مقصد جدید.",
  path: "/admin/content/countries/new",
  noIndex: true,
});

export default function AdminCreateCountryPage() {
  return (
    <RequirePermission permission="content:write" areaLabel="افزودن کشور">
      <Suspense
        fallback={
          <PageContainer>
            <DataTableSkeleton />
          </PageContainer>
        }
      >
        <CountryFormPage mode="create" />
      </Suspense>
    </RequirePermission>
  );
}
