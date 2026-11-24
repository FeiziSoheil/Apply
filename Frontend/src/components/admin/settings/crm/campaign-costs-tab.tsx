/* eslint-disable react-hooks/set-state-in-effect -- hydrate editable drafts from TanStack Query */
"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { UnsavedChangesBar } from "@/components/admin/settings/unsaved-changes-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CampaignCostDraft } from "@/contracts/crm-settings";
import {
  useReplaceCampaignCostsSettings,
  useResetCampaignCostsSettings,
} from "@/features/crm-settings/mutations";
import { useCampaignCostsSettings } from "@/features/crm-settings/queries";
import { getApiErrorMessage } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { CrmSettingsTabSkeleton } from "./crm-settings-tab-skeleton";
import { ResetDefaultsButton } from "./reset-defaults-button";

type LocalCost = CampaignCostDraft & { localId: string };

export function CampaignCostsTab() {
  const query = useCampaignCostsSettings();
  const replace = useReplaceCampaignCostsSettings();
  const reset = useResetCampaignCostsSettings();
  const [items, setItems] = useState<LocalCost[]>([]);
  const [version, setVersion] = useState(1);
  const [baseline, setBaseline] = useState("");

  // Sync draft from server payload when query resolves / remounts via parent key when needed.

  
  useEffect(() => {
    if (!query.data) return;
    const local = query.data.items.map((item) => ({
      localId: item.id,
      id: item.id,
      yearMonth: item.yearMonth,
      source: item.source,
      campaign: item.campaign,
      costRials: item.costRials,
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
        yearMonth: item.yearMonth,
        source: item.source,
        campaign: item.campaign,
        costRials: item.costRials,
      }));
      setItems(local);
      setVersion(result.version);
      setBaseline(JSON.stringify(local));
      toast.success("هزینه کمپین‌ها ذخیره شد");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <div className="space-y-6" data-testid="crm-settings-campaign-costs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">هزینه کمپین‌ها</h2>
          <p className="text-muted-foreground text-sm">
            هزینه ماهانه هر منبع/کمپین به ریال (اختیاری برای گزارش‌ها).
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
                    yearMonth: item.yearMonth,
                    source: item.source,
                    campaign: item.campaign,
                    costRials: item.costRials,
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
                  yearMonth: "2026-10",
                  source: "assessment",
                  campaign: null,
                  costRials: 0,
                },
              ])
            }
          >
            <Plus className="size-4" aria-hidden />
            افزودن
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[36rem] text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-start font-medium">ماه (YYYY-MM)</th>
              <th className="px-3 py-2 text-start font-medium">منبع</th>
              <th className="px-3 py-2 text-start font-medium">کمپین</th>
              <th className="px-3 py-2 text-start font-medium">هزینه (ریال)</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.localId} className="border-t">
                <td className="px-3 py-2">
                  <Input
                    value={item.yearMonth}
                    aria-label="ماه"
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((row) =>
                          row.localId === item.localId
                            ? { ...row, yearMonth: e.target.value }
                            : row,
                        ),
                      )
                    }
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    value={item.source}
                    aria-label="منبع"
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((row) =>
                          row.localId === item.localId
                            ? { ...row, source: e.target.value }
                            : row,
                        ),
                      )
                    }
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    value={item.campaign ?? ""}
                    aria-label="کمپین"
                    placeholder="—"
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((row) =>
                          row.localId === item.localId
                            ? {
                                ...row,
                                campaign: e.target.value.trim() || null,
                              }
                            : row,
                        ),
                      )
                    }
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    min={0}
                    value={item.costRials}
                    aria-label="هزینه ریال"
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((row) =>
                          row.localId === item.localId
                            ? { ...row, costRials: Number(e.target.value) }
                            : row,
                        ),
                      )
                    }
                  />
                  <p className="text-muted-foreground mt-1 text-xs">
                    {formatNumber(item.costRials)} ریال
                  </p>
                </td>
                <td className="px-3 py-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    aria-label="حذف ردیف"
                    onClick={() =>
                      setItems((prev) =>
                        prev.filter((row) => row.localId !== item.localId),
                      )
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <UnsavedChangesBar
        visible={dirty}
        isSaving={replace.isPending}
        onSave={() => void handleSave()}
        onDiscard={() => {
          if (!query.data) return;
          const local = query.data.items.map((item) => ({
            localId: item.id,
            id: item.id,
            yearMonth: item.yearMonth,
            source: item.source,
            campaign: item.campaign,
            costRials: item.costRials,
          }));
          setItems(local);
          setBaseline(JSON.stringify(local));
        }}
      />
    </div>
  );
}
