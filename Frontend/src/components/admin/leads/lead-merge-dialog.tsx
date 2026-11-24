"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Lead } from "@/contracts/leads";
import { useMergeLead } from "@/features/leads/mutations";
import { getApiErrorMessage } from "@/lib/api";
import { toPersianDigits } from "@/lib/format";
import { LEAD_PRIORITY_MAP, LEAD_SOURCE_LABELS } from "./lead-labels";

type FieldKey = "name" | "email" | "mobile" | "priority" | "message";

const FIELDS: { key: FieldKey; label: string }[] = [
  { key: "name", label: "نام" },
  { key: "mobile", label: "موبایل" },
  { key: "email", label: "ایمیل" },
  { key: "priority", label: "اولویت" },
  { key: "message", label: "یادداشت" },
];

type LeadMergeDialogProps = {
  open: boolean;
  source: Lead;
  target: Lead;
  onOpenChange: (open: boolean) => void;
};

function displayValue(lead: Lead, key: FieldKey): string {
  switch (key) {
    case "name":
      return lead.name;
    case "mobile":
      return toPersianDigits(lead.mobile);
    case "email":
      return lead.email ?? "—";
    case "priority":
      return LEAD_PRIORITY_MAP[lead.priority].label;
    case "message":
      return lead.message ?? "—";
  }
}

export function LeadMergeDialog({
  open,
  source,
  target,
  onOpenChange,
}: LeadMergeDialogProps) {
  const router = useRouter();
  const merge = useMergeLead();
  const [winners, setWinners] = useState<Record<FieldKey, "source" | "target">>(
    () => ({
      name: "target",
      mobile: "target",
      email: "target",
      priority: "target",
      message: "target",
    }),
  );

  const preview = useMemo(() => {
    const pick = (key: FieldKey) =>
      winners[key] === "source" ? source : target;
    return {
      name: pick("name").name,
      mobile: pick("mobile").mobile,
      email: pick("email").email,
      priority: pick("priority").priority,
      message: pick("message").message,
      source: LEAD_SOURCE_LABELS[target.source],
    };
  }, [source, target, winners]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>ادغام لیدها</DialogTitle>
          <DialogDescription>
            مبدأ («{source.name}») بایگانی می‌شود و داده به مقصد («{target.name}»)
            منتقل می‌گردد. فیلد برنده را برای پیش‌نمایش انتخاب کنید؛ API فعلی
            مقصد را نگه می‌دارد و تگ‌ها را ادغام می‌کند.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {FIELDS.map((field) => (
            <div key={field.key} className="rounded-lg border p-3">
              <p className="mb-2 text-sm font-medium">{field.label}</p>
              <RadioGroup
                value={winners[field.key]}
                onValueChange={(value) =>
                  setWinners((prev) => ({
                    ...prev,
                    [field.key]: value as "source" | "target",
                  }))
                }
                className="grid gap-2 sm:grid-cols-2"
              >
                <label className="hover:bg-muted/40 flex cursor-pointer items-start gap-2 rounded-md border p-2 text-sm">
                  <RadioGroupItem value="source" id={`${field.key}-source`} />
                  <span>
                    <span className="text-muted-foreground block text-xs">
                      مبدأ
                    </span>
                    {displayValue(source, field.key)}
                  </span>
                </label>
                <label className="hover:bg-muted/40 flex cursor-pointer items-start gap-2 rounded-md border p-2 text-sm">
                  <RadioGroupItem value="target" id={`${field.key}-target`} />
                  <span>
                    <span className="text-muted-foreground block text-xs">
                      مقصد
                    </span>
                    {displayValue(target, field.key)}
                  </span>
                </label>
              </RadioGroup>
            </div>
          ))}

          <div className="bg-muted/40 space-y-1 rounded-lg border p-3 text-sm">
            <Label>پیش‌نمایش نتیجه</Label>
            <p>نام: {preview.name}</p>
            <p dir="ltr">موبایل: {toPersianDigits(preview.mobile)}</p>
            <p>ایمیل: {preview.email ?? "—"}</p>
            <p>اولویت: {LEAD_PRIORITY_MAP[preview.priority].label}</p>
            <p className="whitespace-pre-wrap">
              یادداشت: {preview.message ?? "—"}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button
            type="button"
            disabled={merge.isPending}
            onClick={() => {
              merge.mutate(
                { id: source.id, body: { targetId: target.id } },
                {
                  onSuccess: (lead) => {
                    toast.success("لیدها ادغام شدند");
                    onOpenChange(false);
                    router.push(`/admin/leads/${lead.id}`);
                  },
                  onError: (error) => toast.error(getApiErrorMessage(error)),
                },
              );
            }}
          >
            تأیید ادغام
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
