import type { Metadata } from "next";
import { StudentShortlistView } from "@/components/panel/student/shortlist/student-shortlist-view";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "علاقه‌مندی‌ها",
  description: "برنامه‌ها و دانشگاه‌های ذخیره‌شده.",
  path: "/panel/shortlist",
  noIndex: true,
});

export default function PanelShortlistPage() {
  return <StudentShortlistView />;
}
