"use client";

import { useEffect, useId, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import type {
  DefaultValues,
  FieldErrors,
  FieldValues,
  UseFormReturn,
} from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { useUnsavedChangesGuard } from "@/components/admin/hooks/use-unsaved-changes-guard";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { focusFirstError } from "@/components/forms/focus-first-error";
import { PageContainer } from "@/components/panel/page-container";
import { PageHeader } from "@/components/panel/page-header";
import { FIELD_ERRORS_MESSAGE, useApiForm } from "@/lib/api/use-api-form";
import { cn } from "@/lib/utils";

export type EntityFormPageProps<TValues extends FieldValues> = {
  title: string;
  description?: string;
  schema: z.ZodType<TValues, z.ZodTypeDef, TValues>;
  defaultValues: DefaultValues<TValues>;
  onSubmit: (values: TValues) => Promise<unknown>;
  knownFields?: readonly string[];
  fieldMap?: Readonly<Record<string, string>>;
  successMessage?: string;
  /** Called after a successful save (e.g. navigate back to the list) */
  onSuccess?: () => void;
  /** Called when client-side validation fails (e.g. jump to the wizard step with errors) */
  onInvalid?: (errors: FieldErrors<TValues>) => void;
  /** Sticky bottom bar (e.g. `PublishStatusControl`); defaults to a single save button */
  footer?: (ctx: {
    form: UseFormReturn<TValues>;
    isSubmitting: boolean;
    submit: () => void;
  }) => ReactNode;
  /** Back / cancel navigation */
  onCancel?: () => void;
  cancelLabel?: string;
  submitLabel?: string;
  /** While the entity is loading (edit mode) */
  isLoading?: boolean;
  /** Load error for the entity */
  error?: Error | null;
  onRetry?: () => void;
  children: (form: UseFormReturn<TValues>) => ReactNode;
};

/**
 * Full-width create/edit page for large CMS entities: sticky bottom actions,
 * loading/error states, and an unsaved-changes guard while the form is dirty.
 */
export function EntityFormPage<TValues extends FieldValues>({
  title,
  description,
  schema,
  defaultValues,
  onSubmit,
  knownFields,
  fieldMap,
  successMessage,
  onSuccess,
  onInvalid,
  footer,
  onCancel,
  cancelLabel = "بازگشت",
  submitLabel = "ذخیره",
  isLoading = false,
  error = null,
  onRetry,
  children,
}: EntityFormPageProps<TValues>) {
  const formId = useId();
  const { form, handleApiError } = useApiForm<TValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onTouched",
  });
  const { isSubmitting, isDirty } = form.formState;
  const { confirmLeave } = useUnsavedChangesGuard({ isDirty });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const submit = form.handleSubmit(
    async (values) => {
      try {
        await onSubmit(values);
        if (successMessage) toast.success(successMessage);
        form.reset(values);
        onSuccess?.();
      } catch (err) {
        const { applied, unmatched, message } = handleApiError(err, {
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
    (errors) => {
      onInvalid?.(errors);
      // Defer focus so callers (e.g. wizards) can remount the step with errors first
      requestAnimationFrame(() => {
        focusFirstError(errors, form.setFocus);
      });
    },
  );

  function handleCancel() {
    if (!confirmLeave()) return;
    onCancel?.();
  }

  if (isLoading) {
    return (
      <PageContainer>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
        <div className="mt-6 space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div
          role="alert"
          className="flex flex-col items-start gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-6"
        >
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" aria-hidden />
            <p className="font-medium">بارگذاری فرم ناموفق بود</p>
          </div>
          <p className="text-sm text-muted-foreground">
            {error.message || "خطای ناشناخته"}
          </p>
          <div className="flex gap-2">
            {onRetry ? (
              <Button type="button" onClick={onRetry}>
                تلاش دوباره
              </Button>
            ) : null}
            {onCancel ? (
              <Button type="button" variant="outline" onClick={onCancel}>
                {cancelLabel}
              </Button>
            ) : null}
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <Form {...form}>
      <form
        id={formId}
        noValidate
        onSubmit={submit}
        className="flex min-h-full flex-1 flex-col"
        aria-busy={isSubmitting}
      >
        <PageContainer className="flex-1 pb-28">
          <PageHeader
            title={title}
            description={description}
            actions={
              onCancel ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                >
                  <ArrowRight data-icon="inline-start" aria-hidden />
                  {cancelLabel}
                </Button>
              ) : null
            }
          />

          <fieldset
            disabled={isSubmitting}
            className="min-w-0 space-y-8"
            aria-label="فیلدهای فرم"
          >
            {children(form)}
          </fieldset>
        </PageContainer>

        <div
          className={cn(
            "sticky bottom-0 z-20 mt-auto border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80",
          )}
          role="region"
          aria-label="اقدامات ذخیره"
        >
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 p-3 sm:p-4 md:px-6">
            {footer ? (
              footer({
                form,
                isSubmitting,
                submit: () => void submit(),
              })
            ) : (
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                {onCancel ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={handleCancel}
                  >
                    انصراف
                  </Button>
                ) : null}
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Spinner data-icon="inline-start" aria-label="در حال ذخیره" />
                  ) : null}
                  {submitLabel}
                </Button>
              </div>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
}
