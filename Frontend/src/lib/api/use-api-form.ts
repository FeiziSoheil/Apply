"use client";

import { useCallback } from "react";
import {
  useForm,
  type FieldPath,
  type FieldValues,
  type UseFormProps,
  type UseFormReturn,
} from "react-hook-form";
import {
  DEFAULT_ERROR_MESSAGE,
  isApiError,
  type ApiFieldErrors,
} from "./errors";

export type HandleApiErrorOptions = {
  /**
   * Contract field path → form field name, for fields that are named
   * differently in the form (e.g. `{ startsAt: "timeSlot" }`).
   */
  fieldMap?: Readonly<Record<string, string>>;
  /**
   * Fields that really exist in the form. Server errors for any other field
   * are not shown inline but returned in `unmatched` so you can toast them.
   */
  knownFields?: readonly string[];
  /** Focus the first field that received a server error (default `true`) */
  focus?: boolean;
  /** Message used when the thrown value is not an `ApiError` */
  fallbackMessage?: string;
};

export type HandleApiErrorResult = {
  /** Number of fields that got an inline server error */
  applied: number;
  /** Form field names that got an inline server error (first one is focused) */
  appliedFields: string[];
  /** Server field errors that have no matching form field */
  unmatched: ApiFieldErrors;
  /** User-facing message of the error (Persian) */
  message: string;
};

/** Generic toast text when field errors were mapped inline */
export const FIELD_ERRORS_MESSAGE = "لطفاً خطاهای فرم را بررسی و اصلاح کنید.";

export type UseApiFormReturn<
  TFieldValues extends FieldValues,
  TContext,
  TTransformedValues,
> = {
  form: UseFormReturn<TFieldValues, TContext, TTransformedValues>;
  /**
   * Map a thrown `ApiError` onto the form: every `error.fields` entry becomes
   * a `setError` on the matching field (first message wins).
   */
  handleApiError: (
    error: unknown,
    options?: HandleApiErrorOptions,
  ) => HandleApiErrorResult;
};

/**
 * `useForm` + server-error mapping.
 *
 * ```ts
 * const { form, handleApiError } = useApiForm<Values>({ resolver: zodResolver(schema) });
 * mutation.mutate(payload, {
 *   onError: (error) => {
 *     const { applied, message } = handleApiError(error);
 *     toast.error(applied > 0 ? "لطفاً خطاهای فرم را اصلاح کنید" : message);
 *   },
 * });
 * ```
 */
export function useApiForm<
  TFieldValues extends FieldValues = FieldValues,
  TContext = unknown,
  TTransformedValues = TFieldValues,
>(
  props?: UseFormProps<TFieldValues, TContext, TTransformedValues>,
): UseApiFormReturn<TFieldValues, TContext, TTransformedValues> {
  const form = useForm<TFieldValues, TContext, TTransformedValues>(props);
  const { setError, setFocus } = form;

  const handleApiError = useCallback(
    (
      error: unknown,
      {
        fieldMap,
        knownFields,
        focus = true,
        fallbackMessage = DEFAULT_ERROR_MESSAGE,
      }: HandleApiErrorOptions = {},
    ): HandleApiErrorResult => {
      if (!isApiError(error)) {
        return { applied: 0, appliedFields: [], unmatched: {}, message: fallbackMessage };
      }

      const unmatched: ApiFieldErrors = {};
      const appliedFields: string[] = [];

      for (const [path, messages] of Object.entries(error.fields ?? {})) {
        const name = fieldMap?.[path] ?? path;
        const message = messages[0];
        if (!message) continue;
        if (knownFields && !knownFields.includes(name)) {
          unmatched[path] = messages;
          continue;
        }
        setError(name as FieldPath<TFieldValues>, {
          type: "server",
          message,
        });
        appliedFields.push(name);
      }

      const [firstField] = appliedFields;
      if (focus && firstField) {
        try {
          setFocus(firstField as FieldPath<TFieldValues>);
        } catch {
          // field is not registered (e.g. custom control) — error is still shown
        }
      }

      return {
        applied: appliedFields.length,
        appliedFields,
        unmatched,
        message: error.message || fallbackMessage,
      };
    },
    [setError, setFocus],
  );

  return { form, handleApiError };
}
