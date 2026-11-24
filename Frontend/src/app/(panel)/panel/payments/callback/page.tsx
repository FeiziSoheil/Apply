import { Suspense } from "react";
import { PaymentCallbackClient } from "./payment-callback-client";

export const instant = false;

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-lg p-6" dir="rtl">
          <p className="text-muted-foreground text-sm">در حال بررسی پرداخت…</p>
        </main>
      }
    >
      <PaymentCallbackClient />
    </Suspense>
  );
}
