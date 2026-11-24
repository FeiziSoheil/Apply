import type { Metadata } from "next";
import { StudentNewTicketView } from "@/components/panel/student/messages/student-new-ticket-view";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "پیام جدید",
  description: "ثبت گفتگوی جدید با پشتیبانی.",
  path: "/panel/messages/new",
  noIndex: true,
});

export default function PanelNewMessagePage() {
  return <StudentNewTicketView />;
}
