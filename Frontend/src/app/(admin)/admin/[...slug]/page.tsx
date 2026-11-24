import type { Metadata } from "next";
import { sectionSlugs } from "@/components/panel/nav-config";
import { SectionCatchAll } from "@/components/panel/section-catch-all";
import { createPageMetadata } from "@/lib/seo";

type SectionPageProps = {
  params: Promise<{ slug: string[] }>;
};

export function generateStaticParams(): { slug: string[] }[] {
  return sectionSlugs("admin").map((slug) => ({ slug }));
}

/** Auth-gated catch-all: shell is validated via the layout, not this segment. */
export const instant = false;

/** Shared noIndex shell; section titles render in the page UI. */
export const metadata: Metadata = createPageMetadata({
  title: "مدیریت",
  description: "بخش‌های پنل مدیریت موسسه.",
  path: "/admin",
  noIndex: true,
});

/**
 * Placeholder of a section listed in the admin menu (`NAV_CONFIG.admin`);
 * a group landing path (e.g. `/admin/content`) redirects to its first item.
 * Anything else renders the area's `not-found.tsx`.
 */
export default function AdminSectionPage({ params }: SectionPageProps) {
  return <SectionCatchAll area="admin" params={params} />;
}
