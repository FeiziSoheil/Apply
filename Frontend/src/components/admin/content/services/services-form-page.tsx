"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { UseFormReturn } from "react-hook-form";
import type { PublicationStatus } from "@/contracts/content";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { withoutOrder } from "@/components/admin/content/content-list-parts";
import { countEmptySections } from "@/components/admin/content/sections-editor";
import { EntityFormPage } from "@/components/admin/entity-form/entity-form-page";
import { FormWizardFooter } from "@/components/admin/entity-form/form-wizard-footer";
import { useFormWizard } from "@/components/admin/entity-form/use-form-wizard";
import { PublishStatusControl } from "@/components/admin/fields/publish-status-control";
import {
  useCreateService,
  useUpdateService,
} from "@/features/content/mutations";
import { useService } from "@/features/content/queries";
import { getApiErrorMessage } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import {
  SERVICE_FORM_DEFAULTS,
  serviceFormSchema,
  serviceToFormValues,
  toServicePayload,
  type ServiceFormValues,
} from "@/lib/validations/service";
import {
  SERVICE_FORM_FIELDS,
  SERVICE_FORM_STEPS,
  ServiceFormFields,
} from "./services-form-fields";

const LIST_HREF = "/admin/content/services";

type ServiceFormPageProps =
  | { mode: "create" }
  | { mode: "edit"; serviceId: string };

/**
 * Full-page create / edit service form with shared wizard
 * (`EntityFormPage` + slug, icon picker, field arrays, sections, SEO).
 */
export function ServiceFormPage(props: ServiceFormPageProps) {
  const router = useRouter();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const wizard = useFormWizard(SERVICE_FORM_STEPS);

  const serviceQuery = useService(
    props.mode === "edit" ? props.serviceId : "",
    { enabled: props.mode === "edit" },
  );

  const [pendingPublish, setPendingPublish] = useState<{
    emptyCount: number;
    submit: () => void;
  } | null>(null);

  const defaultValues = useMemo(() => {
    if (props.mode === "edit" && serviceQuery.data) {
      return serviceToFormValues(serviceQuery.data);
    }
    return SERVICE_FORM_DEFAULTS;
  }, [props.mode, serviceQuery.data]);

  const lastEditedAt =
    props.mode === "edit" ? serviceQuery.data?.updatedAt : null;
  const lastEditedBy =
    props.mode === "edit" ? serviceQuery.data?.updatedBy : null;

  async function saveWithStatus(
    values: ServiceFormValues,
    status: PublicationStatus,
  ) {
    const body = toServicePayload({ ...values, status });
    if (props.mode === "edit") {
      await updateService.mutateAsync({
        id: props.serviceId,
        body: withoutOrder(body),
      });
    } else {
      await createService.mutateAsync(body);
    }
  }

  const goBack = () => router.push(LIST_HREF);

  function requestPublish(
    form: UseFormReturn<ServiceFormValues>,
    submit: () => void,
  ) {
    const emptyCount = countEmptySections(form.getValues("sections"));
    if (emptyCount > 0) {
      setPendingPublish({
        emptyCount,
        submit: () => {
          form.setValue("status", "published", { shouldDirty: true });
          submit();
        },
      });
      return;
    }
    form.setValue("status", "published", { shouldDirty: true });
    submit();
  }

  return (
    <>
      <EntityFormPage<ServiceFormValues>
        title={props.mode === "edit" ? "ویرایش خدمت" : "افزودن خدمت"}
        description={
          props.mode === "edit"
            ? serviceQuery.data
              ? `ویرایش مرحله‌به‌مرحله ${serviceQuery.data.title}`
              : "در حال بارگذاری…"
            : "اطلاعات خدمت را مرحله‌به‌مرحله وارد کنید."
        }
        schema={serviceFormSchema}
        defaultValues={defaultValues}
        knownFields={SERVICE_FORM_FIELDS}
        successMessage={
          props.mode === "edit" ? "خدمت ویرایش شد." : "خدمت ایجاد شد."
        }
        onSuccess={goBack}
        onCancel={goBack}
        onInvalid={wizard.jumpToErrorStep}
        isLoading={props.mode === "edit" && serviceQuery.isPending}
        error={
          props.mode === "edit" && serviceQuery.error
            ? new Error(getApiErrorMessage(serviceQuery.error))
            : null
        }
        onRetry={() => void serviceQuery.refetch()}
        onSubmit={async (values) => {
          await saveWithStatus(values, values.status);
        }}
        footer={({ form, isSubmitting, submit }) => (
          <FormWizardFooter
            stepIndex={wizard.stepIndex}
            lastStepIndex={wizard.lastStepIndex}
            isSubmitting={isSubmitting}
            onPrev={wizard.goPrev}
            onNext={() => void wizard.goNext(form)}
            publishControl={
              <PublishStatusControl
                status={form.watch("status")}
                scheduledAt={form.watch("scheduledAt") || null}
                onScheduledAtChange={(value) => {
                  form.setValue("scheduledAt", value ?? "", {
                    shouldDirty: true,
                  });
                }}
                onStatusChange={(next) => {
                  form.setValue("status", next, { shouldDirty: true });
                }}
                lastEditedAt={lastEditedAt}
                lastEditedBy={lastEditedBy}
                isPending={isSubmitting}
                onSaveDraft={() => {
                  form.setValue("status", "draft", { shouldDirty: true });
                  submit();
                }}
                onPublish={() => requestPublish(form, submit)}
                onSchedule={() => {
                  form.setValue("status", "scheduled", { shouldDirty: true });
                  submit();
                }}
              />
            }
          />
        )}
      >
        {(form) => (
          <ServiceFormFields
            form={form}
            excludeId={props.mode === "edit" ? props.serviceId : undefined}
            stepIndex={wizard.stepIndex}
            onStepSelect={(index) => void wizard.goToStep(form, index)}
          />
        )}
      </EntityFormPage>

      <ConfirmDialog
        open={pendingPublish !== null}
        onOpenChange={(open) => {
          if (!open) setPendingPublish(null);
        }}
        tone="default"
        title="بخش‌های خالی"
        description={
          pendingPublish
            ? `${formatNumber(pendingPublish.emptyCount)} بخش بدون محتوا دارید. آیا همچنان می‌خواهید منتشر کنید؟`
            : undefined
        }
        confirmLabel="انتشار با بخش خالی"
        cancelLabel="بازگشت به ویرایش"
        onConfirm={() => {
          const action = pendingPublish?.submit;
          setPendingPublish(null);
          action?.();
        }}
      />
    </>
  );
}
