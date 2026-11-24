/* eslint-disable react-hooks/set-state-in-effect -- hydrate editable drafts from TanStack Query */
"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { UnsavedChangesBar } from "@/components/admin/settings/unsaved-changes-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { LostReasonDraft } from "@/contracts/crm-settings";
import {
  useReplaceLostReasonsSettings,
  useResetLostReasonsSettings,
} from "@/features/crm-settings/mutations";
import { useLostReasonsSettings } from "@/features/crm-settings/queries";
import { getApiErrorMessage } from "@/lib/api";
import { CrmSettingsTabSkeleton } from "./crm-settings-tab-skeleton";
import { ResetDefaultsButton } from "./reset-defaults-button";

type LocalReason = LostReasonDraft & { localId: string };

export function LostReasonsTab() {
  const query = useLostReasonsSettings();
  const replace = useReplaceLostReasonsSettings();
  const reset = useResetLostReasonsSettings();
  const [items, setItems] = useState<LocalReason[]>([]);
  const [version, setVersion] = useState(1);
  const [baseline, setBaseline] = useState("");

  // Sync draft from server payload when query resolves / remounts via parent key when needed.

  
  useEffect(() => {
    if (!query.data) return;
    const local = query.data.items.map((item) => ({
      localId: item.id,
      id: item.id,
      title: item.title,
      active: item.active,
    }));
    setItems(local);
    setVersion(query.data.version);
    setBaseline(JSON.stringify(local));
  }, [query.data]);

  const dirty = JSON.stringify(items) !== baseline;

  if (query.isPending && !query.data) return <CrmSettingsTabSkeleton />;
  if (query.error && !query.data) {
    return (
      <p className="text-sm text-destructive">
        {getApiErrorMessage(query.error)}
      </p>
    );
  }

  async function handleSave() {
    try {
      const result = await replace.mutateAsync({
        version,
        body: {
          items: items.map((item) => {
          const { localId: _omit, ...rest } = item;
          void _omit;
          return rest;
        }),
        },
      });
      const local = result.items.map((item) => ({
        localId: item.id,
        id: item.id,
        title: item.title,
        active: item.active,
      }));
      setItems(local);
      setVersion(result.version);
      setBaseline(JSON.stringify(local));
      toast.success("دلایل ریزش ذخیره شد");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <div className="space-y-6" data-testid="crm-settings-lost-reasons">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">دلایل ریزش</h2>
          <p className="text-muted-foreground text-sm">
            دلایل غیرفعال در انتخاب جدید دیده نمی‌شوند ولی در گزارش می‌مانند.
          </p>
        </div>
        <div className="flex gap-2">
          <ResetDefaultsButton
            isPending={reset.isPending}
            onConfirm={() => {
              void reset
                .mutateAsync(version)
                .then((result) => {
                  const local = result.items.map((item) => ({
                    localId: item.id,
                    id: item.id,
                    title: item.title,
                    active: item.active,
                  }));
                  setItems(local);
                  setVersion(result.version);
                  setBaseline(JSON.stringify(local));
                  toast.success("به پیش‌فرض بازگشت");
                })
                .catch((error: unknown) =>
                  toast.error(getApiErrorMessage(error)),
                );
            }}
          />
          <Button
            type="button"
            size="sm"
            onClick={() =>
              setItems((prev) => [
                ...prev,
                {
                  localId: crypto.randomUUID(),
                  title: "دلیل جدید",
                  active: true,
                },
              ])
            }
          >
            <Plus className="size-4" aria-hidden />
            افزودن
          </Button>
        </div>
      </div>

      <ul className="divide-border divide-y rounded-xl border">
        {items.map((item, index) => (
          <li
            key={item.localId}
            className="flex flex-wrap items-center gap-3 px-3 py-2.5"
          >
            <Input
              aria-label={`عنوان دلیل ${index + 1}`}
              value={item.title}
              className="min-w-40 flex-1"
              onChange={(e) =>
                setItems((prev) =>
                  prev.map((row) =>
                    row.localId === item.localId
                      ? { ...row, title: e.target.value }
                      : row,
                  ),
                )
              }
            />
            <div className="flex items-center gap-2">
              <Switch
                id={`active-${item.localId}`}
                checked={item.active ?? true}
                onCheckedChange={(checked) =>
                  setItems((prev) =>
                    prev.map((row) =>
                      row.localId === item.localId
                        ? { ...row, active: checked }
                        : row,
                    ),
                  )
                }
              />
              <Label htmlFor={`active-${item.localId}`}>فعال</Label>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-destructive"
              aria-label={`حذف ${item.title}`}
              onClick={() =>
                setItems((prev) =>
                  prev.filter((row) => row.localId !== item.localId),
                )
              }
            >
              <Trash2 className="size-4" />
            </Button>
          </li>
        ))}
      </ul>

      <UnsavedChangesBar
        visible={dirty}
        isSaving={replace.isPending}
        onSave={() => void handleSave()}
        onDiscard={() => {
          if (!query.data) return;
          const local = query.data.items.map((item) => ({
            localId: item.id,
            id: item.id,
            title: item.title,
            active: item.active,
          }));
          setItems(local);
          setBaseline(JSON.stringify(local));
        }}
      />
    </div>
  );
}
