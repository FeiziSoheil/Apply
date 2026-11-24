/* eslint-disable react-hooks/set-state-in-effect -- hydrate editable drafts from TanStack Query */
"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { UnsavedChangesBar } from "@/components/admin/settings/unsaved-changes-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  BusinessHoursDay,
  CrmDefaultsData,
} from "@/contracts/crm-settings";
import {
  useReplaceCrmDefaultsSettings,
  useResetCrmDefaultsSettings,
} from "@/features/crm-settings/mutations";
import {
  useCrmDefaultsSettings,
  usePipelineSettings,
} from "@/features/crm-settings/queries";
import { useConsultants } from "@/features/content/queries";
import { getApiErrorMessage } from "@/lib/api";
import { CrmSettingsTabSkeleton } from "./crm-settings-tab-skeleton";
import { ResetDefaultsButton } from "./reset-defaults-button";

const WEEKDAY_LABELS = [
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
  "شنبه",
] as const;

export function DefaultsSettingsTab() {
  const query = useCrmDefaultsSettings();
  const pipelineQuery = usePipelineSettings();
  const consultantsQuery = useConsultants({
    page: 1,
    pageSize: 100,
    sort: "order",
    order: "asc",
    active: true,
  });
  const replace = useReplaceCrmDefaultsSettings();
  const reset = useResetCrmDefaultsSettings();

  const [data, setData] = useState<CrmDefaultsData | null>(null);
  const [version, setVersion] = useState(1);
  const [baseline, setBaseline] = useState("");

  // Sync draft from server payload when query resolves / remounts via parent key when needed.

  
  useEffect(() => {
    if (!query.data) return;
    setData(query.data.data);
    setVersion(query.data.version);
    setBaseline(JSON.stringify(query.data.data));
  }, [query.data]);

  const dirty = data ? JSON.stringify(data) !== baseline : false;
  const stages = pipelineQuery.data?.stages ?? [];
  const consultants = consultantsQuery.data?.items ?? [];

  if ((query.isPending && !query.data) || !data) {
    return <CrmSettingsTabSkeleton />;
  }
  if (query.error && !query.data) {
    return (
      <p className="text-sm text-destructive">
        {getApiErrorMessage(query.error)}
      </p>
    );
  }

  async function handleSave() {
    if (!data) return;
    try {
      const result = await replace.mutateAsync({ version, body: data });
      setData(result.data);
      setVersion(result.version);
      setBaseline(JSON.stringify(result.data));
      toast.success("پیش‌فرض‌ها ذخیره شد");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  function updateDay(index: number, patch: Partial<BusinessHoursDay>) {
    setData((prev) => {
      if (!prev) return prev;
      const days = prev.businessHours.days.map((day, i) =>
        i === index ? { ...day, ...patch } : day,
      );
      return {
        ...prev,
        businessHours: { ...prev.businessHours, days },
      };
    });
  }

  return (
    <div className="space-y-6" data-testid="crm-settings-defaults">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">پیش‌فرض‌ها</h2>
          <p className="text-muted-foreground text-sm">
            مرحله اولیه لید، مسئول بدون قانون، ساعات کاری و آستانه بدون فعالیت.
          </p>
        </div>
        <ResetDefaultsButton
          isPending={reset.isPending}
          onConfirm={() => {
            void reset
              .mutateAsync(version)
              .then((result) => {
                setData(result.data);
                setVersion(result.version);
                setBaseline(JSON.stringify(result.data));
                toast.success("به پیش‌فرض بازگشت");
              })
              .catch((error: unknown) =>
                toast.error(getApiErrorMessage(error)),
              );
          }}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>مرحله اولیه لید جدید</Label>
          <Select
            value={data.initialStageId}
            onValueChange={(initialStageId) =>
              setData((prev) => (prev ? { ...prev, initialStageId } : prev))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {stages.map((stage) => (
                <SelectItem key={stage.id} value={stage.id}>
                  {stage.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>مسئول پیش‌فرض (بدون قانون)</Label>
          <Select
            value={data.defaultAssigneeId ?? "__none__"}
            onValueChange={(value) =>
              setData((prev) =>
                prev
                  ? {
                      ...prev,
                      defaultAssigneeId:
                        value === "__none__" ? null : value,
                    }
                  : prev,
              )
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">بدون مسئول</SelectItem>
              {consultants.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="no-activity-days">آستانه بدون فعالیت (روز)</Label>
          <Input
            id="no-activity-days"
            type="number"
            min={1}
            max={365}
            value={data.noActivityDays}
            onChange={(e) =>
              setData((prev) =>
                prev
                  ? { ...prev, noActivityDays: Number(e.target.value) }
                  : prev,
              )
            }
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tz">منطقه زمانی ساعات کاری</Label>
          <Input
            id="tz"
            value={data.businessHours.timezone}
            onChange={(e) =>
              setData((prev) =>
                prev
                  ? {
                      ...prev,
                      businessHours: {
                        ...prev.businessHours,
                        timezone: e.target.value,
                      },
                    }
                  : prev,
              )
            }
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">ساعات کاری (زمان پاسخ)</h3>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              setData((prev) =>
                prev
                  ? {
                      ...prev,
                      businessHours: {
                        ...prev.businessHours,
                        days: [
                          ...prev.businessHours.days,
                          { weekday: 0, start: "09:00", end: "17:00" },
                        ],
                      },
                    }
                  : prev,
              )
            }
          >
            <Plus className="size-4" aria-hidden />
            روز
          </Button>
        </div>
        <ul className="space-y-2">
          {data.businessHours.days.map((day, index) => (
            <li
              key={`${day.weekday}-${index}`}
              className="flex flex-wrap items-end gap-2 rounded-lg border p-3"
            >
              <div className="space-y-1.5">
                <Label>روز</Label>
                <Select
                  value={String(day.weekday)}
                  onValueChange={(value) =>
                    updateDay(index, { weekday: Number(value) })
                  }
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WEEKDAY_LABELS.map((label, weekday) => (
                      <SelectItem key={label} value={String(weekday)}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>شروع</Label>
                <Input
                  value={day.start}
                  onChange={(e) => updateDay(index, { start: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>پایان</Label>
                <Input
                  value={day.end}
                  onChange={(e) => updateDay(index, { end: e.target.value })}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive"
                aria-label="حذف روز"
                onClick={() =>
                  setData((prev) =>
                    prev
                      ? {
                          ...prev,
                          businessHours: {
                            ...prev.businessHours,
                            days: prev.businessHours.days.filter(
                              (_, i) => i !== index,
                            ),
                          },
                        }
                      : prev,
                  )
                }
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      </div>

      <UnsavedChangesBar
        visible={dirty}
        isSaving={replace.isPending}
        onSave={() => void handleSave()}
        onDiscard={() => {
          if (!query.data) return;
          setData(query.data.data);
          setBaseline(JSON.stringify(query.data.data));
        }}
      />
    </div>
  );
}
