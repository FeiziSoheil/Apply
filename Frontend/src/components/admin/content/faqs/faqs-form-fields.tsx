"use client";

import { useMemo } from "react";
import type { UseFormReturn } from "react-hook-form";
import {
  FormInputField,
  FormSelectField,
  FormTextareaField,
} from "@/components/forms";
import { FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field";
import {
  FAQ_CATEGORY_OPTIONS,
  type FaqFormValues,
} from "@/lib/validations/faq";

/** Names of every field of the form (server field errors outside this list are toasted) */
export const FAQ_FORM_FIELDS = ["question", "answer", "category"] as const;

/** Fields of the create / edit FAQ form */
export function FaqFormFields({ form }: { form: UseFormReturn<FaqFormValues> }) {
  const { control, watch } = form;
  const currentCategory = watch("category");

  // Keep a category saved earlier visible even if it is not in the preset list
  const categoryOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [
      ...FAQ_CATEGORY_OPTIONS,
    ];
    if (currentCategory && !options.some((o) => o.value === currentCategory)) {
      options.push({ value: currentCategory, label: currentCategory });
    }
    return options;
  }, [currentCategory]);

  return (
    <FieldGroup className="gap-8">
      <section id="content" className="scroll-mt-28">
        <FieldSet>
          <FieldLegend>پرسش و پاسخ</FieldLegend>
          <FormInputField control={control} name="question" label="پرسش" />
          <FormTextareaField
            control={control}
            name="answer"
            label="پاسخ"
            description="متن ساده؛ هر خط جدید در سایت به‌صورت پاراگراف نمایش داده می‌شود."
            rows={8}
          />
          <FormSelectField
            control={control}
            name="category"
            label="دسته‌بندی"
            options={categoryOptions}
            className="sm:max-w-xs"
          />
        </FieldSet>
      </section>
    </FieldGroup>
  );
}
