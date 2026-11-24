import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/shared/container";

type SectionProps = ComponentProps<"section"> & {
  title?: string;
  subtitle?: string;
  /**
   * Wrap body in Container (default true). Set false for full-bleed children
   * when the parent already provides a Container, or when you wrap content
   * manually (e.g. homepage hero backdrop).
   */
  contained?: boolean;
  headerAction?: ReactNode;
  /**
   * Vertical padding. Use `"none"` when stacking sections inside a page
   * layout — `className="py-0"` does not clear responsive `sm:`/`md:` paddings.
   */
  padding?: "default" | "none";
};

export function Section({
  title,
  subtitle,
  contained = true,
  headerAction,
  padding = "default",
  className,
  children,
  ...props
}: SectionProps) {
  const dense = padding === "none";

  const header =
    title || subtitle || headerAction ? (
      <div
        className={cn(
          "flex flex-col gap-2",
          dense ? "mb-4 sm:mb-5" : "mb-8 sm:mb-10",
        )}
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          {title ? <h2 className="text-balance">{title}</h2> : null}
          {headerAction}
        </div>
        {subtitle ? (
          <p className="max-w-2xl text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
    ) : null;

  const body = (
    <>
      {header}
      {children}
    </>
  );

  return (
    <section
      data-slot="section"
      className={cn(
        !dense && "py-12 sm:py-16 md:py-20",
        className,
      )}
      {...props}
    >
      {contained ? <Container>{body}</Container> : body}
    </section>
  );
}
