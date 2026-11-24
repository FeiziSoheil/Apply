import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AuthProvider } from "@/components/auth/auth-provider";
import { GuestOnly } from "@/components/auth/session-guards";
import { SiteLogo } from "@/components/layout/site-logo";
import { Container } from "@/components/shared/container";
import { QueryProvider } from "@/lib/api/query-provider";
import { INSTITUTE } from "@/lib/constants";

/**
 * Minimal branded shell of the login pages (`/login`, `/staff/login`) — brand
 * first, no site header/footer. `GuestOnly` sends signed-in users away.
 */
export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <QueryProvider>
      <AuthProvider>
        <div className="flex min-h-dvh flex-1 flex-col bg-linear-to-b from-primary/10 via-background to-background">
          <Container className="flex flex-1 flex-col items-center justify-center gap-8 py-10 sm:py-14">
            <div className="flex flex-col items-center gap-3 text-center">
              <SiteLogo size="hero" />
              <p className="max-w-xs text-sm text-muted-foreground sm:max-w-sm sm:text-base">
                {INSTITUTE.tagline}
              </p>
            </div>

            <main className="w-full">
              <GuestOnly>{children}</GuestOnly>
            </main>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <ArrowRight className="size-4" aria-hidden />
              بازگشت به سایت
            </Link>
          </Container>
        </div>
      </AuthProvider>
    </QueryProvider>
  );
}
