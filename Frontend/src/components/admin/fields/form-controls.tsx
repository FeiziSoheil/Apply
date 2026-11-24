"use client";

import type { ReactNode } from "react";
import {
  useFieldArray,
  type ArrayPath,
  type Control,
  type FieldArray,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ImageUploader } from "../upload/image-uploader";
import { DateTimeJalaliPicker } from "./date-time-jalali-picker";
import { TagInput } from "./tag-input";

/**
 * react-hook-form bindings of the kit's custom controls. Each one is a plain
 * `FormField` + `FormControl`, so label, description, error message and
 * `aria-*` wiring match the project's other form fields.
 */

type BaseProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  description?: string;
  disabled?: boolean;
  className?: string;
};

export function FormTagInputField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled,
  className,
  placeholder,
  maxTags,
}: BaseProps<T> & { placeholder?: string; maxTags?: number }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <TagInput
              value={Array.isArray(field.value) ? (field.value as string[]) : []}
              onChange={field.onChange}
              placeholder={placeholder}
              maxTags={maxTags}
              disabled={disabled}
            />
          </FormControl>
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function FormImageField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled,
  className,
  variant = "default",
}: BaseProps<T> & { variant?: "default" | "avatar" }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <ImageUploader
              value={typeof field.value === "string" ? field.value : null}
              onChange={(url) => field.onChange(url ?? "")}
              previewAlt={label}
              variant={variant}
              disabled={disabled}
            />
          </FormControl>
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function FormDateTimeField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled,
  className,
  mode,
  clearable,
}: BaseProps<T> & { mode?: "date" | "datetime"; clearable?: boolean }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <DateTimeJalaliPicker
              value={typeof field.value === "string" ? field.value : null}
              onChange={(value) => field.onChange(value ?? undefined)}
              mode={mode}
              clearable={clearable}
              disabled={disabled}
            />
          </FormControl>
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

type RepeatableFieldProps<T extends FieldValues, N extends ArrayPath<T>> = {
  control: Control<T>;
  name: N;
  /** Section title, e.g. «پرسش‌های متداول» */
  label: string;
  description?: string;
  addLabel: string;
  /** Row appended by the add button */
  emptyItem: FieldArray<T, N>;
  /** Accessible name of the remove button of row `index` (0-based) */
  removeLabel: (index: number) => string;
  /** Fields of one row; build names as `${name}.${index}.field` */
  children: (index: number) => ReactNode;
  max?: number;
};

/** List of grouped sub-forms (cost breakdown rows, FAQs …) via `useFieldArray` */
export function RepeatableField<T extends FieldValues, N extends ArrayPath<T>>({
  control,
  name,
  label,
  description,
  addLabel,
  emptyItem,
  removeLabel,
  children,
  max,
}: RepeatableFieldProps<T, N>) {
  const { fields, append, remove } = useFieldArray({ control, name });

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-medium">{label}</legend>
      {description ? (
        <p className="text-[0.8rem] text-muted-foreground">{description}</p>
      ) : null}
      {fields.map((item, index) => (
        <div
          key={item.id}
          className="flex items-start gap-2 rounded-lg border bg-muted/20 p-3"
        >
          <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
            {children(index)}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => remove(index)}
            aria-label={removeLabel(index)}
          >
            <Trash2 aria-hidden />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        disabled={max !== undefined && fields.length >= max}
        onClick={() => append(emptyItem)}
      >
        <Plus data-icon="inline-start" aria-hidden />
        {addLabel}
      </Button>
    </fieldset>
  );
}
