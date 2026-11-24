import type { Metadata } from "next";
import Link from "next/link";
import { StaffLoginForm } from "@/components/auth/staff-login-form";
import { createPageMetadata } from "@/lib/seo";

export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "ورود کارمندان",
  description: "ورود مشاوران و مدیران موسسه با ایمیل و رمز عبور.",
  path: "/staff/login",
  noIndex: true,
});

export default function StaffLoginPage() {
  return (
    <div className="flex flex-col items-center gap-4">
      <StaffLoginForm />
      <p className="text-sm text-muted-foreground">
        دانشجو هستید؟{" "}
        <Link
          href="/login"
          className="rounded font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          ورود دانشجو
        </Link>
      </p>
    </div>
  );
}
