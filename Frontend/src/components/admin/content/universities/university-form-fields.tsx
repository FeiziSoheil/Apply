"use client";

import { useCallback, useMemo } from "react";
import type { UseFormReturn } from "react-hook-form";
import { SectionsEditor } from "@/components/admin/content/sections-editor";
import type { FormWizardStep } from "@/components/admin/entity-form/form-wizard";
import { FormWizardShell } from "@/components/admin/entity-form/form-wizard-shell";
import { FieldArrayEditor } from "@/components/admin/fields/field-array-editor";
import { FormComboboxField } from "@/components/admin/fields/form-combobox-field";
import {
  FormDateTimeField,
  FormImageField,
} from "@/components/admin/fields/form-controls";
import { FormNumberField } from "@/components/admin/fields/form-number-field";
import { SeoFieldsSection } from "@/components/admin/fields/seo-fields-section";
import {
  SlugField,
  type SlugAvailabilityChecker,
} from "@/components/admin/fields/slug-field";
import {
  FormInputField,
  FormSelectField,
  FormTextareaField,
} from "@/components/forms";
import { FieldLegend, FieldSet } from "@/components/ui/field";
import { FX_RATES } from "@/lib/constants";
import { universitiesApi } from "@/features/content/api";
import { useCountries } from "@/features/content/queries";
import type { UniversityFormValues } from "@/lib/validations/university";

export const UNIVERSITY_FORM_FIELDS = [
  "nameFa",
  "nameEn",
  "slug",
  "countrySlug",
  "city",
  "ranking",
  "tuitionPerYear",
  "currency",
  "logo",
  "heroImage",
  "summary",
  "status",
  "scheduledAt",
  "deadlines",
  "requirements",
  "sections",
  "seo.metaTitle",
  "seo.metaDescription",
  "seo.ogImageId",
  "seo.noindex",
] as const;

export type UniversityFormStepId =
  | "basics"
  | "costs"
  | "structured"
  | "sections"
  | "seo";

/** Wizard steps for university create / edit — one section per step */
export const UNIVERSITY_FORM_STEPS: readonly FormWizardStep<UniversityFormValues>[] =
  [
    {
      id: "basics",
      title: "اطلاعات اصلی",
      fields: [
        "nameFa",
        "nameEn",
        "slug",
        "countrySlug",
        "city",
        "ranking",
        "summary",
        "logo",
        "heroImage",
      ],
    },
    {
      id: "costs",
      title: "شهریه و ددلاین‌ها",
      fields: ["tuitionPerYear", "currency", "deadlines"],
    },
    {
      id: "structured",
      title: "شرایط پذیرش",
      fields: ["requirements"],
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

const CURRENCY_OPTIONS = (
  Object.keys(FX_RATES) as Array<keyof typeof FX_RATES>
).map((code) => ({ value: code, label: code }));

function BasicsSection({
  form,
  excludeId,
  checkSlug,
  countryOptions,
  countriesLoading,
}: {
  form: UseFormReturn<UniversityFormValues>;
  excludeId?: string;
  checkSlug: SlugAvailabilityChecker;
  countryOptions: { value: string; label: string; description?: string }[];
  countriesLoading: boolean;
}) {
  const { control } = form;
  return (
    <FieldSet>
      <FieldLegend>اطلاعات اصلی</FieldLegend>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormInputField control={control} name="nameFa" label="نام فارسی" />
        <FormInputField
          control={control}
          name="nameEn"
          label="نام انگلیسی"
          dir="ltr"
        />
        <SlugField<UniversityFormValues>
          name="slug"
          titleName="nameFa"
          excludeId={excludeId}
          checkAvailability={checkSlug}
          className="sm:col-span-2"
        />
        <FormComboboxField
          control={control}
          name="countrySlug"
          label="کشور"
          options={countryOptions}
          isLoading={countriesLoading}
          searchPlaceholder="جستجوی کشور…"
          placeholder="انتخاب کشور…"
        />
        <FormInputField control={control} name="city" label="شهر" />
        <FormNumberField
          control={control}
          name="ranking"
          label="رتبه جهانی"
          min={1}
        />
      </div>
      <FormTextareaField
        control={control}
        name="summary"
        label="خلاصه (کارت)"
        rows={3}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormImageField control={control} name="logo" label="لوگو" />
        <FormImageField control={control} name="heroImage" label="تصویر شاخص" />
      </div>
    </FieldSet>
  );
}

function CostsSection({
  form,
}: {
  form: UseFormReturn<UniversityFormValues>;
}) {
  const { control } = form;
  return (
    <FieldSet>
      <FieldLegend>شهریه و ددلاین‌ها</FieldLegend>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormNumberField
          control={control}
          name="tuitionPerYear"
          label="شهریه سالانه"
          min={0}
        />
        <FormSelectField
          control={control}
          name="currency"
          label="ارز"
          options={CURRENCY_OPTIONS}
        />
      </div>
      <FieldArrayEditor
        control={control}
        name="deadlines"
        label="ددلاین‌ها"
        addLabel="افزودن ددلاین"
        emptyItem={{ label: "", date: "" }}
        collapsible
        getRowTitle={(index) => {
          const row = form.getValues(`deadlines.${index}`);
          return row?.label?.trim() || `ددلاین ${index + 1}`;
        }}
        removeLabel={(index) => `حذف ددلاین ${index + 1}`}
      >
        {(index) => (
          <>
            <FormInputField
              control={control}
              name={`deadlines.${index}.label`}
              label="عنوان"
            />
            <FormDateTimeField
              control={control}
              name={`deadlines.${index}.date`}
              label="تاریخ"
              mode="date"
            />
          </>
        )}
      </FieldArrayEditor>
    </FieldSet>
  );
}

function StructuredSection({
  form,
}: {
  form: UseFormReturn<UniversityFormValues>;
}) {
  const { control } = form;
  return (
    <FieldSet>
      <FieldLegend>شرایط پذیرش</FieldLegend>
      <FieldArrayEditor
        control={control}
        name="requirements"
        label="شرایط و مدارک"
        addLabel="افزودن شرط"
        emptyItem={{ value: "" }}
        getRowTitle={(index) => {
          const row = form.getValues(`requirements.${index}`);
          return row?.value?.trim() || `شرط ${index + 1}`;
        }}
        removeLabel={(index) => `حذف شرط ${index + 1}`}
      >
        {(index) => (
          <FormInputField
            control={control}
            name={`requirements.${index}.value`}
            label={`شرط ${index + 1}`}
            className="sm:col-span-2"
          />
        )}
      </FieldArrayEditor>
    </FieldSet>
  );
}

function SectionsSection({
  form,
}: {
  form: UseFormReturn<UniversityFormValues>;
}) {
  const { control, watch } = form;
  const slug = watch("slug");
  return (
    <FieldSet>
      <FieldLegend>بخش‌های صفحه</FieldLegend>
      <SectionsEditor
        control={control}
        name="sections"
        kind="university"
        previewPath={slug ? `/universities/${slug}` : "/universities/…"}
      />
    </FieldSet>
  );
}

function SeoSection({ form }: { form: UseFormReturn<UniversityFormValues> }) {
  const { control, watch } = form;
  const slug = watch("slug");
  return (
    <SeoFieldsSection
      control={control}
      namePrefix="seo"
      siteHost="apply.example"
      previewPath={slug ? `/universities/${slug}` : "/universities/…"}
    />
  );
}

function renderStepContent({
  stepId,
  form,
  excludeId,
  checkSlug,
  countryOptions,
  countriesLoading,
}: {
  stepId: string;
  form: UseFormReturn<UniversityFormValues>;
  excludeId?: string;
  checkSlug: SlugAvailabilityChecker;
  countryOptions: { value: string; label: string; description?: string }[];
  countriesLoading: boolean;
}) {
  switch (stepId as UniversityFormStepId) {
    case "basics":
      return (
        <BasicsSection
          form={form}
          excludeId={excludeId}
          checkSlug={checkSlug}
          countryOptions={countryOptions}
          countriesLoading={countriesLoading}
        />
      );
    case "costs":
      return <CostsSection form={form} />;
    case "structured":
      return <StructuredSection form={form} />;
    case "sections":
      return <SectionsSection form={form} />;
    case "seo":
      return <SeoSection form={form} />;
    default:
      return null;
  }
}

/** Fields of the create / edit university form, one wizard step at a time */
export function UniversityFormFields({
  form,
  excludeId,
  stepIndex,
  onStepSelect,
}: {
  form: UseFormReturn<UniversityFormValues>;
  excludeId?: string;
  stepIndex: number;
  onStepSelect: (index: number) => void;
}) {
  const countriesQuery = useCountries({
    pageSize: 100,
    sort: "nameFa",
    order: "asc",
  });
  const countryOptions = useMemo(
    () =>
      (countriesQuery.data?.items ?? []).map((country) => ({
        value: country.slug,
        label: country.nameFa,
        description: country.nameEn,
      })),
    [countriesQuery.data?.items],
  );

  const checkSlug = useCallback(
    (args: { slug: string; excludeId?: string; signal?: AbortSignal }) =>
      universitiesApi.checkSlugAvailable(args.slug, {
        excludeId: args.excludeId,
        signal: args.signal,
      }),
    [],
  );

  const activeStep =
    UNIVERSITY_FORM_STEPS[stepIndex] ?? UNIVERSITY_FORM_STEPS[0];
  if (!activeStep) return null;

  return (
    <FormWizardShell
      steps={UNIVERSITY_FORM_STEPS}
      stepIndex={stepIndex}
      onStepSelect={onStepSelect}
    >
      {renderStepContent({
        stepId: activeStep.id,
        form,
        excludeId,
        checkSlug,
        countryOptions,
        countriesLoading: countriesQuery.isPending,
      })}
    </FormWizardShell>
  );
}
