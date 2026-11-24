import type { Metadata } from "next";
import { AdminResourcePage } from "@/components/admin/admin-resource-page";
import { CaseDetailPage } from "@/components/admin/cases/case-detail-page";
import { createPageMetadata } from "@/lib/seo";

export const instant = false;

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  return createPageMetadata({
    title: "جزئیات پرونده",
    description: "مشاهده و مدیریت پرونده دانشجو.",
    path: `/admin/cases/${id}`,
    noIndex: true,
  });
}

export default async function AdminCaseDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <AdminResourcePage permission="case:read" areaLabel="پرونده‌ها">
      <CaseDetailPage caseId={id} />
    </AdminResourcePage>
  );
}
