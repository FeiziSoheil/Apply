import type { Metadata } from "next";
import { StudentTicketThreadView } from "@/components/panel/student/messages/student-ticket-thread-view";
import { createPageMetadata } from "@/lib/seo";

export const instant = false;

type PageProps = { params: Promise<{ id: string }> };

export const metadata: Metadata = createPageMetadata({
  title: "گفتگو",
  description: "جزئیات گفتگو با پشتیبانی.",
  path: "/panel/messages",
  noIndex: true,
});

export default async function PanelMessageThreadPage({ params }: PageProps) {
  const { id } = await params;
  return <StudentTicketThreadView ticketId={id} />;
}
