"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormSelectField, FormTextareaField } from "@/components/forms";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import type { Lead } from "@/contracts/leads";
import { useUpdateLeadStatus } from "@/features/leads/mutations";
import { getApiErrorMessage } from "@/lib/api";
import {
  leadStatusFormSchema,
  type LeadStatusFormValues,
} from "@/lib/validations/lead";
import { LEAD_STATUS_FILTER_OPTIONS } from "./lead-labels";

type LeadStatusDialogProps = {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LeadStatusDialog({
  lead,
  open,
  onOpenChange,
}: LeadStatusDialogProps) {
  const updateStatus = useUpdateLeadStatus();
  const form = useForm<LeadStatusFormValues>({
    resolver: zodResolver(leadStatusFormSchema),
    values: {
      status:
        lead?.stageKind === "won"
          ? "won"
          : lead?.stageKind === "lost"
            ? "lost"
            : lead?.stageKind === "new"
              ? "new"
              : "contacted",
      lostReason: "",
      note: "",
    },
  });
  const status = form.watch("status");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تغییر وضعیت لید</DialogTitle>
          <DialogDescription>
            {lead ? `وضعیت «${lead.name}» را به‌روز کنید.` : null}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            className="space-y-4"
            noValidate
            onSubmit={form.handleSubmit((values) => {
              if (!lead) return;
              updateStatus.mutate(
                {
                  id: lead.id,
                  body: {
                    status: values.status,
                    lostReason:
                      values.status === "lost"
                        ? values.lostReason?.trim()
                        : undefined,
                    note: values.note?.trim() || undefined,
                  },
                },
                {
                  onSuccess: () => {
                    toast.success("وضعیت لید به‌روز شد");
                    onOpenChange(false);
                  },
                  onError: (error) => toast.error(getApiErrorMessage(error)),
                },
              );
            })}
          >
            <FormSelectField
              control={form.control}
              name="status"
              label="وضعیت"
              options={LEAD_STATUS_FILTER_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
            />
            {status === "lost" ? (
              <FormTextareaField
                control={form.control}
                name="lostReason"
                label="دلیل از دست رفتن"
              />
            ) : null}
            <FormTextareaField
              control={form.control}
              name="note"
              label="یادداشت (اختیاری)"
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                انصراف
              </Button>
              <Button type="submit" disabled={updateStatus.isPending}>
                ذخیره
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
