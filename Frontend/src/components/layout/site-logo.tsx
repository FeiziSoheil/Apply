import Link from "next/link";
import { INSTITUTE } from "@/lib/constants";
import { cn } from "@/lib/utils";

type SiteLogoProps = {
  className?: string;
  compact?: boolean;
  /** `hero`: brand-first size for the auth pages (overrides `compact`) */
  size?: "default" | "compact" | "hero";
};

type SiteLogoMarkProps = {
  /** Size / radius of the tile, e.g. `size-8 rounded-lg` */
  className?: string;
  /** Size of the glyph inside the tile */
  iconClassName?: string;
};

/** The brand tile only (no text, no link) — also used by the panel sidebar */
export function SiteLogoMark({ className, iconClassName }: SiteLogoMarkProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center bg-primary text-primary-foreground",
        className,
      )}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 32 32"
        className={cn("size-5", iconClassName)}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M6 22V10l10-5 10 5v12l-10 5-10-5Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M16 13v9M11 16.5h10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export function SiteLogo({
  className,
  compact = false,
  size = compact ? "compact" : "default",
}: SiteLogoProps) {
  const hero = size === "hero";
  const small = size === "compact";
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2 rounded-lg text-foreground outline-none transition-opacity hover:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
      aria-label={`${INSTITUTE.name} — صفحه اصلی`}
    >
      <SiteLogoMark
        className={cn(
          hero ? "size-14 rounded-2xl shadow-sm" : "rounded-lg",
          small ? "size-8" : hero ? "" : "size-9",
        )}
        iconClassName={small ? "size-4" : hero ? "size-7" : "size-5"}
      />
      <span
        className={cn(
          "font-heading font-bold tracking-tight",
          small ? "text-base" : hero ? "text-3xl" : "text-lg",
        )}
      >
        {INSTITUTE.name}
      </span>
    </Link>
  );
}
