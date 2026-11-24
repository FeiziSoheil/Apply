"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, MailCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { focusFirstError } from "@/components/forms/focus-first-error";
import { FormInputField } from "@/components/forms/form-input-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/lib/validations/login";

/**
 * «فراموشی رمز عبور» — UI only. The contract has no reset endpoint yet, so the
 * submit just simulates the request and shows the (non-revealing) confirmation.
 */
export function ForgotPasswordDialog() {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setSent(false);
      form.reset();
    }
  }

  function onSubmit() {
    setPending(true);
    window.setTimeout(() => {
      setPending(false);
      setSent(true);
    }, 700);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="link" size="sm" className="px-0">
          رمز عبور را فراموش کرده‌اید؟
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MailCheck className="size-5" aria-hidden />
          </div>
          <DialogTitle className="text-lg font-bold">
            بازیابی رمز عبور
          </DialogTitle>
          <DialogDescription>
            ایمیل حساب خود را وارد کنید تا لینک بازیابی برایتان ارسال شود.
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div
            role="status"
            className="flex items-start gap-2 rounded-lg bg-primary/10 p-3 text-sm text-primary"
          >
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p>
              اگر این ایمیل در سامانه ثبت شده باشد، لینک بازیابی رمز عبور برای
              آن ارسال می‌شود. در غیر این صورت با مدیر سامانه تماس بگیرید.
            </p>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={(event) => {
                // The dialog is portaled but still a React child of the login
                // form — don't let this submit bubble into it
                event.stopPropagation();
                void form.handleSubmit(onSubmit, (errors) => {
                  focusFirstError(errors, form.setFocus);
                })(event);
              }}
              className="grid gap-4"
              noValidate
            >
              <FormInputField
                control={form.control}
                name="email"
                label="ایمیل"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                dir="ltr"
                disabled={pending}
              />
              <Button type="submit" size="lg" disabled={pending}>
                {pending ? (
                  <>
                    <Loader2 className="animate-spin" data-icon="inline-start" />
                    در حال ارسال…
                  </>
                ) : (
                  "ارسال لینک بازیابی"
                )}
              </Button>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
