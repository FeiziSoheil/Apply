import type { Metadata } from "next";
import { StudentHelpView } from "@/components/panel/student/section-simple-view";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "راهنما",
  description: "راهنمای کوتاه پنل دانشجو.",
  path: "/panel/help",
  noIndex: true,
});

export default function PanelHelpPage() {
  return <StudentHelpView />;
}
