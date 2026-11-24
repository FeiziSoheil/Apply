"use client";

import { useId, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import type { DefaultValues, FieldValues, UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Spinner } from "@/components/ui/spinner";
import { focusFirstError } from "@/components/forms/focus-first-error";
import { FIELD_ERRORS_MESSAGE, useApiForm } from "@/lib/api/use-api-form";
import { cn } from "@/lib/utils";

/** Props shared by `EntityFormDialog` and `EntityFormDrawer` */
export type EntityFormProps<TValues extends FieldValues> = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Default «ذخیره» */
  submitLabel?: string;
  /** Form schema (`src/lib/validations`, derived from the contract create schema) */
  schema: z.ZodType<TValues, z.ZodTypeDef, TValues>;
  /** Empty values for create, the mapped entity for edit */
  defaultValues: DefaultValues<TValues>;
  /**
   * Performs the request (e.g. `mutateAsync`). Throw (an `ApiError`) to keep
   * the form open: field errors from the server are shown inline.
   */
  onSubmit: (values: TValues) => Promise<unknown>;
  /** Field names that exist in the form; other server field errors are toasted */
  knownFields?: readonly string[];
  /** Contract path → form field name (when they differ) */
  fieldMap?: Readonly<Record<string, string>>;
  /** Toast after a successful save */
  successMessage?: string;
  /** The form fields; receives the RHF instance (`form.control`) */
  children: (form: UseFormReturn<TValues>) => ReactNode;
};

type EntityFormBodyProps<TValues extends FieldValues> = Omit<
  EntityFormProps<TValues>,
  "open" | "title" | "description"
> & {
  /** Dialog/Sheet header (title + description) */
  header: ReactNode;
  /** Wrapper classes of the footer, per container (dialog vs drawer) */
  footerClassName?: string;
  /** Wrapper classes of the scrolling fields area */
  fieldsClassName?: string;
};

/**
 * The form itself, shared by dialog and drawer: RHF + zod resolver +
 * `useApiForm` (server errors → inline field errors), a pending state, and
 * close-on-success. It lives inside the (unmounted-when-closed) content of the
 * dialog, so its state resets every time the dialog opens.
 */
export function EntityFormBody<TValues extends FieldValues>({
  onOpenChange,
  submitLabel = "ذخیره",
  schema,
  defaultValues,
  onSubmit,
  knownFields,
  fieldMap,
  successMessage,
  children,
  header,
  footerClassName,
  fieldsClassName,
}: EntityFormBodyProps<TValues>) {
  const formId = useId();
  const { form, handleApiError } = useApiForm<TValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onTouched",
  });
  const { isSubmitting } = form.formState;

  const submit = form.handleSubmit(
    async (values) => {
      try {
        await onSubmit(values);
        if (successMessage) toast.success(successMessage);
        onOpenChange(false);
      } catch (error) {
        const { applied, unmatched, message } = handleApiError(error, {
          knownFields,
          fieldMap,
        });
        const unmatchedMessage = Object.values(unmatched).flat()[0];
        toast.error(
          applied > 0 && !unmatchedMessage
            ? FIELD_ERRORS_MESSAGE
            : (unmatchedMessage ?? message),
        );
      }
    },
    (errors) => focusFirstError(errors, form.setFocus),
  );

  return (
    <Form {...form}>
      <form
        id={formId}
        noValidate
        onSubmit={submit}
        className="flex min-h-0 flex-1 flex-col gap-4"
        aria-busy={isSubmitting}
      >
        {header}
        <div className={cn("min-h-0 flex-1 overflow-y-auto", fieldsClassName)}>
          <fieldset disabled={isSubmitting} className="contents">
            {children(form)}
          </fieldset>
        </div>
        <div className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", footerClassName)}>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            انصراف
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Spinner data-icon="inline-start" aria-label="در حال ذخیره" />
            ) : null}
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
