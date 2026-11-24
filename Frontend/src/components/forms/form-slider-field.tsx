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
import { Slider } from "@/components/ui/slider";
import { formatNumber } from "@/lib/format";

type FormSliderFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  min: number;
  max: number;
  step?: number;
  description?: string;
  disabled?: boolean;
  className?: string;
  formatValue?: (value: number) => string;
};

export function FormSliderField<T extends FieldValues>({
  control,
  name,
  label,
  min,
  max,
  step = 1000,
  description,
  disabled,
  className,
  formatValue = (value) => `${formatNumber(value)} یورو در سال`,
}: FormSliderFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const value =
          typeof field.value === "number" && !Number.isNaN(field.value)
            ? field.value
            : min;

        return (
          <FormItem className={className}>
            <div className="flex items-center justify-between gap-3">
              <FormLabel>{label}</FormLabel>
              <span className="text-sm font-medium text-foreground" dir="ltr">
                {formatValue(value)}
              </span>
            </div>
            <FormControl>
              <Slider
                min={min}
                max={max}
                step={step}
                disabled={disabled}
                value={[value]}
                onValueChange={(values) => field.onChange(values[0] ?? min)}
                aria-label={label}
              />
            </FormControl>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatNumber(min)}</span>
              <span>{formatNumber(max)}</span>
            </div>
            {description ? (
              <FormDescription>{description}</FormDescription>
            ) : null}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
