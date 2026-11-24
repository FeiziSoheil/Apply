"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormInputField } from "@/components/forms/form-input-field";
import { FormSelectField } from "@/components/forms";
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
import { useInviteStaffUser } from "@/features/users/mutations";
import { getApiErrorMessage } from "@/lib/api";
import { ROLE_LABELS } from "@/lib/auth/role-labels";
import {
  inviteUserFormSchema,
  type InviteUserFormValues,
} from "@/lib/validations/users";

type InviteUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function InviteUserDialog({ open, onOpenChange }: InviteUserDialogProps) {
  const invite = useInviteStaffUser();
  const form = useForm<InviteUserFormValues>({
    resolver: zodResolver(inviteUserFormSchema),
    defaultValues: { name: "", email: "", role: "consultant" },
  });

  function onSubmit(values: InviteUserFormValues) {
    invite.mutate(values, {
      onSuccess: (result) => {
        toast.success("کاربر دعوت شد", {
          description: `رمز موقت: ${result.temporaryPassword}`,
          duration: 12_000,
        });
        form.reset({ name: "", email: "", role: "consultant" });
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error));
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>دعوت کاربر</DialogTitle>
          <DialogDescription>
            حساب کارمند جدید ساخته می‌شود و رمز موقت در اعلان نمایش داده می‌شود.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
          >
            <FormInputField
              control={form.control}
              name="name"
              label="نام و نام خانوادگی"
            />
            <FormInputField
              control={form.control}
              name="email"
              label="ایمیل"
              type="email"
              dir="ltr"
            />
            <FormSelectField
              control={form.control}
              name="role"
              label="نقش"
              options={[
                { value: "admin", label: ROLE_LABELS.admin },
                { value: "consultant", label: ROLE_LABELS.consultant },
              ]}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={invite.isPending}
              >
                انصراف
              </Button>
              <Button type="submit" disabled={invite.isPending}>
                {invite.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : null}
                دعوت
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
