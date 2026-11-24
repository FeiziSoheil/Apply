"use client";

import { WifiOff, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  const handleRetry = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-background"
      dir="rtl"
    >
      <div className="flex size-20 items-center justify-center rounded-3xl bg-muted/60 text-muted-foreground shadow-sm">
        <WifiOff className="size-10" aria-hidden="true" />
      </div>

      <h1 className="mt-6 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
        اتصال اینترنت شما قطع است
      </h1>

      <p className="mt-3 max-w-md text-sm text-muted-foreground leading-relaxed">
        به نظر می‌رسد دسترسی به اینترنت متوقف شده است. لطفاً ارتباط شبکه، وای‌فای یا داده موبایل خود را بررسی کرده و دوباره تلاش کنید.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <Button
          onClick={handleRetry}
          className="w-full flex items-center justify-center gap-2"
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          تلاش مجدد
        </Button>
        <Button
          variant="outline"
          asChild
          className="w-full"
        >
          <Link href="/panel" className="flex items-center justify-center gap-2">
            <Home className="size-4" aria-hidden="true" />
            بازگشت به پنل
          </Link>
        </Button>
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        داده‌های محرمانه و مدارک شما به دلایل امنیتی در حالت آفلاین ذخیره نمی‌شوند.
      </p>
    </main>
  );
}
