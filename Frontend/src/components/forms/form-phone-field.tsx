"use client";

import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { FormInputField } from "./form-input-field";

type FormPhoneFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
};

export function FormPhoneField<T extends FieldValues>({
  control,
  name,
  label = "شماره موبایل",
  description,
  disabled,
  className,
}: FormPhoneFieldProps<T>) {
  return (
    <FormInputField
      control={control}
      name={name}
      label={label}
      description={description}
      type="tel"
      inputMode="numeric"
      autoComplete="tel"
      placeholder="09123456789"
      dir="ltr"
      disabled={disabled}
      className={className}
    />
  );
}
