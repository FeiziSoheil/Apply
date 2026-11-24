"use client";

import { useCallback, useEffect, useMemo } from "react";
import type { UseFormReturn } from "react-hook-form";
import { SectionsEditor } from "@/components/admin/content/sections-editor";
import type { FormWizardStep } from "@/components/admin/entity-form/form-wizard";
import { FormWizardShell } from "@/components/admin/entity-form/form-wizard-shell";
import { FormComboboxField } from "@/components/admin/fields/form-combobox-field";
import {
  FormDateTimeField,
  FormTagInputField,
} from "@/components/admin/fields/form-controls";
import { FormNumberField } from "@/components/admin/fields/form-number-field";
import { SeoFieldsSection } from "@/components/admin/fields/seo-fields-section";
import {
  SlugField,
  type SlugAvailabilityChecker,
} from "@/components/admin/fields/slug-field";
import {
  FormCheckboxField,
  FormInputField,
  FormSelectField,
  FormTextareaField,
} from "@/components/forms";
import { FieldLegend, FieldSet } from "@/components/ui/field";
import { LANGUAGE_REQUIREMENT_TYPES } from "@/contracts/content";
import { programsApi } from "@/features/content/api";
import { useUniversities } from "@/features/content/queries";
import { FX_RATES } from "@/lib/constants";
import { defaultSectionsFor } from "@/lib/content-templates";
import { DEGREE_LEVEL_LABELS, DEGREE_LEVELS } from "@/lib/degree-levels";
import { LANGUAGE_REQUIREMENT_TYPE_LABELS } from "@/lib/language-requirements";
import type { ContentSectionFormValues } from "@/lib/validations/content-section";
import type { ProgramFormValues } from "@/lib/validations/program";

export const PROGRAM_FORM_FIELDS = [
  "nameFa",
  "slug",
  "universitySlug",
  "countrySlug",
  "degreeLevel",
  "field",
  "duration",
  "tuition",
  "currency",
  "languageType",
  "languageMinScore",
  "languageOther",
  "minGpa",
  "intakes",
  "deadline",
  "hasScholarship",
  "status",
  "scheduledAt",
  "sections",
  "seo.metaTitle",
  "seo.metaDescription",
  "seo.ogImageId",
  "seo.noindex",
] as const;

export type ProgramFormStepId =
  | "basics"
  | "requirements"
  | "sections"
  | "seo";

/** Wizard steps for program create / edit — one section per step */
export const PROGRAM_FORM_STEPS: readonly FormWizardStep<ProgramFormValues>[] = [
  {
    id: "basics",
    title: "اطلاعات اصلی",
    fields: [
      "nameFa",
      "slug",
      "universitySlug",
      "countrySlug",
      "degreeLevel",
      "field",
      "duration",
      "tuition",
      "currency",
      "deadline",
      "hasScholarship",
    ],
  },
  {
    id: "requirements",
    title: "شرایط پذیرش",
    fields: [
      "languageType",
      "languageMinScore",
      "languageOther",
      "minGpa",
      "intakes",
    ],
  },
  {
    id: "sections",
    title: "توضیحات تکمیلی",
    fields: ["sections"],
  },
  {
    id: "seo",
    title: "سئو و شبکه اجتماعی",
    fields: ["seo"],
  },
];

const CURRENCY_OPTIONS = (
  Object.keys(FX_RATES) as Array<keyof typeof FX_RATES>
).map((code) => ({ value: code, label: code }));

const DEGREE_OPTIONS = DEGREE_LEVELS.map((level) => ({
  value: level,
  label: DEGREE_LEVEL_LABELS[level],
}));

const LANGUAGE_TYPE_OPTIONS = LANGUAGE_REQUIREMENT_TYPES.map((type) => ({
  value: type,
  label: LANGUAGE_REQUIREMENT_TYPE_LABELS[type],
}));

function BasicsSection({
  form,
  excludeId,
  checkSlug,
  universityOptions,
  universitiesLoading,
}: {
  form: UseFormReturn<ProgramFormValues>;
  excludeId?: string;
  checkSlug: SlugAvailabilityChecker;
  universityOptions: { value: string; label: string; description?: string }[];
  universitiesLoading: boolean;
}) {
  const { control } = form;
  return (
    <FieldSet>
      <FieldLegend>اطلاعات اصلی</FieldLegend>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormInputField
          control={control}
          name="nameFa"
          label="نام برنامه"
          className="sm:col-span-2"
        />
        <SlugField<ProgramFormValues>
          name="slug"
          titleName="nameFa"
          excludeId={excludeId}
          checkAvailability={checkSlug}
          className="sm:col-span-2"
        />
        <FormComboboxField
          control={control}
          name="universitySlug"
          label="دانشگاه"
          options={universityOptions}
          isLoading={universitiesLoading}
          searchPlaceholder="جستجوی دانشگاه…"
          placeholder="انتخاب دانشگاه…"
        />
        <FormInputField
          control={control}
          name="countrySlug"
          label="کشور (از دانشگاه)"
          disabled
          dir="ltr"
          description="به‌صورت خودکار از دانشگاه انتخاب‌شده پر می‌شود."
        />
        <FormSelectField
          control={control}
          name="degreeLevel"
          label="مقطع"
          options={DEGREE_OPTIONS}
        />
        <FormInputField control={control} name="field" label="رشته" />
        <FormInputField control={control} name="duration" label="مدت دوره" />
        <FormNumberField
          control={control}
          name="tuition"
          label="شهریه سالانه"
          min={0}
        />
        <FormSelectField
          control={control}
          name="currency"
          label="ارز"
          options={CURRENCY_OPTIONS}
        />
        <FormDateTimeField
          control={control}
          name="deadline"
          label="ددلاین اقدام"
          mode="date"
        />
        <FormCheckboxField
          control={control}
          name="hasScholarship"
          label="دارای بورسیه"
          className="sm:col-span-2"
        />
      </div>
    </FieldSet>
  );
}

function RequirementsSection({
  form,
}: {
  form: UseFormReturn<ProgramFormValues>;
}) {
  const { control, watch } = form;
  const languageType = watch("languageType");
  return (
    <FieldSet>
      <FieldLegend>شرایط پذیرش</FieldLegend>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormSelectField
          control={control}
          name="languageType"
          label="نوع مدرک زبان"
          options={LANGUAGE_TYPE_OPTIONS}
        />
        {languageType !== "none" && languageType !== "other" ? (
          <FormNumberField
            control={control}
            name="languageMinScore"
            label="حداقل نمره"
            min={0}
          />
        ) : null}
        {languageType === "other" ? (
          <FormTextareaField
            control={control}
            name="languageOther"
            label="توضیح مدرک زبان"
            rows={2}
            className="sm:col-span-2"
          />
        ) : null}
        <FormNumberField
          control={control}
          name="minGpa"
          label="حداقل معدل (مقیاس ۴)"
          min={0}
          max={4}
          step={0.1}
        />
      </div>
      <FormTagInputField
        control={control}
        name="intakes"
        label="Intakeها"
        description="مثلاً پاییز، بهار — Enter برای افزودن."
        placeholder="افزودن intake…"
        maxTags={8}
      />
    </FieldSet>
  );
}

function SectionsSection({
  form,
}: {
  form: UseFormReturn<ProgramFormValues>;
}) {
  const { control, watch, setValue } = form;
  const slug = watch("slug");
  const sections = watch("sections");

  function ensureSections() {
    if (sections && sections.length > 0) return;
    setValue(
      "sections",
      defaultSectionsFor("program") as ContentSectionFormValues[],
      { shouldDirty: true },
    );
  }

  return (
    <FieldSet>
      <FieldLegend>توضیحات تکمیلی (اختیاری)</FieldLegend>
      {sections && sections.length > 0 ? (
        <SectionsEditor
          control={control}
          name="sections"
          kind="program"
          previewPath={slug ? `/programs/${slug}` : "/programs/…"}
        />
      ) : (
        <button
          type="button"
          className="text-sm text-primary underline-offset-4 hover:underline"
          onClick={ensureSections}
        >
          افزودن بخش‌های توضیحی
        </button>
      )}
    </FieldSet>
  );
}

function SeoSection({ form }: { form: UseFormReturn<ProgramFormValues> }) {
  const { control, watch } = form;
  const slug = watch("slug");
  return (
    <SeoFieldsSection
      control={control}
      namePrefix="seo"
      siteHost="apply.example"
      previewPath={slug ? `/programs/${slug}` : "/programs/…"}
    />
  );
}

function renderStepContent({
  stepId,
  form,
  excludeId,
  checkSlug,
  universityOptions,
  universitiesLoading,
}: {
  stepId: string;
  form: UseFormReturn<ProgramFormValues>;
  excludeId?: string;
  checkSlug: SlugAvailabilityChecker;
  universityOptions: { value: string; label: string; description?: string }[];
  universitiesLoading: boolean;
}) {
  switch (stepId as ProgramFormStepId) {
    case "basics":
      return (
        <BasicsSection
          form={form}
          excludeId={excludeId}
          checkSlug={checkSlug}
          universityOptions={universityOptions}
          universitiesLoading={universitiesLoading}
        />
      );
    case "requirements":
      return <RequirementsSection form={form} />;
    case "sections":
      return <SectionsSection form={form} />;
    case "seo":
      return <SeoSection form={form} />;
    default:
      return null;
  }
}

/** Fields of the create / edit program form, one wizard step at a time */
export function ProgramFormFields({
  form,
  excludeId,
  stepIndex,
  onStepSelect,
}: {
  form: UseFormReturn<ProgramFormValues>;
  excludeId?: string;
  stepIndex: number;
  onStepSelect: (index: number) => void;
}) {
  const { watch, setValue } = form;
  const universitySlug = watch("universitySlug");

  const universitiesQuery = useUniversities({
    pageSize: 100,
    sort: "nameFa",
    order: "asc",
  });

  const universityOptions = useMemo(
    () =>
      (universitiesQuery.data?.items ?? []).map((university) => ({
        value: university.slug,
        label: university.nameFa,
        description: university.countrySlug,
      })),
    [universitiesQuery.data?.items],
  );

  const selectedUniversity = useMemo(
    () =>
      universitiesQuery.data?.items.find(
        (item) => item.slug === universitySlug,
      ),
    [universitiesQuery.data?.items, universitySlug],
  );

  useEffect(() => {
    if (!selectedUniversity) return;
    if (form.getValues("countrySlug") !== selectedUniversity.countrySlug) {
      setValue("countrySlug", selectedUniversity.countrySlug, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [selectedUniversity, form, setValue]);

  const checkSlug = useCallback(
    (args: { slug: string; excludeId?: string; signal?: AbortSignal }) =>
      programsApi.checkSlugAvailable(args.slug, {
        excludeId: args.excludeId,
        signal: args.signal,
      }),
    [],
  );

  const activeStep = PROGRAM_FORM_STEPS[stepIndex] ?? PROGRAM_FORM_STEPS[0];
  if (!activeStep) return null;

  return (
    <FormWizardShell
      steps={PROGRAM_FORM_STEPS}
      stepIndex={stepIndex}
      onStepSelect={onStepSelect}
    >
      {renderStepContent({
        stepId: activeStep.id,
        form,
        excludeId,
        checkSlug,
        universityOptions,
        universitiesLoading: universitiesQuery.isPending,
      })}
    </FormWizardShell>
  );
}
