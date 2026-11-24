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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type MultiCheckboxOption = {
  value: string;
  label: string;
  hint?: string;
};

type FormMultiCheckboxFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  options: readonly MultiCheckboxOption[];
  description?: string;
  disabled?: boolean;
  className?: string;
  max?: number;
};

export function FormMultiCheckboxField<T extends FieldValues>({
  control,
  name,
  label,
  options,
  description,
  disabled,
  className,
  max,
}: FormMultiCheckboxFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const selected: string[] = Array.isArray(field.value)
          ? field.value
          : [];

        function toggle(value: string, checked: boolean) {
          if (checked) {
            if (max !== undefined && selected.length >= max) return;
            field.onChange([...selected, value]);
            return;
          }
          field.onChange(selected.filter((item) => item !== value));
        }

        return (
          <FormItem className={className}>
            <FormLabel>{label}</FormLabel>
            {description ? (
              <FormDescription>{description}</FormDescription>
            ) : null}
            <div className="grid gap-2 sm:grid-cols-2">
              {options.map((option) => {
                const isChecked = selected.includes(option.value);
                const atMax =
                  max !== undefined && selected.length >= max && !isChecked;

                return (
                  <Label
                    key={option.value}
                    htmlFor={`${String(name)}-${option.value}`}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 font-normal",
                      isChecked && "border-primary bg-muted/40",
                      (disabled || atMax) && "opacity-60",
                    )}
                  >
                    <FormControl>
                      <Checkbox
                        id={`${String(name)}-${option.value}`}
                        checked={isChecked}
                        disabled={disabled || atMax}
                        onCheckedChange={(checked) =>
                          toggle(option.value, checked === true)
                        }
                      />
                    </FormControl>
                    <span className="flex flex-col gap-0.5">
                      <span className="text-sm text-foreground">
                        {option.label}
                      </span>
                      {option.hint ? (
                        <span className="text-xs text-muted-foreground">
                          {option.hint}
                        </span>
                      ) : null}
                    </span>
                  </Label>
                );
              })}
            </div>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
