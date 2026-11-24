import { isDemoBuild } from "@/lib/mock-safety";

/** Text of the banner shown on every page of a demo build */
export const DEMO_BANNER_TEXT = "نسخه نمایشی – داده‌ها آزمایشی هستند";

/**
 * Fixed banner of a demo build (`NEXT_PUBLIC_DEMO_BUILD=enabled`, see
 * `src/lib/mock-safety.ts`). Mounted once in the root layout, so it covers
 * every panel and form. Renders nothing otherwise.
 *
 * It sits at the bottom edge; `--demo-banner-height` (globals.css, non-zero
 * only when `<html data-demo-build>` is set) lets other fixed bottom elements
 * stay above it and keeps page content from being covered.
 */
export function DemoBanner() {
  if (!isDemoBuild()) return null;
  return (
    <div
      role="status"
      data-demo-banner
      className="fixed inset-x-0 bottom-0 z-[60] flex h-(--demo-banner-height) items-center justify-center border-t border-border bg-foreground px-4 text-center text-sm font-medium text-background"
    >
      {DEMO_BANNER_TEXT}
    </div>
  );
}
