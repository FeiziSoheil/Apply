import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type LegalProseProps = {
  children: ReactNode;
  className?: string;
};

/** Readable long-form content without external typography plugin */
export function LegalProse({ children, className }: LegalProseProps) {
  return (
    <div
      className={cn(
        "max-w-3xl space-y-4 text-sm leading-7 text-muted-foreground sm:text-base",
        "[&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground",
        "[&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground",
        "[&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:ps-5",
        "[&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:ps-5",
        "[&_strong]:font-semibold [&_strong]:text-foreground",
        "[&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline",
        className,
      )}
    >
      {children}
    </div>
  );
}
