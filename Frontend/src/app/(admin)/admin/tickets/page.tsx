import type { Metadata } from "next";
import { AdminResourcePage } from "@/components/admin/admin-resource-page";
import { TicketsManager } from "@/components/admin/tickets/tickets-manager";
import { createPageMetadata } from "@/lib/seo";

export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "تیکت‌ها",
  description: "پاسخ به درخواست‌های پشتیبانی دانشجویان.",
  path: "/admin/tickets",
  noIndex: true,
});

export default function AdminTicketsPage() {
  return (
    <AdminResourcePage permission="ticket:read" areaLabel="تیکت‌ها">
      <TicketsManager />
    </AdminResourcePage>
  );
}