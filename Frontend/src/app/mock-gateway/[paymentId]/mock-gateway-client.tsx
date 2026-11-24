"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { paymentAttemptSchema } from "@/contracts/payments";
import { apiPost } from "@/lib/api/client";

/**
 * Mock-only payment gateway UI. Final payment status is decided by the API
 * (`POST /mock-gateway/{id}/resolve`); the callback query is display-only.
 */
export function MockGatewayClient() {
  const params = useParams<{ paymentId: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const callback =
    search.get("callback") ??
    `/panel/payments/callback?paymentId=${params.paymentId}`;

  function resolve(outcome: "success" | "fail" | "cancel") {
    startTransition(async () => {
      setError(null);
      try {
        await apiPost(
          `/mock-gateway/${params.paymentId}/resolve`,
          paymentAttemptSchema,
          { outcome },
        );
        const url = new URL(callback, window.location.origin);
        url.searchParams.set("paymentId", params.paymentId);
        url.searchParams.set(
          "status",
          outcome === "success"
            ? "ok"
            : outcome === "fail"
              ? "failed"
              : "cancelled",
        );
        if (url.origin === window.location.origin) {
          router.push(`${url.pathname}${url.search}`);
        } else {
          window.location.href = url.toString();
        }
      } catch {
        setError("نتیجه پرداخت ثبت نشد. دوباره تلاش کنید.");
      }
    });
  }

  return (
    <main
      className="bg-background text-foreground flex min-h-dvh flex-col items-center justify-center gap-6 p-6"
      dir="rtl"
      lang="fa"
    >
      <div className="max-w-md space-y-3 text-center">
        <h1 className="text-xl font-semibold">درگاه پرداخت آزمایشی</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          این صفحه فقط در محیط mock است. نتیجه واقعی پرداخت را بعداً از وضعیت
          تراکنش در پنل بخوانید؛ پارامترهای آدرس فقط برای نمایش‌اند.
        </p>
        {error ? (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button disabled={pending} onClick={() => resolve("success")}>
          پرداخت موفق
        </Button>
        <Button
          disabled={pending}
          variant="outline"
          onClick={() => resolve("fail")}
        >
          پرداخت ناموفق
        </Button>
        <Button
          disabled={pending}
          variant="ghost"
          onClick={() => resolve("cancel")}
        >
          انصراف
        </Button>
      </div>
    </main>
  );
}
