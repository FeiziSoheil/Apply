"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function SiteErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
      <div className="flex max-w-md flex-col gap-3">
        <p className="text-sm font-medium text-destructive">خطا در صفحه</p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          امکان نمایش محتوا نیست
        </h1>
        <p className="text-pretty text-muted-foreground">
          لطفاً دوباره تلاش کنید. اگر مشکل ادامه داشت، از صفحه تماس با ما پیام
          بگذارید.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button type="button" onClick={reset}>
          تلاش مجدد
        </Button>
        <Button asChild variant="outline">
          <Link href="/contact">تماس با ما</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/">خانه</Link>
        </Button>
      </div>
    </div>
  );
}
