"use client";

import {
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import {
  SERVICE_ICON_OPTIONS,
  ServiceIcon,
  type ServiceIconKey,
} from "@/lib/icons";

type LucideIconPickerProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  description?: string;
  disabled?: boolean;
  className?: string;
};

/**
 * Allowed Lucide icon keys for services (whitelist from `SERVICE_ICON_OPTIONS`).
 */
export function LucideIconPickerField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled,
  className,
}: LucideIconPickerProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const current = String(field.value ?? "") as ServiceIconKey;
        return (
          <FormItem className={className}>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <div
                role="radiogroup"
                aria-label={label}
                className="grid grid-cols-2 gap-2 sm:grid-cols-3"
              >
                {SERVICE_ICON_OPTIONS.map((option) => {
                  const selected = current === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={disabled}
                      onClick={() => field.onChange(option.value)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-3 py-2 text-start text-sm transition-colors",
                        selected
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border bg-card text-muted-foreground hover:bg-muted",
                        disabled && "pointer-events-none opacity-50",
                      )}
                    >
                      <ServiceIcon name={option.value} className="size-4 shrink-0" />
                      <span className="truncate">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </FormControl>
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
