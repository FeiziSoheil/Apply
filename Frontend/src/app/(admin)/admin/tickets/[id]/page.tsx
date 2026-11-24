import type { Metadata } from "next";
import { AdminResourcePage } from "@/components/admin/admin-resource-page";
import { TicketThreadView } from "@/components/admin/tickets/ticket-thread-view";
import { createPageMetadata } from "@/lib/seo";

export const instant = false;

type PageProps = { params: Promise<{ id: string }> };

export const metadata: Metadata = createPageMetadata({
  title: "جزئیات تیکت",
  description: "گفتگو و مدیریت تیکت پشتیبانی.",
  path: "/admin/tickets",
  noIndex: true,
});

export default async function AdminTicketDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <AdminResourcePage permission="ticket:read" areaLabel="تیکت‌ها">
      <TicketThreadView ticketId={id} />
    </AdminResourcePage>
  );
}
