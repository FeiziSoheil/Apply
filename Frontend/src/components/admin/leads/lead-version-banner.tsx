"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type LeadVersionBannerProps = {
  currentVersion?: number;
  onReload: () => void;
  onKeepLocal: () => void;
  hasLocalDraft: boolean;
};

export function LeadVersionBanner({
  currentVersion,
  onReload,
  onKeepLocal,
  hasLocalDraft,
}: LeadVersionBannerProps) {
  return (
    <div
      role="alert"
      className="border-warning/40 bg-warning/10 text-warning-foreground flex flex-col gap-2 rounded-lg border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm">
        این لید در همین لحظه توسط شخص دیگری ویرایش شد
        {currentVersion !== undefined
          ? ` (نسخه ${currentVersion})`
          : ""}
        .
        {hasLocalDraft
          ? " تغییرات ذخیره‌نشده شما حفظ شده‌اند؛ می‌توانید بارگذاری مجدد کنید یا پیش‌نویس را نگه دارید."
          : null}
      </p>
      <div className="flex flex-wrap gap-2">
        {hasLocalDraft ? (
          <Button type="button" size="sm" variant="outline" onClick={onKeepLocal}>
            نگه داشتن پیش‌نویس
          </Button>
        ) : null}
        <Button type="button" size="sm" onClick={onReload}>
          <RefreshCw data-icon="inline-start" aria-hidden />
          بارگذاری مجدد
        </Button>
      </div>
    </div>
  );
}
