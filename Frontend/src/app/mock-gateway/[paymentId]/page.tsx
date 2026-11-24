import { Suspense } from "react";
import { QueryProvider } from "@/lib/api/query-provider";
import { MockGatewayClient } from "./mock-gateway-client";

export const instant = false;

export default function MockGatewayPage() {
  return (
    <QueryProvider>
      <Suspense
        fallback={
          <main
            className="flex min-h-dvh items-center justify-center p-6"
            dir="rtl"
            lang="fa"
          >
            <p className="text-muted-foreground text-sm">در حال آماده‌سازی درگاه…</p>
          </main>
        }
      >
        <MockGatewayClient />
      </Suspense>
    </QueryProvider>
  );
}
