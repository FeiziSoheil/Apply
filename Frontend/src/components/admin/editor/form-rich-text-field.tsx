"use client";

import type { Control, FieldPath, FieldValues } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RichTextEditor } from "./rich-text-editor";

/**
 * react-hook-form binding of `RichTextEditor`. Kept apart from the other form
 * controls so only forms that use it bundle Tiptap.
 */
type FormRichTextFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  description?: string;
  disabled?: boolean;
  className?: string;
};

export function FormRichTextField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled,
  className,
}: FormRichTextFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <RichTextEditor
              value={typeof field.value === "string" ? field.value : ""}
              onChange={field.onChange}
              aria-label={label}
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

