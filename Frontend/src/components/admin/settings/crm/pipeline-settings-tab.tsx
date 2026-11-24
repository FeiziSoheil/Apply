"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SortableList } from "@/components/admin/fields/sortable-list";
import { UnsavedChangesBar } from "@/components/admin/settings/unsaved-changes-bar";
import { LEAD_STAGE_KIND_MAP } from "@/components/admin/leads/lead-labels";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PIPELINE_STAGE_COLORS,
  PIPELINE_STAGE_KINDS,
  type PipelineStageColor,
  type PipelineStageKind,
} from "@/contracts/crm";
import type { PipelineStageDraft } from "@/contracts/crm-settings";
import {
  useReplacePipelineSettings,
  useResetPipelineSettings,
} from "@/features/crm-settings/mutations";
import { usePipelineSettings } from "@/features/crm-settings/queries";
import { getApiErrorMessage } from "@/lib/api";
import { ResetDefaultsButton } from "./reset-defaults-button";
import { CrmSettingsTabSkeleton } from "./crm-settings-tab-skeleton";
import { stageColorBarClass, stageColorDotClass } from "./stage-color";

type LocalStage = PipelineStageDraft & { localId: string };

function toLocal(stages: readonly { id: string; key: string; title: string; order: number; color: PipelineStageColor; kind: PipelineStageKind; wipLimit: number | null }[]): LocalStage[] {
  return [...stages]
    .sort((a, b) => a.order - b.order)
    .map((s) => ({
      localId: s.id,
      id: s.id,
      key: s.key,
      title: s.title,
      order: s.order,
      color: s.color,
      kind: s.kind,
      wipLimit: s.wipLimit,
    }));
}

function slugifyKey(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s_]/g, "")
    .replace(/\s+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40) || `stage_${Date.now()}`;
}

export function PipelineSettingsTab() {
  const query = usePipelineSettings();
  if (query.isPending && !query.data) return <CrmSettingsTabSkeleton />;
  if (query.error && !query.data) {
    return (
      <p className="text-sm text-destructive">
        {getApiErrorMessage(query.error)}
      </p>
    );
  }
  if (!query.data) return <CrmSettingsTabSkeleton />;
  return (
    <PipelineSettingsEditor
      key={query.data.version}
      initial={query.data}
    />
  );
}

function PipelineSettingsEditor({
  initial,
}: {
  initial: { version: number; stages: Parameters<typeof toLocal>[0] };
}) {
  const replace = useReplacePipelineSettings();
  const reset = useResetPipelineSettings();
  const initialLocal = toLocal(initial.stages);
  const [stages, setStages] = useState<LocalStage[]>(initialLocal);
  const [version, setVersion] = useState(initial.version);
  const [baseline, setBaseline] = useState(JSON.stringify(initialLocal));
  const [migrateOpen, setMigrateOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<LocalStage | null>(null);
  const [migrateTo, setMigrateTo] = useState<string>("");
  const [migrateMap, setMigrateMap] = useState<Record<string, string>>({});

  const dirty = JSON.stringify(stages) !== baseline;

  const preview = useMemo(
    () => [...stages].sort((a, b) => a.order - b.order),
    [stages],
  );

  function syncOrders(next: LocalStage[]): LocalStage[] {
    return next.map((stage, index) => ({ ...stage, order: index }));
  }

  function updateStage(localId: string, patch: Partial<LocalStage>) {
    setStages((prev) =>
      prev.map((s) => (s.localId === localId ? { ...s, ...patch } : s)),
    );
  }

  function requestDelete(stage: LocalStage) {
    const serverId = stage.id;
    if (serverId) {
      setPendingDelete(stage);
      setMigrateTo("");
      setMigrateOpen(true);
      return;
    }
    setStages((prev) => syncOrders(prev.filter((s) => s.localId !== stage.localId)));
  }

  function confirmDelete(withMigrate: boolean) {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    if (withMigrate && id && migrateTo) {
      setMigrateMap((prev) => ({ ...prev, [id]: migrateTo }));
    }
    setStages((prev) =>
      syncOrders(prev.filter((s) => s.localId !== pendingDelete.localId)),
    );
    setMigrateOpen(false);
    setPendingDelete(null);
  }

  async function handleSave() {
    try {
      const result = await replace.mutateAsync({
        version,
        body: {
          stages: stages.map(({ localId: _l, ...draft }) => ({
            ...draft,
            wipLimit: draft.wipLimit ?? null,
          })),
          migrateLeads: migrateMap,
        },
      });
      const local = toLocal(result.stages);
      setStages(local);
      setVersion(result.version);
      setBaseline(JSON.stringify(local));
      setMigrateMap({});
      toast.success("پایپ‌لاین ذخیره شد");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function handleReset() {
    try {
      const result = await reset.mutateAsync(version);
      const local = toLocal(result.stages);
      setStages(local);
      setVersion(result.version);
      setBaseline(JSON.stringify(local));
      setMigrateMap({});
      toast.success("پایپ‌لاین به پیش‌فرض بازگشت");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <div className="space-y-6" data-testid="crm-settings-pipeline">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">پایپ‌لاین</h2>
          <p className="text-muted-foreground text-sm">
            حداقل یک مرحله از هر نوع؛ حذف مرحله دارای لید فقط با انتقال.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ResetDefaultsButton
            isPending={reset.isPending}
            onConfirm={() => void handleReset()}
          />
          <Button
            type="button"
            size="sm"
            onClick={() => {
              const localId = crypto.randomUUID();
              setStages((prev) =>
                syncOrders([
                  ...prev,
                  {
                    localId,
                    key: `open_${prev.length}`,
                    title: "مرحله جدید",
                    order: prev.length,
                    color: "slate",
                    kind: "open",
                    wipLimit: null,
                  },
                ]),
              );
            }}
          >
            <Plus className="size-4" aria-hidden />
            افزودن مرحله
          </Button>
        </div>
      </div>

      <div
        className="bg-muted/40 flex gap-1 overflow-x-auto rounded-xl border p-3"
        aria-label="پیش‌نمایش نوار کانبان"
        data-testid="pipeline-kanban-preview"
      >
        {preview.map((stage) => (
          <div
            key={stage.localId}
            className="flex min-w-24 flex-1 flex-col gap-1"
            data-stage-key={stage.key}
            data-stage-title={stage.title}
          >
            <div className={stageColorBarClass(stage.color)} />
            <span className="truncate text-center text-xs font-medium">
              {stage.title}
            </span>
          </div>
        ))}
      </div>

      <SortableList
        label="مراحل پایپ‌لاین"
        items={stages}
        getId={(item) => item.localId}
        onReorder={(next) => setStages(syncOrders(next))}
        renderItem={(stage, { dragHandle }) => (
          <div className="bg-background flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-start">
            <div className="flex items-center gap-2 pt-1">{dragHandle}</div>
            <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor={`title-${stage.localId}`}>عنوان</Label>
                <Input
                  id={`title-${stage.localId}`}
                  value={stage.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    updateStage(stage.localId, {
                      title,
                      key: stage.id ? stage.key : slugifyKey(title),
                    });
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`key-${stage.localId}`}>کلید</Label>
                <Input
                  id={`key-${stage.localId}`}
                  value={stage.key}
                  disabled={Boolean(stage.id)}
                  onChange={(e) =>
                    updateStage(stage.localId, { key: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>نوع</Label>
                <Select
                  value={stage.kind}
                  onValueChange={(value) =>
                    updateStage(stage.localId, {
                      kind: value as PipelineStageKind,
                    })
                  }
                >
                  <SelectTrigger aria-label={`نوع ${stage.title}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PIPELINE_STAGE_KINDS.map((kind) => (
                      <SelectItem key={kind} value={kind}>
                        {LEAD_STAGE_KIND_MAP[kind].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>رنگ</Label>
                <Select
                  value={stage.color}
                  onValueChange={(value) =>
                    updateStage(stage.localId, {
                      color: value as PipelineStageColor,
                    })
                  }
                >
                  <SelectTrigger aria-label={`رنگ ${stage.title}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PIPELINE_STAGE_COLORS.map((color) => (
                      <SelectItem key={color} value={color}>
                        <span className="inline-flex items-center gap-2">
                          <span className={stageColorDotClass(color)} />
                          {color}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`wip-${stage.localId}`}>سقف WIP</Label>
                <Input
                  id={`wip-${stage.localId}`}
                  type="number"
                  min={1}
                  placeholder="بدون سقف"
                  value={stage.wipLimit ?? ""}
                  onChange={(e) => {
                    const raw = e.target.value;
                    updateStage(stage.localId, {
                      wipLimit: raw === "" ? null : Number(raw),
                    });
                  }}
                />
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-destructive"
              aria-label={`حذف ${stage.title}`}
              onClick={() => requestDelete(stage)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        )}
      />

      <UnsavedChangesBar
        visible={dirty}
        isSaving={replace.isPending}
        onSave={() => void handleSave()}
        onDiscard={() => {
          const local = toLocal(initial.stages);
          setStages(local);
          setBaseline(JSON.stringify(local));
          setMigrateMap({});
        }}
      />

      <Dialog open={migrateOpen} onOpenChange={setMigrateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حذف مرحله دارای لید؟</DialogTitle>
            <DialogDescription>
              اگر این مرحله سرنخ دارد، ابتدا مقصد انتقال را انتخاب کنید. در غیر
              این صورت می‌توانید بدون انتقال حذف کنید (اگر سرنخ نباشد سرور
              قبول می‌کند).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>انتقال لیدها به مرحله</Label>
            <Select value={migrateTo} onValueChange={setMigrateTo}>
              <SelectTrigger aria-label="مرحله مقصد انتقال لیدها">
                <SelectValue placeholder="انتخاب مرحله مقصد" />
              </SelectTrigger>
              <SelectContent>
                {stages
                  .filter((s) => s.localId !== pendingDelete?.localId && s.id)
                  .map((s) => (
                    <SelectItem key={s.localId} value={s.id!}>
                      {s.title}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => confirmDelete(false)}
            >
              حذف بدون انتقال
            </Button>
            <Button
              type="button"
              disabled={!migrateTo}
              onClick={() => confirmDelete(true)}
            >
              انتقال لیدها و حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
