"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FormInputField } from "@/components/forms/form-input-field";
import { FormPhoneField } from "@/components/forms/form-phone-field";
import { focusFirstError } from "@/components/forms/focus-first-error";
import {
  newsletterSchema,
  type NewsletterFormValues,
} from "@/lib/validations/newsletter";
import { toNewsletterRequest } from "@/features/leads/mappers";
import { useSubscribeNewsletter } from "@/features/leads/mutations";
import { QueryProvider } from "@/lib/api/query-provider";
import { FIELD_ERRORS_MESSAGE, useApiForm } from "@/lib/api/use-api-form";
import { cn } from "@/lib/utils";

const NEWSLETTER_FORM_FIELDS = ["mobile", "email"] as const;

type NewsletterFormProps = {
  className?: string;
  compact?: boolean;
};

/** Public client island: brings its own `QueryProvider` (shared browser client) */
export function NewsletterForm(props: NewsletterFormProps) {
  return (
    <QueryProvider>
      <NewsletterFormContent {...props} />
    </QueryProvider>
  );
}

function NewsletterFormContent({ className, compact }: NewsletterFormProps) {
  const { form, handleApiError } = useApiForm<NewsletterFormValues>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: {
      mobile: "",
      email: "",
    },
  });

  const subscribe = useSubscribeNewsletter();
  const isPending = subscribe.isPending;

  function onSubmit(values: NewsletterFormValues) {
    subscribe.mutate(toNewsletterRequest(values), {
      onSuccess: () => {
        toast.success("عضویت شما در خبرنامه ثبت شد");
        form.reset();
      },
      onError: (error) => {
        const { applied, message } = handleApiError(error, {
          knownFields: NEWSLETTER_FORM_FIELDS,
          fallbackMessage:
            "عضویت در خبرنامه با خطا مواجه شد. لطفاً دوباره تلاش کنید.",
        });
        toast.error(applied > 0 ? FIELD_ERRORS_MESSAGE : message);
      },
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, (errors) => {
          focusFirstError(errors, form.setFocus);
        })}
        className={cn("grid gap-3", className)}
        noValidate
      >
        <p className={cn("text-sm font-semibold text-foreground", compact && "sr-only")}>
          عضویت در خبرنامه
        </p>
        {!compact ? (
          <p className="text-sm text-muted-foreground">
            فقط موبایل یا ایمیل کافی است؛ تازه‌ترین فرصت‌های پذیرش را دریافت کنید.
          </p>
        ) : null}
        <div className={cn("grid gap-3", !compact && "sm:grid-cols-2")}>
          <FormPhoneField
            control={form.control}
            name="mobile"
            label="موبایل"
          />
          <FormInputField
            control={form.control}
            name="email"
            label="ایمیل"
            type="email"
            inputMode="email"
            autoComplete="email"
            dir="ltr"
            placeholder="name@example.com"
          />
        </div>
        <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
          {isPending ? (
            <>
              <Loader2 className="animate-spin" data-icon="inline-start" />
              در حال ثبت…
            </>
          ) : (
            "عضویت"
          )}
        </Button>
      </form>
    </Form>
  );
}
