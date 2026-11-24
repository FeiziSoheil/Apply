import type { Metadata } from "next";
import { StudentMessagesView } from "@/components/panel/student/messages/student-messages-view";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "پیام‌ها",
  description: "گفتگو با مشاور و پشتیبانی.",
  path: "/panel/messages",
  noIndex: true,
});

export default function PanelMessagesPage() {
  return <StudentMessagesView />;
}
