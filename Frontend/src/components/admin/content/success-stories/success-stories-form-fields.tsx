"use client";

import { useCallback, useMemo } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { FormWizardStep } from "@/components/admin/entity-form/form-wizard";
import { FormWizardShell } from "@/components/admin/entity-form/form-wizard-shell";
import { FormImageField } from "@/components/admin/fields/form-controls";
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
import { successStoriesApi } from "@/features/content/api";
import { useCountries } from "@/features/content/queries";
import type { SuccessStoryFormValues } from "@/lib/validations/success-story";

/** Names of every field of the form (server field errors outside this list are toasted) */
export const SUCCESS_STORY_FORM_FIELDS = [
  "studentName",
  "isAnonymous",
  "slug",
  "country",
  "university",
  "field",
  "year",
  "quote",
  "body",
  "videoUrl",
  "photo",
  "publicationConsent",
  "status",
  "scheduledAt",
  "seo.metaTitle",
  "seo.metaDescription",
  "seo.ogImageId",
  "seo.noindex",
] as const;

export type SuccessStoryFormStepId = "student" | "story" | "consent" | "seo";

/** Wizard steps for success story create / edit — one section per step */
export const SUCCESS_STORY_FORM_STEPS: readonly FormWizardStep<SuccessStoryFormValues>[] =
  [
    {
      id: "student",
      title: "دانشجو و مقصد",
      fields: [
        "studentName",
        "isAnonymous",
        "slug",
        "country",
        "university",
        "field",
        "year",
      ],
    },
    {
      id: "story",
      title: "متن و رسانه",
      fields: ["quote", "body", "videoUrl", "photo"],
    },
    {
      id: "consent",
      title: "رضایت انتشار",
      fields: ["publicationConsent"],
    },
    {
      id: "seo",
      title: "سئو و شبکه اجتماعی",
      fields: ["seo"],
    },
  ];

function StudentSection({
  form,
  excludeId,
  checkSlug,
  countryOptions,
}: {
  form: UseFormReturn<SuccessStoryFormValues>;
  excludeId?: string;
  checkSlug: SlugAvailabilityChecker;
  countryOptions: { value: string; label: string }[];
}) {
  const { control } = form;
  return (
    <FieldSet>
      <FieldLegend>دانشجو و مقصد</FieldLegend>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormInputField
          control={control}
          name="studentName"
          label="نام دانشجو"
        />
        <FormCheckboxField
          control={control}
          name="isAnonymous"
          label="نمایش ناشناس"
          description="نام دانشجو در سایت عمومی پنهان می‌شود."
        />
        <SlugField<SuccessStoryFormValues>
          name="slug"
          titleName="studentName"
          label="اسلاگ (اختیاری)"
          description="برای صفحه اختصاصی داستان؛ در صورت خالی بودن، فقط در فهرست نمایش داده می‌شود."
          excludeId={excludeId}
          checkAvailability={checkSlug}
          className="sm:col-span-2"
        />
        <FormSelectField
          control={control}
          name="country"
          label="کشور"
          options={countryOptions}
        />
        <FormInputField control={control} name="university" label="دانشگاه" />
        <FormInputField control={control} name="field" label="رشته" />
        <FormNumberField
          control={control}
          name="year"
          label="سال پذیرش"
          min={1990}
          max={2100}
          step={1}
        />
      </div>
    </FieldSet>
  );
}

function StorySection({
  form,
}: {
  form: UseFormReturn<SuccessStoryFormValues>;
}) {
  const { control } = form;
  return (
    <FieldSet>
      <FieldLegend>متن و رسانه</FieldLegend>
      <FormTextareaField
        control={control}
        name="quote"
        label="نقل‌قول کوتاه"
        rows={3}
      />
      <FormTextareaField
        control={control}
        name="body"
        label="متن کامل (اختیاری)"
        rows={8}
      />
      <FormInputField
        control={control}
        name="videoUrl"
        label="لینک ویدیو (اختیاری)"
        dir="ltr"
        placeholder="https://"
      />
      <FormImageField control={control} name="photo" label="تصویر (اختیاری)" />
    </FieldSet>
  );
}

function ConsentSection({
  form,
}: {
  form: UseFormReturn<SuccessStoryFormValues>;
}) {
  return (
    <FieldSet>
      <FieldLegend>رضایت انتشار</FieldLegend>
      <FormCheckboxField
        control={form.control}
        name="publicationConsent"
        label="رضایت دانشجو برای انتشار عمومی دریافت شده است"
        description="بدون این رضایت، انتشار یا زمان‌بندی داستان ممکن نیست."
      />
    </FieldSet>
  );
}

function SeoSection({
  form,
  previewPath,
}: {
  form: UseFormReturn<SuccessStoryFormValues>;
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
  countryOptions,
  previewPath,
}: {
  stepId: string;
  form: UseFormReturn<SuccessStoryFormValues>;
  excludeId?: string;
  checkSlug: SlugAvailabilityChecker;
  countryOptions: { value: string; label: string }[];
  previewPath: string;
}) {
  switch (stepId as SuccessStoryFormStepId) {
    case "student":
      return (
        <StudentSection
          form={form}
          excludeId={excludeId}
          checkSlug={checkSlug}
          countryOptions={countryOptions}
        />
      );
    case "story":
      return <StorySection form={form} />;
    case "consent":
      return <ConsentSection form={form} />;
    case "seo":
      return <SeoSection form={form} previewPath={previewPath} />;
    default:
      return null;
  }
}

/** Fields of the create / edit success story form, one wizard step at a time */
export function SuccessStoryFormFields({
  form,
  excludeId,
  stepIndex,
  onStepSelect,
}: {
  form: UseFormReturn<SuccessStoryFormValues>;
  excludeId?: string;
  stepIndex: number;
  onStepSelect: (index: number) => void;
}) {
  const slug = form.watch("slug");
  const currentCountry = form.watch("country");
  const previewPath = slug ? `/success-stories/${slug}` : "/success-stories";

  const countriesQuery = useCountries({
    pageSize: 100,
    sort: "nameFa",
    order: "asc",
  });

  // `country` is stored as a display name; keep a saved value that is no longer listed
  const countryOptions = useMemo(() => {
    const options = (countriesQuery.data?.items ?? []).map((country) => ({
      value: country.nameFa,
      label: country.nameFa,
    }));
    if (currentCountry && !options.some((o) => o.value === currentCountry)) {
      options.push({ value: currentCountry, label: currentCountry });
    }
    return options;
  }, [countriesQuery.data?.items, currentCountry]);

  const checkSlug = useCallback(
    (args: { slug: string; excludeId?: string; signal?: AbortSignal }) =>
      successStoriesApi.checkSlugAvailable(args.slug, {
        excludeId: args.excludeId,
        signal: args.signal,
      }),
    [],
  );

  const activeStep =
    SUCCESS_STORY_FORM_STEPS[stepIndex] ?? SUCCESS_STORY_FORM_STEPS[0];
  if (!activeStep) return null;

  return (
    <FormWizardShell
      steps={SUCCESS_STORY_FORM_STEPS}
      stepIndex={stepIndex}
      onStepSelect={onStepSelect}
    >
      {renderStepContent({
        stepId: activeStep.id,
        form,
        excludeId,
        checkSlug,
        countryOptions,
        previewPath,
      })}
    </FormWizardShell>
  );
}
