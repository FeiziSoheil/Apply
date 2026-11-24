import type { Metadata } from "next";
import { StudentCasePageView } from "@/components/panel/student/case/student-case-view";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "پرونده من",
  description: "مراحل پرونده، تاریخچه و مقصد تحصیلی.",
  path: "/panel/case",
  noIndex: true,
});

export default function PanelCasePage() {
  return <StudentCasePageView />;
}
