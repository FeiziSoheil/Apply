"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import type { PublicationStatus } from "@/contracts/content";
import { withoutOrder } from "@/components/admin/content/content-list-parts";
import { EntityFormPage } from "@/components/admin/entity-form/entity-form-page";
import { FormWizardFooter } from "@/components/admin/entity-form/form-wizard-footer";
import { useFormWizard } from "@/components/admin/entity-form/use-form-wizard";
import { PublishStatusControl } from "@/components/admin/fields/publish-status-control";
import {
  useCreateSuccessStory,
  useUpdateSuccessStory,
} from "@/features/content/mutations";
import { useSuccessStory } from "@/features/content/queries";
import { getApiErrorMessage } from "@/lib/api";
import {
  SUCCESS_STORY_FORM_DEFAULTS,
  successStoryFormSchema,
  successStoryToFormValues,
  toSuccessStoryPayload,
  type SuccessStoryFormValues,
} from "@/lib/validations/success-story";
import {
  SUCCESS_STORY_FORM_FIELDS,
  SUCCESS_STORY_FORM_STEPS,
  SuccessStoryFormFields,
} from "./success-stories-form-fields";

const LIST_HREF = "/admin/content/success-stories";

type SuccessStoryFormPageProps =
  | { mode: "create" }
  | { mode: "edit"; storyId: string };

/**
 * Full-page create / edit success story form with shared wizard.
 * Publishing or scheduling requires `publicationConsent`
 * (validated by the schema and the API).
 */
export function SuccessStoryFormPage(props: SuccessStoryFormPageProps) {
  const router = useRouter();
  const createStory = useCreateSuccessStory();
  const updateStory = useUpdateSuccessStory();
  const wizard = useFormWizard(SUCCESS_STORY_FORM_STEPS);

  const storyQuery = useSuccessStory(
    props.mode === "edit" ? props.storyId : "",
    { enabled: props.mode === "edit" },
  );

  const defaultValues = useMemo(() => {
    if (props.mode === "edit" && storyQuery.data) {
      return successStoryToFormValues(storyQuery.data);
    }
    return SUCCESS_STORY_FORM_DEFAULTS;
  }, [props.mode, storyQuery.data]);

  const lastEditedAt = props.mode === "edit" ? storyQuery.data?.updatedAt : null;
  const lastEditedBy = props.mode === "edit" ? storyQuery.data?.updatedBy : null;

  async function save(values: SuccessStoryFormValues, status: PublicationStatus) {
    const body = toSuccessStoryPayload({ ...values, status });
    if (props.mode === "edit") {
      await updateStory.mutateAsync({
        id: props.storyId,
        body: withoutOrder(body),
      });
    } else {
      await createStory.mutateAsync(body);
    }
  }

  const goBack = () => router.push(LIST_HREF);

  return (
    <EntityFormPage<SuccessStoryFormValues>
      title={
        props.mode === "edit" ? "ویرایش داستان موفقیت" : "افزودن داستان موفقیت"
      }
      description={
        props.mode === "edit"
          ? storyQuery.data
            ? `ویرایش مرحله‌به‌مرحله داستان ${storyQuery.data.studentName}`
            : "در حال بارگذاری…"
          : "اطلاعات داستان موفقیت را مرحله‌به‌مرحله وارد کنید."
      }
      schema={successStoryFormSchema}
      defaultValues={defaultValues}
      knownFields={SUCCESS_STORY_FORM_FIELDS}
      successMessage={
        props.mode === "edit"
          ? "داستان موفقیت ویرایش شد."
          : "داستان موفقیت ایجاد شد."
      }
      onSuccess={goBack}
      onCancel={goBack}
      onInvalid={wizard.jumpToErrorStep}
      isLoading={props.mode === "edit" && storyQuery.isPending}
      error={
        props.mode === "edit" && storyQuery.error
          ? new Error(getApiErrorMessage(storyQuery.error))
          : null
      }
      onRetry={() => void storyQuery.refetch()}
      onSubmit={async (values) => {
        await save(values, values.status);
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
                form.setValue("scheduledAt", value ?? "", { shouldDirty: true });
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
                form.setValue("status", "published", { shouldDirty: true });
                submit();
              }}
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
        <SuccessStoryFormFields
          form={form}
          excludeId={props.mode === "edit" ? props.storyId : undefined}
          stepIndex={wizard.stepIndex}
          onStepSelect={(index) => void wizard.goToStep(form, index)}
        />
      )}
    </EntityFormPage>
  );
}
