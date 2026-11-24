"use client";

import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { FormInputField, FormTextareaField } from "@/components/forms";
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
import { leadsApi } from "@/features/leads/api";
import { useCreateLead } from "@/features/leads/mutations";
import { getApiErrorMessage } from "@/lib/api";
import {
  normalizeDigits,
  toNormalizedMobile,
  toOptionalEmail,
} from "@/lib/validations/common";
import {
  CREATE_LEAD_DEFAULTS,
  createLeadFormSchema,
  type CreateLeadFormValues,
} from "@/lib/validations/lead";

type CreateLeadDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consultantName: (id: string | null) => string;
  onOpenLead?: (leadId: string) => void;
};

const MOBILE_RE = /^09\d{9}$/;

export function CreateLeadDialog({
  open,
  onOpenChange,
  consultantName,
  onOpenLead,
}: CreateLeadDialogProps) {
  const createLead = useCreateLead();
  const form = useForm<CreateLeadFormValues>({
    resolver: zodResolver(createLeadFormSchema),
    defaultValues: CREATE_LEAD_DEFAULTS,
  });
  const mobile = useWatch({ control: form.control, name: "mobile" });
  const normalizedMobile = useMemo(
    () => normalizeDigits(mobile?.trim() ?? ""),
    [mobile],
  );
  const canCheckDuplicate = MOBILE_RE.test(normalizedMobile);

  const duplicateQuery = useQuery({
    queryKey: ["leads", "mobile-duplicate", normalizedMobile],
    queryFn: ({ signal }) =>
      leadsApi.list(
        { page: 1, pageSize: 1, mobile: normalizedMobile },
        { signal },
      ),
    enabled: open && canCheckDuplicate,
    staleTime: 10_000,
  });
  const duplicate = duplicateQuery.data?.items[0] ?? null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) form.reset(CREATE_LEAD_DEFAULTS);
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>لید جدید</DialogTitle>
          <DialogDescription>
            سرنخ را به‌صورت دستی وارد کنید. قوانین تخصیص به‌صورت خودکار اعمال می‌شوند.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            className="space-y-4"
            noValidate
            onSubmit={form.handleSubmit((values) => {
              if (duplicate) {
                toast.error("برای این موبایل لید فعالی وجود دارد");
                return;
              }
              createLead.mutate(
                {
                  name: values.name,
                  mobile: toNormalizedMobile(values.mobile),
                  email: toOptionalEmail(values.email),
                  message: values.message?.trim() || undefined,
                },
                {
                  onSuccess: (lead) => {
                    const assignee = consultantName(lead.assignedTo);
                    toast.success(
                      lead.assignedTo
                        ? `لید ثبت شد و به «${assignee}» تخصیص یافت`
                        : "لید ثبت شد (بدون مسئول)",
                    );
                    form.reset(CREATE_LEAD_DEFAULTS);
                    onOpenChange(false);
                  },
                  onError: (error) => toast.error(getApiErrorMessage(error)),
                },
              );
            })}
          >
            <FormInputField control={form.control} name="name" label="نام" />
            <FormInputField
              control={form.control}
              name="mobile"
              label="موبایل"
              inputMode="tel"
              autoComplete="tel"
              dir="ltr"
            />
            {duplicateQuery.isFetching ? (
              <p className="text-muted-foreground text-xs">بررسی تکراری…</p>
            ) : null}
            {duplicate ? (
              <div
                role="alert"
                className="border-destructive/40 bg-destructive/5 text-destructive rounded-lg border px-3 py-2 text-sm"
              >
                <p className="font-medium">لید تکراری</p>
                <p className="mt-1">
                  لید «{duplicate.name}» با همین موبایل از قبل ثبت شده است.
                </p>
                <div className="mt-2 flex flex-col gap-1">
                  <button
                    type="button"
                    className="text-start font-medium underline"
                    onClick={() => {
                      onOpenLead?.(duplicate.id);
                      onOpenChange(false);
                    }}
                  >
                    مشاهده لید موجود
                  </button>
                  <Link
                    href={`/admin/leads?leadId=${duplicate.id}`}
                    className="underline"
                    onClick={() => onOpenChange(false)}
                  >
                    باز کردن در فهرست
                  </Link>
                </div>
              </div>
            ) : null}
            <FormInputField
              control={form.control}
              name="email"
              label="ایمیل (اختیاری)"
              type="email"
              autoComplete="email"
              dir="ltr"
            />
            <FormTextareaField
              control={form.control}
              name="message"
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
              <Button
                type="submit"
                disabled={createLead.isPending || Boolean(duplicate)}
              >
                ثبت لید
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
