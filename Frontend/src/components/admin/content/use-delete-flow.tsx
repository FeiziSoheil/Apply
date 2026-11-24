"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { getApiErrorMessage, isApiError } from "@/lib/api";

type DeleteMutation = {
  mutateAsync: (id: string) => Promise<unknown>;
  isPending: boolean;
};

type UseDeleteFlowOptions<T extends { id: string }> = {
  mutation: DeleteMutation;
  /** Toast after a successful delete */
  successMessage: (item: T) => string;
};

export type DeleteFlow<T extends { id: string }> = {
  target: T | null;
  conflict: { item: T; message: string } | null;
  isPending: boolean;
  request: (item: T) => void;
  cancel: () => void;
  confirm: () => Promise<void>;
  closeConflict: () => void;
};

/**
 * Delete confirmation state of a content list: ask → delete → on `409`
 * keep the entity and expose the server's Persian conflict message.
 */
export function useDeleteFlow<T extends { id: string }>({
  mutation,
  successMessage,
}: UseDeleteFlowOptions<T>): DeleteFlow<T> {
  const [target, setTarget] = useState<T | null>(null);
  const [conflict, setConflict] = useState<DeleteFlow<T>["conflict"]>(null);
  const { mutateAsync, isPending } = mutation;

  const confirm = useCallback(async () => {
    if (!target) return;
    const item = target;
    try {
      await mutateAsync(item.id);
      toast.success(successMessage(item));
      setTarget(null);
    } catch (error) {
      setTarget(null);
      if (isApiError(error) && error.isConflict) {
        setConflict({ item, message: error.message });
        return;
      }
      toast.error(getApiErrorMessage(error));
    }
  }, [mutateAsync, successMessage, target]);

  return {
    target,
    conflict,
    isPending,
    request: setTarget,
    cancel: () => setTarget(null),
    confirm,
    closeConflict: () => setConflict(null),
  };
}

type DeleteEntityDialogsProps<T extends { id: string }> = {
  flow: DeleteFlow<T>;
  /** Dialog title, e.g. «حذف خدمت» */
  title: string;
  confirmLabel: string;
  describe: (item: T) => string;
  /**
   * Replaces the default «متوجه شدم» action of the conflict dialog
   * (e.g. consultants offer «غیرفعال‌سازی» instead of deleting).
   */
  conflictAction?: {
    label: string;
    isPending?: boolean;
    onConfirm: (item: T) => void | Promise<void>;
  };
};

/** Delete confirmation + 409 conflict explanation dialogs */
export function DeleteEntityDialogs<T extends { id: string }>({
  flow,
  title,
  confirmLabel,
  describe,
  conflictAction,
}: DeleteEntityDialogsProps<T>) {
  const { conflict } = flow;
  return (
    <>
      <ConfirmDialog
        open={flow.target !== null}
        onOpenChange={(open) => {
          if (!open) flow.cancel();
        }}
        tone="destructive"
        title={title}
        description={flow.target ? describe(flow.target) : undefined}
        confirmLabel={confirmLabel}
        isPending={flow.isPending}
        onConfirm={flow.confirm}
      />

      <ConfirmDialog
        open={conflict !== null}
        onOpenChange={(open) => {
          if (!open) flow.closeConflict();
        }}
        tone="default"
        title="حذف امکان‌پذیر نیست"
        description={conflict?.message ?? "این مورد قابل حذف نیست."}
        confirmLabel={conflictAction?.label ?? "متوجه شدم"}
        cancelLabel="بستن"
        isPending={conflictAction?.isPending ?? false}
        onConfirm={async () => {
          if (conflict && conflictAction) {
            await conflictAction.onConfirm(conflict.item);
            return;
          }
          flow.closeConflict();
        }}
      />
    </>
  );
}
