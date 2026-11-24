"use client";

import { useCallback } from "react";
import type { UseFormReturn } from "react-hook-form";
import { SectionsEditor } from "@/components/admin/content/sections-editor";
import { FormWizardShell } from "@/components/admin/entity-form/form-wizard-shell";
import type { FormWizardStep } from "@/components/admin/entity-form/form-wizard";
import { FieldArrayEditor } from "@/components/admin/fields/field-array-editor";
import {
  FormImageField,
  FormTagInputField,
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
import { countriesApi } from "@/features/content/api";
import { CONTINENT_OPTIONS, COST_BAND_OPTIONS } from "@/lib/continents";
import type { CountryFormValues } from "@/lib/validations/country";

/** Names of every field of the form (server field errors outside this list are toasted) */
export const COUNTRY_FORM_FIELDS = [
  "nameFa",
  "nameEn",
  "slug",
  "continent",
  "costBand",
  "status",
  "scheduledAt",
  "flagEmoji",
  "flagPath",
  "heroImage",
  "summary",
  "language",
  "visaDuration",
  "costOfLiving",
  "tuitionRange",
  "currency",
  "benefits",
  "requirements",
  "popularFields",
  "costBreakdown",
  "faqs",
  "sections",
  "seo.metaTitle",
  "seo.metaDescription",
  "seo.ogImageId",
  "seo.noindex",
] as const;

export type CountryFormStepId =
  | "basics"
  | "costs"
  | "structured"
  | "sections"
  | "seo";

/** Wizard steps for country create / edit — one section per step */
export const COUNTRY_FORM_STEPS: readonly FormWizardStep<CountryFormValues>[] = [
  {
    id: "basics",
    title: "اطلاعات اصلی",
    fields: [
      "nameFa",
      "nameEn",
      "slug",
      "flagEmoji",
      "flagPath",
      "continent",
      "costBand",
      "heroImage",
      "summary",
    ],
  },
  {
    id: "costs",
    title: "تحصیل و هزینه‌ها",
    fields: [
      "language",
      "visaDuration",
      "costOfLiving",
      "currency",
      "tuitionRange",
      "costBreakdown",
    ],
  },
  {
    id: "structured",
    title: "محتوای ساختاریافته",
    fields: ["benefits", "requirements", "popularFields", "faqs"],
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
  form: UseFormReturn<CountryFormValues>;
  excludeId?: string;
  checkSlug: SlugAvailabilityChecker;
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
        <SlugField<CountryFormValues>
          name="slug"
          titleName="nameFa"
          excludeId={excludeId}
          checkAvailability={checkSlug}
          className="sm:col-span-2"
        />
        <FormInputField
          control={control}
          name="flagEmoji"
          label="ایموجی پرچم"
          placeholder="🇩🇪"
        />
        <FormSelectField
          control={control}
          name="continent"
          label="قاره"
          options={CONTINENT_OPTIONS}
        />
        <FormSelectField
          control={control}
          name="costBand"
          label="سطح هزینه"
          options={COST_BAND_OPTIONS}
        />
      </div>
      <FormImageField control={control} name="heroImage" label="تصویر شاخص" />
      <FormTextareaField
        control={control}
        name="summary"
        label="خلاصه"
        rows={3}
      />
    </FieldSet>
  );
}

function CostsSection({ form }: { form: UseFormReturn<CountryFormValues> }) {
  const { control } = form;
  return (
    <FieldSet>
      <FieldLegend>تحصیل و هزینه‌ها</FieldLegend>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormInputField control={control} name="language" label="زبان تحصیل" />
        <FormInputField
          control={control}
          name="visaDuration"
          label="مدت زمان صدور ویزا"
        />
        <FormNumberField
          control={control}
          name="costOfLiving"
          label="هزینه زندگی ماهانه"
          min={0}
        />
        <FormInputField
          control={control}
          name="currency"
          label="ارز (ISO 4217)"
          dir="ltr"
          placeholder="EUR"
        />
        <FormInputField
          control={control}
          name="tuitionRange"
          label="بازه شهریه سالانه"
          className="sm:col-span-2"
        />
      </div>
      <FieldArrayEditor
        control={control}
        name="costBreakdown"
        label="ریز هزینه‌ها"
        addLabel="افزودن ردیف هزینه"
        emptyItem={{ label: "", amount: "", note: "" }}
        collapsible
        getRowTitle={(index) => {
          const row = form.getValues(`costBreakdown.${index}`);
          return row?.label?.trim() || `ردیف هزینه ${index + 1}`;
        }}
        removeLabel={(index) => `حذف ردیف هزینه ${index + 1}`}
      >
        {(index) => (
          <>
            <FormInputField
              control={control}
              name={`costBreakdown.${index}.label`}
              label="عنوان"
            />
            <FormInputField
              control={control}
              name={`costBreakdown.${index}.amount`}
              label="مبلغ"
            />
            <FormInputField
              control={control}
              name={`costBreakdown.${index}.note`}
              label="توضیح (اختیاری)"
              className="sm:col-span-2"
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
  form: UseFormReturn<CountryFormValues>;
}) {
  const { control } = form;
  return (
    <FieldSet>
      <FieldLegend>محتوای ساختاریافته</FieldLegend>
      <FormTagInputField
        control={control}
        name="benefits"
        label="مزایا (کوتاه برای کارت)"
        description="هر مورد را بنویسید و Enter بزنید. متن بلند در بخش‌های RichContent است."
      />
      <FieldArrayEditor
        control={control}
        name="requirements"
        label="مدارک و شرایط پذیرش"
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
      <FieldArrayEditor
        control={control}
        name="popularFields"
        label="رشته‌های پرطرفدار"
        addLabel="افزودن رشته"
        emptyItem={{ value: "" }}
        getRowTitle={(index) => {
          const row = form.getValues(`popularFields.${index}`);
          return row?.value?.trim() || `رشته ${index + 1}`;
        }}
        removeLabel={(index) => `حذف رشته ${index + 1}`}
      >
        {(index) => (
          <FormInputField
            control={control}
            name={`popularFields.${index}.value`}
            label={`رشته ${index + 1}`}
            className="sm:col-span-2"
          />
        )}
      </FieldArrayEditor>
      <FieldArrayEditor
        control={control}
        name="faqs"
        label="پرسش‌های متداول"
        addLabel="افزودن پرسش"
        emptyItem={{ question: "", answer: "", category: "" }}
        collapsible
        getRowTitle={(index) => {
          const faq = form.getValues(`faqs.${index}`);
          return faq?.question?.trim() || `پرسش ${index + 1}`;
        }}
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
}: {
  form: UseFormReturn<CountryFormValues>;
}) {
  const { control, watch } = form;
  const slug = watch("slug");
  return (
    <FieldSet>
      <FieldLegend>بخش‌های صفحه</FieldLegend>
      <SectionsEditor
        control={control}
        name="sections"
        kind="country"
        previewPath={slug ? `/countries/${slug}` : "/countries/…"}
      />
    </FieldSet>
  );
}

function SeoSection({ form }: { form: UseFormReturn<CountryFormValues> }) {
  const { control, watch } = form;
  const slug = watch("slug");
  return (
    <SeoFieldsSection
      control={control}
      namePrefix="seo"
      siteHost="apply.example"
      previewPath={slug ? `/countries/${slug}` : "/countries/…"}
    />
  );
}

function renderStepContent({
  stepId,
  form,
  excludeId,
  checkSlug,
}: {
  stepId: string;
  form: UseFormReturn<CountryFormValues>;
  excludeId?: string;
  checkSlug: SlugAvailabilityChecker;
}) {
  switch (stepId as CountryFormStepId) {
    case "basics":
      return (
        <BasicsSection form={form} excludeId={excludeId} checkSlug={checkSlug} />
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

/** Fields of the create / edit country form, one wizard step at a time */
export function CountryFormFields({
  form,
  excludeId,
  stepIndex,
  onStepSelect,
}: {
  form: UseFormReturn<CountryFormValues>;
  excludeId?: string;
  stepIndex: number;
  onStepSelect: (index: number) => void;
}) {
  const checkSlug = useCallback(
    (args: { slug: string; excludeId?: string; signal?: AbortSignal }) =>
      countriesApi.checkSlugAvailable(args.slug, {
        excludeId: args.excludeId,
        signal: args.signal,
      }),
    [],
  );

  const activeStep = COUNTRY_FORM_STEPS[stepIndex] ?? COUNTRY_FORM_STEPS[0];
  if (!activeStep) return null;

  return (
    <FormWizardShell
      steps={COUNTRY_FORM_STEPS}
      stepIndex={stepIndex}
      onStepSelect={onStepSelect}
    >
      {renderStepContent({
        stepId: activeStep.id,
        form,
        excludeId,
        checkSlug,
      })}
    </FormWizardShell>
  );
}
