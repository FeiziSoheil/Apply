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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type RadioOption = {
  value: string;
  label: string;
  description?: string;
};

type FormRadioFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  options: readonly RadioOption[];
  description?: string;
  disabled?: boolean;
  className?: string;
  orientation?: "vertical" | "horizontal";
};

export function FormRadioField<T extends FieldValues>({
  control,
  name,
  label,
  options,
  description,
  disabled,
  className,
  orientation = "vertical",
}: FormRadioFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <RadioGroup
              dir="rtl"
              disabled={disabled}
              value={field.value ?? ""}
              onValueChange={field.onChange}
              className={cn(
                orientation === "horizontal" &&
                  "grid grid-cols-1 gap-2 sm:grid-cols-2",
              )}
              aria-label={label}
            >
              {options.map((option) => (
                <Label
                  key={option.value}
                  htmlFor={`${String(name)}-${option.value}`}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 font-normal has-[[data-checked]]:border-primary has-[[data-checked]]:bg-muted/40"
                >
                  <RadioGroupItem
                    value={option.value}
                    id={`${String(name)}-${option.value}`}
                    className="mt-0.5"
                  />
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm text-foreground">
                      {option.label}
                    </span>
                    {option.description ? (
                      <span className="text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    ) : null}
                  </span>
                </Label>
              ))}
            </RadioGroup>
          </FormControl>
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
