"use client";

import { useState } from "react";
import {
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type ComboboxOption = {
  value: string;
  label: string;
  /** Optional secondary line (e.g. country name) */
  description?: string;
};

type FormComboboxFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  options: readonly ComboboxOption[];
  description?: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  isLoading?: boolean;
};

/** Searchable single-select bound to react-hook-form */
export function FormComboboxField<T extends FieldValues>({
  control,
  name,
  label,
  options,
  description,
  disabled,
  className,
  placeholder = "انتخاب کنید…",
  searchPlaceholder = "جستجو…",
  emptyLabel = "موردی یافت نشد",
  isLoading = false,
}: FormComboboxFieldProps<T>) {
  const [open, setOpen] = useState(false);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const selected = options.find((option) => option.value === field.value);
        return (
          <FormItem className={className}>
            <FormLabel>{label}</FormLabel>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                      "w-full justify-between font-normal",
                      !selected && "text-muted-foreground",
                    )}
                  >
                    <span className="truncate">
                      {selected?.label ?? placeholder}
                    </span>
                    <ChevronsUpDown
                      data-icon="inline-end"
                      className="opacity-50"
                      aria-hidden
                    />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] p-0"
                align="start"
              >
                <Command>
                  <CommandInput placeholder={searchPlaceholder} />
                  <CommandList>
                    <CommandEmpty>
                      {isLoading ? "در حال بارگذاری…" : emptyLabel}
                    </CommandEmpty>
                    <CommandGroup>
                      {options.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={`${option.label} ${option.description ?? ""}`}
                          onSelect={() => {
                            field.onChange(option.value);
                            setOpen(false);
                          }}
                        >
                          <Check
                            aria-hidden
                            className={cn(
                              field.value !== option.value && "invisible",
                            )}
                          />
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate">{option.label}</span>
                            {option.description ? (
                              <span className="truncate text-xs text-muted-foreground">
                                {option.description}
                              </span>
                            ) : null}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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
