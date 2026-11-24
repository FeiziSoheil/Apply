"use client";

import {
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import {
  SortableList,
  type SortableListItemRenderProps,
} from "@/components/admin/fields/sortable-list";
import { Can } from "@/components/rbac/can";
import { Button } from "@/components/ui/button";
import type { ReorderBody } from "@/contracts/content";
import { getApiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

type ReorderableListPanelProps<T extends { id: string }> = {
  items: readonly T[] | undefined;
  label: string;
  onSave: (body: ReorderBody) => Promise<unknown>;
  isSaving?: boolean;
  disabled?: boolean;
  renderItem: (item: T, props: SortableListItemRenderProps) => ReactNode;
  itemClassName?: string | ((item: T, index: number) => string);
  emptyState?: ReactNode;
  toolbar?: ReactNode;
  className?: string;
};

function idsKey(items: readonly { id: string }[] | undefined): string {
  return items?.map((item) => item.id).join("\0") ?? "";
}

/**
 * Local SortableList + «ذخیره ترتیب» that POSTs `{ items: [{ id, order }] }`.
 * On failure, restores the last saved order and shows a Persian toast.
 */
export function ReorderableListPanel<T extends { id: string }>({
  items,
  label,
  onSave,
  isSaving = false,
  disabled = false,
  renderItem,
  itemClassName,
  emptyState,
  toolbar,
  className,
}: ReorderableListPanelProps<T>) {
  const serverKey = idsKey(items);
  const [localIds, setLocalIds] = useState<string[] | null>(null);
  const [baselineKey, setBaselineKey] = useState(serverKey);

  // Reset local drag order when the server list identity changes
  if (baselineKey !== serverKey) {
    setBaselineKey(serverKey);
    setLocalIds(null);
  }

  const ordered = useMemo(() => {
    if (!items) return [];
    if (!localIds) return [...items];
    const byId = new Map(items.map((item) => [item.id, item]));
    return localIds
      .map((id) => byId.get(id))
      .filter((item): item is T => item !== undefined);
  }, [items, localIds]);

  const isDirty = localIds !== null && idsKey(ordered) !== serverKey;

  async function saveOrder() {
    if (!isDirty || disabled || !items) return;
    const body: ReorderBody = {
      items: ordered.map((item, index) => ({ id: item.id, order: index })),
    };
    try {
      await onSave(body);
      setLocalIds(null);
      toast.success("ترتیب ذخیره شد.");
    } catch (error) {
      // Revert UI to the last server order
      setLocalIds(null);
      toast.error(getApiErrorMessage(error));
    }
  }

  if (!items) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        در حال بارگذاری…
      </div>
    );
  }

  if (ordered.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">{toolbar}</div>
        <Can permission="content:write">
          <Button
            type="button"
            variant={isDirty ? "default" : "outline"}
            size="sm"
            disabled={!isDirty || disabled || isSaving}
            onClick={() => void saveOrder()}
          >
            <Save data-icon="inline-start" aria-hidden />
            {isSaving ? "در حال ذخیره…" : "ذخیره ترتیب"}
          </Button>
        </Can>
      </div>

      <SortableList
        items={ordered}
        getId={(item) => item.id}
        onReorder={(next) => setLocalIds(next.map((item) => item.id))}
        renderItem={renderItem}
        label={label}
        disabled={disabled || isSaving}
        itemClassName={itemClassName}
      />
    </div>
  );
}
