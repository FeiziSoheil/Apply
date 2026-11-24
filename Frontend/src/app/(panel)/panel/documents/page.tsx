import type { Metadata } from "next";
import { StudentDocumentsView } from "@/components/panel/student/documents/student-documents-view";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "مدارک",
  description: "بارگذاری و پیگیری مدارک پرونده.",
  path: "/panel/documents",
  noIndex: true,
});

export default function PanelDocumentsPage() {
  return <StudentDocumentsView />;
}
