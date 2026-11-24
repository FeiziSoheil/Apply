import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Content wrapper of every panel page: consistent padding, vertical rhythm
 * and a readable max width inside the shell's `<main>`.
 */
export function PageContainer({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      data-slot="page-container"
      className={cn(
        "mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 md:p-6",
        className,
      )}
      {...props}
    />
  );
}
