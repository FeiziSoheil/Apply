import type { FieldErrors, FieldPath, FieldValues } from "react-hook-form";

/** One wizard step: id/title for the timeline, fields for per-step validation */
export type FormWizardStep<T extends FieldValues> = {
  id: string;
  title: string;
  fields: readonly FieldPath<T>[];
};

/** Flatten RHF error tree into dotted paths (e.g. `seo.metaTitle`) */
export function collectFormErrorPaths(errors: FieldErrors): string[] {
  const paths: string[] = [];

  function walk(node: FieldErrors, prefix = "") {
    for (const [key, value] of Object.entries(node)) {
      if (!value) continue;
      const path = prefix ? `${prefix}.${key}` : key;
      if (
        typeof value === "object" &&
        "message" in value &&
        typeof value.message === "string"
      ) {
        paths.push(path);
        continue;
      }
      if (typeof value === "object") {
        walk(value as FieldErrors, path);
      }
    }
  }

  walk(errors);
  return paths;
}

/** Earliest step that owns any of the given error paths */
export function formWizardStepIndexForErrors<T extends FieldValues>(
  steps: readonly FormWizardStep<T>[],
  errorPaths: readonly string[],
): number {
  for (let index = 0; index < steps.length; index += 1) {
    const step = steps[index];
    if (!step) continue;
    const ownsError = errorPaths.some((path) =>
      step.fields.some(
        (field) => path === field || path.startsWith(`${String(field)}.`),
      ),
    );
    if (ownsError) return index;
  }
  return 0;
}
