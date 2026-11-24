import type { Metadata } from "next";
import { ProfileSettings } from "@/components/admin/users/profile-settings";
import { createPageMetadata } from "@/lib/seo";

export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "پروفایل من",
  description: "اطلاعات حساب و تنظیمات شخصی.",
  path: "/admin/profile",
  noIndex: true,
});

export default function AdminProfilePage() {
  return <ProfileSettings />;
}
