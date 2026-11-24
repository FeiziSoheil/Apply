"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

type FormPasswordFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  description?: string;
  autoComplete?: "current-password" | "new-password";
  disabled?: boolean;
  className?: string;
};

/** Password input with a show/hide toggle (always LTR, like emails) */
export function FormPasswordField<T extends FieldValues>({
  control,
  name,
  label = "رمز عبور",
  description,
  autoComplete = "current-password",
  disabled,
  className,
}: FormPasswordFieldProps<T>) {
  const [visible, setVisible] = useState(false);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <InputGroup>
            <FormControl>
              <InputGroupInput
                type={visible ? "text" : "password"}
                autoComplete={autoComplete}
                dir="ltr"
                disabled={disabled}
                className="text-start"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                disabled={disabled}
                aria-label={visible ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"}
                aria-pressed={visible}
                onClick={() => setVisible((prev) => !prev)}
              >
                {visible ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
