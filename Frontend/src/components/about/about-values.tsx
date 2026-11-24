import type { AboutValue } from "@/types";

type AboutValuesProps = {
  values: AboutValue[];
};

export function AboutValues({ values }: AboutValuesProps) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {values.map((value) => (
        <li
          key={value.id}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <h3 className="text-base font-semibold text-foreground">
            {value.title}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {value.description}
          </p>
        </li>
      ))}
    </ul>
  );
}
