import type { Metadata } from "next";
import { AdminResourcePage } from "@/components/admin/admin-resource-page";
import { LeadDetailPage } from "@/components/admin/leads/lead-detail-page";
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
    title: "جزئیات لید",
    description: "تایم‌لاین و پروفایل سرنخ فروش.",
    path: `/admin/leads/${id}`,
    noIndex: true,
  });
}

export default async function AdminLeadDetailRoute({ params }: PageProps) {
  const { id } = await params;
  return (
    <AdminResourcePage permission="lead:read" areaLabel="جزئیات لید">
      <LeadDetailPage leadId={id} />
    </AdminResourcePage>
  );
}
