"use client";

import { useMemo } from "react";
import type { UseFormReturn } from "react-hook-form";
import {
  FormImageField,
  FormTagInputField,
} from "@/components/admin/fields/form-controls";
import {
  FormCheckboxField,
  FormInputField,
  FormMultiCheckboxField,
  FormTextareaField,
} from "@/components/forms";
import { FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { useCountries } from "@/features/content/queries";
import type { ConsultantFormValues } from "@/lib/validations/consultant";

/** Names of every field of the form (server field errors outside this list are toasted) */
export const CONSULTANT_FORM_FIELDS = [
  "name",
  "role",
  "photo",
  "bio",
  "countries",
  "languages",
  "showOnTeamPage",
  "active",
] as const;

/** Fields of the create / edit consultant form, grouped in anchored sections */
export function ConsultantFormFields({
  form,
}: {
  form: UseFormReturn<ConsultantFormValues>;
}) {
  const { control, watch } = form;
  const selectedCountries = watch("countries");
  const countriesQuery = useCountries({
    pageSize: 100,
    sort: "nameFa",
    order: "asc",
  });

  // Keep slugs saved earlier visible even when the country list is unavailable
  const countryOptions = useMemo(() => {
    const options = (countriesQuery.data?.items ?? []).map((country) => ({
      value: country.slug,
      label: country.nameFa,
      hint: country.nameEn,
    }));
    const known = new Set(options.map((option) => option.value));
    for (const slug of selectedCountries ?? []) {
      if (!known.has(slug)) options.push({ value: slug, label: slug, hint: "" });
    }
    return options;
  }, [countriesQuery.data?.items, selectedCountries]);

  return (
    <FieldGroup className="gap-8">
      <section id="profile" className="scroll-mt-28">
        <FieldSet>
          <FieldLegend>مشخصات</FieldLegend>
          <FormImageField
            control={control}
            name="photo"
            label="عکس مشاور"
            variant="avatar"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInputField control={control} name="name" label="نام و نام خانوادگی" />
            <FormInputField
              control={control}
              name="role"
              label="سمت"
              placeholder="مثلاً مشاور ارشد پذیرش اروپا"
            />
          </div>
          <FormTextareaField
            control={control}
            name="bio"
            label="بیوگرافی"
            rows={5}
          />
        </FieldSet>
      </section>

      <Separator />

      <section id="coverage" className="scroll-mt-28">
        <FieldSet>
          <FieldLegend>کشورها و زبان‌ها</FieldLegend>
          <FormMultiCheckboxField
            control={control}
            name="countries"
            label="کشورهای تحت مسئولیت"
            description={
              countriesQuery.isPending
                ? "در حال بارگذاری کشورها…"
                : "حداقل یک کشور انتخاب کنید."
            }
            options={countryOptions}
            max={20}
          />
          <FormTagInputField
            control={control}
            name="languages"
            label="زبان‌ها"
            description="هر زبان را بنویسید و Enter بزنید."
            maxTags={10}
          />
        </FieldSet>
      </section>

      <Separator />

      <section id="visibility" className="scroll-mt-28">
        <FieldSet>
          <FieldLegend>نمایش و وضعیت</FieldLegend>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormCheckboxField
              control={control}
              name="showOnTeamPage"
              label="نمایش در صفحه تیم"
              description="مشاور در صفحه عمومی «تیم ما» نمایش داده می‌شود."
            />
            <FormCheckboxField
              control={control}
              name="active"
              label="فعال"
              description="مشاور غیرفعال برای رزرو و ارجاع جدید در دسترس نیست."
            />
          </div>
        </FieldSet>
      </section>
    </FieldGroup>
  );
}
