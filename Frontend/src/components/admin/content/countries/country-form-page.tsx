"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { UseFormReturn } from "react-hook-form";
import type { PublicationStatus } from "@/contracts/content";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { countEmptySections } from "@/components/admin/content/sections-editor";
import { EntityFormPage } from "@/components/admin/entity-form/entity-form-page";
import { FormWizardFooter } from "@/components/admin/entity-form/form-wizard-footer";
import { useFormWizard } from "@/components/admin/entity-form/use-form-wizard";
import { PublishStatusControl } from "@/components/admin/fields/publish-status-control";
import {
  useCreateCountry,
  useUpdateCountry,
} from "@/features/content/mutations";
import { useCountry } from "@/features/content/queries";
import { getApiErrorMessage } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import {
  COUNTRY_FORM_DEFAULTS,
  countryFormSchema,
  countryToFormValues,
  toCountryPayload,
  type CountryFormValues,
} from "@/lib/validations/country";
import {
  COUNTRY_FORM_FIELDS,
  COUNTRY_FORM_STEPS,
  CountryFormFields,
} from "./country-form-fields";

const LIST_HREF = "/admin/content/countries";

type CountryFormPageProps =
  | { mode: "create" }
  | { mode: "edit"; countryId: string };

/**
 * Full-page create / edit country form — the CMS pattern for large entities
 * (`EntityFormPage` + shared form wizard + publish control).
 */
export function CountryFormPage(props: CountryFormPageProps) {
  const router = useRouter();
  const createCountry = useCreateCountry();
  const updateCountry = useUpdateCountry();
  const wizard = useFormWizard(COUNTRY_FORM_STEPS);

  const countryQuery = useCountry(props.mode === "edit" ? props.countryId : "", {
    enabled: props.mode === "edit",
  });

  const [pendingPublish, setPendingPublish] = useState<{
    emptyCount: number;
    submit: () => void;
  } | null>(null);

  const defaultValues = useMemo(() => {
    if (props.mode === "edit" && countryQuery.data) {
      return countryToFormValues(countryQuery.data);
    }
    return COUNTRY_FORM_DEFAULTS;
  }, [props.mode, countryQuery.data]);

  const lastEditedAt =
    props.mode === "edit" ? countryQuery.data?.updatedAt : null;
  const lastEditedBy =
    props.mode === "edit" ? countryQuery.data?.updatedBy : null;

  async function saveWithStatus(
    values: CountryFormValues,
    status: PublicationStatus,
  ) {
    const body = toCountryPayload({ ...values, status });
    if (props.mode === "edit") {
      await updateCountry.mutateAsync({ id: props.countryId, body });
    } else {
      await createCountry.mutateAsync(body);
    }
  }

  const goBack = () => router.push(LIST_HREF);

  function requestPublish(
    form: UseFormReturn<CountryFormValues>,
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
      <EntityFormPage<CountryFormValues>
        title={props.mode === "edit" ? "ویرایش کشور" : "افزودن کشور"}
        description={
          props.mode === "edit"
            ? countryQuery.data
              ? `ویرایش مرحله‌به‌مرحله اطلاعات ${countryQuery.data.nameFa}`
              : "در حال بارگذاری…"
            : "اطلاعات کشور مقصد را مرحله‌به‌مرحله وارد کنید."
        }
        schema={countryFormSchema}
        defaultValues={defaultValues}
        knownFields={COUNTRY_FORM_FIELDS}
        successMessage={
          props.mode === "edit" ? "کشور ویرایش شد." : "کشور ایجاد شد."
        }
        onSuccess={goBack}
        onCancel={goBack}
        onInvalid={wizard.jumpToErrorStep}
        isLoading={props.mode === "edit" && countryQuery.isPending}
        error={
          props.mode === "edit" && countryQuery.error
            ? new Error(getApiErrorMessage(countryQuery.error))
            : null
        }
        onRetry={() => void countryQuery.refetch()}
        onSubmit={async (values) => {
          await saveWithStatus(values, values.status);
        }}
        footer={({ form, isSubmitting, submit }) => {
          const status = form.watch("status");
          const scheduledAt = form.watch("scheduledAt");
          return (
            <FormWizardFooter
              stepIndex={wizard.stepIndex}
              lastStepIndex={wizard.lastStepIndex}
              isSubmitting={isSubmitting}
              onPrev={wizard.goPrev}
              onNext={() => void wizard.goNext(form)}
              publishControl={
                <PublishStatusControl
                  status={status}
                  scheduledAt={scheduledAt || null}
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
                  onPublish={() => {
                    requestPublish(form, submit);
                  }}
                  onSchedule={() => {
                    form.setValue("status", "scheduled", { shouldDirty: true });
                    submit();
                  }}
                />
              }
            />
          );
        }}
      >
        {(form) => (
          <CountryFormFields
            form={form}
            excludeId={props.mode === "edit" ? props.countryId : undefined}
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
