"use client";

import { useMemo } from "react";
import type { UseFormReturn } from "react-hook-form";
import {
  FormCheckboxField,
  FormInputField,
  FormMultiCheckboxField,
  FormSelectField,
  FormTextareaField,
} from "@/components/forms";
import { FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { useCountries } from "@/features/content/queries";
import {
  ANNOUNCEMENT_STATUS_OPTIONS,
  type AnnouncementFormValues,
} from "@/lib/validations/announcement";

export const ANNOUNCEMENT_FORM_FIELDS = [
  "title",
  "body",
  "allStudents",
  "countrySlugs",
  "status",
] as const;

export function AnnouncementFormFields({
  form,
}: {
  form: UseFormReturn<AnnouncementFormValues>;
}) {
  const { control, watch } = form;
  const allStudents = watch("allStudents");
  const selectedCountries = watch("countrySlugs");

  const countriesQuery = useCountries({
    pageSize: 100,
    sort: "nameFa",
    order: "asc",
  });

  const countryOptions = useMemo(() => {
    const options = (countriesQuery.data?.items ?? []).map((country) => ({
      value: country.slug,
      label: country.nameFa,
      hint: country.nameEn,
    }));
    const known = new Set(options.map((option) => option.value));
    for (const slug of selectedCountries ?? []) {
      if (!known.has(slug)) {
        options.push({ value: slug, label: slug, hint: "" });
      }
    }
    return options;
  }, [countriesQuery.data?.items, selectedCountries]);

  return (
    <FieldGroup className="gap-8">
      <section id="content" className="scroll-mt-28">
        <FieldSet>
          <FieldLegend>متن اعلان</FieldLegend>
          <FormInputField control={control} name="title" label="عنوان" />
          <FormTextareaField
            control={control}
            name="body"
            label="متن"
            description="متن ساده و کوتاه؛ بدون HTML. دانشجویان در پنل می‌بینند."
            rows={8}
          />
          <FormSelectField
            control={control}
            name="status"
            label="وضعیت انتشار"
            options={[...ANNOUNCEMENT_STATUS_OPTIONS]}
            className="sm:max-w-xs"
          />
        </FieldSet>
      </section>

      <Separator />

      <section id="audience" className="scroll-mt-28">
        <FieldSet>
          <FieldLegend>مخاطب</FieldLegend>
          <FormCheckboxField
            control={control}
            name="allStudents"
            label="ارسال به همه دانشجویان"
            description="اگر خاموش باشد، فقط کشورهای انتخاب‌شده مخاطب هستند."
          />
          {!allStudents ? (
            <FormMultiCheckboxField
              control={control}
              name="countrySlugs"
              label="کشورهای مقصد"
              description={
                countriesQuery.isPending
                  ? "در حال بارگذاری کشورها…"
                  : "دانشجویانی که پرونده‌شان این کشورها را دارد اعلان را می‌بینند."
              }
              options={countryOptions}
            />
          ) : null}
        </FieldSet>
      </section>
    </FieldGroup>
  );
}
