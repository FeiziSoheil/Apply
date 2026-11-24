import type { Metadata } from "next";
import Link from "next/link";
import { StudentLoginForm } from "@/components/auth/student-login-form";
import { createPageMetadata } from "@/lib/seo";

export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "ورود دانشجو",
  description: "ورود به پنل دانشجویی با شماره موبایل و کد تأیید.",
  path: "/login",
  noIndex: true,
});

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center gap-4">
      <StudentLoginForm />
      <p className="text-sm text-muted-foreground">
        مشاور یا مدیر موسسه هستید؟{" "}
        <Link
          href="/staff/login"
          className="rounded font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          ورود کارمندان
        </Link>
      </p>
    </div>
  );
}
