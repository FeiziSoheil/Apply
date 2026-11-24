"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <div className="flex max-w-md flex-col gap-3">
        <p className="text-sm font-medium text-destructive">خطای غیرمنتظره</p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          مشکلی پیش آمد
        </h1>
        <p className="text-pretty text-muted-foreground">
          متأسفانه در بارگذاری این صفحه خطایی رخ داد. می‌توانید دوباره تلاش
          کنید یا به صفحه اصلی بازگردید.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button type="button" onClick={reset}>
          تلاش مجدد
        </Button>
        <Button asChild variant="outline">
          <Link href="/">بازگشت به خانه</Link>
        </Button>
      </div>
    </div>
  );
}
