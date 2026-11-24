import { ShieldCheck } from "lucide-react";
import type { AboutLicense } from "@/types";
import { TRUST_BADGES } from "@/lib/constants";

type AboutLicensesProps = {
  licenses: AboutLicense[];
};

export function AboutLicenses({ licenses }: AboutLicensesProps) {
  return (
    <div className="flex flex-col gap-6">
      <ul className="grid gap-4 sm:grid-cols-3">
        {licenses.map((license) => (
          <li
            key={license.id}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/40 p-5"
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="size-5" aria-hidden />
            </span>
            <h3 className="text-base font-semibold text-foreground">
              {license.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {license.description}
            </p>
          </li>
        ))}
      </ul>
      <ul className="flex flex-wrap gap-3">
        {TRUST_BADGES.map((badge) => (
          <li key={badge.title}>
            <a
              href={badge.href}
              className="inline-flex items-center rounded-lg border border-dashed border-border px-4 py-2 text-sm text-muted-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {badge.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
