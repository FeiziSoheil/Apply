"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Phone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FormInputField } from "@/components/forms/form-input-field";
import { FormPhoneField } from "@/components/forms/form-phone-field";
import { focusFirstError } from "@/components/forms/focus-first-error";
import {
  callbackSchema,
  type CallbackFormValues,
} from "@/lib/validations/callback";
import { toCallbackRequest } from "@/features/leads/mappers";
import { useCreateQuickContactLead } from "@/features/leads/mutations";
import { QueryProvider } from "@/lib/api/query-provider";
import { FIELD_ERRORS_MESSAGE, useApiForm } from "@/lib/api/use-api-form";

const CALLBACK_FORM_FIELDS = ["name", "mobile", "website"] as const;

type CallbackDialogProps = {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

/** Public client island: brings its own `QueryProvider` (shared browser client) */
export function CallbackDialog(props: CallbackDialogProps) {
  return (
    <QueryProvider>
      <CallbackDialogContent {...props} />
    </QueryProvider>
  );
}

function CallbackDialogContent({
  trigger,
  open: controlledOpen,
  onOpenChange,
}: CallbackDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  const { form, handleApiError } = useApiForm<CallbackFormValues>({
    resolver: zodResolver(callbackSchema),
    defaultValues: {
      name: "",
      mobile: "",
      website: "",
    },
  });

  const createLead = useCreateQuickContactLead();
  const isPending = createLead.isPending;

  function onSubmit(values: CallbackFormValues) {
    createLead.mutate(toCallbackRequest(values), {
      onSuccess: () => {
        toast.success("درخواست تماس ثبت شد؛ به‌زودی با شما تماس می‌گیریم.");
        form.reset();
        setOpen(false);
      },
      onError: (error) => {
        const { applied, message } = handleApiError(error, {
          knownFields: CALLBACK_FORM_FIELDS,
          fallbackMessage:
            "درخواست تماس با خطا مواجه شد. لطفاً دوباره تلاش کنید.",
        });
        toast.error(applied > 0 ? FIELD_ERRORS_MESSAGE : message);
      },
    });
  }

  const defaultTrigger = (
    <Button type="button" variant="outline">
      <Phone data-icon="inline-start" />
      درخواست تماس
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>درخواست تماس سریع</DialogTitle>
          <DialogDescription>
            نام و شماره موبایل را وارد کنید تا مشاوران ما با شما تماس بگیرند.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, (errors) => {
              focusFirstError(errors, form.setFocus);
            })}
            className="grid gap-4"
            noValidate
          >
            <FormInputField
              control={form.control}
              name="name"
              label="نام و نام خانوادگی"
              autoComplete="name"
            />
            <FormPhoneField control={form.control} name="mobile" />

            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem
                  aria-hidden="true"
                  className="pointer-events-none absolute -start-[9999px] h-0 w-0 overflow-hidden opacity-0"
                >
                  <FormControl>
                    <Input
                      tabIndex={-1}
                      autoComplete="off"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? (
                <>
                  <Loader2 className="animate-spin" data-icon="inline-start" />
                  در حال ارسال…
                </>
              ) : (
                "ثبت درخواست تماس"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
