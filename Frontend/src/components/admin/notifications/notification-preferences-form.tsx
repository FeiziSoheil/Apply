"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import type { NotificationTypePreference } from "@/contracts/crm";
import { useUpdateNotificationPreferences } from "@/features/notifications/mutations";
import { useNotificationPreferences } from "@/features/notifications/queries";
import { getApiErrorMessage } from "@/lib/api";
import { NOTIFICATION_TYPE_META } from "@/lib/crm/notification-types";

export function NotificationPreferencesForm() {
  const prefsQuery = useNotificationPreferences();
  const updatePrefs = useUpdateNotificationPreferences();
  const [draft, setDraft] = useState<NotificationTypePreference[] | null>(null);

  if (prefsQuery.isPending) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (prefsQuery.isError) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {getApiErrorMessage(prefsQuery.error)}
      </p>
    );
  }

  const rows = draft ?? prefsQuery.data?.preferences ?? [];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        کانال درون‌برنامه اعلان‌ها را کنترل می‌کند. گزینه پیامک فقط ذخیره
        می‌شود و در محیط mock ارسال واقعی ندارد.
      </p>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[28rem] text-sm">
          <thead className="bg-muted/40 text-start">
            <tr>
              <th className="px-3 py-2 font-medium">نوع اعلان</th>
              <th className="px-3 py-2 font-medium">درون‌برنامه</th>
              <th className="px-3 py-2 font-medium">پیامک</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {NOTIFICATION_TYPE_META.map((meta) => {
              const row = rows.find((r) => r.type === meta.type) ?? {
                type: meta.type,
                inApp: true,
                sms: false,
              };
              return (
                <tr key={meta.type}>
                  <td className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-2">
                      <meta.Icon
                        className="size-4 text-muted-foreground"
                        aria-hidden
                      />
                      {meta.label}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <Switch
                      checked={row.inApp}
                      onCheckedChange={(checked) => {
                        setDraft(() => {
                          const base = draft ?? prefsQuery.data?.preferences ?? [];
                          const others = base.filter((r) => r.type !== meta.type);
                          return [...others, { ...row, inApp: checked }];
                        });
                      }}
                      aria-label={`اعلان درون‌برنامه برای ${meta.label}`}
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <Switch
                      checked={row.sms}
                      onCheckedChange={(checked) => {
                        setDraft(() => {
                          const base = draft ?? prefsQuery.data?.preferences ?? [];
                          const others = base.filter((r) => r.type !== meta.type);
                          return [...others, { ...row, sms: checked }];
                        });
                      }}
                      aria-label={`پیامک برای ${meta.label}`}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Button
        type="button"
        disabled={updatePrefs.isPending}
        onClick={() => {
          updatePrefs.mutate(
            { preferences: rows },
            {
              onSuccess: () => {
                setDraft(null);
                toast.success("ترجیحات اعلان ذخیره شد");
              },
              onError: (error) => toast.error(getApiErrorMessage(error)),
            },
          );
        }}
      >
        {updatePrefs.isPending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : null}
        ذخیره ترجیحات اعلان
      </Button>
    </div>
  );
}
