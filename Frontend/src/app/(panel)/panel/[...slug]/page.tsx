import type { Metadata } from "next";
import { sectionSlugs } from "@/components/panel/nav-config";
import { SectionCatchAll } from "@/components/panel/section-catch-all";
import { createPageMetadata } from "@/lib/seo";

type SectionPageProps = {
  params: Promise<{ slug: string[] }>;
};

export function generateStaticParams(): { slug: string[] }[] {
  return sectionSlugs("panel").map((slug) => ({ slug }));
}

/** Auth-gated catch-all: shell is validated via the layout, not this segment. */
export const instant = false;

/** Shared noIndex shell; section titles render in the page UI. */
export const metadata: Metadata = createPageMetadata({
  title: "پنل دانشجو",
  description: "بخش‌های پنل دانشجویی.",
  path: "/panel",
  noIndex: true,
});

/**
 * Placeholder of a section listed in the panel menu (`NAV_CONFIG.panel`);
 * a group landing path redirects to its first item.
 * Anything else renders the area's `not-found.tsx`.
 */
export default function PanelSectionPage({ params }: SectionPageProps) {
  return <SectionCatchAll area="panel" params={params} />;
}
