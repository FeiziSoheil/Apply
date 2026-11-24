"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLostReasons } from "@/features/crm/queries";

type LostReasonDialogProps = {
  open: boolean;
  leadName: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: (lostReasonId: string) => void;
};

export function LostReasonDialog({
  open,
  leadName,
  onOpenChange,
  onConfirm,
}: LostReasonDialogProps) {
  const reasonsQuery = useLostReasons();
  const reasons = (reasonsQuery.data ?? []).filter((reason) => reason.active);
  const [reasonId, setReasonId] = useState<string>("");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setReasonId("");
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>دلیل ریزش</DialogTitle>
          <DialogDescription>
            برای انتقال «{leadName}» به مرحله ریزش، دلیل را انتخاب کنید.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="lost-reason">دلیل</Label>
          <Select value={reasonId || undefined} onValueChange={setReasonId}>
            <SelectTrigger id="lost-reason" aria-label="دلیل ریزش">
              <SelectValue placeholder="انتخاب دلیل…" />
            </SelectTrigger>
            <SelectContent>
              {reasons.map((reason) => (
                <SelectItem key={reason.id} value={reason.id}>
                  {reason.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button
            type="button"
            disabled={!reasonId}
            onClick={() => {
              if (!reasonId) return;
              onConfirm(reasonId);
              setReasonId("");
            }}
          >
            تأیید انتقال
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
