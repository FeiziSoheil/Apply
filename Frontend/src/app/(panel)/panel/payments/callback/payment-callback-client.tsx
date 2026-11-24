"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { paymentAttemptSchema, type PaymentAttempt } from "@/contracts/payments";
import { apiGet } from "@/lib/api/client";
import { formatJalaliDate, formatMoney } from "@/lib/format";
import { rialsToPersianTomanWords } from "@/lib/persian-words";

/**
 * Gateway return URL.
 * Rule: Query `status` is display-only — final status is ALWAYS verified with
 * `GET /me/payments/{id}`.
 */
export function PaymentCallbackClient() {
  const search = useSearchParams();
  const paymentId = search.get("paymentId");
  const queryStatus = search.get("status");
  const [attempt, setAttempt] = useState<PaymentAttempt | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(() => Boolean(paymentId));

  useEffect(() => {
    if (!paymentId) return;
    let cancelled = false;
    void (async () => {
      try {
        const data = await apiGet(
          `/me/payments/${paymentId}`,
          paymentAttemptSchema,
        );
        if (!cancelled) {
          setAttempt(data);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setLoadError("وضعیت پرداخت را نتوانستیم از سرور استعلام کنیم.");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [paymentId]);

  if (!paymentId) {
    return (
      <main className="mx-auto flex max-w-lg flex-col items-center justify-center min-h-[60vh] gap-4 p-6 text-center" dir="rtl">
        <XCircle className="size-12 text-destructive" />
        <h1 className="text-xl font-bold">شناسه پرداخت نامعتبر است</h1>
        <p className="text-muted-foreground text-sm">
          اطلاعات تراکنش در آدرس بازگشتی مشخص نیست.
        </p>
        <Button asChild className="mt-2">
          <Link href="/panel/payments">بازگشت به پرداخت‌ها</Link>
        </Button>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="mx-auto flex max-w-lg flex-col items-center justify-center min-h-[60vh] gap-4 p-6 text-center" dir="rtl">
        <Clock className="size-10 animate-spin text-muted-foreground" />
        <p className="text-sm">در حال راستی‌آزمایی وضعیت پرداخت از سرور…</p>
      </main>
    );
  }

  if (loadError || !attempt) {
    return (
      <main className="mx-auto flex max-w-lg flex-col items-center justify-center min-h-[60vh] gap-4 p-6 text-center" dir="rtl">
        <AlertCircle className="size-12 text-destructive" />
        <h1 className="text-xl font-bold">خطا در استعلام وضعیت</h1>
        <p className="text-muted-foreground text-sm">{loadError}</p>
        <Button asChild className="mt-2">
          <Link href="/panel/payments">بازگشت به پرداخت‌ها</Link>
        </Button>
      </main>
    );
  }

  // Final status strictly comes from server attempt, NOT queryStatus!
  const isSucceeded = attempt.status === "succeeded";
  const isFailed = attempt.status === "failed";
  const isCancelled = attempt.status === "cancelled";
  const isAwaiting = attempt.status === "awaiting_verification";

  return (
    <main
      className="mx-auto flex max-w-lg flex-col gap-6 p-6 min-h-[70vh] justify-center"
      dir="rtl"
    >
      {/* Succeeded Result with Receipt */}
      {isSucceeded ? (
        <div className="bg-card rounded-2xl border p-6 text-center space-y-4 shadow-xs">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-8" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              پرداخت با موفقیت انجام شد
            </h1>
            <p className="text-muted-foreground text-xs">
              رسید دیجیتال پرداخت شما با موفقیت در سیستم ثبت گردید.
            </p>
          </div>

          <div className="bg-muted/40 rounded-xl border p-4 space-y-2.5 text-xs text-right mt-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">کد پیگیری تراکنش:</span>
              <span className="font-semibold tabular-nums" dir="ltr">
                {attempt.gatewayRef || attempt.id}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">مبلغ پرداختی:</span>
              <span className="font-bold text-sm text-foreground tabular-nums">
                {formatMoney(attempt.amount)}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-muted-foreground">مبلغ به حروف:</span>
              <span className="font-medium">
                {rialsToPersianTomanWords(attempt.amount)}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-muted-foreground">تاریخ و زمان:</span>
              <span className="tabular-nums">
                {formatJalaliDate(attempt.updatedAt, "yyyy/MM/dd HH:mm")}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <Button asChild className="w-full gap-2">
              <Link href="/panel/payments">
                مشاهده فاکتور و پرداخت‌ها
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      ) : null}

      {/* Failed Result with Retry Button */}
      {isFailed ? (
        <div className="bg-card rounded-2xl border p-6 text-center space-y-4 shadow-xs">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="size-8" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-destructive">
              پرداخت ناموفق بود
            </h1>
            <p className="text-muted-foreground text-xs">
              تراکنش توسط درگاه بانکی تأیید نشد یا با خطا مواجه گردید. وجهی از حساب
              شما کسر نشده است.
            </p>
          </div>

          <div className="bg-muted/40 rounded-xl border p-4 text-xs text-right space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">مبلغ قسط:</span>
              <span className="font-semibold tabular-nums">
                {formatMoney(attempt.amount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">وضعیت سرور:</span>
              <span className="text-destructive font-medium">خطا در پرداخت</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button asChild className="w-full gap-2">
              <Link href="/panel/payments">
                <RotateCcw className="size-4" />
                تلاش مجدد برای پرداخت
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/panel">بازگشت به خانه</Link>
            </Button>
          </div>
        </div>
      ) : null}

      {/* Cancelled Result */}
      {isCancelled ? (
        <div className="bg-card rounded-2xl border p-6 text-center space-y-4 shadow-xs">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <XCircle className="size-8" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">انصراف از پرداخت</h1>
            <p className="text-muted-foreground text-xs">
              فرایند پرداخت توسط شما لغو شد. قسط شما همچنان پرداخت‌نشده باقی مانده
              است.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button asChild className="w-full gap-2">
              <Link href="/panel/payments">
                <RotateCcw className="size-4" />
                تلاش مجدد برای پرداخت
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/panel">بازگشت به پنل</Link>
            </Button>
          </div>
        </div>
      ) : null}

      {/* Awaiting verification */}
      {isAwaiting ? (
        <div className="bg-card rounded-2xl border p-6 text-center space-y-4 shadow-xs">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
            <Clock className="size-8" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              در انتظار تأیید رسید
            </h1>
            <p className="text-muted-foreground text-xs">
              رسید کارت‌به‌کارت شما دریافت شده و توسط کارشناس مالی بررسی خواهد شد.
            </p>
          </div>
          <Button asChild className="w-full">
            <Link href="/panel/payments">بازگشت به پرداخت‌ها</Link>
          </Button>
        </div>
      ) : null}

      {/* Other states (e.g. initiated/pending) */}
      {!isSucceeded && !isFailed && !isCancelled && !isAwaiting ? (
        <div className="bg-card rounded-2xl border p-6 text-center space-y-4 shadow-xs">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Clock className="size-8" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">پرداخت در حال بررسی</h1>
            <p className="text-muted-foreground text-xs">
              تراکنش هنوز قطعی نشده است. می‌توانید وضعیت آن را در صفحه پرداخت‌ها بررسی فرمایید.
            </p>
          </div>
          <Button asChild className="w-full">
            <Link href="/panel/payments">بازگشت به پرداخت‌ها</Link>
          </Button>
        </div>
      ) : null}

      {/* Informational disclaimer */}
      <p className="text-center text-muted-foreground text-xs">
        وضعیت نهایی پرداخت صرفاً بر اساس استعلام مستقیم سرور نمایش داده می‌شود
        {queryStatus ? ` (پارامتر آدرس: ${queryStatus})` : ""}.
      </p>
    </main>
  );
}
