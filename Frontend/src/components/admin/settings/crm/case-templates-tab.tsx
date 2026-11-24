/* eslint-disable react-hooks/set-state-in-effect -- hydrate editable drafts from TanStack Query */
"use client";

import { useEffect, useState } from "react";
import { Copy, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { UnsavedChangesBar } from "@/components/admin/settings/unsaved-changes-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CaseTemplate } from "@/contracts/crm";
import type { CaseTemplateDraft } from "@/contracts/crm-settings";

type CaseTemplateStage = CaseTemplate["stages"][number];
import {
  useCopyCaseTemplate,
  useReplaceCaseTemplatesSettings,
  useResetCaseTemplatesSettings,
} from "@/features/crm-settings/mutations";
import { useCaseTemplatesSettings } from "@/features/crm-settings/queries";
import { getApiErrorMessage } from "@/lib/api";
import { CrmSettingsTabSkeleton } from "./crm-settings-tab-skeleton";
import { ResetDefaultsButton } from "./reset-defaults-button";

type LocalTpl = CaseTemplateDraft & { localId: string };

function emptyStage(order: number): CaseTemplateStage {
  return {
    key: `stage_${order}`,
    title: "مرحله جدید",
    order,
    requiredDocuments: [],
    defaultTasks: [],
  };
}

export function CaseTemplatesTab() {
  const query = useCaseTemplatesSettings();
  const replace = useReplaceCaseTemplatesSettings();
  const reset = useResetCaseTemplatesSettings();
  const copy = useCopyCaseTemplate();

  const [items, setItems] = useState<LocalTpl[]>([]);
  const [version, setVersion] = useState(1);
  const [baseline, setBaseline] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copyOpen, setCopyOpen] = useState(false);
  const [copySource, setCopySource] = useState("");
  const [copyCountry, setCopyCountry] = useState("");

  // Sync draft from server payload when query resolves / remounts via parent key when needed.

  
  useEffect(() => {
    if (!query.data) return;
    const local = query.data.items.map((item) => ({
      localId: item.id,
      id: item.id,
      countrySlug: item.countrySlug,
      title: item.title,
      stages: item.stages,
    }));
    setItems(local);
    setVersion(query.data.version);
    setBaseline(JSON.stringify(local));
    setSelectedId(local[0]?.localId ?? null);
  }, [query.data]);

  const dirty = JSON.stringify(items) !== baseline;
  const selected = items.find((item) => item.localId === selectedId) ?? null;

  if (query.isPending && !query.data) return <CrmSettingsTabSkeleton />;
  if (query.error && !query.data) {
    return (
      <p className="text-sm text-destructive">
        {getApiErrorMessage(query.error)}
      </p>
    );
  }

  function updateSelected(patch: Partial<LocalTpl>) {
    if (!selectedId) return;
    setItems((prev) =>
      prev.map((row) =>
        row.localId === selectedId ? { ...row, ...patch } : row,
      ),
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
        countrySlug: item.countrySlug,
        title: item.title,
        stages: item.stages,
      }));
      setItems(local);
      setVersion(result.version);
      setBaseline(JSON.stringify(local));
      setSelectedId(local[0]?.localId ?? null);
      toast.success("قالب‌های پرونده ذخیره شد");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <div className="space-y-6" data-testid="crm-settings-case-templates">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">قالب پرونده‌ها</h2>
          <p className="text-muted-foreground text-sm">
            قالب عمومی (بدون کشور) یا اختصاصی هر کشور.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ResetDefaultsButton
            isPending={reset.isPending}
            onConfirm={() => {
              void reset
                .mutateAsync(version)
                .then((result) => {
                  const local = result.items.map((item) => ({
                    localId: item.id,
                    id: item.id,
                    countrySlug: item.countrySlug,
                    title: item.title,
                    stages: item.stages,
                  }));
                  setItems(local);
                  setVersion(result.version);
                  setBaseline(JSON.stringify(local));
                  setSelectedId(local[0]?.localId ?? null);
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
            variant="outline"
            onClick={() => setCopyOpen(true)}
          >
            <Copy className="size-4" aria-hidden />
            کپی از قالب کشور دیگر
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              const localId = crypto.randomUUID();
              setItems((prev) => [
                ...prev,
                {
                  localId,
                  countrySlug: null,
                  title: "قالب جدید",
                  stages: [emptyStage(0)],
                },
              ]);
              setSelectedId(localId);
            }}
          >
            <Plus className="size-4" aria-hidden />
            افزودن
          </Button>
        </div>
      </div>

      <div
        role="note"
        className="bg-muted/40 rounded-xl border px-3 py-2.5 text-sm"
      >
        <p className="font-medium">مهاجرت مرحله</p>
        <p className="text-muted-foreground mt-0.5">
          حذف یا تغییر کلیدی مرحله‌ای که پرونده فعال دارد رد می‌شود. ابتدا
          پرونده‌ها را در لیست پرونده‌ها به مرحله دیگر منتقل کنید.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[14rem_1fr]">
        <ul className="divide-border max-h-[28rem] divide-y overflow-y-auto rounded-xl border">
          {items.map((item) => (
            <li key={item.localId}>
              <button
                type="button"
                className={`hover:bg-muted/60 flex w-full flex-col gap-0.5 px-3 py-2.5 text-start text-sm ${
                  item.localId === selectedId ? "bg-muted" : ""
                }`}
                onClick={() => setSelectedId(item.localId)}
              >
                <span className="font-medium">{item.title}</span>
                <span className="text-muted-foreground text-xs">
                  {item.countrySlug ?? "عمومی"}
                </span>
              </button>
            </li>
          ))}
        </ul>

        {selected ? (
          <div className="space-y-4 rounded-xl border p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="case-tpl-title">عنوان</Label>
                <Input
                  id="case-tpl-title"
                  value={selected.title}
                  onChange={(e) => updateSelected({ title: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="case-tpl-country">کشور (خالی = عمومی)</Label>
                <Input
                  id="case-tpl-country"
                  value={selected.countrySlug ?? ""}
                  placeholder="germany"
                  onChange={(e) =>
                    updateSelected({
                      countrySlug: e.target.value.trim() || null,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">مراحل</h3>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    updateSelected({
                      stages: [
                        ...selected.stages,
                        emptyStage(selected.stages.length),
                      ],
                    })
                  }
                >
                  افزودن مرحله
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => {
                    setItems((prev) =>
                      prev.filter((row) => row.localId !== selected.localId),
                    );
                    setSelectedId(null);
                  }}
                >
                  <Trash2 className="size-4" aria-hidden />
                  حذف قالب
                </Button>
              </div>
            </div>

            <ul className="space-y-3">
              {selected.stages.map((stage, index) => (
                <li
                  key={`${stage.key}-${index}`}
                  className="space-y-2 rounded-lg border p-3"
                >
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      aria-label={`عنوان مرحله ${index + 1}`}
                      value={stage.title}
                      onChange={(e) => {
                        const stages = selected.stages.map((s, i) =>
                          i === index ? { ...s, title: e.target.value } : s,
                        );
                        updateSelected({ stages });
                      }}
                    />
                    <Input
                      aria-label={`کلید مرحله ${index + 1}`}
                      value={stage.key}
                      onChange={(e) => {
                        const stages = selected.stages.map((s, i) =>
                          i === index ? { ...s, key: e.target.value } : s,
                        );
                        updateSelected({ stages });
                      }}
                    />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">مدارک (عنوان، الزامی)</Label>
                      {(stage.requiredDocuments ?? []).map((doc, docIndex) => (
                        <div key={doc.key} className="flex gap-2">
                          <Input
                            value={doc.title}
                            onChange={(e) => {
                              const docs = stage.requiredDocuments.map(
                                (d, i) =>
                                  i === docIndex
                                    ? { ...d, title: e.target.value }
                                    : d,
                              );
                              const stages = selected.stages.map((s, i) =>
                                i === index
                                  ? { ...s, requiredDocuments: docs }
                                  : s,
                              );
                              updateSelected({ stages });
                            }}
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const docs = stage.requiredDocuments.map(
                                (d, i) =>
                                  i === docIndex
                                    ? { ...d, required: !d.required }
                                    : d,
                              );
                              const stages = selected.stages.map((s, i) =>
                                i === index
                                  ? { ...s, requiredDocuments: docs }
                                  : s,
                              );
                              updateSelected({ stages });
                            }}
                          >
                            {doc.required ? "الزامی" : "اختیاری"}
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const key = `doc_${stage.requiredDocuments.length}`;
                          const docs = [
                            ...stage.requiredDocuments,
                            { key, title: "مدرک", required: true },
                          ];
                          const stages = selected.stages.map((s, i) =>
                            i === index
                              ? { ...s, requiredDocuments: docs }
                              : s,
                          );
                          updateSelected({ stages });
                        }}
                      >
                        + مدرک
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">کار پیش‌فرض (روز تا سررسید)</Label>
                      {(stage.defaultTasks ?? []).map((task, taskIndex) => (
                        <div key={`${task.title}-${taskIndex}`} className="flex gap-2">
                          <Input
                            value={task.title}
                            onChange={(e) => {
                              const tasks = stage.defaultTasks.map((t, i) =>
                                i === taskIndex
                                  ? { ...t, title: e.target.value }
                                  : t,
                              );
                              const stages = selected.stages.map((s, i) =>
                                i === index
                                  ? { ...s, defaultTasks: tasks }
                                  : s,
                              );
                              updateSelected({ stages });
                            }}
                          />
                          <Input
                            type="number"
                            className="w-20"
                            value={task.dueOffsetDays}
                            onChange={(e) => {
                              const tasks = stage.defaultTasks.map((t, i) =>
                                i === taskIndex
                                  ? {
                                      ...t,
                                      dueOffsetDays: Number(e.target.value),
                                    }
                                  : t,
                              );
                              const stages = selected.stages.map((s, i) =>
                                i === index
                                  ? { ...s, defaultTasks: tasks }
                                  : s,
                              );
                              updateSelected({ stages });
                            }}
                          />
                        </div>
                      ))}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const tasks = [
                            ...stage.defaultTasks,
                            { title: "کار جدید", dueOffsetDays: 3 },
                          ];
                          const stages = selected.stages.map((s, i) =>
                            i === index ? { ...s, defaultTasks: tasks } : s,
                          );
                          updateSelected({ stages });
                        }}
                      >
                        + کار
                      </Button>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => {
                      const stages = selected.stages
                        .filter((_, i) => i !== index)
                        .map((s, i) => ({ ...s, order: i }));
                      updateSelected({ stages });
                    }}
                  >
                    حذف مرحله
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
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
            countrySlug: item.countrySlug,
            title: item.title,
            stages: item.stages,
          }));
          setItems(local);
          setBaseline(JSON.stringify(local));
          setSelectedId(local[0]?.localId ?? null);
        }}
      />

      <Dialog open={copyOpen} onOpenChange={setCopyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>کپی از قالب کشور دیگر</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label>قالب مبدأ</Label>
              <Select value={copySource} onValueChange={setCopySource}>
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب" />
                </SelectTrigger>
                <SelectContent>
                  {items
                    .filter((t) => t.id)
                    .map((t) => (
                      <SelectItem key={t.id} value={t.id!}>
                        {t.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>اسلاگ کشور مقصد (خالی = عمومی)</Label>
              <Input
                value={copyCountry}
                onChange={(e) => setCopyCountry(e.target.value)}
                placeholder="italy"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              disabled={!copySource || copy.isPending}
              onClick={() => {
                void copy
                  .mutateAsync({
                    sourceId: copySource,
                    countrySlug: copyCountry.trim() || null,
                  })
                  .then(() => {
                    toast.success("قالب کپی شد");
                    setCopyOpen(false);
                    void query.refetch();
                  })
                  .catch((error: unknown) =>
                    toast.error(getApiErrorMessage(error)),
                  );
              }}
            >
              کپی
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
