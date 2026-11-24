"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FormInputField } from "@/components/forms/form-input-field";
import { FormPhoneField } from "@/components/forms/form-phone-field";
import { FormTextareaField } from "@/components/forms/form-textarea-field";
import { focusFirstError } from "@/components/forms/focus-first-error";
import {
  contactSchema,
  type ContactFormValues,
} from "@/lib/validations/contact";
import { toContactRequest } from "@/features/leads/mappers";
import { useCreateQuickContactLead } from "@/features/leads/mutations";
import { QueryProvider } from "@/lib/api/query-provider";
import { FIELD_ERRORS_MESSAGE, useApiForm } from "@/lib/api/use-api-form";

const CONTACT_FORM_FIELDS = ["name", "mobile", "email", "message"] as const;

/** Public client island: brings its own `QueryProvider` (shared browser client) */
export function ContactForm() {
  return (
    <QueryProvider>
      <ContactFormContent />
    </QueryProvider>
  );
}

function ContactFormContent() {
  const { form, handleApiError } = useApiForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      mobile: "",
      email: "",
      message: "",
    },
  });

  const createLead = useCreateQuickContactLead();
  const isPending = createLead.isPending;

  function onSubmit(values: ContactFormValues) {
    createLead.mutate(toContactRequest(values), {
      onSuccess: () => {
        toast.success("پیام شما با موفقیت ارسال شد");
        form.reset();
      },
      onError: (error) => {
        const { applied, message } = handleApiError(error, {
          knownFields: CONTACT_FORM_FIELDS,
          fallbackMessage: "ارسال پیام با خطا مواجه شد. لطفاً دوباره تلاش کنید.",
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
        className="grid gap-4"
        noValidate
      >
        <FormInputField
          control={form.control}
          name="name"
          label="نام و نام خانوادگی"
          autoComplete="name"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormPhoneField control={form.control} name="mobile" />
          <FormInputField
            control={form.control}
            name="email"
            label="ایمیل (اختیاری)"
            type="email"
            inputMode="email"
            autoComplete="email"
            dir="ltr"
            placeholder="name@example.com"
          />
        </div>
        <FormTextareaField
          control={form.control}
          name="message"
          label="پیام"
          placeholder="سوال یا درخواست خود را بنویسید"
          rows={5}
        />
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="animate-spin" data-icon="inline-start" />
              در حال ارسال…
            </>
          ) : (
            "ارسال پیام"
          )}
        </Button>
      </form>
    </Form>
  );
}
