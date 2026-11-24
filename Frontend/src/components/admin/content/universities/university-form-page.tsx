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
import { PageContainer } from "@/components/panel/page-container";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useCreateUniversity,
  useUpdateUniversity,
} from "@/features/content/mutations";
import { useUniversity } from "@/features/content/queries";
import { getApiErrorMessage } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import {
  UNIVERSITY_FORM_DEFAULTS,
  universityFormSchema,
  universityToFormValues,
  toUniversityPayload,
  type UniversityFormValues,
} from "@/lib/validations/university";
import {
  UNIVERSITY_FORM_FIELDS,
  UNIVERSITY_FORM_STEPS,
  UniversityFormFields,
} from "./university-form-fields";
import { UniversityProgramsPanel } from "./university-programs-panel";

const LIST_HREF = "/admin/content/universities";

type UniversityFormPageProps =
  | { mode: "create" }
  | { mode: "edit"; universityId: string };

function UniversityDetailsForm(
  props: UniversityFormPageProps & { onSaved?: () => void },
) {
  const router = useRouter();
  const createUniversity = useCreateUniversity();
  const updateUniversity = useUpdateUniversity();
  const wizard = useFormWizard(UNIVERSITY_FORM_STEPS);

  const universityQuery = useUniversity(
    props.mode === "edit" ? props.universityId : "",
    { enabled: props.mode === "edit" },
  );

  const [pendingPublish, setPendingPublish] = useState<{
    emptyCount: number;
    submit: () => void;
  } | null>(null);

  const defaultValues = useMemo(() => {
    if (props.mode === "edit" && universityQuery.data) {
      return universityToFormValues(universityQuery.data);
    }
    return UNIVERSITY_FORM_DEFAULTS;
  }, [props.mode, universityQuery.data]);

  const lastEditedAt =
    props.mode === "edit" ? universityQuery.data?.updatedAt : null;
  const lastEditedBy =
    props.mode === "edit" ? universityQuery.data?.updatedBy : null;

  async function saveWithStatus(
    values: UniversityFormValues,
    status: PublicationStatus,
  ) {
    const body = toUniversityPayload({ ...values, status });
    if (props.mode === "edit") {
      await updateUniversity.mutateAsync({ id: props.universityId, body });
    } else {
      await createUniversity.mutateAsync(body);
    }
  }

  const goBack = () => {
    props.onSaved?.();
    router.push(LIST_HREF);
  };

  function requestPublish(
    form: UseFormReturn<UniversityFormValues>,
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
      <EntityFormPage<UniversityFormValues>
        title={props.mode === "edit" ? "ویرایش دانشگاه" : "افزودن دانشگاه"}
        description={
          props.mode === "edit"
            ? universityQuery.data
              ? `ویرایش مرحله‌به‌مرحله اطلاعات ${universityQuery.data.nameFa}`
              : "در حال بارگذاری…"
            : "اطلاعات دانشگاه را مرحله‌به‌مرحله وارد کنید."
        }
        schema={universityFormSchema}
        defaultValues={defaultValues}
        knownFields={UNIVERSITY_FORM_FIELDS}
        successMessage={
          props.mode === "edit" ? "دانشگاه ویرایش شد." : "دانشگاه ایجاد شد."
        }
        onSuccess={goBack}
        onCancel={goBack}
        onInvalid={wizard.jumpToErrorStep}
        isLoading={props.mode === "edit" && universityQuery.isPending}
        error={
          props.mode === "edit" && universityQuery.error
            ? new Error(getApiErrorMessage(universityQuery.error))
            : null
        }
        onRetry={() => void universityQuery.refetch()}
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
          <UniversityFormFields
            form={form}
            excludeId={props.mode === "edit" ? props.universityId : undefined}
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

/**
 * Full-page create / edit university form. Edit mode adds a tab for
 * programs of this university.
 */
export function UniversityFormPage(props: UniversityFormPageProps) {
  const universityQuery = useUniversity(
    props.mode === "edit" ? props.universityId : "",
    { enabled: props.mode === "edit" },
  );

  if (props.mode === "create") {
    return <UniversityDetailsForm mode="create" />;
  }

  return (
    <Tabs
      defaultValue="details"
      className="flex min-h-full flex-1 flex-col gap-0"
    >
      <PageContainer className="flex-none shrink-0 grow-0 pb-0">
        <TabsList variant="line" className="mb-2">
          <TabsTrigger value="details">اطلاعات دانشگاه</TabsTrigger>
          <TabsTrigger value="programs">برنامه‌های این دانشگاه</TabsTrigger>
        </TabsList>
      </PageContainer>
      <TabsContent
        value="details"
        className="mt-0 flex min-h-0 flex-1 flex-col"
      >
        <UniversityDetailsForm mode="edit" universityId={props.universityId} />
      </TabsContent>
      <TabsContent
        value="programs"
        className="mt-0 flex min-h-0 flex-1 flex-col"
      >
        {universityQuery.data ? (
          <UniversityProgramsPanel university={universityQuery.data} />
        ) : (
          <PageContainer>
            <p className="text-sm text-muted-foreground">در حال بارگذاری…</p>
          </PageContainer>
        )}
      </TabsContent>
    </Tabs>
  );
}
