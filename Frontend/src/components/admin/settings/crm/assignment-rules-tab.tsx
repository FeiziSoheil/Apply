/* eslint-disable react-hooks/set-state-in-effect -- hydrate editable drafts from TanStack Query */
"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SortableList } from "@/components/admin/fields/sortable-list";
import { UnsavedChangesBar } from "@/components/admin/settings/unsaved-changes-bar";
import { LEAD_SOURCE_LABELS } from "@/components/admin/leads/lead-labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ASSIGNMENT_STRATEGIES,
  type AssignmentCondition,
  type AssignmentStrategy,
} from "@/contracts/crm";
import type { AssignmentRuleDraft } from "@/contracts/crm-settings";
import { LEAD_SOURCES, type LeadSource } from "@/contracts/leads";
import {
  useReplaceAssignmentRulesSettings,
  useResetAssignmentRulesSettings,
  useSimulateAssignmentRule,
} from "@/features/crm-settings/mutations";
import { useAssignmentRulesSettings } from "@/features/crm-settings/queries";
import { useConsultants } from "@/features/content/queries";
import { getApiErrorMessage } from "@/lib/api";
import { CrmSettingsTabSkeleton } from "./crm-settings-tab-skeleton";
import { ResetDefaultsButton } from "./reset-defaults-button";

type LocalRule = AssignmentRuleDraft & { localId: string };

const STRATEGY_LABELS: Record<AssignmentStrategy, string> = {
  fixed: "ثابت",
  round_robin: "نوبتی (round-robin)",
  least_loaded: "کمترین بار",
};

function conditionSummary(conditions: AssignmentCondition[]): string {
  return conditions
    .map((c) => {
      if (c.type === "always") return "بدون شرط";
      if (c.type === "target_country") return `کشور: ${c.countrySlug}`;
      if (c.type === "source") return `منبع: ${c.source}`;
      return `کمپین: ${c.campaign}`;
    })
    .join(" و ");
}

export function AssignmentRulesTab() {
  const query = useAssignmentRulesSettings();
  const consultantsQuery = useConsultants({
    page: 1,
    pageSize: 100,
    sort: "order",
    order: "asc",
    active: true,
  });
  const replace = useReplaceAssignmentRulesSettings();
  const reset = useResetAssignmentRulesSettings();
  const simulate = useSimulateAssignmentRule();

  const [items, setItems] = useState<LocalRule[]>([]);
  const [version, setVersion] = useState(1);
  const [baseline, setBaseline] = useState("");
  const [hasDefault, setHasDefault] = useState(true);
  const [simCountry, setSimCountry] = useState("");
  const [simSource, setSimSource] = useState<LeadSource | "">("");
  const [simResult, setSimResult] = useState<string | null>(null);

  const consultants = consultantsQuery.data?.items ?? [];

  // Sync draft from server payload when query resolves / remounts via parent key when needed.

  
  useEffect(() => {
    if (!query.data) return;
    const local = query.data.items.map((item) => ({
      localId: item.id,
      id: item.id,
      order: item.order,
      active: item.active,
      conditions: item.conditions,
      strategy: item.strategy,
      consultantIds: item.consultantIds,
    }));
    setItems(local);
    setVersion(query.data.version);
    setHasDefault(query.data.hasDefaultRule);
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

  function syncOrders(next: LocalRule[]): LocalRule[] {
    return next.map((rule, index) => ({ ...rule, order: index }));
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
        order: item.order,
        active: item.active,
        conditions: item.conditions,
        strategy: item.strategy,
        consultantIds: item.consultantIds,
      }));
      setItems(local);
      setVersion(result.version);
      setHasDefault(result.hasDefaultRule);
      setBaseline(JSON.stringify(local));
      toast.success("قوانین تخصیص ذخیره شد");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <div className="space-y-6" data-testid="crm-settings-assignment">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">قوانین تخصیص</h2>
          <p className="text-muted-foreground text-sm">
            اولویت از بالا به پایین؛ اولین قانون منطبق اعمال می‌شود.
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
                    order: item.order,
                    active: item.active,
                    conditions: item.conditions,
                    strategy: item.strategy,
                    consultantIds: item.consultantIds,
                  }));
                  setItems(local);
                  setVersion(result.version);
                  setHasDefault(result.hasDefaultRule);
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
            onClick={() => {
              const firstConsultant = consultants[0]?.id;
              if (!firstConsultant) {
                toast.error("مشاوری برای قانون جدید موجود نیست");
                return;
              }
              setItems((prev) =>
                syncOrders([
                  ...prev,
                  {
                    localId: crypto.randomUUID(),
                    order: prev.length,
                    active: true,
                    conditions: [{ type: "always" }],
                    strategy: "round_robin",
                    consultantIds: [firstConsultant],
                  },
                ]),
              );
            }}
          >
            <Plus className="size-4" aria-hidden />
            افزودن قانون
          </Button>
        </div>
      </div>

      {!hasDefault ? (
        <div
          role="alert"
          className="border-destructive/40 bg-destructive/5 text-destructive flex gap-2 rounded-xl border px-3 py-2.5 text-sm"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">قانون پیش‌فرض ندارید</p>
            <p className="text-destructive/90 mt-0.5">
              بدون قانون «بدون شرط» (always)، برخی لیدها ممکن است بدون مسئول
              بمانند مگر مسئول پیش‌فرض در تب پیش‌فرض‌ها تنظیم شده باشد.
            </p>
          </div>
        </div>
      ) : null}

      <SortableList
        label="قوانین تخصیص"
        items={items}
        getId={(item) => item.localId}
        onReorder={(next) => setItems(syncOrders(next))}
        renderItem={(rule, { dragHandle }) => (
          <div className="bg-background space-y-3 rounded-lg border p-3">
            <div className="flex flex-wrap items-center gap-2">
              {dragHandle}
              <span className="text-muted-foreground text-xs">
                اولویت {rule.order + 1}
              </span>
              <span className="text-sm font-medium">
                {conditionSummary(rule.conditions)}
              </span>
              <div className="ms-auto flex items-center gap-2">
                <Switch
                  checked={rule.active ?? true}
                  onCheckedChange={(checked) =>
                    setItems((prev) =>
                      prev.map((row) =>
                        row.localId === rule.localId
                          ? { ...row, active: checked }
                          : row,
                      ),
                    )
                  }
                  aria-label="فعال"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  aria-label="حذف قانون"
                  onClick={() =>
                    setItems((prev) =>
                      syncOrders(
                        prev.filter((row) => row.localId !== rule.localId),
                      ),
                    )
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>نوع شرط</Label>
                <Select
                  value={rule.conditions[0]?.type ?? "always"}
                  onValueChange={(type) => {
                    let conditions: AssignmentCondition[];
                    if (type === "always") {
                      conditions = [{ type: "always" }];
                    } else if (type === "source") {
                      conditions = [{ type: "source", source: "assessment" }];
                    } else if (type === "target_country") {
                      conditions = [
                        { type: "target_country", countrySlug: "germany" },
                      ];
                    } else {
                      conditions = [
                        { type: "utm_campaign", campaign: "campaign" },
                      ];
                    }
                    setItems((prev) =>
                      prev.map((row) =>
                        row.localId === rule.localId
                          ? { ...row, conditions }
                          : row,
                      ),
                    );
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="always">بدون شرط</SelectItem>
                    <SelectItem value="target_country">کشور هدف</SelectItem>
                    <SelectItem value="source">منبع</SelectItem>
                    <SelectItem value="utm_campaign">utm campaign</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {rule.conditions[0]?.type === "source" ? (
                <div className="space-y-1.5">
                  <Label>منبع</Label>
                  <Select
                    value={rule.conditions[0].source}
                    onValueChange={(source) =>
                      setItems((prev) =>
                        prev.map((row) =>
                          row.localId === rule.localId
                            ? {
                                ...row,
                                conditions: [
                                  {
                                    type: "source",
                                    source,
                                  },
                                ],
                              }
                            : row,
                        ),
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_SOURCES.map((source) => (
                        <SelectItem key={source} value={source}>
                          {LEAD_SOURCE_LABELS[source]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              {rule.conditions[0]?.type === "target_country" ? (
                <div className="space-y-1.5">
                  <Label>اسلاگ کشور</Label>
                  <Input
                    value={rule.conditions[0].countrySlug}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((row) =>
                          row.localId === rule.localId
                            ? {
                                ...row,
                                conditions: [
                                  {
                                    type: "target_country",
                                    countrySlug: e.target.value,
                                  },
                                ],
                              }
                            : row,
                        ),
                      )
                    }
                  />
                </div>
              ) : null}

              {rule.conditions[0]?.type === "utm_campaign" ? (
                <div className="space-y-1.5">
                  <Label>کمپین</Label>
                  <Input
                    value={rule.conditions[0].campaign}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((row) =>
                          row.localId === rule.localId
                            ? {
                                ...row,
                                conditions: [
                                  {
                                    type: "utm_campaign",
                                    campaign: e.target.value,
                                  },
                                ],
                              }
                            : row,
                        ),
                      )
                    }
                  />
                </div>
              ) : null}

              <div className="space-y-1.5">
                <Label>راهبرد</Label>
                <Select
                  value={rule.strategy}
                  onValueChange={(strategy) =>
                    setItems((prev) =>
                      prev.map((row) =>
                        row.localId === rule.localId
                          ? {
                              ...row,
                              strategy: strategy as AssignmentStrategy,
                            }
                          : row,
                      ),
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSIGNMENT_STRATEGIES.map((strategy) => (
                      <SelectItem key={strategy} value={strategy}>
                        {STRATEGY_LABELS[strategy]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label>مشاوران (اولین برای fixed)</Label>
                <Select
                  value={rule.consultantIds[0] ?? ""}
                  onValueChange={(id) =>
                    setItems((prev) =>
                      prev.map((row) =>
                        row.localId === rule.localId
                          ? { ...row, consultantIds: [id] }
                          : row,
                      ),
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب مشاور" />
                  </SelectTrigger>
                  <SelectContent>
                    {consultants.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      />

      <section
        className="space-y-3 rounded-xl border p-4"
        data-testid="assignment-simulator"
      >
        <h3 className="font-semibold">شبیه‌ساز تخصیص</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="sim-country">کشور هدف</Label>
            <Input
              id="sim-country"
              value={simCountry}
              placeholder="germany"
              onChange={(e) => setSimCountry(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>منبع</Label>
            <Select
              value={simSource || undefined}
              onValueChange={(value) => setSimSource(value as LeadSource)}
            >
              <SelectTrigger>
                <SelectValue placeholder="انتخاب منبع" />
              </SelectTrigger>
              <SelectContent>
                {LEAD_SOURCES.map((source) => (
                  <SelectItem key={source} value={source}>
                    {LEAD_SOURCE_LABELS[source]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              className="w-full"
              disabled={simulate.isPending}
              onClick={() => {
                void simulate
                  .mutateAsync({
                    targetCountry: simCountry || undefined,
                    source: simSource || undefined,
                  })
                  .then((result) => {
                    if (result.matched) {
                      setSimResult(
                        `قانون اولویت ${(result.ruleOrder ?? 0) + 1} → ${result.consultantName ?? result.consultantId}`,
                      );
                    } else if (result.usedDefaultAssignee) {
                      setSimResult(
                        `بدون قانون منطبق؛ مسئول پیش‌فرض: ${result.consultantName ?? result.consultantId}`,
                      );
                    } else {
                      setSimResult("هیچ قانونی منطبق نشد و مسئول پیش‌فرض نیست");
                    }
                  })
                  .catch((error: unknown) =>
                    toast.error(getApiErrorMessage(error)),
                  );
              }}
            >
              شبیه‌سازی
            </Button>
          </div>
        </div>
        {simResult ? (
          <p
            className="bg-muted rounded-lg px-3 py-2 text-sm"
            data-testid="assignment-sim-result"
          >
            {simResult}
          </p>
        ) : null}
      </section>

      <UnsavedChangesBar
        visible={dirty}
        isSaving={replace.isPending}
        onSave={() => void handleSave()}
        onDiscard={() => {
          if (!query.data) return;
          const local = query.data.items.map((item) => ({
            localId: item.id,
            id: item.id,
            order: item.order,
            active: item.active,
            conditions: item.conditions,
            strategy: item.strategy,
            consultantIds: item.consultantIds,
          }));
          setItems(local);
          setBaseline(JSON.stringify(local));
        }}
      />
    </div>
  );
}
