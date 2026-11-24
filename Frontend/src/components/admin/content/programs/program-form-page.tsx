"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { UseFormReturn } from "react-hook-form";
import type { PublicationStatus } from "@/contracts/content";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { countEmptySections } from "@/components/admin/content/sections-editor";
import { EntityFormPage } from "@/components/admin/entity-form/entity-form-page";
import { FormWizardFooter } from "@/components/admin/entity-form/form-wizard-footer";
import { useFormWizard } from "@/components/admin/entity-form/use-form-wizard";
import { PublishStatusControl } from "@/components/admin/fields/publish-status-control";
import {
  useCreateProgram,
  useUpdateProgram,
} from "@/features/content/mutations";
import { useProgram, useUniversityBySlug } from "@/features/content/queries";
import { getApiErrorMessage } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import {
  PROGRAM_FORM_DEFAULTS,
  programFormSchema,
  programToFormValues,
  toProgramPayload,
  type ProgramFormValues,
} from "@/lib/validations/program";
import {
  PROGRAM_FORM_FIELDS,
  PROGRAM_FORM_STEPS,
  ProgramFormFields,
} from "./program-form-fields";

const LIST_HREF = "/admin/content/programs";

type ProgramFormPageProps =
  | { mode: "create" }
  | { mode: "edit"; programId: string };

/**
 * Full-page create / edit program form with shared wizard.
 * Create mode accepts `?university=` to pre-fill university + country.
 */
export function ProgramFormPage(props: ProgramFormPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetUniversity =
    props.mode === "create" ? searchParams.get("university") : null;

  const createProgram = useCreateProgram();
  const updateProgram = useUpdateProgram();
  const wizard = useFormWizard(PROGRAM_FORM_STEPS);

  const programQuery = useProgram(props.mode === "edit" ? props.programId : "", {
    enabled: props.mode === "edit",
  });

  const presetUniversityQuery = useUniversityBySlug(presetUniversity ?? "", {
    enabled: Boolean(presetUniversity),
  });

  const [pendingPublish, setPendingPublish] = useState<{
    emptyCount: number;
    submit: () => void;
  } | null>(null);

  const defaultValues = useMemo(() => {
    if (props.mode === "edit" && programQuery.data) {
      return programToFormValues(programQuery.data);
    }
    if (presetUniversity && presetUniversityQuery.data) {
      return {
        ...PROGRAM_FORM_DEFAULTS,
        universitySlug: presetUniversityQuery.data.slug,
        countrySlug: presetUniversityQuery.data.countrySlug,
        currency: presetUniversityQuery.data.currency,
      };
    }
    if (presetUniversity) {
      return {
        ...PROGRAM_FORM_DEFAULTS,
        universitySlug: presetUniversity,
      };
    }
    return PROGRAM_FORM_DEFAULTS;
  }, [
    props.mode,
    programQuery.data,
    presetUniversity,
    presetUniversityQuery.data,
  ]);

  const lastEditedAt =
    props.mode === "edit" ? programQuery.data?.updatedAt : null;
  const lastEditedBy =
    props.mode === "edit" ? programQuery.data?.updatedBy : null;

  async function saveWithStatus(
    values: ProgramFormValues,
    status: PublicationStatus,
  ) {
    const body = toProgramPayload({ ...values, status });
    if (props.mode === "edit") {
      await updateProgram.mutateAsync({ id: props.programId, body });
    } else {
      await createProgram.mutateAsync(body);
    }
  }

  const goBack = () => router.push(LIST_HREF);

  function requestPublish(
    form: UseFormReturn<ProgramFormValues>,
    submit: () => void,
  ) {
    const sectionValues = form.getValues("sections");
    const emptyCount = sectionValues
      ? countEmptySections(sectionValues)
      : 0;
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
      <EntityFormPage<ProgramFormValues>
        title={props.mode === "edit" ? "ویرایش برنامه" : "افزودن برنامه"}
        description={
          props.mode === "edit"
            ? programQuery.data
              ? `ویرایش مرحله‌به‌مرحله «${programQuery.data.nameFa}»`
              : "در حال بارگذاری…"
            : "اطلاعات برنامه تحصیلی را مرحله‌به‌مرحله وارد کنید."
        }
        schema={programFormSchema}
        defaultValues={defaultValues}
        knownFields={PROGRAM_FORM_FIELDS}
        successMessage={
          props.mode === "edit" ? "برنامه ویرایش شد." : "برنامه ایجاد شد."
        }
        onSuccess={goBack}
        onCancel={goBack}
        onInvalid={wizard.jumpToErrorStep}
        isLoading={props.mode === "edit" && programQuery.isPending}
        error={
          props.mode === "edit" && programQuery.error
            ? new Error(getApiErrorMessage(programQuery.error))
            : null
        }
        onRetry={() => void programQuery.refetch()}
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
          <ProgramFormFields
            form={form}
            excludeId={props.mode === "edit" ? props.programId : undefined}
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
