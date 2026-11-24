"use client";

import { useCallback } from "react";
import type { UseFormReturn } from "react-hook-form";
import { SectionsEditor } from "@/components/admin/content/sections-editor";
import type { FormWizardStep } from "@/components/admin/entity-form/form-wizard";
import { FormWizardShell } from "@/components/admin/entity-form/form-wizard-shell";
import { FieldArrayEditor } from "@/components/admin/fields/field-array-editor";
import { FormTagInputField } from "@/components/admin/fields/form-controls";
import { FormNumberField } from "@/components/admin/fields/form-number-field";
import { LucideIconPickerField } from "@/components/admin/fields/lucide-icon-picker";
import { SeoFieldsSection } from "@/components/admin/fields/seo-fields-section";
import {
  SlugField,
  type SlugAvailabilityChecker,
} from "@/components/admin/fields/slug-field";
import { FormInputField, FormTextareaField } from "@/components/forms";
import { FieldLegend, FieldSet } from "@/components/ui/field";
import { servicesApi } from "@/features/content/api";
import type { ServiceFormValues } from "@/lib/validations/service";

/** Names of every field of the form (server field errors outside this list are toasted) */
export const SERVICE_FORM_FIELDS = [
  "title",
  "slug",
  "shortDescription",
  "icon",
  "duration",
  "price",
  "steps",
  "requiredDocuments",
  "relatedServiceSlugs",
  "faqs",
  "sections",
  "status",
  "scheduledAt",
  "seo.metaTitle",
  "seo.metaDescription",
  "seo.ogImageId",
  "seo.noindex",
] as const;

export type ServiceFormStepId =
  | "basics"
  | "process"
  | "related"
  | "sections"
  | "seo";

/** Wizard steps for service create / edit — one section per step */
export const SERVICE_FORM_STEPS: readonly FormWizardStep<ServiceFormValues>[] = [
  {
    id: "basics",
    title: "اطلاعات اصلی",
    fields: [
      "title",
      "slug",
      "duration",
      "price",
      "shortDescription",
      "icon",
    ],
  },
  {
    id: "process",
    title: "فرآیند و مدارک",
    fields: ["steps", "requiredDocuments"],
  },
  {
    id: "related",
    title: "خدمات مرتبط و پرسش‌ها",
    fields: ["relatedServiceSlugs", "faqs"],
  },
  {
    id: "sections",
    title: "بخش‌های صفحه",
    fields: ["sections"],
  },
  {
    id: "seo",
    title: "سئو و شبکه اجتماعی",
    fields: ["seo"],
  },
];

function BasicsSection({
  form,
  excludeId,
  checkSlug,
}: {
  form: UseFormReturn<ServiceFormValues>;
  excludeId?: string;
  checkSlug: SlugAvailabilityChecker;
}) {
  const { control } = form;
  return (
    <FieldSet>
      <FieldLegend>اطلاعات اصلی</FieldLegend>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormInputField
          control={control}
          name="title"
          label="عنوان خدمت"
          className="sm:col-span-2"
        />
        <SlugField<ServiceFormValues>
          name="slug"
          titleName="title"
          excludeId={excludeId}
          checkAvailability={checkSlug}
          className="sm:col-span-2"
        />
        <FormInputField
          control={control}
          name="duration"
          label="مدت تقریبی"
          placeholder="مثلاً ۴ تا ۶ هفته"
        />
        <FormNumberField
          control={control}
          name="price"
          label="هزینه تقریبی (ریال)"
          description="اختیاری؛ عدد صحیح به ریال."
          min={0}
          step={1}
        />
      </div>
      <FormTextareaField
        control={control}
        name="shortDescription"
        label="توضیح کوتاه"
        rows={3}
      />
      <LucideIconPickerField control={control} name="icon" label="آیکن" />
    </FieldSet>
  );
}

function ProcessSection({ form }: { form: UseFormReturn<ServiceFormValues> }) {
  const { control } = form;
  return (
    <FieldSet>
      <FieldLegend>فرآیند و مدارک</FieldLegend>
      <FieldArrayEditor
        control={control}
        name="steps"
        label="گام‌های فرآیند"
        addLabel="افزودن گام"
        emptyItem={{ value: "" }}
        getRowTitle={(index) =>
          form.getValues(`steps.${index}.value`)?.trim() || `گام ${index + 1}`
        }
        removeLabel={(index) => `حذف گام ${index + 1}`}
      >
        {(index) => (
          <FormInputField
            control={control}
            name={`steps.${index}.value`}
            label={`گام ${index + 1}`}
            className="sm:col-span-2"
          />
        )}
      </FieldArrayEditor>
      <FieldArrayEditor
        control={control}
        name="requiredDocuments"
        label="مدارک موردنیاز"
        addLabel="افزودن مدرک"
        emptyItem={{ value: "" }}
        getRowTitle={(index) =>
          form.getValues(`requiredDocuments.${index}.value`)?.trim() ||
          `مدرک ${index + 1}`
        }
        removeLabel={(index) => `حذف مدرک ${index + 1}`}
      >
        {(index) => (
          <FormInputField
            control={control}
            name={`requiredDocuments.${index}.value`}
            label={`مدرک ${index + 1}`}
            className="sm:col-span-2"
          />
        )}
      </FieldArrayEditor>
    </FieldSet>
  );
}

function RelatedSection({ form }: { form: UseFormReturn<ServiceFormValues> }) {
  const { control } = form;
  return (
    <FieldSet>
      <FieldLegend>خدمات مرتبط و پرسش‌ها</FieldLegend>
      <FormTagInputField
        control={control}
        name="relatedServiceSlugs"
        label="اسلاگ خدمات مرتبط"
        description="اسلاگ هر خدمت را بنویسید و Enter بزنید (حداکثر ۱۰ مورد)."
        maxTags={10}
      />
      <FieldArrayEditor
        control={control}
        name="faqs"
        label="پرسش‌های متداول"
        addLabel="افزودن پرسش"
        emptyItem={{ question: "", answer: "", category: "" }}
        collapsible
        getRowTitle={(index) =>
          form.getValues(`faqs.${index}.question`)?.trim() ||
          `پرسش ${index + 1}`
        }
        removeLabel={(index) => `حذف پرسش ${index + 1}`}
      >
        {(index) => (
          <>
            <FormInputField
              control={control}
              name={`faqs.${index}.question`}
              label="پرسش"
              className="sm:col-span-2"
            />
            <FormTextareaField
              control={control}
              name={`faqs.${index}.answer`}
              label="پاسخ"
              rows={3}
              className="sm:col-span-2"
            />
            <FormInputField
              control={control}
              name={`faqs.${index}.category`}
              label="دسته (اختیاری)"
            />
          </>
        )}
      </FieldArrayEditor>
    </FieldSet>
  );
}

function SectionsSection({
  form,
  previewPath,
}: {
  form: UseFormReturn<ServiceFormValues>;
  previewPath: string;
}) {
  const { control } = form;
  return (
    <FieldSet>
      <FieldLegend>بخش‌های صفحه</FieldLegend>
      <SectionsEditor
        control={control}
        name="sections"
        kind="service"
        previewPath={previewPath}
      />
    </FieldSet>
  );
}

function SeoSection({
  form,
  previewPath,
}: {
  form: UseFormReturn<ServiceFormValues>;
  previewPath: string;
}) {
  return (
    <SeoFieldsSection
      control={form.control}
      namePrefix="seo"
      siteHost="apply.example"
      previewPath={previewPath}
    />
  );
}

function renderStepContent({
  stepId,
  form,
  excludeId,
  checkSlug,
  previewPath,
}: {
  stepId: string;
  form: UseFormReturn<ServiceFormValues>;
  excludeId?: string;
  checkSlug: SlugAvailabilityChecker;
  previewPath: string;
}) {
  switch (stepId as ServiceFormStepId) {
    case "basics":
      return (
        <BasicsSection form={form} excludeId={excludeId} checkSlug={checkSlug} />
      );
    case "process":
      return <ProcessSection form={form} />;
    case "related":
      return <RelatedSection form={form} />;
    case "sections":
      return <SectionsSection form={form} previewPath={previewPath} />;
    case "seo":
      return <SeoSection form={form} previewPath={previewPath} />;
    default:
      return null;
  }
}

/** Fields of the create / edit service form, one wizard step at a time */
export function ServiceFormFields({
  form,
  excludeId,
  stepIndex,
  onStepSelect,
}: {
  form: UseFormReturn<ServiceFormValues>;
  excludeId?: string;
  stepIndex: number;
  onStepSelect: (index: number) => void;
}) {
  const slug = form.watch("slug");
  const previewPath = slug ? `/services/${slug}` : "/services/…";

  const checkSlug = useCallback(
    (args: { slug: string; excludeId?: string; signal?: AbortSignal }) =>
      servicesApi.checkSlugAvailable(args.slug, {
        excludeId: args.excludeId,
        signal: args.signal,
      }),
    [],
  );

  const activeStep = SERVICE_FORM_STEPS[stepIndex] ?? SERVICE_FORM_STEPS[0];
  if (!activeStep) return null;

  return (
    <FormWizardShell
      steps={SERVICE_FORM_STEPS}
      stepIndex={stepIndex}
      onStepSelect={onStepSelect}
    >
      {renderStepContent({
        stepId: activeStep.id,
        form,
        excludeId,
        checkSlug,
        previewPath,
      })}
    </FormWizardShell>
  );
}
