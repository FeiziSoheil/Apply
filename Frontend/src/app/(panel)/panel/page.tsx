import type { Metadata } from "next";
import { StudentHomeView } from "@/components/panel/student/home/student-home-view";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "خانه پنل دانشجو",
  description: "قدم بعدی، کارها، پیشرفت پرونده و مشاور شما.",
  path: "/panel",
  noIndex: true,
});

export default function PanelPage() {
  return <StudentHomeView />;
}
