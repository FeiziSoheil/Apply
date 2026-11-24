/* eslint-disable react-hooks/set-state-in-effect -- hydrate editable drafts from TanStack Query */
"use client";

import { useEffect, useState } from "react";
import { GitMerge, Plus, Trash2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PIPELINE_STAGE_COLORS, type PipelineStageColor } from "@/contracts/crm";
import type { TagDraft } from "@/contracts/crm-settings";
import {
  useMergeTags,
  useReplaceTagsSettings,
  useResetTagsSettings,
} from "@/features/crm-settings/mutations";
import { useTagsSettings } from "@/features/crm-settings/queries";
import { getApiErrorMessage } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { CrmSettingsTabSkeleton } from "./crm-settings-tab-skeleton";
import { ResetDefaultsButton } from "./reset-defaults-button";
import { stageColorDotClass } from "./stage-color";

type LocalTag = TagDraft & { localId: string; usageCount?: number };

export function TagsSettingsTab() {
  const query = useTagsSettings();
  const replace = useReplaceTagsSettings();
  const reset = useResetTagsSettings();
  const merge = useMergeTags();
  const [items, setItems] = useState<LocalTag[]>([]);
  const [version, setVersion] = useState(1);
  const [baseline, setBaseline] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeSource, setMergeSource] = useState("");
  const [mergeTarget, setMergeTarget] = useState("");

  // Sync draft from server payload when query resolves / remounts via parent key when needed.

  
  useEffect(() => {
    if (!query.data) return;
    const local = query.data.items.map((item) => ({
      localId: item.id,
      id: item.id,
      title: item.title,
      color: item.color,
      usageCount: item.usageCount,
    }));
    setItems(local);
    setVersion(query.data.version);
    setBaseline(JSON.stringify(local.map(({ usageCount, ...rest }) => rest)));
  }, [query.data]);

  const serializable = items.map(({ usageCount, ...rest }) => rest);
  const dirty = JSON.stringify(serializable) !== baseline;

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
          items: items.map(({ localId, usageCount, ...rest }) => rest),
        },
      });
      const local = result.items.map((item) => ({
        localId: item.id,
        id: item.id,
        title: item.title,
        color: item.color,
        usageCount: item.usageCount,
      }));
      setItems(local);
      setVersion(result.version);
      setBaseline(
        JSON.stringify(local.map(({ usageCount, ...rest }) => rest)),
      );
      toast.success("تگ‌ها ذخیره شد");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <div className="space-y-6" data-testid="crm-settings-tags">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">تگ‌ها</h2>
          <p className="text-muted-foreground text-sm">
            مدیریت نام و رنگ؛ ادغام تگ‌ها استفاده را منتقل می‌کند.
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
                    title: item.title,
                    color: item.color,
                    usageCount: item.usageCount,
                  }));
                  setItems(local);
                  setVersion(result.version);
                  setBaseline(
                    JSON.stringify(
                      local.map(({ usageCount, ...rest }) => rest),
                    ),
                  );
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
            onClick={() => setMergeOpen(true)}
          >
            <GitMerge className="size-4" aria-hidden />
            ادغام تگ‌ها
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() =>
              setItems((prev) => [
                ...prev,
                {
                  localId: crypto.randomUUID(),
                  title: "تگ جدید",
                  color: "slate",
                  usageCount: 0,
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
        {items.map((item) => (
          <li
            key={item.localId}
            className="flex flex-wrap items-center gap-3 px-3 py-2.5"
          >
            <Input
              aria-label={`نام تگ ${item.title}`}
              value={item.title}
              className="min-w-36 flex-1"
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
            <Select
              value={item.color ?? "slate"}
              onValueChange={(value) =>
                setItems((prev) =>
                  prev.map((row) =>
                    row.localId === item.localId
                      ? { ...row, color: value as PipelineStageColor }
                      : row,
                  ),
                )
              }
            >
              <SelectTrigger className="w-36" aria-label={`رنگ ${item.title}`}>
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
            <span className="text-muted-foreground text-xs tabular-nums">
              {formatNumber(item.usageCount ?? 0)} استفاده
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-destructive"
              aria-label={`حذف ${item.title}`}
              onClick={() => setDeleteId(item.localId)}
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
            color: item.color,
            usageCount: item.usageCount,
          }));
          setItems(local);
          setBaseline(
            JSON.stringify(local.map(({ usageCount, ...rest }) => rest)),
          );
        }}
      />

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف تگ؟</AlertDialogTitle>
            <AlertDialogDescription>
              تگ از لیدها جدا می‌شود. پس از ذخیره، حذف قطعی است.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deleteId) return;
                setItems((prev) => prev.filter((row) => row.localId !== deleteId));
                setDeleteId(null);
              }}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={mergeOpen} onOpenChange={setMergeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ادغام تگ‌ها</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label>تگ مبدأ (حذف می‌شود)</Label>
              <Select value={mergeSource} onValueChange={setMergeSource}>
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
              <Label>تگ مقصد</Label>
              <Select value={mergeTarget} onValueChange={setMergeTarget}>
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب" />
                </SelectTrigger>
                <SelectContent>
                  {items
                    .filter((t) => t.id && t.id !== mergeSource)
                    .map((t) => (
                      <SelectItem key={t.id} value={t.id!}>
                        {t.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              disabled={!mergeSource || !mergeTarget || merge.isPending}
              onClick={() => {
                void merge
                  .mutateAsync({
                    sourceId: mergeSource,
                    targetId: mergeTarget,
                  })
                  .then(() => {
                    toast.success("تگ‌ها ادغام شد");
                    setMergeOpen(false);
                    void query.refetch();
                  })
                  .catch((error: unknown) =>
                    toast.error(getApiErrorMessage(error)),
                  );
              }}
            >
              ادغام
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
