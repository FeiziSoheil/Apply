import type { Metadata } from "next";
import { StudentProfileView } from "@/components/panel/student/profile/student-profile-view";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "پروفایل",
  description: "اطلاعات حساب دانشجو.",
  path: "/panel/profile",
  noIndex: true,
});

export default function PanelProfilePage() {
  return <StudentProfileView />;
}
