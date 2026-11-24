import type { FieldErrors, FieldValues, Path, UseFormSetFocus } from "react-hook-form";

/** Focus the first invalid field; falls back to aria-invalid query */
export function focusFirstError<T extends FieldValues>(
  errors: FieldErrors<T>,
  setFocus: UseFormSetFocus<T>,
): void {
  const first = findFirstErrorPath(errors);
  if (first) {
    try {
      setFocus(first as Path<T>);
      return;
    } catch {
      // fall through to DOM focus
    }
  }

  requestAnimationFrame(() => {
    const el = document.querySelector<HTMLElement>(
      "[aria-invalid='true'], [data-invalid='true']",
    );
    el?.focus();
  });
}

function findFirstErrorPath(errors: FieldErrors): string | undefined {
  for (const [key, value] of Object.entries(errors)) {
    if (!value) continue;
    if (typeof value === "object" && "message" in value && value.message) {
      return key;
    }
    if (typeof value === "object") {
      const nested = findFirstErrorPath(value as FieldErrors);
      if (nested) return `${key}.${nested}`;
    }
  }
  return undefined;
}
