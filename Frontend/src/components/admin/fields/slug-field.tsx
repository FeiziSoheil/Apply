"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  useFormContext,
  useWatch,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { isValidSlug, slugify } from "@/lib/slug";
import { cn } from "@/lib/utils";

export type SlugAvailabilityChecker = (args: {
  slug: string;
  excludeId?: string;
  signal?: AbortSignal;
}) => Promise<{ available: boolean }>;

type SlugFieldProps<T extends FieldValues> = {
  name: FieldPath<T>;
  /** Field whose value drives auto-suggested slug (e.g. nameFa / title) */
  titleName: FieldPath<T>;
  label?: string;
  description?: string;
  /** Current entity id when editing — excluded from uniqueness check */
  excludeId?: string;
  checkAvailability: SlugAvailabilityChecker;
  /** Debounce for the uniqueness request (ms) */
  debounceMs?: number;
  disabled?: boolean;
  className?: string;
};

type AvailabilityState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "available" }
  | { status: "taken" }
  | { status: "invalid" }
  | { status: "error"; message: string };

/**
 * ASCII kebab-case slug input with Persian→Latin auto-suggest from a title
 * field, manual override, and debounced uniqueness check against the API.
 */
export function SlugField<T extends FieldValues>({
  name,
  titleName,
  label = "اسلاگ (نشانی صفحه)",
  description = "فقط حروف کوچک انگلیسی، عدد و خط تیره. از عنوان پیشنهاد می‌شود؛ قابل ویرایش است.",
  excludeId,
  checkAvailability,
  debounceMs = 400,
  disabled,
  className,
}: SlugFieldProps<T>) {
  const { control, setValue, getFieldState, setError, clearErrors } =
    useFormContext<T>();
  const titleValue = useWatch({ control, name: titleName });
  const slugValue = useWatch({ control, name });
  const slug = typeof slugValue === "string" ? slugValue.trim() : "";

  const localValidity = useMemo((): AvailabilityState => {
    if (!slug) return { status: "idle" };
    if (!isValidSlug(slug)) return { status: "invalid" };
    return { status: "idle" };
  }, [slug]);

  const [remote, setRemote] = useState<{
    forSlug: string;
    state: AvailabilityState;
  }>({ forSlug: "", state: { status: "idle" } });
  /** Once the user types in the slug box, stop overwriting from the title */
  const manualRef = useRef(false);
  const lastSuggestedRef = useRef("");

  useEffect(() => {
    if (manualRef.current || disabled) return;
    const source = typeof titleValue === "string" ? titleValue : "";
    const next = slugify(source);
    if (!next || next === lastSuggestedRef.current) return;
    lastSuggestedRef.current = next;
    setValue(name, next as never, { shouldDirty: true, shouldValidate: true });
  }, [titleValue, disabled, name, setValue]);

  useEffect(() => {
    if (!slug || !isValidSlug(slug)) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setRemote({ forSlug: slug, state: { status: "checking" } });
      void checkAvailability({
        slug,
        excludeId,
        signal: controller.signal,
      })
        .then((result) => {
          if (controller.signal.aborted) return;
          if (result.available) {
            setRemote({ forSlug: slug, state: { status: "available" } });
            const state = getFieldState(name);
            if (state.error?.type === "slug-unique") {
              clearErrors(name);
            }
          } else {
            setRemote({ forSlug: slug, state: { status: "taken" } });
            setError(name, {
              type: "slug-unique",
              message: "این اسلاگ قبلاً استفاده شده است",
            });
          }
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          const message =
            error instanceof Error ? error.message : "بررسی اسلاگ ناموفق بود";
          setRemote({ forSlug: slug, state: { status: "error", message } });
        });
    }, debounceMs);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [
    slug,
    excludeId,
    checkAvailability,
    debounceMs,
    name,
    getFieldState,
    setError,
    clearErrors,
  ]);

  const availability: AvailabilityState = (() => {
    if (localValidity.status === "invalid") return localValidity;
    if (!slug || !isValidSlug(slug)) return { status: "idle" };
    if (remote.forSlug !== slug) return { status: "idle" };
    return remote.state;
  })();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="relative">
              <Input
                {...field}
                value={typeof field.value === "string" ? field.value : ""}
                dir="ltr"
                disabled={disabled}
                className="pe-9 font-mono text-sm"
                onChange={(event) => {
                  manualRef.current = true;
                  field.onChange(event.target.value);
                }}
                aria-describedby={`${String(name)}-slug-status`}
              />
              <span
                id={`${String(name)}-slug-status`}
                className="pointer-events-none absolute inset-y-0 end-2 flex items-center"
                aria-live="polite"
              >
                <AvailabilityIcon state={availability} />
              </span>
            </div>
          </FormControl>
          {description ? <FormDescription>{description}</FormDescription> : null}
          <AvailabilityHint state={availability} />
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function AvailabilityIcon({ state }: { state: AvailabilityState }) {
  switch (state.status) {
    case "checking":
      return (
        <Loader2
          className="size-4 animate-spin text-muted-foreground"
          aria-label="در حال بررسی"
        />
      );
    case "available":
      return (
        <CheckCircle2
          className="size-4 text-success"
          aria-label="اسلاگ آزاد است"
        />
      );
    case "taken":
    case "invalid":
    case "error":
      return (
        <XCircle
          className="size-4 text-destructive"
          aria-label="اسلاگ نامعتبر یا تکراری"
        />
      );
    default:
      return null;
  }
}

function AvailabilityHint({ state }: { state: AvailabilityState }) {
  if (state.status === "idle" || state.status === "checking") return null;
  const text =
    state.status === "available"
      ? "این اسلاگ آزاد است."
      : state.status === "taken"
        ? "این اسلاگ قبلاً استفاده شده است."
        : state.status === "invalid"
          ? "فرمت اسلاگ نامعتبر است."
          : state.message;
  return (
    <p
      className={cn(
        "text-[0.8rem]",
        state.status === "available" ? "text-success" : "text-destructive",
      )}
    >
      {text}
    </p>
  );
}
